import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { connectDB, getStorageMode, isMongoConnected } from './config/db';
import {
  SchemeModel,
  SchemeMongoModel,
  UserMongoModel,
  upsertSeedData,
} from './models/index';
import { invalidateSchemeCache } from './services/schemeCache';
import authRouter from './routes/auth';
import profileRouter from './routes/profile';
import schemesRouter from './routes/schemes';
import userActionsRouter from './routes/userActions';
import adminRouter from './routes/admin';
import suggestionsRouter from './routes/suggestions';
import { errorHandler } from './middleware/errorHandler';
import { rateLimitKeyGenerator } from './utils/rateLimitKey';

dotenv.config();

let dbReadyPromise: Promise<void> | null = null;
let bootstrapSeedPromise: Promise<void> | null = null;

async function bootstrapMongoIfEmpty(): Promise<void> {
  if (!isMongoConnected()) return;
  const [schemeCount, userCount] = await Promise.all([
    SchemeMongoModel.estimatedDocumentCount(),
    UserMongoModel.estimatedDocumentCount(),
  ]);
  if (schemeCount === 0 && userCount === 0) {
    console.log(
      '[SchemeSaathi] Connected MongoDB is empty; seeding initial schemes, rules, and accounts...'
    );
    const summary = await upsertSeedData();
    invalidateSchemeCache();
    console.log(
      `[SchemeSaathi] MongoDB initial seed complete: ${summary.schemesUpserted} schemes, ${summary.criteriaUpserted} criteria, ${summary.demoAccountsInserted} accounts.`
    );
  }
}

export function ensureDBReady(): Promise<void> {
  if (!dbReadyPromise) {
    dbReadyPromise = connectDB()
      .then(async () => {
        if (isMongoConnected() && !bootstrapSeedPromise) {
          bootstrapSeedPromise = bootstrapMongoIfEmpty().catch((err) => {
            bootstrapSeedPromise = null;
            console.error('[SchemeSaathi] MongoDB auto-bootstrap seed failed:', err?.message || err);
          });
        }
        if (bootstrapSeedPromise) {
          await bootstrapSeedPromise;
        }
      })
      .catch((err) => {
        dbReadyPromise = null;
        throw err;
      });
  }
  return dbReadyPromise;
}

export function createApp() {
  const app = express();

  // Trust immediate reverse proxy hop (e.g., Cloud Run / Vercel) for accurate req.ip
  app.set('trust proxy', 1);

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

  // Ensure DB connection is ready on serverless cold starts
  app.use('/api', async (_req, _res, next) => {
    try {
      await ensureDBReady();
      next();
    } catch (err) {
      next(err);
    }
  });

  // Health & storage verification endpoint
  app.get('/api/health', async (_req, res, next) => {
    try {
      const storageMode = getStorageMode();
      const [schemeCount, verifiedCount] = await Promise.all([
        SchemeModel.countDocuments(),
        SchemeModel.countVerified(),
      ]);
      res.status(200).json({
        storageMode,
        schemeCount,
        verifiedCount,
        uptime: Math.round(process.uptime()),
      });
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
    keyGenerator: rateLimitKeyGenerator,
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
