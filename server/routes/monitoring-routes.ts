/**
 * Маршруты для мониторинга и управления производительностью
 */
import { Express, Request, Response } from 'express';
import { cacheManager } from '../cache';
import { dbOptimizer } from '../db-optimizer';
import { scalingManager } from '../scaling';

/**
 * Проверка роли администратора
 */
function isAdmin(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  next();
}

/**
 * Настройка маршрутов для мониторинга и управления производительностью
 * @param app Express приложение
 */
export function setupMonitoringRoutes(app: Express) {
  // Маршруты мониторинга системы (только для админов)
  app.get('/api/monitoring/system', isAdmin, (req: Request, res: Response) => {
    const systemInfo = scalingManager.getSystemInfo();
    res.json(systemInfo);
  });
  
  // Управление кэшем
  app.get('/api/monitoring/cache/stats', isAdmin, (req: Request, res: Response) => {
    // Получение базовой статистики кэша можно добавить в CacheManager
    res.json({ message: "Cache statistics endpoint" });
  });
  
  app.post('/api/monitoring/cache/clear', isAdmin, (req: Request, res: Response) => {
    const { prefix } = req.body;
    
    if (prefix) {
      cacheManager.clear(prefix);
      res.json({ message: `Cache cleared for prefix: ${prefix}` });
    } else {
      cacheManager.clear();
      res.json({ message: 'All cache cleared' });
    }
  });
  
  // Мониторинг БД
  // Эндпоинт для получения статуса мониторинга
  app.get('/api/monitoring/db/status', isAdmin, (req: Request, res: Response) => {
    const isEnabled = dbOptimizer.getMonitoringStatus();
    res.json({ enabled: isEnabled });
  });
  
  app.get('/api/monitoring/db/stats', isAdmin, (req: Request, res: Response) => {
    const poolStatus = dbOptimizer.getPoolStatus();
    const queryStats = dbOptimizer.getQueryStatistics();
    
    // Рассчитываем метрики эффективности кэширования
    const totalQueries = queryStats.reduce((acc, stat) => acc + stat.count, 0);
    const totalTime = queryStats.reduce((acc, stat) => acc + (stat.avgTime * stat.count), 0);
    const avgResponseTime = totalQueries > 0 ? totalTime / totalQueries : 0;
    
    // Оцениваем соотношение запросов, которые потенциально обрабатываются из кэша
    // (если запрос выполнялся больше 1 раза, то последующие обращения могли идти из кэша)
    const cachedQueriesCount = queryStats.filter(s => s.count > 1).length;
    const cacheUsageRatio = queryStats.length > 0 ? cachedQueriesCount / queryStats.length : 0;
    
    res.json({
      poolStatus,
      queryStats,
      performanceMetrics: {
        totalQueries,
        avgResponseTime: Math.round(avgResponseTime * 100) / 100,
        cacheUsageRatio: Math.round(cacheUsageRatio * 100) / 100,
        potentialCacheHits: totalQueries - queryStats.length
      }
    });
  });
  
  app.post('/api/monitoring/db/analyze', isAdmin, async (req: Request, res: Response) => {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ message: 'Query is required' });
    }
    
    try {
      const analysis = await dbOptimizer.analyzeQuery(query);
      res.json(analysis);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post('/api/monitoring/db/monitoring', isAdmin, async (req: Request, res: Response) => {
    const { enabled } = req.body;
    
    try {
      if (enabled) {
        await dbOptimizer.enableQueryMonitoring();
        res.json({ message: 'DB query monitoring enabled' });
      } else {
        await dbOptimizer.disableQueryMonitoring();
        res.json({ message: 'DB query monitoring disabled' });
      }
    } catch (error) {
      res.status(500).json({ message: `Failed to update monitoring status: ${(error as Error).message}` });
    }
  });
  
  // Масштабирование
  app.post('/api/monitoring/scaling/cluster', isAdmin, (req: Request, res: Response) => {
    const { enabled, workers } = req.body;
    
    if (enabled) {
      const result = scalingManager.enableClusterMode(workers);
      res.json({ 
        message: result ? 'Cluster mode enabled' : 'Cluster mode configuration saved but not applied', 
        applied: result
      });
    } else {
      scalingManager.disableClusterMode();
      res.json({ message: 'Cluster mode disabled' });
    }
  });
}