/**
 * Generatore di PDF strutturati per documenti
 * Implementa l'esempio fornito dall'utente
 */
import { TDocumentDefinitions } from 'pdfmake/interfaces';

/**
 * Analizza il contenuto HTML e produce elenchi strutturati
 * per generare un documento PDF ben formattato
 */
function parseHtmlToStructure(html: string) {
  // Struttura di base
  const result = {
    title: '',
    paragraphs: [] as string[],
    sections: [] as { 
      heading: string; 
      description?: string;
      items?: string[]; 
      isNumbered?: boolean;
      text?: string 
    }[]
  };
  
  try {
    // Estrai il titolo (h1)
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (titleMatch && titleMatch[1]) {
      result.title = cleanHtml(titleMatch[1]);
    }
    
    // Estrai paragrafi principali (prima del primo h2)
    const textBeforeH2 = html.split(/<h2[^>]*>/i)[0];
    if (textBeforeH2) {
      const mainText = cleanHtml(textBeforeH2.replace(/<h1[^>]*>.*?<\/h1>/i, '').trim());
      if (mainText) {
        result.paragraphs = mainText.split('\n\n').filter(p => p.trim().length > 0);
      }
    }
    
    // Estrai sezioni (h2 + contenuto)
    const sectionRegex = /<h2[^>]*>(.*?)<\/h2>([\s\S]*?)(?=<h2|$)/gi;
    let match;
    
    while ((match = sectionRegex.exec(html)) !== null) {
      const heading = cleanHtml(match[1]);
      const content = match[2];
      
      // Verifica se il contenuto ha elenchi puntati
      if (content.includes('<ul>') || (content.includes('<li>') && !content.includes('<ol>'))) {
        // Cerca una descrizione prima della lista
        let description;
        const textBeforeList = content.split(/<ul|<li/i)[0];
        if (textBeforeList) {
          description = cleanHtml(textBeforeList).trim();
        }
        
        // Estrai elementi di elenchi
        const items = extractListItems(content);
        if (items.length > 0) {
          result.sections.push({ 
            heading, 
            description, 
            items,
            isNumbered: false 
          });
          continue;
        }
      } 
      // Verifica se il contenuto ha elenchi numerati
      else if (content.includes('<ol>')) {
        // Cerca una descrizione prima della lista numerata
        let description;
        const textBeforeList = content.split(/<ol/i)[0];
        if (textBeforeList) {
          description = cleanHtml(textBeforeList).trim();
        }
        
        // Estrai elementi dall'elenco numerato
        const items = extractListItems(content);
        if (items.length > 0) {
          result.sections.push({ 
            heading, 
            description, 
            items,
            isNumbered: true 
          });
          continue;
        }
      }
      
      // Altrimenti è testo normale
      const text = cleanHtml(content).trim();
      if (text) {
        result.sections.push({ heading, text });
      }
    }
    
    return result;
  } catch (error) {
    console.error('Errore nel parsing HTML:', error);
    return {
      title: 'Documento',
      paragraphs: [],
      sections: []
    };
  }
}

/**
 * Estrae elementi di elenchi da HTML
 */
function extractListItems(html: string): string[] {
  const items: string[] = [];
  
  // Cerca tag <li> nel contenuto
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let match;
  
  while ((match = liRegex.exec(html)) !== null) {
    const item = cleanHtml(match[1]).trim();
    if (item) {
      items.push(item);
    }
  }
  
  // Se non trova <li>, cerca linee che iniziano con "-" o "•"
  if (items.length === 0) {
    const lines = cleanHtml(html).split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
        const item = trimmed.substring(1).trim();
        if (item) {
          items.push(item);
        }
      }
    }
  }
  
  return items;
}

/**
 * Pulisce il testo HTML rimuovendo i tag
 */
function cleanHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Genera la definizione di un documento PDF per pdfmake
 * basata sulla struttura fornita nell'esempio
 */
export function generatePdfDocDefinition(html: string, options: {
  style?: string;
  layout?: string;
} = {}): TDocumentDefinitions {
  
  // Analizza la struttura HTML
  const { title, paragraphs, sections } = parseHtmlToStructure(html);
  
  // Scegli colori in base allo stile
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
  
  // Aggiungi paragrafi di introduzione
  if (paragraphs.length > 0) {
    const introText = paragraphs.join('\n\n');
    content.push({
      text: introText,
      margin: [0, 10, 0, 15]
    });
  }
  
  // Aggiungi sezioni
  for (const section of sections) {
    // Intestazione sezione
    content.push({
      text: section.heading,
      style: 'subheader',
      color: sectionColor,
      margin: [0, 15, 0, 5]
    });
    
    // Se ha una descrizione prima dell'elenco, aggiungila
    if (section.description) {
      content.push({
        text: section.description,
        margin: [0, 5, 0, 5]
      });
    }
    
    // Se ha elementi di elenco
    if (section.items && section.items.length > 0) {
      if (section.isNumbered) {
        // Elenco numerato
        content.push({
          ol: section.items,
          margin: [0, 0, 0, 10]
        });
      } else {
        // Elenco puntato
        content.push({
          ul: section.items,
          margin: [0, 0, 0, 10]
        });
      }
    } 
    // Se ha solo testo normale
    else if (section.text) {
      content.push({
        text: section.text,
        margin: [0, 0, 0, 10]
      });
    }
  }
  
  // Messaggio di chiusura
  content.push({
    text: 'Il documento è stato generato automaticamente in base ai parametri richiesti.',
    italics: true,
    fontSize: 9,
    color: 'gray',
    margin: [0, 30, 0, 0]
  });
  
  // Definizione del documento completo
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
    pageMargins: options.layout === 'compact' 
      ? [15, 15, 15, 15] as [number, number, number, number]
      : [40, 40, 40, 40] as [number, number, number, number]
  };
}