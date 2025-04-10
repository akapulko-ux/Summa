import { Home, Users, CreditCard, Settings, MessagesSquare } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export function MobileNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const navItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: <Home className="h-5 w-5" />,
      visibleFor: ["client", "admin"],
    },
    {
      title: "Users",
      href: "/users",
      icon: <Users className="h-5 w-5" />,
      visibleFor: ["admin"],
    },
    {
      title: "Services",
      href: "/services",
      icon: <MessagesSquare className="h-5 w-5" />,
      visibleFor: ["client", "admin"],
    },
    {
      title: "Subs",
      href: "/subscriptions",
      icon: <CreditCard className="h-5 w-5" />,
      visibleFor: ["client", "admin"],
    },
    {
      title: "Settings",
      href: "/profile",
      icon: <Settings className="h-5 w-5" />,
      visibleFor: ["client", "admin"],
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t border-border">
      <div className="grid h-full grid-cols-5">
        {navItems.map((item) => {
          // Only show items the user has access to
          if (
            !isAdmin &&
            !item.visibleFor.includes("client")
          ) {
            return null;
          }

          // Placeholder for empty slots in grid
          if (!item) {
            return <div key={Math.random()} />;
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex flex-col items-center justify-center px-5",
                location === item.href && "border-x border-border bg-accent"
              )}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
