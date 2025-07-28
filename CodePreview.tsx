import React, { useState, useEffect } from 'react';
import { ExternalLink, Copy, Check, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CodePreviewProps {
  code: string;
  language?: string;
}

export default function CodePreview({ code, language }: CodePreviewProps) {
  const [previewable, setPreviewable] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if code contains HTML elements for iframe preview
    const isHtml = code.includes('<html') || 
                   code.includes('<body') || 
                   code.includes('<!DOCTYPE') ||
                   (code.includes('<div') && code.includes('<style'));
    setPreviewable(isHtml);
  }, [code]);

  const openInNewWindow = () => {
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');
    
    // Clean up the blob URL after the window loads
    if (newWindow) {
      newWindow.onload = () => {
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      };
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadCode = () => {
    try {
      const element = document.createElement('a');
      const file = new Blob([code], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `generated_code_${Date.now()}.${language || 'txt'}`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(element.href);
    } catch (err) {
      console.error('Failed to download code:', err);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-700">🌐 Anteprima Codice</h3>
          {language && (
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
              {language}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={copyCode}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-600">Copiato</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span className="text-xs">Copia</span>
              </>
            )}
          </Button>
          
          <Button
            onClick={downloadCode}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="text-xs">Scarica</span>
          </Button>
          
          <Button
            onClick={openInNewWindow}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="text-xs">Apri in nuova finestra</span>
          </Button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-hidden">
        {previewable ? (
          <iframe
            srcDoc={code}
            title="Code Preview"
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin"
          />
        ) : (
          <div className="h-full overflow-auto">
            <pre className="h-full p-4 bg-gray-900 text-green-400 text-sm font-mono whitespace-pre-wrap overflow-auto">
              {code || '// Il codice generato apparirà qui...'}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}