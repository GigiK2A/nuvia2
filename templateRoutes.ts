import express from 'express';
import { 
  saveTemplate, 
  getUserTemplates, 
  loadTemplate, 
  deleteTemplate, 
  updateTemplate 
} from './templateController';
import { verifyToken } from './authConfig';

const templateRouter = express.Router();

// Tutte le route richiedono autenticazione
templateRouter.use(verifyToken);

// POST /api/templates/save - Salva nuovo template
templateRouter.post('/save', saveTemplate);

// GET /api/templates/user/:userId - Lista template utente
templateRouter.get('/user/:userId', getUserTemplates);

// GET /api/templates/:templateId - Carica template specifico
templateRouter.get('/:templateId', loadTemplate);

// PUT /api/templates/:templateId - Aggiorna template
templateRouter.put('/:templateId', updateTemplate);

// DELETE /api/templates/:templateId - Elimina template
templateRouter.delete('/:templateId', deleteTemplate);

export default templateRouter;