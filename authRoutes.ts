/**
 * Modulo per la gestione dell'autenticazione utenti
 * Questo modulo gestisce registrazione, login e protezione delle rotte
 * utilizzando JWT per l'autenticazione degli admin e dipendenti dell'ufficio
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import { generateToken, verifyToken, isAdmin } from "./authConfig";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

// Schema per la validazione della registrazione
const registerUserSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(6, "La password deve avere almeno 6 caratteri"),
  role: z.enum(["admin", "user"], {
    errorMap: () => ({ message: "Il ruolo deve essere 'admin' o 'user'" }),
  }),
});

// Schema per la validazione del login
const loginUserSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string(),
});

// Creazione del router
const authRouter = Router();

/**
 * POST /api/register
 * Registra un nuovo utente (admin o dipendente)
 */
authRouter.post("/register", async (req: Request, res: Response) => {
  try {
    // Valida i dati di input
    const userData = registerUserSchema.parse(req.body);
    
    // Verifica se l'utente esiste già nel database
    const existingUser = await db.select().from(users).where(eq(users.email, userData.email));
    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email già registrata",
      });
    }
    
    // Hash della password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    // Crea il nuovo utente nel database PostgreSQL
    const [newUser] = await db.insert(users).values({
      email: userData.email,
      password: hashedPassword,
      role: userData.role,
    }).returning({
      id: users.id,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    });
    
    // Genera il token JWT
    const token = generateToken(newUser);
    
    // Invia la risposta (senza esporre la password)
    res.status(201).json({
      success: true,
      message: "Utente registrato con successo",
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          createdAt: newUser.createdAt,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Errore registrazione:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Dati di registrazione non validi",
        errors: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Errore durante la registrazione",
    });
  }
});

/**
 * POST /api/login
 * Effettua il login dell'utente
 */
authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    // Valida i dati di input
    const loginData = loginUserSchema.parse(req.body);
    
    // Cerca l'utente nel database PostgreSQL
    const [user] = await db.select().from(users).where(eq(users.email, loginData.email));
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Credenziali non valide",
      });
    }
    
    // Verifica la password con bcrypt
    const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Credenziali non valide",
      });
    }
    
    // Genera il token JWT
    const token = generateToken(user);
    
    // Invia la risposta
    res.json({
      success: true,
      message: "Login effettuato con successo",
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Errore login:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Dati di login non validi",
        errors: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Errore durante il login",
    });
  }
});

/**
 * GET /api/protected
 * Rotta protetta di test accessibile solo con token valido
 */
authRouter.get("/protected", verifyToken, (req: Request, res: Response) => {
  res.json({
    success: true,
    message: `Accesso effettuato con successo`,
    user: req.user,
    data: {
      user: req.user,
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * GET /api/admin
 * Rotta riservata solo agli admin
 */
authRouter.get("/admin", verifyToken, isAdmin, (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Accesso admin effettuato con successo",
    data: {
      user: req.user,
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * GET /api/users
 * Ottiene l'elenco degli utenti (solo per admin)
 */
authRouter.get("/users", verifyToken, isAdmin, async (req: Request, res: Response) => {
  try {
    // Recupera tutti gli utenti dal database PostgreSQL
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    }).from(users);
    
    res.json({
      success: true,
      message: "Elenco utenti recuperato con successo",
      data: {
        users: allUsers,
        total: allUsers.length,
      },
    });
  } catch (error) {
    console.error("Errore recupero utenti:", error);
    res.status(500).json({
      success: false,
      message: "Errore durante il recupero degli utenti",
    });
  }
});

/**
 * PUT /api/users/:id
 * Modifica un utente esistente (solo per admin)
 */
authRouter.put("/users/:id", verifyToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({
        success: false,
        message: "Email e ruolo sono obbligatori",
      });
    }

    // Aggiorna l'utente nel database PostgreSQL
    const [updatedUser] = await db.update(users)
      .set({ email, role })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "Utente non trovato",
      });
    }

    res.json({
      success: true,
      message: "Utente modificato con successo",
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error("Errore modifica utente:", error);
    res.status(500).json({
      success: false,
      message: "Errore durante la modifica dell'utente",
    });
  }
});

/**
 * DELETE /api/users/:id
 * Elimina un utente (solo per admin)
 */
authRouter.delete("/users/:id", verifyToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);

    // Elimina l'utente dal database PostgreSQL
    const deletedUser = await db.delete(users)
      .where(eq(users.id, userId))
      .returning({ id: users.id });

    if (!deletedUser.length) {
      return res.status(404).json({
        success: false,
        message: "Utente non trovato",
      });
    }

    res.json({
      success: true,
      message: "Utente eliminato con successo",
    });
  } catch (error) {
    console.error("Errore eliminazione utente:", error);
    res.status(500).json({
      success: false,
      message: "Errore durante l'eliminazione dell'utente",
    });
  }
});

export default authRouter;