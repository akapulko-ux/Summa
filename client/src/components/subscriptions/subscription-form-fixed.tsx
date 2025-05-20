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
  title: z.string().optional(),
  serviceId: z.string().optional(),
  // Удаленные поля обозначены как необязательные с дефолтным значением null
  domain: z.any().optional().default(null),
  loginId: z.any().optional().default(null),
  paymentPeriod: z.enum(["monthly", "quarterly", "yearly", "other"]).default("monthly"),
  paidUntil: z.string()
    .refine(val => !val || !isNaN(new Date(val).getTime()), {
      message: "Invalid date format"
    })
    .optional(),
  paymentAmount: z.string().transform((val) => val ? parseFloat(val) : undefined).optional(),
  // Удаленные поля получают дефолтное значение 1
  licensesCount: z.any().optional().default(1),
  usersCount: z.any().optional().default(1),
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
  
  // Определяем, является ли текущий пользователь администратором
  const isAdmin = user?.role === "admin";
  
  // Для администратора, если userId не предоставлен, создаем состояние для выбора пользователя
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(userId);

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
  
  // Только для администраторов - загружаем список пользователей
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users"],
    enabled: isAdmin, // Запрос делается только если пользователь администратор
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/users?limit=100");
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        console.log("API fetched users:", data);
        return data;
      } catch (error) {
        console.error("Error fetching users:", error);
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
      
  const filteredServices = servicesArray.filter((service: Service) => {
    // Стандартные сервисы всегда видны
    if (!service.isCustom) return true;
    
    // Для админов показываем кастомные сервисы выбранного пользователя
    if (isAdmin && selectedUserId) {
      return service.isCustom && service.ownerId === selectedUserId;
    }
    
    // В остальных случаях показываем кастомные сервисы текущего пользователя
    return service.isCustom && service.ownerId === (userId || user?.id);
  });
      


  // Create mutation for new subscriptions
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Creating subscription with data:", data);
      
      // Преобразуем данные в формат, который ожидает сервер
      // Создаем базовую структуру данных с значениями по умолчанию для удаленных полей
      const transformedData: any = {
        title: data.title,
        userId: isAdmin && selectedUserId ? selectedUserId : (userId || user?.id), // Для админов используем выбранного пользователя, иначе как раньше
        domain: "", // Пустая строка вместо null
        loginId: "", // Пустая строка вместо null
        paymentPeriod: data.paymentPeriod || "monthly",
        licensesCount: 1, // Удалено по требованию
        usersCount: 1, // Удалено по требованию
        status: data.status || "active",
        customFields: data.customFields || {} // Добавляем пользовательские поля
      };
      
      // Если указан существующий сервис (не "other")
      if (data.serviceId && data.serviceId !== "other" && data.serviceId !== "") {
        transformedData.serviceId = parseInt(data.serviceId);
      }
      // Если выбран "other" и указано кастомное название сервиса
      else if (data.serviceId === "other" && selectedServiceName && selectedServiceName.trim() !== "") {
        // Определяем ID пользователя, для которого создаем сервис
        const targetUserId = isAdmin && selectedUserId ? selectedUserId : (userId || user?.id);
        
        // Сначала проверим, существует ли уже кастомный сервис с таким именем
        let existingCustomService = null;
        if (servicesData?.services) {
          existingCustomService = servicesData.services.find(
            (s: Service) => s.isCustom && s.title.toLowerCase() === selectedServiceName.toLowerCase() && s.ownerId === targetUserId
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
              ownerId: targetUserId
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
        
        if (serviceId) {
          transformedData.serviceId = serviceId;
        }
      }
      
      // Добавляем остальные поля
      if (data.paidUntil) {
        transformedData.paidUntil = data.paidUntil;
      }
      
      if (data.paymentAmount) {
        transformedData.paymentAmount = parseFloat(data.paymentAmount);
      }
      
      console.log("Transformed data:", transformedData);
      
      // Отправляем запрос на создание подписки
      const res = await apiRequest("POST", "/api/subscriptions", transformedData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create subscription");
      }
      return res.json();
    },
    onSuccess: (data) => {
      console.log("Subscription created:", data);
      toast({
        title: t("subscriptions.created") || "Subscription created",
        description: t("subscriptions.created_desc") || "Your subscription has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error("Error creating subscription:", error);
      toast({
        title: t("subscriptions.error") || "Error",
        description: error.message || t("subscriptions.error_desc") || "Failed to create subscription",
        variant: "destructive",
      });
    }
  });

  // Update mutation for existing subscriptions
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Updating subscription with data:", data);
      
      // Преобразуем данные в формат, который ожидает сервер
      // Для обновления подписки мы сохраняем большинство полей без изменений
      const transformedData: any = {
        title: data.title,
        domain: "", // Пустая строка вместо null
        loginId: "", // Пустая строка вместо null
        paymentPeriod: data.paymentPeriod || "monthly",
        status: data.status || "active",
        customFields: data.customFields || {} // Добавляем пользовательские поля
      };
      
      // Если указан существующий сервис (не "other")
      if (data.serviceId && data.serviceId !== "other" && data.serviceId !== "") {
        transformedData.serviceId = parseInt(data.serviceId);
      }
      // Если выбран "other" и указано кастомное название сервиса
      else if (data.serviceId === "other" && selectedServiceName && selectedServiceName.trim() !== "") {
        // Определяем ID пользователя, для которого создаем сервис
        const targetUserId = isAdmin && selectedUserId ? selectedUserId : (userId || user?.id);
        
        // Сначала проверим, существует ли уже кастомный сервис с таким именем
        let existingCustomService = null;
        if (servicesData?.services) {
          existingCustomService = servicesData.services.find(
            (s: Service) => s.isCustom && s.title.toLowerCase() === selectedServiceName.toLowerCase() && s.ownerId === targetUserId
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
              ownerId: targetUserId
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
        
        if (serviceId) {
          transformedData.serviceId = serviceId;
        }
      }
      
      // Добавляем остальные поля
      if (data.paidUntil) {
        transformedData.paidUntil = data.paidUntil;
      }
      
      if (data.paymentAmount) {
        transformedData.paymentAmount = parseFloat(data.paymentAmount);
      }
      
      console.log("Transformed data for update:", transformedData);
      
      // Отправляем запрос на обновление подписки
      const res = await apiRequest("PATCH", `/api/subscriptions/${subscriptionId}`, transformedData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update subscription");
      }
      return res.json();
    },
    onSuccess: (data) => {
      console.log("Subscription updated:", data);
      toast({
        title: t("subscriptions.updated") || "Subscription updated",
        description: t("subscriptions.updated_desc") || "Your subscription has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      queryClient.invalidateQueries({ queryKey: [`/api/subscriptions/${subscriptionId}`] });
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error("Error updating subscription:", error);
      toast({
        title: t("subscriptions.error") || "Error",
        description: error.message || t("subscriptions.error_desc") || "Failed to update subscription",
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
      status: "active",
      customFields: {}
    },
  });

  // Watch for changes in the serviceId field
  const watchedServiceId = form.watch("serviceId");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  
  // Следим за изменением пользователя (для админов)
  const watchedUserId = form.watch("userId");
  
  // Обновляем выбранного пользователя при изменении поля формы
  useEffect(() => {
    if (isAdmin && watchedUserId) {
      setSelectedUserId(parseInt(watchedUserId.toString()));
    }
  }, [watchedUserId, isAdmin]);

  // Обновляем данные формы при изменении внешних данных
  useEffect(() => {
    if (initialData) {
      // Обновляем форму данными, предоставленными извне
      form.reset({
        ...initialData,
        // Преобразуем строковую цену в число и форматируем для отображения
        paymentAmount: initialData.paymentAmount?.toString() || "",
        // Для нестандартного serviceId (Other) - оставляем поле пустым, но устанавливаем selectedServiceName
        serviceId: initialData.serviceId?.toString() || ""
      });
      
      // Если есть сервис, найдем его и установим selectedServiceName
      if (initialData.serviceId && servicesArray.length > 0) {
        const service = servicesArray.find((s: Service) => s.id === initialData.serviceId);
        if (service) {
          setSelectedServiceName(service.title);
          setSelectedService(service);
          setIsCustomService(service.isCustom);
        }
      }
    } else if (subscriptionData && !initialData) {
      console.log("Setting form data from API:", subscriptionData);
      
      // Обновляем форму из полученных данных API
      form.reset({
        title: subscriptionData.title || "",
        serviceId: subscriptionData.serviceId?.toString() || "",
        paymentPeriod: subscriptionData.paymentPeriod || "monthly",
        paidUntil: subscriptionData.paidUntil ? new Date(subscriptionData.paidUntil).toISOString().split('T')[0] : "",
        paymentAmount: subscriptionData.paymentAmount?.toString() || "",
        status: subscriptionData.status || "active",
        customFields: subscriptionData.customFields || {},
        userId: subscriptionData.userId
      });
      
      // Если есть сервис, найдем его и установим selectedServiceName
      if (subscriptionData.serviceId && servicesArray.length > 0) {
        const service = servicesArray.find((s: Service) => s.id === subscriptionData.serviceId);
        if (service) {
          setSelectedServiceName(service.title);
          setSelectedService(service);
          setIsCustomService(service.isCustom);
        }
      }
      
      // Для админов устанавливаем выбранного пользователя
      if (isAdmin && subscriptionData.userId) {
        setSelectedUserId(subscriptionData.userId);
      }
    }
  }, [initialData, subscriptionData, servicesArray, form, isAdmin]);

  // Update selected service when serviceId changes
  useEffect(() => {
    if (watchedServiceId && watchedServiceId !== "other" && servicesArray.length > 0) {
      const serviceId = parseInt(watchedServiceId);
      const service = servicesArray.find((s: Service) => s.id === serviceId);
      
      if (service) {
        console.log("Selected service changed:", service);
        setSelectedServiceName(service.title);
        setSelectedService(service);
        setIsCustomService(service.isCustom);
      } else {
        setSelectedService(null);
        setIsCustomService(false);
      }
    } else if (watchedServiceId === "other") {
      setSelectedService(null);
      setIsCustomService(true);
    }
  }, [watchedServiceId, servicesArray]);

  function onSubmit(data: SubscriptionFormValues) {
    if (externalSubmit) {
      externalSubmit(data);
      return;
    }

    if (subscriptionId) {
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
          {/* Поле выбора пользователя (только для админов) */}
          {isAdmin && (
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("subscriptions.user") || "Пользователь"}</FormLabel>
                  <Select
                    disabled={isSubmitting || !!subscriptionId}
                    onValueChange={(value) => {
                      field.onChange(parseInt(value));
                      setSelectedUserId(parseInt(value));
                    }}
                    value={field.value?.toString()}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("subscriptions.select_user") || "Выберите пользователя"} />
                    </SelectTrigger>
                    <SelectContent>
                      {usersData?.users?.map((u: any) => (
                        <SelectItem key={u.id} value={u.id.toString()}>
                          {u.name || "Без имени"} ({u.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Service selection field */}
          <FormField
            control={form.control}
            name="serviceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("subscriptions.service")}</FormLabel>
                <Select
                  disabled={isSubmitting}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("subscriptions.selectService")} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredServices?.map((service: any) => (
                      <SelectItem key={service.id} value={service.id.toString()}>
                        {service.title} {service.isCustom ? `(${t("subscriptions.custom")})` : ''}
                      </SelectItem>
                    ))}
                    <SelectItem value="other">{t("subscriptions.otherCustom")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Custom service name field */}
          {watchedServiceId === "other" && (
            <FormItem>
              <FormLabel>{t("subscriptions.service_name")}</FormLabel>
              <Input
                placeholder={t("subscriptions.enter_service_name")}
                value={selectedServiceName || ""}
                onChange={(e) => setSelectedServiceName(e.target.value)}
                disabled={isSubmitting}
              />
            </FormItem>
          )}

          {/* Service name display field when service is selected */}
          {watchedServiceId && watchedServiceId !== "other" && watchedServiceId !== "" && (
            <FormItem>
              <FormLabel>{t("subscriptions.service_name")}</FormLabel>
              <Input
                value={selectedServiceName || ""}
                disabled={true}
                readOnly
              />
            </FormItem>
          )}

          {/* Поле названия подписки удалено, т.к. подписки определяются выбранным сервисом */}

          {/* Payment Period */}
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
                  <SelectTrigger>
                    <SelectValue placeholder={t("subscriptions.selectPeriod")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">{t("subscriptions.periods.monthly")}</SelectItem>
                    <SelectItem value="quarterly">{t("subscriptions.periods.quarterly")}</SelectItem>
                    <SelectItem value="yearly">{t("subscriptions.periods.yearly")}</SelectItem>
                    <SelectItem value="other">{t("subscriptions.periods.other")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Payment Amount */}
          <FormField
            control={form.control}
            name="paymentAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("subscriptions.paymentAmount")}</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder={t("subscriptions.enterAmount")} 
                    {...field} 
                    disabled={isSubmitting} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Paid Until */}
          <FormField
            control={form.control}
            name="paidUntil"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("subscriptions.paidUntil")}</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field} 
                    disabled={isSubmitting} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status - только для администраторов */}
          {isAdmin && (
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("subscriptions.status") || "Статус"}</FormLabel>
                  <Select
                    disabled={isSubmitting}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("subscriptions.filters.selectStatus")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t("subscriptions.statuses.active")}</SelectItem>
                      <SelectItem value="pending">{t("subscriptions.statuses.pending")}</SelectItem>
                      <SelectItem value="expired">{t("subscriptions.statuses.expired")}</SelectItem>
                      <SelectItem value="canceled">{t("subscriptions.statuses.canceled")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Custom fields */}
          {selectedService && selectedService.id && (
            <CustomFieldInputs
              serviceId={selectedService.id.toString()}
              form={form}
              disabled={isSubmitting}
            />
          )}
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {buttonText}
        </Button>
      </form>
    </Form>
  );
}