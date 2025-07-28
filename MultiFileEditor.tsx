import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Copy, Download, FileArchive, Plus, Trash } from 'lucide-react';
import { useCodeStore, CodeFile } from '@/store/codeStore';
import LivePreview from './LivePreview';

interface MultiFileEditorProps {
  onProjectExport?: () => void;
  onProjectSave?: () => void;
  onCodeSelect?: (selectedCode: string, start: number, end: number) => void;
}

const MultiFileEditor: React.FC<MultiFileEditorProps> = ({ onProjectExport, onProjectSave, onCodeSelect }) => {
  const { files, activeTab, setActiveTab, updateFile, addFile, removeFile } = useCodeStore();
  const [showAddFileDialog, setShowAddFileDialog] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState('html');
  const [suggestion, setSuggestion] = useState('');
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);

  const currentFile = files.find((file) => file.name === activeTab);

  // Funzione per generare suggerimenti AI
  const generateSuggestion = async (code: string) => {
    if (!code.trim() || code.length < 10) return; // Non suggerire per codice troppo breve
    
    setIsLoadingSuggestion(true);
    try {
      const res = await fetch('/api/code/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code,
          fileName: activeTab,
          language: getLanguageFromFileType(activeTab?.split('.').pop() || 'html')
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setSuggestion(data.suggestion || '');
      }
    } catch (err) {
      console.error('Errore completamento AI:', err);
      setSuggestion('');
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  // Effetto debounce per suggerimenti automatici
  useEffect(() => {
    if (!currentFile?.content) {
      setSuggestion('');
      return;
    }

    const timeout = setTimeout(() => {
      generateSuggestion(currentFile.content);
    }, 1500); // Debounce di 1.5 secondi

    return () => clearTimeout(timeout);
  }, [currentFile?.content, activeTab]);

  // Funzione per accettare e inserire il suggerimento AI
  const handleAcceptSuggestion = () => {
    if (!activeTab || !currentFile || !suggestion) return;

    // Aggiunge il suggerimento alla fine del file corrente
    const newContent = currentFile.content + '\n' + suggestion;
    updateFile(activeTab, newContent);
    
    // Pulisce il suggerimento dopo l'inserimento
    setSuggestion('');
  };

  const getLanguageFromFileType = (type: string): string => {
    switch (type) {
      case 'html': return 'html';
      case 'css': return 'css';
      case 'js': return 'javascript';
      case 'json': return 'json';
      case 'md': return 'markdown';
      default: return 'text';
    }
  };

  const handleAddNewFile = () => {
    if (!newFileName) return;
    
    const extension = newFileType;
    const fileName = newFileName.includes('.') 
      ? newFileName 
      : `${newFileName}.${extension}`;
    
    // Controlla se il file esiste già
    if (files.some(file => file.name === fileName)) {
      alert(`Il file ${fileName} esiste già.`);
      return;
    }
    
    const newFile: CodeFile = {
      name: fileName,
      language: getLanguageFromFileType(extension),
      content: ''
    };
    
    addFile(newFile);
    setActiveTab(fileName);
    setShowAddFileDialog(false);
    setNewFileName('');
  };

  const handleUpdateContent = (newContent: string) => {
    if (currentFile) {
      updateFile(currentFile.name, newContent);
    }
  };

  const handleExportCurrentFile = () => {
    if (!currentFile) return;
    
    const blob = new Blob([currentFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleCopyCurrentFile = () => {
    if (!currentFile) return;
    navigator.clipboard.writeText(currentFile.content);
  };
  
  const handleDeleteCurrentFile = () => {
    if (!currentFile) return;
    
    // Non permettere la cancellazione dei file principali
    if (['index.html', 'style.css', 'script.js'].includes(currentFile.name)) {
      alert('Non puoi cancellare i file principali del progetto.');
      return;
    }
    
    if (confirm(`Sei sicuro di voler eliminare il file ${currentFile.name}?`)) {
      removeFile(currentFile.name);
    }
  };

  // Ottieni i contenuti per la preview
  const htmlFile = files.find(f => f.name === 'index.html');
  const cssFile = files.find(f => f.name === 'style.css');
  const jsFile = files.find(f => f.name === 'script.js');

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Editor panel */}
      <div className="lg:w-1/2 flex-1 flex flex-col overflow-hidden border-r border-border">
        <div className="p-2 border-b border-border bg-muted/30 flex items-center justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="flex-1 overflow-x-auto flex-wrap justify-start">
              {files.map((file) => (
                <TabsTrigger
                  key={file.name}
                  value={file.name}
                  className={activeTab === file.name ? 'bg-primary text-primary-foreground' : ''}
                >
                  {file.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          
          <div className="flex gap-1">
            {onProjectSave && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onProjectSave}
                title="Salva progetto"
              >
                <FileArchive className="h-4 w-4" />
              </Button>
            )}
            
            {onProjectExport && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onProjectExport}
                title="Esporta progetto come ZIP"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowAddFileDialog(true)}
              title="Aggiungi nuovo file"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {showAddFileDialog && (
          <div className="p-4 border-b border-border bg-card">
            <div className="flex items-center gap-2 mb-2">
              <input 
                type="text"
                placeholder="Nome file"
                className="flex-1 p-2 border border-border rounded"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
              />
              <select 
                className="p-2 border border-border rounded"
                value={newFileType}
                onChange={(e) => setNewFileType(e.target.value)}
              >
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="js">JavaScript</option>
                <option value="json">JSON</option>
                <option value="md">Markdown</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAddFileDialog(false)}
              >
                Annulla
              </Button>
              <Button 
                size="sm"
                onClick={handleAddNewFile}
              >
                Aggiungi
              </Button>
            </div>
          </div>
        )}
        
        {currentFile && (
          <>
            <div className="p-4 border-b border-border bg-card flex justify-between items-center">
              <h3 className="font-medium">{currentFile.name}</h3>
              <div className="flex space-x-2">
                <Button variant="ghost" size="icon" onClick={handleCopyCurrentFile} title="Copia contenuto">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleExportCurrentFile} title="Scarica file">
                  <Download className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleDeleteCurrentFile}
                  title="Elimina file"
                  disabled={['index.html', 'style.css', 'script.js'].includes(currentFile.name)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-4 flex-1 overflow-auto border-0 flex flex-col">
              <Textarea
                value={currentFile.content}
                onChange={(e) => handleUpdateContent(e.target.value)}
                onSelect={(e) => {
                  const textarea = e.target as HTMLTextAreaElement;
                  const start = textarea.selectionStart;
                  const end = textarea.selectionEnd;
                  const selected = textarea.value.substring(start, end);
                  onCodeSelect?.(selected, start, end);
                }}
                className="flex-1 min-h-[450px] font-mono text-sm resize-none"
                placeholder="// Modifica il codice qui..."
              />
              
              {/* Suggerimenti AI */}
              {(suggestion || isLoadingSuggestion) && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <div className="text-blue-600 mt-0.5">💡</div>
                    <div className="flex-1 text-sm">
                      {isLoadingSuggestion ? (
                        <div className="text-blue-600 italic">
                          Generando suggerimento AI...
                        </div>
                      ) : suggestion ? (
                        <div>
                          <span className="font-medium text-blue-800">Suggerimento AI:</span>
                          <div className="mt-1 text-blue-700 bg-white p-2 rounded border font-mono text-xs">
                            {suggestion}
                          </div>
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={handleAcceptSuggestion}
                              className="text-green-700 border border-green-600 px-3 py-1 rounded text-xs hover:bg-green-50 transition-colors"
                              title="Inserisci suggerimento nel codice"
                            >
                              ✔️ Accetta
                            </button>
                            <button
                              onClick={() => setSuggestion('')}
                              className="text-gray-500 border border-gray-400 px-3 py-1 rounded text-xs hover:bg-gray-50 transition-colors"
                              title="Nascondi suggerimento"
                            >
                              ✕ Rifiuta
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Live preview panel */}
      <div className="lg:w-1/2 flex-1 p-4 overflow-auto">
        <div className="flex justify-end mb-2">
          {onProjectExport && (
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-1"
              onClick={onProjectExport}
            >
              <FileArchive className="h-4 w-4" />
              <span>Esporta Progetto</span>
            </Button>
          )}
        </div>
        
        <LivePreview 
          htmlContent={htmlFile?.content || ''}
          cssContent={cssFile?.content || ''}
          jsContent={jsFile?.content || ''}
        />
      </div>
    </div>
  );
};

export default MultiFileEditor;