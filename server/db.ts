import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ??
  process.env.SUPABASE_DB_URL ??
  process.env.POSTGRES_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRESQL_URL;

if (!connectionString) {
  throw new Error(
    "Database connection string is missing. Set one of: DATABASE_URL, SUPABASE_DB_URL, POSTGRES_URL, POSTGRES_PRISMA_URL, or POSTGRESQL_URL.",
  );
}

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });
