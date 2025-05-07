import express from 'express';
import { reportService } from './reports-service';
import { isAdmin } from '../middleware/auth-middleware';
import { log } from '../vite';
import path from 'path';
import multer from 'multer';
import fs from 'fs';

// Директория для хранения отчетов
const REPORTS_DIR = path.join(process.cwd(), "reports");

// Создаем директорию, если она не существует
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// Настраиваем multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, REPORTS_DIR);
  },
  filename: (req, file, cb) => {
    // Сохраняем оригинальное имя файла
    cb(null, file.originalname);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // Ограничение размера файла (50MB)
  fileFilter: (req, file, cb) => {
    // Принимаем только файлы отчетов
    const allowedExtensions = ['.pdf', '.xlsx', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, XLSX, and CSV files are allowed.'));
    }
  }
});

// Регистрируем маршруты для отчетов
export function registerReportsRoutes(app: express.Express) {
  // Получение списка отчетов
  app.get('/api/reports', isAdmin, async (req, res) => {
    try {
      const reports = await reportService.getReportsList();
      res.json(reports);
    } catch (error) {
      log(`Error getting reports list: ${error}`, 'reports');
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get reports list',
        error: String(error)
      });
    }
  });

  // Генерация отчета
  app.post('/api/reports/generate', isAdmin, async (req, res) => {
    try {
      const { reportType, format, startDate, endDate, language } = req.body;
      
      // Валидируем основные параметры
      if (!reportType || !format) {
        return res.status(400).json({
          success: false,
          message: 'Report type and format are required'
        });
      }
      
      // Преобразуем строковые даты в объекты Date
      const params = {
        reportType,
        format,
        language: language || req.query.lang || 'en',
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
      };
      
      log(`Generating report: ${JSON.stringify(params)}`, 'reports');
      
      // Генерируем отчет
      const result = await reportService.generateReport(params);
      
      res.json({
        success: true,
        message: 'Report generated successfully',
        fileName: result.fileName,
        downloadUrl: `/api/reports/download/${result.fileName}`
      });
    } catch (error) {
      log(`Error generating report: ${error}`, 'reports');
      res.status(500).json({ 
        success: false, 
        message: 'Failed to generate report',
        error: String(error)
      });
    }
  });

  // Скачивание отчета
  app.get('/api/reports/download/:fileName', isAdmin, (req, res) => {
    try {
      const fileName = req.params.fileName;
      const filePath = path.join(REPORTS_DIR, fileName);
      
      // Проверяем существование файла
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'Report file not found'
        });
      }
      
      // Определяем тип контента по расширению файла
      const ext = path.extname(fileName).toLowerCase();
      let contentType = 'application/octet-stream';
      
      if (ext === '.pdf') {
        contentType = 'application/pdf';
      } else if (ext === '.xlsx') {
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else if (ext === '.csv') {
        contentType = 'text/csv';
      }
      
      // Устанавливаем заголовки и отправляем файл
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      log(`Error downloading report: ${error}`, 'reports');
      res.status(500).json({ 
        success: false, 
        message: 'Failed to download report',
        error: String(error)
      });
    }
  });

  // Удаление отчета
  app.delete('/api/reports/:fileName', isAdmin, (req, res) => {
    try {
      const fileName = req.params.fileName;
      const filePath = path.join(REPORTS_DIR, fileName);
      
      // Проверяем существование файла
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'Report file not found'
        });
      }
      
      // Удаляем файл
      fs.unlinkSync(filePath);
      
      res.json({
        success: true,
        message: 'Report deleted successfully'
      });
    } catch (error) {
      log(`Error deleting report: ${error}`, 'reports');
      res.status(500).json({ 
        success: false, 
        message: 'Failed to delete report',
        error: String(error)
      });
    }
  });
}