import { useState, useRef, useEffect } from "react";
import ChatMessage from "@/components/chat/ChatMessage";
import { ChatMessageWithSources } from "@/components/ChatMessageWithSources";
import ChatInput from "@/components/chat/ChatInput";
import { FileUpload } from "@/components/chat/FileUpload";
import { useAgent } from "@/lib/hooks/useAgent";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, MessageSquare, Plus, Clock, Trash2, Search, Globe, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: number;
  title: string;
  created_at: string;
  message_count: number;
  first_message: string;
}

const ChatAgent = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [aiRole, setAiRole] = useState('default');
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [sources, setSources] = useState<{ title: string; link: string }[]>([]);
  const [fileContext, setFileContext] = useState<string>('');
  const [attachedFileName, setAttachedFileName] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isConnected } = useAgent();
  const { toast } = useToast();

  // Simula l'ID utente (in una app reale verrebbe dal sistema di auth)
  const userId = "user_1";

  // Funzione per caricare la cronologia delle chat
  const fetchChatHistory = async (userId: string) => {
    try {
      const response = await apiRequest('GET', `/api/chat/sessions/${userId}`);
      const data = await response.json();
      setHistory(data.sessions || []);
      console.log(`📚 Caricata cronologia: ${data.sessions?.length || 0} sessioni`);
    } catch (error) {
      console.error('Errore caricamento cronologia:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare la cronologia chat",
        variant: "destructive",
      });
    }
  };

  // Funzione per caricare i messaggi di una sessione specifica
  const loadSessionMessages = async (sessionId: number) => {
    try {
      const response = await apiRequest('GET', `/api/chat/sessions/${sessionId}/messages`);
      const data = await response.json();
      
      if (data.messages) {
        const formattedMessages = data.messages.map((msg: any) => ({
          id: `msg-${msg.id}`,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
        }));
        
        setMessages(formattedMessages);
        setCurrentSessionId(sessionId);
        setSelectedSessionId(sessionId);
        
        console.log(`💬 Caricata sessione ${sessionId} con ${formattedMessages.length} messaggi`);
        
        toast({
          title: "Conversazione caricata",
          description: `${formattedMessages.length} messaggi ripristinati`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Errore caricamento sessione:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare la conversazione",
        variant: "destructive",
      });
    }
  };

  // Funzione per iniziare una nuova conversazione
  const startNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setSelectedSessionId(null);
    setFileContext('');
    setAttachedFileName('');
    console.log("🆕 Nuova conversazione iniziata");
  };

  // Funzione per salvare messaggi nel database
  const saveMessage = async ({
    userId,
    message,
    role,
    title,
  }: {
    userId: string;
    message: string;
    role: 'user' | 'assistant';
    title?: string;
  }) => {
    try {
      const response = await apiRequest('POST', '/api/chat/save', {
        user_id: userId,
        session_id: currentSessionId,
        message,
        role,
        title,
      });

      const data = await response.json();
      
      // Se non abbiamo ancora un sessionId e ne riceviamo uno, salvalo
      if (!currentSessionId && data.session_id) {
        setCurrentSessionId(data.session_id);
        console.log(`📝 Nuova sessione creata: ${data.session_id}`);
        // Ricarica la cronologia per mostrare la nuova sessione
        fetchChatHistory(userId);
      }
      
      return data;
    } catch (error) {
      console.error('Errore salvataggio messaggio:', error);
      toast({
        title: "Avviso",
        description: "Messaggio non salvato nel database",
        variant: "default",
      });
    }
  };

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      console.log(`🚀 MUTATION CHIAMATA: "${message}"`);
      alert(`DEBUG: chatMutation chiamata con: "${message}"`);
      
      // Salva il messaggio utente nel database
      await saveMessage({
        userId,
        message,
        role: 'user',
        title: currentSessionId ? undefined : 'Chat con Assistente AI',
      });

      // SEMPRE esegui ricerca web
      let enhancedMessage = message;
      let webContext = '';
      
      console.log(`🌐 Inizio ricerca web per: "${message}"`);
      setIsBrowsing(true);
      
      try {
        const browseRes = await fetch('/api/chat/browse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: message })
        });
        
        if (browseRes.ok) {
          const data = await browseRes.json();
          console.log(`🔍 Ricerca completata, trovati ${data.results?.length || 0} risultati`);
          
          // Salva le fonti consultate
          setSources(data.results?.map((r: any) => ({ 
            title: r.title, 
            link: r.link 
          })) || []);
          
          if (data.results?.length) {
            webContext = data.results
              .map((r: any, i: number) => `📌 Fonte ${i + 1}: ${r.title}\n${r.content}`)
              .join('\n\n')
              .slice(0, 3000);

            enhancedMessage = `Usa queste fonti web aggiornate per rispondere alla domanda dell'utente:\n\n${webContext}\n\nDomanda originale: ${message}`;
            console.log(`✅ Messaggio arricchito con contesto web`);
          }
        }
      } catch (error) {
        console.error('Errore durante la ricerca web:', error);
      } finally {
        setIsBrowsing(false);
      }

      const response = await apiRequest(
        "POST", 
        "/api/chat", 
        { 
          message: enhancedMessage, 
          aiRole,
          history: messages.map(m => ({ role: m.role, content: m.content })) 
        }
      );
      return response.json();
    },
    onSuccess: async (data) => {
      if (data.response) {
        // Create content with sources if available
        let content = data.response;
        if (data.sources && data.sources.length > 0) {
          content = JSON.stringify({
            response: data.response,
            sources: data.sources
          });
        }

        // Salva la risposta dell'assistente nel database
        await saveMessage({
          userId,
          message: data.response, // Save only the text response to DB
          role: 'assistant',
        });

        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: "assistant",
            content: content, // Use the structured content for display
            timestamp: new Date(),
          },
        ]);
      }
    },
  });

  // Mutation per eliminare una sessione di chat
  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await apiRequest('DELETE', `/api/chat/sessions/${sessionId}`);
      return response.json();
    },
    onSuccess: () => {
      // Ricarica la cronologia dopo l'eliminazione
      fetchChatHistory(userId);
      toast({
        title: "Successo",
        description: "Conversazione eliminata",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Errore eliminazione sessione:', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare la conversazione",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    // Controlla se è una ricerca web esplicita (inizia con "cerca:")
    const isWebSearch = content.startsWith('cerca:');
    const actualContent = isWebSearch ? content.replace('cerca:', '').trim() : content;
    
    // Add user message (mostra il contenuto senza il prefisso "cerca:")
    const newMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: actualContent,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, newMessage]);
    
    let fullPrompt = actualContent;
    let webContext = '';
    
    // Aggiungi il contesto del file se presente
    if (fileContext) {
      fullPrompt = `Considera questo contenuto del file "${attachedFileName}":\n\n${fileContext}\n\nDomanda dell'utente: ${actualContent}`;
    }

    // Esegui ricerca web solo se richiesta esplicitamente
    if (isWebSearch) {
      console.log(`🌐 Ricerca web esplicita per: "${actualContent}"`);
      setIsBrowsing(true);
      
      try {
        // Effettua la ricerca web
        const browseRes = await fetch('/api/chat/browse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: actualContent })
        });
        
        if (browseRes.ok) {
          const data = await browseRes.json();
          console.log(`🔍 Ricerca completata, trovati ${data.results?.length || 0} risultati`);
          
          // Salva le fonti consultate
          setSources(data.results?.map((r: any) => ({ 
            title: r.title, 
            link: r.link 
          })) || []);
          
          if (data.results?.length) {
            webContext = data.results
              .map((r: any, i: number) => `📌 Fonte ${i + 1}: ${r.title}\n${r.content}`)
              .join('\n\n')
              .slice(0, 3000);

            fullPrompt = `Usa queste fonti web aggiornate per rispondere alla domanda dell'utente:\n\n${webContext}\n\nDomanda originale: ${actualContent}`;
            console.log(`✅ Messaggio arricchito con contesto web`);
          }
        }
      } catch (error) {
        console.error('Errore durante la ricerca web:', error);
      } finally {
        setIsBrowsing(false);
      }
    } else {
      // Per messaggi normali, resetta le fonti precedenti
      setSources([]);
    }
    
    // Send to API con il prompt (potenziato se è una ricerca web)
    chatMutation.mutate(fullPrompt);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Carica la cronologia quando il componente viene montato
  useEffect(() => {
    fetchChatHistory(userId);
  }, [userId]);

  return (
    <section className="flex-1 flex flex-col">
      {/* Header con titolo e controlli */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 md:top-0 z-10">
        <h2 className="text-lg font-semibold">Chat Agente</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSidebar(!showSidebar)}
            className="flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Cronologia
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={startNewChat}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuova Chat
          </Button>
        </div>
      </div>

      {/* Pannello cronologia orizzontale (in alto) */}
      {showSidebar && (
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
                    className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-white dark:hover:bg-gray-800 ${
                      selectedSessionId === session.id 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800'
                    }`}
                    onClick={() => loadSessionMessages(session.id)}
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSessionMutation.mutate(session.id);
                        }}
                        className="ml-2 h-6 w-6 p-0 opacity-60 hover:opacity-100"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
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

      <div className="flex flex-1 overflow-hidden">
        {/* Area messaggi principale - ora occupa tutto lo spazio */}
        <div className="flex-1 flex flex-col">
          {/* Selettore del tono AI */}
          <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
            <div className="w-full px-4">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  🧠 Tono dell'AI:
                </label>
                <select
                  value={aiRole}
                  onChange={(e) => setAiRole(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="default">💬 Standard</option>
                  <option value="formal">🎩 Formale</option>
                  <option value="technical">🔧 Tecnico</option>
                  <option value="friendly">😊 Amichevole</option>
                  <option value="manager">📊 Project Manager</option>
                  <option value="creative">🎨 Creativo</option>
                  <option value="teacher">👨‍🏫 Insegnante</option>
                </select>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Cambia lo stile delle risposte AI
                </span>
              </div>
            </div>
          </div>

          <div 
            className="flex-1 overflow-y-auto px-6 py-8 pb-24 space-y-4 w-full"
            style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            {/* Chat completamente vuota all'inizio - nessun messaggio di benvenuto */}
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center opacity-30">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-2xl">🧠</span>
                  </div>
                  <p className="text-sm text-gray-400">Inizia una conversazione...</p>
                </div>
              </div>
            )}

            {/* Messaggi della chat con stile minimal */}
            {messages.map((message) => (
              <div 
                key={message.id}
                className="animate-in fade-in duration-150 ease-out"
              >
                <ChatMessageWithSources 
                  content={message.content}
                  isAI={message.role === "assistant"}
                />
              </div>
            ))}
            
            {/* Indicatore di ricerca web minimal */}
            {isBrowsing && (
              <div className="flex items-center justify-center py-6">
                <div className="flex items-center gap-3 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
                  <div className="animate-pulse">🔎</div>
                  <span>Cercando informazioni aggiornate...</span>
                </div>
              </div>
            )}
            
            {/* Loading indicator minimal */}
            {chatMutation.isPending && (
              <div className="flex justify-center py-6">
                <div className="flex items-center gap-3 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Elaborando...</span>
                </div>
              </div>
            )}
            
            {/* Fonti consultate con design minimal */}
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



          <div className="fixed bottom-0 left-16 right-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-0 z-50">
            <div className="w-full p-4">
              <FileUpload
                onFileParsed={(text, name) => {
                  setFileContext(text);
                  setAttachedFileName(name);
                  toast({
                    title: "File caricato",
                    description: `"${name}" è stato analizzato e allegato alla conversazione.`,
                  });
                }}
                isLoading={chatMutation.isPending}
                attachedFileName={attachedFileName}
                onClearFile={() => {
                  setFileContext('');
                  setAttachedFileName('');
                }}
                minimal={true}
              />
              <ChatInput 
                onSendMessage={handleSendMessage} 
                isLoading={chatMutation.isPending}
                disabled={chatMutation.isPending || !isConnected}
                placeholder="Scrivi un messaggio..."
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChatAgent;
