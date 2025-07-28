import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Brain, Loader2, User, Edit3, MessageSquare, Calendar, Plus, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import NuviaMemoForm from './NuviaMemoForm';
import NuviaCalendarEmbed from './NuviaCalendarEmbed';

interface Project {
  id: string;
  name: string;
  type: string;
  memory?: string;
}

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  type: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  createdAt: string;
  projectId: string;
}

interface NuviaDashboardProps {
  userId: number;
  userEmail?: string;
  onBackToDashboard?: () => void;
}

export default function NuviaDashboard({ userId, userEmail = "user@example.com", onBackToDashboard }: NuviaDashboardProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [memo, setMemo] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [activeSection, setActiveSection] = useState<'memo' | 'calendar' | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const { toast } = useToast();
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchProject();
    fetchMemo();
    fetchEvents();
    fetchChatHistory();
  }, [userId, project?.id]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/last/${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.id) {
          setProject(data);
        } else {
          // Create default Nuvia project if none exists
          await createDefaultProject();
        }
      } else {
        // Create default Nuvia project if API call fails
        await createDefaultProject();
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      await createDefaultProject();
    }
  };

  const createDefaultProject = async () => {
    try {
      const defaultProject = {
        name: "Chat con Nuvia",
        type: "nuvia-chat",
        userId: userId,
        memory: "Progetto di chat con l'assistente personale Nuvia"
      };

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultProject)
      });

      if (response.ok) {
        const createdProject = await response.json();
        setProject(createdProject);
      }
    } catch (error) {
      console.error('Error creating default project:', error);
      // Set a temporary project to allow messaging
      setProject({
        id: `nuvia-${userId}-${Date.now()}`,
        name: "Chat con Nuvia",
        type: "nuvia-chat"
      });
    }
  };

  const fetchMemo = async () => {
    try {
      const response = await fetch(`/api/memory/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setMemo(data.memo || '');
      }
    } catch (error) {
      console.error('Error fetching memo:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch(`/api/calendar/${userId}/today`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchChatHistory = async () => {
    if (!project?.id) return;
    
    try {
      const response = await fetch(`/api/chat/history/${project.id}`);
      if (response.ok) {
        const data = await response.json();
        setChatHistory(data || []);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = {
      userId: userId,
      projectId: project?.id || 'nuvia-default',
      role: 'user' as const,
      content: input.trim()
    };

    // Add user message to chat history immediately
    setChatHistory(prev => [...prev, { 
      id: Date.now().toString(), 
      ...userMessage, 
      createdAt: new Date().toISOString() 
    }]);

    setLoading(true);
    const currentInput = input;
    setInput(''); // Clear input immediately

    try {
      // Save user message to database (only if project exists)
      if (project?.id) {
        await fetch(`/api/chat/history/${project.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userMessage)
        });
      }

      // Get AI response
      const contextData = {
        activeProject: project?.name || 'Nessun progetto attivo',
        memo: memo || 'Nessuna memoria attiva',
        todayEvents: events.length > 0 ? events.map(e => e.title).join(', ') : 'Nessun evento oggi'
      };

      const aiResponse = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentInput
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const aiContent = aiData.text || aiData.response || aiData.message || 'Risposta ricevuta';
        
        const aiMessage = {
          userId: userId,
          projectId: project?.id || 'nuvia-default',
          role: 'ai' as const,
          content: aiContent
        };

        // Add AI message to chat history
        setChatHistory(prev => [...prev, { 
          id: (Date.now() + 1).toString(), 
          ...aiMessage, 
          createdAt: new Date().toISOString() 
        }]);

        // Save AI message to database (only if project exists)
        if (project?.id) {
          await fetch(`/api/chat/history/${project.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(aiMessage)
          });
        }

        // Text-to-speech for AI response
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(aiContent);
          utterance.lang = 'it-IT';
          utterance.rate = 1;
          window.speechSynthesis.speak(utterance);
        }

        setResponse(aiContent);
      } else {
        const errorData = await aiResponse.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile inviare il messaggio a Nuvia",
        variant: "destructive",
      });
      // Restore input if there was an error
      setInput(currentInput);
    }
    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleExportProject = async () => {
    setExportLoading(true);
    try {
      const response = await fetch('/api/export-project', {
        method: 'GET',
        headers: {
          'Accept': 'application/zip, application/octet-stream',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Errore HTTP ${response.status}: ${errorText}`);
      }

      const blob = await response.blob();
      console.log('Esportazione - Blob ricevuto:', blob.size, 'bytes');
      
      if (blob.size === 0) {
        throw new Error('File ZIP ricevuto è vuoto');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'nuvia-project-export.zip';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      toast({
        title: "✅ Esportazione completata",
        description: "Il progetto Nuvia è stato esportato con successo",
      });
    } catch (error) {
      console.error('Errore esportazione:', error);
      toast({
        title: "❌ Errore",
        description: "Impossibile esportare il progetto. Riprova più tardi.",
        variant: "destructive",
      });
    }
    setExportLoading(false);
  };

  return (
    <div className="min-h-screen bg-white p-6 pt-16">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-800">👋 Ciao! Sono Nuvia</h1>
            <p className="text-gray-600">Il tuo assistente personale intelligente</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleExportProject}
              disabled={exportLoading}
              className="hover:bg-blue-50"
            >
              {exportLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Esportando...
                </>
              ) : (
                <>
                  📦 Esporta Progetto
                </>
              )}
            </Button>
            {onBackToDashboard && (
              <Button
                variant="outline"
                size="icon"
                onClick={onBackToDashboard}
                className="hover:bg-white"
              >
                <User className="w-5 h-5" />
              </Button>
            )}
          </div>
        </motion.div>

        {/* Context Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm text-gray-700 mb-2 flex items-center">
                <Brain className="w-4 h-4 mr-2" />
                Progetto Attivo
              </h3>
              {project ? (
                <div>
                  <p className="font-medium">{project.name}</p>
                  <p className="text-sm text-gray-600 capitalize">{project.type}</p>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Nessun progetto attivo</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm text-gray-700 flex items-center">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Memoria
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveSection(activeSection === 'memo' ? null : 'memo')}
                  className="h-6 w-6 p-0"
                >
                  <Edit3 className="w-3 h-3" />
                </Button>
              </div>
              {memo ? (
                <p className="text-sm text-gray-600 line-clamp-3">{memo}</p>
              ) : (
                <p className="text-gray-500 text-sm">Nessuna memoria attiva</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm text-gray-700 flex items-center">
                  <CalendarDays className="w-4 h-4 mr-2" />
                  Oggi
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveSection(activeSection === 'calendar' ? null : 'calendar')}
                  className="h-6 w-6 p-0"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              {events.length > 0 ? (
                <div className="space-y-1">
                  {events.slice(0, 2).map((event, index) => (
                    <p key={index} className="text-sm text-gray-600 truncate">{event.title}</p>
                  ))}
                  {events.length > 2 && (
                    <p className="text-xs text-gray-500">+{events.length - 2} altri eventi</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Nessun evento oggi</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Expandable Sections */}
        {activeSection === 'memo' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Edit3 className="w-5 h-5 mr-2" />
                  Gestione Note Personali
                </CardTitle>
              </CardHeader>
              <CardContent>
                <NuviaMemoForm userId={userId} />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeSection === 'calendar' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Calendario Google
                </CardTitle>
              </CardHeader>
              <CardContent>
                <NuviaCalendarEmbed userEmail={userEmail} userId={userId} />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Chat Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Chat con Nuvia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Chat History */}
              <div className="max-h-96 overflow-y-auto space-y-3 bg-gray-50 p-4 rounded-lg">
                {chatHistory.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">
                    Inizia una conversazione con Nuvia!
                  </p>
                ) : (
                  chatHistory.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'ai' && (
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Brain className="w-4 h-4 text-blue-600" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white ml-auto'
                            : 'bg-white border shadow-sm'
                        }`}
                      >
                        <div className="text-sm">
                          {message.role === 'ai' ? (
                            <ReactMarkdown
                              components={{
                                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                em: ({ children }) => <em className="italic">{children}</em>,
                                ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                                li: ({ children }) => <li className="mb-1">{children}</li>,
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          ) : (
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          )}
                        </div>
                        <p
                          className={`text-xs mt-1 ${
                            message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}
                        >
                          {new Date(message.createdAt).toLocaleTimeString('it-IT', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {message.role === 'user' && (
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                      )}
                    </div>
                  ))
                )}
                
                {/* Loading State */}
                {loading && (
                  <div className="flex items-start gap-3 justify-start">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Brain className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="bg-white border shadow-sm p-3 rounded-lg">
                      <p className="text-sm text-gray-500 italic flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Nuvia sta scrivendo...
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Scrivi a Nuvia... (premi Invio per inviare)"
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSend} 
                  disabled={loading || !input.trim()}
                  size="icon"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MessageSquare className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}