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
} from "@/components/ui/dropdown-menu";
import { 
  Pencil, 
  Trash, 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal,
  User,
  CalendarIcon,
  Building,
  MessageCircle,
  Plus,
  FileText,
  Settings,
  Filter
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Subscription, Service, User as UserType } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SubscriptionForm } from "./subscription-form-fixed";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "@/hooks/use-translations";
import { SubscriptionFilters, SubscriptionColumnVisibility } from "../filters/subscription-filters";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Начальные значения фильтров
const initialFilters = {
  search: "",
  service: "",
  user: "",
  domain: "",
  company: "",
  status: "all" as const,
  period: "all" as const,
  priceMin: "",
  priceMax: "",
  sortBy: "createdAt",
  sortOrder: "asc" as const,
  startDateFrom: "",
  startDateTo: "",
  endDateFrom: "",
  endDateTo: "",
};

// Начальные значения видимости столбцов
const initialColumnVisibility: SubscriptionColumnVisibility = {
  title: true,
  service: true,
  domain: true,
  user: true,
  company: true,
  price: true,
  period: true,
  startDate: true,
  endDate: true,
  status: true,
  actions: true,
};

type SubscriptionWithExtras = Subscription & {
  serviceName?: string;
  serviceTitle?: string;
  userName?: string;
  userEmail?: string;
  companyName?: string;
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
  
  // Состояние для фильтров и видимости столбцов
  const [filters, setFilters] = useState({...initialFilters, status: defaultView === 'all' ? 'all' : defaultView});
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
  
  // Обогащаем данные подписок информацией о сервисах и пользователях
  const enrichSubscriptions = (subscriptions: any[]): SubscriptionWithExtras[] => {
    if (!subscriptions) return [];
    
    // Извлекаем массив сервисов, если он доступен
    const servicesList = servicesData?.services || [];
    
    console.log("Services data structure:", servicesData);
    console.log("Services list extracted:", servicesList);
    
    return subscriptions.map(sub => {
      // Находим информацию о сервисе
      const service = servicesList.find(s => s.id === sub.serviceId);
      
      return {
        ...sub,
        serviceName: service?.title || sub.serviceName || t('subscriptions.unknownService'),
        serviceTitle: service?.title || sub.serviceTitle || t('subscriptions.unknownService'),
        // Другие поля уже могут существовать в объекте sub
      };
    });
  };
  
  // Применение фильтров к данным подписок
  const filterSubscriptions = (subscriptions: SubscriptionWithExtras[]) => {
    return subscriptions.filter(sub => {
      // Фильтрация по поисковому запросу
      const searchMatches = !filters.search || 
        (sub.title && sub.title.toLowerCase().includes(filters.search.toLowerCase())) ||
        (sub.serviceName && sub.serviceName.toLowerCase().includes(filters.search.toLowerCase())) ||
        (sub.userName && sub.userName.toLowerCase().includes(filters.search.toLowerCase())) ||
        (sub.domain && sub.domain.toLowerCase().includes(filters.search.toLowerCase())) ||
        (sub.userEmail && sub.userEmail.toLowerCase().includes(filters.search.toLowerCase()));
      
      // Фильтрация по сервису
      const serviceMatches = !filters.service || 
        (sub.serviceName && sub.serviceName.toLowerCase().includes(filters.service.toLowerCase()));
      
      // Фильтрация по пользователю
      const userMatches = !filters.user || 
        (sub.userName && sub.userName.toLowerCase().includes(filters.user.toLowerCase())) ||
        (sub.userEmail && sub.userEmail.toLowerCase().includes(filters.user.toLowerCase()));
      
      // Фильтрация по домену
      const domainMatches = !filters.domain || 
        (sub.domain && sub.domain.toLowerCase().includes(filters.domain.toLowerCase()));
      
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
      
      // Фильтрация по дате начала
      const startDateFromMatches = !filters.startDateFrom || 
        (sub.startDate && new Date(sub.startDate) >= new Date(filters.startDateFrom));
      const startDateToMatches = !filters.startDateTo || 
        (sub.startDate && new Date(sub.startDate) <= new Date(filters.startDateTo));
      
      // Фильтрация по дате окончания
      const endDateFromMatches = !filters.endDateFrom || 
        (sub.paidUntil && new Date(sub.paidUntil) >= new Date(filters.endDateFrom));
      const endDateToMatches = !filters.endDateTo || 
        (sub.paidUntil && new Date(sub.paidUntil) <= new Date(filters.endDateTo));
      
      return searchMatches && serviceMatches && userMatches && domainMatches &&
        companyMatches && statusMatches && periodMatches && 
        priceMinMatches && priceMaxMatches &&
        startDateFromMatches && startDateToMatches &&
        endDateFromMatches && endDateToMatches;
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
  const getStatusBadge = (status: string) => {
    switch (status) {
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
  };
  
  const formatPaymentPeriod = (period: string) => {
    return t(`subscriptions.periodValues.${period}`);
  };
  
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return t('common.notAvailable');
    return format(new Date(dateString), 'dd.MM.yyyy');
  };
  
  const formatMoney = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return t('common.notAvailable');
    return `$${amount.toFixed(2)}`;
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
                {columnVisibility.title && <TableHead>{t('subscriptions.subscriptionTitle')}</TableHead>}
                {columnVisibility.service && <TableHead>{t('subscriptions.service')}</TableHead>}
                {columnVisibility.domain && <TableHead>{t('subscriptions.domain')}</TableHead>}
                {columnVisibility.user && <TableHead>{t('users.title')}</TableHead>}
                {columnVisibility.company && <TableHead>{t('users.userCompany')}</TableHead>}
                {columnVisibility.price && <TableHead>{t('subscriptions.paymentAmount')}</TableHead>}
                {columnVisibility.period && <TableHead>{t('subscriptions.paymentPeriod')}</TableHead>}
                {columnVisibility.startDate && <TableHead>{t('subscriptions.startDate')}</TableHead>}
                {columnVisibility.endDate && <TableHead>{t('subscriptions.endDate')}</TableHead>}
                {columnVisibility.status && <TableHead>{t('subscriptions.status')}</TableHead>}
                {columnVisibility.actions && <TableHead className="text-right">{t('common.actions')}</TableHead>}
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
                    {columnVisibility.title && (
                      <TableCell className="font-medium">
                        {subscription.title}
                      </TableCell>
                    )}
                    
                    {columnVisibility.service && (
                      <TableCell>
                        {subscription.serviceName || t('common.notAvailable')}
                      </TableCell>
                    )}
                    
                    {columnVisibility.domain && (
                      <TableCell>
                        {subscription.domain || t('common.notAvailable')}
                      </TableCell>
                    )}
                    
                    {columnVisibility.user && (
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{subscription.userName || t('common.notAvailable')}</span>
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
                        {formatMoney(subscription.paymentAmount)}
                      </TableCell>
                    )}
                    
                    {columnVisibility.period && (
                      <TableCell>
                        {formatPaymentPeriod(subscription.paymentPeriod)}
                      </TableCell>
                    )}
                    
                    {columnVisibility.startDate && (
                      <TableCell>
                        {formatDate(subscription.startDate)}
                      </TableCell>
                    )}
                    
                    {columnVisibility.endDate && (
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
            <DialogTitle>{t('subscriptions.editTitle')}</DialogTitle>
            <DialogDescription>
              {t('subscriptions.editDescription')}
            </DialogDescription>
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
    </Card>
  );
}