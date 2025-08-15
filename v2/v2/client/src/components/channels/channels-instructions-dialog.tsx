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
  Settings,
  MessageSquare,
  Link as LinkIcon,
  Monitor,
  AlertTriangle,
  CheckCircle,
  Zap,
  Target,
  Shield,
} from "lucide-react";

interface ChannelsInstructionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ChannelsInstructionsDialog({
  open,
  onOpenChange,
}: ChannelsInstructionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <LinkIcon className="h-6 w-6 mr-2 text-primary" />
            Инструкция по работе с каналами связи
          </DialogTitle>
          <DialogDescription>
            Полное руководство по подключению, настройке и управлению каналами
            коммуникации с клиентами
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-8rem)]">
          <div className="space-y-6 pr-4">
            {/* Важная информация */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-start">
                <LinkIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-0 sm:mr-3 mb-2 sm:mb-0 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-300">
                    Что такое каналы связи
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                    Каналы связи — это способы коммуникации с вашими клиентами
                    через различные платформы и сервисы. Подключив каналы, вы
                    сможете получать сообщения от клиентов и отвечать им через
                    ваших ассистентов в автоматическом режиме.
                  </p>
                </div>
              </div>
            </div>

            {/* 1. Типы каналов */}
            <div className="space-y-4">
              <div className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-green-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">1. Типы каналов</h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Платформа поддерживает различные типы каналов связи:
                </p>

                <div className="space-y-3">
                  <h4 className="font-medium">Основные каналы:</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      ВКонтакте
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Avito Business
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Web-чат
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Telegram
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      WhatsApp
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Email
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      SMS
                    </Badge>
                  </div>

                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      <strong>ВКонтакте</strong> — сообщения в группах и личных
                      диалогах
                    </li>
                    <li>
                      <strong>Avito Business</strong> — общение с покупателями
                      на площадке Авито
                    </li>
                    <li>
                      <strong>Web-чат</strong> — виджет чата для вашего сайта
                    </li>
                    <li>
                      <strong>Telegram</strong> — боты и каналы в Telegram
                    </li>
                    <li>
                      <strong>WhatsApp</strong> — мессенджер WhatsApp
                    </li>
                    <li>
                      <strong>Email</strong> — электронная почта
                    </li>
                    <li>
                      <strong>SMS</strong> — текстовые сообщения
                    </li>
                  </ul>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <div className="flex flex-col sm:flex-row sm:items-start">
                    <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-0 sm:mr-2 mb-2 sm:mb-0 flex-shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      <strong>Тарифные ограничения:</strong> На тарифе Базовый
                      доступны только Web-чат и Telegram. Для остальных каналов
                      требуется тариф Стандарт и выше.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* 2. Подключение каналов */}
            <div className="space-y-4">
              <div className="flex items-center">
                <LinkIcon className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  2. Подключение каналов
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Процесс подключения нового канала:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Шаги подключения:</h4>
                  <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Выберите тип канала из списка доступных</li>
                    <li>Нажмите кнопку "Подключить"</li>
                    <li>Заполните форму с настройками подключения</li>
                    <li>Укажите необходимые токены и идентификаторы</li>
                    <li>Сохраните настройки</li>
                    <li>Проверьте статус подключения</li>
                    <li>Настройте ассистентов для канала</li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Особенности настройки:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      <strong>ВКонтакте</strong> — требует токен доступа и ID
                      группы
                    </li>
                    <li>
                      <strong>Avito</strong> — нужен номер профиля и API ключи
                    </li>
                    <li>
                      <strong>Web-чат</strong> — настройка виджета для сайта
                    </li>
                    <li>
                      <strong>Остальные каналы</strong> — будут доступны в
                      следующих обновлениях
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* 3. Управление каналами */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Settings className="h-5 w-5 mr-2 text-purple-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  3. Управление каналами
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Инструменты для работы с подключенными каналами:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Карточка канала:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      <strong>Название и тип</strong> — идентификация канала
                    </li>
                    <li>
                      <strong>Статус</strong> — активен или неактивен
                    </li>
                    <li>
                      <strong>Кнопка "Настройки"</strong> — изменение параметров
                      подключения
                    </li>
                    <li>
                      <strong>Кнопка "Диалоги"</strong> — переход к просмотру
                      сообщений
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Страница настроек канала:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Редактирование параметров подключения</li>
                    <li>Настройка ассистентов для канала</li>
                    <li>Просмотр диалогов и сообщений</li>
                    <li>Статистика использования канала</li>
                    <li>Удаление канала</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* 4. Интеграция с ассистентами */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-indigo-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  4. Интеграция с ассистентами
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Настройка автоматических ответов через каналы:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Назначение ассистентов:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      Привязка ассистентов к конкретным каналам и диалогам
                    </li>
                    <li>Настройка автоматических ответов</li>
                    <li>Установка правил для разных типов сообщений</li>
                    <li>Контроль качества автоответов</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Режимы работы:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      <strong>Полностью автоматический</strong> — ассистент
                      отвечает на все сообщения
                    </li>
                    <li>
                      <strong>Полуавтоматический</strong> — ассистент предлагает
                      варианты ответов
                    </li>
                    <li>
                      <strong>Ручной режим</strong> — только просмотр сообщений
                      без автоответов
                    </li>
                  </ul>
                </div>

                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    <strong>Совет:</strong> Начните с полуавтоматического режима
                    для новых каналов, чтобы проконтролировать качество ответов
                    перед переходом на полную автоматизацию.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 7. Тарифные планы и ограничения */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-purple-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  5. Тарифные планы и ограничения
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium">Ограничения по тарифам:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      <strong>Базовый тариф</strong> — только Web-чат и Telegram
                    </li>
                    <li>
                      <strong>Стандарт и выше</strong> — все типы каналов
                    </li>
                    <li>
                      <strong>Лимиты каналов</strong> — зависят от выбранного
                      тарифа
                    </li>
                    <li>
                      <strong>Множественное подключение</strong> — для некоторых
                      типов каналов
                    </li>
                  </ul>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <div className="flex flex-col sm:flex-row sm:items-start">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-0 sm:mr-2 mb-2 sm:mb-0 flex-shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      <strong>Важно:</strong> При достижении лимита каналов для
                      подключения новых потребуется повышение тарифного плана.
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
                    Быстрое начало работы с каналами
                  </h4>
                  <ol className="text-sm text-green-700 dark:text-green-400 space-y-1 ml-4 list-decimal list-inside">
                    <li>Выберите подходящий тип канала из списка доступных</li>
                    <li>Подключите канал, заполнив необходимые настройки</li>
                    <li>
                      Создайте и настройте ассистентов во вкладке "Ассистенты"
                    </li>
                    <li>Привяжите ассистентов к каналу через настройки</li>
                    <li>Протестируйте работу автоответов</li>
                    <li>Перейдите к диалогам для мониторинга</li>
                    <li>Обучайте ассистентов на реальных примерах</li>
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
                    Лучшие практики работы с каналами
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 ml-4 list-disc list-inside">
                    <li>
                      <strong>Безопасность</strong> — храните токены и ключи API
                      в надёжном месте
                    </li>
                    <li>
                      <strong>Мониторинг</strong> — регулярно проверяйте статус
                      подключения каналов
                    </li>
                    <li>
                      <strong>Тестирование</strong> — всегда тестируйте каналы
                      после настройки
                    </li>

                    <li>
                      <strong>Оптимизация</strong> — анализируйте эффективность
                      каждого канала
                    </li>
                    <li>
                      <strong>Обновления</strong> — следите за изменениями в API
                      внешних сервисов
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
