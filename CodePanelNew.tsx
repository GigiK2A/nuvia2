import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Send, 
  Code, 
  Download, 
  Save, 
  Play, 
  Zap,
  FileCode,
  Globe,
  Smartphone,
  Monitor
} from "lucide-react";
import { simulateCodeGeneration, type SimulatedProjectFile } from "@/lib/utils/simulateCodeAI";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface GeneratedFile {
  name: string;
  content: string;
  language: string;
}

export default function CodePanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [activeFile, setActiveFile] = useState<string>("");
  const [projectName, setProjectName] = useState("");
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isDeploying, setIsDeploying] = useState(false);
  const [mobileView, setMobileView] = useState<"AI" | "Preview">("AI");
  const [isMobile, setIsMobile] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (generatedFiles.length > 0 && iframeRef.current) {
      const htmlFile = generatedFiles.find(file => file.name.endsWith('.html'));
      if (htmlFile) {
        iframeRef.current.srcdoc = htmlFile.content;
      }
    }
  }, [generatedFiles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsGenerating(true);

    try {
      const result = await simulateCodeGeneration(input);
      
      const assistantMessage: Message = {
        role: "assistant",
        content: `Ho generato il progetto "${result.name}" con ${result.files.length} file. Puoi vedere l'anteprima cliccando il pulsante Preview!`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setProjectName(result.name);
      
      const files: GeneratedFile[] = result.files.map((file: SimulatedProjectFile) => ({
        name: file.name,
        content: file.content,
        language: file.name.split('.').pop() || 'text'
      }));
      
      setGeneratedFiles(files);
      setActiveFile(files[0]?.name || "");
      
    } catch (error) {
      console.error('Errore durante la generazione:', error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Si è verificato un errore durante la generazione del codice. Riprova.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (generatedFiles.length === 0) return;

    try {
      const response = await fetch('/api/project/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName,
          files: generatedFiles.reduce((acc, file) => {
            acc[file.name] = file.content;
            return acc;
          }, {} as Record<string, string>)
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName || 'progetto'}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Errore durante il download:', error);
    }
  };

  const getPreviewWidth = () => {
    switch (previewMode) {
      case "mobile": return "375px";
      case "tablet": return "768px";
      case "desktop": return "100%";
      default: return "100%";
    }
  };

  const renderPreview = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-medium">Anteprima Live</h3>
        {generatedFiles.length > 0 && (
          <div className="flex items-center gap-2">
            <Select value={previewMode} onValueChange={(value: "desktop" | "tablet" | "mobile") => setPreviewMode(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desktop">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    Desktop
                  </div>
                </SelectItem>
                <SelectItem value="tablet">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    Tablet
                  </div>
                </SelectItem>
                <SelectItem value="mobile">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    Mobile
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleDownload} size="sm">
              <Download className="w-4 h-4 mr-2" />
              ZIP
            </Button>
          </div>
        )}
      </div>
      
      <div className="flex-1 p-4 bg-gray-50 flex justify-center items-center">
        {generatedFiles.length === 0 ? (
          <div className="text-center text-gray-500">
            <Globe className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Nessun progetto da visualizzare</p>
          </div>
        ) : (
          <div style={{ width: getPreviewWidth(), maxWidth: '100%' }}>
            <iframe
              ref={iframeRef}
              title="Preview"
              className="w-full border border-gray-300 rounded-lg bg-white"
              style={{ height: isMobile ? '50vh' : '70vh' }}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      {/* Layout Mobile */}
      {isMobile ? (
        <>
          {/* Header con Preview Button */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">AI Code Assistant</h2>
            </div>
            
            {generatedFiles.length > 0 && (
              <Button
                variant={mobileView === 'Preview' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMobileView(mobileView === 'Preview' ? 'AI' : 'Preview')}
                className="flex items-center gap-2"
              >
                {mobileView === 'Preview' ? (
                  <>
                    <Code className="w-4 h-4" />
                    Chat
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Preview
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Contenuto principale */}
          <div className="flex-1 overflow-hidden h-screen">
            {mobileView === 'Preview' ? renderPreview() : (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                  <h3 className="text-sm font-medium text-gray-700 mb-1">AI Assistant per Codice</h3>
                  <p className="text-xs text-gray-600">
                    Descrivi cosa vuoi creare e genererò il progetto completo per te!
                  </p>
                </div>

                <div className="flex-1 p-4 space-y-4 overflow-hidden flex flex-col justify-center">
                  {messages.length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                        <Code className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-base font-semibold mb-2">La tua anteprima apparirà qui...</h3>
                      <p className="text-xs text-gray-600">
                        Usa la chat AI per generare il tuo primo progetto!
                      </p>
                    </div>
                  )}
                  
                  {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  
                  {isGenerating && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 animate-pulse text-blue-500" />
                          <span className="text-sm">Generando codice...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-auto">
                  <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex gap-2">
                      <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Descrivi il progetto che vuoi creare... (es: una landing page per un ristorante)"
                        className="flex-1 min-h-[60px] resize-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                          }
                        }}
                      />
                      <Button 
                        type="submit" 
                        disabled={!input.trim() || isGenerating}
                        className="self-end"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Layout Desktop - mantengo quello esistente */
        <div className="flex h-full">
          {/* Chat Panel - Sinistra */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Code className="w-5 h-5" />
                Generatore di Codice
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 mt-8">
                  <FileCode className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Descrivi il progetto che vuoi creare</p>
                  <p className="text-sm mt-2">Es: "Crea una landing page per un'app di fitness"</p>
                </div>
              )}
              
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {isGenerating && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 animate-pulse" />
                      <span className="text-sm">Generando codice...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Descrivi il progetto che vuoi creare..."
                  className="flex-1 min-h-[60px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <Button 
                  type="submit" 
                  disabled={!input.trim() || isGenerating}
                  className="self-end"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>

          {/* Preview Panel - Destra */}
          <div className="flex-1 flex flex-col">
            {renderPreview()}
          </div>
        </div>
      )}
    </div>
  );
}