import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TopicPercentageChart from "@/components/analytics/topic-percentage-chart";
// import { formatTopicData } from "@/lib/utils/charts"; // Возможно, понадобится, если topicData будет вычисляться здесь
import { useQuery } from "@tanstack/react-query";

interface Topic {
  label: string;
  value: number;
  color?: string;
}

interface TopicMetricsResponse {
  topicData: Topic[];
  period: string;
  timestamp: string;
}

interface TopicsTabProps {
  timeRange: string;
  handleTimeRangeChange: (value: string) => void;
}

export default function TopicsTab({
  timeRange = "week",
  handleTimeRangeChange,
}: TopicsTabProps) {
  const { data, isLoading, isError } = useQuery<TopicMetricsResponse>({
    queryKey: ["/api/metrics/topic", { period: timeRange }],
    staleTime: 5 * 60 * 1000, // Кэширование на 5 минут
    retry: 1, // Попробовать только 1 раз при ошибке
  });

  const topicData: Topic[] =
    data && Array.isArray(data.topicData) ? data.topicData : [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="py-4 text-center text-neutral-500 dark:text-neutral-400">
            Загрузка данных...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="py-4 text-center text-red-500 dark:text-red-400">
            Ошибка загрузки данных по темам.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between mb-4 gap-2">
          <h3 className="font-medium text-neutral-900 dark:text-white">
            Анализ тем диалогов
          </h3>
          <Select
            defaultValue={timeRange}
            onValueChange={handleTimeRangeChange}
          >
            <SelectTrigger className="w-full xs:w-[180px] md:w-[180px]">
              <SelectValue placeholder="Выберите период" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">За неделю</SelectItem>
              <SelectItem value="month">За месяц</SelectItem>
              <SelectItem value="year">За год</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {topicData.length === 0 ? (
          <div className="py-4 text-center text-neutral-500 dark:text-neutral-400">
            Нет данных по темам за выбранный период.
          </div>
        ) : (
          <div className="space-y-6">
            <TopicPercentageChart topicData={topicData} showLegend />

            <div className="mt-6">
              <h4 className="text-sm font-medium text-neutral-900 dark:text-white mb-4">
                Подробный анализ
              </h4>

              <div className="space-y-4">
                {topicData.map((topic: Topic, index: number) => (
                  <div
                    key={index}
                    className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-neutral-900 dark:text-white">
                        {topic.label}
                      </h5>
                      <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                        {topic.value}%
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Средняя длина диалога:{" "}
                      <span className="font-medium">4.2 сообщения</span>
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Средняя оценка удовлетворенности:{" "}
                      <span className="font-medium">4.5/5</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
