import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, File } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploaderProps {
  onUploadSuccess?: (data: any) => void;
}

export default function FileUploader({ onUploadSuccess }: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.length) {
      toast({
        title: "Nessun file selezionato",
        description: "Seleziona un file prima di caricarlo",
        variant: "destructive",
      });
      return;
    }

    const file = fileInputRef.current.files[0];
    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Errore nel caricamento del file');
      }

      const data = await response.json();
      
      toast({
        title: "File caricato con successo",
        description: `${file.name} è stato analizzato ed è pronto per essere interrogato`,
      });
      
      if (onUploadSuccess) {
        onUploadSuccess(data);
      }
      
      // Reset del form
      setFileName(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast({
        title: "Errore durante il caricamento",
        description: error instanceof Error ? error.message : "Si è verificato un errore durante il caricamento del file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-2 p-4 border border-dashed rounded-md bg-background/50">
      <div className="flex items-center gap-2 w-full">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.docx,.xlsx,.txt"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <File className="w-4 h-4 mr-2" />
          {fileName ? 'Cambia file' : 'Seleziona file'}
        </Button>
        <Button
          type="button"
          onClick={handleUpload}
          size="sm"
          disabled={!fileName || uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Caricamento...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Carica
            </>
          )}
        </Button>
      </div>
      {fileName && (
        <p className="text-sm text-muted-foreground mt-1 truncate max-w-full">
          File selezionato: {fileName}
        </p>
      )}
      <p className="text-xs text-muted-foreground mt-1">
        Formati supportati: PDF, DOCX, XLSX, TXT (max 10MB)
      </p>
    </div>
  );
}