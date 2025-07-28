import React, { useState } from 'react';
import { CollaborativeEditor } from '@/components/collaborative/CollaborativeEditor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Code, Users, Zap } from 'lucide-react';

export default function CollaborativePage() {
  const [projectId, setProjectId] = useState('test-project-1');
  const [filePath, setFilePath] = useState('src/App.js');
  const [isActive, setIsActive] = useState(false);

  const handleStartCollaboration = () => {
    if (projectId && filePath) {
      setIsActive(true);
    }
  };

  const handleContentChange = (content: string) => {
    console.log('📝 Contenuto cambiato:', content.length, 'caratteri');
  };

  const handleSave = (content: string) => {
    console.log('💾 Salvataggio file:', filePath, content.length, 'caratteri');
    // Qui potresti salvare su database o storage
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            Editor Collaborativo in Tempo Reale
          </h1>
          <p className="text-gray-600">
            Collabora sui progetti con altri utenti in tempo reale utilizzando WebSocket
          </p>
        </div>

        {!isActive ? (
          /* Setup iniziale */
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Inizia Collaborazione
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="projectId">ID Progetto</Label>
                <Input
                  id="projectId"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="es: my-awesome-project"
                />
              </div>

              <div>
                <Label htmlFor="filePath">File da Modificare</Label>
                <Input
                  id="filePath"
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  placeholder="es: src/components/App.js"
                />
              </div>

              <Button 
                onClick={handleStartCollaboration} 
                className="w-full flex items-center gap-2"
                disabled={!projectId || !filePath}
              >
                <Code className="h-4 w-4" />
                Avvia Editor Collaborativo
              </Button>

              <div className="text-xs text-gray-500 space-y-1">
                <p>💡 <strong>Suggerimenti:</strong></p>
                <p>• Usa lo stesso ID progetto per collaborare con altri utenti</p>
                <p>• Le modifiche vengono sincronizzate automaticamente</p>
                <p>• Puoi vedere quanti utenti sono attivi nel progetto</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Editor attivo */
          <div className="space-y-4">
            {/* Info progetto */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">Progetto:</span> {projectId}
                  </div>
                  <div>
                    <span className="font-semibold">File:</span> {filePath}
                  </div>
                </div>
                
                <div className="mt-3 flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsActive(false)}
                  >
                    Cambia Progetto
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(window.location.href, '_blank')}
                  >
                    Apri in Nuova Tab (per test)
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Editor collaborativo */}
            <CollaborativeEditor
              projectId={projectId}
              filePath={filePath}
              initialContent={`// File: ${filePath}
// Progetto: ${projectId}
// Inizia a modificare questo file per testare la collaborazione!

function App() {
  console.log("Hello, collaborative world!");
  
  return (
    <div className="app">
      <h1>Il mio progetto collaborativo</h1>
      <p>Modifica questo codice e vedi la magia della sincronizzazione in tempo reale!</p>
    </div>
  );
}

export default App;`}
              onContentChange={handleContentChange}
              onSave={handleSave}
            />
          </div>
        )}

        {/* Istruzioni di test */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🧪 Come Testare la Collaborazione</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-1">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">1</span>
                  Apri Multiple Tab
                </h4>
                <p>Usa il pulsante "Apri in Nuova Tab" per aprire più finestre del browser con lo stesso progetto.</p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-1">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">2</span>
                  Modifica il Codice
                </h4>
                <p>Scrivi in una tab e osserva le modifiche apparire automaticamente nelle altre tab.</p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-1">
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">3</span>
                  Monitor Console
                </h4>
                <p>Apri la Console Dev (F12) per vedere i log di sincronizzazione WebSocket in tempo reale.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}