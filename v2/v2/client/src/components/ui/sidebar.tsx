"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  BarChart3,
  MessageSquare,
  Database,
  Phone,
  Send,
  Users,
  CreditCard,
  Bot,
  Menu,
  X,
  Moon,
  Sun,
  Globe,
  Home,
  Share2,
  Settings,
  BellRing,
} from "lucide-react";
import { Button } from "./button";
import { useTheme } from "../../contexts/ThemeContext";
import { Link, useLocation } from "wouter";

interface SidebarProps {
  isMobileSidebarOpen?: boolean;
  toggleMobileSidebar?: () => void;
}

export function Sidebar({
  isMobileSidebarOpen,
  toggleMobileSidebar,
}: SidebarProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [internalMobileSidebarOpen, setInternalMobileSidebarOpen] =
    useState(false);
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();

  // Используем либо переданное состояние, либо внутреннее
  const mobileSidebarOpen =
    isMobileSidebarOpen !== undefined
      ? isMobileSidebarOpen
      : internalMobileSidebarOpen;

  // Блокируем прокрутку body при открытии мобильного сайдбара
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    // Очистка при размонтировании
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSidebarOpen]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleToggleMobileSidebar = () => {
    if (toggleMobileSidebar) {
      toggleMobileSidebar();
    } else {
      setInternalMobileSidebarOpen(!internalMobileSidebarOpen);
    }
  };

  const navItems = [
    {
      icon: <Home className="h-5 w-5" />,
      text: "Панель управления",
      href: "/dashboard",
    },
    {
      icon: <Bot className="h-5 w-5" />,
      text: "Ассистенты",
      href: "/assistants",
    },
    {
      icon: <Database className="h-5 w-5" />,
      text: "База знаний",
      href: "/knowledge-base",
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      text: "Сообщения",
      href: "/communications",
    },
    { icon: <Globe className="h-5 w-5" />, text: "Каналы", href: "/channels" },
    {
      icon: <Phone className="h-5 w-5" />,
      text: "Телефония",
      href: "/telephony",
    },
    {
      icon: <Send className="h-5 w-5" />,
      text: "Рассылки",
      href: "/notifications",
    },
    {
      icon: <BellRing className="h-5 w-5" />,
      text: "Каналы оповещений",
      href: "/notification-channels",
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      text: "Аналитика",
      href: "/analytics",
    },
    { icon: <Users className="h-5 w-5" />, text: "Команда", href: "/team" },
    {
      icon: <Share2 className="h-5 w-5" />,
      text: "Кабинет партнёра",
      href: "/referrals",
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      text: "Тарифы",
      href: "/billing",
    },
    {
      icon: <Settings className="h-5 w-5" />,
      text: "Настройки",
      href: "/settings",
    },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } transition-all duration-300 border-r bg-card hidden md:block h-screen fixed left-0 top-0 z-30`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center">
              <Bot className="h-6 w-6 text-primary mr-2" />
              {isSidebarOpen && (
                <span className="font-bold text-xl">Асиссто</span>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navItems.map((item, index) => (
                <SidebarItem
                  key={index}
                  icon={item.icon}
                  text={item.text}
                  href={item.href}
                  expanded={isSidebarOpen}
                  active={
                    location === item.href ||
                    (item.href === "/dashboard" && location === "/")
                  }
                />
              ))}
            </ul>
          </nav>
          <div className="p-4 border-t">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-4 w-4 mr-2" />
                  {isSidebarOpen && <span>Светлая тема</span>}
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 mr-2" />
                  {isSidebarOpen && <span>Темная тема</span>}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div
        className="md:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-all duration-100 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in"
        data-state={mobileSidebarOpen ? "open" : "closed"}
        style={{ display: mobileSidebarOpen ? "block" : "none" }}
      >
        <div className="fixed inset-y-0 left-0 z-50 w-3/4 max-w-xs bg-card p-6 shadow-lg transition ease-in-out data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:animate-in data-[state=open]:slide-in-from-left sm:max-w-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <Bot className="h-6 w-6 text-primary mr-2" />
              <span className="font-bold text-xl">Асиссто</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleMobileSidebar}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="overflow-y-auto flex-1">
            <ul className="space-y-4">
              {navItems.map((item, index) => (
                <SidebarItem
                  key={index}
                  icon={item.icon}
                  text={item.text}
                  href={item.href}
                  expanded={true}
                  active={
                    location === item.href ||
                    (item.href === "/dashboard" && location === "/")
                  }
                  onClick={handleToggleMobileSidebar}
                />
              ))}
            </ul>
          </nav>
          <div className="mt-2 pt-4 border-t">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-4 w-4 mr-2" />
                  <span>Светлая тема</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 mr-2" />
                  <span>Темная тема</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

interface SidebarItemProps {
  icon: React.ReactNode;
  text: string;
  href: string;
  expanded: boolean;
  active: boolean;
  onClick?: () => void;
}

function SidebarItem({
  icon,
  text,
  href,
  expanded,
  active,
  onClick,
}: SidebarItemProps) {
  // Если нет дополнительной функции onClick, просто используем компонент Link
  if (!onClick) {
    return (
      <li>
        <Link
          href={href}
          className={`block w-full cursor-pointer rounded-md transition-colors ${
            active
              ? "bg-primary text-primary-foreground"
              : "text-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          <div
            className={`w-full flex items-center justify-${
              expanded ? "start" : "center"
            } py-2 px-3`}
          >
            <span className="mr-2">{icon}</span>
            {expanded && <span>{text}</span>}
            {/* Лэйбл new висит до 07.07.2025 */}
            {text === "Телефония" && new Date() < new Date("2025-07-07") && (
              <span className="ml-2 text-xs text-primary-foreground bg-primary rounded-full px-2 pt-1 pb-1.5 animate-pulse">
                new
              </span>
            )}
          </div>
        </Link>
      </li>
    );
  }

  // Если есть дополнительная функция onClick, используем div с программной навигацией
  return (
    <li>
      <div
        className={`block w-full cursor-pointer rounded-md transition-colors border ${
          active
            ? "bg-primary text-primary-foreground"
            : "text-foreground hover:bg-accent hover:text-accent-foreground"
        }`}
        onClick={() => {
          onClick();
          setTimeout(() => (window.location.href = href), 0);
        }}
      >
        <div
          className={`w-full flex items-center justify-${
            expanded ? "start" : "center"
          } py-2 px-3`}
        >
          <span className="mr-2">{icon}</span>
          {expanded && <span>{text}</span>}
          {/* Лэйбл new висит до 07.07.2025 */}
          {text === "Телефония" && new Date() < new Date("2025-07-07") && (
            <span className="ml-2 text-xs text-primary-foreground bg-primary rounded-full px-2 pt-1 pb-1.5 animate-pulse">
              new
            </span>
          )}
        </div>
      </div>
    </li>
  );
}
