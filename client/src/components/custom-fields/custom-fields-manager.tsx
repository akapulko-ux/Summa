import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, PlusCircle, Trash2, Save, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTranslations } from "@/hooks/use-translations";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Типы для кастомных полей
interface CustomField {
  id: number;
  entityType: string;
  entityId: number;
  fieldName: string;
  fieldType: 'text' | 'number' | 'boolean' | 'date' | 'select';
  fieldValue: string;
  isVisibleForUser: boolean;
  isRequired?: boolean;
  minValue?: number;
  maxValue?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  options?: string; // Для полей типа select: список опций
}

// Расширенная схема для валидации
const customFieldSchema = z.object({
  fieldName: z.string().min(1, { message: "Field name is required" }),
  fieldType: z.enum(['text', 'number', 'boolean', 'date', 'select']),
  fieldValue: z.string().optional(),
  isVisibleForUser: z.boolean().default(true),
  isRequired: z.boolean().default(false),
  minValue: z.preprocess(
    (val) => (val === '' || val === undefined || val === null) ? undefined : Number(val),
    z.number().optional()
  ),
  maxValue: z.preprocess(
    (val) => (val === '' || val === undefined || val === null) ? undefined : Number(val),
    z.number().optional()
  ),
  minLength: z.preprocess(
    (val) => (val === '' || val === undefined || val === null) ? undefined : Number(val),
    z.number().optional()
  ),
  maxLength: z.preprocess(
    (val) => (val === '' || val === undefined || val === null) ? undefined : Number(val),
    z.number().optional()
  ),
  pattern: z.string().optional(),
  options: z.string().optional(),
});

// Схема для всей формы
const formSchema = z.object({
  fields: z.array(customFieldSchema)
});

interface CustomFieldsManagerProps {
  entityType: 'service' | 'subscription';
  entityId: number;
  isAdmin?: boolean;
}

export function CustomFieldsManager({ entityType, entityId, isAdmin = false }: CustomFieldsManagerProps) {
  const { t } = useTranslations();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  // Получение списка кастомных полей
  const { data, isLoading } = useQuery({
    queryKey: ['/api/custom-fields', entityType, entityId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/custom-fields?entityType=${entityType}&entityId=${entityId}`);
      if (!res.ok) throw new Error('Failed to fetch custom fields');
      return res.json();
    },
    enabled: !!entityId
  });

  // Форма для редактирования
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fields: []
    }
  });

  // FieldArray для динамического управления полями
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "fields"
  });

  // Установка начальных значений при загрузке данных
  if (data && !fields.length && !isLoading) {
    form.reset({
      fields: data.map((field: CustomField) => ({
        fieldName: field.fieldName,
        fieldType: field.fieldType,
        fieldValue: field.fieldValue,
        isVisibleForUser: field.isVisibleForUser,
        isRequired: field.isRequired || false,
        minValue: field.minValue,
        maxValue: field.maxValue,
        minLength: field.minLength,
        maxLength: field.maxLength,
        pattern: field.pattern,
        options: field.options
      }))
    });
  }

  // Добавление кастомного поля
  const handleAddField = () => {
    append({
      fieldName: '',
      fieldType: 'text',
      fieldValue: '',
      isVisibleForUser: true,
      isRequired: false
    });
  };

  // Сохранение кастомных полей
  const saveFieldsMutation = useMutation({
    mutationFn: async (data: any) => {
      const existingFields = await apiRequest('GET', `/api/custom-fields?entityType=${entityType}&entityId=${entityId}`).then(res => res.json());
      
      // Удаляем поля, которых нет в обновленном списке
      const deletePromises = existingFields.map(async (existingField: CustomField) => {
        const fieldExists = data.fields.find((newField: any, index: number) => 
          newField.fieldName === existingField.fieldName);
        
        if (!fieldExists) {
          return apiRequest('DELETE', `/api/custom-fields/${existingField.id}`);
        }
        return null;
      }).filter(Boolean);
      
      await Promise.all(deletePromises);
      
      // Создаем или обновляем поля
      const savePromises = data.fields.map(async (field: any) => {
        const existingField = existingFields.find((ef: CustomField) => ef.fieldName === field.fieldName);
        
        if (existingField) {
          // Обновляем существующее поле
          return apiRequest('PATCH', `/api/custom-fields/${existingField.id}`, {
            fieldType: field.fieldType,
            fieldValue: field.fieldValue,
            isVisibleForUser: field.isVisibleForUser,
            isRequired: field.isRequired,
            minValue: field.minValue,
            maxValue: field.maxValue,
            minLength: field.minLength,
            maxLength: field.maxLength,
            pattern: field.pattern,
            options: field.options
          });
        } else {
          // Создаем новое поле
          return apiRequest('POST', '/api/custom-fields', {
            entityType,
            entityId,
            fieldName: field.fieldName,
            fieldType: field.fieldType,
            fieldValue: field.fieldValue,
            isVisibleForUser: field.isVisibleForUser,
            isRequired: field.isRequired,
            minValue: field.minValue,
            maxValue: field.maxValue,
            minLength: field.minLength,
            maxLength: field.maxLength,
            pattern: field.pattern,
            options: field.options
          });
        }
      });
      
      await Promise.all(savePromises);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-fields', entityType, entityId] });
      setIsEditing(false);
      toast({
        title: t('services.customFieldsUpdated'),
        description: t('services.customFieldsUpdatedDesc'),
        duration: 3000
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
        duration: 3000
      });
    }
  });

  // Удаление всех кастомных полей
  const deleteAllFieldsMutation = useMutation({
    mutationFn: async () => {
      const existingFields = await apiRequest('GET', `/api/custom-fields?entityType=${entityType}&entityId=${entityId}`).then(res => res.json());
      
      const deletePromises = existingFields.map((field: CustomField) => 
        apiRequest('DELETE', `/api/custom-fields/${field.id}`));
      
      await Promise.all(deletePromises);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-fields', entityType, entityId] });
      form.reset({ fields: [] });
      toast({
        title: t('services.customFieldsDeleted'),
        description: t('services.customFieldsDeletedDesc'),
        duration: 3000
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
        duration: 3000
      });
    }
  });

  // Обработчик отправки формы
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    saveFieldsMutation.mutate(data);
  };

  // Если загружаются данные
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('services.customFields')}</CardTitle>
          <CardDescription>{t('services.customFieldsDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Режим просмотра полей (не редактирование)
  if (!isEditing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle>{t('services.customFields')}</CardTitle>
            <CardDescription>{t('services.customFieldsDesc')}</CardDescription>
          </div>
          {isAdmin && (
            <Button onClick={() => setIsEditing(true)} size="sm" variant="outline">
              {t('common.edit')}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {data && data.length > 0 ? (
            <div className="space-y-4">
              {data.map((field: CustomField) => (
                <div key={field.id} className="border rounded-md p-3">
                  <div className="font-medium">{field.fieldName}</div>
                  <div className="text-sm text-muted-foreground">
                    {field.fieldType === 'boolean' 
                      ? field.fieldValue === 'true' ? t('common.yes') : t('common.no')
                      : field.fieldValue || '-'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {t('services.fieldType')}: {field.fieldType}
                    {!field.isVisibleForUser && ` (${t('services.adminOnly')})`}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {isAdmin 
                ? t('services.noCustomFieldsAdmin')
                : t('services.noCustomFields')}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Режим редактирования полей
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle>{t('services.editCustomFields')}</CardTitle>
          <CardDescription>{t('services.editCustomFieldsDesc')}</CardDescription>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setIsEditing(false)} size="sm" variant="outline">
            {t('common.cancel')}
          </Button>
          {data && data.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('common.deleteAll')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('services.confirmDeleteAllFields')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('services.confirmDeleteAllFieldsDesc')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => deleteAllFieldsMutation.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {t('common.delete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {fields.length > 0 ? (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">
                        {t('services.fieldNumber').replace('{number}', String(index + 1))}
                      </h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`fields.${index}.fieldName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('services.fieldName')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('services.fieldNamePlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`fields.${index}.fieldType`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('services.fieldType')}</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('services.selectFieldType')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="text">{t('services.fieldTypeText')}</SelectItem>
                                <SelectItem value="number">{t('services.fieldTypeNumber')}</SelectItem>
                                <SelectItem value="boolean">{t('services.fieldTypeBoolean')}</SelectItem>
                                <SelectItem value="date">{t('services.fieldTypeDate')}</SelectItem>
                                <SelectItem value="select">{t('services.fieldTypeSelect')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`fields.${index}.fieldValue`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('services.defaultValue')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('services.defaultValuePlaceholder')} {...field} />
                            </FormControl>
                            <FormDescription>
                              {form.watch(`fields.${index}.fieldType`) === 'select' && 
                                t('services.selectOptionsHint')}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`fields.${index}.isVisibleForUser`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0 rounded-md border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                {t('services.visibleToUsers')}
                              </FormLabel>
                              <FormDescription>
                                {t('services.visibleToUsersDesc')}
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`fields.${index}.isRequired`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0 rounded-md border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                {t('services.requiredField')}
                              </FormLabel>
                              <FormDescription>
                                {t('services.requiredFieldDesc')}
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <Collapsible className="w-full col-span-2 space-y-2 mt-2">
                        <CollapsibleTrigger asChild>
                          <Button variant="outline" type="button" className="w-full flex justify-between">
                            <span>{t('services.advancedOptions')}</span>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-4 mt-2">
                          {/* Специфичные поля для типа text */}
                          {form.watch(`fields.${index}.fieldType`) === 'text' && (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name={`fields.${index}.minLength`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>{t('services.minLength')}</FormLabel>
                                      <FormControl>
                                        <Input type="number" {...field} value={field.value || ''} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`fields.${index}.maxLength`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>{t('services.maxLength')}</FormLabel>
                                      <FormControl>
                                        <Input type="number" {...field} value={field.value || ''} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <FormField
                                control={form.control}
                                name={`fields.${index}.pattern`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>{t('services.pattern')}</FormLabel>
                                    <FormControl>
                                      <Input placeholder={t('services.patternPlaceholder')} {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormDescription>
                                      {t('services.patternDesc')}
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </>
                          )}
                          
                          {/* Специфичные поля для типа number */}
                          {form.watch(`fields.${index}.fieldType`) === 'number' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`fields.${index}.minValue`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>{t('services.minValue')}</FormLabel>
                                    <FormControl>
                                      <Input type="number" {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`fields.${index}.maxValue`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>{t('services.maxValue')}</FormLabel>
                                    <FormControl>
                                      <Input type="number" {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}
                          
                          {/* Специфичные поля для типа select */}
                          {form.watch(`fields.${index}.fieldType`) === 'select' && (
                            <FormField
                              control={form.control}
                              name={`fields.${index}.options`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t('services.fieldOptions')}</FormLabel>
                                  <FormControl>
                                    <Textarea placeholder={t('services.optionsHint')} {...field} value={field.value || ''} />
                                  </FormControl>
                                  <FormDescription>
                                    {t('services.selectOptionsHint')}
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {t('services.addCustomFieldsPrompt')}
              </div>
            )}

            <div className="flex flex-col space-y-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleAddField}
                className="w-full"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                {t('services.addCustomField')}
              </Button>

              <Separator />

              <Button 
                type="submit" 
                className="w-full"
                disabled={saveFieldsMutation.isPending}
              >
                {saveFieldsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {t('common.save')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}