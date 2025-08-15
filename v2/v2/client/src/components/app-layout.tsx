import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "./ui/sidebar";
import { Header } from "./ui/header";
import InstructionsFeatureNotification from "./shared/instructions-feature-notification";
import { useAuth } from "@/contexts/AuthContext";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  // Закрываем мобильный сайдбар при изменении размера окна
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        // md breakpoint
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Определяем название текущей страницы для персонализации уведомления
  const getPageName = (path: string) => {
    if (path.includes("/analytics")) return "аналитики";
    if (path.includes("/channels")) return "каналов";
    if (path.includes("/knowledge-base")) return "базы знаний";
    if (path.includes("/assistants")) return "ассистентов";
    if (path.includes("/messages")) return "сообщений";
    if (path.includes("/notifications")) return "уведомлений";
    if (path.includes("/billing")) return "тарифов";
    if (path.includes("/settings")) return "настроек";
    if (path.includes("/dashboard")) return "панели управления";
    return "платформы";
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar с передачей состояния мобильного отображения */}
      <Sidebar
        isMobileSidebarOpen={isMobileSidebarOpen}
        toggleMobileSidebar={toggleMobileSidebar}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Header */}
        <Header toggleMobileSidebar={toggleMobileSidebar} />

        {/* Main content area */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>

      {/* Уведомление о новой функции инструкций */}
      <InstructionsFeatureNotification
        userId={user?.id}
        pageName={getPageName(location)}
        // Не передаем onOpenInstructions, так как нельзя управлять диалогами страниц из layout
      />
    </div>
  );
}
