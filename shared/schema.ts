import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, foreignKey, jsonb, doublePrecision, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'client']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'pending', 'expired', 'canceled']);
export const paymentPeriodEnum = pgEnum('payment_period', ['monthly', 'quarterly', 'yearly']);
export const fieldTypeEnum = pgEnum('field_type', ['text', 'number', 'boolean', 'date', 'select']);

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  phone: text('phone'),
  name: text('name'),
  companyName: text('company_name'),
  inn: text('inn'),
  telegramId: text('telegram_id'),
  telegramChatId: text('telegram_chat_id'),
  isActive: boolean('is_active').default(true).notNull(),
  role: userRoleEnum('role').default('client').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Services table
export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  iconUrl: text('icon_url'),
  iconData: text('icon_data'), // Хранение изображения в формате base64
  iconMimeType: text('icon_mime_type'), // MIME-тип сохраненного изображения
  description: text('description'),
  cashback: text('cashback'), // Can be either fixed amount or percentage like "5%" or "10.00"
  commission: text('commission'), // Commission charged by the service, can be fixed amount or percentage
  customFields: jsonb('custom_fields').default({}),
  isActive: boolean('is_active').default(true).notNull(),
  isCustom: boolean('is_custom').default(false), // Флаг для определения кастомных сервисов клиентов
  ownerId: integer('owner_id').references(() => users.id), // ID владельца кастомного сервиса (null для публичных сервисов)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Subscriptions table
export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  serviceId: integer('service_id').references(() => services.id),
  title: text('title').notNull(),
  domain: text('domain'),
  loginId: text('login_id'),
  paymentPeriod: paymentPeriodEnum('payment_period').default('monthly'),
  paidUntil: timestamp('paid_until'),
  paymentAmount: doublePrecision('payment_amount'),
  licensesCount: integer('licenses_count').default(1),
  usersCount: integer('users_count').default(1),
  status: subscriptionStatusEnum('status').default('active'),
  customFields: jsonb('custom_fields').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Custom fields table
export const customFields = pgTable('custom_fields', {
  id: serial('id').primaryKey(),
  entityType: text('entity_type').notNull(), // "user", "service", "subscription"
  entityId: integer('entity_id').notNull(),
  fieldName: text('field_name').notNull(),
  fieldType: fieldTypeEnum('field_type').notNull(),
  fieldValue: text('field_value'),
  isVisibleForUser: boolean('is_visible_for_user').default(true),
  isRequired: boolean('is_required').default(false),
  minValue: doublePrecision('min_value'),
  maxValue: doublePrecision('max_value'),
  minLength: integer('min_length'),
  maxLength: integer('max_length'),
  pattern: text('pattern'),
  options: text('options'), // для полей типа select: список опций, разделенных запятой
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  passwordHash: z.string().optional(),
  phone: z.string().optional(),
  name: z.string().optional(),
  companyName: z.string().optional(),
  inn: z.string().optional(),
  telegramId: z.string().optional(),
  telegramChatId: z.string().optional(),
  isActive: z.boolean().default(true),
  role: z.enum(['admin', 'client']).default('client'),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertServiceSchema = createInsertSchema(services, {
  title: z.string().min(1),
  iconUrl: z.string().optional(),
  iconData: z.string().optional(),
  iconMimeType: z.string().optional(),
  description: z.string().optional(),
  cashback: z.string().optional(),
  commission: z.string().optional(),
  customFields: z.record(z.any()).optional(),
  isActive: z.boolean().default(true),
  isCustom: z.boolean().default(false),
  ownerId: z.number().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertSubscriptionSchema = createInsertSchema(subscriptions, {
  userId: z.number(),
  serviceId: z.number().optional(),
  title: z.string().min(1),
  domain: z.union([z.string(), z.null()]).optional(),
  loginId: z.union([z.string(), z.null()]).optional(),
  paymentPeriod: z.enum(['monthly', 'quarterly', 'yearly']).default('monthly'),
  paidUntil: z.string().optional().transform(val => {
    if (!val) return undefined;
    try {
      // Преобразуем строку даты в ISO формат
      const date = new Date(val);
      return !isNaN(date.getTime()) ? date : undefined;
    } catch (e) {
      console.error("Error parsing date:", e);
      return undefined;
    }
  }),
  paymentAmount: z.number().optional(),
  licensesCount: z.union([z.number(), z.literal(1)]).default(1).optional(),
  usersCount: z.union([z.number(), z.literal(1)]).default(1).optional(),
  status: z.enum(['active', 'pending', 'expired', 'canceled']).default('active'),
  customFields: z.record(z.any()).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertCustomFieldSchema = createInsertSchema(customFields, {
  entityType: z.string(),
  entityId: z.number(),
  fieldName: z.string(),
  fieldType: z.enum(['text', 'number', 'boolean', 'date', 'select']),
  fieldValue: z.string().optional(),
  isVisibleForUser: z.boolean().default(true),
  isRequired: z.boolean().default(false),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  pattern: z.string().optional(),
  options: z.string().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

// Системные настройки
export const systemSettings = pgTable('system_settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings, {
  key: z.string().min(1),
  value: z.string().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

// Cashback transactions table
export const cashbackTransactions = pgTable('cashback_transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  amount: doublePrecision('amount').notNull(),
  description: text('description'),
  balanceAfter: doublePrecision('balance_after'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: integer('created_by').references(() => users.id), // Admin who added the cashback
});

export const insertCashbackTransactionSchema = createInsertSchema(cashbackTransactions, {
  userId: z.number(),
  amount: z.number(),
  description: z.string().optional(),
  balanceAfter: z.number().optional(),
  createdBy: z.number().optional(),
}).omit({ id: true, createdAt: true });

// Backup metadata table
export const backupTypeEnum = pgEnum('backup_type', ['manual', 'auto', 'pre-restore', 'imported', 'unknown']);
export const backupFormatEnum = pgEnum('backup_format', ['plain', 'custom', 'directory', 'tar', 'compressed', 'unknown']);

export const backupMetadata = pgTable('backup_metadata', {
  id: serial('id').primaryKey(),
  fileName: text('file_name').notNull().unique(),
  size: integer('size').notNull(),
  type: backupTypeEnum('type').default('unknown'),
  format: backupFormatEnum('format').default('unknown'),
  schemas: jsonb('schemas').default([]),
  tables: jsonb('tables').default([]),
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: integer('created_by').references(() => users.id),
});

export const insertBackupMetadataSchema = createInsertSchema(backupMetadata, {
  fileName: z.string().min(1),
  size: z.number(),
  type: z.enum(['manual', 'auto', 'pre-restore', 'imported', 'unknown']).default('unknown'),
  format: z.enum(['plain', 'custom', 'directory', 'tar', 'compressed', 'unknown']).default('unknown'),
  schemas: z.array(z.string()).default([]),
  tables: z.array(z.string()).default([]),
  comment: z.string().optional(),
  createdBy: z.number().optional(),
}).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type CustomField = typeof customFields.$inferSelect;
export type InsertCustomField = z.infer<typeof insertCustomFieldSchema>;

export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;

export type BackupMetadata = typeof backupMetadata.$inferSelect;
export type InsertBackupMetadata = z.infer<typeof insertBackupMetadataSchema>;

export type CashbackTransaction = typeof cashbackTransactions.$inferSelect;
export type InsertCashbackTransaction = z.infer<typeof insertCashbackTransactionSchema>;

// Leads table
export const serviceLeads = pgTable('service_leads', {
  id: serial('id').primaryKey(),
  serviceId: integer('service_id').references(() => services.id).notNull(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  status: text('status').default('new').notNull(), // новая, обработана, отклонена
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertServiceLeadSchema = createInsertSchema(serviceLeads, {
  serviceId: z.number(),
  name: z.string().min(2),
  phone: z.string().min(5),
  email: z.string().email().optional().or(z.literal("")),
}).omit({ id: true, status: true, createdAt: true, updatedAt: true });

export type ServiceLead = typeof serviceLeads.$inferSelect;
export type InsertServiceLead = z.infer<typeof insertServiceLeadSchema>;

// Auth related schemas for client side validation
export const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export const registerSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }).optional(),
  companyName: z.string().optional(),
  phone: z.string().optional(),
});

export const magicLinkSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
});

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type MagicLinkData = z.infer<typeof magicLinkSchema>;
