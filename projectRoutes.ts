// File: routes/project.js

import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// 📁 Crea un nuovo progetto
router.post('/projects', async (req, res) => {
  const { name, type, userId } = req.body;
  try {
    const project = await prisma.project.create({
      data: { name, type, userId }
    });
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// 📂 Ottieni tutti i progetti
router.get('/projects', async (req, res) => {
  try {
    const projects = await prisma.project.findMany();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// 💬 Aggiungi un messaggio chat
router.post('/projects/:id/chat', async (req, res) => {
  const { id: projectId } = req.params;
  const { role, content } = req.body;
  try {
    const message = await prisma.chatMessage.create({
      data: { role, content, projectId }
    });
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save chat message' });
  }
});

// 📄 Salva un documento
router.post('/projects/:id/document', async (req, res) => {
  const { id: projectId } = req.params;
  const { content, format } = req.body;
  try {
    const doc = await prisma.document.create({
      data: { content, format, projectId }
    });
    res.status(201).json(doc);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save document' });
  }
});

// 🧑‍💻 Salva uno snippet di codice
router.post('/projects/:id/code', async (req, res) => {
  const { id: projectId } = req.params;
  const { filename, code, language } = req.body;
  try {
    const snippet = await prisma.codeSnippet.create({
      data: { filename, code, language, projectId }
    });
    res.status(201).json(snippet);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save code snippet' });
  }
});

// 📥 GET endpoints for retrieving content
router.get('/projects/:id/chat', async (req, res) => {
  const { id: projectId } = req.params;
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' }
    });
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});

router.get('/projects/:id/documents', async (req, res) => {
  const { id: projectId } = req.params;
  try {
    const documents = await prisma.document.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ documents });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

router.get('/projects/:id/code', async (req, res) => {
  const { id: projectId } = req.params;
  try {
    const codeSnippets = await prisma.codeSnippet.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ codeSnippets });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch code snippets' });
  }
});

// 📦 Export project as ZIP
router.get('/projects/:id/export', async (req, res) => {
  const { id: projectId } = req.params;
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        chats: true,
        documents: true,
        codes: true
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const archiver = require('archiver');
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    res.attachment(`${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_export.zip`);
    archive.pipe(res);

    // Add project metadata
    archive.append(JSON.stringify({
      name: project.name,
      type: project.type,
      createdAt: project.createdAt,
      exportedAt: new Date().toISOString(),
      totalChats: project.chats.length,
      totalDocuments: project.documents.length,
      totalCodeSnippets: project.codes.length
    }, null, 2), { name: 'project.json' });

    // Add chat messages
    if (project.chats.length > 0) {
      const chatContent = project.chats.map(chat => 
        `[${chat.createdAt}] ${chat.role.toUpperCase()}: ${chat.content}`
      ).join('\n\n');
      archive.append(chatContent, { name: 'chat_history.txt' });
    }

    // Add documents
    project.documents.forEach((doc, index) => {
      archive.append(doc.content, { 
        name: `documents/document_${index + 1}_${doc.format}.txt` 
      });
    });

    // Add code snippets
    project.codes.forEach((code) => {
      archive.append(code.code, { 
        name: `code/${code.filename}` 
      });
    });

    archive.finalize();
  } catch (error) {
    res.status(500).json({ error: 'Failed to export project' });
  }
});

export default router;