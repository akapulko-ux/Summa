import { useState } from "react";
import { useTranslations } from "@/hooks/use-translations";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CustomField } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, RefreshCw, Trash, PlusCircle, AlertCircle, Check } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertCustomFieldSchema } from "@shared/schema";
import { z } from "zod";

// Расширенная схема для формы кастомного поля
const customFieldFormSchema = insertCustomFieldSchema.extend({
  options: z.string().optional().transform(val => 
    val ? val.split(',').map(v => v.trim()).filter(v => v !== '') : undefined
  ),
});

type CustomFieldFormValues = z.infer<typeof customFieldFormSchema>;

interface UserCustomFieldsProps {
  userId: number;
}

export function UserCustomFields({ userId }: UserCustomFieldsProps) {
  const { t, language } = useTranslations();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Получение кастомных полей для пользователя
  const { data: customFields, isLoading, isError } = useQuery<CustomField[]>({
    queryKey: ["/api/custom-fields", "user", userId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/custom-fields?entityType=user&entityId=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch custom fields");
      const data = await res.json();
      return data.customFields || []; // Возвращаем пустой массив, если данные не определены
    },
    enabled: Boolean(userId),
  });
  
  // Форма для создания нового кастомного поля
  const form = useForm<CustomFieldFormValues>({
    resolver: zodResolver(customFieldFormSchema),
    defaultValues: {
      entityType: "user",
      entityId: userId,
      name: "",
      type: "text",
      value: "",
      options: undefined,
    },
  });
  
  // Мутация для создания нового кастомного поля
  const createCustomFieldMutation = useMutation({
    mutationFn: async (data: CustomFieldFormValues) => {
      const res = await apiRequest("POST", "/api/custom-fields", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create custom field");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: t('customFields.addSuccess'),
        description: t('customFields.addSuccessDescription'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/custom-fields", "user", userId] });
      setIsAddDialogOpen(false);
      form.reset({
        entityType: "user",
        entityId: userId,
        name: "",
        type: "text",
        value: "",
        options: undefined,
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('customFields.addError'),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Мутация для удаления кастомного поля
  const deleteCustomFieldMutation = useMutation({
    mutationFn: async (fieldId: number) => {
      const res = await apiRequest("DELETE", `/api/custom-fields/${fieldId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete custom field");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: t('customFields.deleteSuccess'),
        description: t('customFields.deleteSuccessDescription'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/custom-fields", "user", userId] });
    },
    onError: (error: Error) => {
      toast({
        title: t('customFields.deleteError'),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Обработчик отправки формы
  const onSubmit = (data: CustomFieldFormValues) => {
    createCustomFieldMutation.mutate(data);
  };
  
  // Обработчик удаления кастомного поля
  const handleDelete = (fieldId: number) => {
    if (window.confirm(t('customFields.confirmDelete'))) {
      deleteCustomFieldMutation.mutate(fieldId);
    }
  };
  
  // Отображение типа поля в читаемом виде
  const renderFieldType = (type: string) => {
    switch (type) {
      case "text":
        return t('customFields.types.text');
      case "number":
        return t('customFields.types.number');
      case "boolean":
        return t('customFields.types.boolean');
      case "date":
        return t('customFields.types.date');
      case "select":
        return t('customFields.types.select');
      default:
        return type;
    }
  };
  
  // Отображение значения в зависимости от типа
  const renderFieldValue = (field: CustomField) => {
    if (field.value === null || field.value === undefined || field.value === "") {
      return <span className="text-muted-foreground italic">-</span>;
    }
    
    switch (field.type) {
      case "boolean":
        return field.value === "true" ? (
          <Check className="h-5 w-5 text-green-600" />
        ) : (
          <AlertCircle className="h-5 w-5 text-red-600" />
        );
      default:
        return field.value;
    }
  };
  
  // Условное отображение поля options для типа select
  const watchFieldType = form.watch("type");
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t('customFields.title')}</CardTitle>
          <CardDescription>{t('customFields.description')}</CardDescription>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('customFields.addButton')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{t('customFields.addTitle')}</DialogTitle>
              <DialogDescription>
                {t('customFields.addDescription')}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('customFields.name')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('customFields.namePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('customFields.type')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('customFields.selectType')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="text">{t('customFields.types.text')}</SelectItem>
                          <SelectItem value="number">{t('customFields.types.number')}</SelectItem>
                          <SelectItem value="boolean">{t('customFields.types.boolean')}</SelectItem>
                          <SelectItem value="date">{t('customFields.types.date')}</SelectItem>
                          <SelectItem value="select">{t('customFields.types.select')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {watchFieldType === "select" && (
                  <FormField
                    control={form.control}
                    name="options"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('customFields.options')}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t('customFields.optionsPlaceholder')} 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <p className="text-sm text-muted-foreground">
                          {t('customFields.optionsHelp')}
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('customFields.value')}</FormLabel>
                      <FormControl>
                        {watchFieldType === "boolean" ? (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={field.value === "true"}
                              onCheckedChange={(checked) => {
                                field.onChange(checked ? "true" : "false");
                              }}
                              id="field-value"
                            />
                            <Label htmlFor="field-value">
                              {field.value === "true" ? t('common.yes') : t('common.no')}
                            </Label>
                          </div>
                        ) : watchFieldType === "select" ? (
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('customFields.selectOption')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {form
                                .getValues("options")
                                ?.split(",")
                                .map((option, index) => (
                                  <SelectItem key={index} value={option.trim()}>
                                    {option.trim()}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            type={watchFieldType === "number" ? "number" : "text"}
                            placeholder={t('customFields.valuePlaceholder')}
                            {...field}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createCustomFieldMutation.isPending}
                  >
                    {createCustomFieldMutation.isPending && (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {t('common.save')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-4 text-muted-foreground">
            <AlertCircle className="h-6 w-6 mx-auto mb-2" />
            <p>{t('customFields.errorLoading')}</p>
          </div>
        ) : customFields?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>{t('customFields.noCustomFields')}</p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => setIsAddDialogOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('customFields.createFirst')}
            </Button>
          </div>
        ) : (
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('customFields.columns.name')}</TableHead>
                  <TableHead>{t('customFields.columns.type')}</TableHead>
                  <TableHead>{t('customFields.columns.value')}</TableHead>
                  <TableHead className="text-right">{t('customFields.columns.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customFields?.map((field) => (
                  <TableRow key={field.id}>
                    <TableCell className="font-medium">{field.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{renderFieldType(field.type)}</Badge>
                    </TableCell>
                    <TableCell>{renderFieldValue(field)}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(field.id)}
                        disabled={deleteCustomFieldMutation.isPending}
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">{t('common.delete')}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}