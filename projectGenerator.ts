/**
 * Service per la generazione di progetti multi-file
 */

/**
 * Simula la generazione di un progetto completo multi-file
 * @param prompt Descrizione del progetto da generare
 * @param type Tipo di progetto (react, node, html, express, ecc.)
 * @returns Oggetto contenente il nome del progetto e i file generati
 */
export async function simulateProjectGeneration(
  prompt: string, 
  type: string
): Promise<{
  name: string;
  files: Record<string, string>;
}> {
  console.log(`Simulando generazione progetto di tipo: ${type}`);
  
  // Crea un nome semplice per il progetto basato sul prompt
  const projectName = prompt
    .toLowerCase()
    .split(' ')
    .slice(0, 3)
    .join('-')
    .replace(/[^a-z0-9-]/g, '')
    .substring(0, 30);
  
  // Oggetto che conterrà i file generati
  const files: Record<string, string> = {};
  
  // Genera file diversi in base al tipo di progetto
  if (type === 'html' || type === 'static') {
    files['index.html'] = generateHtmlTemplate(prompt);
    files['style.css'] = generateCssTemplate(prompt);
    files['script.js'] = generateJsTemplate(prompt);
    files['README.md'] = generateReadme(prompt, type);
  } 
  else if (type === 'react') {
    files['App.jsx'] = generateReactAppTemplate(prompt);
    files['index.js'] = generateReactIndexTemplate();
    files['style.css'] = generateReactCssTemplate(prompt);
    files['package.json'] = generatePackageJson(prompt, 'react');
    files['README.md'] = generateReadme(prompt, type);
  }
  else if (type === 'express' || type === 'node') {
    files['server.js'] = generateExpressServerTemplate(prompt);
    files['routes/api.js'] = generateExpressRoutesTemplate(prompt);
    files['package.json'] = generatePackageJson(prompt, 'express');
    files['README.md'] = generateReadme(prompt, type);
  }
  
  // Ritorna il progetto simulato
  return {
    name: projectName || 'progetto-generato',
    files
  };
}

/**
 * Genera un template HTML di base
 */
function generateHtmlTemplate(description: string): string {
  const descriptionSummary = description.substring(0, 30) + '...';
  
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
}

/**
 * Genera un template CSS di base
 */
function generateCssTemplate(description: string): string {
  const descriptionSummary = description.substring(0, 30) + '...';
  
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
}

/**
 * Genera un template JavaScript di base
 */
function generateJsTemplate(description: string): string {
  const descriptionSummary = description.substring(0, 30) + '...';
  
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
}

/**
 * Genera un template React App di base
 */
function generateReactAppTemplate(description: string): string {
  const descriptionSummary = description.substring(0, 30) + '...';
  
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
}

/**
 * Genera un template React index di base
 */
function generateReactIndexTemplate(): string {
  return `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;
}

/**
 * Genera un template React CSS di base
 */
function generateReactCssTemplate(description: string): string {
  const descriptionSummary = description.substring(0, 30) + '...';
  
  return `/* Stile per il progetto React: ${descriptionSummary} */
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
}`;
}

/**
 * Genera un template Express server di base
 */
function generateExpressServerTemplate(description: string): string {
  const descriptionSummary = description.substring(0, 30) + '...';
  
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
}

/**
 * Genera un template Express routes di base
 */
function generateExpressRoutesTemplate(description: string): string {
  const descriptionSummary = description.substring(0, 30) + '...';
  
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
}

/**
 * Genera un package.json in base al tipo di progetto
 */
function generatePackageJson(description: string, type: string): string {
  const projectName = description
    .toLowerCase()
    .split(' ')
    .slice(0, 3)
    .join('-')
    .replace(/[^a-z0-9-]/g, '')
    .substring(0, 30) || 'progetto-generato';
    
  if (type === 'react') {
    return `{
  "name": "${projectName}",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}`;
  } else {
    return `{
  "name": "${projectName}",
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
  }
}

/**
 * Genera un README per il progetto
 */
function generateReadme(description: string, type: string): string {
  const descriptionSummary = description.substring(0, 30) + '...';
  const projectName = description
    .toLowerCase()
    .split(' ')
    .slice(0, 3)
    .join('-')
    .replace(/[^a-z0-9-]/g, '')
    .substring(0, 30) || 'progetto-generato';
    
  let content = `# ${projectName}

## Descrizione
${description}

`;

  if (type === 'html' || type === 'static') {
    content += `## Come avviare
Apri semplicemente il file \`index.html\` nel tuo browser per vedere il progetto.

## Struttura
- \`index.html\`: La pagina principale
- \`style.css\`: Gli stili CSS
- \`script.js\`: La logica JavaScript

## Funzionalità
- Layout responsive
- Interfaccia utente semplice e moderna
- Interattività di base tramite JavaScript
`;
  } else if (type === 'react') {
    content += `## Come avviare
1. Assicurati di avere Node.js installato
2. Esegui \`npm install\` per installare le dipendenze
3. Esegui \`npm start\` per avviare il server di sviluppo
4. Apri \`http://localhost:3000\` nel tuo browser

## Struttura
- \`App.jsx\`: Il componente principale
- \`index.js\`: Punto di ingresso dell'applicazione
- \`style.css\`: Gli stili CSS

## Tecnologie
- React 18
- React Hooks
- CSS3
`;
  } else if (type === 'express' || type === 'node') {
    content += `## Come avviare
1. Assicurati di avere Node.js installato
2. Esegui \`npm install\` per installare le dipendenze
3. Esegui \`npm start\` per avviare il server
   - In alternativa, usa \`npm run dev\` per avviare con hot-reload
4. Il server sarà disponibile su \`http://localhost:3000\`

## Endpoint API
- \`GET /\`: Informazioni sul server
- \`GET /api\`: Informazioni sull'API
- \`GET /api/data\`: Ottieni dati di esempio
- \`POST /api/data\`: Aggiungi un nuovo elemento

## Tecnologie
- Node.js
- Express
- RESTful API
`;
  }

  content += `\n## Generato con AI
Questo progetto è stato generato automaticamente in base alla descrizione: "${description}".
`;

  return content;
}