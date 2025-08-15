import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
  twins?: Array<{
    id: string;
    name: string;
    messagesCount: number;
    profile: {
      communicationStyle: string;
    };
  }>;
  onSelectTwin?: (twinId: string) => void;
  onDeleteTwin?: (twinId: string) => void;
}

export function Layout({ 
  children, 
  currentView, 
  onNavigate, 
  twins, 
  onSelectTwin, 
  onDeleteTwin 
}: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
          currentView={currentView}
          onNavigate={onNavigate}
          twins={twins}
          onSelectTwin={onSelectTwin}
          onDeleteTwin={onDeleteTwin}
        />
        
        <div className="flex-1 flex flex-col lg:ml-80 overflow-hidden">
          <Header 
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={toggleSidebar}
            onNavigate={onNavigate}
          />
          
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}