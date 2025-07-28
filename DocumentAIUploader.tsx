import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, FileText, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DocumentAIUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<{ original: string, generated: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: "File richiesto",
        description: "Seleziona un documento PDF o DOCX da analizzare",
        variant: "destructive"
      });
      return;
    }
    
    if (!prompt.trim()) {
      toast({
        title: "Prompt richiesto",
        description: "Inserisci un'istruzione per l'elaborazione del documento",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("prompt", prompt);

      const res = await fetch("/api/analyze-document", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Errore durante l'elaborazione del documento");
      }

      const data = await res.json();
      
      if (data.success) {
        setResult(data.data);
        toast({
          title: "Elaborazione completata",
          description: "Il documento è stato analizzato con successo",
        });
      } else {
        throw new Error(data.message || "Errore durante l'elaborazione");
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Si è verificato un errore",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Analisi Documenti con IA
          </CardTitle>
          <CardDescription>
            Carica un documento PDF o DOCX e lascia che l'IA lo elabori secondo le tue istruzioni
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="file-upload">Documento</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.docx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="flex-1"
                />
                {file && (
                  <p className="text-sm text-muted-foreground">
                    {file.name} ({(file.size / 1024).toFixed(0)} KB)
                  </p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="prompt">Istruzioni per l'IA</Label>
              <Textarea
                id="prompt"
                placeholder="Es. Riassumi questo documento in punti chiave, Riscrivilo in stile formale, Estrapolane i concetti principali..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Elaborazione...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Elabora Documento
                </>
              )}
            </Button>
          </form>
          
          {result && (
            <div className="mt-8 space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documento Elaborato
                </h3>
                <div className="rounded-md border p-4 bg-muted/30">
                  <pre className="whitespace-pre-wrap text-sm">{result.generated}</pre>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}