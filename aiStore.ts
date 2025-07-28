import { create } from 'zustand';
import { Message, DocumentOptions, CodeGenerationState } from '@/types';

interface AIStore {
  chatHistory: Message[];
  documentGeneration: {
    content: string;
    isGenerating: boolean;
    options: DocumentOptions;
  };
  codeGeneration: CodeGenerationState;
  apiKey: string | null;
  settings: {
    model: string;
    temperature: number;
    isDarkMode: boolean;
    animationsEnabled: boolean;
  };
  addMessage: (message: Message) => void;
  clearChatHistory: () => void;
  setDocumentContent: (content: string) => void;
  setDocumentGenerating: (isGenerating: boolean) => void;
  updateDocumentOptions: (options: Partial<DocumentOptions>) => void;
  setCodeContent: (code: string) => void;
  updateCodeOptions: (options: Partial<CodeGenerationState>) => void;
  setApiKey: (key: string | null) => void;
  updateSettings: (settings: Partial<AIStore['settings']>) => void;
}

export const useAIStore = create<AIStore>((set) => ({
  chatHistory: [],
  documentGeneration: {
    content: '',
    isGenerating: false,
    options: {
      style: 'formale',
      language: 'italiano',
      format: 'pdf',
      layout: 'standard'
    }
  },
  codeGeneration: {
    code: '',
    language: 'html',
    isGenerating: false,
    showCode: false
  },
  apiKey: null,
  settings: {
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    isDarkMode: false,
    animationsEnabled: true
  },
  addMessage: (message) => set((state) => ({
    chatHistory: [...state.chatHistory, message]
  })),
  clearChatHistory: () => set(() => ({ chatHistory: [] })),
  setDocumentContent: (content) => set((state) => ({
    documentGeneration: {
      ...state.documentGeneration,
      content
    }
  })),
  setDocumentGenerating: (isGenerating) => set((state) => ({
    documentGeneration: {
      ...state.documentGeneration,
      isGenerating
    }
  })),
  updateDocumentOptions: (options) => set((state) => ({
    documentGeneration: {
      ...state.documentGeneration,
      options: {
        ...state.documentGeneration.options,
        ...options
      }
    }
  })),
  setCodeContent: (code) => set((state) => ({
    codeGeneration: {
      ...state.codeGeneration,
      code
    }
  })),
  updateCodeOptions: (options) => set((state) => ({
    codeGeneration: {
      ...state.codeGeneration,
      ...options
    }
  })),
  setApiKey: (key) => set(() => ({ apiKey: key })),
  updateSettings: (settings) => set((state) => ({
    settings: {
      ...state.settings,
      ...settings
    }
  }))
}));
