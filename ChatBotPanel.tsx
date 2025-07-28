import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { Loader2 } from "lucide-react";

export default function ChatBotPanel() {
  const [messages, setMessages] = useState<Array<{
    type: 'user' | 'bot';
    content: string;
    timestamp: Date;
  }>>([
    {
      type: 'bot',
      content: 'Ciao! Sono il tuo assistente AI personale. Come posso aiutarti oggi?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, {
      type: 'user',
      content: input,
      timestamp: new Date()
    }]);
    
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input,
          history: messages.map(m => ({ 
            role: m.type === 'user' ? 'user' : 'assistant', 
            content: m.content 
          }))
        }),
      });

      const data = await res.json();
      
      // Add bot response
      setMessages(prev => [...prev, {
        type: 'bot',
        content: data.response,
        timestamp: new Date()
      }]);
    } catch (err) {
      // Handle error
      setMessages(prev => [...prev, {
        type: 'bot',
        content: 'Mi dispiace, si è verificato un errore nel processare la tua richiesta.',
        timestamp: new Date()
      }]);
    } finally {
      setInput('');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border bg-card px-4 py-3 flex items-center sticky top-0 md:top-0 z-10">
        <h2 className="text-lg font-semibold">Assistente AI</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start ${
              msg.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            } space-x-3`}
          >
            <Avatar className={msg.type === 'bot' ? "bg-gradient-to-r from-primary to-indigo-500" : "bg-muted"}>
              {msg.type === 'bot' ? (
                <AvatarFallback className="text-white">AI</AvatarFallback>
              ) : (
                <AvatarFallback>U</AvatarFallback>
              )}
            </Avatar>
            <div
              className={`flex-1 ${
                msg.type === 'user' ? "flex flex-col items-end" : ""
              }`}
            >
              <div
                className={`p-3 inline-block max-w-[85%] rounded-2xl ${
                  msg.type === 'user'
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted rounded-bl-sm"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {msg.type === 'user' ? "Tu" : "AI Assistant"} • {msg.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t border-border bg-card p-4 sticky bottom-0">
        <form onSubmit={sendMessage} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Scrivi un messaggio..."
              className="min-h-10 resize-none pr-12"
              rows={1}
              disabled={loading}
              onKeyDown={(e) => {
                // Submit on Enter (without Shift)
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim()) sendMessage(e);
                }
              }}
            />
          </div>
          <Button type="submit" disabled={loading || !input.trim()}>
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <PaperAirplaneIcon className="h-5 w-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}