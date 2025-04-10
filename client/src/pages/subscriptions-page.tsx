import { AppLayout } from "@/components/layout/app-layout";
import { SubscriptionList } from "@/components/subscriptions/subscription-list";
import { SubscriptionForm } from "@/components/subscriptions/subscription-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";

export default function SubscriptionsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <AppLayout title="Subscriptions">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-muted-foreground">
            Manage all your active service subscriptions
          </p>
        </div>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Subscription
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Subscription</DialogTitle>
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
