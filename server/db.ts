import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Оптимизированные настройки connection pool
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20, // Максимум 20 соединений
  idleTimeoutMillis: 10000, // 10 секунд для idle соединений
  connectionTimeoutMillis: 8000, // 8 секунд на создание соединения
});

export const db = drizzle(pool, { schema });
