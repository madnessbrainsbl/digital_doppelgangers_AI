import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Wallet, RefreshCw } from "lucide-react";
import PaymentModal from "./payment-modal";
import { useToast } from "@/hooks/use-toast";

interface BalanceCardProps {
  userId: number;
  userName: string | null;
  userEmail: string | null;
}

export default function BalanceCard({
  userId,
  userName,
  userEmail,
}: BalanceCardProps) {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isUpdatingBalance, setIsUpdatingBalance] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Получаем текущий баланс пользователя c учетом ID пользователя
  const {
    data: balanceData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["/api/balance", userId], // Добавляем userId в ключ запроса
    queryFn: async () => {
      // Используем userId для формирования запроса
      const response = await fetch(`/api/balance/${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch balance");
      }
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // Данные считаются свежими в течение 10 минут
    refetchInterval: 60 * 1000, // Автоматически обновлять данные раз в минуту
    refetchOnWindowFocus: true, // Обновлять при фокусировке на странице
  });

  // Обработчик фокуса на окне для обновления баланса
  useEffect(() => {
    const handleFocus = () => {
      // Проверяем, находимся ли на странице dashboard
      if (window.location.pathname.includes("/dashboard")) {
        queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
        refetch();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [queryClient, refetch]);

  // Проверяем, возвращен ли пользователь с платежной страницы ЮKassa
  useEffect(() => {
    // Проверяем URL на наличие параметров платежа
    const urlParams = new URLSearchParams(window.location.search);

    // ЮKassa может вернуть разные идентификаторы в URL
    const paymentId = urlParams.get("paymentId") || urlParams.get("orderId");
    const success = urlParams.get("success") || urlParams.get("payment");

    if (success) {
      console.log(
        `ДИАГНОСТИКА ПЛАТЕЖА: Обнаружен возврат с платежной страницы, ID платежа: ${paymentId}, success: ${success}`
      );

      // Устанавливаем флаг обновления
      setIsUpdatingBalance(true);
      toast({
        title: "Обновление баланса",
        description: "Проверяем платеж и обновляем баланс...",
      });

      // Сразу вызываем принудительное обновление баланса
      console.log(
        "ДИАГНОСТИКА ПЛАТЕЖА: Запускаем принудительное обновление баланса после возврата из ЮKassa"
      );

      // Вызываем наш endpoint принудительного обновления с userId
      fetch(`/api/balance/${userId}/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Важно для передачи куки авторизации
      })
        .then((response) => response.json())
        .then((data) => {
          console.log(
            `ДИАГНОСТИКА ПЛАТЕЖА: Результат принудительного обновления баланса пользователя ${userId}:`,
            data
          );

          // Обновляем баланс в интерфейсе после принудительного обновления
          queryClient.invalidateQueries({ queryKey: ["/api/balance", userId] });
          queryClient.invalidateQueries({
            queryKey: ["/api/payments", userId],
          });
          refetch().then((result) => {
            console.log(
              `ДИАГНОСТИКА ПЛАТЕЖА: Баланс пользователя ${userId} после принудительного обновления:`,
              result.data
            );
          });

          if (data.success) {
            if (data.updatedPayments > 0) {
              toast({
                title: "Платеж обработан",
                description: `Платеж успешно обработан, баланс обновлен`,
              });
            } else {
              // Проверка статуса платежа через другой API (для информации)
              console.log(
                `ДИАГНОСТИКА ПЛАТЕЖА: Дополнительная проверка статуса: /api/payments/external/${paymentId}`
              );

              fetch(`/api/payments/external/${paymentId}`, {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                },
                credentials: "include",
              })
                .then((response) => response.json())
                .then((paymentData) => {
                  console.log(
                    "ДИАГНОСТИКА ПЛАТЕЖА: Результат проверки платежа:",
                    paymentData
                  );

                  // Показываем уведомление в зависимости от статуса платежа
                  if (
                    paymentData.success &&
                    paymentData.payment?.status === "succeeded"
                  ) {
                    toast({
                      title: "Платеж успешно выполнен",
                      description: "Ваш баланс успешно пополнен",
                    });
                  } else {
                    toast({
                      title: "Платеж обрабатывается",
                      description:
                        "Ваш платеж успешно обрабатывается, баланс будет обновлен автоматически",
                    });

                    // Устанавливаем интервал проверки для ожидающих платежей
                    const checkInterval = setInterval(() => {
                      console.log(
                        `ДИАГНОСТИКА ПЛАТЕЖА: Периодическая проверка статуса платежа ${paymentId}`
                      );

                      // Выполняем принудительное обновление с userId
                      fetch(`/api/balance/${userId}/refresh`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                      })
                        .then((r) => r.json())
                        .then((updateData) => {
                          if (updateData.updatedPayments > 0) {
                            clearInterval(checkInterval); // Прекращаем проверку, если платеж обновлен
                            queryClient.invalidateQueries({
                              queryKey: ["/api/balance", userId],
                            });
                            refetch();
                            toast({
                              title: "Баланс обновлен",
                              description:
                                "Платеж успешно обработан, баланс обновлен",
                            });
                          }
                        });

                      // Останавливаем проверку через 30 секунд в любом случае
                      setTimeout(() => clearInterval(checkInterval), 30000);
                    }, 5000);
                  }
                })
                .catch((error) => {
                  console.error(
                    "ДИАГНОСТИКА ПЛАТЕЖА: Ошибка при проверке платежа:",
                    error
                  );
                });
            }
          } else {
            toast({
              title: "Проверка платежа",
              description:
                "Ожидание обработки платежа, попробуйте обновить баланс позже",
            });
          }
        })
        .catch((error) => {
          console.error(
            "ДИАГНОСТИКА ПЛАТЕЖА: Ошибка при обновлении баланса:",
            error
          );
          toast({
            title: "Ошибка обновления",
            description:
              "Не удалось обновить баланс автоматически, попробуйте нажать кнопку 'Обновить баланс'",
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsUpdatingBalance(false);
        });

      // Очищаем URL от параметров платежа для избежания повторных уведомлений
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [queryClient, refetch, toast]);

  // Форматируем баланс для отображения
  const balance =
    balanceData && typeof balanceData === "object" && "balance" in balanceData
      ? (balanceData.balance as number)
      : 0;

  const formattedBalance = new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(balance / 100);

  // Обработчик кнопки пополнения баланса
  const handleTopUp = () => {
    // Проверяем, есть ли email у пользователя (необходим для платежей)
    if (!userEmail) {
      toast({
        title: "Требуется email",
        description:
          "Для пополнения баланса необходимо указать email в настройках профиля",
        variant: "destructive",
      });
      return;
    }

    setIsPaymentModalOpen(true);
  };

  // Обработчик кнопки принудительного обновления баланса
  const handleForceUpdate = async () => {
    if (isUpdatingBalance) return;

    setIsUpdatingBalance(true);
    toast({
      title: "Обновление баланса",
      description: "Проверка платежей и обновление баланса...",
    });

    try {
      console.log(
        `ДИАГНОСТИКА БАЛАНСА: Запрос на принудительное обновление баланса пользователя ${userId}`
      );

      // Используем новый эндпоинт с указанием userId
      const response = await fetch(`/api/balance/${userId}/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Важно для передачи куки авторизации
      });

      const data = await response.json();
      console.log(
        `ДИАГНОСТИКА БАЛАНСА: Результат обновления баланса пользователя ${userId}:`,
        data
      );

      // Обновляем баланс в интерфейсе
      queryClient.invalidateQueries({ queryKey: ["/api/balance", userId] });
      await refetch();

      if (data.success) {
        if (data.updatedPayments > 0) {
          toast({
            title: "Баланс обновлен",
            description: `Баланс успешно обновлен. Обработано платежей: ${data.updatedPayments}`,
          });
        } else {
          toast({
            title: "Обновление не требуется",
            description: "Ваш баланс уже актуален",
          });
        }
      } else {
        toast({
          title: "Ошибка обновления",
          description: data.message || "Не удалось обновить баланс",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(
        `ДИАГНОСТИКА БАЛАНСА: Ошибка при обновлении баланса пользователя ${userId}:`,
        error
      );
      toast({
        title: "Ошибка",
        description: "Не удалось обновить баланс, попробуйте позже",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingBalance(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden border border-neutral-200 dark:border-neutral-800">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 py-4 px-6">
          <div className="flex justify-between items-center">
            <div className="text-white">
              <h3 className="text-lg font-medium">Баланс аккаунта</h3>
              <p className="text-white/70 text-sm">
                {userName || "Пользователь"} #{userId}
              </p>
            </div>
            <div className="bg-white/20 rounded-full p-2">
              <Wallet className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <div className="flex justify-center items-center gap-2">
              <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                Текущий баланс
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full"
                onClick={handleForceUpdate}
                disabled={isUpdatingBalance || isLoading}
              >
                <RefreshCw
                  className={`h-3 w-3 ${
                    isUpdatingBalance ? "animate-spin" : ""
                  }`}
                />
              </Button>
            </div>
            <div className="text-2xl font-bold">
              {isLoading || isUpdatingBalance ? (
                <div className="h-8 w-24 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse mx-auto" />
              ) : (
                formattedBalance
              )}
            </div>
          </div>

          <Button
            onClick={handleTopUp}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            disabled={isLoading || isUpdatingBalance || !userEmail}
          >
            Пополнить баланс
          </Button>

          {/* Кнопка обновления баланса для мобильной версии */}
          <Button
            variant="outline"
            className="w-full mt-2"
            onClick={handleForceUpdate}
            disabled={isUpdatingBalance || isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${
                isUpdatingBalance ? "animate-spin" : ""
              }`}
            />
            {isUpdatingBalance ? "Обновление..." : "Обновить баланс"}
          </Button>

          <div className="mt-4 text-xs text-center text-neutral-500 dark:text-neutral-400">
            {userEmail ? (
              <>Платежи обрабатываются через ЮKassa</>
            ) : (
              <>Для пополнения баланса необходимо указать email в настройках</>
            )}
          </div>
        </CardContent>
      </Card>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        userId={userId}
      />
    </>
  );
}
