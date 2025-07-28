import express from 'express';
import { generateApiCrud } from './apiGenerator';
import { verifyToken } from './authConfig';

const apiRouter = express.Router();

// Route per la generazione di API CRUD
apiRouter.post('/generate-crud', verifyToken, generateApiCrud);

export default apiRouter;