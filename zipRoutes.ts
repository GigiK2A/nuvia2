import express from 'express';
import { exportProjectAsZip, getZipServiceStatus } from './zipController';
import { verifyToken } from './authConfig';

const zipRouter = express.Router();

// Route per scaricare progetto come ZIP
zipRouter.post('/download-zip', verifyToken, exportProjectAsZip);

// Route per verificare stato servizio ZIP
zipRouter.get('/status', verifyToken, getZipServiceStatus);

export default zipRouter;