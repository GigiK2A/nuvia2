import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import OpenAI from 'openai';

const router = express.Router();
let openai: OpenAI | null = null;

// Inizializza OpenAI solo se la chiave API è disponibile
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  } else {
    console.log('Chiave API OpenAI non trovata, verranno utilizzati contenuti simulati');
  }
} catch (error) {
  console.error('Errore durante l\'inizializzazione di OpenAI:', error);
}

interface ProjectStructure {
  [key: string]: string[];
}

const baseStructure: ProjectStructure = {
  html: ['index.html', 'style.css', 'script.js'],
  react: ['App.jsx', 'index.js', 'style.css'],
  node: ['server.js', 'routes/api.js', 'package.json'],
};

// Endpoint per la generazione di progetti (supporta entrambi i path)
router.post('/generate-project', handleProjectGeneration);
router.post('/project', handleProjectGeneration);

async function handleProjectGeneration(req: Request, res: Response) {
  const { type, description, prompt } = req.body;
  const projectDescription = description || prompt;
  if (!type || !projectDescription) return res.status(400).json({ error: 'Tipo e descrizione richiesti' });

  try {
    // Verifica se il tipo di progetto è supportato
    if (!baseStructure[type as keyof ProjectStructure]) {
      return res.status(400).json({ error: 'Tipo di progetto non supportato' });
    }

    // Preparazione dei prompt per ogni file
    const files: { filename: string; content: string }[] = [];
    const fileStructure = baseStructure[type as keyof ProjectStructure];

    // Generazione dei file (con OpenAI o simulati)
    for (const filename of fileStructure) {
      const prompt = `Genera il contenuto del file ${filename} per il seguente progetto: ${description}`;
      
      // Usa OpenAI solo se disponibile, altrimenti usa contenuti simulati
      if (!openai || !process.env.OPENAI_API_KEY) {
        const simulatedContent = getSimulatedContent(filename, type, description);
        files.push({ filename, content: simulatedContent });
        continue;
      }
      
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o', // il nuovo modello OpenAI rilasciato a maggio 2024
          messages: [
            { role: 'system', content: 'Genera solo il contenuto del file, senza commenti esterni.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.4,
        });

        const content = completion.choices[0].message.content || '';
        files.push({ filename, content });
      } catch (error) {
        console.error(`Errore durante la generazione con OpenAI per ${filename}:`, error);
        // Fallback a contenuto simulato in caso di errore
        const simulatedContent = getSimulatedContent(filename, type, description);
        files.push({ filename, content: simulatedContent });
      }
    }

    // Creazione della directory per l'output se non esiste
    const outputDir = path.join(process.cwd(), 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Creazione dell'archivio zip
    const zipFilename = `project_${Date.now()}.zip`;
    const zipPath = path.join(outputDir, zipFilename);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    archive.pipe(output);

    // Aggiunta dei file all'archivio
    for (const file of files) {
      archive.append(file.content, { name: file.filename });
    }

    // Finalizzazione dell'archivio
    await archive.finalize();
    
    // Invio dell'archivio al client
    output.on('close', () => {
      res.download(zipPath, 'progetto.zip', (err) => {
        if (err) {
          console.error('Errore durante il download:', err);
          return res.status(500).json({ error: 'Errore durante il download del file' });
        }
        
        // Pulizia: rimuovi il file zip dopo il download
        setTimeout(() => {
          try {
            fs.unlinkSync(zipPath);
            console.log(`File zip rimosso: ${zipPath}`);
          } catch (err) {
            console.error('Errore durante la pulizia del file zip:', err);
          }
        }, 60000); // 1 minuto di attesa
      });
    });

  } catch (err) {
    console.error('Errore generazione progetto:', err);
    return res.status(500).json({ error: 'Errore durante la generazione del progetto' });
  }
}

/**
 * Genera contenuti simulati per i file in base al tipo e alla descrizione
 */
function getSimulatedContent(filename: string, type: string, description: string): string {
  const descriptionSummary = description.substring(0, 30) + '...';
  
  // Template di base per diversi tipi di file
  switch (filename) {
    case 'index.html':
      return `<!DOCTYPE html>
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
</html>`;

    case 'style.css':
      return `/* Stile per il progetto: ${descriptionSummary} */
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
}`;

    case 'script.js':
      return `// JavaScript per il progetto: ${descriptionSummary}
document.addEventListener('DOMContentLoaded', () => {
  console.log('Progetto caricato');
  
  // Esempio di interattività
  const header = document.querySelector('header');
  if (header) {
    header.addEventListener('click', () => {
      alert('Benvenuto nel progetto generato automaticamente!');
    });
  }
});`;

    case 'App.jsx':
      return `import React, { useState } from 'react';
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

export default App;`;

    case 'index.js':
      return `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;

    case 'server.js':
      return `const express = require('express');
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
});`;

    case 'routes/api.js':
      return `const express = require('express');
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

module.exports = router;`;

    case 'package.json':
      return `{
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
}`;

    default:
      return `// Contenuto simulato per ${filename}\n// Generato per il progetto: ${description}`;
  }
}

export default router;