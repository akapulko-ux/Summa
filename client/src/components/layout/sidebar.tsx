import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  CreditCard,
  BarChart4,
  FileText,
  Bell,
  Settings,
  MessagesSquare,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const navItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: <Home className="h-4 w-4" />,
      visibleFor: ["client", "admin"],
    },
    {
      title: "User Management",
      href: "/users",
      icon: <Users className="h-4 w-4" />,
      visibleFor: ["admin"],
    },
    {
      title: "Services",
      href: "/services",
      icon: <MessagesSquare className="h-4 w-4" />,
      visibleFor: ["client", "admin"],
    },
    {
      title: "Subscriptions",
      href: "/subscriptions",
      icon: <CreditCard className="h-4 w-4" />,
      visibleFor: ["client", "admin"],
    },
    {
      title: "Analytics",
      href: "/analytics",
      icon: <BarChart4 className="h-4 w-4" />,
      visibleFor: ["admin"],
    },
    {
      title: "Reports",
      href: "/reports",
      icon: <FileText className="h-4 w-4" />,
      visibleFor: ["admin"],
    },
    {
      title: "Notifications",
      href: "/notifications",
      icon: <Bell className="h-4 w-4" />,
      visibleFor: ["client", "admin"],
    },
    {
      title: "Settings",
      href: "/profile",
      icon: <Settings className="h-4 w-4" />,
      visibleFor: ["client", "admin"],
    },
  ];

  return (
    <aside className={cn("pb-12", className)}>
      <nav className="flex flex-col space-y-1">
        {navItems.map((item) => {
          // Only show items the user has access to
          if (
            !isAdmin &&
            !item.visibleFor.includes("client")
          ) {
            return null;
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                location === item.href 
                  ? "bg-accent text-accent-foreground" 
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {item.icon}
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
