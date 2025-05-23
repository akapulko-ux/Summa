import { useState } from "react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Service } from "@shared/schema";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SearchIcon, Pencil, Trash, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { ServiceForm } from "./service-form";
import { ServiceDetailsView } from "./service-details";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "@/hooks/use-translations";
import { ServiceFiltersComponent, type ServiceFilters, type ServiceSortOption } from "../filters/service-filters";
import { ru } from "date-fns/locale";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { usePreloadImages } from "@/hooks/use-image-cache";

export function ServiceList() {
  const [filters, setFilters] = useState<ServiceFilters>({
    search: "",
    status: "all",
    sortBy: "title",
    sortOrder: "asc",
    showCustom: false
  });
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const { user } = useAuth();
  const { t, language } = useTranslations();
  const isAdmin = user?.role === "admin";
  
  // Check if any filters are applied (not default)
  // showCustom не учитывается в filtersApplied - это отдельный переключатель
  const filtersApplied = 
    filters.search !== "" || 
    filters.status !== "all" || 
    filters.sortBy !== "title" || 
    filters.sortOrder !== "asc";

  const sortOptions: ServiceSortOption[] = [
    { value: "title", label: t('services.serviceTitle') },
    { value: "createdAt", label: t('common.createdAt') },
    { value: "updatedAt", label: t('common.updatedAt') }
  ];

  const {
    data,
    isLoading,
    isError,
    refetch
  } = useQuery<{ services: Service[], total: number }>({
    queryKey: ["/api/services", { page, limit, ...filters }],
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: number) => {
      await apiRequest("DELETE", `/api/services/${serviceId}`);
    },
    onSuccess: () => {
      // Явно инвалидируем кеш для обновления списка сервисов
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      // Принудительно обновляем текущие данные
      refetch();
    },
    onError: (error) => {
      console.error("Error deleting service:", error);
      alert(language === 'ru' ? 'Ошибка при удалении сервиса' : 'Error deleting service');
    }
  });

  const handleEdit = (serviceId: number) => {
    setSelectedServiceId(serviceId);
    setIsEditDialogOpen(true);
  };

  const handleView = (serviceId: number) => {
    setSelectedServiceId(serviceId);
    setIsViewDialogOpen(true);
  };

  const handleDelete = (serviceId: number) => {
    if (window.confirm(t('services.confirmDelete'))) {
      deleteServiceMutation.mutate(serviceId);
      // Вызываем рефреш для обновления данных немедленно
      setTimeout(() => {
        // Используем setTimeout, чтобы дать мутации время выполнить запрос на удаление
        refetch();
      }, 300);
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

  // Предзагрузка изображений сервисов для ускорения админского интерфейса
  const services = data?.services || [];
  const imageUrls = services.map(service => {
    if (service.iconData && service.iconMimeType) {
      return `data:${service.iconMimeType};base64,${service.iconData}`;
    }
    if (service.iconUrl) {
      return service.iconUrl;
    }
    return `/api/service-icon/${service.id}`;
  });
  usePreloadImages(imageUrls);

  // Function to format cashback value for display
  const formatCashback = (cashback: string | null | undefined) => {
    if (!cashback) return language === 'ru' ? "Нет" : "None";
    
    // Display as percentage if it ends with %
    if (cashback.endsWith("%")) {
      return cashback;
    }
    
    // Otherwise display as currency
    return `${language === 'ru' ? '₽' : '$'}${cashback}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('services.title')}</CardTitle>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button 
                variant="outline" 
                onClick={() => setFilters(prev => ({
                  ...prev,
                  showCustom: !prev.showCustom
                }))}
              >
                {filters.showCustom 
                  ? t('services.hideCustomServices') 
                  : t('services.showCustomServices')}
              </Button>
            )}
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  {isAdmin 
                    ? t('services.addService')
                    : t('services.addCustomService')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {isAdmin 
                      ? t('services.addService')
                      : t('services.addCustomService')}
                  </DialogTitle>
                  <DialogDescription id="dialog-description">
                    {isAdmin 
                      ? t('services.serviceDescription')
                      : t('services.customServiceDescription')}
                  </DialogDescription>
                </DialogHeader>
                <ServiceForm 
                  isCustom={!isAdmin}
                  onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/services"] })} 
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="border-b pt-0">
        <ServiceFiltersComponent
          filters={filters}
          sortOptions={sortOptions}
          onFilterChange={(newFilters) => {
            setFilters(newFilters);
            // Reset to page 1 when filters change
            setPage(1);
          }}
          onResetFilters={() => {
            setFilters({
              search: "",
              status: "all",
              sortBy: "title", 
              sortOrder: "asc",
              showCustom: filters.showCustom // Сохраняем текущее значение showCustom
            });
            setPage(1);
          }}
          filtersApplied={filtersApplied}
        />
      </CardContent>
      <CardContent>
        <div className="relative w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('services.serviceTitle')}</TableHead>
                <TableHead>{t('services.serviceDescription')}</TableHead>
                <TableHead>{t('services.cashback')}</TableHead>
                <TableHead>{t('common.edit')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading state
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-5 w-32" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-5 w-64" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-9 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                    {t('messages.serverError')}
                  </TableCell>
                </TableRow>
              ) : data?.services.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                    {t('services.noServices')}
                  </TableCell>
                </TableRow>
              ) : (
                data?.services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <OptimizedImage
                          src={service.iconData && service.iconMimeType 
                            ? `data:${service.iconMimeType};base64,${service.iconData}`
                            : service.iconUrl || `/api/service-icon/${service.id}`}
                          alt={`${service.title} icon`}
                          className="w-10 h-10 rounded-md object-cover"
                          fallback={
                            <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center">
                              <span className="text-gray-500 text-xs font-semibold">
                                {service.title.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          }
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{service.title}</span>
                          {service.isCustom && (
                            <Badge variant="outline" className="text-xs">
                              {t('services.custom')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="text-sm text-muted-foreground truncate">
                          {service.description || "-"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {formatCashback(service.cashback)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(service.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(service.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(service.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Pagination */}
      {data && data.total > limit && (
        <CardFooter className="flex justify-between items-center pt-6">
          <div className="text-sm text-muted-foreground">
            {t('common.showing')} {((page - 1) * limit) + 1} - {Math.min(page * limit, data.total)} {t('common.of')} {data.total} {t('services.services')}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              {t('common.previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={page >= Math.ceil(data.total / limit)}
            >
              {t('common.next')}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      )}

      {/* Edit Service Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('services.editService')}</DialogTitle>
            <DialogDescription>{t('services.editServiceDescription')}</DialogDescription>
          </DialogHeader>
          {selectedServiceId && (
            <ServiceForm 
              serviceId={selectedServiceId} 
              onSuccess={() => {
                setIsEditDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ["/api/services"] });
              }} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Service Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t('services.serviceDetails')}</DialogTitle>
          </DialogHeader>
          {selectedServiceId && (
            <ServiceDetailsView serviceId={selectedServiceId} />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
                          {service.isCustom && (
                            <Badge variant="outline" className="text-xs">
                              {t('services.customService')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div className="truncate">
                        {service.description || (language === 'ru' ? "Нет описания" : "No description")}
                      </div>
                    </TableCell>
                    <TableCell>{formatCashback(service.cashback)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleView(service.id)}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">{language === 'ru' ? 'Просмотр' : 'View'}</span>
                        </Button>
                        {/* Показываем кнопки редактирования для админов или если это кастомный сервис пользователя */}
                        {(isAdmin || (service.isCustom && service.ownerId === user?.id)) && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(service.id)}>
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">{language === 'ru' ? 'Редактировать' : 'Edit'}</span>
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(service.id)}>
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">{language === 'ru' ? 'Удалить' : 'Delete'}</span>
                            </Button>
                          </>
                        )}
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
              {language === 'ru' 
                ? `Показано ${data.services.length} из ${data.total} сервисов` 
                : `Showing ${data.services.length} of ${data.total} services`}
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

      {/* Edit Service Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('services.editService')}</DialogTitle>
            <DialogDescription id="dialog-description">{t('services.serviceDescription')}</DialogDescription>
          </DialogHeader>
          {selectedServiceId && (
            <ServiceForm 
              serviceId={selectedServiceId} 
              onSuccess={() => {
                // Явно инвалидируем кеш для обновления списка сервисов
                queryClient.invalidateQueries({ queryKey: ["/api/services"] });
                // Принудительно обновляем текущие данные
                refetch();
                setIsEditDialogOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Service Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{t('services.serviceDetails')}</DialogTitle>
            <DialogDescription id="dialog-description">{t('common.information')}</DialogDescription>
          </DialogHeader>
          {selectedServiceId && (
            <ServiceDetailsView serviceId={selectedServiceId} />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Removed redundant ServiceDetails component as it's replaced by ServiceDetailsView
