import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Subscription, Service } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "@/hooks/use-translations";
import { CustomFieldInputs } from "@/components/custom-fields/custom-field-inputs";

// Form schema
const subscriptionFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  serviceId: z.string().optional(),
  domain: z.string().optional(),
  loginId: z.string().optional(),
  paymentPeriod: z.enum(["monthly", "quarterly", "yearly"]).default("monthly"),
  paidUntil: z.string()
    .refine(val => !val || !isNaN(new Date(val).getTime()), {
      message: "Invalid date format"
    })
    .optional(),
  paymentAmount: z.string().transform((val) => val ? parseFloat(val) : undefined).optional(),
  licensesCount: z.string().transform((val) => val ? parseInt(val) : 1).default("1"),
  usersCount: z.string().transform((val) => val ? parseInt(val) : 1).default("1"),
  status: z.enum(["active", "pending", "expired", "canceled"]).default("active"),
  userId: z.number().optional(), // Добавляем поле userId для серверной валидации
  customFields: z.record(z.any()).optional(), // Добавляем поле для кастомных полей
});

type SubscriptionFormValues = z.infer<typeof subscriptionFormSchema>;

interface SubscriptionFormProps {
  subscriptionId?: number;
  initialData?: any;
  userId?: number;
  onSuccess?: () => void;
  onSubmit?: (data: SubscriptionFormValues) => void;
  buttonText?: string;
  services?: Service[];
}

export function SubscriptionForm({ 
  subscriptionId, 
  initialData,
  userId,
  onSuccess, 
  onSubmit: externalSubmit,
  buttonText = "Save",
  services: externalServices
}: SubscriptionFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslations();
  const [selectedServiceName, setSelectedServiceName] = useState<string | null>(null);
  const [isCustomService, setIsCustomService] = useState<boolean>(false);

  // Fetch subscription data if editing
  const { data: subscriptionData, isLoading: isLoadingSubscription } = useQuery({
    queryKey: [`/api/subscriptions/${subscriptionId}`],
    enabled: !!subscriptionId,
  });

  // Fetch available services
  const { data: servicesData, isLoading: isLoadingServices } = useQuery({
    queryKey: ["/api/services"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/services?status=active");
        if (!res.ok) throw new Error("Failed to fetch services");
        const data = await res.json();
        console.log("API fetched services:", data);
        return data;
      } catch (error) {
        console.error("Error fetching services:", error);
        throw error;
      }
    },
  });
  
  // Используем внешние сервисы, если они предоставлены, иначе фильтруем сервисы из API
  // Проверяем данные сервисов и преобразуем их при необходимости
  const servicesArray = externalServices && externalServices.length > 0 
    ? externalServices 
    : (servicesData && servicesData.services 
      ? servicesData.services 
      : []);
      
  const filteredServices = servicesArray.filter((service: Service) => 
    !service.isCustom || // стандартные сервисы
    (service.isCustom && service.ownerId === (userId || user?.id)) // кастомные сервисы текущего/указанного пользователя
  );
      


  // Create mutation for new subscriptions
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Creating subscription with data:", data);
      
      // Преобразуем данные в формат, который ожидает сервер
      // Создаем базовую структуру данных
      const transformedData: any = {
        title: data.title,
        userId: userId || user?.id, // Используем переданный userId, если он есть, иначе текущего пользователя
        domain: data.domain || undefined,
        loginId: data.loginId || undefined,
        paymentPeriod: data.paymentPeriod || "monthly",
        licensesCount: data.licensesCount ? parseInt(data.licensesCount) : 1,
        usersCount: data.usersCount ? parseInt(data.usersCount) : 1,
        status: data.status || "active",
        customFields: data.customFields || {} // Добавляем пользовательские поля
      };
      
      // Если указан существующий сервис (не "other")
      if (data.serviceId && data.serviceId !== "other" && data.serviceId !== "") {
        transformedData.serviceId = parseInt(data.serviceId);
      }
      // Если выбран "other" и указано кастомное название сервиса
      else if (data.serviceId === "other" && selectedServiceName && selectedServiceName.trim() !== "") {
        // Сначала проверим, существует ли уже кастомный сервис с таким именем
        let existingCustomService = null;
        if (servicesData?.services) {
          existingCustomService = servicesData.services.find(
            (s: Service) => s.isCustom && s.title.toLowerCase() === selectedServiceName.toLowerCase() && s.ownerId === (userId || user?.id)
          );
        }
        
        let serviceId;
        
        // Если существует кастомный сервис пользователя с таким названием, используем его
        if (existingCustomService) {
          serviceId = existingCustomService.id;
        } else {
          // Иначе создаем новый кастомный сервис
          try {
            const serviceRes = await apiRequest("POST", "/api/services", {
              title: selectedServiceName,
              description: "Custom service",
              isCustom: true,
              isActive: true,
              ownerId: (userId || user?.id)
            });
            
            const serviceData = await serviceRes.json();
            console.log("Custom service created successfully:", serviceData);
            
            if (serviceData && serviceData.id) {
              serviceId = serviceData.id;
            }
          } catch (serviceError) {
            console.error("Error creating custom service:", serviceError);
            // Продолжаем создание подписки даже если не удалось создать сервис
          }
        }
        
        // Устанавливаем ID сервиса (существующего или нового)
        if (serviceId) {
          transformedData.serviceId = serviceId;
        }
      }
      
      // ИСПРАВЛЕНО: Правильная обработка даты
      if (data.paidUntil && data.paidUntil.trim() !== '') {
        try {
          // Правильно преобразуем дату в ISO формат для базы данных
          const dateObj = new Date(data.paidUntil);
          if (!isNaN(dateObj.getTime())) {
            // Используем toISOString для правильного форматирования
            transformedData.paidUntil = dateObj.toISOString();
            console.log("Converted date:", transformedData.paidUntil);
          } else {
            console.warn("Invalid date format received:", data.paidUntil);
          }
        } catch (e) {
          console.error("Error processing date:", e);
        }
      }
      
      if (data.paymentAmount) {
        transformedData.paymentAmount = parseFloat(data.paymentAmount);
      }
      
      // Добавляем кастомные поля, если они есть
      if (data.customFields) {
        transformedData.customFields = data.customFields;
      }
      
      console.log("Transformed data for API:", transformedData);
      
      try {
        if (!transformedData.userId) {
          throw new Error("User must be logged in to create a subscription");
        }
        
        const res = await apiRequest("POST", "/api/subscriptions", transformedData);
        const jsonResponse = await res.json();
        console.log("Subscription created successfully:", jsonResponse);
        return jsonResponse;
      } catch (error) {
        console.error("Error creating subscription:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Mutation onSuccess triggered with data:", data);
      toast({
        title: "Subscription created",
        description: "New subscription has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      console.error("Mutation onError triggered:", error);
      toast({
        title: "Error creating subscription",
        description: error.message || "Failed to create subscription. See console for details.", 
        variant: "destructive",
      });
    }
  });

  // Update mutation for existing subscriptions
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Updating subscription with data:", data);
      
      // Преобразуем данные в формат, который ожидает сервер
      // Создаем базовую структуру данных
      const transformedData: any = {
        title: data.title,
        domain: data.domain || undefined,
        loginId: data.loginId || undefined,
        paymentPeriod: data.paymentPeriod || "monthly",
        licensesCount: data.licensesCount ? parseInt(data.licensesCount) : 1,
        usersCount: data.usersCount ? parseInt(data.usersCount) : 1,
        status: data.status || "active",
        customFields: data.customFields || {} // Добавляем пользовательские поля
      };
      
      // Если указан существующий сервис (не "other")
      if (data.serviceId && data.serviceId !== "other" && data.serviceId !== "") {
        transformedData.serviceId = parseInt(data.serviceId);
      }
      // Если выбран "other" и указано кастомное название сервиса
      else if (data.serviceId === "other" && selectedServiceName && selectedServiceName.trim() !== "") {
        // Сначала проверим, существует ли уже кастомный сервис с таким именем
        let existingCustomService = null;
        if (servicesData?.services) {
          existingCustomService = servicesData.services.find(
            (s: Service) => s.isCustom && s.title.toLowerCase() === selectedServiceName.toLowerCase() && s.ownerId === (userId || user?.id)
          );
        }
        
        let serviceId;
        
        // Если существует кастомный сервис пользователя с таким названием, используем его
        if (existingCustomService) {
          serviceId = existingCustomService.id;
        } else {
          // Иначе создаем новый кастомный сервис
          try {
            const serviceRes = await apiRequest("POST", "/api/services", {
              title: selectedServiceName,
              description: "Custom service",
              isCustom: true,
              isActive: true,
              ownerId: (userId || user?.id)
            });
            
            const serviceData = await serviceRes.json();
            console.log("Custom service created successfully:", serviceData);
            
            if (serviceData && serviceData.id) {
              serviceId = serviceData.id;
            }
          } catch (serviceError) {
            console.error("Error creating custom service:", serviceError);
            // Продолжаем обновление подписки даже если не удалось создать сервис
          }
        }
        
        // Устанавливаем ID сервиса (существующего или нового)
        if (serviceId) {
          transformedData.serviceId = serviceId;
        }
      }
      
      // ИСПРАВЛЕНО: Правильная обработка даты при обновлении
      if (data.paidUntil && data.paidUntil.trim() !== '') {
        try {
          // Правильно преобразуем дату в ISO формат для базы данных
          const dateObj = new Date(data.paidUntil);
          if (!isNaN(dateObj.getTime())) {
            // Используем toISOString для правильного форматирования
            transformedData.paidUntil = dateObj.toISOString();
            console.log("Converted date for update:", transformedData.paidUntil);
          } else {
            console.warn("Invalid date format received for update:", data.paidUntil);
          }
        } catch (e) {
          console.error("Error processing date for update:", e);
        }
      }
      
      if (data.paymentAmount) {
        transformedData.paymentAmount = parseFloat(data.paymentAmount);
      }
      
      // Добавляем кастомные поля, если они есть
      if (data.customFields) {
        transformedData.customFields = data.customFields;
      }
      
      console.log("Transformed data for API:", transformedData);
      
      try {
        const res = await apiRequest("PATCH", `/api/subscriptions/${subscriptionId}`, transformedData);
        const jsonResponse = await res.json();
        console.log("Subscription updated successfully:", jsonResponse);
        return jsonResponse;
      } catch (error) {
        console.error("Error updating subscription:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Update mutation onSuccess triggered with data:", data);
      toast({
        title: "Subscription updated",
        description: "Subscription has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      console.error("Update mutation onError triggered:", error);
      toast({
        title: "Error updating subscription",
        description: error.message || "Failed to update subscription. See console for details.", 
        variant: "destructive",
      });
    }
  });

  // Setup form with default values
  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionFormSchema),
    defaultValues: {
      title: "",
      serviceId: "",
      domain: "",
      loginId: "",
      paymentPeriod: "monthly",
      paidUntil: "",
      paymentAmount: "",
      licensesCount: "1",
      usersCount: "1",
      status: "active",
    },
  });

  // Update form values when subscription data is loaded or initialData is provided
  useEffect(() => {
    // Предпочитаем initialData, если он предоставлен, иначе используем subscriptionData
    const data = initialData || subscriptionData;
    
    if (data) {
      const paidUntil = data.paidUntil 
        ? new Date(data.paidUntil).toISOString().split('T')[0]
        : "";
        
      form.reset({
        title: data.title,
        serviceId: data.serviceId ? String(data.serviceId) : "other",
        domain: data.domain || "",
        loginId: data.loginId || "",
        paymentPeriod: data.paymentPeriod || "monthly",
        paidUntil,
        paymentAmount: data.paymentAmount ? String(data.paymentAmount) : "",
        licensesCount: String(data.licensesCount || "1"),
        usersCount: String(data.usersCount || "1"),
        status: data.status || "active",
        userId: userId || user?.id,  // Используем переданный userId или текущего пользователя
        customFields: data.customFields || {} // Добавляем сохраненные кастомные поля
      });
      
      // Получаем доступные сервисы из экстернальных сервисов или из запроса API
      const availableServices = externalServices && externalServices.length > 0 
        ? externalServices 
        : (servicesData && servicesData.services ? servicesData.services : []);
      
      // Устанавливаем имя сервиса при загрузке данных подписки
      if (data.serviceId && availableServices.length > 0) {
        // Ищем сервис среди всех сервисов, не только фильтрованных,
        // так как это может быть кастомный сервис другого пользователя или админа
        const service = availableServices.find((s: Service) => s.id === data.serviceId);
        if (service) {
          setSelectedServiceName(service.title);
          // Проверяем сервис - если это не кастомный сервис или это кастомный сервис
          // текущего пользователя, то устанавливаем поле как нередактируемое (isCustomService = false)
          // В противном случае (кастомный сервис другого пользователя) - делаем поле редактируемым
          setIsCustomService(service.isCustom && service.ownerId !== (userId || user?.id));
          
          // Для отладки: выводим информацию о пользовательских полях
          console.log("Loading subscription with customFields:", data.customFields);
          if (data.customFields && Object.keys(data.customFields).length > 0) {
            console.log("Found non-empty customFields for subscription:", data.customFields);
          }
        } else {
          setSelectedServiceName("");
          setIsCustomService(true);
        }
      } else if (data.serviceId === null || data.serviceId === undefined) {
        // Если serviceId не указан, это, вероятно, "other"
        setSelectedServiceName("");
        setIsCustomService(true);
      }
    }
  }, [initialData, subscriptionData, form, servicesData, externalServices, userId, user?.id]);

  // Form submission handler
  function onSubmit(data: SubscriptionFormValues) {
    // Логируем данные формы для отладки
    console.log("Form submission data:", JSON.stringify(data, null, 2));
    console.log("Custom fields data:", JSON.stringify(data.customFields, null, 2));
    
    // Если предоставлен внешний обработчик, используем его
    if (externalSubmit) {
      externalSubmit(data);
    } else if (subscriptionId) {
      // Иначе используем встроенную логику
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isLoading = isLoadingSubscription || isLoadingServices;

  if (subscriptionId && isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-2">
        <div className="grid grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="serviceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("subscriptions.service")}</FormLabel>
                <Select
                  disabled={isSubmitting}
                  onValueChange={(value) => {
                    field.onChange(value);
                    
                    // Если выбран "other" или ничего не выбрано, разрешаем редактировать имя сервиса
                    if (value === "other" || !value) {
                      setIsCustomService(true);
                      setSelectedServiceName("");
                    } else {
                      // Иначе находим имя выбранного сервиса
                      const service = filteredServices.find((s) => String(s.id) === value);
                      if (service) {
                        setSelectedServiceName(service.title);
                        setIsCustomService(false);
                        
                        // При выборе сервиса, очищаем предыдущие значения кастомных полей
                        form.setValue('customFields', {});
                      }
                    }
                  }}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("subscriptions.selectService")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredServices.map((service) => (
                      <SelectItem key={service.id} value={String(service.id)}>
                        {service.title}
                      </SelectItem>
                    ))}
                    <SelectItem value="other">{t("subscriptions.otherCustom")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Название выбранного сервиса */}
          <FormItem>
            <FormLabel>{t("subscriptions.serviceName")}</FormLabel>
            {isCustomService ? (
              <Input
                disabled={isSubmitting}
                placeholder={t("subscriptions.enterServiceName")}
                value={selectedServiceName || ""}
                onChange={(e) => setSelectedServiceName(e.target.value)}
              />
            ) : (
              <FormItem className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                {selectedServiceName || t("subscriptions.noServiceSelected")}
              </FormItem>
            )}
          </FormItem>
          
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("subscriptions.title")}</FormLabel>
                <FormControl>
                  <Input disabled={isSubmitting} placeholder={t("subscriptions.enterTitle")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="domain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("subscriptions.domain")}</FormLabel>
                  <FormControl>
                    <Input disabled={isSubmitting} placeholder={t("subscriptions.enterDomain")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="loginId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("subscriptions.login")}</FormLabel>
                  <FormControl>
                    <Input disabled={isSubmitting} placeholder={t("subscriptions.enterLogin")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="paymentPeriod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("subscriptions.paymentPeriod")}</FormLabel>
                  <Select
                    disabled={isSubmitting}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("subscriptions.selectPeriod")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="monthly">{t("subscriptions.monthly")}</SelectItem>
                      <SelectItem value="quarterly">{t("subscriptions.quarterly")}</SelectItem>
                      <SelectItem value="yearly">{t("subscriptions.yearly")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paidUntil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("subscriptions.paidUntil")}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="paymentAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("subscriptions.paymentAmount")}</FormLabel>
                <FormControl>
                  <Input 
                    disabled={isSubmitting} 
                    placeholder={t("subscriptions.enterAmount")} 
                    type="number" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="licensesCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("subscriptions.licensesCount")}</FormLabel>
                  <FormControl>
                    <Input 
                      disabled={isSubmitting} 
                      placeholder={t("subscriptions.enterLicensesCount")} 
                      type="number" 
                      min="1" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="usersCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("subscriptions.usersCount")}</FormLabel>
                  <FormControl>
                    <Input 
                      disabled={isSubmitting} 
                      placeholder={t("subscriptions.enterUsersCount")} 
                      type="number" 
                      min="1" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("subscriptions.status")}</FormLabel>
                <Select
                  disabled={isSubmitting}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("subscriptions.selectStatus")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">{t("subscriptions.statusActive")}</SelectItem>
                    <SelectItem value="pending">{t("subscriptions.statusPending")}</SelectItem>
                    <SelectItem value="expired">{t("subscriptions.statusExpired")}</SelectItem>
                    <SelectItem value="canceled">{t("subscriptions.statusCanceled")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Кастомные поля сервиса - отображаются только если выбран сервис и это не опция "другой" */}
          {form.watch("serviceId") && form.watch("serviceId") !== "other" && (
            <CustomFieldInputs 
              serviceId={form.watch("serviceId")} 
              form={form} 
              disabled={isSubmitting} 
            />
          )}
        </div>

        <Button disabled={isSubmitting} type="submit" className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {buttonText}
        </Button>
      </form>
    </Form>
  );
}