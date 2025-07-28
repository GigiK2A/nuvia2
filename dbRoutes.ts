import express from 'express';
import { generateDatabaseSchema } from './dbGenerator';
import { verifyToken } from './authConfig';

const dbRouter = express.Router();

// Route per la generazione di schema database
dbRouter.post('/generate-schema', verifyToken, generateDatabaseSchema);

export default dbRouter;