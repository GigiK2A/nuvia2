/**
 * Modulo per la gestione dei progetti degli utenti con MongoDB
 * Questo modulo gestisce il salvataggio e il caricamento dei progetti
 */

import { Router, Request, Response } from "express";
import { verifyToken, isAdmin } from "./authConfig";

const Project = require("./models/Project");
const projectRouter = Router();

/**
 * POST /api/projects
 * Salva un nuovo progetto associato all'utente loggato
 */
projectRouter.post("/projects", verifyToken, async (req: Request, res: Response) => {
  try {
    const { name, files } = req.body;
    
    // Validazione base
    if (!name || !files) {
      return res.status(400).json({
        success: false,
        message: "Nome e files sono richiesti"
      });
    }
    
    // Crea un nuovo progetto
    const project = new Project({
      ownerId: req.user.userId, // ID utente dal token JWT
      name,
      files
    });
    
    await project.save();
    
    res.status(201).json({
      success: true,
      message: "Progetto salvato con successo",
      data: {
        project
      }
    });
  } catch (error) {
    console.error("Errore durante il salvataggio del progetto:", error);
    res.status(500).json({
      success: false,
      message: "Errore durante il salvataggio del progetto"
    });
  }
});

/**
 * GET /api/projects
 * Recupera i progetti dell'utente. Se l'utente è admin, restituisce tutti i progetti.
 * Altrimenti restituisce solo i progetti dell'utente loggato.
 */
projectRouter.get("/projects", verifyToken, async (req: Request, res: Response) => {
  try {
    let projects;
    
    // Se l'utente è admin, recupera tutti i progetti
    if (req.user.role === "admin") {
      projects = await Project.find().sort({ createdAt: -1 });
    } else {
      // Altrimenti recupera solo i progetti dell'utente
      projects = await Project.find({ ownerId: req.user.userId }).sort({ createdAt: -1 });
    }
    
    res.json({
      success: true,
      data: {
        projects,
        count: projects.length
      }
    });
  } catch (error) {
    console.error("Errore durante il recupero dei progetti:", error);
    res.status(500).json({
      success: false,
      message: "Errore durante il recupero dei progetti"
    });
  }
});

/**
 * GET /api/projects/:id
 * Recupera un progetto specifico se l'utente è proprietario o admin
 */
projectRouter.get("/projects/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    
    // Recupera il progetto
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Progetto non trovato"
      });
    }
    
    // Verifica che l'utente sia proprietario o admin
    if (project.ownerId.toString() !== req.user.userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Non hai i permessi per accedere a questo progetto"
      });
    }
    
    res.json({
      success: true,
      data: {
        project
      }
    });
  } catch (error) {
    console.error("Errore durante il recupero del progetto:", error);
    res.status(500).json({
      success: false,
      message: "Errore durante il recupero del progetto"
    });
  }
});

/**
 * PUT /api/projects/:id
 * Aggiorna un progetto esistente se l'utente è proprietario o admin
 */
projectRouter.put("/projects/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const { name, files } = req.body;
    
    // Recupera il progetto
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Progetto non trovato"
      });
    }
    
    // Verifica che l'utente sia proprietario o admin
    if (project.ownerId.toString() !== req.user.userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Non hai i permessi per modificare questo progetto"
      });
    }
    
    // Aggiorna il progetto
    if (name) project.name = name;
    if (files) project.files = files;
    
    await project.save();
    
    res.json({
      success: true,
      message: "Progetto aggiornato con successo",
      data: {
        project
      }
    });
  } catch (error) {
    console.error("Errore durante l'aggiornamento del progetto:", error);
    res.status(500).json({
      success: false,
      message: "Errore durante l'aggiornamento del progetto"
    });
  }
});

/**
 * DELETE /api/projects/:id
 * Elimina un progetto se l'utente è proprietario o admin
 */
projectRouter.delete("/projects/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    
    // Recupera il progetto
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Progetto non trovato"
      });
    }
    
    // Verifica che l'utente sia proprietario o admin
    if (project.ownerId.toString() !== req.user.userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Non hai i permessi per eliminare questo progetto"
      });
    }
    
    // Elimina il progetto
    await Project.findByIdAndDelete(projectId);
    
    res.json({
      success: true,
      message: "Progetto eliminato con successo"
    });
  } catch (error) {
    console.error("Errore durante l'eliminazione del progetto:", error);
    res.status(500).json({
      success: false,
      message: "Errore durante l'eliminazione del progetto"
    });
  }
});

export default projectRouter;