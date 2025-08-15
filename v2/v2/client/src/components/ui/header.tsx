import { Bell, User, Menu } from "lucide-react";
import { Button } from "./button";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  toggleMobileSidebar: () => void;
  pageTitle?: string;
}

export function Header({ toggleMobileSidebar, pageTitle }: HeaderProps) {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();

  // Если pageTitle не передан, определим его на основе текущего маршрута
  const determinePageTitle = () => {
    if (pageTitle) return pageTitle;

    const routeTitles: Record<string, string> = {
      "/dashboard": "Панель управления",
      "/assistants": "Ассистенты",
      "/knowledge-base": "База знаний",
      "/messages": "Сообщения",
      "/channels": "Каналы",
      "/telephony": "Телефония",
      "/notifications": "Рассылки",
      "/analytics": "Аналитика",
      "/team": "Команда",
      "/billing": "Тарифы",
    };

    return routeTitles[location] || "Асиссто";
  };

  // Обработчик выхода из системы
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Получаем инициалы пользователя для аватара
  const getUserInitials = () => {
    if (!user) return "АП";

    if (user.name) {
      // Проверяем, не начинается ли имя на "+7"
      if (user.name.startsWith("+7")) {
        return <User className="h-5 w-5" />;
      }

      const parts = user.name.split(" ");
      if (parts.length > 1) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return user.name.substring(0, 2).toUpperCase();
    }

    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }

    // Если есть телефон, но нет имени
    return user.phone ? <User className="h-5 w-5" /> : "АП";
  };

  return (
    <header className="border-b bg-card sticky top-0 z-20">
      <div className="flex h-16 items-center px-4 md:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden mr-2"
          onClick={toggleMobileSidebar}
          aria-label="Открыть меню"
        >
          <Menu className="h-6 w-6" />
        </Button>

        {/* Логотип с ссылкой на главную страницу */}
        <Link href="/">
          <div className="flex items-center cursor-pointer mr-4">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
              A
            </div>
            <span className="text-lg font-bold ml-2 hidden md:block">
              Асиссто
            </span>
          </div>
        </Link>

        <h1 className="text-xl font-semibold">{determinePageTitle()}</h1>
        <div className="ml-auto flex items-center space-x-4">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full"
              >
                <Avatar>
                  {/* <AvatarImage src="" /> */}
                  <AvatarFallback>
                    {typeof getUserInitials() === "string"
                      ? getUserInitials()
                      : getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.name || "Пользователь"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                Профиль
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                Настройки
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Выйти</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
