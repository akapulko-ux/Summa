import { useState, useEffect } from "react";
import { useTranslations } from "@/hooks/use-translations";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Subscription, Service } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  CreditCard, 
  RefreshCw, 
  Trash, 
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { insertSubscriptionSchema } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Расширим схему валидации для формы подписки
const createSubscriptionSchema = insertSubscriptionSchema.extend({
  serviceId: z.union([z.coerce.number(), z.literal('other')]),
  serviceName: z.string().min(1, "Необходимо указать название сервиса").optional(), // Название кастомного сервиса
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
  
  // Получение списка доступных сервисов для подписки
  const { 
    data: services,
  } = useQuery<Service[]>({
    queryKey: ["/api/services"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/services?status=active");
      if (!res.ok) throw new Error("Failed to fetch services");
      const data = await res.json();
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
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions", userId] });
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
  
  // Обработчик отправки формы
  const onSubmit = (data: SubscriptionFormValues) => {
    createSubscriptionMutation.mutate(data);
  };
  
  // Обработчик удаления подписки
  const handleDelete = (subscriptionId: number) => {
    if (window.confirm(t('subscriptions.confirmDelete'))) {
      deleteSubscriptionMutation.mutate(subscriptionId);
    }
  };
  
  // Отслеживание выбранного сервиса для контроля доступности поля названия сервиса
  const [isCustomService, setIsCustomService] = useState(false);
  
  // При выборе сервиса
  const handleServiceChange = (serviceId: string) => {
    if (serviceId === 'other') {
      // Для опции "Другой сервис" разблокируем поле ввода названия сервиса
      setIsCustomService(true);
      // Очищаем название сервиса, чтобы пользователь ввел свое
      form.setValue("serviceName", "");
      form.setValue("title", t('subscriptions.otherService'));
      return;
    }
    
    setIsCustomService(false);
    
    if (!Array.isArray(services)) return;
    
    const selectedService = services.find(s => s.id === parseInt(serviceId));
    if (selectedService) {
      // Устанавливаем название подписки и название сервиса
      form.setValue("title", selectedService.title);
      form.setValue("serviceName", selectedService.title);
      
      // Устанавливаем нулевую стоимость по умолчанию
      form.setValue("amount", 0);
    }
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="serviceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('subscriptions.service')}</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleServiceChange(value);
                        }}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('subscriptions.selectService')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(services) && services.map((service) => (
                            <SelectItem key={service.id} value={service.id.toString()}>
                              {service.title}
                            </SelectItem>
                          ))}
                          <SelectItem value="other">{t('subscriptions.otherService')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Новое поле для названия сервиса */}
                <FormField
                  control={form.control}
                  name="serviceName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('subscriptions.serviceName')}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          disabled={!isCustomService}
                          placeholder={isCustomService ? t('subscriptions.enterServiceName') : ""} 
                        />
                      </FormControl>
                      <FormDescription>
                        {isCustomService 
                          ? t('subscriptions.customServiceNameDescription')
                          : t('subscriptions.predefinedServiceNameDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t('subscriptions.startDate')}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className="pl-3 text-left font-normal"
                            >
                              {field.value ? (
                                format(field.value, "dd.MM.yyyy")
                              ) : (
                                <span>{t('subscriptions.pickDate')}</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t('subscriptions.endDate')}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className="pl-3 text-left font-normal"
                            >
                              {field.value ? (
                                format(field.value, "dd.MM.yyyy")
                              ) : (
                                <span>{t('subscriptions.optional')}</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            disabled={(date) => date < form.getValues("startDate")}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="paymentPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('subscriptions.paymentPeriod')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('subscriptions.selectPeriod')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="monthly">{t('subscriptions.periods.monthly')}</SelectItem>
                          <SelectItem value="quarterly">{t('subscriptions.periods.quarterly')}</SelectItem>
                          <SelectItem value="yearly">{t('subscriptions.periods.yearly')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('subscriptions.amount')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input
                            type="number"
                            placeholder="0.00"
                            className="pl-10"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('subscriptions.status')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('subscriptions.selectStatus')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">{t('subscriptions.statuses.active')}</SelectItem>
                          <SelectItem value="pending">{t('subscriptions.statuses.pending')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createSubscriptionMutation.isPending}
                  >
                    {createSubscriptionMutation.isPending && (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {t('common.save')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
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
                  <TableRow key={subscription.id}>
                    <TableCell className="font-medium">
                      {getServiceName(subscription.serviceId)}
                    </TableCell>
                    <TableCell>{formatDate(subscription.createdAt)}</TableCell>
                    <TableCell>{subscription.paidUntil ? formatDate(subscription.paidUntil) : "-"}</TableCell>
                    <TableCell>{subscription.paymentAmount?.toFixed(2) || "0.00"}</TableCell>
                    <TableCell>{renderPaymentPeriod(subscription.paymentPeriod || "monthly")}</TableCell>
                    <TableCell>{renderStatus(subscription.status || "active")}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(subscription.id)}
                        disabled={deleteSubscriptionMutation.isPending}
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">{t('common.delete')}</span>
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