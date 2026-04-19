import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: '.env.local' });

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

async function main() {
  const sql = postgres(url!, { max: 1 });
  await sql`TRUNCATE TABLE venues RESTART IDENTITY CASCADE`;
  console.log('✅ cleared venues + cascading tables (venue_members, courts, bookings, schedules)');
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
