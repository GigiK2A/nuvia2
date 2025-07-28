import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bot, SendIcon, User, Loader2 } from 'lucide-react';

// Interfaccia per i messaggi
interface Message {
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation per inviare il messaggio all'assistente
  const assistantMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest('POST', '/api/assistant', { prompt });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.response) {
        // Aggiungi la risposta dell'assistente ai messaggi
        setMessages(prev => [...prev, {
          role: 'bot',
          text: data.response,
          timestamp: new Date()
        }]);
      } else {
        toast({
          title: "Errore",
          description: data.message || "Errore nella risposta dell'assistente",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: `Impossibile comunicare con l'assistente: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
        variant: "destructive",
      });
    }
  });

  // Funzione per inviare il messaggio
  const sendMessage = () => {
    if (!input.trim()) return;

    // Aggiungi il messaggio dell'utente ai messaggi
    const userMessage = {
      role: 'user' as const,
      text: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Invia il messaggio all'API
    assistantMutation.mutate(input);
    
    // Pulisci l'input
    setInput('');
  };

  // Auto-scroll ai nuovi messaggi
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Gestione dell'invio con Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Messaggio di benvenuto all'avvio della pagina
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'bot',
        text: 'Ciao! Sono Nuvia, il tuo assistente personale. Posso aiutarti con il tuo calendario e altre informazioni. Prova a chiedermi "Che impegni ho oggi?" o "Quali eventi ho in programma questa settimana?"',
        timestamp: new Date()
      }]);
    }
  }, []);

  // Formatta la data dei messaggi
  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto p-4">
      <div className="border-b border-border bg-card px-4 py-3 sticky top-0 md:top-0 z-10">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Nuvia
        </h2>
      </div>

      {/* Area messaggi */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`rounded-full p-2 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {msg.role === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
              </div>
              <Card className={`mx-2 ${msg.role === 'user' ? 'bg-primary/10' : ''}`}>
                <CardContent className="p-3">
                  <div className="space-y-1">
                    <div className="text-sm whitespace-pre-line">
                      {msg.text}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTimestamp(msg.timestamp)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ))}
        {assistantMutation.isPending && (
          <div className="flex justify-start">
            <div className="flex items-start">
              <div className="rounded-full p-2 bg-muted">
                <Bot className="h-5 w-5" />
              </div>
              <Card className="mx-2">
                <CardContent className="p-3">
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm">Sto pensando...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Area input */}
      <div className="p-4 border-t border-border">
        <div className="flex space-x-2">
          <Input
            placeholder="Cosa vuoi chiedere alla tua segretaria personale? (es. 'Che impegni ho oggi?')"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={assistantMutation.isPending}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage} 
            disabled={!input.trim() || assistantMutation.isPending}
          >
            {assistantMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SendIcon className="h-4 w-4" />
            )}
            <span className="sr-only">Invia</span>
          </Button>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          Prova a chiedere "Che impegni ho oggi?", "Quali eventi ho domani?" o "Cosa ho in programma questa settimana?"
        </div>
      </div>
    </div>
  );
}