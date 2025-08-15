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
  DollarSign,
  UserCog,
  Shield,
  Filter,
  CheckCircle,
  AlertTriangle,
  Zap,
  Settings,
} from "lucide-react";

interface TeamInstructionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole?: string | null;
}

export default function TeamInstructionsDialog({
  open,
  onOpenChange,
  userRole,
}: TeamInstructionsDialogProps) {
  // Определяем какие разделы показывать в зависимости от роли
  const canAccessManagement = userRole === "manager" || userRole === "admin";
  const canAccessAdmin = userRole === "admin";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Users className="h-6 w-6 mr-2 text-primary" />
            Инструкция по работе с командой
          </DialogTitle>
          <DialogDescription>
            {userRole === "admin"
              ? "Полное руководство по управлению рефералами, выплатами и администрированию пользователей"
              : canAccessManagement
              ? "Руководство по управлению рефералами, выплатами и сопровождению пользователей"
              : "Руководство по работе с рефералами и отслеживанию выплат"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-8rem)]">
          <div className="space-y-6 pr-4">
            {/* Важная информация */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-start">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-0 sm:mr-3 mb-2 sm:mb-0 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-300">
                    Что такое страница "Моя команда"
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                    {userRole === "admin"
                      ? "Центр управления всей системой пользователей и реферальной программой. Здесь вы можете отслеживать всех пользователей, управлять выплатами, назначать менеджеров и контролировать всю систему."
                      : canAccessManagement
                      ? "Центр управления вашей командой и реферальной программой. Здесь вы можете отслеживать привлеченных рефералов, управлять выплатами, назначать менеджеров и сопровождать клиентов."
                      : "Центр управления вашей реферальной программой. Здесь вы можете отслеживать привлеченных рефералов, управлять выплатами и назначать менеджеров."}
                  </p>
                </div>
              </div>
            </div>

            {/* 1. Работа с рефералами */}
            <div className="space-y-4">
              <div className="flex items-center">
                <UserPlus className="h-5 w-5 mr-2 text-green-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  1. Работа с рефералами
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Управление пользователями, привлеченными по вашей реферальной
                  ссылке:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Информация о рефералах:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Имя и email пользователя</li>
                    <li>Статус активности (активен/неактивен)</li>
                    <li>Дата регистрации</li>
                    <li>Назначенный менеджер</li>
                    <li>Общее вознаграждение с реферала</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Назначение менеджеров:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Используйте выпадающий список "Выбор менеджера"</li>
                    <li>Назначьте себя или другого менеджера</li>
                    <li>Выберите "Не назначен" для отмены сопровождения</li>
                    <li>Изменения сохраняются автоматически</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Расчет вознаграждений:</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs bg-green-50">
                      Комиссия с рефералов
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-blue-50">
                      Пополнения баланса
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-purple-50">
                      Автоматический расчет
                    </Badge>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    <strong>Совет:</strong> Назначайте менеджеров активным
                    рефералам для повышения их лояльности и увеличения доходов.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 2. Выплаты и вознаграждения */}
            <div className="space-y-4">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-orange-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  2. Выплаты и вознаграждения
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Отслеживание доходов от реферальной программы:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">История транзакций:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Все платежи ваших рефералов</li>
                    <li>Размер вашего вознаграждения с каждого платежа</li>
                    <li>Дата и статус транзакции</li>
                    <li>
                      Описание операции (пополнение баланса, оплата услуг)
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Статусы платежей:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      <strong>Обработан</strong> — вознаграждение зачислено
                    </li>
                    <li>
                      <strong>В обработке</strong> — платеж проверяется
                    </li>
                    <li>
                      <strong>Ошибка</strong> — проблема с обработкой
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Общее вознаграждение:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Отображается в правом верхнем углу страницы</li>
                    <li>Включает все комиссии от рефералов</li>
                    <li>Обновляется в реальном времени</li>
                  </ul>
                </div>

                <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                  <p className="text-sm text-orange-700 dark:text-orange-400">
                    <strong>Важно:</strong> Вознаграждения начисляются только с
                    платежей рефералов за платные тарифы и пополнения баланса.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 3. Сопровождение пользователей */}
            {canAccessManagement && (
              <div className="space-y-4">
                <div className="flex items-center">
                  <UserCog className="h-5 w-5 mr-2 text-purple-600 flex-shrink-0" />
                  <h3 className="text-lg font-semibold">
                    3. Сопровождение пользователей
                  </h3>
                </div>

                <div className="ml-0 sm:ml-7 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Функция доступна для пользователей с ролью "Менеджер" или
                    "Админ":
                  </p>

                  <div className="space-y-2">
                    <h4 className="font-medium">Мои клиенты:</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                      <li>
                        Просмотр всех пользователей под вашим сопровождением
                      </li>
                      <li>Информация о тарифах и статусе клиентов</li>
                      <li>Вознаграждения от сопровождаемых пользователей</li>
                      <li>Возможность передать клиента другому менеджеру</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">
                      Доступные для сопровождения:
                    </h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                      <li>Пользователи без назначенного менеджера</li>
                      <li>Кнопка "Взять на сопровождение"</li>
                      <li>Автоматическое обновление списков</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Преимущества сопровождения:</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs bg-purple-50">
                        Доп. доходы
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-blue-50">
                        Персональная работа
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-green-50">
                        Повышение лояльности
                      </Badge>
                    </div>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                    <p className="text-sm text-purple-700 dark:text-purple-400">
                      <strong>Менеджерам:</strong> Активное сопровождение
                      клиентов помогает увеличить их пожизненную ценность и ваши
                      комиссионные.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {canAccessManagement && <Separator />}

            {/* 4. Управление всеми пользователями */}
            {canAccessAdmin && (
              <div className="space-y-4">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-red-600 flex-shrink-0" />
                  <h3 className="text-lg font-semibold">
                    4. Управление всеми пользователями
                  </h3>
                </div>

                <div className="ml-0 sm:ml-7 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Расширенные возможности управления (только для
                    администраторов):
                  </p>

                  <div className="space-y-2">
                    <h4 className="font-medium">Доступная информация:</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                      <li>
                        Полные данные пользователей (ID, имя, email, телефон)
                      </li>
                      <li>Роли и статусы в системе</li>
                      <li>Текущие тарифные планы</li>
                      <li>Назначенные менеджеры</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Возможности редактирования:</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                      <li>Изменение имени, email и телефона</li>
                      <li>Смена тарифного плана</li>
                      <li>Назначение менеджеров</li>
                      <li>Обновление роли пользователя</li>
                    </ul>
                  </div>

                  <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <div className="flex flex-col sm:flex-row sm:items-start">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 mr-0 sm:mr-2 mb-2 sm:mb-0 flex-shrink-0" />
                      <p className="text-sm text-red-700 dark:text-red-400">
                        <strong>Осторожно:</strong> Изменения данных
                        пользователей влияют на их доступ к системе и
                        начисления. Вносите изменения обдуманно.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {canAccessAdmin && <Separator />}

            {/* 5. Фильтры и поиск */}
            {canAccessAdmin && (
              <div className="space-y-4">
                <div className="flex items-center">
                  <Filter className="h-5 w-5 mr-2 text-cyan-600 flex-shrink-0" />
                  <h3 className="text-lg font-semibold">5. Фильтры и поиск</h3>
                </div>

                <div className="ml-0 sm:ml-7 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Инструменты для быстрого поиска нужных пользователей:
                  </p>

                  <div className="space-y-2">
                    <h4 className="font-medium">Доступные фильтры:</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                      <li>
                        <strong>По имени</strong> — поиск по имени пользователя
                      </li>
                      <li>
                        <strong>По email</strong> — поиск по электронной почте
                      </li>
                      <li>
                        <strong>По роли</strong> — фильтр по ролям (Admin,
                        Manager, User, Referral)
                      </li>
                      <li>
                        <strong>По тарифу</strong> — фильтр по тарифным планам
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Использование фильтров:</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                      <li>Нажмите кнопку "Фильтры" с иконкой воронки</li>
                      <li>Заполните нужные поля для поиска</li>
                      <li>Нажмите "Применить" для применения фильтров</li>
                      <li>Используйте "Сбросить" для очистки всех фильтров</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Комбинирование фильтров:</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                      <li>
                        Можно использовать несколько фильтров одновременно
                      </li>
                      <li>Активные фильтры отмечаются синей точкой</li>
                      <li>Результаты обновляются в реальном времени</li>
                    </ul>
                  </div>

                  <div className="bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 rounded-lg p-3">
                    <p className="text-sm text-cyan-700 dark:text-cyan-400">
                      <strong>Совет:</strong> Используйте фильтры для быстрого
                      поиска неактивных пользователей или клиентов на
                      определенных тарифах.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {canAccessAdmin && <Separator />}

            {/* 6. Роли и права доступа */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Settings className="h-5 w-5 mr-2 text-indigo-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  {canAccessManagement ? (canAccessAdmin ? "6" : "4") : "3"}.
                  Роли и права доступа
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium">Обычный пользователь (User):</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Просмотр своих рефералов</li>
                    <li>История выплат от рефералов</li>
                    <li>Назначение менеджеров рефералам</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Реферал (Referral):</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Те же права что у обычного пользователя</li>
                    <li>Участие в реферальной программе</li>
                    <li>Получение комиссий от приглашенных</li>
                  </ul>
                </div>

                {canAccessManagement && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Менеджер (Manager):</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                      <li>Все права обычного пользователя</li>
                      <li>Вкладка "Сопровождение" с клиентами</li>
                      <li>Возможность брать пользователей на сопровождение</li>
                      <li>Получение комиссий от сопровождаемых клиентов</li>
                    </ul>
                  </div>
                )}

                {canAccessAdmin && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Администратор (Admin):</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                      <li>Все права менеджера</li>
                      <li>Вкладка "Все пользователи"</li>
                      <li>Редактирование данных любых пользователей</li>
                      <li>Управление ролями и тарифами</li>
                      <li>Назначение менеджеров любым пользователям</li>
                    </ul>
                  </div>
                )}

                <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3">
                  <p className="text-sm text-indigo-700 dark:text-indigo-400">
                    <strong>Права:</strong>{" "}
                    {canAccessAdmin
                      ? "Каждая роль включает права предыдущих уровней плюс дополнительные возможности управления."
                      : canAccessManagement
                      ? "Менеджерская роль включает все права пользователя плюс возможности сопровождения клиентов."
                      : "Роль реферала включает все стандартные права пользователя плюс участие в реферальной программе."}
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
                    Быстрое начало работы с командой
                  </h4>
                  <ol className="text-sm text-green-700 dark:text-green-400 space-y-1 ml-4 list-decimal list-inside">
                    <li>Изучите свое общее вознаграждение в карточке справа</li>
                    <li>
                      Перейдите на вкладку "Рефералы" для просмотра приглашенных
                    </li>
                    <li>Назначьте менеджеров активным рефералам</li>
                    <li>Проверьте историю выплат на вкладке "Выплаты"</li>
                    {canAccessManagement && (
                      <>
                        <li>
                          Используйте вкладку "Сопровождение" для управления
                          клиентами
                        </li>
                        <li>Берите новых пользователей на сопровождение</li>
                      </>
                    )}
                    {canAccessAdmin && (
                      <>
                        <li>
                          Управляйте всеми пользователями через вкладку "Все
                          пользователи"
                        </li>
                        <li>
                          Используйте фильтры для поиска нужных пользователей
                        </li>
                      </>
                    )}
                    <li>
                      Отслеживайте эффективность через регулярные проверки
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
                    Лучшие практики управления командой
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 ml-4 list-disc list-inside">
                    <li>
                      <strong>Активное сопровождение</strong> — назначайте
                      менеджеров ценным рефералам
                    </li>
                    <li>
                      <strong>Регулярный мониторинг</strong> — проверяйте
                      выплаты и активность
                    </li>
                    <li>
                      <strong>Персональный подход</strong> — работайте с каждым
                      клиентом индивидуально
                    </li>
                    <li>
                      <strong>Использование фильтров</strong> — находите
                      неактивных пользователей для работы
                    </li>
                    <li>
                      <strong>Отслеживание трендов</strong> — анализируйте
                      динамику доходов
                    </li>
                    <li>
                      <strong>Обратная связь</strong> — поддерживайте контакт с
                      сопровождаемыми
                    </li>
                    <li>
                      <strong>Планирование роста</strong> — ставьте цели по
                      привлечению и удержанию
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
