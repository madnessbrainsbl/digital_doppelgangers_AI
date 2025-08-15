import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  History,
  MessageSquare,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  CreditCard,
  Settings,
  Zap,
} from "lucide-react";

export function TelephonyInstructions() {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center text-xl">
          <Phone className="h-6 w-6 mr-2 text-primary" />
          Инструкция по работе с голосовым модулем
        </DialogTitle>
        <DialogDescription>
          Полное руководство по всем функциям телефонии: подключение номеров,
          обзвон, входящие звонки и SMS
        </DialogDescription>
      </DialogHeader>

      <ScrollArea className="h-[calc(90vh-8rem)]">
        <div className="space-y-6 pr-4">
          {/* Требования тарифного плана */}
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Важно:</strong> Для использования телефонии требуется
              тарифный план <strong>Стандарт</strong> или{" "}
              <strong>Корпоративный</strong>. Тариф <strong>Базовый</strong> и{" "}
              <strong>Бесплатный</strong> не поддерживают голосовые функции.
            </AlertDescription>
          </Alert>

          {/* 1. Подключение номеров */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-blue-500" />
                1. Подключение номеров
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                Первый шаг для работы с телефонией — подключение телефонных
                номеров к вашему аккаунту.
              </p>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Назначение:
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
                  <li>Подключение российских номеров телефонов</li>
                  <li>Управление подключенными номерами</li>
                  <li>Выбор типа номера: географический или мобильный с SMS</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Требования:
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
                  <li>
                    Тарифный план: <Badge>Стандарт</Badge> или{" "}
                    <Badge>Корпоративный</Badge>
                  </li>
                  <li>Достаточно средств на балансе</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Типы номеров:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="border rounded-lg p-3">
                    <h5 className="font-medium text-green-600">
                      Географические номера
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Обычные городские номера без поддержки SMS
                    </p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <h5 className="font-medium text-blue-600">
                      Мобильные номера
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      С поддержкой SMS рассылки
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Исходящие звонки */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PhoneCall className="h-5 w-5 text-green-500" />
                2. Исходящие звонки (Холодный обзвон)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                Автоматический обзвон списка номеров с использованием
                ИИ-ассистента.
              </p>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Назначение:
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
                  <li>Массовый обзвон потенциальных клиентов</li>
                  <li>Автоматическое ведение диалога через ИИ-ассистента</li>
                  <li>Выполнение пользовательских функций во время звонка</li>
                  <li>Запись и расшифровка разговоров</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Минимальные требования:
                </h4>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Выбран номер для звонка</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Выбран ассистент</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Добавлен минимум 1 номер</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Сценарий ≥ 10 символов</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Достаточно средств</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">
                        Канал + функция (опционально)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Стоимость:
                </h4>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="flex flex-col space-y-1">
                    <span className="text-blue-700 dark:text-blue-300">
                      💰 <strong>5₽ за минуту</strong> разговора
                    </span>
                    <span className="text-blue-600 dark:text-blue-400 text-sm">
                      Первые минуты используются из тарифного лимита
                    </span>
                    <span className="text-blue-600 dark:text-blue-400 text-sm">
                      Расчетная стоимость: ~15₽ за номер (3 мин среднего
                      разговора)
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Типы обзвона:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="border rounded-lg p-3">
                    <h5 className="font-medium text-blue-600">
                      Простой обзвон
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Ассистент ведет диалог по заданному сценарию
                    </p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <h5 className="font-medium text-purple-600">С функцией</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      + выполнение пользовательской функции и уведомления в
                      Telegram
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Входящие звонки */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PhoneIncoming className="h-5 w-5 text-orange-500" />
                3. Входящие звонки
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                Настройка автоматического ответа на входящие звонки с помощью
                ИИ-ассистента.
              </p>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Назначение:
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
                  <li>Автоответчик с ИИ-ассистентом</li>
                  <li>Обработка входящих звонков 24/7</li>
                  <li>Сбор информации от клиентов</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Минимальные требования:
                </h4>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Выбран номер для звонков</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Выбран ассистент</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Сценарий ≥ 10 символов</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Достаточно средств</span>
                    </div>
                  </div>
                </div>
              </div>

              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  Номер автоматически привязывается к входящему приложению.
                  После удаления настроек привязка убирается.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* 4. История звонков */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-purple-500" />
                4. История звонков
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                Просмотр всех совершенных и принятых звонков с детальной
                аналитикой.
              </p>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Информация о звонках:
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
                  <li>Дата и время звонка</li>
                  <li>Длительность разговора</li>
                  <li>Стоимость звонка</li>
                  <li>Статус: завершен, неудачный, недозвон</li>
                  <li>Запись разговора (если доступна)</li>
                  <li>Расшифровка диалога</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Фильтры:
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Badge variant="outline">Сегодня</Badge>
                  <Badge variant="outline">За неделю</Badge>
                  <Badge variant="outline">За месяц</Badge>
                  <Badge variant="outline">За год</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Цветовая маркировка:
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-300 rounded-full"></div>
                    <span className="text-sm">Входящие звонки</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-300 rounded-full"></div>
                    <span className="text-sm">Исходящие звонки</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-300 rounded-full"></div>
                    <span className="text-sm">Ошибки связи</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border border-black rounded-full"></div>
                    <span className="text-sm">Автоответчик</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 5. SMS рассылка */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-500" />
                5. Отправка SMS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                Массовая отправка SMS сообщений через подключенные мобильные
                номера.
              </p>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Назначение:
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
                  <li>Массовые уведомления клиентов</li>
                  <li>Рекламные рассылки</li>
                  <li>Информационные сообщения</li>
                  <li>Напоминания и подтверждения</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Минимальные требования:
                </h4>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Мобильный номер с SMS</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Минимум 1 получатель</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Непустой текст</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Достаточно средств</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Ограничения и стоимость:
                </h4>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-300">
                        Размер одного SMS:
                      </span>
                      <span className="font-medium text-blue-700 dark:text-blue-300">
                        70 символов
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-300">
                        Максимум символов:
                      </span>
                      <span className="font-medium text-blue-700 dark:text-blue-300">
                        700 (10 SMS)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-300">
                        Стоимость SMS:
                      </span>
                      <span className="font-medium text-blue-700 dark:text-blue-300">
                        2.5₽
                      </span>
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                      💡 Первые SMS используются из тарифного лимита
                    </div>
                  </div>
                </div>
              </div>

              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  Тарифные лимиты SMS: <strong>Стандарт</strong> — 200 SMS,{" "}
                  <strong>Корпоративный</strong> — 1000 SMS
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* 6. История SMS */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-gray-500" />
                6. История SMS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                Просмотр всех отправленных и полученных SMS с фильтрацией и
                поиском.
              </p>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Информация о SMS:
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
                  <li>Дата и время отправки</li>
                  <li>Номера отправителя и получателя</li>
                  <li>Текст сообщения</li>
                  <li>Статус доставки</li>
                  <li>Количество фрагментов SMS</li>
                  <li>Стоимость отправки</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Фильтры и поиск:
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
                  <li>По направлению: входящие/исходящие/все</li>
                  <li>По конкретному номеру получателя</li>
                  <li>По диапазону дат</li>
                  <li>Сортировка по дате</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Статусы SMS:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Badge className="bg-green-100 text-green-800">
                    Доставлено
                  </Badge>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    В процессе
                  </Badge>
                  <Badge className="bg-red-100 text-red-800">Ошибка</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Тарифные планы */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-500" />
                Тарифные планы и лимиты
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-4">
                  <h4 className="font-bold text-green-600 mb-3">Стандарт</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Голосовые минуты:</span>
                      <span className="font-medium">500</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SMS:</span>
                      <span className="font-medium">200</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Доплата за минуту:</span>
                      <span className="font-medium">5₽</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Доплата за SMS:</span>
                      <span className="font-medium">2.5₽</span>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-bold text-purple-600 mb-3">
                    Корпоративный
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Голосовые минуты:</span>
                      <span className="font-medium">1000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SMS:</span>
                      <span className="font-medium">1000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Доплата за минуту:</span>
                      <span className="font-medium">5₽</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Доплата за SMS:</span>
                      <span className="font-medium">2.5₽</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Общие рекомендации */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Рекомендации по использованию
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    🎯 Для максимальной эффективности:
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
                    <li>Подготовьте качественный сценарий для ассистента</li>
                    <li>Тестируйте на малом количестве номеров</li>
                    <li>Следите за балансом и тарифными лимитами</li>
                    <li>Анализируйте результаты в истории звонков</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    💰 Для экономии средств:
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
                    <li>Используйте тарифные лимиты перед доплатой</li>
                    <li>Выбирайте географические номера для звонков</li>
                    <li>Мобильные номера — только для SMS</li>
                  </ul>
                </div>

                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    При исчерпании тарифных лимитов автоматически включается
                    доплата с баланса. Система предупреждает об этом
                    специальными уведомлениями.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          {/* Быстрое начало */}
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-start">
              <Zap className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 mr-0 sm:mr-3 mb-2 sm:mb-0 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">
                  Быстрое начало работы с телефонией
                </h4>
                <ol className="text-sm text-green-700 dark:text-green-400 space-y-1 ml-4 list-decimal list-inside">
                  <li>Убедитесь что у вас тариф Стандарт или Корпоративный</li>
                  <li>Подключите номер телефона в разделе "Подключение"</li>
                  <li>
                    Создайте и настройте ассистентов во вкладке "Ассистенты"
                  </li>
                  <li>Пополните баланс для покрытия стоимости звонков/SMS</li>
                  <li>Начните с тестового обзвона нескольких номеров</li>
                  <li>
                    Настройте входящие звонки для автоответчика (опционально)
                  </li>
                  <li>Анализируйте результаты в истории звонков и SMS</li>
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
                  Лучшие практики работы с телефонией
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 ml-4 list-disc list-inside">
                  <li>
                    <strong>Планирование:</strong> составьте детальный сценарий
                    перед массовым обзвоном
                  </li>
                  <li>
                    <strong>Тестирование:</strong> всегда проверяйте работу на
                    малой выборке
                  </li>
                  <li>
                    <strong>Мониторинг баланса:</strong> следите за остатком
                    средств во время кампаний
                  </li>
                  <li>
                    <strong>Соблюдение законов:</strong> учитывайте требования
                    по согласию на звонки
                  </li>
                  <li>
                    <strong>Анализ результатов:</strong> изучайте записи для
                    улучшения сценариев
                  </li>
                  <li>
                    <strong>Оптимизация времени:</strong> звоните в удобное для
                    клиентов время
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </>
  );
}
