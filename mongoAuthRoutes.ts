/**
 * Modulo per la gestione dell'autenticazione utenti con MongoDB
 * Questo modulo gestisce registrazione, login e protezione delle rotte
 * utilizzando JWT per l'autenticazione degli admin e dipendenti dell'ufficio
 */

import { Router, Request, Response } from "express";
import { generateToken, verifyToken, isAdmin } from "./authConfig";

const User = require("./models/User");
const authRouter = Router();

/**
 * POST /api/register
 * Registra un nuovo utente (admin o dipendente)
 */
authRouter.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;

    // Validazione base
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email e password sono richiesti"
      });
    }

    // Verifica se l'utente esiste già
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Un utente con questa email esiste già"
      });
    }

    // Crea nuovo utente
    const user = new User({
      email,
      password, // In produzione dovrebbe essere hashata
      role: role || "user" // Default è "user" se non specificato
    });

    await user.save();

    // Genera token JWT
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role
    });

    res.status(201).json({
      success: true,
      message: "Utente registrato con successo",
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        },
        token
      }
    });
  } catch (error) {
    console.error("Errore durante la registrazione:", error);
    res.status(500).json({
      success: false,
      message: "Errore durante la registrazione"
    });
  }
});

/**
 * POST /api/login
 * Effettua il login dell'utente
 */
authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Validazione base
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email e password sono richiesti"
      });
    }

    // Trova l'utente per email e password
    // In produzione dovremmo confrontare password hashate
    const user = await User.findOne({ email, password });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Credenziali non valide"
      });
    }
    
    // Genera token JWT
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role
    });
    
    res.json({
      success: true,
      message: "Login effettuato con successo",
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error("Errore durante il login:", error);
    res.status(500).json({
      success: false,
      message: "Errore durante il login"
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
    message: "Accesso effettuato con successo",
    user: req.user
  });
});

/**
 * GET /api/admin
 * Rotta riservata solo agli admin
 */
authRouter.get("/admin", verifyToken, isAdmin, (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Accesso admin effettuato con successo"
  });
});

/**
 * GET /api/users
 * Ottiene l'elenco degli utenti (solo per admin)
 */
authRouter.get("/users", verifyToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const users = await User.find({}, '-password'); // Esclude il campo password
    
    res.json({
      success: true,
      message: "Elenco utenti recuperato con successo",
      data: {
        users
      }
    });
  } catch (error) {
    console.error("Errore nel recupero degli utenti:", error);
    res.status(500).json({
      success: false,
      message: "Errore nel recupero degli utenti"
    });
  }
});

export default authRouter;