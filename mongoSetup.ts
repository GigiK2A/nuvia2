/**
 * Configurazione MongoDB per l'agente AI
 * Gestisce la connessione al database e configura le rotte per l'autenticazione e i progetti
 */

import { Express } from "express";
// Importa connectDB usando require (compatibile con CommonJS)
const connectDB = require("./db");
import mongoAuthRouter from "./mongoAuthRoutes";
import mongoProjectRouter from "./mongoProjectRoutes";
import { storage } from "./storage"; // Manteniamo l'accesso allo storage in memoria come fallback

// Flag per tenere traccia se MongoDB è connesso
let isMongoDBConnected = false;

/**
 * Inizializza MongoDB e registra le rotte MongoDB
 * Se la connessione fallisce, utilizza lo storage in memoria come fallback
 */
export async function setupMongoDB(app: Express): Promise<boolean> {
  try {
    // Tenta di connettersi a MongoDB
    isMongoDBConnected = await connectDB();
    
    if (isMongoDBConnected) {
      console.log("📦 Registrazione rotte MongoDB...");
      
      // Registra le rotte MongoDB
      app.use('/api', mongoAuthRouter);
      app.use('/api', mongoProjectRouter);
      
      console.log("✅ Rotte MongoDB registrate con successo");
      return true;
    } else {
      console.warn("⚠️ MongoDB non disponibile, utilizzo dello storage in memoria");
      return false;
    }
  } catch (error) {
    console.error("❌ Errore durante la configurazione di MongoDB:", error);
    console.warn("⚠️ Utilizzo dello storage in memoria come fallback");
    return false;
  }
}

/**
 * Controlla se MongoDB è disponibile
 */
export function isMongoDBAvailable(): boolean {
  return isMongoDBConnected;
}