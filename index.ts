import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupPostgresDB, isPostgresAvailable, getStorage } from "./db/pgSetup";
import { storage } from "./storage";
import { initializePrisma, disconnectPrisma } from "./prisma";
import bcrypt from "bcrypt";
import dotenv from 'dotenv';
import deployRouter from "./deployRoutes";
import dbRouter from "./dbRoutes";
import apiRouter from "./apiRoutes";
import zipRouter from "./zipRoutes";
import templateRouter from "./templateRoutes";
import inlineRouter from "./inlineRoutes";
import completionRouter from "./completionRoutes";
import qualityRouter from "./qualityRoutes";
import projectRoutes from "./routes/projectRoutes";
import exportRoutes from "./routes/export";
import deployRoutes from "./routes/deploy";
import projectContextRoutes from "./routes/projectContext";
import authGoogleRoutes from "./routes/authGoogle";
import nuviaRoutes from "./routes/nuviaRoutes";
import chatHistoryRoutes from "./routes/chatHistory";
import authRoutes from "./routes/auth";

dotenv.config(); // Carica le variabili d'ambiente da .env

// Verifica se è disponibile una chiave OpenAI API
const openaiKey = process.env.OPENAI_API_KEY;
if (!openaiKey) {
  console.warn("Chiave API OpenAI non trovata, verranno utilizzati contenuti simulati");
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration for Google OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Tenta di inizializzare PostgreSQL
    const isPgConnected = await setupPostgresDB(app);
    
    // Inizializza Prisma se PostgreSQL è disponibile
    if (isPgConnected) {
      await initializePrisma();
      console.log("✅ Prisma inizializzato e pronto per l'uso");
    }
    
    // Se PostgreSQL non è disponibile, utilizziamo lo storage in memoria
    if (!isPgConnected) {
      console.log("🔸 PostgreSQL non disponibile, utilizzo dello storage in memoria");
      
      // Crea utente admin se non esiste già (per storage in memoria)
      const adminUser = await storage.getUserByUsername("admin");
      if (!adminUser) {
        // Hash della password per l'admin
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash("admin123", saltRounds);
        
        await storage.createUser({
          username: "admin",
          email: "admin@nuvia.ai",
          password: hashedPassword,
          role: "admin",
          createdAt: new Date(),
        });
        log("✅ Utente admin creato con successo (storage in memoria)");
      }
      
      // Registra le rotte deploy
      app.use('/api/deploy', deployRouter);
      
      // Registra le rotte database
      app.use('/api/db', dbRouter);
      
      // Registra le rotte API generator
      app.use('/api/api', apiRouter);
      
      // Registra le rotte ZIP export
      app.use('/api/zip', zipRouter);
      
      // Registra le rotte template
      app.use('/api/templates', templateRouter);
      
      // Registra le rotte inline edit
      app.use('/api/inline', inlineRouter);
      
      // Registra le rotte completamento automatico
      app.use('/api/complete', completionRouter);
      
      // Registra le rotte analisi qualità codice
      app.use('/api/quality', qualityRouter);
      
      // Registra le rotte progetto (Prisma)
      if (isPgConnected) {
        app.use('/api', projectRoutes);
        app.use('/api', exportRoutes);
        app.use('/api', deployRoutes);
        app.use('/api', projectContextRoutes);
        console.log("✅ Project management, export, deploy, and context routes initialized with Prisma");
      }
      
      // Registra le rotte di autenticazione PRIMA delle rotte standard
      app.use('/', authGoogleRoutes);
      app.use('/auth', authRoutes);
      app.use('/api', nuviaRoutes);
      
      // Registra le rotte calendario
      const calendarRoutes = await import('./routes/calendarRoutes');
      app.use('/api', calendarRoutes.default);
      
      // Registra le rotte standard (in memory) DOPO
      const server = await registerRoutes(app);
      
      // Registra le rotte per la cronologia chat
      app.use('/api/chat', chatHistoryRoutes);
      
      console.log("✅ Google OAuth and Nuvia routes initialized for calendar integration");
      
      app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";

        res.status(status).json({ message });
        throw err;
      });

      // Setup Vite in modalità sviluppo
      if (app.get("env") === "development") {
        await setupVite(app, server);
      } else {
        serveStatic(app);
      }

      // Porta di ascolto
      const port = 5000;
      server.listen({
        port,
        host: "0.0.0.0",
        reusePort: true,
      }, () => {
        log(`🚀 Server attivo sulla porta ${port} (storage in memoria)`);
      });
    } else {
      // PostgreSQL è disponibile e attivo
      console.log("✅ PostgreSQL inizializzato, utilizzo del database attivo");
      
      // Inizializza il sistema di promemoria automatici (solo se NUVIA_APP_PASSWORD è configurata)
      if (process.env.NUVIA_APP_PASSWORD) {
        console.log("📧 Inizializzazione del sistema di promemoria automatici...");
        // Import asincrono del modulo cronReminder
        import('../cronReminder')
          .then(() => console.log("⏰ Sistema di promemoria automatici avviato con successo"))
          .catch(err => console.error("❌ Errore durante l'avvio del sistema di promemoria:", err));
      } else {
        console.log("⚠️ NUVIA_APP_PASSWORD non configurata, sistema di promemoria automatici non attivo");
      }
      
      // Registra le rotte standard usando lo storage PostgreSQL
      const server = await registerRoutes(app);
      
      app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";

        res.status(status).json({ message });
        throw err;
      });

      // Setup Vite in modalità sviluppo
      if (app.get("env") === "development") {
        await setupVite(app, server);
      } else {
        serveStatic(app);
      }

      // Porta di ascolto
      const port = 5000;
      server.listen({
        port,
        host: "0.0.0.0",
        reusePort: true,
      }, () => {
        log(`🚀 Server attivo sulla porta ${port} con PostgreSQL`);
      });
    }
  } catch (error) {
    console.error("❌ Errore durante l'avvio del server:", error);
  }
})();
