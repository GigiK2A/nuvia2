// File: routes/projectContext.ts

import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// 🔁 Recupera tutti i progetti per un utente
router.get('/projects/user/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    });
    res.status(200).json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// 🔄 Riapre ultimo progetto attivo
router.get('/projects/user/:userId/last', async (req, res) => {
  const { userId } = req.params;
  try {
    const project = await prisma.project.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    });
    res.status(200).json(project);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch last project' });
  }
});

// 🧠 Aggiunge o aggiorna memoria AI per un progetto
router.post('/projects/:id/memory', async (req, res) => {
  const { id } = req.params;
  const { memory } = req.body;
  try {
    const result = await prisma.project.update({
      where: { id },
      data: { memory }
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update memory' });
  }
});

export default router;