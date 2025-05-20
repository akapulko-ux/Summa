import { useState, useEffect } from "react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardFooter,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  Pencil, 
  Trash, 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  User as UserIcon,
  CalendarIcon,
  Building,
  MessageCircle,
  Plus,
  FileText,
  Settings,
  Filter,
  CreditCard,
  Wallet
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Subscription, Service, User as UserType } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { SubscriptionForm } from "./subscription-form-fixed";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "@/hooks/use-translations";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionFilters, SubscriptionColumnVisibility } from "../filters/subscription-filters";
import { UserForm } from "../users/user-form";
import { UserSubscriptions } from "../subscriptions/user-subscriptions";
import { UserCustomFields } from "../custom-fields/user-custom-fields";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Компонент для отображения баланса кэшбэка пользователя
function CashbackBalance({ userId }: { userId: number }) {
  const { t } = useTranslations();
  const { data, isLoading } = useQuery({
    queryKey: [`/api/users/${userId}/cashback/balance`],
    enabled: !!userId
  });

  if (isLoading) {
    return <span className="text-muted-foreground">{t('common.loading')}...</span>;
  }

  return (
    <span className="text-lg font-bold">
      {data?.balance !== undefined ? Math.floor(data.balance) : 0} ₽
    </span>
  );
}

// Компонент для управления кэшбэком пользователя
function CashbackForm({ userId, onSuccess, onCancel }: { userId: number, onSuccess: () => void, onCancel?: () => void }) {
  const { t } = useTranslations();
  const { toast } = useToast();
  
  // Схема для валидации формы
  const cashbackFormSchema = z.object({
    amount: z.coerce.number().positive({
      message: t('cashback.amount_must_be_positive'),
    }),
    description: z.string().min(3, {
      message: t('cashback.description_min_length'),
    }),
    type: z.enum(['add', 'subtract']),
  });

  type CashbackFormValues = z.infer<typeof cashbackFormSchema>;

  // Состояние для формы
  const form = useForm<CashbackFormValues>({
    resolver: zodResolver(cashbackFormSchema),
    defaultValues: {
      amount: undefined,
      description: '',
      type: 'add',
    },
  });

  // Запрос баланса кэшбэка
  const { data: balanceData } = useQuery<{ balance: number }>({
    queryKey: [`/api/users/${userId}/cashback/balance`],
    enabled: !!userId,
  });

  // Мутация для управления кэшбэком
  const mutation = useMutation({
    mutationFn: async (values: CashbackFormValues) => {
      return await apiRequest('POST', `/api/users/${userId}/cashback`, values);
    },
    onSuccess: (data) => {
      toast({
        title: t('cashback.success'),
        description: form.watch('type') === 'add' 
          ? t('cashback.cashback_added_success') 
          : t('cashback.cashback_subtracted_success'),
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/cashback/balance`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/cashback`] });
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      // Проверяем, является ли ошибка недостаточным балансом
      if (error?.response?.data?.message === "Insufficient balance") {
        const currentBalance = error?.response?.data?.currentBalance || 0;
        const amount = form.getValues('amount');
        toast({
          title: t('cashback.error'),
          description: t('cashback.insufficient_balance_with_amount', { 
            amount: amount,
            balance: currentBalance
          }),
          variant: "destructive"
        });
      } else {
        toast({
          title: t('cashback.error'),
          description: error.message,
          variant: "destructive"
        });
      }
    }
  });

  const onSubmit = (values: CashbackFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>{t('cashback.operation_type')}</FormLabel>
              <FormControl>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      className="form-radio h-4 w-4 text-primary"
                      value="add"
                      checked={field.value === 'add'}
                      onChange={() => field.onChange('add')}
                    />
                    <span>{t('cashback.add')}</span>
                  </label>
                  <label className={`flex items-center space-x-2 ${balanceData?.balance === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                      type="radio"
                      className="form-radio h-4 w-4 text-destructive"
                      value="subtract"
                      checked={field.value === 'subtract'}
                      onChange={() => field.onChange('subtract')}
                      disabled={balanceData?.balance === 0}
                    />
                    <span>{t('cashback.subtract')}</span>
                  </label>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('cashback.amount')}</FormLabel>
              <FormControl>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full p-2 border rounded"
                    {...field}
                    onChange={(e) => {
                      // Преобразуем ввод в число и обновляем поле
                      const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                      field.onChange(value);
                    }}
                  />
                  <span className="absolute right-3 top-2">₽</span>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('cashback.description')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('cashback.cashback_description_placeholder')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              form.reset();
              if (onCancel) onCancel();
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            type="submit"
            disabled={mutation.isPending}
            variant={form.watch('type') === 'subtract' ? "destructive" : "default"}
          >
            {mutation.isPending
              ? t('cashback.processing')
              : form.watch('type') === 'subtract'
                ? t('cashback.subtract')
                : t('cashback.add')}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Начальные значения фильтров
const initialFilters: SubscriptionFilters = {
  search: "",
  service: "",
  user: "",
  company: "",
  status: "all",
  period: "all",
  priceMin: "",
  priceMax: "",
  sortBy: "createdAt",
  sortOrder: "asc",
  paidUntilFrom: "",
  paidUntilTo: ""
};

// Начальные значения видимости столбцов
const initialColumnVisibility: SubscriptionColumnVisibility = {
  service: true,
  user: true,
  company: true,
  price: true,
  period: true,
  paidUntil: true,
  status: true,
  actions: true,
};

type SubscriptionWithExtras = Subscription & {
  serviceName?: string;
  serviceTitle?: string;
  userName?: string;
  userEmail?: string;
  companyName?: string;
  paymentAmount?: number;
  service?: {
    title: string;
    iconUrl?: string;
  }
};

export interface AdvancedSubscriptionListProps {
  userId?: number;  // Опционально: Если указан, показывать только подписки этого пользователя
  showAddButton?: boolean;
  showFilters?: boolean;
  defaultView?: 'all' | 'active' | 'pending' | 'expired' | 'canceled';
}

export function AdvancedSubscriptionList({
  userId,
  showAddButton = true,
  showFilters = true,
  defaultView = 'all'
}: AdvancedSubscriptionListProps) {
  const { t } = useTranslations();
  const { user } = useAuth();
  
  // Состояние для пагинации
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  // Состояние для модальных диалогов
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<number | null>(null);
  
  // Состояния для управления пользователями
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isUserEditDialogOpen, setIsUserEditDialogOpen] = useState(false);
  const [isUserSubscriptionsDialogOpen, setIsUserSubscriptionsDialogOpen] = useState(false);
  const [isUserCustomFieldsDialogOpen, setIsUserCustomFieldsDialogOpen] = useState(false);
  const [isUserCashbackDialogOpen, setIsUserCashbackDialogOpen] = useState(false);
  
  // Состояние для фильтров и видимости столбцов
  const [filters, setFilters] = useState<SubscriptionFilters>({
    ...initialFilters, 
    status: defaultView === 'all' ? 'all' : defaultView as "all" | "active" | "pending" | "expired" | "canceled"
  });
  const [columnVisibility, setColumnVisibility] = useState(initialColumnVisibility);
  
  // Расчет количества примененных фильтров
  const countAppliedFilters = () => {
    let count = 0;
    for (const [key, value] of Object.entries(filters)) {
      if (key === 'sortBy' || key === 'sortOrder') continue;
      if (value && value !== 'all' && value !== '') count++;
    }
    return count;
  };
  
  // Функция для обработки клика по заголовку столбца для сортировки
  const handleSortClick = (field: string) => {
    setFilters(prev => {
      const newSortOrder = prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc';
      return { ...prev, sortBy: field, sortOrder: newSortOrder as 'asc' | 'desc' };
    });
  };
  
  // Компонент для отображения сортируемого заголовка столбца
  const SortableHeader = ({ 
    field, 
    children 
  }: { 
    field: string, 
    children: React.ReactNode 
  }) => {
    return (
      <div 
        className="flex items-center space-x-1 cursor-pointer select-none" 
        onClick={() => handleSortClick(field)}
      >
        <span>{children}</span>
        <span className="inline-flex flex-col h-4 w-4 justify-center">
          {filters.sortBy === field ? (
            filters.sortOrder === 'asc' ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )
          ) : (
            <>
              <ChevronUp className="h-2 w-2 opacity-30" />
              <ChevronDown className="h-2 w-2 opacity-30" />
            </>
          )}
        </span>
      </div>
    );
  };
  
  // Получение всех подписок
  const queryKey = userId 
    ? ["/api/subscriptions", userId] 
    : ["/api/subscriptions/all"];
    
  const { 
    data: subscriptionsData, 
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const url = userId 
        ? `/api/subscriptions?userId=${userId}` 
        : '/api/subscriptions/all';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch subscriptions");
      }
      const data = await response.json();
      return Array.isArray(data) ? data : data.subscriptions || [];
    },
  });
  
  // Получение данных о сервисах и пользователях для обогащения данных подписок
  const { data: servicesData } = useQuery<{ services: any[]; total: number }>({
    queryKey: ["/api/services"],
  });

  // Получение данных о пользователях
  const { data: usersData } = useQuery<{ users: any[]; total: number }>({
    queryKey: ["/api/users"],
    enabled: user?.role === 'admin', // Запрашиваем только если пользователь - админ
  });
  
  // Обогащаем данные подписок информацией о сервисах и пользователях
  const enrichSubscriptions = (subscriptions: any[]): SubscriptionWithExtras[] => {
    if (!subscriptions) return [];
    
    // Извлекаем массив сервисов, если он доступен
    const servicesList = servicesData?.services || [];
    // Получаем список пользователей
    const usersList = usersData?.users || [];
    
    // Логирование для отладки
    console.log("Services data:", servicesData);
    console.log("Users data:", usersData);
    console.log("Services list extracted:", servicesList);
    console.log("Users list extracted:", usersList);
    
    return subscriptions.map(sub => {
      // Находим информацию о сервисе
      const service = servicesList.find(s => s.id === sub.serviceId);
      // Находим информацию о пользователе
      const userInfo = usersList.find(u => u.id === sub.userId);
      
      // Детальное логирование объекта подписки и связанных объектов
      console.log("Processing subscription:", sub);
      console.log("Related service:", service);
      console.log("Related user info:", userInfo);
      
      // В базе данных может быть несколько разных имен для одних и тех же полей
      // в зависимости от того, откуда пришли данные. Обрабатываем все возможные варианты.
      const result = {
        ...sub,
        // Поля сервиса
        serviceName: service?.title || service?.name || sub.serviceName || sub.serviceTitle || t('subscriptions.unknownService'),
        serviceTitle: service?.title || service?.name || sub.serviceTitle || sub.serviceName || t('subscriptions.unknownService'),
        
        // Поля пользователя
        userName: userInfo?.name || userInfo?.username || userInfo?.fullName || sub.userName || sub.username || t('common.notAvailable'),
        userEmail: userInfo?.email || userInfo?.emailAddress || sub.userEmail || sub.email || t('common.notAvailable'),
        companyName: userInfo?.company || userInfo?.companyName || userInfo?.organization || sub.companyName || sub.company || sub.organization || t('common.notAvailable'),
        
        // Поля оплаты
        paymentAmount: sub.amount || sub.paymentAmount || sub.price || 0,
        // Явно копируем поле paidUntil
        paidUntil: sub.paidUntil || null,
      };
      
      console.log("Enriched subscription:", result);
      return result;
    });
  };
  
  // Применение фильтров к данным подписок
  const filterSubscriptions = (subscriptions: SubscriptionWithExtras[]) => {
    return subscriptions.filter(sub => {
      // Фильтрация по поисковому запросу
      const searchMatches = !filters.search || 
        (sub.serviceName && sub.serviceName.toLowerCase().includes(filters.search.toLowerCase())) ||
        (sub.userName && sub.userName.toLowerCase().includes(filters.search.toLowerCase())) ||
        (sub.userEmail && sub.userEmail.toLowerCase().includes(filters.search.toLowerCase()));
      
      // Фильтрация по сервису
      const serviceMatches = !filters.service || 
        (sub.serviceName && sub.serviceName.toLowerCase().includes(filters.service.toLowerCase()));
      
      // Фильтрация по пользователю
      const userMatches = !filters.user || 
        (sub.userName && sub.userName.toLowerCase().includes(filters.user.toLowerCase())) ||
        (sub.userEmail && sub.userEmail.toLowerCase().includes(filters.user.toLowerCase()));
      
      // Домен больше не используется
      const domainMatches = true;
      
      // Фильтрация по компании
      const companyMatches = !filters.company || 
        (sub.companyName && sub.companyName.toLowerCase().includes(filters.company.toLowerCase()));
      
      // Фильтрация по статусу
      const statusMatches = filters.status === 'all' || sub.status === filters.status;
      
      // Фильтрация по периоду оплаты
      const periodMatches = filters.period === 'all' || sub.paymentPeriod === filters.period;
      
      // Фильтрация по цене
      const priceMinMatches = !filters.priceMin || 
        (sub.paymentAmount && sub.paymentAmount >= parseFloat(filters.priceMin));
      const priceMaxMatches = !filters.priceMax || 
        (sub.paymentAmount && sub.paymentAmount <= parseFloat(filters.priceMax));
      
      // Фильтрация по дате оплаты до
      const paidUntilFromMatches = !filters.paidUntilFrom || 
        (sub.paidUntil && new Date(sub.paidUntil) >= new Date(filters.paidUntilFrom));
      const paidUntilToMatches = !filters.paidUntilTo || 
        (sub.paidUntil && new Date(sub.paidUntil) <= new Date(filters.paidUntilTo));
      
      return searchMatches && serviceMatches && userMatches && domainMatches &&
        companyMatches && statusMatches && periodMatches && 
        priceMinMatches && priceMaxMatches &&
        paidUntilFromMatches && paidUntilToMatches;
    });
  };
  
  // Сортировка отфильтрованных данных
  const sortSubscriptions = (subscriptions: SubscriptionWithExtras[]) => {
    const sortedData = [...subscriptions].sort((a, b) => {
      let aValue: any = a[filters.sortBy as keyof SubscriptionWithExtras];
      let bValue: any = b[filters.sortBy as keyof SubscriptionWithExtras];
      
      // Преобразование для правильной сортировки
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      
      // Обработка null значений
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';
      
      // Правило сортировки по дате
      if (filters.sortBy === 'startDate' || 
          filters.sortBy === 'paidUntil' || 
          filters.sortBy === 'createdAt' || 
          filters.sortBy === 'endDate') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }
      
      // Применение порядка сортировки
      return filters.sortOrder === 'asc' 
        ? (aValue > bValue ? 1 : -1)
        : (aValue < bValue ? 1 : -1);
    });
    
    return sortedData;
  };
  
  // Фильтрация, сортировка и пагинация данных
  const processData = () => {
    if (!subscriptionsData) return { data: [], totalCount: 0 };
    
    const enrichedData = enrichSubscriptions(subscriptionsData);
    const filteredData = filterSubscriptions(enrichedData);
    const sortedData = sortSubscriptions(filteredData);
    
    // Пагинация
    const startIndex = (page - 1) * limit;
    const paginatedData = sortedData.slice(startIndex, startIndex + limit);
    
    return { 
      data: paginatedData,
      totalCount: filteredData.length 
    };
  };
  
  const { data: processedData, totalCount } = processData() || { data: [], totalCount: 0 };
  
  // Мутация для удаления подписки
  const deleteSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: number) => {
      await apiRequest("DELETE", `/api/subscriptions/${subscriptionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
  
  // Обработчики кнопок
  const handleEdit = (subscriptionId: number) => {
    setSelectedSubscriptionId(subscriptionId);
    setIsEditDialogOpen(true);
  };
  
  const handleDelete = (subscriptionId: number) => {
    if (window.confirm(t('subscriptions.confirmDelete'))) {
      deleteSubscriptionMutation.mutate(subscriptionId);
    }
  };
  
  const handleAdd = () => {
    setIsAddDialogOpen(true);
  };
  
  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };
  
  const handleNextPage = () => {
    if (totalCount > page * limit) {
      setPage(page + 1);
    }
  };
  
  // Функции форматирования данных
  const getStatusBadge = (status: string | null | undefined) => {
    if (!status) {
      return <Badge variant="outline">{t('common.notAvailable')}</Badge>;
    }
    
    try {
      switch (status.toLowerCase()) {
        case "active":
          return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">{t('subscriptions.statusActive')}</Badge>;
        case "pending":
          return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">{t('subscriptions.statusPending')}</Badge>;
        case "expired":
          return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">{t('subscriptions.statusExpired')}</Badge>;
        case "canceled":
          return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">{t('subscriptions.statusCanceled')}</Badge>;
        default:
          return <Badge variant="outline">{status}</Badge>;
      }
    } catch (e) {
      console.warn('Error formatting status badge:', e);
      return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const formatPaymentPeriod = (period: string | null | undefined) => {
    if (!period) return t('common.notAvailable');
    try {
      return t(`subscriptions.periodValues.${period}`) || period;
    } catch (e) {
      console.warn('Error formatting payment period:', e);
      return period;
    }
  };
  
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return t('common.notAvailable');
    try {
      // Добавляем подробное логирование для отладки
      console.log('Форматирование даты, оригинальное значение:', date);
      console.log('Тип данных:', typeof date);
      if (date instanceof Date) {
        console.log('Это объект Date');
      }
      
      const dateObj = date instanceof Date ? date : new Date(date);
      console.log('Преобразованная дата:', dateObj);
      console.log('Дата валидна:', !isNaN(dateObj.getTime()));
      
      if (isNaN(dateObj.getTime())) {
        console.warn('Невалидная дата:', date);
        return t('common.notAvailable');
      }
      
      return format(dateObj, 'dd.MM.yyyy');
    } catch (e) {
      console.warn('Error formatting date:', e, date);
      return t('common.notAvailable');
    }
  };
  
  const formatMoney = (amount: number | string | null | undefined) => {
    if (amount === null || amount === undefined) return t('common.notAvailable');
    try {
      // Преобразуем в число, если передана строка
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      if (isNaN(numAmount)) return amount;
      return `${Number(numAmount).toLocaleString('ru-RU', {maximumFractionDigits: 0})} ₽`;
    } catch (e) {
      console.warn('Error formatting money:', e);
      return amount;
    }
  };

  // Отображение состояний загрузки и ошибки
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('subscriptions.title')}</CardTitle>
          <CardDescription>{t('subscriptions.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex space-x-4 items-center">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('common.error')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{(error as Error).message}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => queryClient.invalidateQueries({ queryKey })}
          >
            {t('common.refresh')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <CardTitle>{t('subscriptions.title')}</CardTitle>
            <CardDescription>{t('subscriptions.description')}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {showFilters && (
              <SubscriptionFilters 
                filters={filters}
                onChange={setFilters}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
                appliedFilterCount={countAppliedFilters()}
              />
            )}
            {showAddButton && user?.role === 'admin' && (
              <Button onClick={handleAdd} size="sm" className="h-8">
                <Plus className="h-3.5 w-3.5 mr-1" />
                {t('subscriptions.addButton')}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="relative w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columnVisibility.service && (
                  <TableHead>
                    <SortableHeader field="serviceName">
                      {t('subscriptions.service')}
                    </SortableHeader>
                  </TableHead>
                )}
                {columnVisibility.user && (
                  <TableHead>
                    <SortableHeader field="userName">
                      {t('users.title')}
                    </SortableHeader>
                  </TableHead>
                )}
                {columnVisibility.company && (
                  <TableHead>
                    <SortableHeader field="companyName">
                      {t('users.userCompany')}
                    </SortableHeader>
                  </TableHead>
                )}
                {columnVisibility.price && (
                  <TableHead>
                    <SortableHeader field="paymentAmount">
                      {t('subscriptions.paymentAmount')}
                    </SortableHeader>
                  </TableHead>
                )}
                {columnVisibility.period && (
                  <TableHead>
                    <SortableHeader field="paymentPeriod">
                      {t('subscriptions.paymentPeriod')}
                    </SortableHeader>
                  </TableHead>
                )}
                {columnVisibility.paidUntil && (
                  <TableHead>
                    <SortableHeader field="paidUntil">
                      {t('subscriptions.paidUntil')}
                    </SortableHeader>
                  </TableHead>
                )}
                {columnVisibility.status && (
                  <TableHead>
                    <SortableHeader field="status">
                      {t('subscriptions.status')}
                    </SortableHeader>
                  </TableHead>
                )}
                {columnVisibility.actions && (
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedData.length === 0 ? (
                <TableRow>
                  <TableCell 
                    colSpan={Object.values(columnVisibility).filter(Boolean).length} 
                    className="text-center py-6 text-muted-foreground"
                  >
                    <div className="flex flex-col items-center py-6">
                      <p className="text-lg font-medium mb-2">{t('subscriptions.noSubscriptionsFound')}</p>
                      <p className="text-sm text-muted-foreground">{t('subscriptions.adjustFilters')}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                processedData.map((subscription) => (
                  <TableRow key={subscription.id}>

                    
                    {columnVisibility.service && (
                      <TableCell>
                        {subscription.serviceName || t('common.notAvailable')}
                      </TableCell>
                    )}
                    

                    
                    {columnVisibility.user && (
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-1">
                            <span>{subscription.userName || t('common.notAvailable')}</span>
                            {user?.role === 'admin' && subscription.userId && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <Pencil className="h-3.5 w-3.5" />
                                    <span className="sr-only">{t('users.actions')}</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => {
                                    setIsUserEditDialogOpen(true);
                                    setSelectedUserId(subscription.userId);
                                  }}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    {t('users.edit')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setIsUserSubscriptionsDialogOpen(true);
                                      setSelectedUserId(subscription.userId);
                                    }}
                                  >
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    {t('users.manageSubscriptions')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setIsUserCustomFieldsDialogOpen(true);
                                      setSelectedUserId(subscription.userId);
                                    }}
                                  >
                                    <UserIcon className="h-4 w-4 mr-2" />
                                    {t('users.manageCustomFields')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setIsUserCashbackDialogOpen(true);
                                      setSelectedUserId(subscription.userId);
                                    }}
                                  >
                                    <Wallet className="h-4 w-4 mr-2" />
                                    {t('cashback.manage_cashback')}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                          {subscription.userEmail && (
                            <span className="text-xs text-muted-foreground">
                              {subscription.userEmail}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    )}
                    
                    {columnVisibility.company && (
                      <TableCell>
                        {subscription.companyName || t('common.notAvailable')}
                      </TableCell>
                    )}
                    
                    {columnVisibility.price && (
                      <TableCell>
                        {formatMoney(subscription.paymentAmount || 0)}
                      </TableCell>
                    )}
                    
                    {columnVisibility.period && (
                      <TableCell>
                        {formatPaymentPeriod(subscription.paymentPeriod)}
                      </TableCell>
                    )}
                    
                    {columnVisibility.paidUntil && (
                      <TableCell>
                        {formatDate(subscription.paidUntil)}
                      </TableCell>
                    )}
                    
                    {columnVisibility.status && (
                      <TableCell>
                        {getStatusBadge(subscription.status)}
                      </TableCell>
                    )}
                    
                    {columnVisibility.actions && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(subscription.id)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              {t('common.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(subscription.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      
      {totalCount > 0 && (
        <CardFooter className="border-t px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              {t('subscriptions.showing', { 
                displayed: Math.min(processedData.length, limit), 
                total: totalCount 
              })}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                {t('common.prev')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={page * limit >= totalCount}
              >
                {t('common.next')}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardFooter>
      )}

      {/* Диалог редактирования подписки */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t('subscriptions.editSubscription')}</DialogTitle>
          </DialogHeader>
          {selectedSubscriptionId && (
            <SubscriptionForm 
              subscriptionId={selectedSubscriptionId} 
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey });
                setIsEditDialogOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Диалог добавления подписки */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t('subscriptions.addSubscription')}</DialogTitle>
          </DialogHeader>
          <SubscriptionForm 
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey });
              setIsAddDialogOpen(false);
            }}
            userId={userId}
          />
        </DialogContent>
      </Dialog>
      
      {/* Диалог редактирования пользователя */}
      <Dialog open={isUserEditDialogOpen} onOpenChange={setIsUserEditDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t('users.editUser')}</DialogTitle>
          </DialogHeader>
          {selectedUserId && (
            <UserForm 
              userId={selectedUserId}
              onSuccess={() => {
                setIsUserEditDialogOpen(false);
                queryClient.invalidateQueries({ queryKey });
              }}
              onCancel={() => setIsUserEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Диалог управления подписками пользователя */}
      <Dialog open={isUserSubscriptionsDialogOpen} onOpenChange={setIsUserSubscriptionsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('users.manageSubscriptions')}</DialogTitle>
            <DialogDescription>{t('users.manageSubscriptionsDescription')}</DialogDescription>
          </DialogHeader>
          {selectedUserId && (
            <UserSubscriptions userId={selectedUserId} />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Диалог управления пользовательскими полями */}
      <Dialog open={isUserCustomFieldsDialogOpen} onOpenChange={setIsUserCustomFieldsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('users.manageCustomFields')}</DialogTitle>
            <DialogDescription>{t('users.manageCustomFieldsDescription')}</DialogDescription>
          </DialogHeader>
          {selectedUserId && (
            <UserCustomFields userId={selectedUserId} />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Диалог управления кэшбэком */}
      <Dialog open={isUserCashbackDialogOpen} onOpenChange={setIsUserCashbackDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('cashback.manage_cashback')}</DialogTitle>
            <DialogDescription>
              {t('cashback.cashback_admin_description')}
            </DialogDescription>
          </DialogHeader>
          {selectedUserId && (
            <div className="py-4">
              <div className="flex items-center justify-between mb-6 p-4 border rounded-md bg-muted">
                <span className="font-medium">{t('cashback.current_balance')}:</span>
                <CashbackBalance userId={selectedUserId} />
              </div>
              
              <CashbackForm 
                userId={selectedUserId} 
                onSuccess={() => {
                  // После успешного обновления кэшбэка обновляем данные
                  queryClient.invalidateQueries({ queryKey: ["/api/users"] });
                }}
                onCancel={() => {
                  // Закрываем диалоговое окно при отмене
                  setIsUserCashbackDialogOpen(false);
                }}
              />

              {/* История операций кэшбэка */}
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-2">{t('cashback.transaction_history')}</h3>
                <div className="border rounded-md overflow-hidden">
                  {/* Получаем историю операций кэшбэка для отображения */}
                  <CashbackHistory userId={selectedUserId} />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}