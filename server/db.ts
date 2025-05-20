import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Настраиваем преобразование имён полей из snake_case в базе в camelCase в коде
export const db = drizzle(pool, { 
  schema,
  logger: {
    logQuery: (query, params) => {
      console.log('Query:', query);
      console.log('Params:', params);
    }
  }
});
