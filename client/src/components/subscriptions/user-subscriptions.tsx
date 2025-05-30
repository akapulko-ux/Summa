import React, { useState, useEffect } from "react";
import { useTranslations } from "@/hooks/use-translations";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Subscription, Service } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionForm } from "@/components/subscriptions/subscription-form-fixed";
import { SubscriptionCustomFieldsView } from "@/components/subscriptions/subscription-custom-fields-view";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  CreditCard, 
  RefreshCw, 
  Trash, 
  AlertCircle,
  CheckCircle2,
  Pencil,
  ChevronsUpDown,
  ChevronDown,
  ChevronUp,
  Loader2
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { insertSubscriptionSchema } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Расширим схему валидации для формы подписки
const createSubscriptionSchema = insertSubscriptionSchema.extend({
  serviceId: z.union([z.coerce.number(), z.literal('other')]),
  startDate: z.date(),
  endDate: z.date().optional(),
  amount: z.number().default(0), // Добавляем поле amount для хранения стоимости
});

// Тип данных формы
type SubscriptionFormValues = z.infer<typeof createSubscriptionSchema>;

interface UserSubscriptionsProps {
  userId: number;
}

export function UserSubscriptions({ userId }: UserSubscriptionsProps) {
  const { t, language } = useTranslations();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<number | null>(null);
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<number | null>(null);
  
  // Получение списка подписок пользователя с названиями сервисов
  const { 
    data: subscriptions, 
    isLoading, 
    isError 
  } = useQuery<(Subscription & { serviceName?: string })[]>({
    queryKey: ["/api/subscriptions/user", userId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/subscriptions/user/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch subscriptions");
      return res.json();
    },
    enabled: Boolean(userId),
  });
  
  // Получение списка доступных сервисов для подписки
  const { 
    data: services,
  } = useQuery<Service[]>({
    queryKey: ["/api/services"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/services?status=active");
      if (!res.ok) throw new Error("Failed to fetch services");
      const data = await res.json();
      console.log("UserSubscriptions - API fetched services:", data);
      return data.services;
    },
  });
  
  // Форма для создания новой подписки
  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(createSubscriptionSchema),
    defaultValues: {
      userId,
      serviceId: undefined,
      startDate: new Date(),
      endDate: undefined,
      status: "active",
      paymentPeriod: "monthly",
      amount: 0
    },
  });
  
  // Мутация для создания новой подписки
  const createSubscriptionMutation = useMutation({
    mutationFn: async (data: SubscriptionFormValues) => {
      const res = await apiRequest("POST", "/api/subscriptions", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create subscription");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: t('subscriptions.addSuccess'),
        description: t('subscriptions.addSuccessDescription'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/user", userId] });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: t('subscriptions.addError'),
        description: error.message,
        variant: "destructive",
      });
    },
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
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/user", userId] });
    },
    onError: (error: Error) => {
      toast({
        title: t('subscriptions.deleteError'),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Мутация для обновления подписки
  const updateSubscriptionMutation = useMutation({
    mutationFn: async (data: SubscriptionFormValues) => {
      if (!selectedSubscriptionId) throw new Error("No subscription selected");
      const res = await apiRequest("PATCH", `/api/subscriptions/${selectedSubscriptionId}`, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update subscription");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: t('subscriptions.updateSuccess'),
        description: t('subscriptions.updateSuccessDescription'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/user", userId] });
      setIsEditDialogOpen(false);
      setSelectedSubscriptionId(null);
    },
    onError: (error: Error) => {
      toast({
        title: t('subscriptions.updateError'),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Обработчик отправки формы для создания подписки
  const onSubmit = (data: SubscriptionFormValues) => {
    createSubscriptionMutation.mutate(data);
  };
  
  // Обработчик отправки формы для обновления подписки
  const onUpdateSubmit = (data: SubscriptionFormValues) => {
    updateSubscriptionMutation.mutate(data);
  };
  
  // Обработчик удаления подписки
  const handleDelete = (subscriptionId: number) => {
    if (window.confirm(t('subscriptions.confirmDelete'))) {
      deleteSubscriptionMutation.mutate(subscriptionId);
    }
  };
  
  // Обработчик редактирования подписки
  const handleEdit = (subscriptionId: number) => {
    setSelectedSubscriptionId(subscriptionId);
    setIsEditDialogOpen(true);
  };
  

  
  // Функция для отображения статуса подписки с соответствующим стилем
  const renderStatus = (status: string) => {
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
  const renderPaymentPeriod = (period: string) => {
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
  
  // Получение названия сервиса по ID
  const getServiceName = (serviceId: number | null) => {
    if (!serviceId) return t('subscriptions.unknownService');
    if (!Array.isArray(services)) return t('subscriptions.unknownService');
    const service = services.find(s => s.id === serviceId);
    return service ? service.title : t('subscriptions.unknownService');
  };
  
  // Сброс формы при открытии диалога
  useEffect(() => {
    if (isAddDialogOpen) {
      form.reset({
        userId,
        serviceId: undefined,
        startDate: new Date(),
        endDate: undefined,
        status: "active",
        paymentPeriod: "monthly",
        amount: 0
      });
    }
  }, [isAddDialogOpen, form, userId]);
  
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
            <SubscriptionForm
              onSubmit={onSubmit}
              userId={userId}
              buttonText={t('common.add')}
              services={Array.isArray(services) ? services : []}
              isLoading={createSubscriptionMutation.isPending}
            />
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
                  <TableHead>{t('subscriptions.columns.endDate')}</TableHead>
                  <TableHead>{t('subscriptions.columns.amount')}</TableHead>
                  <TableHead>{t('subscriptions.columns.period')}</TableHead>
                  <TableHead>{t('subscriptions.columns.status')}</TableHead>
                  <TableHead className="text-right">{t('subscriptions.columns.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions?.map((subscription) => (
                  <React.Fragment key={subscription.id}>
                    <TableRow>
                      <TableCell className="font-medium">
                      {subscription.serviceName || getServiceName(subscription.serviceId)}
                    </TableCell>
                    <TableCell>{formatDate(subscription.createdAt)}</TableCell>
                    <TableCell>{subscription.paidUntil ? formatDate(subscription.paidUntil) : "-"}</TableCell>
                    <TableCell>{subscription.paymentAmount?.toFixed(2) || "0.00"}</TableCell>
                    <TableCell>{renderPaymentPeriod(subscription.paymentPeriod || "monthly")}</TableCell>
                    <TableCell>{renderStatus(subscription.status || "active")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEdit(subscription.id)}
                          className="mr-1"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">{t('common.edit')}</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(subscription.id)}
                          disabled={deleteSubscriptionMutation.isPending}
                        >
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">{t('common.delete')}</span>
                        </Button>
                      </div>
                    </TableCell>
                    </TableRow>
                    {subscription.customFields && Object.keys(subscription.customFields).length > 0 && (
                      <TableRow className="bg-gray-50/50">
                        <TableCell colSpan={7} className="p-0">
                          <div className="px-4 py-2">
                            <SubscriptionCustomFieldsView customFields={subscription.customFields} />
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Диалог для редактирования подписки */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('subscriptions.editTitle')}</DialogTitle>
            <DialogDescription>
              {t('subscriptions.editDescription')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubscriptionId && subscriptions && (
            <SubscriptionForm 
              onSubmit={onUpdateSubmit}
              initialData={subscriptions.find(sub => sub.id === selectedSubscriptionId)}
              userId={userId}
              buttonText={t('common.save')}
              services={Array.isArray(services) ? services : []}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}