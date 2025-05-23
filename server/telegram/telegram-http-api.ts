/**
 * HTTP API для отправки сообщений через Telegram бота
 */

import axios from 'axios';

export class TelegramHttpAPI {
  private botToken: string;
  private baseURL: string;

  constructor(botToken: string) {
    this.botToken = botToken;
    this.baseURL = `https://api.telegram.org/bot${botToken}`;
  }

  /**
   * Отправка сообщения в группу через HTTP API
   * @param chatId ID чата/группы
   * @param message Текст сообщения
   * @returns Результат отправки
   */
  async sendMessage(chatId: number | string, message: string): Promise<boolean> {
    try {
      const response = await axios.post(`${this.baseURL}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      });

      return response.data.ok === true;
    } catch (error) {
      console.error('Error sending Telegram message via HTTP API:', error);
      return false;
    }
  }

  /**
   * Отправка заявки на услугу в группу
   * @param leadData Данные заявки
   * @returns Результат отправки
   */
  async sendServiceLeadToGroup(leadData: { 
    name: string; 
    phone: string; 
    email?: string; 
    serviceName: string 
  }): Promise<boolean> {
    try {
      // ID группы для отправки заявок
      const GROUP_CHAT_ID = -1002638718178;
      
      // Форматируем сообщение с HTML разметкой
      const message = 
        `🚀 <b>Новая заявка на услугу!</b>\n\n` +
        `📋 <b>Услуга:</b> ${leadData.serviceName}\n` +
        `👤 <b>Имя:</b> ${leadData.name}\n` +
        `📞 <b>Телефон:</b> <code>${leadData.phone}</code>` +
        (leadData.email ? `\n📧 <b>Email:</b> ${leadData.email}` : '') +
        `\n\n⏰ <b>Дата:</b> ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`;
      
      // Отправляем сообщение в группу
      const success = await this.sendMessage(GROUP_CHAT_ID, message);
      
      if (success) {
        console.log('Service lead sent to Telegram group successfully via HTTP API');
      } else {
        console.error('Failed to send service lead to Telegram group via HTTP API');
      }
      
      return success;
    } catch (error) {
      console.error('Error sending service lead to Telegram group via HTTP API:', error);
      return false;
    }
  }
}

// Создаем экземпляр HTTP API для Telegram с токеном @summa_help_bot
export const telegramHttpAPI = new TelegramHttpAPI(process.env.SUMMA_HELP_BOT_TOKEN || '');