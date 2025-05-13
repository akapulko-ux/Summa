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

// Get current directory in ESM format
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure upload storage for temporary files
const uploadDir = path.join(__dirname, "../../uploads");

// Create directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Similarly create a directory for icons
const iconDir = path.join(uploadDir, "icons");
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// Configure multer for temporary storage of uploaded files
// Unlike the previous implementation, we use memoryStorage to work with the buffer in memory
const iconStorage = multer.memoryStorage();

// File filtering (images only)
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/svg+xml"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images (JPG, PNG, GIF, SVG) are allowed."));
  }
};

// Upload configuration with size limitation
const upload = multer({
  storage: iconStorage, // using in-memory storage
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter,
});

// Function to read a file into base64 format
const getBase64FromFilePath = (filePath: string): string => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    return fileBuffer.toString('base64');
  } catch (error) {
    console.error('Error reading file into base64:', error);
    return '';
  }
}

// Function to retrieve an icon from the database by service ID
const getServiceIcon = async (serviceId: number): Promise<{ iconData: string | null, iconMimeType: string | null, iconUrl: string | null }> => {
  try {
    const [service] = await db.select({
      iconData: services.iconData,
      iconMimeType: services.iconMimeType,
      iconUrl: services.iconUrl,
    }).from(services).where(eq(services.id, serviceId));
    
    return service || { iconData: null, iconMimeType: null, iconUrl: null };
  } catch (error) {
    console.error('Error retrieving icon from database:', error);
    return { iconData: null, iconMimeType: null, iconUrl: null };
  }
};

// Function to update a service icon in the database
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
    console.error('Error updating icon in database:', error);
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
      
      // Генерируем уникальное имя файла (для URL и удобства идентификации)
      const uniqueFileName = `${uuidv4()}${path.extname(req.file.originalname || '')}`;
      const iconUrl = `/api/service-icon/${serviceId || 'temp'}`;
      
      // Сохраняем данные изображения в формате base64 (это основное хранилище)
      const iconData = req.file.buffer.toString('base64');
      const iconMimeType = req.file.mimetype;
      
      // Если указан ID сервиса, обновляем запись в базе данных
      if (serviceId) {
        await updateServiceIcon(serviceId, iconData, iconMimeType, iconUrl);
        console.log(`Иконка сохранена в базе данных для сервиса #${serviceId}`);
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
      const serviceId = req.query.serviceId ? parseInt(req.query.serviceId as string) : null;
      
      if (!serviceId) {
        return res.status(400).json({ message: "ID сервиса не указан" });
      }
      
      // Очищаем данные иконки в базе данных
      await updateServiceIcon(serviceId, null, null, null);
      console.log(`Иконка удалена из базы данных для сервиса #${serviceId}`);
      
      return res.status(200).json({ message: "Иконка успешно удалена" });
    } catch (error: any) {
      console.error("Ошибка удаления иконки:", error.message);
      return res.status(500).json({ message: "Ошибка при удалении иконки" });
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