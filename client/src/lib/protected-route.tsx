import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading, error } = useAuth();
  const { toast } = useToast();

  // Добавляем лог для отладки проблем с аутентификацией
  useEffect(() => {
    console.log(`Protected route state for ${path}:`, { 
      isAuthenticated: !!user, 
      isLoading, 
      error,
      user
    });
    
    if (error) {
      console.error("Authentication error:", error);
      toast({
        title: "Ошибка аутентификации",
        description: "Пожалуйста, войдите в систему снова",
        variant: "destructive",
      });
    }
  }, [user, isLoading, error, path, toast]);

  // Показываем загрузку
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-secondary mb-4" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </Route>
    );
  }

  // Если пользователь не авторизован, перенаправляем на страницу входа
  if (!user) {
    console.log(`Redirecting from ${path} to /auth - user not authenticated`);
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Если авторизован - показываем запрошенный компонент
  return <Route path={path} component={Component} />;
}
