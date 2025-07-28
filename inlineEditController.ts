import { Request, Response } from 'express';
import { generateAIResponse } from './utils/aiClient';
import { getLocalizedPrompt, getUserLanguage, PROMPT_TYPES } from './utils/getLocalizedPrompt';
// AI client is now handled by the unified aiClient

export const editCodeInline = async (req: Request, res: Response) => {
  try {
    const { selectedCode, userPrompt } = req.body;

    if (!selectedCode || !userPrompt) {
      return res.status(400).json({ 
        success: false,
        error: 'selectedCode e userPrompt sono richiesti' 
      });
    }

    if (selectedCode.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'selectedCode non può essere vuoto'
      });
    }

    if (userPrompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'userPrompt non può essere vuoto'
      });
    }

    console.log(`✏️ Modifica inline richiesta: "${userPrompt}"`);
    console.log(`📝 Codice da modificare (${selectedCode.length} caratteri)`);

    const language = getUserLanguage(req);
    const prompt = getLocalizedPrompt(language, PROMPT_TYPES.INLINE_EDIT, { selectedCode, userPrompt });

    try {
      const updatedCode = await generateAIResponse(prompt);
      return res.status(200).json({ 
        success: true,
        updatedCode,
        usingAI: true
      });
    } catch (error) {
      console.log("🧪 Fallback to simulation due to AI error");
      const simulatedEdit = simulateInlineEdit(selectedCode, userPrompt);
      return res.status(200).json({ 
        success: true,
        updatedCode: simulatedEdit,
        usingSimulation: true
      });
    }

  } catch (err: any) {
    console.error('❌ Errore modifica AI inline:', err.message);
    
    res.status(500).json({ 
      success: false,
      error: 'Errore durante la modifica del codice'
    });
  }
};

/**
 * Simula la modifica inline quando OpenAI non è disponibile
 */
function simulateInlineEdit(selectedCode: string, userPrompt: string): string {
  const promptLower = userPrompt.toLowerCase();
  
  // Trasformazioni comuni simulate
  if (promptLower.includes('arrow function') || promptLower.includes('freccia')) {
    return simulateArrowFunctionTransform(selectedCode);
  }
  
  if (promptLower.includes('async') || promptLower.includes('asincrono')) {
    return simulateAsyncTransform(selectedCode);
  }
  
  if (promptLower.includes('const') || promptLower.includes('costante')) {
    return simulateConstTransform(selectedCode);
  }
  
  if (promptLower.includes('comment') || promptLower.includes('commento')) {
    return simulateAddComments(selectedCode);
  }
  
  if (promptLower.includes('typescript') || promptLower.includes('tipo')) {
    return simulateTypeScriptTransform(selectedCode);
  }
  
  if (promptLower.includes('clean') || promptLower.includes('pulisci')) {
    return simulateCleanCode(selectedCode);
  }
  
  // Trasformazione generica
  return simulateGenericTransform(selectedCode, userPrompt);
}

function simulateArrowFunctionTransform(code: string): string {
  // Trasforma function in arrow function
  const functionRegex = /function\s+(\w+)\s*\(([^)]*)\)\s*\{/g;
  let transformed = code.replace(functionRegex, 'const $1 = ($2) => {');
  
  // Trasforma funzioni anonime
  const anonFunctionRegex = /function\s*\(([^)]*)\)\s*\{/g;
  transformed = transformed.replace(anonFunctionRegex, '($1) => {');
  
  return transformed;
}

function simulateAsyncTransform(code: string): string {
  // Aggiunge async/await
  let transformed = code;
  
  if (!code.includes('async')) {
    // Trasforma funzione in async
    if (code.includes('function')) {
      transformed = code.replace(/function\s+(\w+)/, 'async function $1');
    } else if (code.includes('=>')) {
      transformed = code.replace(/(\w+)\s*=>\s*/, 'async $1 => ');
    }
  }
  
  // Trasforma .then() in await
  transformed = transformed.replace(/\.then\(([^)]+)\)/g, 'await $1');
  
  return transformed;
}

function simulateConstTransform(code: string): string {
  // Trasforma var/let in const dove appropriato
  return code
    .replace(/var\s+(\w+)\s*=/g, 'const $1 =')
    .replace(/let\s+(\w+)\s*=(?![^;]*=)/g, 'const $1 =');
}

function simulateAddComments(code: string): string {
  const lines = code.split('\n');
  const commented = lines.map(line => {
    if (line.trim() && !line.trim().startsWith('//')) {
      return `// ${line.trim()}\n${line}`;
    }
    return line;
  });
  return commented.join('\n');
}

function simulateTypeScriptTransform(code: string): string {
  // Aggiunge tipi TypeScript basilari
  let transformed = code;
  
  // Aggiunge tipi ai parametri delle funzioni
  transformed = transformed.replace(/function\s+(\w+)\s*\(([^)]+)\)/g, (match, name, params) => {
    const typedParams = params.split(',').map((param: string) => {
      const trimmed = param.trim();
      if (!trimmed.includes(':')) {
        return `${trimmed}: any`;
      }
      return trimmed;
    }).join(', ');
    return `function ${name}(${typedParams}): any`;
  });
  
  // Aggiunge tipi alle variabili
  transformed = transformed.replace(/const\s+(\w+)\s*=/g, 'const $1: any =');
  transformed = transformed.replace(/let\s+(\w+)\s*=/g, 'let $1: any =');
  
  return transformed;
}

function simulateCleanCode(code: string): string {
  // Rimuove spazi extra e migliora formattazione
  return code
    .replace(/\s+/g, ' ') // Rimuove spazi multipli
    .replace(/\s*{\s*/g, ' {\n  ') // Formatta apertura blocchi
    .replace(/\s*}\s*/g, '\n}') // Formatta chiusura blocchi
    .replace(/;\s*/g, ';\n') // A capo dopo punto e virgola
    .trim();
}

function simulateGenericTransform(code: string, prompt: string): string {
  // Trasformazione generica con commento
  return `// Modificato: ${prompt}\n${code}\n// Fine modifica`;
}

/**
 * Endpoint per verificare lo stato del servizio inline edit
 */
export const getInlineEditStatus = async (req: Request, res: Response) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Servizio inline edit operativo',
      features: {
        openaiAvailable: !!openai,
        simulationModes: [
          'arrow-function',
          'async-await', 
          'const-conversion',
          'add-comments',
          'typescript-types',
          'clean-code',
          'generic'
        ]
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Errore nel servizio inline edit'
    });
  }
};