import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Plus, Globe, Paperclip } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
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
function MessageBubble({ message, from }: { message: string; from: "user" | "assistant" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`max-w-[70%] px-4 py-2 my-1 rounded-xl text-sm shadow-md whitespace-pre-wrap ${
        from === 'user'
          ? 'ml-auto bg-blue-50 text-blue-900 text-right'
          : 'mr-auto bg-gray-100 text-gray-800 text-left'
      }`}
    >
      {message}
    </motion.div>
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

const ChatPanel: React.FC = () => {
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

  return (
    <div className="flex h-screen flex-col">
      {/* HEADER - Centered Title */}
      <div className="border-b border-gray-200 py-4">
        <h1 className="text-center text-xl font-semibold text-gray-800">Chat Agente AI</h1>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2 relative">
        {messages.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-gray-500">
            <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-2xl opacity-50">🧠</span>
            </div>
            <p className="text-sm opacity-70">Inizia una conversazione e scopri cosa posso fare per te!</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble 
              key={message.id} 
              message={message.content} 
              from={message.role} 
            />
          ))
        )}

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

export default ChatPanel;