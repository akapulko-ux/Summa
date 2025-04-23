import React, { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useTranslations } from '@/hooks/use-translations';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  LogOut,
  Menu,
  User,
  BarChart,
  Settings,
  CreditCard,
  Users,
  Database,
  FileText,
  Workflow,
  X,
  Bell
} from 'lucide-react';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logoutMutation } = useAuth();
  const { t, language, setLanguage } = useTranslations();
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navigationItems = [
    { title: t('nav.dashboard'), path: '/', icon: <Workflow className="h-5 w-5 mr-2" /> },
    { title: t('nav.profile'), path: '/profile', icon: <User className="h-5 w-5 mr-2" /> },
    { title: t('nav.subscriptions'), path: '/subscriptions', icon: <CreditCard className="h-5 w-5 mr-2" /> },
  ];

  const adminNavigationItems = [
    { title: t('nav.services'), path: '/admin/services', icon: <Settings className="h-5 w-5 mr-2" /> },
    { title: t('nav.users'), path: '/admin/users', icon: <Users className="h-5 w-5 mr-2" /> },
    { title: t('nav.backups'), path: '/admin/backups', icon: <Database className="h-5 w-5 mr-2" /> },
    { title: t('nav.analytics'), path: '/admin/analytics', icon: <BarChart className="h-5 w-5 mr-2" /> },
    { title: t('nav.reports'), path: '/admin/reports', icon: <FileText className="h-5 w-5 mr-2" /> },
    { title: t('nav.monitoring'), path: '/admin/monitoring', icon: <BarChart className="h-5 w-5 mr-2" /> },
  ];

  return (
    <div className="flex h-screen flex-col">
      {/* Верхняя навигационная панель */}
      <header className="border-b bg-background">
        <div className="flex h-16 items-center px-4 md:px-6">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between border-b p-4">
                  <div className="flex items-center">
                    <h2 className="text-lg font-semibold">SaaSly</h2>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <nav className="flex-1 overflow-auto p-4">
                  <div className="space-y-1">
                    {navigationItems.map((item) => (
                      <Button
                        key={item.path}
                        variant={location === item.path ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setSidebarOpen(false)}
                        asChild
                      >
                        <Link href={item.path}>
                          {item.icon}
                          {item.title}
                        </Link>
                      </Button>
                    ))}
                    {isAdmin && (
                      <>
                        <div className="my-2 pt-1 px-3 text-xs font-medium text-muted-foreground">
                          {t('layout.adminPanel')}
                        </div>
                        {adminNavigationItems.map((item) => (
                          <Button
                            key={item.path}
                            variant={location === item.path ? "secondary" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => setSidebarOpen(false)}
                            asChild
                          >
                            <Link href={item.path}>
                              {item.icon}
                              {item.title}
                            </Link>
                          </Button>
                        ))}
                      </>
                    )}
                  </div>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
          <Link href="/">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">SaaSly</span>
            </div>
          </Link>
          <nav className="ml-8 hidden md:flex gap-6 items-center">
            <Link href="/">
              <span className={cn(
                "text-sm font-medium transition-colors hover:text-primary hover:font-bold",
                location === "/" ? "text-primary font-bold dark:text-primary-foreground" : "text-muted-foreground"
              )}>
                {t('nav.dashboard')}
              </span>
            </Link>
            <Link href="/subscriptions">
              <span className={cn(
                "text-sm font-medium transition-colors hover:text-primary hover:font-bold",
                location === "/subscriptions" ? "text-primary font-bold dark:text-primary-foreground" : "text-muted-foreground"
              )}>
                {t('nav.subscriptions')}
              </span>
            </Link>
            {isAdmin && (
              <>
                <button 
                  onClick={() => window.location.href = "/admin/services"} 
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary hover:font-bold border-0 bg-transparent cursor-pointer p-0",
                    location === "/admin/services" ? "text-primary font-bold dark:text-primary-foreground" : "text-muted-foreground"
                  )}
                >
                  {t('nav.services')}
                </button>
                <button 
                  onClick={() => window.location.href = "/admin/users"} 
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary hover:font-bold border-0 bg-transparent cursor-pointer p-0",
                    location === "/admin/users" ? "text-primary font-bold dark:text-primary-foreground" : "text-muted-foreground"
                  )}
                >
                  {t('nav.users')}
                </button>
              </>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('layout.notifications')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {t('layout.noNotifications')}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                onClick={() => setLanguage(language === 'en' ? 'ru' : 'en')}
              >
                {language === 'en' ? 'EN' : 'РУ'}
              </Button>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 md:pl-4"
                >
                  <span className="hidden md:inline-flex">
                    {user?.name || user?.email}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {user?.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>{t('nav.profile')}</span>
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/analytics">
                        <BarChart className="mr-2 h-4 w-4" />
                        <span>{t('nav.analytics')}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/reports">
                        <FileText className="mr-2 h-4 w-4" />
                        <span>{t('nav.reports')}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/backups">
                        <Database className="mr-2 h-4 w-4" />
                        <span>{t('nav.backups')}</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('auth.logoutAction')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      {/* Разделение на боковую панель и основное содержимое для настольных устройств */}
      <div className="flex flex-1 overflow-hidden">
        {/* Боковая панель для настольных устройств */}
        <aside className="hidden lg:flex lg:w-64 border-r flex-col bg-background">
          <nav className="flex-1 space-y-1 p-4">
            {navigationItems.map((item) => (
              <Button
                key={item.path}
                variant={location === item.path ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start text-left",
                  location === item.path && "dark:bg-primary/10 dark:text-primary-foreground dark:font-medium"
                )}
                asChild
              >
                <Link href={item.path}>
                  {item.icon}
                  {item.title}
                </Link>
              </Button>
            ))}
            
            {isAdmin && (
              <>
                <div className="mt-6 pt-6 border-t px-3 text-xs font-medium text-muted-foreground">
                  {t('layout.adminPanel')}
                </div>
                {adminNavigationItems.map((item) => (
                  <Button
                    key={item.path}
                    variant={location === item.path ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start text-left",
                      location === item.path && "dark:bg-primary/10 dark:text-primary-foreground dark:font-medium"
                    )}
                    asChild
                  >
                    <Link href={item.path}>
                      {item.icon}
                      {item.title}
                    </Link>
                  </Button>
                ))}
              </>
            )}
          </nav>
        </aside>
        
        {/* Основное содержимое */}
        <main className="flex-1 overflow-auto bg-muted/20 pb-16 md:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;