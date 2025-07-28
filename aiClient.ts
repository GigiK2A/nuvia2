// utils/aiClient.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

const aiProvider = process.env.AI_PROVIDER || 'gemini';

// === OPENAI CONFIGURATION ===
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// === GEMINI CONFIGURATION ===
let genAI: GoogleGenerativeAI | null = null;
let geminiModel: any = null;
if (process.env.GOOGLE_API_KEY) {
  console.log('🟢 Google API Key trovata, inizializzando Gemini...');
  genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  console.log('✅ Gemini inizializzato con successo (modello: gemini-1.5-flash)');
} else {
  console.log('🔴 Google API Key non trovata');
}

// === UNIFIED FUNCTION ===
export async function generateAIResponse(prompt: string): Promise<string> {
  console.log(`🤖 [RICHIESTA AI] Provider: ${aiProvider}, Gemini: ${!!geminiModel}, OpenAI: ${!!openai}`);
  console.log(`🔍 [PROMPT] ${prompt.slice(0, 100)}...`);
  
  try {
    if (aiProvider === 'openai' && openai) {
      console.log('🔵 [USANDO OPENAI] Elaborazione in corso...');
      const response = await openai.chat.completions.create({
        model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
      });

      const result = response.choices[0]?.message?.content || '';
      console.log(`✅ [OPENAI RISPOSTA] ${result.slice(0, 100)}...`);
      return result;
    } else if (aiProvider === 'gemini' && geminiModel) {
      console.log('🟢 [USANDO GEMINI] Elaborazione in corso...');
      
      // Retry mechanism for Gemini with exponential backoff
      const maxRetries = 3;
      let lastError;
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s delays
            console.log(`🔄 [GEMINI RETRY] Tentativo ${attempt + 1}/${maxRetries} dopo ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          const result = await geminiModel.generateContent({
            contents: [{ parts: [{ text: prompt }] }],
          });

          const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
          const finalText = text || 'Nessuna risposta da Gemini.';
          console.log(`✅ [GEMINI RISPOSTA] ${finalText.slice(0, 100)}...`);
          return finalText;
        } catch (retryError: any) {
          lastError = retryError;
          console.log(`⚠️ [GEMINI ERRORE] Tentativo ${attempt + 1} fallito: ${retryError.message}`);
          
          // If it's a 503 (overloaded) or 429 (rate limit), try again
          if (retryError.status === 503 || retryError.status === 429) {
            if (attempt < maxRetries - 1) continue;
          } else {
            // For other errors, don't retry
            break;
          }
        }
      }
      
      // If all retries failed, use simulation fallback
      console.error('❌ [GEMINI FALLIMENTO] Tutti i tentativi falliti:', lastError);
      const simulated = simulateAIResponse(prompt);
      console.log(`⚠️ [FALLBACK SIMULAZIONE] ${simulated.slice(0, 100)}...`);
      return simulated;
    } else {
      console.log('🔴 [FALLBACK SIMULAZIONE] Nessun provider AI disponibile');
      // Fallback to simulation if no API keys are available
      const simulated = simulateAIResponse(prompt);
      console.log(`⚠️ [SIMULAZIONE] ${simulated.slice(0, 100)}...`);
      return simulated;
    }
  } catch (error) {
    console.error('❌ [ERRORE AI]:', error);
    
    // Check if we have OpenAI available for fallback
    if (openai && error.status === 503) {
      console.log('🔄 [FALLBACK OPENAI] Gemini sovraccarico, utilizzando OpenAI...');
      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2000,
        });
        const result = response.choices[0]?.message?.content || '';
        console.log(`✅ [OPENAI FALLBACK] ${result.slice(0, 100)}...`);
        return result;
      } catch (openaiError) {
        console.error('❌ [OPENAI FALLBACK ERRORE]:', openaiError);
      }
    }
    
    // Fallback to simulation only as last resort
    const simulated = simulateAIResponse(prompt);
    console.log(`⚠️ [FALLBACK ERRORE] ${simulated.slice(0, 100)}...`);
    return simulated;
  }
}

// === SIMULATION FALLBACK ===
function simulateAIResponse(prompt: string): string {
  const responses = [
    "Questa è una risposta simulata. Per utilizzare l'AI reale, configura le chiavi API per OpenAI o Gemini.",
    "Risposta di esempio: Il codice che hai condiviso sembra essere scritto in TypeScript e utilizza moderne pratiche di sviluppo.",
    "Simulazione AI: Basandomi sulla tua richiesta, ti consiglio di utilizzare un approccio modulare per il tuo progetto.",
    "AI simulata: La funzionalità che descrivi può essere implementata utilizzando React hooks e state management.",
    "Esempio di risposta: Per ottimizzare le performance, considera l'utilizzo di lazy loading e memoization."
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// === SPECIALIZED FUNCTIONS ===
export async function generateCode(language: string, description: string): Promise<string> {
  const prompt = `Genera codice ${language} per: ${description}. Fornisci solo il codice senza spiegazioni aggiuntive.`;
  return await generateAIResponse(prompt);
}

export async function analyzeCode(code: string): Promise<string> {
  const prompt = `Analizza questo codice e fornisci suggerimenti di miglioramento:\n\n${code}`;
  return await generateAIResponse(prompt);
}

export async function chatResponse(message: string, context?: string): Promise<string> {
  const prompt = context 
    ? `Contesto: ${context}\n\nMessaggio utente: ${message}\n\nRispondi in modo utile e professionale.`
    : `Rispondi a questo messaggio in modo utile e professionale: ${message}`;
  
  return await generateAIResponse(prompt);
}

export async function processNuviaRequest(request: string, userContext?: any): Promise<string> {
  const prompt = `Sei Nuvia, un assistente personale intelligente. L'utente dice: "${request}". 
  ${userContext ? `Contesto utente: ${JSON.stringify(userContext)}` : ''}
  
  Rispondi in modo amichevole e utile. Se la richiesta riguarda eventi o calendario, indica le azioni che puoi eseguire.`;
  
  return await generateAIResponse(prompt);
}