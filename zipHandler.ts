// server/zipHandler.ts
import { Request, Response } from 'express';
import JSZip from 'jszip';

export async function downloadZipHandler(req: Request, res: Response) {
  try {
    const { files, projectName } = req.body;
    
    if (!files || typeof files !== 'object') {
      return res.status(400).json({ error: 'Files object is required' });
    }

    const zip = new JSZip();
    
    // Aggiungi tutti i file al ZIP
    for (const [filename, content] of Object.entries(files)) {
      if (typeof content === 'string') {
        zip.file(filename, content);
      }
    }
    
    // Genera il buffer ZIP
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    
    // Imposta gli header per il download
    const downloadName = projectName ? `${projectName}.zip` : 'progetto.zip';
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Length', zipBuffer.length);
    
    // Invia il file ZIP
    res.send(zipBuffer);
    
    console.log(`📦 ZIP generato per progetto: ${downloadName} (${Object.keys(files).length} file)`);
    
  } catch (error) {
    console.error('Errore generazione ZIP:', error);
    res.status(500).json({ error: 'Errore nella generazione del file ZIP' });
  }
}