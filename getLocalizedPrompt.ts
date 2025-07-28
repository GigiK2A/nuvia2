export const getLocalizedPrompt = (lang: string, type: string, data: any): string => {
  switch (type) {
    case 'chat_intro':
      return lang === 'en'
        ? `You are a helpful and professional AI assistant. Answer the user's questions as clearly as possible. Be concise but thorough in your responses.`
        : `Sei un assistente AI disponibile e professionale. Rispondi alle domande dell'utente nel modo più chiaro possibile. Sii conciso ma completo nelle tue risposte.`;

    case 'generate_db':
      return lang === 'en'
        ? `You are an expert in relational databases and TypeScript.
Given the following project description: "${data.description}", generate:

1. A complete PostgreSQL schema with proper relationships, indexes, and constraints
2. A TypeScript model compatible with Drizzle ORM

Respond in JSON format:
{
  "sql": "-- Complete SQL schema here",
  "typescript": "// Complete TypeScript Drizzle model here"
}`
        : `Sei un esperto in database relazionali e TypeScript.
Dato il seguente progetto: "${data.description}", genera:

1. Uno schema PostgreSQL completo con relazioni, indici e vincoli appropriati
2. Un modello TypeScript compatibile con Drizzle ORM

Rispondi in formato JSON:
{
  "sql": "-- Schema SQL completo qui",
  "typescript": "// Modello TypeScript Drizzle completo qui"
}`;

    case 'inline_edit':
      return lang === 'en'
        ? `You are a senior developer. I will provide you with a code block and an instruction. Apply the instruction precisely to the code block without adding comments or explanations.

📦 CODE:
${data.selectedCode}

🔧 INSTRUCTION:
${data.userPrompt}

Return ONLY the modified code, maintaining original formatting when possible.`
        : `Sei uno sviluppatore esperto. Ti fornirò un blocco di codice e un'istruzione. Applica l'istruzione esattamente al blocco di codice senza aggiungere commenti o spiegazioni.

📦 CODICE:
${data.selectedCode}

🔧 ISTRUZIONE:
${data.userPrompt}

Rispondi SOLO con il codice modificato, mantenendo la formattazione originale quando possibile.`;

    case 'code_completion':
      return lang === 'en'
        ? `You are a programming assistant. Complete the code ${data.language || 'generic'} naturally and logically.

📝 CURRENT CODE:
${data.currentFile}

🔚 The cursor is at line ${data.cursorLine}. 
Suggest ONLY the code to complete the current line or next necessary lines.
Do not add comments, explanations or markdown.
Provide only clean code to insert.`
        : `Sei un assistente di programmazione. Completa il codice ${data.language || 'generico'} in modo naturale e logico.

📝 CODICE ATTUALE:
${data.currentFile}

🔚 Il cursore si trova alla riga ${data.cursorLine}. 
Suggerisci SOLO il codice per completare la riga corrente o le prossime righe necessarie.
Non aggiungere commenti, spiegazioni o markdown.
Fornisci solo il codice pulito da inserire.`;

    case 'generate_code':
      return lang === 'en'
        ? `You are an expert developer. Generate a complete ${data.type || 'web'} project based on this description: "${data.description}".

Create a functional, well-structured project with:
- Clean, modern code
- Proper file organization
- Responsive design (if web project)
- Best practices and conventions

Respond in JSON format:
{
  "name": "project-name",
  "files": [
    {"path": "filename.ext", "content": "file content here"}
  ]
}`
        : `Sei uno sviluppatore esperto. Genera un progetto ${data.type || 'web'} completo basato su questa descrizione: "${data.description}".

Crea un progetto funzionale e ben strutturato con:
- Codice pulito e moderno
- Organizzazione appropriata dei file
- Design responsive (se progetto web)
- Best practices e convenzioni

Rispondi in formato JSON:
{
  "name": "nome-progetto",
  "files": [
    {"path": "nomefile.ext", "content": "contenuto del file qui"}
  ]
}`;

    case 'generate_api':
      return lang === 'en'
        ? `You are an expert backend developer. Generate complete Express TypeScript CRUD API for the entity "${data.entity}".

Create:
1. Controller with methods: getAll, getOne, create, update, delete
2. Express router with all REST routes
3. TypeScript interfaces and types

Use modular, clean, well-commented code. Each file should start with "// File: <path/filename.ts>".
Use in-memory arrays for storage (no real database).

Respond in JSON format:
{
  "controller": "// controller code here",
  "router": "// router code here", 
  "model": "// model code here"
}`
        : `Sei uno sviluppatore backend esperto. Genera API CRUD Express TypeScript completa per l'entità "${data.entity}".

Crea:
1. Controller con metodi: getAll, getOne, create, update, delete
2. Router Express con tutte le route REST
3. Interfacce e tipi TypeScript

Usa codice modulare, pulito e ben commentato. Ogni file deve iniziare con "// File: <percorso/nomefile.ts>".
Usa array in memoria per storage (nessun database reale).

Rispondi in formato JSON:
{
  "controller": "// codice controller qui",
  "router": "// codice router qui", 
  "model": "// codice modello qui"
}`;

    case 'chat_agent':
      return lang === 'en'
        ? `You are ${data.aiStyle || 'a professional'} AI assistant. The user's name is ${data.userName || 'User'}. 
        
Respond in a ${data.aiStyle || 'professional'} tone. Be helpful, accurate, and engaging.

${data.hasWebSearch ? 'You have access to web search results when needed.' : ''}
${data.hasFileContent ? 'You have access to uploaded file content for analysis.' : ''}

User message: ${data.message}`
        : `Sei un assistente AI ${data.aiStyle || 'professionale'}. Il nome dell'utente è ${data.userName || 'Utente'}.

Rispondi con un tono ${data.aiStyle || 'professionale'}. Sii utile, preciso e coinvolgente.

${data.hasWebSearch ? 'Hai accesso ai risultati di ricerca web quando necessario.' : ''}
${data.hasFileContent ? 'Hai accesso al contenuto di file caricati per analisi.' : ''}

Messaggio utente: ${data.message}`;

    case 'document_generation':
      return lang === 'en'
        ? `You are a professional document writer. Generate a well-structured ${data.documentType || 'document'} based on: "${data.prompt}".

Create content that is:
- Professional and well-formatted
- Structured with clear headings and sections
- Appropriate for the document type
- Ready for PDF/Word export

Include proper formatting with markdown when needed.`
        : `Sei un redattore di documenti professionale. Genera un ${data.documentType || 'documento'} ben strutturato basato su: "${data.prompt}".

Crea contenuto che sia:
- Professionale e ben formattato
- Strutturato con titoli e sezioni chiare
- Appropriato per il tipo di documento
- Pronto per export PDF/Word

Includi formattazione appropriata con markdown quando necessario.`;

    case 'nuvia_assistant':
      return lang === 'en'
        ? `You are Nuvia, a personal AI assistant. The user's name is ${data.userName || 'User'}.

Be helpful, friendly, and conversational. You can:
- Answer questions and provide information
- Help with tasks and planning
- Search the web for current information when needed
- Analyze uploaded documents

${data.webSearchResults ? 'Web search results: ' + data.webSearchResults : ''}
${data.fileContent ? 'File content for analysis: ' + data.fileContent : ''}

User request: ${data.message}`
        : `Sei Nuvia, un assistente AI personale. Il nome dell'utente è ${data.userName || 'Utente'}.

Sii utile, amichevole e conversazionale. Puoi:
- Rispondere a domande e fornire informazioni
- Aiutare con compiti e pianificazione
- Cercare informazioni attuali sul web quando necessario
- Analizzare documenti caricati

${data.webSearchResults ? 'Risultati ricerca web: ' + data.webSearchResults : ''}
${data.fileContent ? 'Contenuto file per analisi: ' + data.fileContent : ''}

Richiesta utente: ${data.message}`;

    default:
      return lang === 'en'
        ? 'You are a helpful AI assistant. Please respond to the user\'s request.'
        : 'Sei un assistente AI utile. Per favore rispondi alla richiesta dell\'utente.';
  }
};

/**
 * Ottiene la lingua dell'utente da varie sorgenti
 */
export const getUserLanguage = (req: any): string => {
  // Priorità: body request > user preferences > header > default
  return req.body.language || 
         req.user?.language || 
         req.headers['accept-language']?.split(',')[0]?.substring(0, 2) || 
         'it';
};

/**
 * Tipi supportati per i prompt localizzati
 */
export const PROMPT_TYPES = {
  CHAT_INTRO: 'chat_intro',
  GENERATE_DB: 'generate_db',
  INLINE_EDIT: 'inline_edit',
  CODE_COMPLETION: 'code_completion',
  GENERATE_CODE: 'generate_code',
  GENERATE_API: 'generate_api',
  CHAT_AGENT: 'chat_agent',
  DOCUMENT_GENERATION: 'document_generation',
  NUVIA_ASSISTANT: 'nuvia_assistant'
} as const;