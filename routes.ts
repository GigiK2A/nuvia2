import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { initializeSocketServer } from "./socketServer";
import { z } from "zod";
import { generateAIResponse } from "./utils/aiClient";
import { simulateCodeGeneration } from "../client/src/lib/utils/simulateCodeAI";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { generatePdf } from "./pdf/pdfMakeService";
import { getWebSummary } from "./websearch";
import { generateChatResponse, generateChatResponseWithRole, generateChatResponseWithMemory } from "./chatService";
import { contextMemory } from "./contextMemory";
import { searchWeb } from './browser/searchWeb';
import { fetchPageContent } from './browser/fetchPageContent';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import { registerUploadRoutes } from "./uploadRoutes";
import { generateJWT, verifyPassword, hashPassword, authenticateToken } from './auth';
import { fileMemory } from "./fileProcessor";
import generateProjectRouter from "./generateProject";
import authRouter from "./authRoutes";
import projectRouter from "./projectRoutes";
import userSettingsRouter from "./userSettingsRoutes";
import settingsRouter from "./settingsRoutes";
import preferencesRouter from "./preferencesRoutes";
import assistantRouter from "./assistantRoutes";
import geminiRouter from "./geminiRouter";
import chatHistoryRouter from "./routes/chatHistory";
import { generateFullProject, editCodeInline, logAIModification } from "./codeService";
import { getUserPreferences, updateUserPreferences } from "./userPreferences";
import { verifyToken as authenticate } from "./authConfig";
import { handleDeploy } from "./deployHandler";
import { downloadZipHandler } from "./zipHandler";
import { searchAndPrompt } from "./utils/webBrowse";
import { processNuviaRequest } from "./utils/aiClient";
import { db } from "./db/database";
import { events } from "../shared/schema";
import { exportProject } from './exportHandler';

// Schema for chat request
const chatRequestSchema = z.object({
  message: z.string(),
  history: z.array(
    z.object({
      role: z.string(),
      content: z.string(),
    })
  ),
});

// Schema for document generation request
const documentGenerationRequestSchema = z.object({
  prompt: z.string(),
  options: z.object({
    style: z.string(),
    language: z.string(),
  }),
});

// Schema for code generation request
const codeGenerationRequestSchema = z.object({
  prompt: z.string(),
  language: z.string(),
  history: z.array(
    z.object({
      role: z.string(),
      content: z.string(),
    })
  ),
  currentCode: z.string().optional(),
});

// Schema for document export request
const documentExportRequestSchema = z.object({
  content: z.string(),
  options: z.object({
    format: z.enum(["pdf", "docx"]),
    layout: z.enum(["standard", "compact"]),
    style: z.enum(["moderno", "classico", "minimale", "accademico"]),
  }),
});

// Configurazione multer per upload file
const upload = multer({ storage: multer.memoryStorage() });

// Nota: Usiamo stripHtml importato da pdfHelper.ts

export async function registerRoutes(app: Express, skipAuthAndProjectRoutes = false): Promise<Server> {
  // Traditional login endpoint
  app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ 
          message: 'Username e password sono richiesti' 
        });
      }

      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ 
          message: 'Credenziali non valide' 
        });
      }

      const isValidPassword = await storage.verifyPassword(user.id, password);
      
      if (!isValidPassword) {
        return res.status(401).json({ 
          message: 'Credenziali non valide' 
        });
      }

      const token = generateJWT({
        userId: user.id,
        username: user.username,
        role: user.role
      });

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        message: 'Errore interno del server' 
      });
    }
  });

  // JWT-based user authentication endpoint
  app.get('/api/auth/user', authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: 'Utente non trovato' });
      }

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Errore interno del server' });
    }
  });

  // Admin endpoint to create new users
  app.post('/api/admin/users', authenticateToken, async (req: any, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Accesso negato: solo gli amministratori possono creare utenti' });
      }

      const { username, email, password, role = 'user' } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ 
          message: 'Username, email e password sono richiesti' 
        });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ 
          message: 'Username già esistente' 
        });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const newUser = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        role: role as 'admin' | 'user'
      });

      res.status(201).json({
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ 
        message: 'Errore interno del server' 
      });
    }
  });

  // Get all users (admin only)
  app.get('/api/admin/users', authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Accesso negato: solo gli amministratori possono visualizzare gli utenti' });
      }

      const users = Array.from((storage as any).users.values()).map((user: any) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }));

      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ 
        message: 'Errore interno del server' 
      });
    }
  });

  // Legacy authentication endpoint (for backward compatibility)
  app.get('/auth/user', (req, res) => {
    res.json({
      id: 'demo-user',
      email: 'user@workspaceexample.com',
      name: 'Workspace User',
      picture: 'https://via.placeholder.com/40'
    });
  });

  // Registra le rotte per il caricamento dei file
  registerUploadRoutes(app);
  
  // Document generation endpoint (BEFORE authenticated routers to avoid JWT blocking)
  app.post("/api/document/generate", async (req, res) => {
    try {
      const { prompt, options } = documentGenerationRequestSchema.parse(req.body);
      
      console.log(`📝 [DOCUMENT AI] Generazione documento per: "${prompt.slice(0, 50)}..."`);
      console.log(`⚙️ [OPTIONS] Stile: ${options.style}, Lingua: ${options.language}`);
      
      // Generate document using AI
      const documentPrompt = `Genera un documento professionale e ben strutturato basato su questa richiesta: "${prompt}"

Requisiti:
- Stile: ${options.style}
- Lingua: ${options.language}
- Formato: HTML ben strutturato con tag semantici
- Includi titoli, sottotitoli, paragrafi, liste quando appropriato
- Usa tag HTML come: h1, h2, h3, p, ul, ol, li, strong, em
- Crea contenuto dettagliato e informativo
- Il documento deve essere completo e pronto per l'uso

Restituisci solo il contenuto HTML senza <html>, <head> o <body>.`;

      const content = await generateAIResponse(documentPrompt);
      
      console.log(`✅ [DOCUMENT SUCCESS] Documento generato: ${content.slice(0, 100)}...`);
      
      // Store the generated document in memory
      const docId = await storage.createDocument({
        content,
        options,
        createdAt: new Date().toISOString(),
      });
      
      res.json({
        docId,
        content,
        response: "Documento generato con successo!",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ [DOCUMENT ERROR]:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid request data", details: error.errors });
      } else {
        res.status(500).json({ message: "Error generating document", error: error instanceof Error ? error.message : "Unknown error" });
      }
    }
  });

  // Document export endpoint (BEFORE authenticated routers to avoid JWT blocking)
  app.post("/api/document/export", async (req, res) => {
    try {
      const { content, options } = documentExportRequestSchema.parse(req.body);
      
      if (options.format === "pdf") {
        // Genera un PDF con pdfmake che mantiene la formattazione semantica con stili
        try {
          // Genera il PDF con pdfmake utilizzando docDefinition semantico
          const pdfBuffer = await generatePdf(content, {
            layout: options.layout,
            style: options.style
          });
          
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="documento.pdf"`
          );
          res.send(pdfBuffer);
        } catch (error) {
          console.error("Errore nella generazione PDF avanzata:", error);
          res.status(500).json({ message: "Errore nella generazione del PDF" });
        }
      } else if (options.format === "docx") {
        // Genera un documento Word con docx
        try {
          const doc = new Document({
            sections: [
              {
                properties: {},
                children: [
                  new Paragraph({
                    children: [new TextRun(content)]
                  })
                ]
              }
            ]
          });
          
          const buffer = await Packer.toBuffer(doc);
          
          res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="documento.docx"`
          );
          res.send(buffer);
        } catch (error) {
          console.error("Errore nella generazione DOCX:", error);
          res.status(500).json({ message: "Errore nella generazione del documento Word" });
        }
      } else {
        res.status(400).json({ message: "Formato non supportato" });
      }
    } catch (error) {
      console.error("Errore nell'export del documento:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid request data", details: error.errors });
      } else {
        res.status(500).json({ message: "Errore nell'export del documento" });
      }
    }
  });

  // Document export endpoint with format in URL (BEFORE authenticated routers to avoid JWT blocking)
  app.post("/api/document/export/:format", async (req, res) => {
    try {
      const { format } = req.params;
      const { content, options } = req.body;
      
      if (format === "pdf") {
        // Generate PDF with pdfmake maintaining semantic formatting with styles
        try {
          const pdfBuffer = await generatePdf(content, {
            layout: options?.layout || "standard",
            style: options?.style || "moderno"
          });
          
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="documento.pdf"`
          );
          res.send(pdfBuffer);
        } catch (error) {
          console.error("Error in advanced PDF generation:", error);
          res.status(500).json({ message: "Error generating PDF" });
        }
      } else if (format === "docx") {
        // Generate Word document with docx
        try {
          const doc = new Document({
            sections: [
              {
                properties: {},
                children: [
                  new Paragraph({
                    children: [new TextRun(content)]
                  })
                ]
              }
            ]
          });
          
          const buffer = await Packer.toBuffer(doc);
          
          res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="documento.docx"`
          );
          res.send(buffer);
        } catch (error) {
          console.error("Error in DOCX generation:", error);
          res.status(500).json({ message: "Error generating Word document" });
        }
      } else {
        res.status(400).json({ message: "Unsupported format" });
      }
    } catch (error) {
      console.error("Error in document export:", error);
      res.status(500).json({ message: "Error exporting document" });
    }
  });

  // Document analysis endpoint (BEFORE authenticated routers to avoid JWT blocking)
  app.post("/api/analyze-document", upload.single("file"), async (req, res) => {
    try {
      const file = req.file;
      const prompt = req.body.prompt;

      if (!file) {
        return res.status(400).json({ 
          success: false,
          message: "Nessun file ricevuto" 
        });
      }

      if (!prompt) {
        return res.status(400).json({ 
          success: false,
          message: "Prompt richiesto" 
        });
      }

      let extractedText = "";

      // Extract text based on file type
      if (file.mimetype === "application/pdf") {
        const pdfData = await pdfParse(file.buffer);
        extractedText = pdfData.text;
      } else if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        extractedText = result.value;
      } else {
        return res.status(400).json({ 
          success: false,
          message: "Tipo di file non supportato. Usa PDF o DOCX." 
        });
      }

      if (!extractedText || extractedText.trim().length === 0) {
        return res.status(400).json({ 
          success: false,
          message: "Impossibile estrarre testo dal file" 
        });
      }

      // Analyze document with AI
      const analysisPrompt = `Analizza il seguente documento e rispondi alla richiesta: "${prompt}"

Contenuto del documento:
${extractedText}

Fornisci un'analisi dettagliata e utile.`;

      const generatedText = await generateAIResponse(analysisPrompt);

      res.json({
        success: true,
        data: {
          original: extractedText,
          generated: generatedText,
        }
      });
    } catch (error) {
      console.error("Errore durante l'analisi del documento:", error);
      
      res.status(500).json({
        success: false,
        message: "Errore durante l'analisi del documento",
        error: error instanceof Error ? error.message : "Errore sconosciuto",
      });
    }
  });

  // Code generation endpoint (BEFORE authenticated routers to avoid JWT blocking)
  app.post("/api/code/generate", async (req, res) => {
    try {
      const { prompt, language, history, currentCode } = req.body;
      
      console.log(`🔧 [CODE AI] Generazione codice per: "${prompt.substring(0, 50)}..."`);
      console.log(`⚙️ [OPTIONS] Linguaggio: ${language}`);
      
      const codePrompt = `Genera codice ${language} funzionale e completo basato su questa richiesta: "${prompt}"

${currentCode ? `Codice esistente da modificare:\n${currentCode}\n` : ''}

Requisiti:
- Codice completo e funzionale
- Commenti appropriati in italiano
- Best practices per ${language}
- Struttura pulita e leggibile

Restituisci SOLO il codice, senza spiegazioni aggiuntive.`;

      let code, response;
      let usingAI = true;
      
      try {
        console.log(`🤖 [RICHIESTA AI] Provider: gemini, Gemini: true, OpenAI: false`);
        
        // Use Gemini AI for code generation
        code = await generateAIResponse(codePrompt);
        
        response = `Ho generato il codice ${language} utilizzando intelligenza artificiale. Il codice è ottimizzato e pronto all'uso.`;
        
        console.log(`✅ [CODE SUCCESS] Codice generato: ${code.substring(0, 100)}...`);
        
      } catch (error) {
        console.error("Errore generazione codice AI:", error);
        usingAI = false;
        
        // Basic fallback only if AI completely fails
        code = `// Codice ${language} per: ${prompt}
// Errore nel servizio AI - implementazione base

console.log("Implementare: ${prompt}");`;
        
        response = "Errore nel servizio AI. Utilizzare OpenAI API per risultati migliori.";
      }
      
      // Salva il codice generato
      try {
        await storage.createCode({
          code,
          language,
          prompt,
          createdAt: new Date().toISOString(),
        });
      } catch (storageError) {
        console.error("Errore salvataggio codice:", storageError);
      }
      
      // Invia la risposta
      res.json({
        code,
        response,
        usingAI,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid request data", details: error.errors });
      } else {
        console.error("Code generation error:", error);
        res.status(500).json({ message: "Error generating code" });
      }
    }
  });

  // Chat endpoint con memoria persistente e toni AI dinamici (PRIMA dei router autenticati)
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history, sessionId, userId, aiRole = 'default', chatId } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Messaggio richiesto" });
      }

      // Se abbiamo userId, usa il nuovo sistema di memoria
      if (userId) {
        try {
          const result = await generateChatResponseWithMemory(message, userId, chatId);
          return res.json({
            response: result.response,
            chatId: result.chatId,
            sources: result.sources || []
          });
        } catch (error) {
          console.error('Errore memoria chat:', error);
          // Fallback al sistema precedente
        }
      }

      // Mappa dei ruoli AI con i loro system prompt
      const aiRoles: Record<string, string> = {
        default: "Sei un assistente AI utile e conciso. Rispondi in modo chiaro e diretto.",
        formal: "Rispondi in modo educato, formale e dettagliato. Usa un linguaggio professionale e rispettoso. Fornisci spiegazioni complete e ben strutturate.",
        technical: "Agisci come uno sviluppatore esperto. Usa termini tecnici precisi, fornisci esempi di codice quando appropriato, e concentrati sui dettagli implementativi.",
        friendly: "Sii informale, empatico e incoraggiante. Usa un tono amichevole e supportivo. Includi emoji quando appropriato per rendere la conversazione più calorosa.",
        manager: "Agisci come un project manager esperto. Concentrati su obiettivi, priorità, timeline e risultati. Fornisci consigli pratici per la gestione dei progetti.",
        creative: "Sii creativo e fantasioso. Pensa fuori dagli schemi, proponi idee innovative e usa un linguaggio colorito e ispirante. Incoraggia l'esplorazione di nuove possibilità.",
        teacher: "Agisci come un insegnante paziente ed esperto. Spiega i concetti passo dopo passo, usa analogie semplici e verifica la comprensione. Incoraggia le domande."
      };

      const systemPrompt = aiRoles[aiRole] || aiRoles.default;
      
      // Genera la risposta usando il servizio di chat con il ruolo appropriato
      let response: string;
      if (aiRole === 'default') {
        response = await generateChatResponse(message, history || []);
      } else {
        response = await generateChatResponseWithRole(message, history || [], aiRole, systemPrompt);
      }
      
      // Se abbiamo sessionId, salva i messaggi nel database
      if (sessionId && userId) {
        try {
          // Salva messaggio utente
          await storage.db.query(
            `INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3)`,
            [sessionId, 'user', message]
          );
          
          // Salva risposta assistente
          await storage.db.query(
            `INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3)`,
            [sessionId, 'assistant', response]
          );
          
          console.log(`💬 Chat con tono "${aiRole}": ${message.slice(0, 50)}...`);
        } catch (dbError) {
          console.error('Errore salvataggio messaggi:', dbError);
          // Continua comunque con la risposta
        }
      }
      
      // Check if response is JSON with sources
      try {
        const parsed = JSON.parse(response);
        if (parsed.response && parsed.sources) {
          // Return the parsed JSON directly
          res.json({
            response: parsed.response,
            sources: parsed.sources,
            timestamp: new Date().toISOString(),
          });
          return;
        }
      } catch (e) {
        // Not JSON, continue with regular response
      }
      
      res.json({
        response,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ message: "Error processing chat request" });
    }
  });

  // Registra le rotte per la gestione degli account utente e progetti solo se non stiamo usando MongoDB
  if (!skipAuthAndProjectRoutes) {
    // Registra le rotte per la gestione degli account utente
    app.use('/api', authRouter);
    
    // Registra le rotte per la gestione dei progetti degli utenti
    app.use('/api', projectRouter);
    
    // Registra le rotte per gli eventi del calendario
    const eventRouter = (await import('./eventRoutes')).default;
    app.use('/api', eventRouter);
    
    // Log per debug delle rotte registrate
    console.log("📋 Rotte evento registrate:", Object.keys(eventRouter.stack.map((r: any) => r.route?.path)).filter(Boolean));
    
    // Registra le rotte per i promemoria via email
    app.use('/api', (await import('./reminderRoutes')).default);
    
    // Registra le rotte per le preferenze utente
    app.use('/api', preferencesRouter);
  }
  
  // Public endpoint for calendar events (bypasses auth for Nuvia integration)
  app.get('/api/events/public', async (req, res) => {
    try {
      const { db } = await import('./db/database');
      
      // Get user ID from query param or use default
      const userId = req.query.userId ? Number(req.query.userId) : 2;
      
      const userEvents = await db.query.events.findMany({
        where: (events, { eq }) => eq(events.userId, userId),
        orderBy: (events, { desc }) => [desc(events.createdAt)]
      });
      
      console.log(`📅 [PUBLIC] Eventi per utente ${userId}:`, userEvents.length);
      
      res.json({
        success: true,
        data: { events: userEvents }
      });
    } catch (error) {
      console.error('Errore recupero eventi pubblico:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Endpoint diretto per Nuvia Assistant con integrazione calendario
  app.post('/api/assistant', async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({
          success: false,
          message: "Prompt richiesto"
        });
      }

      // Parse calendar-related requests
      const calendarKeywords = ['inserisci', 'aggiungi', 'crea', 'metti', 'programma', 'appuntamento', 'evento', 'riunione', 'sopralluogo'];
      const isCalendarRequest = calendarKeywords.some(keyword => prompt.toLowerCase().includes(keyword));
      
      console.log(`🔍 [CALENDARIO] Richiesta: "${prompt}"`);
      console.log(`🔍 [CALENDARIO] È richiesta calendario: ${isCalendarRequest}`);
      
      if (isCalendarRequest) {
        console.log(`✅ [CALENDARIO] Elaborazione richiesta calendario...`);
        // Extract event details using regex patterns
        const datePatterns = [
          /domani/i,
          /oggi/i,
          /dopodomani/i,
          /(\d{1,2})[\/\-](\d{1,2})[\/\-]?(\d{2,4})?/,
          /(lunedì|martedì|mercoledì|giovedì|venerdì|sabato|domenica)/i
        ];
        
        const timePatterns = [
          /alle?\s+(\d{1,2})[:\.]?(\d{2})?\s*(am|pm)?/i,
          /(\d{1,2})[:\.](\d{2})/
        ];
        
        let eventDate = new Date();
        let eventTitle = 'Evento creato da Nuvia';
        let eventTime = null;
        
        // Parse date
        if (prompt.toLowerCase().includes('domani')) {
          eventDate.setDate(eventDate.getDate() + 1);
        } else if (prompt.toLowerCase().includes('dopodomani')) {
          eventDate.setDate(eventDate.getDate() + 2);
        }
        
        // Parse time and handle Italian timezone (UTC+2)
        const timeMatch = prompt.match(/alle?\s+(\d{1,2})[:\.]?(\d{2})?/i);
        if (timeMatch) {
          const hours = parseInt(timeMatch[1]);
          const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
          
          // Convert Italian time to UTC (subtract 2 hours for summer time)
          const italianHours = hours;
          const utcHours = italianHours - 2; // Convert to UTC
          
          eventDate.setUTCHours(utcHours, minutes, 0, 0);
        } else {
          // Default to 9 AM Italian time (7 AM UTC)
          eventDate.setUTCHours(7, 0, 0, 0);
        }
        
        // Extract title/description
        if (prompt.toLowerCase().includes('sopralluogo')) {
          eventTitle = 'Sopralluogo';
          const locationMatch = prompt.match(/a\s+([A-Za-z\s]+)/i);
          if (locationMatch) {
            eventTitle += ` a ${locationMatch[1].trim()}`;
          }
        } else if (prompt.toLowerCase().includes('riunione')) {
          eventTitle = 'Riunione';
        } else if (prompt.toLowerCase().includes('appuntamento')) {
          eventTitle = 'Appuntamento';
        }
        
        // Create event in database (get user ID from request or use default)
        try {
          console.log(`📅 [CALENDARIO] Creazione evento: ${eventTitle} per ${eventDate}`);
          
          // Get user ID from request body (sent from frontend)
          const userId = req.body.userId || 'demo-user';
          
          const newEvent = {
            userId: userId,
            title: eventTitle,
            description: `Evento aggiunto tramite Nuvia il ${new Date().toLocaleDateString('it-IT')}`,
            date: eventDate,
            type: 'meeting' as const
          };
          
          console.log(`📝 [CALENDARIO] Dati evento:`, newEvent);
          
          const [createdEvent] = await db.insert(events)
            .values(newEvent)
            .returning();
          
          console.log(`✅ [CALENDARIO] Evento creato:`, createdEvent);
          
          const response = `Perfetto! Ho aggiunto l'evento "${eventTitle}" per ${eventDate.toLocaleDateString('it-IT')} alle ${eventDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}. L'evento è stato salvato nel tuo calendario.`;
          
          return res.status(200).json({
            success: true,
            response,
            eventCreated: true,
            event: createdEvent
          });
        } catch (dbError: any) {
          console.error("❌ [CALENDARIO] Errore creazione evento:", dbError);
          // Continue to AI response if database fails
          const response = `Ho ricevuto la tua richiesta per il sopralluogo, ma ho avuto un problema tecnico nel salvare l'evento. Ti consiglio di aggiungere manualmente l'evento "${eventTitle}" per ${eventDate.toLocaleDateString('it-IT')} alle ${eventDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}.`;
          
          return res.status(200).json({
            success: true,
            response,
            eventCreated: false,
            error: dbError?.message || 'Database error'
          });
        }
      }

      // Default AI response for non-calendar requests
      const response = await processNuviaRequest(prompt, "Nessun evento programmato per questa settimana.");

      return res.status(200).json({
        success: true,
        response
      });
    } catch (error) {
      console.error("Errore assistente:", error);
      return res.status(500).json({
        success: false,
        message: "Errore durante l'elaborazione della richiesta"
      });
    }
  });
  
  // Registra le rotte per l'autenticazione Google OAuth
  app.use('/', (await import('./routes/authGoogle')).default);
  
  // User authentication status endpoint
  app.get('/api/auth/user', async (req, res) => {
    try {
      const authHeader = req.headers["authorization"];
      const bearerToken = authHeader && authHeader.split(" ")[1];
      const cookieToken = req.cookies?.auth_token;
      const token = bearerToken || cookieToken;
      
      if (!token) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Handle demo token
      if (token === 'workspace-demo-user') {
        return res.json({
          id: 'demo-user',
          email: 'demo@nuvia.ai',
          name: 'Demo User',
          firstName: 'Demo',
          lastName: 'User',
          picture: 'https://via.placeholder.com/40',
          role: 'user'
        });
      }
      
      // Handle JWT token (from Google OAuth)
      const jwt = await import('jsonwebtoken');
      const SECRET_KEY = "agente_ai_evolution_key_2025";
      
      try {
        const decoded = jwt.verify(token, SECRET_KEY) as any;
        return res.json({
          id: decoded.userId,
          email: decoded.email,
          name: decoded.name || 'Google User',
          firstName: decoded.firstName || 'Google',
          lastName: decoded.lastName || 'User',
          picture: decoded.picture || 'https://via.placeholder.com/40',
          role: decoded.role || 'user'
        });
      } catch (jwtError) {
        return res.status(401).json({ message: "Invalid token" });
      }
    } catch (error) {
      console.error('Auth user endpoint error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Registra le rotte per la generazione di progetti
  app.use('/api', generateProjectRouter);
  
  // Registra le rotte per l'analisi dei documenti
  app.use('/api', (await import('./documentRoutes')).default);
  
  // Rotta per il deploy su Vercel
  app.post('/api/deploy', authenticate, handleDeploy);
  
  // Rotta per il download ZIP del progetto
  app.post('/api/project/download', authenticate, downloadZipHandler);

  // Endpoint per creare nuova sessione chat
  app.post('/api/chat/sessions', async (req, res) => {
    try {
      const { userId, title } = req.body;
      
      if (!userId) {
        return res.status(400).json({ 
          success: false, 
          error: 'User ID richiesto' 
        });
      }

      const result = await storage.db.query(
        `INSERT INTO chat_sessions (user_id, title) VALUES ($1, $2) RETURNING *`,
        [userId, title || 'Nuova Conversazione']
      );
      
      const session = result.rows[0];
      console.log(`🆕 Nuova sessione chat creata: ${session.id}`);
      
      res.json({ 
        success: true, 
        session: {
          id: session.id,
          title: session.title,
          created_at: session.created_at
        }
      });

    } catch (error) {
      console.error('Errore creazione sessione:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Errore nella creazione della sessione' 
      });
    }
  });

  // Endpoint per recuperare sessioni utente
  app.get('/api/chat/sessions/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      const result = await storage.db.query(
        `SELECT s.*, 
         (SELECT COUNT(*) FROM chat_messages WHERE session_id = s.id) as message_count,
         (SELECT content FROM chat_messages WHERE session_id = s.id AND role = 'user' 
          ORDER BY timestamp ASC LIMIT 1) as first_message
         FROM chat_sessions s 
         WHERE s.user_id = $1 
         ORDER BY s.created_at DESC`,
        [userId]
      );
      
      console.log(`📋 Recuperate ${result.rows.length} sessioni per utente ${userId}`);
      
      res.json({ 
        success: true, 
        sessions: result.rows 
      });

    } catch (error) {
      console.error('Errore recupero sessioni:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Errore nel recupero delle sessioni' 
      });
    }
  });

  // Endpoint per recuperare messaggi di una sessione
  app.get('/api/chat/sessions/:sessionId/messages', async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      const result = await storage.db.query(
        `SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY timestamp ASC`,
        [sessionId]
      );
      
      console.log(`💬 Recuperati ${result.rows.length} messaggi per sessione ${sessionId}`);
      
      res.json({ 
        success: true, 
        messages: result.rows 
      });

    } catch (error) {
      console.error('Errore recupero messaggi:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Errore nel recupero dei messaggi' 
      });
    }
  });

  // Endpoint per salvare messaggi chat (crea sessione se necessario)
  app.post('/api/chat/save', async (req, res) => {
    try {
      const { user_id, session_id, message, role, title } = req.body;
      
      if (!user_id || !message || !role) {
        return res.status(400).json({ 
          success: false, 
          error: 'user_id, message e role sono richiesti' 
        });
      }

      let currentSessionId = session_id;
      
      // Se non abbiamo un session_id, creiamo una nuova sessione
      if (!currentSessionId) {
        const sessionResult = await storage.db.query(
          `INSERT INTO chat_sessions (user_id, title) VALUES ($1, $2) RETURNING id`,
          [user_id, title || 'Nuova Conversazione']
        );
        currentSessionId = sessionResult.rows[0].id;
        console.log(`🆕 Nuova sessione creata automaticamente: ${currentSessionId}`);
      }
      
      // Salva il messaggio
      await storage.db.query(
        `INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3)`,
        [currentSessionId, role, message]
      );
      
      console.log(`💬 Messaggio ${role} salvato in sessione ${currentSessionId}`);
      
      res.json({ 
        success: true, 
        session_id: currentSessionId,
        message: 'Messaggio salvato con successo'
      });

    } catch (error) {
      console.error('Errore salvataggio messaggio chat:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Errore durante il salvataggio del messaggio' 
      });
    }
  });







  // Web search endpoint
  app.get("/api/websearch", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) {
        return res.status(400).json({ error: 'URL mancante' });
      }

      // Check for valid URL format
      try {
        new URL(url); // This will throw if URL is invalid
      } catch (e) {
        return res.status(400).json({ 
          error: 'URL non valido', 
          message: 'Fornisci un URL completo e valido (es. https://www.esempio.it)' 
        });
      }

      const summary = await getWebSummary(url);
      res.json({ result: summary });
    } catch (error) {
      console.error("Web search error:", error);
      res.status(500).json({ 
        error: 'Errore durante la ricerca web',
        message: error instanceof Error ? error.message : 'Errore sconosciuto'
      });
    }
  });
  
  // Endpoint per ottenere informazioni dalla memoria contestuale
  app.get("/api/context-memory", (req, res) => {
    try {
      if (!contextMemory.hasRecentPage()) {
        return res.status(404).json({ 
          message: 'Nessuna pagina web in memoria. Visita prima un sito con il comando /cerca.'
        });
      }
      
      const lastPage = contextMemory.getLastVisitedPage();
      
      res.json({
        hasMemory: true,
        lastVisited: {
          url: lastPage?.url,
          title: lastPage?.title,
          timestamp: lastPage?.timestamp
        },
        summary: contextMemory.getSummary()
      });
    } catch (error) {
      console.error("Context memory error:", error);
      res.status(500).json({ 
        error: 'Errore durante l\'accesso alla memoria contestuale',
        message: error instanceof Error ? error.message : 'Errore sconosciuto'
      });
    }
  });
  
  // 📁 Nuova rotta: generazione progetto completo
  app.post('/api/code/project', async (req, res) => {
    const { prompt, type } = req.body;

    if (!prompt || !type) {
      return res.status(400).json({ error: 'Prompt e tipo progetto richiesti.' });
    }

    try {
      const result = await generateFullProject(prompt, type);
      res.json(result);
    } catch (err) {
      console.error('Errore generazione progetto:', err);
      res.status(500).json({ error: 'Errore durante la generazione del progetto.' });
    }
  });

  // Endpoint per esportare un progetto come file ZIP
  app.post('/api/code/export', async (req, res) => {
    const { files, name } = req.body;

    if (!files || !name) {
      return res.status(400).json({ error: 'File o nome mancanti' });
    }

    try {
      const AdmZip = require('adm-zip');
      const zip = new AdmZip();

      for (const [filename, content] of Object.entries(files)) {
        zip.addFile(filename, Buffer.from(content as string, 'utf8'));
      }

      const data = zip.toBuffer();

      res.set({
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${name}.zip"`,
        'Content-Length': data.length,
      });

      res.send(data);
    } catch (err) {
      console.error('Errore esportazione progetto:', err);
      res.status(500).json({ error: 'Errore durante l\'esportazione del progetto.' });
    }
  });

  // Endpoint per salvare template di codice
  app.post('/api/code/templates/save', async (req, res) => {
    try {
      const { name, files } = req.body;

      if (!name || !files) {
        return res.status(400).json({ 
          success: false, 
          error: 'Nome e files richiesti per salvare il template.' 
        });
      }

      // Importa il client database dal modulo storage
      const { storage } = await import('./storage');
      
      await storage.db.query(
        `INSERT INTO code_templates (name, files, created_at) 
         VALUES ($1, $2, NOW()) 
         ON CONFLICT (name) 
         DO UPDATE SET files = $2, created_at = NOW()`,
        [name, JSON.stringify(files)]
      );

      console.log(`💾 Template "${name}" salvato con successo`);
      
      res.json({ 
        success: true,
        message: `Template "${name}" salvato con successo!` 
      });

    } catch (error) {
      console.error('Errore salvataggio template:', error);
      res.status(500).json({ 
        success: false,
        error: 'Errore durante il salvataggio del template.' 
      });
    }
  });

  // Endpoint per recuperare lista template (alias)
  app.get('/api/code/templates/list', async (req, res) => {
    try {
      const { storage } = await import('./storage');
      
      const result = await storage.db.query(
        `SELECT id, name, created_at FROM code_templates ORDER BY created_at DESC`
      );

      console.log(`📋 Recuperati ${result.rows.length} template dalla lista`);

      res.json({ 
        success: true, 
        templates: result.rows 
      });

    } catch (error) {
      console.error('Errore recupero lista template:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Errore durante il recupero della lista template.' 
      });
    }
  });

  // Endpoint per caricare un template per nome
  app.get('/api/code/templates/load/:name', async (req, res) => {
    try {
      const { name } = req.params;
      const { storage } = await import('./storage');
      
      const result = await storage.db.query(
        `SELECT * FROM code_templates WHERE name = $1`,
        [name]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: `Template "${name}" non trovato.` 
        });
      }

      const template = result.rows[0];
      console.log(`📂 Template "${name}" caricato con successo`);
      
      res.json({ 
        success: true, 
        template: {
          id: template.id,
          name: template.name,
          files: template.files,
          created_at: template.created_at
        }
      });

    } catch (error) {
      console.error('Errore caricamento template per nome:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Errore durante il caricamento del template.' 
      });
    }
  });

  // Endpoint per recuperare lista template
  app.get('/api/code/templates', async (req, res) => {
    try {
      const { storage } = await import('./storage');
      
      const result = await storage.db.query(
        `SELECT id, name, created_at FROM code_templates ORDER BY created_at DESC`
      );

      res.json({ 
        success: true, 
        templates: result.rows 
      });

    } catch (error) {
      console.error('Errore recupero template:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Errore durante il recupero dei template.' 
      });
    }
  });

  // Endpoint per caricare un template specifico
  app.get('/api/code/templates/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { storage } = await import('./storage');
      
      const result = await storage.db.query(
        `SELECT * FROM code_templates WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Template non trovato.' 
        });
      }

      const template = result.rows[0];
      res.json({ 
        success: true, 
        template: {
          id: template.id,
          name: template.name,
          files: template.files,
          created_at: template.created_at
        }
      });

    } catch (error) {
      console.error('Errore caricamento template:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Errore durante il caricamento del template.' 
      });
    }
  });

  // Project generation endpoint per il nuovo generatore immersivo
  app.post("/api/code/generate-project", async (req, res) => {
    try {
      const { prompt, type } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      // Simulazione migliorata per il nuovo generatore immersivo
      const simulatedFiles = [
        {
          filename: 'index.html',
          content: `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Studio di Web Design - Creatività Digitale</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header class="hero">
        <nav class="nav">
            <div class="logo">DesignStudio</div>
            <ul class="nav-links">
                <li><a href="#home">Home</a></li>
                <li><a href="#servizi">Servizi</a></li>
                <li><a href="#portfolio">Portfolio</a></li>
                <li><a href="#contatti">Contatti</a></li>
            </ul>
        </nav>
        <div class="hero-content">
            <h1>Creiamo esperienze digitali straordinarie</h1>
            <p>Studio di web design specializzato in soluzioni moderne e innovative per il tuo business online.</p>
            <button class="cta-button">Inizia il tuo progetto</button>
        </div>
    </header>
    
    <section id="servizi" class="services">
        <h2>I nostri servizi</h2>
        <div class="services-grid">
            <div class="service-card">
                <h3>Web Design</h3>
                <p>Interfacce moderne e responsive per ogni dispositivo</p>
            </div>
            <div class="service-card">
                <h3>UX/UI Design</h3>
                <p>Esperienze utente coinvolgenti e intuitive</p>
            </div>
            <div class="service-card">
                <h3>Sviluppo Frontend</h3>
                <p>Codice pulito e performante con le tecnologie più avanzate</p>
            </div>
        </div>
    </section>
    
    <footer class="footer">
        <p>&copy; 2024 DesignStudio. Trasformiamo le tue idee in realtà digitale.</p>
    </footer>
    
    <script src="script.js"></script>
</body>
</html>`,
          language: 'html'
        },
        {
          filename: 'style.css',
          content: `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
    line-height: 1.6;
    color: #333;
}

.hero {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    color: white;
    position: relative;
}

.nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 5%;
    position: fixed;
    top: 0;
    width: 100%;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    z-index: 1000;
}

.logo {
    font-size: 1.5rem;
    font-weight: bold;
}

.nav-links {
    display: flex;
    list-style: none;
    gap: 2rem;
}

.nav-links a {
    color: white;
    text-decoration: none;
    transition: opacity 0.3s ease;
}

.nav-links a:hover {
    opacity: 0.7;
}

.hero-content {
    text-align: center;
    padding: 8rem 5% 4rem;
    max-width: 800px;
    margin: 0 auto;
}

.hero-content h1 {
    font-size: 3.5rem;
    margin-bottom: 1rem;
    background: linear-gradient(45deg, #fff, #f0f0f0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.hero-content p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    opacity: 0.9;
}

.cta-button {
    background: linear-gradient(45deg, #ff6b6b, #ee5a52);
    color: white;
    border: none;
    padding: 1rem 2rem;
    font-size: 1.1rem;
    border-radius: 50px;
    cursor: pointer;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.cta-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(255, 107, 107, 0.3);
}

.services {
    padding: 5rem 5%;
    background: #f8f9fa;
}

.services h2 {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 3rem;
    color: #2c3e50;
}

.services-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

.service-card {
    background: white;
    padding: 2rem;
    border-radius: 15px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.service-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
}

.service-card h3 {
    color: #667eea;
    margin-bottom: 1rem;
    font-size: 1.3rem;
}

.footer {
    background: #2c3e50;
    color: white;
    text-align: center;
    padding: 2rem;
}

@media (max-width: 768px) {
    .hero-content h1 {
        font-size: 2.5rem;
    }
    
    .nav-links {
        display: none;
    }
    
    .services-grid {
        grid-template-columns: 1fr;
    }
}`,
          language: 'css'
        },
        {
          filename: 'script.js',
          content: `// Animazioni e interazioni per la landing page
document.addEventListener('DOMContentLoaded', function() {
    
    // Smooth scrolling per i link di navigazione
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Effetto parallax per l'hero
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector('.hero');
        const parallaxSpeed = 0.5;
        
        hero.style.transform = \`translateY(\${scrolled * parallaxSpeed}px)\`;
    });
    
    // Animazione di entrata per le service cards
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Inizializza le animazioni per le cards
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = \`opacity 0.6s ease \${index * 0.2}s, transform 0.6s ease \${index * 0.2}s\`;
        observer.observe(card);
    });
    
    // Interazione per il bottone CTA
    const ctaButton = document.querySelector('.cta-button');
    ctaButton.addEventListener('click', function() {
        // Simula l'apertura di un modulo di contatto
        alert('Fantastico! Ti contatteremo presto per discutere il tuo progetto. 🚀');
        
        // Aggiunge un effetto visivo al click
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 150);
    });
    
    console.log('🎨 Landing page caricata con successo!');
});`,
          language: 'javascript'
        }
      ];
      
      res.json({
        success: true,
        projectName: 'Landing Page Web Design Studio',
        files: simulatedFiles
      });
      
    } catch (error) {
      console.error("Project generation error:", error);
      res.status(500).json({ message: "Error generating project" });
    }
  });

  // Endpoint per suggerimenti AI automatici
  app.post('/api/code/suggest', async (req, res) => {
    try {
      const { code, fileName, language } = req.body;
      
      if (!code || !fileName) {
        return res.status(400).json({ 
          success: false, 
          error: 'Codice e nome file richiesti' 
        });
      }

      // Genera suggerimento basato sul contesto del codice
      let suggestion = '';
      
      // Analisi del codice per suggerimenti contestuali
      if (language === 'html' || fileName.endsWith('.html')) {
        if (code.includes('<div') && !code.includes('</div>')) {
          suggestion = 'Ricordati di chiudere il tag </div>';
        } else if (code.includes('<style>') && !code.includes('</style>')) {
          suggestion = 'Aggiungi il tag di chiusura </style>';
        } else if (code.includes('<script>') && !code.includes('</script>')) {
          suggestion = 'Aggiungi il tag di chiusura </script>';
        } else if (!code.includes('<!DOCTYPE html>')) {
          suggestion = 'Considera di aggiungere <!DOCTYPE html> all\'inizio';
        } else if (code.length > 100) {
          suggestion = 'Codice HTML ben strutturato! Prova ad aggiungere più contenuto interattivo.';
        }
      } else if (language === 'css' || fileName.endsWith('.css')) {
        if (code.includes('{') && !code.includes('}')) {
          suggestion = 'Chiudi la regola CSS con }';
        } else if (!code.includes('margin') && !code.includes('padding')) {
          suggestion = 'Considera di aggiungere margin o padding per migliorare la spaziatura';
        } else if (code.length > 100) {
          suggestion = 'Stile CSS pulito! Prova ad aggiungere animazioni o effetti hover.';
        }
      } else if (language === 'javascript' || fileName.endsWith('.js')) {
        if (code.includes('function') && !code.includes('return')) {
          suggestion = 'Considera di aggiungere un valore di return alla funzione';
        } else if (code.includes('console.log')) {
          suggestion = 'Ricorda di rimuovere i console.log in produzione';
        } else if (!code.includes('const') && !code.includes('let') && !code.includes('var')) {
          suggestion = 'Prova a dichiarare delle variabili con const, let o var';
        } else if (code.length > 100) {
          suggestion = 'Codice JavaScript ben scritto! Aggiungi più funzionalità interattive.';
        }
      }

      // Se non abbiamo un suggerimento specifico, fornisci uno generico
      if (!suggestion && code.length > 50) {
        suggestion = 'Continua a scrivere! Il tuo codice sta prendendo forma bene.';
      }

      res.json({ 
        success: true, 
        suggestion 
      });

    } catch (error) {
      console.error('Errore generazione suggerimento:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Errore interno del server' 
      });
    }
  });

  // Endpoint per modificare codice esistente
  app.post('/api/code/edit', async (req, res) => {
    const { prompt, code, fileName, projectName } = req.body;

    if (!prompt || !code || !fileName || !projectName) {
      return res.status(400).json({ error: 'Prompt, codice, nome file e nome progetto sono richiesti.' });
    }

    try {
      const newCode = await editCodeInline(prompt, code);

      // Salva automaticamente nel log del database
      await logAIModification({
        projectName,
        fileName,
        prompt,
        beforeCode: code,
        afterCode: newCode,
      });

      res.json({ result: newCode });
    } catch (err) {
      console.error('Errore /api/code/edit:', err);
      res.status(500).json({ error: 'Errore durante la modifica del codice.' });
    }
  });

  // Endpoint per salvare modifiche AI nel database
  app.post('/api/ai-modifications', async (req, res) => {
    const { project_name, file_name, prompt, before_code, after_code } = req.body;

    if (!project_name || !file_name || !prompt || !before_code || !after_code) {
      return res.status(400).json({ error: 'Tutti i campi sono richiesti.' });
    }

    try {
      const success = await logAIModification({
        projectName: project_name,
        fileName: file_name,
        prompt,
        beforeCode: before_code,
        afterCode: after_code
      });
      
      if (success) {
        res.json({ 
          success: true, 
          message: 'Modifica AI salvata con successo' 
        });
      } else {
        res.status(500).json({ error: 'Errore durante il salvataggio nel database.' });
      }
    } catch (err) {
      console.error('Errore salvataggio modifica AI:', err);
      res.status(500).json({ error: 'Errore durante il salvataggio nel database.' });
    }
  });

  // Endpoint per recuperare cronologia modifiche AI di un progetto
  app.get('/api/code/history/:project', async (req, res) => {
    const project = req.params.project;

    if (!project) {
      return res.status(400).json({ error: 'Project name richiesto.' });
    }

    try {
      const { storage } = await import('./storage');
      const result = await storage.db.query(
        `SELECT id, file_name, prompt, timestamp FROM ai_modifications
         WHERE project_name = $1
         ORDER BY timestamp DESC`,
        [project]
      );

      res.json(result.rows);
    } catch (err) {
      console.error('Errore nel recupero della cronologia:', err);
      res.status(500).json({ error: 'Errore interno.' });
    }
  });

  // Analisi qualità codice AI - endpoint pubblico
  app.post('/api/quality/analyze', async (req, res) => {
    try {
      const { code, language } = req.body;

      if (!code || !language) {
        return res.status(400).json({ 
          error: 'Parametri mancanti: code e language sono obbligatori' 
        });
      }

      // Simulazione analisi qualità (funziona offline)
      const analysis = simulateCodeQualityAnalysis(code, language);
      
      res.status(200).json({
        success: true,
        analysis,
        usingAI: false,
        message: "Analisi simulata - funziona offline"
      });

    } catch (error: any) {
      console.error('Errore analisi qualità:', error.message);
      res.status(500).json({ 
        success: false,
        error: 'Errore durante l\'analisi del codice'
      });
    }
  });

  // Route per la navigazione web avanzata
  app.post('/api/chat/browse', async (req, res) => {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ 
        error: 'query mancante',
        message: 'Fornisci una query di ricerca valida' 
      });
    }

    try {
      console.log(`🌐 Avvio ricerca web per: "${query}"`);
      const links = await searchWeb(query);
      const previews = [];

      // Estrai contenuto dai primi 3 risultati per performance
      for (const result of links.slice(0, 3)) {
        try {
          const text = await fetchPageContent(result.link);
          previews.push({
            title: result.title,
            link: result.link,
            snippet: result.snippet || '',
            content: text.slice(0, 1000) // max 1000 char per entry
          });
        } catch (pageError) {
          // Se non riesce a estrarre il contenuto, include solo i metadati
          previews.push({
            title: result.title,
            link: result.link,
            snippet: result.snippet || '',
            content: 'Contenuto non disponibile'
          });
        }
      }

      console.log(`✅ Raccolti ${previews.length} risultati con contenuto`);
      res.json({ 
        results: previews,
        totalFound: links.length,
        query: query
      });
    } catch (err) {
      console.error('Errore browsing:', err);
      res.status(500).json({ 
        error: 'Errore durante browsing AI',
        message: 'Impossibile completare la ricerca web'
      });
    }
  });

  // Enhanced file upload with Gemini AI analysis
  app.post('/api/upload', upload.single('file'), async (req, res) => {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'Nessun file ricevuto' });
    }

    const ext = path.extname(file.originalname).toLowerCase();
    let extractedText = '';

    try {
      if (ext === '.pdf') {
        const data = await pdfParse(file.buffer);
        extractedText = data.text;
        console.log(`📄 PDF analizzato: ${file.originalname} (${extractedText.length} caratteri)`);
      } else if (ext === '.docx') {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        extractedText = result.value;
        console.log(`📄 DOCX analizzato: ${file.originalname} (${extractedText.length} caratteri)`);
      } else if (ext === '.txt' || ext === '.js' || ext === '.ts' || ext === '.py' || 
                ext === '.jsx' || ext === '.tsx' || ext === '.html' || ext === '.css' || 
                ext === '.json' || ext === '.md') {
        extractedText = file.buffer.toString('utf8');
        console.log(`📄 File di testo analizzato: ${file.originalname} (${extractedText.length} caratteri)`);
      } else {
        return res.status(400).json({ 
          error: 'Formato non supportato',
          message: 'Formati supportati: PDF, DOCX, TXT, JS, TS, PY, JSX, TSX, HTML, CSS, JSON, MD'
        });
      }

      // Store in file memory for context
      fileMemory.addFile(file.originalname, extractedText);
      console.log(`File elaborato aggiunto alla memoria: ${file.originalname} (${file.mimetype})`);

      // Analyze with Gemini AI if it's a document type
      if (ext === '.pdf' || ext === '.docx') {
        try {
          const analysisPrompt = `Ecco il contenuto del documento "${file.originalname}":

"""
${extractedText.substring(0, 8000)}
"""

Analizza questo documento e fornisci un riassunto delle informazioni principali. Attendi eventuali istruzioni per modificarlo o elaborarlo ulteriormente.`;

          const aiResponse = await fetch('http://localhost:5000/api/ai/document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: analysisPrompt })
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            return res.json({
              content: aiData.text,
              filename: file.originalname,
              filesize: file.size,
              extractedLength: extractedText.length,
              message: 'File caricato ed elaborato con successo'
            });
          }
        } catch (aiError) {
          console.error('Errore analisi AI:', aiError);
          // Fallback senza analisi AI
        }
      }

      return res.json({ 
        content: extractedText.substring(0, 10000),
        filename: file.originalname,
        filesize: file.size,
        extractedLength: extractedText.length,
        message: 'File caricato ed elaborato con successo'
      });

    } catch (err) {
      console.error('Errore parsing file:', err);
      res.status(500).json({ 
        error: 'Errore durante il parsing',
        message: 'Impossibile analizzare il file caricato'
      });
    }
  });

  // Legacy endpoint for backward compatibility
  app.post('/api/chat/upload-file', upload.single('file'), async (req, res) => {
    // Redirect to new upload endpoint
    req.url = '/api/upload';
    return app._router.handle(req, res);
  });

  // ❌ DISABILITATO - Sistema vecchio che interferiva con PostgreSQL
  // app.use('/api/user', userSettingsRouter);
  
  // ❌ ELIMINATO - Anche questo interferiva
  // app.use('/api/settings', settingsRouter);
  
  // ✅ SOLO POSTGRESQL - Sistema unificato e funzionante
  app.use('/api', preferencesRouter);
  
  // Centralized AI Router with specialized contexts
  app.use('/api/ai', geminiRouter);
  
  // Chat history routes
  app.use('/api/chat', chatHistoryRouter);

  // Document export endpoint
  app.post('/api/export', async (req, res) => {
    const { content, format } = req.body;

    if (!content || !format) {
      return res.status(400).json({ 
        error: 'Content and format are required' 
      });
    }

    if (format !== 'pdf' && format !== 'word') {
      return res.status(400).json({ 
        error: 'Format must be either "pdf" or "word"' 
      });
    }

    const timestamp = Date.now();
    const filename = `document_${timestamp}.${format === 'word' ? 'docx' : 'pdf'}`;
    const filepath = path.join(process.cwd(), 'uploads', filename);

    try {
      if (format === 'pdf') {
        const { generatePdf } = await import('./pdf/pdfMakeService');
        await generatePdf(content, filepath);
      } else if (format === 'word') {
        const { Document, Packer, Paragraph, TextRun } = await import('docx');
        
        // Split content into paragraphs and format
        const paragraphs = content.split('\n\n').map(text => 
          new Paragraph({
            children: [new TextRun(text.trim())],
            spacing: { after: 200 }
          })
        );

        const doc = new Document({
          sections: [{
            properties: {},
            children: paragraphs
          }]
        });

        const buffer = await Packer.toBuffer(doc);
        fs.writeFileSync(filepath, buffer);
      }

      console.log(`📄 Documento esportato: ${filename}`);

      // Send file and clean up
      res.download(filepath, filename, (err) => {
        if (err) {
          console.error('Errore download:', err);
        }
        // Clean up file after download
        fs.unlink(filepath, (unlinkErr) => {
          if (unlinkErr) {
            console.error('Errore rimozione file:', unlinkErr);
          }
        });
      });

    } catch (error) {
      console.error('Errore export documento:', error);
      res.status(500).json({ 
        error: 'Errore durante l\'esportazione del documento',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Chat Memory Routes
  // Crea una nuova chat
  app.post('/api/chats', authenticate, async (req, res) => {
    try {
      const { title } = req.body;
      const userId = req.user!.userId;

      const newChat = await storage.createChat({
        userId,
        title: title || 'Nuova chat'
      });

      res.json({
        success: true,
        data: { chat: newChat }
      });
    } catch (error) {
      console.error('Errore creazione chat:', error);
      res.status(500).json({
        success: false,
        error: 'Errore durante la creazione della chat'
      });
    }
  });

  // Recupera tutte le chat dell'utente
  app.get('/api/chats', authenticate, async (req, res) => {
    try {
      const userId = req.user!.userId;
      const chats = await storage.getUserChats(userId);

      res.json({
        success: true,
        data: { chats }
      });
    } catch (error) {
      console.error('Errore recupero chat:', error);
      res.status(500).json({
        success: false,
        error: 'Errore durante il recupero delle chat'
      });
    }
  });

  // Recupera i messaggi di una chat specifica
  app.get('/api/chats/:chatId/messages', authenticate, async (req, res) => {
    try {
      const chatId = parseInt(req.params.chatId);
      const userId = req.user!.userId;

      // Verifica che la chat appartenga all'utente
      const chat = await storage.getChat(chatId);
      if (!chat || chat.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: 'Chat non trovata'
        });
      }

      const messages = await storage.getChatMessages(chatId);

      res.json({
        success: true,
        data: { messages }
      });
    } catch (error) {
      console.error('Errore recupero messaggi:', error);
      res.status(500).json({
        success: false,
        error: 'Errore durante il recupero dei messaggi'
      });
    }
  });

  // Salva un messaggio in una chat
  app.post('/api/chats/:chatId/messages', authenticate, async (req, res) => {
    try {
      const chatId = parseInt(req.params.chatId);
      const { content, role } = req.body;
      const userId = req.user!.userId;

      // Verifica che la chat appartenga all'utente
      const chat = await storage.getChat(chatId);
      if (!chat || chat.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: 'Chat non trovata'
        });
      }

      const newMessage = await storage.createMessage({
        chatId,
        content,
        role
      });

      res.json({
        success: true,
        data: { message: newMessage }
      });
    } catch (error) {
      console.error('Errore salvataggio messaggio:', error);
      res.status(500).json({
        success: false,
        error: 'Errore durante il salvataggio del messaggio'
      });
    }
  });

  // Recupera messaggi recenti dell'utente per contesto
  app.get('/api/chats/recent-messages', authenticate, async (req, res) => {
    try {
      const userId = req.user!.userId;
      const limit = parseInt(req.query.limit as string) || 10;

      const recentMessages = await storage.getRecentUserMessages(userId, limit);

      res.json({
        success: true,
        data: { messages: recentMessages }
      });
    } catch (error) {
      console.error('Errore recupero messaggi recenti:', error);
      res.status(500).json({
        success: false,
        error: 'Errore durante il recupero dei messaggi recenti'
      });
    }
  });

  // Endpoint per esportazione completa del progetto
  app.get('/api/export-project', exportProject);
  
  const httpServer = createServer(app);

  // Inizializza WebSocket per collaborazione in tempo reale
  initializeSocketServer(httpServer);

  return httpServer;
}

/**
 * Simula analisi di qualità del codice quando OpenAI non è disponibile
 */
function simulateCodeQualityAnalysis(code: string, language: string) {
  const codeLength = code.length;
  const lines = code.split('\n').length;
  
  // Analisi euristica semplice
  let score = 70; // Punteggio base
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Controlli di base per diversi linguaggi
  if (language === 'javascript' || language === 'typescript') {
    if (code.includes('var ')) {
      score -= 10;
      issues.push("Uso di 'var' invece di 'let' o 'const'");
      suggestions.push("Sostituisci 'var' con 'let' o 'const' per scope migliore");
    }
    
    if (!code.includes('try') && code.includes('JSON.parse')) {
      score -= 5;
      issues.push("Parsing JSON senza gestione errori");
      suggestions.push("Aggiungi try-catch per gestire errori di parsing");
    }
    
    if (code.includes('console.log')) {
      score -= 5;
      issues.push("Console.log presente nel codice");
      suggestions.push("Rimuovi console.log o usa un logger appropriato");
    }
  }

  if (language === 'python') {
    if (!code.includes('def ') && codeLength > 50) {
      score -= 10;
      issues.push("Codice lungo senza funzioni");
      suggestions.push("Dividi il codice in funzioni più piccole");
    }
    
    if (code.includes('print(') && lines > 10) {
      score -= 5;
      issues.push("Statement print nel codice di produzione");
      suggestions.push("Usa logging invece di print()");
    }
  }

  // Controlli generali
  if (codeLength > 1000) {
    score -= 10;
    issues.push("Codice molto lungo, difficile da mantenere");
    suggestions.push("Dividi in funzioni o moduli più piccoli");
  }

  if (lines > 50 && !code.includes('//') && !code.includes('#')) {
    score -= 5;
    issues.push("Mancano commenti esplicativi");
    suggestions.push("Aggiungi commenti per spiegare la logica complessa");
  }

  // Assicura che ci siano sempre almeno 1-2 suggerimenti
  if (suggestions.length === 0) {
    suggestions.push("Considera l'aggiunta di type hints o documentazione");
    suggestions.push("Verifica la consistenza dello stile di naming");
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
    suggestions: suggestions.slice(0, 3) // Max 3 suggerimenti
  };
}
