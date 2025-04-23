import { AppLayout } from "@/components/layout/app-layout";
import { SubscriptionList } from "@/components/subscriptions/subscription-list";
import { SubscriptionForm } from "@/components/subscriptions/subscription-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { useTranslations } from "@/hooks/use-translations";

export default function SubscriptionsPage() {
  const { t } = useTranslations();
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <AppLayout title={t('subscriptions.title')}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-muted-foreground">
            {t('subscriptions.manageSubscriptions')}
          </p>
        </div>

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

      <SubscriptionList />
    </AppLayout>
  );
}
