import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useTranslations } from "@/hooks/use-translations";
import { useMemo } from "react";

interface Subscription {
  id: number;
  title: string;
  userId: number;
  status: string;
  createdAt: string;
  userName?: string;
  paymentAmount?: number;
  paidUntil?: string;
  service?: {
    id: number;
    title: string;
  };
}

export function RecentSubscriptions() {
  const { t, language } = useTranslations();
  const { data, isLoading } = useQuery<{ subscriptions: Subscription[] }>({
    queryKey: ["/api/subscriptions", { limit: 20 }]
  });
  
  // Отладочный код для проверки данных
  console.log("Recent subscriptions data:", data);
  
  // Сортируем подписки по дате окончания на стороне клиента
  const sortedSubscriptions = useMemo(() => {
    if (!data?.subscriptions) return [];
    
    return [...data.subscriptions]
      .filter(sub => sub.paidUntil && sub.status !== "canceled")
      .sort((a, b) => {
        if (!a.paidUntil) return 1;
        if (!b.paidUntil) return -1;
        return new Date(a.paidUntil).getTime() - new Date(b.paidUntil).getTime();
      })
      .slice(0, 10);
  }, [data?.subscriptions]);

  // Helper function to get badge variant based on subscription status
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "success"; // Зеленый для активных
      case "pending":
        return "warning"; // Желтый для "Заканчивается"
      case "expired":
      case "canceled":
        return "destructive"; // Красный для истекших и отмененных
      default:
        return "outline";
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('dashboard.recentSubscriptions')}</CardTitle>
          <Button variant="ghost" asChild>
            <Link href="/subscriptions">{t('dashboard.viewSubscriptions')}</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  {t('subscriptions.service')}
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  {t('subscriptions.renewalAmount')}
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  {t('subscriptions.endDate')}
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  {t('subscriptions.status')}
                </th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {isLoading ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-4">
                        <Skeleton className="h-5 w-32" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-5 w-32" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-5 w-24" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-5 w-16" />
                      </td>
                    </tr>
                  ))
              ) : sortedSubscriptions.length > 0 ? (
                sortedSubscriptions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                  >
                    <td className="p-4 align-middle">
                      {sub.service?.title || sub.title}
                    </td>
                    <td className="p-4 align-middle">
                      {sub.paymentAmount ? `${sub.paymentAmount.toLocaleString()} ₽` : '-'}
                    </td>
                    <td className="p-4 align-middle">
                      {sub.paidUntil 
                        ? new Date(sub.paidUntil).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US') 
                        : '-'}
                    </td>
                    <td className="p-4 align-middle">
                      <Badge variant={getBadgeVariant(sub.status)}>
                        {sub.status === "active" ? t('subscriptions.statusActive') :
                         sub.status === "pending" ? t('subscriptions.statusPending') :
                         sub.status === "expired" ? t('subscriptions.statusExpired') :
                         sub.status === "canceled" ? t('subscriptions.statusCanceled') :
                         sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-muted-foreground">
                    {t('subscriptions.noSubscriptions')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
