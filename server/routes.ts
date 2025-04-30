import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertServiceSchema, insertSubscriptionSchema, insertCustomFieldSchema } from "@shared/schema";
import { ZodError } from "zod";
import { zValidationErrorToMessage } from "./utils";
import backupRoutes from "./backup/backup-routes";
import { setupTelegramRoutes } from "./telegram/telegram-routes";
import { cacheManager } from "./cache";
import { cacheMiddleware, clearCacheMiddleware } from "./middleware/cache-middleware";
import { dbOptimizer } from "./db-optimizer";
import { scalingManager } from "./scaling";
import { setupMonitoringRoutes } from "./routes/monitoring-routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Middleware to check if user is an admin
  const isAdmin = (req: any, res: any, next: any) => {
    if (req.isAuthenticated() && req.user.role === "admin") {
      return next();
    }
    res.status(403).json({ message: "Forbidden" });
  };

  // User routes
  app.get("/api/users", isAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;
      
      const result = await storage.listUsers(page, limit, search);
      
      // Remove passwordHash from users
      const users = result.users.map(user => {
        const { passwordHash, ...userData } = user;
        return userData;
      });
      
      res.json({ users, total: result.total });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Only admins can view other users
      if (req.user.id !== id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove passwordHash
      const { passwordHash, ...userData } = user;
      
      res.json(userData);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Only admins can update other users
      if (req.user.id !== id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Prevent non-admins from changing role
      if (req.user.role !== "admin" && req.body.role) {
        delete req.body.role;
      }
      
      const user = await storage.updateUser(id, req.body);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove passwordHash
      const { passwordHash, ...userData } = user;
      
      res.json(userData);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  
  // Delete user route (admin only)
  app.delete("/api/users/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Prevent admin from deleting themselves
      if (req.user.id === id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      const success = await storage.deleteUser(id);
      
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.sendStatus(200);
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Service routes
  app.get("/api/services", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      // Extract filter params
      const search = req.query.search as string;
      const status = req.query.status as 'all' | 'active' | 'inactive';
      const sortBy = req.query.sortBy as string;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc';
      
      // Build filter object (only include non-empty values)
      const filters: any = {};
      if (search) filters.search = search;
      if (status && status !== 'all') filters.status = status;
      if (sortBy) filters.sortBy = sortBy;
      if (sortOrder) filters.sortOrder = sortOrder;
      
      // Get filtered services
      const result = await storage.listServices(page, limit, 
        Object.keys(filters).length > 0 ? filters : undefined
      );
      
      res.json({ services: result.services, total: result.total });
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.get("/api/services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const service = await storage.getService(id);
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      res.json(service);
    } catch (error) {
      console.error("Error fetching service:", error);
      res.status(500).json({ message: "Failed to fetch service" });
    }
  });

  app.post("/api/services", isAdmin, async (req, res) => {
    try {
      const validatedData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(validatedData);
      res.status(201).json(service);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: zValidationErrorToMessage(error) });
      }
      console.error("Error creating service:", error);
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  app.patch("/api/services/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const service = await storage.updateService(id, req.body);
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      res.json(service);
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete("/api/services/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteService(id);
      
      if (!success) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });
  
  // Get clients using a specific service
  app.get("/api/services/:id/clients", isAuthenticated, async (req, res) => {
    try {
      const serviceId = parseInt(req.params.id);
      const service = await storage.getService(serviceId);
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      const clients = await storage.getServiceClients(serviceId);
      
      // Remove sensitive information for non-admin users
      const sanitizedClients = clients.map(client => {
        const { passwordHash, ...userData } = client;
        return userData;
      });
      
      res.json(sanitizedClients);
    } catch (error) {
      console.error("Error fetching service clients:", error);
      res.status(500).json({ message: "Failed to fetch service clients" });
    }
  });

  // Subscription routes
  app.get("/api/subscriptions", isAuthenticated, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      let userId: number | undefined = undefined;
      
      // Regular users can only see their own subscriptions
      if (req.user.role !== "admin") {
        userId = req.user.id;
      } else if (req.query.userId) {
        userId = parseInt(req.query.userId as string);
      }
      
      const result = await storage.listSubscriptions(userId, page, limit);
      
      res.json({ subscriptions: result.subscriptions, total: result.total });
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  app.get("/api/subscriptions/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const subscription = await storage.getSubscription(id);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      // Regular users can only see their own subscriptions
      if (req.user.role !== "admin" && subscription.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(subscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  app.post("/api/subscriptions", isAuthenticated, async (req, res) => {
    try {
      let data = req.body;
      
      // Regular users can only create subscriptions for themselves
      if (req.user.role !== "admin") {
        data.userId = req.user.id;
      }
      
      const validatedData = insertSubscriptionSchema.parse(data);
      const subscription = await storage.createSubscription(validatedData);
      
      res.status(201).json(subscription);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: zValidationErrorToMessage(error) });
      }
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  app.patch("/api/subscriptions/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const subscription = await storage.getSubscription(id);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      // Regular users can only update their own subscriptions
      if (req.user.role !== "admin" && subscription.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updated = await storage.updateSubscription(id, req.body);
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ message: "Failed to update subscription" });
    }
  });

  app.delete("/api/subscriptions/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const subscription = await storage.getSubscription(id);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      // Regular users can only delete their own subscriptions
      if (req.user.role !== "admin" && subscription.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteSubscription(id);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting subscription:", error);
      res.status(500).json({ message: "Failed to delete subscription" });
    }
  });

  // Custom fields routes
  app.get("/api/custom-fields", isAuthenticated, async (req, res) => {
    try {
      const entityType = req.query.entityType as string;
      const entityId = parseInt(req.query.entityId as string);
      
      if (!entityType || !entityId) {
        return res.status(400).json({ message: "entityType and entityId are required" });
      }
      
      const fields = await storage.listCustomFields(entityType, entityId);
      
      res.json(fields);
    } catch (error) {
      console.error("Error fetching custom fields:", error);
      res.status(500).json({ message: "Failed to fetch custom fields" });
    }
  });

  app.post("/api/custom-fields", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertCustomFieldSchema.parse(req.body);
      
      // For non-admin users, check if they have access to the entity
      if (req.user.role !== "admin") {
        if (validatedData.entityType === "user" && validatedData.entityId !== req.user.id) {
          return res.status(403).json({ message: "Forbidden" });
        }
        
        if (validatedData.entityType === "subscription") {
          const subscription = await storage.getSubscription(validatedData.entityId);
          if (!subscription || subscription.userId !== req.user.id) {
            return res.status(403).json({ message: "Forbidden" });
          }
        }
      }
      
      const field = await storage.createCustomField(validatedData);
      
      res.status(201).json(field);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: zValidationErrorToMessage(error) });
      }
      console.error("Error creating custom field:", error);
      res.status(500).json({ message: "Failed to create custom field" });
    }
  });

  app.patch("/api/custom-fields/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const field = await storage.getCustomField(id);
      
      if (!field) {
        return res.status(404).json({ message: "Custom field not found" });
      }
      
      // For non-admin users, check if they have access to the entity
      if (req.user.role !== "admin") {
        if (field.entityType === "user" && field.entityId !== req.user.id) {
          return res.status(403).json({ message: "Forbidden" });
        }
        
        if (field.entityType === "subscription") {
          const subscription = await storage.getSubscription(field.entityId);
          if (!subscription || subscription.userId !== req.user.id) {
            return res.status(403).json({ message: "Forbidden" });
          }
        }
      }
      
      const updated = await storage.updateCustomField(id, req.body);
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating custom field:", error);
      res.status(500).json({ message: "Failed to update custom field" });
    }
  });

  app.delete("/api/custom-fields/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const field = await storage.getCustomField(id);
      
      if (!field) {
        return res.status(404).json({ message: "Custom field not found" });
      }
      
      // For non-admin users, check if they have access to the entity
      if (req.user.role !== "admin") {
        if (field.entityType === "user" && field.entityId !== req.user.id) {
          return res.status(403).json({ message: "Forbidden" });
        }
        
        if (field.entityType === "subscription") {
          const subscription = await storage.getSubscription(field.entityId);
          if (!subscription || subscription.userId !== req.user.id) {
            return res.status(403).json({ message: "Forbidden" });
          }
        }
      }
      
      await storage.deleteCustomField(id);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting custom field:", error);
      res.status(500).json({ message: "Failed to delete custom field" });
    }
  });

  // Stats routes (admin only)
  app.get("/api/stats/subscriptions", isAdmin, async (req, res) => {
    try {
      const stats = await storage.getSubscriptionStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching subscription stats:", error);
      res.status(500).json({ message: "Failed to fetch subscription stats" });
    }
  });

  app.get("/api/stats/users", isAdmin, async (req, res) => {
    try {
      const stats = await storage.getUserStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  app.get("/api/stats/services", isAdmin, async (req, res) => {
    try {
      const stats = await storage.getServicePopularity();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching service stats:", error);
      res.status(500).json({ message: "Failed to fetch service stats" });
    }
  });
  
  // API для получения данных о регистрациях пользователей
  app.get("/api/stats/registrations", isAdmin, async (req, res) => {
    try {
      const period = req.query.period as string || 'month';
      // Формат данных: [{date: '2023-01', count: 5}, ...]
      const registrationsData = await storage.getUserRegistrationsStats(period);
      res.json(registrationsData);
    } catch (error) {
      console.error("Error fetching registration stats:", error);
      res.status(500).json({ message: "Failed to fetch registration stats" });
    }
  });

  // API для получения данных о кэшбэке
  app.get("/api/stats/cashback", isAdmin, async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const period = req.query.period as string || 'month';
      
      const cashbackData = await storage.getCashbackStats(userId, period);
      res.json(cashbackData);
    } catch (error) {
      console.error("Error fetching cashback stats:", error);
      res.status(500).json({ message: "Failed to fetch cashback stats" });
    }
  });

  // API для получения статистики активных/неактивных клиентов
  app.get("/api/stats/clients-activity", isAdmin, async (req, res) => {
    try {
      const clientsActivityData = await storage.getClientsActivityStats();
      res.json(clientsActivityData);
    } catch (error) {
      console.error("Error fetching clients activity stats:", error);
      res.status(500).json({ message: "Failed to fetch clients activity stats" });
    }
  });

  // API для получения статистики по стоимости подписок
  app.get("/api/stats/subscription-costs", isAdmin, async (req, res) => {
    try {
      const period = req.query.period as string || 'month';
      const subscriptionCostsData = await storage.getSubscriptionCostsStats(period);
      res.json(subscriptionCostsData);
    } catch (error) {
      console.error("Error fetching subscription costs stats:", error);
      res.status(500).json({ message: "Failed to fetch subscription costs stats" });
    }
  });

  // Настройка кэширования для часто запрашиваемых данных
  // Кэшируем списки сервисов на 2 минуты
  app.get("/api/services", cacheMiddleware({ ttl: 120, keyPrefix: 'services:' }));
  
  // Кэширование статистики на 5 минут
  app.get("/api/stats/*", cacheMiddleware({ ttl: 300, keyPrefix: 'stats:' }));
  
  // Подключаем маршруты для мониторинга производительности
  setupMonitoringRoutes(app);
  
  // Настраиваем очистку кэша при изменении данных
  app.post("/api/services", clearCacheMiddleware('services:'));
  app.patch("/api/services/:id", clearCacheMiddleware('services:'));
  app.delete("/api/services/:id", clearCacheMiddleware('services:'));
  
  // Подключаем маршруты для резервного копирования базы данных
  app.use("/api/backups", backupRoutes);

  // Подключаем маршруты для Telegram бота
  setupTelegramRoutes(app);
  
  // Включаем мониторинг запросов в режиме production
  if (process.env.NODE_ENV === 'production') {
    dbOptimizer.enableQueryMonitoring();
    dbOptimizer.setLongQueryThreshold(300); // 300мс
    
    // Проверяем возможность масштабирования
    const workerCount = scalingManager.getOptimalWorkerCount(70);
    if (workerCount > 1) {
      scalingManager.enableClusterMode(workerCount);
    }
  }

  const httpServer = createServer(app);

  return httpServer;
}
