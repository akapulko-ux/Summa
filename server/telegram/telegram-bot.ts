import TelegramBot from 'node-telegram-bot-api';
import { db } from '../db';
import { users, subscriptions, services } from '@shared/schema';
import { eq } from 'drizzle-orm';

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN environment variable must be set');
}

/**
 * Интерфейс для менеджера Telegram бота
 */
export interface ITelegramBotManager {
  // Инициализация бота и настройка обработчиков
  init(): void;
  
  // Отправка уведомления пользователю по ID пользователя в системе
  sendNotificationToUser(userId: number, message: string): Promise<boolean>;
  
  // Отправка массовой рассылки всем пользователям или по фильтру
  sendBroadcastMessage(message: string, filter?: { role?: 'admin' | 'client' }): Promise<{ success: number; failed: number }>;
  
  // Линковка Telegram аккаунта с пользователем в системе (через код)
  linkUserAccount(linkCode: string, telegramChatId: number): Promise<boolean>;
  
  // Генерация кода для привязки аккаунта
  generateLinkCode(userId: number): Promise<string>;
  
  // Получение информации о привязанных пользователях
  getLinkedUsers(): Promise<{ userId: number; telegramChatId: number; linkDate: Date }[]>;
}

/**
 * Менеджер для работы с Telegram ботом
 */
export class TelegramBotManager implements ITelegramBotManager {
  private bot: TelegramBot;
  private linkCodes: Map<string, { userId: number, expires: Date }> = new Map();
  
  constructor() {
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, {
      polling: true // Включаем polling для получения обновлений
    });
  }
  
  /**
   * Инициализация бота и настройка обработчиков
   */
  init(): void {
    // Обработка команды /start
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(chatId, 'Добро пожаловать в SaaSly! Используйте /link <код> для подключения вашего аккаунта.');
    });
    
    // Обработка команды /help
    this.bot.onText(/\/help/, (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(chatId, 
        'Доступные команды:\n' +
        '/start - Начать работу с ботом\n' +
        '/link <код> - Привязать ваш аккаунт SaaSly\n' +
        '/status - Проверить статус подписок\n' +
        '/help - Показать эту справку'
      );
    });
    
    // Обработка команды /link для привязки аккаунта
    this.bot.onText(/\/link (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const linkCode = match?.[1];
      
      if (!linkCode) {
        this.bot.sendMessage(chatId, 'Пожалуйста, укажите код привязки. Пример: /link ABC123');
        return;
      }
      
      const success = await this.linkUserAccount(linkCode, chatId);
      
      if (success) {
        this.bot.sendMessage(chatId, 'Ваш аккаунт успешно привязан! Теперь вы будете получать уведомления о ваших подписках.');
      } else {
        this.bot.sendMessage(chatId, 'Не удалось привязать аккаунт. Возможно, код неверный или истек срок его действия.');
      }
    });
    
    // Обработка команды /status для проверки статуса подписок
    this.bot.onText(/\/status/, async (msg) => {
      const chatId = msg.chat.id;
      
      try {
        // Найти пользователя по chatId
        const [user] = await db.select()
          .from(users)
          .where(eq(users.telegramChatId, chatId.toString()));
        
        if (!user) {
          this.bot.sendMessage(chatId, 'Ваш аккаунт не привязан. Используйте /link <код> для привязки.');
          return;
        }
        
        // Получить подписки пользователя
        const userSubscriptions = await db.select({
          subscription: subscriptions,
          serviceName: services.title
        })
        .from(subscriptions)
        .leftJoin(services, eq(subscriptions.serviceId, services.id))
        .where(eq(subscriptions.userId, user.id));
        
        if (userSubscriptions.length === 0) {
          this.bot.sendMessage(chatId, 'У вас нет активных подписок.');
          return;
        }
        
        // Сформировать сообщение со списком подписок
        let message = 'Ваши подписки:\n\n';
        userSubscriptions.forEach((sub, index) => {
          const status = sub.subscription.status;
          const statusEmoji = status === 'active' ? '✅' : status === 'pending' ? '⏳' : status === 'expired' ? '❌' : '❓';
          
          message += `${index + 1}. ${sub.serviceName || 'Сервис'} - ${statusEmoji} ${status}\n`;
          message += `   Оплачено до: ${new Date(sub.subscription.paidUntil).toLocaleDateString()}\n`;
          message += `   Сумма: $${sub.subscription.paymentAmount}\n\n`;
        });
        
        this.bot.sendMessage(chatId, message);
      } catch (error) {
        console.error('Error getting status for Telegram user:', error);
        this.bot.sendMessage(chatId, 'Произошла ошибка при получении информации о ваших подписках. Пожалуйста, попробуйте позже.');
      }
    });
    
    // Обработка всех остальных сообщений
    this.bot.on('message', (msg) => {
      if (!msg.text?.startsWith('/')) {
        const chatId = msg.chat.id;
        this.bot.sendMessage(chatId, 'Используйте команду /help для получения справки о доступных командах.');
      }
    });
    
    console.log('Telegram bot initialized and ready to accept commands');
  }
  
  /**
   * Отправка уведомления пользователю по ID пользователя в системе
   * @param userId ID пользователя в системе
   * @param message Текст сообщения
   * @returns Результат отправки сообщения
   */
  async sendNotificationToUser(userId: number, message: string): Promise<boolean> {
    try {
      // Найти пользователя по ID
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId));
      
      if (!user || !user.telegramChatId) {
        console.log(`User ${userId} does not exist or has no Telegram chat ID`);
        return false;
      }
      
      // Отправить сообщение
      await this.bot.sendMessage(parseInt(user.telegramChatId), message);
      return true;
    } catch (error) {
      console.error('Error sending notification to user:', error);
      return false;
    }
  }
  
  /**
   * Отправка массовой рассылки всем пользователям или по фильтру
   * @param message Текст сообщения
   * @param filter Фильтр для выборки пользователей
   * @returns Статистика отправки сообщений
   */
  async sendBroadcastMessage(message: string, filter?: { role?: 'admin' | 'client' }): Promise<{ success: number; failed: number }> {
    let userQuery = db.select().from(users);
    
    // Применить фильтр, если он указан
    if (filter?.role) {
      userQuery = userQuery.where(eq(users.role, filter.role));
    }
    
    // Получить всех пользователей с привязанными Telegram аккаунтами
    const allUsers = await userQuery;
    const linkedUsers = allUsers.filter(user => user.telegramChatId);
    
    let success = 0;
    let failed = 0;
    
    // Отправить сообщения всем пользователям
    for (const user of linkedUsers) {
      try {
        if (user.telegramChatId) {
          await this.bot.sendMessage(parseInt(user.telegramChatId), message);
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Error sending broadcast message to user ${user.id}:`, error);
        failed++;
      }
    }
    
    return { success, failed };
  }
  
  /**
   * Линковка Telegram аккаунта с пользователем в системе
   * @param linkCode Код привязки
   * @param telegramChatId ID чата Telegram
   * @returns Результат привязки
   */
  async linkUserAccount(linkCode: string, telegramChatId: number): Promise<boolean> {
    const linkInfo = this.linkCodes.get(linkCode);
    
    if (!linkInfo) {
      console.log(`Link code ${linkCode} does not exist`);
      return false;
    }
    
    if (linkInfo.expires < new Date()) {
      console.log(`Link code ${linkCode} has expired`);
      this.linkCodes.delete(linkCode);
      return false;
    }
    
    try {
      // Обновить пользователя, добавив telegramChatId
      await db.update(users)
        .set({ telegramChatId: telegramChatId.toString() })
        .where(eq(users.id, linkInfo.userId));
      
      // Удалить использованный код
      this.linkCodes.delete(linkCode);
      
      return true;
    } catch (error) {
      console.error('Error linking user account:', error);
      return false;
    }
  }
  
  /**
   * Генерация кода для привязки аккаунта
   * @param userId ID пользователя
   * @returns Сгенерированный код
   */
  async generateLinkCode(userId: number): Promise<string> {
    // Проверить, существует ли пользователь
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // Сгенерировать случайный код
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    // Сохранить код с временем истечения (24 часа)
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);
    
    this.linkCodes.set(code, { userId, expires });
    
    return code;
  }
  
  /**
   * Получение информации о привязанных пользователях
   * @returns Список привязанных пользователей
   */
  async getLinkedUsers(): Promise<{ userId: number; telegramChatId: number; linkDate: Date }[]> {
    const linkedUsers = await db.select({
      id: users.id,
      telegramChatId: users.telegramChatId,
      updatedAt: users.updatedAt
    })
    .from(users)
    .where(eq(users.telegramChatId, ''));
    
    return linkedUsers.map(user => ({
      userId: user.id,
      telegramChatId: parseInt(user.telegramChatId || '0'),
      linkDate: user.updatedAt || new Date()
    }));
  }
}

// Создаем и экспортируем экземпляр менеджера
export const telegramBotManager = new TelegramBotManager();