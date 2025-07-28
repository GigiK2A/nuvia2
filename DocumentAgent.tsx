import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Paperclip, Send, Bot, User, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  from: 'user' | 'ai';
  text: string;
  timestamp: string;
}

const DocumentAgent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState('📄 Il documento generato apparirà qui con formattazione professionale...');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{start: number, end: number} | null>(null);
  const [showEditButton, setShowEditButton] = useState(false);
  const [editingSelection, setEditingSelection] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Gestisce la selezione del testo nel preview
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setShowEditButton(false);
      return;
    }

    const selectedString = selection.toString().trim();
    if (selectedString.length > 0 && previewRef.current) {
      const range = selection.getRangeAt(0);
      const previewText = previewRef.current.innerText;
      
      // Trova la posizione del testo selezionato nel documento originale
      const startOffset = previewText.indexOf(selectedString);
      const endOffset = startOffset + selectedString.length;
      
      if (startOffset !== -1) {
        setSelectedText(selectedString);
        setSelectionRange({ start: startOffset, end: endOffset });
        setShowEditButton(true);
      }
    } else {
      setShowEditButton(false);
    }
  };

  // Modifica solo il testo selezionato
  const handleEditSelection = async () => {
    if (!selectedText || !selectionRange || editingSelection) return;
    
    setEditingSelection(true);
    const editPrompt = `Modifica solo questa parte del testo: "${selectedText}"\n\nContesto: La modifica richiesta è: ${input || 'migliorare il testo'}`;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      from: 'user',
      text: `✏️ Modifica selezione: "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"`,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: editPrompt,
          isPartialEdit: true,
          originalText: preview,
          selectedText: selectedText,
          selectionRange: selectionRange
        }),
      });

      if (!response.ok) {
        throw new Error(`Errore ${response.status}`);
      }

      const data = await response.json();
      
      // Sostituisci solo la parte selezionata nel documento
      const newPreview = preview.substring(0, selectionRange.start) + 
                        data.text + 
                        preview.substring(selectionRange.end);
      
      setPreview(newPreview);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        from: 'ai',
        text: `✅ Ho modificato la parte selezionata del documento.`,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages(prev => [...prev, aiMessage]);
      
      toast({
        title: "Modifica completata",
        description: "La parte selezionata è stata aggiornata.",
      });

    } catch (error) {
      console.error('Errore modifica selezione:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        from: 'ai',
        text: `❌ Errore nella modifica della selezione.`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setEditingSelection(false);
      setShowEditButton(false);
      setSelectedText('');
      setSelectionRange(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && !file.name.toLowerCase().endsWith('.docx')) {
      toast({
        title: "Formato non supportato",
        description: "Carica solo file PDF o DOCX.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsLoading(true);
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setUploadedFile(file.name);
        
        // Update preview with AI analysis if available
        if (data.content) {
          setPreview(data.content);
        } else {
          setPreview(`📎 File caricato: ${file.name}\n\nContenuto estratto dal documento pronto per l'elaborazione.`);
        }
        
        const fileMessage: Message = {
          id: Date.now().toString(),
          from: 'user',
          text: `📎 File caricato: ${file.name}`,
          timestamp: new Date().toLocaleTimeString(),
        };

        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          from: 'ai',
          text: data.content 
            ? `✅ Ho analizzato il documento "${file.name}" e generato un'anteprima. Dimmi cosa vuoi fare con questo documento: modificarlo, riassumerlo, tradurlo o altro?`
            : `✅ Ho elaborato il file "${file.name}". Dimmi cosa vuoi fare con questo documento.`,
          timestamp: new Date().toLocaleTimeString(),
        };

        setMessages(prev => [...prev, fileMessage, aiResponse]);
        
        toast({
          title: "File elaborato",
          description: `${file.name} è stato caricato e analizzato con successo.`,
        });
      } else {
        throw new Error('Errore nel caricamento del file');
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile caricare il file. Riprova.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Se c'è del testo selezionato, modifica solo quello
    if (selectedText && selectionRange) {
      handleEditSelection();
      return;
    }

    const userPrompt = input.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      from: 'user',
      text: userPrompt,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let requestData: any = {
        prompt: userPrompt
      };

      // Se c'è già un documento nel preview, invialo per le modifiche
      if (preview && preview !== '📄 Il documento generato apparirà qui con formattazione professionale...') {
        requestData.currentDocument = preview;
        requestData.isModification = true;
      }

      if (uploadedFile) {
        requestData.prompt = `Modifica il documento precedentemente caricato (${uploadedFile}) secondo questa richiesta: ${userPrompt}`;
      }

      const response = await fetch('/api/ai/document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Errore sconosciuto' }));
        throw new Error(errorData.error || `Errore ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.text) {
        throw new Error('Risposta vuota dal server');
      }

      // Check if this is fallback content due to service overload
      const messageText = data.fallback 
        ? `⚠️ ${data.message || 'Servizio AI temporaneamente sovraccarico'} - Ho preparato un template che puoi modificare.`
        : `✍️ Ho creato/aggiornato il documento in base alla tua richiesta.`;

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        from: 'ai',
        text: messageText,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setPreview(data.text);
      
      toast({
        title: data.fallback ? "Template generato" : "Documento generato",
        description: data.fallback 
          ? "Il servizio AI è sovraccarico. Usa il template come punto di partenza."
          : "Il documento è stato creato con successo.",
        variant: data.fallback ? "default" : "default"
      });

    } catch (error) {
      console.error('Errore generazione documento:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        from: 'ai',
        text: `❌ Si è verificato un errore: ${error instanceof Error ? error.message : 'Errore sconosciuto'}. Riprova con una richiesta diversa.`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Errore",
        description: "Impossibile elaborare la richiesta. Riprova.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const exportDocument = async (format: 'pdf' | 'word') => {
    if (!preview || preview === '📄 Il documento generato apparirà qui con formattazione professionale...') {
      toast({
        title: "Nessun documento da esportare",
        description: "Genera prima un documento per poterlo esportare.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: preview,
          format: format
        }),
      });

      if (!response.ok) {
        throw new Error(`Errore ${response.status}`);
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `document.${format === 'word' ? 'docx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download completato",
        description: `Il documento è stato scaricato in formato ${format === 'word' ? 'Word' : 'PDF'}.`,
      });

    } catch (error) {
      console.error('Errore export:', error);
      toast({
        title: "Errore export",
        description: "Impossibile esportare il documento. Riprova.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-screen bg-white pt-16">
      {/* Chat Panel */}
      <div className="w-1/2 border-r border-gray-200 flex flex-col bg-white">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-600" />
            Agente Documenti AI
          </h1>
          <p className="text-sm text-gray-500 mt-1">Crea, modifica e analizza documenti con l'intelligenza artificiale</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
              <div className="w-16 h-16 mb-4 rounded-full bg-blue-50 flex items-center justify-center">
                <Bot className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-sm">Inizia una conversazione per creare o modificare documenti</p>
              <p className="text-xs mt-2 text-gray-400">Puoi caricare un file PDF o DOCX per analizzarlo</p>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-3 ${message.from === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.from === 'ai' && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm shadow-sm ${
                    message.from === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <p className="whitespace-pre-wrap">{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      message.from === 'user' ? 'text-blue-200' : 'text-gray-500'
                    }`}>
                      {message.timestamp}
                    </p>
                  </div>

                  {message.from === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3 justify-start"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
              <div className="bg-gray-100 rounded-xl px-4 py-3 text-sm">
                <div className="flex items-center space-x-1">
                  <motion.div
                    className="w-2 h-2 bg-gray-400 rounded-full"
                    animate={{ y: [-2, 2, -2] }}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-gray-400 rounded-full"
                    animate={{ y: [-2, 2, -2] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-gray-400 rounded-full"
                    animate={{ y: [-2, 2, -2] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                  />
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="flex items-end gap-3">
            <label className="cursor-pointer text-gray-500 hover:text-gray-700 transition-colors">
              <Paperclip className="w-5 h-5" />
              <input 
                type="file" 
                className="hidden" 
                accept=".pdf,.docx" 
                onChange={handleFileUpload}
                disabled={isLoading}
              />
            </label>
            
            <div className="flex-1 relative">
              <textarea
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descrivi il documento che vuoi creare o modificare..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }}
                disabled={isLoading}
              />
            </div>
            
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              size="sm"
              className="h-11 px-4 bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          {uploadedFile && (
            <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
              <Paperclip className="w-3 h-3" />
              File allegato: {uploadedFile}
            </div>
          )}
        </div>
      </div>

      {/* Document Preview Panel */}
      <div className="w-1/2 flex flex-col bg-white">
        {/* Preview Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">📄 Anteprima Documento</h2>
            <p className="text-sm text-gray-500 mt-1">Il documento verrà aggiornato in tempo reale</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => exportDocument('pdf')}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              PDF
            </Button>
            <Button
              onClick={() => exportDocument('word')}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Word
            </Button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 p-6 overflow-y-auto relative">
          {/* Pulsante modifica selezione */}
          {showEditButton && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="absolute z-10 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-xl overflow-hidden"
              style={{
                top: '20px',
                right: '20px'
              }}
            >
              <div className="p-3">
                <p className="text-xs text-blue-100 mb-2">Testo selezionato:</p>
                <p className="text-sm font-medium mb-3 truncate max-w-xs">
                  "{selectedText.substring(0, 50)}{selectedText.length > 50 ? '...' : ''}"
                </p>
                <Button
                  onClick={handleEditSelection}
                  disabled={isLoading || editingSelection}
                  size="sm"
                  className="w-full bg-white text-blue-700 hover:bg-blue-50 font-medium"
                >
                  {editingSelection ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
                      Modificando...
                    </>
                  ) : (
                    <>✏️ Modifica selezione</>
                  )}
                </Button>
                <p className="text-xs text-blue-100 mt-2">
                  Scrivi nel campo sotto cosa vuoi modificare
                </p>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 min-h-full prose prose-sm max-w-none document-preview"
            style={{ 
              fontFamily: 'system-ui, -apple-system, sans-serif',
              lineHeight: '1.7',
              fontSize: '14px',
              userSelect: 'text',
              cursor: 'text'
            }}
            ref={previewRef}
            onMouseUp={handleTextSelection}
            onTouchEnd={handleTextSelection}
            onKeyUp={handleTextSelection}
          >
            <div 
              className="text-gray-800 document-content"
              dangerouslySetInnerHTML={{ 
                __html: preview
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/^## (.*$)/gm, '<h2 class="text-lg font-semibold mt-6 mb-3 text-gray-900">$1</h2>')
                  .replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold mt-8 mb-4 text-gray-900">$1</h1>')
                  .replace(/^### (.*$)/gm, '<h3 class="text-base font-medium mt-4 mb-2 text-gray-800">$1</h3>')
                  .replace(/\n\n/g, '</p><p class="mb-4">')
                  .replace(/^(?!<[h123]|<p)(.+)$/gm, '<p class="mb-4">$1</p>')
                  .replace(/- (.*$)/gm, '<li class="ml-4 mb-1">• $1</li>')
                  .replace(/\n/g, '<br/>')
              }}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DocumentAgent;