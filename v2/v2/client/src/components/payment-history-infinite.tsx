import { useState, useEffect, useRef, useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
} from "lucide-react";

// Типы для платежей
interface Payment {
  id: number;
  createdAt: string;
  completedAt: string | null;
  status: string;
  amount: number;
  description: string | null;
  paymentUrl: string | null;
}

interface PaymentHistoryResponse {
  payments: Payment[];
  totalCount: number;
  hasMore: boolean;
  currentOffset: number;
  limit: number;
}

interface PaymentHistoryInfiniteProps {
  userId: number;
  showExport?: boolean;
  variant?: "card" | "table";
  title?: string;
}

export default function PaymentHistoryInfinite({
  userId,
  showExport = false,
  variant = "card",
  title = "История платежей",
}: PaymentHistoryInfiniteProps) {
  const [shouldLoadMore, setShouldLoadMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Infinite query для загрузки платежей
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch,
  } = useInfiniteQuery<PaymentHistoryResponse>({
    queryKey: ["/api/payments/infinite", userId],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(
        `/api/payments/user/${userId}?limit=10&offset=${pageParam}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch payment history");
      }
      const data = await response.json();

      // Обратная совместимость - если API вернул массив, оборачиваем в объект
      if (Array.isArray(data)) {
        return {
          payments: data,
          totalCount: data.length,
          hasMore: false,
          currentOffset: 0,
          limit: data.length,
        };
      }

      return data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore) return undefined;
      return lastPage.currentOffset + lastPage.limit;
    },
    staleTime: 5 * 60 * 1000, // 5 минут
  });

  // Функция для получения статуса платежа и его иконки
  const getPaymentStatus = (status: string) => {
    switch (status) {
      case "succeeded":
      case "completed":
        return {
          label: "Оплачен",
          icon: <CheckCircle className="h-4 w-4 text-green-500" />,
          textColor: "text-green-600 dark:text-green-400",
          bgColor:
            "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        };
      case "pending":
        return {
          label: "В обработке",
          icon: <Clock className="h-4 w-4 text-amber-500" />,
          textColor: "text-amber-600 dark:text-amber-400",
          bgColor:
            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        };
      case "canceled":
        return {
          label: "Отменен",
          icon: <XCircle className="h-4 w-4 text-neutral-500" />,
          textColor: "text-neutral-600 dark:text-neutral-400",
          bgColor: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
        };
      case "failed":
        return {
          label: "Ошибка",
          icon: <XCircle className="h-4 w-4 text-red-500" />,
          textColor: "text-red-600 dark:text-red-400",
          bgColor: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
        };
      default:
        return {
          label: status,
          icon: <Clock className="h-4 w-4 text-neutral-500" />,
          textColor: "text-neutral-600 dark:text-neutral-400",
          bgColor:
            "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
        };
    }
  };

  // Форматируем сумму платежа
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  };

  // Форматируем дату
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Форматируем дату для таблицы (краткий формат)
  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU");
  };

  // Intersection Observer для автоматической загрузки (для карточек)
  const lastPaymentElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [isFetchingNextPage, fetchNextPage, hasNextPage]
  );

  // Intersection Observer для автоматической загрузки (для таблицы)
  const lastTableRowRef = useCallback(
    (node: HTMLTableRowElement | null) => {
      if (isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [isFetchingNextPage, fetchNextPage, hasNextPage]
  );

  // Обновление при фокусировке окна
  useEffect(() => {
    const handleFocus = () => {
      refetch();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refetch]);

  // Получаем все платежи из всех страниц
  const allPayments = data?.pages.flatMap((page) => page.payments) || [];
  const totalCount = data?.pages[0]?.totalCount || 0;

  const handleExport = () => {
    // TODO: Реализовать экспорт
    console.log("Экспорт истории платежей");
  };

  const handlePaymentAction = () => {
    // TODO: Реализовать действие с платежом
    console.log("Действие с платежом");
  };

  if (status === "pending") {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-neutral-400" />
            <p className="ml-2">Загрузка истории платежей...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === "error") {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-red-500">
            <p>Ошибка при загрузке истории платежей</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="mt-2"
            >
              Повторить
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === "table") {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-neutral-900 dark:text-white">
              {title}
            </h3>
            {/* Сделать экспорт для итории платежей */}
            {/* {showExport && (
              <Button variant="outline" size="sm" onClick={handleExport}>
                <span className="material-icons text-[18px] mr-1">
                  download
                </span>
                <span>123Экспорт</span>
              </Button>
            )} */}
          </div>

          {allPayments.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              Нет платежей для отображения
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left table-fixed">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-700">
                      <th className="py-3 px-4 text-sm font-medium text-neutral-500 dark:text-neutral-400 w-1/4">
                        Дата
                      </th>
                      <th className="py-3 px-4 text-sm font-medium text-neutral-500 dark:text-neutral-400 w-1/4">
                        Номер счета
                      </th>
                      <th className="py-3 px-4 text-sm font-medium text-neutral-500 dark:text-neutral-400 w-1/4">
                        Сумма
                      </th>
                      <th className="py-3 px-4 text-sm font-medium text-neutral-500 dark:text-neutral-400 w-1/4">
                        Статус
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {allPayments.map((payment, index) => {
                      const paymentStatus = getPaymentStatus(payment.status);
                      const isLast = index === allPayments.length - 1;

                      return (
                        <tr
                          key={payment.id}
                          ref={isLast ? lastTableRowRef : null}
                          className="border-b border-neutral-200 dark:border-neutral-700"
                        >
                          <td className="py-3 px-4 text-sm text-neutral-900 dark:text-white w-1/4">
                            {formatDateShort(
                              payment.completedAt || payment.createdAt
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-neutral-900 dark:text-white w-1/4">
                            INV-{payment.id.toString().padStart(4, "0")}
                          </td>
                          <td className="py-3 px-4 text-sm text-neutral-900 dark:text-white w-1/4">
                            {formatAmount(payment.amount)}
                          </td>
                          <td className="py-3 px-4 w-1/4">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${paymentStatus.bgColor}`}
                            >
                              {paymentStatus.label}
                            </span>
                          </td>
                          {/* <td className="py-3 px-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handlePaymentAction}
                            >
                              <span className="material-icons text-[18px]">
                                receipt
                              </span>
                            </Button>
                          </td> */}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Индикатор загрузки */}
              {isFetchingNextPage && (
                <div className="flex justify-center py-4">
                  <RefreshCw className="h-5 w-5 animate-spin text-neutral-400" />
                  <span className="ml-2 text-sm text-neutral-500">
                    Загрузка...
                  </span>
                </div>
              )}

              {/* Кнопка "Загрузить еще" если есть следующая страница */}
              {!isFetchingNextPage && hasNextPage && (
                <div className="flex justify-center py-4">
                  <Button
                    variant="outline"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Загрузить еще
                  </Button>
                </div>
              )}

              {/* Информация о количестве записей */}
              <div className="text-center py-2 text-sm text-neutral-500">
                Показано {allPayments.length} из {totalCount} платежей
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  // Card variant (по умолчанию)
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {allPayments.length === 0 ? (
          <div className="text-center py-6 text-neutral-500 dark:text-neutral-400">
            <p className="mb-2">У вас пока нет платежей</p>
            <p className="text-sm">
              История транзакций появится после пополнения баланса
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {allPayments.map((payment, index) => {
                const paymentStatus = getPaymentStatus(payment.status);
                const isLast = index === allPayments.length - 1;

                return (
                  <div
                    key={payment.id}
                    ref={isLast ? lastPaymentElementRef : null}
                    className="flex items-center justify-between p-3 border border-neutral-200 dark:border-neutral-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-neutral-100 dark:bg-neutral-800 rounded-full p-2">
                        {paymentStatus.icon}
                      </div>
                      <div>
                        <div className="font-medium">
                          {payment.description ||
                            `Пополнение баланса #${payment.id}`}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          {formatDate(payment.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatAmount(payment.amount)}
                      </div>
                      <div className={`text-xs ${paymentStatus.textColor}`}>
                        {paymentStatus.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Индикатор загрузки */}
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <RefreshCw className="h-5 w-5 animate-spin text-neutral-400" />
                <span className="ml-2 text-sm text-neutral-500">
                  Загрузка...
                </span>
              </div>
            )}

            {/* Кнопка "Загрузить еще" */}
            {!isFetchingNextPage && hasNextPage && (
              <div className="flex justify-center py-4">
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Загрузить еще
                </Button>
              </div>
            )}

            {/* Информация о количестве записей */}
            {totalCount > 0 && (
              <div className="text-center py-2 text-sm text-neutral-500">
                Показано {allPayments.length} из {totalCount} платежей
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
