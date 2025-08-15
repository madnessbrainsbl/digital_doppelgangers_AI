import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";

interface DailyData {
  date: string;
  sent: number;
  success: number;
  failed: number;
}

interface EmailStatisticsSummary {
  totalCampaigns: number;
  totalRecipients: number;
  totalSuccess: number;
  totalFailed: number;
  averageSuccess: number;
}

interface EmailCampaignsChartProps {
  isLoading: boolean;
  dailyData?: DailyData[];
  summary?: EmailStatisticsSummary;
  dateLabels?: string[];
  timeRange: string;
}

export default function EmailCampaignsChart({
  isLoading,
  dailyData = [],
  summary,
  timeRange,
}: EmailCampaignsChartProps) {
  // Отслеживание ширины окна для адаптивного отображения
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Функция для определения, является ли текущая ширина экрана мобильной
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Проверяем при первой загрузке
    checkIsMobile();

    // Добавляем слушателя изменения размера окна
    window.addEventListener("resize", checkIsMobile);

    // Очистка при размонтировании
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Получаем даты для показа в тиках оси X
  const getXAxisTicks = () => {
    if (!dailyData || dailyData.length === 0) return [];

    // Сортируем данные по дате
    const sortedData = [...dailyData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Получаем первую и последнюю даты
    const firstDate = new Date(sortedData[0].date);
    const lastDate = new Date(sortedData[sortedData.length - 1].date);

    // Для мобильной версии с годовым интервалом показываем только 3 точки
    if (isMobile && timeRange === "year") {
      // Первая дата (начало периода)
      const startDate = firstDate.getTime();

      // Средняя дата (середина периода)
      const middleTimestamp = (firstDate.getTime() + lastDate.getTime()) / 2;
      const middleDate = new Date(middleTimestamp);

      // Последняя дата (конец периода)
      const endDate = lastDate.getTime();

      // Возвращаем только метки начала, середины и конца
      return [
        sortedData[0].date,
        sortedData[Math.floor(sortedData.length / 2)].date,
        sortedData[sortedData.length - 1].date,
      ];
    }

    // Для десктопной версии или других периодов возвращаем все даты
    return undefined;
  };

  // Форматирование даты для отображения в графике
  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr);

    // Для годового интервала отображаем месяц и год
    if (timeRange === "year") {
      // Массив русских названий месяцев (сокращенные)
      const months = [
        "Янв",
        "Фев",
        "Мар",
        "Апр",
        "Май",
        "Июн",
        "Июл",
        "Авг",
        "Сен",
        "Окт",
        "Ноя",
        "Дек",
      ];

      // Возвращаем месяц и год для лучшего понимания временного диапазона
      return `${months[date.getMonth()]} ${date.getFullYear()}`;
    }

    // Для недели и месяца - только число и месяц
    return `${date.getDate().toString().padStart(2, "0")}.${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}`;
  };

  // Настройка формата тултипа
  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(label);
      const formattedDate = `${date.getDate().toString().padStart(2, "0")}.${(
        date.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}.${date.getFullYear()}`;

      // Получаем данные для текущей даты
      const currentData = dailyData.find((item) => item.date === label);

      return (
        <div className="bg-white dark:bg-neutral-900 p-2 border border-neutral-200 dark:border-neutral-800 rounded shadow-lg">
          <p className="text-sm font-medium mb-1">{formattedDate}</p>
          {currentData && (
            <>
              <p className="text-xs" style={{ color: "#8884d8" }}>
                Отправлено: {currentData.sent || 0}
              </p>
              <p className="text-xs" style={{ color: "#82ca9d" }}>
                Успешно: {currentData.success || 0}
              </p>
              <p className="text-xs" style={{ color: "#ff8042" }}>
                Ошибки: {currentData.failed || 0}
              </p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!dailyData || dailyData.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-2">Статистика рассылок</h3>
          <div className="h-[300px] flex items-center justify-center bg-neutral-50 dark:bg-neutral-800 rounded-lg">
            <p className="text-neutral-500 dark:text-neutral-400">
              Нет данных о рассылках за выбранный период
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Получаем метки для оси X
  const ticks = getXAxisTicks();

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">Статистика рассылок</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {timeRange === "week"
                ? "Последние 7 дней"
                : timeRange === "month"
                ? "Последние 30 дней"
                : timeRange === "year"
                ? "Текущий год"
                : "Выбранный период"}
            </p>
          </div>
          {summary && (
            <div className="flex flex-wrap gap-4 mt-4 md:mt-0">
              <div className="text-center">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Кампаний
                </p>
                <p className="text-2xl font-semibold">
                  {summary.totalCampaigns}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Получателей
                </p>
                <p className="text-2xl font-semibold">
                  {summary.totalRecipients}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Успешность
                </p>
                <p className="text-2xl font-semibold">
                  {summary.averageSuccess}%
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dailyData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxis}
                tick={{ fontSize: 12 }}
                ticks={ticks}
                interval={
                  isMobile && timeRange === "year" ? 0 : "preserveStartEnd"
                }
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={customTooltip} />
              <Legend />
              <Bar dataKey="sent" name="Отправлено" fill="#8884d8" />
              <Bar dataKey="success" name="Успешно" fill="#82ca9d" />
              <Bar dataKey="failed" name="Ошибки" fill="#ff8042" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
