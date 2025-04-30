import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "@/hooks/use-translations";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Subscription } from "@shared/schema";
import { Link } from "wouter";
import { ChevronDown, Filter, Search, User, ExternalLink } from "lucide-react";
import { format } from "date-fns";

export default function AllSubscriptionsPage() {
  const { t } = useTranslations();
  
  // Состояние для фильтров
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  
  // Получение всех подписок
  const { data: subscriptions, isLoading, error } = useQuery({
    queryKey: ["/api/subscriptions/all"],
    queryFn: async () => {
      const res = await fetch("/api/subscriptions/all");
      if (!res.ok) throw new Error("Failed to fetch all subscriptions");
      return res.json();
    },
  });

  // Получение данных о выбранном пользователе
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["/api/users", selectedUser],
    queryFn: async () => {
      if (!selectedUser) return null;
      const res = await fetch(`/api/users/${selectedUser}`);
      if (!res.ok) throw new Error("Failed to fetch user details");
      return res.json();
    },
    enabled: !!selectedUser,
  });

  // Функция для применения фильтров
  const filteredSubscriptions = subscriptions 
    ? subscriptions.filter((sub: Subscription & { serviceName?: string, userName?: string }) => {
        const searchMatches = 
          search === "" || 
          (sub.serviceName && sub.serviceName.toLowerCase().includes(search.toLowerCase())) ||
          (sub.userName && sub.userName.toLowerCase().includes(search.toLowerCase())) ||
          (sub.domain && sub.domain.toLowerCase().includes(search.toLowerCase()));
          
        const statusMatches = 
          status === "all" || 
          sub.status === status;
          
        return searchMatches && statusMatches;
      })
    : [];
  
  // Функция для сортировки результатов
  const sortedSubscriptions = filteredSubscriptions 
    ? [...filteredSubscriptions].sort((a: any, b: any) => {
        // Определяем поля для сортировки
        let valueA = a[sortBy];
        let valueB = b[sortBy];
        
        // Преобразуем для правильной сортировки
        if (typeof valueA === 'string') valueA = valueA.toLowerCase();
        if (typeof valueB === 'string') valueB = valueB.toLowerCase();
        
        // Применяем порядок сортировки
        if (sortOrder === "asc") {
          return valueA > valueB ? 1 : -1;
        } else {
          return valueA < valueB ? 1 : -1;
        }
      })
    : [];

  // Функция для открытия информации о пользователе
  const handleViewUser = (userId: number) => {
    setSelectedUser(userId);
  };
  
  // Отображение состояний загрузки и ошибки
  if (isLoading) {
    return (
      <AppLayout>
        <Card>
          <CardHeader>
            <CardTitle>{t('subscriptions.allSubscriptions')}</CardTitle>
            <CardDescription>{t('subscriptions.allSubscriptionsDescription')}</CardDescription>
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
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <Card>
          <CardHeader>
            <CardTitle>{t('common.error')}</CardTitle>
            <CardDescription>{t('subscriptions.errorLoadingSubscriptions')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{(error as Error).message}</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <CardTitle>{t('subscriptions.allSubscriptions')}</CardTitle>
              <CardDescription>{t('subscriptions.allSubscriptionsDescription')}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {t('common.filters')}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {showFilters && (
          <CardContent className="border-b">
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <label className="text-sm font-medium mb-1 block">{t('common.search')}</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder={t('subscriptions.searchPlaceholder')}
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">{t('common.status')}</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('subscriptions.filters.selectStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('subscriptions.filters.statusAll')}</SelectItem>
                    <SelectItem value="active">{t('subscriptions.filters.statusActive')}</SelectItem>
                    <SelectItem value="pending">{t('subscriptions.filters.statusPending')}</SelectItem>
                    <SelectItem value="expired">{t('subscriptions.filters.statusExpired')}</SelectItem>
                    <SelectItem value="canceled">{t('subscriptions.filters.statusCanceled')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">{t('common.sortBy')}</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('subscriptions.filters.selectSortField')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="serviceName">{t('subscriptions.filters.sortService')}</SelectItem>
                    <SelectItem value="userName">{t('subscriptions.filters.sortUser')}</SelectItem>
                    <SelectItem value="status">{t('subscriptions.filters.sortStatus')}</SelectItem>
                    <SelectItem value="price">{t('subscriptions.filters.sortPrice')}</SelectItem>
                    <SelectItem value="createdAt">{t('subscriptions.filters.sortCreatedAt')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">{t('subscriptions.filters.sortOrder')}</label>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('subscriptions.filters.selectSortOrder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">{t('common.ascending')}</SelectItem>
                    <SelectItem value="desc">{t('common.descending')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        )}
        
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('subscriptions.columns.service')}</TableHead>
                  <TableHead>{t('subscriptions.columns.user')}</TableHead>
                  <TableHead>{t('subscriptions.columns.status')}</TableHead>
                  <TableHead>{t('subscriptions.columns.price')}</TableHead>
                  <TableHead>{t('subscriptions.columns.period')}</TableHead>
                  <TableHead>{t('subscriptions.columns.createdAt')}</TableHead>
                  <TableHead>{t('subscriptions.columns.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSubscriptions.length > 0 ? (
                  sortedSubscriptions.map((subscription: Subscription & { serviceName?: string, userName?: string, userEmail?: string }) => (
                    <TableRow key={subscription.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{subscription.serviceName}</span>
                          {subscription.domain && (
                            <span className="text-sm text-muted-foreground">{subscription.domain}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8" 
                            onClick={() => handleViewUser(subscription.userId)}
                          >
                            <User className="h-4 w-4" />
                          </Button>
                          <div className="flex flex-col">
                            <span className="font-medium">{subscription.userName}</span>
                            <span className="text-sm text-muted-foreground">{subscription.userEmail}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={subscription.status} />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">${subscription.price.toFixed(2)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{t(`subscriptions.period.${subscription.paymentPeriod}`)}</div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(subscription.createdAt), 'dd.MM.yyyy')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              {t('common.actions')} <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/subscriptions/${subscription.id}`}>
                                {t('subscriptions.viewDetails')}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/users/${subscription.userId}`}>
                                {t('subscriptions.viewUser')}
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      <div className="flex flex-col items-center py-6">
                        <p className="text-lg font-medium mb-2">{t('subscriptions.noSubscriptionsFound')}</p>
                        <p className="text-sm text-muted-foreground">{t('subscriptions.adjustFilters')}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('users.userDetails')}</DialogTitle>
            <DialogDescription>{t('users.userDetailsDescription')}</DialogDescription>
          </DialogHeader>
          {userLoading ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : userData ? (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="font-medium">{t('users.userName')}</div>
                <div className="col-span-3">{userData.name || "-"}</div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="font-medium">{t('users.userEmail')}</div>
                <div className="col-span-3">{userData.email}</div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="font-medium">{t('users.userCompany')}</div>
                <div className="col-span-3">{userData.companyName || "-"}</div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="font-medium">{t('users.userPhone')}</div>
                <div className="col-span-3">{userData.phone || "-"}</div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="font-medium">{t('users.status')}</div>
                <div className="col-span-3">
                  <Badge variant={userData.isActive ? "default" : "destructive"}>
                    {userData.isActive ? t('users.statusActive') : t('users.statusInactive')}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="font-medium">{t('users.userRole')}</div>
                <div className="col-span-3">
                  {userData.role === "admin" ? t('users.roleAdmin') : t('users.roleClient')}
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button asChild>
                  <Link to={`/users/${userData.id}`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t('users.viewFullProfile')}
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-muted-foreground">
              {t('users.errorLoadingUser')}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

// Компонент для отображения статуса подписки с соответствующим цветом
function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslations();
  
  let variant: "default" | "success" | "destructive" | "outline" | "secondary" = "default";
  
  switch (status) {
    case 'active':
      variant = "success";
      break;
    case 'pending':
      variant = "secondary";
      break;
    case 'expired':
      variant = "destructive";
      break;
    case 'canceled':
      variant = "outline";
      break;
    default:
      variant = "default";
  }
  
  return (
    <Badge variant={variant}>
      {t(`subscriptions.status.${status}`)}
    </Badge>
  );
}