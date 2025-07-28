import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { 
  Send, Loader2, MoreVertical, Download, Save, 
  X, Minimize2, Maximize2, Code, Eye
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface CodeFile {
  filename: string;
  content: string;
  language: string;
}

interface FloatingEditor {
  id: string;
  file: CodeFile;
  position: { x: number; y: number };
  zIndex: number;
  isMinimized: boolean;
}

const NewCodePanel: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [previewContent, setPreviewContent] = useState("");
  const [projectFiles, setProjectFiles] = useState<CodeFile[]>([]);
  const [floatingEditors, setFloatingEditors] = useState<FloatingEditor[]>([]);
  const [nextZIndex, setNextZIndex] = useState(1000);
  const [leftPanelWidth, setLeftPanelWidth] = useState(35); // Percentage - Più spazio per anteprima
  const [isDragging, setIsDragging] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Genera progetto iniziale
  const generateProjectMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await fetch('/api/code/generate-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          type: 'web-app'
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.files) {
        setProjectFiles(data.files);
        generatePreview(data.files);
        
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: `✨ Ho generato il progetto "${data.projectName || 'Nuovo Progetto'}" con ${data.files.length} file. Puoi vedere l'anteprima a destra e cliccare sui file per modificarli!`,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    },
    onError: () => {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "❌ Si è verificato un errore durante la generazione del progetto. Riprova con una descrizione diversa.",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    },
  });

  // Modifica codice esistente
  const modifyCodeMutation = useMutation({
    mutationFn: async (data: { prompt: string; currentFiles: CodeFile[] }) => {
      const response = await apiRequest('POST', '/api/code/modify', data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.modifiedFiles) {
        setProjectFiles(data.modifiedFiles);
        generatePreview(data.modifiedFiles);
        
        // Aggiorna gli editor aperti
        setFloatingEditors(prev => 
          prev.map(editor => {
            const updatedFile = data.modifiedFiles.find((f: CodeFile) => f.filename === editor.file.filename);
            return updatedFile ? { ...editor, file: updatedFile } : editor;
          })
        );
        
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: `🔄 Ho modificato il codice secondo le tue indicazioni. Le modifiche sono state applicate al progetto!`,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    },
  });

  // Genera anteprima HTML
  const generatePreview = (files: CodeFile[]) => {
    const htmlFile = files.find(f => f.filename.endsWith('.html'));
    const cssFiles = files.filter(f => f.filename.endsWith('.css'));
    const jsFiles = files.filter(f => f.filename.endsWith('.js'));

    if (htmlFile) {
      let preview = htmlFile.content;
      
      // Inietta CSS
      const cssContent = cssFiles.map(f => f.content).join('\n');
      if (cssContent) {
        preview = preview.replace('</head>', `<style>${cssContent}</style></head>`);
      }
      
      // Inietta JS
      const jsContent = jsFiles.map(f => f.content).join('\n');
      if (jsContent) {
        preview = preview.replace('</body>', `<script>${jsContent}</script></body>`);
      }
      
      setPreviewContent(preview);
    }
  };

  // Gestione chat
  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    if (projectFiles.length === 0) {
      // Prima generazione
      generateProjectMutation.mutate(inputValue);
    } else {
      // Modifica esistente
      modifyCodeMutation.mutate({
        prompt: inputValue,
        currentFiles: projectFiles
      });
    }
    
    setInputValue("");
  };

  // Apri editor galleggiante
  const openFloatingEditor = (file: CodeFile) => {
    const existingEditor = floatingEditors.find(e => e.file.filename === file.filename);
    if (existingEditor) {
      // Porta in primo piano
      setFloatingEditors(prev => 
        prev.map(e => 
          e.id === existingEditor.id 
            ? { ...e, zIndex: nextZIndex, isMinimized: false }
            : e
        )
      );
      setNextZIndex(prev => prev + 1);
      return;
    }

    const newEditor: FloatingEditor = {
      id: `editor-${Date.now()}`,
      file,
      position: { 
        x: 100 + floatingEditors.length * 30, 
        y: 100 + floatingEditors.length * 30 
      },
      zIndex: nextZIndex,
      isMinimized: false,
    };

    setFloatingEditors(prev => [...prev, newEditor]);
    setNextZIndex(prev => prev + 1);
  };

  // Chiudi editor
  const closeEditor = (editorId: string) => {
    setFloatingEditors(prev => prev.filter(e => e.id !== editorId));
  };

  // Minimizza/massimizza editor
  const toggleMinimize = (editorId: string) => {
    setFloatingEditors(prev => 
      prev.map(e => 
        e.id === editorId ? { ...e, isMinimized: !e.isMinimized } : e
      )
    );
  };

  // Aggiorna contenuto file
  const updateFileContent = (filename: string, content: string) => {
    setProjectFiles(prev => 
      prev.map(f => f.filename === filename ? { ...f, content } : f)
    );
    
    setFloatingEditors(prev => 
      prev.map(e => 
        e.file.filename === filename 
          ? { ...e, file: { ...e.file, content } }
          : e
      )
    );
    
    // Rigenera anteprima
    const updatedFiles = projectFiles.map(f => 
      f.filename === filename ? { ...f, content } : f
    );
    generatePreview(updatedFiles);
  };

  // Gestione resize pannelli
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const containerWidth = window.innerWidth;
    const newWidth = (e.clientX / containerWidth) * 100;
    setLeftPanelWidth(Math.min(Math.max(newWidth, 25), 75));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  // Salva progetto
  const saveProject = async () => {
    try {
      const response = await apiRequest('POST', '/api/code/save-project', {
        files: projectFiles,
        name: `Progetto-${Date.now()}`
      });
      
      toast({
        title: "Salvato ✅",
        description: "Il progetto è stato salvato con successo!",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile salvare il progetto.",
        variant: "destructive",
      });
    }
  };

  // Esporta ZIP
  const exportProject = async () => {
    try {
      const response = await apiRequest('POST', '/api/code/export', {
        files: projectFiles
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `progetto-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Esportato ✅",
        description: "Il progetto è stato esportato come ZIP!",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile esportare il progetto.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 flex overflow-hidden bg-white h-full" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Chat AI - Pannello Sinistro */}
      <div 
        className="flex flex-col overflow-hidden" 
        style={{ width: `${leftPanelWidth}%` }}
      >
        {/* Header Chat - Minimal */}
        <div className="p-6 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse"></div>
            <h2 className="text-lg font-semibold text-gray-900">AI Code Assistant</h2>
          </div>
        </div>

        {/* Messaggi Chat - Minimal */}
        <div className="flex-1 overflow-y-auto px-6 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[65vh] text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <span className="text-3xl">🤖</span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Assistente AI per Codice</h3>
              <p className="text-gray-600 max-w-md">Descrivi cosa vuoi creare e genererò il progetto completo per te!</p>
            </div>
          )}
          
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-lg font-mono text-sm ${
                message.role === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white border border-gray-200 text-gray-800'
              }`}>
                {message.content}
              </div>
            </div>
          ))}
          
          {(generateProjectMutation.isPending || modifyCodeMutation.isPending) && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 p-3 rounded-lg flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span className="font-mono text-sm text-gray-600">Generazione in corso...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Chat - Migliorato per spacing e dimensioni */}
        <div className="bg-white border-t border-gray-200 px-6 py-5">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-3">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={projectFiles.length === 0 ? "Descrivi il progetto da creare..." : "Come vuoi modificare il codice?"}
              className="w-full min-h-[60px] resize-none border-0 bg-transparent px-2 py-2 text-gray-900 placeholder-gray-500 focus:ring-0"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <div className="flex justify-end pt-2">
              {inputValue.trim() && (
                <Button 
                  onClick={handleSendMessage}
                  disabled={generateProjectMutation.isPending || modifyCodeMutation.isPending}
                  className="h-10 w-10 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-all duration-200 shadow-md hover:shadow-lg p-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Divisore Ridimensionabile - Minimal */}
      <div 
        className="w-px bg-gray-200 cursor-col-resize hover:bg-blue-400 transition-colors"
        onMouseDown={handleMouseDown}
      />

      {/* Preview - Pannello Destro - Minimal */}
      <div 
        className="flex flex-col overflow-hidden bg-gray-50" 
        style={{ width: `${100 - leftPanelWidth}%` }}
      >
        {/* Header Preview - Minimal */}
        <div className="p-6 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full animate-pulse"></div>
              <h3 className="text-lg font-semibold text-gray-900">Anteprima Live</h3>
            </div>
            
            {projectFiles.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={saveProject}>
                    <Save className="mr-2 h-4 w-4" />
                    Salva Progetto
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportProject}>
                    <Download className="mr-2 h-4 w-4" />
                    Esporta ZIP
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Contenuto Preview */}
        <div className="flex-1 p-4 overflow-hidden">
          {previewContent ? (
            <div className="h-full rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <iframe
                srcDoc={previewContent}
                className="w-full h-full border-0"
                title="Anteprima Progetto"
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🚀</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">La tua anteprima apparirà qui...</h3>
                <p className="text-gray-600 max-w-md">
                  Usa la chat AI per generare il tuo primo progetto e vedrai l'anteprima live in questo spazio!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Lista File Generati */}
        {projectFiles.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <Code className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-sm text-gray-900">File Generati</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {projectFiles.map((file) => (
                <button
                  key={file.filename}
                  onClick={() => openFloatingEditor(file)}
                  className="px-3 py-1 text-xs font-mono bg-white border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  {file.filename}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Editor Galleggianti */}
      {floatingEditors.map((editor) => (
        <div
          key={editor.id}
          className="fixed bg-white border border-gray-300 rounded-lg shadow-xl overflow-hidden"
          style={{
            left: editor.position.x,
            top: editor.position.y,
            width: editor.isMinimized ? '300px' : '600px',
            height: editor.isMinimized ? '40px' : '400px',
            zIndex: editor.zIndex,
          }}
        >
          {/* Barra Titolo Editor */}
          <div className="flex items-center justify-between p-2 bg-gray-100 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-medium text-gray-700">{editor.file.filename}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => toggleMinimize(editor.id)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                {editor.isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              </button>
              <button
                onClick={() => closeEditor(editor.id)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Contenuto Editor */}
          {!editor.isMinimized && (
            <div className="h-full p-2">
              <Textarea
                value={editor.file.content}
                onChange={(e) => updateFileContent(editor.file.filename, e.target.value)}
                className="w-full h-full font-mono text-sm resize-none border-0 focus:ring-0"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default NewCodePanel;