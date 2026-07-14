import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { authRoutes } from './routes/authRoutes.js';
import { profileRoutes } from './routes/profileRoutes.js';
import { mealPlanRoutes } from './routes/mealPlanRoutes.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 60_000, limit: 120 }));

app.get('/health', (_req, res) => res.json({ ok: true, service: 'tenafit-api' }));
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/meal-plans', mealPlanRoutes);

app.use((error, _req, res, _next) => {
  const status = error.statusCode ?? (error.message === 'Profile not found' ? 404 : 500);
  if (env.nodeEnv !== 'production') console.error(error);
  res.status(status).json({ error: status === 500 ? 'Internal server error' : error.message });
});

app.listen(env.port, () => {
  console.log(`TenaFit API listening on :${env.port}`);
});
