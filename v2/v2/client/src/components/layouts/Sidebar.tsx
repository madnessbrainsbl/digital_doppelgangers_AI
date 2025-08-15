import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initialize on mount

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const navItems = [
    { text: "Панель управления", icon: "dashboard", path: "/dashboard" },
    { text: "Ассистенты", icon: "smart_toy", path: "/assistants" },
    { text: "База знаний", icon: "library_books", path: "/knowledge" },
    { text: "Коммуникации", icon: "chat", path: "/communications" },
    { text: "Каналы связи", icon: "link", path: "/channels" },
    { text: "Голосовой модуль", icon: "call", path: "/voice" },
    { text: "Рассылки", icon: "notifications", path: "/notifications" },
    { text: "Аналитика", icon: "bar_chart", path: "/analytics" },
    { text: "Команда", icon: "people", path: "/team" },
    { text: "Тарифы", icon: "payment", path: "/billing" },
  ];

  return (
    <aside
      className={`w-64 h-full bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 shadow-sm flex flex-col transition-all duration-300 ${
        isCollapsed
          ? "-translate-x-full lg:w-16 lg:translate-x-0"
          : "translate-x-0"
      } fixed lg:relative z-30`}
    >
      {/* Logo Area */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
        <div className="flex items-center">
          <svg
            className="w-8 h-8 text-primary-600"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.88-11.71L10 14.17l-1.88-1.88a.996.996 0 1 0-1.41 1.41l2.59 2.59c.39.39 1.02.39 1.41 0l6.59-6.59a.996.996 0 1 0-1.41-1.41z" />
          </svg>
          {!isCollapsed && (
            <h1 className="ml-2 text-lg font-semibold text-neutral-900 dark:text-white">
              Асиссто
            </h1>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-white"
        >
          <span className="material-icons">
            {isCollapsed ? "menu" : "menu_open"}
          </span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive =
              location === item.path ||
              (item.path === "/dashboard" && location === "/");
            return (
              <li key={item.path}>
                <Link href={item.path}>
                  <a
                    className={`flex items-center px-3 py-2 rounded-md ${
                      isActive
                        ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                        : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700/50"
                    }`}
                  >
                    <span className="material-icons text-[20px] mr-3">
                      {item.icon}
                    </span>
                    {!isCollapsed && <span>{item.text}</span>}
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      {user && (
        <div className="border-t border-neutral-200 dark:border-neutral-700 p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300 flex items-center justify-center">
              <span className="material-icons">person</span>
            </div>
            {!isCollapsed && (
              <div className="ml-3">
                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                  {user.name}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {user.role}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
