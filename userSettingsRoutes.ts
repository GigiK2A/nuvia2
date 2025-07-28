/**
 * Rotte per la gestione delle impostazioni utente
 * API REST complete per profilo, preferenze, backup e eliminazione account
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { verifyToken } from './authConfig';
import { storage } from './storage';
import type { UpdateUserSettings } from '@shared/schema';

const userSettingsRouter = Router();

// Middleware per verificare autenticazione
userSettingsRouter.use(verifyToken);

/**
 * GET /api/user/profile
 * Ottiene profilo utente e impostazioni complete
 */
userSettingsRouter.get('/profile', async (req: Request, res: Response) => {
  try {
    const userId = parseInt((req as any).user.userId) || 1; // Converti a number e fallback a 1
    
    // Recupera utente e impostazioni
    const user = await storage.getUser(userId);
    const settings = await storage.getUserSettings(userId);
    
    console.log(`🔍 Debug profilo - userId: ${userId} (tipo: ${typeof userId}), user trovato:`, !!user);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utente non trovato' 
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        settings: settings
      }
    });
  } catch (error) {
    console.error('Errore recupero profilo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore interno del server' 
    });
  }
});

/**
 * PUT /api/user/profile
 * Aggiorna informazioni profilo utente
 */
userSettingsRouter.put('/profile', async (req: Request, res: Response) => {
  try {
    const userId = parseInt((req as any).user.userId) || 1;
    
    console.log('📝 Dati ricevuti per aggiornamento profilo:', req.body);

    // Aggiorna solo i campi nome/cognome senza validazione email
    const settingsUpdate: any = {};
    
    if (req.body.firstName) {
      settingsUpdate.firstName = req.body.firstName;
    }
    
    if (req.body.lastName) {
      settingsUpdate.lastName = req.body.lastName;
    }
    
    if (req.body.avatarUrl !== undefined) {
      settingsUpdate.avatarUrl = req.body.avatarUrl;
    }

    // Aggiorna le impostazioni utente
    await storage.upsertUserSettings(userId, settingsUpdate);

    console.log('✅ Profilo aggiornato con successo per userId:', userId);

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

/**
 * PUT /api/user/settings
 * Aggiorna tutte le impostazioni utente
 */
userSettingsRouter.put('/settings', async (req: Request, res: Response) => {
  try {
    const userId = parseInt((req as any).user.userId) || 1;

    // Validation schema per impostazioni
    const settingsSchema = z.object({
      language: z.string().max(10).optional(),
      theme: z.string().max(20).optional(),
      aiModel: z.string().max(50).optional(),
      aiResponseStyle: z.string().max(50).optional(),
      customSystemPrompt: z.string().optional(),
      emailReminders: z.boolean().optional(),
      aiUpdates: z.boolean().optional(),
      twoFactorEnabled: z.boolean().optional()
    });

    const validatedSettings = settingsSchema.parse(req.body);

    // Aggiorna impostazioni
    await storage.upsertUserSettings(userId, validatedSettings);

    res.json({
      success: true,
      message: 'Impostazioni salvate con successo'
    });
  } catch (error) {
    console.error('Errore salvataggio impostazioni:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore durante il salvataggio delle impostazioni' 
    });
  }
});

/**
 * POST /api/user/change-password
 * Cambia password utente
 */
userSettingsRouter.post('/change-password', async (req: Request, res: Response) => {
  try {
    const userId = parseInt((req as any).user.userId) || 1;
    const { currentPassword, newPassword } = req.body;

    // Validation
    const passwordSchema = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(6)
    });

    const validatedData = passwordSchema.parse(req.body);

    // Verifica password attuale
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utente non trovato' 
      });
    }

    const isValidPassword = await bcrypt.compare(validatedData.currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password attuale non corretta' 
      });
    }

    // Hash nuova password
    const hashedNewPassword = await bcrypt.hash(validatedData.newPassword, 10);

    // Aggiorna password
    await storage.updateUserPassword(userId, hashedNewPassword);

    res.json({
      success: true,
      message: 'Password cambiata con successo'
    });
  } catch (error) {
    console.error('Errore cambio password:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore durante il cambio password' 
    });
  }
});

/**
 * GET /api/user/backup
 * Scarica backup completo dati utente
 */
userSettingsRouter.get('/backup', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    // Raccoglie tutti i dati utente
    const user = await storage.getUser(userId);
    const settings = await storage.getUserSettings(userId);
    const messages = await storage.getUserMessages(userId);
    const projects = await storage.getUserProjects(userId);
    const events = await storage.getUserEvents(userId);

    // Crea oggetto backup completo
    const backupData = {
      exportDate: new Date().toISOString(),
      userData: {
        email: user?.email,
        role: user?.role,
        createdAt: user?.createdAt
      },
      settings: settings,
      conversations: messages,
      projects: projects,
      events: events
    };

    // Imposta header per download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="backup-${userId}-${new Date().toISOString().split('T')[0]}.json"`);

    res.json(backupData);
  } catch (error) {
    console.error('Errore creazione backup:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore durante la creazione del backup' 
    });
  }
});

/**
 * DELETE /api/user/account
 * Elimina definitivamente account utente e tutti i dati associati
 */
userSettingsRouter.delete('/account', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { confirmation } = req.body;

    // Richiede conferma esplicita
    if (confirmation !== 'DELETE_MY_ACCOUNT') {
      return res.status(400).json({ 
        success: false, 
        message: 'Conferma richiesta per eliminare l\'account' 
      });
    }

    // Elimina tutti i dati dell'utente
    await storage.deleteUserData(userId);

    res.json({
      success: true,
      message: 'Account eliminato definitivamente'
    });
  } catch (error) {
    console.error('Errore eliminazione account:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore durante l\'eliminazione dell\'account' 
    });
  }
});

/**
 * POST /api/user/enable-2fa
 * Abilita autenticazione a due fattori
 */
userSettingsRouter.post('/enable-2fa', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    // Per ora implementazione base - in futuro integrazione con TOTP
    await storage.upsertUserSettings(userId, {
      twoFactorEnabled: true,
      twoFactorSecret: `secret_${userId}_${Date.now()}` // Placeholder
    });

    res.json({
      success: true,
      message: '2FA abilitato con successo',
      qrCode: 'data:image/png;base64,placeholder' // Placeholder per QR code
    });
  } catch (error) {
    console.error('Errore abilitazione 2FA:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore durante l\'abilitazione del 2FA' 
    });
  }
});

/**
 * POST /api/user/disable-2fa
 * Disabilita autenticazione a due fattori
 */
userSettingsRouter.post('/disable-2fa', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    await storage.upsertUserSettings(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: null
    });

    res.json({
      success: true,
      message: '2FA disabilitato con successo'
    });
  } catch (error) {
    console.error('Errore disabilitazione 2FA:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore durante la disabilitazione del 2FA' 
    });
  }
});

export default userSettingsRouter;