import { Express, Request, Response } from 'express';
import { telegramBotManager } from './telegram-bot';
import { User } from '@shared/schema';

// Middleware для проверки, что пользователь является администратором
function isAdmin(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated() || (req.user as User).role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
}

export function setupTelegramRoutes(app: Express) {
  // Инициализация бота при запуске приложения
  telegramBotManager.init();

  // API для генерации кода привязки Telegram
  app.post('/api/telegram/generate-link-code', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const userId = (req.user as User).id;
      const linkCode = await telegramBotManager.generateLinkCode(userId);
      
      res.json({ linkCode });
    } catch (error: any) {
      console.error('Error generating Telegram link code:', error);
      res.status(500).json({ message: error.message || 'Failed to generate link code' });
    }
  });

  // API для отправки тестового уведомления (только для админов)
  app.post('/api/telegram/send-test-notification', isAdmin, async (req: Request, res: Response) => {
    try {
      const { userId, message } = req.body;
      
      if (!userId || !message) {
        return res.status(400).json({ message: 'userId and message are required' });
      }
      
      const success = await telegramBotManager.sendNotificationToUser(userId, message);
      
      if (success) {
        res.json({ message: 'Notification sent successfully' });
      } else {
        res.status(400).json({ message: 'Failed to send notification' });
      }
    } catch (error: any) {
      console.error('Error sending test notification:', error);
      res.status(500).json({ message: error.message || 'Failed to send notification' });
    }
  });

  // API для массовой рассылки (только для админов)
  app.post('/api/telegram/broadcast', isAdmin, async (req: Request, res: Response) => {
    try {
      const { message, role } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: 'Message is required' });
      }
      
      const result = await telegramBotManager.sendBroadcastMessage(message, role ? { role } : undefined);
      
      res.json({ 
        message: `Broadcast sent to ${result.success} users (failed: ${result.failed})`,
        success: result.success,
        failed: result.failed
      });
    } catch (error: any) {
      console.error('Error sending broadcast:', error);
      res.status(500).json({ message: error.message || 'Failed to send broadcast' });
    }
  });

  // API для получения статуса подключения Telegram для текущего пользователя
  app.get('/api/telegram/status', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const user = req.user as User;
      
      res.json({ 
        connected: !!user.telegramChatId,
        telegramChatId: user.telegramChatId || null 
      });
    } catch (error: any) {
      console.error('Error getting Telegram status:', error);
      res.status(500).json({ message: error.message || 'Failed to get Telegram status' });
    }
  });

  // API для получения списка пользователей с подключенным Telegram (только для админов)
  app.get('/api/telegram/linked-users', isAdmin, async (req: Request, res: Response) => {
    try {
      const linkedUsers = await telegramBotManager.getLinkedUsers();
      res.json({ linkedUsers });
    } catch (error: any) {
      console.error('Error getting linked users:', error);
      res.status(500).json({ message: error.message || 'Failed to get linked users' });
    }
  });

  console.log('Telegram routes initialized');
}