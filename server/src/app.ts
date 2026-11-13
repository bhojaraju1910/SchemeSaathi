import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { connectDB } from './config/db';
import authRouter from './routes/auth';
import profileRouter from './routes/profile';
import schemesRouter from './routes/schemes';
import userActionsRouter from './routes/userActions';
import adminRouter from './routes/admin';
import suggestionsRouter from './routes/suggestions';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

let dbReadyPromise: Promise<void> | null = null;

export function ensureDBReady(): Promise<void> {
  if (!dbReadyPromise) {
    dbReadyPromise = connectDB().catch((err) => {
      dbReadyPromise = null;
      throw err;
    });
  }
  return dbReadyPromise;
}

export function createApp() {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(
    cors({
      origin: process.env.CLIENT_URL || true,
      credentials: true,
    })
  );

  app.use(morgan('dev'));
  app.use(express.json());

  // Ensure DB and seed data are ready on serverless cold starts
  app.use('/api', async (_req, _res, next) => {
    try {
      await ensureDBReady();
      next();
    } catch (err) {
      next(err);
    }
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { message: 'Too many requests from this IP, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api/auth', authLimiter);

  app.use('/api/auth', authRouter);
  app.use('/api/profile', profileRouter);
  app.use('/api/schemes', schemesRouter);
  app.use('/api/suggestions', suggestionsRouter);
  app.use('/api', userActionsRouter);
  app.use('/api/admin', adminRouter);

  app.use(errorHandler);

  return app;
}
