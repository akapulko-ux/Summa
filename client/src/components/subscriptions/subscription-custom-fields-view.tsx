import { Fragment } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "@/hooks/use-translations";
import { Separator } from "@/components/ui/separator";

interface SubscriptionCustomFieldsViewProps {
  customFields?: Record<string, any>;
}

export function SubscriptionCustomFieldsView({ customFields }: SubscriptionCustomFieldsViewProps) {
  const { t } = useTranslations();
  
  if (!customFields || Object.keys(customFields).length === 0) {
    return null;
  }

  // Функция для форматирования значения в зависимости от типа
  const formatFieldValue = (key: string, value: any) => {
    if (typeof value === 'boolean') {
      return value ? t('common.yes') : t('common.no');
    }
    
    if (value === null || value === undefined) {
      return "-";
    }
    
    if (typeof value === 'object' && value instanceof Date) {
      return value.toLocaleDateString();
    }
    
    return String(value);
  };

  // Парсинг имени поля из ключа
  const getFieldNameFromKey = (key: string) => {
    const parts = key.split('_');
    if (parts.length > 1) {
      return parts.slice(1).join(' ');
    }
    return key;
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>{t('services.customFields')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="custom-fields">
            <AccordionTrigger>{t('subscriptions.showCustomFields')}</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {Object.entries(customFields).map(([key, value], index) => {
                  // Пропускаем служебные поля
                  if (key.startsWith('__')) return null;
                  
                  const fieldName = getFieldNameFromKey(key);
                  return (
                    <Fragment key={index}>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{fieldName}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFieldValue(key, value)}
                        </p>
                      </div>
                      {index < Object.keys(customFields).length - 1 && 
                        <Separator className="md:hidden my-2" />
                      }
                    </Fragment>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}