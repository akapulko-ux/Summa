import { useState } from "react";
import { useTranslations } from "@/hooks/use-translations";
import { AppLayout } from "@/components/layout/app-layout";
import { AdvancedSubscriptionList } from "@/components/subscriptions/advanced-subscription-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AllSubscriptionsPage() {
  const { t } = useTranslations();
  const [activeTab, setActiveTab] = useState("all");
  
  return (
    <AppLayout>
      <Card>
        <CardHeader>
          <CardTitle>{t('subscriptions.allSubscriptions')}</CardTitle>
          <CardDescription>{t('subscriptions.allSubscriptionsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4 w-full md:w-auto">
              <TabsTrigger value="all">{t('subscriptions.filters.statusAll')}</TabsTrigger>
              <TabsTrigger value="active">{t('subscriptions.filters.statusActive')}</TabsTrigger>
              <TabsTrigger value="pending">{t('subscriptions.filters.statusPending')}</TabsTrigger>
              <TabsTrigger value="expired">{t('subscriptions.filters.statusExpired')}</TabsTrigger>
              <TabsTrigger value="canceled">{t('subscriptions.filters.statusCanceled')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <AdvancedSubscriptionList defaultView="all" />
            </TabsContent>
            <TabsContent value="active">
              <AdvancedSubscriptionList defaultView="active" />
            </TabsContent>
            <TabsContent value="pending">
              <AdvancedSubscriptionList defaultView="pending" />
            </TabsContent>
            <TabsContent value="expired">
              <AdvancedSubscriptionList defaultView="expired" />
            </TabsContent>
            <TabsContent value="canceled">
              <AdvancedSubscriptionList defaultView="canceled" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </AppLayout>
  );
}