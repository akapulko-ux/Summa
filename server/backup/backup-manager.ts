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
  createBackup(manual?: boolean, customPrefix?: string, options?: any): Promise<string>;
  
  // Восстановить базу данных из резервной копии
  restoreFromBackup(backupFileName: string, options?: any): Promise<boolean>;
  
  // Получить список всех резервных копий
  listBackups(filter?: any): Promise<any[]>;
  
  // Настроить автоматическое резервное копирование
  setupScheduledBackup(intervalHours: number): void;
  
  // Удалить резервную копию
  deleteBackup(backupFileName: string): Promise<boolean>;
  
  // Очистить старые резервные копии (оставить только N последних)
  cleanOldBackups(keepCount: number): Promise<string[]>;
  
  // Получить путь к файлу резервной копии для скачивания
  getBackupFilePath(backupFileName: string): string;
  
  // Импортировать резервную копию из загруженного файла
  importBackup(tempFilePath: string, newFileName: string): Promise<string>;
  
  // Экспорт метаданных о резервной копии
  getBackupMetadata(backupFileName: string): Promise<any>;
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
   * @param customPrefix Пользовательский префикс для имени резервной копии
   * @param options Опции создания резервной копии
   * @returns Имя файла резервной копии
   */
  async createBackup(
    manual: boolean = false, 
    customPrefix?: string,
    options: {
      onlySchema?: boolean;
      onlyData?: boolean;
      schema?: string[];
      table?: string[];
      format?: 'plain' | 'custom' | 'directory' | 'tar'; // Формат резервной копии
    } = {}
  ): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const prefix = customPrefix || (manual ? "manual" : "auto");
      const format = options.format || 'plain';
      
      // Выбор расширения файла в зависимости от формата
      let extension = '.sql';
      if (format === 'custom') extension = '.dump';
      else if (format === 'directory') extension = '.dir';
      else if (format === 'tar') extension = '.tar';
      
      const backupFileName = `${prefix}-backup-${timestamp}${extension}`;
      const backupPath = path.join(BACKUP_DIR, backupFileName);
      
      const { PGDATABASE, PGUSER, PGHOST, PGPASSWORD, PGPORT } = process.env;
      
      // Базовая команда pg_dump
      let cmd = `PGPASSWORD=${PGPASSWORD} pg_dump -h ${PGHOST} -p ${PGPORT} -U ${PGUSER} -d ${PGDATABASE}`;
      
      // Добавление параметров формата
      if (format === 'plain') cmd += ` -F p`;
      else if (format === 'custom') cmd += ` -F c`;
      else if (format === 'directory') cmd += ` -F d`;
      else if (format === 'tar') cmd += ` -F t`;
      
      // Добавление параметров для опций
      if (options.onlySchema) cmd += ` --schema-only`;
      if (options.onlyData) cmd += ` --data-only`;
      
      if (options.schema?.length) {
        options.schema.forEach(schema => {
          cmd += ` --schema=${schema}`;
        });
      }
      
      if (options.table?.length) {
        options.table.forEach(table => {
          cmd += ` --table=${table}`;
        });
      }
      
      // Добавление пути для сохранения
      cmd += ` -f ${backupPath}`;
      
      log(`Creating database backup: ${backupFileName}`, "backup");
      await execAsync(cmd);
      log(`Backup created successfully: ${backupFileName}`, "backup");
      
      // Если формат - директория, архивируем её для удобства хранения
      if (format === 'directory') {
        const zipFileName = `${backupPath}.zip`;
        await execAsync(`zip -r ${zipFileName} ${backupPath}`);
        await execAsync(`rm -rf ${backupPath}`);
        return `${backupFileName}.zip`;
      }
      
      return backupFileName;
    } catch (error) {
      log(`Backup creation failed: ${error}`, "backup");
      throw new Error(`Failed to create backup: ${error}`);
    }
  }

  /**
   * Восстанавливает базу данных из резервной копии
   * @param backupFileName Имя файла резервной копии
   * @param options Опции восстановления
   * @returns Результат операции
   */
  async restoreFromBackup(
    backupFileName: string, 
    options: { 
      createBackupFirst?: boolean; 
      onlySchema?: boolean;
      onlyData?: boolean;
      schema?: string[];
      table?: string[];
    } = {}
  ): Promise<boolean> {
    try {
      const backupPath = path.join(BACKUP_DIR, backupFileName);
      
      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup file not found: ${backupFileName}`);
      }
      
      const { PGDATABASE, PGUSER, PGHOST, PGPASSWORD, PGPORT } = process.env;
      
      // Создаем резервную копию текущего состояния, если указано в опциях
      if (options.createBackupFirst) {
        const preRestoreBackupName = await this.createBackup(false, 'pre-restore');
        log(`Created pre-restore backup: ${preRestoreBackupName}`, "backup");
      }
      
      // Предварительно отключаем соединения к базе данных
      await pool.query("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()", [PGDATABASE]);
      
      // Базовая команда восстановления
      let cmd = `PGPASSWORD=${PGPASSWORD} psql -h ${PGHOST} -p ${PGPORT} -U ${PGUSER} -d ${PGDATABASE}`;
      
      // Определяем тип восстановления и параметры
      let preCommands = [];
      let postCommands = [];
      
      // Восстановление только структуры без данных
      if (options.onlySchema) {
        preCommands.push(`grep -E '^(CREATE|ALTER|DROP|SET|SELECT|COMMENT ON|\\\\connect)' ${backupPath} > ${backupPath}.schema.tmp`);
        cmd = `${cmd} < ${backupPath}.schema.tmp`;
        postCommands.push(`rm ${backupPath}.schema.tmp`);
      } 
      // Восстановление только данных без структуры
      else if (options.onlyData) {
        preCommands.push(`grep -E '^(INSERT|UPDATE|DELETE|COPY)' ${backupPath} > ${backupPath}.data.tmp`);
        cmd = `${cmd} < ${backupPath}.data.tmp`;
        postCommands.push(`rm ${backupPath}.data.tmp`);
      }
      // Восстановление определенных схем или таблиц, если указаны
      else if (options.schema?.length || options.table?.length) {
        let filterCommands = [];
        
        if (options.schema?.length) {
          const schemas = options.schema.join('|');
          filterCommands.push(`(grep -E '(CREATE|ALTER|DROP) (SCHEMA|TABLE|SEQUENCE|FUNCTION|VIEW|TRIGGER) (${schemas})\\.`);
        }
        
        if (options.table?.length) {
          const tables = options.table.join('|');
          filterCommands.push(`(grep -E '(CREATE|ALTER|DROP) TABLE ["\`]?(${tables})["\`]?'`);
          filterCommands.push(`grep -E 'INSERT INTO ["\`]?(${tables})["\`]?'`);
        }
        
        if (filterCommands.length) {
          const filterCommand = filterCommands.join(' || ');
          preCommands.push(`${filterCommand}) ${backupPath} > ${backupPath}.filtered.tmp`);
          cmd = `${cmd} < ${backupPath}.filtered.tmp`;
          postCommands.push(`rm ${backupPath}.filtered.tmp`);
        } else {
          cmd = `${cmd} < ${backupPath}`;
        }
      } 
      // Полное восстановление
      else {
        cmd = `${cmd} < ${backupPath}`;
      }
      
      // Выполняем предварительные команды
      for (const preCmd of preCommands) {
        log(`Executing pre-restore command: ${preCmd}`, "backup");
        await execAsync(preCmd);
      }
      
      log(`Restoring database from backup: ${backupFileName}`, "backup");
      await execAsync(cmd);
      
      // Выполняем команды после восстановления
      for (const postCmd of postCommands) {
        log(`Executing post-restore command: ${postCmd}`, "backup");
        await execAsync(postCmd);
      }
      
      log(`Database restored successfully from: ${backupFileName}`, "backup");
      
      return true;
    } catch (error) {
      log(`Restore failed: ${error}`, "backup");
      throw new Error(`Failed to restore from backup: ${error}`);
    }
  }

  /**
   * Возвращает список всех резервных копий
   * @param filter Опциональный фильтр для резервных копий
   * @returns Массив информации о резервных копиях
   */
  async listBackups(filter?: { 
    type?: 'manual' | 'auto' | 'pre-restore'; 
    format?: 'plain' | 'custom' | 'directory' | 'tar';
    fromDate?: Date;
    toDate?: Date; 
  }): Promise<{ 
    name: string; 
    size: number; 
    date: Date; 
    type: string; 
    format: string;
    tables?: string[];
    schemas?: string[];
  }[]> {
    try {
      // Все возможные расширения для резервных копий
      const validExtensions = ['.sql', '.dump', '.dir', '.tar', '.zip'];
      
      // Получаем список всех файлов в директории и фильтруем по расширениям
      const files = fs.readdirSync(BACKUP_DIR).filter(file => {
        return validExtensions.some(ext => file.endsWith(ext));
      });
      
      // Преобразуем список файлов в объекты с метаданными
      let backups = files.map(file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        
        // Определяем тип резервной копии по имени файла
        let type = 'unknown';
        if (file.startsWith('manual-')) type = 'manual';
        else if (file.startsWith('auto-')) type = 'auto';
        else if (file.startsWith('pre-restore-')) type = 'pre-restore';
        
        // Определяем формат резервной копии по расширению
        let format = 'unknown';
        if (file.endsWith('.sql')) format = 'plain';
        else if (file.endsWith('.dump')) format = 'custom';
        else if (file.endsWith('.dir') || file.endsWith('.dir.zip')) format = 'directory';
        else if (file.endsWith('.tar')) format = 'tar';
        
        // Базовая информация о резервной копии
        const backup = {
          name: file,
          size: stats.size,
          date: stats.mtime,
          type,
          format,
          tables: [] as string[],
          schemas: [] as string[]
        };
        
        // TODO: для более детального анализа можно добавить инспекцию содержимого бэкапа
        // чтобы извлечь информацию о таблицах и схемах
        
        return backup;
      });
      
      // Применяем фильтры, если они указаны
      if (filter) {
        if (filter.type) {
          backups = backups.filter(backup => backup.type === filter.type);
        }
        
        if (filter.format) {
          backups = backups.filter(backup => backup.format === filter.format);
        }
        
        if (filter.fromDate) {
          backups = backups.filter(backup => backup.date >= filter.fromDate!);
        }
        
        if (filter.toDate) {
          backups = backups.filter(backup => backup.date <= filter.toDate!);
        }
      }
      
      // Сортируем резервные копии по дате (новые первыми)
      return backups.sort((a, b) => b.date.getTime() - a.date.getTime());
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

  /**
   * Получить путь к файлу резервной копии для скачивания
   * @param backupFileName Имя файла резервной копии
   * @returns Абсолютный путь к файлу
   */
  getBackupFilePath(backupFileName: string): string {
    const backupPath = path.join(BACKUP_DIR, backupFileName);
    
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupFileName}`);
    }
    
    return backupPath;
  }

  /**
   * Импортировать резервную копию из загруженного файла
   * @param tempFilePath Путь к временному файлу загрузки
   * @param newFileName Новое имя файла (опционально)
   * @returns Имя импортированного файла резервной копии
   */
  async importBackup(tempFilePath: string, newFileName?: string): Promise<string> {
    try {
      if (!fs.existsSync(tempFilePath)) {
        throw new Error(`Uploaded file not found: ${tempFilePath}`);
      }
      
      const originalFileName = path.basename(tempFilePath);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      
      // Формируем новое имя файла, если оно не указано явно
      const targetFileName = newFileName || `imported-backup-${timestamp}${path.extname(originalFileName)}`;
      const targetPath = path.join(BACKUP_DIR, targetFileName);
      
      // Проверяем, что расширение валидное
      const validExtensions = ['.sql', '.dump', '.dir', '.tar', '.zip'];
      if (!validExtensions.some(ext => targetFileName.endsWith(ext))) {
        throw new Error(`Invalid backup file extension. Allowed: ${validExtensions.join(', ')}`);
      }
      
      // Копируем файл в директорию резервных копий
      fs.copyFileSync(tempFilePath, targetPath);
      
      // Проверяем целостность резервной копии
      if (targetFileName.endsWith('.sql')) {
        // Для SQL файлов проверяем, содержит ли файл SQL-команды
        const fileContent = fs.readFileSync(targetPath, 'utf8').slice(0, 1000); // Читаем первые 1000 байт
        if (!fileContent.includes('CREATE TABLE') && !fileContent.includes('INSERT INTO') && 
            !fileContent.includes('BEGIN;') && !fileContent.includes('COPY')) {
          fs.unlinkSync(targetPath); // Удаляем файл, если он некорректный
          throw new Error('Invalid SQL backup file format');
        }
      }
      
      log(`Backup imported successfully: ${targetFileName}`, "backup");
      return targetFileName;
    } catch (error) {
      log(`Failed to import backup: ${error}`, "backup");
      throw new Error(`Failed to import backup: ${error}`);
    }
  }

  /**
   * Получить метаданные о резервной копии
   * @param backupFileName Имя файла резервной копии
   * @returns Объект с метаданными
   */
  async getBackupMetadata(backupFileName: string): Promise<any> {
    try {
      const backupPath = path.join(BACKUP_DIR, backupFileName);
      
      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup file not found: ${backupFileName}`);
      }
      
      const stats = fs.statSync(backupPath);
      
      // Определяем тип резервной копии по имени файла
      let type = 'unknown';
      if (backupFileName.startsWith('manual-')) type = 'manual';
      else if (backupFileName.startsWith('auto-')) type = 'auto';
      else if (backupFileName.startsWith('pre-restore-')) type = 'pre-restore';
      else if (backupFileName.startsWith('imported-')) type = 'imported';
      
      // Определяем формат резервной копии по расширению
      let format = 'unknown';
      if (backupFileName.endsWith('.sql')) format = 'plain';
      else if (backupFileName.endsWith('.dump')) format = 'custom';
      else if (backupFileName.endsWith('.dir') || backupFileName.endsWith('.dir.zip')) format = 'directory';
      else if (backupFileName.endsWith('.tar')) format = 'tar';
      else if (backupFileName.endsWith('.zip')) format = 'compressed';
      
      // Базовая метаинформация
      const metadata: any = {
        name: backupFileName,
        path: backupPath,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        type,
        format,
      };
      
      // Для plain SQL файлов можно извлечь дополнительную информацию о содержимом
      if (format === 'plain' && stats.size < 10 * 1024 * 1024) { // Только для файлов < 10MB
        try {
          // Чтение первых 50КБ файла для анализа
          const buffer = Buffer.alloc(50 * 1024);
          const fd = fs.openSync(backupPath, 'r');
          fs.readSync(fd, buffer, 0, 50 * 1024, 0);
          fs.closeSync(fd);
          
          const content = buffer.toString('utf8');
          
          // Поиск информации о таблицах
          const tableMatches = content.match(/CREATE TABLE ([^\s(]+)/g);
          if (tableMatches) {
            metadata.tables = tableMatches.map(m => m.replace('CREATE TABLE ', '').trim());
          }
          
          // Поиск информации о схемах
          const schemaMatches = content.match(/CREATE SCHEMA ([^\s;]+)/g);
          if (schemaMatches) {
            metadata.schemas = schemaMatches.map(m => m.replace('CREATE SCHEMA ', '').trim());
          }
          
          // Поиск комментария в начале файла (часто содержит метаданные)
          const commentMatch = content.match(/^-- ([^\n]+)/);
          if (commentMatch) {
            metadata.comment = commentMatch[1].trim();
          }
        } catch (err) {
          log(`Failed to extract detailed metadata from backup: ${err}`, "backup");
          // Продолжаем выполнение, просто не добавляем детальную информацию
        }
      }
      
      return metadata;
    } catch (error) {
      log(`Failed to get backup metadata: ${error}`, "backup");
      throw new Error(`Failed to get backup metadata: ${error}`);
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