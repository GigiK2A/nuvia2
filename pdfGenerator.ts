/**
 * Utility per generare PDF strutturati con pdfmake
 */

import { TDocumentDefinitions } from 'pdfmake/interfaces';

/**
 * Analizza il contenuto HTML e crea una struttura per PDF
 */
function parseHtmlContent(html: string): {
  title: string;
  sections: { heading: string; content: string | string[] }[]
} {
  // Risultato di default
  const result = {
    title: 'Documento',
    sections: [] as { heading: string; content: string | string[] }[]
  };
  
  try {
    // Estrazione del titolo principale (primo h1)
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (titleMatch && titleMatch[1]) {
      result.title = stripHtml(titleMatch[1]);
    }
    
    // Estrazione delle sezioni (h2 + contenuto successivo)
    const sections = html.split(/<h2[^>]*>(.*?)<\/h2>/i).filter(Boolean);
    
    for (let i = 0; i < sections.length; i += 2) {
      if (i + 1 < sections.length) {
        const heading = stripHtml(sections[i]);
        let content = sections[i + 1];
        
        // Identifica elenchi puntati
        if (content.includes('<ul>') || content.includes('<li>')) {
          const items = extractListItems(content);
          if (items.length > 0) {
            result.sections.push({ heading, content: items });
            continue;
          }
        }
        
        // Per contenuto normale
        content = stripHtml(content);
        result.sections.push({ heading, content });
      }
    }
    
    return result;
  } catch (error) {
    console.error('Errore nel parsing HTML:', error);
    return result;
  }
}

/**
 * Estrae elementi di elenchi puntati dal contenuto HTML
 */
function extractListItems(html: string): string[] {
  const items: string[] = [];
  
  // Cerca elementi <li> nel contenuto HTML
  const liRegex = /<li[^>]*>(.*?)<\/li>/gi;
  let match;
  
  while ((match = liRegex.exec(html)) !== null) {
    if (match[1]) {
      items.push(stripHtml(match[1]).trim());
    }
  }
  
  // Se non trova elementi <li>, prova a cercare testo con "-" o "•"
  if (items.length === 0) {
    const lines = stripHtml(html).split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
        items.push(trimmed.substring(1).trim());
      }
    }
  }
  
  return items;
}

/**
 * Genera la definizione del documento per pdfmake
 */
export function generateReportPdfDefinition(html: string, options: { 
  style?: string; 
  layout?: string;
} = {}): TDocumentDefinitions {
  const { title, sections } = parseHtmlContent(html);
  
  // Configura colori in base allo stile
  let titleColor = '#000000';
  let sectionColor = '#444444';
  
  if (options.style === 'moderno') {
    titleColor = '#2563EB';
    sectionColor = '#3B82F6';
  }
  
  // Contenuto del documento
  const content: any[] = [
    { text: title, style: 'header', color: titleColor }
  ];
  
  // Aggiungi spazio dopo il titolo
  content.push({ text: '', margin: [0, 10, 0, 10] });
  
  // Aggiungi sezioni
  for (const section of sections) {
    // Intestazione della sezione
    content.push({ 
      text: section.heading, 
      style: 'subheader', 
      color: sectionColor,
      margin: [0, 10, 0, 5]
    });
    
    // Se il contenuto è un array, trattalo come un elenco puntato
    if (Array.isArray(section.content)) {
      content.push({
        ul: section.content,
        margin: [0, 0, 0, 10]
      });
    } else {
      // Altrimenti è testo normale
      const paragraphs = section.content
        .split('\n\n')
        .filter(p => p.trim().length > 0);
      
      for (const paragraph of paragraphs) {
        content.push({
          text: paragraph,
          margin: [0, 0, 0, 10]
        });
      }
    }
    
    // Spazio dopo ogni sezione
    content.push({ text: '', margin: [0, 5, 0, 5] });
  }
  
  // Configurazione margini
  const margins = options.layout === 'compact' ? 15 : 40;
  
  // Documento completo
  return {
    content,
    styles: {
      header: { 
        fontSize: 18, 
        bold: true,
        margin: [0, 0, 0, 10]
      },
      subheader: { 
        fontSize: 14, 
        bold: true,
        margin: [0, 10, 0, 5]
      }
    },
    defaultStyle: {
      fontSize: options.layout === 'compact' ? 10 : 12
    },
    pageMargins: [margins, margins, margins, margins]
  };
}

/**
 * Funzione di supporto per rimuovere i tag HTML
 */
function stripHtml(html: string): string {
  return html.replace(/<\/?[^>]+(>|$)/g, "");
}