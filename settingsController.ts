/**
 * Controller per la gestione delle preferenze utente con PostgreSQL
 * Sistema completo per salvare/recuperare impostazioni reali
 */
import { db } from './db';
import { userPreferences, users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import type { UserPreferences, UpdateUserPreferences } from '@shared/schema';

/**
 * Recupera le preferenze dell'utente dal database
 * Se non esistono, restituisce valori di default
 */
export async function getUserPreferences(userId: number): Promise<UserPreferences> {
  try {
    // Cerca le preferenze esistenti
    const [existing] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));

    if (existing) {
      return existing;
    }

    // Se non esistono, crea preferenze di default
    const [newPreferences] = await db
      .insert(userPreferences)
      .values({
        userId,
        firstName: '',
        lastName: '',
        preferredLanguage: 'it',
        systemPrompt: null,
      })
      .returning();

    return newPreferences;
  } catch (error) {
    console.error('❌ Errore recupero preferenze:', error);
    throw new Error('Impossibile recuperare le preferenze utente');
  }
}

/**
 * Salva o aggiorna le preferenze dell'utente
 */
export async function updateUserPreferences(
  userId: number, 
  updates: UpdateUserPreferences
): Promise<UserPreferences> {
  try {
    // Verifica se le preferenze esistono già
    const [existing] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));

    if (existing) {
      // Aggiorna preferenze esistenti
      const [updated] = await db
        .update(userPreferences)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(userPreferences.userId, userId))
        .returning();

      return updated;
    } else {
      // Crea nuove preferenze
      const [created] = await db
        .insert(userPreferences)
        .values({
          userId,
          firstName: updates.firstName || '',
          lastName: updates.lastName || '',
          preferredLanguage: updates.preferredLanguage || 'it',
          systemPrompt: updates.systemPrompt || null,
        })
        .returning();

      return created;
    }
  } catch (error) {
    console.error('❌ Errore salvataggio preferenze:', error);
    throw new Error('Impossibile salvare le preferenze');
  }
}

/**
 * Verifica se un utente esiste nel database
 */
export async function verifyUserExists(userId: number): Promise<boolean> {
  try {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId));
    
    return !!user;
  } catch (error) {
    console.error('❌ Errore verifica utente:', error);
    return false;
  }
}

/**
 * Crea un utente di default se non esiste
 */
export async function ensureUserExists(userId: number, email: string): Promise<void> {
  try {
    const exists = await verifyUserExists(userId);
    
    if (!exists) {
      await db
        .insert(users)
        .values({
          id: userId,
          email,
          password: '$2b$10$placeholder', // Password placeholder
          role: 'user',
        })
        .onConflictDoNothing();
    }
  } catch (error) {
    console.error('❌ Errore creazione utente:', error);
  }
}