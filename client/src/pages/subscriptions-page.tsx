import { AppLayout } from "@/components/layout/app-layout";
import { SubscriptionList } from "@/components/subscriptions/subscription-list";
import { AdvancedSubscriptionList } from "@/components/subscriptions/advanced-subscription-list";
import { SubscriptionForm } from "@/components/subscriptions/subscription-form-fixed";
import { Button } from "@/components/ui/button";
import { Plus, ListFilter } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { useTranslations } from "@/hooks/use-translations";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SubscriptionsPage() {
  const { t } = useTranslations();
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("my");
  const isAdmin = user?.role === 'admin';

  return (
    <AppLayout title={t('subscriptions.title')}>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <p className="text-muted-foreground">
            {t('subscriptions.manageSubscriptions')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('subscriptions.addSubscription')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{t('subscriptions.addSubscription')}</DialogTitle>
              </DialogHeader>
              <SubscriptionForm 
                onSuccess={() => setIsFormOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isAdmin ? (
        <Tabs defaultValue="my" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="my">{t('subscriptions.mySubscriptions')}</TabsTrigger>
            <TabsTrigger value="all">{t('subscriptions.allSubscriptions')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="my">
            <SubscriptionList />
          </TabsContent>
          
          <TabsContent value="all">
            <AdvancedSubscriptionList showAddButton={true} />
          </TabsContent>
        </Tabs>
      ) : (
        <SubscriptionList />
      )}
    </AppLayout>
  );
}
