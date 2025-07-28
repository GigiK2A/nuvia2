import express from 'express';
import { deployProject } from './deployController';
import { verifyToken } from './authConfig';

const deployRouter = express.Router();

// Route per il deploy automatico a Vercel
deployRouter.post('/deploy', verifyToken, deployProject);

export default deployRouter;