import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

interface AssistantStats {
  id: number;
  name: string;
  description?: string;
  role: string;
  status: string;
  totalConversations: number;
  activeConversations: number;
  completedConversations: number;
  totalMessages: number;
  avgResponseTime: number;
  successRate: number;
  userSatisfaction: number;
  lastActivity: string;
  model: string;
}

interface AssistantsData {
  assistants: AssistantStats[];
  totalAssistants: number;
  timestamp: string;
}

interface AssistantsTabProps {
  // Пока без дополнительных пропов
}

export default function AssistantsTab({}: AssistantsTabProps) {
  // Получаем статистику ассистентов из API
  const { data: assistantsData, isLoading } = useQuery<AssistantsData>({
    queryKey: ["/api/metrics/assistants"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-neutral-500 dark:text-neutral-400">
              Загрузка данных ассистентов...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!assistantsData?.assistants || assistantsData.assistants.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center md:items-center justify-between mb-4 gap-2">
            <h3 className="font-medium text-neutral-900 dark:text-white">
              Эффективность ассистентов
            </h3>
            {/* <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <span className="material-icons text-[18px] mr-1">filter_list</span>
              <span>Фильтры</span>
            </Button> */}
          </div>
          <div className="flex items-center justify-center h-32">
            <p className="text-neutral-500 dark:text-neutral-400">
              У вас пока нет ассистентов. Создайте первого ассистента для
              отображения статистики.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Функция для форматирования времени ответа
  const formatResponseTime = (seconds: number) => {
    if (seconds < 1) return `${Math.round(seconds * 1000)}мс`;
    return `${seconds} сек`;
  };

  // Функция для получения статуса ассистента
  const getStatusBadge = (status: string) => {
    const statusColors = {
      active:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      training:
        "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
      inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    };
    const statusTexts = {
      active: "Активен",
      training: "Обучается",
      inactive: "Неактивен",
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          statusColors[status as keyof typeof statusColors] ||
          statusColors.inactive
        }`}
      >
        {statusTexts[status as keyof typeof statusTexts] || status}
      </span>
    );
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center md:items-center justify-between mb-4 gap-2">
          <h3 className="font-medium text-neutral-900 dark:text-white">
            Эффективность ассистентов ({assistantsData.assistants.length})
          </h3>
          {/* <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <span className="material-icons text-[18px] mr-1">filter_list</span>
            <span>Фильтры</span>
          </Button> */}
        </div>

        <div className="space-y-6">
          {assistantsData.assistants.map((assistant) => (
            <div
              key={assistant.id}
              className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20"
            >
              {/* Заголовок ассистента - скрываем чувствительные данные */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="material-icons text-white text-[20px]">
                      smart_toy
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-4 bg-neutral-300 dark:bg-neutral-600 rounded animate-pulse"></div>
                      {getStatusBadge(assistant.status)}
                    </div>
                  </div>
                </div>

                {/* Статистика диалогов */}
                <div className="grid grid-cols-2 sm:flex sm:flex-row gap-4 text-sm">
                  <div className="text-center sm:text-right">
                    <p className="text-neutral-500 dark:text-neutral-400 text-xs">
                      Всего диалогов
                    </p>
                    <p className="font-bold text-lg text-neutral-900 dark:text-white">
                      {assistant.totalConversations}
                    </p>
                  </div>
                  <div className="text-center sm:text-right">
                    <p className="text-neutral-500 dark:text-neutral-400 text-xs">
                      Активных
                    </p>
                    <p className="font-bold text-lg text-green-600 dark:text-green-400">
                      {assistant.activeConversations}
                    </p>
                  </div>
                </div>
              </div>

              {/* Основные метрики */}
              <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4">
                {/* Скорость ответа */}
                <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Скорость ответа
                    </span>
                    <span className="text-lg font-bold text-neutral-900 dark:text-white">
                      {formatResponseTime(assistant.avgResponseTime)}
                    </span>
                  </div>
                  <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full">
                    <div
                      className="h-2 bg-red-500 rounded-full transition-all duration-300"
                      style={{ width: "75%" }}
                    ></div>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Требует улучшения
                  </p>
                </div>

                {/* Всего сообщений */}
                <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Всего сообщений
                    </span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {assistant.totalMessages}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-icons text-green-500 text-[16px]">
                      trending_up
                    </span>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Активная работа
                    </p>
                  </div>
                </div>
              </div>

              {/* Нижняя информация */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                  <div className="flex items-center gap-1">
                    <span className="material-icons text-[16px]">schedule</span>
                    <span>
                      Последняя активность:{" "}
                      {new Date(assistant.lastActivity).toLocaleDateString(
                        "ru-RU"
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Онлайн
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
