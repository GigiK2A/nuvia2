import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// Fallback content for when AI service is overloaded
function getFallbackContent(type: string, prompt: string): string {
  const fallbackTemplates = {
    document: `# Documento Generato

**Tipo di richiesta:** ${prompt}

## Contenuto del Documento

Questo è un documento di esempio generato automaticamente. Il servizio AI è temporaneamente non disponibile, ma ecco una struttura base che puoi modificare:

### Sezione 1: Introduzione
[Inserisci qui l'introduzione del documento]

### Sezione 2: Corpo Principale
[Sviluppa qui il contenuto principale]

### Sezione 3: Conclusioni
[Aggiungi le conclusioni finali]

---
*Documento generato il ${new Date().toLocaleDateString('it-IT')}*
*Per un contenuto personalizzato, riprova quando il servizio AI sarà disponibile.*`,

    chat: `Mi dispiace, il servizio AI è temporaneamente sovraccarico. Il tuo messaggio "${prompt}" è stato ricevuto. 

Riprova tra qualche minuto per ottenere una risposta personalizzata e completa.`,

    code: `// Codice di esempio per: ${prompt}

// Il servizio AI è temporaneamente non disponibile
// Questo è un template base che puoi modificare

function esempio() {
    // Aggiungi qui la tua logica
    console.log("Implementazione richiesta: ${prompt}");
    
    // TODO: Sviluppare la funzionalità specifica
    return "Risultato";
}

// Riprova tra qualche minuto per codice personalizzato
esempio();`,

    legal: `# Documento Legale - Bozza

**Oggetto:** ${prompt}

## Avvertenza
Questo è un documento di esempio. Il servizio AI è temporaneamente non disponibile. 
Per documenti legali personalizzati, consultare sempre un avvocato qualificato.

## Struttura Base

### Art. 1 - Premesse
[Inserire le premesse del documento]

### Art. 2 - Oggetto
[Definire l'oggetto del documento]

### Art. 3 - Clausole Generali
[Aggiungere le clausole specifiche]

---
*Documento generato il ${new Date().toLocaleDateString('it-IT')}*
*ATTENZIONE: Questo è solo un template. Consultare un legale per documenti ufficiali.*`
  };

  return fallbackTemplates[type as keyof typeof fallbackTemplates] || fallbackTemplates.chat;
}

// Initialize Gemini AI
if (!process.env.GOOGLE_API_KEY) {
  throw new Error('GOOGLE_API_KEY environment variable is required');
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Context-specific system prompts
const SYSTEM_PROMPTS = {
  document: `You are a professional technical and business writer with expertise in creating clear, well-structured documents. 
Your role is to help users create, edit, and improve documents of all types including reports, proposals, letters, manuals, and presentations.
Always respond with professionally formatted content that is clear, concise, and appropriate for business use.
When generating documents, use proper structure with headings, paragraphs, and formatting.
Respond in Italian unless specifically requested otherwise.`,

  code: `You are an expert full-stack developer with deep knowledge of modern web technologies including React, TypeScript, Node.js, Python, and databases.
Your role is to help users write, debug, optimize, and explain code. Provide clean, production-ready code with proper error handling and best practices.
Always include comments explaining complex logic and suggest improvements when appropriate.
When asked about architecture or design patterns, provide comprehensive solutions with examples.
Respond in Italian unless specifically requested otherwise.`,

  legal: `You are a legal assistant with knowledge of general legal principles and document drafting.
Your role is to help users understand legal concepts and draft legal documents like contracts, agreements, and formal letters.
Always provide clear explanations and include appropriate disclaimers about seeking professional legal advice.
Format legal documents with proper structure and professional language.
Note: This is for informational purposes only and does not constitute legal advice.
Respond in Italian unless specifically requested otherwise.`,

  chat: `You are a helpful AI assistant designed to have natural conversations and provide information on a wide variety of topics.
Your role is to be conversational, informative, and helpful while maintaining a friendly and professional tone.
You can help with general questions, explanations, brainstorming, and casual conversations.
Always provide accurate information and admit when you're uncertain about something.
Respond in Italian unless specifically requested otherwise.`,

  creative: `You are a creative writing assistant with expertise in storytelling, content creation, and creative expression.
Your role is to help users with creative writing projects including stories, poems, scripts, marketing copy, and creative content.
Provide imaginative, engaging, and well-crafted content that captures the desired tone and style.
Offer constructive feedback and suggestions for improving creative works.
Respond in Italian unless specifically requested otherwise.`,

  analysis: `You are a data analyst and researcher with expertise in analyzing information and providing insights.
Your role is to help users analyze data, research topics, summarize information, and provide analytical insights.
Break down complex information into clear, actionable insights and recommendations.
Use structured approaches to present findings and support conclusions with evidence.
Respond in Italian unless specifically requested otherwise.`
};

// Get specialized model instance based on context type
function getModelForType(type: string) {
  const systemPrompt = SYSTEM_PROMPTS[type as keyof typeof SYSTEM_PROMPTS];
  if (!systemPrompt) {
    return null;
  }

  return genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: systemPrompt
  });
}

// Main AI route with type specialization
router.post('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { prompt, isPartialEdit, originalText, selectedText, selectionRange, currentDocument, isModification } = req.body;

    // Validate input
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ 
        error: 'Prompt is required and must be a string' 
      });
    }

    // Get specialized model
    const model = getModelForType(type);
    if (!model) {
      return res.status(400).json({ 
        error: `Unsupported AI type: ${type}. Supported types: ${Object.keys(SYSTEM_PROMPTS).join(', ')}` 
      });
    }

    // Handle partial edits for documents
    let finalPrompt = prompt;
    if (type === 'document' && isPartialEdit && selectedText) {
      finalPrompt = `MODIFICA PARZIALE RICHIESTA

Il seguente testo selezionato deve essere modificato:
"${selectedText}"

Richiesta di modifica: ${prompt}

IMPORTANTE: Restituisci SOLO il testo modificato che sostituirà la selezione. Non includere il resto del documento.
Il testo modificato deve integrarsi perfettamente con il contesto circostante del documento.
Mantieni lo stesso stile, tono e formattazione del documento originale.`;
    } else if (type === 'document' && isModification && currentDocument) {
      // Full document modification with context
      finalPrompt = `Modifica il seguente documento secondo questa richiesta: ${prompt}

DOCUMENTO ATTUALE:
${currentDocument}

Apporta solo le modifiche richieste mantenendo il resto del documento invariato.`;
    }

    console.log(`🤖 [AI REQUEST] Type: ${type}, Prompt length: ${finalPrompt.length} characters${isPartialEdit ? ' (Partial Edit)' : ''}`);

    // Generate response with retry logic
    let text: string | undefined;
    let lastError: any;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await model.generateContent(finalPrompt);
        const response = await result.response;
        text = response.text();
        break; // Success, exit retry loop
      } catch (error: unknown) {
        lastError = error;
        const errorMsg = (error as any)?.message || 'Unknown error';
        console.log(`⚠️ [AI RETRY] Attempt ${attempt}/3 failed:`, errorMsg);
        
        // If it's a 503 (overloaded) error, wait before retrying
        if ((error as any)?.status === 503 && attempt < 3) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`🕒 [AI RETRY] Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else if (attempt === 3) {
          throw error; // Final attempt failed
        }
      }
    }
    
    if (!text) {
      throw lastError || new Error('Failed to generate content');
    }

    console.log(`✅ [AI RESPONSE] Type: ${type}, Response length: ${text.length} characters`);

    res.json({ text });

  } catch (error) {
    console.error(`❌ [AI ERROR] Type: ${req.params.type}`, error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const type = req.params.type;
    
    // Handle specific Gemini API errors
    if (errorMessage.includes('API key')) {
      return res.status(401).json({ 
        error: 'Invalid or missing Google API key' 
      });
    }
    
    if (errorMessage.includes('quota')) {
      return res.status(429).json({ 
        error: 'API quota exceeded. Please try again later.' 
      });
    }

    // Provide fallback content when service is overloaded  
    const errorObj = error as any;
    if (errorObj?.status === 503 || errorMessage.includes('overloaded')) {
      console.log(`🔄 [AI FALLBACK] Providing fallback content for type: ${type}`);
      
      const fallbackContent = getFallbackContent(type, req.body.prompt);
      return res.json({ 
        text: fallbackContent,
        fallback: true,
        message: "Il servizio AI è temporaneamente sovraccarico. Ecco un contenuto di esempio:"
      });
    }

    res.status(500).json({ 
      error: 'Failed to generate AI response',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    supportedTypes: Object.keys(SYSTEM_PROMPTS),
    timestamp: new Date().toISOString()
  });
});

// List available AI types
router.get('/types', (req, res) => {
  const types = Object.keys(SYSTEM_PROMPTS).map(type => ({
    type,
    description: SYSTEM_PROMPTS[type as keyof typeof SYSTEM_PROMPTS].split('\n')[0]
  }));
  
  res.json({ types });
});

export default router;