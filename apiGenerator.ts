import { Request, Response } from 'express';
import { generateAIResponse } from './utils/aiClient';
import { getLocalizedPrompt, getUserLanguage, PROMPT_TYPES } from './utils/getLocalizedPrompt';
// AI client is now handled by the unified aiClient

export const generateApiCrud = async (req: Request, res: Response) => {
  try {
    const { entity } = req.body;

    if (!entity || entity.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Nome entità richiesto' 
      });
    }

    const language = getUserLanguage(req);
    const prompt = getLocalizedPrompt(language, PROMPT_TYPES.GENERATE_API, { entity });

    try {
      const apiCode = await generateAIResponse(prompt);
      return res.status(200).json({ 
        success: true,
        code: apiCode,
        usingAI: true
      });
    } catch (error) {
      console.log("🧪 Fallback to simulation due to AI error");
      const simulatedCode = generateSimulatedCrud(entity);
      return res.status(200).json({ 
        success: true,
        code: simulatedCode,
        usingSimulation: true
      });
    }

    const reply = completion.choices[0].message?.content;
    
    if (!reply) {
      throw new Error('Nessuna risposta da OpenAI');
    }

    const parsedResponse = JSON.parse(reply);
    const formattedCode = formatCrudResponse(parsedResponse);
    
    res.status(200).json({ 
      success: true,
      code: formattedCode,
      usingSimulation: false
    });

  } catch (err: any) {
    console.error('Errore generazione API CRUD:', err.message);
    
    // Fallback alla simulazione in caso di errore
    console.log("🧪 Fallback alla simulazione per errore OpenAI");
    const simulatedCode = generateSimulatedCrud(req.body.entity);
    
    res.status(200).json({ 
      success: true,
      code: simulatedCode,
      usingSimulation: true,
      note: 'Generato in modalità simulazione a causa di un errore con OpenAI'
    });
  }
};

function generateSimulatedCrud(entity: string): string {
  const entityLower = entity.toLowerCase();
  const entityCapitalized = entity.charAt(0).toUpperCase() + entity.slice(1).toLowerCase();
  const entityPlural = entityLower.endsWith('a') ? entityLower + 'i' : entityLower + 's';

  return `---
🎯 **API CRUD GENERATA PER: ${entityCapitalized}**

📁 **CONTROLLER** (\`controllers/${entityLower}Controller.ts\`)
\`\`\`typescript
// Nome file: controllers/${entityLower}Controller.ts
import { Request, Response } from 'express';
import { ${entityCapitalized}, Create${entityCapitalized}Data, Update${entityCapitalized}Data } from '../models/${entityLower}Model';

// Storage in memoria (sostituire con database reale)
let ${entityPlural}: ${entityCapitalized}[] = [
  {
    id: 1,
    nome: 'Esempio ${entityCapitalized} 1',
    descrizione: 'Descrizione di esempio',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 2,
    nome: 'Esempio ${entityCapitalized} 2',
    descrizione: 'Altra descrizione',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

let nextId = 3;

/**
 * GET /${entityPlural} - Ottieni tutti gli ${entityPlural}
 */
export const getAll${entityCapitalized}s = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const paginatedItems = ${entityPlural}.slice(offset, offset + limit);
    
    res.status(200).json({
      success: true,
      data: {
        ${entityPlural}: paginatedItems,
        pagination: {
          page,
          limit,
          total: ${entityPlural}.length,
          totalPages: Math.ceil(${entityPlural}.length / limit)
        }
      }
    });
  } catch (error) {
    console.error('Errore nel recupero degli ${entityPlural}:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
};

/**
 * GET /${entityPlural}/:id - Ottieni un ${entityLower} specifico
 */
export const get${entityCapitalized}ById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID non valido'
      });
    }

    const ${entityLower} = ${entityPlural}.find(item => item.id === id);
    
    if (!${entityLower}) {
      return res.status(404).json({
        success: false,
        error: '${entityCapitalized} non trovato'
      });
    }

    res.status(200).json({
      success: true,
      data: { ${entityLower} }
    });
  } catch (error) {
    console.error('Errore nel recupero del ${entityLower}:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
};

/**
 * POST /${entityPlural} - Crea un nuovo ${entityLower}
 */
export const create${entityCapitalized} = async (req: Request, res: Response) => {
  try {
    const ${entityLower}Data: Create${entityCapitalized}Data = req.body;

    // Validazione base
    if (!${entityLower}Data.nome || ${entityLower}Data.nome.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nome ${entityLower} richiesto'
      });
    }

    const new${entityCapitalized}: ${entityCapitalized} = {
      id: nextId++,
      ...${entityLower}Data,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    ${entityPlural}.push(new${entityCapitalized});

    res.status(201).json({
      success: true,
      data: { ${entityLower}: new${entityCapitalized} },
      message: '${entityCapitalized} creato con successo'
    });
  } catch (error) {
    console.error('Errore nella creazione del ${entityLower}:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
};

/**
 * PUT /${entityPlural}/:id - Aggiorna un ${entityLower}
 */
export const update${entityCapitalized} = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updateData: Update${entityCapitalized}Data = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID non valido'
      });
    }

    const ${entityLower}Index = ${entityPlural}.findIndex(item => item.id === id);
    
    if (${entityLower}Index === -1) {
      return res.status(404).json({
        success: false,
        error: '${entityCapitalized} non trovato'
      });
    }

    // Aggiorna solo i campi forniti
    ${entityPlural}[${entityLower}Index] = {
      ...${entityPlural}[${entityLower}Index],
      ...updateData,
      updatedAt: new Date()
    };

    res.status(200).json({
      success: true,
      data: { ${entityLower}: ${entityPlural}[${entityLower}Index] },
      message: '${entityCapitalized} aggiornato con successo'
    });
  } catch (error) {
    console.error('Errore nell\\'aggiornamento del ${entityLower}:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
};

/**
 * DELETE /${entityPlural}/:id - Elimina un ${entityLower}
 */
export const delete${entityCapitalized} = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID non valido'
      });
    }

    const ${entityLower}Index = ${entityPlural}.findIndex(item => item.id === id);
    
    if (${entityLower}Index === -1) {
      return res.status(404).json({
        success: false,
        error: '${entityCapitalized} non trovato'
      });
    }

    const deleted${entityCapitalized} = ${entityPlural}.splice(${entityLower}Index, 1)[0];

    res.status(200).json({
      success: true,
      data: { ${entityLower}: deleted${entityCapitalized} },
      message: '${entityCapitalized} eliminato con successo'
    });
  } catch (error) {
    console.error('Errore nell\\'eliminazione del ${entityLower}:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
};
\`\`\`

🛤️ **ROUTER** (\`routes/${entityLower}Routes.ts\`)
\`\`\`typescript
// Nome file: routes/${entityLower}Routes.ts
import express from 'express';
import {
  getAll${entityCapitalized}s,
  get${entityCapitalized}ById,
  create${entityCapitalized},
  update${entityCapitalized},
  delete${entityCapitalized}
} from '../controllers/${entityLower}Controller';

const ${entityLower}Router = express.Router();

/**
 * Routes per la gestione degli ${entityPlural}
 */

// GET /${entityPlural} - Lista tutti gli ${entityPlural}
${entityLower}Router.get('/${entityPlural}', getAll${entityCapitalized}s);

// GET /${entityPlural}/:id - Ottieni ${entityLower} specifico
${entityLower}Router.get('/${entityPlural}/:id', get${entityCapitalized}ById);

// POST /${entityPlural} - Crea nuovo ${entityLower}
${entityLower}Router.post('/${entityPlural}', create${entityCapitalized});

// PUT /${entityPlural}/:id - Aggiorna ${entityLower}
${entityLower}Router.put('/${entityPlural}/:id', update${entityCapitalized});

// DELETE /${entityPlural}/:id - Elimina ${entityLower}
${entityLower}Router.delete('/${entityPlural}/:id', delete${entityCapitalized});

export default ${entityLower}Router;

/**
 * Esempio di utilizzo nel server principale:
 * 
 * import ${entityLower}Router from './routes/${entityLower}Routes';
 * app.use('/api', ${entityLower}Router);
 * 
 * Endpoints disponibili:
 * - GET    /api/${entityPlural}
 * - GET    /api/${entityPlural}/:id
 * - POST   /api/${entityPlural}
 * - PUT    /api/${entityPlural}/:id
 * - DELETE /api/${entityPlural}/:id
 */
\`\`\`

📋 **MODELLO** (\`models/${entityLower}Model.ts\`)
\`\`\`typescript
// Nome file: models/${entityLower}Model.ts

/**
 * Interfaccia principale per ${entityCapitalized}
 */
export interface ${entityCapitalized} {
  id: number;
  nome: string;
  descrizione?: string;
  status?: 'attivo' | 'inattivo';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Dati per la creazione di un nuovo ${entityLower}
 * (esclude campi auto-generati)
 */
export interface Create${entityCapitalized}Data {
  nome: string;
  descrizione?: string;
  status?: 'attivo' | 'inattivo';
  metadata?: Record<string, any>;
}

/**
 * Dati per l'aggiornamento di un ${entityLower}
 * (tutti i campi opzionali)
 */
export interface Update${entityCapitalized}Data {
  nome?: string;
  descrizione?: string;
  status?: 'attivo' | 'inattivo';
  metadata?: Record<string, any>;
}

/**
 * Risposta API per lista ${entityPlural}
 */
export interface ${entityCapitalized}ListResponse {
  success: boolean;
  data: {
    ${entityPlural}: ${entityCapitalized}[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

/**
 * Risposta API per singolo ${entityLower}
 */
export interface ${entityCapitalized}Response {
  success: boolean;
  data: {
    ${entityLower}: ${entityCapitalized};
  };
  message?: string;
}

/**
 * Risposta API per errori
 */
export interface ${entityCapitalized}ErrorResponse {
  success: false;
  error: string;
}

/**
 * Validatori per ${entityCapitalized}
 */
export const ${entityCapitalized}Validators = {
  /**
   * Valida i dati per la creazione
   */
  validateCreate: (data: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.nome || typeof data.nome !== 'string' || data.nome.trim().length === 0) {
      errors.push('Nome è richiesto e deve essere una stringa non vuota');
    }

    if (data.nome && data.nome.length > 255) {
      errors.push('Nome non può superare 255 caratteri');
    }

    if (data.descrizione && typeof data.descrizione !== 'string') {
      errors.push('Descrizione deve essere una stringa');
    }

    if (data.status && !['attivo', 'inattivo'].includes(data.status)) {
      errors.push('Status deve essere "attivo" o "inattivo"');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Valida i dati per l'aggiornamento
   */
  validateUpdate: (data: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (data.nome !== undefined) {
      if (typeof data.nome !== 'string' || data.nome.trim().length === 0) {
        errors.push('Nome deve essere una stringa non vuota');
      }
      if (data.nome.length > 255) {
        errors.push('Nome non può superare 255 caratteri');
      }
    }

    if (data.descrizione !== undefined && typeof data.descrizione !== 'string') {
      errors.push('Descrizione deve essere una stringa');
    }

    if (data.status !== undefined && !['attivo', 'inattivo'].includes(data.status)) {
      errors.push('Status deve essere "attivo" o "inattivo"');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};

/**
 * Utility per ${entityCapitalized}
 */
export const ${entityCapitalized}Utils = {
  /**
   * Filtra i dati sensibili per la risposta pubblica
   */
  sanitizeForResponse: (${entityLower}: ${entityCapitalized}): ${entityCapitalized} => {
    // Rimuovi o maschera eventuali dati sensibili
    return {
      ...${entityLower},
      // Esempio: nascondere metadata sensibili
      metadata: ${entityLower}.metadata ? Object.keys(${entityLower}.metadata).reduce((acc, key) => {
        if (!key.startsWith('_private')) {
          acc[key] = ${entityLower}.metadata![key];
        }
        return acc;
      }, {} as Record<string, any>) : undefined
    };
  },

  /**
   * Genera slug dal nome
   */
  generateSlug: (nome: string): string => {
    return nome
      .toLowerCase()
      .replace(/[àáâäã]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôöõ]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
};
\`\`\`

📋 **MIDDLEWARE DI VALIDAZIONE** (\`middleware/validate${entityCapitalized}.ts\`)
\`\`\`typescript
// Nome file: middleware/validate${entityCapitalized}.ts
import { Request, Response, NextFunction } from 'express';
import { ${entityCapitalized}Validators } from '../models/${entityLower}Model';

/**
 * Middleware per validare i dati di creazione ${entityLower}
 */
export const validateCreate${entityCapitalized} = (req: Request, res: Response, next: NextFunction) => {
  const validation = ${entityCapitalized}Validators.validateCreate(req.body);
  
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      error: 'Dati non validi',
      details: validation.errors
    });
  }
  
  next();
};

/**
 * Middleware per validare i dati di aggiornamento ${entityLower}
 */
export const validateUpdate${entityCapitalized} = (req: Request, res: Response, next: NextFunction) => {
  const validation = ${entityCapitalized}Validators.validateUpdate(req.body);
  
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      error: 'Dati non validi',
      details: validation.errors
    });
  }
  
  next();
};
\`\`\`

🚀 **SETUP COMPLETO**
Per integrare tutto nel tuo server:

\`\`\`typescript
// Nel tuo server.ts principale
import ${entityLower}Router from './routes/${entityLower}Routes';

app.use('/api', ${entityLower}Router);
\`\`\`

📋 **ENDPOINTS DISPONIBILI**:
- \`GET /api/${entityPlural}\` - Lista paginata
- \`GET /api/${entityPlural}/:id\` - Dettaglio singolo
- \`POST /api/${entityPlural}\` - Creazione
- \`PUT /api/${entityPlural}/:id\` - Aggiornamento
- \`DELETE /api/${entityPlural}/:id\` - Eliminazione

---

**✨ API CRUD completa per ${entityCapitalized} generata con successo!**
Codice pronto per l'uso, modulare e ben documentato.`;
}

function formatCrudResponse(parsedResponse: any): string {
  return `---
🎯 **API CRUD GENERATA**

📁 **CONTROLLER**
\`\`\`typescript
${parsedResponse.controller}
\`\`\`

🛤️ **ROUTER**  
\`\`\`typescript
${parsedResponse.router}
\`\`\`

📋 **MODELLO**
\`\`\`typescript
${parsedResponse.model}
\`\`\`
---`;
}