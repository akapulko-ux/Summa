import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "@/hooks/use-translations";
import { Loader2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

// Определяем тип кастомного поля
interface CustomField {
  id: number;
  entityType: string;
  entityId: number;
  fieldName: string;
  fieldType: "text" | "number" | "boolean" | "date" | "select";
  fieldValue?: string;
  isVisibleForUser: boolean;
  isRequired: boolean;
  minValue?: number;
  maxValue?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  options?: string;
}

// Интерфейс компонента
interface CustomFieldInputsProps {
  serviceId?: string;
  form: UseFormReturn<any>;
  disabled?: boolean;
}

export function CustomFieldInputs({ serviceId, form, disabled = false }: CustomFieldInputsProps) {
  const { t } = useTranslations();
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

  // Запрос на получение кастомных полей для выбранного сервиса
  const { data: customFields, isLoading } = useQuery({
    queryKey: ['/api/custom-fields', 'service', serviceId],
    queryFn: async () => {
      if (!serviceId || serviceId === 'other' || serviceId === '') return [];
      const res = await apiRequest('GET', `/api/custom-fields?entityType=service&entityId=${serviceId}`);
      if (!res.ok) throw new Error('Failed to fetch custom fields');
      return res.json();
    },
    enabled: !!serviceId && serviceId !== 'other' && serviceId !== '',
  });

  // Обновление формы при изменении кастомных полей
  useEffect(() => {
    if (customFields && customFields.length > 0) {
      // Проверяем, есть ли уже сохраненные значения в форме
      const existingValues = form.getValues('customFields') || {};
      console.log("Existing form customFields:", existingValues);
      
      const newFieldValues = { ...existingValues };
      
      // Инициализируем значения для кастомных полей
      customFields.forEach((field: CustomField) => {
        const fieldId = `customField_${field.id}`;
        // Если значение еще не установлено, используем значение по умолчанию
        if (newFieldValues[fieldId] === undefined) {
          // Преобразуем значение по умолчанию в соответствии с типом поля
          if (field.fieldType === 'boolean') {
            newFieldValues[fieldId] = field.fieldValue === 'true';
          } else if (field.fieldType === 'number') {
            newFieldValues[fieldId] = field.fieldValue ? parseFloat(field.fieldValue) : null;
          } else {
            newFieldValues[fieldId] = field.fieldValue || '';
          }
        }
      });

      setCustomFieldValues(newFieldValues);
      
      // Логируем значения для отладки
      console.log("CustomFieldInputs: Setting custom field values:", newFieldValues);
      
      // Устанавливаем значения в форму
      form.setValue('customFields', newFieldValues);
    }
  }, [customFields, form, serviceId]);

  // Если загрузка или нет кастомных полей, не отображаем ничего
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('subscriptions.customFields')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!customFields || customFields.length === 0) {
    return null;
  }

  // Функция для рендеринга поля в зависимости от его типа
  const renderFieldInput = (field: CustomField) => {
    const fieldId = `customField_${field.id}`;
    
    switch (field.fieldType) {
      case 'text':
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={`customFields.${fieldId}`}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.fieldName}</FormLabel>
                <FormControl>
                  <Input
                    disabled={disabled}
                    placeholder={`${t('common.enter')} ${field.fieldName.toLowerCase()}`}
                    {...formField}
                    value={formField.value || ''}
                    onChange={(e) => {
                      formField.onChange(e.target.value);
                      const newValues = { ...customFieldValues, [fieldId]: e.target.value };
                      setCustomFieldValues(newValues);
                      form.setValue('customFields', newValues);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
        
      case 'number':
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={`customFields.${fieldId}`}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.fieldName}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    disabled={disabled}
                    placeholder={`${t('common.enter')} ${field.fieldName.toLowerCase()}`}
                    min={field.minValue}
                    max={field.maxValue}
                    {...formField}
                    value={formField.value || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseFloat(e.target.value) : null;
                      formField.onChange(value);
                      const newValues = { ...customFieldValues, [fieldId]: value };
                      setCustomFieldValues(newValues);
                      form.setValue('customFields', newValues);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
        
      case 'boolean':
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={`customFields.${fieldId}`}
            render={({ field: formField }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                <FormControl>
                  <Checkbox
                    disabled={disabled}
                    checked={!!formField.value}
                    onCheckedChange={(checked) => {
                      formField.onChange(checked);
                      const newValues = { ...customFieldValues, [fieldId]: checked };
                      setCustomFieldValues(newValues);
                      form.setValue('customFields', newValues);
                    }}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>{field.fieldName}</FormLabel>
                </div>
              </FormItem>
            )}
          />
        );
        
      case 'date':
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={`customFields.${fieldId}`}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.fieldName}</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    disabled={disabled}
                    {...formField}
                    value={formField.value || ''}
                    onChange={(e) => {
                      formField.onChange(e.target.value);
                      const newValues = { ...customFieldValues, [fieldId]: e.target.value };
                      setCustomFieldValues(newValues);
                      form.setValue('customFields', newValues);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
        
      case 'select':
        const options = field.options ? field.options.split(',').map(opt => opt.trim()) : [];
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={`customFields.${fieldId}`}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.fieldName}</FormLabel>
                <Select
                  disabled={disabled}
                  value={formField.value || ''}
                  onValueChange={(value) => {
                    formField.onChange(value);
                    const newValues = { ...customFieldValues, [fieldId]: value };
                    setCustomFieldValues(newValues);
                    form.setValue('customFields', newValues);
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={`${t('common.select')} ${field.fieldName.toLowerCase()}`} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {options.map((option, idx) => (
                      <SelectItem key={idx} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        );
        
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customFields.map((field: CustomField) => (
            // Показываем только поля, видимые для пользователя
            field.isVisibleForUser ? renderFieldInput(field) : null
          ))}
        </div>
      </CardContent>
    </Card>
  );
}