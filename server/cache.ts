/**
 * Модуль кэширования для повышения производительности API
 */
import { log } from './vite';

interface CacheItem<T> {
  data: T;
  expiry: number; // Время истечения кэша в миллисекундах
}

interface CacheOptions {
  ttl: number; // Время жизни кэша в секундах
}

class CacheManager {
  private cache: Map<string, CacheItem<any>> = new Map();
  private defaultTTL: number = 60; // 60 секунд по умолчанию

  /**
   * Получить элемент из кэша
   * @param key Ключ кэша
   * @returns Данные из кэша или undefined, если кэш отсутствует или истек
   */
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) {
      log(`Cache miss: ${key}`, 'cache');
      return undefined;
    }

    // Проверяем, не истек ли кэш
    if (Date.now() > item.expiry) {
      log(`Cache expired: ${key}`, 'cache');
      this.cache.delete(key);
      return undefined;
    }

    log(`Cache hit: ${key}`, 'cache');
    return item.data as T;
  }

  /**
   * Сохранить элемент в кэше
   * @param key Ключ кэша
   * @param data Данные для кэширования
   * @param options Опции кэширования
   */
  set<T>(key: string, data: T, options?: CacheOptions): void {
    const ttl = options?.ttl ?? this.defaultTTL;
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl * 1000
    });
    log(`Cache set: ${key}, TTL: ${ttl}s`, 'cache');
  }

  /**
   * Удалить элемент из кэша
   * @param key Ключ кэша
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Очистить весь кэш или по префиксу
   * @param prefix Опциональный префикс для выборочной очистки
   */
  clear(prefix?: string): void {
    if (!prefix) {
      log(`Clearing all cache`, 'cache');
      this.cache.clear();
      return;
    }

    // Удаляем только ключи с указанным префиксом
    // Копируем ключи в массив перед итерацией для избежания ошибок в более старых версиях JS
    const keys = Array.from(this.cache.keys());
    let cleared = 0;
    for (const key of keys) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        cleared++;
      }
    }
    log(`Cleared ${cleared} cache entries with prefix: ${prefix}`, 'cache');
  }

  /**
   * Получить данные из кэша или выполнить функцию, если кэш отсутствует
   * @param key Ключ кэша
   * @param fn Функция для получения данных
   * @param options Опции кэширования
   * @returns Данные из кэша или результат выполнения функции
   */
  async getOrSet<T>(key: string, fn: () => Promise<T>, options?: CacheOptions): Promise<T> {
    const cachedData = this.get<T>(key);
    if (cachedData !== undefined) {
      return cachedData;
    }

    const data = await fn();
    this.set(key, data, options);
    return data;
  }

  /**
   * Установить время жизни кэша по умолчанию
   * @param seconds Время жизни в секундах
   */
  setDefaultTTL(seconds: number): void {
    this.defaultTTL = seconds;
  }
}

// Экспортируем singleton инстанс кэш-менеджера
export const cacheManager = new CacheManager();