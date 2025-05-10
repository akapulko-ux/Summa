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
        status: data.status || "active"
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
        console.log("Sending custom fields data:", data.customFields);
        transformedData.customFields = data.customFields;
      }
      
      // Добавляем название сервиса для кастомных сервисов
      if ((data.serviceId === "other" || isCustomService) && selectedServiceName) {
        transformedData.serviceName = selectedServiceName;
        console.log("Setting custom service name:", selectedServiceName);
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
        status: data.status || "active"
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
        console.log("Sending custom fields data for update:", data.customFields);
        transformedData.customFields = data.customFields;
      }
      
      // Добавляем название сервиса для кастомных сервисов
      if ((data.serviceId === "other" || isCustomService) && selectedServiceName) {
        transformedData.serviceName = selectedServiceName;
        console.log("Setting custom service name for update:", selectedServiceName);
      }
      
      console.log("Transformed data for API update:", transformedData);
      
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
        customFields: data.customFields // Загружаем кастомные поля, если они есть
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
          setIsCustomService(!!service.isCustom);
        }
      } else if (data.serviceName) {
        // Если нет serviceId, но есть serviceName (кастомный сервис)
        setSelectedServiceName(data.serviceName);
        setIsCustomService(true);
        form.setValue("serviceId", "other");
      }
    }
  }, [subscriptionData, initialData, form, userId, user?.id, servicesData, externalServices]);

  // Regular users should only be able to create subscriptions for themselves
  const userField = form.watch("userId");
  
  useEffect(() => {
    // Если пользователь не админ, устанавливаем userId автоматически
    if (user && user.role !== "admin" && !userField) {
      form.setValue("userId", user.id);
    }
  }, [form, user, userField]);

  // Watch serviceId to determine if custom service is selected
  const selectedServiceId = form.watch("serviceId");

  useEffect(() => {
    if (selectedServiceId === "other") {
      setIsCustomService(true);
    } else if (selectedServiceId) {
      const service = servicesArray.find((s: Service) => s.id === parseInt(selectedServiceId));
      if (service) {
        setSelectedServiceName(service.title);
        setIsCustomService(!!service.isCustom);
      }
    }
  }, [selectedServiceId, servicesArray]);

  async function onSubmit(data: SubscriptionFormValues) {
    console.log("Form submitted with values:", data);
    
    // Если предоставлен внешний обработчик, используем его
    if (externalSubmit) {
      externalSubmit(data);
      return;
    }
    
    try {
      if (subscriptionId) {
        // Обновление существующей подписки
        await updateMutation.mutateAsync(data);
      } else {
        // Создание новой подписки
        await createMutation.mutateAsync(data);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  }

  // Получаем выбранный сервис на основе serviceId
  const getSelectedService = (): Service | undefined => {
    if (!selectedServiceId || selectedServiceId === "other") return undefined;
    
    const serviceId = parseInt(selectedServiceId);
    return servicesArray.find((s: Service) => s.id === serviceId);
  };

  // Get the selected service
  const selectedService = getSelectedService();

  if (isLoadingSubscription && subscriptionId) {
    return <div className="space-y-4">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Выбор сервиса */}
        <FormField
          control={form.control}
          name="serviceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Service")}</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  if (value === "other") {
                    setIsCustomService(true);
                    setSelectedServiceName("");
                  } else if (value) {
                    const service = servicesArray.find((s: Service) => s.id === parseInt(value));
                    if (service) {
                      setSelectedServiceName(service.title);
                      setIsCustomService(!!service.isCustom);
                    }
                  }
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("Select a service")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoadingServices ? (
                    <SelectItem value="loading" disabled>
                      {t("Loading services...")}
                    </SelectItem>
                  ) : (
                    <>
                      {filteredServices.map((service: Service) => (
                        <SelectItem key={service.id} value={service.id.toString()}>
                          {service.title}
                          {service.isCustom && <span className="ml-2 text-muted-foreground text-xs">
                            ({t("Custom")})
                          </span>}
                        </SelectItem>
                      ))}
                      <SelectItem value="other">{t("Other (Custom)")}</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Название сервиса (отображаем для всех, но редактируемо только для кастомных) */}
        <FormItem>
          <FormLabel>{t("Service Name")}</FormLabel>
          <FormControl>
            {isCustomService ? (
              <Input
                value={selectedServiceName || ""}
                onChange={(e) => setSelectedServiceName(e.target.value)}
                placeholder={t("Enter service name")}
              />
            ) : (
              <Input
                value={selectedServiceName || ""}
                readOnly
                className="bg-gray-100 dark:bg-gray-800"
              />
            )}
          </FormControl>
          <FormDescription>
            {isCustomService 
              ? t("Enter a name for this custom service") 
              : t("Service name (readonly)")}
          </FormDescription>
        </FormItem>

        {/* Название подписки */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Subscription Title")}</FormLabel>
              <FormControl>
                <Input placeholder={t("Enter subscription title")} {...field} />
              </FormControl>
              <FormDescription>
                {t("This is the name of your subscription as it will appear in your dashboard.")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Домен */}
        <FormField
          control={form.control}
          name="domain"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Domain")}</FormLabel>
              <FormControl>
                <Input placeholder="example.com" {...field} />
              </FormControl>
              <FormDescription>
                {t("The domain associated with this subscription (optional).")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Идентификатор для входа */}
        <FormField
          control={form.control}
          name="loginId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Login ID")}</FormLabel>
              <FormControl>
                <Input placeholder="username@example.com" {...field} />
              </FormControl>
              <FormDescription>
                {t("Username or ID used to log in to this service (optional).")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Период платежа */}
        <FormField
          control={form.control}
          name="paymentPeriod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Payment Period")}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("Select payment period")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="monthly">{t("Monthly")}</SelectItem>
                  <SelectItem value="quarterly">{t("Quarterly")}</SelectItem>
                  <SelectItem value="yearly">{t("Yearly")}</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                {t("How often you are billed for this subscription.")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Paid Until Date */}
        <FormField
          control={form.control}
          name="paidUntil"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Paid Until")}</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormDescription>
                {t("The date until which the subscription is paid.")}
              </FormDescription>
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
              <FormLabel>{t("Payment Amount")}</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                {t("How much you pay for this subscription.")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Licenses Count */}
        <FormField
          control={form.control}
          name="licensesCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Licenses Count")}</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="1" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                {t("Number of licenses included in this subscription.")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Users Count */}
        <FormField
          control={form.control}
          name="usersCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Users Count")}</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="1" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                {t("Number of users covered by this subscription.")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Subscription Status */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Status")}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("Select status")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">{t("Active")}</SelectItem>
                  <SelectItem value="pending">{t("Pending")}</SelectItem>
                  <SelectItem value="expired">{t("Expired")}</SelectItem>
                  <SelectItem value="canceled">{t("Canceled")}</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                {t("Current status of the subscription.")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Отображаем кастомные поля, если выбран сервис и у него есть кастомные поля */}
        {selectedService && selectedService.customFields && (
          <FormField
            control={form.control}
            name="customFields"
            render={({ field }) => (
              <FormItem className="space-y-4">
                <FormLabel>{t("Service-specific fields")}</FormLabel>
                <FormControl>
                  <CustomFieldInputs 
                    customFields={selectedService.customFields} 
                    value={field.value || {}}
                    onChange={(values) => {
                      console.log("Custom fields changed:", values);
                      field.onChange(values);
                    }}
                  />
                </FormControl>
                <FormDescription>
                  {t("Additional fields specific to this service.")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button 
          type="submit" 
          className="w-full"
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {(createMutation.isPending || updateMutation.isPending) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {buttonText}
        </Button>
      </form>
    </Form>
  );
}