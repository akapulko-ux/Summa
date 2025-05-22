import { db } from "../db";
import { notificationTemplates, notificationLogs, subscriptions, services, users } from "@shared/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { telegramBot } from "../telegram/telegram-bot";

export type NotificationTrigger = 'month_before' | 'two_weeks_before' | 'ten_days_before' | 'week_before' | 'three_days_before' | 'day_before' | 'expiry_day' | 'renewed';

interface NotificationContext {
  service_name: string;
  end_date: string;
  new_end_date?: string;
  amount: string;
  user_name?: string;
}

export class NotificationService {
  /**
   * Получить шаблон уведомления по типу триггера
   */
  async getTemplate(triggerType: NotificationTrigger) {
    const [template] = await db
      .select()
      .from(notificationTemplates)
      .where(and(
        eq(notificationTemplates.triggerType, triggerType),
        eq(notificationTemplates.isActive, true)
      ));
    
    return template;
  }

  /**
   * Заменить переменные в шаблоне
   */
  private replaceTemplateVariables(template: string, context: NotificationContext): string {
    return template
      .replace(/{service_name}/g, context.service_name)
      .replace(/{end_date}/g, context.end_date)
      .replace(/{new_end_date}/g, context.new_end_date || '')
      .replace(/{amount}/g, context.amount)
      .replace(/{user_name}/g, context.user_name || '');
  }

  /**
   * Отправить уведомление пользователю
   */
  async sendNotification(
    subscriptionId: number,
    triggerType: NotificationTrigger,
    context: NotificationContext
  ): Promise<boolean> {
    try {
      // Получаем шаблон
      const template = await this.getTemplate(triggerType);
      if (!template) {
        console.error(`Template not found for trigger type: ${triggerType}`);
        return false;
      }

      // Получаем данные подписки и пользователя
      const [subscription] = await db
        .select({
          subscription: subscriptions,
          service: services,
          user: users
        })
        .from(subscriptions)
        .leftJoin(services, eq(subscriptions.serviceId, services.id))
        .leftJoin(users, eq(subscriptions.userId, users.id))
        .where(eq(subscriptions.id, subscriptionId));

      if (!subscription || !subscription.user) {
        console.error(`Subscription or user not found for ID: ${subscriptionId}`);
        return false;
      }

      // Проверяем, есть ли telegram chat ID у пользователя
      if (!subscription.user.telegramChatId) {
        console.log(`User ${subscription.user.id} has no Telegram chat ID, skipping notification`);
        return false;
      }

      // Формируем сообщение из шаблона
      const message = this.replaceTemplateVariables(template.template, context);

      // Отправляем через Telegram бот
      const success = await telegramBot.sendMessage(subscription.user.telegramChatId, message, {
        parse_mode: 'Markdown'
      });

      // Логируем результат
      await this.logNotification(
        subscriptionId,
        triggerType,
        success ? 'sent' : 'failed',
        message,
        success ? undefined : 'Failed to send via Telegram'
      );

      return success;
    } catch (error) {
      console.error('Error sending notification:', error);
      
      // Логируем ошибку
      await this.logNotification(
        subscriptionId,
        triggerType,
        'failed',
        '',
        error instanceof Error ? error.message : 'Unknown error'
      );
      
      return false;
    }
  }

  /**
   * Логировать отправку уведомления
   */
  private async logNotification(
    subscriptionId: number,
    triggerType: NotificationTrigger,
    status: string,
    message: string,
    errorMessage?: string
  ) {
    await db.insert(notificationLogs).values({
      subscriptionId,
      triggerType,
      channel: 'telegram',
      status,
      message,
      errorMessage
    });
  }

  /**
   * Проверить, было ли уже отправлено уведомление сегодня
   */
  async wasNotificationSentToday(subscriptionId: number, triggerType: NotificationTrigger): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [log] = await db
      .select()
      .from(notificationLogs)
      .where(and(
        eq(notificationLogs.subscriptionId, subscriptionId),
        eq(notificationLogs.triggerType, triggerType),
        eq(notificationLogs.status, 'sent'),
        gte(notificationLogs.sentAt, today),
        lte(notificationLogs.sentAt, tomorrow)
      ));

    return !!log;
  }

  /**
   * Получить количество дней до даты окончания подписки
   */
  getDaysUntilExpiry(endDate: Date): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiry = new Date(endDate);
    expiry.setHours(0, 0, 0, 0);
    
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Определить тип триггера на основе количества дней до окончания и периода подписки
   */
  getTriggerType(daysUntil: number, paymentPeriod: string): NotificationTrigger | null {
    const isShortTerm = paymentPeriod === 'monthly';

    if (daysUntil === 0) return 'expiry_day';
    if (daysUntil === 1) return 'day_before';
    if (daysUntil === 3) return 'three_days_before';
    if (daysUntil === 7) return 'week_before';
    
    // Для подписок > 1 месяца
    if (!isShortTerm) {
      if (daysUntil === 10) return 'ten_days_before';
      if (daysUntil === 14) return 'two_weeks_before';
      if (daysUntil === 30) return 'month_before';
    }

    return null;
  }

  /**
   * Форматировать денежную сумму
   */
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('ru-RU', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Форматировать дату для отображения
   */
  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  }
}

export const notificationService = new NotificationService();