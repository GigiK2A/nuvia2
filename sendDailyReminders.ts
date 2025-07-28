/**
 * Script per inviare promemoria giornalieri degli eventi
 * Da eseguire con cron o altre soluzioni di pianificazione (es: ogni mattina alle 8:00)
 */
import { DateTime } from 'luxon';
import { sendDailyReminder } from '../server/reminderService';
import { db } from '../server/db/database';
import * as schema from '../shared/schema';
import { sql } from 'drizzle-orm';

async function sendDailyReminders() {
  try {
    console.log('🚀 Avvio invio promemoria giornalieri...');
    
    // Ottiene la data di oggi nel fuso orario di Roma
    const today = DateTime.now().setZone("Europe/Rome").toFormat("yyyy-MM-dd");
    console.log(`📅 Ricerca eventi per oggi (${today})`);
    
    // Calcola l'inizio e la fine della giornata in UTC
    const startOfDay = DateTime.fromISO(`${today}T00:00:00`, { zone: "Europe/Rome" }).toUTC().toJSDate();
    const endOfDay = DateTime.fromISO(`${today}T23:59:59`, { zone: "Europe/Rome" }).toUTC().toJSDate();
    
    // Recupera tutti gli eventi di oggi
    const todayEvents = await db.select()
      .from(schema.events)
      .where(
        sql`${schema.events.date} >= ${startOfDay.toISOString()} AND ${schema.events.date} <= ${endOfDay.toISOString()}`
      )
      .orderBy(schema.events.date);
    
    console.log(`🔍 Trovati ${todayEvents.length} eventi per oggi`);
    
    if (todayEvents.length === 0) {
      console.log('⚠️ Nessun evento da notificare oggi');
      return;
    }
    
    // Raggruppa eventi per utente
    const eventsByUser: Record<number, any[]> = {};
    for (const event of todayEvents) {
      if (!eventsByUser[event.userId]) {
        eventsByUser[event.userId] = [];
      }
      eventsByUser[event.userId].push(event);
    }
    
    // Recupera utenti distinti
    const userIds = Object.keys(eventsByUser).map(Number);
    const users = await db.select({
      id: schema.users.id,
      email: schema.users.email
    })
    .from(schema.users)
    .where(sql`${schema.users.id} IN (${userIds.join(',')})`);
    
    // Mappa degli ID utente alle email
    const userEmails: Record<number, string> = {};
    for (const user of users) {
      userEmails[user.id] = user.email;
    }
    
    // Invia email a ciascun utente con i propri eventi
    let sentCount = 0;
    for (const userId in eventsByUser) {
      const userEmail = userEmails[Number(userId)];
      if (!userEmail) {
        console.log(`⚠️ Email non trovata per utente ${userId}`);
        continue;
      }
      
      const userEvents = eventsByUser[Number(userId)];
      const success = await sendDailyReminder(userEmail, userEvents);
      if (success) sentCount++;
    }
    
    console.log(`✅ Invio completato: ${sentCount}/${Object.keys(eventsByUser).length} email inviate`);
  } catch (error) {
    console.error('❌ Errore durante l\'invio dei promemoria:', error);
  }
}

// Esegui lo script
sendDailyReminders().then(() => {
  console.log('Script terminato');
  process.exit(0);
}).catch(err => {
  console.error('Errore fatale:', err);
  process.exit(1);
});