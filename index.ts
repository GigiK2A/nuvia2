export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface DocumentOptions {
  style: string;
  language: string;
  format?: "pdf" | "docx";
  layout?: "standard" | "compact";
}

export interface CodeGenerationState {
  code: string;
  language: string;
  isGenerating: boolean;
  showCode: boolean;
}

export interface AIResponse {
  response: string;
  timestamp: string;
}

export interface DocumentGenerationResponse extends AIResponse {
  content: string;
}

export interface CodeGenerationResponse extends AIResponse {
  code: string;
}

export interface ChatRequest {
  message: string;
  history: { role: string; content: string }[];
}

export interface DocumentGenerationRequest {
  prompt: string;
  options: DocumentOptions;
}

export interface CodeGenerationRequest {
  prompt: string;
  language: string;
  history: { role: string; content: string }[];
  currentCode?: string;
}

export interface ExportRequest {
  content: string;
  format: "pdf" | "docx";
  options: {
    layout: string;
    style: string;
  };
}
