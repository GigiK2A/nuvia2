import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Plus, Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface Chat {
  id: number;
  title: string;
  createdAt: string;
}

interface ChatHistoryProps {
  onSelectChat: (chatId: number) => void;
  currentChatId?: number;
  onNewChat: () => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ 
  onSelectChat, 
  currentChatId, 
  onNewChat 
}) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = async () => {
    try {
      const response = await fetch('/api/chats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setChats(data.data.chats || []);
      }
    } catch (error) {
      console.error('Errore caricamento chat:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy HH:mm', { locale: it });
    } catch {
      return 'Data non valida';
    }
  };

  const truncateTitle = (title: string, maxLength: number = 30) => {
    return title.length > maxLength ? title.slice(0, maxLength) + '...' : title;
  };

  if (loading) {
    return (
      <Card className="w-80 h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Cronologia Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-80 h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Cronologia Chat
          </div>
          <Button 
            onClick={onNewChat}
            size="sm"
            className="h-8 w-8 p-0"
            title="Nuova chat"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-200px)]">
          {chats.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nessuna conversazione</p>
              <p className="text-sm">Inizia una nuova chat per vedere la cronologia</p>
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {chats.map((chat) => (
                <Card 
                  key={chat.id}
                  className={`cursor-pointer transition-colors hover:bg-accent ${
                    currentChatId === chat.id ? 'border-primary bg-accent' : ''
                  }`}
                  onClick={() => onSelectChat(chat.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm mb-1 truncate">
                          {truncateTitle(chat.title)}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(chat.createdAt)}
                        </div>
                      </div>
                      {currentChatId === chat.id && (
                        <div className="ml-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ChatHistory;