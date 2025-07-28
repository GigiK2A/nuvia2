/**
 * Modulo per la gestione della memoria contestuale per l'assistente AI
 * Mantiene traccia delle ultime pagine web visitate e delle informazioni estratte.
 */

interface WebPage {
  url: string;
  title: string;
  content: string;
  timestamp: Date;
}

class ContextMemory {
  private lastVisitedPage: WebPage | null = null;
  private history: WebPage[] = [];
  private maxHistorySize = 5;

  /**
   * Aggiunge una pagina web alla memoria contestuale
   */
  addWebPage(url: string, title: string, content: string): void {
    const page: WebPage = {
      url,
      title,
      content,
      timestamp: new Date()
    };

    // Aggiorna l'ultima pagina visitata
    this.lastVisitedPage = page;

    // Aggiungi alla cronologia, mantenendo solo le ultime N pagine
    this.history.unshift(page);
    if (this.history.length > this.maxHistorySize) {
      this.history.pop();
    }

    console.log(`Pagina aggiunta alla memoria contestuale: ${title} (${url})`);
  }

  /**
   * Restituisce l'ultima pagina visitata
   */
  getLastVisitedPage(): WebPage | null {
    return this.lastVisitedPage;
  }

  /**
   * Restituisce tutte le pagine nella memoria
   */
  getHistory(): WebPage[] {
    return [...this.history];
  }

  /**
   * Controlla se c'è una pagina recente nella memoria (entro gli ultimi N minuti)
   */
  hasRecentPage(minutes = 30): boolean {
    if (!this.lastVisitedPage) return false;
    
    const now = new Date();
    const diff = (now.getTime() - this.lastVisitedPage.timestamp.getTime()) / (1000 * 60);
    return diff <= minutes;
  }

  /**
   * Cerca informazioni nelle pagine visitate in base a una query
   */
  searchInMemory(query: string): string | null {
    if (!this.lastVisitedPage) return null;

    const queryLower = query.toLowerCase();
    const pageLower = this.lastVisitedPage.content.toLowerCase();

    if (pageLower.includes(queryLower)) {
      // Se la query è contenuta direttamente nella pagina
      return this.lastVisitedPage.content;
    }

    // Altrimenti restituiamo il contenuto dell'ultima pagina
    // Un'implementazione più avanzata potrebbe utilizzare algoritmi semantici
    return this.lastVisitedPage.content;
  }

  /**
   * Restituisce un riassunto dell'ultima pagina visitata
   */
  getSummary(): string {
    if (!this.lastVisitedPage) {
      return "Non ho ancora visitato alcuna pagina web.";
    }
    
    const content = this.lastVisitedPage.content;
    
    // Verifica se il contenuto contiene già paragrafi (delimitati da \n\n)
    if (content.includes('\n\n')) {
      // Il contenuto è già formattato in paragrafi, usiamo direttamente quelli
      const paragraphs = content.split('\n\n')
        .filter(p => p.trim().length > 20)
        .slice(0, 5);
        
      if (paragraphs.length > 0) {
        return `📄 **${this.lastVisitedPage.title}**\n\n` +
          paragraphs.map(p => `📰 ${p.trim()}`).join('\n\n') +
          `\n\n📎 Fonte: ${this.lastVisitedPage.url}`;
      }
    }
    
    // Altrimenti suddividiamo il testo in segmenti significativi
    const segments = content
      // Dividi per vari separatori (punti, punti e virgola, punti elenco, nuove righe)
      .split(/(?:\.|\n|•|\||;)/)
      .map(segment => segment.trim())
      .filter(segment => {
        // Filtra i segmenti troppo corti o con contenuto non desiderato
        return segment.length >= 30 && 
              !segment.includes('function') && 
              !segment.includes('undefined') &&
              !segment.includes('null') &&
              !segment.includes('NaN') &&
              !segment.match(/^[0-9\s\-\+\.]+$/) && // Evita segmenti con solo numeri
              !segment.match(/Copyright|All rights reserved|Privacy Policy/i); // Evita testi legali
      });
    
    if (segments.length > 0) {
      // Selezioniamo fino a 5 segmenti significativi
      const selectedSegments = segments.slice(0, 5);
      
      return `📄 **${this.lastVisitedPage.title}**\n\n` +
        selectedSegments.map((segment, index) => {
          // Per l'ultimo segmento, mostriamolo completo
          return `📰 ${segment}${index === selectedSegments.length - 1 ? '' : ''}`;
        }).join('\n\n') +
        `\n\n📎 Fonte: ${this.lastVisitedPage.url}`;
    } else {
      // Fallback se non riusciamo a trovare segmenti significativi
      return `📄 **${this.lastVisitedPage.title}**\n\n` +
        `📰 ${content.slice(0, 300)}${content.length > 300 ? '...' : ''}\n\n` +
        `📎 Fonte: ${this.lastVisitedPage.url}`;
    }
  }
}

// Esportiamo un'istanza singleton
export const contextMemory = new ContextMemory();