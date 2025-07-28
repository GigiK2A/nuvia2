/**
 * Helper per la creazione di eventi da comandi testuali
 */
import { DateTime } from "luxon";
import { eq, and, gte, lt } from "drizzle-orm";
import { db } from "./db/database";
import * as schema from "@shared/schema";

/**
 * Crea un evento dal comando utente
 * @param userId ID dell'utente
 * @param command Comando testuale (es. "aggiungi riunione domani alle 15")
 * @returns Oggetto con info sull'esito dell'operazione
 */
export async function createEventFromCommand(userId: number, command: string): Promise<{
  success: boolean;
  message: string;
  eventData?: {
    title: string;
    day: string;
    time: string;
  }
}> {
  console.log("EventHelper - comando ricevuto:", command);
  
  // Normalizza il comando
  const normalizedCommand = command.toLowerCase().trim();
  
  // Verifica se è un comando di aggiunta
  if (!normalizedCommand.startsWith("aggiungi")) {
    return {
      success: false,
      message: "Il comando deve iniziare con 'aggiungi'"
    };
  }
  
  try {
    // 1. Determina il giorno (oggi o domani)
    let day = "";
    if (normalizedCommand.includes("domani")) {
      day = "domani";
    } else if (normalizedCommand.includes("oggi")) {
      day = "oggi";
    } else {
      return {
        success: false,
        message: "Specificare 'oggi' o 'domani' nel comando"
      };
    }
    
    // 2. Estrai l'orario
    const timeRegex = /alle\s+(\d{1,2})(?::(\d{1,2}))?/i;
    const timeMatch = normalizedCommand.match(timeRegex);
    
    if (!timeMatch) {
      return {
        success: false,
        message: "Specificare l'orario con 'alle X' o 'alle X:Y'"
      };
    }
    
    const hour = parseInt(timeMatch[1]);
    const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    
    if (hour < 0 || hour > 23) {
      return {
        success: false,
        message: "L'ora deve essere compresa tra 0 e 23"
      };
    }
    
    // 3. Estrai il titolo (parte tra "aggiungi" e "oggi/domani")
    let titleEndIndex;
    if (day === "oggi") {
      titleEndIndex = normalizedCommand.indexOf("oggi");
    } else {
      titleEndIndex = normalizedCommand.indexOf("domani");
    }
    
    // Estrai il titolo partendo dopo "aggiungi " (8 caratteri)
    const title = command.substring(8, titleEndIndex).trim();
    
    if (!title) {
      return {
        success: false,
        message: "Specificare un titolo per l'evento"
      };
    }
    
    // 4. Costruisci la data dell'evento
    let eventDate;
    if (day === "oggi") {
      eventDate = DateTime.now().setZone("Europe/Rome").set({ 
        hour, 
        minute, 
        second: 0, 
        millisecond: 0 
      });
    } else {
      eventDate = DateTime.now().setZone("Europe/Rome").plus({ days: 1 }).set({ 
        hour, 
        minute, 
        second: 0, 
        millisecond: 0 
      });
    }
    
    // 5. Salva l'evento nel database
    await db.insert(schema.events).values({
      userId: Number(userId),
      title: title,
      description: `Evento aggiunto tramite Nuvia il ${DateTime.now().setZone("Europe/Rome").toFormat("dd/MM/yyyy")}`,
      date: eventDate.toJSDate(),
      type: "meeting"
    });
    
    // 6. Formatta l'orario per la risposta
    const timeDisplay = `${hour}:${minute.toString().padStart(2, '0')}`;
    
    console.log("EventHelper - evento creato:", {
      title,
      day,
      time: timeDisplay,
      date: eventDate.toISO()
    });
    
    return {
      success: true,
      message: `Evento aggiunto con successo`,
      eventData: {
        title,
        day,
        time: timeDisplay
      }
    };
    
  } catch (error) {
    console.error("EventHelper - errore:", error);
    return {
      success: false,
      message: "Errore durante la creazione dell'evento"
    };
  }
}