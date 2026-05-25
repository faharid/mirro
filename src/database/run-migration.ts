import { Client } from 'pg';
import { migration001 } from './migrations/001-initial';

async function run() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5433/ai_agents';

  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query(migration001);
    console.log('Migration 001 completed successfully.');
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
