// File: routes/export.ts

import express from 'express';
import { PrismaClient } from '@prisma/client';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/export/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        chats: true,
        documents: true,
        codes: true
      }
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });

    const tempDir = path.join('/tmp', id);
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    // Salva Chat
    if (project.chats.length > 0) {
      fs.writeFileSync(path.join(tempDir, 'chat.json'), JSON.stringify(project.chats, null, 2));
    }

    // Salva Documenti
    if (project.documents.length > 0) {
      const docsDir = path.join(tempDir, 'documents');
      if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir);
      
      for (const doc of project.documents) {
        const ext = doc.format === 'pdf' ? '.pdf' : '.docx';
        fs.writeFileSync(path.join(docsDir, `document-${doc.id}${ext}`), doc.content);
      }
    }

    // Salva Codice
    if (project.codes.length > 0) {
      const codeDir = path.join(tempDir, 'code');
      if (!fs.existsSync(codeDir)) fs.mkdirSync(codeDir);
      
      for (const code of project.codes) {
        fs.writeFileSync(path.join(codeDir, code.filename), code.code);
      }
    }

    // Salva metadata del progetto
    const metadata = {
      name: project.name,
      type: project.type,
      createdAt: project.createdAt,
      exportedAt: new Date().toISOString(),
      totalChats: project.chats.length,
      totalDocuments: project.documents.length,
      totalCodeSnippets: project.codes.length
    };
    fs.writeFileSync(path.join(tempDir, 'project-info.json'), JSON.stringify(metadata, null, 2));

    // Crea ZIP
    const zipPath = path.join('/tmp', `${id}.zip`);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      const filename = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_export.zip`;
      res.download(zipPath, filename, (err) => {
        // Cleanup files after download
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
        if (fs.existsSync(zipPath)) {
          fs.unlinkSync(zipPath);
        }
        if (err) {
          console.error('Download error:', err);
        }
      });
    });

    archive.on('error', (err) => {
      console.error('Archive error:', err);
      res.status(500).json({ error: 'Failed to create archive' });
    });

    archive.pipe(output);
    archive.directory(tempDir, false);
    archive.finalize();

  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Failed to export project' });
  }
});

export default router;