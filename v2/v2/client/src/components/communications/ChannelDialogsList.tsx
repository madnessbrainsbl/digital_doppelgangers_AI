import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { VkConversation, VkDialogDisplay } from "@/types/messages";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { Bot, RefreshCw } from "lucide-react";
import AvitoDialogsList from "./AvitoDialogsList";
import { cn } from "@/lib/utils";

// Тип для данных о привязке ассистента к диалогу
interface DialogAssistant {
  id: number;
  channelId: number;
  dialogId: number;
  assistantId: number;
  enabled: boolean;
  autoReply: boolean;
  settings: any;
}

interface ChannelDialogsListProps {
  channelId: number | null;
  channelType: string | null;
  onSelectDialog: (dialogId: number | string, type: string) => void;
  selectedDialogId: number | string | null;
}

export default function ChannelDialogsList({
  channelId,
  channelType,
  onSelectDialog,
  selectedDialogId,
}: ChannelDialogsListProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [displayDialogs, setDisplayDialogs] = useState<VkDialogDisplay[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [webSearchQuery, setWebSearchQuery] = useState("");
  const queryClient = useQueryClient();

  // Запрос информации о привязке ассистента к каналу
  const { data: channelAssistant } = useQuery<{
    id: number;
    assistantId: number;
    channelId: number;
    enabled: boolean;
  }>({
    queryKey: [`/api/channels/${channelId}/assistant`],
    enabled: !!channelId,
  });

  // Запрос информации о привязке ассистентов к диалогам канала
  const { data: dialogAssistants, refetch: refetchDialogAssistants } = useQuery<
    DialogAssistant[]
  >({
    queryKey: [`/api/channels/${channelId}/dialogs/assistants`],
    enabled: !!channelId && !!channelAssistant,
    // Если нет данных, возвращаем пустой массив
    placeholderData: [],
  });

  // Для VK каналов
  const {
    data: vkDialogs,
    isLoading: isLoadingVk,
    error: vkError,
    refetch: refetchVkDialogs,
  } = useQuery({
    queryKey: [`/api/channels/${channelId}/vk/dialogs`],
    enabled: !!channelId && channelType === "vk",
  });

  const { data: vkProfiles, refetch: refetchVkProfiles } = useQuery({
    queryKey: [`/api/channels/${channelId}/vk/profiles`],
    enabled:
      !!channelId &&
      channelType === "vk" &&
      !!vkDialogs &&
      Array.isArray(vkDialogs),
  });

  // Для Web каналов
  const {
    data: webConversations,
    isLoading: isLoadingWeb,
    refetch: refetchWebConversations,
  } = useQuery({
    queryKey: [`/api/channels/${channelId}/conversations`],
    enabled: !!channelId && channelType === "web",
    // Принудительно обновляем данные каждые 5 секунд
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    // Отключаем кеширование, чтобы всегда получать свежие данные
    staleTime: 0,
    gcTime: 0, // В новой версии TanStack Query v5 параметр cacheTime переименован в gcTime
  });

  // Функция для обновления данных VK
  const refreshVkData = async () => {
    if (!channelId || channelType !== "vk") return;

    setRefreshing(true);
    try {
      await refetchVkDialogs();
      await refetchVkProfiles();
      await refetchDialogAssistants();
    } catch (error) {
      console.error("Ошибка при обновлении диалогов:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Функция для обновления данных Web
  const refreshWebData = async () => {
    if (!channelId || channelType !== "web") return;

    setRefreshing(true);
    try {
      await refetchWebConversations();
      await refetchDialogAssistants();
    } catch (error) {
      console.error("Ошибка при обновлении веб-чатов:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Автоматическое обновление данных VK при первом рендере
  useEffect(() => {
    if (!channelId || channelType !== "vk") return;
    // Загружаем данные один раз при монтировании компонента
    refreshVkData();
  }, [channelId, channelType]);

  // Автоматическое обновление данных Web при первом рендере
  useEffect(() => {
    if (!channelId || channelType !== "web") return;
    // Загружаем данные один раз при монтировании компонента
    refreshWebData();

    // Устанавливаем интервал для периодического обновления списка веб-диалогов
    const intervalId = setInterval(() => {
      refreshWebData();
    }, 15000); // Обновляем каждые 15 секунд

    // Очищаем интервал при размонтировании компонента
    return () => clearInterval(intervalId);
  }, [channelId, channelType]);

  // Мутация для включения/выключения ассистента для диалога VK
  const toggleVkAssistantMutation = useMutation({
    mutationFn: async ({
      dialogId,
      autoReply,
    }: {
      dialogId: number;
      autoReply: boolean;
    }) => {
      return await apiRequest({
        method: "POST",
        url: `/api/channels/${channelId}/dialogs/${dialogId}/assistant`,
        body: { autoReply },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/channels/${channelId}/dialogs/assistants`],
      });
      toast({ title: "Настройки ассистента обновлены" });
    },
    onError: (error) => {
      console.error("Ошибка при обновлении настроек ассистента", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить настройки ассистента",
        variant: "destructive",
      });
    },
  });

  const createRecordMutation = useMutation({
    mutationFn: async ({
      dialogs,
      assistantId,
    }: {
      // channelId: number | null;
      dialogs: VkDialogDisplay[];
      assistantId: number;
    }) => {
      return await apiRequest({
        method: "POST",
        url: `/api/channels/${channelId}/dialogs/records`,
        body: { dialogs, assistantId },
      });
    },
  });

  // Мутация для включения/выключения ассистента для диалога Web
  const toggleWebAssistantMutation = useMutation({
    mutationFn: async ({
      dialogId,
      autoReply,
    }: {
      dialogId: string;
      autoReply: boolean;
    }) => {
      return await apiRequest({
        method: "POST",
        url: `/api/channels/${channelId}/dialogs/${dialogId}/assistant`,
        body: { autoReply },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/channels/${channelId}/dialogs/assistants`],
      });
      toast({ title: "Настройки ассистента обновлены" });
    },
    onError: (error) => {
      console.error("Ошибка при обновлении настроек ассистента", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить настройки ассистента",
        variant: "destructive",
      });
    },
  });

  // Преобразование VK диалогов в формат для отображения
  useEffect(() => {
    if (vkDialogs && Array.isArray(vkDialogs)) {
      const formattedDialogs: VkDialogDisplay[] = vkDialogs.map(
        (dialog: VkConversation) => {
          const date = new Date(dialog.lastMessage.date * 1000);
          const now = new Date();

          // Определяем формат времени/даты
          let formattedDate: string;
          if (date.toDateString() === now.toDateString()) {
            formattedDate = format(date, "HH:mm", { locale: ru });
          } else if (date.getFullYear() === now.getFullYear()) {
            formattedDate = format(date, "d MMM", { locale: ru });
          } else {
            formattedDate = format(date, "d MMM yyyy", { locale: ru });
          }

          // Ищем информацию о пользователе в профилях
          let profileName = `Собеседник ${dialog.lastMessage.peerId}`;
          let profileAvatar = undefined;

          if (vkProfiles && Array.isArray(vkProfiles)) {
            const profile = vkProfiles.find(
              (p) => p.id === dialog.lastMessage.peerId
            );
            if (profile) {
              profileName =
                profile.first_name +
                (profile.last_name ? " " + profile.last_name : "");
              profileAvatar = profile.photo_100;
            }
          }

          // Проверяем, есть ли ассистент для этого диалога
          let hasAssistant = false;
          let assistantEnabled = false;
          let autoReply = false;

          if (channelAssistant && dialogAssistants) {
            // hasAssistant теперь зависит от активации ассистента в канале
            hasAssistant = !!channelAssistant.enabled;

            // Ищем настройки для конкретного диалога
            const dialogAssistant = Array.isArray(dialogAssistants)
              ? dialogAssistants.find(
                  (d) =>
                    String(d.dialogId) === String(dialog.lastMessage.peerId)
                )
              : undefined;
            // Если есть настройки для диалога, используем их, иначе берем настройки канала
            assistantEnabled = dialogAssistant
              ? dialogAssistant.enabled
              : typeof channelAssistant === "object" &&
                channelAssistant !== null &&
                channelAssistant &&
                "enabled" in channelAssistant
              ? (channelAssistant as any).enabled
              : false;

            autoReply = dialogAssistant ? dialogAssistant.autoReply : false;
          }

          return {
            id: dialog.id,
            peerId: dialog.lastMessage.peerId,
            fromId: dialog.lastMessage.fromId,
            name: profileName,
            lastMessage: dialog.lastMessage.text || "[вложение]",
            timestamp: formattedDate,
            unread: dialog.unreadCount !== undefined && dialog.unreadCount > 0,
            unreadCount: dialog.unreadCount || 0,
            avatarUrl: profileAvatar,
            hasAssistant,
            assistantEnabled,
            autoReply,
          };
        }
      );

      createRecordMutation.mutate({
        assistantId: channelAssistant?.assistantId || 0,
        dialogs: formattedDialogs,
      });

      setDisplayDialogs(formattedDialogs);
    }
  }, [vkDialogs, vkProfiles, channelAssistant, dialogAssistants]);

  // Фильтрация VK диалогов по поисковому запросу
  const filteredVkDialogs = searchQuery.trim()
    ? displayDialogs.filter(
        (d) =>
          d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : displayDialogs;

  // Подсчет общего количества непрочитанных сообщений VK
  const totalUnreadCount = useMemo(() => {
    if (!displayDialogs) return 0;
    return displayDialogs.reduce(
      (total, dialog) => total + (dialog.unreadCount || 0),
      0
    );
  }, [displayDialogs]);

  // Преобразование Web диалогов
  const webDialogs = useMemo(() => {
    if (!webConversations || !Array.isArray(webConversations)) {
      return [];
    }

    return webConversations
      .map((conversation) => {
        // Проверяем, есть ли ассистент для этого диалога
        let hasAssistant = false;
        let assistantEnabled = false;
        let autoReply = false;

        if (channelAssistant && dialogAssistants) {
          // hasAssistant теперь зависит от активации ассистента в канале
          hasAssistant = !!channelAssistant.enabled;

          // Ищем настройки для конкретного диалога
          const dialogAssistant = Array.isArray(dialogAssistants)
            ? dialogAssistants.find(
                (d) => d.dialogId === conversation.externalUserId
              )
            : undefined;

          // Если есть настройки для диалога, используем их, иначе берем настройки канала
          assistantEnabled = dialogAssistant
            ? dialogAssistant.enabled
            : typeof channelAssistant === "object" &&
              channelAssistant !== null &&
              channelAssistant &&
              "enabled" in channelAssistant
            ? (channelAssistant as any).enabled
            : false;
          autoReply = dialogAssistant ? dialogAssistant.autoReply : false;
        }

        // Форматирование времени последнего сообщения
        const date = new Date(
          conversation.lastMessageAt || conversation.startedAt
        );
        const now = new Date();

        let formattedDate: string;
        if (date.toDateString() === now.toDateString()) {
          // Сегодня - показываем только время
          formattedDate = format(date, "HH:mm", { locale: ru });
        } else if (date.getFullYear() === now.getFullYear()) {
          // В этом году - показываем дату без года
          formattedDate = format(date, "d MMM", { locale: ru });
        } else {
          // Другой год - полная дата
          formattedDate = format(date, "d MMM yyyy", { locale: ru });
        }

        // Формируем отображаемые данные
        return {
          id: conversation.id,
          dialogId: conversation.externalUserId || conversation.id.toString(),
          name: `Посетитель ${
            conversation.externalUserId
              ? conversation.externalUserId.substring(0, 8)
              : conversation.id
          }`,
          lastMessageAt: conversation.lastMessageAt || conversation.startedAt,
          timestamp: formattedDate,
          hasAssistant,
          assistantEnabled,
          autoReply,
        };
      })
      .sort((a, b) => {
        // Сортировка по времени последнего сообщения (свежие сверху)
        return (
          new Date(b.lastMessageAt).getTime() -
          new Date(a.lastMessageAt).getTime()
        );
      });
  }, [webConversations, channelAssistant, dialogAssistants]);

  // Фильтрация веб-диалогов по поисковому запросу
  const filteredWebDialogs = webSearchQuery.trim()
    ? webDialogs.filter((d) =>
        d.name.toLowerCase().includes(webSearchQuery.toLowerCase())
      )
    : webDialogs;

  // Отрисовка для канала Avito
  if (channelId && channelType === "avito") {
    return (
      <AvitoDialogsList
        channelId={channelId}
        onSelectDialog={(chatId) => onSelectDialog(chatId, "avito")}
        selectedChatId={selectedDialogId ? selectedDialogId.toString() : null}
      />
    );
  }

  // Отрисовка для веб-канала
  if (channelId && channelType === "web") {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-neutral-200 dark:border-neutral-700 flex gap-2">
          <Input
            placeholder="Поиск чатов..."
            className="flex-1"
            value={webSearchQuery}
            onChange={(e) => setWebSearchQuery(e.target.value)}
          />
          <Button
            size="icon"
            variant="outline"
            onClick={refreshWebData}
            disabled={refreshing || isLoadingWeb}
            className="shrink-0"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing || isLoadingWeb ? "animate-spin" : ""
              }`}
            />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          {isLoadingWeb ? (
            <div className="p-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800"
                >
                  <div className="flex items-center">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="ml-3 flex-1">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredWebDialogs.length > 0 ? (
            <div>
              {filteredWebDialogs.map((dialog) => (
                <div
                  key={dialog.id}
                  onClick={() => onSelectDialog(dialog.dialogId, "web")}
                  className={`px-3 py-2 cursor-pointer flex items-center border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${
                    selectedDialogId === dialog.dialogId
                      ? "bg-neutral-100 dark:bg-neutral-800"
                      : ""
                  }`}
                >
                  <Avatar className="h-10 w-10 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                    <AvatarFallback>
                      <span className="material-icons">language</span>
                    </AvatarFallback>
                  </Avatar>

                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className="text-sm font-medium truncate">
                        {dialog.name}
                      </p>
                      <div className="flex items-center">
                        {dialog.hasAssistant && channelAssistant?.enabled && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation(); // Предотвращаем открытие диалога
                              toggleWebAssistantMutation.mutate({
                                dialogId: dialog.dialogId,
                                autoReply: !dialog.autoReply,
                              });
                            }}
                            className="mr-2 cursor-pointer"
                          >
                            <div
                              className={cn("p-1 rounded", {
                                "bg-emerald-100 dark:bg-emerald-900":
                                  dialog.autoReply,
                                "bg-neutral-100 dark:bg-neutral-800":
                                  !dialog.autoReply,
                              })}
                            >
                              <Bot
                                className={cn("h-4 w-4", {
                                  "text-emerald-500 dark:text-emerald-300":
                                    dialog.autoReply,
                                  "text-neutral-400 dark:text-neutral-500":
                                    !dialog.autoReply,
                                })}
                              />
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                          {dialog.timestamp}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <div className="rounded-full bg-neutral-100 dark:bg-neutral-800 p-3 mb-4">
                <span className="material-icons text-neutral-500 text-3xl">
                  language
                </span>
              </div>
              <h3 className="text-lg font-medium mb-2">Веб-чаты</h3>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-4">
                {webSearchQuery.trim()
                  ? "Не найдено чатов, соответствующих запросу"
                  : "Здесь будут отображаться диалоги с пользователями с вашего веб-сайта"}
              </p>
              {!webSearchQuery.trim() && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshWebData}
                  disabled={refreshing || isLoadingWeb}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${
                      refreshing || isLoadingWeb ? "animate-spin" : ""
                    }`}
                  />
                  Обновить
                </Button>
              )}
            </div>
          )}
        </ScrollArea>
      </div>
    );
  }

  // Если не выбран канал или тип канала не поддерживается
  if (
    !channelId ||
    (channelType !== "vk" && channelType !== "avito" && channelType !== "web")
  ) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <div className="rounded-full bg-neutral-100 dark:bg-neutral-800 p-3 mb-4">
          <span className="material-icons text-neutral-500 text-3xl">chat</span>
        </div>
        <h3 className="text-lg font-medium mb-2">Выберите канал</h3>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
          Выберите канал для просмотра диалогов
        </p>
      </div>
    );
  }

  // Отображение плейсхолдеров при загрузке
  if (isLoadingVk) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-neutral-200 dark:border-neutral-700">
          <Skeleton className="h-9 w-full" />
        </div>

        <ScrollArea className="flex-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800"
            >
              <div className="flex items-center">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="ml-3 flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>
    );
  }

  // Отображение ошибки
  if (vkError) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-neutral-200 dark:border-neutral-700">
          <Input
            placeholder="Поиск диалогов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-red-500 text-center">
            Ошибка при загрузке диалогов.
            <br />
            Проверьте настройки канала VK.
          </p>
        </div>
      </div>
    );
  }

  // Отображение VK диалогов
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
          onClick={refreshVkData}
          disabled={refreshing}
          className="shrink-0"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      <Tabs defaultValue="all" className="flex-1 flex flex-col overflow-y-auto">
        <div className="border-b border-neutral-200 dark:border-neutral-700 px-2 sticky top-0 bg-white dark:bg-neutral-900 z-10">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">
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

        <TabsContent value="all" className="flex-1">
          <ScrollArea className="h-full">
            {filteredVkDialogs.length > 0 ? (
              <div>
                {filteredVkDialogs.map((dialog) => (
                  <div
                    key={dialog.id}
                    onClick={() => onSelectDialog(dialog.peerId, "vk")}
                    className={`px-3 py-2 cursor-pointer flex items-center border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${
                      selectedDialogId === dialog.peerId
                        ? "bg-neutral-100 dark:bg-neutral-800"
                        : ""
                    }`}
                  >
                    <Avatar className="h-10 w-10 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                      {dialog.avatarUrl ? (
                        <AvatarImage src={dialog.avatarUrl} alt={dialog.name} />
                      ) : (
                        <AvatarFallback>
                          <span className="material-icons">person</span>
                        </AvatarFallback>
                      )}
                    </Avatar>

                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <p
                          className={`text-sm font-medium truncate ${
                            dialog.unread
                              ? "text-neutral-900 dark:text-white"
                              : "text-neutral-600 dark:text-neutral-300"
                          }`}
                        >
                          {dialog.name}
                        </p>
                        <div className="flex items-center">
                          {dialog.unread && dialog.unreadCount > 0 && (
                            <div className="mr-2 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs leading-none">
                              {dialog.unreadCount}
                            </div>
                          )}
                          {dialog.hasAssistant && channelAssistant?.enabled && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation(); // Предотвращаем открытие диалога
                                toggleVkAssistantMutation.mutate({
                                  dialogId: dialog.peerId,
                                  autoReply: !dialog.autoReply,
                                });
                              }}
                              className="mr-2 cursor-pointer"
                            >
                              <div
                                className={cn("p-1 rounded", {
                                  "bg-emerald-100 dark:bg-emerald-900":
                                    dialog.autoReply,
                                  "bg-neutral-100 dark:bg-neutral-800":
                                    !dialog.autoReply,
                                })}
                              >
                                <Bot
                                  className={cn("h-4 w-4", {
                                    "text-emerald-500 dark:text-emerald-300":
                                      dialog.autoReply,
                                    "text-neutral-400 dark:text-neutral-500":
                                      !dialog.autoReply,
                                  })}
                                />
                              </div>
                            </div>
                          )}
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                            {dialog.timestamp}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-1">
                        <p
                          className={cn("text-xs truncate max-w-[200px]", {
                            "text-neutral-800 dark:text-neutral-200 fontead font-semibold":
                              dialog.unread,
                            "text-neutral-500 dark:text-neutral-400":
                              !dialog.unread,
                          })}
                        >
                          {dialog.lastMessage}
                        </p>

                        {dialog.unread && dialog.unreadCount > 0 && (
                          <span className="ml-2 min-w-5 px-1.5 py-px bg-primary-500 dark:bg-primary-600 text-white text-xs rounded-full">
                            {dialog.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <div className="rounded-full bg-neutral-100 dark:bg-neutral-800 p-3 mb-4">
                  <span className="material-icons text-neutral-500 text-3xl">
                    chat
                  </span>
                </div>
                <h3 className="text-lg font-medium mb-2">Нет диалогов</h3>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-4">
                  {searchQuery.trim()
                    ? "Не найдено диалогов, соответствующих запросу"
                    : "У вас пока нет сообщений в этом канале"}
                </p>
                {!searchQuery.trim() && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshVkData}
                    disabled={refreshing}
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${
                        refreshing ? "animate-spin" : ""
                      }`}
                    />
                    Обновить
                  </Button>
                )}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="unread" className="flex-1">
          <ScrollArea className="h-full">
            {filteredVkDialogs.filter((d) => d.unread).length > 0 ? (
              <div>
                {filteredVkDialogs
                  .filter((d) => d.unread)
                  .map((dialog) => (
                    <div
                      key={dialog.id}
                      onClick={() => onSelectDialog(dialog.peerId, "vk")}
                      className={`px-3 py-2 cursor-pointer flex items-center border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${
                        selectedDialogId === dialog.peerId
                          ? "bg-neutral-100 dark:bg-neutral-800"
                          : ""
                      }`}
                    >
                      <Avatar className="h-10 w-10">
                        {dialog.avatarUrl ? (
                          <AvatarImage
                            src={dialog.avatarUrl}
                            alt={dialog.name}
                          />
                        ) : (
                          <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                            <span className="material-icons">person</span>
                          </AvatarFallback>
                        )}
                      </Avatar>

                      <div className="ml-3 flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <p className="text-sm font-medium truncate text-neutral-900 dark:text-white">
                            {dialog.name}
                          </p>
                          <div className="flex items-center">
                            {dialog.unread && dialog.unreadCount > 0 && (
                              <div className="mr-2 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs leading-none">
                                {dialog.unreadCount}
                              </div>
                            )}
                            {dialog.hasAssistant &&
                              channelAssistant?.enabled && (
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation(); // Предотвращаем открытие диалога
                                    toggleVkAssistantMutation.mutate({
                                      dialogId: dialog.peerId,
                                      autoReply: !dialog.autoReply,
                                    });
                                  }}
                                  className="mr-2 cursor-pointer"
                                >
                                  <div
                                    className={cn("p-1 rounded", {
                                      "bg-emerald-100 dark:bg-emerald-900":
                                        dialog.autoReply,
                                      "bg-neutral-100 dark:bg-neutral-800":
                                        !dialog.autoReply,
                                    })}
                                  >
                                    <Bot
                                      className={cn("h-4 w-4", {
                                        "text-emerald-500 dark:text-emerald-300":
                                          dialog.autoReply,
                                        "text-neutral-400 dark:text-neutral-500":
                                          !dialog.autoReply,
                                      })}
                                    />
                                  </div>
                                </div>
                              )}
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                              {dialog.timestamp}
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-1">
                          <p
                            className={cn("text-xs truncate max-w-[200px]", {
                              "text-neutral-800 dark:text-neutral-200 fontead font-semibold":
                                dialog.unread,
                              "text-neutral-500 dark:text-neutral-400":
                                !dialog.unread,
                            })}
                          >
                            {dialog.lastMessage}
                          </p>

                          {dialog.unread && dialog.unreadCount > 0 && (
                            <span className="ml-2 min-w-5 px-1.5 py-px bg-primary-500 dark:bg-primary-600 text-white text-xs rounded-full">
                              {dialog.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <div className="rounded-full bg-neutral-100 dark:bg-neutral-800 p-3 mb-4">
                  <span className="material-icons text-neutral-500 text-3xl">
                    mark_email_read
                  </span>
                </div>
                <h3 className="text-lg font-medium mb-2">Нет непрочитанных</h3>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                  У вас нет непрочитанных сообщений
                </p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
