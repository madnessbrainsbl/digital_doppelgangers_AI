import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Settings,
  Zap,
  Bot,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  MessageSquare,
  Mail,
} from "lucide-react";

interface NotificationChannelsInstructionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NotificationChannelsInstructionsDialog({
  open,
  onOpenChange,
}: NotificationChannelsInstructionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Bell className="h-6 w-6 mr-2 text-primary" />
            Инструкция по работе с каналами оповещений
          </DialogTitle>
          <DialogDescription>
            Полное руководство по созданию и настройке каналов оповещений для
            функций OpenAI
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-8rem)]">
          <div className="space-y-6 pr-4">
            {/* Важная информация */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-start">
                <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-0 sm:mr-3 mb-2 sm:mb-0 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-300">
                    Что такое каналы оповещений
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                    Каналы оповещений позволяют ассистентам отправлять
                    уведомления и данные в внешние системы: Telegram, Email и
                    другие. Они работают через OpenAI функции, которые
                    ассистенты могут вызывать в нужный момент диалога.
                  </p>
                </div>
              </div>
            </div>

            {/* 1. Создание каналов оповещений */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Plus className="h-5 w-5 mr-2 text-green-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  1. Создание каналов оповещений
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Процесс создания нового канала оповещений:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Основные шаги:</h4>
                  <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Нажмите кнопку "Создать канал оповещений"</li>
                    <li>Выберите тип канала (Telegram, Email)</li>
                    <li>Укажите название канала</li>
                    <li>Настройте параметры подключения</li>
                    <li>Сохраните настройки</li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Поддерживаемые типы каналов:</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs bg-blue-50">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Telegram
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-green-50">
                      <Mail className="h-3 w-3 mr-1" />
                      Email
                    </Badge>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    <strong>Совет:</strong> Дайте каналам понятные названия,
                    чтобы легко различать их при создании функций.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 2. OpenAI функции */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Zap className="h-5 w-5 mr-2 text-purple-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">2. ИИ функции</h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  ИИ функции — это мост между ассистентами и каналами
                  оповещений:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Как работают функции:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      Ассистент анализирует диалог и определяет необходимость
                      отправки уведомления
                    </li>
                    <li>Вызывает соответствующую ИИ функцию</li>
                    <li>Функция отправляет данные через настроенный канал</li>
                    <li>
                      Пользователь получает уведомление в Telegram, на email и
                      т.д.
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Создание функции:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Нажмите "Создать функцию" в карточке канала</li>
                    <li>Укажите название и описание функции</li>
                    <li>
                      Настройте параметры, которые будет передавать ассистент
                    </li>
                    <li>
                      Перейдите в настройки ассистента на вкладку "Каны связи"
                    </li>
                    <li>Выберите созданную функцию и нажмите "Подключить"</li>
                  </ul>
                </div>

                <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                  <p className="text-sm text-purple-700 dark:text-purple-400">
                    <strong>Важно:</strong> Хорошо продумайте описание функции —
                    оно поможет ассистенту понять, когда её нужно использовать.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 3. Настройка каналов */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Settings className="h-5 w-5 mr-2 text-orange-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">3. Настройка каналов</h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium">Telegram канал:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Создайте бота через @BotFather в Telegram</li>
                    <li>Получите токен бота</li>
                    <li>Добавьте бота в нужный чат или канал</li>
                    <li>Получите ID чата (можно через @userinfobot)</li>
                    <li>Укажите токен и ID чата в настройках канала</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Email канал:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Укажите SMTP сервер вашего почтового провайдера</li>
                    <li>
                      Введите логин и пароль (пароль приложения, не от почты!)
                    </li>
                    <li>Настройте адрес отправителя</li>
                    <li>Проверьте подключение тестовым письмом</li>
                  </ul>
                </div>

                <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                  <p className="text-sm text-orange-700 dark:text-orange-400">
                    <strong>Безопасность:</strong> Все данные каналов хранятся в
                    зашифрованном виде. Токены и пароли доступны только вам.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 4. Интеграция с ассистентами */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Bot className="h-5 w-5 mr-2 text-indigo-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  4. Интеграция с ассистентами
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Подключение функций к ассистентам для автоматических
                  уведомлений:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Процесс подключения:</h4>
                  <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Перейдите в раздел "Ассистенты"</li>
                    <li>Откройте настройки нужного ассистента</li>
                    <li>
                      В разделе "Каналы связи" выберите созданную ИИ функцию
                    </li>
                    <li>
                      Ассистент получит возможность отправлять уведомления
                    </li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Примеры использования:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      <strong>Уведомления о новых заявках</strong> — ассистент
                      отправляет заявку клиента в Telegram
                    </li>
                    <li>
                      <strong>Техподдержка</strong> — критичные проблемы сразу в
                      чат поддержки
                    </li>
                  </ul>
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3">
                  <p className="text-sm text-indigo-700 dark:text-indigo-400">
                    <strong>Автоматизация:</strong> Ассистенты сами определяют,
                    когда отправить уведомление, на основе контекста диалога и
                    ваших инструкций.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 5. Управление и редактирование */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Edit className="h-5 w-5 mr-2 text-cyan-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  5. Управление и редактирование
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium">Редактирование каналов:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Нажмите на иконку редактирования в карточке канала</li>
                    <li>Измените название или настройки подключения</li>
                    <li>Проверьте подключение после изменений</li>
                    <li>Сохраните изменения</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Редактирование функций:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      Функции можно редактировать только если они не подключены
                      к ассистентам
                    </li>
                    <li>Измените название, описание или параметры</li>
                    <li>Обновите схему параметров при необходимости</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Удаление:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Сначала отключите функции от всех ассистентов</li>
                    <li>Удалите неиспользуемые функции</li>
                    <li>Только после этого можно удалить канал</li>
                  </ul>
                </div>

                <div className="bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 rounded-lg p-3">
                  <div className="flex flex-col sm:flex-row sm:items-start">
                    <Trash2 className="h-5 w-5 text-cyan-600 dark:text-cyan-400 mt-0.5 mr-0 sm:mr-2 mb-2 sm:mb-0 flex-shrink-0" />
                    <p className="text-sm text-cyan-700 dark:text-cyan-400">
                      <strong>Осторожно:</strong> Удаление канала приведет к
                      удалению всех связанных функций. Убедитесь, что они не
                      используются ассистентами.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Быстрое начало */}
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-start">
                <Zap className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 mr-0 sm:mr-3 mb-2 sm:mb-0 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">
                    Быстрое начало работы с каналами оповещений
                  </h4>
                  <ol className="text-sm text-green-700 dark:text-green-400 space-y-1 ml-4 list-decimal list-inside">
                    <li>Создайте канал оповещений (Telegram или Email)</li>
                    <li>Настройте параметры подключения</li>
                    <li>Создайте ИИ функцию для канала</li>
                    <li>Опишите назначение функции для ассистента</li>
                    <li>Перейдите в раздел "Ассистенты"</li>
                    <li>Подключите функцию к нужному ассистенту</li>
                    <li>Протестируйте работу в диалоге с ассистентом</li>
                    <li>Настройте дополнительные функции по необходимости</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Полезные советы */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-start">
                <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-0 sm:mr-3 mb-2 sm:mb-0 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                    Лучшие практики каналов оповещений
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 ml-4 list-disc list-inside">
                    <li>
                      <strong>Понятные названия</strong> — используйте
                      описательные имена каналов и функций
                    </li>
                    <li>
                      <strong>Тестирование</strong> — проверяйте работу каналов
                      после настройки
                    </li>
                    <li>
                      <strong>Безопасность токенов</strong> — не делитесь
                      токенами и паролями
                    </li>
                    <li>
                      <strong>Мониторинг</strong> — следите за доставкой
                      уведомлений
                    </li>
                    <li>
                      <strong>Оптимизация</strong> — настраивайте частоту
                      уведомлений
                    </li>
                    <li>
                      <strong>Документирование</strong> — ведите описания
                      функций для команды
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
