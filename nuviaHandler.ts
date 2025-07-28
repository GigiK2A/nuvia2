/**
 * Controller per Nuvia - Assistente personale AI
 * Progettato per essere facilmente sostituibile con OpenAI in futuro
 */
import { DateTime } from "luxon";
import { db } from "./db/database";
import * as schema from "@shared/schema";
import { Request, Response } from "express";
import fs from 'fs';
import path from 'path';

async function interpretPrompt(prompt: string) {
  const lower = prompt.toLowerCase().trim();

  // Check se è un'aggiunta
  const isAdd = /(aggiungi|inserisci|metti)/.test(lower);
  const isToday = /oggi/.test(lower);
  const isTomorrow = /domani/.test(lower);
  const timeMatch = lower.match(/alle\s+(\d{1,2})(?::(\d{2}))?/);
  const titleMatch = lower.match(/(?:aggiungi|inserisci|metti)\s+(.*?)\s+(oggi|domani)/);

  if (isAdd && (isToday || isTomorrow) && timeMatch && titleMatch) {
    const hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const title = titleMatch[1].trim();

    const date = isToday
      ? DateTime.now().setZone("Europe/Rome")
      : DateTime.now().plus({ days: 1 }).setZone("Europe/Rome");

    return {
      action: "add_event",
      title,
      date: date.toFormat("yyyy-MM-dd"),
      time: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
    };
  }

  return { action: "unknown" };
}

async function nuviaHandler(req: Request, res: Response) {
  console.log("🔥 Ricevuta richiesta da utente:", req.body.prompt);
  
  const { prompt } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Utente non autenticato"
    });
  }

  try {
    console.log("📥 Prompt:", prompt);

    const parsed = await interpretPrompt(prompt);
    console.log("🧠 Interpretato:", parsed);
    console.log("🧠 PROMPT PARSING:", parsed);

    if (parsed.action === "add_event" && parsed.title && parsed.date && parsed.time) {
      const [hour, minute] = parsed.time.split(":").map(Number);

      const dateTimeRome = DateTime.fromISO(parsed.date, {
        zone: "Europe/Rome",
      }).set({ hour, minute, second: 0, millisecond: 0 });

      // 👉 Converti a data UTC precisa (controllata manualmente)
      // IMPORTANTE: sottraiamo 2 ore per compensare la differenza tra UTC e Rome
      // In questo modo, quando il frontend converte l'orario UTC in locale (Rome),
      // mostrerà correttamente l'orario inserito dall'utente
      const utcDate = new Date(Date.UTC(
        dateTimeRome.year,
        dateTimeRome.month - 1, // mesi JS 0-based
        dateTimeRome.day,
        dateTimeRome.hour - 2, // Compensazione fuso orario Roma (-2 ore rispetto a UTC)
        dateTimeRome.minute,
        0
      ));

      console.log("📆 Salvataggio evento UTC:", utcDate.toISOString());
      
      console.log("📆 SAVING EVENT TO DB:", {
        userId,
        title: parsed.title,
        utcDate: utcDate.toISOString(),
      });

      try {
        // Verifica se esiste già un evento simile per lo stesso giorno e con lo stesso titolo
        const { eq, and, sql } = await import('drizzle-orm');
        
        // Preparazione della data per il confronto (solo anno, mese, giorno)
        const startOfDay = new Date(Date.UTC(
          dateTimeRome.year,
          dateTimeRome.month - 1,
          dateTimeRome.day,
          0, 0, 0
        ));
        
        const endOfDay = new Date(Date.UTC(
          dateTimeRome.year,
          dateTimeRome.month - 1,
          dateTimeRome.day,
          23, 59, 59
        ));
        
        console.log(`🔍 Verifica eventi esistenti dal ${startOfDay.toISOString()} al ${endOfDay.toISOString()} con titolo "${parsed.title}"`);
        
        // Cerca eventi esistenti con lo stesso titolo nello stesso giorno
        const existingEvents = await db.select()
          .from(schema.events)
          .where(
            and(
              eq(schema.events.userId, Number(userId)),
              eq(schema.events.title, parsed.title),
              sql`${schema.events.date} >= ${startOfDay.toISOString()}`,
              sql`${schema.events.date} <= ${endOfDay.toISOString()}`
            )
          );
        
        console.log(`🔍 Eventi simili trovati: ${existingEvents.length}`);
        
        if (existingEvents.length > 0) {
          // Evento già esistente - aggiorniamo solo l'orario
          const eventId = existingEvents[0].id;
          
          await db.update(schema.events)
            .set({ 
              date: utcDate,
              description: `Evento aggiornato tramite Nuvia il ${DateTime.now().setZone("Europe/Rome").toFormat("dd/MM/yyyy")}`
            })
            .where(eq(schema.events.id, eventId));
            
          console.log(`✅ Evento esistente aggiornato con ID: ${eventId}`);
          return res.json({
            success: true,
            debug: {
              title: parsed.title,
              date: parsed.date,
              time: parsed.time,
              utcDate: utcDate.toISOString(),
              updated: true,
              eventId
            },
            response: `✅ Evento "${parsed.title}" aggiornato alle ${parsed.time}`,
          });
        } else {
          // Nessun evento simile trovato, creiamo uno nuovo
          const result = await db.insert(schema.events).values({
            userId: Number(userId),
            title: parsed.title,
            description: `Evento aggiunto tramite Nuvia il ${DateTime.now().setZone("Europe/Rome").toFormat("dd/MM/yyyy")}`,
            date: utcDate,
            type: "meeting",
          }).returning();
          
          console.log("✅ Nuovo evento inserito:", result);
        }
      } catch (error) {
        console.error("❌ Errore nell'inserimento dell'evento:", error);
        console.error("❌ NUVIA INSERT ERROR:", error);
        throw error;
      }

      // Prepara la risposta
      const response = `✅ Evento "${parsed.title}" salvato a ${utcDate.toISOString()} (per ${parsed.date} alle ${parsed.time})`;
      
      // Log della conversazione
      const logDir = path.resolve('./logs');
      if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
      
      const logLine = `[${DateTime.now().toFormat("yyyy-LL-dd HH:mm")}] User: ${userId || 'anon'}\nPrompt: ${prompt}\nRisposta: ${response}\nDettagli: Evento creato - data: ${parsed.date}, ora: ${parsed.time}\n\n`;
      fs.appendFileSync(path.join(logDir, 'nuvia.log'), logLine);
      
      // Invia la risposta al client
      return res.json({
        success: true,
        debug: {
          title: parsed.title,
          date: parsed.date,
          time: parsed.time,
          utcDate: utcDate.toISOString(),
        },
        response: response,
      });
    }

    // Prepara la risposta generica
    const genericResponse = "Non ho capito la richiesta. Prova con: 'aggiungi riunione domani alle 15:30'";
    
    // Log della conversazione generica
    const logDir = path.resolve('./logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
    
    const logLine = `[${DateTime.now().toFormat("yyyy-LL-dd HH:mm")}] User: ${userId || 'anon'}\nPrompt: ${prompt}\nRisposta: ${genericResponse}\n\n`;
    fs.appendFileSync(path.join(logDir, 'nuvia.log'), logLine);
    
    return res.json({
      success: true,
      response: genericResponse,
    });
  } catch (err: any) {
    console.error("❌ Errore Nuvia:", err);
    return res.status(500).json({
      success: false,
      message: "Errore durante l'elaborazione della richiesta",
      debug: err.message || err,
    });
  }
}

export default nuviaHandler;