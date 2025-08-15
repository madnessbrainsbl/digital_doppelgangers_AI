import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AlertTriangle, Phone, CreditCard, Info } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

interface PhoneNumber {
  phone_number: string;
  phone_price: number;
  phone_region_name: string;
  phone_country_code: string;
  phone_category_name?: string;
  is_selected?: boolean;
  phone_purchase_date: string;
  account_id?: number;
  auto_charge?: boolean;
  can_be_used?: boolean;
  category_name?: string;
  deactivated?: boolean;
  is_sms_enabled?: boolean;
  is_sms_supported?: boolean;
  issues?: any[];
  modified?: string;
  phone_id?: number;
  phone_next_renewal: string;
  phone_region_id?: number;
  subscription_id?: number;
  verification_status?: string;
}

interface PhoneExpirationWarningProps {
  connectedNumbers: PhoneNumber[];
  userBalance?: number;
}

export function PhoneExpirationWarning({
  connectedNumbers,
  userBalance = 0,
}: PhoneExpirationWarningProps) {
  const [selectedNumber, setSelectedNumber] = useState<PhoneNumber | null>(
    null
  );

  // Функция для проверки, нужно ли показывать предупреждение
  const getNumbersExpiringSoon = () => {
    const now = new Date();
    const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

    return connectedNumbers.filter((number) => {
      if (number.deactivated || !number.can_be_used) return false;

      const renewalDate = new Date(number.phone_next_renewal);
      return renewalDate <= fiveDaysFromNow && renewalDate > now;
    });
  };

  // Функция для получения реальной стоимости продления номера
  const getRealPrice = (number: PhoneNumber) => {
    // Цена приходит в рублях как строка, преобразуем в число, добавляем 100 рублей и округляем
    const price = Number(number.phone_price);
    return Math.round(price + 100);
  };

  // Функция для проверки достаточности баланса
  const hasEnoughBalance = (number: PhoneNumber) => {
    const realPriceInKopecks = getRealPrice(number) * 100; // Конвертируем в копейки
    return userBalance >= realPriceInKopecks;
  };

  // Функция для форматирования даты
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Функция для подсчета дней до истечения
  const getDaysUntilExpiration = (dateString: string) => {
    const now = new Date();
    const expirationDate = new Date(dateString);
    const diffTime = expirationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Функция для форматирования баланса
  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(balance / 100);
  };

  // Компонент детального диалога
  const DetailDialog = ({ number }: { number: PhoneNumber }) => {
    const daysLeft = getDaysUntilExpiration(number.phone_next_renewal);
    const isUrgent = daysLeft <= 2;
    const enoughBalance = hasEnoughBalance(number);

    return (
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle
              className={`h-5 w-5 ${
                isUrgent
                  ? "text-red-600 dark:text-red-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            />
            Детали уведомления
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span className="font-medium">{number.phone_number}</span>
            <span className="text-sm text-muted-foreground">
              ({number.phone_region_name || "Неизвестный регион"})
            </span>
          </div>

          <div className="space-y-2 text-sm">
            <p>
              <strong>Срок действия истекает:</strong>{" "}
              {formatDate(number.phone_next_renewal)}
            </p>
            <p>
              <strong>Осталось дней:</strong> {daysLeft}
            </p>
            <p>
              <strong>Стоимость продления:</strong> {getRealPrice(number)} ₽
            </p>
            <p>
              <strong>Текущий баланс:</strong> {formatBalance(userBalance)}
            </p>
          </div>

          <div
            className={`p-3 rounded-lg border ${
              enoughBalance
                ? "bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800"
                : "bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800"
            }`}
          >
            <p className="text-sm font-medium mb-2">
              {enoughBalance ? "ℹ️ Информация:" : "⚠️ Важная информация:"}
            </p>
            <ul className="text-sm space-y-1 list-disc list-inside ml-2">
              {enoughBalance ? (
                <>
                  <li>Номер будет автоматически продлён</li>
                  <li>С баланса спишется {getRealPrice(number)} ₽</li>
                  <li>Услуга продолжит работать без перерывов</li>
                </>
              ) : (
                <>
                  <li>На балансе недостаточно средств для продления</li>
                  <li>
                    Номер будет <strong>отключен безвозвратно</strong>
                  </li>
                  <li>Восстановить отключенный номер будет невозможно</li>
                </>
              )}
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            {!enoughBalance && (
              <Button asChild className="w-full">
                <Link
                  href="/billing?tab=payment"
                  className="flex items-center justify-center"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Пополнить баланс
                </Link>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    );
  };

  const expiringSoonNumbers = getNumbersExpiringSoon();

  // Не показываем компонент если нет номеров, которые скоро истекают
  if (expiringSoonNumbers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {expiringSoonNumbers.map((number) => {
        const daysLeft = getDaysUntilExpiration(number.phone_next_renewal);
        const isUrgent = daysLeft <= 2;
        const enoughBalance = hasEnoughBalance(number);

        return (
          <Alert
            key={number.phone_id || number.phone_number}
            className={`${
              isUrgent
                ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30"
                : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/30"
            }`}
          >
            <AlertTriangle
              className={`h-4 w-4 ${
                isUrgent
                  ? "text-red-600 dark:text-red-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            />
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <AlertTitle
                  className={`text-sm ${
                    isUrgent
                      ? "text-red-800 dark:text-red-300"
                      : "text-amber-800 dark:text-amber-300"
                  }`}
                >
                  {enoughBalance
                    ? `Скоро спишется ${getRealPrice(number)} ₽ за номер ${
                        number.phone_number
                      }`
                    : `Номер ${number.phone_number} будет отключен через ${daysLeft} дн.`}
                </AlertTitle>
                <AlertDescription
                  className={`text-xs mt-1 ${
                    isUrgent
                      ? "text-red-700 dark:text-red-400"
                      : "text-amber-700 dark:text-amber-400"
                  }`}
                >
                  {enoughBalance
                    ? `Автоматическое продление ${formatDate(
                        number.phone_next_renewal
                      )}`
                    : `Недостаточно средств. Пополните баланс на ${Math.round(
                        (getRealPrice(number) * 100 - userBalance) / 100
                      )} ₽`}
                </AlertDescription>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`ml-2 h-8 w-8 p-0 ${
                      isUrgent
                        ? "hover:bg-red-200 dark:hover:bg-red-800"
                        : "hover:bg-amber-200 dark:hover:bg-amber-800"
                    }`}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DetailDialog number={number} />
              </Dialog>
            </div>
          </Alert>
        );
      })}
    </div>
  );
}
