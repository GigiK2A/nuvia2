/**
 * Estensione dei tipi per Express
 */

// Estendere l'interfaccia Request per includere l'utente autenticato
declare namespace Express {
  interface Request {
    user?: {
      userId: number | string; // Supporta sia ID numerici (in-memory) che ObjectId (MongoDB)
      email: string;
      role: string;
      iat?: number;
      exp?: number;
    };
  }
}