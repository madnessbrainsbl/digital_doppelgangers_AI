import { chartColors } from "@/lib/utils/charts";

interface ConversationsChartProps {
  dateLabels: string[];
  timeRange: string;
  isLoading?: boolean;
  chartData?: Array<{ date: string; count: number }>;
}

export default function ConversationsChart({
  dateLabels,
  timeRange,
  isLoading = false,
  chartData,
}: ConversationsChartProps) {
  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-neutral-500 dark:text-neutral-400">
          Загрузка данных...
        </p>
      </div>
    );
  }

  // Если нет данных, показываем сообщение
  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-800 dark:to-neutral-900 rounded p-4">
        <p className="text-neutral-400 dark:text-neutral-500 text-sm">
          Нет данных за выбранный период
        </p>
      </div>
    );
  }

  // Находим максимальное значение для масштабирования
  const maxCount = Math.max(...chartData.map((d) => d.count));

  // Функция для расчета высоты столбика
  const getHeightPercent = (count: number) => {
    if (count === 0) return 0;
    if (maxCount === 0) return 10;
    return 10 + Math.round((count / maxCount) * 80);
  };

  // Функция для получения цвета в зависимости от значения
  const getColor = (count: number) => {
    if (count === 0) return "";

    const colors = [
      "bg-green-200 dark:bg-green-900",
      "bg-green-300 dark:bg-green-800",
      "bg-green-400 dark:bg-green-700",
      "bg-green-500 dark:bg-green-600",
      "bg-green-600 dark:bg-green-500",
    ];

    if (maxCount === 0) return colors[0];

    const colorIndex = Math.min(
      Math.floor((count / maxCount) * (colors.length - 1)),
      colors.length - 1
    );

    return colors[colorIndex];
  };

  // Функция для форматирования даты в зависимости от периода
  const formatDateLabel = (date: string) => {
    if (timeRange === "day") {
      // Для периода "день" данные в формате "ЧЧ:00"
      const hourMatch = date.match(/^(\d+):00$/);
      if (hourMatch) {
        const hour = parseInt(hourMatch[1]);
        return `${hour}:00`;
      }
      return date;
    } else if (timeRange === "week") {
      // Для периода "неделя" даты в формате YYYY-MM-DD
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
      });
    } else if (timeRange === "month") {
      // Для месяца показываем номер недели
      const weekMatch = date.match(/^.*-W(\d+)$/);
      if (weekMatch) {
        return `Нед ${weekMatch[1]}`;
      }
      return date;
    } else {
      // Для года показываем месяц
      const monthMatch = date.match(/^(\d{4})-(\d{2})$/);
      if (monthMatch) {
        const yearMonth = new Date(
          parseInt(monthMatch[1]),
          parseInt(monthMatch[2]) - 1,
          1
        );
        return yearMonth.toLocaleDateString("ru-RU", {
          month: "short",
        });
      }
      return date;
    }
  };

  return (
    <div>
      <div className="h-64 flex items-end space-x-1 px-1 py-2 bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-800 dark:to-neutral-900 rounded-md overflow-hidden border border-neutral-200 dark:border-neutral-700 shadow-inner">
        {chartData.map((item, index) => {
          const heightPercent = getHeightPercent(item.count);
          const height = heightPercent > 0 ? `${heightPercent}%` : "0";

          return (
            <div
              key={index}
              className={`flex-1 ${
                item.count > 0 ? getColor(item.count) : ""
              } rounded-t flex items-center justify-center relative group`}
              style={{
                height: height,
                minHeight: item.count > 0 ? "10px" : "0",
                marginTop: "auto",
                border: item.count > 0 ? "1px solid rgba(0,0,0,0.1)" : "none",
                boxShadow:
                  item.count > 0 ? "0 -2px 5px rgba(0,0,0,0.05)" : "none",
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
        })}
      </div>
      <div className="flex justify-between mt-2 text-xs text-neutral-500 dark:text-neutral-400">
        {chartData.map((item, index) => (
          <span key={index} className="text-center flex-1">
            {formatDateLabel(item.date)}
          </span>
        ))}
      </div>
    </div>
  );
}
