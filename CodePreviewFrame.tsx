import React, { useEffect, useState } from 'react';

interface CodePreviewFrameProps {
  htmlContent?: string;
  cssContent?: string;
  jsContent?: string;
}

const CodePreviewFrame: React.FC<CodePreviewFrameProps> = ({
  htmlContent = '',
  cssContent = '',
  jsContent = '',
}) => {
  const [iframeContent, setIframeContent] = useState<string>('');

  useEffect(() => {
    // Crea il contenuto completo dell'iframe combinando HTML, CSS e JS
    const completeHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            ${cssContent || ''}
          </style>
        </head>
        <body>
          ${htmlContent || '<div>Anteprima HTML</div>'}
          <script>
            // Sandbox script execution
            try {
              ${jsContent || ''}
            } catch (error) {
              console.error('Errore nel JavaScript:', error);
            }
          </script>
        </body>
      </html>
    `;
    
    setIframeContent(completeHTML);
  }, [htmlContent, cssContent, jsContent]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-background border border-border rounded">
      <div className="p-2 bg-muted/20 border-b border-border text-sm text-muted-foreground">
        Anteprima
      </div>
      
      <iframe
        srcDoc={iframeContent}
        className="w-full h-full flex-1 border-0"
        title="Preview"
        sandbox="allow-scripts"
      />
    </div>
  );
};

export default CodePreviewFrame;