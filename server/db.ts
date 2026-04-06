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

export const hasDatabaseConnectionString = Boolean(connectionString);

if (!hasDatabaseConnectionString) {
  console.warn(
    "[db] Database connection string is missing. Falling back to in-memory storage. Set one of: DATABASE_URL, SUPABASE_DB_URL, POSTGRES_URL, POSTGRES_PRISMA_URL, or POSTGRESQL_URL.",
  );
}

export const pool = connectionString ? new Pool({ connectionString }) : null;
export const db = pool ? drizzle(pool, { schema }) : null;
