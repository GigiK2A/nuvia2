/**
 * Modulo per la gestione e l'elaborazione dei file caricati dagli utenti
 * Supporta l'estrazione del testo da vari formati di file (PDF, DOCX, XLSX, TXT)
 */

import * as fs from 'fs';
import * as path from 'path';
import mammoth from 'mammoth';
/**
 * Versione semplificata dell'estrazione di testo dai PDF
 * Fornisce informazioni di base e un'analisi euristica del contenuto
 */
async function simplePdfAnalysis(dataBuffer: Buffer) {
  try {
    // Tenta di estrarre testo leggibile dal PDF
    // Nota: questa è una soluzione semplificata che non può elaborare correttamente
    // tutti i tipi di PDF, ma è utile per scopi dimostrativi
    const rawText = dataBuffer.toString('utf-8');
    
    // Stima del numero di pagine basata sulla lunghezza del buffer
    const estimatedPages = Math.max(1, Math.round(dataBuffer.length / 5000));
    
    // Cerca testo leggibile usando espressioni regolari
    // Questo approccio semplificato estrae sequenze di caratteri che potrebbero essere testo
    const textMatches = rawText.match(/[a-zA-Z0-9\s.,;:'"()[\]{}!?-]{5,100}/g) || [];
    
    // Filtra e pulisci i risultati
    const cleanedMatches = textMatches
      .map(match => match.trim())
      .filter(match => {
        // Rimuovi stringhe che contengono troppi caratteri non alfanumerici
        const nonAlphanumericRatio = (match.match(/[^a-zA-Z0-9\s]/g) || []).length / match.length;
        return nonAlphanumericRatio < 0.3 && match.length > 5;
      })
      .filter((match, index, self) => self.indexOf(match) === index); // Rimuovi duplicati
    
    // Stima della qualità del testo estratto
    const extractedTextQuality = cleanedMatches.length > 10 ? 'Buona' : 'Limitata';
    
    // Genera un testo rappresentativo
    let extractedText = '';
    if (cleanedMatches.length > 0) {
      extractedText = cleanedMatches.slice(0, 30).join('\n');
    } else {
      extractedText = "Non è stato possibile estrarre testo leggibile da questo PDF. Potrebbe contenere solo immagini o essere protetto.";
    }
    
    return {
      text: `=== Analisi PDF ===\n\n` +
            `Dimensione file: ${(dataBuffer.length / 1024).toFixed(2)} KB\n` +
            `Pagine stimate: circa ${estimatedPages}\n` +
            `Qualità estrazione testo: ${extractedTextQuality}\n\n` +
            `Estratti di testo trovati:\n\n${extractedText}`,
      estimatedPages
    };
  } catch (error: any) {
    console.error('Errore nell\'analisi del PDF:', error);
    return {
      text: "Si è verificato un errore durante l'elaborazione del PDF. " +
            `Errore: ${error?.message || 'sconosciuto'}`,
      error: error?.message || 'Errore sconosciuto'
    };
  }
}
// Simuliamo anche le altre elaborazioni per evitare problemi di compatibilità
// In un'implementazione reale, useremmo le librerie complete

// Simula l'elaborazione di un file DOCX
async function processDocxSimulated(buffer: Buffer) {
  // Estrai testo leggibile dal buffer
  const text = buffer.toString('utf-8');
  const textContent = text
    .replace(/[^\x20-\x7E\n]/g, '')
    .split('\n')
    .filter(line => line.trim().length > 0)
    .join('\n');
  
  return {
    value: textContent || "Il file DOCX contiene principalmente dati binari che non possono essere visualizzati come testo.",
    messages: []
  };
}

// Simula l'elaborazione di un file XLSX
function processXlsxSimulated(buffer: Buffer) {
  // Simula l'estrazione delle righe
  const text = buffer.toString('utf-8');
  const lines = text
    .replace(/[^\x20-\x7E\n]/g, '')
    .split('\n')
    .filter(line => line.trim().length > 0);
  
  // Crea una simulazione di foglio Excel con righe e colonne
  const rows = [];
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const row = lines[i].split(/\s+/).slice(0, 5);
    rows.push(row);
  }
  
  return rows;
}

// Classe per tenere traccia dei file elaborati
interface ProcessedFile {
  filename: string;
  contentType: string;
  content: string;
  summary: string;
  extractedAt: Date;
}

// Classe per la gestione della memoria dei file
class FileMemory {
  private lastProcessedFile: ProcessedFile | null = null;
  private processedFiles: ProcessedFile[] = [];
  private maxHistorySize = 5;

  /**
   * Aggiunge un file elaborato alla memoria
   */
  addProcessedFile(file: ProcessedFile): void {
    this.lastProcessedFile = file;
    
    // Aggiungi alla cronologia, mantenendo solo gli ultimi N file
    this.processedFiles.unshift(file);
    if (this.processedFiles.length > this.maxHistorySize) {
      this.processedFiles.pop();
    }
    
    console.log(`File elaborato aggiunto alla memoria: ${file.filename} (${file.contentType})`);
  }

  /**
   * Restituisce l'ultimo file elaborato
   */
  getLastProcessedFile(): ProcessedFile | null {
    return this.lastProcessedFile;
  }

  /**
   * Restituisce tutti i file nella memoria
   */
  getProcessedFiles(): ProcessedFile[] {
    return [...this.processedFiles];
  }

  /**
   * Restituisce un riassunto dell'ultimo file elaborato
   */
  getFileSummary(): string {
    if (!this.lastProcessedFile) {
      return "Non è stato ancora elaborato alcun file.";
    }

    return `📄 **File: ${this.lastProcessedFile.filename}**\n\n${this.lastProcessedFile.summary}\n\n📎 Caricato il: ${this.lastProcessedFile.extractedAt.toLocaleString()}`;
  }

  /**
   * Ricerca nel contenuto dell'ultimo file elaborato
   */
  searchInFileContent(query: string): string {
    if (!this.lastProcessedFile) {
      return "Non è stato ancora elaborato alcun file.";
    }
    
    // Per i PDF, usiamo il contenuto estratto con il nostro algoritmo migliorato
    const isPdf = this.lastProcessedFile.filename.toLowerCase().endsWith('.pdf');
    if (isPdf && this.lastProcessedFile.content.trim().length < 50) {
      // Solo se non abbiamo estratto testo significativo, mostriamo un messaggio informativo
      return `📄 **File: ${this.lastProcessedFile.filename}**\n\n` +
             `⚠️ **Nota sul contenuto**\n` +
             `Non è stato possibile estrarre testo leggibile significativo da questo PDF. ` +
             `Il documento potrebbe contenere principalmente immagini, essere scansionato o protetto.\n\n` +
             `📊 **Dettagli disponibili**\n` +
             `- Dimensione: ${(this.lastProcessedFile.content.length / 1024).toFixed(2)} KB\n` +
             `- Caricato il: ${this.lastProcessedFile.extractedAt.toLocaleString()}`;
    }

    const content = this.lastProcessedFile.content.toLowerCase();
    const queryLower = query.toLowerCase();
    
    // Cerca termini chiave dalla query nel contenuto
    const queryWords = queryLower
      .split(/\s+/)
      .filter(word => word.length > 3) // considera solo parole significative
      .filter(word => !['cosa', 'come', 'dove', 'quando', 'perché', 'file', 'documento', 'contenuto'].includes(word));
    
    if (queryWords.length > 0) {
      // Cerca ogni parola chiave nel contenuto
      const relevantSnippets = [];
      
      for (const word of queryWords) {
        if (content.includes(word)) {
          // Trova il contesto intorno alla parola chiave
          const index = content.indexOf(word);
          const start = Math.max(0, index - 100);
          const end = Math.min(content.length, index + word.length + 100);
          const context = content.substring(start, end);
          
          // Pulisce il contesto da caratteri strani o sequenze binarie
          const cleanContext = context
            .replace(/[^\x20-\x7E\xA0-\xFF\s]/g, '') // mantiene solo caratteri stampabili ASCII e Latin-1
            .replace(/00+/g, '') // rimuove sequenze di zeri
            .trim();
            
          if (cleanContext.length > 5) {
            relevantSnippets.push(`"...${cleanContext}..."`);
          }
          
          // Limita a 3 snippets per non sovraccaricare
          if (relevantSnippets.length >= 3) break;
        }
      }
      
      if (relevantSnippets.length > 0) {
        return `📄 Ecco le informazioni trovate nel file "${this.lastProcessedFile.filename}" relative alla tua domanda:\n\n${relevantSnippets.join('\n\n')}\n\n📎 Per maggiori dettagli, poni una domanda specifica sul contenuto.`;
      }
    }
    
    // Se non abbiamo trovato nulla di specifico, mostriamo un riassunto generale
    return this.getFileSummary();
  }
}

// Esportiamo un'istanza singleton della memoria dei file
export const fileMemory = new FileMemory();

/**
 * Elabora un file PDF e ne estrae il testo
 */
export async function processPdf(filePath: string): Promise<string> {
  try {
    // Leggiamo il file PDF come buffer
    const dataBuffer = fs.readFileSync(filePath);
    const fileSize = (dataBuffer.length / 1024).toFixed(2);
    
    // Estrazione testo migliorata
    const rawString = dataBuffer.toString('utf-8', 0, 50000); // Leggiamo più byte per trovare più testo
    
    // Pattern avanzato per trovare testo leggibile, supporta anche accenti e caratteri speciali
    const textPattern = /[a-zA-Z0-9àèìòùáéíóúäëïöüçñÀÈÌÒÙÁÉÍÓÚÄËÏÖÜÇÑ\s.,;:!?()"'\-]{20,100}/g;
    const matches = rawString.match(textPattern) || [];
    
    // Filtro migliorato per eliminare contenuti che sembrano codice PDF
    const filteredMatches = matches.filter(match => {
      // Lista aggiornata di parole chiave del codice PDF da escludere
      const pdfKeywords = ['obj', 'endobj', 'stream', 'endstream', '/Contents', 
                           '/Page', '/Type', '/Font', '/Length', '/Filter', 
                           '/Image', 'xref', 'trailer', 'startxref', '/Encoding'];
      
      // Verifichiamo se il testo contiene una di queste parole chiave
      const containsPdfKeyword = pdfKeywords.some(keyword => match.includes(keyword));
      
      // Verifichiamo se sembra un testo reale (contiene spazi e non è una sequenza di numeri)
      const looksLikeRealText = match.includes(' ') && 
                               !/^[0-9\s]+$/.test(match) &&
                               match.trim().length > 30;
      
      return !containsPdfKeyword && looksLikeRealText;
    });
    
    // Rimozione di duplicati e contenuti simili
    const uniqueTexts = new Set<string>();
    const distinctMatches = [];
    
    for (const match of filteredMatches) {
      // Normalizza il testo per confronto (rimuove spazi multipli, converte in minuscolo)
      const normalizedText = match.trim().replace(/\s+/g, ' ').toLowerCase();
      
      // Aggiungi solo se non esiste un testo simile
      if (!uniqueTexts.has(normalizedText)) {
        uniqueTexts.add(normalizedText);
        distinctMatches.push(match);
      }
    }
    
    // Ordinamento per lunghezza (i paragrafi più lunghi sono più probabilmente testo reale)
    const sortedMatches = distinctMatches
      .sort((a, b) => b.length - a.length)
      .slice(0, 8); // Limitiamo a 8 risultati
    
    // Stimiamo il numero di pagine usando marker PDF
    const pageMarkers = rawString.match(/\/Type\s*\/Page|\/Page\s*<<|\/Pages\s*<<|\/Count\s+\d+/g) || [];
    const pageCountMatch = rawString.match(/\/Count\s+(\d+)/);
    
    let estimatedPages = 1;
    if (pageCountMatch && pageCountMatch[1]) {
      // Se troviamo un contatore di pagine esplicito, lo usiamo
      estimatedPages = parseInt(pageCountMatch[1], 10);
    } else if (pageMarkers.length > 0) {
      // Altrimenti contiamo i marker di pagina
      estimatedPages = Math.max(1, Math.ceil(pageMarkers.length / 2)); // Dividiamo per 2 perché spesso i marker sono duplicati
    } else {
      // Stima basata sulla dimensione del file
      estimatedPages = Math.max(1, Math.round(dataBuffer.length / 5000));
    }
    
    // Estrazione del titolo (se presente)
    const titleMatch = rawString.match(/\/Title\s*\(([^)]+)\)/);
    const documentTitle = titleMatch ? titleMatch[1].replace(/\\|\(|\)/g, '') : null;
    
    // Composizione della risposta
    let result = `📄 **Analisi del documento PDF**\n\n`;
    
    // Se trovato, mostriamo il titolo del documento
    if (documentTitle) {
      result += `📑 **Titolo**: ${documentTitle}\n\n`;
    }
    
    // Contenuto testuale estratto
    if (sortedMatches.length > 0) {
      result += `📝 **Contenuto estratto**:\n\n`;
      
      // Mostriamo fino a 5 frammenti di testo, i più significativi
      for (let i = 0; i < Math.min(5, sortedMatches.length); i++) {
        const match = sortedMatches[i].trim().replace(/\s+/g, ' ');
        const displayText = match.length > 300 ? match.substring(0, 297) + '...' : match;
        result += `${displayText}\n\n`;
      }
    } else {
      result += `⚠️ **Nota sul contenuto**\n`;
      result += `Non è stato possibile estrarre testo leggibile da questo PDF. `;
      result += `Il documento potrebbe contenere principalmente immagini, essere scansionato o protetto.\n\n`;
    }
    
    // Statistiche sul documento
    result += `📊 **Statistiche del documento**\n`;
    result += `- Dimensione file: ${fileSize} KB\n`;
    result += `- Pagine: ${estimatedPages}\n`;
    
    if (sortedMatches.length > 0) {
      // Calcoliamo statistiche basate sui frammenti estratti
      const combinedText = sortedMatches.join(' ');
      const words = combinedText.split(/\s+/).filter(w => w.trim().length > 0);
      
      result += `- Frammenti di testo significativi: ${sortedMatches.length}\n`;
      result += `- Parole estratte: ${words.length}\n`;
      result += `- Caratteri estratti: ${combinedText.length}\n`;
    }
    
    // Metadati aggiuntivi se presenti
    const authorMatch = rawString.match(/\/Author\s*\(([^)]+)\)/);
    const creationDateMatch = rawString.match(/\/CreationDate\s*\(([^)]+)\)/);
    
    if (authorMatch || creationDateMatch) {
      result += `\n📋 **Metadati**\n`;
      if (authorMatch) {
        result += `- Autore: ${authorMatch[1].replace(/\\|\(|\)/g, '')}\n`;
      }
      if (creationDateMatch) {
        result += `- Data creazione: ${creationDateMatch[1].replace(/\\|\(|\)/g, '')}\n`;
      }
    }
    
    return result;
    
  } catch (error: any) {
    console.error('Errore nell\'elaborazione del PDF:', error);
    
    // Gestione dell'errore con una risposta più user-friendly
    return `⚠️ **Impossibile elaborare il PDF**\n\n` +
           `Si è verificato un errore durante l'analisi del documento PDF.\n` + 
           `Il file potrebbe essere danneggiato, protetto o in un formato non supportato.\n\n` +
           `Dettagli tecnici: ${error?.message || 'Errore sconosciuto'}`;
  }
}

/**
 * Elabora un file DOCX e ne estrae il testo
 */
export async function processDocx(filePath: string): Promise<string> {
  try {
    // Leggiamo il file DOCX come buffer
    const dataBuffer = fs.readFileSync(filePath);
    
    // Utilizziamo mammoth per estrarre il testo dal file Word
    const result = await mammoth.extractRawText({ buffer: dataBuffer });
    const { value: text, messages } = result;
    
    // Calcoliamo statistiche sul documento
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const words = text.split(/\s+/).filter(word => word.trim().length > 0);
    const chars = text.length;
    
    // Verifichiamo se è stato estratto del testo
    if (text && text.length > 0) {
      // Creiamo la risposta formattata
      let response = "";
      
      // Statistiche del documento
      response += `📊 **Statistiche del documento**\n`;
      response += `- Righe: ${lines.length}\n`;
      response += `- Parole: ${words.length}\n`;
      response += `- Caratteri: ${chars}\n\n`;
      
      // Contenuto estratto
      response += `📄 **Anteprima del contenuto**:\n`;
      
      // Mostriamo il contenuto estratto (limitato a 500 caratteri per visibilità)
      const previewText = text.length > 500 
        ? text.substring(0, 500) + '...'
        : text;
      
      response += `${previewText}\n\n`;
      
      // Aggiungiamo informazioni aggiuntive sul documento
      const fileStats = fs.statSync(filePath);
      const fileSize = (fileStats.size / 1024).toFixed(2);
      
      response += `📝 **Informazioni sul documento**\n`;
      response += `- Dimensione: ${fileSize} KB\n`;
      response += `- Caratteri estratti: ${chars}\n`;
      
      // Se ci sono messaggi/avvisi durante l'estrazione, li aggiungiamo
      if (messages && messages.length > 0) {
        response += `\n⚠️ **Note sull'elaborazione**\n`;
        messages.forEach(msg => {
          response += `- ${msg.message}\n`;
        });
      }
      
      return response;
      
    } else {
      return "Non è stato possibile estrarre testo leggibile da questo documento Word. Potrebbe essere vuoto o contenere principalmente immagini.";
    }
  } catch (error: any) {
    console.error('Errore nell\'elaborazione del DOCX:', error);
    throw new Error(`Impossibile elaborare il file DOCX: ${error?.message || 'Errore sconosciuto'}`);
  }
}

/**
 * Elabora un file XLSX e ne estrae il testo
 */
export function processXlsx(filePath: string): string {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const rows = processXlsxSimulated(dataBuffer);
    let result = '';
    
    // Formatta il risultato come testo
    rows.forEach((row: string[], index: number) => {
      if (index === 0) {
        result += '--- Intestazioni ---\n';
      } else if (index === 1) {
        result += '--- Dati ---\n';
      }
      
      if (row.length > 0) {
        result += row.join('\t') + '\n';
      }
    });
    
    return result || "Non è stato possibile estrarre dati dal file Excel.";
  } catch (error: any) {
    console.error('Errore nell\'elaborazione del XLSX:', error);
    throw new Error(`Impossibile elaborare il file XLSX: ${error?.message || 'Errore sconosciuto'}`);
  }
}

/**
 * Elabora un file di testo semplice e ne estrae il contenuto
 */
export function processTxt(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error: any) {
    console.error('Errore nell\'elaborazione del TXT:', error);
    throw new Error(`Impossibile elaborare il file di testo: ${error?.message || 'Errore sconosciuto'}`);
  }
}

/**
 * Genera un riassunto del contenuto del file
 * In una versione reale, potrebbe usare AI per generare un riassunto
 * In questa versione simulata, fornisce statistiche base
 */
export function generateFileSummary(content: string, filename: string): string {
  // Se il contenuto è un PDF, potrebbe contenere informazioni binarie
  // Cerchiamo di identificare e pulire il contenuto per renderlo leggibile
  
  // Filtriamo il contenuto per mostare solo testo leggibile
  let cleanContent = content;
  const isPdfContent = content.includes('/Type') && content.includes('/Page') && 
                      (content.includes('/Font') || content.includes('/Contents'));
  
  if (isPdfContent) {
    // Estrattore di testo euristico per PDF
    const textBlocks = content.split('\n')
      .map(line => line.trim())
      .filter(line => {
        // Escludiamo linee che sembrano metacodice PDF
        const isPdfCode = line.includes('obj') || line.includes('endobj') || 
                          line.startsWith('/') || line.includes('>>') ||
                          line.match(/^\d+\s+\d+\s+obj$/);
        return !isPdfCode && line.length > 0;
      })
      .join('\n');
    
    cleanContent = textBlocks || content;
  }
  
  // Calcola statistiche sul documento
  const lines = cleanContent.split('\n').filter(line => line.trim().length > 0);
  const words = cleanContent.split(/\s+/).filter(word => word.trim().length > 0);
  const chars = cleanContent.length;
  
  // Per file Excel, individuiamo righe che sembrano titoli di colonne
  const potentialHeaderRow = lines.find(line => line.includes('\t'));
  
  // Per file PDF/DOCX, cerchiamo di individuare titoli/sezioni
  const potentialSections = lines
    .filter(line => line.length < 100 && line.length > 10)
    .filter(line => line.trim().endsWith(':') || line.trim().match(/^[A-Z0-9\s.,]+$/))
    .slice(0, 5);
  
  let summary = '';
  
  summary += `📊 **Statistiche del documento**\n`;
  summary += `- Righe: ${lines.length}\n`;
  summary += `- Parole: ${words.length}\n`;
  summary += `- Caratteri: ${chars}\n\n`;
  
  if (filename.endsWith('.xlsx') && potentialHeaderRow) {
    const headers = potentialHeaderRow.split('\t').filter(h => h.trim());
    summary += `📋 **Colonne rilevate**: ${headers.join(', ')}\n\n`;
  }
  
  if (potentialSections.length > 0) {
    summary += `📑 **Possibili sezioni nel documento**:\n`;
    potentialSections.forEach(section => {
      summary += `- ${section.trim()}\n`;
    });
    summary += '\n';
  }
  
  // Campione di testo - limitiamo a un'anteprima ragionevole
  let sampleText = "";
  
  if (isPdfContent) {
    // Per PDF mostriamo una versione migliore
    sampleText = "Il documento PDF è stato elaborato. Puoi farmi domande specifiche sul suo contenuto.";
  } else {
    // Per file di testo normale, mostriamo un'anteprima
    sampleText = cleanContent.length > 300 ? cleanContent.substring(0, 300) + '...' : cleanContent;
  }
  
  summary += `📝 **Anteprima del contenuto**:\n${sampleText}`;
  
  return summary;
}



/**
 * Elabora un file e restituisce il contenuto e un riassunto
 */
export async function processFile(filePath: string, originalFilename: string, contentType: string): Promise<{content: string, summary: string}> {
  let content = '';
  let summary = '';
  
  try {
    // Gestione speciale per i file PDF, che non estrae contenuto
    if (contentType === 'application/pdf' || originalFilename.endsWith('.pdf')) {
      const fileStats = fs.statSync(filePath);
      const fileSize = fileStats.size;
      
      // Per i PDF, il contenuto è un messaggio informativo
      content = `Questo è un file PDF. Per visualizzarlo, usa un lettore PDF. Dimensione: ${(fileSize / 1024).toFixed(2)} KB`;
      
      // Genera un riassunto informativo per i PDF
      summary = `📊 **Informazioni sul documento PDF**\n` +
                `- Dimensione: ${(fileSize / 1024).toFixed(2)} KB\n` +
                `- Pagine stimate: ${Math.max(1, Math.round(fileSize / 5000))}\n\n` +
                `📋 **Nota sull'elaborazione**\n` +
                `Non è possibile visualizzare il contenuto testuale del PDF in questa versione ` +
                `dell'applicazione. Per maggiori dettagli, aprilo con un lettore PDF.\n\n` +
                `💡 **Suggerimento**\n` +
                `Per utilizzare al meglio l'assistente con i documenti, considera di caricare ` +
                `file in formato testo (.txt) che possono essere analizzati completamente.`;
    }
    // Per altri tipi di file, tentiamo l'estrazione
    else if (contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
               originalFilename.endsWith('.docx')) {
      content = await processDocx(filePath);
      // Genera un riassunto per il documento DOCX
      const lines = content.split('\n').filter(line => line.trim().length > 0);
      const words = content.split(/\s+/).filter(word => word.trim().length > 0);
      summary = `📊 **Statistiche del documento**\n` +
                `- Righe: ${lines.length}\n` +
                `- Parole: ${words.length}\n` +
                `- Caratteri: ${content.length}\n\n` +
                `📝 **Anteprima del contenuto**:\n` +
                `${content.length > 300 ? content.substring(0, 300) + '...' : content}`;
    } else if (contentType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
               originalFilename.endsWith('.xlsx')) {
      content = processXlsx(filePath);
      // Genera un riassunto per il foglio Excel
      const lines = content.split('\n').filter(line => line.trim().length > 0);
      summary = `📊 **Statistiche del foglio di calcolo**\n` +
                `- Righe: ${lines.length}\n` +
                `- Caratteri: ${content.length}\n\n` +
                `📝 **Anteprima del contenuto**:\n` +
                `${content.length > 300 ? content.substring(0, 300) + '...' : content}`;
    } else if (contentType === 'text/plain' || 
               originalFilename.endsWith('.txt')) {
      content = processTxt(filePath);
      // Genera un riassunto per il file di testo
      const lines = content.split('\n').filter(line => line.trim().length > 0);
      const words = content.split(/\s+/).filter(word => word.trim().length > 0);
      summary = `📊 **Statistiche del documento**\n` +
                `- Righe: ${lines.length}\n` +
                `- Parole: ${words.length}\n` +
                `- Caratteri: ${content.length}\n\n` +
                `📝 **Anteprima del contenuto**:\n` +
                `${content.length > 300 ? content.substring(0, 300) + '...' : content}`;
    } else {
      throw new Error(`Tipo di file non supportato: ${contentType}`);
    }
    
    // Aggiungi il file elaborato alla memoria
    fileMemory.addProcessedFile({
      filename: originalFilename,
      contentType,
      content,
      summary,
      extractedAt: new Date()
    });
    
    return { content, summary };
  } catch (error: any) {
    console.error('Errore nell\'elaborazione del file:', error);
    throw new Error(`Errore di elaborazione: ${error?.message || 'sconosciuto'}`);
  }
}