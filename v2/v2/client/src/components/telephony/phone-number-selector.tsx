import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhoneNumber } from "@/hooks/telephony/type";

interface PhoneNumberSelectorProps {
  selectedPhoneNumber: string;
  onPhoneNumberChange: (phoneNumber: string) => void;
  connectedNumbers: PhoneNumber[];
  isLoadingNumbers: boolean;
  isNumbersError: boolean;
  refetchNumbers: () => void;
  title?: string;
  placeholder?: string;
  emptyMessage?: string;
  smsOnly?: boolean; // Фильтровать только номера с поддержкой SMS
}

export function PhoneNumberSelector({
  selectedPhoneNumber,
  onPhoneNumberChange,
  connectedNumbers,
  isLoadingNumbers,
  isNumbersError,
  refetchNumbers,
  title = "Выберите номер",
  placeholder = "Выберите номер",
  emptyMessage = 'У вас нет подключенных номеров. Сначала подключите номер в разделе "Подключение".',
  smsOnly = false,
}: PhoneNumberSelectorProps) {
  // Фильтруем номера по условию SMS, если нужно
  const filteredNumbers = smsOnly
    ? connectedNumbers.filter(
        (number) =>
          number.is_sms_supported && !number.deactivated && number.can_be_used
      )
    : connectedNumbers.filter(
        (number) => !number.deactivated && number.can_be_used
      );

  return (
    <div className="space-y-4 mb-6">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {title}
        </h3>
        <div className="relative">
          {isLoadingNumbers ? (
            <div className="flex items-center space-x-2 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />
              <span className="text-sm text-neutral-500">
                Загрузка номеров...
              </span>
            </div>
          ) : isNumbersError ? (
            <div className="text-sm text-red-500 py-2 flex justify-between">
              <span>Ошибка при загрузке номеров</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetchNumbers()}
                className="text-xs"
              >
                Повторить
              </Button>
            </div>
          ) : filteredNumbers.length === 0 ? (
            <div className="text-sm text-amber-500 py-2">
              {smsOnly && connectedNumbers.length > 0
                ? 'У вас нет номеров с поддержкой SMS. Подключите мобильный номер в разделе "Подключение".'
                : emptyMessage}
            </div>
          ) : (
            <>
              <select
                className="w-full border border-neutral-300 dark:border-neutral-600 rounded-md py-2 px-3 pr-10 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
                value={selectedPhoneNumber}
                onChange={(e) => onPhoneNumberChange(e.target.value)}
              >
                <option value="">{placeholder}</option>
                {filteredNumbers.map((number) => (
                  <option key={number.phone_number} value={number.phone_number}>
                    {number.phone_number} (
                    {number.phone_region_name || "Неизвестно"})
                  </option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 pointer-events-none">
                ▼
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
