import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Loader2, Copy, RefreshCw, Download, ArrowRight, ArrowDown, Eye } from "lucide-react";
import DocumentAIUploader from "@/components/document/DocumentAIUploader";

interface DocumentOptions {
  style: string;
  language: string;
}

interface ExportOptions {
  format: "pdf" | "docx";
  layout: "standard" | "compact";
  style: string;
}

const DocumentPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState("create");
  const [prompt, setPrompt] = useState("");
  const [documentOptions, setDocumentOptions] = useState<DocumentOptions>({
    style: "formale",
    language: "italiano",
  });
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: "pdf",
    layout: "standard",
    style: "moderno",
  });
  const [generatedContent, setGeneratedContent] = useState("");
  const { toast } = useToast();

  const generateMutation = useMutation({
    mutationFn: async (data: { prompt: string; options: DocumentOptions }) => {
      const response = await apiRequest("POST", "/api/document/generate", data);
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Risposta ricevuta:', data);
      if (data.content) {
        console.log('Contenuto documento:', data.content);
        setGeneratedContent(data.content);
        toast({
          title: "Successo",
          description: "Documento generato con successo!",
        });
      } else {
        console.log('Nessun contenuto nella risposta');
        toast({
          title: "Avviso",
          description: "Documento generato ma senza contenuto visibile",
          variant: "default",
        });
      }
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante la generazione del documento.",
        variant: "destructive",
      });
    },
  });

  const exportMutation = useMutation({
    mutationFn: async (data: { content: string; options: ExportOptions }) => {
      const response = await apiRequest(
        "POST",
        `/api/document/export/${data.options.format}`,
        data
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `document.${data.options.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Successo",
        description: "Documento esportato con successo!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: `Impossibile esportare il documento: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast({
        title: "Attenzione",
        description: "Inserisci una descrizione del documento da generare",
        variant: "default",
      });
      return;
    }
    generateMutation.mutate({ prompt, options: documentOptions });
  };

  const handleExport = () => {
    if (!generatedContent) {
      toast({
        title: "Attenzione",
        description: "Genera prima un documento",
        variant: "default",
      });
      return;
    }
    exportMutation.mutate({ content: generatedContent, options: exportOptions });
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(generatedContent);
    toast({
      title: "Copiato",
      description: "Il documento è stato copiato negli appunti",
    });
  };

  const handleRegenerateContent = () => {
    if (!prompt.trim()) return;
    generateMutation.mutate({ prompt, options: documentOptions });
  };

  return (
    <section className="flex-1 flex flex-col h-full" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header con pulsanti discreti */}
      <div className="border-b border-gray-100 bg-white px-6 py-4 sticky top-0 md:top-0 z-10 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Genera Documento</h2>
        
        {/* Pulsanti discreti in alto a destra */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("create")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
              activeTab === "create"
                ? "bg-gray-900 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            Crea
            {activeTab === "create" && (
              <span className="ml-2 w-2 h-2 bg-white rounded-full inline-block"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("analyze")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
              activeTab === "analyze"
                ? "bg-gray-900 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            Analizza
            {activeTab === "analyze" && (
              <span className="ml-2 w-2 h-2 bg-white rounded-full inline-block"></span>
            )}
          </button>
        </div>
      </div>

      {/* Contenuto "Crea Nuovo" */}
      {activeTab === "create" && (
        <div className="flex-1 flex flex-col md:flex-row">
          {/* Document Editor Side */}
          <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            {/* Box Istruzioni snellito */}
            <div className="bg-white border border-gray-200 rounded-lg p-3 mb-6 shadow-sm">
              <form onSubmit={handleGenerate}>
                <Textarea
                  placeholder="Descrivi il documento che vuoi generare..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="text-sm border-0 resize-none mb-4 p-0 focus:ring-0 shadow-none"
                />
                
                {/* Dropdown allineati orizzontalmente */}
                <div className="flex items-center gap-4 mb-4">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Tono</label>
                    <Select
                      value={documentOptions.style}
                      onValueChange={(value) =>
                        setDocumentOptions({ ...documentOptions, style: value })
                      }
                    >
                      <SelectTrigger className="w-28 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="formale">Formale</SelectItem>
                        <SelectItem value="informale">Informale</SelectItem>
                        <SelectItem value="tecnico">Tecnico</SelectItem>
                        <SelectItem value="creativo">Creativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Lingua</label>
                    <Select
                      value={documentOptions.language}
                      onValueChange={(value) =>
                        setDocumentOptions({ ...documentOptions, language: value })
                      }
                    >
                      <SelectTrigger className="w-28 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="italiano">Italiano</SelectItem>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="español">Español</SelectItem>
                        <SelectItem value="français">Français</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Bottone Genera centrato con effetto glow */}
                <div className="flex justify-center">
                  <Button 
                    type="submit" 
                    disabled={generateMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    {generateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generazione...
                      </>
                    ) : (
                      <>
                        Genera
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>

            {/* Box Documento Generato */}
            <div className="flex-1 bg-white border border-gray-300 rounded-lg overflow-hidden flex flex-col shadow-sm">
              <div className="px-4 py-3 flex-row items-center justify-between space-y-0 border-b border-gray-200 flex">
                <h4 className="font-medium text-base text-gray-900">Documento Generato</h4>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopyContent}
                    disabled={!generatedContent}
                    className="h-8 w-8"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRegenerateContent}
                    disabled={!prompt.trim() || generateMutation.isPending}
                    className="h-8 w-8"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="p-4 flex-1 overflow-y-auto">
                {generatedContent ? (
                  <div className="prose prose-sm max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: generatedContent }} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center min-h-[35vh]">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center">
                        <span className="text-3xl">📄</span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-3">Genera Documento AI</h3>
                      <p className="text-gray-500 max-w-sm">Il documento generato apparirà qui con formattazione professionale</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Export Panel - Ottimizzato per schermo intero */}
          <div className="w-full md:w-96 p-6 border-l border-gray-100 bg-gray-50">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="font-medium text-base mb-4 text-gray-900">Esporta</h4>
              
              {/* Radio buttons circolari custom */}
              <div className="space-y-3 mb-6">
                <RadioGroup
                  value={exportOptions.format}
                  onValueChange={(value: "pdf" | "docx") =>
                    setExportOptions({ ...exportOptions, format: value })
                  }
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem 
                      value="pdf" 
                      id="pdf" 
                      className="w-4 h-4 border-2 border-gray-300"
                    />
                    <Label htmlFor="pdf" className="text-sm font-medium">PDF</Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem 
                      value="docx" 
                      id="docx"
                      className="w-4 h-4 border-2 border-gray-300"
                    />
                    <Label htmlFor="docx" className="text-sm font-medium">Word Document</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Bottone Esporta floating stile macOS */}
              <Button
                onClick={handleExport}
                disabled={!generatedContent || exportMutation.isPending}
                className="w-full bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-200 rounded-lg py-3 font-medium transition-all duration-200"
                style={{ backgroundColor: '#b3d4fc' }}
              >
                {exportMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Esportazione...
                  </>
                ) : (
                  <>
                    <ArrowDown className="mr-2 h-4 w-4 animate-bounce" />
                    Esporta
                  </>
                )}
              </Button>

              {/* Link anteprima documento */}
              {generatedContent && (
                <div className="mt-3 text-center">
                  <button className="text-xs text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center gap-1">
                    <Eye className="h-3 w-3" />
                    Visualizza documento in anteprima
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contenuto "Analizza" */}
      {activeTab === "analyze" && (
        <div className="flex-1 p-6" style={{ backgroundColor: '#f9fafb' }}>
          <div className="max-w-2xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">📄</span>
                <h3 className="text-base font-semibold text-gray-900">Analisi Documenti con IA</h3>
              </div>
              
              <DocumentAIUploader />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default DocumentPanel;