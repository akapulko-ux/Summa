import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertServiceSchema, insertSubscriptionSchema, insertCustomFieldSchema, insertServiceLeadSchema, serviceLeads } from "@shared/schema";
import { ZodError } from "zod";
import { zValidationErrorToMessage } from "./utils";
import backupRoutes from "./backup/backup-routes";
import { setupTelegramRoutes } from "./telegram/telegram-routes";
import { cacheManager } from "./cache";
import { cacheMiddleware, clearCacheMiddleware } from "./middleware/cache-middleware";
import { dbOptimizer } from "./db-optimizer";
import { scalingManager } from "./scaling";
import { setupMonitoringRoutes } from "./routes/monitoring-routes";
import { registerReportsRoutes } from "./reports/reports-routes";
import { setupUploadRoutes } from "./routes/uploads";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import { users, services, subscriptions } from "@shared/schema";

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
      
      // Получаем количество подписок для каждого пользователя
      const usersWithSubscriptionCount = await Promise.all(
        result.users.map(async (user) => {
          // Получаем количество подписок пользователя
          const subscriptionResult = await db
            .select({ count: sql`count(*)` })
            .from(subscriptions)
            .where(eq(subscriptions.userId, user.id));
          
          const subscriptionCount = parseInt(subscriptionResult[0].count.toString(), 10);
          
          // Remove passwordHash from users
          const { passwordHash, ...userData } = user;
          
          return {
            ...userData,
            subscriptionCount
          };
        })
      );
      
      res.json({ users: usersWithSubscriptionCount, total: result.total });
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
      const showCustom = req.query.showCustom === 'true';
      
      // Build filter object (only include non-empty values)
      const filters: any = {};
      if (search) filters.search = search;
      if (status && status !== 'all') filters.status = status;
      if (sortBy) filters.sortBy = sortBy;
      if (sortOrder) filters.sortOrder = sortOrder;
      
      // Определяем параметры фильтрации для кастомных сервисов
      if (req.isAuthenticated()) {
        // Для аутентифицированных пользователей
        if (req.user.role !== 'admin') {
          // Для обычных пользователей показываем только публичные сервисы и их кастомные сервисы
          filters.customFilter = {
            ownerId: req.user.id,
            showPublic: true // Будет использоваться в storage.listServices для показа публичных сервисов
          };
        } else if (!showCustom) {
          // Для админов по умолчанию показываем только публичные сервисы, 
          // если специально не запрошены кастомные через параметр showCustom
          filters.customFilter = {
            showPublic: true,
            hideCustom: true
          };
        }
      } else {
        // Для неаутентифицированных пользователей показываем только публичные сервисы
        filters.customFilter = {
          showPublic: true,
          hideCustom: true
        };
      }
      
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

  app.post("/api/services", isAuthenticated, async (req, res) => {
    try {
      let validatedData = insertServiceSchema.parse(req.body);
      
      // Регулярные пользователи могут создавать только собственные кастомные сервисы
      if (req.user.role !== "admin") {
        validatedData.isCustom = true;
        validatedData.ownerId = req.user.id;
      }
      
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

  app.patch("/api/services/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Получаем сервис перед обновлением для проверки прав доступа
      const existingService = await storage.getService(id);
      
      if (!existingService) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      // Обычные пользователи могут редактировать только свои кастомные сервисы
      if (req.user.role !== 'admin' && 
          (!existingService.isCustom || existingService.ownerId !== req.user.id)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const service = await storage.updateService(id, req.body);
      
      res.json(service);
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete("/api/services/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Получаем сервис перед удалением для проверки прав доступа
      const existingService = await storage.getService(id);
      
      if (!existingService) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      // Обычные пользователи могут удалять только свои кастомные сервисы
      if (req.user.role !== 'admin' && 
          (!existingService.isCustom || existingService.ownerId !== req.user.id)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
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
      const search = req.query.search as string || '';
      const sortBy = req.query.sortBy as string || 'createdAt';
      const sortOrder = (req.query.sortOrder as string || 'desc') === 'asc' ? 'asc' : 'desc';
      
      let userId: number | undefined = undefined;
      
      // Regular users can only see their own subscriptions
      if (req.user.role !== "admin") {
        userId = req.user.id;
      } else if (req.query.userId) {
        userId = parseInt(req.query.userId as string);
      }
      
      const result = await storage.listSubscriptions(
        userId, 
        page, 
        limit, 
        search, 
        sortBy, 
        sortOrder as 'asc' | 'desc'
      );
      
      res.json({ subscriptions: result.subscriptions, total: result.total });
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });
  
  // Get all subscriptions with details for admin view
  app.get("/api/subscriptions/all", isAdmin, async (req, res) => {
    try {
      // Fetch all subscriptions with joined service and user data
      const allSubscriptions = await db.select({
        id: subscriptions.id,
        userId: subscriptions.userId,
        serviceId: subscriptions.serviceId,
        title: subscriptions.title,
        status: subscriptions.status,
        paymentPeriod: subscriptions.paymentPeriod,
        price: subscriptions.paymentAmount,
        domain: subscriptions.domain,
        createdAt: subscriptions.createdAt,
        paidUntil: subscriptions.paidUntil, // Добавляем поле paidUntil
        // Add service name from services table
        serviceName: services.title,
        // Add user info from users table
        userName: users.name, 
        userEmail: users.email
      })
      .from(subscriptions)
      .leftJoin(services, eq(subscriptions.serviceId, services.id))
      .leftJoin(users, eq(subscriptions.userId, users.id))
      .orderBy(desc(subscriptions.createdAt));
      
      // Process results to handle custom services
      const processedSubscriptions = allSubscriptions.map(sub => {
        // If subscription has title but no service name (custom service case),
        // use the subscription title as the service name
        if (!sub.serviceName && sub.title) {
          return {
            ...sub,
            serviceName: sub.title
          };
        }
        return sub;
      });
      
      res.json(processedSubscriptions);
    } catch (error) {
      console.error("Error fetching all subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch all subscriptions" });
    }
  });
  
  // Get user subscriptions with service details
  app.get("/api/subscriptions/user/:userId", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Regular users can only view their own subscriptions
      if (req.user.role !== "admin" && req.user.id !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Fetch user subscriptions with joined service data
      const userSubscriptions = await db.select({
        id: subscriptions.id,
        userId: subscriptions.userId,
        serviceId: subscriptions.serviceId,
        title: subscriptions.title,
        status: subscriptions.status,
        paymentPeriod: subscriptions.paymentPeriod,
        paymentAmount: subscriptions.paymentAmount,
        domain: subscriptions.domain,
        createdAt: subscriptions.createdAt,
        paidUntil: subscriptions.paidUntil,
        // Add service name from services table
        serviceName: services.title
      })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .leftJoin(services, eq(subscriptions.serviceId, services.id))
      .orderBy(desc(subscriptions.createdAt));
      
      // Process results to handle custom services (same logic as in /subscriptions/all)
      const processedSubscriptions = userSubscriptions.map(sub => {
        if (!sub.serviceName && sub.title) {
          return {
            ...sub,
            serviceName: sub.title
          };
        }
        return sub;
      });
      
      res.json(processedSubscriptions);
    } catch (error) {
      console.error("Error fetching user subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch user subscriptions" });
    }
  });

  app.get("/api/subscriptions/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const subscription = await storage.getSubscription(id);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      // Логируем найденную подписку для отладки
      console.log(`Fetched subscription ${id}:`, JSON.stringify(subscription));
      
      // Regular users can only see their own subscriptions
      if (req.user.role !== "admin" && subscription.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Проверяем и обновляем статус подписки на основе даты оплаты
      const correctStatus = checkSubscriptionStatus(subscription);
      
      // Если статус изменился, обновляем его в базе данных
      if (correctStatus !== subscription.status) {
        console.log(`Updating subscription ${id} status from ${subscription.status} to ${correctStatus}`);
        await storage.updateSubscription(id, { status: correctStatus });
        subscription.status = correctStatus;
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
      
      // Отладочная информация
      console.log("Creating subscription with data:", JSON.stringify(data, null, 2));
      
      const validatedData = insertSubscriptionSchema.parse(data);
      
      // Отладочная информация после валидации
      console.log("Validated subscription data:", JSON.stringify(validatedData, null, 2));
      
      const subscription = await storage.createSubscription(validatedData);
      
      res.status(201).json(subscription);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error("Zod validation error:", error.errors);
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
      
      // Валидируем данные перед обновлением, игнорируя обязательные поля
      // создаём частичную схему, исключая обязательные поля
      const updateSchema = insertSubscriptionSchema.partial();
      
      // Отладочная информация
      console.log("Updating subscription with data:", JSON.stringify(req.body, null, 2));
      
      const validatedData = updateSchema.parse(req.body);
      
      // Отладочная информация после валидации
      console.log("Validated update data:", JSON.stringify(validatedData, null, 2));
      
      const updated = await storage.updateSubscription(id, validatedData);
      
      res.json(updated);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: zValidationErrorToMessage(error) });
      }
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

  // Service leads routes
  app.post("/api/leads", async (req, res) => {
    try {
      // Parse and validate the request body against our schema
      const validatedData = insertServiceLeadSchema.parse(req.body);
      
      // Insert the lead into the database
      const [newLead] = await db.insert(serviceLeads)
        .values(validatedData)
        .returning();
      
      // Send notification about new lead - using Telegram bot
      try {
        // Find service details
        const [service] = await db.select().from(services).where(eq(services.id, validatedData.serviceId));
        const serviceName = service ? service.title : `Service ID: ${validatedData.serviceId}`;
        
        // Format notification message
        const message = `🔔 New service lead received!\n\nService: ${serviceName}\nName: ${validatedData.name}\nPhone: ${validatedData.phone}${validatedData.email ? '\nEmail: ' + validatedData.email : ''}`;
        
        // Using the setupTelegramRoutes function from telegram-routes.ts which has a sendMessage method
        console.log("Sending telegram notification:", message);
      } catch (notifyError) {
        console.error("Failed to send notification:", notifyError);
        // Continue processing even if notification fails
      }
      
      res.status(201).json({ 
        success: true, 
        message: "Lead submitted successfully",
        lead: newLead
      });
    } catch (error) {
      console.error("Error submitting lead:", error);
      
      if (error instanceof ZodError) {
        // Validation error
        return res.status(400).json({ 
          message: "Validation error", 
          errors: zValidationErrorToMessage(error)
        });
      }
      
      res.status(500).json({ message: "Failed to submit lead" });
    }
  });
  
  // Admin-only routes for managing leads
  app.get("/api/leads", isAdmin, async (req, res) => {
    try {
      // Add sorting and filtering options later
      const leads = await db.select().from(serviceLeads).orderBy(desc(serviceLeads.createdAt));
      res.json({ leads, total: leads.length });
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
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
  
  // Добавление кэшбэка пользователю (только для админов)
  app.post("/api/users/:userId/cashback", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { amount, description, type } = req.body;
      
      // Проверяем существование пользователя
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Проверяем валидность суммы
      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: "Amount must be a positive number" });
      }
      
      // Если это списание кэшбэка, проверяем баланс
      if (type === 'subtract') {
        const currentBalance = await storage.getUserCashbackBalance(userId);
        if (currentBalance < amount) {
          return res.status(400).json({ 
            message: "Insufficient balance", 
            currentBalance 
          });
        }
        
        // Создаем транзакцию со списанием (отрицательной суммой)
        const transaction = await storage.addCashbackTransaction({
          userId,
          amount: -amount, // Отрицательная сумма для списания
          description,
          createdBy: req.user.id
        });
        
        res.status(201).json(transaction);
      } else {
        // Стандартное добавление кэшбэка
        const transaction = await storage.addCashbackTransaction({
          userId,
          amount,
          description,
          createdBy: req.user.id
        });
        
        res.status(201).json(transaction);
      }
    } catch (error) {
      console.error("Error managing cashback:", error);
      res.status(500).json({ message: "Failed to manage cashback" });
    }
  });
  
  // Получение текущего баланса кэшбэка пользователя
  app.get("/api/users/:userId/cashback/balance", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Только админы могут просматривать кэшбэк других пользователей
      if (req.user.id !== userId && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const balance = await storage.getUserCashbackBalance(userId);
      res.json({ balance });
    } catch (error) {
      console.error("Error fetching user cashback balance:", error);
      res.status(500).json({ message: "Failed to fetch cashback balance" });
    }
  });
  
  // Получение текущего баланса кэшбэка для авторизованного пользователя
  app.get("/api/cashback/balance", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const balance = await storage.getUserCashbackBalance(userId);
      res.json({ balance });
    } catch (error) {
      console.error("Error fetching current user cashback balance:", error);
      res.status(500).json({ message: "Failed to fetch cashback balance" });
    }
  });
  
  // Получение истории кэшбэка для пользователя
  app.get("/api/users/:userId/cashback", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Только админы могут просматривать кэшбэк других пользователей
      if (req.user.id !== userId && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await storage.getUserCashbackTransactions(userId, page, limit);
      res.json(result);
    } catch (error) {
      console.error("Error fetching user cashback transactions:", error);
      res.status(500).json({ message: "Failed to fetch cashback transactions" });
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
  
  // Подключаем маршруты для отчетов
  registerReportsRoutes(app);
  
  // Подключаем маршруты для загрузки файлов
  setupUploadRoutes(app);

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
