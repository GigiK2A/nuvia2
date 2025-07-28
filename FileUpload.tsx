import React from 'react';
import { Upload, File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FileUpload({
  onFileParsed,
  isLoading = false,
  attachedFileName = '',
  onClearFile,
  minimal = false
}: {
  onFileParsed: (fileText: string, fileName: string) => void;
  isLoading?: boolean;
  attachedFileName?: string;
  onClearFile?: () => void;
  minimal?: boolean;
}) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.text) {
        onFileParsed(data.text, file.name);
      } else {
        console.error('Errore nel parsing del file:', data.error);
      }
    } catch (err) {
      console.error('Errore parsing file:', err);
    }

    // Reset input
    e.target.value = '';
  };

  if (minimal) {
    return (
      <div className="flex items-center gap-2">
        {/* File allegato minimal */}
        {attachedFileName && (
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
            <File className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-700 font-mono truncate max-w-32">
              {attachedFileName}
            </span>
            {onClearFile && (
              <button
                onClick={onClearFile}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
        
        {/* Icona 📎 minimal */}
        <label className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors p-1">
          <span className="text-sm">📎</span>
          <input
            type="file"
            accept=".pdf,.docx,.txt,.js,.py,.ts,.jsx,.tsx,.html,.css,.json,.md"
            onChange={handleFileChange}
            disabled={isLoading}
            className="hidden"
          />
        </label>
      </div>
    );
  }

  return (
    <div className="mb-3">
      {/* Mostra file allegato */}
      {attachedFileName && (
        <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-2">
          <div className="flex items-center gap-2">
            <File className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              File allegato: {attachedFileName}
            </span>
          </div>
          {onClearFile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFile}
              className="h-auto p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      {/* Input per file */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
          <Upload className="w-4 h-4" />
          <span>Allega documento</span>
          <input
            type="file"
            accept=".pdf,.docx,.txt,.js,.py,.ts,.jsx,.tsx,.html,.css,.json,.md"
            onChange={handleFileChange}
            disabled={isLoading}
            className="hidden"
          />
        </label>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          PDF, DOCX, TXT, codice
        </span>
      </div>
    </div>
  );
}