import { ReactNode, useState } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header onMenuToggle={toggleMobileMenu} />
      
      <div className="flex-1 container grid grid-cols-1 md:grid lg:grid-cols-5 gap-6 p-4 md:p-8">
        {/* Sidebar - hidden on mobile */}
        <aside className="hidden lg:block lg:col-span-1">
          <Sidebar />
        </aside>
        
        {/* Main Content */}
        <main className="lg:col-span-4 space-y-6">
          {title && (
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            </div>
          )}
          
          {children}
        </main>
      </div>
      
      {/* Mobile bottom navigation */}
      <MobileNav />
      
      {/* Mobile sidebar menu - appears when menu button is clicked */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={toggleMobileMenu}></div>
          <div className="fixed top-0 left-0 bottom-0 w-3/4 max-w-xs bg-background p-4 shadow-lg">
            <div className="mb-4 text-xl font-bold">SaaSly</div>
            <Sidebar className="mt-4" />
          </div>
        </div>
      )}
    </div>
  );
}
