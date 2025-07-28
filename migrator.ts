/**
 * Gestore delle migrazioni del database PostgreSQL
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as schema from '../../shared/schema';

/**
 * Esegue le migrazioni del database PostgreSQL
 */
export async function runMigrations() {
  try {
    console.log('🔄 Avvio delle migrazioni database...');
    
    // Connessione al database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    // Istanza di Drizzle
    const db = drizzle(pool, { schema });
    
    // Crea le tabelle se non esistono già
    console.log('Creazione delle tabelle...');
    
    // Crea l'enum per i ruoli utente
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
          CREATE TYPE user_role AS ENUM ('admin', 'user');
        END IF;
      END
      $$;
    `);
    
    // Crea la tabella users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role user_role NOT NULL DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
    
    // Crea la tabella documents
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        format VARCHAR(50) NOT NULL,
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
    
    // Crea la tabella code_snippets
    await pool.query(`
      CREATE TABLE IF NOT EXISTS code_snippets (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        language VARCHAR(50) NOT NULL,
        code TEXT NOT NULL,
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
    
    // Crea la tabella projects
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        files TEXT NOT NULL,
        thumbnail TEXT,
        user_id INTEGER REFERENCES users(id),
        is_public BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
    
    // Crea la tabella chats
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chats (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title VARCHAR(255) NOT NULL DEFAULT 'Nuova chat',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
    
    // Crea la tabella messages
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        chat_id INTEGER REFERENCES chats(id),
        content TEXT NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
    
    // Inserisci l'utente admin se non esiste
    const adminExists = await pool.query(
      "SELECT * FROM users WHERE email = 'admin@example.com'"
    );
    
    if (adminExists.rows.length === 0) {
      await pool.query(
        "INSERT INTO users (email, password, role) VALUES ($1, $2, $3)",
        [
          'admin@example.com', 
          '$2b$10$XpvHf1sTYI9QxX1K.hBJM.ahDmQrE6yNuXQPZD1gk9I3bk5lZ9MmG', // admin123
          'admin'
        ]
      );
      console.log('✅ Utente admin creato con successo');
    }
    
    console.log('✅ Migrazione completata con successo');
    return true;
  } catch (error) {
    console.error('❌ Errore durante la migrazione:', error);
    return false;
  }
}