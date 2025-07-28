import { Request, Response } from 'express';
import { generateAIResponse } from './utils/aiClient';
// AI client is now handled by the unified aiClient

/**
 * Analizza la qualità del codice utilizzando AI
 * POST /api/quality/analyze
 */
export const analyzeCodeQuality = async (req: Request, res: Response) => {
  try {
    const { code, language } = req.body;

    if (!code || !language) {
      return res.status(400).json({ 
        error: 'Parametri mancanti: code e language sono obbligatori' 
      });
    }

    const prompt = `
Sei un senior software engineer esperto.

Analizza il seguente codice ${language} per:
1. Problemi di sintassi e linting
2. Chiarezza del codice e naming
3. Performance e struttura
4. Best practices e convenzioni

Fornisci un punteggio (0–100) e massimo 3 suggerimenti concreti per migliorare.
Rispondi SOLO in formato JSON come questo esempio:
{
  "score": 85,
  "issues": ["Variabile 'x' ha nome poco descrittivo", "Manca gestione errori"],
  "suggestions": ["Rinomina 'x' in 'userCount'", "Aggiungi try-catch", "Usa const invece di let"]
}

CODICE DA ANALIZZARE:
\`\`\`${language}
${code}
\`\`\`
`;

    try {
      const reply = await generateAIResponse(prompt);
      const parsed = JSON.parse(reply || '{"score": 0, "issues": [], "suggestions": []}');

      res.status(200).json({
        success: true,
        analysis: parsed,
        usingAI: true
      });
    } catch (error) {
      console.log("Fallback to simulation due to AI error");
      const analysis = simulateCodeQualityAnalysis(code, language);
      
      res.status(200).json({
        success: true,
        analysis,
        usingAI: false,
        message: "Analisi simulata - AI non disponibile"
      });
    }
  } catch (error: any) {
    console.error('Errore analisi qualità:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'Errore durante l\'analisi del codice'
    });
  }
};

/**
 * Simula analisi di qualità del codice quando OpenAI non è disponibile
 */
function simulateCodeQualityAnalysis(code: string, language: string) {
  const codeLength = code.length;
  const lines = code.split('\n').length;
  
  // Analisi euristica semplice
  let score = 70; // Punteggio base
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Controlli di base per diversi linguaggi
  if (language === 'javascript' || language === 'typescript') {
    if (code.includes('var ')) {
      score -= 10;
      issues.push("Uso di 'var' invece di 'let' o 'const'");
      suggestions.push("Sostituisci 'var' con 'let' o 'const' per scope migliore");
    }
    
    if (!code.includes('try') && code.includes('JSON.parse')) {
      score -= 5;
      issues.push("Parsing JSON senza gestione errori");
      suggestions.push("Aggiungi try-catch per gestire errori di parsing");
    }
    
    if (code.includes('console.log')) {
      score -= 5;
      issues.push("Console.log presente nel codice");
      suggestions.push("Rimuovi console.log o usa un logger appropriato");
    }
  }

  if (language === 'python') {
    if (!code.includes('def ') && codeLength > 50) {
      score -= 10;
      issues.push("Codice lungo senza funzioni");
      suggestions.push("Dividi il codice in funzioni più piccole");
    }
    
    if (code.includes('print(') && lines > 10) {
      score -= 5;
      issues.push("Statement print nel codice di produzione");
      suggestions.push("Usa logging invece di print()");
    }
  }

  // Controlli generali
  if (codeLength > 1000) {
    score -= 10;
    issues.push("Codice molto lungo, difficile da mantenere");
    suggestions.push("Dividi in funzioni o moduli più piccoli");
  }

  if (lines > 50 && !code.includes('//') && !code.includes('#')) {
    score -= 5;
    issues.push("Mancano commenti esplicativi");
    suggestions.push("Aggiungi commenti per spiegare la logica complessa");
  }

  // Assicura che ci siano sempre almeno 1-2 suggerimenti
  if (suggestions.length === 0) {
    suggestions.push("Considera l'aggiunta di type hints o documentazione");
    suggestions.push("Verifica la consistenza dello stile di naming");
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
    suggestions: suggestions.slice(0, 3) // Max 3 suggerimenti
  };
}

/**
 * Ottiene statistiche sull'utilizzo del servizio di analisi qualità
 * GET /api/quality/stats
 */
export const getQualityStats = async (req: Request, res: Response) => {
  try {
    res.status(200).json({
      success: true,
      stats: {
        service: "Code Quality Analysis",
        ai_available: true,
        supported_languages: [
          "javascript", "typescript", "python", "java", 
          "cpp", "html", "css", "php", "go", "rust"
        ],
        version: "1.0.0"
      }
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};