import express from 'express';
import { 
  completeCode, 
  getContextualSuggestions, 
  getCompletionStatus 
} from './completionController';
import { verifyToken } from './authConfig';

const completionRouter = express.Router();

// Route per completamento automatico del codice
completionRouter.post('/suggest', verifyToken, completeCode);

// Route per suggerimenti contestuali multipli
completionRouter.post('/suggestions', verifyToken, getContextualSuggestions);

// Route per verificare stato servizio completamento
completionRouter.get('/status', verifyToken, getCompletionStatus);

export default completionRouter;