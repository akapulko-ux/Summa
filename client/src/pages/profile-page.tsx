import { AppLayout } from "@/components/layout/app-layout";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "@/hooks/use-translations";
import { TelegramConnect } from "@/components/profile/telegram-connect";

// Profile form schema
const profileFormSchema = z.object({
  name: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email address" }),
  companyName: z.string().optional(),
  phone: z.string().optional(),
});

// Password form schema
const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, { message: "Current password is required" }),
  newPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Please confirm your password" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslations();

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      companyName: user?.companyName || "",
      phone: user?.phone || "",
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      if (!user) throw new Error("User not found");
      const res = await apiRequest("PATCH", `/api/users/${user.id}`, data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: t.profile.profileUpdated,
        description: t.messages.welcomeBack,
      });
    },
    onError: (error) => {
      toast({
        title: t.messages.somethingWentWrong,
        description: error.message || t.messages.serverError,
        variant: "destructive",
      });
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      if (!user) throw new Error("User not found");
      const res = await apiRequest("POST", "/api/user/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return await res.json();
    },
    onSuccess: () => {
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast({
        title: t.profile.passwordUpdated,
        description: t.messages.welcomeBack,
      });
    },
    onError: (error) => {
      toast({
        title: t.messages.somethingWentWrong,
        description: error.message || t.messages.serverError,
        variant: "destructive",
      });
    },
  });

  // Form submission handlers
  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordFormValues) => {
    updatePasswordMutation.mutate(data);
  };

  return (
    <AppLayout title={t.profile.title}>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>{t.profile.personalInfo}</CardTitle>
              <CardDescription>
                {t.profile.accountSettings}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center text-white text-xl font-bold">
                  {user?.name ? user.name.substring(0, 2).toUpperCase() : user?.email?.substring(0, 2).toUpperCase() || "U"}
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-medium">{user?.name || "User"}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t.profile.role}: {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : t.users.roleClient}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Telegram Connect Component */}
          <TelegramConnect />
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t.profile.accountSettings}</CardTitle>
              <CardDescription>
                {t.profile.updateProfile}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="profile">{t.profile.personalInfo}</TabsTrigger>
                  <TabsTrigger value="password">{t.profile.changePassword}</TabsTrigger>
                </TabsList>
                
                {/* Profile Form */}
                <TabsContent value="profile">
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4 mt-4">
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.auth.email}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormDescription>
                              {t.auth.emailPlaceholder}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.auth.name}</FormLabel>
                            <FormControl>
                              <Input placeholder={t.auth.namePlaceholder} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.auth.company}</FormLabel>
                            <FormControl>
                              <Input placeholder={t.auth.companyPlaceholder} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.auth.phone}</FormLabel>
                            <FormControl>
                              <Input placeholder={t.auth.phonePlaceholder} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        disabled={updateProfileMutation.isPending} 
                        className="mt-2"
                      >
                        {updateProfileMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {t.common.save}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
                
                {/* Password Form */}
                <TabsContent value="password">
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 mt-4">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.profile.currentPassword}</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.profile.newPassword}</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.profile.confirmNewPassword}</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        disabled={updatePasswordMutation.isPending} 
                        className="mt-2"
                      >
                        {updatePasswordMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {t.profile.changePassword}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
