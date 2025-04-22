/**
 * Утилиты для оптимизации запросов к базе данных
 */
import { sql, SQL } from 'drizzle-orm';
import { db, pool } from './db';
import { log } from './vite';
import { QueryResult } from '@neondatabase/serverless';

/**
 * Класс для оптимизации и мониторинга запросов к базе данных
 */
export class DBOptimizer {
  private longQueryThreshold: number = 500; // порог для логирования медленных запросов (мс)
  private queryStatistics: Map<string, { count: number, totalTime: number }> = new Map();
  private isMonitoringEnabled: boolean = false;

  /**
   * Включить мониторинг запросов к БД
   */
  enableQueryMonitoring(): void {
    if (this.isMonitoringEnabled) return;
    this.isMonitoringEnabled = true;
    
    // Очищаем статистику при включении мониторинга
    this.queryStatistics.clear();
    
    // Логируем включение мониторинга
    log('DB query monitoring enabled', 'db-optimizer');
  }
  
  /**
   * Отключить мониторинг запросов к БД
   */
  disableQueryMonitoring(): void {
    this.isMonitoringEnabled = false;
    log('DB query monitoring disabled', 'db-optimizer');
  }
  
  /**
   * Установить порог для логирования медленных запросов
   * @param threshold Порог в миллисекундах
   */
  setLongQueryThreshold(threshold: number): void {
    this.longQueryThreshold = threshold;
  }
  
  /**
   * Получить статистику по запросам
   * @returns Статистика по запросам
   */
  getQueryStatistics(): { query: string; count: number; avgTime: number }[] {
    const stats: { query: string; count: number; avgTime: number }[] = [];
    
    // Преобразуем Map в массив перед итерацией для поддержки старых версий JS
    const entries = Array.from(this.queryStatistics.entries());
    for (const [query, { count, totalTime }] of entries) {
      stats.push({
        query,
        count,
        avgTime: totalTime / count
      });
    }
    
    // Сортируем по среднему времени выполнения (по убыванию)
    return stats.sort((a, b) => b.avgTime - a.avgTime);
  }
  
  /**
   * Выполнить запрос с отслеживанием производительности
   * @param queryFn Функция, выполняющая запрос
   * @param queryName Название запроса для логирования
   * @returns Результат запроса
   */
  async executeQuery<T>(queryFn: () => Promise<T>, queryName: string): Promise<T> {
    const startTime = Date.now();
    try {
      return await queryFn();
    } finally {
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Логируем медленные запросы
      if (executionTime > this.longQueryThreshold) {
        log(`Slow query detected: ${queryName} (${executionTime}ms)`, 'db-optimizer');
      }
      
      // Обновляем статистику, если включен мониторинг
      if (this.isMonitoringEnabled) {
        const stats = this.queryStatistics.get(queryName) || { count: 0, totalTime: 0 };
        stats.count++;
        stats.totalTime += executionTime;
        this.queryStatistics.set(queryName, stats);
      }
    }
  }
  
  /**
   * Оптимизировать запрос с пагинацией
   * @param query SQL-запрос
   * @param page Номер страницы
   * @param limit Количество элементов на странице
   * @returns Оптимизированный SQL-запрос с LIMIT и OFFSET
   */
  paginateQuery(query: SQL, page: number = 1, limit: number = 10): SQL {
    const offset = (page - 1) * limit;
    return sql`${query} LIMIT ${limit} OFFSET ${offset}`;
  }
  
  /**
   * Подсчитать общее количество строк для запроса
   * @param query SQL-запрос без LIMIT и OFFSET
   * @returns Общее количество строк
   */
  async countRows(query: SQL): Promise<number> {
    const countQuery = sql`SELECT COUNT(*) as total FROM (${query}) as subquery`;
    const result = await db.execute(countQuery) as QueryResult<{total: string}>;
    
    // Безопасный доступ к результату запроса
    if (result && result.rows && result.rows.length > 0) {
      return parseInt(result.rows[0].total, 10);
    }
    return 0;
  }
  
  /**
   * Проверить текущее состояние соединений с базой данных
   * @returns Информация о пуле соединений
   */
  getPoolStatus(): {
    totalConnections: number;
    idleConnections: number;
    waitingClients: number;
  } {
    const poolStatus = pool as any;
    return {
      totalConnections: poolStatus.totalCount || 0,
      idleConnections: poolStatus.idleCount || 0,
      waitingClients: poolStatus.waitingCount || 0
    };
  }
  
  /**
   * Анализировать запрос для определения возможных оптимизаций
   * @param queryText SQL-запрос в текстовом формате
   * @returns Результаты анализа запроса
   */
  async analyzeQuery(queryText: string): Promise<{ plan: any }> {
    // Используем EXPLAIN ANALYZE для получения плана выполнения запроса
    const explainQuery = `EXPLAIN ANALYZE ${queryText}`;
    const result = await db.execute(sql.raw(explainQuery));
    return { plan: result };
  }
}

// Экспортируем singleton инстанс оптимизатора БД
export const dbOptimizer = new DBOptimizer();