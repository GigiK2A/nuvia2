import express from 'express';
import { editCodeInline, getInlineEditStatus } from './inlineEditController';
import { verifyToken } from './authConfig';

const inlineRouter = express.Router();

// Route per modifica inline del codice
inlineRouter.post('/edit', verifyToken, editCodeInline);

// Route per verificare stato servizio inline edit
inlineRouter.get('/status', verifyToken, getInlineEditStatus);

export default inlineRouter;