import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTranslations } from "@/lib/translations";
import Layout from "@/components/layout/layout";
import CashbackAdminForm from "@/components/cashback/cashback-admin-form";
import CashbackHistory from "@/components/cashback/cashback-history";
import CashbackBalance from "@/components/cashback/cashback-balance";

export default function CashbackPage() {
  const { t } = useTranslations();
  
  // Запрос для получения информации о текущем пользователе (для определения роли)
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/user'],
    queryFn: () => apiRequest("GET", "/api/user").then(res => res.json()),
  });

  const isAdmin = user?.role === 'admin';
  
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">{t("cashback")}</h1>
          <p className="text-muted-foreground">
            {isAdmin ? t("cashback_admin_description") : t("cashback_client_description")}
          </p>
        </div>

        <div className="grid gap-6">
          {/* Отображаем баланс кэшбека (для всех пользователей) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <CashbackBalance />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Для администраторов показываем форму добавления кэшбека */}
            {isAdmin && (
              <div className="md:col-span-1">
                <CashbackAdminForm />
              </div>
            )}
            
            {/* История транзакций по кэшбеку отображается для всех пользователей */}
            <div className={isAdmin ? "md:col-span-2" : "md:col-span-3"}>
              <CashbackHistory />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}