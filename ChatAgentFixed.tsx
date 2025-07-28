import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Plus, Globe, Paperclip, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: { title: string; link: string; }[];
}

// Typing Indicator Component
function TypingIndicator() {
  return (
    <motion.div
      className="flex items-center space-x-1 text-gray-400 px-4 py-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.span
        className="w-2 h-2 bg-gray-400 rounded-full"
        animate={{ y: [-2, 2, -2] }}
        transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }}
      />
      <motion.span
        className="w-2 h-2 bg-gray-400 rounded-full"
        animate={{ y: [-2, 2, -2] }}
        transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.1 }}
      />
      <motion.span
        className="w-2 h-2 bg-gray-400 rounded-full"
        animate={{ y: [-2, 2, -2] }}
        transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.2 }}
      />
    </motion.div>
  );
}

// Message Bubble Component
function MessageBubble({ 
  message, 
  from, 
  sources 
}: { 
  message: string; 
  from: "user" | "assistant";
  sources?: { title: string; link: string; }[];
}) {
  return (
    <div className={from === 'user' ? 'flex justify-end' : 'flex justify-start'}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-[70%]"
      >
        <div className={`px-4 py-3 my-2 rounded-xl text-sm whitespace-pre-wrap ${
          from === 'user'
            ? 'space-card text-foreground text-right'
            : 'hologram-effect text-foreground text-left'
        }`}>
          {message}
        </div>
        
        {/* Mostra le fonti solo per i messaggi dell'assistente che le hanno */}
        {from === 'assistant' && sources && sources.length > 0 && (
          <div className="mt-2 mb-3 px-4">
            <div className="text-xs text-gray-500 mb-1">📚 Fonti consultate:</div>
            <div className="space-y-1">
              {sources.map((source, index) => (
                <a
                  key={index}
                  href={source.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-blue-600 hover:text-blue-800 hover:underline"
                >
                  • {source.title}
                </a>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// Chat Input Component
function ChatInput({ 
  onSend, 
  onWebSearch, 
  onFileUpload, 
  isLoading, 
  attachedFileName,
  onRemoveFile 
}: {
  onSend: (message: string) => void;
  onWebSearch: (message: string) => void;
  onFileUpload: (file: File) => void;
  isLoading: boolean;
  attachedFileName: string;
  onRemoveFile: () => void;
}) {
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!message.trim() || isLoading) return;
    onSend(message.trim());
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <div className="p-4 border-t border-gray-200">
      {attachedFileName && (
        <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800">{attachedFileName}</span>
          </div>
          <button
            onClick={onRemoveFile}
            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}
      
      <div className="flex items-center px-4 py-3 bg-[#f7f7f8] border border-gray-200 rounded-xl shadow-sm">
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="mr-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
          disabled={isLoading}
        >
          <Plus className="w-5 h-5" />
        </button>
        
        <input
          type="text"
          placeholder="Scrivi un messaggio..."
          className="flex-1 bg-transparent outline-none text-sm text-gray-800"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        
        <button
          onClick={() => onWebSearch(message.trim())}
          className="mx-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
          disabled={isLoading || !message.trim()}
          title="Ricerca web"
        >
          <Globe className="w-5 h-5" />
        </button>
        
        <button
          onClick={handleSend}
          className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
          disabled={isLoading || !message.trim()}
        >
          <Send className="w-5 h-5" />
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.js,.py,.ts,.jsx,.tsx,.html,.css,.json,.md"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  );
}

const ChatAgentFixed: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [sources, setSources] = useState<{ title: string; link: string }[]>([]);
  const [fileContext, setFileContext] = useState<string>('');
  const [attachedFileName, setAttachedFileName] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        setFileContext(data.content || '');
        setAttachedFileName(file.name);
        toast({
          title: "File caricato",
          description: `${file.name} è stato analizzato e allegato alla conversazione.`,
        });
      } else {
        throw new Error('Errore nel caricamento del file');
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile caricare il file",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async (messageContent: string, isWebSearch = false) => {
    if (!messageContent.trim()) return;

    let finalContent = messageContent;
    
    if (fileContext) {
      finalContent = `Considera questo contenuto del file "${attachedFileName}":\n\n${fileContext}\n\nDomanda dell'utente: ${messageContent}`;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageContent,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      if (isWebSearch) {
        setIsBrowsing(true);
        
        const browseRes = await fetch('/api/chat/browse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: messageContent })
        });
        
        if (browseRes.ok) {
          const data = await browseRes.json();
          setSources(data.results?.map((r: any) => ({ 
            title: r.title, 
            link: r.link 
          })) || []);
          
          if (data.results?.length) {
            const webContext = data.results
              .map((r: any, i: number) => `📌 Fonte ${i + 1}: ${r.title}\n${r.content}`)
              .join('\n\n')
              .slice(0, 3000);

            const enhancedPrompt = `Usa queste fonti web aggiornate per rispondere alla domanda dell'utente:\n\n${webContext}\n\nDomanda originale: ${finalContent}`;
            
            const response = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: enhancedPrompt }),
            });

            if (response.ok) {
              const aiData = await response.json();
              setMessages(prev => [...prev, {
                id: `ai-${Date.now()}`,
                role: "assistant",
                content: aiData.response,
                timestamp: new Date().toISOString(),
              }]);
            }
          }
        }
        setIsBrowsing(false);
      } else {
        setSources([]);
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: finalContent }),
        });

        if (response.ok) {
          const data = await response.json();
          
          // Controlla se la risposta contiene fonti
          let aiContent = data.response;
          let responseSources: { title: string; link: string; }[] = [];
          
          try {
            // Prova a parsare la risposta come JSON (potrebbe contenere response e sources)
            const parsed = JSON.parse(data.response);
            if (parsed.response && parsed.sources) {
              aiContent = parsed.response;
              responseSources = parsed.sources.map((s: any) => ({
                title: s.title,
                link: s.url || s.link
              }));
            }
          } catch (e) {
            // Non è JSON, usa la risposta normale
          }
          
          setMessages(prev => [...prev, {
            id: `ai-${Date.now()}`,
            role: "assistant",
            content: aiContent,
            timestamp: new Date().toISOString(),
            sources: responseSources.length > 0 ? responseSources : undefined
          }]);
        }
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile ottenere risposta dall'assistente AI",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-white h-screen">
      {/* HEADER - Centered Title */}
        <div className="quantum-border py-4 relative">
          {/* Top-right buttons */}
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setMessages([]);
                setSources([]);
                setFileContext('');
                setAttachedFileName('');
              }}
              className="space-button flex items-center gap-2 px-3 py-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="space-button flex items-center gap-2 px-3 py-2 text-sm"
            >
              <Clock className="w-4 h-4" />
              History
            </Button>
          </div>
          
          <h1 className="text-center text-2xl font-bold stellar-text">Chat Agente AI</h1>
        </div>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto px-4 py-2 relative min-h-0">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center text-center py-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg">🧠</span>
                </div>
                <div>
                  <h3 className="text-base font-medium text-primary">Sistema AI Pronto</h3>
                  <p className="text-muted-foreground text-xs">Inizia una conversazione</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((message) => (
                <MessageBubble 
                  key={message.id} 
                  message={message.content} 
                  from={message.role}
                  sources={message.sources} 
                />
              ))}
            </div>
          )}
        </div>

      <AnimatePresence>
        {(isLoading && !isBrowsing) && <TypingIndicator />}
        {isBrowsing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-6"
          >
            <div className="flex items-center gap-3 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
              <div className="animate-pulse">🔎</div>
              <span>Cercando informazioni aggiornate...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>



        <div ref={messagesEndRef} />

        {/* CHAT INPUT */}
        <ChatInput
          onSend={(message) => sendMessage(message, false)}
          onWebSearch={(message) => sendMessage(message, true)}
          onFileUpload={handleFileUpload}
          isLoading={isLoading}
          attachedFileName={attachedFileName}
          onRemoveFile={() => {
            setFileContext('');
            setAttachedFileName('');
          }}
        />
      </div>
  );
};

export default ChatAgentFixed;