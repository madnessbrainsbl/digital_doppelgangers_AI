import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useAuth } from "@/contexts/AuthContext";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-neutral-50 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-100">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <TopBar />
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-neutral-50 dark:bg-neutral-900">
          {children}
        </div>
      </main>
    </div>
  );
}
