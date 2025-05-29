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
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "@/hooks/use-translations";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

// Form schema
const userFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
  name: z.string().optional(),
  companyName: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(["admin", "client"]),
  isActive: z.boolean().default(true),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormProps {
  userId?: number;
  onSuccess?: () => void;
}

export function UserForm({ userId, onSuccess }: UserFormProps) {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";
  const { t } = useTranslations();

  // Fetch user data if editing
  const { data: userData, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  // Create mutation for new users
  const createMutation = useMutation({
    mutationFn: async (data: UserFormValues) => {
      const res = await apiRequest("POST", "/api/register", data);
      return await res.json();
    },
    onSuccess: () => {
      if (onSuccess) onSuccess();
    },
  });

  // Update mutation for existing users
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<UserFormValues>) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      if (onSuccess) onSuccess();
    },
  });

  // Setup form with default values
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: "",
      name: "",
      companyName: "",
      phone: "",
      role: "client",
      isActive: true,
      password: "",
    },
  });

  // Update form values when user data is loaded
  useEffect(() => {
    if (userData) {
      form.reset({
        email: userData.email,
        name: userData.name || "",
        companyName: userData.companyName || "",
        phone: userData.phone || "",
        role: userData.role,
        isActive: userData.isActive,
        password: "", // Don't prefill password
      });
    }
  }, [userData, form]);

  // Form submission handler
  function onSubmit(data: UserFormValues) {
    // Remove password if it's empty and we're updating
    if (userId && !data.password) {
      const { password, ...rest } = data;
      updateMutation.mutate(rest);
    } else if (userId) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (userId && isLoadingUser) {
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('userManagement.columns.email')}</FormLabel>
              <FormControl>
                <Input placeholder={t('userManagement.emailPlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('users.columns.name')}</FormLabel>
              <FormControl>
                <Input placeholder={t('users.namePlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('users.columns.company')}</FormLabel>
              <FormControl>
                <Input placeholder={t('users.companyPlaceholder')} {...field} />
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
              <FormLabel>{t('users.userPhone')}</FormLabel>
              <FormControl>
                <Input placeholder={t('users.phonePlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Only admins can change role */}
        {isAdmin && (
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('users.userRole')}</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('common.selectRole')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="client">{t('users.roleClient')}</SelectItem>
                    <SelectItem value="admin">{t('users.roleAdmin')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Only admins can change active status */}
        {isAdmin && (
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>{t('users.activeStatus')}</FormLabel>
                  <FormDescription>
                    {t('users.activeStatusDescription')}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        {/* Password field - required for new users, optional for existing */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {userId ? "New Password (leave blank to keep current)" : "Password"}
              </FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {userId ? "Update User" : "Create User"}
        </Button>
      </form>
    </Form>
  );
}
