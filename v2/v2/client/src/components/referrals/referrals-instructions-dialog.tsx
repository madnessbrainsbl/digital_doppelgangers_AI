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
  Users,
  UserPlus,
  Link2,
  Copy,
  DollarSign,
  CreditCard,
  BarChart3,
  Target,
  CheckCircle,
  AlertTriangle,
  Zap,
  Gift,
} from "lucide-react";

interface ReferralsInstructionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ReferralsInstructionsDialog({
  open,
  onOpenChange,
}: ReferralsInstructionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Gift className="h-6 w-6 mr-2 text-primary" />
            Инструкция по реферальной программе
          </DialogTitle>
          <DialogDescription>
            Полное руководство по участию в партнерской программе и заработку на
            рефералах
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-8rem)]">
          <div className="space-y-6 pr-4">
            {/* Важная информация */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-start">
                <Gift className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-0 sm:mr-3 mb-2 sm:mb-0 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-300">
                    Что такое реферальная программа
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                    Партнерская программа позволяет зарабатывать до 20% с
                    каждого платежа ваших рефералов. Приглашайте новых
                    пользователей по уникальной ссылке и получайте стабильный
                    пассивный доход от их активности в системе. Максимальная
                    комиссия (20%) доступна при назначении себя менеджером своих
                    рефералов.
                  </p>
                </div>
              </div>
            </div>

            {/* 1. Становление партнером */}
            <div className="space-y-4">
              <div className="flex items-center">
                <UserPlus className="h-5 w-5 mr-2 text-green-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  1. Становление партнером
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Первый шаг к заработку — получение статуса партнера:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Как стать партнером:</h4>
                  <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Нажмите кнопку "Стать партнером" на странице</li>
                    <li>
                      Система автоматически сгенерирует уникальный реферальный
                      код
                    </li>
                    <li>Ваша роль изменится на "Реферал"</li>
                    <li>Получите доступ к реферальной ссылке и статистике</li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Что дает статус партнера:</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs bg-green-50">
                      до 20% комиссия
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-blue-50">
                      Уникальная ссылка
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-purple-50">
                      Подробная статистика
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-orange-50">
                      Пассивный доход
                    </Badge>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    <strong>Важно:</strong> Партнерство бесплатно и не требует
                    вложений. Вы сразу можете начинать приглашать пользователей.
                    <br />
                    <strong>Совет:</strong> Для получения максимальной комиссии
                    (20%) обязательно назначьте себя менеджером в разделе "Моя
                    команда".
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 2. Работа с реферальной ссылкой */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Link2 className="h-5 w-5 mr-2 text-orange-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  2. Работа с реферальной ссылкой
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Ваша реферальная ссылка — главный инструмент для привлечения
                  рефералов:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Как использовать ссылку:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Копируйте ссылку кнопкой рядом с полем ввода</li>
                    <li>Делитесь ей в социальных сетях, мессенджерах, email</li>
                    <li>Добавляйте в блоги, форумы или личный сайт</li>
                    <li>Отправляйте прямо потенциальным клиентам</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Структура ссылки:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      <strong>Базовый URL:</strong> адрес регистрации на сайте
                    </li>
                    <li>
                      <strong>Параметр ref:</strong> ваш уникальный реферальный
                      код
                    </li>
                    <li>
                      <strong>Пример:</strong> https://asissto.ru/auth?ref=TROLL{" "}
                      <br />
                      (можно использовать эту ссылку для регистрации)
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Лучшие места для размещения:</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs bg-blue-50">
                      <Copy className="h-3 w-3 mr-1" />
                      Социальные сети
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-green-50">
                      Email рассылки
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-purple-50">
                      Личный блог
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-orange-50">
                      Форумы и чаты
                    </Badge>
                  </div>
                </div>

                <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                  <p className="text-sm text-orange-700 dark:text-orange-400">
                    <strong>Совет:</strong> Всегда объясняйте преимущества
                    сервиса при размещении ссылки — это повышает конверсию
                    регистраций.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 3. Отслеживание рефералов */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  3. Отслеживание рефералов
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Мониторинг активности ваших рефералов и доходов:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Информация о каждом реферале:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Имя или email пользователя</li>
                    <li>Дата присоединения к сервису</li>
                    <li>Количество пополнений баланса</li>
                    <li>Общая сумма платежей</li>
                    <li>Ваше вознаграждение с реферала</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">
                    Карточка общего вознаграждения:
                  </h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Отображается справа от реферального кода</li>
                    <li>Показывает суммарный доход от всех рефералов</li>
                    <li>Обновляется в реальном времени</li>
                    <li>Доступна только партнерам (роль "Реферал")</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Типы учитываемых платежей:</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs bg-green-50">
                      <CreditCard className="h-3 w-3 mr-1" />
                      Пополнения баланса
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-blue-50">
                      Покупка тарифов
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-purple-50">
                      Дополнительные услуги
                    </Badge>
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                  <p className="text-sm text-purple-700 dark:text-purple-400">
                    <strong>Важно:</strong> Вознаграждение начисляется только с
                    успешно обработанных платежей рефералов.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 4. Доходы и комиссии */}
            <div className="space-y-4">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-cyan-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">4. Доходы и комиссии</h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Понимание системы начислений и оптимизация доходов:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Размер комиссии:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      <strong>Обычный пользователь:</strong> 0% с платежей
                      рефералов
                    </li>
                    <li>
                      <strong>Реферал:</strong> 10% с каждого платежа
                      приглашенных
                    </li>
                    <li>
                      <strong>Реферал + менеджер:</strong> 20% при сопровождении
                      своих рефералов
                    </li>
                    <li>Начисляется автоматически при обработке платежа</li>
                    <li>Отображается в рублях в интерфейсе</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">
                    Как получить максимальную комиссию:
                  </h4>
                  <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Станьте партнером (получите статус "Реферал")</li>
                    <li>Приглашайте новых пользователей по своей ссылке</li>
                    <li>Перейдите в раздел "Моя команда"</li>
                    <li>Назначьте себя менеджером своих рефералов</li>
                    <li>Получайте 20% вместо 10% с их платежей</li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Преимущества менеджерства:</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs bg-green-50">
                      Двойная комиссия
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-blue-50">
                      Персональное сопровождение
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-purple-50">
                      Повышение лояльности
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-orange-50">
                      Долгосрочный доход
                    </Badge>
                  </div>
                </div>

                <div className="bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 rounded-lg p-3">
                  <p className="text-sm text-cyan-700 dark:text-cyan-400">
                    <strong>Примеры расчета:</strong>
                    <br />
                    • Реферал пополнил баланс на 1000₽ → вы получите 100₽ (10%)
                    <br />• Тот же реферал под вашим менеджерством → вы получите
                    200₽ (20%)
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 5. Подробная статистика */}
            <div className="space-y-4">
              <div className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-indigo-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  5. Подробная статистика
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Доступ к расширенной аналитике в разделе "Моя команда" — ключ
                  к максимизации доходов:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Что доступно в команде:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Детальная информация о каждом реферале</li>
                    <li>История всех транзакций и платежей</li>
                    <li>Временные рамки активности</li>
                    <li>
                      <strong>
                        Назначение себя менеджером для удвоения комиссии
                      </strong>
                    </li>
                    <li>Статусы платежей (обработан, в процессе, ошибка)</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Кнопка перехода:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>"Перейти к моей команде" — на карточке с кодом</li>
                    <li>
                      "Просмотреть подробную статистику" — в списке рефералов
                    </li>
                    <li>Прямой доступ ко всем функциям управления</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Дополнительные возможности:</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs bg-indigo-50">
                      Фильтрация данных
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-blue-50">
                      Экспорт отчетов
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-green-50">
                      Менеджмент команды
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-red-50">
                      Удвоение комиссий
                    </Badge>
                  </div>
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3">
                  <p className="text-sm text-indigo-700 dark:text-indigo-400">
                    <strong>Совет:</strong> Обязательно назначьте себя
                    менеджером всех своих активных рефералов, чтобы получать 20%
                    вместо 10% с их платежей!
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 6. Стратегии привлечения */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-red-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  6. Стратегии привлечения
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Эффективные способы увеличения количества рефералов:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Контент-маркетинг:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Создавайте полезный контент о возможностях сервиса</li>
                    <li>Делитесь кейсами и результатами использования</li>
                    <li>Пишите обзоры и сравнения с конкурентами</li>
                    <li>Снимайте видео-инструкции и демонстрации</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Прямые продажи:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Личные рекомендации знакомым и коллегам</li>
                    <li>Презентации возможностей сервиса</li>
                    <li>Демонстрация собственных результатов</li>
                    <li>Персональная поддержка новых пользователей</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Онлайн-каналы:</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs bg-red-50">
                      YouTube канал
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-blue-50">
                      Telegram канал
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-green-50">
                      Профильные форумы
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-purple-50">
                      Социальные сети
                    </Badge>
                  </div>
                </div>

                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <div className="flex flex-col sm:flex-row sm:items-start">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 mr-0 sm:mr-2 mb-2 sm:mb-0 flex-shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-400">
                      <strong>Важно:</strong> Всегда честно рассказывайте о
                      сервисе. Обманутые пользователи быстро уйдут и испортят
                      вашу репутацию.
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
                    Быстрый старт в реферальной программе
                  </h4>
                  <ol className="text-sm text-green-700 dark:text-green-400 space-y-1 ml-4 list-decimal list-inside">
                    <li>
                      Нажмите "Стать партнером" для получения реферального кода
                    </li>
                    <li>Скопируйте свою уникальную реферальную ссылку</li>
                    <li>
                      Поделитесь ссылкой в социальных сетях или с друзьями
                    </li>
                    <li>Отслеживайте регистрации новых пользователей</li>
                    <li>
                      <strong>
                        Перейдите в "Мою команду" и назначьте себя менеджером
                        рефералов
                      </strong>
                    </li>
                    <li>Мониторьте их активность и удвоенные доходы (20%)</li>
                    <li>Анализируйте детальную статистику в команде</li>
                    <li>Оптимизируйте стратегии привлечения</li>
                    <li>Масштабируйте успешные каналы</li>
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
                    Лучшие практики реферального маркетинга
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 ml-4 list-disc list-inside">
                    <li>
                      <strong>Качество vs количество</strong> — лучше привлечь
                      10 активных пользователей, чем 100 неактивных
                    </li>
                    <li>
                      <strong>Доверие и репутация</strong> — ваша честность
                      влияет на конверсию
                    </li>
                    <li>
                      <strong>Персональный подход</strong> — адаптируйте
                      предложение под аудиторию
                    </li>
                    <li>
                      <strong>Обучение рефералов</strong> — помогайте новым
                      пользователям освоиться
                    </li>
                    <li>
                      <strong>Аналитика эффективности</strong> — отслеживайте
                      какие каналы работают лучше
                    </li>
                    <li>
                      <strong>Долгосрочное планирование</strong> — стройте
                      систему, а не ищите быстрых денег
                    </li>
                    <li>
                      <strong>Постоянное обновление</strong> — следите за новыми
                      возможностями сервиса
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
