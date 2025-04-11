import { Card, CardContent } from "@/components/ui/card";
import { Users, CreditCard, DollarSign, Activity, Clock, Calendar } from "lucide-react";
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

  const isAdminLoading = isAdmin && (loadingUserStats || loadingSubStats || loadingServiceStats);
  const isUserLoading = loadingUserSubscriptions;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {isAdmin ? (
        // Карточки для администраторов
        <>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">{t.users.title}</h3>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              {isAdminLoading ? (
                <Skeleton className="h-8 w-24 my-1" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{userStats?.total || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {userStats?.newLastMonth
                      ? `+${userStats.newLastMonth} ${t.dashboard.total}`
                      : t.users.noUsers}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">
                  {t.dashboard.subscriptionStats}
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
                    {t.subscriptions.statusActive}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">
                  {t.subscriptions.paymentAmount}
                </h3>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
              {isAdminLoading ? (
                <Skeleton className="h-8 w-24 my-1" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    ${subStats?.totalRevenue?.toFixed(2) || "0.00"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t.subscriptions.title}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">
                  {t.services.title}
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
                    {t.dashboard.activeServices}
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
                <h3 className="tracking-tight text-sm font-medium">{t.subscriptions.mySubscriptions}</h3>
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
                    {t.subscriptions.active}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">{t.subscriptions.activeUntil}</h3>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              {isUserLoading ? (
                <Skeleton className="h-8 w-24 my-1" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {userSubscriptions?.subscriptions?.[0]?.paidUntil 
                      ? new Date(userSubscriptions.subscriptions[0].paidUntil).toLocaleDateString()
                      : "-"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t.subscriptions.nextPayment}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">{t.services.availableServices}</h3>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
              {isUserLoading ? (
                <Skeleton className="h-8 w-24 my-1" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {userSubscriptions?.total || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t.services.availableToSubscribe}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">{t.profile.accountStatus}</h3>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              {isUserLoading ? (
                <Skeleton className="h-8 w-24 my-1" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-500">
                    {t.profile.active}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t.profile.memberSince} {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
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
