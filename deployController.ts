import { Request, Response } from 'express';
import axios from 'axios';

const VERCEL_API_URL = 'https://api.vercel.com/v13/deployments';
const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN || 'INSERISCI_TOKEN';
const PROJECT_NAME = 'ai-agent-project'; // nome progetto personalizzabile

export const deployProject = async (req: Request, res: Response) => {
  try {
    const { files, projectName } = req.body;

    if (!files || !Array.isArray(files)) {
      return res.status(400).json({ error: 'Files array is required' });
    }

    if (!VERCEL_TOKEN || VERCEL_TOKEN === 'INSERISCI_TOKEN') {
      return res.status(400).json({ 
        error: 'VERCEL_API_TOKEN non configurato. Aggiungi il token nelle variabili d\'ambiente.' 
      });
    }

    // Formato files per Vercel API
    const vercelFiles = files.reduce((acc: any, file: any) => {
      acc[file.name] = { data: file.content };
      return acc;
    }, {});

    const deploymentData = {
      name: projectName || PROJECT_NAME,
      files: vercelFiles,
      target: 'production',
      projectSettings: {
        framework: 'static'
      }
    };

    const response = await axios.post(VERCEL_API_URL, deploymentData, {
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const deploymentUrl = `https://${response.data.url}`;
    
    res.status(200).json({ 
      success: true,
      url: deploymentUrl,
      deploymentId: response.data.id,
      message: 'Deploy completato con successo!'
    });

  } catch (err: any) {
    console.error('Errore deploy Vercel:', err.response?.data || err.message);
    
    if (err.response?.status === 401) {
      return res.status(401).json({ 
        error: 'Token Vercel non valido. Verifica VERCEL_API_TOKEN.' 
      });
    }
    
    if (err.response?.status === 403) {
      return res.status(403).json({ 
        error: 'Permessi insufficienti per il deploy. Verifica il token Vercel.' 
      });
    }

    res.status(500).json({ 
      error: 'Errore nel deploy automatico.',
      details: err.response?.data?.error?.message || err.message
    });
  }
};