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
  CreditCard,
  Package,
  BarChart3,
  History,
  ShoppingCart,
  Timer,
  CheckCircle,
  AlertTriangle,
  Zap,
  TrendingUp,
  Users,
  MessageSquare,
  Database,
  Phone,
} from "lucide-react";

interface BillingInstructionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BillingInstructionsDialog({
  open,
  onOpenChange,
}: BillingInstructionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <CreditCard className="h-6 w-6 mr-2 text-primary" />
            Инструкция по тарифам и биллингу
          </DialogTitle>
          <DialogDescription>
            Полное руководство по выбору тарифов, управлению подпиской и
            контролю расходов
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-8rem)]">
          <div className="space-y-6 pr-4">
            {/* Важная информация */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-start">
                <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-0 sm:mr-3 mb-2 sm:mb-0 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-300">
                    Что такое страница тарифов
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                    Центр управления вашей подпиской и расходами. Здесь вы
                    можете выбрать подходящий тариф, отслеживать использование
                    ресурсов, управлять платежами и покупать дополнительные
                    опции для расширения возможностей сервиса.
                  </p>
                </div>
              </div>
            </div>

            {/* 1. Тарифные планы */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Package className="h-5 w-5 mr-2 text-green-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  1. Выбор тарифного плана
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Выбор подходящего тарифа — основа эффективного использования
                  сервиса:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Доступные тарифы:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      <strong>Базовый (2 900₽/мес)</strong> — 1 ассистент, 1000
                      сообщений, базовые каналы
                    </li>
                    <li>
                      <strong>Стандарт (6 900₽/мес)</strong> — 5 ассистентов,
                      5000 сообщений, все каналы
                    </li>
                    <li>
                      <strong>Корпоративный (14 900₽/мес)</strong> —
                      неограниченно ассистентов, 20000 сообщений
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Как выбрать тариф:</h4>
                  <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Оцените ваши потребности в сообщениях и ассистентах</li>
                    <li>Сравните возможности каждого тарифа</li>
                    <li>Нажмите "Выбрать" на подходящем тарифе</li>
                    <li>Подтвердите выбор в диалоговом окне</li>
                    <li>Пополните баланс для оплаты тарифа</li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Особенности тарифов:</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs bg-green-50">
                      <Users className="h-3 w-3 mr-1" />
                      Разное количество пользователей
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-blue-50">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Лимиты сообщений
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-purple-50">
                      <Database className="h-3 w-3 mr-1" />
                      Объем базы знаний
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-orange-50">
                      <Phone className="h-3 w-3 mr-1" />
                      Минуты звонков
                    </Badge>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    <strong>Совет:</strong> Начните с Базового тарифа, чтобы
                    оценить возможности сервиса, а затем переходите на более
                    продвинутые планы.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 2. Пробный период */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Timer className="h-5 w-5 mr-2 text-orange-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">2. Пробный период</h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Бесплатный доступ к возможностям сервиса на 14 дней:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Условия пробного периода:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>14 дней бесплатного использования Базового тарифа</li>
                    <li>Доступ ко всем функциям тарифа без ограничений</li>
                    <li>Не требует пополнения баланса</li>
                    <li>Доступен только новым пользователям</li>
                    <li>Можно активировать только один раз</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Как активировать:</h4>
                  <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      Найдите кнопку "Пробный период" на карточке Базового
                      тарифа
                    </li>
                    <li>Нажмите "Активировать пробный период"</li>
                    <li>Подтвердите активацию</li>
                    <li>Начинайте использовать все возможности сервиса</li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">
                    После окончания пробного периода:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs bg-orange-50">
                      Автоматическое отключение
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-blue-50">
                      Сохранение данных
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-green-50">
                      Выбор платного тарифа
                    </Badge>
                  </div>
                </div>

                <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                  <p className="text-sm text-orange-700 dark:text-orange-400">
                    <strong>Важно:</strong> Пробный период поможет вам понять,
                    какой тариф лучше подойдет для ваших задач в дальнейшем.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 3. Мониторинг использования */}
            <div className="space-y-4">
              <div className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-purple-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  3. Мониторинг использования ресурсов
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Отслеживание потребления ресурсов для оптимизации расходов:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Отслеживаемые ресурсы:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      <strong>Сообщения</strong> — количество обработанных
                      сообщений ассистентами
                    </li>
                    <li>
                      <strong>База знаний</strong> — объем загруженных файлов и
                      документов
                    </li>
                    <li>
                      <strong>Ассистенты</strong> — количество созданных
                      виртуальных помощников
                    </li>
                    <li>
                      <strong>Голосовые звонки</strong> — минуты использования
                      голосовых функций
                    </li>
                    <li>
                      <strong>Каналы связи</strong> — количество подключенных
                      интеграций
                    </li>
                    <li>
                      <strong>Пользователи</strong> — количество пользователей в
                      команде
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Как читать прогресс-бары:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Прогресс-бар заполняется помере использования</li>
                    <li>Дата сброса лимитов указана под прогресс-баром</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Оптимизация использования:</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs bg-purple-50">
                      Мониторинг лимитов
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-blue-50">
                      Планирование нагрузки
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-green-50">
                      Своевременный апгрейд
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-orange-50">
                      Покупка дополнений
                    </Badge>
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                  <p className="text-sm text-purple-700 dark:text-purple-400">
                    <strong>Совет:</strong> Регулярно проверяйте использование
                    ресурсов, чтобы не достичь лимитов в критический момент.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 4. Дополнительные опции */}
            <div className="space-y-4">
              <div className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2 text-cyan-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  4. Дополнительные опции
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Расширение возможностей без смены тарифа:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Доступные дополнения:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      <strong>Дополнительные сообщения (990₽)</strong> — +1000
                      сообщений
                    </li>
                    <li>
                      <strong>Дополнительное место (490₽)</strong> — +1 ГБ базы
                      знаний
                    </li>
                    <li>
                      <strong>Минуты звонков (690₽)</strong> — +100 минут
                      голосовых звонков
                    </li>
                    <li>
                      <strong>Дополнительный пользователь (590₽)</strong> — +1
                      место в команде
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Когда покупать дополнения:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Когда приближаетесь к лимитам текущего тарифа</li>
                    <li>Для кратковременного увеличения возможностей</li>
                    <li>Если смена тарифа экономически нецелесообразна</li>
                    <li>При сезонных всплесках активности</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Процесс покупки:</h4>
                  <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      Выберите нужное дополнение в разделе "Дополнительные
                      опции"
                    </li>
                    <li>Нажмите кнопку "Купить"</li>
                    <li>Подтвердите покупку</li>
                    <li>Дополнение активируется автоматически</li>
                  </ol>
                </div>

                <div className="bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 rounded-lg p-3">
                  <p className="text-sm text-cyan-700 dark:text-cyan-400">
                    <strong>Экономия:</strong> Иногда выгоднее перейти на более
                    высокий тариф, чем покупать много дополнений. Сравните
                    стоимость!
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 5. История платежей */}
            <div className="space-y-4">
              <div className="flex items-center">
                <History className="h-5 w-5 mr-2 text-indigo-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  5. Управление платежами
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Контроль расходов и управление способами оплаты:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Информация о платежах:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Дата и время совершения платежа</li>
                    <li>Номер счета для идентификации</li>
                    <li>Сумма платежа в рублях</li>
                    <li>Статус обработки (оплачен, в обработке, отменен)</li>
                    <li>Описание услуги или тарифа</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Пополнение баланса:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Используйте карточку "Пополнить баланс"</li>
                    <li>Введите сумму пополнения</li>
                    <li>Выберите способ оплаты</li>
                    <li>Подтвердите платеж</li>
                    <li>Средства поступят на баланс после обработки</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Статусы платежей:</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs bg-green-50">
                      Оплачен — успешно обработан
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-yellow-50">
                      В обработке — ожидает подтверждения
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-red-50">
                      Отменен — не прошел обработку
                    </Badge>
                  </div>
                </div>

                {/* <div className="space-y-2">
                  <h4 className="font-medium">Дополнительные функции:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Экспорт истории платежей в файл</li>
                    <li>Скачивание чеков и счетов</li>
                    <li>Изменение способа оплаты</li>
                    <li>Настройка автоплатежей</li>
                  </ul>
                </div> */}

                <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3">
                  <p className="text-sm text-indigo-700 dark:text-indigo-400">
                    <strong>Контроль:</strong> Регулярно проверяйте историю
                    платежей для контроля расходов и планирования бюджета.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 6. Планирование и оптимизация */}
            <div className="space-y-4">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-red-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  6. Планирование расходов
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Стратегии экономии и эффективного использования ресурсов:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Анализ потребностей:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Изучите статистику использования за прошлые периоды</li>
                    <li>Определите пиковые и спокойные периоды активности</li>
                    <li>Оцените реальные потребности в каждом ресурсе</li>
                    <li>Спрогнозируйте рост использования</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Стратегии экономии:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Начинайте с более низкого тарифа</li>
                    <li>Используйте пробный период максимально эффективно</li>
                    <li>Покупайте дополнения только при необходимости</li>
                    <li>
                      Оптимизируйте настройки ассистентов для экономии сообщений
                    </li>
                    <li>Очищайте базу знаний от неактуальных файлов</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Когда повышать тариф:</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs bg-red-50">
                      Регулярные превышения лимитов
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-orange-50">
                      Рост команды
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-blue-50">
                      Увеличение нагрузки
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-green-50">
                      Экономическая выгода
                    </Badge>
                  </div>
                </div>

                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <div className="flex flex-col sm:flex-row sm:items-start">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 mr-0 sm:mr-2 mb-2 sm:mb-0 flex-shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-400">
                      <strong>Важно:</strong> Следите за балансом и лимитами,
                      чтобы сервис не прекратил работу в самый важный момент.
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
                    Быстрый старт с тарифами
                  </h4>
                  <ol className="text-sm text-green-700 dark:text-green-400 space-y-1 ml-4 list-decimal list-inside">
                    <li>
                      Активируйте 14-дневный пробный период для изучения сервиса
                    </li>
                    <li>Создайте ассистента и протестируйте его работу</li>
                    <li>
                      Изучите раздел "Использование" для понимания потребления
                    </li>
                    <li>
                      Определите подходящий тариф на основе реального
                      использования
                    </li>
                    <li>Пополните баланс через карточку пополнения</li>
                    <li>Выберите нужный тариф и подтвердите подключение</li>
                    <li>
                      При необходимости докупайте дополнения или меняйте тариф
                    </li>
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
                    Лучшие практики управления тарифами
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 ml-4 list-disc list-inside">
                    <li>
                      <strong>Планирование бюджета</strong> — заложите расходы
                      на сервис в месячный бюджет
                    </li>
                    <li>
                      <strong>Мониторинг использования</strong> — еженедельно
                      проверяйте прогресс-бары
                    </li>
                    <li>
                      <strong>Гибкое масштабирование</strong> — корректируйте
                      тариф при изменении нагрузки
                    </li>
                    <li>
                      <strong>Оптимизация ассистентов</strong> — настраивайте их
                      для экономии ресурсов
                    </li>
                    <li>
                      <strong>Контроль расходов</strong> — анализируйте историю
                      платежей
                    </li>
                    <li>
                      <strong>Резерв средств</strong> — держите небольшой запас
                      на балансе
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
