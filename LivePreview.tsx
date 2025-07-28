import React, { useEffect, useState } from 'react';

interface LivePreviewProps {
  htmlContent?: string;
  cssContent?: string;
  jsContent?: string;
}

const LivePreview: React.FC<LivePreviewProps> = ({
  htmlContent = '',
  cssContent = '',
  jsContent = '',
}) => {
  const [iframeContent, setIframeContent] = useState<string>('');

  useEffect(() => {
    // Estrai il contenuto del body dall'HTML se presente
    let bodyContent = htmlContent;
    
    // Se l'HTML contiene un documento completo, estrai solo il contenuto del body
    if (htmlContent.includes('<body') && htmlContent.includes('</body>')) {
      const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      bodyContent = bodyMatch ? bodyMatch[1] : htmlContent;
    }
    
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
          ${bodyContent || '<div>Anteprima HTML</div>'}
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
      <div className="p-2 flex justify-between items-center bg-muted/20 border-b border-border">
        <div className="text-sm text-muted-foreground">Preview Live</div>
        <div className="text-xs text-muted-foreground bg-background px-2 py-1 rounded">
          Aggiornamento automatico
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <iframe
          srcDoc={iframeContent}
          className="w-full h-full border-0"
          title="Live Preview"
          sandbox="allow-scripts"
          style={{height: '100%', display: 'block'}}
        />
      </div>
    </div>
  );
};

export default LivePreview;