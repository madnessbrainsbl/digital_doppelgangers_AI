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
  MessageSquare,
  Bot,
  Tags,
  Mail,
  TrendingUp,
  Calendar,
  Users,
  Target,
  Settings,
  Filter,
  Eye,
  CheckCircle,
  AlertTriangle,
  Zap,
  PieChart,
} from "lucide-react";

interface AnalyticsInstructionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AnalyticsInstructionsDialog({
  open,
  onOpenChange,
}: AnalyticsInstructionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <BarChart3 className="h-6 w-6 mr-2 text-primary" />
            Инструкция по работе с аналитикой
          </DialogTitle>
          <DialogDescription>
            Полное руководство по всем разделам аналитики и интерпретации данных
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-8rem)]">
          <div className="space-y-6 pr-4">
            {/* Важная информация */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-start">
                <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-0 sm:mr-3 mb-2 sm:mb-0 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-300">
                    Что такое аналитика
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                    Аналитика — это центр статистики и показателей эффективности
                    ваших ассистентов. Здесь вы можете отслеживать диалоги,
                    успешность ответов, популярные темы и результаты рассылок.
                  </p>
                </div>
              </div>
            </div>

            {/* 1. Вкладка "Обзор" */}
            <div className="space-y-4">
              <div className="flex items-center">
                <PieChart className="h-5 w-5 mr-2 text-green-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">1. Вкладка "Обзор"</h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Общий обзор ключевых метрик и показателей вашего аккаунта:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Основные метрики:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      <strong>Всего диалогов</strong> — общее количество
                      диалогов за период с динамикой изменений
                    </li>
                    <li>
                      <strong>Среднее время ответа</strong> — как быстро ваши
                      ассистенты отвечают клиентам
                    </li>
                    <li>
                      <strong>Успешность ответов</strong> — процент диалогов,
                      завершенных успешно
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">График активности диалогов:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Визуализация количества диалогов по дням</li>
                    <li>Зеленые столбики показывают интенсивность работы</li>
                    <li>Tooltip при наведении показывает точное количество</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Топ-5 тем:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Самые популярные темы обращений клиентов</li>
                    <li>Процентное соотношение каждой темы</li>
                    <li>Помогает понять основные потребности клиентов</li>
                  </ul>
                </div>

                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    <strong>Совет:</strong> Обращайте внимание на сравнения с
                    предыдущими периодами — красные показатели указывают на
                    снижение, зеленые на рост метрик.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 2. Вкладка "Диалоги" */}
            <div className="space-y-4">
              <div className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">2. Вкладка "Диалоги"</h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Детальная статистика по всем диалогам с клиентами:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Статистика диалогов:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>График количества диалогов по дням с детализацией</li>
                    <li>Фильтрация по периодам: неделя, месяц, год</li>
                    <li>Интерактивные подсказки с точными цифрами</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Статусы диалогов:</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs bg-green-50">
                      В процессе
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-blue-50">
                      Завершен
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-red-50">
                      Ошибка
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* 3. Вкладка "Ассистенты" */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Bot className="h-5 w-5 mr-2 text-purple-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  3. Вкладка "Ассистенты"
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Анализ эффективности работы каждого ассистента:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Рейтинг ассистентов:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      Список всех ваших ассистентов с показателями эффективности
                    </li>
                    <li>Количество обработанных диалогов каждым ассистентом</li>
                    <li>Процент успешных ответов для каждого ассистента</li>
                    <li>Среднее время ответа по ассистентам</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Анализ производительности:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Сравнение эффективности разных ассистентов</li>
                    <li>Выявление лучших и требующих доработки ассистентов</li>
                    <li>Рекомендации по улучшению настроек</li>
                  </ul>
                </div>

                <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                  <p className="text-sm text-purple-700 dark:text-purple-400">
                    <strong>Совет:</strong> Обращайте внимание на ассистентов с
                    низкой успешностью — возможно, им требуется дополнительная
                    настройка или обновление базы знаний.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 4. Вкладка "Темы" */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Tags className="h-5 w-5 mr-2 text-orange-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">4. Вкладка "Темы"</h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Анализ тематики обращений клиентов:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Статистика тем:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>График популярности тем по времени</li>
                    <li>Топ самых обсуждаемых вопросов</li>
                    <li>Динамика изменения интереса к темам</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Анализ трендов:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Выявление растущих и снижающихся тем</li>
                    <li>Сезонные колебания интереса к темам</li>
                    <li>Новые темы, появившиеся в текущем периоде</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Практическое применение:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Определение популярных продуктов или услуг</li>
                    <li>Планирование контента для базы знаний</li>
                    <li>Подготовка ассистентов к частым вопросам</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* 5. Вкладка "Рассылки" */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-indigo-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">5. Вкладка "Рассылки"</h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Аналитика по email и SMS рассылкам:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">График статистики рассылок:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      <strong>Отправлено</strong> (синий) — общее количество
                      отправленных сообщений
                    </li>
                    <li>
                      <strong>Успешно</strong> (зеленый) — успешно доставленные
                      сообщения
                    </li>
                    <li>
                      <strong>Ошибки</strong> (оранжевый) — неудачные отправки
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Список рассылок:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Полная история всех рассылок с детализацией</li>
                    <li>Статус каждой рассылки и процент успешности</li>
                    <li>Фильтрация по периодам для анализа эффективности</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Детали рассылки:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      Полная информация о каждой рассылке при клике "Подробнее"
                    </li>
                    <li>Количество получателей и успешных отправок</li>
                    <li>Даты создания и отправки рассылки</li>
                    <li>Информация об ошибках доставки</li>
                  </ul>
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3">
                  <p className="text-sm text-indigo-700 dark:text-indigo-400">
                    <strong>Совет:</strong> Следите за процентом успешности
                    рассылок — высокий процент ошибок может указывать на
                    проблемы с контактными данными.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 6. Фильтрация и периоды */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Filter className="h-5 w-5 mr-2 text-teal-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  6. Фильтрация по периодам
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Все вкладки поддерживают фильтрацию данных по временным
                  периодам:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Доступные периоды:</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      За неделю
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      За месяц
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      За год
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      За всё время
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Применение фильтров:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Все графики и таблицы обновляются автоматически</li>
                    <li>
                      Сравнения показываются относительно предыдущего периода
                    </li>
                    <li>
                      Пустые периоды отображаются с соответствующим сообщением
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Интерпретация данных:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>🔴 Красные индикаторы — снижение показателей</li>
                    <li>🟢 Зеленые индикаторы — рост показателей</li>
                    <li>⚪ Серые индикаторы — отсутствие изменений</li>
                  </ul>
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
                    Быстрое начало работы с аналитикой
                  </h4>
                  <ol className="text-sm text-green-700 dark:text-green-400 space-y-1 ml-4 list-decimal list-inside">
                    <li>
                      Начните с вкладки "Обзор" для общего понимания ситуации
                    </li>
                    <li>Проверьте популярные темы в разделе "Темы"</li>
                    <li>
                      Оцените эффективность ассистентов в соответствующей
                      вкладке
                    </li>
                    <li>Изучите историю диалогов для понимания активности</li>
                    <li>Проанализируйте результаты рассылок</li>
                    <li>Используйте фильтры периодов для детального анализа</li>
                    <li>Регулярно мониторьте изменения показателей</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Предупреждения */}
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-start">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-0 sm:mr-2 mb-2 sm:mb-0 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-2">
                    На что обратить внимание
                  </h4>
                  <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1 ml-4 list-disc list-inside">
                    <li>Данные обновляются в реальном времени</li>
                    <li>
                      Сравнения показываются относительно аналогичного
                      предыдущего периода
                    </li>
                    <li>Пустые периоды означают отсутствие активности</li>
                    <li>
                      Для получения точной статистики дождитесь окончания
                      текущего периода
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Лучшие практики */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-start">
                <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-0 sm:mr-3 mb-2 sm:mb-0 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                    Лучшие практики работы с аналитикой
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 ml-4 list-disc list-inside">
                    <li>
                      <strong>Регулярный мониторинг</strong> — проверяйте
                      аналитику ежедневно для выявления трендов
                    </li>
                    <li>
                      <strong>Внимание к изменениям</strong> — обращайте
                      внимание на резкие изменения метрик
                    </li>
                    <li>
                      <strong>Сравнение периодов</strong> — сравнивайте
                      показатели разных периодов
                    </li>
                    <li>
                      <strong>Оптимизация ассистентов</strong> — улучшайте
                      ассистентов с низкой эффективностью
                    </li>
                    <li>
                      <strong>Развитие контента</strong> — добавляйте контент по
                      популярным темам
                    </li>
                    <li>
                      <strong>Корректировка стратегии</strong> — корректируйте
                      стратегию рассылок на основе статистики
                    </li>
                    <li>
                      <strong>Стратегическое планирование</strong> — используйте
                      годовые отчеты для планирования
                    </li>
                    <li>
                      <strong>Сезонный анализ</strong> — выявляйте сезонные
                      паттерны в обращениях
                    </li>
                    <li>
                      <strong>Развитие на основе трендов</strong> — планируйте
                      развитие ассистентов на основе трендов
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
