import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/hooks/use-translations";
import { Service } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const serviceLeadFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  phone: z.string().min(5, {
    message: "Phone number must be at least 5 characters.",
  }),
  email: z.string().email().optional().or(z.literal("")),
  serviceId: z.number(),
});

type ServiceLeadFormValues = z.infer<typeof serviceLeadFormSchema>;

type ServiceLeadFormProps = {
  service: Service;
  onSuccess?: () => void;
};

export function ServiceLeadForm({ service, onSuccess }: ServiceLeadFormProps) {
  const { t } = useTranslations();
  const { toast } = useToast();

  // Default values for the form
  const defaultValues: Partial<ServiceLeadFormValues> = {
    name: "",
    phone: "",
    email: "",
    serviceId: service.id,
  };

  const form = useForm<ServiceLeadFormValues>({
    resolver: zodResolver(serviceLeadFormSchema),
    defaultValues,
  });

  const leadMutation = useMutation({
    mutationFn: (data: ServiceLeadFormValues) => {
      return apiRequest("/api/leads", {
        method: "POST",
        data,
      });
    },
    onSuccess: () => {
      toast({
        title: t("leads.requestSubmitted"),
        description: t("leads.requestSubmittedDesc"),
      });
      form.reset(defaultValues);
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: () => {
      toast({
        title: t("leads.requestFailed"),
        description: t("leads.requestFailedDesc"),
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: ServiceLeadFormValues) {
    leadMutation.mutate(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('leads.name')}</FormLabel>
              <FormControl>
                <Input placeholder={t('leads.enterName')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('leads.phone')}</FormLabel>
              <FormControl>
                <Input placeholder={t('leads.enterPhone')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('leads.emailOptional')}</FormLabel>
              <FormControl>
                <Input placeholder={t('leads.enterEmail')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full" 
          disabled={leadMutation.isPending}
        >
          {leadMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('common.processing')}
            </>
          ) : (
            t('leads.submitRequest')
          )}
        </Button>
      </form>
    </Form>
  );
}