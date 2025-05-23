import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Skeleton } from "@/components/ui/skeleton";
import { memo } from "react";

interface Service {
  id: number;
  title: string;
  iconUrl?: string | null;
  iconData?: string | null;
  iconMimeType?: string | null;
  description?: string;
  cashback?: string | null;
  commission?: string | null;
}

interface OptimizedServiceCardProps {
  service: Service;
  onSelect?: (service: Service) => void;
  isSelectable?: boolean;
}

// Мемоизированная карточка сервиса для предотвращения ненужных рендеров
export const OptimizedServiceCard = memo(({ 
  service, 
  onSelect, 
  isSelectable = false 
}: OptimizedServiceCardProps) => {
  const getIconUrl = () => {
    if (service.iconData && service.iconMimeType) {
      return `data:${service.iconMimeType};base64,${service.iconData}`;
    }
    if (service.iconUrl) {
      return service.iconUrl;
    }
    return `/api/service-icon/${service.id}`;
  };

  const formatCashback = (cashback: string | null) => {
    if (!cashback) return null;
    
    // Если это процент
    if (cashback.includes('%')) {
      return cashback;
    }
    
    // Если это число, форматируем как валюту
    const amount = parseFloat(cashback);
    if (!isNaN(amount)) {
      return `${Math.round(amount).toLocaleString('ru-RU')} ₽`;
    }
    
    return cashback;
  };

  const handleClick = () => {
    if (isSelectable && onSelect) {
      onSelect(service);
    }
  };

  return (
    <Card 
      className={`h-full transition-all duration-200 ${
        isSelectable 
          ? 'cursor-pointer hover:shadow-md hover:scale-105' 
          : ''
      }`}
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <OptimizedImage
              src={getIconUrl()}
              alt={`${service.title} icon`}
              className="w-12 h-12 rounded-lg object-cover"
              fallback={
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 text-xs font-semibold">
                    {service.title.charAt(0).toUpperCase()}
                  </span>
                </div>
              }
              placeholder={<Skeleton className="w-12 h-12 rounded-lg" />}
            />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold line-clamp-2">
              {service.title}
            </CardTitle>
            {service.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {service.description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-1">
          {service.cashback && (
            <Badge 
              variant="secondary" 
              className="text-xs bg-green-50 text-green-700 hover:bg-green-100"
            >
              {formatCashback(service.cashback)}
            </Badge>
          )}
          
          {service.commission && (
            <Badge 
              variant="outline" 
              className="text-xs border-orange-200 text-orange-700"
            >
              {service.commission}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

OptimizedServiceCard.displayName = "OptimizedServiceCard";