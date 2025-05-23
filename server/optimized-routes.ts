/**
 * Оптимизированные API маршруты с кэшированием
 */
import type { Express } from "express";
import { db } from "./db";
import { eq, and, desc, sql, count } from "drizzle-orm";
import { users, services, subscriptions, cashbackTransactions } from "@shared/schema";
import { cacheManager, CACHE_KEYS, CACHE_TTL } from "./cache";
import { dbOptimizer } from "./db-optimizer";

export function setupOptimizedRoutes(app: Express) {
  // Middleware для проверки аутентификации
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Оптимизированный эндпоинт для получения сервисов с кэшированием
  app.get("/api/services/optimized", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const isAdmin = req.user.role === "admin";
      
      const cacheKey = isAdmin ? CACHE_KEYS.SERVICES : CACHE_KEYS.USER_SERVICES(userId);
      
      const services = await cacheManager.getOrSet(
        cacheKey,
        async () => {
          return await dbOptimizer.executeQueryWithCache(
            async () => {
              if (isAdmin) {
                // Админ видит все сервисы
                return await db
                  .select()
                  .from(services)
                  .where(eq(services.isActive, true))
                  .orderBy(services.title);
              } else {
                // Клиент видит только публичные сервисы и свои кастомные
                return await db
                  .select()
                  .from(services)
                  .where(
                    and(
                      eq(services.isActive, true),
                      sql`(${services.isCustom} = false OR ${services.ownerId} = ${userId})`
                    )
                  )
                  .orderBy(services.title);
              }
            },
            cacheKey,
            CACHE_TTL.SERVICES,
            "get_services_optimized"
          );
        },
        { ttl: CACHE_TTL.SERVICES }
      );

      res.json({ services });
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  // Оптимизированный эндпоинт для получения подписок пользователя
  app.get("/api/subscriptions/optimized", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const cacheKey = `${CACHE_KEYS.USER_SUBSCRIPTIONS(userId)}:page:${page}:limit:${limit}`;
      
      const result = await cacheManager.getOrSet(
        cacheKey,
        async () => {
          return await dbOptimizer.executeQueryWithCache(
            async () => {
              // Получаем подписки с сервисами в одном запросе
              const subscriptionsData = await db
                .select({
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
                  service: {
                    id: services.id,
                    title: services.title,
                    iconUrl: services.iconUrl,
                    iconData: services.iconData,
                    iconMimeType: services.iconMimeType,
                    description: services.description,
                    cashback: services.cashback,
                    commission: services.commission,
                    customFields: services.customFields,
                  }
                })
                .from(subscriptions)
                .leftJoin(services, eq(subscriptions.serviceId, services.id))
                .where(eq(subscriptions.userId, userId))
                .orderBy(desc(subscriptions.createdAt))
                .limit(limit)
                .offset((page - 1) * limit);

              // Получаем общее количество подписок
              const [totalResult] = await db
                .select({ count: count() })
                .from(subscriptions)
                .where(eq(subscriptions.userId, userId));

              return {
                subscriptions: subscriptionsData,
                total: totalResult.count.toString(),
                page,
                limit
              };
            },
            cacheKey,
            CACHE_TTL.USER_DATA,
            "get_user_subscriptions_optimized"
          );
        },
        { ttl: CACHE_TTL.USER_DATA }
      );

      res.json(result);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  // Оптимизированный эндпоинт для получения общего кэшбэка
  app.get("/api/cashback/total/optimized", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const cacheKey = CACHE_KEYS.USER_CASHBACK_TOTAL(userId);
      
      const total = await cacheManager.getOrSet(
        cacheKey,
        async () => {
          return await dbOptimizer.executeQueryWithCache(
            async () => {
              const [result] = await db
                .select({ 
                  total: sql<number>`COALESCE(SUM(${cashbackTransactions.amount}), 0)` 
                })
                .from(cashbackTransactions)
                .where(eq(cashbackTransactions.userId, userId));
              
              return result?.total || 0;
            },
            cacheKey,
            CACHE_TTL.USER_DATA,
            "get_user_cashback_total_optimized"
          );
        },
        { ttl: CACHE_TTL.USER_DATA }
      );

      res.json({ total });
    } catch (error) {
      console.error("Error fetching cashback total:", error);
      res.status(500).json({ message: "Failed to fetch cashback total" });
    }
  });

  // Оптимизированный эндпоинт для получения баланса кэшбэка
  app.get("/api/cashback/balance/optimized", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const cacheKey = CACHE_KEYS.USER_CASHBACK_BALANCE(userId);
      
      const balance = await cacheManager.getOrSet(
        cacheKey,
        async () => {
          return await dbOptimizer.executeQueryWithCache(
            async () => {
              // Получаем последнюю транзакцию для получения актуального баланса
              const [result] = await db
                .select({ balance: cashbackTransactions.balanceAfter })
                .from(cashbackTransactions)
                .where(eq(cashbackTransactions.userId, userId))
                .orderBy(desc(cashbackTransactions.createdAt))
                .limit(1);
              
              return result?.balance || 0;
            },
            cacheKey,
            CACHE_TTL.USER_DATA,
            "get_user_cashback_balance_optimized"
          );
        },
        { ttl: CACHE_TTL.USER_DATA }
      );

      res.json({ balance });
    } catch (error) {
      console.error("Error fetching cashback balance:", error);
      res.status(500).json({ message: "Failed to fetch cashback balance" });
    }
  });

  // Оптимизированный эндпоинт для получения транзакций кэшбэка
  app.get("/api/cashback/transactions/optimized", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const cacheKey = `${CACHE_KEYS.USER_CASHBACK_TRANSACTIONS(userId)}:page:${page}:limit:${limit}`;
      
      const transactions = await cacheManager.getOrSet(
        cacheKey,
        async () => {
          return await dbOptimizer.executeQueryWithCache(
            async () => {
              return await db
                .select()
                .from(cashbackTransactions)
                .where(eq(cashbackTransactions.userId, userId))
                .orderBy(desc(cashbackTransactions.createdAt))
                .limit(limit)
                .offset((page - 1) * limit);
            },
            cacheKey,
            CACHE_TTL.TRANSACTIONS,
            "get_user_cashback_transactions_optimized"
          );
        },
        { ttl: CACHE_TTL.TRANSACTIONS }
      );

      res.json({ transactions });
    } catch (error) {
      console.error("Error fetching cashback transactions:", error);
      res.status(500).json({ message: "Failed to fetch cashback transactions" });
    }
  });

  // Эндпоинт для очистки кэша пользователя (для отладки)
  app.post("/api/cache/clear-user", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Очищаем все кэши пользователя
      cacheManager.clear(`user:${userId}`);
      cacheManager.clear(`subscriptions:user:${userId}`);
      cacheManager.clear(`cashback:total:${userId}`);
      cacheManager.clear(`cashback:balance:${userId}`);
      cacheManager.clear(`cashback:transactions:${userId}`);
      
      res.json({ message: "User cache cleared successfully" });
    } catch (error) {
      console.error("Error clearing user cache:", error);
      res.status(500).json({ message: "Failed to clear user cache" });
    }
  });
}