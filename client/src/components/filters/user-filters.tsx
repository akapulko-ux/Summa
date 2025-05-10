import { useState } from "react";
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
  Card,
  CardContent,
} from "@/components/ui/card";
import { useTranslations } from "@/hooks/use-translations";
import { Search, Filter, RotateCcw } from "lucide-react";

export interface UserFilters {
  search: string;
  status: 'all' | 'active' | 'inactive';
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  company?: string;
}

export type UserSortOption = {
  value: string;
  label: string;
}

interface UserFiltersComponentProps {
  filters: UserFilters;
  onFilterChange: (filters: UserFilters) => void;
  onResetFilters: () => void;
  sortOptions: UserSortOption[];
  filtersApplied: boolean;
}

export function UserFiltersComponent({
  filters,
  onFilterChange,
  onResetFilters,
  sortOptions,
  filtersApplied
}: UserFiltersComponentProps) {
  const { t } = useTranslations();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Локальное состояние для фильтров, чтобы применять их только при нажатии кнопки "Применить"
  const [localFilters, setLocalFilters] = useState<UserFilters>(filters);

  const handleSearchChange = (value: string) => {
    setLocalFilters({ ...localFilters, search: value });
  };

  const handleStatusChange = (value: 'all' | 'active' | 'inactive') => {
    setLocalFilters({ ...localFilters, status: value });
  };

  const handleSortByChange = (value: string) => {
    setLocalFilters({ ...localFilters, sortBy: value });
  };

  const handleSortOrderChange = (value: 'asc' | 'desc') => {
    setLocalFilters({ ...localFilters, sortOrder: value });
  };

  const handleCompanyChange = (value: string) => {
    setLocalFilters({ ...localFilters, company: value });
  };

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      search: "",
      status: 'all' as const,
      sortBy: "name",
      sortOrder: 'asc' as const,
      company: ""
    };
    setLocalFilters(defaultFilters);
    onResetFilters();
  };

  return (
    <div className="mb-4">
      <div className="flex flex-col sm:flex-row gap-2 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('users.searchPlaceholder')}
            className="pl-8 w-full"
            value={localFilters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleApplyFilters();
              }
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <Button 
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-1 whitespace-nowrap"
          >
            <Filter className="h-4 w-4" />
            {t('common.filters')}
          </Button>
          
          <Button onClick={handleApplyFilters} className="gap-1 whitespace-nowrap">
            <Search className="h-4 w-4" />
            {t('common.apply')}
          </Button>
          
          {filtersApplied && (
            <Button 
              variant="ghost" 
              onClick={handleResetFilters}
              className="gap-1 whitespace-nowrap"
            >
              <RotateCcw className="h-4 w-4" />
              {t('common.reset')}
            </Button>
          )}
        </div>
      </div>
      
      {isExpanded && (
        <Card className="mt-2">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status-filter">{t('users.filters.status')}</Label>
                <Select
                  value={localFilters.status}
                  onValueChange={(value) => handleStatusChange(value as 'all' | 'active' | 'inactive')}
                >
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder={t('users.filters.selectStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('users.filters.statusAll')}</SelectItem>
                    <SelectItem value="active">{t('users.filters.statusActive')}</SelectItem>
                    <SelectItem value="inactive">{t('users.filters.statusInactive')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sort-by-filter">{t('users.filters.sortBy')}</Label>
                <Select
                  value={localFilters.sortBy}
                  onValueChange={handleSortByChange}
                >
                  <SelectTrigger id="sort-by-filter">
                    <SelectValue placeholder={t('users.filters.selectSortField')} />
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
                <Label htmlFor="sort-order-filter">{t('users.filters.sortOrder')}</Label>
                <Select
                  value={localFilters.sortOrder}
                  onValueChange={(value) => handleSortOrderChange(value as 'asc' | 'desc')}
                >
                  <SelectTrigger id="sort-order-filter">
                    <SelectValue placeholder={t('users.filters.selectSortOrder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">{t('users.filters.ascending')}</SelectItem>
                    <SelectItem value="desc">{t('users.filters.descending')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company-filter">{t('users.filters.company')}</Label>
                <Input
                  id="company-filter"
                  placeholder={t('users.filters.enterCompany')}
                  value={localFilters.company || ""}
                  onChange={(e) => handleCompanyChange(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}