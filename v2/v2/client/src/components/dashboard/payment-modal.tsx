import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: number; // Добавляем необязательный параметр userId
}

export default function PaymentModal({
  isOpen,
  onClose,
  userId,
}: PaymentModalProps) {
  const [amount, setAmount] = useState<number | "">("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Преобразуем введенную сумму в копейки для API
  const amountInKopecks =
    typeof amount === "number" ? Math.round(amount * 100) : 0;

  // Мутация для создания платежа
  const createPaymentMutation = useMutation({
    mutationFn: (data: { amount: number }) =>
      apiRequest({
        url: "/api/payments",
        method: "POST",
        body: data,
      }),
    onSuccess: (data) => {
      // Успешно создан платеж, перенаправляем на страницу оплаты
      if (data.paymentUrl) {
        // Открываем URL оплаты в новом окне
        window.open(data.paymentUrl, "_blank");
        // Или перенаправляем пользователя
        // window.location.href = data.paymentUrl;

        toast({
          title: "Платеж создан",
          description: "Вы будете перенаправлены на страницу оплаты",
        });

        // Инвалидируем кэш баланса, чтобы обновить его после возвращения
        // Если указан userId, используем его в ключе запроса
        if (userId) {
          queryClient.invalidateQueries({ queryKey: ["/api/balance", userId] });
          queryClient.invalidateQueries({
            queryKey: ["/api/payments/user", userId],
          });
        } else {
          // Для обратной совместимости
          queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
          queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
        }

        // Закрываем модальное окно
        onClose();
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось получить ссылку на страницу оплаты",
          variant: "destructive",
        });
      }
      setIsProcessing(false);
    },
    onError: (error) => {
      console.error("Ошибка при создании платежа:", error);
      toast({
        title: "Ошибка",
        description:
          error instanceof Error ? error.message : "Не удалось создать платеж",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  // Обработчик отправки формы
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || amount < 100) {
      toast({
        title: "Ошибка",
        description: "Минимальная сумма пополнения 100 ₽",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    // Отправляем сумму в объекте с полем amount как ожидает API
    createPaymentMutation.mutate({ amount: amountInKopecks });
  };

  // Функция для выбора предустановленной суммы
  const handlePresetAmount = (presetAmount: number) => {
    setAmount(presetAmount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Пополнение баланса</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Сумма пополнения (₽)</Label>
            <Input
              id="amount"
              type="number"
              min="100"
              step="100"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value ? Number(e.target.value) : "")
              }
              placeholder="Введите сумму"
              disabled={isProcessing}
              className="text-lg"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handlePresetAmount(100)}
              disabled={isProcessing}
            >
              100 ₽
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handlePresetAmount(500)}
              disabled={isProcessing}
            >
              500 ₽
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handlePresetAmount(1000)}
              disabled={isProcessing}
            >
              1000 ₽
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handlePresetAmount(3000)}
              disabled={isProcessing}
            >
              3000 ₽
            </Button>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              className="w-full"
              disabled={!amount || isProcessing}
            >
              {isProcessing ? "Создание платежа..." : "Оплатить"}
            </Button>
          </div>

          <div className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
            Вы будете перенаправлены на защищенную страницу оплаты ЮKassa
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
