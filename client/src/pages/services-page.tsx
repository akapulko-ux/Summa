import { AppLayout } from "@/components/layout/app-layout";
import { ServiceList } from "@/components/services/service-list";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "@/hooks/use-translations";

export default function ServicesPage() {
  const { user } = useAuth();
  const { t } = useTranslations();
  const isAdmin = user?.role === "admin";

  return (
    <AppLayout title={t('services.title')}>
      <div className="mb-6">
        <p className="text-muted-foreground">
          {isAdmin
            ? t('services.manageServices')
            : t('services.browseServices')}
        </p>
      </div>

      <ServiceList />
    </AppLayout>
  );
}
