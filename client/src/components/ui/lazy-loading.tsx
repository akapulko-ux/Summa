import { Suspense, lazy } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Ленивая загрузка компонентов для ускорения первоначальной загрузки
export const LazyDashboard = lazy(() => import("@/pages/dashboard"));
export const LazySubscriptionsPage = lazy(() => import("@/pages/subscriptions-page"));
export const LazyServicesPage = lazy(() => import("@/pages/client-services-page"));
export const LazyReportsPage = lazy(() => import("@/pages/reports-page"));
export const LazyNotificationsPage = lazy(() => import("@/pages/notifications-page"));
export const LazyBackupsPage = lazy(() => import("@/pages/backups-page"));
export const LazyUsersPage = lazy(() => import("@/pages/users-page"));

// Компонент для отображения скелетона во время загрузки
export const PageSkeleton = () => (
  <div className="space-y-6 p-6">
    <div className="space-y-2">
      <Skeleton className="h-8 w-[250px]" />
      <Skeleton className="h-4 w-[400px]" />
    </div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full" />
      ))}
    </div>
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  </div>
);

// Компонент-обертка для ленивой загрузки с красивым скелетоном
export const LazyWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageSkeleton />}>
    {children}
  </Suspense>
);