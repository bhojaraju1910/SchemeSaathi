import mongoose from 'mongoose';

export type StorageMode = 'mongodb' | 'memory';

export class DatabaseUnavailableError extends Error {
  statusCode: number;
  constructor(message = 'Database service is unavailable.') {
    super(message);
    this.name = 'DatabaseUnavailableError';
    this.statusCode = 503;
  }
}

interface MongooseGlobalCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  storageMode: StorageMode;
  loggedMemoryMode: boolean;
}

const globalForMongoose = globalThis as unknown as {
  __ssMongooseCache?: MongooseGlobalCache;
};

const cache: MongooseGlobalCache =
  globalForMongoose.__ssMongooseCache ||
  (globalForMongoose.__ssMongooseCache = {
    conn: null,
    promise: null,
    storageMode: 'memory',
    loggedMemoryMode: false,
  });

export function getStorageMode(): StorageMode {
  if (mongoose.connection.readyState === 1) {
    return 'mongodb';
  }
  return cache.storageMode;
}

export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/**
 * Connects to MongoDB Atlas with serverless connection caching across invocations.
 * - Never seeds on startup or on request (seeding runs ONLY via `npm run seed`).
 * - In production (NODE_ENV=production), missing or failing MONGODB_URI throws HTTP 503.
 * - Local in-memory store is allowed ONLY when NODE_ENV !== 'production' and MONGODB_URI is empty.
 */
export async function connectDB(): Promise<void> {
  const uri = (process.env.MONGODB_URI || '').trim();
  const isProd = process.env.NODE_ENV === 'production';

  if (!uri) {
    if (isProd) {
      cache.storageMode = 'memory';
      throw new DatabaseUnavailableError(
        'Database service unavailable: MONGODB_URI is not configured.'
      );
    }
    cache.storageMode = 'memory';
    if (!cache.loggedMemoryMode) {
      cache.loggedMemoryMode = true;
      console.log(
        '[SchemeSaathi] MONGODB_URI is empty in development; using local memory datastore (never used in production).'
      );
    }
    return;
  }

  if (mongoose.connection.readyState === 1 && cache.conn) {
    cache.storageMode = 'mongodb';
    return;
  }

  if (!cache.promise) {
    console.log(
      '[SchemeSaathi] Connecting to MongoDB at:',
      uri.replace(/:([^:@]{3,})@/, ':****@')
    );
    cache.promise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10,
      })
      .then((conn) => {
        console.log('[SchemeSaathi] MongoDB Connected successfully.');
        return conn;
      });
  }

  try {
    cache.conn = await cache.promise;
    cache.storageMode = 'mongodb';
  } catch (err: any) {
    cache.promise = null;
    cache.conn = null;
    cache.storageMode = 'memory';
    console.error('[SchemeSaathi] MongoDB connection failed:', err?.message || err);
    throw new DatabaseUnavailableError(
      'Unable to connect to database right now. Please try again shortly.'
    );
  }
}
