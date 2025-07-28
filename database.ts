/**
 * Connessione al database PostgreSQL
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../../shared/schema';

// Utilizza la variabile d'ambiente DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test della connessione
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Connessione a PostgreSQL stabilita');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Errore di connessione a PostgreSQL:', error);
    return false;
  }
}

// Crea un'istanza di drizzle con lo schema
export const db = drizzle(pool, { schema });

// Esporta la funzione per testare la connessione
export { testConnection };