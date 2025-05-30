import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useTranslations } from "@/hooks/use-translations";
import { useQuery } from "@tanstack/react-query";
import { Service } from "@shared/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, List, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { ServiceLeadForm } from "@/components/services/service-lead-form";
import { SubscriptionForm } from "@/components/subscriptions/subscription-form-fixed";
import { OptimizedServiceCard } from "@/components/services/optimized-service-card";
import { usePreloadImages } from "@/hooks/use-image-cache";

export default function ClientServicesPage() {
  const { t, language } = useTranslations();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Загрузка списка сервисов
  const { data, isLoading } = useQuery<{ services: Service[] }>({
    queryKey: ["/api/services"],
  });

  // Получаем массив сервисов из ответа API
  const allServices = data?.services || [];
  
  // Фильтруем сервисы, чтобы отображать ТОЛЬКО стандартные сервисы,
  // исключая кастомные сервисы пользователя
  const services = allServices.filter(service => 
    !service.isCustom // только стандартные сервисы, БЕЗ кастомных
  );

  // Функция фильтрации сервисов по поисковому запросу
  const filteredServices = services.filter(
    (service) =>
      service.title.toLowerCase().includes(search.toLowerCase()) ||
      (service.description && service.description.toLowerCase().includes(search.toLowerCase()))
  );

  // Предзагрузка изображений сервисов для ускорения
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

  // Компонент для отображения карточки сервиса в сетке (квадратный формат)
  const ServiceGridCard = ({ service }: { service: Service }) => {
    const [showLeadForm, setShowLeadForm] = useState(false);
    const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);
    
    return (
      <Card className="overflow-hidden relative group flex flex-col h-[230px]">
        {/* Заголовок с иконкой и названием сервиса */}
        <CardHeader className="p-3 pb-0 space-y-1">
          <div className="flex flex-col items-center text-center">
            {/* Иконка сервиса */}
            {service.iconUrl ? (
              <div className="w-12 h-12 rounded-md overflow-hidden mb-1">
                <img 
                  src={service.iconUrl} 
                  alt={service.title} 
                  className="w-full h-full object-cover" 
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-md flex items-center justify-center bg-primary/10 text-primary font-semibold text-md mb-1">
                {service.title.substring(0, 2).toUpperCase()}
              </div>
            )}
            {/* Название сервиса */}
            <CardTitle className="text-sm mb-1 line-clamp-1">{service.title}</CardTitle>
            
            {/* Бейджи кэшбэка и комиссии */}
            <div className="flex flex-wrap justify-center gap-1">
              {service.cashback && (
                <Badge variant="outline" className="text-xs px-2 py-0 h-5 bg-red-50 text-red-600 border-red-200">
                  {t('services.cashback')}: {service.cashback}
                </Badge>
              )}
              {service.commission && (
                <Badge variant="outline" className="bg-amber-50 text-xs px-2 py-0 h-5">
                  {t('services.commission')}: {service.commission}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        {/* Описание сервиса */}
        <CardContent className="px-3 py-1 flex-grow">
          {service.description && (
            <CardDescription className="text-center text-xs line-clamp-2 h-10 overflow-hidden">
              {service.description}
            </CardDescription>
          )}
        </CardContent>
        
        {/* Кнопки действий */}
        <CardFooter className="p-2 gap-1 flex-col">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full h-7 text-xs"
            onClick={() => setShowSubscriptionForm(true)}
          >
            {language === 'ru' ? 'Добавить в подписки' : 'Add to subscriptions'}
          </Button>
          <Button 
            size="sm" 
            className="w-full h-7 text-xs"
            onClick={() => setShowLeadForm(true)}
          >
            {language === 'ru' ? 'Купить' : 'Buy'}
          </Button>
        </CardFooter>
        
        {/* Dialog для формы заявки */}
        <Dialog open={showLeadForm} onOpenChange={setShowLeadForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{language === 'ru' ? 'Заказать услугу' : 'Request Service'}</DialogTitle>
              <DialogDescription>{language === 'ru' ? 'Оставьте заявку на эту услугу' : 'Submit your request for this service'}</DialogDescription>
            </DialogHeader>
            
            {/* Импортируем и используем нашу форму заявки */}
            <ServiceLeadForm 
              service={service} 
              onSuccess={() => setShowLeadForm(false)} 
            />
          </DialogContent>
        </Dialog>
        
        {/* Dialog для формы подписки */}
        <Dialog open={showSubscriptionForm} onOpenChange={setShowSubscriptionForm}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{language === 'ru' ? 'Добавить подписку' : 'Add Subscription'}</DialogTitle>
              <DialogDescription>
                {language === 'ru' 
                  ? 'Заполните форму ниже, чтобы добавить новую подписку на услугу' 
                  : 'Fill out the form below to add a new service subscription'}
              </DialogDescription>
            </DialogHeader>
            
            <SubscriptionForm 
              initialData={{serviceId: service.id, title: service.title}}
              onSuccess={() => setShowSubscriptionForm(false)}
            />
          </DialogContent>
        </Dialog>
      </Card>
    );
  };

  // Компонент для отображения сервиса в списке
  const ServiceListItem = ({ service }: { service: Service }) => {
    const [showLeadForm, setShowLeadForm] = useState(false);
    const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);
    
    return (
      <Card className="mb-2">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {service.iconUrl ? (
              <div className="w-10 h-10 rounded-md overflow-hidden shrink-0">
                <img 
                  src={service.iconUrl} 
                  alt={service.title} 
                  className="w-full h-full object-cover" 
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-md flex items-center justify-center bg-primary/10 text-primary font-semibold text-lg shrink-0">
                {service.title.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <div className="font-medium">{service.title}</div>
              {service.description && (
                <div className="text-sm text-muted-foreground line-clamp-1">
                  {service.description}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 items-end min-w-[250px]">
              <div className="flex flex-col items-end mb-2">
                {service.cashback && (
                  <Badge variant="outline" className="mb-1">
                    {t('services.cashback')}: {service.cashback}
                  </Badge>
                )}
                {service.commission && (
                  <Badge variant="outline" className="bg-amber-50">
                    {t('services.commission')}: {service.commission}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowSubscriptionForm(true)}
                >
                  {language === 'ru' ? 'Добавить в подписки' : 'Add to subscriptions'}
                </Button>
                <Button 
                  size="sm"
                  onClick={() => setShowLeadForm(true)}
                >
                  {language === 'ru' ? 'Купить' : 'Buy'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
        
        {/* Dialog для формы заявки */}
        <Dialog open={showLeadForm} onOpenChange={setShowLeadForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{language === 'ru' ? 'Заказать услугу' : 'Request Service'}</DialogTitle>
              <DialogDescription>{language === 'ru' ? 'Оставьте заявку на эту услугу' : 'Submit your request for this service'}</DialogDescription>
            </DialogHeader>
            
            <ServiceLeadForm 
              service={service} 
              onSuccess={() => setShowLeadForm(false)} 
            />
          </DialogContent>
        </Dialog>
        
        {/* Dialog для формы подписки */}
        <Dialog open={showSubscriptionForm} onOpenChange={setShowSubscriptionForm}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{language === 'ru' ? 'Добавить подписку' : 'Add Subscription'}</DialogTitle>
              <DialogDescription>
                {language === 'ru' 
                  ? 'Заполните форму ниже, чтобы добавить новую подписку на услугу' 
                  : 'Fill out the form below to add a new service subscription'}
              </DialogDescription>
            </DialogHeader>
            
            <SubscriptionForm
              initialData={{serviceId: service.id, title: service.title}}
              onSuccess={() => setShowSubscriptionForm(false)}
            />
          </DialogContent>
        </Dialog>
      </Card>
    );
  };

  return (
    <AppLayout title={t('services.clientServicesTitle')}>
      <div className="mb-4 flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('common.search')}
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
            className="h-9 w-9"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
            className="h-9 w-9"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : ""}>
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-md" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-3 w-4/5" />
                </CardContent>
              </Card>
            ))}
        </div>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredServices?.map((service) => (
                <ServiceGridCard key={service.id} service={service} />
              ))}
            </div>
          ) : (
            <div>
              {filteredServices?.map((service) => (
                <ServiceListItem key={service.id} service={service} />
              ))}
            </div>
          )}

          {filteredServices?.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground">
                {search
                  ? t('services.noServicesFound')
                  : t('services.noServices')}
              </div>
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}