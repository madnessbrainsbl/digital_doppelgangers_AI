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
  Send,
  Mail,
  MessageSquare,
  FileText,
  BarChart3,
  Settings,
  Upload,
  Users,
  AlertTriangle,
  CheckCircle,
  Zap,
  Target,
  Shield,
} from "lucide-react";

interface NotificationsInstructionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NotificationsInstructionsDialog({
  open,
  onOpenChange,
}: NotificationsInstructionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Send className="h-6 w-6 mr-2 text-primary" />
            Инструкция по работе с рассылками
          </DialogTitle>
          <DialogDescription>
            Полное руководство по созданию и управлению Email и SMS рассылками
            для ваших клиентов
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-8rem)]">
          <div className="space-y-6 pr-4">
            {/* Важная информация */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-start">
                <Send className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-0 sm:mr-3 mb-2 sm:mb-0 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-300">
                    Что такое рассылки
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                    Модуль рассылок позволяет отправлять массовые сообщения
                    вашим клиентам через Email и SMS каналы. Вы можете создавать
                    персонализированные кампании, использовать готовые шаблоны,
                    отслеживать статистику доставки и анализировать
                    эффективность ваших рассылок в режиме реального времени.
                  </p>
                </div>
              </div>
            </div>

            {/* 1. Создание рассылки */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-green-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">1. Создание рассылки</h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Процесс создания новой рассылки состоит из нескольких этапов:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Основные шаги:</h4>
                  <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Укажите название рассылки</li>
                    <li>Выберите тип канала (Email или SMS)</li>
                    <li>Настройте канал отправки</li>
                    <li>Добавьте получателей</li>
                    <li>Создайте текст сообщения</li>
                    <li>Отправьте рассылку</li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Поддерживаемые каналы:</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs bg-blue-50">
                      Email
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-green-50">
                      SMS
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-gray-50">
                      Telegram (скоро)
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-gray-50">
                      Viber (скоро)
                    </Badge>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <div className="flex flex-col sm:flex-row sm:items-start">
                    <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-0 sm:mr-2 mb-2 sm:mb-0 flex-shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      <strong>Предварительные требования:</strong> Для отправки
                      рассылок необходимо предварительно настроить
                      соответствующие каналы в разделе "Каналы".
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* 2. Email рассылки */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">2. Email рассылки</h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Создание и настройка массовых Email рассылок:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Настройка Email канала:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      Выберите настроенный Email канал из списка доступных
                    </li>
                    <li>
                      Убедитесь, что используется пароль приложения (не обычный
                      пароль)
                    </li>
                    <li>Проверьте настройки SMTP сервера</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Добавление получателей:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Загрузите файл .txt со списком email адресов</li>
                    <li>Каждый адрес должен быть на отдельной строке</li>
                    <li>Система автоматически проверит корректность адресов</li>
                    <li>Неверные адреса будут исключены из рассылки</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Шаблоны писем:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      <strong>Стандартный</strong> — простой и элегантный дизайн
                    </li>
                    <li>
                      <strong>Информационный</strong> — с выделенным блоком
                      информации
                    </li>
                    <li>
                      <strong>Маркетинговый</strong> — с кнопкой призыва к
                      действию
                    </li>
                  </ul>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    <strong>Совет:</strong> Используйте информационный шаблон
                    для новостей и обновлений, маркетинговый — для акций и
                    предложений.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 3. SMS рассылки */}
            <div className="space-y-4">
              <div className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-green-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">3. SMS рассылки</h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Отправка текстовых сообщений на мобильные телефоны:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Добавление номеров:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      <strong>Ручной ввод</strong> — добавляйте номера по одному
                    </li>
                    <li>
                      <strong>Загрузка файла</strong> — массовая загрузка из
                      .txt
                    </li>
                    <li>Поддерживаются российские номера в любом формате</li>
                    <li>Система автоматически приводит номера к формату +7</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Форматы номеров:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>+7 (999) 123-45-67</li>
                    <li>8 999 123 45 67</li>
                    <li>9991234567</li>
                    <li>7 999 123-45-67</li>
                  </ul>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <div className="flex flex-col sm:flex-row sm:items-start">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-0 sm:mr-2 mb-2 sm:mb-0 flex-shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      <strong>Важно:</strong> Убедитесь, что на счету
                      SMS-сервиса достаточно средств для отправки сообщений.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* 4. Загрузка файлов */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Upload className="h-5 w-5 mr-2 text-purple-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">4. Загрузка файлов</h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Требования к файлам со списками получателей:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Поддерживаемые форматы:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      <strong>.txt</strong> — обычные текстовые файлы
                    </li>
                    <li>Кодировка: UTF-8 (рекомендуется)</li>
                    <li>Максимальный размер файла: 5 МБ</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Структура файла:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Каждый адрес/номер на отдельной строке</li>
                    <li>Пустые строки будут проигнорированы</li>
                    <li>Дублирующиеся записи автоматически удалятся</li>
                    <li>Некорректные данные будут исключены</li>
                  </ul>
                </div>

                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    <strong>Пример содержимого файла:</strong>
                    <br />
                    example1@company.com
                    <br />
                    example2@company.com
                    <br />
                    +7 999 123 45 67
                    <br />8 999 123 45 68
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 5. Управление кампаниями */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-indigo-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  5. Управление кампаниями
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium">Отслеживание статуса:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      <strong>Отправлено</strong> — рассылка успешно завершена
                    </li>
                    <li>
                      <strong>В обработке</strong> — рассылка выполняется
                    </li>
                    <li>
                      <strong>Ошибка</strong> — произошла ошибка при отправке
                    </li>
                    <li>Количество успешно доставленных сообщений</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">История рассылок:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Просмотр всех созданных кампаний</li>
                    <li>Детали каждой рассылки</li>
                    <li>Используемые каналы и шаблоны</li>
                    <li>Количество получателей</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* 6. Шаблоны сообщений */}
            <div className="space-y-4">
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-orange-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">6. Шаблоны сообщений</h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Готовые шаблоны для оформления Email рассылок:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Доступные шаблоны:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      <strong>Стандартный</strong> — минималистичный дизайн для
                      любых целей
                    </li>
                    <li>
                      <strong>Информационный</strong> — для новостей,
                      обновлений, анонсов
                    </li>
                    <li>
                      <strong>Маркетинговый</strong> — для акций, скидок,
                      предложений
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Применение шаблонов:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Выберите шаблон при создании Email рассылки</li>
                    <li>Ваш текст будет автоматически оформлен</li>
                    <li>Повысится читаемость и конверсия</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* 7. Статистика и аналитика */}
            <div className="space-y-4">
              <div className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-cyan-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  7. Статистика и аналитика
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Подробная аналитика эффективности ваших рассылок:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Графики и диаграммы:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      <strong>График доставки</strong> — динамика отправки по
                      дням
                    </li>
                    <li>
                      <strong>Статистика успешности</strong> — процент
                      доставленных сообщений
                    </li>
                    <li>
                      <strong>Фильтрация по периодам</strong> — неделя, месяц,
                      год, всё время
                    </li>
                    <li>Сводная информация по всем кампаниям</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Детальная информация:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Список всех отправленных рассылок</li>
                    <li>
                      Статус каждой кампании (завершено, в процессе, ошибка)
                    </li>
                    <li>Количество получателей и процент доставки</li>
                    <li>Используемые каналы и шаблоны</li>
                    <li>Даты создания и отправки</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Мобильная версия:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Адаптивные карточки рассылок</li>
                    <li>Удобный просмотр на смартфонах</li>
                    <li>Быстрый доступ к деталям кампаний</li>
                    <li>Оптимизированная навигация</li>
                  </ul>
                </div>

                <div className="bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 rounded-lg p-3">
                  <p className="text-sm text-cyan-700 dark:text-cyan-400">
                    <strong>Совет:</strong> Регулярно анализируйте статистику
                    для оптимизации времени отправки, выбора каналов и повышения
                    эффективности рассылок.
                  </p>
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
                    Быстрое начало работы с рассылками
                  </h4>
                  <ol className="text-sm text-green-700 dark:text-green-400 space-y-1 ml-4 list-decimal list-inside">
                    <li>Настройте Email или SMS каналы в разделе "Каналы"</li>
                    <li>Перейдите в раздел "Рассылки"</li>
                    <li>Создайте новую рассылку, указав название</li>
                    <li>Выберите тип канала (Email/SMS)</li>
                    <li>Настройте канал отправки</li>
                    <li>Загрузите список получателей</li>
                    <li>Введите текст сообщения</li>
                    <li>Отправьте рассылку</li>
                    <li>Анализируйте результаты во вкладке "Статистика"</li>
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
                    Лучшие практики рассылок
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 ml-4 list-disc list-inside">
                    <li>
                      <strong>Персонализация</strong> — используйте понятные
                      темы и обращения
                    </li>
                    <li>
                      <strong>Тестирование</strong> — сначала отправьте тестовую
                      рассылку себе
                    </li>
                    <li>
                      <strong>Время отправки</strong> — выбирайте оптимальное
                      время дня
                    </li>
                    <li>
                      <strong>Качество списков</strong> — регулярно очищайте
                      базу от неактивных
                    </li>
                    <li>
                      <strong>Соблюдение законов</strong> — получайте согласие
                      на рассылки
                    </li>
                    <li>
                      <strong>Анализ результатов</strong> — изучайте статистику
                      доставки и корректируйте стратегию
                    </li>
                    <li>
                      <strong>Мониторинг эффективности</strong> — отслеживайте
                      KPI во вкладке "Статистика"
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
