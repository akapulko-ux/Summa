import { ReactNode, useState } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header onMenuToggle={toggleSidebar} />
      <div className="flex flex-1">
        <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block w-[250px] flex-col border-r bg-background transition-all duration-300 ease-in-out`}>
          <div className="p-6">
            <Sidebar />
          </div>
        </div>
        <main className="flex-1 p-0">{children}</main>
      </div>
    </div>
  );
}