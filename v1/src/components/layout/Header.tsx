import React, { useState } from 'react';
import { Brain, Search, Bell, Settings, User, LogIn, Menu, Command, Sparkles, Zap, Shield, Award, ChevronDown, Plus, MessageSquare, Mic, Send, Database, HelpCircle, Book } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'; 
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuShortcut
} from '../ui/dropdown-menu';
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '../ui/navigation-menu';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '../ui/command';
import { CommandShortcut } from '../ui/command';
import { AuthModal } from '../auth/AuthModal';
import { ProfileModal } from '../auth/ProfileModal';
import { cn } from '../../lib/utils';

interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onNavigate: (view: string) => void;
  onNavigate: (view: string) => void;
}

export function Header({ isSidebarOpen, onToggleSidebar, onNavigate }: HeaderProps) {
  const { user, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCommandDialog, setShowCommandDialog] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Пользователь';
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navigationItems = [
    {
      title: "Создать",
      items: [
        { title: "Новый двойник", description: "Создать цифрового двойника", icon: Brain, action: () => onNavigate('create-new') },
        { title: "Клонирование", description: "Голосовая модель", icon: Mic, action: () => onNavigate('voice-cloning') },
        { title: "Таблицы", description: "Таблицы данных", icon: Database, action: () => onNavigate('data-tables') },
      ]
    },
    {
      title: "Интеграции",
      items: [
        { title: "Telegram Bot", description: "Интеграция бота", icon: Send, action: () => onNavigate('telegram-integration') },
        { title: "Telegram User", description: "Личная интеграция", icon: MessageSquare, action: () => onNavigate('telegram-user-integration') },
      ]
    },
    {
      title: "Помощь",
      items: [
        { title: "Поддержка", description: "Связь с поддержкой", icon: HelpCircle, action: () => onNavigate('support') },
        { title: "FAQ", description: "Частые вопросы", icon: Book, action: () => onNavigate('faq') },
      ]
    }
  ];

  const commandItems = [
    { title: "Мои двойники", icon: Brain, action: () => onNavigate('twins-list') },
    { title: "Создать", icon: Plus, action: () => onNavigate('create-new') },
    { title: "Клонирование", icon: Mic, action: () => onNavigate('voice-cloning') },
    { title: "Таблицы", icon: Database, action: () => onNavigate('data-tables') },
    { title: "Telegram Bot", icon: Send, action: () => onNavigate('telegram-integration') },
    { title: "Telegram User", icon: MessageSquare, action: () => onNavigate('telegram-user-integration') },
    { title: "Поддержка", icon: HelpCircle, action: () => onNavigate('support') },
    { title: "FAQ", icon: Book, action: () => onNavigate('faq') },
    { title: "Настройки", icon: Settings, action: () => onNavigate('settings') },
    { title: "Профиль", icon: User, action: () => onNavigate('profile') },
  ];

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowCommandDialog((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container flex h-16 items-center">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="mr-2 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Logo */}
          <div className="mr-6 flex items-center space-x-2">
            <div className="relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 shadow-md">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-background animate-pulse" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">AI Twin</h1>
              <p className="text-xs text-muted-foreground font-medium">Enterprise Platform</p>
            </div>
          </div>

          {/* Navigation Menu */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {navigationItems.map((section) => (
                <NavigationMenuItem key={section.title} className="px-1">
                  <NavigationMenuTrigger className="h-9 px-3 font-medium">
                    {section.title}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] bg-white">
                      {section.items.map((item) => (
                        <NavigationMenuLink key={item.title} asChild>
                          <button
                            onClick={item.action}
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-left hover:shadow-sm"
                          >
                            <div className="flex items-center space-x-2">
                              <div className={`p-1.5 rounded-md ${
                                item.icon === Brain ? 'bg-blue-100 text-blue-600' : 
                                item.icon === Mic ? 'bg-pink-100 text-pink-600' : 
                                item.icon === Database ? 'bg-green-100 text-green-600' : 
                                'bg-purple-100 text-purple-600'
                              }`}>
                                <item.icon className="h-3.5 w-3.5" />
                              </div>
                              <div className="text-sm font-medium leading-none">{item.title}</div>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {item.description}
                            </p>
                          </button>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search */}
          <Button
            variant="outline"
            className="relative h-9 w-9 p-0 xl:h-9 xl:w-60 xl:justify-start xl:px-3 xl:py-2 border-muted-foreground/20 hover:bg-accent"
            onClick={() => setShowCommandDialog(true)}
          >
            <Search className="h-4 w-4 xl:mr-2" />
            <span className="hidden xl:inline-flex">Поиск...</span>
            <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>

          {/* Status Badge */}
          <Badge variant="outline" className="ml-2 hidden sm:flex bg-green-50 text-green-700 border-green-200 font-medium">
            <div className="mr-1.5 h-2 w-2 rounded-full bg-green-600 animate-pulse" />
            Online
          </Badge>

          {/* User Menu */}
          <div className="ml-4 flex items-center space-x-2">
            {user ? (
              <>
                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 border-2 border-background" />
                </Button>

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8 border border-muted">
                        <AvatarImage src={user.user_metadata?.avatar_url} alt="User" />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm font-semibold">
                          {getInitials(getDisplayName())}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{getDisplayName()}</p>
                        <p className="text-xs leading-none text-muted-foreground truncate max-w-[180px]">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowProfileModal(true)}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Профиль</span>
                      <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onNavigate('settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Настройки</span>
                      <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogIn className="mr-2 h-4 w-4" />
                      <span>Выйти</span>
                      <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button 
                onClick={() => setShowAuthModal(true)} 
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-sm"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Войти
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Command Dialog */}
      <CommandDialog open={showCommandDialog} onOpenChange={setShowCommandDialog} className="shadow-2xl">
        <CommandInput placeholder="Поиск команд..." />
        <CommandList>
          <CommandEmpty>Команды не найдены.</CommandEmpty>
          <CommandGroup heading="Навигация">
            {commandItems.map((item) => (
              <CommandItem
                key={item.title}
                onSelect={() => {
                  item.action();
                  setShowCommandDialog(false);
                }}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span className="font-medium">{item.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Быстрые действия">
            <CommandItem onSelect={() => { onNavigate('create-new'); setShowCommandDialog(false); }}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Создать нового двойника</span>
              <CommandShortcut>⌘N</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => { setShowCommandDialog(false); setShowAuthModal(true); }}>
              <LogIn className="mr-2 h-4 w-4" />
              <span>Войти в аккаунт</span>
              <CommandShortcut>⌘L</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />
    </>
  );
}