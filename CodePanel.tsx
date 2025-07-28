import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Code, 
  Download, 
  Save, 
  Play, 
  Zap,
  Upload,
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
  const [mobileView, setMobileView] = useState<string>("AI");
  const [isMobile, setIsMobile] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Hook per rilevare mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      // Call real AI endpoint for code generation
      const response = await fetch('/api/code/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: input,
          language: 'html',
          history: messages,
          currentCode: ''
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Create files from AI generated code
      const files: GeneratedFile[] = [];
      
      // Parse the generated code to create appropriate files
      if (result.code) {
        // Clean the code by removing markdown code block markers if present
        let cleanCode = result.code;
        if (cleanCode.startsWith('```')) {
          // Remove opening ```language
          cleanCode = cleanCode.replace(/^```[a-zA-Z]*\n/, '');
          // Remove closing ```
          cleanCode = cleanCode.replace(/\n```$/, '');
        }

        // If it's HTML code, create HTML, CSS, and JS files
        if (cleanCode.includes('<!DOCTYPE html>') || cleanCode.includes('<html')) {
          files.push({
            name: 'index.html',
            content: cleanCode,
            language: 'html'
          });
          
          // Extract CSS if present
          const cssMatch = cleanCode.match(/<style[^>]*>([\s\S]*?)<\/style>/);
          if (cssMatch) {
            files.push({
              name: 'style.css',
              content: cssMatch[1].trim(),
              language: 'css'
            });
          }
          
          // Extract JS if present
          const jsMatch = cleanCode.match(/<script[^>]*>([\s\S]*?)<\/script>/);
          if (jsMatch) {
            files.push({
              name: 'script.js',
              content: jsMatch[1].trim(),
              language: 'javascript'
            });
          }
        } else {
          // For other code types, create a single file
          let extension = 'txt';
          let language = 'text';
          
          // Determine file extension based on code content and user input
          if (cleanCode.includes('function') || cleanCode.includes('const ') || cleanCode.includes('let ') || input.toLowerCase().includes('javascript') || input.toLowerCase().includes('js')) {
            extension = 'js';
            language = 'javascript';
          } else if (cleanCode.includes('def ') || cleanCode.includes('import ') || input.toLowerCase().includes('python')) {
            extension = 'py';
            language = 'python';
          } else if (cleanCode.includes('{') && cleanCode.includes('}') && !cleanCode.includes('function') || input.toLowerCase().includes('css')) {
            extension = 'css';
            language = 'css';
          } else if (cleanCode.includes('<') && cleanCode.includes('>') || input.toLowerCase().includes('html')) {
            extension = 'html';
            language = 'html';
          }
          
          files.push({
            name: `main.${extension}`,
            content: cleanCode,
            language: language
          });
        }
      }

      setGeneratedFiles(files);
      setActiveFile(files[0]?.name || "");
      setProjectName("Progetto Generato");

      const assistantMessage: Message = {
        role: "assistant", 
        content: result.response || `Ho generato il codice basato sulla tua richiesta con ${files.length} file. Puoi visualizzare l'anteprima e modificare i file come preferisci.`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update preview if HTML files exist
      updatePreview(files);

    } catch (error) {
      console.error("Errore nella generazione:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Si è verificato un errore durante la generazione del codice. Riprova con una descrizione diversa.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const getLanguageFromFileName = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'html': return 'html';
      case 'css': return 'css';
      case 'js': return 'javascript';
      case 'ts': return 'typescript';
      case 'jsx': return 'jsx';
      case 'tsx': return 'tsx';
      case 'json': return 'json';
      case 'md': return 'markdown';
      default: return 'text';
    }
  };

  const updatePreview = (files: GeneratedFile[]) => {
    const htmlFile = files.find(f => f.name.includes('.html'));
    const cssFile = files.find(f => f.name.includes('.css'));
    const jsFile = files.find(f => f.name.includes('.js'));

    if (htmlFile && iframeRef.current) {
      let htmlContent = htmlFile.content;
      
      // Inietta CSS inline se presente
      if (cssFile) {
        htmlContent = htmlContent.replace(
          '</head>',
          `<style>${cssFile.content}</style></head>`
        );
      }
      
      // Inietta JavaScript inline se presente
      if (jsFile) {
        htmlContent = htmlContent.replace(
          '</body>',
          `<script>${jsFile.content}</script></body>`
        );
      }

      iframeRef.current.srcdoc = htmlContent;
    }
  };

  const handleFileChange = (fileName: string, newContent: string) => {
    setGeneratedFiles(prev => 
      prev.map(file => 
        file.name === fileName 
          ? { ...file, content: newContent }
          : file
      )
    );
    
    // Aggiorna l'anteprima se il file modificato è importante
    const updatedFiles = generatedFiles.map(file => 
      file.name === fileName ? { ...file, content: newContent } : file
    );
    updatePreview(updatedFiles);
  };

  const handleDownloadProject = () => {
    if (generatedFiles.length === 0) return;

    // Crea e scarica un file ZIP con tutti i file del progetto
    import('jszip').then(({ default: JSZip }) => {
      const zip = new JSZip();
      
      generatedFiles.forEach(file => {
        zip.file(file.name, file.content);
      });
      
      zip.generateAsync({ type: "blob" }).then(content => {
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName || 'progetto'}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    });
  };

  const handleDeployToVercel = async () => {
    if (generatedFiles.length === 0) {
      alert('Nessun progetto da deployare. Genera prima un progetto.');
      return;
    }

    setIsDeploying(true);
    
    try {
      // Prepara i file per l'API di deploy
      const filesForDeploy = generatedFiles.map(file => ({
        name: file.name,
        content: file.content
      }));

      const response = await fetch('/api/deploy/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          files: filesForDeploy,
          projectName: projectName || 'ai-generated-project'
        })
      });

      const result = await response.json();

      if (result.success) {
        const deployMessage: Message = {
          role: "assistant",
          content: `🚀 Deploy completato con successo! Il tuo progetto è ora live su: ${result.url}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, deployMessage]);
        
        // Apri il sito deployato in una nuova tab
        window.open(result.url, '_blank');
      } else {
        throw new Error(result.error || 'Errore durante il deploy');
      }
    } catch (error) {
      console.error('Errore deploy:', error);
      const errorMessage: Message = {
        role: "assistant",
        content: `❌ Errore durante il deploy: ${error instanceof Error ? error.message : 'Errore sconosciuto'}. Verifica che il token Vercel sia configurato correttamente.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsDeploying(false);
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

  const getPreviewContent = () => {
    const htmlFile = generatedFiles.find(file => file.name.endsWith('.html'));
    if (!htmlFile) return '<html><body><h1>Nessun file HTML trovato</h1></body></html>';
    return htmlFile.content;
  };

  // Componenti per le diverse viste
  const renderFileTree = () => (
    <div className="p-4">
      <h3 className="font-semibold mb-4">File del Progetto</h3>
      {generatedFiles.length > 0 ? (
        <div className="space-y-2">
          {generatedFiles.map((file) => (
            <div
              key={file.name}
              onClick={() => setActiveFile(file.name)}
              className={`p-3 rounded-lg cursor-pointer border ${
                activeFile === file.name ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4" />
                <span className="text-sm font-medium">{file.name}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">Nessun file generato ancora</p>
      )}
    </div>
  );

  const renderAIChat = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">AI Assistant</h2>
        <p className="text-sm text-gray-600">Descrivi cosa vuoi creare</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg ${
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
  );

  const renderPreview = () => (
    <div className="flex flex-col h-full">
      {generatedFiles.length > 0 ? (
        <>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{projectName}</h3>
              <Badge variant="secondary">{generatedFiles.length} file</Badge>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant={previewMode === "desktop" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPreviewMode("desktop")}
                >
                  <Monitor className="w-4 h-4" />
                </Button>
                <Button
                  variant={previewMode === "tablet" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPreviewMode("tablet")}
                >
                  <FileCode className="w-4 h-4" />
                </Button>
                <Button
                  variant={previewMode === "mobile" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPreviewMode("mobile")}
                >
                  <Smartphone className="w-4 h-4" />
                </Button>
              </div>

              <Button onClick={handleDownloadProject} size="sm" variant="outline">
                <Download className="w-4 h-4 mr-1" />
                ZIP
              </Button>
            </div>
          </div>

          <div className="flex-1 p-4 bg-gray-100 overflow-auto">
            <div className={`mx-auto bg-white shadow-lg rounded-lg overflow-hidden ${
              previewMode === "mobile" ? "max-w-sm" : 
              previewMode === "tablet" ? "max-w-2xl" : "w-full"
            }`}>
              <iframe
                ref={iframeRef}
                srcDoc={getPreviewContent()}
                className="w-full border-0"
                style={{ minHeight: '500px' }}
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center text-gray-500">
            <Globe className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">Nessuna preview disponibile</h3>
            <p>Genera un progetto per vedere l'anteprima</p>
          </div>
        </div>
      )}
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
          <div className="flex-1 overflow-hidden">
            {mobileView === 'Preview' ? renderPreview() : (
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                  <h3 className="text-sm font-medium text-gray-700 mb-1">AI Assistant per Codice</h3>
                  <p className="text-xs text-gray-600">
                    Descrivi cosa vuoi creare e genererò il progetto completo per te!
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                        <Code className="w-10 h-10 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">La tua anteprima apparirà qui...</h3>
                      <p className="text-sm text-gray-600">
                        Usa la chat AI per generare il tuo primo progetto e vedrai l'anteprima live in questo spazio!
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
                  <div ref={messagesEndRef} />
                </div>

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
            )}
          </div>
        </>
      ) : (
        /* Layout Desktop */
        <div className="flex h-full">
          {/* Chat Panel - Sinistra */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Code className="w-5 h-5" />
            Generatore di Codice
          </h2>
        </div>

        {/* Messaggi */}
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

        {/* Form di input */}
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

      {/* Editor e Preview - Destra */}
      <div className="flex-1 flex flex-col">
        {generatedFiles.length > 0 && (
          <>
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h3 className="font-semibold">{projectName}</h3>
                <Badge variant="secondary">{generatedFiles.length} file</Badge>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Controlli responsive */}
                <div className="flex border rounded-lg overflow-hidden">
                  <Button
                    variant={previewMode === "desktop" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setPreviewMode("desktop")}
                  >
                    <Monitor className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={previewMode === "tablet" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setPreviewMode("tablet")}
                  >
                    <FileCode className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={previewMode === "mobile" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setPreviewMode("mobile")}
                  >
                    <Smartphone className="w-4 h-4" />
                  </Button>
                </div>

                <Button onClick={handleDownloadProject} size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download ZIP
                </Button>
                
                <Button 
                  onClick={handleDeployToVercel} 
                  size="sm" 
                  disabled={isDeploying || generatedFiles.length === 0}
                >
                  {isDeploying ? (
                    <>
                      <Zap className="w-4 h-4 mr-2 animate-pulse" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4 mr-2" />
                      Deploy to Vercel
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex-1 flex">
              {/* Editor */}
              <div className="w-1/2 border-r border-gray-200">
                <Tabs value={activeFile} onValueChange={setActiveFile} className="h-full flex flex-col">
                  <TabsList className="justify-start border-b rounded-none h-auto p-0">
                    {generatedFiles.map((file) => (
                      <TabsTrigger 
                        key={file.name} 
                        value={file.name}
                        className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none"
                      >
                        {file.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {generatedFiles.map((file) => (
                    <TabsContent key={file.name} value={file.name} className="flex-1 m-0">
                      <Textarea
                        value={file.content}
                        onChange={(e) => handleFileChange(file.name, e.target.value)}
                        className="w-full h-full font-mono text-sm border-none resize-none focus:ring-0"
                        style={{ minHeight: 'calc(100vh - 200px)' }}
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              </div>

              {/* Preview */}
              <div className="w-1/2 bg-gray-50 flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-white">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Anteprima Live</h4>
                    <Badge variant="outline">{previewMode}</Badge>
                  </div>
                </div>
                
                <div className="flex-1 p-4 flex justify-center">
                  <div style={{ width: getPreviewWidth(), maxWidth: '100%' }}>
                    <iframe
                      ref={iframeRef}
                      title="Preview"
                      className="w-full h-full border border-gray-300 rounded-lg bg-white"
                      style={{ minHeight: '600px' }}
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {generatedFiles.length === 0 && (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <Globe className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Nessun progetto generato</h3>
              <p>Inizia descrivendo il progetto che vuoi creare nella chat</p>
            </div>
          </div>
        )}
        </div>
      )}
    </div>
  );
}