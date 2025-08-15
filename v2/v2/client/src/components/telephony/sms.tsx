import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Plus, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useFetchConnectedNumber } from "@/hooks/telephony/use-fetch-connected-number";
import { toast } from "@/hooks/use-toast";
import { TariffActivationBanner } from "@/components/telephony/tariff-activation-banner";
import { CallingNumbers } from "@/components/telephony/calling-numbers";
import { User } from "@/hooks/telephony/type";
import { PhoneNumberSelector } from "./phone-number-selector";

export function Sms({ user }: { user: User }) {
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<string>("");
  const [messageText, setMessageText] = useState<string>("");
  const [recipientNumbers, setRecipientNumbers] = useState<string[]>([]);
  const [isSending, setIsSending] = useState<boolean>(false);

  // Ref для доступа к методам CallingNumbers
  const callingNumbersRef = useRef<{
    getPhoneNumbers: () => string[];
    clearPhoneNumbers: () => void;
  }>(null);

  // Получаем список подключенных номеров
  const {
    data: connectedNumbers,
    isLoading: isLoadingNumbers,
    isError: isNumbersError,
    refetch: refetchNumbers,
  } = useFetchConnectedNumber({
    userId: user.id,
  });

  // Обработчик изменения номеров получателей
  const handleNumbersChange = (numbers: string[]) => {
    setRecipientNumbers(numbers);
  };

  // Функция для расчета количества SMS
  const calculateSmsCount = (text: string): number => {
    if (!text.trim()) return 0;
    return Math.ceil(text.length / 70);
  };

  // Функция для расчета стоимости рассылки
  const calculateTotalCost = (text: string, phoneNumbers: string[]): number => {
    const smsCount = calculateSmsCount(text);
    const pricePerSms = 5.0; // Цена за одно SMS в рублях
    return smsCount * pricePerSms * phoneNumbers.length;
  };

  // Функция для отправки SMS
  const sendSMS = async () => {
    // Получаем актуальные номера из компонента
    const currentNumbers = callingNumbersRef.current?.getPhoneNumbers() || [];

    if (!selectedPhoneNumber) {
      toast({
        title: "Ошибка",
        description: "Выберите номер отправителя",
        variant: "destructive",
      });
      return;
    }

    if (!messageText.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите текст сообщения",
        variant: "destructive",
      });
      return;
    }

    if (currentNumbers.length === 0) {
      toast({
        title: "Ошибка",
        description: "Добавьте хотя бы одного получателя",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch("/api/telephony/send-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          srcNumber: selectedPhoneNumber,
          dstNumbers: currentNumbers,
          text: messageText.trim(),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Успех",
          description: `SMS отправлено на ${currentNumbers.length} номеров. Успешно: ${result.successCount}, ошибок: ${result.failedCount}`,
        });

        // Сбрасываем форму
        setMessageText("");
        callingNumbersRef.current?.clearPhoneNumbers();
      } else {
        throw new Error(result.message || "Ошибка при отправке SMS");
      }
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось отправить SMS",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Если план пользователя Free или Basic, показываем баннер
  if (user?.plan === "free" || user?.plan === "basic") {
    return <TariffActivationBanner />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>SMS рассылка</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Выбор номера отправителя */}
          <PhoneNumberSelector
            selectedPhoneNumber={selectedPhoneNumber}
            onPhoneNumberChange={setSelectedPhoneNumber}
            connectedNumbers={connectedNumbers || []}
            isLoadingNumbers={isLoadingNumbers}
            isNumbersError={isNumbersError}
            refetchNumbers={refetchNumbers}
            title="Выберите номер для отправки SMS"
            placeholder="Выберите номер с поддержкой SMS"
            smsOnly={true}
          />

          {/* Форма рассылки */}
          {selectedPhoneNumber && (
            <div className="space-y-6 border border-neutral-200 dark:border-neutral-700 rounded-md p-4">
              {/* Добавление получателей */}
              <div className="space-y-2">
                <CallingNumbers
                  ref={callingNumbersRef}
                  onNumbersChange={handleNumbersChange}
                  userBalance={(user?.balance || 0) / 100}
                  totalCost={0} // Для SMS не показываем стоимость звонков
                  mode="sms"
                />
              </div>

              {/* Текст сообщения */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Текст сообщения
                </h3>
                <Textarea
                  placeholder="Введите текст SMS сообщения"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={4}
                  className="resize-none"
                  maxLength={700}
                />
                <div className="flex justify-between">
                  <p className="text-xs text-neutral-500">
                    Максимум 700 символов
                  </p>
                  <p className="text-xs text-neutral-500">
                    {messageText.length}/700
                  </p>
                </div>

                {/* Информация о количестве SMS */}
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <div className="flex justify-between items-center text-sm text-blue-700 dark:text-blue-300">
                    <span>📱 Одно SMS вмещает 70 символов</span>
                    <span className="font-medium">
                      {calculateSmsCount(messageText)} SMS
                      {calculateSmsCount(messageText) > 1
                        ? " (оплачивается каждая отдельно)"
                        : ""}
                    </span>
                  </div>
                  {messageText.length > 70 && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Ваше сообщение будет разделено на{" "}
                      {calculateSmsCount(messageText)} SMS
                    </p>
                  )}
                  {/* Расчетная стоимость рассылки */}
                  {recipientNumbers.length > 0 && messageText.trim() && (
                    <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        <div className="flex justify-between">
                          <span>Количество SMS в сообщении:</span>
                          <span className="font-medium">
                            {calculateSmsCount(messageText)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Количество получателей:</span>
                          <span className="font-medium">
                            {recipientNumbers.length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Цена за SMS:</span>
                          <span className="font-medium">5 ₽</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>Расчетная стоимость:</span>
                          <span>
                            {calculateTotalCost(
                              messageText,
                              recipientNumbers
                            ).toFixed(2)}{" "}
                            ₽
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Кнопка отправки */}
              <div className="flex justify-end">
                <Button
                  onClick={sendSMS}
                  disabled={
                    isSending ||
                    !selectedPhoneNumber ||
                    !messageText.trim() ||
                    (callingNumbersRef.current?.getPhoneNumbers()?.length ||
                      0) === 0
                  }
                  className="min-w-[120px]"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Отправка...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Отправить SMS
                    </>
                  )}
                </Button>
              </div>

              {/* Информация о минимальных требованиях */}
              <div className="text-xs text-neutral-500 border-t pt-4 mt-2">
                <p className="font-medium mb-1">
                  Минимальные требования для отправки SMS:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li
                    className={
                      selectedPhoneNumber ? "text-green-500" : "text-red-500"
                    }
                  >
                    Выбран номер для отправки SMS
                  </li>
                  <li
                    className={
                      (callingNumbersRef.current?.getPhoneNumbers()?.length ||
                        0) > 0
                        ? "text-green-500"
                        : "text-red-500"
                    }
                  >
                    Добавлен хотя бы один номер получателя
                  </li>
                  <li
                    className={
                      messageText.trim() ? "text-green-500" : "text-red-500"
                    }
                  >
                    Текст SMS не должен быть пустым
                  </li>
                  <li className="text-green-500">
                    Достаточно средств на балансе
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
