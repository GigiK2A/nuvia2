import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Paperclip, Globe } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  isLoading, 
  disabled = false,
  placeholder = "Scrivi un messaggio..." 
}) => {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading || disabled) return;
    
    console.log(`📤 ChatInput: invio messaggio "${inputValue.trim()}"`);
    onSendMessage(inputValue.trim());
    setInputValue("");
  };

  const handleWebSearch = () => {
    if (!inputValue.trim()) return;
    console.log(`🌐 ChatInput: avvio ricerca web per "${inputValue.trim()}"`);
    const searchMessage = `cerca: ${inputValue.trim()}`;
    onSendMessage(searchMessage);
    setInputValue("");
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim()) handleSubmit(e);
    }
  };

  return (
    <div className="flex items-end gap-2 p-4">
      <div className="flex-1 relative">
        <Textarea
          value={inputValue}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-10 resize-none pr-20 border rounded-lg"
          rows={1}
          disabled={isLoading || disabled}
        />
        <div className="absolute right-2 bottom-2 flex gap-1">
          <Button
            type="button"
            onClick={handleWebSearch}
            disabled={isLoading || disabled || !inputValue.trim()}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            title="Ricerca web"
          >
            <Globe className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            disabled={isLoading || disabled}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Button 
        onClick={handleSubmit}
        disabled={isLoading || disabled || !inputValue.trim()}
        className="shrink-0 h-10"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

export default ChatInput;