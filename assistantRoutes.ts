/**
 * Rotte per "Nuvia"
 * Questo modulo fornisce un assistente personale che risponde a richieste testuali
 * e recupera informazioni rilevanti (es. eventi del calendario)
 */
import { Router, Request, Response } from "express";
import { verifyToken } from "./authConfig";
import { storage } from "./storage";
import { z } from "zod";
import { DateTime } from "luxon";
import { db } from "./db/database";
import { eq, and, gte, lt } from "drizzle-orm";
import * as schema from "@shared/schema";
import { processNuviaRequest } from "./utils/aiClient";

// Schema validazione richiesta
const assistantRequestSchema = z.object({
  prompt: z.string()
});

const assistantRouter = Router();

/**
 * POST /api/assistant
 * Riceve un prompt testuale e risponde in base al contenuto
 */
assistantRouter.post("/assistant", async (req: Request, res: Response) => {
  try {
    // Valida i dati in input
    const validation = assistantRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Dati non validi",
        errors: validation.error.errors
      });
    }

    const { prompt } = validation.data;
    
    // Usa l'AI per generare una risposta intelligente senza contesto eventi per ora
    const response = await processNuviaRequest(prompt, "Nessun evento programmato per questa settimana.");

    return res.status(200).json({
      success: true,
      response
    });
    
  } catch (error) {
    console.error("Errore assistente:", error);
    return res.status(500).json({
      success: false,
      message: "Errore durante l'elaborazione della richiesta"
    });
  }
});

export default assistantRouter;