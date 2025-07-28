import { useState } from "react";
import DocumentEditor from "@/components/document/DocumentEditor";
import ExportOptions from "@/components/document/ExportOptions";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export interface DocumentSettings {
  style: "formal" | "informal" | "technical" | "creative";
  language: "italian" | "english" | "spanish" | "french";
}

export interface ExportSettings {
  format: "pdf" | "docx";
  layout: "standard" | "compact";
  style: "modern" | "classic" | "minimal" | "academic";
}

const DocumentGenerator = () => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [documentContent, setDocumentContent] = useState("");
  const [documentSettings, setDocumentSettings] = useState<DocumentSettings>({
    style: "formal",
    language: "italian",
  });
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    format: "pdf",
    layout: "standard",
    style: "modern",
  });
  
  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST", 
        "/api/document/generate", 
        { prompt, settings: documentSettings }
      );
      return response.json();
    },
    onSuccess: (data) => {
      if (data.content) {
        setDocumentContent(data.content);
      }
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante la generazione del documento.",
        variant: "destructive",
      });
    }
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      if (!documentContent) {
        throw new Error("No document to export");
      }
      
      const response = await apiRequest(
        "POST", 
        `/api/document/export/${exportSettings.format}`, 
        { content: documentContent, settings: exportSettings }
      );
      
      if (response.headers.get("Content-Type")?.includes("application/json")) {
        // Error response
        const errorData = await response.json();
        throw new Error(errorData.message || "Export failed");
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `document.${exportSettings.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Successo",
        description: "Documento esportato con successo.",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'esportazione del documento.",
        variant: "destructive",
      });
    }
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci una descrizione per il documento da generare.",
        variant: "destructive",
      });
      return;
    }
    
    generateMutation.mutate();
  };

  const handleExport = () => {
    if (!documentContent) {
      toast({
        title: "Errore",
        description: "Genera prima un documento da esportare.",
        variant: "destructive",
      });
      return;
    }
    
    exportMutation.mutate();
  };

  return (
    <section className="flex-1 flex flex-col">
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 sticky top-0 md:top-0 z-10">
        <h2 className="text-lg font-semibold">Genera Documento</h2>
      </div>

      <div className="flex-1 flex flex-col md:flex-row">
        <DocumentEditor 
          prompt={prompt}
          onPromptChange={setPrompt}
          content={documentContent}
          settings={documentSettings}
          onSettingsChange={setDocumentSettings}
          onGenerate={handleGenerate}
          isGenerating={generateMutation.isPending}
        />
        
        <ExportOptions 
          settings={exportSettings}
          onSettingsChange={setExportSettings}
          onExport={handleExport}
          isExporting={exportMutation.isPending}
          disabled={!documentContent || generateMutation.isPending}
        />
      </div>
      
      {generateMutation.isPending && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-center">Generazione del documento in corso...</p>
          </div>
        </div>
      )}
    </section>
  );
};

export default DocumentGenerator;
