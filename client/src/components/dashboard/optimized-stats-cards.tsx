import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOptimizedStats } from "@/hooks/use-optimized-stats";
import { useTranslations } from "@/hooks/use-translations";
import { TrendingUp, CreditCard, AlertCircle, Wallet } from "lucide-react";
import { memo } from "react";

// Мемоизированный компонент статистики для предотвращения лишних рендеров
export const OptimizedStatsCards = memo(() => {
  const { t, language } = useTranslations();
  const { stats, isLoading } = useOptimizedStats();

  // Форматирование чисел для отображения
  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-RU');
  };

  // Форматирование валюты
  const formatCurrency = (amount: number) => {
    return `${formatNumber(amount)} ₽`;
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-6 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: language === 'ru' ? 'Активные подписки' : 'Active Subscriptions',
      value: stats.activeSubscriptions,
      description: language === 'ru' 
        ? `из ${stats.totalSubscriptions} подписок` 
        : `of ${stats.totalSubscriptions} total`,
      icon: CreditCard,
      color: 'text-green-600',
    },
    {
      title: language === 'ru' ? 'Истекают скоро' : 'Expiring Soon',
      value: stats.expiringSoon,
      description: language === 'ru' ? 'в этом месяце' : 'this month',
      icon: AlertCircle,
      color: stats.expiringSoon > 0 ? 'text-orange-600' : 'text-gray-600',
    },
    {
      title: language === 'ru' ? 'Месячные расходы' : 'Monthly Expenses',
      value: formatCurrency(stats.monthlyTotal),
      description: language === 'ru' ? 'приблизительно' : 'approximately',
      icon: TrendingUp,
      color: 'text-blue-600',
    },
    {
      title: language === 'ru' ? 'Баланс кэшбэка' : 'Cashback Balance',
      value: formatCurrency(stats.currentBalance),
      description: language === 'ru' 
        ? `всего: ${formatCurrency(stats.totalCashback)}` 
        : `total: ${formatCurrency(stats.totalCashback)}`,
      icon: Wallet,
      color: 'text-green-600',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="transition-all duration-200 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});

OptimizedStatsCards.displayName = "OptimizedStatsCards";