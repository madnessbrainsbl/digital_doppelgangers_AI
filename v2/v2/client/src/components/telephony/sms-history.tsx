import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  MessageSquare,
  Calendar,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  SmsDirection,
  SmsHistoryItem,
  SmsHistoryFilters,
} from "@/hooks/telephony/type";
import { User } from "@/hooks/telephony/type";
import { format, formatDistanceToNow } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useSmsHistory } from "@/hooks/telephony/use-sms-history";
import { useFetchConnectedNumber } from "@/hooks/telephony/use-fetch-connected-number";
import { SmsDetails } from "./sms-details";
import { PhoneNumberSelector } from "./phone-number-selector";

export function SmsHistory({ user }: { user: User }) {
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<string>("");
  const [filters, setFilters] = useState<SmsHistoryFilters>({
    direction: "ALL",
  });
  const [tempFilters, setTempFilters] = useState<SmsHistoryFilters>({
    direction: "ALL",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Синхронизируем tempFilters с filters при изменении filters
  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);

  // Получаем список подключенных номеров
  const {
    data: connectedNumbers,
    isLoading: isLoadingNumbers,
    isError: isNumbersError,
    refetch: refetchNumbers,
  } = useFetchConnectedNumber({
    userId: user.id,
  });

  // Ref для бесконечной прокрутки
  const observerRef = useRef<IntersectionObserver | null>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSmsHistory({
    userId: user.id,
    phoneNumber: selectedPhoneNumber, // Передаем выбранный номер
    filters,
  });

  // Преобразуем данные из пагинированного формата в плоский массив
  const smsHistory = data?.pages.flatMap((page) => page.history) || [];
  const totalCount = data?.pages[0]?.totalCount || 0;

  // Функция для отслеживания последнего элемента
  const lastSmsRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading || isFetchingNextPage) return;

      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });

      if (node) {
        observerRef.current.observe(node);
      }
    },
    [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  // Применение фильтров
  const applyFilters = () => {
    // Создаем новый объект фильтров
    const newFilters: SmsHistoryFilters = {
      ...tempFilters,
    };

    // Обрабатываем fromDate - устанавливаем время на начало дня в UTC
    if (fromDate) {
      const [year, month, day] = fromDate.split("-").map(Number);
      const utcFromDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      newFilters.fromDate = utcFromDate;
    } else {
      newFilters.fromDate = undefined;
    }

    // Обрабатываем toDate - устанавливаем время на конец дня в UTC
    if (toDate) {
      const [year, month, day] = toDate.split("-").map(Number);
      const utcToDate = new Date(
        Date.UTC(year, month - 1, day, 23, 59, 59, 999)
      );
      newFilters.toDate = utcToDate;
    } else {
      newFilters.toDate = undefined;
    }

    setFilters(newFilters);
    setShowFilters(false);
  };

  // Сброс фильтров
  const resetFilters = () => {
    const defaultFilters = { direction: "ALL" as SmsDirection };
    setTempFilters(defaultFilters);
    setFilters(defaultFilters);
    setFromDate(""); // Сбрасываем строковую дату
    setToDate(""); // Сбрасываем строковую дату
    setShowFilters(false);
  };

  // Функция для форматирования стоимости SMS (рассчитываем как количество фрагментов × 5 рублей)
  const formatCost = (fragments: number): string => {
    const pricePerSms = 5.0; // Цена за одно SMS в рублях
    const totalCost = fragments * pricePerSms;
    return totalCost.toFixed(2) + " ₽";
  };

  // Функция для отображения статуса SMS
  const renderSmsStatus = (statusId: string, errorMessage?: string) => {
    switch (statusId) {
      case "1":
        return <Badge variant="success">Доставлено</Badge>;
      case "2":
        return (
          <Badge variant="destructive" title={errorMessage}>
            Ошибка
          </Badge>
        );
      default:
        return <Badge variant="outline">{statusId}</Badge>;
    }
  };

  // Функция для отображения направления SMS
  const renderDirection = (direction: string) => {
    switch (direction.toLowerCase()) {
      case "out":
        return (
          <div className="flex items-center space-x-1">
            <ArrowUp className="h-4 w-4 text-blue-500" />
            <span className="text-blue-700">Исходящее</span>
          </div>
        );
      case "in":
        return (
          <div className="flex items-center space-x-1">
            <ArrowDown className="h-4 w-4 text-green-500" />
            <span className="text-green-700">Входящее</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center space-x-1">
            <ArrowUpDown className="h-4 w-4 text-gray-500" />
            <span>{direction}</span>
          </div>
        );
    }
  };

  // Функция для обновления с показом загрузчика минимум на 1 секунду
  const handleRefresh = async () => {
    setIsRefreshing(true);

    // Запускаем обновление и таймер параллельно
    const [refreshResult] = await Promise.allSettled([
      refetch(),
      new Promise((resolve) => setTimeout(resolve, 1000)), // Минимум 1 секунда
    ]);

    setIsRefreshing(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between ">
        <div className="flex flex-col">
          <CardTitle className="text-base md:text-lg">
            История SMS
            {totalCount > 0 && (
              <span className="text-sm font-normal ml-2 text-neutral-500">
                ({totalCount})
              </span>
            )}
          </CardTitle>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="text-xs md:text-sm h-8 md:h-9"
          >
            <Filter className="h-4 w-4 mr-2" />
            Фильтры
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRefresh()}
            disabled={isLoading || isRefreshing}
            className="text-xs md:text-sm h-8 md:h-9"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Обновить
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Выбор номера телефона */}
        <PhoneNumberSelector
          selectedPhoneNumber={selectedPhoneNumber}
          onPhoneNumberChange={setSelectedPhoneNumber}
          connectedNumbers={connectedNumbers || []}
          isLoadingNumbers={isLoadingNumbers}
          isNumbersError={isNumbersError}
          refetchNumbers={refetchNumbers}
          title="Выберите номер для просмотра истории SMS"
          placeholder="Выберите номер с поддержкой SMS"
          smsOnly={true}
        />

        {/* История SMS отображается только после выбора номера */}
        {!selectedPhoneNumber ? (
          <div className="text-center p-4 text-neutral-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Выберите номер телефона для просмотра истории SMS</p>
          </div>
        ) : (
          <>
            {/* Панель фильтров */}
            {showFilters && (
              <div className="mb-6 p-4 border rounded-lg space-y-4">
                <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Фильтры
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Направление */}
                  <div className="space-y-2">
                    <label className="text-xs text-neutral-500">
                      Направление
                    </label>
                    <select
                      className="w-full border border-neutral-300 dark:border-neutral-600 rounded-md py-2 px-3 text-sm"
                      value={tempFilters.direction || "ALL"}
                      onChange={(e) =>
                        setTempFilters({
                          ...tempFilters,
                          direction: e.target.value as SmsDirection,
                        })
                      }
                    >
                      <option value="ALL">Все</option>
                      <option value="OUT">Исходящие</option>
                      <option value="IN">Входящие</option>
                    </select>
                  </div>

                  {/* Номер получателя */}
                  <div className="space-y-2">
                    <label className="text-xs text-neutral-500">
                      Номер получателя
                    </label>
                    <Input
                      placeholder="Введите номер"
                      value={tempFilters.destinationNumber || ""}
                      onChange={(e) =>
                        setTempFilters({
                          ...tempFilters,
                          destinationNumber: e.target.value || undefined,
                        })
                      }
                    />
                    <div className="text-xs text-neutral-400">
                      поиск по полному номеру (например 79991234567)
                    </div>
                  </div>

                  {/* Дата начала */}
                  <div className="space-y-2">
                    <label className="text-xs text-neutral-500">
                      Дата начала
                    </label>
                    <Input
                      type="date"
                      value={fromDate}
                      onChange={(e) => {
                        setFromDate(e.target.value);
                      }}
                    />
                  </div>

                  {/* Дата окончания */}
                  <div className="space-y-2">
                    <label className="text-xs text-neutral-500">
                      Дата окончания
                    </label>
                    <Input
                      type="date"
                      value={toDate}
                      onChange={(e) => {
                        setToDate(e.target.value);
                      }}
                    />
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button size="sm" onClick={applyFilters}>
                    <Search className="h-4 w-4 mr-2" />
                    Применить
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    Сбросить
                  </Button>
                </div>
              </div>
            )}

            {isLoading && !isFetchingNextPage ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isError ? (
              <div className="text-center p-8 text-red-500">
                <p>Ошибка при загрузке истории SMS</p>
                <p className="text-sm">
                  {error?.message || "Неизвестная ошибка"}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="mt-2"
                >
                  Повторить
                </Button>
              </div>
            ) : smsHistory.length === 0 ? (
              <div className="text-center p-8 text-neutral-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>У выбранного номера пока нет истории SMS</p>
              </div>
            ) : (
              <>
                {/* Мобильный вид (карточки) */}
                <div className="block md:hidden space-y-4 w-full max-w-[315px] sm:max-w-full">
                  {smsHistory.map((sms, index) => (
                    <div key={sms.messageId} className="w-full">
                      <Dialog>
                        <Card className="overflow-hidden max-w-full">
                          <CardContent
                            className={cn("p-4", {
                              "bg-blue-100":
                                sms.direction.toLowerCase() === "out",
                              "bg-green-100":
                                sms.direction.toLowerCase() === "in",
                              "bg-red-100": sms.statusId === "2",
                            })}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-3 min-w-0 flex-1">
                                <div className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800">
                                  <MessageSquare className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium truncate">
                                    {sms.destinationNumber}
                                  </div>
                                  <div className="text-xs text-neutral-500">
                                    {new Date(
                                      sms.processedDate
                                    ).toLocaleDateString("ru-RU")}{" "}
                                    {new Date(
                                      sms.processedDate
                                    ).toLocaleTimeString("ru-RU", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                </div>
                              </div>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-shrink-0 ml-2"
                                >
                                  Подробнее
                                </Button>
                              </DialogTrigger>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                              <div>{renderDirection(sms.direction)}</div>
                              <div>
                                <span className="text-neutral-500">
                                  Стоимость:
                                </span>{" "}
                                {formatCost(sms.fragments)}
                              </div>
                            </div>
                            {sms.text && (
                              <div className="mt-2 text-xs text-neutral-600 line-clamp-2">
                                {sms.text}
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Детали SMS</DialogTitle>
                          </DialogHeader>
                          <SmsDetails
                            sms={sms}
                            formatCost={formatCost}
                            renderSmsStatus={renderSmsStatus}
                          />
                        </DialogContent>
                      </Dialog>
                      {index === smsHistory.length - 1 && (
                        <div ref={lastSmsRef} className="h-1 w-full" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Десктопный вид (таблица) */}
                <div className="hidden md:block overflow-x-auto">
                  <div className="text-xs text-neutral-500">
                    * Время отображается в часовом поясе Москвы
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Дата</TableHead>
                        <TableHead>Направление</TableHead>
                        <TableHead>Отправитель</TableHead>
                        <TableHead>Получатель</TableHead>
                        <TableHead>Текст</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Стоимость</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {smsHistory.map((sms, index) => (
                        <TableRow
                          key={sms.messageId}
                          className={cn(
                            "hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
                            {
                              "bg-blue-50":
                                sms.direction.toLowerCase() === "out",
                              "bg-green-50":
                                sms.direction.toLowerCase() === "in",
                              "bg-red-50": sms.statusId === "2",
                            }
                          )}
                        >
                          <TableCell>
                            <div>
                              {new Date(sms.processedDate).toLocaleDateString(
                                "ru-RU",
                                { timeZone: "Europe/Moscow" }
                              )}
                            </div>
                            <div className="text-xs text-neutral-500">
                              {new Date(
                                new Date(sms.processedDate).getTime() +
                                  3 * 3600 * 1000
                              ).toLocaleTimeString("ru-RU", {
                                timeZone: "Europe/Moscow",
                              })}
                            </div>
                          </TableCell>
                          <TableCell>
                            {renderDirection(sms.direction)}
                          </TableCell>
                          <TableCell>{sms.sourceNumber}</TableCell>
                          <TableCell>{sms.destinationNumber}</TableCell>
                          <TableCell>
                            {sms.text ? (
                              <div
                                className="max-w-[200px] truncate"
                                title={sms.text}
                              >
                                {sms.text}
                              </div>
                            ) : (
                              <span className="text-xs text-neutral-400">
                                Нет текста
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {renderSmsStatus(sms.statusId, sms.errorMessage)}
                          </TableCell>
                          <TableCell>{formatCost(sms.fragments)}</TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  Подробнее
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[600px]">
                                <DialogHeader>
                                  <DialogTitle>Детали SMS</DialogTitle>
                                </DialogHeader>
                                <SmsDetails
                                  sms={sms}
                                  formatCost={formatCost}
                                  renderSmsStatus={renderSmsStatus}
                                />
                              </DialogContent>
                            </Dialog>
                            {index === smsHistory.length - 1 && (
                              <div ref={lastSmsRef} className="h-1" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Индикатор загрузки следующей страницы */}
                {isFetchingNextPage && (
                  <div className="flex justify-center items-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}

                {/* Сообщение о конце списка */}
                {!hasNextPage && smsHistory.length > 0 && (
                  <div className="text-center py-4 text-neutral-500 text-sm">
                    Вы достигли конца списка
                  </div>
                )}
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
