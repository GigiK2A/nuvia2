import React, { useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Users, Wifi, WifiOff, Activity, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CollaborativeEditorProps {
  projectId: string;
  filePath: string;
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onSave?: (content: string) => void;
}

export function CollaborativeEditor({
  projectId,
  filePath,
  initialContent = '',
  onContentChange,
  onSave
}: CollaborativeEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { toast } = useToast();

  const {
    connected,
    totalUsers,
    sendCodeChange,
    sendCursorChange,
    onCodeUpdate,
    onCursorUpdate,
    joinProject,
    error
  } = useSocket({ projectId, autoConnect: true });

  // Gestisci aggiornamenti da altri utenti
  useEffect(() => {
    const cleanupCodeUpdate = onCodeUpdate((data) => {
      if (data.filePath === filePath) {
        console.log('📝 Ricevuto aggiornamento codice da:', data.userId);
        setContent(data.newContent);
        setLastUpdate(new Date(data.timestamp));
        onContentChange?.(data.newContent);
        
        toast({
          title: "📝 Codice aggiornato",
          description: `Modifica da altro utente`,
          duration: 2000,
        });
      }
    });

    const cleanupCursorUpdate = onCursorUpdate((data) => {
      if (data.filePath === filePath) {
        console.log('👆 Cursore aggiornato da:', data.userId, 'posizione:', data.cursorPosition);
        // Qui potresti mostrare la posizione del cursore degli altri utenti
      }
    });

    return () => {
      cleanupCodeUpdate?.();
      cleanupCursorUpdate?.();
    };
  }, [filePath, onCodeUpdate, onCursorUpdate, onContentChange, toast]);

  // Gestisci modifiche locali del contenuto
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    setIsEditing(true);
    onContentChange?.(newContent);

    // Invia modifica agli altri utenti con debounce
    const timeoutId = setTimeout(() => {
      if (connected) {
        sendCodeChange(filePath, newContent, cursorPosition);
        console.log('📤 Inviato aggiornamento codice');
      }
      setIsEditing(false);
    }, 300); // Debounce di 300ms

    return () => clearTimeout(timeoutId);
  }, [connected, sendCodeChange, filePath, cursorPosition, onContentChange]);

  // Gestisci movimento cursore
  const handleCursorChange = useCallback((position: number) => {
    setCursorPosition(position);
    
    if (connected) {
      sendCursorChange(filePath, position);
    }
  }, [connected, sendCursorChange, filePath]);

  // Salva file
  const handleSave = () => {
    onSave?.(content);
    toast({
      title: "💾 File salvato",
      description: `${filePath} salvato con successo`,
    });
  };

  // Riconnetti al progetto se necessario
  useEffect(() => {
    if (connected && projectId) {
      joinProject(projectId);
    }
  }, [connected, projectId, joinProject]);

  return (
    <div className="space-y-4">
      {/* Header collaborazione */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Editor Collaborativo
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {/* Stato connessione */}
              {connected ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <Wifi className="h-3 w-3" />
                  Connesso
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <WifiOff className="h-3 w-3" />
                  Disconnesso
                </Badge>
              )}

              {/* Utenti attivi */}
              {totalUsers > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {totalUsers} utent{totalUsers === 1 ? 'e' : 'i'} attiv{totalUsers === 1 ? 'o' : 'i'}
                </Badge>
              )}

              {/* Indicatore editing */}
              {isEditing && (
                <Badge variant="outline" className="animate-pulse">
                  Modificando...
                </Badge>
              )}
            </div>
          </div>

          {/* Errori */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              Errore: {error}
            </div>
          )}

          {/* Info ultimo aggiornamento */}
          {lastUpdate && (
            <div className="text-xs text-gray-500">
              Ultimo aggiornamento: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {/* File path */}
            <div className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
              {filePath}
            </div>

            {/* Editor */}
            <div className="relative">
              <Textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                onSelect={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  handleCursorChange(target.selectionStart);
                }}
                placeholder="Inizia a scrivere il codice..."
                className="font-mono text-sm min-h-[400px] resize-y"
                style={{
                  tabSize: 2,
                  WebkitTabSize: 2,
                }}
              />
              
              {/* Indicatore posizione cursore */}
              <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white px-1 rounded">
                Pos: {cursorPosition}
              </div>
            </div>

            {/* Azioni */}
            <div className="flex gap-2">
              <Button onClick={handleSave} size="sm" className="flex items-center gap-1">
                <Save className="h-4 w-4" />
                Salva File
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (connected) {
                    sendCodeChange(filePath, content, cursorPosition);
                    toast({
                      title: "📤 Sincronizzato",
                      description: "Modifiche inviate agli altri utenti",
                      duration: 2000,
                    });
                  }
                }}
                disabled={!connected}
              >
                Sincronizza Ora
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}