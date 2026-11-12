import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { connectDB } from './server/src/config/db';
import authRouter from './server/src/routes/auth';
import profileRouter from './server/src/routes/profile';
import schemesRouter from './server/src/routes/schemes';
import userActionsRouter from './server/src/routes/userActions';
import adminRouter from './server/src/routes/admin';
import { errorHandler } from './server/src/middleware/errorHandler';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Security and utility middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Vite inline scripts and external fonts
    crossOriginEmbedderPolicy: false,
  })
);

app.use(cors({
  origin: process.env.CLIENT_URL || true,
  credentials: true,
}));

app.use(morgan('dev'));
app.use(express.json());

// Rate limit for authentication routes to prevent brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // generous for review & automated tests
  message: { message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter);

// Mount API routes
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/schemes', schemesRouter);
app.use('/api', userActionsRouter);
app.use('/api/admin', adminRouter);

// Central error handler for API
app.use(errorHandler);

async function startServer() {
  // Connect to DB and seed initial data
  await connectDB();

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Mount Vite middleware in development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static build in production
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`SchemeSaathi MERN Server running on port ${PORT}`);
    console.log(`Local Access: http://localhost:${PORT}`);
    console.log(`Ready for college review & user evaluation`);
    console.log(`=================================================`);
  });
}

startServer().catch((err) => {
  console.error('[SchemeSaathi Boot Error]', err);
  process.exit(1);
});
