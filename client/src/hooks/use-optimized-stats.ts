import { useOptimizedQuery } from "./use-optimized-query";
import { useMemo } from "react";

// Оптимизированный хук для получения статистики пользователя
export const useOptimizedStats = (userId?: number) => {
  // Кэшированный запрос подписок с увеличенным временем жизни
  const { data: subscriptionsData, isLoading: subscriptionsLoading } = useOptimizedQuery(
    ['/api/subscriptions'],
    async () => {
      const response = await fetch('/api/subscriptions');
      if (!response.ok) throw new Error('Failed to fetch subscriptions');
      return response.json();
    },
    {
      staleTime: 60000, // 1 минута
      cacheTime: 300000, // 5 минут
    }
  );

  // Кэшированный запрос общего кэшбэка
  const { data: totalCashbackData, isLoading: totalLoading } = useOptimizedQuery(
    ['/api/cashback/total'],
    async () => {
      const response = await fetch('/api/cashback/total');
      if (!response.ok) throw new Error('Failed to fetch total cashback');
      return response.json();
    },
    {
      staleTime: 30000, // 30 секунд
      cacheTime: 180000, // 3 минуты
    }
  );

  // Кэшированный запрос баланса кэшбэка
  const { data: balanceData, isLoading: balanceLoading } = useOptimizedQuery(
    ['/api/cashback/balance'],
    async () => {
      const response = await fetch('/api/cashback/balance');
      if (!response.ok) throw new Error('Failed to fetch cashback balance');
      return response.json();
    },
    {
      staleTime: 30000, // 30 секунд
      cacheTime: 180000, // 3 минуты
    }
  );

  // Мемоизированные вычисления статистики
  const stats = useMemo(() => {
    const subscriptions = subscriptionsData?.subscriptions || [];
    const totalCashback = totalCashbackData?.total || 0;
    const currentBalance = balanceData?.balance || 0;

    // Подсчет активных подписок
    const activeSubscriptions = subscriptions.filter(
      (sub: any) => sub.status === 'active'
    ).length;

    // Подсчет подписок, истекающих в этом месяце
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const expiringSoon = subscriptions.filter((sub: any) => {
      if (!sub.paidUntil) return false;
      const expiryDate = new Date(sub.paidUntil);
      return expiryDate <= endOfMonth && expiryDate >= now;
    }).length;

    // Общая сумма всех подписок за месяц
    const monthlyTotal = subscriptions.reduce((total: number, sub: any) => {
      if (sub.paymentAmount && sub.status === 'active') {
        // Преобразуем в месячную стоимость в зависимости от периода
        let monthlyAmount = sub.paymentAmount;
        switch (sub.paymentPeriod) {
          case 'yearly':
            monthlyAmount = sub.paymentAmount / 12;
            break;
          case 'quarterly':
            monthlyAmount = sub.paymentAmount / 3;
            break;
          case 'monthly':
          default:
            monthlyAmount = sub.paymentAmount;
            break;
        }
        return total + monthlyAmount;
      }
      return total;
    }, 0);

    return {
      totalSubscriptions: subscriptions.length,
      activeSubscriptions,
      expiringSoon,
      monthlyTotal: Math.round(monthlyTotal),
      totalCashback: Math.round(totalCashback),
      currentBalance: Math.round(currentBalance),
    };
  }, [subscriptionsData, totalCashbackData, balanceData]);

  return {
    stats,
    isLoading: subscriptionsLoading || totalLoading || balanceLoading,
    subscriptions: subscriptionsData?.subscriptions || [],
  };
};