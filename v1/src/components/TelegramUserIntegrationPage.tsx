import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { AlertCircle, Shield, Lock, Settings, MessageSquare, Bot } from 'lucide-react';

export function TelegramUserIntegrationPage() {
  return (
    <div className="max-w-4xl mx-auto py-10 space-y-8">
      {/* Заголовок */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <MessageSquare className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Telegram User API</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Интеграция с Telegram для работы с пользовательскими аккаунтами
        </p>
      </div>

      {/* Основная карточка с уведомлением */}
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <CardTitle className="text-destructive">Функция временно недоступна</CardTitle>
          </div>
          <CardDescription className="text-base">
            Данная функция отключена администратором для технического обслуживания
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-background rounded-lg p-6 space-y-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-medium">Безопасность</h3>
                <p className="text-sm text-muted-foreground">
                  Мы проводим обновление системы безопасности для защиты ваших данных
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-start space-x-3">
              <Settings className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-medium">Техническое обслуживание</h3>
                <p className="text-sm text-muted-foreground">
                  Обновляем инфраструктуру и улучшаем производительность системы
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-start space-x-3">
              <Bot className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-medium">Новые возможности</h3>
                <p className="text-sm text-muted-foreground">
                  Готовим новые функции для более удобной работы с Telegram
                </p>
              </div>
            </div>
          </div>

          <div className="text-center space-y-4">
            <Badge variant="outline" className="text-sm">
              Ожидаемое время восстановления: 24-48 часов
            </Badge>
            
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span>Все ваши данные в безопасности</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Альтернативные варианты */}
      <Card>
        <CardHeader>
          <CardTitle>Альтернативные способы интеграции</CardTitle>
          <CardDescription>
            Пока функция недоступна, вы можете использовать другие методы
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Telegram Bot API</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Создайте бота для автоматизации сообщений
              </p>
              <Button variant="outline" size="sm" disabled>
                Перейти к Bot API
              </Button>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Ручная интеграция</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Загрузите экспорт переписки для создания двойника
              </p>
              <Button variant="outline" size="sm" disabled>
                Создать двойника
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Статус системы */}
      <Card>
        <CardHeader>
          <CardTitle>Статус системы</CardTitle>
          <CardDescription>
            Текущее состояние компонентов платформы
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Telegram User API</span>
              <Badge variant="destructive">Отключено</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm">Telegram Bot API</span>
              <Badge variant="secondary">Активно</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm">Создание двойников</span>
              <Badge variant="secondary">Активно</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm">Чат с двойниками</span>
              <Badge variant="secondary">Активно</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}