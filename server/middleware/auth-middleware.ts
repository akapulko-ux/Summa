import { Request, Response, NextFunction } from 'express';

/**
 * Middleware для проверки аутентификации пользователя
 */
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  next();
}

/**
 * Middleware для проверки роли администратора
 */
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  
  next();
}

/**
 * Middleware для проверки прав на доступ к ресурсу
 * Пользователь может получить доступ, если:
 * 1. Он админ
 * 2. Он владелец ресурса (его ID совпадает с userId ресурса)
 */
export function canAccessResource(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  // Админы имеют доступ ко всем ресурсам
  if (req.user?.role === 'admin') {
    return next();
  }
  
  // Проверяем, что пользователь является владельцем ресурса
  const resourceUserId = Number(req.params.userId || req.body.userId);
  
  if (!resourceUserId || resourceUserId !== req.user?.id) {
    return res.status(403).json({ message: 'Access denied. You can only access your own resources.' });
  }
  
  next();
}