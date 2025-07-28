/**
 * Configurazione e integrazione PostgreSQL
 * Questo modulo gestisce la connessione al database e configura le rotte
 */
import { Express } from "express";
import { db, testConnection } from "./database";
import { runMigrations } from "./migrator";
import { PostgresStorage } from "./pgStorage";
import { storage } from "../storage";

// Storage PostgreSQL
let pgStorage: PostgresStorage | null = null;

/**
 * Inizializza PostgreSQL e configura l'applicazione per il suo utilizzo
 */
export async function setupPostgresDB(app: Express): Promise<boolean> {
  try {
    // Test connessione al database
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.warn("⚠️ PostgreSQL non disponibile, utilizzo dello storage in memoria");
      return false;
    }
    
    // Esegui migrazioni per creare le tabelle necessarie
    await runMigrations();
    
    // Inizializza lo storage PostgreSQL
    pgStorage = new PostgresStorage();
    
    // Registra le rotte specifiche per PostgreSQL (se necessario)
    // app.use('/api', pgSpecificRoutes);
    
    console.log("✅ PostgreSQL inizializzato con successo");
    return true;
  } catch (error) {
    console.error("❌ Errore durante l'inizializzazione di PostgreSQL:", error);
    return false;
  }
}

/**
 * Restituisce l'istanza dello storage PostgreSQL
 * Se PostgreSQL non è disponibile, restituisce lo storage in memoria
 */
export function getStorage() {
  return pgStorage || storage;
}

/**
 * Verifica se PostgreSQL è disponibile
 */
export function isPostgresAvailable(): boolean {
  return pgStorage !== null;
}