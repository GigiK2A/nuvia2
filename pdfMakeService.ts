/**
 * Servizio per la generazione di PDF con pdfmake
 */
import { generatePdfDocDefinition } from './docGenerator';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Configura pdfmake
(pdfMake as any).vfs = pdfFonts && (pdfFonts as any).pdfMake ? (pdfFonts as any).pdfMake.vfs : {};

/**
 * Genera un PDF da HTML utilizzando pdfmake
 */
export async function generatePdf(
  html: string, 
  options: {
    style?: string;
    layout?: string;
  } = {}
): Promise<Buffer> {
  // Genera la definizione del documento
  const docDefinition = generatePdfDocDefinition(html, options);
  
  // Crea il PDF
  return new Promise<Buffer>((resolve, reject) => {
    try {
      const pdfDoc = pdfMake.createPdf(docDefinition);
      pdfDoc.getBuffer((buffer) => {
        resolve(Buffer.from(buffer));
      });
    } catch (error) {
      console.error('Errore nella generazione del PDF:', error);
      reject(error);
    }
  });
}