import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Service } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "@/hooks/use-translations";
import { useAuth } from "@/hooks/use-auth";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomFieldsManager } from "@/components/custom-fields/custom-fields-manager";
import { FileUpload } from "@/components/ui/file-upload";

// Form schema
const serviceFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  iconUrl: z.string().optional().or(z.literal("")),
  iconData: z.string().optional().or(z.literal("")),
  iconMimeType: z.string().optional().or(z.literal("")),
  cashback: z.string().regex(/^(\d+(\.\d{1,2})?%?|\d+(\.\d{1,2})?)$/, {
    message: "Enter a valid number or percentage (e.g., 5, 5.00, 5%)",
  }).optional().or(z.literal("")),
  commission: z.string().regex(/^(\d+(\.\d{1,2})?%?|\d+(\.\d{1,2})?)$/, {
    message: "Enter a valid number or percentage (e.g., 5, 5.00, 5%)",
  }).optional().or(z.literal("")),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

interface ServiceFormProps {
  serviceId?: number;
  isCustom?: boolean;
  onSuccess?: () => void;
}

export function ServiceForm({ serviceId, isCustom = false, onSuccess }: ServiceFormProps) {
  const { t } = useTranslations();
  const [activeTab, setActiveTab] = useState("general");
  const [isActive, setIsActive] = useState(true);
  const { user } = useAuth();

  // Fetch service data if editing
  const { data: serviceData, isLoading: isLoadingService } = useQuery<Service>({
    queryKey: [`/api/services/${serviceId}`],
    enabled: !!serviceId,
  });

  // Create mutation for new services
  const createMutation = useMutation({
    mutationFn: async (data: ServiceFormValues) => {
      // Process the data to handle empty strings
      const processedData = {
        ...data,
        iconUrl: data.iconUrl || undefined,
        iconData: data.iconData || undefined,
        iconMimeType: data.iconMimeType || undefined,
        cashback: data.cashback || undefined,
        commission: data.commission || undefined,
        isActive: isActive,
        isCustom: isCustom,
        ownerId: isCustom ? user?.id : undefined,
      };
      
      const res = await apiRequest("POST", "/api/services", processedData);
      return await res.json();
    },
    onSuccess: () => {
      if (onSuccess) onSuccess();
    },
  });

  // Update mutation for existing services
  const updateMutation = useMutation({
    mutationFn: async (data: ServiceFormValues) => {
      // Process the data to handle empty strings
      const processedData = {
        ...data,
        iconUrl: data.iconUrl || undefined,
        iconData: data.iconData || undefined,
        iconMimeType: data.iconMimeType || undefined,
        cashback: data.cashback || undefined,
        commission: data.commission || undefined,
        isActive: isActive,
      };
      
      const res = await apiRequest("PATCH", `/api/services/${serviceId}`, processedData);
      return await res.json();
    },
    onSuccess: () => {
      if (onSuccess) onSuccess();
    },
  });

  // Setup form with default values
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      title: "",
      description: "",
      iconUrl: "",
      cashback: "",
      commission: "",
    },
  });

  // Update form values when service data is loaded
  useEffect(() => {
    if (serviceData) {
      form.reset({
        title: serviceData.title,
        description: serviceData.description || "",
        iconUrl: serviceData.iconUrl || "",
        cashback: serviceData.cashback || "",
        commission: serviceData.commission || "",
      });
      
      // Set isActive state from service data
      if (serviceData.isActive !== undefined) {
        setIsActive(serviceData.isActive);
      }
    }
  }, [serviceData, form]);

  // Form submission handler
  function onSubmit(data: ServiceFormValues) {
    if (serviceId) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (serviceId && isLoadingService) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">{t('common.general')}</TabsTrigger>
          <TabsTrigger value="customFields">{t('services.customFields')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="mt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('services.serviceTitle')}</FormLabel>
                    <FormControl>
                      <Input placeholder="Google Workspace" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('services.serviceDescription')}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={t('services.serviceDescriptionPlaceholder')}
                        {...field} 
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="iconUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('services.serviceIcon')}</FormLabel>
                    <FormControl>
                      <FileUpload 
                        initialUrl={field.value}
                        serviceId={serviceId}
                        onUpload={(data) => {
                          field.onChange(data.iconUrl);
                          // Установка дополнительных полей для сохранения в базу данных
                          if (data.iconData) {
                            form.setValue('iconData', data.iconData);
                          }
                          if (data.iconMimeType) {
                            form.setValue('iconMimeType', data.iconMimeType);
                          }
                        }}
                        accept="image/*"
                        description={t('services.serviceIconDescription')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cashback"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('services.cashback')}</FormLabel>
                    <FormControl>
                      <Input placeholder="5% or 10.00" {...field} />
                    </FormControl>
                    <FormDescription>
                      {t('services.cashbackDescription')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="commission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('services.commission')}</FormLabel>
                    <FormControl>
                      <Input placeholder="5% or 10.00" {...field} />
                    </FormControl>
                    <FormDescription>
                      {t('services.commissionDescription')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center space-x-2 py-4">
                <Switch
                  id="service-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <label
                  htmlFor="service-active"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {isActive ? t('common.active') : t('common.inactive')}
                </label>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {serviceId ? t('services.updateService') : t('services.createService')}
              </Button>
            </form>
          </Form>
        </TabsContent>
        
        <TabsContent value="customFields" className="mt-4">
          {serviceId ? (
            <CustomFieldsManager 
              entityType="service" 
              entityId={serviceId} 
              isAdmin={true} 
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {t('common.saveFirstToConfigureThis')}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
