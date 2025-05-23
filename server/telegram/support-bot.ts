import TelegramBot from 'node-telegram-bot-api';

if (!process.env.TELEGRAM_SUPPORT_BOT_TOKEN) {
  throw new Error('TELEGRAM_SUPPORT_BOT_TOKEN environment variable must be set');
}

/**
 * Менеджер для работы с ботом поддержки
 */
export class SupportBotManager {
  private bot: TelegramBot;
  private supportChatId: string = '8184506267'; // Chat ID для @summa_help_bot
  
  constructor() {
    this.bot = new TelegramBot(process.env.TELEGRAM_SUPPORT_BOT_TOKEN!, {
      polling: false // Не нужен polling для отправки сообщений
    });
  }
  
  /**
   * Отправка заявки на услугу в бот поддержки
   */
  async sendServiceLead(data: {
    serviceName: string;
    clientName: string;
    clientPhone: string;
    clientEmail?: string;
  }): Promise<boolean> {
    try {
      const message = this.formatLeadMessage(data);
      
      // Отправляем сообщение в бот поддержки
      await this.bot.sendMessage(this.supportChatId, message, {
        parse_mode: 'HTML'
      });
      
      console.log(`Service lead sent to support bot for service: ${data.serviceName}`);
      return true;
    } catch (error) {
      console.error('Error sending service lead to support bot:', error);
      return false;
    }
  }
  
  /**
   * Форматирование сообщения с заявкой
   */
  private formatLeadMessage(data: {
    serviceName: string;
    clientName: string;
    clientPhone: string;
    clientEmail?: string;
  }): string {
    const currentTime = new Date().toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow'
    });
    
    let message = `🔔 <b>Новая заявка на услугу</b>\n\n`;
    message += `📋 <b>Услуга:</b> ${data.serviceName}\n`;
    message += `👤 <b>Имя:</b> ${data.clientName}\n`;
    message += `📞 <b>Телефон:</b> ${data.clientPhone}\n`;
    
    if (data.clientEmail) {
      message += `📧 <b>Email:</b> ${data.clientEmail}\n`;
    }
    
    message += `\n⏰ <b>Время:</b> ${currentTime} (МСК)`;
    
    return message;
  }
}

export const supportBotManager = new SupportBotManager();