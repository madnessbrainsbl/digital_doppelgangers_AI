import { ReactNode } from 'react';
import Sidebar from './sidebar';
import Header from './Header';
import { useSidebar } from '@/context/sidebar-context';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isOpen } = useSidebar();
  
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      
      <main className={`flex-1 flex flex-col h-full overflow-hidden ${isOpen ? 'lg:ml-64' : 'lg:ml-20'} w-full`}>
        <Header />
        
        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 lg:p-6 bg-neutral-50 dark:bg-neutral-900">
          {children}
        </div>
      </main>
    </div>
  );
}

export default MainLayout;
