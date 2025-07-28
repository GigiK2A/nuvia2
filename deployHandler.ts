// server/deployHandler.ts
import { Request, Response } from 'express';
import { deployToVercel } from './deployService';

export async function handleDeploy(req: Request, res: Response) {
  const { projectName, files } = req.body;

  try {
    const result = await deployToVercel(projectName, files);
    res.status(200).json({ url: result.url || result.inspectUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel deploy del progetto' });
  }
}