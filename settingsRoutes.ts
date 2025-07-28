/**
 * API REST per la gestione delle preferenze utente
 * Sistema PostgreSQL per impostazioni persistenti
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { verifyToken } from './authConfig';
import { getUserPreferences, updateUserPreferences, ensureUserExists } from './settingsController';
import type { UpdateUserPreferences } from '@shared/schema';

const settingsRouter = Router();

// Middleware di autenticazione per tutte le rotte
settingsRouter.use(verifyToken);

/**
 * GET /api/settings
 * Recupera le impostazioni dell'utente loggato
 */
settingsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = parseInt((req as any).user.userId);
    const userEmail = (req as any).user.email || 'user@esempio.com';

    // Assicurati che l'utente esista nel database
    await ensureUserExists(userId, userEmail);

    // Recupera le preferenze
    const preferences = await getUserPreferences(userId);

    console.log(`✅ Preferenze recuperate per userId: ${userId}`);

    res.json({
      success: true,
      data: {
        firstName: preferences.firstName || '',
        lastName: preferences.lastName || '',
        preferredLanguage: preferences.preferredLanguage || 'it',
        systemPrompt: preferences.systemPrompt || ''
      }
    });
  } catch (error) {
    console.error('❌ Errore recupero impostazioni:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero delle impostazioni'
    });
  }
});

/**
 * POST /api/settings
 * Salva o aggiorna le preferenze dell'utente
 */
settingsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const userId = parseInt((req as any).user.userId);
    const userEmail = (req as any).user.email || 'user@esempio.com';

    // Schema di validazione
    const settingsSchema = z.object({
      firstName: z.string().max(100).optional(),
      lastName: z.string().max(100).optional(),
      preferredLanguage: z.string().max(10).optional(),
      systemPrompt: z.string().optional()
    });

    const validatedData = settingsSchema.parse(req.body);

    console.log(`📝 Salvataggio preferenze per userId: ${userId}`, validatedData);

    // Assicurati che l'utente esista nel database
    await ensureUserExists(userId, userEmail);

    // Aggiorna le preferenze
    const updatedPreferences = await updateUserPreferences(userId, validatedData);

    res.json({
      success: true,
      message: 'Impostazioni salvate con successo',
      data: {
        firstName: updatedPreferences.firstName,
        lastName: updatedPreferences.lastName,
        preferredLanguage: updatedPreferences.preferredLanguage,
        systemPrompt: updatedPreferences.systemPrompt
      }
    });
  } catch (error) {
    console.error('❌ Errore salvataggio impostazioni:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Errore durante il salvataggio delle impostazioni'
    });
  }
});

/**
 * GET /api/settings/profile
 * Recupera solo le informazioni del profilo (nome e cognome)
 */
settingsRouter.get('/profile', async (req: Request, res: Response) => {
  try {
    const userId = parseInt((req as any).user.userId);
    const userEmail = (req as any).user.email || 'user@esempio.com';

    await ensureUserExists(userId, userEmail);
    const preferences = await getUserPreferences(userId);

    res.json({
      success: true,
      data: {
        firstName: preferences.firstName || '',
        lastName: preferences.lastName || ''
      }
    });
  } catch (error) {
    console.error('❌ Errore recupero profilo:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero del profilo'
    });
  }
});

/**
 * PUT /api/settings/profile
 * Aggiorna solo nome e cognome
 */
settingsRouter.put('/profile', async (req: Request, res: Response) => {
  try {
    const userId = parseInt((req as any).user.userId);
    const userEmail = (req as any).user.email || 'user@esempio.com';

    const profileSchema = z.object({
      firstName: z.string().max(100).optional(),
      lastName: z.string().max(100).optional()
    });

    const validatedData = profileSchema.parse(req.body);

    await ensureUserExists(userId, userEmail);
    
    await updateUserPreferences(userId, validatedData);

    res.json({
      success: true,
      message: 'Profilo aggiornato con successo'
    });
  } catch (error) {
    console.error('❌ Errore aggiornamento profilo:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante l\'aggiornamento del profilo'
    });
  }
});

export default settingsRouter;