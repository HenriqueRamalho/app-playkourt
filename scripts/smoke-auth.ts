import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: '.env.local' });

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

async function main() {
  const sql = postgres(url!, { max: 1 });

  const tables = await sql<{ table_name: string }[]>`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('user', 'session', 'account', 'verification')
    ORDER BY table_name
  `;
  console.log('auth tables:', tables.map((t) => t.table_name));
  if (tables.length !== 4) {
    throw new Error(`expected 4 auth tables, found ${tables.length}`);
  }

  const fks = await sql<{ constraint_name: string; table_name: string }[]>`
    SELECT conname AS constraint_name, conrelid::regclass::text AS table_name
    FROM pg_constraint
    WHERE contype = 'f'
      AND conname IN (
        'venues_owner_id_user_id_fk',
        'venue_members_user_id_user_id_fk',
        'session_user_id_user_id_fk',
        'account_user_id_user_id_fk'
      )
    ORDER BY constraint_name
  `;
  console.log('fk constraints:', fks);
  if (fks.length !== 4) throw new Error(`expected 4 FKs, found ${fks.length}`);

  await sql.end();
  console.log('✅ schema smoke ok');
}

main().catch((e) => {
  console.error('❌', e);
  process.exit(1);
});
