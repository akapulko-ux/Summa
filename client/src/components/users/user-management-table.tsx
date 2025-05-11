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
import { SearchIcon, Pencil, Trash, ChevronLeft, ChevronRight, User as UserIcon, Settings, CreditCard, DollarSign } from "lucide-react";
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

// Схема для валидации формы начисления кэшбэка
const cashbackFormSchema = z.object({
  amount: z.coerce.number().positive({
    message: "Amount must be a positive number",
  }),
  description: z.string().min(3, {
    message: "Description must be at least 3 characters",
  }),
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
  
  // Инициализация формы для начисления кэшбэка
  const cashbackForm = useForm<CashbackFormValues>({
    resolver: zodResolver(cashbackFormSchema),
    defaultValues: {
      amount: 0,
      description: "",
    },
  });
  
  // Обработка отправки формы начисления кэшбэка
  const onCashbackSubmit = (values: CashbackFormValues) => {
    if (selectedUserId) {
      addCashbackMutation.mutate({
        userId: selectedUserId,
        amount: values.amount,
        description: values.description,
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
  
  // Мутация для начисления кэшбэка
  const addCashbackMutation = useMutation({
    mutationFn: async ({ userId, amount, description }: { userId: number, amount: number, description: string }) => {
      return await apiRequest("POST", `/api/users/${userId}/cashback`, { amount, description });
    },
    onSuccess: (data) => {
      toast({
        title: t('cashback.success'),
        description: t('cashback.cashback_added_success'),
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      // Также инвалидируем кэш для запросов кэшбэка этого пользователя, если они существуют
      if (selectedUserId) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${selectedUserId}/cashback`] });
      }
      setIsAddCashbackDialogOpen(false);
      cashbackForm.reset(); // Очищаем форму
    },
    onError: (error) => {
      console.error("Error adding cashback:", error);
      toast({
        title: t('cashback.error'),
        description: t('cashback.cashback_add_error'),
        variant: "destructive",
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
                      {/* This could be replaced with actual subscription count */}
                      0
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
                              <DollarSign className="h-4 w-4 mr-2" />
                              {t('cashback.add_cashback')}
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
            <DialogTitle>{t('cashback.add_cashback')}</DialogTitle>
            <DialogDescription>
              {t('cashback.cashback_admin_description')}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...cashbackForm}>
            <form onSubmit={cashbackForm.handleSubmit(onCashbackSubmit)} className="space-y-6">
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
                >
                  {addCashbackMutation.isPending ? t('cashback.processing') : t('cashback.add_cashback')}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
