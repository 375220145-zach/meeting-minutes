import { Router, Request, Response } from 'express';
import { setApiKey, hasApiKey } from '../services/config.service';

export const configRouter = Router();

configRouter.get('/key/status', (_req: Request, res: Response) => {
  res.json({ configured: hasApiKey() });
});

configRouter.post('/key', (req: Request, res: Response) => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'apiKey is required' } });
    return;
  }
  setApiKey(apiKey.trim());
  res.json({ configured: true });
});
