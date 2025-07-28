import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

// Helper function to remove HTML tags
const stripHtml = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
};

// Parse basic HTML structure for better formatting
const parseHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const elements: { type: string; text: string; level?: number }[] = [];
  
  const parseNode = (node: Element) => {
    if (node.nodeName === 'H1') {
      elements.push({ type: 'heading', text: node.textContent || '', level: 1 });
    } else if (node.nodeName === 'H2') {
      elements.push({ type: 'heading', text: node.textContent || '', level: 2 });
    } else if (node.nodeName === 'H3') {
      elements.push({ type: 'heading', text: node.textContent || '', level: 3 });
    } else if (node.nodeName === 'P') {
      elements.push({ type: 'paragraph', text: node.textContent || '' });
    } else if (node.nodeName === 'UL') {
      Array.from(node.children).forEach(li => {
        elements.push({ type: 'bullet', text: li.textContent || '' });
      });
    } else if (node.nodeName === 'OL') {
      Array.from(node.children).forEach((li, index) => {
        elements.push({ type: 'numbered', text: li.textContent || '', level: index + 1 });
      });
    } else {
      Array.from(node.children).forEach(parseNode);
    }
  };
  
  Array.from(doc.body.children).forEach(parseNode);
  return elements;
};

// Generate PDF document
export const generatePdf = async (
  content: string,
  options: { layout: string; style: string }
): Promise<Blob> => {
  const elements = parseHtml(content);
  const pdf = new jsPDF({
    orientation: options.layout === 'compact' ? 'portrait' : 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Set font based on style
  const fontStyle = options.style === 'accademico' ? 'times' : 'helvetica';
  pdf.setFont(fontStyle);
  
  let yPos = 20;
  const margin = 20;
  const pageWidth = pdf.internal.pageSize.width;
  
  elements.forEach(element => {
    if (element.type === 'heading') {
      pdf.setFontSize(element.level === 1 ? 24 : element.level === 2 ? 20 : 16);
      pdf.setFont(fontStyle, 'bold');
      
      // Check if we need a page break
      if (yPos > 270) {
        pdf.addPage();
        yPos = 20;
      }
      
      pdf.text(element.text, margin, yPos);
      yPos += 10;
    } else if (element.type === 'paragraph') {
      pdf.setFontSize(12);
      pdf.setFont(fontStyle, 'normal');
      
      const lines = pdf.splitTextToSize(element.text, pageWidth - 2 * margin);
      
      // Check if we need a page break
      if (yPos + lines.length * 7 > 280) {
        pdf.addPage();
        yPos = 20;
      }
      
      pdf.text(lines, margin, yPos);
      yPos += lines.length * 7 + 5;
    } else if (element.type === 'bullet') {
      pdf.setFontSize(12);
      pdf.setFont(fontStyle, 'normal');
      
      // Check if we need a page break
      if (yPos > 270) {
        pdf.addPage();
        yPos = 20;
      }
      
      pdf.text('• ' + element.text, margin + 5, yPos);
      yPos += 7;
    } else if (element.type === 'numbered') {
      pdf.setFontSize(12);
      pdf.setFont(fontStyle, 'normal');
      
      // Check if we need a page break
      if (yPos > 270) {
        pdf.addPage();
        yPos = 20;
      }
      
      pdf.text(`${element.level}. ${element.text}`, margin + 5, yPos);
      yPos += 7;
    }
  });
  
  return pdf.output('blob');
};

// Generate DOCX document
export const generateDocx = async (
  content: string,
  options: { layout: string; style: string }
): Promise<Blob> => {
  const elements = parseHtml(content);
  const docxDoc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: "Normal",
          name: "Normal",
          run: {
            font: options.style === 'accademico' ? "Times New Roman" : "Calibri",
          },
        },
      ],
    },
  });

  const children = elements.map(element => {
    if (element.type === 'heading') {
      return new Paragraph({
        text: element.text,
        heading: element.level === 1 
          ? HeadingLevel.HEADING_1 
          : element.level === 2 
            ? HeadingLevel.HEADING_2 
            : HeadingLevel.HEADING_3,
        spacing: {
          after: 200,
          before: 200,
        },
      });
    } else if (element.type === 'paragraph') {
      return new Paragraph({
        children: [
          new TextRun({
            text: element.text,
            size: 24,
          }),
        ],
        spacing: {
          after: 120,
        },
      });
    } else if (element.type === 'bullet') {
      return new Paragraph({
        text: element.text,
        bullet: {
          level: 0,
        },
        spacing: {
          after: 80,
        },
      });
    } else if (element.type === 'numbered') {
      return new Paragraph({
        text: element.text,
        numbering: {
          reference: "default-numbering",
          level: 0,
        },
        spacing: {
          after: 80,
        },
      });
    }
    
    // Default case, just return an empty paragraph
    return new Paragraph("");
  });

  docxDoc.addSection({
    properties: {
      page: {
        margin: {
          top: options.layout === 'compact' ? 600 : 1000,
          right: options.layout === 'compact' ? 600 : 1000,
          bottom: options.layout === 'compact' ? 600 : 1000,
          left: options.layout === 'compact' ? 600 : 1000,
        },
      },
    },
    children,
  });

  return Packer.toBlob(docxDoc);
};
