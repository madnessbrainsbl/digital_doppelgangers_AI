import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/shared/page-header";
import MetricsCard from "@/components/dashboard/metrics-card";
import ActivityItem from "@/components/dashboard/activity-item";
import { AssistantCard } from "@/components/dashboard/assistant-card";
import FileCard from "@/components/knowledge-base/file-card";
import BalanceCard from "@/components/dashboard/balance-card";
import PaymentHistory from "@/components/dashboard/payment-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VideoDialog } from "@/components/ui/video-dialog";
import { generateDateLabels } from "@/lib/utils/charts";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { formatFileSize, KNOWLEDGE_FILE_TYPES } from "@/lib/constants";
import { RefreshCw, X, Plus, Upload, Book } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocation } from "wouter";
import DashboardInstructionsDialog from "@/components/dashboard/dashboard-instructions-dialog";

interface ActivityContentProps {
  action: string;
  details: any;
}

const ActivityContent = ({ action, details }: ActivityContentProps) => {
  switch (action) {
    case "processed_requests":
      return (
        <>
          <span className="font-medium">
            Ассистент {details.assistantName || "без имени"}
          </span>{" "}
          обработал{" "}
          <span className="font-medium">{details.count} новых сообщений</span>
        </>
      );
    case "added_team_member":
      return (
        <>
          <span className="font-medium">{details.name || "Пользователь"}</span>{" "}
          был добавлен в команду с ролью{" "}
          <span className="font-medium">{details.role || "участник"}</span>
        </>
      );
    case "sent_newsletter":
      return (
        <>
          Рассылка{" "}
          <span className="font-medium">{details.name || "без названия"}</span>{" "}
          была отправлена{" "}
          <span className="font-medium">
            {details.recipients || 0} пользователям
          </span>
        </>
      );
    case "connected_channel":
      return (
        <>
          Канал{" "}
          <span className="font-medium">{details.name || "без названия"}</span>{" "}
          был успешно подключен к системе
        </>
      );
    case "payment_received":
      return (
        <>
          Получен платеж на сумму{" "}
          <span className="font-medium">{details.amount || 0} руб.</span>
        </>
      );
    case "assistant_created":
      return (
        <>
          Создан новый ассистент{" "}
          <span className="font-medium">{details.name || "без имени"}</span>
        </>
      );
    case "knowledge_base_updated":
      return (
        <>
          Файл{" "}
          <span className="font-medium">
            {details.fileName || "без названия"}
          </span>{" "}
          добавлен в базу знаний
        </>
      );
    default:
      return <>{action}</>;
  }
};

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [timeRange, setTimeRange] = useState("week");
  const [location] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [instructionsDialogOpen, setInstructionsDialogOpen] = useState(false);

  // Эффект для определения мобильного устройства
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1500); // sm breakpoint в Tailwind
    };

    // Проверка при монтировании
    checkIsMobile();

    // Проверка при изменении размера окна
    window.addEventListener("resize", checkIsMobile);

    // Очистка при размонтировании
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Получаем текущего пользователя
  const { data: userData, isLoading: isLoadingUser } = useQuery<{
    id: number;
    name: string | null;
    email: string;
    role: string;
  }>({
    queryKey: ["/api/auth/me"],
  });

  // Обработчик изменения периода времени
  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
    // Ручную инвалидацию здесь делать не нужно,
    // так как запросы используют timeRange в качестве зависимости,
    // и React Query автоматически обновит данные
  };
  const [isUpdatingMetrics, setIsUpdatingMetrics] = useState(false);

  // Fetch active dialogs data
  const { data: activeDialogs, isLoading: isLoadingDialogs } = useQuery<
    { date: string; count: number }[]
  >({
    queryKey: ["/api/metrics/active-dialogs", timeRange],
    queryFn: () =>
      apiRequest({
        url: `/api/metrics/active-dialogs?period=${timeRange}`,
        method: "GET",
      }),
  });

  // Fetch metrics for the current period
  const { data: periodMetrics, isLoading: isLoadingPeriodMetrics } =
    useQuery<any>({
      queryKey: ["/api/metrics/period", timeRange],
      queryFn: () =>
        apiRequest({
          url: `/api/metrics/period?period=${timeRange}`,
          method: "GET",
        }),
    });

  // Fetch recent activity
  const { data: activityData, isLoading: isLoadingActivity } = useQuery<any[]>({
    queryKey: ["/api/activity"],
  });

  // Fetch assistants
  const { data: assistantsData, isLoading: isLoadingAssistants } = useQuery<
    any[]
  >({
    queryKey: ["/api/assistants"],
  });

  // Fetch knowledge base items
  const { data: knowledgeData, isLoading: isLoadingKnowledge } = useQuery<
    any[]
  >({
    queryKey: ["/api/knowledge"],
  });

  // Мутация для обновления метрик
  const updateMetricsMutation = useMutation({
    mutationFn: () =>
      apiRequest({ url: "/api/metrics/update", method: "POST" }),
    onSuccess: () => {
      // Инвалидируем кэш метрик и активных диалогов, чтобы получить обновленные данные
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/metrics/active-dialogs", timeRange],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/metrics/period", timeRange],
      });

      toast({
        title: "Метрики обновлены",
        description: "Данные аналитики успешно обновлены",
      });
      setIsUpdatingMetrics(false);
    },
    onError: (error) => {
      console.error("Ошибка при обновлении метрик:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить метрики",
        variant: "destructive",
      });
      setIsUpdatingMetrics(false);
    },
  });

  // Функция для обновления метрик
  const handleUpdateMetrics = () => {
    setIsUpdatingMetrics(true);
    updateMetricsMutation.mutate();
  };

  const handleCreateAssistant = () => {
    window.location.href = "/assistants";
  };

  const handleUploadFile = () => {
    window.location.href = "/knowledge-base";
  };

  const getFileTypeInfo = (fileType: string) => {
    const fileTypeInfo = KNOWLEDGE_FILE_TYPES.find(
      (type) => type.id === fileType
    );
    return fileTypeInfo || KNOWLEDGE_FILE_TYPES[0];
  };

  const dateLabels = generateDateLabels();

  const latestMetric = null; // Убираем использование глобальных метрик

  // Получаем соответствующие метрики за выбранный период
  const isLoadingAnyMetrics = isLoadingPeriodMetrics || isLoadingDialogs;

  // Строка для отображения периода в интерфейсе
  const periodLabel =
    {
      day: "за сегодня",
      week: "за неделю",
      month: "за месяц",
      year: "за год",
    }[timeRange] || "за неделю";

  return (
    <div id="dashboard-content" className="px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-3">
            <PageHeader
              title="Панель управления"
              description="Аналитика, статистика и ключевые показатели вашего аккаунта"
              className="mb-0"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setInstructionsDialogOpen(true)}
              title="Инструкция по панели управления"
              className="bg-purple-200 hover:bg-purple-300"
            >
              <Book className="h-5 w-5" />
            </Button>
          </div>
          <div className="mt-2">
            <VideoDialog
              buttonText="Смотреть презентацию"
              dialogTitle="Презентация платформы Асиссто"
              videoUrl="https://rutube.ru/play/embed/e2cce8090edb9b0943a3446724ecf7f9/"
              description="Продолжительность: 01:27 • Общий функционал платформы"
            />
          </div>
        </div>
        <div className="flex flex-col xs:flex-row items-start xs:items-center gap-4 w-full sm:w-auto">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-full xs:w-[180px]">
              <SelectValue placeholder="Выберите период" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">За день</SelectItem>
              <SelectItem value="week">За неделю</SelectItem>
              <SelectItem value="month">За месяц</SelectItem>
              <SelectItem value="year">За год</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleUpdateMetrics}
            disabled={isUpdatingMetrics || isLoadingAnyMetrics}
            className="flex items-center gap-2 w-full xs:w-auto"
          >
            <RefreshCw
              className={`h-4 w-4 ${isUpdatingMetrics ? "animate-spin" : ""}`}
            />
            <span>
              {isUpdatingMetrics ? "Обновление..." : "Обновить метрики"}
            </span>
          </Button>
        </div>
      </div>

      {/* Key Metrics - улучшаем адаптивность с sm для планшетов */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <MetricsCard
          title="Активных диалогов"
          value={periodMetrics?.totalConversations ?? 0}
          icon="forum"
          subtitle={!periodMetrics ? "Нет данных" : periodLabel}
          isLoading={isLoadingAnyMetrics}
        />

        <MetricsCard
          title="Всего сообщений"
          value={periodMetrics?.totalMessages ?? 0}
          icon="message"
          subtitle={periodLabel}
          iconColor="text-blue-500 dark:text-blue-400"
          isLoading={isLoadingAnyMetrics}
        />

        <MetricsCard
          title="Среднее время ответа"
          value={`${
            periodMetrics?.avgResponseTime
              ? (periodMetrics.avgResponseTime / 1000).toFixed(1)
              : "0.0"
          } сек`}
          icon="schedule"
          iconColor="text-amber-500 dark:text-amber-400"
          isLoading={isLoadingAnyMetrics}
        />

        <MetricsCard
          title="Успешных ответов"
          value={`${periodMetrics?.successRate ?? 0}%`}
          icon="check_circle"
          iconColor="text-green-500 dark:text-green-400"
          isLoading={isLoadingAnyMetrics}
        />
      </div>

      {/* Charts and Analysis - улучшаем адаптивность с md для средних устройств */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Conversations Chart */}
        <Card className="col-span-1 md:col-span-2">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex flex-col xs:flex-row xs:items-center justify-between mb-4 gap-2">
              <h3 className="font-medium text-neutral-900 dark:text-white">
                Активность диалогов {periodLabel}
              </h3>
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                {timeRange === "day"
                  ? "По часам"
                  : timeRange === "week"
                  ? "По дням"
                  : timeRange === "month"
                  ? "По неделям"
                  : "По месяцам"}
              </span>
            </div>
            <div className="h-48 sm:h-64 flex items-end space-x-1 px-1 py-2 bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-800 dark:to-neutral-900 rounded-md overflow-hidden border border-neutral-200 dark:border-neutral-700 shadow-inner">
              {isLoadingDialogs ? (
                <div className="w-full h-full flex items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary-500" />
                </div>
              ) : !activeDialogs || activeDialogs.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-neutral-500">
                  Пока нет данных. Они появятся по мере использования
                </div>
              ) : (
                <>
                  {activeDialogs.map(
                    (item: { date: string; count: number }, index: number) => {
                      // Находим максимальное значение для масштабирования
                      const maxCount = Math.max(
                        ...activeDialogs.map((d: any) => d.count)
                      );
                      // Минимальная высота колонки - 5px для ненулевых значений, максимальная - 90%
                      // Прямое определение высоты в зависимости от значения count
                      const heightPercent =
                        item.count > 0
                          ? maxCount > 0
                            ? 10 + Math.round((item.count / maxCount) * 80)
                            : 10
                          : 0;
                      // Если heightPercent > 0, устанавливаем высоту в процентах, иначе 0
                      const height =
                        heightPercent > 0 ? `${heightPercent}%` : "0";

                      // Цвета колонок
                      const getColor = (count: number) => {
                        // Зависит от значения - чем больше, тем насыщеннее
                        const colors = [
                          "bg-green-200 dark:bg-green-900",
                          "bg-green-300 dark:bg-green-800",
                          "bg-green-400 dark:bg-green-700",
                          "bg-green-500 dark:bg-green-600",
                          "bg-green-600 dark:bg-green-500",
                        ];
                        const maxIndex = colors.length - 1;

                        if (maxCount === 0) return colors[0];

                        // Индекс цвета зависит от количества диалогов
                        const colorIndex = Math.min(
                          Math.floor((count / maxCount) * maxIndex),
                          maxIndex
                        );

                        return colors[colorIndex];
                      };

                      return (
                        <div
                          key={index}
                          className={`flex-1 ${
                            item.count > 0 ? getColor(item.count) : ""
                          } rounded-t flex items-center justify-center relative group`}
                          style={{
                            height: height,
                            minHeight: item.count > 0 ? "10px" : "0",
                            marginTop: "auto", // Прижимаем к нижней части контейнера
                            border:
                              item.count > 0
                                ? "1px solid rgba(0,0,0,0.1)"
                                : "none",
                            boxShadow:
                              item.count > 0
                                ? "0 -2px 5px rgba(0,0,0,0.05)"
                                : "none",
                            transition:
                              "height 0.3s ease-in-out, background-color 0.3s ease",
                          }}
                        >
                          {item.count > 0 && (
                            <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-neutral-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                              {item.count}
                            </span>
                          )}
                        </div>
                      );
                    }
                  )}
                </>
              )}
            </div>
            <div className="grid grid-flow-col  mt-2 text-xs text-neutral-500 dark:text-neutral-400 sm:flex sm:justify-between h-4 sm:h-auto">
              {activeDialogs && Array.isArray(activeDialogs) ? (
                timeRange === "day" && isMobile ? (
                  // Для мобильной версии при просмотре по дням используем фиксированный набор меток
                  ["00", "04", "08", "12", "16", "20"].map((hour, index) => (
                    <span key={index} className="text-center whitespace-nowrap">
                      {hour}:00
                    </span>
                  ))
                ) : (
                  activeDialogs.map((item: { date: string }, index: number) => {
                    // Преобразуем формат даты в зависимости от периода
                    let displayDate = "";

                    if (timeRange === "day") {
                      // Для периода "день" данные приходят в формате "ЧЧ:00"
                      // Убираем лидирующие нули для улучшения читаемости
                      const hourMatch = item.date.match(/^(\d+):00$/);
                      if (hourMatch) {
                        const hour = parseInt(hourMatch[1]);
                        displayDate = `${hour}:00`;
                      } else {
                        displayDate = item.date;
                      }
                    } else if (timeRange === "week") {
                      // Для периода "неделя" даты приходят в формате YYYY-MM-DD
                      const date = new Date(item.date);
                      // Для недели показываем день недели
                      displayDate = date.toLocaleDateString("ru-RU", {
                        weekday: "short",
                      });
                    } else if (timeRange === "month") {
                      // Для месяца показываем номер недели, формат "YYYY-MM-WX"
                      const weekMatch = item.date.match(/^.*-W(\d+)$/);
                      if (weekMatch) {
                        displayDate = `Нед ${weekMatch[1]}`;
                      } else {
                        displayDate = item.date;
                      }
                    } else {
                      // Для года показываем краткое название месяца, формат "YYYY-MM"
                      const monthMatch = item.date.match(/^(\d{4})-(\d{2})$/);
                      if (monthMatch) {
                        const yearMonth = new Date(
                          parseInt(monthMatch[1]),
                          parseInt(monthMatch[2]) - 1,
                          1
                        );
                        displayDate = yearMonth.toLocaleDateString("ru-RU", {
                          month: "short",
                        });
                      } else {
                        displayDate = item.date;
                      }
                    }

                    return (
                      <span
                        key={index}
                        className={`transform -rotate-90 sm:rotate-0 text-center sm:pt-0 flex items-end justify-center h-full sm:block ${
                          timeRange === "day"
                            ? "sm:min-w-[24px] min-w-[60px]"
                            : "min-w-[24px]"
                        }`}
                      >
                        {displayDate}
                      </span>
                    );
                  })
                )
              ) : (
                <span className="w-full text-center">Нет данных</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Popular Topics */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
              Популярные темы {periodLabel}
            </h3>
            {isLoadingAnyMetrics ? (
              <div className="flex justify-center py-6">
                <RefreshCw className="h-6 w-6 animate-spin text-neutral-400" />
              </div>
            ) : !periodMetrics?.topicData ||
              Object.keys(periodMetrics.topicData).length === 0 ? (
              <p className="text-neutral-500 dark:text-neutral-400 text-center py-4">
                Данные о темах появятся по мере общения пользователей с
                ассистентами
              </p>
            ) : (
              <ul className="space-y-3">
                {Object.entries(periodMetrics.topicData).map(
                  ([topic, percentage], index) => {
                    const colors = [
                      "bg-primary-600 dark:bg-primary-500",
                      "bg-secondary-500 dark:bg-secondary-400",
                      "bg-amber-500 dark:bg-amber-400",
                      "bg-red-500 dark:bg-red-400",
                      "bg-purple-500 dark:bg-purple-400",
                    ];
                    const color = colors[index % colors.length];

                    return (
                      <li key={topic} className="flex items-center">
                        <div className="h-2.5 rounded-full w-full bg-neutral-200 dark:bg-neutral-700">
                          <div
                            className={`h-2.5 rounded-full ${color}`}
                            style={{ width: `${percentage as number}%` }}
                          />
                        </div>
                        <span className="ml-2 text-sm text-neutral-700 dark:text-neutral-300 min-w-[50px]">
                          {percentage as number}%
                        </span>
                        <span className="ml-2 text-sm text-neutral-700 dark:text-neutral-300">
                          {topic}
                        </span>
                      </li>
                    );
                  }
                )}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Balance and Payment History - улучшаем для средних экранов */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-6">
        {/* Balance Card */}
        <div className="col-span-1">
          {userData && (
            <BalanceCard
              userId={userData.id}
              userName={userData.name}
              userEmail={userData.email}
            />
          )}
        </div>

        {/* Payment History */}
        <div className="col-span-1 md:col-span-2">
          <PaymentHistory userId={userData?.id || 0} />
        </div>
      </div>

      {/* Recent Assistants and Knowledge Base - улучшаем для средних экранов */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mt-6">
        {/* Recent Assistants */}
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-neutral-900 dark:text-white">
                Недавние ассистенты
              </h3>
              <a
                href="/assistants"
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                Все ассистенты
              </a>
            </div>
            <div className="space-y-3">
              {isLoadingAssistants ? (
                <p className="text-neutral-500 dark:text-neutral-400">
                  Загрузка ассистентов...
                </p>
              ) : !assistantsData || assistantsData.length === 0 ? (
                <p className="text-neutral-500 dark:text-neutral-400 text-center py-4">
                  У вас пока нет ассистентов. Создайте первого ассистента, чтобы
                  начать работу.
                </p>
              ) : (
                assistantsData
                  ?.slice(0, 3)
                  .map((assistant) => (
                    <AssistantCard
                      key={assistant.id}
                      icon={
                        assistant.role === "sales"
                          ? "support_agent"
                          : assistant.role === "consultant"
                          ? "school"
                          : "support"
                      }
                      iconBg={
                        assistant.role === "sales"
                          ? "bg-primary-100 dark:bg-primary-900"
                          : assistant.role === "consultant"
                          ? "bg-secondary-100 dark:bg-secondary-900"
                          : "bg-amber-100 dark:bg-amber-900"
                      }
                      iconColor={
                        assistant.role === "sales"
                          ? "text-primary-600 dark:text-primary-300"
                          : assistant.role === "consultant"
                          ? "text-secondary-600 dark:text-secondary-300"
                          : "text-amber-600 dark:text-amber-300"
                      }
                      name={assistant.name}
                      status={assistant.status as any}
                      lastUpdated={`Изменен ${new Date(
                        assistant.lastUpdated
                      ).toLocaleDateString("ru-RU", { weekday: "long" })}`}
                    />
                  ))
              )}
            </div>
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={handleCreateAssistant}
                className="w-full sm:w-auto border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900"
              >
                <span className="material-icons text-[18px] mr-1">add</span>
                <span>Создать ассистента</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Knowledge Base */}
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-neutral-900 dark:text-white">
                База знаний
              </h3>
              <a
                href="/knowledge-base"
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                Управление
              </a>
            </div>
            <div className="space-y-3">
              {isLoadingKnowledge ? (
                <p className="text-neutral-500 dark:text-neutral-400">
                  Загрузка файлов...
                </p>
              ) : !knowledgeData || knowledgeData.length === 0 ? (
                <p className="text-neutral-500 dark:text-neutral-400 text-center py-4">
                  База знаний пуста. Загрузите файлы для обучения ваших
                  ассистентов.
                </p>
              ) : (
                knowledgeData?.slice(0, 3).map((file) => {
                  const fileTypeInfo = getFileTypeInfo(file.fileType);
                  return (
                    <FileCard
                      key={file.id}
                      id={file.id}
                      icon={fileTypeInfo.icon}
                      iconBg={fileTypeInfo.bg}
                      iconColor={fileTypeInfo.color}
                      fileName={file.title}
                      fileSize={formatFileSize(file.fileSize)}
                      uploadDate={`Добавлен ${new Date(
                        file.uploadedAt
                      ).toLocaleDateString("ru-RU", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`}
                      onClick={() =>
                        (window.location.href = `/knowledge-base/${file.id}`)
                      }
                    />
                  );
                })
              )}
            </div>
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={handleUploadFile}
                className="w-full sm:w-auto border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900"
              >
                <span className="material-icons text-[18px] mr-1">
                  upload_file
                </span>
                <span>Загрузить файл</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metrics Info Card */}
      <Card className="mt-6">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-lg font-medium">
            Статистика и аналитика
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">
                Последнее обновление метрик
              </h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 break-words">
                {periodMetrics && periodMetrics.date
                  ? new Date(periodMetrics.date).toLocaleString("ru-RU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Метрики еще не собраны"}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">
                Статистика {periodLabel}
              </h4>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Активных диалогов
                  </p>
                  <div className="text-2xl font-bold">
                    {periodMetrics?.totalConversations ?? 0}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Ответов ассистентов
                  </p>
                  <div className="text-2xl font-bold">
                    {periodMetrics?.totalMessages ?? 0}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">
                Производительность {periodLabel}
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Успешность ответов
                  </span>
                  <span className="font-medium">
                    <div className="text-2xl font-bold">
                      {periodMetrics?.successRate ?? 0}%
                    </div>
                  </span>
                </div>
                <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full">
                  <div
                    className="h-2 bg-green-500 rounded-full"
                    style={{
                      width: `${periodMetrics?.successRate ?? 0}%`,
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2 mt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Среднее время ответа
                  </span>
                  <span className="font-medium">
                    <div className="text-2xl font-bold">
                      {periodMetrics?.avgResponseTime
                        ? (periodMetrics.avgResponseTime / 1000).toFixed(1)
                        : "0.0"}{" "}
                      сек
                    </div>
                  </span>
                </div>
                <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full">
                  <div
                    className="h-2 bg-blue-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        ((periodMetrics?.avgResponseTime || 0) / 5000) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="mt-6 mb-6">
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-neutral-900 dark:text-white">
              Недавняя активность
            </h3>
          </div>
          <div className="space-y-4">
            {isLoadingActivity ? (
              <p className="text-neutral-500 dark:text-neutral-400">
                Загрузка активностей...
              </p>
            ) : !activityData || activityData.length === 0 ? (
              <p className="text-neutral-500 dark:text-neutral-400 text-center py-4">
                История активности будет отображаться по мере использования
                системы
              </p>
            ) : (
              activityData?.slice(0, 4).map((activity) => {
                let iconInfo = {
                  icon: "info",
                  bg: "bg-blue-100 dark:bg-blue-900",
                  color: "text-blue-600 dark:text-blue-300",
                };

                switch (activity.action) {
                  case "processed_requests":
                    iconInfo = {
                      icon: "chat",
                      bg: "bg-primary-100 dark:bg-primary-900",
                      color: "text-primary-600 dark:text-primary-300",
                    };
                    break;
                  case "added_team_member":
                    iconInfo = {
                      icon: "person_add",
                      bg: "bg-green-100 dark:bg-green-900",
                      color: "text-green-600 dark:text-green-300",
                    };
                    break;
                  case "sent_newsletter":
                    iconInfo = {
                      icon: "notifications",
                      bg: "bg-amber-100 dark:bg-amber-900",
                      color: "text-amber-600 dark:text-amber-300",
                    };
                    break;
                  case "connected_channel":
                    iconInfo = {
                      icon: "link",
                      bg: "bg-blue-100 dark:bg-blue-900",
                      color: "text-blue-600 dark:text-blue-300",
                    };
                    break;
                  case "payment_received":
                    iconInfo = {
                      icon: "payments",
                      bg: "bg-green-100 dark:bg-green-900",
                      color: "text-green-600 dark:text-green-300",
                    };
                    break;
                  case "assistant_created":
                    iconInfo = {
                      icon: "smart_toy",
                      bg: "bg-purple-100 dark:bg-purple-900",
                      color: "text-purple-600 dark:text-purple-300",
                    };
                    break;
                  case "knowledge_base_updated":
                    iconInfo = {
                      icon: "auto_stories",
                      bg: "bg-teal-100 dark:bg-teal-900",
                      color: "text-teal-600 dark:text-teal-300",
                    };
                    break;
                }

                const timeAgo = new Date(activity.timestamp).toLocaleDateString(
                  "ru-RU",
                  {
                    weekday: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                );

                return (
                  <ActivityItem
                    key={activity.id}
                    icon={iconInfo.icon}
                    iconBg={iconInfo.bg}
                    iconColor={iconInfo.color}
                    content={
                      <ActivityContent
                        action={activity.action}
                        details={activity.details}
                      />
                    }
                    timestamp={timeAgo}
                  />
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Диалог инструкций */}
      <DashboardInstructionsDialog
        open={instructionsDialogOpen}
        onOpenChange={setInstructionsDialogOpen}
      />
    </div>
  );
}
