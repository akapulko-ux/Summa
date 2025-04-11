import { pool } from "../db";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { exec } from "child_process";
import { log } from "../vite";

const execAsync = promisify(exec);

// Директория для хранения резервных копий
const BACKUP_DIR = path.join(process.cwd(), "backups");

// Создаем директорию, если она не существует
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Интерфейс для класса управления резервными копиями
 */
export interface IBackupManager {
  // Создать резервную копию базы данных
  createBackup(manual?: boolean): Promise<string>;
  
  // Восстановить базу данных из резервной копии
  restoreFromBackup(backupFileName: string): Promise<boolean>;
  
  // Получить список всех резервных копий
  listBackups(): Promise<{ name: string; size: number; date: Date }[]>;
  
  // Настроить автоматическое резервное копирование
  setupScheduledBackup(intervalHours: number): void;
  
  // Удалить резервную копию
  deleteBackup(backupFileName: string): Promise<boolean>;
  
  // Очистить старые резервные копии (оставить только N последних)
  cleanOldBackups(keepCount: number): Promise<string[]>;
}

/**
 * Класс для управления резервными копиями PostgreSQL базы данных
 */
export class PostgresBackupManager implements IBackupManager {
  private scheduledJob: NodeJS.Timeout | null = null;
  
  constructor() {
    // Используем переменные окружения для подключения к базе данных
    if (!process.env.PGDATABASE || !process.env.PGUSER || !process.env.PGHOST || !process.env.PGPORT) {
      throw new Error("Missing PostgreSQL environment variables required for backup");
    }
  }

  /**
   * Создает резервную копию базы данных
   * @param manual Флаг ручного создания резервной копии
   * @returns Имя файла резервной копии
   */
  async createBackup(manual: boolean = false): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const prefix = manual ? "manual" : "auto";
      const backupFileName = `${prefix}-backup-${timestamp}.sql`;
      const backupPath = path.join(BACKUP_DIR, backupFileName);
      
      const { PGDATABASE, PGUSER, PGHOST, PGPASSWORD, PGPORT } = process.env;
      
      // Формируем команду pg_dump с переменными окружения
      const cmd = `PGPASSWORD=${PGPASSWORD} pg_dump -h ${PGHOST} -p ${PGPORT} -U ${PGUSER} -d ${PGDATABASE} -F p > ${backupPath}`;
      
      log(`Creating database backup: ${backupFileName}`, "backup");
      await execAsync(cmd);
      log(`Backup created successfully: ${backupFileName}`, "backup");
      
      return backupFileName;
    } catch (error) {
      log(`Backup creation failed: ${error}`, "backup");
      throw new Error(`Failed to create backup: ${error}`);
    }
  }

  /**
   * Восстанавливает базу данных из резервной копии
   * @param backupFileName Имя файла резервной копии
   * @returns Результат операции
   */
  async restoreFromBackup(backupFileName: string): Promise<boolean> {
    try {
      const backupPath = path.join(BACKUP_DIR, backupFileName);
      
      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup file not found: ${backupFileName}`);
      }
      
      const { PGDATABASE, PGUSER, PGHOST, PGPASSWORD, PGPORT } = process.env;
      
      // Предварительно отключаем соединения к базе данных
      await pool.query("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()", [PGDATABASE]);
      
      // Формируем команду для восстановления
      const cmd = `PGPASSWORD=${PGPASSWORD} psql -h ${PGHOST} -p ${PGPORT} -U ${PGUSER} -d ${PGDATABASE} < ${backupPath}`;
      
      log(`Restoring database from backup: ${backupFileName}`, "backup");
      await execAsync(cmd);
      log(`Database restored successfully from: ${backupFileName}`, "backup");
      
      return true;
    } catch (error) {
      log(`Restore failed: ${error}`, "backup");
      throw new Error(`Failed to restore from backup: ${error}`);
    }
  }

  /**
   * Возвращает список всех резервных копий
   * @returns Массив информации о резервных копиях
   */
  async listBackups(): Promise<{ name: string; size: number; date: Date }[]> {
    try {
      const files = fs.readdirSync(BACKUP_DIR).filter(file => file.endsWith('.sql'));
      
      return files.map(file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        
        return {
          name: file,
          size: stats.size,
          date: stats.mtime
        };
      }).sort((a, b) => b.date.getTime() - a.date.getTime()); // Сортировка по дате (новые первыми)
    } catch (error) {
      log(`Failed to list backups: ${error}`, "backup");
      throw new Error(`Failed to list backups: ${error}`);
    }
  }

  /**
   * Настраивает регулярное автоматическое резервное копирование
   * @param intervalHours Интервал в часах для резервного копирования
   */
  setupScheduledBackup(intervalHours: number = 24): void {
    if (this.scheduledJob) {
      clearInterval(this.scheduledJob);
    }
    
    // Конвертируем интервал в миллисекунды (часы в мс)
    const intervalMs = intervalHours * 60 * 60 * 1000;
    
    log(`Scheduled automatic backup every ${intervalHours} hours`, "backup");
    
    // Запускаем задачу по расписанию
    this.scheduledJob = setInterval(async () => {
      try {
        await this.createBackup();
        // Автоматически очищаем старые резервные копии, оставляя 7 последних
        await this.cleanOldBackups(7);
      } catch (error) {
        log(`Scheduled backup failed: ${error}`, "backup");
      }
    }, intervalMs);
  }

  /**
   * Удаляет резервную копию
   * @param backupFileName Имя файла резервной копии
   * @returns Результат операции
   */
  async deleteBackup(backupFileName: string): Promise<boolean> {
    try {
      const backupPath = path.join(BACKUP_DIR, backupFileName);
      
      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup file not found: ${backupFileName}`);
      }
      
      fs.unlinkSync(backupPath);
      log(`Backup deleted: ${backupFileName}`, "backup");
      
      return true;
    } catch (error) {
      log(`Failed to delete backup: ${error}`, "backup");
      throw new Error(`Failed to delete backup: ${error}`);
    }
  }

  /**
   * Очищает старые резервные копии, оставляя только указанное количество последних
   * @param keepCount Количество резервных копий, которые нужно сохранить
   * @returns Массив удаленных файлов
   */
  async cleanOldBackups(keepCount: number): Promise<string[]> {
    try {
      const backups = await this.listBackups();
      
      if (backups.length <= keepCount) {
        return []; // Нечего удалять
      }
      
      const backupsToDelete = backups.slice(keepCount);
      const deletedFiles: string[] = [];
      
      for (const backup of backupsToDelete) {
        await this.deleteBackup(backup.name);
        deletedFiles.push(backup.name);
      }
      
      log(`Cleaned up old backups, deleted: ${deletedFiles.length} files`, "backup");
      
      return deletedFiles;
    } catch (error) {
      log(`Failed to clean old backups: ${error}`, "backup");
      throw new Error(`Failed to clean old backups: ${error}`);
    }
  }
}

// Создаем экземпляр менеджера резервных копий
export const backupManager = new PostgresBackupManager();

// Настраиваем автоматическое резервное копирование при запуске приложения
if (process.env.NODE_ENV === 'production') {
  // В производственной среде запускаем ежедневное резервное копирование
  backupManager.setupScheduledBackup(24); // Каждые 24 часа
}