import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { 
  Filter, 
  SlidersHorizontal, 
  X, 
  Search,
  CalendarIcon,
  User,
  Building,
  DollarSign
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "@/hooks/use-translations";

export type SubscriptionColumnVisibility = {
  title: boolean;
  service: boolean;
  domain: boolean;
  user: boolean;
  company: boolean;
  price: boolean;
  period: boolean;
  paidUntil: boolean;
  status: boolean;
  actions: boolean;
}

export type SubscriptionFilters = {
  search: string;
  service: string;
  user: string;
  domain: string;
  company: string;
  status: "all" | "active" | "pending" | "expired" | "canceled";
  period: "all" | "monthly" | "quarterly" | "yearly";
  priceMin: string;
  priceMax: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  paidUntilFrom: string;
  paidUntilTo: string;
}

type SubscriptionFiltersProps = {
  filters: SubscriptionFilters;
  onChange: (filters: SubscriptionFilters) => void;
  columnVisibility: SubscriptionColumnVisibility;
  onColumnVisibilityChange: (columnVisibility: SubscriptionColumnVisibility) => void;
  appliedFilterCount?: number;
}

export function SubscriptionFilters({
  filters,
  onChange,
  columnVisibility,
  onColumnVisibilityChange,
  appliedFilterCount = 0,
}: SubscriptionFiltersProps) {
  const { t } = useTranslations();
  const [localFilters, setLocalFilters] = useState<SubscriptionFilters>(filters);
  const [localColumnVisibility, setLocalColumnVisibility] = useState<SubscriptionColumnVisibility>(columnVisibility);

  // Обработчик изменения одного параметра фильтрации
  const handleFilterChange = (key: keyof SubscriptionFilters, value: any) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Обработчик изменения видимости столбца
  const handleColumnVisibilityChange = (key: keyof SubscriptionColumnVisibility, value: boolean) => {
    setLocalColumnVisibility((prev) => ({ ...prev, [key]: value }));
  };

  // Применение фильтров
  const applyFilters = () => {
    onChange(localFilters);
    onColumnVisibilityChange(localColumnVisibility);
  };

  // Сброс всех фильтров
  const resetFilters = () => {
    const defaultFilters: SubscriptionFilters = {
      search: "",
      service: "",
      user: "",
      domain: "",
      company: "",
      status: "all",
      period: "all",
      priceMin: "",
      priceMax: "",
      sortBy: "createdAt",
      sortOrder: "desc",
      paidUntilFrom: "",
      paidUntilTo: "",
    };
    setLocalFilters(defaultFilters);
    onChange(defaultFilters);
  };

  // Сброс настроек видимости столбцов
  const resetColumnVisibility = () => {
    const defaultColumnVisibility: SubscriptionColumnVisibility = {
      title: true,
      service: true,
      domain: true,
      user: true,
      company: true,
      price: true,
      period: true,
      paidUntil: true,
      status: true,
      actions: true,
    };
    setLocalColumnVisibility(defaultColumnVisibility);
    onColumnVisibilityChange(defaultColumnVisibility);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Filter className="h-3.5 w-3.5" />
          <span>{t('common.filters')}</span>
          {appliedFilterCount > 0 && (
            <Badge 
              variant="secondary" 
              className="ml-1 rounded-sm px-1 font-normal lg:hidden"
            >
              {appliedFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[340px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="px-1">
          <SheetTitle>{t('common.filterOptions')}</SheetTitle>
          <SheetDescription>
            {t('subscriptions.filterDescription')}
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-6 py-6">
          {/* Поиск */}
          <div className="space-y-2">
            <Label htmlFor="search">{t('common.search')}</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                type="search"
                placeholder={t('subscriptions.searchPlaceholder')}
                className="pl-8"
                value={localFilters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {t('subscriptions.searchHelp')}
            </p>
          </div>

          <Separator />

          {/* Фильтры по конкретным полям */}
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
            {/* Сервис */}
            <div className="space-y-2">
              <Label htmlFor="service">{t('subscriptions.service')}</Label>
              <Input
                id="service"
                placeholder={t('subscriptions.searchService')}
                value={localFilters.service}
                onChange={(e) => handleFilterChange("service", e.target.value)}
              />
            </div>

            {/* Пользователь */}
            <div className="space-y-2">
              <Label htmlFor="user">{t('users.title')}</Label>
              <Input
                id="user"
                placeholder={t('subscriptions.searchUser')}
                value={localFilters.user}
                onChange={(e) => handleFilterChange("user", e.target.value)}
              />
            </div>

            {/* Домен */}
            <div className="space-y-2">
              <Label htmlFor="domain">{t('subscriptions.domain')}</Label>
              <Input
                id="domain"
                placeholder={t('subscriptions.searchDomain')}
                value={localFilters.domain}
                onChange={(e) => handleFilterChange("domain", e.target.value)}
              />
            </div>

            {/* Компания */}
            <div className="space-y-2">
              <Label htmlFor="company">{t('users.userCompany')}</Label>
              <Input
                id="company"
                placeholder={t('users.searchCompany')}
                value={localFilters.company}
                onChange={(e) => handleFilterChange("company", e.target.value)}
              />
            </div>

            {/* Статус */}
            <div className="space-y-2">
              <Label htmlFor="status">{t('common.status')}</Label>
              <Select 
                value={localFilters.status} 
                onValueChange={(value) => handleFilterChange("status", value)}
              >
                <SelectTrigger id="status">
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

            {/* Период оплаты */}
            <div className="space-y-2">
              <Label htmlFor="period">{t('subscriptions.paymentPeriod')}</Label>
              <Select 
                value={localFilters.period} 
                onValueChange={(value) => handleFilterChange("period", value)}
              >
                <SelectTrigger id="period">
                  <SelectValue placeholder={t('subscriptions.selectPeriod')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('subscriptions.filters.periodAll')}</SelectItem>
                  <SelectItem value="monthly">{t('subscriptions.periodValues.monthly')}</SelectItem>
                  <SelectItem value="quarterly">{t('subscriptions.periodValues.quarterly')}</SelectItem>
                  <SelectItem value="yearly">{t('subscriptions.periodValues.yearly')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Цена (минимум) */}
            <div className="space-y-2">
              <Label htmlFor="priceMin">{t('subscriptions.filters.priceMin')}</Label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="priceMin"
                  type="number"
                  placeholder="0"
                  className="pl-8"
                  value={localFilters.priceMin}
                  onChange={(e) => handleFilterChange("priceMin", e.target.value)}
                />
              </div>
            </div>

            {/* Цена (максимум) */}
            <div className="space-y-2">
              <Label htmlFor="priceMax">{t('subscriptions.filters.priceMax')}</Label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="priceMax"
                  type="number"
                  placeholder="1000"
                  className="pl-8"
                  value={localFilters.priceMax}
                  onChange={(e) => handleFilterChange("priceMax", e.target.value)}
                />
              </div>
            </div>

            {/* Оплачено до (от) */}
            <div className="space-y-2">
              <Label htmlFor="paidUntilFrom">{t('subscriptions.filters.paidUntilFrom')}</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="paidUntilFrom"
                  type="date"
                  className="pl-8"
                  value={localFilters.paidUntilFrom}
                  onChange={(e) => handleFilterChange("paidUntilFrom", e.target.value)}
                />
              </div>
            </div>

            {/* Оплачено до (до) */}
            <div className="space-y-2">
              <Label htmlFor="paidUntilTo">{t('subscriptions.filters.paidUntilTo')}</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="paidUntilTo"
                  type="date"
                  className="pl-8"
                  value={localFilters.paidUntilTo}
                  onChange={(e) => handleFilterChange("paidUntilTo", e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Сортировка */}
          <div className="space-y-4">
            <div>
              <h3 className="text-md font-medium">{t('common.sortOptions')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('subscriptions.sortOptionsDescription')}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sortBy">{t('common.sortBy')}</Label>
                <Select 
                  value={localFilters.sortBy} 
                  onValueChange={(value) => handleFilterChange("sortBy", value)}
                >
                  <SelectTrigger id="sortBy">
                    <SelectValue placeholder={t('subscriptions.filters.selectSortField')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title">{t('subscriptions.subscriptionTitle')}</SelectItem>
                    <SelectItem value="serviceName">{t('subscriptions.filters.sortService')}</SelectItem>
                    <SelectItem value="userName">{t('subscriptions.filters.sortUser')}</SelectItem>
                    <SelectItem value="domain">{t('subscriptions.filters.sortDomain')}</SelectItem>
                    <SelectItem value="status">{t('subscriptions.filters.sortStatus')}</SelectItem>
                    <SelectItem value="paymentAmount">{t('subscriptions.filters.sortPrice')}</SelectItem>
                    <SelectItem value="paidUntil">{t('subscriptions.filters.sortPaidUntil')}</SelectItem>
                    <SelectItem value="createdAt">{t('subscriptions.filters.sortCreatedAt')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sortOrder">{t('subscriptions.filters.sortOrder')}</Label>
                <Select 
                  value={localFilters.sortOrder} 
                  onValueChange={(value) => handleFilterChange("sortOrder", value as "asc" | "desc")}
                >
                  <SelectTrigger id="sortOrder">
                    <SelectValue placeholder={t('subscriptions.filters.selectSortOrder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">{t('common.ascending')}</SelectItem>
                    <SelectItem value="desc">{t('common.descending')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Настройка отображения столбцов */}
          <div className="space-y-4">
            <div>
              <h3 className="text-md font-medium">{t('subscriptions.columnVisibility')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('subscriptions.columnVisibilityDescription')}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="column-title" 
                  checked={localColumnVisibility.title}
                  onCheckedChange={(checked) => 
                    handleColumnVisibilityChange("title", checked === true)
                  }
                />
                <Label htmlFor="column-title" className="cursor-pointer">
                  {t('subscriptions.subscriptionTitle')}
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="column-service" 
                  checked={localColumnVisibility.service}
                  onCheckedChange={(checked) => 
                    handleColumnVisibilityChange("service", checked === true)
                  }
                />
                <Label htmlFor="column-service" className="cursor-pointer">
                  {t('subscriptions.service')}
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="column-domain" 
                  checked={localColumnVisibility.domain}
                  onCheckedChange={(checked) => 
                    handleColumnVisibilityChange("domain", checked === true)
                  }
                />
                <Label htmlFor="column-domain" className="cursor-pointer">
                  {t('subscriptions.domain')}
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="column-user" 
                  checked={localColumnVisibility.user}
                  onCheckedChange={(checked) => 
                    handleColumnVisibilityChange("user", checked === true)
                  }
                />
                <Label htmlFor="column-user" className="cursor-pointer">
                  {t('users.title')}
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="column-company" 
                  checked={localColumnVisibility.company}
                  onCheckedChange={(checked) => 
                    handleColumnVisibilityChange("company", checked === true)
                  }
                />
                <Label htmlFor="column-company" className="cursor-pointer">
                  {t('users.userCompany')}
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="column-price" 
                  checked={localColumnVisibility.price}
                  onCheckedChange={(checked) => 
                    handleColumnVisibilityChange("price", checked === true)
                  }
                />
                <Label htmlFor="column-price" className="cursor-pointer">
                  {t('subscriptions.paymentAmount')}
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="column-period" 
                  checked={localColumnVisibility.period}
                  onCheckedChange={(checked) => 
                    handleColumnVisibilityChange("period", checked === true)
                  }
                />
                <Label htmlFor="column-period" className="cursor-pointer">
                  {t('subscriptions.paymentPeriod')}
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="column-paidUntil" 
                  checked={localColumnVisibility.paidUntil}
                  onCheckedChange={(checked) => 
                    handleColumnVisibilityChange("paidUntil", checked === true)
                  }
                />
                <Label htmlFor="column-paidUntil" className="cursor-pointer">
                  {t('subscriptions.paidUntil')}
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="column-status" 
                  checked={localColumnVisibility.status}
                  onCheckedChange={(checked) => 
                    handleColumnVisibilityChange("status", checked === true)
                  }
                />
                <Label htmlFor="column-status" className="cursor-pointer">
                  {t('common.status')}
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="column-actions" 
                  checked={localColumnVisibility.actions}
                  onCheckedChange={(checked) => 
                    handleColumnVisibilityChange("actions", checked === true)
                  }
                />
                <Label htmlFor="column-actions" className="cursor-pointer">
                  {t('common.actions')}
                </Label>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="flex flex-col pt-2 border-t">
          <div>
            <div className="flex gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
              >
                {t('subscriptions.resetFilters')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetColumnVisibility}
              >
                {t('subscriptions.resetColumns')}
              </Button>
            </div>
            
            <div>
              <SheetClose asChild>
                <Button className="w-full" onClick={applyFilters}>
                  {t('common.applyFilters')}
                </Button>
              </SheetClose>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}