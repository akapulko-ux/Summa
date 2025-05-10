import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTranslations } from "@/hooks/use-translations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CreditCard, RotateCw } from "lucide-react";

export default function CashbackBalance() {
  const { t } = useTranslations();
  
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/cashback/balance'],
    queryFn: () => apiRequest("GET", "/api/cashback/balance").then(res => res.json()),
  });

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("cashback_balance")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-4">
            <p className="mb-4 text-center text-muted-foreground">{t("error_loading_data")}</p>
            <Button variant="outline" onClick={() => refetch()}>
              {t("try_again")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {t("cashback_balance")}
        </CardTitle>
        <CreditCard className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-28" />
        ) : (
          <div className="text-2xl font-bold">{data.balance}</div>
        )}
      </CardContent>
    </Card>
  );
}