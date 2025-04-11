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
  Database,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface SidebarProps {
  className?: string;
}

type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
  visibleFor: string[];
};

type DividerItem = {
  type: 'divider';
};

type SidebarItem = NavItem | DividerItem;

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // Общие маршруты для всех пользователей
  const commonNavItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: <Home className="h-4 w-4" />,
      visibleFor: ["client", "admin"],
    },
    {
      title: "Subscriptions",
      href: "/subscriptions",
      icon: <CreditCard className="h-4 w-4" />,
      visibleFor: ["client", "admin"],
    },
    {
      title: "Settings",
      href: "/profile",
      icon: <Settings className="h-4 w-4" />,
      visibleFor: ["client", "admin"],
    },
  ];

  // Маршруты только для администраторов
  const adminNavItems = [
    {
      title: "User Management",
      href: "/admin/users",
      icon: <Users className="h-4 w-4" />,
      visibleFor: ["admin"],
    },
    {
      title: "Services",
      href: "/admin/services",
      icon: <MessagesSquare className="h-4 w-4" />,
      visibleFor: ["admin"],
    },
    {
      title: "Backups",
      href: "/admin/backups",
      icon: <Database className="h-4 w-4" />,
      visibleFor: ["admin"],
    },
    {
      title: "Analytics",
      href: "/admin/analytics",
      icon: <BarChart4 className="h-4 w-4" />,
      visibleFor: ["admin"],
    },
    {
      title: "Reports",
      href: "/admin/reports",
      icon: <FileText className="h-4 w-4" />,
      visibleFor: ["admin"],
    },
  ];

  // Объединяем маршруты в зависимости от роли пользователя
  const navItems: SidebarItem[] = isAdmin 
    ? [...commonNavItems, { type: 'divider' } as DividerItem, ...adminNavItems] 
    : commonNavItems;

  return (
    <aside className={cn("pb-12", className)}>
      <nav className="flex flex-col space-y-1">
        {navItems.map((item, index) => {
          // Рендерим разделитель
          if (item.type === 'divider') {
            return (
              <div key={`divider-${index}`} className="my-2 border-t border-border px-3">
                {isAdmin && <p className="mt-2 text-xs font-semibold text-muted-foreground">Admin Panel</p>}
              </div>
            );
          }
          
          // Нормальные пункты меню
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
