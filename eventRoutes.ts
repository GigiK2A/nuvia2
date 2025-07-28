/**
 * Rotte per il calendario degli eventi
 * Gestisce la creazione e il recupero degli eventi dell'utente
 */
import { Router, Request, Response } from "express";
import { verifyToken } from "./authConfig";
import { storage } from "./storage";
import { z } from "zod";
import { insertEventSchema } from "@shared/schema";
import { DateTime } from "luxon";

const eventRouter = Router();

/**
 * POST /api/events
 * Crea un nuovo evento associato all'utente loggato
 */
eventRouter.post("/events", verifyToken, async (req: Request, res: Response) => {
  try {
    // Verifica che l'utente sia loggato
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Utente non autenticato",
      });
    }

    // Validazione dati input
    const validation = insertEventSchema
      .extend({
        // Interpretiamo la stringa come ora di Roma e convertiamo in UTC
        date: z.string().transform((val) => {
          // Interpreta la data nel fuso orario di Roma (senza manipolazioni)
          const romeTime = DateTime.fromISO(val, { zone: 'Europe/Rome' });
          
          // Converti a UTC per salvare correttamente in Postgres
          const utcTime = romeTime.toUTC().toISO(); // formato ISO 8601
          
          console.log(`Data originale: ${val} → Rome: ${romeTime.toString()} → UTC: ${utcTime}`);
          
          // Restituisci la data come oggetto JavaScript
          return new Date(utcTime);
        })
      })
      .safeParse({
        ...req.body,
        userId,
      });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Dati evento non validi",
        errors: validation.error.errors,
      });
    }

    // Salva evento
    const event = await storage.createEvent(validation.data);

    return res.status(201).json({
      success: true,
      message: "Evento creato con successo",
      data: { event },
    });
  } catch (error) {
    console.error("Errore creazione evento:", error);
    return res.status(500).json({
      success: false,
      message: "Errore interno durante la creazione dell'evento",
    });
  }
});

/**
 * GET /api/events
 * Recupera tutti gli eventi dell'utente
 */
eventRouter.get("/events", verifyToken, async (req: Request, res: Response) => {
  try {
    // Verifica che l'utente sia loggato
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Utente non autenticato",
      });
    }

    console.log("🔍 Ricerca eventi per utente:", userId);

    // Verifica manuale diretta con DB
    const { db } = await import('./db/database');
    const eventsFromDB = await db.query.events.findMany({
      where: (events, { eq }) => eq(events.userId, Number(userId))
    });
    
    console.log("🔍 Eventi direttamente dal DB:", JSON.stringify(eventsFromDB, null, 2));

    // Recupera eventi (assicuriamo che userId sia un numero)
    const events = await storage.getUserEvents(Number(userId));
    
    // Logging per debug dei dati degli eventi
    console.log("📅 Eventi recuperati dal storage:", JSON.stringify(events, null, 2));
    
    // Verifica se stiamo usando l'implementazione di storage corretta
    const storageImplementation = typeof storage.constructor === 'function' 
      ? storage.constructor.name 
      : 'Sconosciuto';
    console.log("🔍 Tipo di storage in uso:", storageImplementation);

    // Utilizziamo i dati diretti dal DB per garantire il funzionamento
    const eventsToSend = eventsFromDB.length > 0 ? eventsFromDB : events;

    return res.json({
      success: true,
      data: { events: eventsToSend },
      debug: {
        fromDB: eventsFromDB.length,
        fromStorage: events.length,
        storageType: storageImplementation
      }
    });
  } catch (error) {
    console.error("❌ Errore recupero eventi:", error);
    return res.status(500).json({
      success: false,
      message: "Errore interno durante il recupero degli eventi",
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    });
  }
});

/**
 * DELETE /api/events/:id
 * Elimina un evento specifico
 */
eventRouter.delete("/events/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    // Verifica che l'utente sia loggato
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Utente non autenticato",
      });
    }
    
    // Ottieni l'ID dell'evento
    const eventId = parseInt(req.params.id, 10);
    if (isNaN(eventId)) {
      return res.status(400).json({
        success: false,
        message: "ID evento non valido",
      });
    }
    
    console.log(`🗑️ Richiesta eliminazione evento ID: ${eventId} da utente ID: ${userId}`);
    
    // Otteniamo una referenza diretta al database
    const { db } = await import('./db/database');
    const schema = await import('../shared/schema');
    const { eq } = await import('drizzle-orm');
    
    console.log(`🔧 Tentativo di eliminare evento ID ${eventId} con schema: ${Object.keys(schema)}`);
    
    // Eliminiamo direttamente dal database usando Drizzle ORM
    const result = await db.delete(schema.events)
      .where(eq(schema.events.id, eventId))
      .returning();
  
    console.log(`✅ Risultato eliminazione DB:`, result);
    
    const success = result.length > 0;
  
    if (!success) {
      return res.status(404).json({
        success: false,
        message: "Evento non trovato o non sei autorizzato a eliminarlo",
      });
    }
    
    return res.json({
      success: true,
      message: "Evento eliminato con successo",
      debug: { result }
    });
  } catch (error) {
    console.error("❌ Errore eliminazione evento:", error);
    return res.status(500).json({
      success: false,
      message: "Errore interno durante l'eliminazione dell'evento",
      debug: error instanceof Error ? error.message : 'Errore sconosciuto'
    });
  }
});

/**
 * GET /api/events/today
 * Recupera tutti gli eventi per la data odierna (senza filtro utente)
 */
eventRouter.get("/events/today", async (req: Request, res: Response) => {
  try {
    // Ottiene la data di oggi nel formato YYYY-MM-DD nel fuso orario di Roma
    const today = DateTime.now().setZone("Europe/Rome").toFormat("yyyy-MM-dd");
    console.log(`📅 Ricerca eventi per oggi (${today})`);

    // Importa i moduli necessari
    const { db } = await import('./db/database');
    const { sql } = await import('drizzle-orm');
    const schema = await import('../shared/schema');
    
    // Calcola l'inizio e la fine della giornata in UTC
    const startOfDay = DateTime.fromISO(`${today}T00:00:00`, { zone: "Europe/Rome" }).toUTC().toJSDate();
    const endOfDay = DateTime.fromISO(`${today}T23:59:59`, { zone: "Europe/Rome" }).toUTC().toJSDate();
    
    console.log(`🔍 Intervallo di ricerca: ${startOfDay.toISOString()} - ${endOfDay.toISOString()}`);
    
    // Cerca tutti gli eventi per oggi, senza filtro per utente
    const eventsToday = await db.select({
        id: schema.events.id,
        title: schema.events.title,
        date: schema.events.date,
      })
      .from(schema.events)
      .where(
        sql`${schema.events.date} >= ${startOfDay.toISOString()} AND ${schema.events.date} <= ${endOfDay.toISOString()}`
      )
      .orderBy(schema.events.date);
    
    console.log(`✅ Eventi trovati oggi: ${eventsToday.length}`);
    
    return res.json(eventsToday);
  } catch (error) {
    console.error("❌ Errore recupero eventi odierni:", error);
    return res.status(500).json({
      success: false,
      message: "Errore interno durante il recupero degli eventi odierni",
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    });
  }
});

export default eventRouter;