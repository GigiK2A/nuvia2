import { create } from 'zustand';

export interface CodeFile {
  name: string;
  language: string;
  content: string;
}

interface CodeState {
  files: CodeFile[];
  activeTab: string;
  setFiles: (files: CodeFile[]) => void;
  updateFile: (name: string, content: string) => void;
  setActiveTab: (tab: string) => void;
  addFile: (file: CodeFile) => void;
  removeFile: (name: string) => void;
  clearFiles: () => void;
}

// File predefiniti per un nuovo progetto
const defaultFiles: CodeFile[] = [
  {
    name: 'index.html',
    language: 'html',
    content: '<!DOCTYPE html>\n<html>\n  <head>\n    <title>Nuovo progetto</title>\n    <link rel="stylesheet" href="style.css">\n  </head>\n  <body>\n    <h1>Hello World</h1>\n    <script src="script.js"></script>\n  </body>\n</html>'
  },
  {
    name: 'style.css',
    language: 'css',
    content: 'body {\n  font-family: sans-serif;\n  background: #f7f7f7;\n  max-width: 800px;\n  margin: 0 auto;\n  padding: 20px;\n}\n\nh1 {\n  color: #333;\n}'
  },
  {
    name: 'script.js',
    language: 'javascript',
    content: '// Script principale\nconsole.log("Benvenuto nel progetto!");\n\ndocument.addEventListener("DOMContentLoaded", () => {\n  console.log("DOM caricato e pronto");\n});'
  }
];

export const useCodeStore = create<CodeState>((set) => ({
  files: [...defaultFiles],
  activeTab: 'index.html',
  
  setFiles: (files) => set({ files }),
  
  updateFile: (name, content) => set((state) => ({
    files: state.files.map((file) => 
      file.name === name ? { ...file, content } : file
    )
  })),
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  addFile: (file) => set((state) => ({
    files: [...state.files, file]
  })),
  
  removeFile: (name) => set((state) => ({
    files: state.files.filter((file) => file.name !== name),
    // Se stiamo rimuovendo il file attivo, cambia tab
    activeTab: state.activeTab === name 
      ? (state.files[0]?.name || '') 
      : state.activeTab
  })),
  
  clearFiles: () => set({ 
    files: [...defaultFiles],
    activeTab: 'index.html' 
  })
}));