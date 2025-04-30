import { useQuery } from "@tanstack/react-query";
import { Service, User } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "@/hooks/use-translations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CalendarIcon, Mail, Phone, Building, CheckCircle2, Loader2 } from "lucide-react";

interface ServiceDetailsViewProps {
  serviceId: number;
  isFullPage?: boolean;
}

export function ServiceDetailsView({ serviceId, isFullPage = false }: ServiceDetailsViewProps) {
  const { t, language } = useTranslations();
  const { data: service, isLoading: isServiceLoading } = useQuery<Service>({
    queryKey: [`/api/services/${serviceId}`],
  });

  const { data: clients, isLoading: isClientsLoading } = useQuery<User[]>({
    queryKey: [`/api/services/${serviceId}/clients`],
    enabled: !!serviceId,
  });

  if (isServiceLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-8 w-1/2" />
      </div>
    );
  }

  if (!service) {
    return <div className="p-4 text-muted-foreground">{t('services.noServices')}</div>;
  }

  const customFields = service.customFields as Record<string, unknown> | null;
  
  return (
    <div className={`space-y-6 ${isFullPage ? 'p-6' : 'p-2'}`}>
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="details">{t('services.details')}</TabsTrigger>
          <TabsTrigger value="clients">{t('services.clients')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
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
              <h3 className="text-2xl font-bold flex items-center gap-2">
                {service.title}
                <Badge variant={service.isActive ? "success" : "secondary"}>
                  {service.isActive ? t('services.active') : t('services.inactive')}
                </Badge>
              </h3>
              <p className="text-muted-foreground">
                <CalendarIcon className="inline-block w-4 h-4 mr-1" />
                {language === 'ru' ? 'Создано' : 'Created'}: {new Date(service.createdAt).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US')}
              </p>
            </div>
          </div>

          {service.description && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{t('services.serviceDescription')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{service.description}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t('services.cashback')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
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
            </CardContent>
          </Card>

          {customFields && Object.keys(customFields).length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{t('services.customFields')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(customFields).map(([key, value]) => (
                    <div key={key} className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-muted-foreground">{key}</span>
                      <span className="text-base">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle>{t('services.serviceClients')}</CardTitle>
              <CardDescription>
                {t('services.clientsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isClientsLoading ? (
                <div className="py-6 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !clients || clients.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground">
                  {t('services.noClients')}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('users.userName')}</TableHead>
                      <TableHead>{t('users.userEmail')}</TableHead>
                      <TableHead>{t('users.userCompany')}</TableHead>
                      <TableHead>{t('users.status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {client.name ? client.name.substring(0, 2).toUpperCase() : client.email.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{client.name || client.email}</div>
                              <div className="text-xs text-muted-foreground">ID: {client.id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm">{client.email}</span>
                            </div>
                            {client.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-sm">{client.phone}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {client.companyName ? (
                            <div className="flex items-center gap-1">
                              <Building className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{client.companyName}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {client.isActive ? (
                            <div className="flex items-center">
                              <CheckCircle2 className="mr-1 h-4 w-4 text-green-500" />
                              <span>{t('users.active')}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">{t('users.inactive')}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}