import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect } from "react";
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

// Form schema
const subscriptionFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  serviceId: z.string().optional(),
  domain: z.string().optional(),
  loginId: z.string().optional(),
  paymentPeriod: z.enum(["monthly", "quarterly", "yearly"]).default("monthly"),
  paidUntil: z.string().optional(),
  paymentAmount: z.string().transform((val) => val ? parseFloat(val) : undefined).optional(),
  licensesCount: z.string().transform((val) => val ? parseInt(val) : 1).default("1"),
  usersCount: z.string().transform((val) => val ? parseInt(val) : 1).default("1"),
  status: z.enum(["active", "pending", "expired", "canceled"]).default("active"),
  userId: z.number().optional(), // Добавляем поле userId для серверной валидации
});

type SubscriptionFormValues = z.infer<typeof subscriptionFormSchema>;

interface SubscriptionFormProps {
  subscriptionId?: number;
  onSuccess?: () => void;
}

export function SubscriptionForm({ subscriptionId, onSuccess }: SubscriptionFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch subscription data if editing
  const { data: subscriptionData, isLoading: isLoadingSubscription } = useQuery({
    queryKey: [`/api/subscriptions/${subscriptionId}`],
    enabled: !!subscriptionId,
  });

  // Fetch available services
  const { data: servicesData, isLoading: isLoadingServices } = useQuery({
    queryKey: ["/api/services"],
  });

  // Create mutation for new subscriptions
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Creating subscription with data:", data);
      
      // Преобразуем данные в формат, который ожидает сервер
      // Создаем базовую структуру данных
      const transformedData: any = {
        title: data.title,
        userId: user?.id, // Всегда устанавливаем текущего пользователя
        domain: data.domain || undefined,
        loginId: data.loginId || undefined,
        paymentPeriod: data.paymentPeriod || "monthly",
        licensesCount: data.licensesCount ? parseInt(data.licensesCount) : 1,
        usersCount: data.usersCount ? parseInt(data.usersCount) : 1,
        status: data.status || "active"
      };
      
      // Добавляем необязательные поля только если они имеют значение
      if (data.serviceId && data.serviceId !== "other" && data.serviceId !== "") {
        transformedData.serviceId = parseInt(data.serviceId);
      }
      
      if (data.paidUntil) {
        transformedData.paidUntil = new Date(data.paidUntil);
      }
      
      if (data.paymentAmount) {
        transformedData.paymentAmount = parseFloat(data.paymentAmount);
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
      
      // Добавляем необязательные поля только если они имеют значение
      if (data.serviceId && data.serviceId !== "other" && data.serviceId !== "") {
        transformedData.serviceId = parseInt(data.serviceId);
      }
      
      if (data.paidUntil) {
        transformedData.paidUntil = new Date(data.paidUntil);
      }
      
      if (data.paymentAmount) {
        transformedData.paymentAmount = parseFloat(data.paymentAmount);
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

  // Update form values when subscription data is loaded
  useEffect(() => {
    if (subscriptionData) {
      const paidUntil = subscriptionData.paidUntil 
        ? new Date(subscriptionData.paidUntil).toISOString().split('T')[0]
        : "";
        
      form.reset({
        title: subscriptionData.title,
        serviceId: subscriptionData.serviceId ? String(subscriptionData.serviceId) : "other",
        domain: subscriptionData.domain || "",
        loginId: subscriptionData.loginId || "",
        paymentPeriod: subscriptionData.paymentPeriod,
        paidUntil,
        paymentAmount: subscriptionData.paymentAmount ? String(subscriptionData.paymentAmount) : "",
        licensesCount: String(subscriptionData.licensesCount),
        usersCount: String(subscriptionData.usersCount),
        status: subscriptionData.status,
      });
    }
  }, [subscriptionData, form]);

  // Form submission handler
  function onSubmit(data: SubscriptionFormValues) {
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
        <FormField
          control={form.control}
          name="serviceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoadingServices ? (
                    <SelectItem value="loading" disabled>
                      Loading services...
                    </SelectItem>
                  ) : servicesData?.services && servicesData.services.length > 0 ? (
                    <>
                      {servicesData.services.map((service: Service) => (
                        <SelectItem key={service.id} value={service.id.toString()}>
                          {service.title}
                        </SelectItem>
                      ))}
                      <SelectItem value="other">Other (Custom)</SelectItem>
                    </>
                  ) : (
                    <SelectItem value="other">Other (Custom)</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subscription Title</FormLabel>
              <FormControl>
                <Input placeholder="Google Workspace Business" {...field} />
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
                <FormLabel>Domain</FormLabel>
                <FormControl>
                  <Input placeholder="example.com" {...field} />
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
                <FormLabel>Login ID / Username</FormLabel>
                <FormControl>
                  <Input placeholder="admin@example.com" {...field} />
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
                <FormLabel>Payment Period</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment period" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
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
                <FormLabel>Paid Until</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="paymentAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Amount</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="licensesCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Licenses</FormLabel>
                <FormControl>
                  <Input type="number" min="1" {...field} />
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
                <FormLabel>Users</FormLabel>
                <FormControl>
                  <Input type="number" min="1" {...field} />
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
              <FormLabel>Status</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {subscriptionId ? "Update Subscription" : "Create Subscription"}
        </Button>
      </form>
    </Form>
  );
}
