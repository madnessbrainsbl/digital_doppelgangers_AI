import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TopicPercentageChart from "@/components/analytics/topic-percentage-chart";
import ConversationsChart from "@/components/analytics/conversations-chart";
import { useQuery } from "@tanstack/react-query";

interface OverviewTabProps {
  timeRange: string;
  handleTimeRangeChange: (value: string) => void;
}

interface Comparison {
  value: number;
  text: string;
}

interface OverviewData {
  metrics: {
    totalConversations: number;
    avgResponseTime: number;
    successRate: number;
    period: string;
  };
  topicData: Array<{ label: string; value: number }>;
  chartData: Array<{ date: string; count: number }>;
  dateLabels: string[];
  activeDialogCount: number;
  groupBy: string;
  comparisons?: {
    totalConversations: Comparison;
    avgResponseTime: Comparison;
    successRate: Comparison;
  };
}

export default function OverviewTab({
  timeRange,
  handleTimeRangeChange,
}: OverviewTabProps) {
  // Получаем данные для обзора из нового API
  const { data: overviewData, isLoading } = useQuery<OverviewData>({
    queryKey: ["/api/metrics/overview", { period: timeRange }],
  });

  const metrics = overviewData?.metrics;
  const topicData = overviewData?.topicData || [];
  const chartData = overviewData?.chartData || [];
  const dateLabels = overviewData?.dateLabels || [];
  const comparisons = overviewData?.comparisons;

  // Компонент для отображения сравнения
  const ComparisonIndicator = ({ comparison }: { comparison?: Comparison }) => {
    if (!comparison) return null;

    // Определяем цвет и иконку на основе изменения значения
    const getColorAndIcon = () => {
      if (comparison.value === 0) {
        return {
          color: "text-gray-600 dark:text-gray-400",
          icon: "trending_flat",
          text: "без изменений",
        };
      } else if (comparison.value > 0) {
        return {
          color: "text-green-600 dark:text-green-400",
          icon: "trending_up",
          text: "выше",
        };
      } else {
        return {
          color: "text-red-600 dark:text-red-400",
          icon: "trending_down",
          text: "ниже",
        };
      }
    };

    const { color, icon, text } = getColorAndIcon();

    return (
      <div className={`flex items-center mt-2 text-xs ${color}`}>
        <span className="material-icons text-[14px] mr-1">{icon}</span>
        <span>
          {comparison.value === 0
            ? text
            : `${Math.abs(comparison.value)}% ${text}`}{" "}
          {comparison.text}
        </span>
      </div>
    );
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Conversations Chart */}
        <Card className="col-span-1 lg:col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-neutral-900 dark:text-white">
                Активность диалогов
              </h3>
              <Select
                defaultValue={timeRange}
                onValueChange={handleTimeRangeChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Выберите период" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">За неделю</SelectItem>
                  <SelectItem value="month">За месяц</SelectItem>
                  <SelectItem value="year">За год</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <ConversationsChart
              dateLabels={dateLabels}
              timeRange={timeRange}
              isLoading={isLoading}
              chartData={chartData}
            />
          </CardContent>
        </Card>

        {/* Popular Topics */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-medium text-neutral-900 dark:text-white mb-4">
              Популярные темы
            </h3>
            {isLoading ? (
              <div className="py-4 text-center text-neutral-500 dark:text-neutral-400">
                Загрузка данных...
              </div>
            ) : (
              <TopicPercentageChart topicData={topicData} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Key Performance Indicators */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-neutral-900 dark:text-white">
              Ключевые показатели
            </h3>
            {/* <Button variant="outline" size="sm">
              <span className="material-icons text-[18px] mr-1">download</span>
              <span>Экспорт</span>
            </Button> */}
          </div>

          {isLoading ? (
            <div className="py-4 text-center text-neutral-500 dark:text-neutral-400">
              Загрузка данных...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
                  Всего диалогов
                </p>
                <p className="text-2xl font-semibold text-neutral-900 dark:text-white">
                  {metrics?.totalConversations || 0}
                </p>
                <ComparisonIndicator
                  comparison={comparisons?.totalConversations}
                />
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
                  Среднее время ответа
                </p>
                <p className="text-2xl font-semibold text-neutral-900 dark:text-white">
                  {((metrics?.avgResponseTime || 0) / 1000).toFixed(1)} сек
                </p>
                <ComparisonIndicator
                  comparison={comparisons?.avgResponseTime}
                />
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
                  Успешных ответов
                </p>
                <p className="text-2xl font-semibold text-neutral-900 dark:text-white">
                  {metrics?.successRate || 0}%
                </p>
                <ComparisonIndicator comparison={comparisons?.successRate} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
