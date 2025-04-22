/**
 * Компонент для поддержки масштабирования приложения
 */
import os from 'os';
import cluster from 'cluster';
import { log } from './vite';

/**
 * Класс для обеспечения масштабирования приложения
 */
export class ScalingManager {
  private clusterEnabled: boolean = false;
  private numWorkers: number = 0;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  
  /**
   * Получить количество воркеров на основе количества ядер CPU
   * @param percentage Процент ядер для использования (0-100%)
   * @returns Количество воркеров
   */
  getOptimalWorkerCount(percentage: number = 75): number {
    const cpuCount = os.cpus().length;
    return Math.max(1, Math.floor(cpuCount * percentage / 100));
  }
  
  /**
   * Включить кластерный режим для масштабирования
   * @param workerCount Количество воркеров (по умолчанию: оптимальное количество)
   * @returns true, если кластер запущен успешно
   */
  enableClusterMode(workerCount?: number): boolean {
    // Если уже включен кластерный режим, ничего не делаем
    if (this.clusterEnabled) return true;
    
    // В режиме разработки или при одном воркере не включаем кластер
    const workers = workerCount || this.getOptimalWorkerCount();
    if (workers <= 1 || process.env.NODE_ENV === 'development') {
      log('Skipping cluster mode in development or with single worker', 'scaling');
      return false;
    }
    
    // Настраиваем кластер только на мастер-процессе
    if (cluster.isPrimary) {
      log(`Starting cluster with ${workers} workers`, 'scaling');
      this.numWorkers = workers;
      
      // Запускаем воркеры
      for (let i = 0; i < workers; i++) {
        cluster.fork();
      }
      
      // Обрабатываем выход воркеров
      cluster.on('exit', (worker, code, signal) => {
        log(`Worker ${worker.id} died with code ${code} and signal ${signal}`, 'scaling');
        
        // Перезапускаем упавший воркер
        log('Starting a new worker', 'scaling');
        cluster.fork();
      });
      
      // Настраиваем проверку здоровья кластера
      this.setupHealthCheck();
      
      this.clusterEnabled = true;
      return true;
    }
    
    return false;
  }
  
  /**
   * Настройка периодической проверки здоровья кластера
   */
  private setupHealthCheck(): void {
    // Останавливаем предыдущий интервал, если он был
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    // Запускаем новый интервал проверки
    this.healthCheckInterval = setInterval(() => {
      const memoryUsage = process.memoryUsage();
      
      log('Cluster health check:', 'scaling');
      log(`Active workers: ${Object.keys(cluster.workers || {}).length}/${this.numWorkers}`, 'scaling');
      log(`Memory usage: RSS ${Math.round(memoryUsage.rss / 1024 / 1024)} MB, Heap ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}/${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`, 'scaling');
      
      // Проверяем, что все воркеры активны
      const workers = cluster.workers || {};
      if (Object.keys(workers).length < this.numWorkers) {
        log('Some workers are missing, restarting them', 'scaling');
        
        // Запускаем недостающие воркеры
        const missingCount = this.numWorkers - Object.keys(workers).length;
        for (let i = 0; i < missingCount; i++) {
          cluster.fork();
        }
      }
    }, 30000); // Проверка каждые 30 секунд
  }
  
  /**
   * Отключить кластерный режим
   */
  disableClusterMode(): void {
    if (!this.clusterEnabled) return;
    
    // Останавливаем проверку здоровья
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    // Завершаем все воркеры, если это мастер-процесс
    if (cluster.isPrimary) {
      log('Shutting down cluster', 'scaling');
      
      for (const id in cluster.workers) {
        const worker = cluster.workers[id];
        if (worker) {
          worker.kill();
        }
      }
    }
    
    this.clusterEnabled = false;
    this.numWorkers = 0;
  }
  
  /**
   * Получить информацию о системе для диагностики масштабирования
   * @returns Информация о системе
   */
  getSystemInfo(): {
    cpuCount: number;
    cpuUsage: NodeJS.CpuUsage;
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
    platform: string;
    clusterEnabled: boolean;
    workers: number;
  } {
    return {
      cpuCount: os.cpus().length,
      cpuUsage: process.cpuUsage(),
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      platform: process.platform,
      clusterEnabled: this.clusterEnabled,
      workers: this.numWorkers
    };
  }
  
  /**
   * Проверить, является ли текущий процесс главным (primary)
   * @returns true, если процесс является главным
   */
  isPrimary(): boolean {
    return cluster.isPrimary;
  }
  
  /**
   * Проверить, является ли текущий процесс рабочим (worker)
   * @returns true, если процесс является рабочим
   */
  isWorker(): boolean {
    return cluster.isWorker;
  }
}

// Экспортируем singleton инстанс менеджера масштабирования
export const scalingManager = new ScalingManager();