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
import { Filter, SlidersHorizontal, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useTranslations } from "@/hooks/use-translations";

export type ServiceFilters = {
  search: string;
  status: "all" | "active" | "inactive";
  sortBy: string;
  sortOrder: "asc" | "desc";
  showCustom?: boolean;  // Показывать ли кастомные сервисы (для админа)
};

export type ServiceSortOption = {
  value: string;
  label: string;
};

const defaultFilters: ServiceFilters = {
  search: "",
  status: "all",
  sortBy: "title",
  sortOrder: "asc",
};

interface ServiceFiltersProps {
  filters: ServiceFilters;
  sortOptions: ServiceSortOption[];
  onFilterChange: (filters: ServiceFilters) => void;
  onResetFilters: () => void;
  filtersApplied: boolean;
}

export function ServiceFiltersComponent({
  filters,
  sortOptions,
  onFilterChange,
  onResetFilters,
  filtersApplied,
}: ServiceFiltersProps) {
  const { t } = useTranslations();
  const [localFilters, setLocalFilters] = 
    useState<ServiceFilters>({ ...filters });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleFilterChange = (key: keyof ServiceFilters, value: any) => {
    setLocalFilters({ ...localFilters, [key]: value });
  };

  const applyFilters = () => {
    onFilterChange(localFilters);
  };

  const resetFilters = () => {
    setLocalFilters({ ...defaultFilters });
    onResetFilters();
  };

  return (
    <div className="flex flex-col space-y-4 w-full">
      <div className="flex items-center gap-2 w-full">
        <div className="relative flex-1">
          <Input
            placeholder={t("services.search")}
            value={filters.search}
            onChange={handleSearchChange}
            className="pl-8"
          />
          <div className="absolute left-2.5 top-2.5 text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          {filters.search && (
            <button
              className="absolute right-2 top-2.5 text-muted-foreground"
              onClick={() => onFilterChange({ ...filters, search: "" })}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter size={16} />
              {t("common.filter")}
              {filtersApplied && (
                <Badge variant="secondary" className="ml-1 px-1 h-5">
                  !
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle>{t("common.filterOptions")}</SheetTitle>
              <SheetDescription>
                {t("services.filterDesc")}
              </SheetDescription>
            </SheetHeader>
            <div className="my-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="status">{t("common.status")}</Label>
                <Select
                  value={localFilters.status}
                  onValueChange={(value) =>
                    handleFilterChange("status", value as "all" | "active" | "inactive")
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("services.statusAll")}</SelectItem>
                    <SelectItem value="active">{t("common.active")}</SelectItem>
                    <SelectItem value="inactive">{t("common.inactive")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("common.sortOptions")}</Label>
                <div className="flex flex-col space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sortBy">{t("common.sortBy")}</Label>
                    <Select
                      value={localFilters.sortBy}
                      onValueChange={(value) => handleFilterChange("sortBy", value)}
                    >
                      <SelectTrigger id="sortBy">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sortOrder">{t("common.sortOrder")}</Label>
                    <Select
                      value={localFilters.sortOrder}
                      onValueChange={(value) =>
                        handleFilterChange("sortOrder", value as "asc" | "desc")
                      }
                    >
                      <SelectTrigger id="sortOrder">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">{t("common.ascending")}</SelectItem>
                        <SelectItem value="desc">{t("common.descending")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
            <SheetFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={resetFilters}
                className="w-full sm:w-auto"
              >
                {t("common.clearFilters")}
              </Button>
              <SheetClose asChild>
                <Button onClick={applyFilters} className="w-full sm:w-auto">
                  {t("common.applyFilters")}
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Button
          variant="ghost"
          size="icon"
          onClick={resetFilters}
          disabled={!filtersApplied}
          className="relative"
        >
          <SlidersHorizontal size={16} />
          {filtersApplied && (
            <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full"></span>
          )}
        </Button>
      </div>

      {filtersApplied && (
        <div className="flex flex-wrap gap-2">
          {filters.status !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {filters.status === "active" ? t("common.active") : t("common.inactive")}
              <button
                onClick={() => onFilterChange({ ...filters, status: "all" })}
                className="ml-1"
              >
                <X size={14} />
              </button>
            </Badge>
          )}
          {filters.sortBy !== defaultFilters.sortBy && (
            <Badge variant="secondary" className="gap-1">
              {t("common.sortBy")}: {sortOptions.find(o => o.value === filters.sortBy)?.label}
              <button
                onClick={() =>
                  onFilterChange({
                    ...filters,
                    sortBy: defaultFilters.sortBy,
                  })
                }
                className="ml-1"
              >
                <X size={14} />
              </button>
            </Badge>
          )}
          {filters.sortOrder !== defaultFilters.sortOrder && (
            <Badge variant="secondary" className="gap-1">
              {filters.sortOrder === "asc"
                ? t("common.ascending")
                : t("common.descending")}
              <button
                onClick={() =>
                  onFilterChange({
                    ...filters,
                    sortOrder: defaultFilters.sortOrder,
                  })
                }
                className="ml-1"
              >
                <X size={14} />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}