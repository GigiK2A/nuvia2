import { Request, Response } from 'express';
import { generateAIResponse } from './utils/aiClient';
import { getLocalizedPrompt, getUserLanguage, PROMPT_TYPES } from './utils/getLocalizedPrompt';
// AI client is now handled by the unified aiClient

export const completeCode = async (req: Request, res: Response) => {
  try {
    const { currentFile, cursorLine, language } = req.body;

    if (!currentFile || cursorLine === undefined) {
      return res.status(400).json({ 
        success: false,
        error: 'currentFile e cursorLine sono richiesti' 
      });
    }

    if (typeof cursorLine !== 'number' || cursorLine < 0) {
      return res.status(400).json({
        success: false,
        error: 'cursorLine deve essere un numero positivo'
      });
    }

    console.log(`🤖 Completamento richiesto per ${language} alla riga ${cursorLine}`);

    const userLanguage = getUserLanguage(req);
    const prompt = getLocalizedPrompt(userLanguage, PROMPT_TYPES.CODE_COMPLETION, { 
      currentFile, 
      cursorLine, 
      language 
    });

    try {
      const suggestion = await generateAIResponse(prompt);
      return res.status(200).json({ 
        success: true,
        suggestion,
        usingAI: true
      });
    } catch (error) {
      console.log("🧪 Fallback to simulation due to AI error");
      const simulatedSuggestion = simulateCodeCompletion(currentFile, cursorLine, language);
      return res.status(200).json({ 
        success: true,
        suggestion: simulatedSuggestion,
        usingSimulation: true
      });
    }

  } catch (err: any) {
    console.error('❌ Errore completamento AI:', err.message);
    
    res.status(500).json({ 
      success: false,
      error: 'Errore durante il completamento del codice'
    });
  }
};

/**
 * Simula il completamento automatico del codice
 */
function simulateCodeCompletion(currentFile: string, cursorLine: number, language?: string): string {
  const lines = currentFile.split('\n');
  const currentLineContent = lines[cursorLine] || '';
  const previousLines = lines.slice(Math.max(0, cursorLine - 3), cursorLine);
  const context = previousLines.join('\n').toLowerCase();

  // Completamenti basati sul contesto
  if (currentLineContent.trim().startsWith('if') && !currentLineContent.includes('{')) {
    return ' {\n  // TODO: implementare logica\n}';
  }

  if (currentLineContent.trim().startsWith('for') && !currentLineContent.includes('{')) {
    return ' {\n  // TODO: corpo del loop\n}';
  }

  if (currentLineContent.trim().startsWith('function') && !currentLineContent.includes('{')) {
    return ' {\n  // TODO: implementare funzione\n}';
  }

  if (currentLineContent.includes('console.log') && !currentLineContent.includes(')')) {
    return '("Debug:", );';
  }

  if (currentLineContent.includes('const') && currentLineContent.includes('=') && !currentLineContent.includes(';')) {
    return ';';
  }

  if (context.includes('import') && currentLineContent.trim() === '') {
    return 'import React from \'react\';';
  }

  if (context.includes('class') && currentLineContent.trim() === '') {
    return '  constructor() {\n    super();\n  }';
  }

  if (context.includes('async') && currentLineContent.trim() === '') {
    return '  try {\n    // TODO: implementare logica asincrona\n  } catch (error) {\n    console.error(error);\n  }';
  }

  // Completamenti specifici per linguaggio
  if (language === 'javascript' || language === 'typescript') {
    return simulateJavaScriptCompletion(currentLineContent, context);
  }

  if (language === 'python') {
    return simulatePythonCompletion(currentLineContent, context);
  }

  if (language === 'html') {
    return simulateHtmlCompletion(currentLineContent, context);
  }

  if (language === 'css') {
    return simulateCssCompletion(currentLineContent, context);
  }

  // Completamento generico
  return simulateGenericCompletion(currentLineContent, context);
}

function simulateJavaScriptCompletion(currentLine: string, context: string): string {
  if (currentLine.includes('document.querySelector')) {
    return '(\'.class-name\');';
  }

  if (currentLine.includes('addEventListener')) {
    return '(\'click\', () => {\n  // TODO: gestire evento\n});';
  }

  if (currentLine.includes('fetch(')) {
    return '\n  .then(response => response.json())\n  .then(data => console.log(data));';
  }

  if (currentLine.trim() === 'export') {
    return ' default function Component() {\n  return <div>Hello World</div>;\n}';
  }

  return '// TODO: completare implementazione';
}

function simulatePythonCompletion(currentLine: string, context: string): string {
  if (currentLine.includes('def ') && currentLine.includes('(')) {
    return ':\n    """Docstring della funzione"""\n    pass';
  }

  if (currentLine.includes('class ')) {
    return ':\n    def __init__(self):\n        pass';
  }

  if (currentLine.includes('import')) {
    return ' os, sys';
  }

  return '# TODO: completare implementazione';
}

function simulateHtmlCompletion(currentLine: string, context: string): string {
  if (currentLine.includes('<div')) {
    return ' class="container">\n  <p>Contenuto</p>\n</div>';
  }

  if (currentLine.includes('<input')) {
    return ' type="text" placeholder="Inserisci testo" />';
  }

  if (currentLine.includes('<a')) {
    return ' href="#" target="_blank">Link</a>';
  }

  return '<!-- TODO: aggiungere contenuto -->';
}

function simulateCssCompletion(currentLine: string, context: string): string {
  if (currentLine.includes('{')) {
    return '\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}';
  }

  if (currentLine.includes('color:')) {
    return ' #333;';
  }

  if (currentLine.includes('background:')) {
    return ' linear-gradient(45deg, #ff6b6b, #4ecdc4);';
  }

  return 'margin: 0;\npadding: 0;';
}

function simulateGenericCompletion(currentLine: string, context: string): string {
  if (currentLine.trim() === '') {
    return '// Inserire codice qui';
  }

  if (currentLine.includes('=') && !currentLine.includes(';')) {
    return ';';
  }

  if (currentLine.includes('(') && !currentLine.includes(')')) {
    return ')';
  }

  if (currentLine.includes('{') && !currentLine.includes('}')) {
    return '\n  // TODO\n}';
  }

  return '';
}

/**
 * Endpoint per ottenere suggerimenti contestuali avanzati
 */
export const getContextualSuggestions = async (req: Request, res: Response) => {
  try {
    const { currentFile, cursorPosition, language } = req.body;

    // Analizza il contesto e fornisce suggerimenti multiple
    const suggestions = generateContextualSuggestions(currentFile, cursorPosition, language);

    res.status(200).json({
      success: true,
      suggestions: suggestions,
      language: language || 'generic'
    });

  } catch (err: any) {
    console.error('❌ Errore suggerimenti contestuali:', err.message);
    res.status(500).json({
      success: false,
      error: 'Errore nella generazione dei suggerimenti'
    });
  }
};

function generateContextualSuggestions(currentFile: string, cursorPosition: number, language?: string): string[] {
  const context = currentFile.substring(Math.max(0, cursorPosition - 100), cursorPosition);
  const suggestions: string[] = [];

  // Suggerimenti basati sul linguaggio
  if (language === 'javascript' || language === 'typescript') {
    suggestions.push('console.log();');
    suggestions.push('const result = ');
    suggestions.push('if (condition) {');
    suggestions.push('function functionName() {');
  }

  if (language === 'html') {
    suggestions.push('<div class="">');
    suggestions.push('<p>');
    suggestions.push('<input type="text">');
  }

  if (language === 'css') {
    suggestions.push('display: flex;');
    suggestions.push('margin: 0 auto;');
    suggestions.push('color: #333;');
  }

  return suggestions.slice(0, 5); // Massimo 5 suggerimenti
}

/**
 * Endpoint per verificare lo stato del servizio completamento
 */
export const getCompletionStatus = async (req: Request, res: Response) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Servizio completamento automatico operativo',
      features: {
        openaiAvailable: !!openai,
        supportedLanguages: [
          'javascript',
          'typescript', 
          'python',
          'html',
          'css',
          'generic'
        ],
        simulationModes: [
          'contextual-completion',
          'language-specific',
          'smart-suggestions'
        ]
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Errore nel servizio completamento'
    });
  }
};