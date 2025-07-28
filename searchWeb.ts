import fetch from 'node-fetch';
import { load } from 'cheerio';
import { fetchPageContent } from './fetchPageContent';

export interface SearchResult {
  title: string;
  link: string;
  snippet?: string;
}

export async function searchWeb(query: string): Promise<SearchResult[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const html = await res.text();
    const $ = load(html);

    const results: SearchResult[] = [];

    // Selettore per i risultati di DuckDuckGo
    $('.result').each((i, el) => {
      const titleElement = $(el).find('.result__title a, .result__a');
      const snippetElement = $(el).find('.result__snippet, .result__body');
      
      const title = titleElement.text().trim();
      const link = titleElement.attr('href');
      const snippet = snippetElement.text().trim();

      if (title && link) {
        results.push({
          title,
          link: link.startsWith('//') ? `https:${link}` : link,
          snippet: snippet || undefined,
        });
      }
    });

    console.log(`🔍 Trovati ${results.length} risultati per: "${query}"`);
    return results.slice(0, 8); // Primi 8 risultati
  } catch (err) {
    console.error('Errore ricerca web:', err);
    return [];
  }
}

// Funzione per estrarre contenuto da una pagina web
export async function extractPageContent(url: string): Promise<{
  title: string;
  content: string;
  success: boolean;
}> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 10000, // 10 secondi di timeout
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const html = await res.text();
    const $ = load(html);

    // Rimuovi script e style
    $('script, style, nav, footer, aside, .advertisement, .ads').remove();

    const title = $('title').text().trim() || $('h1').first().text().trim() || 'Titolo non disponibile';
    
    // Estrai il contenuto principale
    let content = '';
    
    // Prova diversi selettori comuni per il contenuto principale
    const contentSelectors = [
      'article',
      'main',
      '.content',
      '.post-content',
      '.entry-content',
      '.article-content',
      '#content',
      '.main-content'
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text().trim();
        break;
      }
    }

    // Se non trova contenuto con i selettori, usa il body
    if (!content) {
      content = $('body').text().trim();
    }

    // Pulisci il contenuto
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .substring(0, 3000); // Limita a 3000 caratteri

    console.log(`📄 Estratto contenuto da: ${url}`);
    
    return {
      title,
      content,
      success: true,
    };
  } catch (err) {
    console.error('Errore estrazione contenuto:', err);
    return {
      title: 'Errore',
      content: 'Impossibile estrarre il contenuto della pagina.',
      success: false,
    };
  }
}