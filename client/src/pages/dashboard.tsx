import { AppLayout } from "@/components/layout/app-layout";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentSubscriptions } from "@/components/dashboard/recent-subscriptions";
import { PopularServices } from "@/components/dashboard/popular-services";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SubscriptionForm } from "@/components/subscriptions/subscription-form";
import { ServiceForm } from "@/components/services/service-form";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);

  return (
    <AppLayout title="Dashboard">
      {/* Quick action buttons */}
      <div className="flex justify-end">
        <div className="flex gap-2">
          <Dialog open={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen}>
            <DialogTrigger asChild>
              <Button className="hidden md:flex">
                <Plus className="h-4 w-4 mr-2" />
                New Subscription
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Subscription</DialogTitle>
              </DialogHeader>
              <SubscriptionForm 
                onSuccess={() => setIsSubscriptionDialogOpen(false)} 
              />
            </DialogContent>
          </Dialog>
          
          {isAdmin && (
            <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button className="hidden md:flex" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  New Service
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
          
          {/* Mobile action button */}
          <Button 
            className="md:hidden flex items-center justify-center h-9 w-9 p-0" 
            onClick={() => setIsSubscriptionDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <StatsCards />

      {/* Recent Activity Section */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-1 md:col-span-2 lg:col-span-4">
          <RecentSubscriptions />
        </div>
        <div className="col-span-1 md:col-span-2 lg:col-span-3">
          <PopularServices />
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <div className="col-span-1">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-2">Manage Subscriptions</h3>
            <p className="text-sm text-muted-foreground mb-4">
              View and manage all your active service subscriptions
            </p>
            <Button asChild className="w-full">
              <Link href="/subscriptions">View Subscriptions</Link>
            </Button>
          </div>
        </div>
        
        <div className="col-span-1">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-2">Browse Services</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Explore available services and their details
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/services">View Services</Link>
            </Button>
          </div>
        </div>
        
        {isAdmin && (
          <div className="col-span-1">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-2">User Management</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Manage users, permissions and account settings
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/users">Manage Users</Link>
              </Button>
            </div>
          </div>
        )}
        {!isAdmin && (
          <div className="col-span-1">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-2">Account Settings</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Update your profile and account preferences
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/profile">View Profile</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
