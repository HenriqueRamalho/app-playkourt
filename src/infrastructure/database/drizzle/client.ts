import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

type DrizzleClient = PostgresJsDatabase<typeof schema>;

// Cache global para evitar múltiplas pools durante HMR em desenvolvimento.
// Em produção, cada processo terá sua própria conexão.
const globalForDrizzle = globalThis as unknown as {
  __drizzleClient?: DrizzleClient;
  __drizzleSql?: ReturnType<typeof postgres>;
};

function createClient(): DrizzleClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL não configurado. Adicione a connection string do Postgres no .env.local.');
  }

  // `prepare: false` evita overhead de prepared statements em workloads com
  // queries variadas e é compatível com poolers em modo transaction.
  const sql = postgres(connectionString, { prepare: false });
  globalForDrizzle.__drizzleSql = sql;
  return drizzle(sql, { schema });
}

export function getDb(): DrizzleClient {
  if (!globalForDrizzle.__drizzleClient) {
    globalForDrizzle.__drizzleClient = createClient();
  }
  return globalForDrizzle.__drizzleClient;
}
