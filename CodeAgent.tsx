import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Code, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import CodeTabs, { type CodeTab } from '@/components/CodeTabs';

interface Message {
  id: string;
  from: 'user' | 'ai';
  text: string;
  timestamp: string;
}

let idCounter = 1;

const CodeAgent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [tabs, setTabs] = useState<CodeTab[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

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
      const response = await fetch('/api/ai/code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: userPrompt
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Create a new tab with the generated code
        const newTab: CodeTab = {
          id: idCounter++,
          title: `Codice #${idCounter - 1}`,
          code: data.text
        };

        setTabs(prev => [...prev, newTab]);
        
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          from: 'ai',
          text: `Codice generato con successo! Nuovo tab "${newTab.title}" creato.`,
          timestamp: new Date().toLocaleTimeString(),
        };

        setMessages(prev => [...prev, aiMessage]);
        
        toast({
          title: "Codice generato",
          description: "Il codice è stato generato con successo.",
        });

      } else {
        throw new Error('Errore nella generazione del codice');
      }
    } catch (error) {
      console.error('Errore generazione codice:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        from: 'ai',
        text: 'Si è verificato un errore durante la generazione del codice. Riprova.',
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Errore",
        description: "Impossibile generare il codice. Riprova.",
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

  return (
    <div className="flex h-screen bg-white pt-16">
      {/* Chat Panel */}
      <div className="w-1/2 flex flex-col bg-white border-r border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">Code Assistant AI</h1>
              <p className="text-sm text-gray-500">Genera codice di qualità con l'intelligenza artificiale</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="text-6xl mb-4">💻</div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">Inizia una conversazione</h3>
                <p className="text-sm">Descrivi il codice che vuoi generare</p>
                <div className="mt-4 text-xs space-y-1">
                  <p>Esempi:</p>
                  <p>"Crea un componente React con form"</p>
                  <p>"Scrivi una funzione JavaScript per validare email"</p>
                  <p>"Genera HTML per una landing page"</p>
                </div>
              </div>
            </div>
          )}

          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3 ${message.from === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${message.from === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.from === 'user' 
                      ? 'bg-blue-500' 
                      : 'bg-gray-100'
                  }`}>
                    {message.from === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  <div className={`rounded-2xl px-4 py-3 ${
                    message.from === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      message.from === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Bot className="w-4 h-4 text-gray-600" />
              </div>
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descrivi il codice che vuoi generare..."
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
        </div>
      </div>

      {/* Code Tabs Panel */}
      <div className="w-1/2 flex flex-col">
        <CodeTabs tabs={tabs} setTabs={setTabs} />
      </div>
    </div>
  );
};

export default CodeAgent;