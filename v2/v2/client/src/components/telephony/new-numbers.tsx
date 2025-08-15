import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { useState } from "react";
import { Button } from "../ui/button";
import { Loader2, Phone, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Switch } from "../ui/switch";
import { useAvailableNumbers } from "@/hooks/telephony/use-available-numbers";
import { useNumbersConnection } from "@/hooks/telephony/use-numbers-connection";

export function NewNumbers({
  userId,
  balance,
}: {
  userId: number;
  balance: number | null | undefined;
}) {
  const [selectedNumbers, setSelectedNumbers] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [smsEnabled, setSmsEnabled] = useState<boolean>(false);

  const connection = useNumbersConnection({
    selectedNumbers: selectedNumbers,
    userId,
  });

  const {
    data: availableNumbers,
    isLoading,
    isError,
  } = useAvailableNumbers(smsEnabled);

  function handleEnter({
    number,
    phone_price,
  }: {
    number: string;
    phone_price: number;
  }) {
    setCurrentPrice(phone_price + 100);
    setSelectedNumbers(number);
  }

  // Обработчик переключения SMS
  const handleSmsToggle = (checked: boolean) => {
    setSmsEnabled(checked);
    // Сбрасываем выбранные номера при переключении типа
    setSelectedNumbers("");
    setCurrentPrice(0);
  };

  // Обработчик подключения номеров
  const handleConnect = async () => {
    if (!selectedNumbers) {
      toast({
        title: "Выберите номера",
        description: "Пожалуйста, выберите хотя бы один номер для подключения",
      });
      return;
    }

    // Показываем сообщение что начали процесс подключения
    toast({
      title: "Подключение номеров",
      description: `Начинаем подключение номера ${selectedNumbers}...`,
    });

    try {
      await connection.mutateAsync();
      // Закрываем диалог после успешного подключения
      setIsDialogOpen(false);
      setSelectedNumbers("");
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось подключить номера",
        variant: "destructive",
      });
    }
  };

  // Функция для форматирования числа с разделителями тысяч
  const formatPrice = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button>Подключить номер</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Подключение нового номера</DialogTitle>
          <DialogDescription>
            Здесь можно подключить новый номер.
          </DialogDescription>

          {/* Переключатель SMS */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Тип номера
            </h3>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Поддержка SMS
                </label>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {smsEnabled
                    ? "Мобильные номера с возможностью отправки SMS"
                    : "Географические номера без поддержки SMS"}
                </p>
              </div>
              <Switch checked={smsEnabled} onCheckedChange={handleSmsToggle} />
            </div>
          </div>

          <div>
            Текущий баланс:{" "}
            <span className="font-bold text-white bg-green-500 rounded-md px-2 py-1">
              {balance && formatPrice(Math.round(balance / 100))} ₽
            </span>
          </div>

          {/* Состояние загрузки */}
          {isLoading && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Поиск номеров {smsEnabled ? "(с поддержкой SMS)" : "(без SMS)"}
              </h3>
              <div className="flex items-center justify-center p-8">
                <div className="flex flex-col items-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Загружаем доступные номера...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Нет доступных номеров */}
          {!isLoading && availableNumbers && availableNumbers.length === 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Поиск номеров {smsEnabled ? "(с поддержкой SMS)" : "(без SMS)"}
              </h3>
              <div className="flex items-center justify-center p-8">
                <div className="flex flex-col items-center space-y-3">
                  <Phone className="h-8 w-8 text-gray-400" />
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Нет доступных номеров данного типа
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Список доступных номеров */}
          {!isLoading && availableNumbers && availableNumbers.length > 0 && (
            <div className="space-y-4 overflow-y-auto max-h-[300px]">
              <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Доступные номера{" "}
                {smsEnabled ? "(с поддержкой SMS)" : "(без SMS)"}
              </h3>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Выбор</TableHead>
                      <TableHead>Номер</TableHead>
                      <TableHead>Регион</TableHead>
                      <TableHead className="text-right">Стоимость</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableNumbers.map((phoneNumber) => (
                      <TableRow key={phoneNumber.phone_number}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedNumbers.includes(
                              phoneNumber.phone_number
                            )}
                            onChange={() =>
                              handleEnter({
                                number: phoneNumber.phone_number,
                                phone_price: phoneNumber.phone_price,
                              })
                            }
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {phoneNumber.phone_number}
                        </TableCell>
                        <TableCell>{phoneNumber.phone_region_name}</TableCell>
                        <TableCell className="text-right">
                          {Math.round(phoneNumber.phone_price) + 100} ₽/месяц
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          <DialogFooter>
            <div className="flex justify-between items-center w-full">
              <div className="flex flex-col gap-2">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  Выбрано номеров: {selectedNumbers ? 1 : 0}
                </span>
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  Цена за номер: {formatPrice(Math.round(currentPrice))} ₽
                </span>
                {Math.round(currentPrice) >
                  Math.round((balance ?? 0) / 100) && (
                  <span className="text-sm text-red-600 dark:text-red-400">
                    Недостаточно средств
                  </span>
                )}
              </div>
              <Button
                onClick={handleConnect}
                disabled={
                  !selectedNumbers ||
                  connection.isPending ||
                  Math.round(currentPrice) > Math.round((balance ?? 0) / 100)
                }
              >
                {connection.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Подключение...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Подключить выбранные номера
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
