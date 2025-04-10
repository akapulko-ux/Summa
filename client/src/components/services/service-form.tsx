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

// Form schema
const serviceFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  iconUrl: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  cashback: z.string().regex(/^(\d+(\.\d{1,2})?%?|\d+(\.\d{1,2})?)$/, {
    message: "Enter a valid number or percentage (e.g., 5, 5.00, 5%)",
  }).optional().or(z.literal("")),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

interface ServiceFormProps {
  serviceId?: number;
  onSuccess?: () => void;
}

export function ServiceForm({ serviceId, onSuccess }: ServiceFormProps) {
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
        cashback: data.cashback || undefined,
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
        cashback: data.cashback || undefined,
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
    },
  });

  // Update form values when service data is loaded
  React.useEffect(() => {
    if (serviceData) {
      form.reset({
        title: serviceData.title,
        description: serviceData.description || "",
        iconUrl: serviceData.iconUrl || "",
        cashback: serviceData.cashback || "",
      });
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-2">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="A suite of cloud computing, productivity and collaboration tools..." 
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
              <FormLabel>Icon URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/icon.svg" {...field} />
              </FormControl>
              <FormDescription>
                URL to an icon image (preferably SVG format)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cashback"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cashback</FormLabel>
              <FormControl>
                <Input placeholder="5% or 10.00" {...field} />
              </FormControl>
              <FormDescription>
                Enter a percentage with % symbol (e.g., 5%) or a fixed amount (e.g., 10.00)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {serviceId ? "Update Service" : "Create Service"}
        </Button>
      </form>
    </Form>
  );
}
