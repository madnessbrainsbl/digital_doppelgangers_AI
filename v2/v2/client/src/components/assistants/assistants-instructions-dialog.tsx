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
  Bot,
  Plus,
  Settings,
  MessageSquare,
  TestTube2,
  FileText,
  Database,
  Trash2,
  Users,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface AssistantsInstructionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AssistantsInstructionsDialog({
  open,
  onOpenChange,
}: AssistantsInstructionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Bot className="h-6 w-6 mr-2 text-primary" />
            Инструкция по работе с ассистентами
          </DialogTitle>
          <DialogDescription>
            Полное руководство по созданию, настройке и управлению виртуальными
            ассистентами
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-8rem)]">
          <div className="space-y-6 pr-4">
            {/* Важное предупреждение */}
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-start">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-0 sm:mr-3 mb-2 sm:mb-0 flex-shrink-0" />
                <div className="space-y-3">
                  <h4 className="font-medium text-amber-800 dark:text-amber-300">
                    Важно: Для работы с ассистентами требуется подключить
                    тарифный план
                  </h4>
                  <div className="text-sm text-amber-700 dark:text-amber-400">
                    <p className="mb-2">Поддерживаются планы:</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="text-xs">Стандарт</Badge>
                      <Badge className="text-xs">Корпоративный</Badge>
                      <Badge className="text-xs">Базовый</Badge>
                    </div>
                    <p className="mt-2">
                      Тариф{" "}
                      <Badge variant="outline" className="mx-1 text-xs">
                        Бесплатный
                      </Badge>{" "}
                      не поддерживает ассистентов.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 1. Создание ассистента */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Plus className="h-5 w-5 mr-2 text-green-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  1. Создание ассистента
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Создайте своего первого виртуального ассистента для
                  автоматизации общения с клиентами:
                </p>

                {/* <div className="space-y-2">
                  <h4 className="font-medium">Назначение:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      <strong>Менеджер продаж</strong> — помощь в продажах и
                      консультации
                    </li>
                    <li>
                      <strong>Техническая поддержка</strong> — решение
                      технических вопросов
                    </li>
                    <li>
                      <strong>Консультант</strong> — общие консультации и
                      информация
                    </li>
                    <li>
                      <strong>Секретарь</strong> — запись на встречи и
                      организация
                    </li>
                  </ul>
                </div> */}

                <div className="space-y-2">
                  <h4 className="font-medium">Требования:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Уникальное название (будет видно клиентам)</li>
                    <li>Подробное описание роли и задач</li>
                    <li>Подключение к ИИ (автоматически)</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* 2. Настройка ассистента */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Settings className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  2. Настройка ассистента
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Основные настройки:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      <strong>Имя</strong> — отображается в интерфейсе
                    </li>
                    <li>
                      <strong>Описание</strong> — поведение ассистента
                    </li>
                    <li>
                      <strong>Инструкции</strong> — задачи, которые должен
                      выполнять ассистент
                    </li>
                    <li>
                      <strong>Роль</strong> — роль ассистента (в разработке)
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Дополнительные возможности:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Загрузка файлов с инструкциями и базой знаний</li>
                    <li>Настройка расписания работы (24/7 или по часам)</li>
                    <li>Подключение к различным каналам связи</li>
                    <li>Настройка автоматических действий и функций</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* 3. Управление базой знаний */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Database className="h-5 w-5 mr-2 text-purple-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">3. База знаний</h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Загружайте файлы с информацией, которую ассистент должен
                  знать:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Поддерживаемые форматы:</h4>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        PDF
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        DOCX
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        TXT
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        CSV
                      </Badge>
                    </div>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                      <li>PDF — документы, инструкции, прайс-листы</li>
                      <li>DOCX — текстовые документы, регламенты</li>
                      <li>TXT — простые текстовые файлы</li>
                      <li>CSV — таблицы с данными</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Рекомендации:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Файлы до 20 МБ каждый</li>
                    <li>Четкая структура информации</li>
                    <li>Актуальные данные без противоречий</li>
                    <li>Удаление устаревших файлов</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* 4. Тестирование */}
            <div className="space-y-4">
              <div className="flex items-center">
                <TestTube2 className="h-5 w-5 mr-2 text-orange-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  4. Тестирование ассистента
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Протестируйте работу ассистента перед запуском в эксплуатацию:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Возможности тестирования:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Проведение тестовых диалогов</li>
                    <li>Проверка качества ответов</li>
                    <li>Исправление неточных ответов</li>
                    <li>Обучение на основе исправлений</li>
                    <li>Экспорт истории тестирования</li>
                  </ul>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    <strong>Совет:</strong> Протестируйте разные сценарии
                    общения, включая сложные и нестандартные вопросы клиентов.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 5. Рабочие диалоги */}
            <div className="space-y-4">
              <div className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-green-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">5. Рабочие диалоги</h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Реальное общение ассистента с клиентами через различные
                  каналы:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Доступные каналы:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Веб-чат на сайте</li>
                    <li>Telegram-боты</li>
                    <li>VKontakte сообщества</li>
                    <li>Avito Business</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Мониторинг:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Просмотр всех диалогов в реальном времени</li>
                    <li>Возможность вмешательства оператора</li>
                    <li>Анализ качества обслуживания</li>
                    <li>Статистика работы ассистента</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* 6. Обучение и улучшение */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-indigo-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  6. Обучение и улучшение
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Постоянно улучшайте качество работы ассистента:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Методы обучения:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Исправление ответов в тестовом режиме</li>
                    <li>Корректировка ответов в рабочих диалогах</li>
                    <li>Добавление новых файлов базы знаний</li>
                    <li>Обновление инструкций и правил</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Аналитика:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Статистика качества ответов</li>
                    <li>Частые вопросы клиентов</li>
                    <li>Время ответа ассистента</li>
                    <li>Удовлетворенность клиентов</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* 7. Управление ассистентами */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-red-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  7. Управление ассистентами
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium">Действия с ассистентами:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      <Settings className="h-4 w-4 inline mr-1" />
                      <strong>Редактирование</strong> — изменение настроек и
                      параметров
                    </li>
                    <li>
                      <MessageSquare className="h-4 w-4 inline mr-1" />
                      <strong>Диалоги</strong> — просмотр и управление беседами
                    </li>
                    <li>
                      <TestTube2 className="h-4 w-4 inline mr-1" />
                      <strong>Тестирование</strong> — проверка работы ассистента
                    </li>
                    <li>
                      <Trash2 className="h-4 w-4 inline mr-1" />
                      <strong>Удаление</strong> — полное удаление ассистента
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Лимиты тарифных планов:</h4>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs">
                        Базовый
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Стандарт
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Корпоративный
                      </Badge>
                    </div>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                      <li>Базовый — 1 ассистент</li>
                      <li>Стандарт — до 5 ассистентов</li>
                      <li>Корпоративный — безлимитные ассистенты</li>
                    </ul>
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
                    Быстрое начало работы
                  </h4>
                  <ol className="text-sm text-green-700 dark:text-green-400 space-y-1 ml-4 list-decimal list-inside">
                    <li>Нажмите кнопку "Создать ассистента"</li>
                    <li>Заполните название</li>
                    <li>Добавьте описание задач ассистента</li>
                    <li>Загрузите файлы с базой знаний (необязательно)</li>
                    <li>Протестируйте работу в тестовом режиме</li>
                    <li>Подключите к нужным каналам связи</li>
                    <li>Запустите в работу!</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Лучшие практики */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-start">
                <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-0 sm:mr-3 mb-2 sm:mb-0 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                    Лучшие практики работы с ассистентами
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 ml-4 list-disc list-inside">
                    <li>
                      <strong>Четкие инструкции:</strong> детально описывайте
                      роли и задачи ассистентов
                    </li>
                    <li>
                      <strong>Актуальная база знаний:</strong> регулярно
                      обновляйте файлы с информацией
                    </li>
                    <li>
                      <strong>Тестирование:</strong> всегда проверяйте работу
                      перед запуском
                    </li>
                    <li>
                      <strong>Мониторинг:</strong> следите за качеством ответов
                      в диалогах
                    </li>
                    <li>
                      <strong>Обучение:</strong> исправляйте ошибки и улучшайте
                      ответы
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
