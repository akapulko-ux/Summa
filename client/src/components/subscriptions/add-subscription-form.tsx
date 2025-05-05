import { useState, useEffect } from "react";
import { useTranslations } from "@/hooks/use-translations";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Service } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { insertSubscriptionSchema } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Calendar as CalendarIcon, 
  CreditCard, 
  RefreshCw
} from "lucide-react";
import { DialogFooter } from "@/components/ui/dialog";

// Расширим схему валидации для формы подписки
const createSubscriptionSchema = insertSubscriptionSchema.extend({
  serviceId: z.union([z.coerce.number(), z.literal('other')]),
  startDate: z.date(),
  endDate: z.date().optional(),
  amount: z.number().default(0),
});

// Тип данных формы
type SubscriptionFormValues = z.infer<typeof createSubscriptionSchema>;

interface AddSubscriptionFormProps {
  userId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddSubscriptionForm({ userId, onSuccess, onCancel }: AddSubscriptionFormProps) {
  const { t } = useTranslations();
  const { toast } = useToast();
  
  // Получение списка доступных сервисов для подписки
  const { 
    data: services,
  } = useQuery<Service[]>({
    queryKey: ["/api/services"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/services");
      if (!res.ok) throw new Error("Failed to fetch services");
      const data = await res.json();
      return data.services;
    },
  });
  
  // Форма для создания новой подписки
  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(createSubscriptionSchema),
    defaultValues: {
      userId,
      serviceId: undefined,
      title: "", // Добавляем поле для названия сервиса
      startDate: new Date(),
      endDate: undefined,
      status: "active",
      paymentPeriod: "monthly",
      amount: 0
    },
  });
  
  console.log("Form values: ", form.getValues());
  
  // Мутация для создания новой подписки
  const createSubscriptionMutation = useMutation({
    mutationFn: async (data: SubscriptionFormValues) => {
      console.log("Submitting data: ", data);
      const res = await apiRequest("POST", "/api/subscriptions", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create subscription");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: t('subscriptions.addSuccess'),
        description: t('subscriptions.addSuccessDescription'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions", userId] });
      onSuccess();
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: t('subscriptions.addError'),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Обработчик отправки формы
  const onSubmit = (data: SubscriptionFormValues) => {
    console.log("Form submitted with data: ", data);
    createSubscriptionMutation.mutate(data);
  };
  
  // При выборе сервиса
  const handleServiceChange = (serviceId: string) => {
    console.log("Service changed to:", serviceId);
    
    // Обработка кастомного сервиса
    if (serviceId === 'other') {
      console.log("Custom service selected, clearing title field");
      // Очищаем поле title для кастомного сервиса и делаем его редактируемым
      form.setValue("title", "");
      return;
    }
    
    if (!Array.isArray(services)) {
      console.log("Services not available");
      return;
    }
    
    const selectedService = services.find(s => s.id === parseInt(serviceId));
    if (selectedService) {
      console.log("Service found, setting title to:", selectedService.title);
      // Устанавливаем название сервиса из выбранного предустановленного сервиса
      form.setValue("title", selectedService.title);
      
      // Здесь можно было бы устанавливать стоимость по умолчанию,
      // если бы у сервиса была стоимость, но сейчас просто оставляем нулевую
      form.setValue("amount", 0);
    } else {
      console.log("Service not found in services array");
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="serviceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('subscriptions.service')}</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  handleServiceChange(value);
                }}
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('subscriptions.selectService')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Array.isArray(services) && services.map((service) => (
                    <SelectItem key={service.id} value={service.id.toString()}>
                      {service.title}
                    </SelectItem>
                  ))}
                  <SelectItem value="other">{t('subscriptions.otherService')}</SelectItem>
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
              <FormLabel>{t('subscriptions.serviceTitle')}</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  disabled={form.getValues('serviceId') !== 'other' && form.getValues('serviceId') !== undefined} 
                  placeholder={t('subscriptions.enterServiceTitle')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t('subscriptions.startDate')}</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className="pl-3 text-left font-normal"
                    >
                      {field.value ? (
                        format(field.value, "dd.MM.yyyy")
                      ) : (
                        <span>{t('subscriptions.pickDate')}</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t('subscriptions.endDate')}</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className="pl-3 text-left font-normal"
                    >
                      {field.value ? (
                        format(field.value, "dd.MM.yyyy")
                      ) : (
                        <span>{t('subscriptions.optional')}</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                    disabled={(date) => date < form.getValues("startDate")}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="paymentPeriod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('subscriptions.paymentPeriod')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('subscriptions.selectPeriod')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="monthly">{t('subscriptions.periods.monthly')}</SelectItem>
                  <SelectItem value="quarterly">{t('subscriptions.periods.quarterly')}</SelectItem>
                  <SelectItem value="yearly">{t('subscriptions.periods.yearly')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('subscriptions.amount')}</FormLabel>
              <FormControl>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="number"
                    placeholder="0.00"
                    className="pl-10"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('subscriptions.status')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('subscriptions.selectStatus')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">{t('subscriptions.statuses.active')}</SelectItem>
                  <SelectItem value="pending">{t('subscriptions.statuses.pending')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            type="submit" 
            disabled={createSubscriptionMutation.isPending}
          >
            {createSubscriptionMutation.isPending && (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t('common.save')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}