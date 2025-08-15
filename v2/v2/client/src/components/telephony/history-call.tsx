import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useFetchCallHistory,
  CallHistoryItem,
  DateFilterPeriod,
} from "@/hooks/telephony/use-fetch-call-history";
import {
  Loader2,
  Phone,
  PhoneOff,
  PlayCircle,
  ChevronRight,
  Clock,
  Calendar,
  User,
  Phone as PhoneIcon,
  X,
  Check,
  Info,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ru } from "date-fns/locale";
import { Button } from "../ui/button";
import { useState, useEffect, useRef, useCallback } from "react";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "../ui/dialog";
import { CallDialog } from "./call-dialog";
import { cn } from "@/lib/utils";
import { User as UserType } from "@/hooks/telephony/type";

export function HistoryCall({ user }: { user: UserType }) {
  const [selectedCall, setSelectedCall] = useState<CallHistoryItem | null>(
    null
  );

  // Состояние для текущего выбранного периода фильтрации
  const [periodFilter, setPeriodFilter] = useState<DateFilterPeriod>("today");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Ref для отслеживания последнего элемента для бесконечной прокрутки
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastCallElementRef = useRef<HTMLDivElement | null>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFetchCallHistory({
    userId: user.id,
    period: periodFilter,
  });

  // Преобразуем данные из пагинированного формата в плоский массив
  const callHistory = data?.pages.flatMap((page) => page.history) || [];
  const totalCount = data?.pages[0]?.totalCount || 0;

  // Дополнительный scroll listener для мобильных устройств
  useEffect(() => {
    const handleScroll = () => {
      // Проверяем только для мобильных устройств
      if (window.innerWidth >= 768) return;

      if (isLoading || isFetchingNextPage || !hasNextPage) return;

      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Если прокрутили до конца (осталось 100px)
      if (scrollTop + windowHeight >= documentHeight - 100) {
        fetchNextPage();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isLoading]);

  // Функция для наблюдения за последним элементом (только для десктопа)
  const lastCallRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading || isFetchingNextPage) return;

      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });

      if (node) {
        lastCallElementRef.current = node;
        observerRef.current.observe(node);
      }
    },
    [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  // Функция для изменения периода фильтрации
  const handlePeriodChange = (period: DateFilterPeriod) => {
    setPeriodFilter(period);
  };

  // Получаем название текущего фильтра для отображения
  const getPeriodFilterName = (period: DateFilterPeriod): string => {
    switch (period) {
      case "today":
        return "Сегодня";
      case "week":
        return "За неделю";
      case "month":
        return "За месяц";
      case "year":
        return "За год";
      case "all":
        return "Все время";
      default:
        return "Все время";
    }
  };

  // Функция для форматирования длительности звонка
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Функция для получения стоимости звонка из БД (в рублях)
  const getCallCostFromDB = (call: CallHistoryItem): number => {
    // callCost в БД хранится в копейках, переводим в рубли
    return (call.callCost || 0) / 100;
  };

  // Функция для форматирования стоимости звонка
  const formatCost = (cost: number): string => {
    return cost.toFixed(2) + " ₽";
  };

  // Функция для отображения статуса звонка
  const renderCallStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <Badge variant="success">Завершен</Badge>;
      case "failed":
        return <Badge variant="destructive">Ошибка</Badge>;
      case "busy":
        return <Badge variant="warning">Занято</Badge>;
      case "auto":
        return (
          <Badge variant="outline" className="bg-blue-500 text-white">
            Автоответ
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Функция для отображения иконки статуса звонка
  const renderStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <Check className="h-5 w-5 text-green-500" />;
      case "failed":
        return <X className="h-5 w-5 text-red-500" />;
      case "busy":
        return <PhoneOff className="h-5 w-5 text-amber-500" />;
      case "no_answer":
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Phone className="h-5 w-5 text-gray-500" />;
    }
  };

  // Компонент для отображения детальной информации о звонке
  const CallDetails = ({ call }: { call: CallHistoryItem }) => {
    // Получаем стоимость звонка из БД
    const calculatedCost = getCallCostFromDB(call);

    return (
      <div className="space-y-6">
        {/* Основная информация */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm text-neutral-500">Дата и время</div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-neutral-400" />
              <div>
                {format(new Date(call.callTime), "dd.MM.yyyy HH:mm:ss")}
              </div>
            </div>
            <div className="text-xs text-neutral-400">
              {formatDistanceToNow(new Date(call.callTime), {
                addSuffix: true,
                locale: ru,
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm text-neutral-500">Длительность</div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-neutral-400" />
              <div>{formatDuration(call.callDuration)}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm text-neutral-500">Номер отправителя</div>
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-neutral-400" />
              <div>{call.callerNumber}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm text-neutral-500">Номер получателя</div>
            <div className="flex items-center space-x-2">
              <PhoneIcon className="h-4 w-4 text-neutral-400" />
              <div>{call.calleeNumber}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm text-neutral-500">Стоимость звонка</div>
            <div className="flex flex-col">
              <div>{formatCost(calculatedCost)}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm text-neutral-500">Направление звонка</div>
            <div className="flex flex-col">
              <div>
                {call.callType === "inbound" ? "Входящий" : "Исходящий"}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm text-neutral-500">Статус</div>
            <div>{renderCallStatus(call.callStatus)}</div>
          </div>
        </div>

        {/* Запись звонка */}
        {call.recordUrl && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Запись звонка</div>
            <div>
              <a
                href={call.recordUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-primary hover:underline"
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                <span>Прослушать запись</span>
              </a>
            </div>
          </div>
        )}

        {/* История диалога */}
        {call.chatHistory && call.chatHistory.length > 0 && (
          <CallDialog chatHistory={call.chatHistory} />
        )}
      </div>
    );
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
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex flex-col">
          <CardTitle className="text-base md:text-lg">
            История исходящих
            {totalCount > 0 && (
              <span className="text-sm font-normal ml-2 text-neutral-500">
                ({totalCount})
              </span>
            )}
          </CardTitle>
          {callHistory.length > 0 && (
            <div className="text-sm text-neutral-500 mt-1">
              Фильтр: {getPeriodFilterName(periodFilter)}
            </div>
          )}
          <div className="grid grid-cols-2 md:flex gap-2 mt-1 w-full max-w-screen-sm">
            <div className="flex gap-1 items-center">
              <div className="h-4 w-4 md:h-5 mdw-5 bg-green-300 rounded-full"></div>
              <div className="text-xs md:text-base">Входящие</div>
            </div>
            <div className="flex gap-1 items-center">
              <div className="h-4 w-4 md:h-5 md:w-5 bg-blue-300 rounded-full"></div>
              <div className="text-xs md:text-base">Исходящие</div>
            </div>
            <div className="flex gap-1 items-center">
              <div className="h-4 w-4 md:h-5 md:w-5 bg-red-300 rounded-full"></div>
              <div className="text-xs md:text-base">Ошибки</div>
            </div>
            <div className="flex gap-1 items-center">
              <div className="h-4 w-4 md:h-5 md:w-5 border border-black rounded-full"></div>
              <div className="text-xs md:text-base">Автоответ</div>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-xs md:text-sm h-8 md:h-9"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          Обновить
        </Button>
      </CardHeader>
      <CardContent>
        {/* Кнопки фильтрации */}

        <div className="flex gap-2 mb-4 w-full max-w-[290px] md:max-w-full overflow-x-auto whitespace-nowrap">
          <Button
            variant={periodFilter === "today" ? "default" : "outline"}
            size="sm"
            onClick={() => handlePeriodChange("today")}
          >
            Сегодня
          </Button>
          <Button
            variant={periodFilter === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => handlePeriodChange("week")}
          >
            За неделю
          </Button>
          <Button
            variant={periodFilter === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => handlePeriodChange("month")}
          >
            За месяц
          </Button>
          <Button
            variant={periodFilter === "year" ? "default" : "outline"}
            size="sm"
            onClick={() => handlePeriodChange("year")}
          >
            За год
          </Button>
          <Button
            variant={periodFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => handlePeriodChange("all")}
          >
            Все время
          </Button>
        </div>

        {isLoading && !isFetchingNextPage ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <div className="text-center p-8 text-red-500">
            <p>Ошибка при загрузке истории звонков</p>
            <p className="text-sm">{error?.message || "Неизвестная ошибка"}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="mt-2"
            >
              Повторить
            </Button>
          </div>
        ) : callHistory.length === 0 ? (
          <div className="text-center p-8 text-neutral-500">
            <Phone className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>
              У вас пока нет истории звонков
              {periodFilter !== "all" ? ` за выбранный период` : ""}
            </p>
          </div>
        ) : (
          <>
            {/* Мобильный вид (карточки) */}
            <div className="block md:hidden space-y-4">
              {callHistory.map((call, index) => (
                <div key={call.id}>
                  <Dialog>
                    <Card className="overflow-hidden">
                      <CardContent
                        className={cn("p-4", {
                          "bg-green-100":
                            call.callType === "inbound" &&
                            call.callStatus === "completed",
                          "bg-blue-100":
                            call.callType === "outbound" &&
                            call.callStatus === "completed",
                          "bg-red-100": call.callStatus === "failed",
                        })}
                      >
                        <div className="flex items-start justify-between ">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800">
                              {renderStatusIcon(call.callStatus)}
                            </div>
                            <div>
                              <div className="font-medium">
                                {call.calleeNumber}
                              </div>
                              <div className="text-xs text-neutral-500">
                                {format(
                                  new Date(call.callTime),
                                  "dd.MM.yyyy HH:mm"
                                )}
                              </div>
                            </div>
                          </div>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-neutral-500">
                              Длительность:
                            </span>{" "}
                            {formatDuration(call.callDuration)}
                          </div>
                          <div>
                            <span className="text-neutral-500">Стоимость:</span>{" "}
                            {formatCost(getCallCostFromDB(call))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Детали звонка</DialogTitle>
                      </DialogHeader>
                      <CallDetails call={call} />
                    </DialogContent>
                  </Dialog>
                </div>
              ))}

              {/* Элемент для отслеживания конца списка в мобильной версии */}
              {callHistory.length > 0 && (
                <div ref={lastCallRef} className="h-1 w-full" />
              )}
            </div>

            {/* Десктопный вид (таблица) */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата и время</TableHead>
                    <TableHead>Номер получателя</TableHead>
                    <TableHead>Номер отправителя</TableHead>
                    <TableHead>Длительность</TableHead>
                    <TableHead>Стоимость</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Запись</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {callHistory.map((call, index) => (
                    <TableRow
                      key={call.id}
                      className={cn(
                        "hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
                        {
                          "bg-green-100":
                            call.callType === "inbound" &&
                            call.callStatus === "completed",
                          "bg-blue-100":
                            call.callType === "outbound" &&
                            call.callStatus === "completed",
                          "bg-red-100": call.callStatus === "failed",
                        }
                      )}
                    >
                      <TableCell className="font-medium">
                        <div>
                          {format(new Date(call.callTime), "dd.MM.yyyy")}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {format(new Date(call.callTime), "HH:mm:ss")}
                        </div>
                        <div className="text-xs text-neutral-400">
                          {formatDistanceToNow(new Date(call.callTime), {
                            addSuffix: true,
                            locale: ru,
                          })}
                        </div>
                      </TableCell>
                      <TableCell>{call.calleeNumber}</TableCell>
                      <TableCell>{call.callerNumber}</TableCell>
                      <TableCell>{formatDuration(call.callDuration)}</TableCell>
                      <TableCell>
                        <div>{formatCost(getCallCostFromDB(call))}</div>
                      </TableCell>
                      <TableCell>{renderCallStatus(call.callStatus)}</TableCell>
                      <TableCell>
                        {call.recordUrl ? (
                          <a
                            href={call.recordUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-primary hover:underline"
                          >
                            <PlayCircle className="h-4 w-4 mr-1" />
                            <span className="text-xs">Запись</span>
                          </a>
                        ) : (
                          <span className="text-xs text-neutral-400">
                            Нет записи
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Подробнее
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                              <DialogTitle>Детали звонка</DialogTitle>
                            </DialogHeader>
                            <CallDetails call={call} />
                          </DialogContent>
                        </Dialog>
                        {index === callHistory.length - 1 && (
                          <div ref={lastCallRef} className="h-1" />
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
            {!hasNextPage && callHistory.length > 0 && (
              <div className="text-center py-4 text-neutral-500 text-sm">
                Вы достигли конца списка
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
