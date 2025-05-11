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
  const { t, language } = useTranslations();
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
      return apiRequest("POST", "/api/leads", data);
    },
    onSuccess: () => {
      toast({
        title: language === 'ru' ? 'Заявка отправлена' : 'Request Submitted',
        description: language === 'ru' 
          ? `Ваша заявка на услугу "${service.title}" успешно отправлена. Мы свяжемся с вами в ближайшее время.` 
          : `Your request for "${service.title}" service has been submitted successfully. We'll contact you shortly.`,
      });
      form.reset(defaultValues);
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: () => {
      toast({
        title: language === 'ru' ? 'Ошибка отправки' : 'Request Failed',
        description: language === 'ru' 
          ? 'Произошла ошибка при отправке заявки. Пожалуйста, попробуйте еще раз позже.' 
          : 'There was an error submitting your request. Please try again later.',
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
              <FormLabel>{language === 'ru' ? 'Ваше имя' : 'Your Name'}</FormLabel>
              <FormControl>
                <Input placeholder={language === 'ru' ? 'Введите ваше имя' : 'Enter your name'} {...field} />
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
              <FormLabel>{language === 'ru' ? 'Номер телефона' : 'Phone Number'}</FormLabel>
              <FormControl>
                <Input placeholder={language === 'ru' ? 'Введите ваш номер телефона' : 'Enter your phone number'} {...field} />
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
              <FormLabel>{language === 'ru' ? 'Электронная почта (необязательно)' : 'Email (optional)'}</FormLabel>
              <FormControl>
                <Input placeholder={language === 'ru' ? 'Введите ваш email (необязательно)' : 'Enter your email (optional)'} {...field} />
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
              {language === 'ru' ? 'Обработка...' : 'Processing...'}
            </>
          ) : (
            language === 'ru' ? 'Отправить заявку' : 'Submit Request'
          )}
        </Button>
      </form>
    </Form>
  );
}