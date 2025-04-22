/**
 * Промежуточное ПО для кэширования ответов API
 */
import { Request, Response, NextFunction } from 'express';
import { cacheManager } from '../cache';

interface CacheMiddlewareOptions {
  ttl?: number; // время жизни кэша в секундах
  keyPrefix?: string; // префикс ключа кэша
  // Функция для получения ключа кэша на основе запроса
  getKey?: (req: Request) => string;
}

/**
 * Создает промежуточное ПО для кэширования ответов API
 * @param options Опции кэширования
 * @returns Middleware функция для Express
 */
export function cacheMiddleware(options: CacheMiddlewareOptions = {}) {
  const {
    ttl,
    keyPrefix = '', 
    getKey = req => `${req.method}:${req.originalUrl}`
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Пропускаем кэширование для методов, изменяющих данные
    if (req.method !== 'GET') {
      return next();
    }

    // Создаем уникальный ключ для запроса
    const cacheKey = `${keyPrefix}${getKey(req)}`;
    
    // Пытаемся получить данные из кэша
    const cachedData = cacheManager.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    // Если данных в кэше нет, перехватываем оригинальный метод res.json()
    const originalJson = res.json;
    res.json = function(body) {
      // Восстанавливаем оригинальный метод
      res.json = originalJson;
      
      // Кэшируем только успешные ответы
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheManager.set(cacheKey, body, { ttl });
      }
      
      // Вызываем оригинальный метод
      return originalJson.call(this, body);
    };

    next();
  };
}

/**
 * Промежуточное ПО для очистки кэша по префиксу
 * @param prefix Префикс ключей кэша для очистки
 * @returns Middleware функция для Express
 */
export function clearCacheMiddleware(prefix: string) {
  return (_req: Request, _res: Response, next: NextFunction) => {
    cacheManager.clear(prefix);
    next();
  };
}