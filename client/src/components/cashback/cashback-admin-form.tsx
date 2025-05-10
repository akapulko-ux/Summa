import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTranslations } from "@/lib/translations";

// Form schema для добавления кэшбека
const cashbackFormSchema = z.object({
  userId: z.coerce.number({
    required_error: "Выберите пользователя",
    invalid_type_error: "Выберите пользователя",
  }),
  amount: z.coerce.number({
    required_error: "Введите сумму кэшбека",
    invalid_type_error: "Сумма должна быть числом",
  }).min(1, {
    message: "Сумма должна быть больше 0",
  }),
  description: z.string().min(3, {
    message: "Описание должно содержать минимум 3 символа",
  }),
});

type CashbackFormValues = z.infer<typeof cashbackFormSchema>;

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";

export default function CashbackAdminForm() {
  const { t } = useTranslations();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Загружаем список пользователей (клиентов)
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => apiRequest("GET", "/api/users?role=client").then(res => res.json()),
  });

  const form = useForm<CashbackFormValues>({
    resolver: zodResolver(cashbackFormSchema),
    defaultValues: {
      userId: undefined,
      amount: undefined,
      description: "",
    },
  });

  async function onSubmit(data: CashbackFormValues) {
    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/cashback/add", data);
      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: t("success"),
          description: t("cashback_added_success"),
        });
        
        // Очищаем форму после успешного добавления
        form.reset({
          userId: undefined,
          amount: undefined,
          description: "",
        });
        
        // Обновляем кэш клиентов
        queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      } else {
        toast({
          title: t("error"),
          description: result.message || t("cashback_add_error"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to add cashback:", error);
      toast({
        title: t("error"),
        description: t("cashback_add_error"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("add_cashback")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("client")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value?.toString()}
                    disabled={isLoadingUsers}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("select_client")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingUsers ? (
                        <SelectItem value="loading" disabled>
                          {t("loading")}
                        </SelectItem>
                      ) : (
                        usersData?.users.map((user: User) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name || user.email}
                          </SelectItem>
                        ))
                      )}
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
                  <FormLabel>{t("amount")}</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="100" 
                      {...field} 
                      onChange={(e) => {
                        const value = e.target.valueAsNumber || "";
                        field.onChange(value);
                      }}
                    />
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
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t("cashback_description_placeholder")}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                  {t("processing")}
                </>
              ) : (
                t("add_cashback")
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}