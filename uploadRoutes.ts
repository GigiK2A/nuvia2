/**
 * Rotte per la gestione del caricamento e dell'elaborazione dei file
 */

import { Express, Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import multer from 'multer';
import { fileMemory, processFile } from './fileProcessor';
import mammoth from 'mammoth';

// Utilizziamo memory storage per maggiore efficienza e per evitare problemi con i path dei file
// Questo permette anche di accedere direttamente al buffer del file per l'elaborazione
const storage = multer.memoryStorage();

// Filtro per i tipi di file accettati
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Verifica se il tipo MIME è supportato
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];
  
  // Verifica l'estensione del file
  const allowedExtensions = ['.pdf', '.docx', '.xlsx', '.txt'];
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo di file non supportato. Sono accettati solo PDF, DOCX, XLSX e TXT.'));
  }
};

// Configurazione dell'upload
const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // Limite di 10MB per file
});

export function registerUploadRoutes(app: Express): void {
  // Endpoint per il caricamento dei file
  app.post('/api/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          error: 'Nessun file caricato',
          message: 'Seleziona un file da caricare (PDF, DOCX, XLSX o TXT).'
        });
      }
      
      let text = '';
      let summary = '';
      
      // Elaboriamo il file in base al tipo
      try {
        if (req.file.mimetype === 'application/pdf') {
          // Per i PDF, utilizziamo un'estrazione migliorata basata sul raw buffer
          // Estrazione avanzata del testo con tecnica custom
          const rawString = req.file.buffer.toString('utf-8', 0, 50000);
          
          // Usiamo pattern regex avanzati per estrarre testo leggibile
          const textPattern = /[a-zA-Z0-9àèìòùáéíóúäëïöüçñÀÈÌÒÙÁÉÍÓÚÄËÏÖÜÇÑ\s.,;:!?()"'\-]{20,100}/g;
          const matches = rawString.match(textPattern) || [];
          
          // Filtriamo per escludere codice PDF
          const filteredMatches = matches.filter(match => {
            // Lista aggiornata di parole chiave del codice PDF da escludere
            const pdfKeywords = ['obj', 'endobj', 'stream', 'endstream', '/Contents', 
                                '/Page', '/Type', '/Font', '/Length', '/Filter', 
                                '/Image', 'xref', 'trailer', 'startxref', '/Encoding'];
            
            // Verifichiamo se il testo contiene una di queste parole chiave
            const containsPdfKeyword = pdfKeywords.some(keyword => match.includes(keyword));
            
            // Verifichiamo se sembra un testo reale
            const looksLikeRealText = match.includes(' ') && 
                                    !/^[0-9\s]+$/.test(match) &&
                                    match.trim().length > 30;
            
            return !containsPdfKeyword && looksLikeRealText;
          });
          
          // Prendiamo i migliori risultati
          const sortedMatches = filteredMatches
            .sort((a, b) => b.length - a.length)
            .slice(0, 8);
            
          // Estraiamo il titolo se presente
          const titleMatch = rawString.match(/\/Title\s*\(([^)]+)\)/);
          const documentTitle = titleMatch ? titleMatch[1].replace(/\\|\(|\)/g, '') : null;
          
          // Stimiamo il numero di pagine
          const pageMarkers = rawString.match(/\/Type\s*\/Page|\/Page\s*<<|\/Pages\s*<<|\/Count\s+\d+/g) || [];
          const pageCountMatch = rawString.match(/\/Count\s+(\d+)/);
          
          let numPages = 1;
          if (pageCountMatch && pageCountMatch[1]) {
            numPages = parseInt(pageCountMatch[1], 10);
          } else if (pageMarkers.length > 0) {
            numPages = Math.max(1, Math.ceil(pageMarkers.length / 2));
          } else {
            numPages = Math.max(1, Math.round(req.file.buffer.length / 5000));
          }
          
          // Combina i risultati in un testo
          text = sortedMatches.join('\n\n');
          
          // Calcola statistiche
          const wordCount = text.split(/\s+/).filter((word: string) => word.trim().length > 0).length;
          
          // Crea il riassunto
          summary = `📄 **Analisi del documento PDF**\n\n`;
          
          // Se trovato, mostriamo il titolo del documento
          if (documentTitle) {
            summary += `📑 **Titolo**: ${documentTitle}\n\n`;
          }
          
          if (sortedMatches.length > 0) {
            summary += `📝 **Contenuto estratto**:\n\n`;
            // Prendiamo i primi 500 caratteri per l'anteprima
            summary += `${text.substring(0, 500)}${text.length > 500 ? '...' : ''}\n\n`;
          } else {
            summary += `⚠️ **Nota sul contenuto**\n`;
            summary += `Non è stato possibile estrarre testo leggibile da questo PDF. `;
            summary += `Il documento potrebbe contenere principalmente immagini, essere scansionato o protetto.\n\n`;
          }
          
          summary += `📊 **Statistiche del documento**\n`;
          summary += `- Pagine: ${numPages}\n`;
          
          if (sortedMatches.length > 0) {
            summary += `- Frammenti di testo trovati: ${sortedMatches.length}\n`;
            summary += `- Parole stimate: ${wordCount}\n`;
            summary += `- Caratteri: ${text.length}\n`;
          }
          
          summary += `- Dimensione file: ${(req.file.size / 1024).toFixed(2)} KB\n`;
          
          // Metadati aggiuntivi se presenti
          const authorMatch = rawString.match(/\/Author\s*\(([^)]+)\)/);
          const creationDateMatch = rawString.match(/\/CreationDate\s*\(([^)]+)\)/);
          
          if (authorMatch || creationDateMatch) {
            summary += `\n📋 **Metadati**\n`;
            if (authorMatch) {
              summary += `- Autore: ${authorMatch[1].replace(/\\|\(|\)/g, '')}\n`;
            }
            if (creationDateMatch) {
              summary += `- Data creazione: ${creationDateMatch[1].replace(/\\|\(|\)/g, '')}\n`;
            }
          }
          
        } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          // Usiamo mammoth per estrarre il testo dai DOCX
          const result = await mammoth.extractRawText({ buffer: req.file.buffer });
          text = result.value;
          
          // Generiamo un riassunto
          const lines = text.split('\n').filter(line => line.trim().length > 0);
          const words = text.split(/\s+/).filter(word => word.trim().length > 0);
          
          summary = `📄 **Analisi del documento DOCX**\n\n`;
          summary += `📝 **Contenuto estratto**:\n\n`;
          summary += `${text.substring(0, 500)}${text.length > 500 ? '...' : ''}\n\n`;
          summary += `📊 **Statistiche del documento**\n`;
          summary += `- Righe: ${lines.length}\n`;
          summary += `- Parole: ${words.length}\n`;
          summary += `- Caratteri: ${text.length}\n`;
          summary += `- Dimensione file: ${(req.file.size / 1024).toFixed(2)} KB\n`;
          
        } else if (req.file.mimetype === 'text/plain') {
          // TXT è semplice
          text = req.file.buffer.toString('utf-8');
          
          const lines = text.split('\n').filter(line => line.trim().length > 0);
          const words = text.split(/\s+/).filter(word => word.trim().length > 0);
          
          summary = `📄 **Analisi del documento TXT**\n\n`;
          summary += `📝 **Contenuto estratto**:\n\n`;
          summary += `${text.substring(0, 500)}${text.length > 500 ? '...' : ''}\n\n`;
          summary += `📊 **Statistiche del documento**\n`;
          summary += `- Righe: ${lines.length}\n`;
          summary += `- Parole: ${words.length}\n`;
          summary += `- Caratteri: ${text.length}\n`;
          summary += `- Dimensione file: ${(req.file.size / 1024).toFixed(2)} KB\n`;
          
        } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
          // Per i fogli Excel, estraiamo il testo dal buffer
          summary = `📊 **File Excel caricato**\n\n`;
          summary += `I dettagli del file Excel non possono essere mostrati in questa anteprima.\n`;
          summary += `- Dimensione file: ${(req.file.size / 1024).toFixed(2)} KB\n`;
          text = 'Contenuto Excel non disponibile in formato testo';
        } else {
          return res.status(400).json({ 
            error: 'Tipo di file non supportato',
            message: 'Seleziona un file PDF, DOCX, XLSX o TXT.' 
          });
        }
      } catch (parseError: any) {
        console.error('Errore nel parsing del file:', parseError);
        
        // Fallback in caso di errore nel parsing
        summary = `⚠️ **Errore nell'analisi del file**\n\n`;
        summary += `Non è stato possibile estrarre correttamente il contenuto dal file.\n`;
        summary += `- Tipo file: ${req.file.mimetype}\n`;
        summary += `- Dimensione: ${(req.file.size / 1024).toFixed(2)} KB\n\n`;
        summary += `Dettaglio errore: ${parseError.message || 'Errore sconosciuto'}\n`;
        
        text = 'Errore nell\'estrazione del testo';
      }
      
      // IMPORTANTE: Assicuriamoci che l'estrazione del testo sia effettivamente disponibile
      // per l'agente quando l'utente fa domande sul contenuto del file
      
      // Verifichiamo che text contenga effettivamente del contenuto significativo
      const hasRealContent = text && text.trim().length > 100;
      
      // Se non abbiamo contenuto significativo, ma abbiamo estratto frammenti dal PDF,
      // usiamo quelli come contenuto principale
      if (!hasRealContent && req.file.mimetype === 'application/pdf' && summary.includes("Frammenti di testo trovati")) {
        const contentMatches = summary.match(/📝\s\*\*Contenuto estratto\*\*:\s*\n\n([\s\S]+?)\n\n📊/);
        if (contentMatches && contentMatches[1]) {
          // Usiamo il contenuto estratto dal summary come testo principale
          text = contentMatches[1].trim();
          console.log("Utilizzo del contenuto estratto dal summary come testo principale:", text.substring(0, 100) + "...");
        }
      }
      
      // Aggiungiamo il file elaborato alla memoria
      fileMemory.addProcessedFile({
        filename: req.file.originalname,
        contentType: req.file.mimetype,
        content: text,
        summary: summary,
        extractedAt: new Date()
      });
      
      res.json({
        message: 'File caricato ed elaborato con successo!',
        filename: req.file.originalname,
        size: req.file.size,
        summary: summary
      });
    } catch (error: any) {
      console.error('Errore durante l\'elaborazione del file:', error);
      res.status(500).json({ 
        error: 'Errore durante l\'elaborazione del file',
        message: error?.message || 'Errore sconosciuto'
      });
    }
  });
  
  // Endpoint per ottenere informazioni sull'ultimo file elaborato
  app.get('/api/file-info', (req: Request, res: Response) => {
    try {
      const lastFile = fileMemory.getLastProcessedFile();
      
      if (!lastFile) {
        return res.status(404).json({ 
          message: 'Nessun file è stato ancora elaborato.'
        });
      }
      
      res.json({
        filename: lastFile.filename,
        contentType: lastFile.contentType,
        summary: lastFile.summary,
        extractedAt: lastFile.extractedAt
      });
    } catch (error: any) {
      console.error('Errore durante il recupero delle informazioni sul file:', error);
      res.status(500).json({ 
        error: 'Errore durante il recupero delle informazioni sul file',
        message: error?.message || 'Errore sconosciuto'
      });
    }
  });
}