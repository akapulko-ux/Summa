import { Router } from "express";
import { backupManager } from "./backup-manager";
import { log } from "../vite";
import { userRoleEnum } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Настройка multer для загрузки файлов
const uploadDir = path.join(process.cwd(), "tmp");

// Создаем директорию для временных файлов, если ее не существует
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `upload-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Фильтр файлов для multer
const fileFilter = (_req: any, file: any, cb: any) => {
  // Принимаем только .sql, .dump, .dir, .tar, .zip файлы
  const validExtensions = ['.sql', '.dump', '.dir', '.tar', '.zip'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (validExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file extension. Allowed: ${validExtensions.join(', ')}`), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // Ограничение размера файла: 50MB
});

const router = Router();

// Middleware для проверки прав администратора
function isAdmin(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  if (req.user.role !== userRoleEnum.enumValues[0]) { // admin
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }
  
  next();
}

// Получение списка резервных копий - только для администраторов
router.get("/list", isAdmin, async (req, res) => {
  try {
    const backups = await backupManager.listBackups();
    res.json(backups);
  } catch (error: any) {
    log(`Error listing backups: ${error.message}`, "backup");
    res.status(500).json({ error: error.message });
  }
});

// Создание ручной резервной копии - только для администраторов
router.post("/create", isAdmin, async (req, res) => {
  try {
    const backupFileName = await backupManager.createBackup(true); // manual backup
    res.json({ 
      success: true, 
      message: `Backup created successfully: ${backupFileName}`,
      backupFileName 
    });
  } catch (error: any) {
    log(`Error creating backup: ${error.message}`, "backup");
    res.status(500).json({ error: error.message });
  }
});

// Восстановление из резервной копии - только для администраторов
router.post("/restore/:filename", isAdmin, async (req, res) => {
  try {
    const { filename } = req.params;
    await backupManager.restoreFromBackup(filename);
    res.json({ 
      success: true, 
      message: `Database restored successfully from backup: ${filename}` 
    });
  } catch (error: any) {
    log(`Error restoring from backup: ${error.message}`, "backup");
    res.status(500).json({ error: error.message });
  }
});

// Удаление резервной копии - только для администраторов
router.delete("/:filename", isAdmin, async (req, res) => {
  try {
    const { filename } = req.params;
    await backupManager.deleteBackup(filename);
    res.json({ 
      success: true, 
      message: `Backup deleted successfully: ${filename}` 
    });
  } catch (error: any) {
    log(`Error deleting backup: ${error.message}`, "backup");
    res.status(500).json({ error: error.message });
  }
});

// Очистка старых резервных копий - только для администраторов
router.post("/clean", isAdmin, async (req, res) => {
  try {
    const { keepCount = 5 } = req.body;
    const deletedFiles = await backupManager.cleanOldBackups(Number(keepCount));
    res.json({ 
      success: true, 
      message: `Cleaned up old backups, deleted ${deletedFiles.length} files`,
      deletedFiles 
    });
  } catch (error: any) {
    log(`Error cleaning old backups: ${error.message}`, "backup");
    res.status(500).json({ error: error.message });
  }
});

// Скачивание резервной копии - только для администраторов
router.get("/download/:filename", isAdmin, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = backupManager.getBackupFilePath(filename);
    
    // Устанавливаем заголовки для скачивания файла
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    res.download(filePath, filename, (err) => {
      if (err) {
        log(`Error downloading backup file: ${err.message}`, "backup");
        // Если ошибка произошла после отправки заголовков,
        // мы не можем отправить JSON ответ с ошибкой
        if (!res.headersSent) {
          res.status(500).json({ error: err.message });
        }
      }
    });
  } catch (error: any) {
    log(`Error downloading backup: ${error.message}`, "backup");
    res.status(500).json({ error: error.message });
  }
});

// Загрузка резервной копии - только для администраторов
router.post("/upload", isAdmin, upload.single('backupFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    const { originalname } = req.file;
    const fileExtension = path.extname(originalname);
    
    // Получаем дату для имени файла
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const prefixName = req.body.prefixName || 'imported';
    const newFileName = `${prefixName}-backup-${timestamp}${fileExtension}`;
    
    // Импортируем резервную копию
    const importedFileName = await backupManager.importBackup(req.file.path, newFileName);
    
    // Удаляем временный файл
    fs.unlinkSync(req.file.path);
    
    res.json({
      success: true,
      message: `Backup file ${originalname} uploaded and imported successfully`,
      backupFileName: importedFileName
    });
  } catch (error: any) {
    // Удаляем временный файл в случае ошибки, если он существует
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    log(`Error uploading backup: ${error.message}`, "backup");
    res.status(500).json({ error: error.message });
  }
});

// Получение метаданных резервной копии - только для администраторов
router.get("/metadata/:filename", isAdmin, async (req, res) => {
  try {
    const { filename } = req.params;
    const metadata = await backupManager.getBackupMetadata(filename);
    res.json(metadata);
  } catch (error: any) {
    log(`Error getting backup metadata: ${error.message}`, "backup");
    res.status(500).json({ error: error.message });
  }
});

// Расширенное восстановление из резервной копии с опциями - только для администраторов
router.post("/restore-advanced/:filename", isAdmin, async (req, res) => {
  try {
    const { filename } = req.params;
    const options = req.body.options || {};
    
    // Добавляем создание предварительной резервной копии перед восстановлением
    if (req.body.createBackupFirst) {
      options.createBackupFirst = true;
    }
    
    // Опции для частичного восстановления
    if (req.body.onlySchema) options.onlySchema = true;
    if (req.body.onlyData) options.onlyData = true;
    if (req.body.schemas && Array.isArray(req.body.schemas)) options.schema = req.body.schemas;
    if (req.body.tables && Array.isArray(req.body.tables)) options.table = req.body.tables;
    
    await backupManager.restoreFromBackup(filename, options);
    
    res.json({ 
      success: true, 
      message: `Database restored successfully from backup: ${filename} with advanced options`,
      options
    });
  } catch (error: any) {
    log(`Error restoring from backup with advanced options: ${error.message}`, "backup");
    res.status(500).json({ error: error.message });
  }
});

export default router;