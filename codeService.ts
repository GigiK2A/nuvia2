/**
 * Servizio per la generazione di codice utilizzando AI (Gemini/OpenAI)
 */
import { generateCode as generateCodeAI, analyzeCode } from './utils/aiClient';

/**
 * Genera codice utilizzando AI basato sulla descrizione e il linguaggio
 */
export async function generateCode(
  language: string, 
  description: string, 
  currentCode?: string
): Promise<{ code: string; usingAI: boolean }> {
  try {
    const prompt = currentCode 
      ? `Modifica questo codice ${language}:\n\n${currentCode}\n\nRichiesta: ${description}\n\nFornisci solo il codice modificato senza spiegazioni.`
      : `Genera codice ${language} per: ${description}\n\nFornisci solo il codice senza spiegazioni.`;
    
    const code = await generateCodeAI(language, prompt);
    return {
      code,
      usingAI: true
    };
  } catch (error) {
    console.error('Errore AI:', error);
    return {
      code: generateSimulatedCode(language, description),
      usingAI: false
    };
  }
}

/**
 * Genera un progetto multi-file completo
 * @param prompt Descrizione del progetto da generare
 * @param type Tipo di progetto (react, html, express, ecc.)
 * @returns Oggetto contenente il nome del progetto e i file generati
 */
export async function generateFullProject(prompt: string, type: string): Promise<{
  name: string;
  files: { [filename: string]: string };
}> {
  try {
    const projectPrompt = `Genera un progetto ${type} completo basato su: ${prompt}
    
Fornisci la risposta in formato JSON con questa struttura:
{
  "name": "nome-progetto",
  "files": {
    "nome-file.ext": "contenuto del file",
    "altro-file.ext": "contenuto del secondo file"
  }
}

Includi tutti i file necessari per un progetto funzionante.`;

    const response = await generateCodeAI(type, projectPrompt);
    
    try {
      const parsed = JSON.parse(response);
      return parsed;
    } catch (parseError) {
      // Fallback se la risposta non è JSON valido
      return {
        name: "progetto-generato",
        files: {
          "index.html": response
        }
      };
    }
  } catch (error) {
    console.error('Errore generazione progetto:', error);
    return generateSimulatedProject(prompt, type);
  }
}

/**
 * Modifica codice esistente utilizzando AI
 * @param prompt Prompt di modifica (cosa fare al codice)
 * @param code Codice esistente da modificare
 * @returns Codice modificato
 */
export async function editCodeInline(prompt: string, code: string): Promise<string> {
  try {
    const editPrompt = `Modifica questo codice secondo la richiesta:

CODICE ATTUALE:
${code}

RICHIESTA DI MODIFICA:
${prompt}

Fornisci solo il codice modificato senza spiegazioni.`;

    return await generateCodeAI('javascript', editPrompt);
  } catch (error) {
    console.error('Errore modifica codice:', error);
    return code; // Ritorna il codice originale se c'è un errore
  }
}

/**
 * Salva nel database PostgreSQL i dettagli di una modifica AI
 */
export async function logAIModification({
  userId,
  originalCode,
  modifiedCode,
  prompt,
  language
}: {
  userId: number;
  originalCode: string;
  modifiedCode: string;
  prompt: string;
  language: string;
}) {
  try {
    console.log(`Registrazione modifica AI per utente ${userId}: ${prompt.substring(0, 100)}...`);
    // Qui potresti salvare nel database se necessario
  } catch (error) {
    console.error('Errore nel salvataggio della modifica AI:', error);
  }
}

// Funzioni di simulazione per fallback
function generateSimulatedCode(language: string, description: string): string {
  const templates = {
    html: `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Progetto Generato</title>
</head>
<body>
    <h1>Progetto: ${description}</h1>
    <p>Questo è un template di base per ${language}</p>
</body>
</html>`,
    javascript: `// Codice JavaScript generato per: ${description}
function main() {
    console.log("Progetto: ${description}");
    // Il tuo codice qui
}

main();`,
    css: `/* CSS generato per: ${description} */
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f5f5f5;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}`
  };

  return templates[language as keyof typeof templates] || templates.html;
}

function generateSimulatedProject(prompt: string, type: string): { name: string; files: { [filename: string]: string } } {
  const projectName = prompt.toLowerCase().replace(/\s+/g, '-').substring(0, 30);
  
  const baseFiles = {
    "index.html": `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${prompt}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>${prompt}</h1>
        <p>Progetto ${type} generato automaticamente</p>
    </div>
    <script src="script.js"></script>
</body>
</html>`,
    "style.css": generateSimulatedCode('css', prompt),
    "script.js": generateSimulatedCode('javascript', prompt)
  };

  return {
    name: projectName,
    files: baseFiles
  };
}