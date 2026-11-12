import mongoose from 'mongoose';
import { initSeedData } from '../models/index';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (uri && uri.trim() !== '') {
    try {
      console.log('[SchemeSaathi] Connecting to MongoDB at:', uri.replace(/:([^:@]{3,})@/, ':****@'));
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
      console.log('[SchemeSaathi] MongoDB Connected successfully.');
    } catch (err: any) {
      console.warn('[SchemeSaathi] Warning: MongoDB connection failed:', err.message);
      console.log('[SchemeSaathi] Operating with built-in high performance in-memory datastore.');
    }
  } else {
    console.log('[SchemeSaathi] MONGODB_URI not specified. Using in-memory SchemeSaathi datastore.');
  }

  // Always initialize seed data
  await initSeedData();
}
