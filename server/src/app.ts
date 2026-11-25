import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { connectDB, getStorageMode, isMongoConnected } from './config/db.ts';
import {
  SchemeModel,
  SchemeMongoModel,
  UserMongoModel,
  upsertSeedData,
} from './models/index.ts';
import { invalidateSchemeCache } from './services/schemeCache.ts';
import authRouter from './routes/auth.ts';
import profileRouter from './routes/profile.ts';
import schemesRouter from './routes/schemes.ts';
import userActionsRouter from './routes/userActions.ts';
import adminRouter from './routes/admin.ts';
import suggestionsRouter from './routes/suggestions.ts';
import { errorHandler } from './middleware/errorHandler.ts';
import { rateLimitKeyGenerator } from './utils/rateLimitKey.ts';

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

  const configuredOrigins = new Set(
    [
      process.env.CLIENT_URL,
      process.env.APP_URL,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ]
      .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
      .map((v) => v.trim().replace(/\/+$/, ''))
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }
        const cleanOrigin = origin.trim().replace(/\/+$/, '');
        if (
          configuredOrigins.has(cleanOrigin) ||
          /^https:\/\/ais-(dev|pre)-[a-z0-9-]+\.[a-z0-9-]+\.run\.app$/i.test(cleanOrigin) ||
          /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(cleanOrigin)
        ) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
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
