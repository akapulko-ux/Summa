import PDFDocument from 'pdfkit';
import * as ExcelJS from 'exceljs';
import { Stream } from 'stream';
import { db } from '../db';
import { users, subscriptions, services } from '@shared/schema';
import { eq, and, gt, lt, desc, sql } from 'drizzle-orm';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import path from 'path';
import fs from 'fs';

// Тип для параметров отчета
export interface ReportParams {
  reportType: 'subscriptions' | 'users' | 'services' | 'financial' | 'trends';
  format: 'pdf' | 'excel' | 'csv';
  startDate?: Date;
  endDate?: Date;
  additionalFilters?: Record<string, any>;
  language?: 'en' | 'ru';
}

// Интерфейс сервиса отчетов
export interface IReportService {
  generateReport(params: ReportParams): Promise<{ fileName: string, filePath: string }>;
  getReportsList(): Promise<any[]>;
}

// Директория для хранения отчетов
const REPORTS_DIR = path.join(process.cwd(), "reports");

// Создаем директорию, если она не существует
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

export class ReportService implements IReportService {
  async generateReport(params: ReportParams): Promise<{ fileName: string, filePath: string }> {
    // Получаем данные для отчета в зависимости от типа
    const data = await this.getReportData(params);
    
    // Генерируем отчет в нужном формате
    switch (params.format) {
      case 'pdf':
        return this.generatePdfReport(data, params);
      case 'excel':
        return this.generateExcelReport(data, params);
      case 'csv':
        return this.generateCsvReport(data, params);
      default:
        throw new Error(`Unsupported format: ${params.format}`);
    }
  }
  
  async getReportsList(): Promise<any[]> {
    try {
      // Получаем список всех отчетов в директории
      const files = fs.readdirSync(REPORTS_DIR);
      
      // Преобразуем список файлов в объекты с метаданными
      const reports = files.map(file => {
        const filePath = path.join(REPORTS_DIR, file);
        const stats = fs.statSync(filePath);
        
        // Извлекаем тип отчета и формат из имени файла
        // Ожидаемый формат: report_subscriptions_2023-05-01_2023-05-30.pdf
        const parts = file.split('_');
        const reportType = parts[1] || 'unknown';
        
        // Извлекаем формат из расширения
        const fileExt = path.extname(file).substring(1); // Убираем точку
        
        return {
          name: file,
          path: filePath,
          type: reportType,
          format: fileExt,
          size: stats.size,
          createdAt: stats.mtime
        };
      });
      
      // Сортируем по дате создания (новые первыми)
      return reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error getting reports list:', error);
      return [];
    }
  }
  
  private async getReportData(params: ReportParams): Promise<any> {
    const { reportType, startDate, endDate } = params;
    
    // Применяем временные фильтры к запросам
    const dateFilter = {};
    if (startDate) {
      dateFilter['gte'] = startDate;
    }
    if (endDate) {
      dateFilter['lte'] = endDate;
    }
    
    switch (reportType) {
      case 'subscriptions':
        // Получаем данные о подписках
        let subscriptionsQuery = db.select({
          id: subscriptions.id,
          title: subscriptions.title,
          userId: subscriptions.userId,
          serviceId: subscriptions.serviceId,
          paymentPeriod: subscriptions.paymentPeriod,
          paymentAmount: subscriptions.paymentAmount,
          paidUntil: subscriptions.paidUntil,
          licensesCount: subscriptions.licensesCount,
          usersCount: subscriptions.usersCount,
          status: subscriptions.status,
          createdAt: subscriptions.createdAt,
          // Добавляем данные о сервисе и пользователе через джойны
          userName: users.name,
          userEmail: users.email,
          serviceName: services.title,
          serviceCashback: services.cashback,
          serviceCommission: services.commission
        })
        .from(subscriptions)
        .leftJoin(users, eq(subscriptions.userId, users.id))
        .leftJoin(services, eq(subscriptions.serviceId, services.id));
        
        // Применяем фильтр по дате, если указан
        if (startDate) {
          subscriptionsQuery = subscriptionsQuery.where(gt(subscriptions.createdAt, startDate));
        }
        if (endDate) {
          subscriptionsQuery = subscriptionsQuery.where(lt(subscriptions.createdAt, endDate));
        }
        
        return {
          subscriptions: await subscriptionsQuery.orderBy(desc(subscriptions.createdAt)),
          title: params.language === 'ru' ? 'Отчет по подпискам' : 'Subscriptions Report',
          generated: new Date(),
          params
        };
        
      case 'users':
        // Получаем данные о пользователях
        let usersQuery = db.select()
          .from(users);
        
        // Применяем фильтр по дате, если указан
        if (startDate) {
          usersQuery = usersQuery.where(gt(users.createdAt, startDate));
        }
        if (endDate) {
          usersQuery = usersQuery.where(lt(users.createdAt, endDate));
        }
        
        // Дополнительно получаем статистику по пользователям
        const activeUsers = await db.select({ count: sql<number>`count(*)` })
          .from(users)
          .where(eq(users.isActive, true));
        
        const newUsers = await db.select({ count: sql<number>`count(*)` })
          .from(users)
          .where(
            and(
              startDate ? gt(users.createdAt, startDate) : undefined,
              endDate ? lt(users.createdAt, endDate) : undefined
            )
          );
        
        return {
          users: await usersQuery.orderBy(desc(users.createdAt)),
          stats: {
            total: (await db.select({ count: sql<number>`count(*)` }).from(users))[0].count,
            active: activeUsers[0].count,
            new: newUsers[0].count
          },
          title: params.language === 'ru' ? 'Отчет по пользователям' : 'Users Report',
          generated: new Date(),
          params
        };
        
      case 'services':
        // Получаем данные о сервисах
        const servicesData = await db.select().from(services);
        
        // Получаем статистику использования сервисов
        const serviceUsage = await db.select({
          serviceId: subscriptions.serviceId,
          serviceName: services.title,
          count: sql<number>`count(*)`,
          totalRevenue: sql<number>`sum(${subscriptions.paymentAmount})`
        })
        .from(subscriptions)
        .leftJoin(services, eq(subscriptions.serviceId, services.id))
        .groupBy(subscriptions.serviceId, services.title);
        
        return {
          services: servicesData,
          usage: serviceUsage,
          title: params.language === 'ru' ? 'Отчет по сервисам' : 'Services Report',
          generated: new Date(),
          params
        };
        
      case 'financial':
        // Получаем финансовые данные
        const financialData = await db.select({
          id: subscriptions.id,
          title: subscriptions.title,
          paymentAmount: subscriptions.paymentAmount,
          paymentPeriod: subscriptions.paymentPeriod,
          createdAt: subscriptions.createdAt,
          serviceName: services.title,
          cashback: services.cashback,
          commission: services.commission
        })
        .from(subscriptions)
        .leftJoin(services, eq(subscriptions.serviceId, services.id));
        
        // Суммируем данные по доходам и комиссиям
        const totalRevenue = financialData.reduce((sum, item) => sum + (item.paymentAmount || 0), 0);
        
        // Рассчитываем кэшбэки и комиссии
        const financialSummary = financialData.reduce((acc, item) => {
          const paymentAmount = item.paymentAmount || 0;
          
          // Рассчитываем кэшбэк
          let cashbackAmount = 0;
          if (item.cashback) {
            if (item.cashback.endsWith('%')) {
              const percentage = parseFloat(item.cashback);
              cashbackAmount = (paymentAmount * percentage) / 100;
            } else {
              cashbackAmount = parseFloat(item.cashback) || 0;
            }
          }
          
          // Рассчитываем комиссию
          let commissionAmount = 0;
          if (item.commission) {
            if (item.commission.endsWith('%')) {
              const percentage = parseFloat(item.commission);
              commissionAmount = (paymentAmount * percentage) / 100;
            } else {
              commissionAmount = parseFloat(item.commission) || 0;
            }
          }
          
          return {
            totalRevenue: acc.totalRevenue + paymentAmount,
            totalCashback: acc.totalCashback + cashbackAmount,
            totalCommission: acc.totalCommission + commissionAmount,
            netIncome: acc.netIncome + paymentAmount - cashbackAmount + commissionAmount
          };
        }, { totalRevenue: 0, totalCashback: 0, totalCommission: 0, netIncome: 0 });
        
        return {
          transactions: financialData,
          summary: financialSummary,
          title: params.language === 'ru' ? 'Финансовый отчет' : 'Financial Report',
          generated: new Date(),
          params
        };
        
      case 'trends':
        // Получаем данные для анализа трендов
        
        // Группируем подписки по месяцам
        const subscriptionsByMonth = await db.select({
          month: sql<string>`to_char(${subscriptions.createdAt}, 'YYYY-MM')`,
          count: sql<number>`count(*)`,
          revenue: sql<number>`sum(${subscriptions.paymentAmount})`
        })
        .from(subscriptions)
        .groupBy(sql`to_char(${subscriptions.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${subscriptions.createdAt}, 'YYYY-MM')`);
        
        // Группируем пользователей по месяцам регистрации
        const usersByMonth = await db.select({
          month: sql<string>`to_char(${users.createdAt}, 'YYYY-MM')`,
          count: sql<number>`count(*)`
        })
        .from(users)
        .groupBy(sql`to_char(${users.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${users.createdAt}, 'YYYY-MM')`);
        
        return {
          subscriptionTrends: subscriptionsByMonth,
          userTrends: usersByMonth,
          title: params.language === 'ru' ? 'Отчет по трендам' : 'Trends Report',
          generated: new Date(),
          params
        };
        
      default:
        throw new Error(`Unsupported report type: ${reportType}`);
    }
  }
  
  private async generatePdfReport(data: any, params: ReportParams): Promise<{ fileName: string, filePath: string }> {
    const { reportType, startDate, endDate, language = 'en' } = params;
    
    // Создаем имя файла
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    const startDateStr = startDate ? format(startDate, 'yyyy-MM-dd') : '';
    const endDateStr = endDate ? format(endDate, 'yyyy-MM-dd') : '';
    
    const dateRange = startDateStr && endDateStr 
      ? `_${startDateStr}_${endDateStr}` 
      : '';
      
    const fileName = `report_${reportType}${dateRange}_${timestamp}.pdf`;
    const filePath = path.join(REPORTS_DIR, fileName);
    
    // Создаем PDF документ с поддержкой Unicode для кириллицы
    const doc = new PDFDocument({ 
      margin: 50,
      info: {
        Title: data.title,
        Author: 'Subscription Management System',
        Subject: `${reportType} report`,
        Keywords: 'report,subscription,management',
        CreationDate: new Date()
      }
    });
    
    // Используем встроенные шрифты PDFKit с поддержкой Unicode
    // Courier поддерживает больше символов, включая кириллицу
    doc.font('Courier');
    
    const writeStream = fs.createWriteStream(filePath);
    
    doc.pipe(writeStream);
    
    // Добавляем заголовок
    doc.fontSize(20).text(data.title, { align: 'center' });
    doc.moveDown();
    
    // Добавляем информацию о параметрах отчета
    const dateFormat = language === 'ru' ? 'dd MMMM yyyy' : 'MMM dd, yyyy';
    const dateOptions = language === 'ru' ? { locale: ru } : undefined;
    
    doc.fontSize(12).text(`${language === 'ru' ? 'Дата создания' : 'Generated on'}: ${format(data.generated, dateFormat, dateOptions)}`);
    
    if (startDate) {
      doc.text(`${language === 'ru' ? 'Начальная дата' : 'Start date'}: ${format(startDate, dateFormat, dateOptions)}`);
    }
    
    if (endDate) {
      doc.text(`${language === 'ru' ? 'Конечная дата' : 'End date'}: ${format(endDate, dateFormat, dateOptions)}`);
    }
    
    doc.moveDown(2);
    
    // Генерируем содержимое отчета в зависимости от типа
    switch (reportType) {
      case 'subscriptions':
        this.generateSubscriptionsPdfContent(doc, data, language);
        break;
      case 'users':
        this.generateUsersPdfContent(doc, data, language);
        break;
      case 'services':
        this.generateServicesPdfContent(doc, data, language);
        break;
      case 'financial':
        this.generateFinancialPdfContent(doc, data, language);
        break;
      case 'trends':
        this.generateTrendsPdfContent(doc, data, language);
        break;
    }
    
    // Завершаем документ
    doc.end();
    
    // Возвращаем информацию о файле
    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => {
        resolve({ fileName, filePath });
      });
      
      writeStream.on('error', (err) => {
        reject(err);
      });
    });
  }
  
  private generateSubscriptionsPdfContent(doc: PDFKit.PDFDocument, data: any, language: string) {
    const { subscriptions } = data;
    
    // Добавляем общую информацию
    doc.fontSize(14).font('Courier').text(language === 'ru' ? 'Сводка' : 'Summary', { underline: true });
    doc.fontSize(12).text(
      `${language === 'ru' ? 'Всего подписок' : 'Total subscriptions'}: ${subscriptions.length}`
    );
    
    // Вычисляем общую сумму подписок
    const totalRevenue = subscriptions.reduce((sum, sub) => sum + (sub.paymentAmount || 0), 0);
    doc.text(`${language === 'ru' ? 'Общая сумма платежей' : 'Total payment amount'}: ${totalRevenue.toFixed(2)}`);
    
    doc.moveDown(2);
    
    // Добавляем таблицу с подписками
    doc.fontSize(14).text(language === 'ru' ? 'Список подписок' : 'Subscriptions List', { underline: true });
    doc.moveDown();
    
    // Определяем колонки и заголовки
    const headers = language === 'ru' 
      ? ['ID', 'Название', 'Сервис', 'Пользователь', 'Сумма', 'Статус', 'Дата создания']
      : ['ID', 'Title', 'Service', 'User', 'Amount', 'Status', 'Created At'];
    
    let y = doc.y;
    const columnPositions = [50, 100, 200, 300, 400, 450, 500];
    
    // Рисуем заголовки 
    doc.fontSize(10).font('Courier');
    headers.forEach((header, i) => {
      doc.text(header, columnPositions[i], y, { continued: false });
    });
    
    doc.moveDown();
    y = doc.y;
    
    // Рисуем содержимое таблицы
    doc.font('Courier');
    subscriptions.slice(0, 20).forEach((sub) => {
      doc.text(String(sub.id), columnPositions[0], y, { continued: false });
      doc.text(sub.title?.substring(0, 15) || '-', columnPositions[1], y, { continued: false });
      doc.text(sub.serviceName?.substring(0, 15) || '-', columnPositions[2], y, { continued: false });
      doc.text(sub.userEmail?.substring(0, 15) || '-', columnPositions[3], y, { continued: false });
      doc.text(String(sub.paymentAmount || '-'), columnPositions[4], y, { continued: false });
      doc.text(String(sub.status || '-'), columnPositions[5], y, { continued: false });
      
      const createdAt = sub.createdAt ? format(sub.createdAt, 'yyyy-MM-dd') : '-';
      doc.text(createdAt, columnPositions[6], y, { continued: false });
      
      y += 20;
      
      // Если достигли конца страницы, переходим на новую
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
    });
    
    // Если больше 20 подписок, указываем общее количество
    if (subscriptions.length > 20) {
      doc.moveDown();
      doc.text(language === 'ru' 
        ? `... и еще ${subscriptions.length - 20} подписок` 
        : `... and ${subscriptions.length - 20} more subscriptions`
      );
    }
  }
  
  private generateUsersPdfContent(doc: PDFKit.PDFDocument, data: any, language: string) {
    const { users, stats } = data;
    
    // Добавляем общую информацию
    doc.fontSize(14).font('Courier').text(language === 'ru' ? 'Сводка' : 'Summary', { underline: true });
    doc.fontSize(12).text(`${language === 'ru' ? 'Всего пользователей' : 'Total users'}: ${stats.total}`);
    doc.text(`${language === 'ru' ? 'Активных пользователей' : 'Active users'}: ${stats.active}`);
    doc.text(`${language === 'ru' ? 'Новых пользователей' : 'New users'}: ${stats.new}`);
    
    doc.moveDown(2);
    
    // Добавляем таблицу с пользователями
    doc.fontSize(14).text(language === 'ru' ? 'Список пользователей' : 'Users List', { underline: true });
    doc.moveDown();
    
    // Определяем колонки и заголовки
    const headers = language === 'ru' 
      ? ['ID', 'Email', 'Имя', 'Компания', 'Роль', 'Дата регистрации']
      : ['ID', 'Email', 'Name', 'Company', 'Role', 'Registration Date'];
    
    let y = doc.y;
    const columnPositions = [50, 100, 250, 350, 450, 500];
    
    // Рисуем заголовки
    doc.fontSize(10).font('Courier');
    headers.forEach((header, i) => {
      doc.text(header, columnPositions[i], y, { continued: false });
    });
    
    doc.moveDown();
    y = doc.y;
    
    // Рисуем содержимое таблицы
    doc.font('Courier');
    users.slice(0, 20).forEach((user) => {
      doc.text(String(user.id), columnPositions[0], y, { continued: false });
      doc.text(user.email?.substring(0, 25) || '-', columnPositions[1], y, { continued: false });
      doc.text(user.name?.substring(0, 15) || '-', columnPositions[2], y, { continued: false });
      doc.text(user.companyName?.substring(0, 15) || '-', columnPositions[3], y, { continued: false });
      doc.text(String(user.role || '-'), columnPositions[4], y, { continued: false });
      
      const createdAt = user.createdAt ? format(user.createdAt, 'yyyy-MM-dd') : '-';
      doc.text(createdAt, columnPositions[5], y, { continued: false });
      
      y += 20;
      
      // Если достигли конца страницы, переходим на новую
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
    });
    
    // Если больше 20 пользователей, указываем общее количество
    if (users.length > 20) {
      doc.moveDown();
      doc.text(language === 'ru' 
        ? `... и еще ${users.length - 20} пользователей` 
        : `... and ${users.length - 20} more users`
      );
    }
  }
  
  private generateServicesPdfContent(doc: PDFKit.PDFDocument, data: any, language: string) {
    const { services, usage } = data;
    
    // Добавляем общую информацию
    doc.fontSize(14).font('Courier').text(language === 'ru' ? 'Сводка' : 'Summary', { underline: true });
    doc.fontSize(12).text(`${language === 'ru' ? 'Всего сервисов' : 'Total services'}: ${services.length}`);
    
    // Находим самый популярный сервис
    let popularService = { serviceName: '-', count: 0 };
    if (usage.length > 0) {
      popularService = usage.reduce((prev, current) => 
        (current.count > prev.count) ? current : prev, usage[0]);
    }
    
    doc.text(`${language === 'ru' ? 'Самый популярный сервис' : 'Most popular service'}: ${popularService.serviceName} (${popularService.count} ${language === 'ru' ? 'подписок' : 'subscriptions'})`);
    
    doc.moveDown(2);
    
    // Добавляем таблицу с сервисами
    doc.fontSize(14).text(language === 'ru' ? 'Список сервисов' : 'Services List', { underline: true });
    doc.moveDown();
    
    // Определяем колонки и заголовки
    const headers = language === 'ru' 
      ? ['ID', 'Название', 'Кэшбэк', 'Комиссия', 'Подписок', 'Доход']
      : ['ID', 'Title', 'Cashback', 'Commission', 'Subscriptions', 'Revenue'];
    
    let y = doc.y;
    const columnPositions = [50, 100, 300, 380, 460, 520];
    
    // Рисуем заголовки
    doc.fontSize(10).font('Courier');
    headers.forEach((header, i) => {
      doc.text(header, columnPositions[i], y, { continued: false });
    });
    
    doc.moveDown();
    y = doc.y;
    
    // Создаем карту использования сервисов для быстрого доступа
    const usageMap = new Map();
    usage.forEach(item => {
      usageMap.set(item.serviceId, { count: item.count, totalRevenue: item.totalRevenue });
    });
    
    // Рисуем содержимое таблицы
    doc.font('Courier');
    services.forEach((service) => {
      const serviceUsage = usageMap.get(service.id) || { count: 0, totalRevenue: 0 };
      
      doc.text(String(service.id), columnPositions[0], y, { continued: false });
      doc.text(service.title?.substring(0, 30) || '-', columnPositions[1], y, { continued: false });
      doc.text(service.cashback || '-', columnPositions[2], y, { continued: false });
      doc.text(service.commission || '-', columnPositions[3], y, { continued: false });
      doc.text(String(serviceUsage.count || 0), columnPositions[4], y, { continued: false });
      doc.text(String((serviceUsage.totalRevenue || 0).toFixed(2)), columnPositions[5], y, { continued: false });
      
      y += 20;
      
      // Если достигли конца страницы, переходим на новую
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
    });
  }
  
  private generateFinancialPdfContent(doc: PDFKit.PDFDocument, data: any, language: string) {
    const { transactions, summary } = data;
    
    // Добавляем общую информацию
    doc.fontSize(14).text(language === 'ru' ? 'Финансовая сводка' : 'Financial Summary', { underline: true });
    doc.moveDown();
    
    // Показываем финансовый отчет
    doc.fontSize(12);
    doc.text(`${language === 'ru' ? 'Общий доход' : 'Total Revenue'}: ${summary.totalRevenue.toFixed(2)}`);
    doc.text(`${language === 'ru' ? 'Общий кэшбэк' : 'Total Cashback'}: ${summary.totalCashback.toFixed(2)}`);
    doc.text(`${language === 'ru' ? 'Общая комиссия' : 'Total Commission'}: ${summary.totalCommission.toFixed(2)}`);
    doc.text(`${language === 'ru' ? 'Чистый доход' : 'Net Income'}: ${summary.netIncome.toFixed(2)}`);
    
    doc.moveDown(2);
    
    // Добавляем таблицу с транзакциями
    doc.fontSize(14).text(language === 'ru' ? 'Список транзакций' : 'Transactions List', { underline: true });
    doc.moveDown();
    
    // Определяем колонки и заголовки
    const headers = language === 'ru' 
      ? ['ID', 'Подписка', 'Сервис', 'Сумма', 'Кэшбэк', 'Комиссия', 'Дата']
      : ['ID', 'Subscription', 'Service', 'Amount', 'Cashback', 'Commission', 'Date'];
    
    let y = doc.y;
    const columnPositions = [50, 100, 200, 320, 380, 440, 500];
    
    // Рисуем заголовки
    doc.fontSize(10).font('Courier');
    headers.forEach((header, i) => {
      doc.text(header, columnPositions[i], y);
    });
    
    doc.moveDown();
    y = doc.y;
    
    // Рисуем содержимое таблицы
    doc.font('Courier');
    transactions.slice(0, 20).forEach(tr => {
      // Рассчитываем кэшбэк и комиссию
      let cashbackAmount = '-';
      if (tr.cashback) {
        if (tr.cashback.endsWith('%')) {
          const percentage = parseFloat(tr.cashback);
          cashbackAmount = ((tr.paymentAmount || 0) * percentage / 100).toFixed(2);
        } else {
          cashbackAmount = tr.cashback;
        }
      }
      
      let commissionAmount = '-';
      if (tr.commission) {
        if (tr.commission.endsWith('%')) {
          const percentage = parseFloat(tr.commission);
          commissionAmount = ((tr.paymentAmount || 0) * percentage / 100).toFixed(2);
        } else {
          commissionAmount = tr.commission;
        }
      }
      
      doc.text(String(tr.id), columnPositions[0], y);
      doc.text(tr.title?.substring(0, 15) || '-', columnPositions[1], y);
      doc.text(tr.serviceName?.substring(0, 15) || '-', columnPositions[2], y);
      doc.text(String(tr.paymentAmount || '-'), columnPositions[3], y);
      doc.text(cashbackAmount, columnPositions[4], y);
      doc.text(commissionAmount, columnPositions[5], y);
      
      const createdAt = tr.createdAt ? format(tr.createdAt, 'yyyy-MM-dd') : '-';
      doc.text(createdAt, columnPositions[6], y);
      
      y += 20;
      
      // Если достигли конца страницы, переходим на новую
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
    });
    
    // Если больше 20 транзакций, указываем общее количество
    if (transactions.length > 20) {
      doc.moveDown();
      doc.text(language === 'ru' 
        ? `... и еще ${transactions.length - 20} транзакций` 
        : `... and ${transactions.length - 20} more transactions`
      );
    }
  }
  
  private generateTrendsPdfContent(doc: PDFKit.PDFDocument, data: any, language: string) {
    const { subscriptionTrends, userTrends } = data;
    
    // Добавляем заголовок секции
    doc.fontSize(14).text(language === 'ru' ? 'Тренды подписок' : 'Subscription Trends', { underline: true });
    doc.moveDown();
    
    // Выводим таблицу трендов подписок
    let y = doc.y;
    const headers = language === 'ru' 
      ? ['Период', 'Кол-во подписок', 'Доход']
      : ['Period', 'Subscriptions Count', 'Revenue'];
    
    const columnPositions = [100, 300, 450];
    
    // Рисуем заголовки
    doc.fontSize(10).font('Courier');
    headers.forEach((header, i) => {
      doc.text(header, columnPositions[i], y);
    });
    
    doc.moveDown();
    y = doc.y;
    
    // Рисуем содержимое таблицы подписок
    doc.font('Courier');
    subscriptionTrends.forEach(trend => {
      doc.text(trend.month, columnPositions[0], y);
      doc.text(String(trend.count || 0), columnPositions[1], y);
      doc.text(String((trend.revenue || 0).toFixed(2)), columnPositions[2], y);
      
      y += 20;
      
      // Если достигли конца страницы, переходим на новую
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
    });
    
    doc.moveDown(2);
    
    // Добавляем заголовок для пользовательских трендов
    doc.fontSize(14).text(language === 'ru' ? 'Тренды пользователей' : 'User Trends', { underline: true });
    doc.moveDown();
    
    // Выводим таблицу трендов пользователей
    y = doc.y;
    const userHeaders = language === 'ru' 
      ? ['Период', 'Кол-во новых пользователей']
      : ['Period', 'New Users Count'];
    
    const userColumnPositions = [100, 300];
    
    // Рисуем заголовки
    doc.fontSize(10).font('Courier');
    userHeaders.forEach((header, i) => {
      doc.text(header, userColumnPositions[i], y);
    });
    
    doc.moveDown();
    y = doc.y;
    
    // Рисуем содержимое таблицы пользователей
    doc.font('Courier');
    userTrends.forEach(trend => {
      doc.text(trend.month, userColumnPositions[0], y);
      doc.text(String(trend.count || 0), userColumnPositions[1], y);
      
      y += 20;
      
      // Если достигли конца страницы, переходим на новую
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
    });
  }
  
  private async generateExcelReport(data: any, params: ReportParams): Promise<{ fileName: string, filePath: string }> {
    const { reportType, startDate, endDate } = params;
    
    // Создаем имя файла
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    const startDateStr = startDate ? format(startDate, 'yyyy-MM-dd') : '';
    const endDateStr = endDate ? format(endDate, 'yyyy-MM-dd') : '';
    
    const dateRange = startDateStr && endDateStr 
      ? `_${startDateStr}_${endDateStr}` 
      : '';
      
    const fileName = `report_${reportType}${dateRange}_${timestamp}.xlsx`;
    const filePath = path.join(REPORTS_DIR, fileName);
    
    // Создаем новую книгу Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Report Generator';
    workbook.created = new Date();
    
    // Добавляем лист в зависимости от типа отчета
    switch (reportType) {
      case 'subscriptions':
        await this.generateSubscriptionsExcelContent(workbook, data, params.language);
        break;
      case 'users':
        await this.generateUsersExcelContent(workbook, data, params.language);
        break;
      case 'services':
        await this.generateServicesExcelContent(workbook, data, params.language);
        break;
      case 'financial':
        await this.generateFinancialExcelContent(workbook, data, params.language);
        break;
      case 'trends':
        await this.generateTrendsExcelContent(workbook, data, params.language);
        break;
    }
    
    // Сохраняем книгу в файл
    await workbook.xlsx.writeFile(filePath);
    
    // Возвращаем информацию о файле
    return { fileName, filePath };
  }
  
  private async generateSubscriptionsExcelContent(workbook: ExcelJS.Workbook, data: any, language: string = 'en') {
    const { subscriptions, title, generated, params } = data;
    
    // Добавляем лист для общей информации
    const summarySheet = workbook.addWorksheet(language === 'ru' ? 'Сводка' : 'Summary');
    
    // Добавляем заголовок
    summarySheet.getCell('A1').value = title;
    summarySheet.getCell('A1').font = { size: 16, bold: true };
    summarySheet.mergeCells('A1:D1');
    
    // Добавляем информацию о параметрах отчета
    summarySheet.getCell('A3').value = language === 'ru' ? 'Дата создания' : 'Generated on';
    summarySheet.getCell('B3').value = format(generated, 'yyyy-MM-dd HH:mm:ss');
    
    if (params.startDate) {
      summarySheet.getCell('A4').value = language === 'ru' ? 'Начальная дата' : 'Start date';
      summarySheet.getCell('B4').value = format(params.startDate, 'yyyy-MM-dd');
    }
    
    if (params.endDate) {
      summarySheet.getCell('A5').value = language === 'ru' ? 'Конечная дата' : 'End date';
      summarySheet.getCell('B5').value = format(params.endDate, 'yyyy-MM-dd');
    }
    
    // Добавляем сводную информацию
    summarySheet.getCell('A7').value = language === 'ru' ? 'Всего подписок' : 'Total subscriptions';
    summarySheet.getCell('B7').value = subscriptions.length;
    
    const totalRevenue = subscriptions.reduce((sum, sub) => sum + (sub.paymentAmount || 0), 0);
    summarySheet.getCell('A8').value = language === 'ru' ? 'Общая сумма платежей' : 'Total payment amount';
    summarySheet.getCell('B8').value = totalRevenue;
    
    // Добавляем лист с подписками
    const subscriptionsSheet = workbook.addWorksheet(language === 'ru' ? 'Подписки' : 'Subscriptions');
    
    // Определяем заголовки
    const headers = language === 'ru' 
      ? ['ID', 'Название', 'Сервис', 'Пользователь', 'Email', 'Сумма', 'Период', 'Статус', 'Дата создания']
      : ['ID', 'Title', 'Service', 'User', 'Email', 'Amount', 'Period', 'Status', 'Created At'];
    
    // Добавляем заголовки
    subscriptionsSheet.addRow(headers);
    
    // Устанавливаем стиль для заголовков
    subscriptionsSheet.getRow(1).font = { bold: true };
    subscriptionsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Добавляем данные
    subscriptions.forEach(sub => {
      subscriptionsSheet.addRow([
        sub.id,
        sub.title,
        sub.serviceName || '-',
        sub.userName || '-',
        sub.userEmail || '-',
        sub.paymentAmount || 0,
        sub.paymentPeriod || '-',
        sub.status || '-',
        sub.createdAt ? format(sub.createdAt, 'yyyy-MM-dd') : '-'
      ]);
    });
    
    // Автоматически подгоняем ширину колонок
    subscriptionsSheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength < 10 ? 10 : maxLength + 2;
    });
  }
  
  private async generateUsersExcelContent(workbook: ExcelJS.Workbook, data: any, language: string = 'en') {
    const { users, stats, title, generated, params } = data;
    
    // Добавляем лист для общей информации
    const summarySheet = workbook.addWorksheet(language === 'ru' ? 'Сводка' : 'Summary');
    
    // Добавляем заголовок
    summarySheet.getCell('A1').value = title;
    summarySheet.getCell('A1').font = { size: 16, bold: true };
    summarySheet.mergeCells('A1:D1');
    
    // Добавляем информацию о параметрах отчета
    summarySheet.getCell('A3').value = language === 'ru' ? 'Дата создания' : 'Generated on';
    summarySheet.getCell('B3').value = format(generated, 'yyyy-MM-dd HH:mm:ss');
    
    if (params.startDate) {
      summarySheet.getCell('A4').value = language === 'ru' ? 'Начальная дата' : 'Start date';
      summarySheet.getCell('B4').value = format(params.startDate, 'yyyy-MM-dd');
    }
    
    if (params.endDate) {
      summarySheet.getCell('A5').value = language === 'ru' ? 'Конечная дата' : 'End date';
      summarySheet.getCell('B5').value = format(params.endDate, 'yyyy-MM-dd');
    }
    
    // Добавляем сводную информацию
    summarySheet.getCell('A7').value = language === 'ru' ? 'Всего пользователей' : 'Total users';
    summarySheet.getCell('B7').value = stats.total;
    
    summarySheet.getCell('A8').value = language === 'ru' ? 'Активных пользователей' : 'Active users';
    summarySheet.getCell('B8').value = stats.active;
    
    summarySheet.getCell('A9').value = language === 'ru' ? 'Новых пользователей' : 'New users';
    summarySheet.getCell('B9').value = stats.new;
    
    // Добавляем лист с пользователями
    const usersSheet = workbook.addWorksheet(language === 'ru' ? 'Пользователи' : 'Users');
    
    // Определяем заголовки
    const headers = language === 'ru' 
      ? ['ID', 'Email', 'Имя', 'Телефон', 'Компания', 'Роль', 'Активен', 'Дата регистрации']
      : ['ID', 'Email', 'Name', 'Phone', 'Company', 'Role', 'Active', 'Registration Date'];
    
    // Добавляем заголовки
    usersSheet.addRow(headers);
    
    // Устанавливаем стиль для заголовков
    usersSheet.getRow(1).font = { bold: true };
    usersSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Добавляем данные
    users.forEach(user => {
      usersSheet.addRow([
        user.id,
        user.email,
        user.name || '-',
        user.phone || '-',
        user.companyName || '-',
        user.role || '-',
        user.isActive ? (language === 'ru' ? 'Да' : 'Yes') : (language === 'ru' ? 'Нет' : 'No'),
        user.createdAt ? format(user.createdAt, 'yyyy-MM-dd') : '-'
      ]);
    });
    
    // Автоматически подгоняем ширину колонок
    usersSheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength < 10 ? 10 : maxLength + 2;
    });
  }
  
  private async generateServicesExcelContent(workbook: ExcelJS.Workbook, data: any, language: string = 'en') {
    const { services, usage, title, generated, params } = data;
    
    // Добавляем лист для общей информации
    const summarySheet = workbook.addWorksheet(language === 'ru' ? 'Сводка' : 'Summary');
    
    // Добавляем заголовок
    summarySheet.getCell('A1').value = title;
    summarySheet.getCell('A1').font = { size: 16, bold: true };
    summarySheet.mergeCells('A1:D1');
    
    // Добавляем информацию о параметрах отчета
    summarySheet.getCell('A3').value = language === 'ru' ? 'Дата создания' : 'Generated on';
    summarySheet.getCell('B3').value = format(generated, 'yyyy-MM-dd HH:mm:ss');
    
    // Добавляем сводную информацию
    summarySheet.getCell('A5').value = language === 'ru' ? 'Всего сервисов' : 'Total services';
    summarySheet.getCell('B5').value = services.length;
    
    // Находим самый популярный сервис
    let popularService = { serviceName: '-', count: 0 };
    if (usage.length > 0) {
      popularService = usage.reduce((prev, current) => 
        (current.count > prev.count) ? current : prev, usage[0]);
    }
    
    summarySheet.getCell('A6').value = language === 'ru' ? 'Самый популярный сервис' : 'Most popular service';
    summarySheet.getCell('B6').value = `${popularService.serviceName} (${popularService.count} ${language === 'ru' ? 'подписок' : 'subscriptions'})`;
    
    // Добавляем лист с сервисами
    const servicesSheet = workbook.addWorksheet(language === 'ru' ? 'Сервисы' : 'Services');
    
    // Определяем заголовки
    const headers = language === 'ru' 
      ? ['ID', 'Название', 'Описание', 'Кэшбэк', 'Комиссия', 'Активен', 'Кастомный', 'Владелец']
      : ['ID', 'Title', 'Description', 'Cashback', 'Commission', 'Active', 'Custom', 'Owner'];
    
    // Добавляем заголовки
    servicesSheet.addRow(headers);
    
    // Устанавливаем стиль для заголовков
    servicesSheet.getRow(1).font = { bold: true };
    servicesSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Добавляем данные
    services.forEach(service => {
      servicesSheet.addRow([
        service.id,
        service.title,
        service.description || '-',
        service.cashback || '-',
        service.commission || '-',
        service.isActive ? (language === 'ru' ? 'Да' : 'Yes') : (language === 'ru' ? 'Нет' : 'No'),
        service.isCustom ? (language === 'ru' ? 'Да' : 'Yes') : (language === 'ru' ? 'Нет' : 'No'),
        service.ownerId || '-'
      ]);
    });
    
    // Добавляем лист с использованием сервисов
    const usageSheet = workbook.addWorksheet(language === 'ru' ? 'Использование' : 'Usage');
    
    // Определяем заголовки для использования
    const usageHeaders = language === 'ru' 
      ? ['ID сервиса', 'Название сервиса', 'Количество подписок', 'Общий доход']
      : ['Service ID', 'Service Name', 'Subscriptions Count', 'Total Revenue'];
    
    // Добавляем заголовки
    usageSheet.addRow(usageHeaders);
    
    // Устанавливаем стиль для заголовков
    usageSheet.getRow(1).font = { bold: true };
    usageSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Добавляем данные использования
    usage.forEach(item => {
      usageSheet.addRow([
        item.serviceId || '-',
        item.serviceName || '-',
        item.count || 0,
        item.totalRevenue || 0
      ]);
    });
    
    // Автоматически подгоняем ширину колонок для обоих листов
    [servicesSheet, usageSheet].forEach(sheet => {
      sheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = maxLength < 10 ? 10 : maxLength + 2;
      });
    });
  }
  
  private async generateFinancialExcelContent(workbook: ExcelJS.Workbook, data: any, language: string = 'en') {
    const { transactions, summary, title, generated, params } = data;
    
    // Добавляем лист для общей информации
    const summarySheet = workbook.addWorksheet(language === 'ru' ? 'Сводка' : 'Summary');
    
    // Добавляем заголовок
    summarySheet.getCell('A1').value = title;
    summarySheet.getCell('A1').font = { size: 16, bold: true };
    summarySheet.mergeCells('A1:D1');
    
    // Добавляем информацию о параметрах отчета
    summarySheet.getCell('A3').value = language === 'ru' ? 'Дата создания' : 'Generated on';
    summarySheet.getCell('B3').value = format(generated, 'yyyy-MM-dd HH:mm:ss');
    
    if (params.startDate) {
      summarySheet.getCell('A4').value = language === 'ru' ? 'Начальная дата' : 'Start date';
      summarySheet.getCell('B4').value = format(params.startDate, 'yyyy-MM-dd');
    }
    
    if (params.endDate) {
      summarySheet.getCell('A5').value = language === 'ru' ? 'Конечная дата' : 'End date';
      summarySheet.getCell('B5').value = format(params.endDate, 'yyyy-MM-dd');
    }
    
    // Добавляем финансовую сводку
    summarySheet.getCell('A7').value = language === 'ru' ? 'Общий доход' : 'Total Revenue';
    summarySheet.getCell('B7').value = summary.totalRevenue;
    
    summarySheet.getCell('A8').value = language === 'ru' ? 'Общий кэшбэк' : 'Total Cashback';
    summarySheet.getCell('B8').value = summary.totalCashback;
    
    summarySheet.getCell('A9').value = language === 'ru' ? 'Общая комиссия' : 'Total Commission';
    summarySheet.getCell('B9').value = summary.totalCommission;
    
    summarySheet.getCell('A10').value = language === 'ru' ? 'Чистый доход' : 'Net Income';
    summarySheet.getCell('B10').value = summary.netIncome;
    
    // Добавляем лист с транзакциями
    const transactionsSheet = workbook.addWorksheet(language === 'ru' ? 'Транзакции' : 'Transactions');
    
    // Определяем заголовки
    const headers = language === 'ru' 
      ? ['ID', 'Подписка', 'Сервис', 'Сумма', 'Период', 'Кэшбэк', 'Комиссия', 'Дата']
      : ['ID', 'Subscription', 'Service', 'Amount', 'Period', 'Cashback', 'Commission', 'Date'];
    
    // Добавляем заголовки
    transactionsSheet.addRow(headers);
    
    // Устанавливаем стиль для заголовков
    transactionsSheet.getRow(1).font = { bold: true };
    transactionsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Добавляем данные
    transactions.forEach(tr => {
      // Рассчитываем кэшбэк и комиссию
      let cashbackAmount = '-';
      if (tr.cashback) {
        if (tr.cashback.endsWith('%')) {
          const percentage = parseFloat(tr.cashback);
          cashbackAmount = ((tr.paymentAmount || 0) * percentage / 100).toFixed(2);
        } else {
          cashbackAmount = tr.cashback;
        }
      }
      
      let commissionAmount = '-';
      if (tr.commission) {
        if (tr.commission.endsWith('%')) {
          const percentage = parseFloat(tr.commission);
          commissionAmount = ((tr.paymentAmount || 0) * percentage / 100).toFixed(2);
        } else {
          commissionAmount = tr.commission;
        }
      }
      
      transactionsSheet.addRow([
        tr.id,
        tr.title || '-',
        tr.serviceName || '-',
        tr.paymentAmount || 0,
        tr.paymentPeriod || '-',
        cashbackAmount,
        commissionAmount,
        tr.createdAt ? format(tr.createdAt, 'yyyy-MM-dd') : '-'
      ]);
    });
    
    // Автоматически подгоняем ширину колонок
    transactionsSheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength < 10 ? 10 : maxLength + 2;
    });
  }
  
  private async generateTrendsExcelContent(workbook: ExcelJS.Workbook, data: any, language: string = 'en') {
    const { subscriptionTrends, userTrends, title, generated, params } = data;
    
    // Добавляем лист для общей информации
    const summarySheet = workbook.addWorksheet(language === 'ru' ? 'Сводка' : 'Summary');
    
    // Добавляем заголовок
    summarySheet.getCell('A1').value = title;
    summarySheet.getCell('A1').font = { size: 16, bold: true };
    summarySheet.mergeCells('A1:D1');
    
    // Добавляем информацию о параметрах отчета
    summarySheet.getCell('A3').value = language === 'ru' ? 'Дата создания' : 'Generated on';
    summarySheet.getCell('B3').value = format(generated, 'yyyy-MM-dd HH:mm:ss');
    
    // Добавляем лист с трендами подписок
    const subscriptionsSheet = workbook.addWorksheet(language === 'ru' ? 'Тренды подписок' : 'Subscription Trends');
    
    // Определяем заголовки
    const subHeaders = language === 'ru' 
      ? ['Период', 'Количество подписок', 'Доход']
      : ['Period', 'Subscriptions Count', 'Revenue'];
    
    // Добавляем заголовки
    subscriptionsSheet.addRow(subHeaders);
    
    // Устанавливаем стиль для заголовков
    subscriptionsSheet.getRow(1).font = { bold: true };
    subscriptionsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Добавляем данные по трендам подписок
    subscriptionTrends.forEach(trend => {
      subscriptionsSheet.addRow([
        trend.month,
        trend.count || 0,
        trend.revenue || 0
      ]);
    });
    
    // Добавляем лист с трендами пользователей
    const usersSheet = workbook.addWorksheet(language === 'ru' ? 'Тренды пользователей' : 'User Trends');
    
    // Определяем заголовки для трендов пользователей
    const userHeaders = language === 'ru' 
      ? ['Период', 'Количество новых пользователей']
      : ['Period', 'New Users Count'];
    
    // Добавляем заголовки
    usersSheet.addRow(userHeaders);
    
    // Устанавливаем стиль для заголовков
    usersSheet.getRow(1).font = { bold: true };
    usersSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Добавляем данные по трендам пользователей
    userTrends.forEach(trend => {
      usersSheet.addRow([
        trend.month,
        trend.count || 0
      ]);
    });
    
    // Автоматически подгоняем ширину колонок для обоих листов
    [subscriptionsSheet, usersSheet].forEach(sheet => {
      sheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = maxLength < 10 ? 10 : maxLength + 2;
      });
    });
  }
  
  private async generateCsvReport(data: any, params: ReportParams): Promise<{ fileName: string, filePath: string }> {
    const { reportType, startDate, endDate } = params;
    
    // Создаем имя файла
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    const startDateStr = startDate ? format(startDate, 'yyyy-MM-dd') : '';
    const endDateStr = endDate ? format(endDate, 'yyyy-MM-dd') : '';
    
    const dateRange = startDateStr && endDateStr 
      ? `_${startDateStr}_${endDateStr}` 
      : '';
      
    const fileName = `report_${reportType}${dateRange}_${timestamp}.csv`;
    const filePath = path.join(REPORTS_DIR, fileName);
    
    // Данные для CSV в зависимости от типа отчета
    let csvContent = '';
    const language = params.language || 'en';
    
    switch (reportType) {
      case 'subscriptions':
        csvContent = this.generateSubscriptionsCsvContent(data, language);
        break;
      case 'users':
        csvContent = this.generateUsersCsvContent(data, language);
        break;
      case 'services':
        csvContent = this.generateServicesCsvContent(data, language);
        break;
      case 'financial':
        csvContent = this.generateFinancialCsvContent(data, language);
        break;
      case 'trends':
        csvContent = this.generateTrendsCsvContent(data, language);
        break;
    }
    
    // Записываем CSV в файл
    fs.writeFileSync(filePath, csvContent);
    
    // Возвращаем информацию о файле
    return { fileName, filePath };
  }
  
  private generateSubscriptionsCsvContent(data: any, language: string): string {
    const { subscriptions } = data;
    
    // Формируем заголовки
    const headers = language === 'ru' 
      ? ['ID', 'Название', 'Сервис', 'Пользователь', 'Email', 'Сумма', 'Период', 'Статус', 'Дата создания']
      : ['ID', 'Title', 'Service', 'User', 'Email', 'Amount', 'Period', 'Status', 'Created At'];
    
    let csv = headers.join(',') + '\n';
    
    // Формируем строки для каждой подписки
    subscriptions.forEach(sub => {
      const row = [
        sub.id,
        `"${(sub.title || '').replace(/"/g, '""')}"`, // Экранируем кавычки в CSV
        `"${(sub.serviceName || '-').replace(/"/g, '""')}"`,
        `"${(sub.userName || '-').replace(/"/g, '""')}"`,
        `"${(sub.userEmail || '-').replace(/"/g, '""')}"`,
        sub.paymentAmount || 0,
        `"${(sub.paymentPeriod || '-').replace(/"/g, '""')}"`,
        `"${(sub.status || '-').replace(/"/g, '""')}"`,
        sub.createdAt ? format(sub.createdAt, 'yyyy-MM-dd') : '-'
      ];
      
      csv += row.join(',') + '\n';
    });
    
    return csv;
  }
  
  private generateUsersCsvContent(data: any, language: string): string {
    const { users } = data;
    
    // Формируем заголовки
    const headers = language === 'ru' 
      ? ['ID', 'Email', 'Имя', 'Телефон', 'Компания', 'Роль', 'Активен', 'Дата регистрации']
      : ['ID', 'Email', 'Name', 'Phone', 'Company', 'Role', 'Active', 'Registration Date'];
    
    let csv = headers.join(',') + '\n';
    
    // Формируем строки для каждого пользователя
    users.forEach(user => {
      const row = [
        user.id,
        `"${(user.email || '').replace(/"/g, '""')}"`,
        `"${(user.name || '-').replace(/"/g, '""')}"`,
        `"${(user.phone || '-').replace(/"/g, '""')}"`,
        `"${(user.companyName || '-').replace(/"/g, '""')}"`,
        `"${(user.role || '-').replace(/"/g, '""')}"`,
        user.isActive ? (language === 'ru' ? 'Да' : 'Yes') : (language === 'ru' ? 'Нет' : 'No'),
        user.createdAt ? format(user.createdAt, 'yyyy-MM-dd') : '-'
      ];
      
      csv += row.join(',') + '\n';
    });
    
    return csv;
  }
  
  private generateServicesCsvContent(data: any, language: string): string {
    const { services, usage } = data;
    
    // Создаем карту для быстрого доступа к использованию сервисов
    const usageMap = new Map();
    usage.forEach(item => {
      usageMap.set(item.serviceId, { count: item.count, totalRevenue: item.totalRevenue });
    });
    
    // Формируем заголовки
    const headers = language === 'ru' 
      ? ['ID', 'Название', 'Описание', 'Кэшбэк', 'Комиссия', 'Активен', 'Кастомный', 'Подписок', 'Доход']
      : ['ID', 'Title', 'Description', 'Cashback', 'Commission', 'Active', 'Custom', 'Subscriptions', 'Revenue'];
    
    let csv = headers.join(',') + '\n';
    
    // Формируем строки для каждого сервиса
    services.forEach(service => {
      const serviceUsage = usageMap.get(service.id) || { count: 0, totalRevenue: 0 };
      
      const row = [
        service.id,
        `"${(service.title || '').replace(/"/g, '""')}"`,
        `"${(service.description || '-').replace(/"/g, '""')}"`,
        `"${(service.cashback || '-').replace(/"/g, '""')}"`,
        `"${(service.commission || '-').replace(/"/g, '""')}"`,
        service.isActive ? (language === 'ru' ? 'Да' : 'Yes') : (language === 'ru' ? 'Нет' : 'No'),
        service.isCustom ? (language === 'ru' ? 'Да' : 'Yes') : (language === 'ru' ? 'Нет' : 'No'),
        serviceUsage.count || 0,
        serviceUsage.totalRevenue || 0
      ];
      
      csv += row.join(',') + '\n';
    });
    
    return csv;
  }
  
  private generateFinancialCsvContent(data: any, language: string): string {
    const { transactions, summary } = data;
    
    // Формируем заголовки
    const headers = language === 'ru' 
      ? ['ID', 'Подписка', 'Сервис', 'Сумма', 'Период', 'Кэшбэк', 'Комиссия', 'Дата']
      : ['ID', 'Subscription', 'Service', 'Amount', 'Period', 'Cashback', 'Commission', 'Date'];
    
    let csv = headers.join(',') + '\n';
    
    // Формируем строки для каждой финансовой транзакции
    transactions.forEach(tr => {
      // Рассчитываем кэшбэк и комиссию
      let cashbackAmount = '-';
      if (tr.cashback) {
        if (tr.cashback.endsWith('%')) {
          const percentage = parseFloat(tr.cashback);
          cashbackAmount = ((tr.paymentAmount || 0) * percentage / 100).toFixed(2);
        } else {
          cashbackAmount = tr.cashback;
        }
      }
      
      let commissionAmount = '-';
      if (tr.commission) {
        if (tr.commission.endsWith('%')) {
          const percentage = parseFloat(tr.commission);
          commissionAmount = ((tr.paymentAmount || 0) * percentage / 100).toFixed(2);
        } else {
          commissionAmount = tr.commission;
        }
      }
      
      const row = [
        tr.id,
        `"${(tr.title || '-').replace(/"/g, '""')}"`,
        `"${(tr.serviceName || '-').replace(/"/g, '""')}"`,
        tr.paymentAmount || 0,
        `"${(tr.paymentPeriod || '-').replace(/"/g, '""')}"`,
        cashbackAmount,
        commissionAmount,
        tr.createdAt ? format(tr.createdAt, 'yyyy-MM-dd') : '-'
      ];
      
      csv += row.join(',') + '\n';
    });
    
    // Добавляем итоговые значения
    csv += '\n';
    csv += language === 'ru' ? 'Общий доход' : 'Total Revenue';
    csv += ',' + summary.totalRevenue.toFixed(2) + '\n';
    
    csv += language === 'ru' ? 'Общий кэшбэк' : 'Total Cashback';
    csv += ',' + summary.totalCashback.toFixed(2) + '\n';
    
    csv += language === 'ru' ? 'Общая комиссия' : 'Total Commission';
    csv += ',' + summary.totalCommission.toFixed(2) + '\n';
    
    csv += language === 'ru' ? 'Чистый доход' : 'Net Income';
    csv += ',' + summary.netIncome.toFixed(2) + '\n';
    
    return csv;
  }
  
  private generateTrendsCsvContent(data: any, language: string): string {
    const { subscriptionTrends, userTrends } = data;
    
    let csv = '';
    
    // Формируем заголовки для трендов подписок
    const subHeaders = language === 'ru' 
      ? ['Период', 'Количество подписок', 'Доход']
      : ['Period', 'Subscriptions Count', 'Revenue'];
    
    csv += language === 'ru' ? '# Тренды подписок\n' : '# Subscription Trends\n';
    csv += subHeaders.join(',') + '\n';
    
    // Формируем строки для каждого периода подписок
    subscriptionTrends.forEach(trend => {
      const row = [
        trend.month,
        trend.count || 0,
        trend.revenue || 0
      ];
      
      csv += row.join(',') + '\n';
    });
    
    // Добавляем пустую строку-разделитель
    csv += '\n';
    
    // Формируем заголовки для трендов пользователей
    const userHeaders = language === 'ru' 
      ? ['Период', 'Количество новых пользователей']
      : ['Period', 'New Users Count'];
    
    csv += language === 'ru' ? '# Тренды пользователей\n' : '# User Trends\n';
    csv += userHeaders.join(',') + '\n';
    
    // Формируем строки для каждого периода регистрации пользователей
    userTrends.forEach(trend => {
      const row = [
        trend.month,
        trend.count || 0
      ];
      
      csv += row.join(',') + '\n';
    });
    
    return csv;
  }
}

// Экспортируем экземпляр сервиса
export const reportService = new ReportService();