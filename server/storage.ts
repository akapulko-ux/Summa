import { 
  users, 
  services, 
  subscriptions, 
  customFields,
  cashbackTransactions,
  type User, 
  type InsertUser, 
  type Service, 
  type InsertService,
  type Subscription,
  type InsertSubscription,
  type CustomField,
  type InsertCustomField,
  type CashbackTransaction,
  type InsertCashbackTransaction
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
  
  // Cashback operations
  getUserCashbackBalance(userId: number): Promise<number>;
  getUserTotalCashbackAmount(userId: number): Promise<number>;
  
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
  getClientsActivityStats(): Promise<any>;
  getSubscriptionCostsStats(period?: string): Promise<any[]>;
  
  // Cashback operations
  addCashbackTransaction(transaction: InsertCashbackTransaction): Promise<CashbackTransaction>;
  getUserCashbackTransactions(userId: number, page?: number, limit?: number): Promise<{ transactions: CashbackTransaction[], total: number }>;
  getCashbackStats(userId?: number, period?: string): Promise<any[]>;
  
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
    try {
      const result = await db.delete(services).where(eq(services.id, id));
      console.log(`Service deletion result for ID ${id}:`, result);
      return result.count > 0;
    } catch (error) {
      console.error(`Error deleting service with ID ${id}:`, error);
      throw error;
    }
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

  async listSubscriptions(
    userId?: number, 
    page = 1, 
    limit = 10, 
    search?: string,
    sortBy: string = "createdAt",
    sortOrder: "asc" | "desc" = "desc"
  ): Promise<{ subscriptions: any[], total: number }> {
    return dbOptimizer.executeQuery(async () => {
      const offset = (page - 1) * limit;
      
      // Строим базовый запрос с объединением таблиц subscriptions и services
      let query = db.select({
        // Поля подписки
        id: subscriptions.id,
        userId: subscriptions.userId,
        serviceId: subscriptions.serviceId,
        title: subscriptions.title,
        domain: subscriptions.domain,
        loginId: subscriptions.loginId,
        paymentPeriod: subscriptions.paymentPeriod,
        paidUntil: subscriptions.paidUntil,
        paymentAmount: subscriptions.paymentAmount,
        licensesCount: subscriptions.licensesCount,
        usersCount: subscriptions.usersCount,
        status: subscriptions.status,
        customFields: subscriptions.customFields,
        createdAt: subscriptions.createdAt,
        updatedAt: subscriptions.updatedAt,
        // Добавляем данные сервиса как вложенный объект
        service: {
          id: services.id,
          title: services.title,
          cashback: services.cashback,
          commission: services.commission,
          iconUrl: services.iconUrl,
          description: services.description,
        }
      })
      .from(subscriptions)
      .leftJoin(services, eq(subscriptions.serviceId, services.id));
      
      let countQuery = db.select({ count: sql<number>`count(*)` }).from(subscriptions);
      
      // Apply filters
      if (userId) {
        query = query.where(eq(subscriptions.userId, userId));
        countQuery = countQuery.where(eq(subscriptions.userId, userId));
      }
      
      // Apply search if provided
      if (search && search.trim() !== '') {
        const searchTerm = `%${search.trim()}%`;
        query = query.where(sql`(${subscriptions.title} ILIKE ${searchTerm})`);
        countQuery = countQuery.where(sql`(${subscriptions.title} ILIKE ${searchTerm})`);
      }
      
      // Применяем сортировку
      let result;
      
      // Проверяем, относится ли поле сортировки к связанной таблице service
      if (sortBy.startsWith('service.')) {
        const serviceField = sortBy.split('.')[1]; // Получаем имя поля сервиса после точки
        
        // Обрабатываем сортировку по полям сервиса
        if (serviceField === 'cashback') {
          result = await query
            .limit(limit)
            .offset(offset)
            .orderBy(sortOrder === "asc" ? asc(services.cashback) : desc(services.cashback));
        } else if (serviceField === 'title') {
          result = await query
            .limit(limit)
            .offset(offset)
            .orderBy(sortOrder === "asc" ? asc(services.title) : desc(services.title));
        } else {
          // По умолчанию сортируем по дате создания подписки
          result = await query
            .limit(limit)
            .offset(offset)
            .orderBy(sortOrder === "asc" ? asc(subscriptions.createdAt) : desc(subscriptions.createdAt));
        }
      } else {
        // Стандартная сортировка по полям подписки
        const sortColumn = subscriptions[sortBy as keyof typeof subscriptions] || subscriptions.createdAt;
        result = await query
          .limit(limit)
          .offset(offset)
          .orderBy(sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn));
      }
      
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
    return dbOptimizer.executeQueryWithCache(
      async () => {
        let timeFormat: string;
        let intervalDuration: string;
        
        // Установка форматов в зависимости от выбранного периода
        if (period === 'year') {
          timeFormat = 'YYYY';
          intervalDuration = '1 year';
        } else if (period === 'quarter') {
          timeFormat = 'YYYY-"Q"Q';
          intervalDuration = '3 months';
        } else {
          // По умолчанию месячный период
          timeFormat = 'YYYY-MM';
          intervalDuration = '1 month';
        }
        
        const result = await db.execute(sql`
          WITH periods AS (
            SELECT 
              to_char(date_series, ${timeFormat}) as date,
              date_series
            FROM generate_series(
              date_trunc('month', current_date - interval '1 year'),
              current_date,
              (${intervalDuration})::interval
            ) as date_series
          ),
          user_counts AS (
            SELECT 
              to_char(date_trunc('month', created_at), ${timeFormat}) as date,
              count(*) as count
            FROM users
            WHERE created_at >= current_date - interval '1 year'
            GROUP BY date
          )
          SELECT 
            p.date,
            COALESCE(uc.count, 0) as count
          FROM periods p
          LEFT JOIN user_counts uc ON p.date = uc.date
          ORDER BY p.date_series
        `);
        
        return result.rows.map(row => ({
          date: row.date,
          count: parseInt(row.count)
        }));
      },
      `user_registrations_${period}`,
      300, // кэшируем на 5 минут
      'getUserRegistrationsStats'
    );
  }
  
  async getCashbackStats(userId?: number, period: string = 'month'): Promise<any[]> {
    return dbOptimizer.executeQueryWithCache(
      async () => {
        let timeFormat: string;
        let intervalDuration: string;
        
        // Установка форматов в зависимости от выбранного периода
        if (period === 'year') {
          timeFormat = 'YYYY';
          intervalDuration = '1 year';
        } else if (period === 'quarter') {
          timeFormat = 'YYYY-"Q"Q';
          intervalDuration = '3 months';
        } else {
          // По умолчанию месячный период
          timeFormat = 'YYYY-MM';
          intervalDuration = '1 month';
        }
        
        // Базовый запрос с фильтром по пользователю, если он указан
        const userFilter = userId ? `AND s.user_id = ${userId}` : '';
        
        const query = sql`
          WITH periods AS (
            SELECT 
              to_char(date_series, ${timeFormat}) as period,
              date_series
            FROM generate_series(
              date_trunc('month', current_date - interval '1 year'),
              current_date,
              (${intervalDuration})::interval
            ) as date_series
          ),
          cashback_data AS (
            SELECT 
              to_char(date_trunc('month', s.created_at), ${timeFormat}) as period,
              SUM(
                CASE 
                  WHEN sv.cashback LIKE '%\\%' THEN 
                    (s.payment_amount * CAST(REPLACE(sv.cashback, '%', '') AS DECIMAL) / 100)
                  ELSE 
                    CAST(COALESCE(sv.cashback, '0') AS DECIMAL)
                END
              ) as amount
            FROM subscriptions s
            JOIN services sv ON s.service_id = sv.id
            WHERE sv.cashback IS NOT NULL AND sv.cashback != '' ${sql.raw(userFilter)}
            GROUP BY period
          )
          SELECT 
            p.period,
            COALESCE(cd.amount, 0) as amount
          FROM periods p
          LEFT JOIN cashback_data cd ON p.period = cd.period
          ORDER BY p.date_series
        `;
        
        const result = await db.execute(query);
        
        return result.rows.map(row => ({
          period: row.period,
          amount: parseFloat(row.amount).toFixed(2)
        }));
      },
      `cashback_stats_${period}_${userId || 'all'}`,
      300, // кэшируем на 5 минут
      'getCashbackStats'
    );
  }
  
  async getClientsActivityStats(): Promise<any> {
    return dbOptimizer.executeQueryWithCache(
      async () => {
        // Подсчет активных клиентов
        const activeClientsQuery = await db
          .select({ count: sql<number>`count(*)` })
          .from(users)
          .where(
            and(
              eq(users.role, 'client'),
              eq(users.isActive, true)
            )
          );
        
        // Подсчет неактивных клиентов
        const inactiveClientsQuery = await db
          .select({ count: sql<number>`count(*)` })
          .from(users)
          .where(
            and(
              eq(users.role, 'client'),
              eq(users.isActive, false)
            )
          );
        
        // Общее количество клиентов
        const totalClientsQuery = await db
          .select({ count: sql<number>`count(*)` })
          .from(users)
          .where(eq(users.role, 'client'));
        
        const activeCount = activeClientsQuery[0]?.count || 0;
        const inactiveCount = inactiveClientsQuery[0]?.count || 0;
        const totalCount = totalClientsQuery[0]?.count || 0;
        
        // Расчет процента активных клиентов
        const activePercentage = totalCount > 0 
          ? ((activeCount / totalCount) * 100).toFixed(1) 
          : '0.0';
        
        return {
          active: activeCount,
          inactive: inactiveCount,
          total: totalCount,
          activePercentage
        };
      },
      'clients_activity_stats',
      300, // кэшируем на 5 минут
      'getClientsActivityStats'
    );
  }
  
  async getSubscriptionCostsStats(period: string = 'month'): Promise<any[]> {
    return dbOptimizer.executeQueryWithCache(
      async () => {
        let timeFormat: string;
        let intervalDuration: string;
        
        // Установка форматов в зависимости от выбранного периода
        if (period === 'year') {
          timeFormat = 'YYYY';
          intervalDuration = '1 year';
        } else if (period === 'quarter') {
          timeFormat = 'YYYY-"Q"Q';
          intervalDuration = '3 months';
        } else {
          // По умолчанию месячный период
          timeFormat = 'YYYY-MM';
          intervalDuration = '1 month';
        }
        
        const result = await db.execute(sql`
          WITH periods AS (
            SELECT 
              to_char(date_series, ${timeFormat}) as period,
              date_series
            FROM generate_series(
              date_trunc('month', current_date - interval '1 year'),
              current_date,
              (${intervalDuration})::interval
            ) as date_series
          ),
          subscription_costs AS (
            SELECT 
              to_char(date_trunc('month', created_at), ${timeFormat}) as period,
              AVG(payment_amount) as avg_price,
              MIN(payment_amount) as min_price,
              MAX(payment_amount) as max_price,
              COUNT(*) as count
            FROM subscriptions
            WHERE payment_amount IS NOT NULL AND payment_amount > 0
            GROUP BY period
          )
          SELECT 
            p.period,
            COALESCE(sc.avg_price, 0) as avg_price,
            COALESCE(sc.min_price, 0) as min_price,
            COALESCE(sc.max_price, 0) as max_price,
            COALESCE(sc.count, 0) as count
          FROM periods p
          LEFT JOIN subscription_costs sc ON p.period = sc.period
          ORDER BY p.date_series
        `);
        
        return result.rows.map(row => ({
          period: row.period,
          avgPrice: parseFloat(row.avg_price).toFixed(2),
          minPrice: parseFloat(row.min_price).toFixed(2),
          maxPrice: parseFloat(row.max_price).toFixed(2),
          count: parseInt(row.count)
        }));
      },
      `subscription_costs_${period}`,
      300, // кэшируем на 5 минут
      'getSubscriptionCostsStats'
    );
  }
  
  // Методы для работы с кэшбэком
  
  /**
   * Получить текущий баланс кэшбэка пользователя
   * @param userId ID пользователя
   * @returns Текущий баланс кэшбэка
   */
  async getUserCashbackBalance(userId: number): Promise<number> {
    // Получаем последнюю транзакцию для пользователя
    const [lastTransaction] = await db
      .select()
      .from(cashbackTransactions)
      .where(eq(cashbackTransactions.userId, userId))
      .orderBy(desc(cashbackTransactions.id))
      .limit(1);
    
    // Возвращаем текущий баланс или 0, если транзакций нет
    return lastTransaction?.balanceAfter || 0;
  }
  
  /**
   * Получить общую сумму всех начисленных кэшбэков пользователя
   * @param userId ID пользователя
   * @returns Общая сумма всех положительных транзакций кэшбэка
   */
  async getUserTotalCashbackAmount(userId: number): Promise<number> {
    // Выбираем только положительные транзакции (начисления) и суммируем их
    const [result] = await db
      .select({
        total: sql`COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0)`.mapWith(Number)
      })
      .from(cashbackTransactions)
      .where(eq(cashbackTransactions.userId, userId));
    
    return result.total || 0;
  }
  
  /**
   * Добавить новую транзакцию кэшбэка
   */
  async addCashbackTransaction(transaction: InsertCashbackTransaction): Promise<CashbackTransaction> {
    // Здесь нужно реализовать расчет текущего баланса кэшбэка для пользователя
    // и обновить поле balanceAfter в транзакции
    
    // 1. Получаем текущий баланс кэшбэка пользователя
    const currentBalance = await this.getUserCashbackBalance(transaction.userId);
    
    // 2. Рассчитываем новый баланс
    const newBalance = currentBalance + transaction.amount;
    
    // 3. Добавляем информацию о новом балансе в транзакцию
    const transactionWithBalance = {
      ...transaction,
      balanceAfter: newBalance
    };
    
    // 4. Сохраняем транзакцию в базу
    const [result] = await db
      .insert(cashbackTransactions)
      .values(transactionWithBalance)
      .returning();
    
    return result;
  }
  
  async getUserCashbackTransactions(userId: number, page: number = 1, limit: number = 10): Promise<{ transactions: CashbackTransaction[], total: number }> {
    // Получаем общее количество транзакций для пользователя
    const [totalResult] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(cashbackTransactions)
      .where(eq(cashbackTransactions.userId, userId));
    
    const total = totalResult.count;
    
    // Получаем транзакции с пагинацией
    const transactions = await db
      .select()
      .from(cashbackTransactions)
      .where(eq(cashbackTransactions.userId, userId))
      .orderBy(desc(cashbackTransactions.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);
    
    return { transactions, total };
  }
  
  async getCashbackStats(userId?: number, period: string = 'month'): Promise<any[]> {
    return dbOptimizer.executeQueryWithCache(
      async () => {
        let timeFormat: string;
        
        // Установка форматов в зависимости от выбранного периода
        if (period === 'year') {
          timeFormat = 'YYYY';
        } else if (period === 'quarter') {
          timeFormat = 'YYYY-"Q"Q';
        } else if (period === 'week') {
          timeFormat = 'YYYY-"W"WW';
        } else {
          // По умолчанию - месяц
          timeFormat = 'YYYY-MM';
        }
        
        // SQL запрос для получения статистики кэшбэка
        const query = `
          WITH periods AS (
            SELECT 
              to_char(date_trunc('${period}', ct.created_at), '${timeFormat}') AS period,
              SUM(ct.amount) AS total_amount,
              COUNT(*) AS transaction_count
            FROM 
              cashback_transactions ct
            ${userId ? `WHERE ct.user_id = ${userId}` : ''}
            GROUP BY 
              period
            ORDER BY 
              period
          )
          SELECT 
            period,
            total_amount,
            transaction_count
          FROM 
            periods p
          ORDER BY 
            period;
        `;
        
        const result = await pool.query(query);
        return result.rows;
      },
      `cashback_stats_${userId || 'all'}_${period}`,
      300, // кэшируем на 5 минут
      'getCashbackStats'
    );
  }
  
  async deleteUser(id: number): Promise<boolean> {
    try {
      // Проверяем существование пользователя перед удалением
      const user = await this.getUser(id);
      if (!user) {
        return false;
      }
      
      // Перед удалением пользователя, удаляем все связанные записи
      // Удаляем все транзакции кэшбэка пользователя
      await db.delete(cashbackTransactions).where(eq(cashbackTransactions.userId, id));
      
      // Удаляем все подписки пользователя
      await db.delete(subscriptions).where(eq(subscriptions.userId, id));
      
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
