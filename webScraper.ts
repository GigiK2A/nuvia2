import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { generateAIResponse } from './aiClient';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  content?: string;
}

// Funzione per fare scraping di una pagina web
export async function scrapeWebpage(url: string): Promise<string> {
  try {
    console.log(`🌐 [WEB SCRAPER] Scaricamento contenuto da: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Rimuovi script, style e altri elementi non necessari
    $('script, style, nav, header, footer, aside, .advertisement, .ads').remove();
    
    // Estrai il contenuto principale
    let content = '';
    
    // Prova a trovare il contenuto principale
    const mainSelectors = [
      'main',
      '[role="main"]',
      '.main-content',
      '.content',
      '.post-content',
      '.article-content',
      '.entry-content',
      'article',
      '.article-body'
    ];
    
    let mainContent = '';
    for (const selector of mainSelectors) {
      const element = $(selector);
      if (element.length && element.text().trim().length > 100) {
        mainContent = element.text().trim();
        break;
      }
    }
    
    // Se non trova contenuto principale, usa il body
    if (!mainContent) {
      mainContent = $('body').text().trim();
    }
    
    // Pulisci e limita il contenuto
    content = mainContent
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim()
      .substring(0, 3000); // Limita a 3000 caratteri
    
    console.log(`✅ [WEB SCRAPER] Contenuto estratto: ${content.length} caratteri`);
    return content;
    
  } catch (error: any) {
    console.error(`❌ [WEB SCRAPER ERROR] ${url}:`, error.message);
    throw error;
  }
}

// Funzione per cercare su DuckDuckGo (non richiede API key)
export async function searchDuckDuckGo(query: string): Promise<SearchResult[]> {
  try {
    console.log(`🔍 [DUCKDUCKGO] Ricerca per: "${query}"`);
    
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const results: SearchResult[] = [];
    
    $('.result').each((index, element) => {
      if (index >= 5) return; // Limita a 5 risultati
      
      const $result = $(element);
      const $titleLink = $result.find('.result__title a');
      const title = $titleLink.text().trim();
      const url = $titleLink.attr('href');
      const snippet = $result.find('.result__snippet').text().trim();
      
      if (title && url && snippet) {
        results.push({
          title,
          url: url.startsWith('http') ? url : `https://${url}`,
          snippet
        });
      }
    });
    
    console.log(`✅ [DUCKDUCKGO] Trovati ${results.length} risultati`);
    return results;
    
  } catch (error: any) {
    console.error('❌ [DUCKDUCKGO ERROR]:', error.message);
    throw error;
  }
}

// Funzione principale per ricerca web con scraping
export async function webSearchWithScraping(query: string): Promise<string> {
  try {
    // 1. Cerca i risultati
    const searchResults = await searchDuckDuckGo(query);
    
    if (searchResults.length === 0) {
      return `Non ho trovato risultati per "${query}". Prova con termini di ricerca diversi.`;
    }
    
    // 2. Fai scraping dei primi 2-3 risultati più promettenti
    const scrapedContent: string[] = [];
    
    for (let i = 0; i < Math.min(3, searchResults.length); i++) {
      const result = searchResults[i];
      try {
        const content = await scrapeWebpage(result.url);
        if (content && content.length > 100) {
          scrapedContent.push(`**${result.title}**\nFonte: ${result.url}\n${content}\n\n---\n`);
        }
      } catch (error) {
        console.warn(`⚠️ Impossibile fare scraping di ${result.url}`);
        // Continua con il prossimo risultato
      }
    }
    
    // 3. Se abbiamo contenuto, fallo elaborare dall'AI
    if (scrapedContent.length > 0) {
      const allContent = scrapedContent.join('\n');
      
      const prompt = `Basandoti sui seguenti contenuti web aggiornati, rispondi alla domanda: "${query}"

Contenuti web:
${allContent}

Fornisci una risposta completa e accurata basata su queste informazioni aggiornate. NON includere URL o citazioni dirette nel testo della risposta. Scrivi una risposta pulita e naturale come se fossi un esperto che conosce l'argomento.`;

      const aiResponse = await generateAIResponse(prompt);
      
      // Aggiungi le fonti come metadata separato
      const sources = searchResults.slice(0, 3).map((result, index) => ({
        id: index + 1,
        title: result.title,
        url: result.url
      }));
      
      return JSON.stringify({
        response: aiResponse,
        sources: sources
      });
    }
    
    // 4. Se non riusciamo a fare scraping, usa almeno i snippet
    let response = `Ecco cosa ho trovato per "${query}":\n\n`;
    
    searchResults.forEach((result, index) => {
      response += `${index + 1}. **${result.title}**\n`;
      response += `   ${result.snippet}\n`;
      response += `   Fonte: ${result.url}\n\n`;
    });
    
    return response;
    
  } catch (error: any) {
    console.error('❌ [WEB SEARCH ERROR]:', error.message);
    return `Si è verificato un errore durante la ricerca web. Riprova più tardi.`;
  }
}