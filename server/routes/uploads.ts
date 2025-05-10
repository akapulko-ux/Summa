import { Express, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

// Настройка хранилища загрузок
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

// Настройка multer для загрузки иконок
const iconStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, iconDir);
  },
  filename: (_req, file, cb) => {
    // Создаем уникальное имя файла с сохранением расширения
    const uniqueFileName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFileName);
  },
});

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
  storage: iconStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 МБ
  },
  fileFilter,
});

export const setupUploadRoutes = (app: Express) => {
  // Эндпоинт загрузки иконки
  app.post("/api/upload/icon", upload.single("icon"), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Файл не был загружен" });
      }

      // Формируем URL для доступа к загруженному файлу
      const iconUrl = `/uploads/icons/${req.file.filename}`;
      
      // Возвращаем URL загруженного файла
      return res.status(200).json({ iconUrl });
    } catch (error: any) {
      console.error("Ошибка загрузки файла:", error.message);
      return res.status(500).json({ message: "Ошибка при загрузке файла" });
    }
  });

  // Создаем статический маршрут для доступа к загруженным файлам
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
  }, require("express").static(uploadDir));
};