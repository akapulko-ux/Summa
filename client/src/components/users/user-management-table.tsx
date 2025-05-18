import { useState } from "react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { useTranslations } from "@/hooks/use-translations";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
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
import { SearchIcon, Pencil, Trash, ChevronLeft, ChevronRight, User as UserIcon, Settings, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { UserForm } from "./user-form";
import { UserFiltersComponent, type UserFilters, type UserSortOption } from "../filters/user-filters";
import { UserSubscriptions } from "../subscriptions/user-subscriptions";
import { UserCustomFields } from "../custom-fields/user-custom-fields";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Схема для валидации формы управления кэшбэком
const cashbackFormSchema = z.object({
  amount: z.coerce.number().positive({
    message: "Amount must be a positive number",
  }),
  description: z.string().min(3, {
    message: "Description must be at least 3 characters",
  }),
  type: z.enum(['add', 'subtract']),
});

type CashbackFormValues = z.infer<typeof cashbackFormSchema>;

export function UserManagementTable() {
  const { t, language } = useTranslations();
  const { toast } = useToast();
  const [filters, setFilters] = useState<UserFilters>({
    search: "",
    status: "all",
    sortBy: "name",
    sortOrder: "asc",
    company: ""
  });
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [isSubscriptionsDialogOpen, setIsSubscriptionsDialogOpen] = useState(false);
  const [isCustomFieldsDialogOpen, setIsCustomFieldsDialogOpen] = useState(false);
  const [isAddCashbackDialogOpen, setIsAddCashbackDialogOpen] = useState(false);
  const [currentUserBalance, setCurrentUserBalance] = useState<number | null>(null);
  
  // Инициализация формы для управления кэшбэком
  const cashbackForm = useForm<CashbackFormValues>({
    resolver: zodResolver(cashbackFormSchema),
    defaultValues: {
      amount: 0,
      description: "",
      type: 'add',
    },
  });
  
  // Обработка отправки формы управления кэшбэком
  const onCashbackSubmit = (values: CashbackFormValues) => {
    if (selectedUserId) {
      addCashbackMutation.mutate({
        userId: selectedUserId,
        amount: values.amount,
        description: values.description,
        type: values.type,
      });
    }
  };

  const {
    data,
    isLoading,
    isError,
  } = useQuery<{ users: User[], total: number }>({
    queryKey: ["/api/users", { page, limit, search: filters.search, status: filters.status, company: filters.company, sortBy: filters.sortBy, sortOrder: filters.sortOrder }],
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });
  
  // Запрос для получения текущего баланса кэшбэка пользователя
  const {
    data: userCashbackData,
    refetch: refetchUserCashback
  } = useQuery<{ balance: number }>({
    queryKey: [`/api/users/${selectedUserId}/cashback/balance`],
    enabled: !!selectedUserId && isAddCashbackDialogOpen,
    onSuccess: (data) => {
      setCurrentUserBalance(data.balance);
    }
  });
  
  // Мутация для управления кэшбэком
  const addCashbackMutation = useMutation({
    mutationFn: async ({ userId, amount, description, type }: { userId: number, amount: number, description: string, type: 'add' | 'subtract' }) => {
      return await apiRequest("POST", `/api/users/${userId}/cashback`, { amount, description, type });
    },
    onSuccess: (data) => {
      const isAdd = cashbackForm.getValues().type === 'add';
      toast({
        title: t('cashback.success'),
        description: isAdd ? t('cashback.cashback_added_success') : t('cashback.cashback_subtracted_success'),
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      // Также инвалидируем кэш для запросов кэшбэка этого пользователя, если они существуют
      if (selectedUserId) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${selectedUserId}/cashback`] });
        queryClient.invalidateQueries({ queryKey: [`/api/users/${selectedUserId}/cashback/balance`] });
      }
      setIsAddCashbackDialogOpen(false);
      cashbackForm.reset(); // Очищаем форму
      setCurrentUserBalance(null); // Сбрасываем текущий баланс
    },
    onError: (error: any) => {
      console.error("Error managing cashback:", error);
      // Детальное логирование для отладки
      console.log("Error response:", error?.response);
      console.log("Error data:", error?.response?.data);
      console.log("Error status:", error?.response?.status);
      
      // Проверяем, была ли ошибка связана с недостаточным балансом
      let errorTitle = t('cashback.error');
      let errorMessage = t('cashback.cashback_error');
      let errorVariant: "destructive" | "default" = "destructive";
      
      // Проверяем, есть ли сообщение об ошибке
      const errorResponseMessage = error?.response?.data?.message;
      console.log("Error message:", errorResponseMessage);
      
      if (errorResponseMessage === "Insufficient balance") {
        errorTitle = t('cashback.insufficient_balance');
        
        // Если сервер вернул текущий баланс, включаем его в сообщение
        const currentBalance = error?.response?.data?.currentBalance;
        console.log("Current balance from server:", currentBalance);
        
        // Получаем введенную сумму из формы
        const amount = cashbackForm.getValues().amount;
        const enteredAmount = parseFloat(amount || '0');
        console.log("Entered amount:", enteredAmount);
        
        if (currentBalance !== undefined) {
          errorMessage = t('cashback.insufficient_balance_with_amount', { 
            amount: enteredAmount.toString(), 
            balance: currentBalance.toFixed(2) 
          });
        } else {
          // Если баланс не передан, используем текущий баланс из состояния
          if (currentUserBalance !== null) {
            errorMessage = t('cashback.insufficient_balance_with_amount', { 
              amount: enteredAmount.toString(), 
              balance: currentUserBalance.toFixed(2) 
            });
          } else {
            errorMessage = t('cashback.insufficient_balance_detailed');
          }
        }
        // Используем более мягкий вариант для уведомления о недостаточном балансе
        errorVariant = "default";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: errorVariant,
      });
    }
  });

  const toggleSelectAll = () => {
    if (data?.users) {
      if (selectedRows.length === data.users.length) {
        setSelectedRows([]);
      } else {
        setSelectedRows(data.users.map(user => user.id));
      }
    }
  };

  const toggleSelectRow = (userId: number) => {
    if (selectedRows.includes(userId)) {
      setSelectedRows(selectedRows.filter(id => id !== userId));
    } else {
      setSelectedRows([...selectedRows, userId]);
    }
  };

  const handleEdit = (userId: number) => {
    setSelectedUserId(userId);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (userId: number) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (data && page < Math.ceil(data.total / limit)) {
      setPage(page + 1);
    }
  };

  // Render badge based on user status
  const renderStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
    }
    return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Inactive</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('users.title')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <UserFiltersComponent
          filters={filters}
          onFilterChange={(newFilters) => {
            setFilters(newFilters);
            setPage(1); // Сбрасываем страницу при изменении фильтров
          }}
          onResetFilters={() => {
            setFilters({
              search: "",
              status: "all",
              sortBy: "name",
              sortOrder: "asc",
              company: ""
            });
            setPage(1);
          }}
          sortOptions={[
            { value: "name", label: t('users.filters.sortName') },
            { value: "email", label: t('users.filters.sortEmail') },
            { value: "companyName", label: t('users.filters.sortCompany') },
            { value: "createdAt", label: t('users.filters.sortCreatedAt') },
          ]}
          filtersApplied={
            filters.search !== "" || 
            filters.status !== "all" || 
            filters.company !== "" || 
            filters.sortBy !== "name" || 
            filters.sortOrder !== "asc"
          }
        />
        <div className="relative w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={data?.users && data.users.length > 0 && selectedRows.length === data.users.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>{t('users.columns.name')}</TableHead>
                <TableHead>{t('users.columns.email')}</TableHead>
                <TableHead>{t('users.columns.company')}</TableHead>
                <TableHead>{t('users.columns.status')}</TableHead>
                <TableHead>{t('users.columns.subscriptions')}</TableHead>
                <TableHead>{t('users.columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading state
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-5 w-32" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-9 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                    {t('users.errorLoading')}
                  </TableCell>
                </TableRow>
              ) : data?.users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                    {t('users.noUsersFound')}
                  </TableCell>
                </TableRow>
              ) : (
                data?.users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.includes(user.id)}
                        onCheckedChange={() => toggleSelectRow(user.id)}
                        aria-label={`Select ${user.name || user.email}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src="" alt={user.name || user.email} />
                          <AvatarFallback>
                            {user.name
                              ? user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                              : user.email.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name || user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.companyName || "-"}</TableCell>
                    <TableCell>{renderStatusBadge(user.isActive)}</TableCell>
                    <TableCell>
                      {user.subscriptionCount || 0}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4" />
                              <span className="sr-only">{t('users.actions')}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(user.id)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              {t('users.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setIsSubscriptionsDialogOpen(true);
                              }}
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              {t('users.manageSubscriptions')}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setIsCustomFieldsDialogOpen(true);
                              }}
                            >
                              <UserIcon className="h-4 w-4 mr-2" />
                              {t('users.manageCustomFields')}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setIsAddCashbackDialogOpen(true);
                              }}
                            >
                              <span className="h-4 w-4 mr-2 flex items-center justify-center text-sm">₽</span>
                              {t('cashback.manage_cashback')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(user.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              {t('users.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      {data && (
        <CardFooter className="border-t px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              {t('users.showing', { current: data.users.length.toString(), total: data.total.toString() })}
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
                disabled={page >= Math.ceil(data.total / limit)}
              >
                {t('common.next')}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardFooter>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('users.editUser')}</DialogTitle>
          </DialogHeader>
          {selectedUserId && (
            <UserForm 
              userId={selectedUserId} 
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/users"] });
                setIsEditDialogOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Диалог для управления подписками */}
      <Dialog open={isSubscriptionsDialogOpen} onOpenChange={setIsSubscriptionsDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{t('users.manageSubscriptions')}</DialogTitle>
            <DialogDescription>
              {t('users.manageSubscriptionsDescription')}
            </DialogDescription>
          </DialogHeader>
          {selectedUserId && (
            <UserSubscriptions userId={selectedUserId} />
          )}
        </DialogContent>
      </Dialog>

      {/* Диалог для управления кастомными полями */}
      <Dialog open={isCustomFieldsDialogOpen} onOpenChange={setIsCustomFieldsDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{t('users.manageCustomFields')}</DialogTitle>
            <DialogDescription>
              {t('users.manageCustomFieldsDescription')}
            </DialogDescription>
          </DialogHeader>
          {selectedUserId && (
            <UserCustomFields userId={selectedUserId} />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Диалог для начисления кэшбэка */}
      <Dialog open={isAddCashbackDialogOpen} onOpenChange={(open) => {
        setIsAddCashbackDialogOpen(open);
        if (!open) {
          cashbackForm.reset();
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('cashback.manage_cashback')}</DialogTitle>
            <DialogDescription>
              {t('cashback.cashback_admin_description')}
            </DialogDescription>
          </DialogHeader>
          
          {/* Отображение текущего баланса кэшбэка */}
          <div className="mb-4 p-4 border rounded-md bg-muted">
            <div className="flex justify-between items-center">
              <span className="font-medium">{t('cashback.current_balance')}:</span>
              {userCashbackData?.balance !== undefined ? (
                <span className="text-lg font-bold">{userCashbackData.balance.toFixed(2)} ₽</span>
              ) : (
                <span className="text-muted-foreground">{t('common.loading')}...</span>
              )}
            </div>
          </div>
          
          <Form {...cashbackForm}>
            <form onSubmit={cashbackForm.handleSubmit(onCashbackSubmit)} className="space-y-6">
              {/* Переключатель типа операции с кэшбэком */}
              <FormField
                control={cashbackForm.control}
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
                        <label className={`flex items-center space-x-2 ${userCashbackData?.balance === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                          <input
                            type="radio"
                            className="form-radio h-4 w-4 text-destructive"
                            value="subtract"
                            checked={field.value === 'subtract'}
                            onChange={() => field.onChange('subtract')}
                            disabled={userCashbackData?.balance === 0}
                          />
                          <span>{t('cashback.subtract')}</span>
                          {userCashbackData?.balance === 0 && (
                            <span className="text-xs text-destructive ml-1">
                              ({t('cashback.insufficient_balance')})
                            </span>
                          )}
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={cashbackForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('cashback.amount')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder={t('cashback.amount')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={cashbackForm.control}
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
                  onClick={() => setIsAddCashbackDialogOpen(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button 
                  type="submit"
                  disabled={addCashbackMutation.isPending}
                  variant={cashbackForm.watch('type') === 'subtract' ? "destructive" : "default"}
                >
                  {addCashbackMutation.isPending 
                    ? t('cashback.processing') 
                    : cashbackForm.watch('type') === 'subtract' 
                      ? t('cashback.subtract') 
                      : t('cashback.add')}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
