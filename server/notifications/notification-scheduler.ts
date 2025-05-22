import { db } from "../db";
import { subscriptions, services, users } from "@shared/schema";
import { eq, and, or, inArray } from "drizzle-orm";
import { notificationService } from "./notification-service";

export class NotificationScheduler {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * Запустить планировщик уведомлений
   * Проверяет подписки ежедневно в 10:00 утра по московскому времени
   */
  start() {
    if (this.isRunning) {
      console.log('Notification scheduler is already running');
      return;
    }

    console.log('Starting notification scheduler (daily at 10:00 MSK)...');
    this.isRunning = true;

    // Планируем следующий запуск в 10:00 МСК
    this.scheduleNextRun();
  }

  /**
   * Запланировать следующий запуск в 10:00 МСК
   */
  private scheduleNextRun() {
    const now = new Date();
    const moscowTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Moscow"}));
    
    // Создаем дату для 10:00 сегодня в МСК
    const targetTime = new Date(moscowTime);
    targetTime.setHours(10, 0, 0, 0);
    
    // Если 10:00 уже прошло сегодня, планируем на завтра
    if (moscowTime.getTime() >= targetTime.getTime()) {
      targetTime.setDate(targetTime.getDate() + 1);
    }
    
    // Вычисляем разность во времени
    const delay = targetTime.getTime() - moscowTime.getTime();
    
    console.log(`Next notification check scheduled for: ${targetTime.toLocaleString('ru-RU', {timeZone: 'Europe/Moscow'})} MSK`);
    
    this.intervalId = setTimeout(() => {
      this.checkAndSendNotifications();
      // После выполнения планируем следующий запуск через 24 часа
      this.intervalId = setInterval(() => {
        this.checkAndSendNotifications();
      }, 24 * 60 * 60 * 1000); // 24 часа
    }, delay);
  }

  /**
   * Остановить планировщик уведомлений
   */
  stop() {
    if (!this.isRunning) {
      console.log('Notification scheduler is not running');
      return;
    }

    console.log('Stopping notification scheduler...');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Проверить все подписки и отправить необходимые уведомления
   */
  private async checkAndSendNotifications() {
    try {
      console.log('Checking subscriptions for notifications...');

      // Получаем все активные подписки со статусом "pending" или "expired"
      const subscriptionsToCheck = await db
        .select({
          subscription: subscriptions,
          service: services,
          user: users
        })
        .from(subscriptions)
        .leftJoin(services, eq(subscriptions.serviceId, services.id))
        .leftJoin(users, eq(subscriptions.userId, users.id))
        .where(
          and(
            inArray(subscriptions.status, ['pending', 'expired']),
            eq(users.isActive, true)
          )
        );

      console.log(`Found ${subscriptionsToCheck.length} subscriptions to check`);

      let notificationsSent = 0;

      for (const item of subscriptionsToCheck) {
        const { subscription, service, user } = item;

        if (!subscription || !service || !user) {
          continue;
        }

        // Пропускаем, если у пользователя нет Telegram chat ID
        if (!user.telegramChatId) {
          continue;
        }

        // Проверяем, что есть дата окончания подписки
        if (!subscription.paidUntil) {
          continue;
        }

        // Получаем количество дней до окончания подписки
        const daysUntil = notificationService.getDaysUntilExpiry(subscription.paidUntil);
        
        // Определяем тип триггера
        const triggerType = notificationService.getTriggerType(daysUntil, subscription.paymentPeriod || 'monthly');
        
        if (!triggerType) {
          continue; // Нет подходящего триггера для этой даты
        }

        // Проверяем, не отправляли ли уже уведомление сегодня
        const alreadySent = await notificationService.wasNotificationSentToday(subscription.id, triggerType);
        if (alreadySent) {
          continue;
        }

        // Подготавливаем контекст для шаблона
        const context = {
          service_name: service.title,
          end_date: notificationService.formatDate(subscription.paidUntil),
          amount: notificationService.formatAmount(subscription.paymentAmount || 0),
          user_name: user.name || user.email
        };

        // Отправляем уведомление
        const success = await notificationService.sendNotification(
          subscription.id,
          triggerType,
          context
        );

        if (success) {
          notificationsSent++;
          console.log(`Notification sent to user ${user.email} for subscription ${subscription.id} (${triggerType})`);
        } else {
          console.error(`Failed to send notification to user ${user.email} for subscription ${subscription.id}`);
        }

        // Небольшая задержка между отправками
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`Notification check completed. Sent ${notificationsSent} notifications.`);

    } catch (error) {
      console.error('Error in notification scheduler:', error);
    }
  }

  /**
   * Отправить уведомление о продлении подписки
   */
  async sendRenewalNotification(subscriptionId: number, newEndDate: Date) {
    try {
      const [subscriptionData] = await db
        .select({
          subscription: subscriptions,
          service: services,
          user: users
        })
        .from(subscriptions)
        .leftJoin(services, eq(subscriptions.serviceId, services.id))
        .leftJoin(users, eq(subscriptions.userId, users.id))
        .where(eq(subscriptions.id, subscriptionId));

      if (!subscriptionData || !subscriptionData.service || !subscriptionData.user) {
        console.error(`Subscription, service, or user not found for renewal notification: ${subscriptionId}`);
        return false;
      }

      const { subscription, service, user } = subscriptionData;

      // Проверяем, есть ли у пользователя Telegram chat ID
      if (!user.telegramChatId) {
        console.log(`User ${user.id} has no Telegram chat ID, skipping renewal notification`);
        return false;
      }

      // Подготавливаем контекст для шаблона продления
      const context = {
        service_name: service.title,
        end_date: notificationService.formatDate(subscription.paidUntil),
        new_end_date: notificationService.formatDate(newEndDate),
        amount: notificationService.formatAmount(subscription.paymentAmount),
        user_name: user.name || user.email
      };

      // Отправляем уведомление о продлении
      const success = await notificationService.sendNotification(
        subscriptionId,
        'renewed',
        context
      );

      if (success) {
        console.log(`Renewal notification sent to user ${user.email} for subscription ${subscriptionId}`);
      } else {
        console.error(`Failed to send renewal notification to user ${user.email} for subscription ${subscriptionId}`);
      }

      return success;

    } catch (error) {
      console.error('Error sending renewal notification:', error);
      return false;
    }
  }

  /**
   * Получить статус планировщика
   */
  getStatus() {
    if (!this.isRunning) {
      return {
        isRunning: false,
        nextCheck: 'Not scheduled'
      };
    }

    // Вычисляем время следующего запуска (10:00 МСК)
    const now = new Date();
    const moscowTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Moscow"}));
    const targetTime = new Date(moscowTime);
    targetTime.setHours(10, 0, 0, 0);
    
    if (moscowTime.getTime() >= targetTime.getTime()) {
      targetTime.setDate(targetTime.getDate() + 1);
    }

    return {
      isRunning: this.isRunning,
      nextCheck: `Daily at 10:00 MSK (next: ${targetTime.toLocaleString('ru-RU', {timeZone: 'Europe/Moscow'})})`
    };
  }

  /**
   * Запустить проверку уведомлений вручную
   */
  async runManualCheck() {
    console.log('Manual notification check triggered');
    return await this.checkAndSendNotifications();
  }
}

export const notificationScheduler = new NotificationScheduler();