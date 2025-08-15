import { Link, useLocation } from "wouter";
import { ReactNode } from "react";
import {
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Github,
  Twitter,
  Facebook,
  Instagram,
  LogOut,
  User,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return <MainLayout>{children}</MainLayout>;
}

function MainLayout({ children }: PublicLayoutProps) {
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

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
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Логотип */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <div className="flex items-center cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold mr-2">
                    A
                  </div>
                  <span className="text-xl font-bold text-gray-900">
                    Асиссто
                  </span>
                </div>
              </Link>
            </div>

            {/* Основная навигация - адаптивная верстка */}
            <nav className="hidden lg:flex space-x-6">
              <Link href="/">
                <div
                  className={`px-1 py-2 text-sm font-medium ${
                    location === "/"
                      ? "text-primary border-b-2 border-primary"
                      : "text-gray-700 hover:text-gray-900"
                  } cursor-pointer`}
                >
                  Главная
                </div>
              </Link>
              <Link href="/about">
                <div
                  className={`px-1 py-2 text-sm font-medium ${
                    location === "/about"
                      ? "text-primary border-b-2 border-primary"
                      : "text-gray-700 hover:text-gray-900"
                  } cursor-pointer`}
                >
                  О нас
                </div>
              </Link>
              <Link href="/features">
                <div
                  className={`px-1 py-2 text-sm font-medium ${
                    location === "/features"
                      ? "text-primary border-b-2 border-primary"
                      : "text-gray-700 hover:text-gray-900"
                  } cursor-pointer`}
                >
                  Возможности
                </div>
              </Link>
              <Link href="/pricing">
                <div
                  className={`px-1 py-2 text-sm font-medium ${
                    location === "/pricing"
                      ? "text-primary border-b-2 border-primary"
                      : "text-gray-700 hover:text-gray-900"
                  } cursor-pointer`}
                >
                  Тарифы
                </div>
              </Link>
              <Link href="/docs">
                <div
                  className={`px-1 py-2 text-sm font-medium ${
                    location === "/docs"
                      ? "text-primary border-b-2 border-primary"
                      : "text-gray-700 hover:text-gray-900"
                  } cursor-pointer`}
                >
                  Документация
                </div>
              </Link>
              <Link href="/referral">
                <div
                  className={`px-1 py-2 text-sm font-medium ${
                    location === "/referral"
                      ? "text-primary border-b-2 border-primary"
                      : "text-gray-700 hover:text-gray-900"
                  } cursor-pointer`}
                >
                  Реферальная программа
                </div>
              </Link>
              <Link href="/contact">
                <div
                  className={`px-1 py-2 text-sm font-medium ${
                    location === "/contact"
                      ? "text-primary border-b-2 border-primary"
                      : "text-gray-700 hover:text-gray-900"
                  } cursor-pointer`}
                >
                  Контакты
                </div>
              </Link>
            </nav>

            {/* Компактная навигация для планшетов */}
            <nav className="hidden md:flex lg:hidden space-x-1">
              <Link href="/">
                <div
                  className={`px-1 py-2 text-sm font-medium ${
                    location === "/"
                      ? "text-primary border-b-2 border-primary"
                      : "text-gray-700 hover:text-gray-900"
                  } cursor-pointer`}
                >
                  Главная
                </div>
              </Link>
              <Link href="/about">
                <div
                  className={`px-1 py-2 text-sm font-medium ${
                    location === "/about"
                      ? "text-primary border-b-2 border-primary"
                      : "text-gray-700 hover:text-gray-900"
                  } cursor-pointer`}
                >
                  О нас
                </div>
              </Link>
              <Link href="/features">
                <div
                  className={`px-1 py-2 text-sm font-medium ${
                    location === "/features"
                      ? "text-primary border-b-2 border-primary"
                      : "text-gray-700 hover:text-gray-900"
                  } cursor-pointer`}
                >
                  Возможности
                </div>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    Ещё <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem asChild>
                    <Link href="/pricing">
                      <div className="w-full cursor-pointer">Тарифы</div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/docs">
                      <div className="w-full cursor-pointer">Документация</div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/referral">
                      <div className="w-full cursor-pointer">
                        Реферальная программа
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/contact">
                      <div className="w-full cursor-pointer">Контакты</div>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            {/* Кнопки действий */}
            <div className="hidden lg:flex items-center gap-4">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center space-x-2"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {user?.name || "Пользователь"}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
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
                    <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Личный кабинет</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/settings")}>
                      <div className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Настройки</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <div className="flex items-center text-red-500">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Выйти</span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Link href="/auth">
                    <div className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer">
                      Войти
                    </div>
                  </Link>
                  <Link href="/auth?signup=true">
                    <div className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 cursor-pointer">
                      Начать бесплатно
                    </div>
                  </Link>
                </>
              )}
            </div>

            {/* Кнопки для планшетов */}
            <div className="hidden md:flex lg:hidden items-center gap-2">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-1">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                      Личный кабинет
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/settings")}>
                      Настройки
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-red-500"
                    >
                      Выйти
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Link href="/auth">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-2 py-1 text-xs"
                    >
                      Войти
                    </Button>
                  </Link>
                  <Link href="/auth?signup=true">
                    <Button size="sm" className="px-2 py-1 text-xs">
                      Начать
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Мобильная кнопка меню */}
            <div className="md:hidden flex items-center">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <span className="sr-only">Открыть меню</span>
                {mobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Мобильное и планшетное меню */}
        {mobileMenuOpen && (
          <div className="lg:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
              <Link href="/">
                <div
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location === "/"
                      ? "text-primary bg-primary/10"
                      : "text-gray-700 hover:bg-gray-50"
                  } cursor-pointer`}
                >
                  Главная
                </div>
              </Link>
              <Link href="/about">
                <div
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location === "/about"
                      ? "text-primary bg-primary/10"
                      : "text-gray-700 hover:bg-gray-50"
                  } cursor-pointer`}
                >
                  О нас
                </div>
              </Link>
              <Link href="/features">
                <div
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location === "/features"
                      ? "text-primary bg-primary/10"
                      : "text-gray-700 hover:bg-gray-50"
                  } cursor-pointer`}
                >
                  Возможности
                </div>
              </Link>
              <Link href="/pricing">
                <div
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location === "/pricing"
                      ? "text-primary bg-primary/10"
                      : "text-gray-700 hover:bg-gray-50"
                  } cursor-pointer`}
                >
                  Тарифы
                </div>
              </Link>
              <Link href="/docs">
                <div
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location === "/docs"
                      ? "text-primary bg-primary/10"
                      : "text-gray-700 hover:bg-gray-50"
                  } cursor-pointer`}
                >
                  Документация
                </div>
              </Link>
              <Link href="/referral">
                <div
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location === "/referral"
                      ? "text-primary bg-primary/10"
                      : "text-gray-700 hover:bg-gray-50"
                  } cursor-pointer`}
                >
                  Реферальная программа
                </div>
              </Link>
              <Link href="/contact">
                <div
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location === "/contact"
                      ? "text-primary bg-primary/10"
                      : "text-gray-700 hover:bg-gray-50"
                  } cursor-pointer`}
                >
                  Контакты
                </div>
              </Link>
              <div className="border-t border-gray-200 pt-4 pb-2">
                {isAuthenticated ? (
                  <>
                    <Link href="/dashboard">
                      <div className="block w-full text-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                        Личный кабинет
                      </div>
                    </Link>
                    <div
                      className="block w-full text-center mt-2 px-3 py-2 rounded-md text-base font-medium bg-red-500 text-white hover:bg-red-600 cursor-pointer"
                      onClick={handleLogout}
                    >
                      Выйти
                    </div>
                  </>
                ) : (
                  <>
                    <Link href="/auth">
                      <div className="block w-full text-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                        Войти
                      </div>
                    </Link>
                    <Link href="/auth?signup=true">
                      <div className="block w-full text-center mt-2 px-3 py-2 rounded-md text-base font-medium bg-primary text-white hover:bg-primary/90 cursor-pointer">
                        Начать бесплатно
                      </div>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Основной контент */}
      <main className="flex-grow">{children}</main>

      {/* Подвал */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-16">
            <div>
              <Link href="/">
                <div className="flex items-center cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary font-bold mr-2">
                    A
                  </div>
                  <span className="text-xl font-bold">Асиссто</span>
                </div>
              </Link>
              <p className="mt-4 text-gray-400">
                Платформа AI-ассистентов для бизнеса любого масштаба
              </p>
              <div className="mt-6 flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <Facebook className="h-5 w-5" />
                  <span className="sr-only">Facebook</span>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <Twitter className="h-5 w-5" />
                  <span className="sr-only">Twitter</span>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <Instagram className="h-5 w-5" />
                  <span className="sr-only">Instagram</span>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <Github className="h-5 w-5" />
                  <span className="sr-only">GitHub</span>
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Решения</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/features#sales">
                    <div className="text-gray-400 hover:text-white cursor-pointer">
                      Отдел продаж
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/features#support">
                    <div className="text-gray-400 hover:text-white cursor-pointer">
                      Поддержка клиентов
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/features#marketing">
                    <div className="text-gray-400 hover:text-white cursor-pointer">
                      Маркетинг
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/features#hr">
                    <div className="text-gray-400 hover:text-white cursor-pointer">
                      HR и рекрутинг
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/features#education">
                    <div className="text-gray-400 hover:text-white cursor-pointer">
                      Обучение
                    </div>
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Компания</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/about">
                    <div className="text-gray-400 hover:text-white cursor-pointer">
                      О нас
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/about#team">
                    <div className="text-gray-400 hover:text-white cursor-pointer">
                      Команда
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/under-construction?page=Карьера">
                    <div className="text-gray-400 hover:text-white cursor-pointer">
                      Карьера
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/under-construction?page=Блог">
                    <div className="text-gray-400 hover:text-white cursor-pointer">
                      Блог
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/contact">
                    <div className="text-gray-400 hover:text-white cursor-pointer">
                      Контакты
                    </div>
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Ресурсы</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/pricing">
                    <div className="text-gray-400 hover:text-white cursor-pointer">
                      Тарифы
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/docs">
                    <div className="text-gray-400 hover:text-white cursor-pointer">
                      Документация
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/under-construction?page=Видеоуроки">
                    <div className="text-gray-400 hover:text-white cursor-pointer">
                      Видеоуроки
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/under-construction?page=API">
                    <div className="text-gray-400 hover:text-white cursor-pointer">
                      API
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/pricing#faq">
                    <div className="text-gray-400 hover:text-white cursor-pointer">
                      FAQ
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/under-construction?page=Поддержка">
                    <div className="text-gray-400 hover:text-white cursor-pointer">
                      Поддержка
                    </div>
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pb-12 md:pb-0 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} Асиссто. Все права защищены.
            </p>
            <div className="mt-4 md:mt-0">
              <ul className="flex space-x-6 text-sm">
                <li>
                  <Link href="/privacy-policy">
                    <div className="text-gray-400 hover:text-white cursor-pointer">
                      Политика конфиденциальности
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/terms">
                    <div className="text-gray-400 hover:text-white cursor-pointer">
                      Условия использования
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/requisites">
                    <div className="text-gray-400 hover:text-white cursor-pointer">
                      Реквизиты
                    </div>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Экспортируем как дефолтный экспорт
export default MainLayout;
