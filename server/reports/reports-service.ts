// Импортируем pdfkit для генерации PDF-отчетов
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
    const dateFilter: any = {};
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
        let filteredQuery = subscriptionsQuery;
        if (startDate) {
          filteredQuery = filteredQuery.where(gt(subscriptions.createdAt, startDate));
        }
        if (endDate) {
          filteredQuery = filteredQuery.where(lt(subscriptions.createdAt, endDate));
        }
        
        return {
          subscriptions: await filteredQuery.orderBy(desc(subscriptions.createdAt)),
          title: params.language === 'ru' ? 'Отчет по подпискам' : 'Subscriptions Report',
          generated: new Date(),
          params
        };
        
      case 'users':
        // Получаем данные о пользователях
        let usersQuery = db.select().from(users);
        
        // Применяем фильтр по дате, если указан
        let filteredUsersQuery = usersQuery;
        if (startDate) {
          filteredUsersQuery = filteredUsersQuery.where(gt(users.createdAt, startDate));
        }
        if (endDate) {
          filteredUsersQuery = filteredUsersQuery.where(lt(users.createdAt, endDate));
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
          users: await filteredUsersQuery.orderBy(desc(users.createdAt)),
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
      size: 'A4',
      info: {
        Title: data.title,
        Author: 'Subscription Management System',
        Subject: `${reportType} report`,
        Keywords: 'report,subscription,management',
        CreationDate: new Date()
      }
    });
    
    // Регистрируем стандартный шрифт для документа с поддержкой кириллицы
    // Используем стандартный шрифт Helvetica, который поддерживает базовые символы ASCII
    
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);
    
    // Простой способ обеспечить поддержку кириллицы - все строки переводим в простой ASCII
    // Это не идеально, но обеспечит читаемость
    const transliterateRu = (text: string): string => {
      const ruToLat: Record<string, string> = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh',
        'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
        'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
        'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
        'я': 'ya',
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E', 'Ж': 'ZH',
        'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
        'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'KH', 'Ц': 'TS',
        'Ч': 'CH', 'Ш': 'SH', 'Щ': 'SCH', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'YU',
        'Я': 'YA'
      };
      
      return text.split('').map(char => ruToLat[char] || char).join('');
    };
    
    // Вспомогательная функция для добавления текста с транслитерацией, если необходимо
    const addText = (text: string, options?: any) => {
      if (language === 'ru') {
        doc.text(transliterateRu(text), options);
      } else {
        doc.text(text, options);
      }
    };
    
    // Добавляем заголовок
    doc.fontSize(20);
    addText(data.title, { align: 'center' });
    doc.moveDown();
    
    // Добавляем информацию о параметрах отчета
    const dateFormat = language === 'ru' ? 'dd MMMM yyyy' : 'MMM dd, yyyy';
    const dateOptions = language === 'ru' ? { locale: ru } : undefined;
    
    doc.fontSize(12);
    addText(`${language === 'ru' ? 'Дата создания' : 'Generated on'}: ${format(data.generated, dateFormat, dateOptions)}`);
    
    if (startDate) {
      addText(`${language === 'ru' ? 'Начальная дата' : 'Start date'}: ${format(startDate, dateFormat, dateOptions)}`);
    }
    
    if (endDate) {
      addText(`${language === 'ru' ? 'Конечная дата' : 'End date'}: ${format(endDate, dateFormat, dateOptions)}`);
    }
    
    doc.moveDown(2);
    
    // Создаем новый объект данных, который включает функцию транслитерации для 
    // использования в методах генерации контента
    const extendedData = {
      ...data,
      _helpers: {
        addText
      }
    };
    
    // Генерируем содержимое отчета в зависимости от типа
    switch (reportType) {
      case 'subscriptions':
        this.generateSubscriptionsPdfContent(doc, extendedData, language);
        break;
      case 'users':
        this.generateUsersPdfContent(doc, extendedData, language);
        break;
      case 'services':
        this.generateServicesPdfContent(doc, extendedData, language);
        break;
      case 'financial':
        this.generateFinancialPdfContent(doc, extendedData, language);
        break;
      case 'trends':
        this.generateTrendsPdfContent(doc, extendedData, language);
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
  
  private async generateExcelReport(data: any, params: ReportParams): Promise<{ fileName: string, filePath: string }> {
    const { reportType, startDate, endDate, language = 'en' } = params;
    
    // Создаем имя файла
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    const startDateStr = startDate ? format(startDate, 'yyyy-MM-dd') : '';
    const endDateStr = endDate ? format(endDate, 'yyyy-MM-dd') : '';
    
    const dateRange = startDateStr && endDateStr 
      ? `_${startDateStr}_${endDateStr}` 
      : '';
    
    const fileName = `report_${reportType}${dateRange}_${timestamp}.xlsx`;
    const filePath = path.join(REPORTS_DIR, fileName);
    
    // Создаем Excel документ
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Subscription Management System';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Наполняем документ данными в зависимости от типа отчета
    switch (reportType) {
      case 'subscriptions':
        this.generateSubscriptionsExcel(workbook, data, language);
        break;
      case 'users':
        this.generateUsersExcel(workbook, data, language);
        break;
      case 'services':
        this.generateServicesExcel(workbook, data, language);
        break;
      case 'financial':
        this.generateFinancialExcel(workbook, data, language);
        break;
      case 'trends':
        this.generateTrendsExcel(workbook, data, language);
        break;
    }
    
    // Сохраняем документ
    await workbook.xlsx.writeFile(filePath);
    
    return { fileName, filePath };
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
    
    // Пока реализуем CSV как Excel и конвертируем его
    const workbook = new ExcelJS.Workbook();
    
    // Наполняем документ данными в зависимости от типа отчета
    switch (reportType) {
      case 'subscriptions':
        this.generateSubscriptionsExcel(workbook, data, params.language || 'en');
        break;
      case 'users':
        this.generateUsersExcel(workbook, data, params.language || 'en');
        break;
      case 'services':
        this.generateServicesExcel(workbook, data, params.language || 'en');
        break;
      case 'financial':
        this.generateFinancialExcel(workbook, data, params.language || 'en');
        break;
      case 'trends':
        this.generateTrendsExcel(workbook, data, params.language || 'en');
        break;
    }
    
    // Берем первый лист и сохраняем как CSV
    const worksheet = workbook.getWorksheet(1);
    
    if (!worksheet) {
      throw new Error('No worksheet found');
    }
    
    // Получаем содержимое CSV
    let csv = '';
    
    // Добавляем строки в CSV
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      const rowValues: string[] = [];
      row.eachCell({ includeEmpty: true }, (cell) => {
        rowValues.push(String(cell.value !== null ? cell.value : ''));
      });
      csv += rowValues.join(',') + '\n';
    });
    
    // Записываем CSV в файл
    fs.writeFileSync(filePath, csv);
    
    return { fileName, filePath };
  }
  
  private createPdfDocDefinition(data: any, params: ReportParams): any {
    const { reportType, startDate, endDate, language = 'en' } = params;
    const dateFormat = language === 'ru' ? 'dd MMMM yyyy' : 'MMM dd, yyyy';
    const dateOptions = language === 'ru' ? { locale: ru } : undefined;
    
    // Базовая структура документа
    const docDefinition: any = {
      content: [
        { text: data.title, style: 'header', alignment: 'center' },
        { text: `${language === 'ru' ? 'Дата создания' : 'Generated on'}: ${format(data.generated, dateFormat, dateOptions)}`, style: 'subheader' }
      ],
      styles: {
        header: {
          fontSize: 20,
          bold: true,
          margin: [0, 0, 0, 10]
        },
        subheader: {
          fontSize: 14,
          bold: true,
          margin: [0, 10, 0, 5]
        },
        tableHeader: {
          bold: true,
          fontSize: 12,
          color: 'black'
        },
        tableCell: {
          fontSize: 10
        },
        summarySection: {
          fontSize: 14,
          bold: true,
          decoration: 'underline',
          margin: [0, 20, 0, 10]
        }
      },
      defaultStyle: {
        font: 'Roboto' // pdfmake имеет встроенный Roboto с поддержкой кириллицы
      }
    };
    
    // Добавляем даты диапазона, если они указаны
    if (startDate) {
      docDefinition.content.push({ 
        text: `${language === 'ru' ? 'Начальная дата' : 'Start date'}: ${format(startDate, dateFormat, dateOptions)}`,
        style: 'subheader' 
      });
    }
    
    if (endDate) {
      docDefinition.content.push({ 
        text: `${language === 'ru' ? 'Конечная дата' : 'End date'}: ${format(endDate, dateFormat, dateOptions)}`,
        style: 'subheader' 
      });
    }
    
    // Данный метод больше не используется, все генерации PDF делаются через прямые методы
    return {};
  }
  
  private generateSubscriptionsPdfContent(doc: any, data: any, language: string) {
    const { subscriptions, _helpers } = data;
    const addText = _helpers?.addText || ((text: string, options?: any) => doc.text(text, options));
    
    // Добавляем общую информацию
    doc.fontSize(14);
    addText(language === 'ru' ? 'Сводка' : 'Summary', { underline: true });
    
    doc.fontSize(12);
    addText(`${language === 'ru' ? 'Всего подписок' : 'Total subscriptions'}: ${subscriptions.length}`);
    
    // Вычисляем общую сумму подписок
    const totalRevenue = subscriptions.reduce((sum, sub) => sum + (sub.paymentAmount || 0), 0);
    addText(`${language === 'ru' ? 'Общая сумма платежей' : 'Total payment amount'}: ${totalRevenue.toFixed(2)}`);
    
    doc.moveDown(2);
    
    // Добавляем таблицу с подписками
    doc.fontSize(14);
    addText(language === 'ru' ? 'Список подписок' : 'Subscriptions List', { underline: true });
    doc.moveDown();
    
    // Определяем колонки и заголовки
    const headers = language === 'ru' 
      ? ['ID', 'Название', 'Сервис', 'Пользователь', 'Сумма', 'Статус', 'Дата создания']
      : ['ID', 'Title', 'Service', 'User', 'Amount', 'Status', 'Created At'];
    
    let y = doc.y;
    const columnPositions = [50, 100, 200, 300, 400, 450, 500];
    
    // Рисуем заголовки 
    doc.fontSize(10);
    headers.forEach((header, i) => {
      addText(header, { continued: false, lineBreak: false });
      
      // Вручную позиционируем текст в колонках
      if (i < headers.length - 1) {
        doc.moveUp();
        doc.x = columnPositions[i + 1];
      }
    });
    
    doc.moveDown();
    y = doc.y;
    
    // Рисуем содержимое таблицы
    subscriptions.slice(0, 20).forEach((sub) => {
      // Первая колонка - ID
      doc.x = columnPositions[0];
      addText(String(sub.id), { continued: false, lineBreak: false });
      
      // Вторая колонка - Название
      doc.moveUp();
      doc.x = columnPositions[1];
      addText(sub.title?.substring(0, 15) || '-', { continued: false, lineBreak: false });
      
      // Третья колонка - Сервис
      doc.moveUp();
      doc.x = columnPositions[2];
      addText(sub.serviceName?.substring(0, 15) || '-', { continued: false, lineBreak: false });
      
      // Четвертая колонка - Пользователь
      doc.moveUp();
      doc.x = columnPositions[3];
      addText(sub.userEmail?.substring(0, 15) || '-', { continued: false, lineBreak: false });
      
      // Пятая колонка - Сумма
      doc.moveUp();
      doc.x = columnPositions[4];
      addText(String(sub.paymentAmount || '-'), { continued: false, lineBreak: false });
      
      // Шестая колонка - Статус
      doc.moveUp();
      doc.x = columnPositions[5];
      addText(String(sub.status || '-'), { continued: false, lineBreak: false });
      
      // Седьмая колонка - Дата создания
      doc.moveUp();
      doc.x = columnPositions[6];
      const createdAt = sub.createdAt ? format(sub.createdAt, 'yyyy-MM-dd') : '-';
      addText(createdAt, { continued: false });
      
      // Если достигли конца страницы, переходим на новую
      if (doc.y > 700) {
        doc.addPage();
        doc.y = 50;
      }
    });
    
    // Если больше 20 подписок, указываем общее количество
    if (subscriptions.length > 20) {
      doc.moveDown();
      addText(language === 'ru' 
        ? `... и еще ${subscriptions.length - 20} подписок` 
        : `... and ${subscriptions.length - 20} more subscriptions`
      );
    }
  }
  
  private generateUsersPdfContent(doc: any, data: any, language: string) {
    const { users, stats, _helpers } = data;
    const addText = _helpers?.addText || ((text: string, options?: any) => doc.text(text, options));
    
    // Добавляем общую информацию
    doc.fontSize(14);
    addText(language === 'ru' ? 'Сводка' : 'Summary', { underline: true });
    
    doc.fontSize(12);
    addText(`${language === 'ru' ? 'Всего пользователей' : 'Total users'}: ${stats.total}`);
    addText(`${language === 'ru' ? 'Активных пользователей' : 'Active users'}: ${stats.active}`);
    addText(`${language === 'ru' ? 'Новых пользователей' : 'New users'}: ${stats.new}`);
    
    doc.moveDown(2);
    
    // Добавляем таблицу с пользователями
    doc.fontSize(14);
    addText(language === 'ru' ? 'Список пользователей' : 'Users List', { underline: true });
    doc.moveDown();
    
    // Определяем колонки и заголовки
    const headers = language === 'ru' 
      ? ['ID', 'Email', 'Имя', 'Компания', 'Роль', 'Дата регистрации']
      : ['ID', 'Email', 'Name', 'Company', 'Role', 'Registration Date'];
    
    const columnPositions = [50, 100, 250, 350, 450, 500];
    
    // Рисуем заголовки
    doc.fontSize(10);
    headers.forEach((header, i) => {
      addText(header, { continued: false, lineBreak: false });
      
      // Вручную позиционируем текст в колонках
      if (i < headers.length - 1) {
        doc.moveUp();
        doc.x = columnPositions[i + 1];
      }
    });
    
    doc.moveDown();
    
    // Рисуем содержимое таблицы
    users.slice(0, 20).forEach((user) => {
      // Первая колонка - ID
      doc.x = columnPositions[0];
      addText(String(user.id), { continued: false, lineBreak: false });
      
      // Вторая колонка - Email
      doc.moveUp();
      doc.x = columnPositions[1];
      addText(user.email?.substring(0, 25) || '-', { continued: false, lineBreak: false });
      
      // Третья колонка - Имя
      doc.moveUp();
      doc.x = columnPositions[2];
      addText(user.name?.substring(0, 15) || '-', { continued: false, lineBreak: false });
      
      // Четвертая колонка - Компания
      doc.moveUp();
      doc.x = columnPositions[3];
      addText(user.companyName?.substring(0, 15) || '-', { continued: false, lineBreak: false });
      
      // Пятая колонка - Роль
      doc.moveUp();
      doc.x = columnPositions[4];
      addText(String(user.role || '-'), { continued: false, lineBreak: false });
      
      // Шестая колонка - Дата регистрации
      doc.moveUp();
      doc.x = columnPositions[5];
      const createdAt = user.createdAt ? format(user.createdAt, 'yyyy-MM-dd') : '-';
      addText(createdAt, { continued: false });
      
      // Если достигли конца страницы, переходим на новую
      if (doc.y > 700) {
        doc.addPage();
        doc.y = 50;
      }
    });
    
    // Если больше 20 пользователей, указываем общее количество
    if (users.length > 20) {
      doc.moveDown();
      addText(language === 'ru' 
        ? `... и еще ${users.length - 20} пользователей` 
        : `... and ${users.length - 20} more users`
      );
    }
  }
  
  private generateServicesPdfContent(doc: any, data: any, language: string) {
    const { services, usage, _helpers } = data;
    const addText = _helpers?.addText || ((text: string, options?: any) => doc.text(text, options));
    
    // Добавляем общую информацию
    doc.fontSize(14);
    addText(language === 'ru' ? 'Сводка' : 'Summary', { underline: true });
    
    doc.fontSize(12);
    addText(`${language === 'ru' ? 'Всего сервисов' : 'Total services'}: ${services.length}`);
    
    // Находим самый популярный сервис
    let popularService = { serviceName: '-', count: 0 };
    if (usage.length > 0) {
      popularService = usage.reduce((prev, current) => 
        (current.count > prev.count) ? current : prev, usage[0]);
    }
    
    addText(`${language === 'ru' ? 'Самый популярный сервис' : 'Most popular service'}: ${popularService.serviceName} (${popularService.count} ${language === 'ru' ? 'подписок' : 'subscriptions'})`);
    
    doc.moveDown(2);
    
    // Добавляем таблицу с сервисами
    doc.fontSize(14);
    addText(language === 'ru' ? 'Список сервисов' : 'Services List', { underline: true });
    doc.moveDown();
    
    // Определяем колонки и заголовки
    const headers = language === 'ru' 
      ? ['ID', 'Название', 'Кэшбэк', 'Комиссия', 'Подписок', 'Доход']
      : ['ID', 'Title', 'Cashback', 'Commission', 'Subscriptions', 'Revenue'];
    
    const columnPositions = [50, 100, 300, 380, 460, 520];
    
    // Рисуем заголовки
    doc.fontSize(10);
    headers.forEach((header, i) => {
      addText(header, { continued: false, lineBreak: false });
      
      // Вручную позиционируем текст в колонках
      if (i < headers.length - 1) {
        doc.moveUp();
        doc.x = columnPositions[i + 1];
      }
    });
    
    doc.moveDown();
    
    // Создаем карту использования сервисов для быстрого доступа
    const usageMap = new Map();
    usage.forEach(item => {
      usageMap.set(item.serviceId, { count: item.count, totalRevenue: item.totalRevenue });
    });
    
    // Рисуем содержимое таблицы
    services.forEach((service) => {
      const serviceUsage = usageMap.get(service.id) || { count: 0, totalRevenue: 0 };
      
      // Первая колонка - ID
      doc.x = columnPositions[0];
      addText(String(service.id), { continued: false, lineBreak: false });
      
      // Вторая колонка - Название
      doc.moveUp();
      doc.x = columnPositions[1];
      addText(service.title?.substring(0, 30) || '-', { continued: false, lineBreak: false });
      
      // Третья колонка - Кэшбэк
      doc.moveUp();
      doc.x = columnPositions[2];
      addText(service.cashback || '-', { continued: false, lineBreak: false });
      
      // Четвертая колонка - Комиссия
      doc.moveUp();
      doc.x = columnPositions[3];
      addText(service.commission || '-', { continued: false, lineBreak: false });
      
      // Пятая колонка - Подписок
      doc.moveUp();
      doc.x = columnPositions[4];
      addText(String(serviceUsage.count || 0), { continued: false, lineBreak: false });
      
      // Шестая колонка - Доход
      doc.moveUp();
      doc.x = columnPositions[5];
      addText(String((serviceUsage.totalRevenue || 0).toFixed(2)), { continued: false });
      
      // Если достигли конца страницы, переходим на новую
      if (doc.y > 700) {
        doc.addPage();
        doc.y = 50;
      }
    });
  }
  
  private generateFinancialPdfContent(doc: any, data: any, language: string) {
    const { transactions, summary, _helpers } = data;
    const addText = _helpers?.addText || ((text: string, options?: any) => doc.text(text, options));
    
    // Добавляем финансовую сводку
    doc.fontSize(14);
    addText(language === 'ru' ? 'Финансовая сводка' : 'Financial Summary', { underline: true });
    doc.moveDown();
    
    // Показываем финансовый отчет
    doc.fontSize(12);
    addText(`${language === 'ru' ? 'Общий доход' : 'Total Revenue'}: ${summary.totalRevenue.toFixed(2)}`);
    addText(`${language === 'ru' ? 'Общий кэшбэк' : 'Total Cashback'}: ${summary.totalCashback.toFixed(2)}`);
    addText(`${language === 'ru' ? 'Общая комиссия' : 'Total Commission'}: ${summary.totalCommission.toFixed(2)}`);
    addText(`${language === 'ru' ? 'Чистый доход' : 'Net Income'}: ${summary.netIncome.toFixed(2)}`);
    
    doc.moveDown(2);
    
    // Добавляем список транзакций
    doc.fontSize(14);
    addText(language === 'ru' ? 'Список транзакций' : 'Transactions List', { underline: true });
    doc.moveDown();
    
    // Определяем колонки и заголовки
    const headers = language === 'ru' 
      ? ['ID', 'Подписка', 'Сервис', 'Сумма', 'Кэшбэк', 'Комиссия', 'Дата']
      : ['ID', 'Subscription', 'Service', 'Amount', 'Cashback', 'Commission', 'Date'];
    
    const columnPositions = [50, 100, 180, 260, 320, 380, 460];
    
    // Рисуем заголовки
    doc.fontSize(10);
    headers.forEach((header, i) => {
      addText(header, { continued: false, lineBreak: false });
      
      // Вручную позиционируем текст в колонках
      if (i < headers.length - 1) {
        doc.moveUp();
        doc.x = columnPositions[i + 1];
      }
    });
    
    doc.moveDown();
    
    // Рисуем содержимое таблицы
    transactions.slice(0, 20).forEach((tr) => {
      const createdAt = tr.createdAt ? format(tr.createdAt, 'yyyy-MM-dd') : '-';
      
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
      
      // Первая колонка - ID
      doc.x = columnPositions[0];
      addText(String(tr.id), { continued: false, lineBreak: false });
      
      // Вторая колонка - Подписка
      doc.moveUp();
      doc.x = columnPositions[1];
      addText(tr.title?.substring(0, 15) || '-', { continued: false, lineBreak: false });
      
      // Третья колонка - Сервис
      doc.moveUp();
      doc.x = columnPositions[2];
      addText(tr.serviceName?.substring(0, 15) || '-', { continued: false, lineBreak: false });
      
      // Четвертая колонка - Сумма
      doc.moveUp();
      doc.x = columnPositions[3];
      addText(String(tr.paymentAmount || '-'), { continued: false, lineBreak: false });
      
      // Пятая колонка - Кэшбэк
      doc.moveUp();
      doc.x = columnPositions[4];
      addText(cashbackAmount, { continued: false, lineBreak: false });
      
      // Шестая колонка - Комиссия
      doc.moveUp();
      doc.x = columnPositions[5];
      addText(commissionAmount, { continued: false, lineBreak: false });
      
      // Седьмая колонка - Дата
      doc.moveUp();
      doc.x = columnPositions[6];
      addText(createdAt, { continued: false });
      
      // Если достигли конца страницы, переходим на новую
      if (doc.y > 700) {
        doc.addPage();
        doc.y = 50;
      }
    });
    
    // Если больше 20 транзакций, указываем общее количество
    if (transactions.length > 20) {
      doc.moveDown();
      addText(language === 'ru' 
        ? `... и еще ${transactions.length - 20} транзакций` 
        : `... and ${transactions.length - 20} more transactions`
      );
    }
  }
  
  private generateTrendsPdfContent(doc: any, data: any, language: string) {
    const { subscriptionTrends, userTrends, _helpers } = data;
    const addText = _helpers?.addText || ((text: string, options?: any) => doc.text(text, options));
    
    // Добавляем тренды подписок
    doc.fontSize(14);
    addText(language === 'ru' ? 'Тренды подписок' : 'Subscription Trends', { underline: true });
    doc.moveDown();
    
    // Определяем колонки и заголовки для подписок
    const subsHeaders = language === 'ru' 
      ? ['Месяц', 'Количество', 'Сумма']
      : ['Month', 'Count', 'Revenue'];
    
    const subsColumnPositions = [50, 200, 350];
    
    // Рисуем заголовки
    doc.fontSize(10);
    subsHeaders.forEach((header, i) => {
      addText(header, { continued: false, lineBreak: false });
      
      // Вручную позиционируем текст в колонках
      if (i < subsHeaders.length - 1) {
        doc.moveUp();
        doc.x = subsColumnPositions[i + 1];
      }
    });
    
    doc.moveDown();
    
    // Рисуем содержимое таблицы подписок
    subscriptionTrends.forEach((trend) => {
      // Первая колонка - Месяц
      doc.x = subsColumnPositions[0];
      addText(trend.month, { continued: false, lineBreak: false });
      
      // Вторая колонка - Количество
      doc.moveUp();
      doc.x = subsColumnPositions[1];
      addText(String(trend.count), { continued: false, lineBreak: false });
      
      // Третья колонка - Сумма
      doc.moveUp();
      doc.x = subsColumnPositions[2];
      addText(String((trend.revenue || 0).toFixed(2)), { continued: false });
      
      // Если достигли конца страницы, переходим на новую
      if (doc.y > 700) {
        doc.addPage();
        doc.y = 50;
      }
    });
    
    doc.moveDown(2);
    
    // Добавляем тренды пользователей
    doc.fontSize(14);
    addText(language === 'ru' ? 'Тренды пользователей' : 'User Trends', { underline: true });
    doc.moveDown();
    
    // Определяем колонки и заголовки для пользователей
    const usersHeaders = language === 'ru' 
      ? ['Месяц', 'Количество новых пользователей']
      : ['Month', 'New Users Count'];
    
    const usersColumnPositions = [50, 200];
    
    // Рисуем заголовки
    doc.fontSize(10);
    usersHeaders.forEach((header, i) => {
      addText(header, { continued: false, lineBreak: false });
      
      // Вручную позиционируем текст в колонках
      if (i < usersHeaders.length - 1) {
        doc.moveUp();
        doc.x = usersColumnPositions[i + 1];
      }
    });
    
    doc.moveDown();
    
    // Рисуем содержимое таблицы пользователей
    userTrends.forEach((trend) => {
      // Первая колонка - Месяц
      doc.x = usersColumnPositions[0];
      addText(trend.month, { continued: false, lineBreak: false });
      
      // Вторая колонка - Количество
      doc.moveUp();
      doc.x = usersColumnPositions[1];
      addText(String(trend.count), { continued: false });
      
      // Если достигли конца страницы, переходим на новую
      if (doc.y > 700) {
        doc.addPage();
        doc.y = 50;
      }
    });
  }
  
  private generateSubscriptionsExcel(workbook: ExcelJS.Workbook, data: any, language: string) {
    const { subscriptions } = data;
    
    // Создаем лист с обзором
    const summarySheet = workbook.addWorksheet(language === 'ru' ? 'Обзор' : 'Summary');
    
    // Добавляем заголовок
    summarySheet.getCell('A1').value = data.title;
    summarySheet.getCell('A1').font = { size: 16, bold: true };
    summarySheet.mergeCells('A1:D1');
    
    // Добавляем информацию о дате создания
    const dateFormat = language === 'ru' ? 'dd MMMM yyyy' : 'MMM dd, yyyy';
    const dateOptions = language === 'ru' ? { locale: ru } : undefined;
    
    summarySheet.getCell('A3').value = `${language === 'ru' ? 'Дата создания' : 'Generated on'}: ${format(data.generated, dateFormat, dateOptions)}`;
    
    // Добавляем информацию о диапазоне дат
    let row = 4;
    if (data.params.startDate) {
      summarySheet.getCell(`A${row}`).value = `${language === 'ru' ? 'Начальная дата' : 'Start date'}: ${format(data.params.startDate, dateFormat, dateOptions)}`;
      row++;
    }
    
    if (data.params.endDate) {
      summarySheet.getCell(`A${row}`).value = `${language === 'ru' ? 'Конечная дата' : 'End date'}: ${format(data.params.endDate, dateFormat, dateOptions)}`;
      row++;
    }
    
    row += 2;
    
    // Добавляем сводную информацию
    summarySheet.getCell(`A${row}`).value = language === 'ru' ? 'Сводка' : 'Summary';
    summarySheet.getCell(`A${row}`).font = { bold: true };
    row++;
    
    summarySheet.getCell(`A${row}`).value = `${language === 'ru' ? 'Всего подписок' : 'Total subscriptions'}: ${subscriptions.length}`;
    row++;
    
    // Вычисляем общую сумму подписок
    const totalRevenue = subscriptions.reduce((sum: number, sub: any) => sum + (sub.paymentAmount || 0), 0);
    
    summarySheet.getCell(`A${row}`).value = `${language === 'ru' ? 'Общая сумма платежей' : 'Total payment amount'}: ${totalRevenue.toFixed(2)}`;
    
    // Создаем лист с подписками
    const subscriptionsSheet = workbook.addWorksheet(language === 'ru' ? 'Подписки' : 'Subscriptions');
    
    // Добавляем заголовки
    const headers = language === 'ru' 
      ? ['ID', 'Название', 'Сервис', 'Пользователь', 'Сумма', 'Статус', 'Дата создания']
      : ['ID', 'Title', 'Service', 'User', 'Amount', 'Status', 'Created At'];
    
    subscriptionsSheet.addRow(headers);
    subscriptionsSheet.getRow(1).font = { bold: true };
    
    // Добавляем данные подписок
    subscriptions.forEach((sub: any) => {
      const createdAt = sub.createdAt ? format(sub.createdAt, 'yyyy-MM-dd') : '-';
      
      subscriptionsSheet.addRow([
        sub.id,
        sub.title || '-',
        sub.serviceName || '-',
        sub.userEmail || '-',
        sub.paymentAmount || '-',
        sub.status || '-',
        createdAt
      ]);
    });
    
    // Настраиваем ширину колонок
    subscriptionsSheet.columns.forEach(column => {
      column.width = 20;
    });
  }
  
  private generateUsersExcel(workbook: ExcelJS.Workbook, data: any, language: string) {
    const { users, stats } = data;
    
    // Создаем лист с обзором
    const summarySheet = workbook.addWorksheet(language === 'ru' ? 'Обзор' : 'Summary');
    
    // Добавляем заголовок
    summarySheet.getCell('A1').value = data.title;
    summarySheet.getCell('A1').font = { size: 16, bold: true };
    summarySheet.mergeCells('A1:D1');
    
    // Добавляем информацию о дате создания
    const dateFormat = language === 'ru' ? 'dd MMMM yyyy' : 'MMM dd, yyyy';
    const dateOptions = language === 'ru' ? { locale: ru } : undefined;
    
    summarySheet.getCell('A3').value = `${language === 'ru' ? 'Дата создания' : 'Generated on'}: ${format(data.generated, dateFormat, dateOptions)}`;
    
    // Добавляем информацию о диапазоне дат
    let row = 4;
    if (data.params.startDate) {
      summarySheet.getCell(`A${row}`).value = `${language === 'ru' ? 'Начальная дата' : 'Start date'}: ${format(data.params.startDate, dateFormat, dateOptions)}`;
      row++;
    }
    
    if (data.params.endDate) {
      summarySheet.getCell(`A${row}`).value = `${language === 'ru' ? 'Конечная дата' : 'End date'}: ${format(data.params.endDate, dateFormat, dateOptions)}`;
      row++;
    }
    
    row += 2;
    
    // Добавляем сводную информацию
    summarySheet.getCell(`A${row}`).value = language === 'ru' ? 'Сводка' : 'Summary';
    summarySheet.getCell(`A${row}`).font = { bold: true };
    row++;
    
    summarySheet.getCell(`A${row}`).value = `${language === 'ru' ? 'Всего пользователей' : 'Total users'}: ${stats.total}`;
    row++;
    
    summarySheet.getCell(`A${row}`).value = `${language === 'ru' ? 'Активных пользователей' : 'Active users'}: ${stats.active}`;
    row++;
    
    summarySheet.getCell(`A${row}`).value = `${language === 'ru' ? 'Новых пользователей' : 'New users'}: ${stats.new}`;
    
    // Создаем лист с пользователями
    const usersSheet = workbook.addWorksheet(language === 'ru' ? 'Пользователи' : 'Users');
    
    // Добавляем заголовки
    const headers = language === 'ru' 
      ? ['ID', 'Email', 'Имя', 'Компания', 'Роль', 'Дата регистрации']
      : ['ID', 'Email', 'Name', 'Company', 'Role', 'Registration Date'];
    
    usersSheet.addRow(headers);
    usersSheet.getRow(1).font = { bold: true };
    
    // Добавляем данные пользователей
    users.forEach((user: any) => {
      const createdAt = user.createdAt ? format(user.createdAt, 'yyyy-MM-dd') : '-';
      
      usersSheet.addRow([
        user.id,
        user.email || '-',
        user.name || '-',
        user.companyName || '-',
        user.role || '-',
        createdAt
      ]);
    });
    
    // Настраиваем ширину колонок
    usersSheet.columns.forEach(column => {
      column.width = 20;
    });
  }
  
  private generateServicesExcel(workbook: ExcelJS.Workbook, data: any, language: string) {
    const { services, usage } = data;
    
    // Создаем лист с обзором
    const summarySheet = workbook.addWorksheet(language === 'ru' ? 'Обзор' : 'Summary');
    
    // Добавляем заголовок
    summarySheet.getCell('A1').value = data.title;
    summarySheet.getCell('A1').font = { size: 16, bold: true };
    summarySheet.mergeCells('A1:D1');
    
    // Добавляем информацию о дате создания
    const dateFormat = language === 'ru' ? 'dd MMMM yyyy' : 'MMM dd, yyyy';
    const dateOptions = language === 'ru' ? { locale: ru } : undefined;
    
    summarySheet.getCell('A3').value = `${language === 'ru' ? 'Дата создания' : 'Generated on'}: ${format(data.generated, dateFormat, dateOptions)}`;
    
    // Добавляем сводную информацию
    let row = 5;
    summarySheet.getCell(`A${row}`).value = language === 'ru' ? 'Сводка' : 'Summary';
    summarySheet.getCell(`A${row}`).font = { bold: true };
    row++;
    
    summarySheet.getCell(`A${row}`).value = `${language === 'ru' ? 'Всего сервисов' : 'Total services'}: ${services.length}`;
    row++;
    
    // Находим самый популярный сервис
    let popularService = { serviceName: '-', count: 0 };
    if (usage.length > 0) {
      popularService = usage.reduce((prev: any, current: any) => 
        (current.count > prev.count) ? current : prev, usage[0]);
    }
    
    summarySheet.getCell(`A${row}`).value = `${language === 'ru' ? 'Самый популярный сервис' : 'Most popular service'}: ${popularService.serviceName} (${popularService.count} ${language === 'ru' ? 'подписок' : 'subscriptions'})`;
    
    // Создаем лист с сервисами
    const servicesSheet = workbook.addWorksheet(language === 'ru' ? 'Сервисы' : 'Services');
    
    // Добавляем заголовки
    const headers = language === 'ru' 
      ? ['ID', 'Название', 'Кэшбэк', 'Комиссия', 'Подписок', 'Доход']
      : ['ID', 'Title', 'Cashback', 'Commission', 'Subscriptions', 'Revenue'];
    
    servicesSheet.addRow(headers);
    servicesSheet.getRow(1).font = { bold: true };
    
    // Создаем карту использования сервисов для быстрого доступа
    const usageMap = new Map();
    usage.forEach((item: any) => {
      usageMap.set(item.serviceId, { count: item.count, totalRevenue: item.totalRevenue });
    });
    
    // Добавляем данные сервисов
    services.forEach((service: any) => {
      const serviceUsage = usageMap.get(service.id) || { count: 0, totalRevenue: 0 };
      
      servicesSheet.addRow([
        service.id,
        service.title || '-',
        service.cashback || '-',
        service.commission || '-',
        serviceUsage.count || 0,
        (serviceUsage.totalRevenue || 0).toFixed(2)
      ]);
    });
    
    // Создаем лист с использованием сервисов
    const usageSheet = workbook.addWorksheet(language === 'ru' ? 'Использование' : 'Usage');
    
    // Добавляем заголовки
    const usageHeaders = language === 'ru' 
      ? ['ID сервиса', 'Название сервиса', 'Количество подписок', 'Общий доход']
      : ['Service ID', 'Service Name', 'Subscriptions Count', 'Total Revenue'];
    
    usageSheet.addRow(usageHeaders);
    usageSheet.getRow(1).font = { bold: true };
    
    // Добавляем данные использования
    usage.forEach((item: any) => {
      usageSheet.addRow([
        item.serviceId,
        item.serviceName || '-',
        item.count || 0,
        (item.totalRevenue || 0).toFixed(2)
      ]);
    });
    
    // Настраиваем ширину колонок
    servicesSheet.columns.forEach(column => {
      column.width = 20;
    });
    
    usageSheet.columns.forEach(column => {
      column.width = 20;
    });
  }
  
  private generateFinancialExcel(workbook: ExcelJS.Workbook, data: any, language: string) {
    const { transactions, summary } = data;
    
    // Создаем лист с обзором
    const summarySheet = workbook.addWorksheet(language === 'ru' ? 'Обзор' : 'Summary');
    
    // Добавляем заголовок
    summarySheet.getCell('A1').value = data.title;
    summarySheet.getCell('A1').font = { size: 16, bold: true };
    summarySheet.mergeCells('A1:D1');
    
    // Добавляем информацию о дате создания
    const dateFormat = language === 'ru' ? 'dd MMMM yyyy' : 'MMM dd, yyyy';
    const dateOptions = language === 'ru' ? { locale: ru } : undefined;
    
    summarySheet.getCell('A3').value = `${language === 'ru' ? 'Дата создания' : 'Generated on'}: ${format(data.generated, dateFormat, dateOptions)}`;
    
    // Добавляем информацию о диапазоне дат
    let row = 4;
    if (data.params.startDate) {
      summarySheet.getCell(`A${row}`).value = `${language === 'ru' ? 'Начальная дата' : 'Start date'}: ${format(data.params.startDate, dateFormat, dateOptions)}`;
      row++;
    }
    
    if (data.params.endDate) {
      summarySheet.getCell(`A${row}`).value = `${language === 'ru' ? 'Конечная дата' : 'End date'}: ${format(data.params.endDate, dateFormat, dateOptions)}`;
      row++;
    }
    
    row += 2;
    
    // Добавляем сводную информацию
    summarySheet.getCell(`A${row}`).value = language === 'ru' ? 'Финансовая сводка' : 'Financial Summary';
    summarySheet.getCell(`A${row}`).font = { bold: true };
    row++;
    
    // Добавляем таблицу сводки
    const summaryHeaders = [
      language === 'ru' ? 'Показатель' : 'Metric',
      language === 'ru' ? 'Сумма' : 'Amount'
    ];
    
    summarySheet.getCell(`A${row}`).value = summaryHeaders[0];
    summarySheet.getCell(`B${row}`).value = summaryHeaders[1];
    summarySheet.getRow(row).font = { bold: true };
    row++;
    
    summarySheet.getCell(`A${row}`).value = language === 'ru' ? 'Общий доход' : 'Total Revenue';
    summarySheet.getCell(`B${row}`).value = summary.totalRevenue.toFixed(2);
    row++;
    
    summarySheet.getCell(`A${row}`).value = language === 'ru' ? 'Общий кэшбэк' : 'Total Cashback';
    summarySheet.getCell(`B${row}`).value = summary.totalCashback.toFixed(2);
    row++;
    
    summarySheet.getCell(`A${row}`).value = language === 'ru' ? 'Общая комиссия' : 'Total Commission';
    summarySheet.getCell(`B${row}`).value = summary.totalCommission.toFixed(2);
    row++;
    
    summarySheet.getCell(`A${row}`).value = language === 'ru' ? 'Чистый доход' : 'Net Income';
    summarySheet.getCell(`B${row}`).value = summary.netIncome.toFixed(2);
    summarySheet.getRow(row).font = { bold: true };
    
    // Создаем лист с транзакциями
    const transactionsSheet = workbook.addWorksheet(language === 'ru' ? 'Транзакции' : 'Transactions');
    
    // Добавляем заголовки
    const headers = language === 'ru' 
      ? ['ID', 'Подписка', 'Сервис', 'Сумма', 'Кэшбэк', 'Комиссия', 'Дата']
      : ['ID', 'Subscription', 'Service', 'Amount', 'Cashback', 'Commission', 'Date'];
    
    transactionsSheet.addRow(headers);
    transactionsSheet.getRow(1).font = { bold: true };
    
    // Добавляем данные транзакций
    transactions.forEach((tr: any) => {
      const createdAt = tr.createdAt ? format(tr.createdAt, 'yyyy-MM-dd') : '-';
      
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
        tr.paymentAmount || '-',
        cashbackAmount,
        commissionAmount,
        createdAt
      ]);
    });
    
    // Настраиваем ширину колонок
    transactionsSheet.columns.forEach(column => {
      column.width = 20;
    });
  }
  
  private generateTrendsExcel(workbook: ExcelJS.Workbook, data: any, language: string) {
    const { subscriptionTrends, userTrends } = data;
    
    // Создаем лист с обзором
    const summarySheet = workbook.addWorksheet(language === 'ru' ? 'Обзор' : 'Summary');
    
    // Добавляем заголовок
    summarySheet.getCell('A1').value = data.title;
    summarySheet.getCell('A1').font = { size: 16, bold: true };
    summarySheet.mergeCells('A1:D1');
    
    // Добавляем информацию о дате создания
    const dateFormat = language === 'ru' ? 'dd MMMM yyyy' : 'MMM dd, yyyy';
    const dateOptions = language === 'ru' ? { locale: ru } : undefined;
    
    summarySheet.getCell('A3').value = `${language === 'ru' ? 'Дата создания' : 'Generated on'}: ${format(data.generated, dateFormat, dateOptions)}`;
    
    // Добавляем информацию о диапазоне дат
    let row = 4;
    if (data.params.startDate) {
      summarySheet.getCell(`A${row}`).value = `${language === 'ru' ? 'Начальная дата' : 'Start date'}: ${format(data.params.startDate, dateFormat, dateOptions)}`;
      row++;
    }
    
    if (data.params.endDate) {
      summarySheet.getCell(`A${row}`).value = `${language === 'ru' ? 'Конечная дата' : 'End date'}: ${format(data.params.endDate, dateFormat, dateOptions)}`;
      row++;
    }
    
    // Создаем лист с трендами подписок
    const subscriptionsSheet = workbook.addWorksheet(language === 'ru' ? 'Тренды подписок' : 'Subscription Trends');
    
    // Добавляем заголовки
    const subsHeaders = language === 'ru' 
      ? ['Месяц', 'Количество', 'Сумма']
      : ['Month', 'Count', 'Revenue'];
    
    subscriptionsSheet.addRow(subsHeaders);
    subscriptionsSheet.getRow(1).font = { bold: true };
    
    // Добавляем данные трендов подписок
    subscriptionTrends.forEach((trend: any) => {
      subscriptionsSheet.addRow([
        trend.month,
        trend.count,
        (trend.revenue || 0).toFixed(2)
      ]);
    });
    
    // Создаем лист с трендами пользователей
    const usersSheet = workbook.addWorksheet(language === 'ru' ? 'Тренды пользователей' : 'User Trends');
    
    // Добавляем заголовки
    const usersHeaders = language === 'ru' 
      ? ['Месяц', 'Количество новых пользователей']
      : ['Month', 'New Users Count'];
    
    usersSheet.addRow(usersHeaders);
    usersSheet.getRow(1).font = { bold: true };
    
    // Добавляем данные трендов пользователей
    userTrends.forEach((trend: any) => {
      usersSheet.addRow([
        trend.month,
        trend.count
      ]);
    });
    
    // Настраиваем ширину колонок
    subscriptionsSheet.columns.forEach(column => {
      column.width = 20;
    });
    
    usersSheet.columns.forEach(column => {
      column.width = 20;
    });
  }
}

export const reportService = new ReportService();