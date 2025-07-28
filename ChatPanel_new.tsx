import React, { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Globe, Clock, Plus, MessageSquare, Send, Paperclip } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChatSession {
  id: number;
  title: string;
  created_at: string;
  message_count: number;
  first_message: string;
}

const ChatPanel: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [sources, setSources] = useState<{ title: string; link: string }[]>([]);
  const [fileContext, setFileContext] = useState<string>('');
  const [attachedFileName, setAttachedFileName] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const sendMessage = async (isWebSearch = false) => {
    if (!inputValue.trim()) return;

    let messageContent = inputValue.trim();
    
    // Aggiungi il contesto del file se presente
    if (fileContext) {
      messageContent = `Considera questo contenuto del file "${attachedFileName}":\n\n${fileContext}\n\nDomanda dell'utente: ${messageContent}`;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: inputValue.trim(), // Mostra solo il messaggio pulito nell'interfaccia
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      if (isWebSearch) {
        setIsBrowsing(true);
        
        const browseRes = await fetch('/api/chat/browse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: inputValue.trim() })
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

            const enhancedPrompt = `Usa queste fonti web aggiornate per rispondere alla domanda dell'utente:\n\n${webContext}\n\nDomanda originale: ${messageContent}`;
            
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
          body: JSON.stringify({ message: messageContent }),
        });

        if (response.ok) {
          const data = await response.json();
          setMessages(prev => [...prev, {
            id: `ai-${Date.now()}`,
            role: "assistant",
            content: data.response,
            timestamp: new Date().toISOString(),
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(false);
    }
  };

  return (
    <section className="flex-1 flex flex-col">
      {/* Header con controlli */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <h2 className="text-lg font-semibold">Chat Agente</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Cronologia
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setMessages([]);
              setSources([]);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuova Chat
          </Button>
        </div>
      </div>

      {/* Pannello cronologia orizzontale */}
      {showHistory && (
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 max-h-48 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Cronologia Chat ({history.length} conversazioni)
              </span>
            </div>
            
            {history.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {history.map((session) => (
                  <div 
                    key={session.id}
                    className="p-3 rounded-lg border cursor-pointer transition-colors hover:bg-white dark:hover:bg-gray-800 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {session.title}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {session.first_message}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{session.message_count} messaggi</span>
                      <span>{new Date(session.created_at).toLocaleDateString('it-IT')}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-gray-400 dark:text-gray-500 mb-2">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Nessuna conversazione trovata</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Area messaggi */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <span className="text-3xl">🧠</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Chat Agente AI</h3>
              <p className="text-gray-500 max-w-sm">Inizia una conversazione e scopri cosa posso fare per te!</p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.role === "user" ? "flex-row-reverse space-x-reverse" : ""
            }`}
          >
            <Avatar className={
              message.role === "assistant" 
                ? "w-8 h-8 bg-gray-100 border border-gray-200" 
                : "w-8 h-8 bg-blue-600"
            }>
              {message.role === "assistant" ? (
                <AvatarFallback className="text-gray-600 bg-transparent">🧠</AvatarFallback>
              ) : (
                <AvatarFallback className="text-white text-xs font-bold bg-blue-600">U</AvatarFallback>
              )}
            </Avatar>
            <div className={`flex-1 ${message.role === "user" ? "flex flex-col items-end" : ""}`}>
              <div
                className={`px-4 py-2 rounded-lg max-w-[85%] ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
              </div>
            </div>
          </div>
        ))}

        {isBrowsing && (
          <div className="flex items-center justify-center py-6">
            <div className="flex items-center gap-3 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
              <div className="animate-pulse">🔎</div>
              <span>Cercando informazioni aggiornate...</span>
            </div>
          </div>
        )}

        {isLoading && !isBrowsing && (
          <div className="flex justify-center py-6">
            <div className="flex items-center gap-3 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Elaborando...</span>
            </div>
          </div>
        )}

        {sources.length > 0 && (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mx-4">
            <div className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <span className="text-blue-500">📚</span>
              Fonti consultate:
            </div>
            <ul className="text-xs text-gray-600 space-y-2">
              {sources.map((src, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-gray-400 mt-1">•</span>
                  <a 
                    href={src.link} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-blue-600 hover:text-blue-800 hover:underline transition-colors flex-1"
                  >
                    {src.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area fissa in basso */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        {attachedFileName && (
          <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">{attachedFileName}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFileContext('');
                setAttachedFileName('');
              }}
              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
            >
              ×
            </Button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Scrivi un messaggio..."
              className="min-h-10 resize-none pr-24 border rounded-lg"
              rows={1}
              disabled={isLoading}
            />
            <div className="absolute right-2 bottom-2 flex gap-1">
              <Button
                type="button"
                onClick={() => sendMessage(true)}
                disabled={isLoading || !inputValue.trim()}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                title="Ricerca web"
              >
                <Globe className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                title="Carica file PDF"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.js,.py,.ts,.jsx,.tsx,.html,.css,.json,.md"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(file);
                  }
                }}
                className="hidden"
              />
            </div>
          </div>
          <Button 
            onClick={() => sendMessage(false)}
            disabled={isLoading || !inputValue.trim()}
            className="shrink-0 h-10"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ChatPanel;