import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

interface ConversationsTabProps {
  timeRange: string;
  handleTimeRangeChange: (value: string) => void;
}

interface ConversationsMetrics {
  period: string;
  totalConversations: number;
  activeConversations: number;
  completedConversations: number;
  avgMessagesPerConversation: number;
  periodStart: string;
  periodEnd: string;
}

export default function ConversationsTab({
  timeRange,
  handleTimeRangeChange,
}: ConversationsTabProps) {
  // Получаем статистику диалогов из API
  const { data: conversationsMetrics, isLoading } =
    useQuery<ConversationsMetrics>({
      queryKey: ["/api/metrics/conversations", { period: timeRange }],
    });

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center md:items-center justify-between mb-4 gap-2">
          <h3 className="font-medium text-neutral-900 dark:text-white">
            Статистика диалогов
          </h3>
          <Select
            defaultValue={timeRange}
            onValueChange={handleTimeRangeChange}
          >
            <SelectTrigger className="w-full sm:w-[180px] md:w-[180px]">
              <SelectValue placeholder="Выберите период" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">За неделю</SelectItem>
              <SelectItem value="month">За месяц</SelectItem>
              <SelectItem value="year">За год</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="py-4 text-center text-neutral-500 dark:text-neutral-400">
            Загрузка данных...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg text-center">
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
                  Завершенные диалоги
                </p>
                <p className="text-2xl font-semibold text-neutral-900 dark:text-white">
                  {conversationsMetrics?.completedConversations || 0}
                </p>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg text-center">
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
                  Активные диалоги
                </p>
                <p className="text-2xl font-semibold text-neutral-900 dark:text-white">
                  {conversationsMetrics?.activeConversations || 0}
                </p>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg text-center">
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
                  Среднее кол-во сообщений
                </p>
                <p className="text-2xl font-semibold text-neutral-900 dark:text-white">
                  {conversationsMetrics?.avgMessagesPerConversation || 0}
                </p>
              </div>
            </div>

            {conversationsMetrics?.totalConversations === 0 ? (
              <div className="h-48 md:h-64 flex items-center justify-center bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <p className="text-neutral-500 dark:text-neutral-400 text-sm text-center px-4">
                  Нет диалогов за выбранный период
                </p>
              </div>
            ) : (
              <div className="h-48 md:h-64 flex items-center justify-center bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <div className="text-center">
                  <p className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                    Всего диалогов:{" "}
                    {conversationsMetrics?.totalConversations || 0}
                  </p>
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                    Детальная статистика по диалогам будет доступна в следующем
                    обновлении
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
