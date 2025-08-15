import React, { useState } from 'react';
import { Bot, Plus, Settings, User, MessageCircle, Brain, Trash2, Sparkles, Zap, Star, Heart, Lock, Mic, Shield, Send, X, ChevronRight, ChevronDown, Home, BarChart3, Users, Database, Cpu, Globe, TrendingUp, Award, HelpCircle, Book, ShoppingBag, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { cn } from '../../lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
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

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  description: string;
  color: string;
  count?: number;
  requiresAuth?: boolean;
}

const SidebarItem = ({ 
  item, 
  isActive, 
  isDisabled, 
  onClick 
}: { 
  item: MenuItem; 
  isActive: boolean; 
  isDisabled: boolean; 
  onClick: () => void;
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isActive ? "secondary" : "ghost"}
            onClick={onClick}
            disabled={isDisabled}
            className={cn(
              "w-full justify-start h-10 px-3",
              isActive && "bg-secondary text-secondary-foreground font-medium",
              isDisabled && "opacity-50"
            )}
          >
            <item.icon className={cn("h-4 w-4 mr-3", !isDisabled && item.color)} />
            <div className="flex-1 text-left">
              <div className="text-sm font-medium">{item.label}</div>
              <div className="text-xs text-muted-foreground">
                {isDisabled ? "Требуется авторизация" : item.description}
              </div>
            </div>
            {item.count !== undefined && (
              <Badge variant="secondary" className="ml-auto">
                {item.count}
              </Badge>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{isDisabled ? "Войдите для доступа" : item.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export function Sidebar({ 
  isOpen, 
  onClose, 
  currentView, 
  onNavigate, 
  twins = [], 
  onSelectTwin,
  onDeleteTwin 
}: SidebarProps) {
  const { user } = useAuth();
  const [expandedSections, setExpandedSections] = useState<string[]>(['main', 'twins']);
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const menuSections: Array<{
    id: string;
    title: string;
    items: MenuItem[];
  }> = [
    {
      id: 'main',
      title: 'Основное',
      items: [
        { 
          id: 'twins-list', 
          label: 'Мои двойники', 
          icon: Bot,
          description: 'Все ваши цифровые двойники',
          color: 'text-blue-600',
          count: twins.length
        },
        { 
          id: 'create-new', 
          label: 'Создать', 
          icon: Plus,
          description: 'Создать нового двойника',
          color: 'text-green-600'
        },
        { 
          id: 'data-tables', 
          label: 'Таблицы', 
          icon: Database,
          description: 'Таблицы данных',
          color: 'text-orange-600'
        },
        { 
          id: 'calendar', 
          label: 'Календарь', 
          icon: Calendar,
          description: 'События и встречи',
          color: 'text-green-600'
        }
      ]
    },
    {
      id: 'integrations',
      title: 'Интеграции',
      items: [
        { 
          id: 'voice-cloning', 
          label: 'Клонирование', 
          icon: Mic,
          description: 'Голосовые модели',
          color: 'text-pink-600'
        },
        { 
          id: 'telegram-integration', 
          label: 'Telegram Bot', 
          icon: Send,
          description: 'Интеграция бота',
          color: 'text-blue-600'
        },
        { 
          id: 'telegram-user-integration', 
          label: 'Telegram User', 
          icon: MessageCircle,
          description: 'Личная интеграция',
          color: 'text-purple-600'
        },
        { 
          id: 'avito-integration', 
          label: 'Авито', 
          icon: ShoppingBag,
          description: 'Автоответы на Авито',
          color: 'text-orange-600'
        }
      ]
    },
    {
      id: 'system',
      title: 'Система',
      items: [
        { 
          id: 'settings', 
          label: 'Настройки', 
          icon: Settings,
          description: 'Конфигурация',
          color: 'text-gray-600',
          requiresAuth: true
        },
        { 
          id: 'profile', 
          label: 'Профиль', 
          icon: User,
          description: 'Личные данные',
          color: 'text-purple-600',
          requiresAuth: true
        }
      ]
    },
    {
      id: 'help',
      title: 'Помощь',
      items: [
        { 
          id: 'support', 
          label: 'Поддержка', 
          icon: HelpCircle,
          description: 'Связь с поддержкой',
          color: 'text-blue-500'
        },
        { 
          id: 'faq', 
          label: 'FAQ', 
          icon: Book,
          description: 'Частые вопросы',
          color: 'text-purple-500'
        }
      ]
    }
  ];

  const formatMessagesCount = (count: number) => {
    if (count >= 1000) {
      return `${Math.round(count / 1000)}k`;
    }
    return count.toString();
  };

  const getStyleIcon = (style: string) => {
    switch (style.toLowerCase()) {
      case 'энергичный и эмоциональный':
        return <Zap className="h-3 w-3" />;
      case 'краткий и лаконичный':
        return <Brain className="h-3 w-3" />;
      case 'любознательный и вовлеченный':
        return <Star className="h-3 w-3" />;
      default:
        return <Heart className="h-3 w-3" />;
    }
  };

  const getStyleColor = (style: string) => {
    switch (style.toLowerCase()) {
      case 'энергичный и эмоциональный':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'краткий и лаконичный':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'любознательный и вовлеченный':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  const handleItemClick = (itemId: string, requiresAuth?: boolean) => {
    if (requiresAuth && !user) {
      alert('Для доступа к этой функции необходимо войти в аккаунт');
      return;
    }
    onNavigate(itemId);
    onClose();
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 shadow-md">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-background animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">AI Twin</h2>
            <p className="text-xs text-muted-foreground font-medium">Enterprise Platform</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-4 py-4">
          {menuSections.map((section) => (
            <div key={section.id} className="space-y-1.5">
              <Button
                variant="ghost"
                onClick={() => toggleSection(section.id)}
                className="w-full justify-between h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <span className="uppercase tracking-wider">{section.title}</span>
                {expandedSections.includes(section.id) ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
              
              {expandedSections.includes(section.id) && (
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = currentView === item.id;
                    const isDisabled = (item.requiresAuth || false) && !user;
                    
                    return (
                      <SidebarItem
                        key={item.id}
                        item={item}
                        isActive={isActive}
                        isDisabled={isDisabled}
                        onClick={() => handleItemClick(item.id, item.requiresAuth || false)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {/* Twins List */}
          {twins.length > 0 && expandedSections.includes('twins') && (
            <div className="space-y-1.5">
              <Button
                variant="ghost"
                onClick={() => toggleSection('twins')}
                className="w-full justify-between h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <span className="uppercase tracking-wider">Активные двойники</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
              
              <div className="space-y-1.5">
                {twins.slice(0, 5).map((twin) => (
                  <Card key={twin.id} className="group hover:shadow-md transition-all duration-200 border border-border/50">
                    <CardContent className="p-2.5">
                      <div className="flex items-start justify-between">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            onSelectTwin?.(twin.id);
                            onClose();
                          }}
                          className="flex-1 text-left p-0 h-auto hover:bg-transparent"
                        >
                          <div className="w-full">
                            <div className="flex items-center space-x-2 mb-1.5">
                              <div className="relative">
                                <div className="p-1.5 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg shadow-sm">
                                  <Bot className="h-3 w-3 text-white" />
                                </div>
                                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-background" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium truncate">{twin.name}</h4>
                                <p className="text-xs text-muted-foreground">Готов к общению</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-1">
                                <MessageCircle className="h-3 w-3 text-blue-600" />
                                <span className="text-xs text-muted-foreground font-medium">
                                  {formatMessagesCount(twin.messagesCount)}
                                </span>
                              </div>
                              <Badge 
                                variant="outline" 
                                className={cn("text-xs border", getStyleColor(twin.profile.communicationStyle))}
                              >
                                {getStyleIcon(twin.profile.communicationStyle)}
                                <span className="ml-1 truncate max-w-12">
                                  {twin.profile.communicationStyle.split(' ')[0]}
                                </span>
                              </Badge>
                            </div>
                          </div>
                        </Button>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteTwin?.(twin.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Удалить двойника</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {twins.length > 5 && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      onNavigate('twins-list');
                      onClose();
                    }}
                    className="w-full text-xs text-muted-foreground hover:text-foreground"
                  >
                    Показать все ({twins.length})
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4 bg-muted/30">
        <div className="space-y-3">
          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-600 animate-pulse" />
              <span className="text-xs font-medium text-foreground">AI Twin Enterprise</span>
            </div>
            <Badge variant="outline" className="text-xs bg-background">
              v1.5
            </Badge>
          </div>
          
          {/* Tech Stack */}
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              <Cpu className="h-2.5 w-2.5 mr-1" />
              Gemini 2.5 Pro
            </Badge>
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
              <Shield className="h-2.5 w-2.5 mr-1" />
              Enterprise
            </Badge>
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
              <Award className="h-2.5 w-2.5 mr-1" />
              Production
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      {/* Desktop Sidebar - Fixed position */}
      <aside className="hidden lg:flex lg:w-80 lg:flex-col lg:fixed lg:inset-y-0 lg:z-40 lg:border-r lg:bg-background/95 lg:backdrop-blur-sm">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="w-80 p-0 border-r">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
}