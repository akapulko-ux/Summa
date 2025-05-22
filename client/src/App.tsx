import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import { TranslationProvider } from "@/hooks/use-translations";
import { ProtectedRoute } from "@/lib/protected-route";
import { AdminRoute } from "@/lib/admin-route";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import ProfilePage from "@/pages/profile-page";
import ServicesPage from "@/pages/services-page";
import ClientServicesPage from "@/pages/client-services-page";
import SubscriptionsPage from "@/pages/subscriptions-page";
import AllSubscriptionsPage from "@/pages/all-subscriptions-page";
import UserManagement from "@/pages/user-management";
import BackupsPage from "@/pages/backups-page";
import AnalyticsPage from "@/pages/analytics-page-v3";
import ReportsPage from "@/pages/reports-page";
import NotificationsPage from "@/pages/notifications-page";
import PerformanceMonitoring from "@/pages/performance-monitoring";
import AdminToolsPage from "@/pages/admin-tools-page";
// @ts-ignore - импортируем провайдер темы
import { ThemeProvider } from "./providers/theme-provider";

function Router() {
  return (
    <Switch>
      {/* Клиентские маршруты (доступны для всех аутентифицированных пользователей) */}
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/subscriptions" component={SubscriptionsPage} />
      <ProtectedRoute path="/services" component={ClientServicesPage} />
      
      {/* Административные маршруты (доступны только для администраторов) */}
      <AdminRoute path="/admin/subscriptions" component={AllSubscriptionsPage} />
      <AdminRoute path="/admin/services" component={ServicesPage} />
      <AdminRoute path="/admin/users" component={UserManagement} />
      <AdminRoute path="/admin/backups" component={BackupsPage} />
      <AdminRoute path="/admin/notifications" component={NotificationsPage} />
      <AdminRoute path="/admin/analytics" component={AnalyticsPage} />
      <AdminRoute path="/admin/reports" component={ReportsPage} />
      <AdminRoute path="/admin/monitoring" component={PerformanceMonitoring} />
      <AdminRoute path="/admin/tools" component={AdminToolsPage} />
      
      {/* Страница аутентификации (доступна для всех) */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Обработка неизвестных маршрутов */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TranslationProvider>
        <AuthProvider>
          <ThemeProvider defaultTheme="light">
            <Router />
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </TranslationProvider>
    </QueryClientProvider>
  );
}

export default App;
