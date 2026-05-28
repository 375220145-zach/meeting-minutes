import express from 'express';
import cors from 'cors';
import { config } from './config';
import { aiRouter } from './routes/ai.routes';
import { healthRouter } from './routes/health.routes';
import { configRouter } from './routes/config.routes';
import { errorMiddleware } from './middleware/error.middleware';
import { hasApiKey } from './services/config.service';

const app = express();

const corsOrigins = config.corsOrigin.split(',').map((s) => s.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, mobile apps)
    if (!origin) return callback(null, true);
    if (corsOrigins.includes(origin) || corsOrigins.includes('*')) {
      return callback(null, true);
    }
    callback(null, true); // permissive for now, tighten later
  },
}));
app.use(express.json({ limit: '5mb' }));

app.use('/api/health', healthRouter);
app.use('/api/ai', aiRouter);
app.use('/api/config', configRouter);

app.use(errorMiddleware);

app.listen(config.port, '0.0.0.0', () => {
  console.log(`[AI Execution Pocket] Backend running on port ${config.port}`);
  console.log(`[AI Execution Pocket] Mode: ${config.isCloud ? 'cloud' : 'local'}`);
  if (!hasApiKey()) {
    console.warn('[WARNING] DEEPSEEK_API_KEY not configured. Set via Settings page or env var.');
  }
});
