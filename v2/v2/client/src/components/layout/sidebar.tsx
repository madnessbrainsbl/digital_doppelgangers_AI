import { useLocation, Link } from "wouter";
import { useSidebar } from "@/context/sidebar-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  href: string;
  icon: string;
  label: string;
  isActive: boolean;
}

const SidebarItem = ({ href, icon, label, isActive }: SidebarItemProps) => {
  const { closeSidebar } = useSidebar();
  const isMobile = useIsMobile();
  
  const handleClick = () => {
    if (isMobile) {
      closeSidebar();
    }
  };

  return (
    <li>
      <Link 
        href={href}
        className={cn(
          "flex items-center px-3 py-2 rounded-md",
          isActive
            ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
            : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700/50"
        )}
        onClick={handleClick}
      >
        <span className="material-icons text-[20px] mr-3">{icon}</span>
        <span>{label}</span>
      </Link>
    </li>
  );
};

export default function Sidebar() {
  const [location] = useLocation();
  const { isOpen, closeSidebar } = useSidebar();
  
  const navigation = [
    { href: "/", icon: "dashboard", label: "Панель управления" },
    { href: "/assistants", icon: "smart_toy", label: "Ассистенты" },
    { href: "/knowledge-base", icon: "library_books", label: "База знаний" },
    { href: "/communications", icon: "chat", label: "Коммуникации" },
    { href: "/channels", icon: "link", label: "Каналы связи" },
    { href: "/voice", icon: "call", label: "Голосовой модуль" },
    { href: "/notifications", icon: "notifications", label: "Рассылки" },
    { href: "/analytics", icon: "bar_chart", label: "Аналитика" },
    { href: "/team", icon: "people", label: "Команда" },
    { href: "/billing", icon: "payment", label: "Тарифы" },
  ];

  return (
    <aside
      className={cn(
        "w-64 h-full bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 shadow-sm flex flex-col transition-all lg:translate-x-0 transform z-50 fixed lg:relative",
        !isOpen && "-translate-x-full"
      )}
      data-state={isOpen ? "expanded" : "collapsed"}
    >
      {/* Logo Area */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
        <div className="flex items-center">
          <svg className="w-8 h-8 text-primary-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.88-11.71L10 14.17l-1.88-1.88a.996.996 0 1 0-1.41 1.41l2.59 2.59c.39.39 1.02.39 1.41 0l6.59-6.59a.996.996 0 1 0-1.41-1.41z" />
          </svg>
          <h1 className="ml-2 text-lg font-semibold text-neutral-900 dark:text-white">Асиссто</h1>
        </div>
        <button
          className="lg:hidden text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-white"
          onClick={() => closeSidebar()}
        >
          <span className="material-icons">menu_open</span>
        </button>
      </div>
      
      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide py-4">
        <ul className="space-y-1 px-2">
          {navigation.map((item) => (
            <SidebarItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={
                item.href === "/"
                  ? location === "/"
                  : location.startsWith(item.href)
              }
            />
          ))}
        </ul>
      </nav>
      
      {/* User Profile */}
      <div className="border-t border-neutral-200 dark:border-neutral-700 p-4">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300 flex items-center justify-center">
            <span className="material-icons">person</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-neutral-900 dark:text-white">Анна Смирнова</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Администратор</p>
          </div>
          <button className="ml-auto text-neutral-400 hover:text-neutral-500 dark:text-neutral-500 dark:hover:text-neutral-400">
            <span className="material-icons text-sm">expand_more</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
