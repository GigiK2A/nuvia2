import React from "react";
import { Message } from "@/types";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PaperClipIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

interface ChatInterfaceProps {
  messages: Message[];
  inputValue: string;
  setInputValue: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  placeholder?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  inputValue,
  setInputValue,
  handleSubmit,
  isLoading,
  messagesEndRef,
  placeholder = "Scrivi un messaggio...",
}) => {
  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { 
        addSuffix: false, 
        locale: it 
      });
    } catch (error) {
      return "";
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-4xl mx-auto w-full">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start ${
              message.role === "user" ? "flex-row-reverse space-x-reverse" : ""
            } space-x-3`}
          >
            <Avatar className={message.role === "assistant" ? "bg-gradient-to-r from-primary to-indigo-500" : "bg-muted"}>
              {message.role === "assistant" ? (
                <AvatarFallback className="text-white">AI</AvatarFallback>
              ) : (
                <AvatarFallback>U</AvatarFallback>
              )}
            </Avatar>
            <div
              className={`flex-1 ${
                message.role === "user" ? "flex flex-col items-end" : ""
              }`}
            >
              <div
                className={`p-3 inline-block max-w-[85%] rounded-2xl ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted rounded-bl-sm"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {message.role === "user" ? "Tu" : "AI Assistant"} • {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border bg-card p-4 sticky bottom-0">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <div className="flex-1 relative">
              <Textarea
                id="chat-input"
                value={inputValue}
                onChange={handleTextareaChange}
                placeholder={placeholder}
                className="min-h-10 resize-none pr-12"
                rows={1}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 bottom-2 text-muted-foreground hover:text-foreground"
                disabled={isLoading}
              >
                <PaperClipIcon className="h-5 w-5" />
              </Button>
            </div>
            <Button type="submit" disabled={isLoading || !inputValue.trim()}>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <PaperAirplaneIcon className="h-5 w-5" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ChatInterface;
