import { useFetchNotificationChannelsAndFunctions } from "@/hooks/telephony/use-fetch-notification-channels-and-functions";
import { Loader2 } from "lucide-react";
import { useState, forwardRef, useImperativeHandle } from "react";
import { Button } from "../ui/button";

interface FunctionForCallingProps {
  userId: number;
}

export const FunctionForCalling = forwardRef<
  {
    getSelectedChannelId: () => string;
    getSelectedFunctionId: () => string;
  },
  FunctionForCallingProps
>(({ userId }, ref) => {
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");
  const [selectedFunctionId, setSelectedFunctionId] = useState<string>("");

  // Предоставляем методы для родительского компонента через ref
  useImperativeHandle(ref, () => ({
    getSelectedChannelId: () => selectedChannelId,
    getSelectedFunctionId: () => selectedFunctionId,
  }));

  // Используем хук для получения каналов оповещения и функций
  const { data, isLoading, isError, error, refetch } =
    useFetchNotificationChannelsAndFunctions({
      userId,
      enabled: true,
    });

  // Получаем выбранную функцию
  const selectedFunction = data?.userFunctions?.find(
    (func) => func.id.toString() === selectedFunctionId
  );

  return (
    <div className="space-y-4">
      {/* Выбор канала оповещения Telegram */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Выбор канала (Telegram)
        </h3>
        <div className="relative">
          {isLoading ? (
            <div className="flex items-center space-x-2 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />
              <span className="text-sm text-neutral-500">
                Загрузка каналов...
              </span>
            </div>
          ) : isError ? (
            <div className="text-sm text-red-500 py-2 flex justify-between">
              <span>Ошибка при загрузке каналов Telegram</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                className="text-xs"
              >
                Повторить
              </Button>
            </div>
          ) : !data?.notificationChannels ||
            data.notificationChannels.length === 0 ? (
            <div className="text-sm text-amber-500 py-2">
              У вас нет подключенных каналов Telegram.
            </div>
          ) : (
            <>
              <select
                className="w-full border border-neutral-300 dark:border-neutral-600 rounded-md py-2 px-3 pr-10 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
                value={selectedChannelId}
                onChange={(e) => setSelectedChannelId(e.target.value)}
              >
                <option value="">Выберите канал Telegram</option>
                {data.notificationChannels.map((channel) => (
                  <option key={channel.id} value={channel.id.toString()}>
                    {channel.name}
                  </option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 material-icons text-neutral-400 pointer-events-none">
                expand_more
              </span>
            </>
          )}
        </div>
      </div>

      {/* Выбор функции */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Выбор функции
        </h3>
        <div className="relative">
          {isLoading ? (
            <div className="flex items-center space-x-2 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />
              <span className="text-sm text-neutral-500">
                Загрузка функций...
              </span>
            </div>
          ) : isError ? (
            <div className="text-sm text-red-500 py-2 flex justify-between">
              <span>Ошибка при загрузке функций</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                className="text-xs"
              >
                Повторить
              </Button>
            </div>
          ) : !data?.userFunctions || data.userFunctions.length === 0 ? (
            <div className="text-sm text-amber-500 py-2">
              У вас нет созданных функций.
            </div>
          ) : (
            <>
              <select
                className="w-full border border-neutral-300 dark:border-neutral-600 rounded-md py-2 px-3 pr-10 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
                value={selectedFunctionId}
                onChange={(e) => setSelectedFunctionId(e.target.value)}
              >
                <option value="">Выберите функцию</option>
                {data.userFunctions.map((func) => (
                  <option key={func.id} value={func.id.toString()}>
                    {func.name}
                  </option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 material-icons text-neutral-400 pointer-events-none">
                expand_more
              </span>
            </>
          )}
        </div>
      </div>

      {/* Информация о выбранной функции */}
      {selectedFunctionId && selectedFunction && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
          <h4 className="text-sm font-medium mb-1">Информация о функции:</h4>
          <div className="text-xs text-neutral-600 dark:text-neutral-300">
            <p>
              <strong>Название:</strong> {selectedFunction.name}
            </p>
            <p>
              <strong>Описание:</strong> {selectedFunction.description}
            </p>
          </div>

          {/* Отображение параметров функции */}
          {selectedFunction?.parameters && (
            <div className="mt-3">
              <h4 className="text-sm font-medium mb-1">Параметры функции:</h4>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md overflow-auto">
                <pre className="text-xs text-green-600 dark:text-green-400">
                  {JSON.stringify(selectedFunction.parameters, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
