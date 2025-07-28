/**
 * Generatore di documenti Word (.docx) strutturati
 */
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Packer,
  NumberFormat,
} from 'docx';

/**
 * Analizza il contenuto HTML e ne estrae le sezioni principali
 */
function parseHtmlContent(html: string) {
  // Struttura di base
  const structure = {
    title: '',
    introduction: '',
    sections: [] as {heading: string, content: string, items: string[]}[],
    hasLists: false,
    hasNumberedLists: false,
  };
  
  // Estrai il titolo principale (h1)
  const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (titleMatch && titleMatch[1]) {
    structure.title = stripHtml(titleMatch[1]);
  }
  
  // Estrai introduzione (dopo h1, prima del primo h2)
  let intro = '';
  const parts = html.split(/<h2/i);
  if (parts.length > 0) {
    const firstPart = parts[0];
    const afterTitle = firstPart.split(/<\/h1>/i);
    if (afterTitle.length > 1) {
      intro = stripHtml(afterTitle[1]);
    }
  }
  structure.introduction = intro.trim();
  
  // Estrai sezioni (h2 + contenuto)
  const sectionRegex = /<h2[^>]*>(.*?)<\/h2>([\s\S]*?)(?=<h2|$)/gi;
  let match;
  
  while (match = sectionRegex.exec(html)) {
    const heading = stripHtml(match[1]);
    const content = match[2];
    
    // Determina se c'è un elenco in questa sezione
    const hasList = content.includes('<ul>') || content.includes('<ol>');
    const hasNumberedList = content.includes('<ol>');
    
    if (hasList) {
      structure.hasLists = true;
      if (hasNumberedList) {
        structure.hasNumberedLists = true;
      }
    }
    
    // Estrai elementi dell'elenco
    const items = extractListItems(content);
    
    // Estrai testo prima dell'elenco
    let sectionContent = '';
    if (hasList) {
      const beforeList = content.split(/<[ou]l>/i)[0];
      sectionContent = stripHtml(beforeList);
    } else {
      sectionContent = stripHtml(content);
    }
    
    structure.sections.push({
      heading,
      content: sectionContent.trim(),
      items,
    });
  }
  
  return structure;
}

/**
 * Estrai elementi degli elenchi dal contenuto HTML
 */
function extractListItems(html: string): string[] {
  const items: string[] = [];
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let match;
  
  while (match = liRegex.exec(html)) {
    const item = stripHtml(match[1]).trim();
    if (item) {
      items.push(item);
    }
  }
  
  return items;
}

/**
 * Rimuove i tag HTML dal testo
 */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Genera un documento Word seguendo l'esempio fornito
 */
export async function generateReportDocx(html: string): Promise<Buffer> {
  const structure = parseHtmlContent(html);
  
  // Crea array di paragrafi per il documento
  const documentChildren = [];
  
  // Titolo principale
  documentChildren.push(
    new Paragraph({
      text: structure.title,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 300 },
    })
  );
  
  // Introduzione
  if (structure.introduction) {
    documentChildren.push(
      new Paragraph({
        text: structure.introduction,
        spacing: { after: 300 },
      })
    );
  }
  
  // Genera sezioni
  structure.sections.forEach(section => {
    // Titolo sezione
    documentChildren.push(
      new Paragraph({
        text: section.heading,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 120 },
      })
    );
    
    // Contenuto sezione
    if (section.content) {
      documentChildren.push(
        new Paragraph({
          text: section.content,
          spacing: { after: 120 },
        })
      );
    }
    
    // Elementi dell'elenco
    section.items.forEach((item, i) => {
      // Determina se è un elenco numerato basandosi sul contesto
      const isNumbered = html.includes('<ol>') && html.includes(item);
      
      if (isNumbered) {
        documentChildren.push(
          new Paragraph({
            text: item,
            numbering: {
              reference: "ordered-list",
              level: 0,
            },
            spacing: { after: 120 },
          })
        );
      } else {
        documentChildren.push(
          new Paragraph({
            text: item,
            bullet: { level: 0 },
            spacing: { after: 120 },
          })
        );
      }
    });
  });
  
  // Nota finale
  documentChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Il documento è stato generato automaticamente in base ai parametri richiesti.",
          italics: true,
        }),
      ],
      spacing: { before: 300 },
    })
  );
  
  // Crea documento Word
  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "ordered-list",
          levels: [
            {
              level: 0,
              format: NumberFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {},
        children: documentChildren,
      },
    ],
  });
  
  // Restituisci il buffer del documento
  return await Packer.toBuffer(doc);
}