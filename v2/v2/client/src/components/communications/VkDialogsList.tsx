import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VkConversation, VkDialogDisplay } from "@/types/messages";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface VkDialogsListProps {
  channelId: number;
  onSelectDialog: (peerId: number) => void;
  selectedPeerId: number | null;
}

export default function VkDialogsList({
  channelId,
  onSelectDialog,
  selectedPeerId,
}: VkDialogsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [displayDialogs, setDisplayDialogs] = useState<VkDialogDisplay[]>([]);

  // Запрос диалогов VK
  const {
    data: vkDialogs,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [`/api/channels/${channelId}/vk/dialogs`],
    enabled: !!channelId,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Subscribe to message read events
  useEffect(() => {
    if (selectedPeerId && vkDialogs && Array.isArray(vkDialogs)) {
      const dialog = vkDialogs.find(
        (d) => d.lastMessage.peerId === selectedPeerId
      );
      if (dialog && dialog.unreadCount && dialog.unreadCount > 0) {
        refetch();
      }
    }
  }, [selectedPeerId, vkDialogs, refetch]);

  // Преобразование VK диалогов в формат для отображения
  useEffect(() => {
    if (vkDialogs && Array.isArray(vkDialogs)) {
      const formattedDialogs: VkDialogDisplay[] = vkDialogs.map(
        (dialog: VkConversation) => {
          const date = new Date(dialog.lastMessage.date * 1000);
          const now = new Date();

          // Правильно получаем количество непрочитанных сообщений
          const unreadCount = dialog.unreadCount || 0;
          const unread = unreadCount > 0;

          // Определяем формат времени/даты
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

          return {
            id: dialog.id,
            peerId: dialog.lastMessage.peerId,
            fromId: dialog.lastMessage.fromId,
            name: `Собеседник ${dialog.lastMessage.peerId}`, // Заглушка, обычно здесь будет имя из профиля VK
            lastMessage: dialog.lastMessage.text || "[вложение]",
            timestamp: formattedDate,
            unread: dialog.unreadCount !== undefined && dialog.unreadCount > 0,
            unreadCount: dialog.unreadCount || 0,
            avatarUrl: undefined, // Заглушка, здесь будет URL аватара
          };
        }
      );

      setDisplayDialogs(formattedDialogs);
    }
  }, [vkDialogs]);

  // Фильтрация бесед по поисковому запросу
  const filteredDialogs = searchQuery.trim()
    ? displayDialogs.filter(
        (d) =>
          d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : displayDialogs;

  // Отображение плейсхолдеров при загрузке
  if (isLoading) {
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
  if (error) {
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

  // Подсчет общего количества непрочитанных сообщений
  const totalUnreadCount = displayDialogs.reduce(
    (sum, dialog) => sum + dialog.unreadCount,
    0
  );

  // Подсчет количества непрочитанных диалогов
  const unreadDialogsCount = displayDialogs.filter((d) => d.unread).length;

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

      <Tabs defaultValue="all" className="flex-1 flex flex-col">
        <div className="border-b border-neutral-200 dark:border-neutral-700 px-2">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1 relative">
              Все
              {totalUnreadCount > 0 && (
                <span className="ml-1 min-w-5 h-5 px-1.5 py-px bg-primary-500 text-white text-xs font-medium rounded-full inline-flex items-center justify-center">
                  {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1 relative">
              Непрочитанные
              {unreadDialogsCount > 0 && (
                <span className="ml-1 min-w-5 h-5 px-1.5 py-px bg-primary-500 text-white text-xs font-medium rounded-full inline-flex items-center justify-center">
                  {unreadDialogsCount > 99 ? "99+" : unreadDialogsCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="flex-1">
          <ScrollArea className="h-full">
            {filteredDialogs.length > 0 ? (
              <div>
                {filteredDialogs.map((dialog) => (
                  <div
                    key={dialog.id}
                    onClick={() => onSelectDialog(dialog.peerId)}
                    className={`px-3 py-2 cursor-pointer flex items-center border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${
                      selectedPeerId === dialog.peerId
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
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 ml-2 whitespace-nowrap">
                          {dialog.timestamp}
                        </p>
                      </div>

                      <div className="flex justify-between items-center mt-1">
                        <p
                          className={`text-xs truncate ${
                            dialog.unread
                              ? "text-neutral-800 dark:text-neutral-200 font-medium"
                              : "text-neutral-500 dark:text-neutral-400"
                          }`}
                        >
                          {dialog.lastMessage}
                        </p>

                        {dialog.unread &&
                          (dialog.unreadCount > 0 ? (
                            <span className="ml-2 min-w-5 px-1.5 py-px bg-primary-500 text-white text-xs font-medium rounded-full flex-shrink-0 flex items-center justify-center">
                              {dialog.unreadCount > 99
                                ? "99+"
                                : dialog.unreadCount}
                            </span>
                          ) : (
                            <span className="ml-2 h-2 w-2 bg-primary-500 rounded-full flex-shrink-0"></span>
                          ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {searchQuery.trim()
                    ? "Диалоги не найдены"
                    : "Нет доступных диалогов"}
                </p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="unread" className="flex-1">
          <ScrollArea className="h-full">
            {filteredDialogs.filter((d) => d.unread).length > 0 ? (
              <div>
                {filteredDialogs
                  .filter((d) => d.unread)
                  .map((dialog) => (
                    <div
                      key={dialog.id}
                      onClick={() => onSelectDialog(dialog.peerId)}
                      className={`px-3 py-2 cursor-pointer flex items-center border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${
                        selectedPeerId === dialog.peerId
                          ? "bg-neutral-100 dark:bg-neutral-800"
                          : ""
                      }`}
                    >
                      <Avatar className="h-10 w-10 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                        {dialog.avatarUrl ? (
                          <AvatarImage
                            src={dialog.avatarUrl}
                            alt={dialog.name}
                          />
                        ) : (
                          <AvatarFallback>
                            <span className="material-icons">person</span>
                          </AvatarFallback>
                        )}
                      </Avatar>

                      <div className="ml-3 flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <p className="text-sm font-medium truncate text-neutral-900 dark:text-white">
                            {dialog.name}
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 ml-2 whitespace-nowrap">
                            {dialog.timestamp}
                          </p>
                        </div>

                        <div className="flex justify-between items-center mt-1">
                          <p className="text-xs truncate text-neutral-800 dark:text-neutral-200 font-medium">
                            {dialog.lastMessage}
                          </p>
                          {dialog.unreadCount > 0 ? (
                            <span className="ml-2 min-w-5 px-1.5 py-px bg-primary-500 text-white text-xs font-medium rounded-full flex-shrink-0 flex items-center justify-center">
                              {dialog.unreadCount > 99
                                ? "99+"
                                : dialog.unreadCount}
                            </span>
                          ) : (
                            <span className="ml-2 h-2 w-2 bg-primary-500 rounded-full flex-shrink-0"></span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="p-4 text-center">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Нет непрочитанных диалогов
                </p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
