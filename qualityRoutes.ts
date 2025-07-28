import express from 'express';
import { analyzeCodeQuality, getQualityStats } from './qualityController';

const router = express.Router();

// POST /api/quality/analyze - Analizza qualità del codice
router.post('/analyze', analyzeCodeQuality);

// GET /api/quality/stats - Statistiche del servizio
router.get('/stats', getQualityStats);

export default router;