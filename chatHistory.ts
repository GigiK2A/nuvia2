import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/chat/history/:projectId - Recupera messaggi della chat per progetto
router.get('/history/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID è richiesto' });
    }

    const history = await prisma.chatMessage.findMany({
      where: { 
        projectId: projectId.toString() 
      },
      orderBy: { 
        createdAt: 'asc' 
      },
      select: {
        id: true,
        projectId: true,
        role: true,
        content: true,
        createdAt: true
      }
    });

    res.json(history);
  } catch (error) {
    console.error('Errore recupero cronologia chat:', error);
    res.status(500).json({ 
      error: 'Errore durante il recupero della cronologia chat' 
    });
  }
});

// POST /api/chat/history/:projectId - Salva nuovo messaggio
router.post('/history/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { role, content } = req.body;

    // Validazione input
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID è richiesto' });
    }

    if (!role || !content) {
      return res.status(400).json({ 
        error: 'role e content sono campi obbligatori' 
      });
    }

    if (!['user', 'ai'].includes(role)) {
      return res.status(400).json({ 
        error: 'role deve essere: user o ai' 
      });
    }

    // Verifica se il progetto esiste, altrimenti crealo
    let project = await prisma.project.findUnique({
      where: { id: projectId.toString() }
    });

    if (!project) {
      project = await prisma.project.create({
        data: {
          id: projectId.toString(),
          name: `Chat Project ${projectId}`,
          type: 'chat'
        }
      });
    }

    // Creazione nuovo messaggio
    const newMessage = await prisma.chatMessage.create({
      data: {
        projectId: projectId.toString(),
        role,
        content
      }
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Errore salvataggio messaggio chat:', error);
    res.status(500).json({ 
      error: 'Errore durante il salvataggio del messaggio' 
    });
  }
});

export default router;