/*
 * Punto di ingresso del server backend Nuvia.
 * Questo file configura Express, si connette a PostgreSQL e definisce
 * alcuni endpoint placeholder. La logica di business per le
 * funzionalità AI (chatbot, generatore documenti, calendario, ecc.)
 * dovrà essere implementata nei rispettivi moduli.
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Carica le variabili d'ambiente da .env se presente
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Configura middleware
app.use(cors());
app.use(express.json());

// Configura la connessione a PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Prova la connessione al database all'avvio
pool.connect()
  .then(client => {
    return client
      .query('SELECT 1')
      .then(() => {
        console.log('Connesso a PostgreSQL');
        client.release();
      })
      .catch(err => {
        client.release();
        console.error('Errore nella verifica della connessione al DB:', err);
      });
  })
  .catch(err => {
    console.error('Impossibile connettersi al database:', err);
  });

// Endpoint di salute (health check)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Endpoint placeholder per la chat AI
app.post('/api/chat', async (req, res) => {
  const { message, history } = req.body;
  // TODO: integra la logica di interfaccia con il modello AI (OpenAI/Gemini)
  // e salva la conversazione nel database.
  console.log('Messaggio ricevuto:', message);
  res.json({ response: 'Risposta di esempio dal modello AI', debug: { message, history } });
});

// Endpoint placeholder per la generazione di documenti
app.post('/api/document', async (req, res) => {
  const { type, data } = req.body;
  // TODO: implementare la creazione di PDF/Word in base al tipo e ai dati.
  res.json({ success: true, message: `Generazione documento ${type} non ancora implementata`, data });
});

// Avvio del server
app.listen(port, () => {
  console.log(`Server backend Nuvia in ascolto sulla porta ${port}`);
});
app.get('/', (req, res) => {
  res.send('✅ Server attivo: connessione riuscita!');
});
