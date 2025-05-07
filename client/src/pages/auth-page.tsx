import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { loginSchema, registerSchema, magicLinkSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "@/hooks/use-translations";
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { Loader2, Mail } from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

export default function AuthPage() {
  const [location, navigate] = useLocation();
  const { user, loginMutation, registerMutation, magicLinkMutation } = useAuth();
  const { t } = useTranslations();
  const [authMode, setAuthMode] = useState<"login" | "register" | "magic-link">("login");

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      companyName: "",
      phone: "",
    },
  });

  // Magic link form
  const magicLinkForm = useForm<z.infer<typeof magicLinkSchema>>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: {
      email: "",
    },
  });

  // Form submission handlers
  const onLoginSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(data);
  };

  const onMagicLinkSubmit = (data: z.infer<typeof magicLinkSchema>) => {
    magicLinkMutation.mutate(data);
  };

  // Get the error message from URL params if present (used for magic link errors)
  const urlParams = new URLSearchParams(window.location.search);
  const errorParam = urlParams.get("error");
  
  let errorMessage = "";
  if (errorParam) {
    switch (errorParam) {
      case "invalid-token":
        errorMessage = t('messages.invalidToken');
        break;
      case "expired-token":
        errorMessage = t('messages.expiredToken');
        break;
      case "user-not-found":
        errorMessage = t('messages.userNotFound');
        break;
      case "login-failed":
        errorMessage = t('messages.loginFailed');
        break;
      default:
        errorMessage = t('messages.somethingWentWrong');
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Hero section */}
      <div className="bg-secondary w-full md:w-1/2 p-8 md:p-12 flex items-center justify-center relative overflow-hidden">
        <div className="max-w-md mx-auto text-center md:text-left relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t('auth.welcomeTitle')}
          </h1>
          <p className="text-white/80 text-lg mb-6">
            {t('auth.welcomeSubtitle')}
          </p>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-white/10 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
                  <rect width="20" height="14" x="2" y="5" rx="2"></rect>
                  <line x1="2" x2="22" y1="10" y2="10"></line>
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-white font-medium">{t('auth.feature1Title')}</h3>
                <p className="text-white/70 text-sm">{t('auth.feature1Desc')}</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-white/10 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-white font-medium">{t('auth.feature2Title')}</h3>
                <p className="text-white/70 text-sm">{t('auth.feature2Desc')}</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-white/10 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
                  <path d="M3 3v18h18"></path>
                  <path d="m19 9-5 5-4-4-3 3"></path>
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-white font-medium">{t('auth.feature3Title')}</h3>
                <p className="text-white/70 text-sm">{t('auth.feature3Desc')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth forms */}
      <div className="w-full md:w-1/2 p-8 md:p-12 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-secondary">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                </svg>
                <h2 className="text-2xl font-bold ml-2">{t('common.appName')}</h2>
              </div>
              <LanguageSwitcher />
            </div>
            <CardTitle className="text-center text-2xl">
              {authMode === "login" ? t('auth.login') : authMode === "register" ? t('auth.createAccount') : t('auth.magicLink')}
            </CardTitle>
            <CardDescription className="text-center">
              {authMode === "login" 
                ? t('auth.enterCredentials') 
                : authMode === "register" 
                ? t('auth.fillDetails')
                : t('auth.enterEmail')}
            </CardDescription>
            {errorMessage && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mt-2">
                {errorMessage}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="login">{t('auth.login')}</TabsTrigger>
                <TabsTrigger value="register">{t('auth.register')}</TabsTrigger>
                <TabsTrigger value="magic-link" className="text-xs sm:text-sm px-0 sm:px-2">{t('auth.magicLink')}</TabsTrigger>
              </TabsList>
              
              {/* Login Form */}
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('auth.email')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('auth.emailPlaceholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('auth.password')}</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder={t('auth.passwordPlaceholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('auth.signingIn')}
                        </>
                      ) : (
                        t('auth.loginAction')
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              {/* Register Form */}
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('auth.email')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('auth.emailPlaceholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('auth.password')}</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder={t('auth.passwordPlaceholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('auth.name')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('auth.namePlaceholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('auth.company')} ({t('common.optional')})</FormLabel>
                          <FormControl>
                            <Input placeholder={t('auth.companyPlaceholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('auth.phone')} ({t('common.optional')})</FormLabel>
                          <FormControl>
                            <Input placeholder={t('auth.phonePlaceholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('auth.creatingAccount')}
                        </>
                      ) : (
                        t('auth.createAccount')
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              {/* Magic Link Form */}
              <TabsContent value="magic-link">
                <Form {...magicLinkForm}>
                  <form onSubmit={magicLinkForm.handleSubmit(onMagicLinkSubmit)} className="space-y-4">
                    <FormField
                      control={magicLinkForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('auth.email')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('auth.emailPlaceholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full h-auto py-2 whitespace-normal" 
                      disabled={magicLinkMutation.isPending}
                    >
                      {magicLinkMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
                          <span className="text-sm">{t('auth.sendingLink')}</span>
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4 shrink-0" />
                          <span className="text-sm">{t('auth.sendMagicLink')}</span>
                        </>
                      )}
                    </Button>
                    {magicLinkMutation.isSuccess && (
                      <div className="bg-green-100 text-green-800 p-3 rounded-md text-sm">
                        {t('auth.magicLinkSent')}
                      </div>
                    )}
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-sm text-muted-foreground text-center">
              {authMode === "login" ? (
                <>
                  {t('auth.dontHaveAccount')}{" "}
                  <button 
                    className="text-secondary underline" 
                    onClick={() => setAuthMode("register")}
                  >
                    {t('auth.registerAction')}
                  </button>
                </>
              ) : authMode === "register" ? (
                <>
                  {t('auth.alreadyHaveAccount')}{" "}
                  <button 
                    className="text-secondary underline" 
                    onClick={() => setAuthMode("login")}
                  >
                    {t('auth.loginAction')}
                  </button>
                </>
              ) : (
                <>
                  {t('auth.rememberPassword')}{" "}
                  <button 
                    className="text-secondary underline" 
                    onClick={() => setAuthMode("login")}
                  >
                    {t('auth.loginAction')}
                  </button>
                </>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
