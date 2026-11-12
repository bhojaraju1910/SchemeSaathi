import { initSeedData } from '../src/models/index';
import { connectDB } from '../src/config/db';

async function runSeed() {
  console.log('[SchemeSaathi] Starting database seed...');
  await connectDB();
  console.log('[SchemeSaathi] Database seeded successfully!');
  console.log('--------------------------------------------------');
  console.log('Demo Accounts Created:');
  console.log('1. Admin: admin@schemesaathi.test / Admin@123');
  console.log('2. Demo User: demo@schemesaathi.test / Demo@123');
  console.log('   (Profile: Age 62, Karnataka, Low Income, Senior Citizen)');
  console.log('--------------------------------------------------');
  process.exit(0);
}

runSeed().catch((err) => {
  console.error('[SchemeSaathi Seed Error]', err);
  process.exit(1);
});
