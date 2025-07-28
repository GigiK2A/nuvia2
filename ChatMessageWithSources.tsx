import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface Source {
  id: number;
  title: string;
  url: string;
}

interface ChatMessageWithSourcesProps {
  content: string;
  isAI?: boolean;
}

export function ChatMessageWithSources({ content, isAI = false }: ChatMessageWithSourcesProps) {
  const [showSources, setShowSources] = useState(false);
  
  // Prova a parsare il contenuto come JSON
  let response = content;
  let sources: Source[] = [];
  
  try {
    const parsed = JSON.parse(content);
    if (parsed.response && parsed.sources) {
      response = parsed.response;
      sources = parsed.sources;
    }
  } catch (e) {
    // Non è JSON, controlla se inizia con {"response": per debug
    if (content.startsWith('{"response":')) {
      console.log('Failed to parse JSON response:', content);
    }
    // Usa il contenuto così com'è
  }

  return (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-4`}>
      <div className={`max-w-[80%] p-3 rounded-lg ${
        isAI 
          ? 'bg-muted text-foreground' 
          : 'bg-primary text-primary-foreground'
      }`}>
        {/* Avatar per AI */}
        {isAI && (
          <div className="flex items-start space-x-2 mb-2">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              AI
            </div>
          </div>
        )}
        
        {/* Contenuto principale */}
        <div className="whitespace-pre-wrap">
          {response}
        </div>
        
        {/* Fonti se disponibili */}
        {sources.length > 0 && (
          <div className="mt-3 pt-2 border-t border-border/20">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSources(!showSources)}
              className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <span className="mr-1">
                {sources.length} {sources.length === 1 ? 'fonte' : 'fonti'}
              </span>
              {showSources ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
            
            {showSources && (
              <div className="mt-2 space-y-1">
                {sources.map((source) => (
                  <div key={source.id} className="flex items-center space-x-2 text-xs">
                    <span className="w-4 h-4 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-[10px] font-medium">
                      {source.id}
                    </span>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline truncate flex-1"
                    >
                      {source.title}
                    </a>
                    <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}