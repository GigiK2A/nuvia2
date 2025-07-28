import React from "react";
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const formatTime = (timestamp: Date) => {
    try {
      return formatDistanceToNow(timestamp, { 
        addSuffix: true, 
        locale: it 
      });
    } catch (error) {
      return "";
    }
  };

  const getUserInitials = () => "U";

  return (
    <div 
      className={`flex gap-3 py-2 px-3 animate-in fade-in-0 duration-150 ease-out ${
        message.role === "user" ? "justify-end" : "justify-start"
      }`}
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {message.role === "assistant" && (
        <div className="w-7 h-7 flex-shrink-0 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-sm">🧠</span>
        </div>
      )}
      
      <div className={`max-w-2xl ${message.role === "user" ? "order-2" : ""}`}>
        <div
          className={`rounded-2xl px-3 py-2 ${
            message.role === "user"
              ? "bg-gray-50 text-gray-900 ml-auto shadow-sm"
              : "bg-white text-gray-900 shadow-sm"
          }`}
        >
          {message.role === "assistant" ? (
            <div className="prose prose-sm max-w-none text-sm leading-relaxed text-gray-900">
              <ReactMarkdown
                rehypePlugins={[rehypeHighlight]}
                components={{
                  code: ({ className, children, ...props }: any) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match;
                    return isInline ? (
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                        {children}
                      </code>
                    ) : (
                      <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto my-2">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    );
                  },
                  ul: ({ children }) => (
                    <ul className="list-disc pl-4 space-y-1">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-4 space-y-1">{children}</ol>
                  ),
                  a: ({ href, children }) => (
                    <a 
                      href={href} 
                      className="text-blue-600 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-900">
              {message.content}
            </p>
          )}
        </div>
        
        <div className={`mt-1 text-xs text-gray-400 ${
          message.role === "user" ? "text-right" : "text-left"
        }`}>
          {formatTime(message.timestamp)}
        </div>
      </div>
      
      {message.role === "user" && (
        <div className="w-7 h-7 flex-shrink-0 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium order-1">
          {getUserInitials()}
        </div>
      )}
    </div>
  );
};

export default ChatMessage;