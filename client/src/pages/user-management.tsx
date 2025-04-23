import { AppLayout } from "@/components/layout/app-layout";
import { UserManagementTable } from "@/components/users/user-management-table";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { UserForm } from "@/components/users/user-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "@/hooks/use-translations";

export default function UserManagement() {
  const { user } = useAuth();
  const { t } = useTranslations();
  const isAdmin = user?.role === "admin";
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Redirect non-admin users
  if (!isAdmin) {
    return <Redirect to="/" />;
  }

  return (
    <AppLayout title={t('users.title')}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-muted-foreground">
            {t('users.manageUsers')}
          </p>
        </div>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('users.addUser')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{t('users.addUser')}</DialogTitle>
            </DialogHeader>
            <UserForm 
              onSuccess={() => setIsFormOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <UserManagementTable />
    </AppLayout>
  );
}
