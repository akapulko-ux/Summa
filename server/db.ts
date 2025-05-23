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
  min: 2, // Минимум 2 активных соединения
  idle: 10000, // 10 секунд для idle соединений
  acquire: 60000, // 60 секунд таймаут на получение соединения
  createTimeoutMillis: 8000, // 8 секунд на создание соединения
  destroyTimeoutMillis: 5000, // 5 секунд на закрытие соединения
  reapIntervalMillis: 1000, // Проверка каждую секунду
  createRetryIntervalMillis: 100, // Повтор создания через 100мс
});

export const db = drizzle(pool, { schema });
