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
  BarChart3,
  Activity,
  TrendingUp,
  RefreshCw,
  Calendar,
  Clock,
  Zap,
  Target,
} from "lucide-react";

interface DashboardInstructionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DashboardInstructionsDialog({
  open,
  onOpenChange,
}: DashboardInstructionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <BarChart3 className="h-6 w-6 mr-2 text-primary" />
            Инструкция по панели управления
          </DialogTitle>
          <DialogDescription>
            Полное руководство по работе с дашбордом: метрики, аналитика и
            ключевые показатели
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-8rem)]">
          <div className="space-y-6 p-1">
            {/* Важное предупреждение */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-start">
                <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-0 sm:mr-3 mb-2 sm:mb-0 flex-shrink-0" />
                <div className="space-y-3">
                  <h4 className="font-medium text-blue-800 dark:text-blue-300">
                    Добро пожаловать в панель управления!
                  </h4>
                  <div className="text-sm text-blue-700 dark:text-blue-400">
                    <p className="mb-2">
                      Здесь вы найдете всю важную информацию о работе ваших
                      ассистентов:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="text-xs">Статистика диалогов</Badge>
                      <Badge className="text-xs">
                        Активность пользователей
                      </Badge>
                      <Badge className="text-xs">
                        Метрики производительности
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 1. Статистика и аналитика */}
            <div className="space-y-4">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  1. Статистика и аналитика
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Основные показатели работы ваших ассистентов за выбранный
                  период:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Ключевые метрики:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      <strong>Активных диалогов</strong> — количество диалогов,
                      в которых были сообщения за выбранный период времени
                    </li>
                    <li>
                      <strong>Всего сообщений</strong> — количество сообщений от
                      ассистентов
                    </li>
                    <li>
                      <strong>Среднее время ответа</strong> — скорость реакции
                      ассистентов
                    </li>
                    <li>
                      <strong>Успешность диалогов</strong> — процент успешно
                      завершенных диалогов
                    </li>
                  </ul>
                </div>

                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    <strong>Совет:</strong> Следите за временем ответа и
                    успешностью диалогов — это ключевые показатели качества
                    обслуживания клиентов.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 2. Активность диалогов */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  2. Активность диалогов
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  График показывает активность ваших ассистентов по времени:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Периоды отслеживания:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      <strong>За день</strong> — активность по часам
                      (00:00-23:00)
                    </li>
                    <li>
                      <strong>За неделю</strong> — активность по дням недели
                    </li>
                    <li>
                      <strong>За месяц</strong> — активность по неделям
                    </li>
                    <li>
                      <strong>За год</strong> — активность по месяцам
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Что отображается:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Количество новых диалогов</li>
                    <li>Пики активности клиентов</li>
                    <li>Загруженность ассистентов</li>
                    <li>Тренды по времени</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* 3. Недавняя активность */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-purple-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  3. Недавняя активность
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Список последних действий в системе:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Типы активности:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Создание новых ассистентов</li>
                    <li>Изменение настроек</li>
                    <li>Загрузка файлов в базу знаний</li>
                    <li>Подключение каналов связи</li>
                    <li>Обновление конфигураций</li>
                  </ul>
                </div>

                <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                  <p className="text-sm text-purple-700 dark:text-purple-400">
                    <strong>Информация:</strong> Здесь отображаются только ваши
                    личные действия. Журнал помогает отслеживать изменения в
                    системе.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 4. Управление периодами */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-orange-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">4. Выбор периода</h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Используйте селектор периода для анализа данных:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Доступные периоды:</h4>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        За день
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        За неделю
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        За месяц
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        За год
                      </Badge>
                    </div>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                      <li>
                        <strong>За день</strong> — детальный анализ по часам
                      </li>
                      <li>
                        <strong>За неделю</strong> — недельная динамика (по
                        умолчанию)
                      </li>
                      <li>
                        <strong>За месяц</strong> — месячные тренды
                      </li>
                      <li>
                        <strong>За год</strong> — годовая статистика
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* 5. Обновление данных */}
            <div className="space-y-4">
              <div className="flex items-center">
                <RefreshCw className="h-5 w-5 mr-2 text-indigo-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">5. Обновление метрик</h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Контролируйте актуальность отображаемых данных:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Автоматическое обновление:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Данные кешируются для быстрой загрузки</li>
                    <li>Автоматическое обновление каждые 5 минут</li>
                    <li>Обновление при переключении периодов</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Ручное обновление:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Нажмите кнопку "Обновить метрики"</li>
                    <li>Подождите завершения загрузки данных</li>
                    <li>Все блоки обновятся одновременно</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* 6. Быстрые действия */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Zap className="h-5 w-5 mr-2 text-yellow-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">6. Быстрые действия</h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium">Доступные действия:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      <strong>Создать ассистента</strong> — быстрый переход к
                      созданию
                    </li>
                    <li>
                      <strong>Загрузить файл</strong> — добавление в базу знаний
                    </li>
                    <li>
                      <strong>Просмотр презентации</strong> — обучающее видео
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* 7. Понимание данных */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-red-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  7. Интерпретация данных
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium">На что обращать внимание:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      <strong>Рост диалогов</strong> — показатель популярности
                      сервиса
                    </li>
                    <li>
                      <strong>Время ответа</strong> — влияет на
                      удовлетворенность клиентов
                    </li>
                    <li>
                      <strong>Успешность</strong> — качество решения задач
                      ассистентами
                    </li>
                    <li>
                      <strong>Пики активности</strong> — время наибольшей
                      нагрузки
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Проблемные сигналы:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Длительное время ответа</li>
                    <li>Низкая успешность диалогов (менее 70%)</li>
                    <li>Резкое снижение количества диалогов</li>
                    <li>Отсутствие активности в рабочее время</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* Быстрое начало работы */}
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-start">
                <Zap className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 mr-0 sm:mr-3 mb-2 sm:mb-0 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">
                    Быстрый старт с дашбордом
                  </h4>
                  <ol className="text-sm text-green-700 dark:text-green-400 space-y-1 ml-4 list-decimal list-inside">
                    <li>Выберите нужный период анализа</li>
                    <li>Изучите ключевые метрики в верхних карточках</li>
                    <li>Проанализируйте график активности диалогов</li>
                    <li>Просмотрите недавнюю активность системы</li>
                    <li>При необходимости обновите данные</li>
                    <li>
                      Используйте данные для оптимизации работы ассистентов
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
