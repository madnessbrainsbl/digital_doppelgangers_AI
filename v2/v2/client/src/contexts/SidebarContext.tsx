import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useMobile } from '@/hooks/use-mobile';

interface SidebarContextType {
  expanded: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const isMobile = useMobile();
  const [expanded, setExpanded] = useState(!isMobile);

  // Update sidebar state when screen size changes
  useEffect(() => {
    setExpanded(!isMobile);
  }, [isMobile]);

  const toggleSidebar = () => {
    setExpanded(prev => !prev);
  };

  const closeSidebar = () => {
    setExpanded(false);
  };

  return (
    <SidebarContext.Provider value={{ expanded, toggleSidebar, closeSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
