import { Card, CardContent } from "@/components/ui/card";
import { Users, CreditCard, DollarSign, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "@/hooks/use-translations";

export function StatsCards() {
  const { t } = useTranslations();

  const { data: userStats, isLoading: loadingUserStats } = useQuery({
    queryKey: ["/api/stats/users"],
    enabled: true,
  });

  const { data: subStats, isLoading: loadingSubStats } = useQuery({
    queryKey: ["/api/stats/subscriptions"],
    enabled: true,
  });

  const { data: serviceStats, isLoading: loadingServiceStats } = useQuery({
    queryKey: ["/api/stats/services"],
    enabled: true,
  });

  const isLoading = loadingUserStats || loadingSubStats || loadingServiceStats;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">{t.users.title}</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          {isLoading ? (
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
          {isLoading ? (
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
          {isLoading ? (
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
          {isLoading ? (
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
    </div>
  );
}
