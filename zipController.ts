import { Request, Response } from 'express';
import archiver from 'archiver';
import stream from 'stream';

export const exportProjectAsZip = async (req: Request, res: Response) => {
  try {
    const { files, projectName } = req.body;

    if (!files || !Array.isArray(files)) {
      return res.status(400).json({ 
        success: false,
        error: 'Formato files non valido. Richiesto array di files.' 
      });
    }

    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nessun file da includere nel ZIP'
      });
    }

    // Validazione dei files
    for (const file of files) {
      if (!file.path || !file.content) {
        return res.status(400).json({
          success: false,
          error: 'Ogni file deve avere path e content'
        });
      }
    }

    console.log(`📦 Creazione ZIP per progetto: ${projectName || 'project'}`);
    console.log(`📄 Files da includere: ${files.length}`);

    // Crea archiver
    const archive = archiver('zip', { 
      zlib: { level: 9 } // Massima compressione
    });
    
    const zipStream = new stream.PassThrough();
    const zipName = `${projectName || 'project'}.zip`;

    // Imposta headers per download
    res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Length', '0'); // Sarà aggiornato automaticamente

    // Pipe dell'archiver al response
    archive.pipe(zipStream);
    zipStream.pipe(res);

    // Gestione errori archiver
    archive.on('error', (err) => {
      console.error('❌ Errore archiver:', err);
      if (!res.headersSent) {
        res.status(500).json({ 
          success: false,
          error: 'Errore durante la creazione del file ZIP' 
        });
      }
    });

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('⚠️ Warning archiver:', err);
      } else {
        console.error('❌ Errore critico archiver:', err);
        throw err;
      }
    });

    // Aggiungi files all'archivio
    files.forEach((file: any, index: number) => {
      try {
        console.log(`📁 Aggiungendo file ${index + 1}/${files.length}: ${file.path}`);
        
        // Normalizza il path (rimuove eventuali slash iniziali)
        const normalizedPath = file.path.startsWith('/') 
          ? file.path.substring(1) 
          : file.path;
        
        archive.append(file.content, { name: normalizedPath });
      } catch (fileError) {
        console.error(`❌ Errore aggiungendo file ${file.path}:`, fileError);
      }
    });

    console.log('✅ Tutti i files aggiunti, finalizzando archivio...');

    // Finalizza l'archivio
    await archive.finalize();
    
    console.log('📦 ZIP creato e inviato con successo');

  } catch (err: any) {
    console.error('❌ Errore durante creazione ZIP:', err.message);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false,
        error: 'Errore durante la creazione del file ZIP',
        details: err.message
      });
    }
  }
};

/**
 * Endpoint per verificare lo stato del servizio ZIP
 */
export const getZipServiceStatus = async (req: Request, res: Response) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Servizio ZIP operativo',
      features: {
        compression: 'archiver',
        maxLevel: 9,
        streaming: true,
        formats: ['zip']
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Errore nel servizio ZIP'
    });
  }
};