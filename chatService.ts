/**
 * Service per la gestione delle risposte di chat con AI reale
 */

import { generateAIResponse } from './utils/aiClient';
import { webSearchWithScraping } from './utils/webScraper';
import { storage } from './storage';

interface Message {
  role: string;
  content: string;
}

// Parole chiave che indicano richieste di informazioni aggiornate
const currentInfoKeywords = [
  'attuale', 'oggi', 'ora', 'adesso', 'corrente', 'recente', 'ultimo', 'ultimissimo',
  'quest\'anno', 'questo anno', '2024', '2025', 'ora', 'momento', 'presente',
  'chi è il', 'chi è l\'', 'quando è', 'dove è', 'cosa è successo', 'è successo', 'ha vinto',
  'vincitore', 'risultato', 'classifica', 'notizie', 'news', 'aggiornamento', 'allenatore del'
];

// Gestione delle risposte di chat con AI reale, ricerca web e memoria persistente
export async function generateChatResponseWithMemory(
  message: string,
  userId: number,
  chatId?: number
): Promise<{ response: string; chatId: number; sources?: any[] }> {
  
  let currentChatId = chatId;
  
  // Se non abbiamo un chatId, crea una nuova chat
  if (!currentChatId) {
    const newChat = await storage.createChat({
      userId: userId,
      title: message.slice(0, 50) + (message.length > 50 ? '...' : '')
    });
    currentChatId = newChat.id;
  }
  
  // Salva il messaggio dell'utente
  await storage.createMessage({
    chatId: currentChatId,
    content: message,
    role: 'user'
  });
  
  // Recupera la cronologia della chat per contesto
  const chatHistory = await storage.getChatMessages(currentChatId);
  const historyForAI = chatHistory.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
  
  try {
    const response = await generateChatResponse(message, historyForAI);
    
    // Salva la risposta dell'AI
    await storage.createMessage({
      chatId: currentChatId,
      content: response,
      role: 'assistant'
    });
    
    // Controlla se la risposta contiene fonti (formato JSON)
    try {
      const parsed = JSON.parse(response);
      if (parsed.response && parsed.sources) {
        return {
          response: parsed.response,
          chatId: currentChatId,
          sources: parsed.sources
        };
      }
    } catch (e) {
      // Risposta in formato testo normale
    }
    
    return {
      response,
      chatId: currentChatId
    };
    
  } catch (error) {
    console.error('Errore generazione risposta:', error);
    throw error;
  }
}

// Funzione originale mantenuta per compatibilità
export async function generateChatResponse(
  message: string,
  history: { role: string; content: string }[]
): Promise<string> {
  
  try {
    // SEMPRE cerca informazioni aggiornate su internet per ogni richiesta
    console.log(`🌐 [WEB SEARCH] Ricerca informazioni aggiornate per: "${message}"`);
    
    try {
      // Prima cerca informazioni aggiornate su internet
      const webResult = await webSearchWithScraping(message);
      
      // Controlla se la risposta è in formato JSON con fonti
      try {
        const parsed = JSON.parse(webResult);
        if (parsed.response && parsed.sources) {
          // Integra la cronologia della conversazione nella risposta
          if (history.length > 0) {
            const contextPrompt = `Considerando la conversazione precedente e le nuove informazioni trovate, ecco la risposta:

Conversazione precedente: ${JSON.stringify(history.slice(-3))}

Domanda attuale: ${message}

Risposta basata su informazioni aggiornate:
${parsed.response}`;

            const enhancedResponse = await generateAIResponse(contextPrompt);
            
            return JSON.stringify({
              response: enhancedResponse,
              sources: parsed.sources
            });
          }
          
          return webResult; // Ritorna il JSON completo con fonti
        }
      } catch (e) {
        // Non è JSON, usa come testo normale
        return webResult;
      }
      
    } catch (error) {
      console.error('🔴 [WEB SEARCH FAILED] Fallback a conoscenze AI:', error);
      
      // Se la ricerca web fallisce, usa l'AI con un avviso
      const prompt = `Rispondi a questo messaggio: ${message}

Considera la cronologia della conversazione se rilevante: ${JSON.stringify(history)}

IMPORTANTE: Le mie informazioni sono aggiornate fino al 2023. Per informazioni più recenti, la ricerca web non è al momento disponibile.`;

      const aiResponse = await generateAIResponse(prompt);
      
      return JSON.stringify({
        response: aiResponse + "\n\n⚠️ Nota: Non ho potuto cercare informazioni aggiornate su internet. La risposta si basa sulle mie conoscenze fino al 2023.",
        sources: []
      });
    }
    
  } catch (error) {
    console.error('Chat response error:', error);
    return JSON.stringify({
      response: 'Mi dispiace, si è verificato un errore nel elaborare la tua richiesta. Riprova tra poco.',
      sources: []
    });
  }
}

// Funzione per gestire risposte con toni AI dinamici
export async function generateChatResponseWithRole(
  message: string,
  history: { role: string; content: string }[],
  aiRole: string,
  systemPrompt: string
): Promise<string> {
  
  try {
    let fullPrompt = systemPrompt + '\n\n';
    
    if (history.length > 0) {
      fullPrompt += `Cronologia conversazione: ${history.slice(-3).map(h => `${h.role}: ${h.content}`).join('\n')}\n\n`;
    }
    
    fullPrompt += `Messaggio utente: ${message}`;
    
    return await generateAIResponse(fullPrompt);
  } catch (error) {
    console.error('Chat response with role error:', error);
    return 'Mi dispiace, si è verificato un errore nel elaborare la tua richiesta. Riprova tra poco.';
  }
}