import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { useTranslations } from "@/hooks/use-translations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Grid, List, Search } from "lucide-react";
import { Service } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

export default function ServicesPage() {
  const { t, language } = useTranslations();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetching services
  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services/public"],
  });

  // Filter services based on search query
  const filteredServices = services?.filter(service => 
    service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (service.description && service.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Render skeleton loading state
  const renderSkeletons = () => {
    if (viewMode === "grid") {
      return Array(6).fill(0).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="aspect-video bg-muted flex items-center justify-center">
              <Skeleton className="h-20 w-20 rounded-full" />
            </div>
            <div className="p-6">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardContent>
        </Card>
      ));
    } else {
      return Array(6).fill(0).map((_, index) => (
        <Card key={index} className="mb-4">
          <CardContent className="p-4 flex items-center">
            <Skeleton className="h-12 w-12 rounded-full mr-4" />
            <div className="flex-1">
              <Skeleton className="h-5 w-1/3 mb-2" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>
      ));
    }
  };

  // Render grid view of services
  const renderGridView = () => {
    if (!filteredServices?.length) {
      return (
        <div className="col-span-full text-center py-10 text-muted-foreground">
          {t('services.noServicesFound')}
        </div>
      );
    }

    return filteredServices.map(service => (
      <Card key={service.id} className="overflow-hidden">
        <CardContent className="p-0">
          {service.iconUrl ? (
            <div 
              className="aspect-video bg-muted flex items-center justify-center"
              style={{ 
                backgroundImage: `url(${service.iconUrl})`, 
                backgroundSize: 'cover',
                backgroundPosition: 'center' 
              }}
            />
          ) : (
            <div className="aspect-video bg-muted flex items-center justify-center">
              <span className="text-3xl font-bold text-muted-foreground">
                {service.title?.charAt(0) || "?"}
              </span>
            </div>
          )}
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-2">{service.title}</h3>
            {service.description && (
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {service.description}
              </p>
            )}
            <div className="flex space-x-2">
              {service.cashback && (
                <Badge variant="secondary" className="flex-shrink-0">
                  {language === 'ru' ? 'Кэшбэк' : 'Cashback'}: {service.cashback}
                </Badge>
              )}
              {service.commission && (
                <Badge variant="outline" className="flex-shrink-0">
                  {language === 'ru' ? 'Комиссия' : 'Commission'}: {service.commission}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    ));
  };

  // Render list view of services
  const renderListView = () => {
    if (!filteredServices?.length) {
      return (
        <div className="text-center py-10 text-muted-foreground">
          {t('services.noServicesFound')}
        </div>
      );
    }

    return filteredServices.map(service => (
      <Card key={service.id} className="mb-4">
        <CardContent className="p-4 flex items-center">
          {service.iconUrl ? (
            <div 
              className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mr-4"
              style={{ 
                backgroundImage: `url(${service.iconUrl})`, 
                backgroundSize: 'cover',
                backgroundPosition: 'center' 
              }}
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mr-4">
              <span className="text-lg font-bold text-muted-foreground">
                {service.title?.charAt(0) || "?"}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">{service.title}</h3>
            {service.description && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                {service.description}
              </p>
            )}
            <div className="flex space-x-2">
              {service.cashback && (
                <Badge variant="secondary" className="flex-shrink-0">
                  {language === 'ru' ? 'Кэшбэк' : 'Cashback'}: {service.cashback}
                </Badge>
              )}
              {service.commission && (
                <Badge variant="outline" className="flex-shrink-0">
                  {language === 'ru' ? 'Комиссия' : 'Commission'}: {service.commission}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    ));
  };

  return (
    <AppLayout title={t('services.title')}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-2">{t('services.browseServices')}</h1>
        <p className="text-muted-foreground">
          {t('services.browserServicesDescription')}
        </p>
      </div>

      {/* Toolbar with search and view mode */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('common.search')}
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center">
          <span className="text-sm text-muted-foreground mr-2">{t('services.view')}:</span>
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            className="mr-2"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Services list with different view modes */}
      {isLoading ? (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : ""}>
          {renderSkeletons()}
        </div>
      ) : (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : ""}>
          {viewMode === "grid" ? renderGridView() : renderListView()}
        </div>
      )}
    </AppLayout>
  );
}