import { Express, Request, Response } from "express";
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from 'url';
import { db } from "../db";
import { services, Service } from "@shared/schema";
import { eq } from "drizzle-orm";

// Получаем текущую директорию в ESM формате
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Настройка хранилища загрузок для временных файлов
const uploadDir = path.join(__dirname, "../../uploads");

// Создать директорию, если не существует
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Аналогично создадим директорию для иконок
const iconDir = path.join(uploadDir, "icons");
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// Настройка multer для временного хранения загружаемых файлов
// В отличие от прежней реализации, используем memoryStorage для работы с буфером в памяти
const iconStorage = multer.memoryStorage();

// Фильтрация файлов (только изображения)
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/svg+xml"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Недопустимый тип файла. Разрешены только изображения (JPG, PNG, GIF, SVG)."));
  }
};

// Настройка загрузки с ограничением размера
const upload = multer({
  storage: iconStorage, // используем хранилище в памяти
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 МБ
  },
  fileFilter,
});

// Функция для чтения файла в формат base64
const getBase64FromFilePath = (filePath: string): string => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    return fileBuffer.toString('base64');
  } catch (error) {
    console.error('Ошибка чтения файла в base64:', error);
    return '';
  }
}

// Функция для получения иконки из базы данных по ID сервиса
const getServiceIcon = async (serviceId: number): Promise<{ iconData: string | null, iconMimeType: string | null, iconUrl: string | null }> => {
  try {
    const [service] = await db.select({
      iconData: services.iconData,
      iconMimeType: services.iconMimeType,
      iconUrl: services.iconUrl,
    }).from(services).where(eq(services.id, serviceId));
    
    return service || { iconData: null, iconMimeType: null, iconUrl: null };
  } catch (error) {
    console.error('Ошибка получения иконки из БД:', error);
    return { iconData: null, iconMimeType: null, iconUrl: null };
  }
};

// Функция для обновления иконки сервиса в базе данных
const updateServiceIcon = async (serviceId: number, iconData: string | null, iconMimeType: string | null, iconUrl: string | null): Promise<boolean> => {
  try {
    await db.update(services)
      .set({ 
        iconData,
        iconMimeType,
        iconUrl,
        updatedAt: new Date()
      })
      .where(eq(services.id, serviceId));
    
    return true;
  } catch (error) {
    console.error('Ошибка обновления иконки в БД:', error);
    return false;
  }
};

export const setupUploadRoutes = (app: Express) => {
  // Эндпоинт загрузки иконки
  app.post("/api/upload/icon", upload.single("icon"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Файл не был загружен" });
      }

      const serviceId = req.body.serviceId ? parseInt(req.body.serviceId) : null;
      
      // Генерируем уникальное имя файла
      const uniqueFileName = `${uuidv4()}${path.extname(req.file.originalname || '')}`;
      const iconUrl = `/uploads/icons/${uniqueFileName}`;
      
      // Сохраняем данные изображения в формате base64
      const iconData = req.file.buffer.toString('base64');
      const iconMimeType = req.file.mimetype;
      
      // Также сохраняем файл на диск для совместимости со старым подходом
      const filePath = path.join(iconDir, uniqueFileName);
      fs.writeFileSync(filePath, req.file.buffer);
      
      // Если указан ID сервиса, обновляем запись в базе данных
      if (serviceId) {
        await updateServiceIcon(serviceId, iconData, iconMimeType, iconUrl);
      }
      
      // Возвращаем URL и данные загруженного файла
      return res.status(200).json({ 
        iconUrl,
        iconData,
        iconMimeType
      });
    } catch (error: any) {
      console.error("Ошибка загрузки файла:", error.message);
      return res.status(500).json({ message: "Ошибка при загрузке файла" });
    }
  });
  
  // Эндпоинт удаления иконки
  app.delete("/api/upload/icon", async (req: Request, res: Response) => {
    try {
      const { iconUrl } = req.query;
      const serviceId = req.query.serviceId ? parseInt(req.query.serviceId as string) : null;
      
      if ((!iconUrl || typeof iconUrl !== 'string') && !serviceId) {
        return res.status(400).json({ message: "URL иконки или ID сервиса не указаны" });
      }
      
      // Если указан ID сервиса, очищаем данные иконки в базе данных
      if (serviceId) {
        await updateServiceIcon(serviceId, null, null, null);
      }
      
      // Если указан URL, удаляем файл с диска (для совместимости)
      if (iconUrl && typeof iconUrl === 'string') {
        // Извлекаем имя файла из URL
        const filename = iconUrl.split('/').pop();
        if (filename) {
          const filePath = path.join(iconDir, filename);
          
          // Проверяем, существует ли файл
          if (fs.existsSync(filePath)) {
            // Удаляем файл
            fs.unlinkSync(filePath);
          }
        }
      }
      
      return res.status(200).json({ message: "Иконка успешно удалена" });
    } catch (error: any) {
      console.error("Ошибка удаления файла:", error.message);
      return res.status(500).json({ message: "Ошибка при удалении файла" });
    }
  });

  // Эндпоинт для получения иконки сервиса
  app.get("/api/service-icon/:id", async (req: Request, res: Response) => {
    try {
      const serviceId = parseInt(req.params.id);
      
      if (isNaN(serviceId)) {
        return res.status(400).json({ message: "Неверный ID сервиса" });
      }
      
      const icon = await getServiceIcon(serviceId);
      
      if (icon.iconData && icon.iconMimeType) {
        // Если есть данные в base64, отправляем их
        const buffer = Buffer.from(icon.iconData, 'base64');
        res.setHeader('Content-Type', icon.iconMimeType);
        return res.send(buffer);
      } else if (icon.iconUrl) {
        // Если есть только URL, делаем редирект
        return res.redirect(icon.iconUrl);
      } else {
        // Нет иконки
        return res.status(404).json({ message: "Иконка не найдена" });
      }
    } catch (error: any) {
      console.error("Ошибка получения иконки:", error.message);
      return res.status(500).json({ message: "Ошибка при получении иконки" });
    }
  });

  // Эндпоинт для миграции существующих иконок в базу данных
  app.post("/api/migrate-icons", async (_req: Request, res: Response) => {
    try {
      // Получаем все сервисы с URL иконок
      const servicesWithIcons = await db.select().from(services).where(
        eq(services.iconUrl, undefined).not()
      );
      
      let migratedCount = 0;
      let failedCount = 0;
      
      for (const service of servicesWithIcons) {
        if (!service.iconUrl || service.iconData) continue; // Пропускаем, если нет URL или иконка уже в базе
        
        // Проверяем, указывает ли iconUrl на локальный файл
        if (service.iconUrl.startsWith('/uploads/')) {
          // Извлекаем имя файла из URL
          const filename = service.iconUrl.split('/').pop();
          if (!filename) continue;
          
          const filePath = path.join(iconDir, filename);
          
          // Проверяем, существует ли файл
          if (fs.existsSync(filePath)) {
            // Определяем MIME-тип на основе расширения
            const ext = path.extname(filePath).toLowerCase();
            let mimeType = 'application/octet-stream';
            
            if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
            else if (ext === '.png') mimeType = 'image/png';
            else if (ext === '.gif') mimeType = 'image/gif';
            else if (ext === '.svg') mimeType = 'image/svg+xml';
            
            // Читаем файл в base64
            const iconData = getBase64FromFilePath(filePath);
            
            if (iconData) {
              // Обновляем запись в базе данных
              const success = await updateServiceIcon(service.id, iconData, mimeType, service.iconUrl);
              
              if (success) {
                migratedCount++;
              } else {
                failedCount++;
              }
            } else {
              failedCount++;
            }
          } else {
            failedCount++;
          }
        } else {
          // URL внешний, пропускаем
          continue;
        }
      }
      
      return res.status(200).json({
        message: `Миграция завершена. Обработано: ${migratedCount}, ошибок: ${failedCount}`,
        migrated: migratedCount,
        failed: failedCount
      });
    } catch (error: any) {
      console.error("Ошибка миграции иконок:", error.message);
      return res.status(500).json({ message: "Ошибка при миграции иконок" });
    }
  });

  // Создаем статический маршрут для доступа к загруженным файлам (для совместимости)
  app.use("/uploads", (req, res, next) => {
    // Простая проверка MIME типа на основе расширения
    const extname = path.extname(req.path).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
    };
    
    if (extname in mimeTypes) {
      res.setHeader("Content-Type", mimeTypes[extname]);
    }
    
    next();
  }, (req, res, next) => {
    // Проверяем, не пытается ли кто-то выйти из директории uploads
    if (req.path.includes("..")) {
      return res.status(403).json({ message: "Доступ запрещен" });
    }
    next();
  }, express.static(uploadDir));
};