/**
 * Rotte per l'analisi dei documenti
 * Gestisce l'upload e l'elaborazione di documenti PDF e Word
 */
import { Router, Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
import mammoth from "mammoth";

// Configurazione multer per l'upload dei file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Filtro per accettare solo PDF e DOCX
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Formato file non supportato. Caricare PDF o DOCX."));
  }
};

// Inizializzazione multer
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // Limite di 10MB
  }
});

const documentRouter = Router();

/**
 * POST /api/analyze-document
 * Carica e analizza un documento PDF o DOCX
 */
documentRouter.post("/analyze-document", upload.single("file"), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const prompt = req.body.prompt;

    if (!file) {
      return res.status(400).json({ 
        success: false,
        message: "Nessun file ricevuto" 
      });
    }

    if (!prompt) {
      return res.status(400).json({ 
        success: false,
        message: "Prompt richiesto" 
      });
    }

    let extractedText = "";

    // Estrai il testo in base al tipo di file
    if (file.mimetype === "application/pdf") {
      // Elaborazione PDF con pdf-lib
      const dataBuffer = fs.readFileSync(file.path);
      try {
        // Carica il documento PDF
        const pdfDoc = await PDFDocument.load(dataBuffer);
        const pages = pdfDoc.getPages();
        
        // Per ora, simula l'estrazione di testo (pdf-lib non supporta estrazione diretta)
        extractedText = `[Contenuto PDF - ${pages.length} pagine]\n\n`;
        extractedText += "Il documento PDF è stato caricato con successo, ma l'estrazione del contenuto è limitata.\n";
        extractedText += "In un ambiente di produzione, utilizzeremmo una libreria completa per l'estrazione del testo.";
      } catch (error) {
        console.error("Errore nell'elaborazione del PDF:", error);
        extractedText = "[Impossibile estrarre il contenuto del PDF]";
      }
    } else if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      // Elaborazione DOCX
      try {
        const result = await mammoth.extractRawText({ path: file.path });
        extractedText = result.value;
      } catch (error) {
        console.error("Errore nell'elaborazione del DOCX:", error);
        extractedText = "[Impossibile estrarre il contenuto del documento Word]";
      }
    }

    // Simulazione di elaborazione AI (in attesa di integrazione OpenAI)
    const generatedText = `[IA] ${prompt}\n\n${extractedText}`;

    // Pulizia: elimina il file caricato dopo l'elaborazione
    fs.unlinkSync(file.path);

    res.json({
      success: true,
      data: {
        original: extractedText,
        generated: generatedText,
      }
    });
  } catch (error) {
    console.error("Errore durante l'analisi del documento:", error);
    
    res.status(500).json({
      success: false,
      message: "Errore durante l'analisi del documento",
      error: error instanceof Error ? error.message : "Errore sconosciuto",
    });
  }
});

export default documentRouter;