import { useState } from "react";
import { useTranslations } from "@/hooks/use-translations";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Subscription } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Trash, 
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { AddSubscriptionForm } from "./add-subscription-form";

interface UserSubscriptionsProps {
  userId: number;
}

export function UserSubscriptionsNew({ userId }: UserSubscriptionsProps) {
  const { t, language } = useTranslations();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Получение списка подписок пользователя
  const { 
    data: subscriptions, 
    isLoading, 
    isError 
  } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions", userId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/subscriptions?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch subscriptions");
      const data = await res.json();
      return data.subscriptions;
    },
    enabled: Boolean(userId),
  });
  
  // Мутация для удаления подписки
  const deleteSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: number) => {
      const res = await apiRequest("DELETE", `/api/subscriptions/${subscriptionId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete subscription");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: t('subscriptions.deleteSuccess'),
        description: t('subscriptions.deleteSuccessDescription'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions", userId] });
    },
    onError: (error: Error) => {
      toast({
        title: t('subscriptions.deleteError'),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Обработчик удаления подписки
  const handleDelete = (subscriptionId: number) => {
    if (window.confirm(t('subscriptions.confirmDelete'))) {
      deleteSubscriptionMutation.mutate(subscriptionId);
    }
  };
  
  // Функция для отображения статуса подписки с соответствующим стилем
  const renderStatus = (status: "active" | "pending" | "expired" | "canceled" | string) => {
    switch (status) {
      case "active":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
          {t('subscriptions.statuses.active')}
        </Badge>;
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
          {t('subscriptions.statuses.pending')}
        </Badge>;
      case "expired":
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
          <AlertCircle className="h-3.5 w-3.5 mr-1" />
          {t('subscriptions.statuses.expired')}
        </Badge>;
      case "canceled":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
          <Trash className="h-3.5 w-3.5 mr-1" />
          {t('subscriptions.statuses.canceled')}
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Функция для отображения периода оплаты
  const renderPaymentPeriod = (period: "monthly" | "quarterly" | "yearly" | string) => {
    switch (period) {
      case "monthly":
        return t('subscriptions.periods.monthly');
      case "quarterly":
        return t('subscriptions.periods.quarterly');
      case "yearly":
        return t('subscriptions.periods.yearly');
      default:
        return period;
    }
  };
  
  // Вспомогательная функция для форматирования даты
  const formatDate = (date: Date | string) => {
    if (!date) return "-";
    return format(new Date(date), "dd.MM.yyyy");
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t('subscriptions.title')}</CardTitle>
          <CardDescription>{t('subscriptions.description')}</CardDescription>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('subscriptions.addButton')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{t('subscriptions.addTitle')}</DialogTitle>
              <DialogDescription>
                {t('subscriptions.addDescription')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <AddSubscriptionForm 
                userId={userId} 
                onSuccess={() => setIsAddDialogOpen(false)} 
                onCancel={() => setIsAddDialogOpen(false)} 
              />
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-4 text-muted-foreground">
            <AlertCircle className="h-6 w-6 mx-auto mb-2" />
            <p>{t('subscriptions.errorLoading')}</p>
          </div>
        ) : subscriptions?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>{t('subscriptions.noSubscriptions')}</p>
          </div>
        ) : (
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('subscriptions.columns.service')}</TableHead>
                  <TableHead>{t('subscriptions.columns.startDate')}</TableHead>
                  <TableHead>{t('subscriptions.columns.amount')}</TableHead>
                  <TableHead>{t('subscriptions.columns.period')}</TableHead>
                  <TableHead>{t('subscriptions.columns.status')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions?.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell className="font-medium">
                      {subscription.title}
                    </TableCell>
                    <TableCell>{formatDate(subscription.createdAt)}</TableCell>
                    <TableCell>
                      {subscription.amount !== undefined && subscription.amount !== null ? (
                        new Intl.NumberFormat(language, { style: 'currency', currency: 'USD' }).format(Number(subscription.amount))
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{subscription.paymentPeriod ? renderPaymentPeriod(subscription.paymentPeriod) : '-'}</TableCell>
                    <TableCell>{subscription.status ? renderStatus(subscription.status) : '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(subscription.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}