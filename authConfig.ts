/**
 * Configurazione autenticazione JWT
 * Questo modulo gestisce la generazione e verifica dei token JWT
 */
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// In produzione, utilizzare process.env.SECRET_KEY
const SECRET_KEY = process.env.JWT_SECRET || 'nuvia-ai-secret-key-2025';

// Interfaccia per l'utente
interface User {
  id: number;
  email: string;
  role: string;
  [key: string]: any;
}

// Interfaccia per il payload del token
interface TokenPayload {
  userId: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Genera un token JWT per l'utente
 * @param user - Oggetto utente con id, email e ruolo
 * @returns Token JWT firmato
 */
export function generateToken(user: User): string {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    },
    SECRET_KEY,
    { expiresIn: "7d" } // Token valido per 7 giorni
  );
}

/**
 * Middleware per verificare la validità del token JWT
 * Da utilizzare per proteggere le rotte
 */
export function verifyToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"];
  const bearerToken = authHeader && authHeader.split(" ")[1]; // Format: "Bearer TOKEN"
  const cookieToken = req.cookies?.auth_token; // HTTP-only cookie from Google OAuth
  
  const token = bearerToken || cookieToken;
  
  if (!token) {
    res.status(401).json({ 
      success: false,
      message: "Accesso negato: token mancante" 
    });
    return;
  }

  try {
    // Handle temporary demo token during development
    if (token === 'workspace-demo-user') {
      req.user = {
        userId: 1,
        email: 'demo@nuvia.ai',
        role: 'user'
      };
      next();
      return;
    }
    
    const decoded = jwt.verify(token, SECRET_KEY) as TokenPayload;
    req.user = decoded; // Salva i dati dell'utente nella request
    next();
  } catch (error) {
    console.error("Errore verifica token:", error instanceof Error ? error.message : "Errore sconosciuto");
    
    // Allow document generation even with expired tokens
    if (req.path === '/api/document/generate' && error instanceof Error && error.message.includes('jwt expired')) {
      console.log("Consentendo accesso alla generazione documenti nonostante token scaduto");
      next();
      return;
    }
    
    res.status(403).json({ 
      success: false,
      message: "Token non valido o scaduto" 
    });
  }
}

/**
 * Middleware per verificare se l'utente ha ruolo admin
 * Da utilizzare dopo verifyToken
 */
export function isAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ 
      success: false,
      message: "Accesso negato: richiesto ruolo admin" 
    });
  }
}