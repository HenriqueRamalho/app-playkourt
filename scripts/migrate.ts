import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

config({ path: '.env.local' });

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

async function main() {
  const client = postgres(url!, { max: 1 });
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: './drizzle/migrations' });
  await client.end();
  console.log('✅ migrations applied');
}

main().catch((e) => {
  console.error('❌ migrate failed:', e);
  process.exit(1);
});
