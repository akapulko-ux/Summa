import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, User, Calendar, DollarSign, CircleCheck, CircleX } from "lucide-react";
import { Service, User as UserType } from "@shared/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "@/hooks/use-translations";
import { apiRequest } from "@/lib/queryClient";
import { CustomFieldsManager } from "@/components/custom-fields/custom-fields-manager";

interface ServiceDetailsViewProps {
  serviceId: number;
  isFullPage?: boolean;
}

export function ServiceDetailsView({ serviceId, isFullPage = false }: ServiceDetailsViewProps) {
  const { t, language } = useTranslations();
  const [activeTab, setActiveTab] = useState("general");

  // Fetch service data
  const { data: service, isLoading: isLoadingService } = useQuery<Service>({
    queryKey: [`/api/services/${serviceId}`],
  });

  // Fetch clients using this service
  const { data: clients, isLoading: isLoadingClients } = useQuery<UserType[]>({
    queryKey: [`/api/services/${serviceId}/clients`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/services/${serviceId}/clients`);
      if (!res.ok) throw new Error('Failed to fetch service clients');
      return res.json();
    },
  });

  if (isLoadingService) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (!service) {
    return <div className="p-4 text-muted-foreground">{t('services.noServices')}</div>;
  }

  return (
    <div className={isFullPage ? "container py-6" : ""}>
      <Card className={isFullPage ? "max-w-4xl mx-auto" : ""}>
        <CardHeader>
          <div className="flex items-center gap-4">
            {service.iconUrl ? (
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                <img 
                  src={service.iconUrl} 
                  alt={service.title} 
                  className="w-10 h-10 object-contain"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {service.title.substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <CardTitle className="text-2xl">{service.title}</CardTitle>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant={service.isActive ? "success" : "secondary"}>
                  {service.isActive ? t('common.active') : t('common.inactive')}
                </Badge>
                {service.cashback && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {service.cashback}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">{t('common.general')}</TabsTrigger>
              <TabsTrigger value="clients">{t('users.title')}</TabsTrigger>
              <TabsTrigger value="fields">{t('services.customFields')}</TabsTrigger>
            </TabsList>
          </div>
          
          <CardContent className="pt-4">
            <TabsContent value="general" className="space-y-4">
              {service.description && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">{t('services.serviceDescription')}</h4>
                  <p className="text-sm">{service.description}</p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">{t('services.cashback')}</h4>
                <p className="text-sm">
                  {service.cashback ? (
                    service.cashback.endsWith("%") ? (
                      <>{service.cashback} {language === 'ru' ? 'от стоимости подписки' : 'of subscription cost'}</>
                    ) : (
                      <>{service.cashback}{language === 'ru' ? '₽ фиксированный кэшбэк' : '$ fixed cashback'}</>
                    )
                  ) : (
                    language === 'ru' ? "Кэшбэк недоступен" : "Cashback not available"
                  )}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('common.date')} {language === 'ru' ? 'создания' : 'created'}</p>
                    <p className="text-sm font-medium">{new Date(service.createdAt).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('common.date')} {language === 'ru' ? 'обновления' : 'updated'}</p>
                    <p className="text-sm font-medium">{new Date(service.updatedAt).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US')}</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="clients">
              {isLoadingClients ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !clients || clients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {language === 'ru' ? "Нет клиентов, использующих этот сервис" : "No clients using this service"}
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">{t('users.title')} ({clients.length})</h4>
                  <div className="space-y-3">
                    {clients.map((client) => (
                      <div key={client.id} className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {client.name ? client.name.substring(0, 2).toUpperCase() : client.email.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{client.name || client.email}</p>
                            <p className="text-xs text-muted-foreground">{client.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {client.isActive ? (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <CircleCheck className="h-3 w-3" />
                              {t('common.active')}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <CircleX className="h-3 w-3" />
                              {t('common.inactive')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="fields">
              <CustomFieldsManager 
                entityType="service" 
                entityId={serviceId} 
                isAdmin={false} 
              />
            </TabsContent>
          </CardContent>
        </Tabs>

        {isFullPage && (
          <CardFooter className="flex justify-end border-t pt-6">
            <div className="text-sm text-muted-foreground">
              {t('services.serviceDetails')}
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}