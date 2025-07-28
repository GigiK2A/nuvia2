/**
 * Modulo per la gestione dei progetti degli utenti
 * Questo modulo gestisce il salvataggio e il caricamento dei progetti
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import { verifyToken } from "./authConfig";
import { storage } from "./storage";
import { insertProjectSchema } from "@shared/schema";

const projectRouter = Router();

/**
 * POST /api/projects
 * Salva un nuovo progetto associato all'utente loggato
 */
projectRouter.post("/projects", verifyToken, async (req: Request, res: Response) => {
  try {
    // Valida i dati di input
    const projectData = insertProjectSchema.parse(req.body);
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Utente non autenticato",
      });
    }
    
    // Crea il nuovo progetto
    const newProject = await storage.createProject({
      userId: typeof userId === 'string' ? parseInt(userId, 10) : userId,
      name: projectData.name,
      files: JSON.stringify(projectData.files),
      description: projectData.description || null,
      thumbnail: projectData.thumbnail || null,
      isPublic: projectData.isPublic || false,
      createdAt: new Date(),
    });
    
    // Invia la risposta
    res.status(201).json({
      success: true,
      message: "Progetto salvato con successo",
      data: {
        project: newProject,
      },
    });
  } catch (error) {
    console.error("Errore salvataggio progetto:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Dati del progetto non validi",
        errors: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Errore durante il salvataggio del progetto",
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
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Utente non autenticato",
      });
    }
    
    let projects;
    if (userRole === "admin") {
      // Se l'utente è admin, restituisce tutti i progetti
      projects = await storage.getAllProjects();
    } else {
      // Altrimenti restituisce solo i progetti dell'utente
      const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
      projects = await storage.getProjectsByUserId(numericUserId);
    }
    
    res.json({
      success: true,
      data: {
        projects,
        count: projects.length,
      },
    });
  } catch (error) {
    console.error("Errore recupero progetti:", error);
    res.status(500).json({
      success: false,
      message: "Errore durante il recupero dei progetti",
    });
  }
});

/**
 * GET /api/projects/:id
 * Recupera un progetto specifico se l'utente è proprietario o admin
 */
projectRouter.get("/projects/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Utente non autenticato",
      });
    }
    
    // Recupera il progetto
    const project = await storage.getProject(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Progetto non trovato",
      });
    }
    
    // Verifica che l'utente sia proprietario o admin
    if (project.userId !== userId && userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Non hai i permessi per accedere a questo progetto",
      });
    }
    
    res.json({
      success: true,
      data: {
        project,
      },
    });
  } catch (error) {
    console.error("Errore recupero progetto:", error);
    res.status(500).json({
      success: false,
      message: "Errore durante il recupero del progetto",
    });
  }
});

export default projectRouter;