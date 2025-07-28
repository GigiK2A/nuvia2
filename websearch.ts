import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { contextMemory } from './contextMemory';

// Utility per estrarre titoli e testi rilevanti
function extractTitlesAndHeadlines($: cheerio.CheerioAPI): string[] {
  const headlines: string[] = [];
  
  // Estrai titoli dei notizie (selettori comuni per i siti di news)
  $('h1, h2, h3, .title, .headline, article h2, .news-title, .article-title').each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length > 15 && !headlines.includes(text)) {
      headlines.push(text);
    }
  });
  
  // Estrai lead e sottotitoli
  $('.lead, .summary, .description, .subtitle, .abstract, article p:first-child').each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length > 25 && !headlines.includes(text)) {
      headlines.push(text);
    }
  });
  
  return headlines;
}

export async function getWebSummary(url: string): Promise<string> {
  try {
    console.log(`Tentativo di accesso a: ${url}`);
    
    // Aggiungiamo uno user-agent per evitare di essere bloccati come bot
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });
    
    console.log(`Risposta da ${url}: status=${res.status}, ok=${res.ok}`);
    
    if (!res.ok) {
      throw new Error(`Errore nella fetch HTTP: ${res.status} ${res.statusText}`);
    }

    const html = await res.text();
    console.log(`Lunghezza HTML ricevuto: ${html.length} caratteri`);
    
    if (!html || html.length < 100) {
      throw new Error('Contenuto HTML troppo corto o vuoto');
    }
    
    const $ = cheerio.load(html);
    
    // Rimuoviamo elementi non desiderati
    $('script, style, noscript, iframe, footer, nav, .nav, .menu, .sidebar, .advertisement, .ad, .banner, .cookie, .popup, header, .header, code, pre').remove();
    
    // Estraiamo i contenuti significativi
    let title = $('title').text().trim();
    let description = $('meta[name="description"]').attr('content') || '';
    
    // Estrai titoli e intestazioni significative dalla pagina
    const headlines = extractTitlesAndHeadlines($);
    
    // Estrai il contenuto principale
    let mainContent = '';
    let paragraphs: string[] = [];
    
    // Cerchiamo prima elementi tipici di contenuti di articoli
    const articleSelectors = [
      'article', '.article', '.content', '.post', 'main', '#content', '.body', 
      '[role="main"]', '.main-content', '.entry-content', '.post-content',
      '.news-content', '.article-body', '.story-content'
    ];
    
    // Cerca il contenuto principale dell'articolo
    let articleElement = null;
    for (const selector of articleSelectors) {
      if ($(selector).length) {
        articleElement = $(selector);
        break;
      }
    }
    
    // Se abbiamo trovato un elemento articolo, estraiamo i paragrafi
    if (articleElement) {
      articleElement.find('p').each((_, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 30) {
          paragraphs.push(text);
        }
      });
    }
    
    // Se non troviamo paragrafi specifici, prendiamo tutti i paragrafi dal corpo
    if (paragraphs.length === 0) {
      $('body p').each((_, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 30) {
          paragraphs.push(text);
        }
      });
    }
    
    // Limitiamo i paragrafi
    paragraphs = paragraphs.slice(0, 5);
    
    // Se ancora non abbiamo contenuto, prendiamo il testo del corpo
    if (paragraphs.length === 0) {
      mainContent = $('body').text().replace(/\s+/g, ' ').trim();
      mainContent = mainContent.slice(0, 1500);
    } else {
      mainContent = paragraphs.join('\n\n');
    }
    
    // Prepariamo un riepilogo formattato
    let result = `🔍 **${title || 'Pagina web'}**\n\n`;
    
    if (description) {
      result += `📋 ${description}\n\n`;
    }
    
    // Aggiungiamo titoli se li abbiamo trovati
    if (headlines.length > 0) {
      result += `📑 **Titoli principali:**\n`;
      headlines.slice(0, 5).forEach(headline => {
        result += `• ${headline}\n`;
      });
      result += `\n`;
    }
    
    // Aggiungiamo il contenuto principale
    result += `💬 **Contenuto:**\n${mainContent}\n\n`;
    result += `🌐 Fonte: ${url}`;
    
    // Salviamo la pagina nella memoria contestuale
    contextMemory.addWebPage(url, title || 'Pagina web', mainContent);
    
    return result;
  } catch (error: any) {
    // Logging dettagliato dell'errore
    console.error("Errore WebSearch dettagliato:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      url: url
    });
    
    // Messaggio adatto all'utente con dettagli utili per il debugging
    return `❌ **Impossibile accedere a ${url}**\n\nDettagli: ${error.message || 'Errore sconosciuto'}\n\nProva con un altro sito o verifica che il sito sia pubblicamente accessibile.`;
  }
}