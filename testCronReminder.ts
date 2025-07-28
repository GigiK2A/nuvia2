/**
 * Script di test per inviare immediatamente i promemoria giornalieri
 * Utilizzare per verificare il funzionamento delle notifiche email senza attendere il cron
 */
import { db } from '../server/db/database';
import { DateTime } from 'luxon';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Configura il trasportatore Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'nuvia.notifiche@gmail.com',
    pass: process.env.NUVIA_APP_PASSWORD,
  },
});

async function sendDailyReminders() {
  const today = DateTime.now().setZone("Europe/Rome").toISODate();
  console.log(`[🕖 ${DateTime.now().toISO()}] Test promemoria per data ${today}`);

  try {
    // Recupera eventi di oggi da PostgreSQL
    const startOfDay = DateTime.fromISO(`${today}T00:00:00`, { zone: "Europe/Rome" }).toUTC().toJSDate();
    const endOfDay = DateTime.fromISO(`${today}T23:59:59`, { zone: "Europe/Rome" }).toUTC().toJSDate();
    
    // Utilizziamo una query SQL diretta per ottenere gli eventi di oggi con le email degli utenti
    // Per evitare problemi con i nomi delle colonne, usiamo una query diretta con pg
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    const result = await pool.query(`
      SELECT e.id, e.title, e.date, e.description, u.email
      FROM events e
      JOIN users u ON e.user_id = u.id
      WHERE e.date >= $1 AND e.date <= $2
      ORDER BY e.date ASC
    `, [startOfDay.toISOString(), endOfDay.toISOString()]);

    const events = result.rows;

    if (!events || !events.length) {
      console.log(`[🕖 ${today}] Nessun evento per oggi.`);
      return;
    }

    console.log(`[📋] Trovati ${events.length} eventi per oggi`);
    
    // Raggruppa eventi per utente/email
    const userEvents: Record<string, any[]> = {};
    
    events.forEach(event => {
      if (!event.email) return;
      
      if (!userEvents[event.email]) {
        userEvents[event.email] = [];
      }
      
      userEvents[event.email].push(event);
    });
    
    // Invia email a ciascun utente
    for (const [email, userEventList] of Object.entries(userEvents)) {
      const formatted = userEventList.map(ev => {
        const ora = DateTime.fromJSDate(new Date(ev.date)).setZone("Europe/Rome").toFormat("HH:mm");
        return `• <strong>${ev.title}</strong> – ore ${ora}${ev.description ? `<br/><span style="color:#666;font-size:0.9em">${ev.description}</span>` : ''}`;
      }).join('<br />');

      await transporter.sendMail({
        from: '"Nuvia AI" <nuvia.notifiche@gmail.com>',
        to: email,
        subject: `📅 [TEST] Promemoria eventi – ${DateTime.now().setZone("Europe/Rome").toFormat("dd/MM/yyyy")}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #4a6ee0;">TEST - Promemoria eventi di oggi</h2>
            <p>Buongiorno! Ecco gli appuntamenti previsti per oggi:</p>
            <div style="margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-radius: 8px;">
              ${formatted}
            </div>
            <p style="margin-top: 30px; font-size: 0.8em; color: #666;">
              Questo è un messaggio automatico di test da Nuvia, il tuo assistente personale.
            </p>
          </div>
        `
      });

      console.log(`[✅] Email di test inviata a ${email} con ${userEventList.length} eventi`);
    }
  } catch (err) {
    console.error(`[❌] Errore invio promemoria di test:`, err);
  }
}

// Verifica se la password per l'app è impostata
if (!process.env.NUVIA_APP_PASSWORD) {
  console.error(`[❌] Errore: NUVIA_APP_PASSWORD non è impostata nelle variabili d'ambiente!`);
  console.log(`Per utilizzare questo script, imposta la variabile d'ambiente NUVIA_APP_PASSWORD con la password per l'app Gmail`);
  process.exit(1);
}

// Esegui l'invio dei promemoria
sendDailyReminders()
  .then(() => {
    console.log(`[✓] Test completato`);
    process.exit(0);
  })
  .catch(err => {
    console.error(`[✗] Errore durante l'esecuzione del test:`, err);
    process.exit(1);
  });