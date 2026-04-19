import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: '.env.local' });

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

async function main() {
  const sql = postgres(url!, { max: 1 });
  const [venues] = await sql`SELECT count(*)::int AS n FROM venues`;
  const [members] = await sql`SELECT count(*)::int AS n FROM venue_members`;
  const [courts] = await sql`SELECT count(*)::int AS n FROM courts`;
  const [bookings] = await sql`SELECT count(*)::int AS n FROM bookings`;
  console.log({
    venues: venues.n,
    venue_members: members.n,
    courts: courts.n,
    bookings: bookings.n,
  });
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
