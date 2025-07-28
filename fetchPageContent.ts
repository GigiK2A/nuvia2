import fetch from 'node-fetch';
import { load } from 'cheerio';

export async function fetchPageContent(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await res.text();
    const $ = load(html);

    // Rimuove script, style, nav, footer
    $('script, style, nav, footer, header, noscript').remove();

    const bodyText = $('body').text();
    const cleaned = bodyText
      .replace(/\s+/g, ' ') // togli spazi doppi
      .replace(/(\r\n|\n|\r)/gm, ' ')
      .trim();

    return cleaned.slice(0, 5000); // limita a 5k caratteri
  } catch (err) {
    console.error('Errore fetchPageContent:', err);
    return '';
  }
}