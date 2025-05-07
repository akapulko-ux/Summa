/**
 * Утилиты для оптимизации запросов к базе данных
 */
import { sql, SQL } from 'drizzle-orm';
import { db, pool } from './db';
import { log } from './vite';
import { QueryResult } from '@neondatabase/serverless';
import { cacheManager } from './cache';

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
   * Получить текущий статус мониторинга
   * @returns статус мониторинга (включен/выключен)
   */
  getMonitoringStatus(): boolean {
    return this.isMonitoringEnabled;
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
    let result: T;
    
    try {
      result = await queryFn();
    } catch (error) {
      log(`Error in query ${queryName}: ${(error as Error).message}`, 'db-optimizer');
      throw error;
    } finally {
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Логируем все запросы для отладки
      log(`Query executed: ${queryName} (${executionTime}ms)`, 'db-optimizer');
      
      // Логируем медленные запросы отдельно
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
    
    return result!;
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
    // Для Neondatabase используется другая структура пула
    try {
      const poolStatus = pool as any;
      return {
        totalConnections: poolStatus.options?.max || poolStatus._clients?.length || 0,
        idleConnections: poolStatus._clients?.filter((c: any) => !c._connected)?.length || 0,
        waitingClients: poolStatus._queue?.size || 0
      };
    } catch (error) {
      log(`Error getting pool status: ${(error as Error).message}`, 'db-optimizer');
      return {
        totalConnections: 0,
        idleConnections: 0,
        waitingClients: 0
      };
    }
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
  
  /**
   * Выполнить запрос с кэшированием результатов
   * @param queryFn Функция, выполняющая запрос
   * @param cacheKey Ключ для кэширования результатов
   * @param ttl Время жизни кэша в секундах
   * @param queryName Название запроса для логирования
   * @returns Результат запроса (из кэша или прямого выполнения)
   */
  async executeQueryWithCache<T>(
    queryFn: () => Promise<T>, 
    cacheKey: string, 
    ttl: number = 60,
    queryName: string = "cachedQuery"
  ): Promise<T> {
    // Проверяем, есть ли результат в кэше
    const cachedResult = cacheManager.get<T>(cacheKey);
    if (cachedResult !== undefined) {
      log(`Cache hit for query ${queryName}: ${cacheKey}`, 'db-optimizer');
      return cachedResult;
    }
    
    // Если нет в кэше, выполняем запрос с мониторингом
    const result = await this.executeQuery(queryFn, queryName);
    
    // Сохраняем результат в кэш
    cacheManager.set(cacheKey, result, { ttl });
    log(`Cached result for query ${queryName}: ${cacheKey}, TTL: ${ttl}s`, 'db-optimizer');
    
    return result;
  }
}

// Экспортируем singleton инстанс оптимизатора БД
export const dbOptimizer = new DBOptimizer();