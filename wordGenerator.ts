/**
 * Generatore di documenti Word (.docx) strutturati
 * Implementa l'esempio fornito dall'utente
 */
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  LevelFormat,
} from 'docx';

/**
 * Analizza il contenuto HTML e produce una struttura 
 * per generare un documento Word formattato
 */
function parseHtmlToWordStructure(html: string) {
  // Struttura di base
  const result = {
    title: '',
    introduction: [] as string[],
    sections: [] as { 
      heading: string; 
      description?: string;
      items?: string[]; 
      isNumbered?: boolean;
    }[]
  };
  
  try {
    // Estrai il titolo (h1)
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (titleMatch && titleMatch[1]) {
      result.title = cleanHtml(titleMatch[1]);
    }
    
    // Estrai introduzione (prima del primo h2)
    const introText = html.split(/<h2[^>]*>/i)[0];
    if (introText) {
      const intro = cleanHtml(introText.replace(/<h1[^>]*>.*?<\/h1>/i, '').trim());
      if (intro) {
        result.introduction = intro.split('\n\n').filter(p => p.trim().length > 0);
      }
    }
    
    // Estrai sezioni (h2 + contenuto)
    const sectionRegex = /<h2[^>]*>(.*?)<\/h2>([\s\S]*?)(?=<h2|$)/gi;
    let match;
    
    while ((match = sectionRegex.exec(html)) !== null) {
      const heading = cleanHtml(match[1]);
      const content = match[2];
      
      // Cerca il testo prima della lista (se presente)
      let description = '';
      let items: string[] = [];
      let isNumbered = false;
      
      // Verifica se il contenuto ha elenchi
      if (content.includes('<ol>')) {
        // È un elenco numerato
        const beforeList = content.split(/<ol[^>]*>/i)[0];
        if (beforeList) {
          description = cleanHtml(beforeList).trim();
        }
        
        // Estrai elementi dell'elenco numerato
        items = extractListItems(content);
        isNumbered = true;
      } 
      else if (content.includes('<ul>') || content.includes('<li>')) {
        // È un elenco puntato
        const beforeList = content.split(/<ul[^>]*>|<li[^>]*>/i)[0];
        if (beforeList) {
          description = cleanHtml(beforeList).trim();
        }
        
        // Estrai elementi dell'elenco puntato
        items = extractListItems(content);
        isNumbered = false;
      } 
      else {
        // Nessun elenco, solo testo
        description = cleanHtml(content).trim();
      }
      
      // Aggiungi sezione solo se c'è contenuto
      if (heading || description || items.length > 0) {
        result.sections.push({
          heading,
          description: description || undefined,
          items: items.length > 0 ? items : undefined,
          isNumbered
        });
      }
    }
    
    return result;
  } catch (error) {
    console.error('Errore nel parsing HTML:', error);
    return {
      title: 'Documento',
      introduction: [],
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
 * Genera un documento Word strutturato da HTML basandosi sull'esempio fornito
 */
export async function generateWordDocument(html: string): Promise<Buffer> {
  // Analizza la struttura del documento
  const { title, introduction, sections } = parseHtmlToWordStructure(html);
  
  // Array per i paragrafi del documento
  const children: Paragraph[] = [];
  
  // Aggiungi il titolo principale
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 32, // ~16pt
          color: "2B579A" // Blu
        })
      ]
    })
  );
  
  // Aggiungi i paragrafi introduttivi
  introduction.forEach(paragraph => {
    children.push(
      new Paragraph({
        spacing: { after: 300 },
        children: [
          new TextRun({
            text: paragraph
          })
        ]
      })
    );
  });
  
  // Aggiungi le sezioni con sottotitoli ed elenchi
  sections.forEach(section => {
    // Titolo della sezione (heading 2)
    if (section.heading) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 120 },
          children: [
            new TextRun({
              text: section.heading,
              bold: true,
              size: 28, // ~14pt
              color: "4472C4" // Blu più chiaro
            })
          ]
        })
      );
    }
    
    // Descrizione (se presente)
    if (section.description) {
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: section.description
            })
          ]
        })
      );
    }
    
    // Elementi dell'elenco (se presenti)
    if (section.items && section.items.length > 0) {
      if (section.isNumbered) {
        // Elenco numerato
        section.items.forEach((item, index) => {
          children.push(
            new Paragraph({
              spacing: { after: 120 },
              numbering: {
                reference: "ordered-list",
                level: 0
              },
              children: [
                new TextRun({
                  text: item
                })
              ]
            })
          );
        });
      } else {
        // Elenco puntato
        section.items.forEach(item => {
          children.push(
            new Paragraph({
              spacing: { after: 120 },
              bullet: { level: 0 },
              children: [
                new TextRun({
                  text: item
                })
              ]
            })
          );
        });
      }
    }
  });
  
  // Nota finale
  children.push(
    new Paragraph({
      spacing: { before: 300 },
      children: [
        new TextRun({
          text: "Il documento è stato generato automaticamente in base ai parametri richiesti.",
          italics: true,
          color: "808080" // Grigio
        })
      ]
    })
  );
  
  // Crea il documento Word
  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "ordered-list",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 720, hanging: 260 }
                }
              }
            }
          ]
        }
      ]
    },
    sections: [
      {
        properties: {},
        children
      }
    ]
  });
  
  // Genera il buffer del documento
  return await Packer.toBuffer(doc);
}