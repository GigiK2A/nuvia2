/**
 * Rotte per "Nuvia"
 * Questo modulo fornisce un assistente personale che risponde a richieste testuali
 * e recupera informazioni rilevanti (es. eventi del calendario)
 */
import { Router, Request, Response } from "express";
import { verifyToken } from "./authConfig";
import { z } from "zod";
import nuviaHandler from "./nuviaHandler";

// Schema validazione richiesta
const nuviaRequestSchema = z.object({
  prompt: z.string()
});

const nuviaRouter = Router();

/**
 * POST /api/nuvia
 * Riceve un prompt testuale e risponde in base al contenuto
 */
nuviaRouter.post("/nuvia", verifyToken, async (req: Request, res: Response) => {
  try {
    // Valida i dati in input
    const validation = nuviaRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Dati non validi",
        errors: validation.error.errors
      });
    }
    
    // Passa la gestione al controller dedicato
    return nuviaHandler(req, res);
    
  } catch (error) {
    console.error("Errore Nuvia:", error);
    return res.status(500).json({
      success: false,
      message: "Errore durante l'elaborazione della richiesta"
    });
  }
});

export default nuviaRouter;