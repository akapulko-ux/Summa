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

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  visibleFor: string[];
}

interface DividerItem {
  type: 'divider';
}

// Использование type guard для определения типа элемента
function isDivider(item: SidebarItem): item is DividerItem {
  return 'type' in item && item.type === 'divider';
}

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

  // Render function for NavItem
  const renderNavItem = (item: NavItem) => (
    <Link
      key={item.href}
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        location === item.href 
          ? "bg-primary/10 font-medium text-primary dark:bg-accent dark:text-accent-foreground" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {item.icon}
      {item.title}
    </Link>
  );

  // Render function for DividerItem
  const renderDivider = (index: number) => (
    <div key={`divider-${index}`} className="my-2 border-t border-border px-3">
      {isAdmin && <p className="mt-2 text-xs font-semibold text-muted-foreground">Admin Panel</p>}
    </div>
  );

  return (
    <aside className={cn("pb-12", className)}>
      <nav className="flex flex-col space-y-1">
        {navItems.map((item, index) => 
          isDivider(item) ? renderDivider(index) : renderNavItem(item)
        )}
      </nav>
    </aside>
  );
}
