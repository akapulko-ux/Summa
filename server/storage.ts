import { 
  users, 
  services, 
  subscriptions, 
  customFields,
  type User, 
  type InsertUser, 
  type Service, 
  type InsertService,
  type Subscription,
  type InsertSubscription,
  type CustomField,
  type InsertCustomField
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, desc, asc, like, or, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { dbOptimizer } from "./db-optimizer";
import { count } from "drizzle-orm";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  listUsers(page?: number, limit?: number, search?: string): Promise<{ users: User[], total: number }>;
  
  // Service operations
  getService(id: number): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: number): Promise<boolean>;
  listServices(
    page?: number, 
    limit?: number,
    filters?: { 
      search?: string; 
      status?: 'all' | 'active' | 'inactive'; 
      sortBy?: string; 
      sortOrder?: 'asc' | 'desc' 
    }
  ): Promise<{ services: Service[], total: number }>;
  getServiceClients(serviceId: number): Promise<User[]>;
  
  // Subscription operations
  getSubscription(id: number): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, subscription: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  deleteSubscription(id: number): Promise<boolean>;
  listSubscriptions(userId?: number, page?: number, limit?: number): Promise<{ subscriptions: Subscription[], total: number }>;
  
  // Custom fields operations
  getCustomField(id: number): Promise<CustomField | undefined>;
  createCustomField(field: InsertCustomField): Promise<CustomField>;
  updateCustomField(id: number, field: Partial<InsertCustomField>): Promise<CustomField | undefined>;
  deleteCustomField(id: number): Promise<boolean>;
  listCustomFields(entityType: string, entityId: number): Promise<CustomField[]>;
  
  // Stats and analytics
  getSubscriptionStats(): Promise<any>;
  getUserStats(): Promise<any>;
  getServicePopularity(): Promise<any>;
  
  // Расширенная аналитика
  getUserRegistrationsStats(period: string): Promise<any[]>;
  getCashbackStats(userId?: number, period?: string): Promise<any[]>;
  getClientsActivityStats(): Promise<any>;
  getSubscriptionCostsStats(period?: string): Promise<any[]>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async listUsers(page = 1, limit = 10, search?: string): Promise<{ users: User[], total: number }> {
    const offset = (page - 1) * limit;
    
    let query = db.select().from(users);
    
    if (search) {
      query = query.where(
        or(
          like(users.email, `%${search}%`),
          like(users.name, `%${search}%`),
          like(users.companyName, `%${search}%`)
        )
      );
    }
    
    const result = await query.limit(limit).offset(offset).orderBy(desc(users.createdAt));
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    
    return { users: result, total: count };
  }

  // Service methods
  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async createService(serviceData: InsertService): Promise<Service> {
    const [service] = await db.insert(services).values(serviceData).returning();
    return service;
  }

  async updateService(id: number, serviceData: Partial<InsertService>): Promise<Service | undefined> {
    const [updated] = await db
      .update(services)
      .set({ ...serviceData, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    return updated;
  }

  async deleteService(id: number): Promise<boolean> {
    const result = await db.delete(services).where(eq(services.id, id));
    return result.count > 0;
  }

  async listServices(
    page = 1, 
    limit = 10, 
    filters?: { 
      search?: string; 
      status?: 'all' | 'active' | 'inactive'; 
      sortBy?: string; 
      sortOrder?: 'asc' | 'desc';
      customFilter?: {
        showPublic?: boolean;
        hideCustom?: boolean;
        ownerId?: number;
      }
    }
  ): Promise<{ services: Service[], total: number }> {
    return dbOptimizer.executeQuery(async () => {
      const offset = (page - 1) * limit;
      
      // Build the query
      let query = db.select().from(services);
      
      // Apply filters
      if (filters) {
        // Search filter
        if (filters.search) {
          query = query.where(
            or(
              sql`LOWER(${services.title}) LIKE LOWER(${'%' + filters.search + '%'})`,
              sql`LOWER(${services.description}) LIKE LOWER(${'%' + filters.search + '%'})`
            )
          );
        }
        
        // Status filter
        if (filters.status === 'active') {
          query = query.where(eq(services.isActive, true));
        } else if (filters.status === 'inactive') {
          query = query.where(eq(services.isActive, false));
        }
        
        // Custom services filters
        if (filters.customFilter) {
          const customFilter = filters.customFilter;
          
          // Условия для фильтрации
          const conditions: SQL[] = [];
          
          // Показывать общедоступные сервисы (isCustom = false)
          if (customFilter.showPublic) {
            conditions.push(eq(services.isCustom, false));
          }
          
          // Показывать кастомные сервисы конкретного пользователя
          if (customFilter.ownerId) {
            conditions.push(
              and(
                eq(services.isCustom, true),
                eq(services.ownerId, customFilter.ownerId)
              )
            );
          }
          
          // Скрывать все кастомные сервисы
          if (customFilter.hideCustom) {
            query = query.where(eq(services.isCustom, false));
          } 
          // Если указаны условия для отображения и они не включают hideCustom
          else if (conditions.length > 0) {
            query = query.where(or(...conditions));
          }
        }
      }
      
      // Count total (before applying limit/offset)
      let countQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(services);
      
      // Apply the same filters to the count query
      if (filters) {
        if (filters.search) {
          countQuery = countQuery.where(
            or(
              sql`LOWER(${services.title}) LIKE LOWER(${'%' + filters.search + '%'})`,
              sql`LOWER(${services.description}) LIKE LOWER(${'%' + filters.search + '%'})`
            )
          );
        }
        
        if (filters.status === 'active') {
          countQuery = countQuery.where(eq(services.isActive, true));
        } else if (filters.status === 'inactive') {
          countQuery = countQuery.where(eq(services.isActive, false));
        }
        
        // Custom services filters (для подсчета)
        if (filters.customFilter) {
          const customFilter = filters.customFilter;
          
          // Условия для фильтрации
          const conditions: SQL[] = [];
          
          // Показывать общедоступные сервисы (isCustom = false)
          if (customFilter.showPublic) {
            conditions.push(eq(services.isCustom, false));
          }
          
          // Показывать кастомные сервисы конкретного пользователя
          if (customFilter.ownerId) {
            conditions.push(
              and(
                eq(services.isCustom, true),
                eq(services.ownerId, customFilter.ownerId)
              )
            );
          }
          
          // Скрывать все кастомные сервисы
          if (customFilter.hideCustom) {
            countQuery = countQuery.where(eq(services.isCustom, false));
          } 
          // Если указаны условия для отображения и они не включают hideCustom
          else if (conditions.length > 0) {
            countQuery = countQuery.where(or(...conditions));
          }
        }
      }
      
      // Apply sorting
      if (filters?.sortBy) {
        const order = filters.sortOrder === 'desc' ? desc : asc;
        
        // Handle different sort fields
        switch (filters.sortBy) {
          case 'title':
            query = query.orderBy(order(services.title));
            break;
          case 'createdAt':
            query = query.orderBy(order(services.createdAt));
            break;
          case 'updatedAt':
            query = query.orderBy(order(services.updatedAt));
            break;
          default:
            query = query.orderBy(asc(services.title)); // Default sorting
        }
      } else {
        // Default sorting
        query = query.orderBy(asc(services.title));
      }
      
      // Apply pagination
      query = query.limit(limit).offset(offset);
      
      // Execute both queries
      const result = await query;
      const [{ count }] = await countQuery;
      
      return { services: result, total: count };
    }, "listServices");
  }
  
  async getServiceClients(serviceId: number): Promise<User[]> {
    return dbOptimizer.executeQuery(async () => {
      // Get distinct users who have subscriptions to this service
      const result = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          companyName: users.companyName,
          phone: users.phone,
          isActive: users.isActive,
          role: users.role,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
          telegramChatId: users.telegramChatId,
          passwordHash: users.passwordHash
        })
        .from(users)
        .innerJoin(
          subscriptions,
          and(
            eq(users.id, subscriptions.userId),
            eq(subscriptions.serviceId, serviceId)
          )
        )
        .groupBy(users.id);
      
      return result;
    }, "getServiceClients");
  }

  // Subscription methods
  async getSubscription(id: number): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
    return subscription;
  }

  async createSubscription(subscriptionData: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db.insert(subscriptions).values(subscriptionData).returning();
    return subscription;
  }

  async updateSubscription(id: number, subscriptionData: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const [updated] = await db
      .update(subscriptions)
      .set({ ...subscriptionData, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return updated;
  }

  async deleteSubscription(id: number): Promise<boolean> {
    const result = await db.delete(subscriptions).where(eq(subscriptions.id, id));
    return result.count > 0;
  }

  async listSubscriptions(userId?: number, page = 1, limit = 10): Promise<{ subscriptions: Subscription[], total: number }> {
    return dbOptimizer.executeQuery(async () => {
      const offset = (page - 1) * limit;
      
      let query = db.select().from(subscriptions);
      let countQuery = db.select({ count: sql<number>`count(*)` }).from(subscriptions);
      
      if (userId) {
        query = query.where(eq(subscriptions.userId, userId));
        countQuery = countQuery.where(eq(subscriptions.userId, userId));
      }
      
      const result = await query.limit(limit).offset(offset).orderBy(desc(subscriptions.createdAt));
      const [{ count }] = await countQuery;
      
      return { subscriptions: result, total: count };
    }, "listSubscriptions");
  }

  // Custom fields methods
  async getCustomField(id: number): Promise<CustomField | undefined> {
    const [field] = await db.select().from(customFields).where(eq(customFields.id, id));
    return field;
  }

  async createCustomField(fieldData: InsertCustomField): Promise<CustomField> {
    const [field] = await db.insert(customFields).values(fieldData).returning();
    return field;
  }

  async updateCustomField(id: number, fieldData: Partial<InsertCustomField>): Promise<CustomField | undefined> {
    const [updated] = await db
      .update(customFields)
      .set({ ...fieldData, updatedAt: new Date() })
      .where(eq(customFields.id, id))
      .returning();
    return updated;
  }

  async deleteCustomField(id: number): Promise<boolean> {
    const result = await db.delete(customFields).where(eq(customFields.id, id));
    return result.count > 0;
  }

  async listCustomFields(entityType: string, entityId: number): Promise<CustomField[]> {
    return db
      .select()
      .from(customFields)
      .where(
        and(
          eq(customFields.entityType, entityType),
          eq(customFields.entityId, entityId)
        )
      );
  }

  // Stats and analytics
  async getSubscriptionStats(): Promise<any> {
    return dbOptimizer.executeQueryWithCache(
      async () => {
        const activeSubscriptions = await db
          .select({ count: sql<number>`count(*)` })
          .from(subscriptions)
          .where(eq(subscriptions.status, 'active'));
        
        const totalRevenue = await db
          .select({ sum: sql<number>`sum(payment_amount)` })
          .from(subscriptions);
        
        const subscriptionsByPeriod = await db
          .select({
            period: subscriptions.paymentPeriod,
            count: sql<number>`count(*)`
          })
          .from(subscriptions)
          .groupBy(subscriptions.paymentPeriod);
        
        return {
          activeCount: activeSubscriptions[0].count,
          totalRevenue: totalRevenue[0].sum || 0,
          byPeriod: subscriptionsByPeriod
        };
      },
      'subscription_stats',
      300, // кэшируем на 5 минут
      'getSubscriptionStats'
    );
  }

  async getUserStats(): Promise<any> {
    return dbOptimizer.executeQuery(async () => {
      const totalUsers = await db
        .select({ count: sql<number>`count(*)` })
        .from(users);
      
      const activeUsers = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.isActive, true));
      
      const newUsersLastMonth = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(
          sql`created_at > current_date - interval '1 month'`
        );
      
      return {
        total: totalUsers[0].count,
        active: activeUsers[0].count,
        newLastMonth: newUsersLastMonth[0].count
      };
    }, "getUserStats");
  }

  async getServicePopularity(): Promise<any> {
    // Используем кэширование для этого отчета, так как он не меняется часто
    return dbOptimizer.executeQueryWithCache(
      () => db
        .select({
          serviceId: subscriptions.serviceId,
          serviceTitle: services.title,
          count: sql<number>`count(*)`
        })
        .from(subscriptions)
        .leftJoin(services, eq(subscriptions.serviceId, services.id))
        .groupBy(subscriptions.serviceId, services.title)
        .orderBy(desc(sql<number>`count(*)`))
        .limit(5),
      'service_popularity',
      600, // кэшируем на 10 минут
      'getServicePopularity'
    );
  }

  // Новые методы для расширенной аналитики

  async getUserRegistrationsStats(period: string): Promise<any[]> {
    // Заглушка для статистики регистраций пользователей
    // В реальном приложении здесь должен быть SQL-запрос
    const registrationData = [
      { date: '2024-01', count: 12 },
      { date: '2024-02', count: 18 },
      { date: '2024-03', count: 15 },
      { date: '2024-04', count: 22 },
      { date: '2024-05', count: 28 }
    ];
    
    return registrationData;
  }
  
  async getCashbackStats(userId?: number, period: string = 'month'): Promise<any[]> {
    // Заглушка для данных о кэшбэке
    // В реальном приложении здесь должен быть SQL-запрос
    const cashbackData = [
      { period: '2024-01', amount: '24.50' },
      { period: '2024-02', amount: '35.75' },
      { period: '2024-03', amount: '42.20' },
      { period: '2024-04', amount: '18.90' },
      { period: '2024-05', amount: '29.30' }
    ];
    
    return cashbackData;
  }
  
  async getClientsActivityStats(): Promise<any> {
    // Заглушка для статистики активности клиентов
    // В реальном приложении здесь должен быть SQL-запрос
    return {
      active: 35,
      inactive: 15,
      total: 50,
      activePercentage: '70.0'
    };
  }
  
  async getSubscriptionCostsStats(period: string = 'month'): Promise<any[]> {
    // Заглушка для статистики по стоимости подписок
    // В реальном приложении здесь должен быть SQL-запрос
    const costData = [
      { period: '2024-01', avgPrice: '24.99', minPrice: '9.99', maxPrice: '49.99', count: 18 },
      { period: '2024-02', avgPrice: '26.50', minPrice: '9.99', maxPrice: '59.99', count: 22 },
      { period: '2024-03', avgPrice: '28.75', minPrice: '14.99', maxPrice: '69.99', count: 20 },
      { period: '2024-04', avgPrice: '29.90', minPrice: '14.99', maxPrice: '79.99', count: 25 },
      { period: '2024-05', avgPrice: '32.50', minPrice: '19.99', maxPrice: '99.99', count: 30 }
    ];
    
    return costData;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    try {
      // Проверяем существование пользователя перед удалением
      const user = await this.getUser(id);
      if (!user) {
        return false;
      }
      
      // Удаляем пользователя
      const result = await db.delete(users).where(eq(users.id, id));
      
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
