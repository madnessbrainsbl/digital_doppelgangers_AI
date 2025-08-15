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
  MessageSquare,
  Monitor,
  Smartphone,
  Edit,
  Eye,
  ArrowLeftRight,
  AlertTriangle,
  CheckCircle,
  Zap,
  Target,
} from "lucide-react";

interface CommunicationsInstructionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CommunicationsInstructionsDialog({
  open,
  onOpenChange,
}: CommunicationsInstructionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <MessageSquare className="h-6 w-6 mr-2 text-primary" />
            Инструкция по работе с коммуникациями
          </DialogTitle>
          <DialogDescription>
            Полное руководство по управлению диалогами и общением с клиентами
            через различные каналы связи
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-8rem)]">
          <div className="space-y-6 pr-4">
            {/* Важная информация */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-start">
                <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-0 sm:mr-3 mb-2 sm:mb-0 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-300">
                    Что такое коммуникации
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                    Центр управления всеми диалогами с клиентами. Здесь вы
                    можете просматривать переписки, отвечать на сообщения,
                    обучать ассистентов и контролировать качество обслуживания
                    через все подключённые каналы связи.
                  </p>
                </div>
              </div>
            </div>

            {/* 1. Каналы связи */}
            <div className="space-y-4">
              <div className="flex items-center">
                <ArrowLeftRight className="h-5 w-5 mr-2 text-green-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">1. Каналы связи</h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Управляйте различными способами общения с клиентами:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Доступные каналы:</h4>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        VK
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Avito
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Web-чат
                      </Badge>
                    </div>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                      <li>
                        <strong>VK Сообщества</strong> — общение через группы
                        ВКонтакте
                      </li>

                      <li>
                        <strong>Avito Business</strong> — сообщения с площадки
                        Авито
                      </li>
                      <li>
                        <strong>Веб-чат</strong> — чат на вашем сайте
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Селектор каналов:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Выберите канал из верхней панели</li>
                    <li>Просматривайте статус подключения каждого канала</li>
                    <li>Переключайтесь между каналами одним кликом</li>
                    <li>Видите количество непрочитанных сообщений</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* 2. Просмотр диалогов */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Eye className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">2. Просмотр диалогов</h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Эффективно работайте с входящими сообщениями и диалогами:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Интерфейс диалогов:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      <strong>Левая панель</strong> — список всех диалогов и
                      каналов
                    </li>
                    <li>
                      <strong>Правая область</strong> — просмотр выбранного
                      диалога
                    </li>
                    <li>
                      <strong>Поиск</strong> — быстрый поиск по диалогам и
                      каналам
                    </li>
                    <li>
                      <strong>Фильтры</strong> — сортировка по статусу и типу
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Работа с сообщениями:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Просматривайте историю переписки</li>
                    <li>Отслеживайте ответы ассистентов</li>
                    <li>Помечайте важные сообщения</li>
                    <li>Переключайтесь между диалогами</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* 3. Типы интерфейсов */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Monitor className="h-5 w-5 mr-2 text-purple-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">3. Типы интерфейсов</h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Каждый канал имеет специализированный интерфейс:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">
                    Специализированные интерфейсы:
                  </h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      <strong>VK Message Viewer</strong> — просмотр сообщений
                      ВКонтакте с полной историей
                    </li>
                    <li>
                      <strong>Avito Chat Interface</strong> — интерфейс для
                      работы с сообщениями Авито
                    </li>
                    <li>
                      <strong>Web Chat Interface</strong> — управление чатом на
                      сайте
                    </li>
                    <li>
                      <strong>Chat Interface</strong> — универсальный интерфейс
                      для других каналов
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Адаптивность:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      <strong>Десктопная версия</strong> — полный функционал с
                      боковой панелью
                    </li>
                    <li>
                      <strong>Мобильная версия</strong> — адаптированный
                      интерфейс для телефонов
                    </li>
                    <li>
                      <strong>Автоматическое переключение</strong> — в
                      зависимости от размера экрана
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* 4. Обучение ассистентов */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Edit className="h-5 w-5 mr-2 text-orange-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  4. Обучение ассистентов
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Улучшайте качество ответов ваших ассистентов прямо в диалогах:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Функция исправления:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Нажмите на сообщение ассистента для редактирования</li>
                    <li>Введите правильный ответ вместо неточного</li>
                    <li>Ассистент запомнит исправление для похожих ситуаций</li>
                    <li>Тренировка происходит в реальном времени</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">База памяти:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Все исправления сохраняются в базе памяти</li>
                    <li>Ассистенты учатся на ваших правках</li>
                    <li>Качество ответов постоянно улучшается</li>
                    <li>Возможность просмотра истории обучения</li>
                  </ul>
                </div>

                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    <strong>Совет:</strong> Регулярно проверяйте ответы
                    ассистентов и исправляйте неточности — это значительно
                    повышает качество обслуживания клиентов.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 5. Мобильная версия */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Smartphone className="h-5 w-5 mr-2 text-indigo-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">5. Мобильная версия</h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Управляйте коммуникациями на мобильных устройствах:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">
                    Особенности мобильного интерфейса:
                  </h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Компактная навигация с переключением между экранами</li>
                    <li>Оптимизированный список диалогов</li>
                    <li>Удобный ввод сообщений на сенсорном экране</li>
                    <li>Быстрый доступ к основным функциям</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Навигация:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Свайпы для переключения между диалогами</li>
                    <li>Кнопка "Назад" для возврата к списку</li>
                    <li>Сенсорные элементы увеличенного размера</li>
                    <li>Автоматическая адаптация под размер экрана</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* 6. Управление и мониторинг */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-red-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  6. Управление и мониторинг
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium">Контроль качества:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Мониторинг всех диалогов в реальном времени</li>
                    <li>Отслеживание времени ответа ассистентов</li>
                    <li>Анализ удовлетворённости клиентов</li>
                    <li>Статистика по каналам и ассистентам</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Действия оператора:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Вмешательство в диалог при необходимости</li>
                    <li>Передача сложных вопросов живому оператору</li>
                    <li>Создание новых диалогов</li>
                    <li>Экспорт переписок для анализа</li>
                  </ul>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <div className="flex flex-col sm:flex-row sm:items-start">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-0 sm:mr-2 mb-2 sm:mb-0 flex-shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      <strong>Важно:</strong> Регулярно проверяйте диалоги —
                      особенно в первые дни работы ассистентов, чтобы быстро
                      выявить и исправить проблемы.
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
                    Быстрое начало работы с коммуникациями
                  </h4>
                  <ol className="text-sm text-green-700 dark:text-green-400 space-y-1 ml-4 list-decimal list-inside">
                    <li>Подключите каналы во вкладке "Каналы"</li>
                    <li>
                      Настройте ассистентов для автоответов во вкладке
                      "Ассистенты"
                    </li>
                    <li>Выберите канал из верхней панели</li>
                    <li>Просмотрите входящие диалоги в левой панели</li>
                    <li>Кликните на диалог для просмотра переписки</li>
                    <li>При необходимости исправьте ответы ассистентов</li>
                    <li>Следите за качеством обслуживания клиентов</li>
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
                    Лучшие практики работы с коммуникациями
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 ml-4 list-disc list-inside">
                    <li>
                      <strong>Регулярный мониторинг</strong> — проверяйте
                      диалоги ежедневно
                    </li>
                    <li>
                      <strong>Быстрое реагирование</strong> — отвечайте на
                      важные сообщения оперативно
                    </li>
                    <li>
                      <strong>Обучение ассистентов</strong> — постоянно
                      улучшайте качество ответов
                    </li>
                    <li>
                      <strong>Организация каналов</strong> — правильно настройте
                      все каналы связи
                    </li>
                    <li>
                      <strong>Мобильный доступ</strong> — используйте мобильную
                      версию для удалённой работы
                    </li>
                    <li>
                      <strong>Анализ статистики</strong> — изучайте
                      эффективность каждого канала
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
