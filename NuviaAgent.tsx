// File: components/NuviaAgent.tsx

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Brain, Loader2, User, Plus, Calendar, Edit3, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
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

interface NuviaAgentProps {
  userId: number;
  onBackToDashboard: () => void;
}

export default function NuviaAgent({ userId, onBackToDashboard }: NuviaAgentProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [memo, setMemo] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'calendar' | 'memo'>('chat');
  const { toast } = useToast();

  useEffect(() => {
    fetchProject();
    fetchMemo();
    fetchEvents();
  }, [userId]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/last/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
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

  const handleSend = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    try {
      const contextData = {
        activeProject: project?.name || 'Nessun progetto attivo',
        memo: memo || 'Nessuna memoria attiva',
        todayEvents: events.map(e => `${e.title} alle ${new Date(e.date).toLocaleTimeString()}`).join(', ') || 'Nessun evento oggi'
      };

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input,
          userId,
          context: {
            project: project,
            memo: memo
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResponse(data.response || data.reply || 'Risposta ricevuta');
        setInput('');
      } else {
        throw new Error('Failed to get AI response');
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile comunicare con l'assistente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMemoEdit = () => {
    setEditingMemo(memo);
    setShowMemoEdit(true);
  };

  const handleMemoSave = async () => {
    try {
      const response = await fetch(`/api/memory/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memo: editingMemo }),
      });

      if (response.ok) {
        setMemo(editingMemo);
        setShowMemoEdit(false);
        toast({
          title: "Memoria aggiornata",
          description: "La tua memoria personale è stata salvata con successo",
        });
      } else {
        throw new Error('Failed to save memo');
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile salvare la memoria",
        variant: "destructive",
      });
    }
  };

  const handleEventCreate = async () => {
    try {
      if (!newEvent.title || !newEvent.date || !newEvent.time) {
        toast({
          title: "Errore",
          description: "Inserisci titolo, data e orario per l'evento",
          variant: "destructive",
        });
        return;
      }

      const startTime = new Date(`${newEvent.date}T${newEvent.time}`).toISOString();
      const endTime = new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString(); // 1 hour duration

      const response = await fetch(`/api/calendar/${userId}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: newEvent.title,
          description: newEvent.description,
          startTime,
          endTime,
        }),
      });

      if (response.ok) {
        setNewEvent({ title: '', description: '', date: '', time: '' });
        setShowEventCreate(false);
        fetchEvents(); // Refresh events
        toast({
          title: "Evento creato",
          description: "L'evento è stato aggiunto al tuo calendario",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create event');
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile creare l'evento",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-800">👋 Ciao! Sono Nuvia</h1>
            <p className="text-gray-600">Il tuo assistente personale intelligente</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={onBackToDashboard}
            className="hover:bg-white"
          >
            <User className="w-5 h-5" />
          </Button>
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
              <h3 className="font-semibold text-sm text-gray-700 mb-2 flex items-center">
                <Edit3 className="w-4 h-4 mr-2" />
                Memoria
              </h3>
              {memo ? (
                <p className="text-sm text-gray-600 line-clamp-3">{memo}</p>
              ) : (
                <p className="text-gray-500 text-sm">Nessuna memoria attiva</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm text-gray-700 mb-2 flex items-center">
                <CalendarDays className="w-4 h-4 mr-2" />
                Oggi
              </h3>
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

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <Button
                  variant={activeTab === 'chat' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('chat')}
                  className="flex-1"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat AI
                </Button>
                <Button
                  variant={activeTab === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('calendar')}
                  className="flex-1"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Calendario
                </Button>
                <Button
                  variant={activeTab === 'memo' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('memo')}
                  className="flex-1"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Note
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Chat Tab */}
              {activeTab === 'chat' && (
                <div className="space-y-4">
                  {response && (
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Brain className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{response}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Chiedi a Nuvia qualsiasi cosa..."
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
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
                </div>
              )}

              {/* Calendar Tab */}
              {activeTab === 'calendar' && (
                <div className="space-y-4">
                  <NuviaCalendarEmbed userEmail="user@example.com" userId={userId} />
                </div>
              )}

              {/* Memo Tab */}
              {activeTab === 'memo' && (
                <div className="space-y-4">
                  <NuviaMemoForm userId={userId} />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}