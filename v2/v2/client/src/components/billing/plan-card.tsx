import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface PlanProps {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  isPopular: boolean;
  color: string;
}

interface PlanCardProps {
  plan: PlanProps;
  isCurrentPlan: boolean;
  onSelect: () => void;
  isTrialAvailable?: boolean;
  onTrialActivate?: () => void;
}

// Функция для извлечения числового значения цены из строки
const extractPriceValue = (priceString: string): number => {
  // Извлекаем только числа из строки и преобразуем в число
  const match = priceString.match(/\d+/g);
  if (match && match.length > 0) {
    // Соединяем все найденные числа и преобразуем в число
    return parseInt(match.join(""), 10);
  }
  return 0;
};

export default function PlanCard({
  plan,
  isCurrentPlan,
  onSelect,
  isTrialAvailable = false,
  onTrialActivate,
}: PlanCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useAuth();
  const userId = user?.id;

  // Запрос баланса пользователя
  const { data: balanceData, isLoading: isBalanceLoading } = useQuery({
    queryKey: ["/api/balance", userId],
    queryFn: async () => {
      if (!userId) return { balance: 0 };
      const response = await fetch(`/api/balance/${userId}`);
      if (!response.ok) {
        throw new Error("Ошибка получения баланса");
      }
      return response.json();
    },
    enabled: !!userId,
  });

  // Стоимость тарифа в числовом формате
  const planPrice = extractPriceValue(plan.price);

  // Текущий баланс пользователя в копейках
  const currentBalanceInKopecks = balanceData?.balance || 0;

  // Преобразуем копейки в рубли для отображения и сравнения
  const currentBalanceInRubles = Math.floor(currentBalanceInKopecks / 100);

  // Проверка достаточно ли средств на балансе (сравниваем рубли с рублями)
  const hasEnoughFunds = currentBalanceInRubles >= planPrice;

  // Функция для расчета дневной стоимости тарифа (в копейках)
  const calculateDailyPrice = (priceString: string): number => {
    // Получаем стоимость в рублях
    const planPriceValue = extractPriceValue(priceString);
    // Переводим в копейки и делим на 30 дней, округляем до целого числа копеек
    return Math.round((planPriceValue * 100) / 30);
  };

  const handleOpenDialog = async () => {
    // Рассчитываем дневную стоимость нового тарифа
    const newTariffDailyPrice = calculateDailyPrice(plan.price);

    let oldTariffDailyPrice = 0;

    // Если пользователь уже имеет тариф, получаем его дневную стоимость
    if (user?.plan && user.plan !== "free" && user.plan !== plan.id) {
      try {
        // Запрос к API для получения информации о текущем тарифе
        const response = await fetch(`/api/tariff-plans/${user.plan}`);
        if (response.ok) {
          const currentPlanData = await response.json();
          if (currentPlanData.plan && currentPlanData.plan.price) {
            // Price из API приходит в копейках, делим на 30 дней для получения стоимости за день
            oldTariffDailyPrice = Math.floor(currentPlanData.plan.price / 30);
          }
        }
      } catch (error) {
        console.error(
          "Ошибка при получении информации о текущем тарифе:",
          error
        );
      }
    }

    // Устанавливаем информацию о дневных ценах
    setDailyPriceInfo({
      oldTariffDailyPrice,
      newTariffDailyPrice,
    });

    // Открываем диалоговое окно
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const queryClient = useQueryClient();
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Состояние для хранения информации о ежедневной стоимости
  const [dailyPriceInfo, setDailyPriceInfo] = useState({
    oldTariffDailyPrice: 0,
    newTariffDailyPrice: 0,
  });

  // Функция для подключения тарифа, которая вызывает родительский обработчик
  const handleSubscribe = async () => {
    if (!userId || !hasEnoughFunds) return;

    try {
      setIsSubscribing(true);

      // Вызываем родительский обработчик вместо отправки собственного запроса
      // Это позволяет избежать двойного вызова API и двойного списания средств
      onSelect();

      // Имитируем задержку обработки запроса для корректной работы UI
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Обновляем кэш баланса и информацию о пользователе
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });

      // Показываем стандартное уведомление об успешном подключении тарифа
      // Детальная информация о платеже будет отображена в родительском компоненте
      toast({
        title: `Тариф "${plan.name}" подключается...`,
        description: "Обновление информации...",
        variant: "default",
      });

      // Закрываем диалоговое окно
      handleCloseDialog();
    } catch (error) {
      console.error("Ошибка при подключении тарифа:", error);
      toast({
        title: "Ошибка при подключении тарифа",
        description:
          error instanceof Error
            ? error.message
            : "Произошла неизвестная ошибка",
        variant: "destructive",
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleTopUpBalance = () => {
    // Здесь будет переход на страницу пополнения баланса
    window.location.href = "/billing?tab=payment";
    handleCloseDialog();
  };

  // Функция для форматирования числа с пробелами между тысячами
  const formatNumber = (number: number): string => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  return (
    <>
      <Card
        className={cn(
          "flex flex-col relative overflow-hidden border border-neutral-200 dark:border-neutral-700",
          plan.isPopular && "border-primary-300 dark:border-primary-700",
          isCurrentPlan && "ring-2 ring-primary-500 dark:ring-primary-400"
        )}
      >
        {plan.isPopular && (
          <div className="absolute top-0 right-0">
            <div className="bg-primary-500 text-white text-xs font-semibold px-3 py-1 transform rotate-45 translate-x-[30%] translate-y-[-10%] shadow-md">
              Популярный
            </div>
          </div>
        )}

        {/* Добавляем метку "Выгодно" на план "Стандарт", если нет активного тарифа (isCurrentPlan === false) */}
        {plan.id === "standart" && !isCurrentPlan && (
          <div className="absolute top-3 -right-1">
            <div className="bg-red-500 text-white text-xs font-semibold px-6 py-1 transform rotate-45 translate-x-[20%] translate-y-[10%] shadow-md">
              Выгодно
            </div>
          </div>
        )}

        <div
          className={cn(
            "p-6 flex-1",
            isCurrentPlan ? "bg-neutral-100 dark:bg-neutral-800" : plan.color
          )}
        >
          <h3 className="font-semibold text-xl text-neutral-900 dark:text-white mb-2">
            {plan.name}
          </h3>
          <div className="mt-2 mb-4">
            <span className="text-3xl font-bold text-neutral-900 dark:text-white">
              {plan.price}
            </span>
            <span className="text-neutral-500 dark:text-neutral-400 ml-1">
              / {plan.period}
            </span>
          </div>

          <ul className="space-y-3 mb-6">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex">
                <Check className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 shrink-0" />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <CardContent className="p-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          {/* Показываем кнопку "Попробовать бесплатно" для тарифа Basic, если пробный период доступен */}
          {plan.id === "basic" &&
          isTrialAvailable &&
          onTrialActivate &&
          !isCurrentPlan ? (
            <div className="space-y-3">
              <Button
                onClick={onTrialActivate}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              >
                Попробовать бесплатно
              </Button>
              <p className="text-xs text-center text-gray-500">
                14 дней бесплатно, затем {plan.price}/{plan.period}
              </p>
              <Button
                onClick={handleOpenDialog}
                className="w-full"
                variant="outline"
              >
                Подключить сразу
              </Button>
            </div>
          ) : (
            <Button
              onClick={isCurrentPlan ? undefined : handleOpenDialog}
              className={cn(
                "w-full",
                isCurrentPlan
                  ? "bg-green-600 hover:bg-green-600 cursor-not-allowed"
                  : ""
              )}
              variant={isCurrentPlan ? "default" : "outline"}
              disabled={isCurrentPlan}
            >
              {isCurrentPlan ? "Подключено" : "Подключить"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Диалоговое окно подключения тарифа */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Подключение тарифа</DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm">Тариф:</span>
              <span className="font-bold">{plan.name}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-medium text-sm">Стоимость:</span>
              <span className="font-bold text-primary-600 dark:text-primary-400">
                {plan.price} / {plan.period}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-medium text-sm">Текущий баланс:</span>
              <span className="font-bold">
                {isBalanceLoading
                  ? "Загрузка..."
                  : `${formatNumber(currentBalanceInRubles)} ₽`}
              </span>
            </div>

            {/* Предупреждение о смене тарифа */}
            {!isCurrentPlan &&
              user?.plan &&
              user.plan !== "free" &&
              user.plan !== plan.id && (
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-sm mb-4">
                  <p className="font-semibold mb-1">
                    Внимание! Смена тарифного плана
                  </p>
                  <p>
                    При переходе на новый тариф все текущие метрики будут
                    сброшены и начнутся с нуля.
                  </p>
                  <p className="mt-2">
                    Стоимость одного дня текущего тарифа:{" "}
                    {(dailyPriceInfo.oldTariffDailyPrice / 100).toLocaleString(
                      "ru-RU"
                    )}{" "}
                    ₽
                  </p>
                  <p className="mt-2">
                    За текущий день будет списано средства по вашему текущему
                    тарифу.
                  </p>
                  <p className="mt-1">
                    За неиспользованный период текущего тарифа будет произведен
                    возврат средств на баланс.
                  </p>
                </div>
              )}

            {!hasEnoughFunds && (
              <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-sm">
                На вашем балансе недостаточно средств для подключения тарифа.
                Пожалуйста, пополните баланс.
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              onClick={handleTopUpBalance}
            >
              Пополнить баланс
            </Button>

            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCloseDialog}
              >
                Отмена
              </Button>

              <Button
                className="flex-1"
                disabled={!hasEnoughFunds || isBalanceLoading || isSubscribing}
                onClick={handleSubscribe}
              >
                {isSubscribing ? "Обработка..." : "Подключить"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
