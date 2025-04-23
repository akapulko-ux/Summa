import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, CreditCard, Package, BarChart4, Palette } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

interface ServicePopularityItem {
  serviceId: number;
  serviceTitle: string;
  count: number;
}

const icons = [
  <MessageSquare className="h-5 w-5 text-white" key="msg" />,
  <CreditCard className="h-5 w-5 text-white" key="card" />,
  <Package className="h-5 w-5 text-white" key="package" />,
  <BarChart4 className="h-5 w-5 text-white" key="chart" />,
  <Palette className="h-5 w-5 text-white" key="palette" />,
];

const bgColors = [
  "bg-secondary",
  "bg-blue-500",
  "bg-orange-500",
  "bg-green-500",
  "bg-red-500",
];

export function PopularServices() {
  const { t, language } = useTranslations();
  const { data, isLoading } = useQuery<ServicePopularityItem[]>({
    queryKey: ["/api/stats/services"],
  });

  // Calculate total subscriptions for percentage calculation
  const totalSubscriptions = data?.reduce(
    (sum, service) => sum + service.count,
    0
  ) || 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{t('dashboard.popularServices')}</CardTitle>
        <CardDescription>{t('services.servicesByCount')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            Array(5)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex items-center">
                  <Skeleton className="h-10 w-10 rounded-full mr-3" />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-5 w-8" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                </div>
              ))
          ) : data?.length ? (
            data.map((service, index) => {
              const percentage = totalSubscriptions
                ? Math.round((service.count / totalSubscriptions) * 100)
                : 0;

              return (
                <div key={service.serviceId} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full ${
                      bgColors[index % bgColors.length]
                    } flex items-center justify-center mr-3`}
                  >
                    {icons[index % icons.length]}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">
                        {service.serviceTitle || (language === 'ru' ? `Сервис #${service.serviceId}` : `Service #${service.serviceId}`)}
                      </span>
                      <span className="text-sm">{percentage}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`${
                          bgColors[index % bgColors.length]
                        } h-2 rounded-full`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-muted-foreground py-4">
              {t('services.noServices')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
