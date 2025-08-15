import { useState, useEffect, useMemo, useLayoutEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare,
  Bell,
  Webhook,
  Mail,
  Plus,
  Settings,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FunctionToggle } from "./function-toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Типы данных
interface NotificationChannel {
  id: number;
  name: string;
  type: string;
  config: any;
  createdAt: string;
}

interface OpenAiFunction {
  id: number;
  name: string;
  description: string;
  parameters: any;
  channelId: number | null;
  createdAt: string;
}

interface FunctionAssistant {
  id: number;
  assistantId: number;
  function?: {
    id: number;
    name: string;
    description: string;
    parameters: any;
    channelId: number | null;
    createdAt: string;
  };
  functionId?: number; // Оставляем для обратной совместимости
  notificationChannelId: number;
  enabled: boolean;
  channelEnabled: boolean;
  createdAt: string;
}

interface Assistant {
  id: number;
  name: string;
  description: string;
  instructions: string;
  model: string;
  createdAt: string;
}

export function NotificationChannelsSettings({
  assistantId,
}: {
  assistantId: number;
}) {
  // Состояния компонента
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(
    null
  );
  const [usedChannelIds, setUsedChannelIds] = useState<number[]>([]);
  const [localActiveFunctionIds, setLocalActiveFunctionIds] = useState<
    number[]
  >([]);
  const [loadingFunctionIds, setLoadingFunctionIds] = useState<number[]>([]);
  const [isAnyLoading, setIsAnyLoading] = useState(false);
  const [recentlyDeletedFunctions, setRecentlyDeletedFunctions] = useState<
    number[]
  >([]);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [isCheckingState, setIsCheckingState] = useState(false);
  const [needsSync, setNeedsSync] = useState(false);

  // Минимальный интервал между автоматическими синхронизациями (5 секунд)
  const MIN_SYNC_INTERVAL = 5000;

  // Проверка, можно ли выполнить автоматическую синхронизацию
  const canAutoSync = useMemo(() => {
    if (lastSyncTime === null) return true;
    return Date.now() - lastSyncTime > MIN_SYNC_INTERVAL;
  }, [lastSyncTime]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Запрос списка каналов оповещений
  const { data: notificationChannels = [], isLoading: isLoadingChannels } =
    useQuery({
      queryKey: ["/api/notification-channels"],
      select: (data: NotificationChannel[]) => data,
      refetchOnWindowFocus: false,
      refetchInterval: false,
    });

  // Запрос списка функций OpenAI
  const { data: openAiFunctions = [], isLoading: isLoadingFunctions } =
    useQuery({
      queryKey: ["/api/openai-functions"],
      select: (data: OpenAiFunction[]) => data,
      refetchOnWindowFocus: false,
      refetchInterval: false,
    });

  // Запрос данных ассистента
  const { data: assistant, isLoading: isLoadingAssistant } = useQuery({
    queryKey: [`/api/assistants/${assistantId}`],
    select: (data: Assistant) => data,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  // Запрос списка связей между функциями и ассистентом
  const {
    data: functionAssistants = [],
    isLoading: isLoadingFunctionAssistants,
    refetch: refetchFunctionAssistants,
  } = useQuery({
    queryKey: [`/api/assistants/${assistantId}/functions`],
    select: (data: FunctionAssistant[]) => {
      return data;
    },
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  // Запрос списка активных функций ассистента напрямую из OpenAI
  const {
    data: openAiActiveFunctions = [],
    isLoading: isLoadingOpenAiFunctions,
    refetch: refetchOpenAiFunctions,
  } = useQuery({
    queryKey: [`/api/assistants/${assistantId}/openai-functions`],
    select: (data: { success: boolean; activeFunctions: string[] }) =>
      data.activeFunctions || [],
    // Запускаем запрос только если известен assistantId
    enabled: !!assistantId,
    // Увеличиваем время кеширования для уменьшения нагрузки на сервер
    staleTime: 60000, // 1 минута
    // Отключаем автоматическое обновление данных
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    refetchInterval: false,
  });

  // Мутация для принудительной синхронизации функций через новый эндпоинт
  const syncFunctionsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `/api/assistants/${assistantId}/update-functions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            excludeFunctionIds: recentlyDeletedFunctions,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ошибка при синхронизации функций");
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log("Результат синхронизации функций:", data);
      toast({
        title: "Синхронизация завершена",
        description: `Добавлено ${data.changes.added.length} и удалено ${data.changes.removed.length} функций`,
        variant: "default",
      });

      // Обновляем списки функций
      refetchFunctionAssistants();
      refetchOpenAiFunctions();
    },
    onError: (error) => {
      console.error("Ошибка при синхронизации функций:", error);
      toast({
        title: "Ошибка синхронизации",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Группируем функции по каналам
  const functionsByChannel = openAiFunctions.reduce<
    Record<number, OpenAiFunction[]>
  >((acc, func) => {
    if (func.channelId) {
      if (!acc[func.channelId]) acc[func.channelId] = [];
      acc[func.channelId].push(func);
    }
    return acc;
  }, {});

  // После загрузки данных инициализируем локальное состояние активных функций
  useEffect(() => {
    if (functionAssistants.length > 0) {
      // Собираем ID активных функций
      const activeFunctionIds = functionAssistants
        .filter((fa) => fa.enabled)
        .map((fa) => fa.functionId);

      // Устанавливаем состояние активных функций
      setLocalActiveFunctionIds((prev) => {
        return activeFunctionIds;
      });

      // Собираем ID каналов оповещений, которые уже используются
      const channelIdsSet = new Set<number>();
      functionAssistants.forEach((fa) => {
        channelIdsSet.add(fa.notificationChannelId);
      });

      const uniqueChannelIds = Array.from(channelIdsSet);
      setUsedChannelIds(uniqueChannelIds);

      // Если еще не выбран канал, но есть активные каналы, выбираем первый
      if (selectedChannelId === null && uniqueChannelIds.length > 0) {
        setSelectedChannelId(uniqueChannelIds[0]);
      }
    }
  }, [functionAssistants, assistantId]);

  // Вспомогательная функция для транслитерации имен функций
  const getTransliteratedName = (name: string) => {
    const cyrillicMap: { [key: string]: string } = {
      а: "a",
      б: "b",
      в: "v",
      г: "g",
      д: "d",
      е: "e",
      ё: "e",
      ж: "zh",
      з: "z",
      и: "i",
      й: "y",
      к: "k",
      л: "l",
      м: "m",
      н: "n",
      о: "o",
      п: "p",
      р: "r",
      с: "s",
      т: "t",
      у: "u",
      ф: "f",
      х: "h",
      ц: "ts",
      ч: "ch",
      ш: "sh",
      щ: "sch",
      ъ: "",
      ы: "y",
      ь: "",
      э: "e",
      ю: "yu",
      я: "ya",
    };

    return name
      .toLowerCase()
      .split("")
      .map((char) => cyrillicMap[char] || char)
      .join("")
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/_{2,}/g, "_");
  };

  // Мемоизируем transliteratedOpenAiFunctions
  const transliteratedOpenAiFunctions = useMemo(() => {
    if (!openAiActiveFunctions || !openAiFunctions) return [];

    // Маппинг функций из OpenAI на ID функций в локальной БД
    const result = openAiActiveFunctions
      .map((funcName) => {
        // Ищем функцию по точному имени
        let func = openAiFunctions.find(
          (f) => getTransliteratedName(f.name) === funcName
        );

        if (!func) {
          // Если не нашли по имени, пытаемся найти по похожему имени
          func = openAiFunctions.find((f) => {
            const transliterated = getTransliteratedName(f.name);
            // Более гибкое сравнение - проверка на включение имени
            return (
              funcName.includes(transliterated) ||
              transliterated.includes(funcName)
            );
          });
        }

        if (func) {
          return func.id;
        } else {
          console.log(`Не удалось найти соответствие для функции ${funcName}`);
          return null;
        }
      })
      .filter((id): id is number => id !== null);
    return result;
  }, [openAiActiveFunctions, openAiFunctions]);

  // Заменяем useLayoutEffect на useEffect с проверкой изменений
  useEffect(() => {
    if (
      !isLoadingOpenAiFunctions &&
      openAiActiveFunctions &&
      openAiActiveFunctions.length > 0 &&
      openAiFunctions &&
      openAiFunctions.length > 0 &&
      JSON.stringify(transliteratedOpenAiFunctions) !==
        JSON.stringify(localActiveFunctionIds)
    ) {
      setLocalActiveFunctionIds(transliteratedOpenAiFunctions);
    }
  }, [
    isLoadingOpenAiFunctions,
    transliteratedOpenAiFunctions,
    localActiveFunctionIds,
  ]);

  // Инициализируем активные функции на основе данных из БД чтобы быстрее показать UI
  // Запасной вариант, если OpenAI API недоступен или данные еще не загружены
  useEffect(() => {
    // Используем данные из БД только если:
    // 1. Данные из БД загружены
    // 2. У нас есть записи связей функций с ассистентом
    // 3. Ещё нет никаких данных от OpenAI (isLoading = true или пустой массив функций)
    if (
      !isLoadingFunctionAssistants &&
      functionAssistants.length > 0 &&
      (isLoadingOpenAiFunctions ||
        !openAiActiveFunctions ||
        openAiActiveFunctions.length === 0)
    ) {
      // Установим начальное состояние активных функций на основе БД перед получением данных из OpenAI
      const activeIds = functionAssistants
        .filter((fa) => fa.enabled)
        .map((fa) => fa.functionId);

      // Проверяем, что новые ID отличаются от текущих
      if (
        JSON.stringify(activeIds) !== JSON.stringify(localActiveFunctionIds)
      ) {
        setLocalActiveFunctionIds(activeIds);
      }
    }
  }, [
    functionAssistants,
    isLoadingFunctionAssistants,
    isLoadingOpenAiFunctions,
    openAiActiveFunctions,
  ]);

  // Логируем информацию о расхождениях между OpenAI и локальной БД, НО НЕ синхронизируем автоматически
  // чтобы не нарушать работу функции удаления
  useEffect(() => {
    // Проверяем только если есть все необходимые данные
    if (
      openAiFunctions.length > 0 &&
      transliteratedOpenAiFunctions.length > 0 &&
      assistantId &&
      !isLoadingOpenAiFunctions
    ) {
      const activeFunctionIds = transliteratedOpenAiFunctions;

      // Сравниваем, есть ли расхождения между OpenAI и локальным состоянием
      const needsSyncWithDB =
        JSON.stringify(activeFunctionIds.sort()) !==
        JSON.stringify([...localActiveFunctionIds].sort());

      if (needsSyncWithDB) {
        // Выводим подробную информацию о расхождениях
        const missingInLocal = activeFunctionIds.filter(
          (id: number) => !localActiveFunctionIds.includes(id)
        );
        const extraInLocal = localActiveFunctionIds.filter(
          (id: number) => !activeFunctionIds.includes(id)
        );

        if (missingInLocal.length > 0) {
          // Синхронизируем UI с OpenAI, добавляя в локальное состояние функции, которые уже активны в OpenAI
          // Это не вызывает никаких запросов к API, только обновляет состояние интерфейса
          setLocalActiveFunctionIds((prev) => [...prev, ...missingInLocal]);

          // Показываем уведомление пользователю с возможностью синхронизировать БД с OpenAI
          toast({
            title: "Обнаружены расхождения",
            description: `${missingInLocal.length} функций активны на платформе, но не в базе данных`,
            action: (
              <Button
                variant="outline"
                size="sm"
                onClick={() => syncFunctionsMutation.mutate()}
              >
                Синхронизировать
              </Button>
            ),
            duration: 10000, // 10 секунд
          });
        }

        if (extraInLocal.length > 0) {
          // Обычно не следует автоматически отключать функции, которые есть в UI, но отсутствуют в OpenAI
          // Это может быть следствием незавершенной операции удаления
          // Пользователь должен сам решить, удалить ли такие функции

          // Показываем дополнительное уведомление, если есть функции в БД, которых нет в OpenAI
          if (missingInLocal.length === 0) {
            // Показываем только если нет другого уведомления
            toast({
              title: "Несинхронизированные функции",
              description: `${extraInLocal.length} функций активны в базе данных, но не на платформе`,
              action: (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => syncFunctionsMutation.mutate()}
                >
                  Синхронизировать
                </Button>
              ),
              duration: 10000, // 10 секунд
            });
          }
        }

        // НЕ синхронизируем полностью с сервером, чтобы не сбивать процесс удаления функций
        // setTimeout(() => syncAssistantFunctions(), 500);
      }
    }
  }, [
    transliteratedOpenAiFunctions,
    localActiveFunctionIds,
    assistantId,
    openAiFunctions,
    isLoadingOpenAiFunctions,
  ]);

  // Мутация для добавления функции к ассистенту
  const addFunctionMutation = useMutation<
    any,
    Error,
    { functionId: number; notificationChannelId: number }
  >({
    mutationFn: (variables) => {
      // Проверяем, что assistantId определен перед отправкой запроса
      if (!assistantId) {
        console.error("Попытка добавить функцию, но assistantId не определен");
        return Promise.reject(new Error("ID ассистента не определен"));
      }

      // Сохраняем ID ассистента в локальную переменную
      const currentAssistantId = assistantId;

      return fetch(`/api/assistants/${currentAssistantId}/functions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          functionId: variables.functionId,
          notificationChannelId: variables.notificationChannelId,
          enabled: true,
        }),
      }).then((res) => res.json());
    },
    onSuccess: () => {
      // Проверяем, что assistantId определен перед использованием в запросе
      if (assistantId) {
        queryClient.invalidateQueries({
          queryKey: [`/api/assistants/${assistantId}/functions`],
        });
      } else {
        console.warn(
          "Не удалось обновить кэш функций: assistantId не определен"
        );
        // Обновляем все функции для всех ассистентов на всякий случай
        queryClient.invalidateQueries({
          queryKey: ["/api/function-assistants"],
        });
      }
    },
  });

  // Мутация для удаления функции из ассистента
  const removeFunctionMutation = useMutation<
    any,
    Error,
    { functionAssistantId: number; functionId: number }
  >({
    mutationFn: (variables) => {
      return fetch(
        `/api/function-assistants/${variables.functionAssistantId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      ).then((res) => res.json());
    },
    onSuccess: () => {
      // Проверяем, что assistantId определен перед использованием в запросе
      if (assistantId) {
        queryClient.invalidateQueries({
          queryKey: [`/api/assistants/${assistantId}/functions`],
        });
      } else {
        console.warn(
          "Не удалось обновить кэш функций: assistantId не определен"
        );
        // Обновляем все функции для всех ассистентов на всякий случай
        queryClient.invalidateQueries({
          queryKey: ["/api/function-assistants"],
        });
      }
    },
  });

  // Мутация для обновления статуса канала для функции
  const updateFunctionChannelMutation = useMutation<
    any,
    Error,
    { functionAssistantId: number; channelEnabled: boolean }
  >({
    mutationFn: (variables) => {
      console.log("Отправка запроса на обновление статуса канала:", variables);

      return fetch(
        `/api/function-assistants/${variables.functionAssistantId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            channelEnabled: variables.channelEnabled,
          }),
        }
      ).then((res) => {
        if (!res.ok) {
          throw new Error(
            `Ошибка при обновлении статуса канала: ${res.status} ${res.statusText}`
          );
        }
        return res.json();
      });
    },
    onSuccess: (data) => {
      console.log("Успешно обновлен статус канала:", data);
      if (assistantId) {
        queryClient.invalidateQueries({
          queryKey: [`/api/assistants/${assistantId}/functions`],
        });
      } else {
        console.warn(
          "Не удалось обновить кэш функций: assistantId не определен"
        );
        queryClient.invalidateQueries({
          queryKey: ["/api/function-assistants"],
        });
      }
    },
    onError: (error) => {
      console.error("Ошибка при обновлении статуса канала:", error);
    },
  });

  /**
   * Синхронизирует функции ассистента с OpenAI API
   * Отправляет запрос на обновление функций и возвращает результат
   * @returns {Promise<{success: boolean, changes?: {added: string[], removed: string[]}, message?: string}>}
   */
  const syncAssistantFunctions = async () => {
    setIsAnyLoading(true);

    try {
      console.log(
        `Запуск принудительной синхронизации функций для ассистента ${assistantId}`
      );

      const response = await fetch(
        `/api/assistants/${assistantId}/update-functions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            excludeFunctionIds: recentlyDeletedFunctions,
          }),
        }
      );

      const data = await response.json();
      console.log("Результат принудительной синхронизации:", data);

      if (data.success) {
        toast({
          title: "Синхронизация выполнена",
          description: `Добавлено ${data.changes.added.length} и удалено ${data.changes.removed.length} функций`,
        });

        await fetchAndUpdateFunctions();
      } else {
        toast({
          title: "Ошибка синхронизации",
          description:
            data.message || "Не удалось синхронизировать функции ассистента",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Ошибка при синхронизации функций:", error);
      toast({
        title: "Ошибка соединения",
        description: "Не удалось отправить запрос на синхронизацию функций",
        variant: "destructive",
      });
    } finally {
      setIsAnyLoading(false);
    }
  };

  /**
   * Добавляет одну конкретную функцию к ассистенту в OpenAI API
   * @param {number} functionId ID функции, которую нужно добавить
   * @returns {Promise<{success: boolean, added: boolean, functionName: string | null, message?: string}>}
   */
  const addSingleFunction = async (functionId: number) => {
    if (!assistant) {
      console.error("Нет активного ассистента для добавления функции");
      return {
        success: false,
        added: false,
        functionName: null,
        message: "Нет активного ассистента",
      };
    }

    // Сохраняем ID ассистента для безопасности
    const assistantId = assistant.id;

    try {
      const response = await fetch(
        `/api/assistants/${assistantId}/function-tools/${functionId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error(`Ошибка при добавлении функции: ${response.status}`);

        // Проверяем, возможно функция уже существует в OpenAI
        // В этом случае нужно предложить синхронизацию
        if (response.status === 400) {
          try {
            const errorData = await response.json();
            console.log("Детали ошибки:", errorData);

            // Если ошибка содержит сообщение о том, что функция уже существует
            if (
              errorData.message &&
              (errorData.message.includes("уже существует") ||
                errorData.message.includes("already exists"))
            ) {
              // Показываем уведомление с предложением синхронизировать
              toast({
                title: "Функция уже добавлена на платформе",
                description:
                  "Но отсутствует в базе данных. Рекомендуется выполнить синхронизацию.",
                action: (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => syncFunctionsMutation.mutate()}
                  >
                    Синхронизировать
                  </Button>
                ),
                duration: 10000, // 10 секунд
              });

              // Обновляем списки функций
              fetchAndUpdateFunctions();

              // Возвращаем частичный успех
              return {
                success: true,
                added: false,
                functionName: null,
                message: "Функция уже существует на платформе",
              };
            }
          } catch (e) {
            console.error("Ошибка при разборе ответа:", e);
          }
        }

        return {
          success: false,
          added: false,
          functionName: null,
          message: `Ошибка сервера: ${response.status}`,
        };
      }

      const data = await response.json();

      return {
        success: data.success,
        added: data.added || false,
        functionName: data.functionName || null,
        message: data.message,
      };
    } catch (error) {
      console.error("Ошибка при выполнении запроса добавления функции:", error);
      return {
        success: false,
        added: false,
        functionName: null,
        message: "Ошибка соединения с сервером",
      };
    }
  };

  /**
   * Получает и обновляет информацию о функциях в базе данных на основе данных из OpenAI
   * Синхронизирует локальную базу данных с актуальным состоянием функций в OpenAI
   */
  const fetchAndUpdateFunctions = async () => {
    if (!assistant) {
      console.error("Нет активного ассистента для обновления функций");
      return { success: false, message: "Нет активного ассистента" };
    }

    try {
      // Запрашиваем обновленный список функций с OpenAI
      await refetchOpenAiFunctions();

      // После обновления данных с OpenAI, ждем небольшую паузу для обработки
      await new Promise((resolve) => setTimeout(resolve, 300));

      await refetchFunctionAssistants();

      return { success: true };
    } catch (error) {
      console.error("Ошибка при обновлении функций:", error);
      return {
        success: false,
        message: "Ошибка при обновлении списка функций",
      };
    }
  };

  // Обработчик для ВКЛЮЧЕНИЯ функции
  const handleEnableFunction = (functionId: number, channelId?: number) => {
    // Устанавливаем состояние загрузки для этой функции и блокируем все переключатели
    setLoadingFunctionIds((prev) => [...prev, functionId]);
    setIsAnyLoading(true);

    // Находим функцию по ID для получения её имени
    const func = openAiFunctions.find((f) => f.id === functionId);
    if (!func) {
      // Снимаем состояние загрузки при ошибке
      setLoadingFunctionIds((prev) => prev.filter((id) => id !== functionId));
      setIsAnyLoading(false);

      toast({
        title: "Ошибка",
        description: "Не удалось найти функцию по ID",
        variant: "destructive",
      });
      return;
    }

    if (!assistant) {
      // Снимаем состояние загрузки при ошибке
      setLoadingFunctionIds((prev) => prev.filter((id) => id !== functionId));
      setIsAnyLoading(false);

      toast({
        title: "Ошибка",
        description: "Не удалось найти ассистента",
        variant: "destructive",
      });
      return;
    }

    // Сохраняем ID ассистента для безопасности
    const assistantId = assistant.id;

    // Определяем ID канала: либо передан явно, либо из состояния
    const notificationChannelId = channelId || selectedChannelId;

    if (!notificationChannelId) {
      // Снимаем состояние загрузки при ошибке
      setLoadingFunctionIds((prev) => prev.filter((id) => id !== functionId));
      setIsAnyLoading(false);

      toast({
        title: "Ошибка",
        description: "Необходимо выбрать активный канал оповещений",
        variant: "destructive",
      });
      return;
    }

    // Если нужно, меняем активный канал
    if (notificationChannelId !== selectedChannelId) {
      setSelectedChannelId(notificationChannelId);
    }

    // Немедленно обновляем UI
    setLocalActiveFunctionIds((prev) => [...prev, functionId]);

    // Отправляем запрос на подключение функции
    // Добавление функции и синхронизация с OpenAI:
    // 1. Добавляем функцию в локальную БД
    // 2. После успешного добавления вызываем addSingleFunction для добавления только этой функции в OpenAI

    addFunctionMutation.mutate(
      {
        functionId,
        notificationChannelId,
      },
      {
        onSuccess: async () => {
          // После успешного добавления в БД добавляем одну конкретную функцию в OpenAI

          const result = await addSingleFunction(functionId);

          // Снимаем состояние загрузки функции и разблокируем все переключатели
          setLoadingFunctionIds((prev) =>
            prev.filter((id) => id !== functionId)
          );
          setIsAnyLoading(false);

          if (result.success) {
            toast({
              title: result.added
                ? "Функция подключена"
                : "Функция уже подключена",
              description: result.added
                ? `Функция "${func.name}" успешно подключена к ассистенту и добавлена на платформе`
                : `Функция "${func.name}" уже была подключена к ассистенту ранее`,
            });
          } else {
            toast({
              title: "Предупреждение",
              description:
                result.message ||
                `Функция добавлена в базу данных, но не добавлена на платформе. Попробуйте еще раз.`,
              variant: "destructive",
            });
          }

          // Обновляем данные
          refetchFunctionAssistants();
        },
        onError: (error: any) => {
          // Снимаем состояние загрузки и разблокируем переключатели при ошибке
          setLoadingFunctionIds((prev) =>
            prev.filter((id) => id !== functionId)
          );
          setIsAnyLoading(false);

          // В случае ошибки удаляем ID функции из списка активных
          setLocalActiveFunctionIds((prev) =>
            prev.filter((id) => id !== functionId)
          );

          toast({
            title: "Ошибка при подключении функции",
            description: error?.message || "Неизвестная ошибка",
            variant: "destructive",
          });
        },
      }
    );
  };

  // Обработчик для ОТКЛЮЧЕНИЯ функции
  const handleDisableFunction = (
    functionId: number,
    functionAssistantId?: number
  ) => {
    // Устанавливаем состояние загрузки для этой функции и блокируем все переключатели
    setLoadingFunctionIds((prev) => [...prev, functionId]);
    setIsAnyLoading(true);

    // Добавляем функцию в список недавно удаленных, чтобы предотвратить автоматическое повторное добавление
    setRecentlyDeletedFunctions((prev) => [...prev, functionId]);

    // Через 30 секунд удаляем функцию из списка недавно удаленных
    setTimeout(() => {
      setRecentlyDeletedFunctions((prev) =>
        prev.filter((id) => id !== functionId)
      );
    }, 30000);

    if (!functionAssistantId) {
      // Снимаем состояние загрузки и разблокируем все переключатели при ошибке
      setLoadingFunctionIds((prev) => prev.filter((id) => id !== functionId));
      setIsAnyLoading(false);

      console.error("Не указан ID связи функции с ассистентом");
      toast({
        title: "Ошибка",
        description: "Не удалось найти связь функции с ассистентом",
        variant: "destructive",
      });
      return;
    }

    // Находим функцию по ID для получения её имени
    const func = openAiFunctions.find((f) => f.id === functionId);
    if (!func) {
      // Снимаем состояние загрузки и разблокируем все переключатели при ошибке
      setLoadingFunctionIds((prev) => prev.filter((id) => id !== functionId));
      setIsAnyLoading(false);

      toast({
        title: "Ошибка",
        description: "Не удалось найти функцию по ID",
        variant: "destructive",
      });
      return;
    }

    if (!assistant) {
      // Снимаем состояние загрузки при ошибке
      setLoadingFunctionIds((prev) => prev.filter((id) => id !== functionId));
      setIsAnyLoading(false);

      toast({
        title: "Ошибка",
        description: "Не удалось найти ассистента",
        variant: "destructive",
      });
      return;
    }

    const assistantId = assistant.id; // Сохраняем ID ассистента

    // ВАЖНО: Делаем немедленное визуальное изменение в UI для мгновенной обратной связи
    // Независимо от реального результата, выключаем свич сразу
    // Используем прямое присваивание для надежного обновления состояния
    const newActiveIds = [...localActiveFunctionIds].filter(
      (id) => id !== functionId
    );
    setLocalActiveFunctionIds(newActiveIds);

    // Шаг 1: Транслитерация имени функции для API
    const funcNameTransliterated = getTransliteratedName(func.name);

    // Шаг 2: Удаляем связь в базе данных полностью (DELETE)
    removeFunctionMutation.mutate(
      {
        functionAssistantId,
        functionId,
      },
      {
        onSuccess: async () => {
          try {
            // Шаг 3: Удаляем функцию из OpenAI
            const response = await fetch(
              `/api/assistants/${assistantId}/remove-function-by-name`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  functionName: funcNameTransliterated,
                }),
              }
            );

            const data = await response.json();

            // Снимаем состояние загрузки функции и разблокируем все переключатели
            setLoadingFunctionIds((prev) =>
              prev.filter((id) => id !== functionId)
            );
            setIsAnyLoading(false);

            if (data.success) {
              // Шаг 4: Задержка перед обновлением списка функций с OpenAI
              // Позволяет OpenAI API обновить свое состояние перед нашим запросом
              setTimeout(() => {
                refetchOpenAiFunctions();

                // Шаг 5: Принудительно убираем ID из локального состояния еще раз
                // (может показаться избыточным, но гарантирует согласованность UI)
                setLocalActiveFunctionIds((prev) =>
                  prev.filter((id) => id !== functionId)
                );

                toast({
                  title: "Функция отключена",
                  description: `Функция "${func.name}" успешно отключена от ассистента и удалена на платформе`,
                });
              }, 500); // Небольшая задержка для надежности
            } else {
              console.error(
                `Не удалось удалить функцию "${func.name}":`,
                data.error
              );

              // Если удаление не удалось, не возвращаем свич в положение ON
              // так как связь в БД уже удалена

              toast({
                title: "Предупреждение",
                description:
                  data.error ||
                  `Функция отключена в базе данных, но не удалось удалить её у ассистента на платформе. Попробуйте еще раз.`,
                variant: "destructive",
              });
            }
          } catch (error: any) {
            console.error("Ошибка при удалении функции:", error);

            // Снимаем состояние загрузки и разблокируем все переключатели при ошибке
            setLoadingFunctionIds((prev) =>
              prev.filter((id) => id !== functionId)
            );
            setIsAnyLoading(false);

            // Если произошла ошибка, НЕ возвращаем свич в положение ON
            // так как связь в БД уже удалена

            toast({
              title: "Предупреждение",
              description: `Функция отключена в базе данных, но произошла ошибка при удалении на платформе: ${
                error?.message || "неизвестная ошибка"
              }`,
              variant: "destructive",
            });
          }

          // Шаг 6: Обновляем данные о связях функций с ассистентом из БД
          refetchFunctionAssistants();
        },
        onError: (error: any) => {
          console.error(
            "Ошибка при удалении связи функции с ассистентом:",
            error
          );

          // Снимаем состояние загрузки и разблокируем переключатели при ошибке
          setLoadingFunctionIds((prev) =>
            prev.filter((id) => id !== functionId)
          );
          setIsAnyLoading(false);

          // В случае ошибки возвращаем ID функции в список активных
          setLocalActiveFunctionIds((prev) => [...prev, functionId]);

          toast({
            title: "Ошибка при отключении функции",
            description: error?.message || "Неизвестная ошибка",
            variant: "destructive",
          });
        },
      }
    );
  };

  // Обработчик переключения функции от компонента FunctionToggle
  const handleToggleFunction = async ({
    functionId,
    channelId,
    enabled,
    functionName,
  }: {
    functionId: number;
    channelId: number;
    enabled: boolean;
    functionName: string;
  }) => {
    // Блокируем все свичи при любом изменении
    setIsAnyLoading(true);

    try {
      // Получаем текущее состояние функции
      const isActive = isFunctionActive(functionId);

      // Если текущее состояние совпадает с новым, ничего не делаем
      if (enabled === isActive) {
        console.log("[TOGGLE] Состояние не изменилось, пропускаем обработку");
        setIsAnyLoading(false);
        return;
      }

      if (enabled) {
        // Включаем функцию - когда enabled = true, а isActive = false

        handleEnableFunction(functionId, channelId);
      } else {
        // Отключаем функцию - когда enabled = false, а isActive = true

        const functionAssistantId = getFunctionAssistantId(functionId);

        if (functionAssistantId) {
          // Если есть ID связи, используем стандартный обработчик удаления связи из БД
          handleDisableFunction(functionId, functionAssistantId);
        } else {
          // Прямое удаление функции у ассистента, если нет связи в БД
          handleDirectDisableFunction(functionId, functionName);
        }
      }

      setTimeout(() => {
        checkFunctionState();
      }, 3000);

      // Инвалидируем кэш после успешного изменения
      await queryClient.invalidateQueries({
        queryKey: [`/api/channels/${channelId}/assistants`],
      });
    } catch (error) {
      console.error("Ошибка при изменении состояния функции:", error);
    } finally {
      setIsAnyLoading(false);
    }
  };

  // Функция для прямого удаления функции в OpenAI (когда нет связи в БД)
  const handleDirectDisableFunction = (
    functionId: number,
    functionName: string
  ) => {
    console.log(
      `[DIRECT-DISABLE] Прямое удаление функции "${functionName}" (ID: ${functionId})`
    );

    if (!assistant) {
      console.error(
        "[DIRECT-DISABLE] Ассистент не определен, удаление функции невозможно"
      );
      setIsAnyLoading(false);
      toast({
        title: "Ошибка",
        description: "Не удалось найти ассистента",
        variant: "destructive",
      });
      return;
    }

    // Сохраняем ID ассистента в локальную переменную
    const assistantId = assistant.id;

    // Устанавливаем состояние загрузки для этой функции
    setLoadingFunctionIds((prev) => [...prev, functionId]);

    // Добавляем функцию в список недавно удаленных, чтобы предотвратить автоматическое повторное добавление
    setRecentlyDeletedFunctions((prev) => [...prev, functionId]);

    // Через 30 секунд удаляем функцию из списка недавно удаленных
    setTimeout(() => {
      setRecentlyDeletedFunctions((prev) =>
        prev.filter((id) => id !== functionId)
      );
    }, 30000);

    // Транслитерация имени функции
    const formattedName = getTransliteratedName(functionName);
    console.log(
      `[DIRECT-DISABLE] Форматированное имя функции для API: ${formattedName}`
    );

    // Немедленно обновляем состояние переключателя в UI
    const newIds = [...localActiveFunctionIds].filter(
      (id) => id !== functionId
    );
    console.log("[DIRECT-DISABLE] Обновляем состояние переключателей:");
    console.log("- Предыдущее:", localActiveFunctionIds);
    console.log("- Новое:", newIds);
    setLocalActiveFunctionIds(newIds);

    // Вызываем API удаления функции по имени
    fetch(`/api/assistants/${assistantId}/remove-function-by-name`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        functionName: formattedName,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        // Снимаем состояние загрузки и разблокируем все переключатели
        setLoadingFunctionIds((prev) => prev.filter((id) => id !== functionId));
        setIsAnyLoading(false);

        if (data.success) {
          toast({
            title: "Функция удалена",
            description: `Функция "${functionName}" успешно удалена у ассистента`,
          });

          // Двойное обновление для надежности
          setLocalActiveFunctionIds((prevIds) =>
            prevIds.filter((id) => id !== functionId)
          );

          // Обновляем данные
          refetchFunctionAssistants();
          refetchOpenAiFunctions();
        } else {
          // Если произошла ошибка, оставляем свич в положении OFF,
          // так как в OpenAI может быть задержка в обновлении
          toast({
            title: "Ошибка удаления",
            description: data.error || "Ошибка при удалении функции",
            variant: "destructive",
          });
        }
      })
      .catch((error) => {
        // Снимаем состояние загрузки и разблокируем все переключатели при ошибке
        setLoadingFunctionIds((prev) => prev.filter((id) => id !== functionId));
        setIsAnyLoading(false);

        console.error("[DIRECT-DISABLE] Ошибка при удалении функции:", error);
        toast({
          title: "Ошибка соединения",
          description: "Не удалось отправить запрос на удаление функции",
          variant: "destructive",
        });
      });
  };

  // Изменяем метод для проверки активности функции, чтобы он учитывал
  // данные как из локального состояния, так и из OpenAI
  const isFunctionActive = (functionId: number) => {
    // Если функция недавно была удалена, считаем её неактивной независимо от данных OpenAI
    if (recentlyDeletedFunctions.includes(functionId)) {
      return false;
    }

    // Находим функцию по ID
    const func = openAiFunctions.find((f) => f.id === functionId);
    if (!func) return false;

    // Проверяем, присутствует ли функция в OpenAI
    const funcNameTransliterated = getTransliteratedName(func.name);
    const isInOpenAI = openAiActiveFunctions.includes(funcNameTransliterated);

    // Проверяем локальное состояние
    const isInLocalState = localActiveFunctionIds.includes(functionId);

    // Если функция есть в OpenAI, но нет в локальном состоянии,
    // добавляем ее в локальное состояние для синхронизации UI
    if (isInOpenAI && !isInLocalState) {
      setLocalActiveFunctionIds((prev) =>
        [...prev, functionId].filter((id): id is number => id !== undefined)
      );
      return true;
    }

    // Возвращаем состояние на основе OpenAI (приоритет) или локального состояния
    return isInOpenAI || isInLocalState;
  };

  // Получаем идентификатор связи функции с ассистентом
  const getFunctionAssistantId = (functionId: number) => {
    const fa = functionAssistants.find((fa) => fa.function?.id === functionId);
    return fa ? fa.id : undefined;
  };

  // Проверяем, включен ли канал уведомлений для функции
  const isChannelEnabledForFunction = (functionId: number) => {
    const fa = functionAssistants.find((fa) => fa.function?.id === functionId);
    console.log(`Проверка включения канала для функции ${functionId}:`, fa);
    return fa ? fa.channelEnabled : false;
  };

  // Обработчик переключения состояния канала для функции
  const handleToggleChannelStatus = (functionId: number, enabled: boolean) => {
    console.log(
      `Переключение состояния канала для функции ${functionId} на ${
        enabled ? "включено" : "выключено"
      }`
    );
    console.log(`Доступные функции ассистента:`, functionAssistants);

    // Находим связь функции с ассистентом, проверяем только по functionId
    const functionAssistant = functionAssistants.find(
      (fa) => fa.functionId === functionId
    );

    if (!functionAssistant) {
      console.error(
        `Не удалось найти связь функции ${functionId} с ассистентом`
      );
      toast({
        title: "Ошибка",
        description: "Не удалось найти связь функции с ассистентом",
        variant: "destructive",
      });
      return;
    }

    const functionAssistantId = functionAssistant.id;
    console.log(`Найдена связь, ID: ${functionAssistantId}`);

    // Вызываем мутацию для обновления статуса канала
    updateFunctionChannelMutation.mutate(
      {
        functionAssistantId,
        channelEnabled: enabled,
      },
      {
        onSuccess: (data) => {
          if (data.success) {
            toast({
              title: "Настройки сохранены",
              description: `Канал уведомлений ${
                enabled ? "включен" : "отключен"
              } для выбранной функции`,
            });
          } else {
            toast({
              title: "Ошибка",
              description: data.error || "Не удалось обновить настройки канала",
              variant: "destructive",
            });
          }
        },
        onError: (error) => {
          console.error("Ошибка при обновлении статуса канала:", error);
          toast({
            title: "Ошибка соединения",
            description: "Не удалось обновить настройки канала уведомлений",
            variant: "destructive",
          });
        },
      }
    );
  };

  // Определяем, является ли канал активным (выбран в текущей сессии или уже имеет активные функции)
  const isChannelActive = (channelId: number) => {
    // Канал активен, если он выбран или у него есть активные функции
    const hasActiveFunctions =
      functionsByChannel[channelId]?.some((func) =>
        functionAssistants.some((fa) => fa.functionId === func.id)
      ) || false;

    return (
      selectedChannelId === channelId ||
      hasActiveFunctions ||
      usedChannelIds.includes(channelId)
    );
  };

  // Получение иконки для типа канала
  const getChannelIcon = (type: string) => {
    switch (type) {
      case "telegram":
        return <MessageSquare className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      case "webhook":
        return <Webhook className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  // Обработчик для ручной синхронизации функций
  const handleSyncFunctions = () => {
    // Обновляем время последней синхронизации
    setLastSyncTime(Date.now());

    // Передаем мутации recentlyDeletedFunctions
    syncFunctionsMutation.mutate(undefined, {
      // Если для клиента нужны дополнительные параметры, их нужно добавить здесь
      onSuccess: () => {
        console.log(
          "Ручная синхронизация завершена успешно с учетом недавно удаленных функций:",
          recentlyDeletedFunctions
        );
      },
    });
  };

  // Мутация для массовой синхронизации всех функций ассистентов
  const syncAllAssistantsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/assistants/update-all-functions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ошибка при массовой синхронизации");
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log("Результат массовой синхронизации:", data);
      toast({
        title: "Массовая синхронизация завершена",
        description: `Обработано ${data.summary.total} ассистентов, добавлено ${data.summary.changes.added} и удалено ${data.summary.changes.removed} функций`,
        duration: 5000,
      });

      // Обновляем списки функций для текущего ассистента
      refetchFunctionAssistants();
      refetchOpenAiFunctions();
    },
    onError: (error) => {
      console.error("Ошибка при массовой синхронизации:", error);
      toast({
        title: "Ошибка синхронизации",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Обработчик для массовой синхронизации всех ассистентов
  const handleSyncAllAssistants = () => {
    setIsAnyLoading(true);

    fetch(`/api/assistants/update-all-functions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        excludeFunctionIds: recentlyDeletedFunctions,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Результат массовой синхронизации:", data);

        if (data.success) {
          toast({
            title: "Массовая синхронизация завершена",
            description: `Обработано ${data.summary.total} ассистентов. Добавлено ${data.summary.changes.added} и удалено ${data.summary.changes.removed} функций.`,
          });

          // Обновляем локальные данные
          refetchFunctionAssistants();
          refetchOpenAiFunctions();
        } else {
          toast({
            title: "Ошибка массовой синхронизации",
            description:
              data.message || "Не удалось выполнить массовую синхронизацию",
            variant: "destructive",
          });
        }
      })
      .catch((error) => {
        console.error("Ошибка при массовой синхронизации:", error);
        toast({
          title: "Ошибка соединения",
          description: "Не удалось отправить запрос на массовую синхронизацию",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsAnyLoading(false);
      });
  };

  // Синхронизируем локальное состояние переключателей с OpenAI API
  // Важно: эта синхронизация ТОЛЬКО для правильного ОТОБРАЖЕНИЯ состояния,
  // она НЕ меняет никаких данных в OpenAI или БД
  useEffect(() => {
    if (
      !isLoadingOpenAiFunctions &&
      openAiActiveFunctions &&
      openAiActiveFunctions.length > 0 &&
      transliteratedOpenAiFunctions.length > 0
    ) {
      // Устанавливаем состояние активных функций точно соответствующее OpenAI
      setLocalActiveFunctionIds(transliteratedOpenAiFunctions);
    }
  }, [
    isLoadingOpenAiFunctions,
    openAiActiveFunctions,
    transliteratedOpenAiFunctions,
  ]);

  // Функция только для проверки состояния функций (только отображение, без изменения)
  const checkFunctionState = async () => {
    if (isCheckingState) return; // Предотвращаем одновременные проверки

    setIsCheckingState(true);
    try {
      // Получаем свежие данные о функциях с сервера
      await refetchOpenAiFunctions();
      // Обновляем данные о функциях с ассистентами
      await refetchFunctionAssistants();

      // Синхронизируем только при явном запросе (не автоматически)
      // Сразу устанавливаем needsSync = false после проверки
      setNeedsSync(false);
    } catch (error) {
      console.error("Ошибка при проверке состояния функций:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось проверить состояние функций",
        variant: "destructive",
      });
    } finally {
      setIsCheckingState(false);
    }
  };

  if (
    isLoadingChannels ||
    isLoadingFunctions ||
    isLoadingFunctionAssistants ||
    isLoadingAssistant
  ) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Загрузка данных...</span>
      </div>
    );
  }

  // Если нет каналов оповещений, показываем сообщение
  if (notificationChannels.length === 0) {
    return (
      <div className="p-6 border rounded-md border-dashed text-center">
        <Bell className="h-12 w-12 mx-auto mb-2 text-muted-foreground/80" />
        <h3 className="text-lg font-medium mb-2">
          Нет доступных каналов оповещений
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Создайте хотя бы один канал оповещений в разделе "Каналы оповещений",
          чтобы подключить его к ассистенту.
        </p>
        <Button variant="outline" asChild>
          <a href="/notification-channels">
            <Plus className="h-4 w-4 mr-2" />
            Перейти к управлению каналами
          </a>
        </Button>
      </div>
    );
  }

  // Обработчик для включения/отключения всего канала
  const handleToggleChannelEnabled = (channelId: number, enabled: boolean) => {
    console.log(
      `Переключение статуса канала ${channelId} на ${
        enabled ? "включено" : "отключено"
      }`
    );

    // Обновляем состояние для всех функций в канале
    const functionsInChannel = functionAssistants.filter((fa) => {
      const func = openAiFunctions.find((f) => f.id === fa.functionId);
      return func && func.channelId === channelId && fa.enabled;
    });

    console.log(`Функции в канале ${channelId}:`, functionsInChannel);

    if (functionsInChannel.length === 0) {
      console.log(`В канале ${channelId} нет активных функций`);

      // Проверяем, есть ли вообще функции, связанные с этим каналом в принципе
      const availableFunctions = functionsByChannel[channelId] || [];

      if (availableFunctions.length === 0) {
        toast({
          title: "Нет доступных функций",
          description: "В этом канале нет функций для настройки",
        });
      } else {
        toast({
          title: "Нет активных функций",
          description:
            "В этом канале нет активных функций. Сначала включите функции для ассистента.",
        });
      }
      return;
    }

    // Устанавливаем статус для всех функций в канале
    Promise.all(
      functionsInChannel.map((fa) =>
        updateFunctionChannelMutation.mutateAsync({
          functionAssistantId: fa.id,
          channelEnabled: enabled,
        })
      )
    )
      .then((results) => {
        const success = results.every((r) => r.success);
        if (success) {
          toast({
            title: "Настройки сохранены",
            description: `Канал ${
              enabled ? "включен" : "отключен"
            } для всех функций`,
          });

          // Обновляем данные
          refetchFunctionAssistants();
        } else {
          toast({
            title: "Ошибка",
            description: "Не удалось обновить настройки для некоторых функций",
            variant: "destructive",
          });
        }
      })
      .catch((error) => {
        console.error("Ошибка при обновлении статуса канала:", error);
        toast({
          title: "Ошибка соединения",
          description: "Не удалось обновить настройки канала",
          variant: "destructive",
        });
      });
  };

  // Определяем, все ли функции канала имеют включенную отправку
  const isChannelFullyEnabled = (channelId: number): boolean => {
    const functionsInChannel = functionAssistants.filter((fa) => {
      const func = openAiFunctions.find((f) => f.id === fa.functionId);
      // Фильтруем только активные и связанные с текущим каналом функции
      return func && func.channelId === channelId && fa.enabled;
    });

    // Если у канала нет функций, считаем его выключенным
    if (functionsInChannel.length === 0) return false;

    console.log(`Проверка полного включения канала ${channelId}:`, {
      channelId,
      functionsCount: functionsInChannel.length,
      channelEnabled: functionsInChannel.map((fa) => ({
        id: fa.id,
        functionId: fa.functionId,
        channelEnabled: fa.channelEnabled,
      })),
    });

    // Канал полностью включен если все активные функции имеют channelEnabled=true
    const result = functionsInChannel.every((fa) => fa.channelEnabled === true);
    console.log(
      `Результат проверки полного включения канала ${channelId}: ${result}`
    );
    return result;
  };

  // Определяем, есть ли хотя бы одна функция с включенной отправкой
  const isChannelPartiallyEnabled = (channelId: number): boolean => {
    const functionsInChannel = functionAssistants.filter((fa) => {
      const func = openAiFunctions.find((f) => f.id === fa.functionId);
      // Фильтруем только активные и связанные с текущим каналом функции
      return func && func.channelId === channelId && fa.enabled;
    });

    // Если у канала нет функций, считаем его выключенным
    if (functionsInChannel.length === 0) return false;

    console.log(`Проверка частичного включения канала ${channelId}:`, {
      channelId,
      functionsCount: functionsInChannel.length,
      channelEnabled: functionsInChannel.map((fa) => ({
        id: fa.id,
        functionId: fa.functionId,
        channelEnabled: fa.channelEnabled,
      })),
    });

    // Канал частично включен если хотя бы одна функция имеет channelEnabled=true
    const result = functionsInChannel.some((fa) => fa.channelEnabled === true);
    console.log(
      `Результат проверки частичного включения канала ${channelId}: ${result}`
    );
    return result;
  };

  const handleFunctionToggle = async (functionId: number, enabled: boolean) => {
    try {
      // Находим существующую связь функции с ассистентом
      const functionAssistant = functionAssistants.find(
        (fa) => fa.functionId === functionId
      );

      if (enabled) {
        // Если функция включается
        if (!functionAssistant) {
          // Если связи нет, создаем новую
          const func = openAiFunctions.find((f) => f.id === functionId);
          if (!func) {
            throw new Error("Функция не найдена");
          }

          // Определяем канал оповещений
          const channelId =
            func.channelId ||
            (notificationChannels.length > 0
              ? notificationChannels[0].id
              : null);
          if (!channelId) {
            throw new Error("Не найден канал оповещений");
          }

          // Создаем новую связь
          const response = await fetch(`/api/function-assistants`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              functionId,
              assistantId,
              notificationChannelId: channelId,
              enabled: true,
              channelEnabled: true,
              settings: {},
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error("Ошибка при создании связи:", errorText);
            throw new Error(
              `Ошибка сервера: ${response.status} ${response.statusText}`
            );
          }

          const data = await response.json();
          console.log("Связь успешно создана:", data);
        } else {
          // Если связь существует, обновляем её статус
          const response = await fetch(
            `/api/function-assistants/${functionAssistant.id}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                enabled: true,
              }),
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error("Ошибка при обновлении связи:", errorText);
            throw new Error(
              `Ошибка сервера: ${response.status} ${response.statusText}`
            );
          }

          const data = await response.json();
          console.log("Связь успешно обновлена:", data);
        }
      } else {
        // Если функция отключается
        if (!functionAssistant) {
          throw new Error("Связь функции с ассистентом не найдена");
        }

        // Удаляем связь
        const response = await fetch(
          `/api/function-assistants/${functionAssistant.id}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Ошибка при удалении связи:", errorText);
          throw new Error(
            `Ошибка сервера: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log("Связь успешно удалена:", data);
      }

      // Обновляем локальное состояние
      setLocalActiveFunctionIds((prev) => {
        if (enabled) {
          return [...prev, functionId];
        } else {
          return prev.filter((id) => id !== functionId);
        }
      });

      // Обновляем данные из БД
      refetchFunctionAssistants();
    } catch (error) {
      console.error("Ошибка при выполнении запроса:", error);
      toast({
        title: "Ошибка",
        description:
          "Не удалось обновить настройки функции. Пожалуйста, попробуйте позже.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <Label className="text-base font-medium">Каналы оповещений</Label>
          <div className="text-sm text-muted-foreground mt-1">
            Настройте, какие функции будут отправлять данные в каналы
            уведомлений
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild size="sm">
            <a href="/notification-channels">Управление каналами</a>
          </Button>

          {/* Маленькая кнопка для обновления UI (без синхронизации) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={checkFunctionState}
            title="Обновить состояние UI"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 max-h-[400px] overflow-y-auto pr-1">
        <div className="block md:hidden">
          {notificationChannels.map((channel) => {
            const functionsInChannel = functionsByChannel[channel.id] || [];

            return (
              <div
                key={channel.id}
                className="mt-4 border rounded-md overflow-hidden"
              >
                {/* Верхняя панель */}
                <div className="flex justify-between items-center p-2 bg-gray-100">
                  <div className="flex items-center gap-2">
                    {getChannelIcon(channel.type)}
                    <span className="font-medium">{channel.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {channel.type}
                  </div>
                </div>

                {/* Таблица или заглушка */}
                {functionsInChannel.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Статус</TableHead>
                        <TableHead>Название</TableHead>
                        <TableHead>Активность</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {functionsInChannel.map((func) => {
                        const isActive = isFunctionActive(func.id);
                        const isLoading =
                          loadingFunctionIds.includes(func.id) ||
                          isLoadingOpenAiFunctions;

                        return (
                          <TableRow key={func.id}>
                            <TableCell>
                              <FunctionToggle
                                functionId={func.id}
                                channelId={channel.id}
                                isActive={isActive}
                                functionName={func.name}
                                disabled={isAnyLoading}
                                loading={isLoading}
                                onToggle={handleToggleFunction}
                              />
                            </TableCell>
                            <TableCell className="font-medium whitespace-normal break-words max-w-[150px]">
                              {func.name}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  isActive
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {isActive ? "Активна" : "Неактивна"}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-4 text-center text-gray-500 bg-gray-50">
                    <p>Нет доступных функций для этого канала</p>
                    <Button variant="link" asChild size="sm">
                      <a
                        href="/notification-channels"
                        className="flex items-center justify-center"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Добавить функции
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {notificationChannels.map((channel) => {
          const functionsInChannel = functionsByChannel[channel.id] || [];
          const activeFunctionsCount = functionAssistants.filter((fa) => {
            const func = openAiFunctions.find((f) => f.id === fa.functionId);
            return func && func.channelId === channel.id && fa.enabled;
          }).length;

          const hasActiveFunctions = activeFunctionsCount > 0;

          // Use wrapper functions to avoid naming conflicts
          const isFullyEnabled = (() => isChannelFullyEnabled(channel.id))();
          const isPartiallyEnabled = (() =>
            isChannelPartiallyEnabled(channel.id))();

          return (
            <div key={channel.id}>
              <div className="p-4 border rounded-md hidden md:block">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {getChannelIcon(channel.type)}
                    <span className="font-medium">{channel.name}</span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                      {channel.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-sm text-muted-foreground">
                        {functionsInChannel.length} доступных функций
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full mt-1">
                        {activeFunctionsCount} активных
                      </span>
                    </div>
                  </div>
                </div>
                {functionsInChannel.length > 0 ? (
                  <div className="mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px]">Статус</TableHead>
                          <TableHead>Название</TableHead>
                          <TableHead>Описание</TableHead>
                          <TableHead className="w-[80px]">Активность</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {functionsInChannel.map((func) => {
                          const isActive = isFunctionActive(func.id);
                          const fa = functionAssistants.find(
                            (fa) => fa.functionId === func.id
                          );
                          const isChannelEnabled = fa
                            ? fa.channelEnabled
                            : false;
                          const isLoading =
                            loadingFunctionIds.includes(func.id) ||
                            isLoadingOpenAiFunctions;

                          return (
                            <TableRow key={func.id}>
                              <TableCell>
                                <div className="flex items-center">
                                  <FunctionToggle
                                    functionId={func.id}
                                    channelId={channel.id}
                                    isActive={isActive}
                                    functionName={func.name}
                                    disabled={isAnyLoading}
                                    loading={isLoading}
                                    onToggle={handleToggleFunction}
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="font-medium whitespace-normal break-words max-w-[150px]">
                                {func.name}
                              </TableCell>
                              <TableCell className="text-sm text-gray-500 whitespace-normal break-words">
                                {func.description || "Нет описания"}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs ${
                                      isActive
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {!isActive ? "Неактивна" : "Активна"}
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-4 text-center text-gray-500 bg-gray-50 rounded-md">
                    <p>Нет доступных функций для этого канала</p>
                    <Button variant="link" asChild size="sm">
                      <a
                        href="/notification-channels"
                        className="flex items-center"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Добавить функции
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
