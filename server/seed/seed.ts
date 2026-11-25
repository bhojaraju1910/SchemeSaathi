import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.ts';
import { upsertSeedData } from '../src/models/index.ts';

dotenv.config();

async function runSeed() {
  if (!process.env.MONGODB_URI || !process.env.MONGODB_URI.trim()) {
    console.error('[SchemeSaathi Seed Error] MONGODB_URI must be set before running npm run seed.');
    process.exit(1);
  }

  console.log('[SchemeSaathi] Connecting to MongoDB for idempotent seed...');
  await connectDB();

  const summary = await upsertSeedData();
  console.log(
    `[SchemeSaathi] Seed complete! Upserted ${summary.schemesUpserted} schemes, ${summary.criteriaUpserted} criteria rulesets, and ${summary.demoAccountsInserted} new demo accounts.`
  );
  console.log('--------------------------------------------------');
  console.log('Demo Accounts (created if missing; existing user data untouched):');
  console.log('1. Admin: admin@schemesaathi.test / Admin@123');
  console.log('2. Demo User: demo@schemesaathi.test / Demo@123');
  console.log('--------------------------------------------------');

  await mongoose.disconnect();
  process.exit(0);
}

runSeed().catch((err) => {
  console.error('[SchemeSaathi Seed Error]', err);
  process.exit(1);
});
