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
  
  // Фильтруем сервисы, чтобы отображать только стандартные сервисы
  // и кастомные сервисы текущего пользователя
  const services = allServices.filter(service => 
    !service.isCustom || // стандартные сервисы
    (service.isCustom && service.ownerId === user?.id) // кастомные сервисы текущего пользователя
  );

  // Функция фильтрации сервисов по поисковому запросу
  const filteredServices = services.filter(
    (service) =>
      service.title.toLowerCase().includes(search.toLowerCase()) ||
      (service.description && service.description.toLowerCase().includes(search.toLowerCase()))
  );

  // Компонент для отображения карточки сервиса в сетке
  const ServiceGridCard = ({ service }: { service: Service }) => {
    const [showLeadForm, setShowLeadForm] = useState(false);
    const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);
    
    return (
      <Card className="overflow-hidden relative group">
        <CardHeader className="p-4 pb-0">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              {service.iconUrl ? (
                <div className="w-12 h-12 rounded-md overflow-hidden flex items-center justify-center bg-muted">
                  <img 
                    src={service.iconUrl} 
                    alt={service.title} 
                    className="w-10 h-10 object-contain" 
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-md flex items-center justify-center bg-primary/10 text-primary font-semibold text-lg">
                  {service.title.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <CardTitle className="text-base">{service.title}</CardTitle>
                {service.cashback && (
                  <Badge variant="outline" className="mt-1">
                    {t('services.cashback')}: {service.cashback}
                  </Badge>
                )}
                {service.commission && (
                  <Badge variant="outline" className="mt-1 bg-amber-50">
                    {t('services.commission')}: {service.commission}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-3">
          {service.description && <CardDescription>{service.description}</CardDescription>}
        </CardContent>
        <CardFooter className="p-4 pt-0 gap-2 flex-col">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => setShowSubscriptionForm(true)}
          >
            {t('services.добавитьВПодписки')}
          </Button>
          <Button 
            size="sm" 
            className="w-full"
            onClick={() => setShowLeadForm(true)}
          >
            {t('services.купить')}
          </Button>
        </CardFooter>
        
        {/* Dialog для формы заявки */}
        <Dialog open={showLeadForm} onOpenChange={setShowLeadForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('leads.title')}</DialogTitle>
              <DialogDescription>{t('leads.description')}</DialogDescription>
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
              <DialogTitle>{t('subscriptions.addSubscription')}</DialogTitle>
              <DialogDescription>
                {t('subscriptions.addSubscriptionDescription')}
              </DialogDescription>
            </DialogHeader>
            
            <SubscriptionFormFixed 
              defaultService={service}
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
              <div className="w-10 h-10 rounded-md overflow-hidden flex items-center justify-center bg-muted shrink-0">
                <img 
                  src={service.iconUrl} 
                  alt={service.title} 
                  className="w-8 h-8 object-contain" 
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
                  {t('services.добавитьВПодписки')}
                </Button>
                <Button 
                  size="sm"
                  onClick={() => setShowLeadForm(true)}
                >
                  {t('services.купить')}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
        
        {/* Dialog для формы заявки */}
        <Dialog open={showLeadForm} onOpenChange={setShowLeadForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('leads.title')}</DialogTitle>
              <DialogDescription>{t('leads.description')}</DialogDescription>
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
              <DialogTitle>{t('subscriptions.addSubscription')}</DialogTitle>
              <DialogDescription>
                {t('subscriptions.addSubscriptionDescription')}
              </DialogDescription>
            </DialogHeader>
            
            <SubscriptionFormFixed 
              defaultService={service}
              onSuccess={() => setShowSubscriptionForm(false)}
            />
          </DialogContent>
        </Dialog>
      </Card>
    );
  };

  return (
    <AppLayout title={t('services.availableServices')}>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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