/**
 * Rotte per l'invio di promemoria per gli eventi del calendario
 * Gestisce l'invio manuale dei promemoria giornalieri e singoli
 */
import { Router, Request, Response } from 'express';
import { verifyToken, isAdmin } from './authConfig';
import { DateTime } from 'luxon';
import { sendDailyReminder, sendEventReminder } from './reminderService';
import { db } from './db/database';
import { sql } from 'drizzle-orm';
import * as schema from '../shared/schema';

const reminderRouter = Router();

/**
 * POST /api/reminders/send-daily
 * Invia i promemoria per gli eventi di oggi a tutti gli utenti
 * Richiede autenticazione admin
 */
reminderRouter.post("/reminders/send-daily", verifyToken, isAdmin, async (req: Request, res: Response) => {
  try {
    // Ottiene la data di oggi nel fuso orario di Roma
    const today = DateTime.now().setZone("Europe/Rome").toFormat("yyyy-MM-dd");
    console.log(`📅 Invio promemoria per eventi di oggi (${today})`);
    
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
    
    if (todayEvents.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Nessun evento trovato per oggi"
      });
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
    const results = [];
    
    for (const userId in eventsByUser) {
      const userEmail = userEmails[Number(userId)];
      if (!userEmail) {
        results.push({ userId, success: false, reason: "Email non trovata" });
        continue;
      }
      
      const userEvents = eventsByUser[Number(userId)];
      const success = await sendDailyReminder(userEmail, userEvents);
      
      results.push({ 
        userId, 
        email: userEmail, 
        success, 
        eventCount: userEvents.length 
      });
      
      if (success) sentCount++;
    }
    
    return res.json({
      success: true,
      message: `Promemoria inviati con successo a ${sentCount}/${Object.keys(eventsByUser).length} utenti`,
      results
    });
  } catch (error) {
    console.error("❌ Errore invio promemoria giornalieri:", error);
    return res.status(500).json({
      success: false,
      message: "Errore durante l'invio dei promemoria",
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    });
  }
});

/**
 * POST /api/reminders/send-my-daily
 * Invia un promemoria per gli eventi di oggi all'utente corrente
 * Richiede autenticazione
 */
reminderRouter.post("/reminders/send-my-daily", verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Utente non autenticato"
      });
    }
    
    // Ottiene l'email dell'utente
    const user = await db.select({
      email: schema.users.email
    })
    .from(schema.users)
    .where(sql`${schema.users.id} = ${userId}`)
    .limit(1);
    
    if (!user || user.length === 0 || !user[0].email) {
      return res.status(404).json({
        success: false,
        message: "Email utente non trovata"
      });
    }
    
    const userEmail = user[0].email;
    
    // Ottiene la data di oggi nel fuso orario di Roma
    const today = DateTime.now().setZone("Europe/Rome").toFormat("yyyy-MM-dd");
    
    // Calcola l'inizio e la fine della giornata in UTC
    const startOfDay = DateTime.fromISO(`${today}T00:00:00`, { zone: "Europe/Rome" }).toUTC().toJSDate();
    const endOfDay = DateTime.fromISO(`${today}T23:59:59`, { zone: "Europe/Rome" }).toUTC().toJSDate();
    
    // Recupera tutti gli eventi di oggi per l'utente
    const todayEvents = await db.select()
      .from(schema.events)
      .where(
        sql`${schema.events.userId} = ${userId} AND ${schema.events.date} >= ${startOfDay.toISOString()} AND ${schema.events.date} <= ${endOfDay.toISOString()}`
      )
      .orderBy(schema.events.date);
    
    if (todayEvents.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Nessun evento trovato per oggi"
      });
    }
    
    // Invia il promemoria
    const success = await sendDailyReminder(userEmail, todayEvents);
    
    if (success) {
      return res.json({
        success: true,
        message: `Promemoria inviato con successo a ${userEmail} per ${todayEvents.length} eventi`
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Errore durante l'invio del promemoria"
      });
    }
  } catch (error) {
    console.error("❌ Errore invio promemoria giornaliero personale:", error);
    return res.status(500).json({
      success: false,
      message: "Errore durante l'invio del promemoria",
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    });
  }
});

/**
 * POST /api/reminders/send-event/:eventId
 * Invia un promemoria per un evento specifico all'utente proprietario
 * Richiede autenticazione con ruolo admin o essere il proprietario dell'evento
 */
reminderRouter.post("/reminders/send-event/:eventId", verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const isUserAdmin = req.user?.role === 'admin';
    const eventId = Number(req.params.eventId);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Utente non autenticato"
      });
    }
    
    if (isNaN(eventId)) {
      return res.status(400).json({
        success: false,
        message: "ID evento non valido"
      });
    }
    
    // Recupera l'evento
    const event = await db.select()
      .from(schema.events)
      .where(sql`${schema.events.id} = ${eventId}`)
      .limit(1);
    
    if (!event || event.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Evento non trovato"
      });
    }
    
    // Verifica che l'utente sia proprietario o admin
    if (event[0].userId !== userId && !isUserAdmin) {
      return res.status(403).json({
        success: false,
        message: "Non autorizzato ad inviare promemoria per questo evento"
      });
    }
    
    // Ottiene l'email del proprietario dell'evento
    const owner = await db.select({
      email: schema.users.email
    })
    .from(schema.users)
    .where(sql`${schema.users.id} = ${event[0].userId}`)
    .limit(1);
    
    if (!owner || owner.length === 0 || !owner[0].email) {
      return res.status(404).json({
        success: false,
        message: "Email del proprietario dell'evento non trovata"
      });
    }
    
    // Invia il promemoria
    const success = await sendEventReminder(owner[0].email, event[0]);
    
    if (success) {
      return res.json({
        success: true,
        message: `Promemoria inviato con successo per l'evento "${event[0].title}"`
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Errore durante l'invio del promemoria"
      });
    }
  } catch (error) {
    console.error("❌ Errore invio promemoria evento specifico:", error);
    return res.status(500).json({
      success: false,
      message: "Errore durante l'invio del promemoria",
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    });
  }
});

export default reminderRouter;