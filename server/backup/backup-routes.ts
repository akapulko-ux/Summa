import { Router } from "express";
import { backupManager } from "./backup-manager";
import { log } from "../vite";
import { userRoleEnum } from "@shared/schema";

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

export default router;