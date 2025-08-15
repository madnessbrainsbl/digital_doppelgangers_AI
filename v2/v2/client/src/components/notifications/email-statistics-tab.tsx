import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import EmailCampaignsChart from "@/components/analytics/email-campaigns-chart";
import EmailCampaignsList from "@/components/analytics/email-campaigns-list";

export default function EmailStatisticsTab() {
  const [timeRange, setTimeRange] = useState("week");
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch email campaigns data
  const {
    data: emailCampaignsData,
    isLoading: isLoadingEmailCampaigns,
    refetch: refetchEmailCampaigns,
  } = useQuery<any>({
    queryKey: ["/api/email-campaigns", { period: timeRange }],
  });

  // Fetch email statistics
  const {
    data: emailStatisticsData,
    isLoading: isLoadingEmailStatistics,
    refetch: refetchEmailStatistics,
  } = useQuery<any>({
    queryKey: ["/api/email-statistics", { period: timeRange }],
  });

  // Обработчик изменения периода
  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
    refetchEmailCampaigns();
    refetchEmailStatistics();
  };

  // Получение текстового представления выбранного периода
  const getPeriodText = (period: string) => {
    switch (period) {
      case "week":
        return "за неделю";
      case "month":
        return "за месяц";
      case "year":
        return "за год";
      case "all":
        return "за всё время";
      default:
        return "за выбранный период";
    }
  };

  // Функция для проверки, входит ли дата в выбранный период
  const isDateInRange = (dateString: string, range: string) => {
    if (!dateString) return false;

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return false;
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      switch (range) {
        case "week":
          const weekAgo = new Date(today);
          weekAgo.setDate(today.getDate() - 7);
          return date >= weekAgo;
        case "month":
          const monthAgo = new Date(today);
          monthAgo.setMonth(today.getMonth() - 1);
          return date >= monthAgo;
        case "year":
          const yearAgo = new Date(today);
          yearAgo.setFullYear(today.getFullYear() - 1);
          return date >= yearAgo;
        case "all":
          return true;
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  };

  // Фильтрация рассылок по выбранному периоду
  const filteredCampaigns = useMemo(() => {
    if (!emailCampaignsData?.campaigns) {
      return [];
    }

    return emailCampaignsData.campaigns.filter((campaign: any) => {
      const dateToCheck =
        campaign.sentDate || campaign.date || campaign.createdAt;
      return isDateInRange(dateToCheck, timeRange);
    });
  }, [emailCampaignsData, timeRange]);

  // Проверка наличия данных в выбранном периоде
  const hasDataInPeriod = filteredCampaigns.length > 0;

  // Фильтрация данных статистики по выбранному периоду
  const filteredDailyData = useMemo(() => {
    if (!emailStatisticsData?.dailyData) {
      return [];
    }

    return emailStatisticsData.dailyData.filter((item: any) => {
      return isDateInRange(item.date, timeRange);
    });
  }, [emailStatisticsData, timeRange]);

  // Функция для форматирования даты
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Нет данных";
    const date = new Date(dateStr);
    return `${date.getDate().toString().padStart(2, "0")}.${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}.${date.getFullYear()} ${date
      .getHours()
      .toString()
      .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  };

  // Функция для получения названия статуса на русском
  const getStatusName = (status: string) => {
    switch (status) {
      case "pending":
        return "В процессе";
      case "completed":
        return "Завершено";
      case "completed_with_errors":
        return "Завершено с ошибками";
      case "failed":
        return "Ошибка";
      default:
        return status;
    }
  };

  // Функция для открытия диалога с деталями рассылки
  const openCampaignDetails = (campaign: any) => {
    setSelectedCampaign(campaign);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Модальное окно с деталями рассылки */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[90vw] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl text-primary-600">
              {selectedCampaign?.name || ""}
            </DialogTitle>
            <DialogDescription>
              Подробная информация о рассылке
            </DialogDescription>
          </DialogHeader>

          {selectedCampaign && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                  <p className="text-sm text-neutral-500 mb-1">ID</p>
                  <p className="font-medium">{selectedCampaign.id}</p>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                  <p className="text-sm text-neutral-500 mb-1">Статус</p>
                  <div className="flex items-center">
                    <span
                      className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        selectedCampaign.status === "completed"
                          ? "bg-green-500"
                          : selectedCampaign.status === "pending"
                          ? "bg-yellow-500"
                          : selectedCampaign.status === "completed_with_errors"
                          ? "bg-orange-500"
                          : "bg-red-500"
                      }`}
                    ></span>
                    <p className="font-medium">
                      {getStatusName(selectedCampaign.status)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                <p className="text-sm text-neutral-500 mb-1">Тема</p>
                <p className="font-medium">{selectedCampaign.subject}</p>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                <p className="text-sm text-neutral-500 mb-1">Шаблон</p>
                <p className="font-medium">
                  {selectedCampaign.template ||
                    selectedCampaign.templateType ||
                    "Стандартный"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                  <p className="text-sm text-neutral-500 mb-1">Получателей</p>
                  <p className="font-medium">
                    {selectedCampaign.recipientCount}
                  </p>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                  <p className="text-sm text-neutral-500 mb-1">
                    Успешно отправлено
                  </p>
                  <p className="font-medium">
                    {selectedCampaign.successCount}
                    <span className="text-sm text-neutral-500 ml-1">
                      (
                      {selectedCampaign.recipientCount > 0
                        ? Math.round(
                            (selectedCampaign.successCount /
                              selectedCampaign.recipientCount) *
                              100
                          )
                        : 0}
                      %)
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                  <p className="text-sm text-neutral-500 mb-1">Дата создания</p>
                  <p className="font-medium">
                    {formatDate(selectedCampaign.createdAt)}
                  </p>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                  <p className="text-sm text-neutral-500 mb-1">Дата отправки</p>
                  <p className="font-medium">
                    {selectedCampaign.sentDate
                      ? formatDate(selectedCampaign.sentDate)
                      : (selectedCampaign.status === "completed" ||
                          selectedCampaign.status ===
                            "completed_with_errors") &&
                        selectedCampaign.successCount > 0
                      ? formatDate(selectedCampaign.createdAt)
                      : "Не отправлено"}
                  </p>
                </div>
              </div>

              {selectedCampaign.failedCount > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400 mb-1">
                    Неудачных отправок
                  </p>
                  <p className="font-medium text-red-700 dark:text-red-300">
                    {selectedCampaign.failedCount}
                    <span className="text-sm text-red-500 dark:text-red-400 ml-1">
                      (
                      {selectedCampaign.recipientCount > 0
                        ? Math.round(
                            (selectedCampaign.failedCount /
                              selectedCampaign.recipientCount) *
                              100
                          )
                        : 0}
                      %)
                    </span>
                  </p>
                </div>
              )}

              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setDialogOpen(false)}
                >
                  Закрыть
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Email Campaigns Chart */}
      <EmailCampaignsChart
        dailyData={filteredDailyData}
        summary={emailStatisticsData?.summary || {}}
        isLoading={isLoadingEmailStatistics}
        timeRange={timeRange}
      />

      {/* Period Selection */}
      <div className="flex flex-col gap-4 mb-4">
        <h3 className="text-xl font-semibold">Список рассылок</h3>
        <Select defaultValue={timeRange} onValueChange={handleTimeRangeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите период" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">За неделю</SelectItem>
            <SelectItem value="month">За месяц</SelectItem>
            <SelectItem value="year">За год</SelectItem>
            <SelectItem value="all">За всё время</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Мобильная версия таблицы рассылок */}
      <div className="block md:hidden space-y-3">
        {isLoadingEmailCampaigns ? (
          <div className="py-8 text-center">
            <span className="material-icons animate-spin text-primary-500">
              sync
            </span>
            <p className="mt-2 text-neutral-500">Загрузка данных...</p>
          </div>
        ) : !hasDataInPeriod ? (
          <div className="text-center py-8 text-neutral-500">
            Нет рассылок за выбранный период ({getPeriodText(timeRange)})
          </div>
        ) : (
          filteredCampaigns.map((campaign: any) => (
            <div
              key={campaign.id}
              className="border rounded-lg p-4 bg-white dark:bg-neutral-800"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-primary-600">
                  {campaign.name}
                </span>
                <span className="text-xs text-neutral-500 bg-neutral-100 dark:bg-neutral-700 py-1 px-2 rounded-full">
                  ID: {campaign.id}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-neutral-500 dark:text-neutral-400">Тема</p>
                  <p className="font-medium">{campaign.subject}</p>
                </div>
                <div>
                  <p className="text-neutral-500 dark:text-neutral-400">
                    Статус
                  </p>
                  <div className="flex items-center">
                    <span
                      className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        campaign.status === "completed"
                          ? "bg-green-500"
                          : campaign.status === "pending"
                          ? "bg-yellow-500"
                          : campaign.status === "completed_with_errors"
                          ? "bg-orange-500"
                          : "bg-red-500"
                      }`}
                    ></span>
                    <p className="font-medium">
                      {getStatusName(campaign.status)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex justify-between items-center">
                <div className="text-xs text-neutral-500">
                  <p className="text-neutral-500 dark:text-neutral-400">
                    Успешно отправлено
                  </p>
                  <p className="font-medium">
                    {campaign.successCount}
                    <span className="text-sm text-neutral-500 ml-1">
                      (
                      {campaign.recipientCount > 0
                        ? Math.round(
                            (campaign.successCount / campaign.recipientCount) *
                              100
                          )
                        : 0}
                      %)
                    </span>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openCampaignDetails(campaign)}
                >
                  <span className="material-icons text-[18px]">more_horiz</span>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Десктопная версия таблицы */}
      <div className="hidden md:block">
        {!hasDataInPeriod && !isLoadingEmailCampaigns ? (
          <div className="text-center py-8 text-neutral-500">
            Нет рассылок за выбранный период ({getPeriodText(timeRange)})
          </div>
        ) : (
          <EmailCampaignsList
            campaigns={filteredCampaigns}
            isLoading={isLoadingEmailCampaigns}
          />
        )}
      </div>
    </div>
  );
}
