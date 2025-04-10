import { AppLayout } from "@/components/layout/app-layout";
import { ServiceList } from "@/components/services/service-list";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ServiceForm } from "@/components/services/service-form";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

export default function ServicesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);

  return (
    <AppLayout title="Services">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-muted-foreground">
            {isAdmin
              ? "Manage available services for your clients"
              : "Browse available services for subscriptions"}
          </p>
        </div>

        {isAdmin && (
          <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Service</DialogTitle>
              </DialogHeader>
              <ServiceForm
                onSuccess={() => setIsServiceDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <ServiceList />
    </AppLayout>
  );
}
