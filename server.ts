import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { createApp, ensureDBReady } from './server/src/app';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = createApp();
const PORT = process.env.PORT || 3000;

async function startServer() {
  await ensureDBReady();

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
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
