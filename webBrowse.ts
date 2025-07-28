// ✅ FILE: utils/webBrowse.ts
import fetch from 'node-fetch';
import { generateAIResponse } from './aiClient';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function searchAndPrompt(query: string): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY;
  
  if (!apiKey) {
    console.log('🔄 [NO API KEY] Fallback a risposta diretta AI');
    const fallbackPrompt = `L'utente ha chiesto: "${query}". Fornisci una risposta utile e informativa basata sulla tua conoscenza, specificando che non hai accesso a informazioni aggiornate online.`;
    return await generateAIResponse(fallbackPrompt);
  }

  try {
    console.log(`🔍 [GEMINI SEARCH] Ricerca web per: "${query}"`);
    
    // Usa Gemini standard per elaborare richieste web
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash'
    });

    const searchPrompt = `L'utente ha chiesto informazioni su: "${query}"

Non hai accesso a informazioni web in tempo reale. Fornisci una risposta utile basata sulla tua conoscenza, spiegando onestamente che non puoi accedere a dati aggiornati e suggerendo fonti specifiche affidabili dove l'utente può trovare informazioni recenti.

Sii dettagliato e utile nella tua risposta, suggerendo siti web specifici e affidabili per l'argomento richiesto.`;

    console.log(`🤖 [GEMINI STANDARD] Elaborazione richiesta senza ricerca web`);
    const result = await model.generateContent(searchPrompt);
    const response = result.response;
    const text = response.text();

    console.log(`✅ [RESPONSE SUCCESS] Risposta ricevuta: ${text.slice(0, 100)}...`);
    return text;

  } catch (error: any) {
    console.error('❌ [GEMINI SEARCH ERROR]:', error.message);
    
    // Se Gemini fallisce per quota limits, prova Google Custom Search
    if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('Too Many Requests')) {
      console.log('🔄 [FALLBACK] Provo Google Custom Search API');
      try {
        const { searchGoogle } = await import('./googleSearch');
        const searchResults = await searchGoogle(query);
        
        // Usa Gemini per elaborare i risultati di ricerca
        const summaryPrompt = `Basandoti sui seguenti risultati di ricerca, fornisci una risposta completa e accurata alla domanda: "${query}"

Risultati di ricerca:
${searchResults}

Riassumi le informazioni più rilevanti in modo chiaro e professionale. Se ci sono informazioni recenti importanti, evidenziale.`;

        const summaryResponse = await generateAIResponse(summaryPrompt);
        console.log(`✅ [GOOGLE SEARCH + AI SUCCESS] Risposta generata da ricerca personalizzata`);
        return summaryResponse;
        
      } catch (searchError: any) {
        console.error('❌ [GOOGLE SEARCH ERROR]:', searchError.message);
        console.log('🔄 [FINAL FALLBACK] Uso Gemini standard senza ricerca web');
      }
    }
    
    // Fallback finale a risposta standard con Gemini
    const fallbackPrompt = `L'utente ha chiesto informazioni su: "${query}". 
    
    Fornisci una risposta informativa e utile utilizzando la tua conoscenza. 
    Se la domanda riguarda eventi recenti o informazioni che cambiano frequentemente, 
    spiega che non hai accesso a informazioni aggiornate in tempo reale e 
    suggerisci fonti affidabili dove l'utente può trovare informazioni aggiornate.
    
    Includi tutto il contesto e le informazioni generali che puoi sulla richiesta.`;
    
    return await generateAIResponse(fallbackPrompt);
  }
}