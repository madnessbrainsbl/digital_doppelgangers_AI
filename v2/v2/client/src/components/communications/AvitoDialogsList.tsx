import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  RefreshCw,
  MessageCircle,
  User,
  Bot,
  MoreVertical,
  Search,
  Filter,
  CheckSquare,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import MobileAvitoChat from "./MobileAvitoChat";

// Интерфейс для диалога Авито
interface AvitoDialog {
  id: string;
  user?: {
    name: string;
    id: string;
  };
  clientName?: string; // Альтернативное поле для имени клиента
  lastMessage: {
    date: number; // timestamp
    text: string;
    isOutgoing: boolean;
  };
  unreadCount: number;
}

// Интерфейс для отображения диалога
interface AvitoDialogDisplay extends AvitoDialog {
  formattedDate: string;
  botActive?: boolean;
}

// Интерфейс для назначения ассистента
interface DialogAssistant {
  id: number;
  dialogId: string;
  channelId: number;
  assistantId: number | null;
  enabled: boolean;
  autoReply: boolean;
  settings?: any;
  createdAt: string;
  updatedAt: string;
}

// Интерфейс связи ассистента с каналом
interface AssistantChannel {
  id: number;
  assistantId: number;
  channelId: number;
  enabled: boolean;
  autoReply: boolean;
  isDefault: boolean;
  settings?: any;
  createdAt: string;
  updatedAt: string;
}

// Интерфейс для информации об ассистенте
interface Assistant {
  id: number;
  name: string;
  description: string;
  openaiAssistantId: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

interface AvitoDialogsListProps {
  channelId: number;
  onSelectDialog: (chatId: string) => void;
  selectedChatId: string | null;
}

export default function AvitoDialogsList({
  channelId,
  onSelectDialog,
  selectedChatId,
}: AvitoDialogsListProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);
  const [assignMode, setAssignMode] = useState(false);
  const [selectedAssistantId, setSelectedAssistantId] = useState<number | null>(
    null
  );
  const [mobileActiveTab, setMobileActiveTab] = useState<string>("all");
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [mobileChatId, setMobileChatId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Состояние для пагинации
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [allDialogs, setAllDialogs] = useState<AvitoDialog[]>([]);
  const limit = 50;

  // Запрос на получение диалогов
  const {
    data: avitoDialogs,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<AvitoDialog[]>({
    queryKey: [`/api/channels/${channelId}/avito/dialogs`, { limit, offset }],
    enabled: !!channelId,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Обработка полученных данных
  useEffect(() => {
    if (avitoDialogs) {
      if (offset === 0) {
        // Если это первый запрос, просто устанавливаем диалоги
        setAllDialogs(avitoDialogs);
      } else {
        // Если это подгрузка, добавляем к существующим
        setAllDialogs((prev) => [
          ...prev,
          ...avitoDialogs.filter(
            (dialog) => !prev.some((prevDialog) => prevDialog.id === dialog.id)
          ),
        ]);
      }

      // Определяем, есть ли еще диалоги для загрузки
      setHasMore(avitoDialogs.length === limit);
    }
  }, [avitoDialogs, offset, limit]);

  // Запрос на получение назначений ассистентов для диалогов
  const { data: dialogAssistants, isLoading: isLoadingAssistants } = useQuery<
    DialogAssistant[]
  >({
    queryKey: [`/api/channels/${channelId}/dialogs/assistants`],
    enabled: !!channelId,
  });

  // Запрос на получение основного ассистента канала
  const { data: channelAssistant, isLoading: isLoadingChannelAssistant } =
    useQuery<AssistantChannel | null>({
      queryKey: [`/api/channels/${channelId}/assistant`],
      enabled: !!channelId,
    });

  // Запрос на получение всех доступных ассистентов
  const { data: availableAssistants, isLoading: isLoadingAssistants2 } =
    useQuery<Assistant[]>({
      queryKey: ["/api/assistants"],
    });

  // Подписка на события прочтения сообщений
  useEffect(() => {
    if (selectedChatId && avitoDialogs && Array.isArray(avitoDialogs)) {
      const dialog = avitoDialogs.find((d) => d.id === selectedChatId);
      if (dialog && dialog.unreadCount && dialog.unreadCount > 0) {
        refetch();
      }
    }
  }, [selectedChatId, avitoDialogs, refetch]);

  // Мутация для назначения ассистента на диалог
  interface AssignAssistantParams {
    dialogId: string;
    assistantId: number | null;
    enabled?: boolean;
    autoReply?: boolean;
  }

  const assignAssistantMutation = useMutation({
    mutationFn: async (data: AssignAssistantParams) => {
      return await apiRequest({
        url: `/api/channels/${channelId}/dialogs/${data.dialogId}/assistant`,
        method: "POST",
        body: {
          assistantId: data.assistantId,
          enabled: data.enabled,
          autoReply: data.autoReply,
        },
      });
    },
    onSuccess: () => {
      // При успешном назначении обновляем список диалогов
      queryClient.invalidateQueries({
        queryKey: [`/api/channels/${channelId}/dialogs/assistants`],
      });

      toast({
        title: "Настройки ассистента обновлены",
      });
    },
    onError: (error: Error) => {
      console.error("Ошибка при назначении ассистента", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить настройки ассистента",
        variant: "destructive",
      });
    },
  });

  // Функция для загрузки следующей страницы диалогов
  const loadMoreDialogs = () => {
    if (hasMore && !isFetching) {
      setOffset((prev) => prev + limit);
    }
  };

  // Обработчик события прокрутки для бесконечной подгрузки
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

    // Если прокрутили близко к концу списка, загружаем следующую страницу
    if (
      scrollHeight - scrollTop - clientHeight < 200 &&
      hasMore &&
      !isFetching
    ) {
      loadMoreDialogs();
    }
  };

  // Преобразование диалогов Авито в формат для отображения
  const formattedDialogs: AvitoDialogDisplay[] = allDialogs
    ? allDialogs.map((dialog) => {
        const date = new Date(dialog.lastMessage.date * 1000);
        const now = new Date();

        // Определяем формат времени/даты
        let formattedDate: string;
        if (date.toDateString() === now.toDateString()) {
          // Сегодня - показываем только время
          formattedDate = format(date, "HH:mm", { locale: ru });
        } else if (date.getFullYear() === now.getFullYear()) {
          // В этом году - показываем день и месяц
          formattedDate = format(date, "d MMM", { locale: ru });
        } else {
          // Более старые сообщения - показываем полную дату
          formattedDate = format(date, "d MMM yyyy", { locale: ru });
        }

        // Находим запись о назначении ассистента
        const dialogAssistant = dialogAssistants?.find(
          (da) => da.dialogId === dialog.id && da.channelId === channelId
        );

        // Создаем объект для отображения
        return {
          ...dialog,
          formattedDate,
          botActive:
            channelAssistant?.enabled && // Проверяем, что ассистент активирован на уровне канала
            dialogAssistant !== undefined &&
            dialogAssistant.assistantId !== null &&
            dialogAssistant.enabled &&
            dialogAssistant.autoReply,
        };
      })
    : [];

  // Фильтрованный и отсортированный список диалогов
  const filteredDialogs = formattedDialogs
    .filter((dialog) => {
      if (!searchQuery.trim()) return true;

      // Поиск по имени пользователя или тексту сообщения
      const lowerCaseQuery = searchQuery.toLowerCase();
      // Получаем имя пользователя с учетом возможных разных источников данных
      const userName =
        dialog.user?.name || dialog.clientName || "Неизвестный клиент";
      return (
        userName.toLowerCase().includes(lowerCaseQuery) ||
        dialog.lastMessage.text.toLowerCase().includes(lowerCaseQuery)
      );
    })
    .sort((a, b) => {
      // Сортировка: сначала непрочитанные, затем по дате (новые вверху)
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      return b.lastMessage.date - a.lastMessage.date;
    });

  // Диалоги с непрочитанными сообщениями
  const unreadDialogs = filteredDialogs.filter(
    (dialog) => dialog.unreadCount > 0
  );

  // Общее количество непрочитанных сообщений
  const totalUnreadCount = formattedDialogs.reduce(
    (sum, dialog) => sum + dialog.unreadCount,
    0
  );

  // Функция для обновления списка диалогов
  const refreshData = async () => {
    setRefreshing(true);
    // Сбрасываем смещение и статус пагинации
    setOffset(0);
    setHasMore(true);
    setAllDialogs([]);
    try {
      await refetch();
    } catch (error) {
      console.error("Ошибка при обновлении диалогов", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить список диалогов",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Функция для назначения/отмены назначения ассистента на диалог
  const toggleBotForDialog = async (dialogId: string) => {
    try {
      // Находим текущие настройки ассистента для диалога
      const dialogAssistant = dialogAssistants?.find(
        (da) => da.dialogId === dialogId && da.channelId === channelId
      );

      if (!dialogAssistant) {
        toast({
          title: "Ошибка",
          description: "Не удалось найти диалог",
          variant: "destructive",
        });
        return;
      }
      // Если ассистент в диалоге ключен
      if (dialogAssistant.enabled) {
        // Переключаем autoReply на противоположное значение
        await assignAssistantMutation.mutateAsync({
          dialogId,
          assistantId: dialogAssistant.assistantId,
          enabled: true, // Оставляем enabled как есть
          autoReply: !dialogAssistant.autoReply, // Инвертируем текущее значение autoReply
        });

        toast({
          title: dialogAssistant.autoReply
            ? "Автоответ отключен"
            : "Автоответ включен",
          description: dialogAssistant.autoReply
            ? "Ассистент не будет автоматически отвечать на сообщения в этом диалоге"
            : "Ассистент будет автоматически отвечать на сообщения в этом диалоге",
        });
      }
    } catch (error) {
      console.error("Ошибка при обновлении настроек ассистента", error);
      toast({
        title: "Ошибка",
        description: "Не удалось подключить диалог к автоответам ассистента",
        variant: "destructive",
      });
    }
  };

  // Функция для переключения режима назначения
  const toggleAssignMode = () => {
    // Если включаем режим назначения, устанавливаем текущего ассистента канала
    if (!assignMode && channelAssistant?.assistantId) {
      setSelectedAssistantId(channelAssistant.assistantId);
    } else if (!assignMode) {
      // Если ассистент не назначен на канал, но есть ассистенты, выбираем первого
      if (availableAssistants && availableAssistants.length > 0) {
        setSelectedAssistantId(availableAssistants[0].id);
      } else {
        setSelectedAssistantId(null);
      }
    }

    setAssignMode(!assignMode);
  };

  // Обработчик выбора ассистента
  const handleAssistantSelect = (assistantId: number | null) => {
    setSelectedAssistantId(assistantId);
  };

  // Обновляем функцию обработки клика по диалогу для мобильной версии
  const handleDialogClick = (dialogId: string) => {
    // На мобильных устройствах
    if (window.innerWidth < 640) {
      // sm breakpoint в Tailwind по умолчанию 640px
      setMobileChatId(dialogId);
      setShowMobileChat(true);
    } else {
      // На десктопе используем обычный обработчик
      onSelectDialog(dialogId);
    }
  };

  // Функция закрытия мобильного чата
  const handleCloseMobileChat = () => {
    setShowMobileChat(false);
  };

  // Содержимое при загрузке
  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-neutral-200 dark:border-neutral-700 flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-9" />
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Если диалогов нет
  if (allDialogs.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-neutral-200 dark:border-neutral-700 flex gap-2">
          <Input
            placeholder="Поиск диалогов..."
            className="flex-1"
            disabled
            value={searchQuery}
          />
          <Button
            size="icon"
            variant="outline"
            onClick={refreshData}
            disabled={refreshing}
            className="shrink-0"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 text-center">
          <div>
            <MessageCircle className="h-12 w-12 mx-auto text-neutral-400 mb-2" />
            <p className="text-neutral-500 dark:text-neutral-400">
              Нет доступных диалогов
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={refreshData}
              disabled={refreshing}
            >
              {refreshing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Обновление...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Обновить
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-neutral-200 dark:border-neutral-700 flex gap-2">
        <Input
          placeholder="Поиск диалогов..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Button
          size="icon"
          variant="outline"
          onClick={refreshData}
          disabled={refreshing}
          className="shrink-0"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      <div className="my-2 block sm:hidden">
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={mobileActiveTab === "all" ? "default" : "outline"}
            className="w-full"
            onClick={() => setMobileActiveTab("all")}
          >
            Все{" "}
            {totalUnreadCount > 0 && (
              <span className="ml-1 text-primary-500">
                ({totalUnreadCount})
              </span>
            )}
          </Button>
          <Button
            type="button"
            variant={mobileActiveTab === "unread" ? "default" : "outline"}
            className="w-full"
            onClick={() => setMobileActiveTab("unread")}
          >
            Непрочитанные{" "}
            {totalUnreadCount > 0 && (
              <span className="ml-1 text-primary-500">
                ({totalUnreadCount})
              </span>
            )}
          </Button>
        </div>
        {/* Оборачиваем список диалогов в scrollable container с фиксированной высотой */}
        <div className="h-[calc(100vh-12rem)] overflow-y-auto mt-2 pb-4">
          <div className="grid grid-cols-1 gap-1">
            {/* Показываем диалоги в зависимости от выбранной вкладки */}
            {(mobileActiveTab === "all" ? filteredDialogs : unreadDialogs)
              .length === 0 ? (
              <div className="py-10 flex items-center justify-center p-4 text-center">
                <div>
                  <p className="text-neutral-500 dark:text-neutral-400">
                    {mobileActiveTab === "all"
                      ? "Нет доступных диалогов"
                      : "Нет непрочитанных сообщений"}
                  </p>
                </div>
              </div>
            ) : (
              (mobileActiveTab === "all" ? filteredDialogs : unreadDialogs).map(
                (dialog) => (
                  <div
                    key={dialog.id}
                    className={`
                  p-3 flex items-start gap-3 cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-800 transition
              ${
                selectedChatId === dialog.id
                  ? "bg-neutral-100 dark:bg-neutral-800"
                  : ""
              }
              ${dialog.unreadCount > 0 ? "bg-blue-50 dark:bg-blue-950" : ""}
            `}
                    onClick={() => handleDialogClick(dialog.id)}
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                        <User className="h-5 w-5 text-neutral-500 dark:text-neutral-300" />
                      </div>
                      {dialog.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white">
                            {dialog.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col w-1/2">
                      <h4 className="">
                        {dialog.user?.name ||
                          dialog.clientName ||
                          "Неизвестный клиент"}
                      </h4>

                      <p className="text-xs text-neutral-600 dark:text-neutral-300 truncate mt-1 max-w-[220px]">
                        {dialog.lastMessage.isOutgoing && (
                          <span className="text-green-600 dark:text-green-400 mr-1">
                            ✓
                          </span>
                        )}
                        {dialog.lastMessage.text || "Изображение"}
                      </p>
                    </div>

                    <div className="flex flex-1 justify-end">
                      {dialog.unreadCount > 0 && (
                        <div className="mr-1 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs leading-none">
                          {dialog.unreadCount}
                        </div>
                      )}

                      {/* Иконка активного бота или действия режима назначения */}
                      {assignMode ? (
                        <Button
                          variant={dialog.botActive ? "destructive" : "default"}
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBotForDialog(dialog.id);
                          }}
                        >
                          {dialog.botActive ? (
                            <Bot className="h-4 w-4" />
                          ) : (
                            <CheckSquare className="h-4 w-4" />
                          )}
                        </Button>
                      ) : (
                        channelAssistant?.enabled && (
                          <div
                            className="flex items-center ml-2 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBotForDialog(dialog.id);
                            }}
                            title={
                              dialog.botActive
                                ? "Отключить ассистента"
                                : "Включить ассистента"
                            }
                          >
                            <div
                              className={cn("p-1 rounded", {
                                "bg-emerald-100 dark:bg-emerald-900":
                                  dialog.botActive,
                                "bg-neutral-100 dark:bg-neutral-800":
                                  !dialog.botActive,
                              })}
                            >
                              <Bot
                                className={cn("h-4 w-4", {
                                  "text-emerald-500 dark:text-emerald-300":
                                    dialog.botActive,
                                  "text-neutral-400 dark:text-neutral-500":
                                    !dialog.botActive,
                                })}
                              />
                            </div>
                          </div>
                        )
                      )}

                      <div className="text-xs text-neutral-500 whitespace-nowrap ml-2">
                        {dialog.formattedDate}
                      </div>
                    </div>
                  </div>
                )
              )
            )}

            {/* Индикатор загрузки для мобильной версии */}
            {isFetching && mobileActiveTab === "all" && (
              <div className="p-4 flex justify-center">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-neutral-500" />
                  <span className="text-sm text-neutral-500">Загрузка...</span>
                </div>
              </div>
            )}

            {/* Сообщение о конце списка */}
            {!isFetching &&
              !hasMore &&
              allDialogs.length > 0 &&
              mobileActiveTab === "all" && (
                <div className="p-4 text-center text-sm text-neutral-500">
                  Вы достигли конца списка диалогов
                </div>
              )}
          </div>
        </div>
      </div>

      <Tabs
        defaultValue="all"
        className="hidden sm:flex flex-col overflow-y-auto"
      >
        <div className="border-b border-neutral-200 dark:border-neutral-700 px-2 sticky top-0 bg-white dark:bg-neutral-900 z-10">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1 ">
              Все{" "}
              {totalUnreadCount > 0 && (
                <span className="ml-1 text-primary-500">
                  ({totalUnreadCount})
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1">
              Непрочитанные{" "}
              {totalUnreadCount > 0 && (
                <span className="ml-1 text-primary-500">
                  ({totalUnreadCount})
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Панель настройки ассистента */}
        {assignMode && (
          <div className="p-3 border-b border-neutral-200 dark:border-neutral-700 sticky top-12 bg-white dark:bg-neutral-900 z-10">
            <div className="mb-2">
              <p className="text-sm font-medium">
                Выберите ассистента для назначения:
              </p>
            </div>
            <Select
              value={selectedAssistantId?.toString() || ""}
              onValueChange={(value) =>
                handleAssistantSelect(value ? parseInt(value) : null)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите ассистента" />
              </SelectTrigger>
              <SelectContent>
                {!availableAssistants || availableAssistants.length === 0 ? (
                  <SelectItem value="" disabled>
                    Нет доступных ассистентов
                  </SelectItem>
                ) : (
                  availableAssistants.map((assistant) => (
                    <SelectItem
                      key={assistant.id}
                      value={assistant.id.toString()}
                    >
                      {assistant.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <div className="mt-3 flex justify-between">
              <Button variant="outline" size="sm" onClick={toggleAssignMode}>
                Отмена
              </Button>
              <Button
                size="sm"
                onClick={toggleAssignMode}
                disabled={selectedAssistantId === null}
              >
                Применить
              </Button>
            </div>
          </div>
        )}

        <TabsContent value="all" className="flex-1 p-0">
          <div className="h-full overflow-y-auto" onScroll={handleScroll}>
            <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {filteredDialogs.map((dialog) => (
                <div
                  key={dialog.id}
                  className={`
                    p-3 flex items-start gap-3 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition
                    ${
                      selectedChatId === dialog.id
                        ? "bg-neutral-100 dark:bg-neutral-800"
                        : ""
                    }
                    ${
                      dialog.unreadCount > 0
                        ? "bg-blue-50 dark:bg-blue-950"
                        : ""
                    }
                  `}
                  onClick={() => handleDialogClick(dialog.id)}
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                      <User className="h-5 w-5 text-neutral-500 dark:text-neutral-300" />
                    </div>
                    {dialog.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white">
                          {dialog.unreadCount}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 w-[90%]">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-medium truncate max-w-[60%]">
                        {dialog.user?.name ||
                          dialog.clientName ||
                          "Неизвестный клиент"}
                      </h4>
                      <span className="text-xs text-neutral-500 whitespace-nowrap ml-2">
                        {dialog.formattedDate}
                      </span>
                    </div>

                    <p className="text-sm text-neutral-600 dark:text-neutral-300 truncate mt-1 max-w-[220px]">
                      {dialog.lastMessage.isOutgoing && (
                        <span className="text-green-600 dark:text-green-400 mr-1">
                          ✓
                        </span>
                      )}
                      {dialog.lastMessage.text || "Изображение"}
                    </p>
                  </div>

                  {dialog.unreadCount > 0 && (
                    <div className="mr-2 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs leading-none">
                      {dialog.unreadCount}
                    </div>
                  )}

                  {/* Иконка активного бота или действия режима назначения */}
                  {assignMode ? (
                    <Button
                      variant={dialog.botActive ? "destructive" : "default"}
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBotForDialog(dialog.id);
                      }}
                    >
                      {dialog.botActive ? (
                        <Bot className="h-4 w-4" />
                      ) : (
                        <CheckSquare className="h-4 w-4" />
                      )}
                    </Button>
                  ) : (
                    channelAssistant?.enabled && (
                      <div
                        className="flex items-center ml-2 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBotForDialog(dialog.id);
                        }}
                        title={
                          dialog.botActive
                            ? "Отключить ассистента"
                            : "Включить ассистента"
                        }
                      >
                        <div
                          className={cn("p-1 rounded", {
                            "bg-emerald-100 dark:bg-emerald-900":
                              dialog.botActive,
                            "bg-neutral-100 dark:bg-neutral-800":
                              !dialog.botActive,
                          })}
                        >
                          <Bot
                            className={cn("h-4 w-4", {
                              "text-emerald-500 dark:text-emerald-300":
                                dialog.botActive,
                              "text-neutral-400 dark:text-neutral-500":
                                !dialog.botActive,
                            })}
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              ))}

              {/* Индикатор загрузки следующей страницы */}
              {isFetching && offset > 0 && (
                <div className="p-4 flex justify-center">
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-neutral-500" />
                    <span className="text-sm text-neutral-500">
                      Загрузка...
                    </span>
                  </div>
                </div>
              )}

              {/* Сообщение о конце списка */}
              {!isFetching && !hasMore && allDialogs.length > 0 && (
                <div className="p-4 text-center text-sm text-neutral-500">
                  Вы достигли конца списка диалогов
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="unread" className="flex-1 p-0">
          <div className="h-full overflow-y-auto">
            {unreadDialogs.length === 0 ? (
              <div className="h-full flex items-center justify-center p-4 text-center">
                <div>
                  <p className="text-neutral-500 dark:text-neutral-400">
                    Нет непрочитанных сообщений
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {unreadDialogs.map((dialog) => (
                  <div
                    key={dialog.id}
                    className={`
                      p-3 flex items-start gap-3 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition
                      ${
                        selectedChatId === dialog.id
                          ? "bg-neutral-100 dark:bg-neutral-800"
                          : ""
                      }
                      bg-blue-50 dark:bg-blue-950
                    `}
                    onClick={() => handleDialogClick(dialog.id)}
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                        <User className="h-5 w-5 text-neutral-500 dark:text-neutral-300" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white">
                          {dialog.unreadCount}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 w-[90%]">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-medium truncate max-w-[60%]">
                          {dialog.user?.name ||
                            dialog.clientName ||
                            "Неизвестный клиент"}
                        </h4>
                        <span className="text-xs text-neutral-500 whitespace-nowrap ml-2">
                          {dialog.formattedDate}
                        </span>
                      </div>

                      <p className="text-sm text-neutral-600 dark:text-neutral-300 truncate mt-1 max-w-[220px]">
                        {dialog.lastMessage.isOutgoing && (
                          <span className="text-green-600 dark:text-green-400 mr-1">
                            ✓
                          </span>
                        )}
                        {dialog.lastMessage.text || "Изображение"}
                      </p>
                    </div>

                    {/* Иконка активного бота с возможностью переключения */}
                    {!assignMode && channelAssistant?.enabled && (
                      <div
                        className="flex items-center ml-2 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBotForDialog(dialog.id);
                        }}
                        title={
                          dialog.botActive
                            ? "Отключить ассистента"
                            : "Включить ассистента"
                        }
                      >
                        <div
                          className={`p-1 rounded ${
                            dialog.botActive
                              ? "bg-emerald-100 dark:bg-emerald-900"
                              : "bg-neutral-100 dark:bg-neutral-800"
                          }`}
                        >
                          <Bot
                            className={`h-4 w-4 ${
                              dialog.botActive
                                ? "text-emerald-500 dark:text-emerald-300"
                                : "text-neutral-400 dark:text-neutral-500"
                            }`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Мобильный чат */}
      {channelId && mobileChatId && (
        <MobileAvitoChat
          channelId={channelId}
          chatId={mobileChatId}
          isVisible={showMobileChat}
          onClose={handleCloseMobileChat}
        />
      )}
    </div>
  );
}
