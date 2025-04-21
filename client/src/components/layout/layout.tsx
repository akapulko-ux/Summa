import { ReactNode } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <div className="hidden md:flex w-[250px] flex-col border-r bg-background">
          <div className="p-6">
            <Sidebar />
          </div>
        </div>
        <main className="flex-1 md:p-0">{children}</main>
      </div>
    </div>
  );
}