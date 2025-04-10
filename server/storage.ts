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

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  listUsers(page?: number, limit?: number, search?: string): Promise<{ users: User[], total: number }>;
  
  // Service operations
  getService(id: number): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: number): Promise<boolean>;
  listServices(page?: number, limit?: number): Promise<{ services: Service[], total: number }>;
  
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

  async listServices(page = 1, limit = 10): Promise<{ services: Service[], total: number }> {
    const offset = (page - 1) * limit;
    const result = await db.select().from(services).limit(limit).offset(offset).orderBy(asc(services.title));
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(services);
    
    return { services: result, total: count };
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
  }

  async getUserStats(): Promise<any> {
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
  }

  async getServicePopularity(): Promise<any> {
    return db
      .select({
        serviceId: subscriptions.serviceId,
        serviceTitle: services.title,
        count: sql<number>`count(*)`
      })
      .from(subscriptions)
      .leftJoin(services, eq(subscriptions.serviceId, services.id))
      .groupBy(subscriptions.serviceId, services.title)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(5);
  }
}

export const storage = new DatabaseStorage();
