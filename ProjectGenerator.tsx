import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FileDown, Code, Package, FileCode, Edit, Eye, Save, FileArchive } from 'lucide-react';

// Definizione locale del tipo per evitare import dal server
type ProjectGenerationRequest = {
  type: "html" | "react" | "node";
  description: string;
};

interface ProjectFile {
  filename: string;
  content: string;
  language: string; // per la sintassi evidenziata
}

const ProjectGenerator: React.FC = () => {
  const [projectType, setProjectType] = useState<string>('html');
  const [description, setDescription] = useState<string>('');
  const [generationStatus, setGenerationStatus] = useState<string>('idle');
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [step, setStep] = useState<'configure' | 'edit' | 'preview'>('configure');
  const { toast } = useToast();

  // Funzione per determinare il linguaggio per la sintassi evidenziata
  const getLanguageForFile = (filename: string): string => {
    if (filename.endsWith('.html')) return 'html';
    if (filename.endsWith('.css')) return 'css';
    if (filename.endsWith('.js')) return 'javascript';
    if (filename.endsWith('.jsx')) return 'jsx';
    if (filename.endsWith('.json')) return 'json';
    if (filename.endsWith('.md')) return 'markdown';
    return 'text';
  };

  // Generazione del progetto - Nuovo approccio: ottiene il JSON dei file invece del blob
  const generateProjectMutation = useMutation({
    mutationFn: async (data: ProjectGenerationRequest): Promise<{ files: { filename: string; content: string }[] }> => {
      setGenerationStatus('generating');
      try {
        // Simuliamo la generazione dei file in base al tipo di progetto
        const response = await fetch('/api/generate-project', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, format: 'json' }) // richiediamo il formato JSON
        });
        
        if (!response.ok) {
          throw new Error(`Errore nella richiesta: ${response.status}`);
        }
        
        // Se il server non supporta ancora il formato JSON, usiamo i dati simulati
        try {
          return await response.json();
        } catch (e) {
          console.log('Server non supporta ancora il formato JSON, uso dati simulati');
          // Dati simulati per dimostrare il flusso
          return {
            files: generateSimulatedFiles(data.type, data.description)
          };
        }
      } catch (error) {
        console.error('Errore durante la richiesta:', error);
        // Generazione simulata in caso di errore del server
        return {
          files: generateSimulatedFiles(data.type, data.description)
        };
      }
    },
    onSuccess: (data) => {
      setGenerationStatus('success');
      
      // Converte i file ricevuti nel formato richiesto dall'interfaccia
      const files = data.files.map(file => ({
        filename: file.filename,
        content: file.content,
        language: getLanguageForFile(file.filename)
      }));
      
      setProjectFiles(files);
      
      // Imposta il primo file come attivo
      if (files.length > 0) {
        setActiveTab(files[0].filename);
        setSelectedFile(files[0]);
      }
      
      // Passa alla fase di modifica
      setStep('edit');
      
      toast({
        title: 'Progetto generato con successo',
        description: 'Ora puoi visualizzare e modificare i file prima di esportarli',
      });
    },
    onError: (error) => {
      setGenerationStatus('error');
      toast({
        title: 'Errore',
        description: 'Si è verificato un errore durante la generazione del progetto',
        variant: 'destructive',
      });
      console.error('Errore generazione progetto:', error);
    }
  });
  
  // Funzione per generare file simulati quando il server non supporta ancora il formato JSON
  const generateSimulatedFiles = (type: string, description: string): { filename: string; content: string }[] => {
    const descriptionSummary = description.substring(0, 30) + '...';
    
    switch (type) {
      case 'html':
        return [
          {
            filename: 'index.html',
            content: `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${descriptionSummary}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header>
    <h1>Progetto: ${descriptionSummary}</h1>
  </header>
  <main>
    <p>Questo è un progetto generato automaticamente basato sulla descrizione: ${description}</p>
  </main>
  <footer>
    <p>© ${new Date().getFullYear()} - Generato con AI</p>
  </footer>
  <script src="script.js"></script>
</body>
</html>`
          },
          {
            filename: 'style.css',
            content: `/* Stile per il progetto: ${descriptionSummary} */
body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  background-color: #f5f5f5;
  padding: 20px;
  border-radius: 5px;
  margin-bottom: 20px;
}

h1 {
  color: #2c3e50;
}

footer {
  margin-top: 50px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  text-align: center;
  color: #7f8c8d;
}`
          },
          {
            filename: 'script.js',
            content: `// JavaScript per il progetto: ${descriptionSummary}
document.addEventListener('DOMContentLoaded', () => {
  console.log('Progetto caricato');
  
  // Esempio di interattività
  const header = document.querySelector('header');
  if (header) {
    header.addEventListener('click', () => {
      alert('Benvenuto nel progetto generato automaticamente!');
    });
  }
});`
          }
        ];
      
      case 'react':
        return [
          {
            filename: 'App.jsx',
            content: `import React, { useState } from 'react';
import './style.css';

function App() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="App">
      <header className="App-header">
        <h1>Progetto React: ${descriptionSummary}</h1>
        <p>
          Descrizione completa: ${description}
        </p>
        <button onClick={() => setCount(count + 1)}>
          Hai cliccato {count} volte
        </button>
      </header>
    </div>
  );
}

export default App;`
          },
          {
            filename: 'index.js',
            content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`
          },
          {
            filename: 'style.css',
            content: `/* Stile per il progetto React: ${descriptionSummary} */
.App {
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.App-header {
  background-color: #f8f9fa;
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  padding: 2rem;
}

h1 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
}

button {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #2980b9;
}`
          }
        ];
        
      case 'node':
        return [
          {
            filename: 'server.js',
            content: `const express = require('express');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Middleware di logging
app.use((req, res, next) => {
  console.log(\`\${new Date().toISOString()} \${req.method} \${req.url}\`);
  next();
});

// Attiva le rotte dell'API
app.use('/api', apiRoutes);

// Rotta root
app.get('/', (req, res) => {
  res.json({ 
    message: 'Server attivo',
    project: '${descriptionSummary}',
    description: '${description}'
  });
});

// Gestione errori
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Si è verificato un errore interno' });
});

app.listen(PORT, () => {
  console.log(\`Server in esecuzione su http://localhost:\${PORT}\`);
});`
          },
          {
            filename: 'routes/api.js',
            content: `const express = require('express');
const router = express.Router();

/**
 * GET /api
 * Ottiene informazioni sull'API
 */
router.get('/', (req, res) => {
  res.json({
    name: 'API per ${descriptionSummary}',
    version: '1.0.0',
    description: '${description}'
  });
});

/**
 * GET /api/data
 * Restituisce alcuni dati di esempio
 */
router.get('/data', (req, res) => {
  res.json([
    { id: 1, name: 'Elemento 1', value: 100 },
    { id: 2, name: 'Elemento 2', value: 200 },
    { id: 3, name: 'Elemento 3', value: 300 }
  ]);
});

/**
 * POST /api/data
 * Simula l'aggiunta di un nuovo elemento
 */
router.post('/data', (req, res) => {
  const { name, value } = req.body;
  
  if (!name || !value) {
    return res.status(400).json({ error: 'Dati mancanti' });
  }
  
  // Simulazione di creazione di un nuovo elemento
  res.status(201).json({
    id: Date.now(),
    name,
    value,
    created: new Date().toISOString()
  });
});

module.exports = router;`
          },
          {
            filename: 'package.json',
            content: `{
  "name": "${type}-project",
  "version": "1.0.0",
  "description": "${description.replace(/"/g, '\\"')}",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \\"Error: no test specified\\" && exit 1"
  },
  "keywords": [
    "node",
    "express",
    "api"
  ],
  "author": "Generato con AI",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}`
          }
        ];
      
      default:
        return [
          {
            filename: 'README.md',
            content: `# Progetto ${type}
            
## Descrizione
${description}

## Generato automaticamente
Questo progetto è stato generato automaticamente con AI.`
          }
        ];
    }
  };
  
  // Mutation per esportare il progetto come ZIP
  const exportProjectMutation = useMutation({
    mutationFn: async () => {
      // Creiamo un oggetto FormData con i file aggiornati
      const formData = new FormData();
      
      // Aggiungiamo ogni file al FormData
      projectFiles.forEach(file => {
        // Creiamo un Blob per ogni file
        const blob = new Blob([file.content], { type: 'text/plain' });
        formData.append('files', blob, file.filename);
      });
      
      formData.append('type', projectType);
      formData.append('description', description);
      
      // Facciamo la richiesta per ottenere il ZIP
      const response = await fetch('/api/export-project', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Errore nella richiesta: ${response.status}`);
      }
      
      return await response.blob();
    },
    onSuccess: (blob) => {
      // Crea un URL per il blob e avvia il download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'progetto.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Progetto esportato con successo',
        description: 'Il download del file ZIP dovrebbe iniziare automaticamente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Errore',
        description: 'Si è verificato un errore durante l\'esportazione del progetto',
        variant: 'destructive',
      });
      console.error('Errore esportazione progetto:', error);
      
      // Fallback: Generiamo ZIP lato client se la richiesta al server fallisce
      try {
        generateClientSideZip();
      } catch (e) {
        console.error('Anche il fallback di generazione ZIP è fallito:', e);
      }
    }
  });
  
  // Funzione per generare ZIP lato client come fallback
  const generateClientSideZip = () => {
    // Verifichiamo prima se abbiamo file da esportare
    if (projectFiles.length === 0) {
      toast({
        title: 'Errore',
        description: 'Nessun file da esportare',
        variant: 'destructive',
      });
      return;
    }
    
    // In un'implementazione reale, qui utilizzeremmo una libreria come JSZip
    // Ma per semplicità, inviamo di nuovo una richiesta al server per il ZIP originale
    fetch('/api/generate-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        type: projectType, 
        description
      })
    })
    .then(response => {
      if (!response.ok) throw new Error('Errore nel fallback');
      return response.blob();
    })
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'progetto.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Fallback attivato',
        description: 'Il download dei file originali dovrebbe iniziare automaticamente',
      });
    })
    .catch(error => {
      console.error('Fallback fallito:', error);
      toast({
        title: 'Errore critico',
        description: 'Impossibile esportare il progetto',
        variant: 'destructive',
      });
    });
  };

  // Gestione dell'update di un file
  const handleFileContentChange = (content: string) => {
    if (!selectedFile) return;
    
    // Aggiorna il file selezionato
    const updatedFiles = projectFiles.map(file => 
      file.filename === selectedFile.filename 
        ? { ...file, content } 
        : file
    );
    
    setProjectFiles(updatedFiles);
    setSelectedFile({ ...selectedFile, content });
  };
  
  // Export ZIP manuale
  const handleExportZip = () => {
    exportProjectMutation.mutate();
  };
  
  // Tornare alla configurazione
  const handleBackToConfig = () => {
    setStep('configure');
    setProjectFiles([]);
    setSelectedFile(null);
    setActiveTab('');
  };
  
  // Submit della configurazione iniziale
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      toast({
        title: 'Errore',
        description: 'La descrizione del progetto è obbligatoria',
        variant: 'destructive',
      });
      return;
    }
    
    generateProjectMutation.mutate({
      type: projectType as "html" | "react" | "node",
      description: description.trim()
    });
  };

  const projectTypes = [
    {
      id: 'html',
      name: 'HTML/CSS/JS',
      description: 'Sito web statico con HTML, CSS e JavaScript',
      icon: <FileCode className="h-6 w-6 text-blue-500" />
    },
    {
      id: 'react',
      name: 'React',
      description: 'Applicazione React con componenti e styling',
      icon: <Code className="h-6 w-6 text-teal-500" />
    },
    {
      id: 'node',
      name: 'Node.js',
      description: 'Backend API con Express e struttura base',
      icon: <Package className="h-6 w-6 text-green-500" />
    }
  ];

  return (
    <section className="flex-1 flex flex-col overflow-hidden">
      <div className="border-b border-border bg-card px-4 py-3 sticky top-0 md:top-0 z-10 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Genera Progetto Completo</h2>
        {step === 'edit' && (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleBackToConfig}
            >
              Torna alla configurazione
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={handleExportZip}
              disabled={exportProjectMutation.isPending}
              className="flex items-center gap-1"
            >
              <FileArchive className="h-4 w-4" />
              {exportProjectMutation.isPending ? 'Esportazione...' : 'Esporta ZIP'}
            </Button>
          </div>
        )}
      </div>

      {step === 'configure' && (
        <div className="flex-1 p-4 md:p-8 overflow-auto">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-xl font-medium">Tipo di Progetto</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {projectTypes.map((type) => (
                    <Card 
                      key={type.id}
                      className={`p-4 cursor-pointer hover:border-primary transition-colors ${
                        projectType === type.id ? 'border-2 border-primary' : ''
                      }`}
                      onClick={() => setProjectType(type.id)}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="mb-2">{type.icon}</div>
                        <h4 className="font-medium">{type.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="description">Descrizione del Progetto</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 h-40"
                    placeholder="Descrivi dettagliatamente il progetto che desideri creare, incluse le funzionalità, lo stile e qualsiasi altra specifica..."
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Più dettagli fornisci, migliori saranno i file generati.
                  </p>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full flex items-center justify-center"
                disabled={generateProjectMutation.isPending || !description.trim()}
              >
                {generateProjectMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generazione in corso...
                  </>
                ) : (
                  <>
                    <Code className="mr-2 h-4 w-4" />
                    Genera Progetto
                  </>
                )}
              </Button>
            </form>

            {generationStatus === 'error' && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-lg">
                <p className="text-center">
                  Si è verificato un errore durante la generazione del progetto.
                  Controlla la console per maggiori dettagli o riprova.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 'edit' && projectFiles.length > 0 && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-border bg-muted/30">
            <TabsList className="w-full overflow-x-auto flex-wrap justify-start">
              {projectFiles.map((file) => (
                <TabsTrigger
                  key={file.filename}
                  value={file.filename}
                  className={`${activeTab === file.filename ? 'bg-primary text-primary-foreground' : ''}`}
                  onClick={() => {
                    setActiveTab(file.filename);
                    setSelectedFile(file);
                  }}
                >
                  {file.filename}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-hidden">
            {selectedFile && (
              <div className="h-full flex flex-col">
                <div className="p-4 flex-1 overflow-auto border-0">
                  <Textarea
                    value={selectedFile.content}
                    onChange={(e) => handleFileContentChange(e.target.value)}
                    className="h-full min-h-[500px] font-mono text-sm resize-none"
                    placeholder="// Modifica il codice qui..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default ProjectGenerator;