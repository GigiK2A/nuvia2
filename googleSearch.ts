import fetch from 'node-fetch';

export async function searchGoogle(query: string): Promise<string> {
  if (!process.env.GOOGLE_API_KEY || !process.env.GOOGLE_SEARCH_ENGINE_ID) {
    throw new Error('Google Search API credentials not found');
  }

  try {
    console.log(`🔍 [GOOGLE SEARCH] Ricerca per: "${query}"`);
    
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&num=5`;
    
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      throw new Error(`Google Search API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as any;
    
    if (!data.items || data.items.length === 0) {
      return `Non ho trovato risultati recenti per "${query}". Ti consiglio di controllare fonti affidabili come siti di notizie ufficiali.`;
    }
    
    // Estrai informazioni dai primi risultati
    let summary = `Ecco cosa ho trovato su "${query}":\n\n`;
    
    for (let i = 0; i < Math.min(3, data.items.length); i++) {
      const item = data.items[i];
      summary += `${i + 1}. **${item.title}**\n`;
      if (item.snippet) {
        summary += `   ${item.snippet}\n`;
      }
      summary += `   Fonte: ${item.displayLink}\n\n`;
    }
    
    summary += `\nPer informazioni più dettagliate, ti consiglio di consultare le fonti indicate sopra.`;
    
    console.log(`✅ [GOOGLE SEARCH SUCCESS] Trovati ${data.items.length} risultati`);
    return summary;
    
  } catch (error: any) {
    console.error('❌ [GOOGLE SEARCH ERROR]:', error.message);
    throw error;
  }
}