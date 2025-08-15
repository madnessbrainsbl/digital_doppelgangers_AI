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
  Mail,
  User,
  Shield,
  AlertTriangle,
  CheckCircle,
  Zap,
  Edit,
  Eye,
  Lock,
  CreditCard,
  Phone,
  Key,
} from "lucide-react";

interface SettingsInstructionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsInstructionsDialog({
  open,
  onOpenChange,
}: SettingsInstructionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Settings className="h-6 w-6 mr-2 text-primary" />
            Инструкция по настройкам профиля
          </DialogTitle>
          <DialogDescription>
            Полное руководство по управлению личными данными, безопасности
            аккаунта и настройкам профиля
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-8rem)]">
          <div className="space-y-6 pr-4">
            {/* Важная информация */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-start">
                <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-0 sm:mr-3 mb-2 sm:mb-0 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-300">
                    Что такое страница настроек
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                    Центр управления вашим профилем и персональными данными.
                    Здесь вы можете обновить контактную информацию, просмотреть
                    данные аккаунта, управлять балансом и контролировать
                    безопасность вашего профиля.
                  </p>
                </div>
              </div>
            </div>

            {/* 1. Обновление email */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-green-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  1. Обновление email-адреса
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Управление основным email-адресом для уведомлений и связи:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Как изменить email:</h4>
                  <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Введите новый email-адрес в поле "Email"</li>
                    <li>Система автоматически приведёт к нижнему регистру</li>
                    <li>Проверьте корректность написания</li>
                    <li>Нажмите кнопку "Сохранить"</li>
                    <li>Дождитесь подтверждения успешного обновления</li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Важные особенности:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      <strong>
                        Автоматическое приведение к нижнему регистру
                      </strong>{" "}
                      — все заглавные буквы станут строчными
                    </li>
                    <li>
                      <strong>Проверка уникальности</strong> — email не должен
                      использоваться другим пользователем
                    </li>
                    <li>
                      <strong>Валидация формата</strong> — система проверяет
                      корректность email-адреса
                    </li>
                    <li>
                      <strong>Обязательное поле</strong> — email необходим для
                      работы с сервисом
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Возможные ошибки:</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs bg-red-50">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Email уже используется
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-orange-50">
                      <Edit className="h-3 w-3 mr-1" />
                      Неверный формат
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-yellow-50">
                      <Key className="h-3 w-3 mr-1" />
                      Сетевая ошибка
                    </Badge>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    <strong>Совет:</strong> Используйте email, к которому у вас
                    всегда есть доступ — он понадобится для восстановления
                    пароля и важных уведомлений.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 2. Просмотр данных пользователя */}
            <div className="space-y-4">
              <div className="flex items-center">
                <User className="h-5 w-5 mr-2 text-purple-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  2. Информация о профиле
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Просмотр основных данных вашего аккаунта и статистики:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Отображаемая информация:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      <strong>ID пользователя</strong> — уникальный
                      идентификатор вашего аккаунта
                    </li>
                    <li>
                      <strong>Текущий баланс</strong> — доступные средства в
                      рублях с копейками
                    </li>
                    <li>
                      <strong>Тарифный план</strong> — активная подписка или "Не
                      указан"
                    </li>
                    <li>
                      <strong>Номер телефона</strong> — если был добавлен при
                      регистрации
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Использование данных:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>ID пользователя — для технической поддержки</li>
                    <li>Баланс — для планирования расходов на сервис</li>
                    <li>Тариф — для понимания доступных возможностей</li>
                    <li>Телефон — для связи и восстановления доступа</li>
                  </ul>
                </div>

                <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                  <p className="text-sm text-purple-700 dark:text-purple-400">
                    <strong>Информация:</strong> Данные обновляются
                    автоматически. ID пользователя понадобится при обращении в
                    техподдержку.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 3. Баланс и платежи */}
            <div className="space-y-4">
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-indigo-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  3. Управление балансом
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Мониторинг финансового состояния аккаунта:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Информация о балансе:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Отображается в рублях и копейках</li>
                    <li>Обновляется в режиме реального времени</li>
                    <li>Показывает доступные для трат средства</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Связанные действия:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Перейти на страницу "Тарифы" для пополнения</li>
                    <li>Просмотреть историю платежей</li>
                    <li>Выбрать или изменить тарифный план</li>
                    <li>Купить дополнительные опции</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Рекомендации:</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs bg-green-50">
                      Поддерживать положительный баланс
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-blue-50">
                      Следить за тратами
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-orange-50">
                      Пополнять заранее
                    </Badge>
                  </div>
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3">
                  <p className="text-sm text-indigo-700 dark:text-indigo-400">
                    <strong>Планирование:</strong> Рекомендуем держать на
                    балансе сумму на 1-2 месяца использования сервиса для
                    бесперебойной работы.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 4. Безопасность данных */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-cyan-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  4. Безопасность и конфиденциальность
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Защита ваших персональных данных и аккаунта:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Меры безопасности:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      <strong>Шифрование данных</strong> — все данные передаются
                      и хранятся в зашифрованном виде
                    </li>
                    <li>
                      <strong>Проверка уникальности email</strong> — защита от
                      дублирования аккаунтов
                    </li>
                    <li>
                      <strong>Автоматическая нормализация</strong> — приведение
                      email к стандартному виду
                    </li>
                    <li>
                      <strong>Защищённые соединения</strong> — использование
                      HTTPS протокола
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Рекомендации по безопасности:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Используйте надёжный email-адрес</li>
                    <li>Не передавайте ID пользователя третьим лицам</li>
                    <li>Регулярно проверяйте изменения в профиле</li>
                    <li>Сообщайте о подозрительной активности</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Защищённые данные:</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs bg-cyan-50">
                      <Lock className="h-3 w-3 mr-1" />
                      Email-адрес
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-green-50">
                      <Shield className="h-3 w-3 mr-1" />
                      Финансовые данные
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-blue-50">
                      <User className="h-3 w-3 mr-1" />
                      Личная информация
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-purple-50">
                      <Phone className="h-3 w-3 mr-1" />
                      Контактные данные
                    </Badge>
                  </div>
                </div>

                <div className="bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 rounded-lg p-3">
                  <p className="text-sm text-cyan-700 dark:text-cyan-400">
                    <strong>Конфиденциальность:</strong> Мы не передаём ваши
                    персональные данные третьим лицам и используем их только для
                    предоставления услуг.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 5. Устранение неполадок */}
            <div className="space-y-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-orange-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  5. Устранение неполадок
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Решение типичных проблем при работе с настройками:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Частые ошибки и решения:</h4>
                  <div className="space-y-3">
                    <div className="p-3 border border-orange-200 dark:border-orange-800 rounded-lg">
                      <h5 className="font-medium text-sm text-orange-800 dark:text-orange-300">
                        "Email уже используется"
                      </h5>
                      <p className="text-xs text-orange-700 dark:text-orange-400 mt-1">
                        Попробуйте другой email-адрес или обратитесь в
                        поддержку, если считаете это ошибкой
                      </p>
                    </div>
                    <div className="p-3 border border-red-200 dark:border-red-800 rounded-lg">
                      <h5 className="font-medium text-sm text-red-800 dark:text-red-300">
                        "Неверный формат email"
                      </h5>
                      <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                        Проверьте правильность написания: должен содержать @ и
                        доменное имя
                      </p>
                    </div>
                    <div className="p-3 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <h5 className="font-medium text-sm text-yellow-800 dark:text-yellow-300">
                        "Данные не загружаются"
                      </h5>
                      <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                        Обновите страницу или проверьте подключение к интернету
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Когда обращаться в поддержку:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Не можете изменить email более 24 часов</li>
                    <li>Неверно отображается баланс или тариф</li>
                    <li>Подозрительные изменения в профиле</li>
                    <li>Проблемы с доступом к аккаунту</li>
                  </ul>
                </div>

                <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                  <div className="flex flex-col sm:flex-row sm:items-start">
                    <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 mr-0 sm:mr-2 mb-2 sm:mb-0 flex-shrink-0" />
                    <p className="text-sm text-orange-700 dark:text-orange-400">
                      <strong>Важно:</strong> При обращении в поддержку
                      обязательно укажите ваш ID пользователя — это поможет
                      быстрее решить проблему.
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
                    Быстрая настройка профиля
                  </h4>
                  <ol className="text-sm text-green-700 dark:text-green-400 space-y-1 ml-4 list-decimal list-inside">
                    <li>
                      Проверьте правильность отображения вашего email-адреса
                    </li>
                    <li>При необходимости обновите email на актуальный</li>
                    <li>Запишите ваш ID пользователя в надёжное место</li>
                    <li>Проверьте текущий баланс и тарифный план</li>
                    <li>
                      Убедитесь, что номер телефона указан корректно (если есть)
                    </li>
                    <li>Переходите к настройке ассистентов и каналов связи</li>
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
                    Лучшие практики управления профилем
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 ml-4 list-disc list-inside">
                    <li>
                      <strong>Актуальный email</strong> — регулярно проверяйте
                      доступность вашего почтового ящика
                    </li>
                    <li>
                      <strong>Мониторинг баланса</strong> — следите за остатком
                      средств для бесперебойной работы
                    </li>
                    <li>
                      <strong>Безопасность данных</strong> — не делитесь ID
                      пользователя с посторонними
                    </li>
                    <li>
                      <strong>Регулярная проверка</strong> — периодически
                      заходите в настройки для контроля
                    </li>
                    <li>
                      <strong>Обратная связь</strong> — сообщайте о проблемах в
                      техподдержку
                    </li>
                    <li>
                      <strong>Планирование расходов</strong> — используйте
                      информацию о балансе для бюджетирования
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
