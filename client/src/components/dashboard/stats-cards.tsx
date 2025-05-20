import { Card, CardContent } from "@/components/ui/card";
import { Users, CreditCard, Activity, Clock, Calendar, Percent, Wallet } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "@/hooks/use-translations";
import { useAuth } from "@/hooks/use-auth";

export function StatsCards() {
  const { t } = useTranslations();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // Запросы для администраторов
  const { data: userStats, isLoading: loadingUserStats } = useQuery({
    queryKey: ["/api/stats/users"],
    enabled: isAdmin, // Только для админов
  });

  const { data: subStats, isLoading: loadingSubStats } = useQuery({
    queryKey: ["/api/stats/subscriptions"],
    enabled: isAdmin, // Только для админов
  });

  const { data: serviceStats, isLoading: loadingServiceStats } = useQuery({
    queryKey: ["/api/stats/services"],
    enabled: isAdmin, // Только для админов
  });

  // Запрос подписок пользователя
  const { data: userSubscriptions, isLoading: loadingUserSubscriptions } = useQuery({
    queryKey: ["/api/subscriptions"],
    enabled: true, // Для всех пользователей
  });
  
  // Запрос текущего баланса кэшбэка пользователя
  const { data: cashbackBalance, isLoading: loadingCashbackBalance } = useQuery({
    queryKey: ["/api/cashback/balance"],
    enabled: !isAdmin && !!user?.id, // Только для обычных пользователей
  });
  
  // Запрос общей суммы всех начисленных кэшбэков пользователя
  const { data: totalCashbackAmount, isLoading: loadingTotalCashbackAmount } = useQuery({
    queryKey: ["/api/cashback/total"],
    enabled: !isAdmin && !!user?.id, // Только для обычных пользователей
  });

  const isAdminLoading = isAdmin && (loadingUserStats || loadingSubStats || loadingServiceStats);
  const isUserLoading = loadingUserSubscriptions || loadingCashbackBalance || loadingTotalCashbackAmount;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {isAdmin ? (
        // Карточки для администраторов
        <>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">{t('dashboard.totalUsers')}</h3>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              {isAdminLoading ? (
                <Skeleton className="h-8 w-24 my-1" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{userStats?.total || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {userStats?.newLastMonth
                      ? `+${userStats.newLastMonth} ${t('dashboard.total')}`
                      : t('users.noUsers')}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">
                  {t('dashboard.subscriptionStats')}
                </h3>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </div>
              {isAdminLoading ? (
                <Skeleton className="h-8 w-24 my-1" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {subStats?.activeCount || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('subscriptions.statusActive')}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">
                  {t('subscriptions.paymentAmount')}
                </h3>
                <span className="h-4 w-4 text-muted-foreground flex items-center justify-center text-sm">₽</span>
              </div>
              {isAdminLoading ? (
                <Skeleton className="h-8 w-24 my-1" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {subStats?.totalRevenue?.toFixed(2) || "0.00"} ₽
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('subscriptions.title')}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">
                  {t('services.title')}
                </h3>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
              {isAdminLoading ? (
                <Skeleton className="h-8 w-24 my-1" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {serviceStats?.length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('dashboard.activeServices')}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        // Карточки для обычных пользователей
        <>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">{t('subscriptions.mySubscriptions')}</h3>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </div>
              {isUserLoading ? (
                <Skeleton className="h-8 w-24 my-1" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {userSubscriptions?.subscriptions?.length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('subscriptions.active')}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">{t('cashback.cashback_balance')}</h3>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </div>
              {isUserLoading ? (
                <Skeleton className="h-8 w-24 my-1" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-500">
                    {cashbackBalance?.balance ? `${cashbackBalance.balance.toFixed(2)} ₽` : '0.00 ₽'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('cashback.current_cashback_balance_detailed')}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">{t('services.totalCashbackAmount')}</h3>
                <span className="h-4 w-4 text-muted-foreground flex items-center justify-center text-sm">₽</span>
              </div>
              {isUserLoading ? (
                <Skeleton className="h-8 w-24 my-1" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-500">
                    {totalCashbackAmount?.total 
                      ? `${totalCashbackAmount.total.toFixed(2)} ₽` 
                      : '0.00 ₽'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('services.totalCashbackAmountDescription')}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">{t('profile.accountStatus')}</h3>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              {isUserLoading ? (
                <Skeleton className="h-8 w-24 my-1" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-500">
                    {t('profile.active')}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('profile.memberSince')} {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
