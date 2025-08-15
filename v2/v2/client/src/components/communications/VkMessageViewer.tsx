import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { VkMessage } from "@/types/messages";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Loader2, Send, PaperclipIcon, ThumbsUp, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import MessageTrainingDialog from "./MessageTrainingDialog";

interface VkUser {
  id: number;
  first_name: string;
  last_name: string;
  photo_100?: string;
  // другие поля профиля
}

interface VkMessageViewerProps {
  channelId: number;
  peerId: number | string;
  contactName?: string;
  contactAvatar?: string;
}

export default function VkMessageViewer({
  channelId,
  peerId,
  contactName,
  contactAvatar,
}: VkMessageViewerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageInput, setMessageInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState<string | undefined>(contactName);
  const [userAvatar, setUserAvatar] = useState<string | undefined>(
    contactAvatar
  );
  const [isMessageSending, setIsMessageSending] = useState(false);
  const [isTrainingDialogOpen, setIsTrainingDialogOpen] = useState(false);
  const [trainingMessage, setTrainingMessage] = useState<any>(null);
  const [previousUserMessage, setPreviousUserMessage] = useState<any>(null);
  const [isGoodResponse, setIsGoodResponse] = useState(false);

  // Запрос истории диалога
  const {
    data: messages,
    isLoading,
    error,
    refetch,
  } = useQuery<VkMessage[]>({
    queryKey: [`/api/channels/${channelId}/vk/dialogs/${peerId}/history`],
    enabled: !!channelId && !!peerId,
  });
  // Запрос информации о пользователе
  const { data: userProfile, refetch: refetchProfile } = useQuery<VkUser>({
    queryKey: [`/api/channels/${channelId}/vk/users/${peerId}`],
    enabled: !!channelId && !!peerId,
  });

  // Запрос информации об исправлениях
  const { data: correctionsData } = useQuery<{
    corrections: Array<{
      userQuery: string;
      originalResponse: string;
      correctedResponse: string;
      createdAt: string;
    }>;
  }>({
    queryKey: [`/api/messages/corrections/${channelId}/${peerId}`],
    enabled: !!channelId && !!peerId,
  });

  // Отладочный вывод данных об исправлениях
  useEffect(() => {
    if (correctionsData) {
      // Данные об исправлениях загружены
    }
  }, [correctionsData, channelId, peerId]);

  // Функция для принудительного обновления данных
  const refreshData = async () => {
    if (!channelId || !peerId) return;

    setRefreshing(true);
    try {
      // Очищаем весь кеш исправлений
      queryClient.removeQueries({
        queryKey: [`/api/messages/corrections`],
      });
      await refetch();
      await refetchProfile();

      // Если есть непрочитанные сообщения, отмечаем их как прочитанные
      await apiRequest({
        method: "POST",
        url: `/api/channels/${channelId}/vk/dialogs/${peerId}/mark-as-read`,
      }).catch((err) => {
        console.error("Ошибка при отметке сообщений как прочитанных:", err);
      });

      // Обновляем список диалогов для обновления счетчиков непрочитанных сообщений
      queryClient.invalidateQueries({
        queryKey: [`/api/channels/${channelId}/vk/dialogs`],
      });
    } catch (error) {
      console.error("Ошибка при обновлении сообщений:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Загрузка сообщений при монтировании компонента или при изменении диалога
  useEffect(() => {
    if (!channelId || !peerId) return;

    // Сразу вызываем обновление только при монтировании компонента или смене диалога
    refreshData();

    // Больше не используем интервал для автоматического обновления
  }, [channelId, peerId]);

  // Скролл к последнему сообщению при загрузке сообщений
  useEffect(() => {
    if (messages && messages.length > 0 && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Обновление имени и аватара пользователя при получении данных профиля
  useEffect(() => {
    if (userProfile) {
      const fullName = `${userProfile.first_name} ${
        userProfile.last_name || ""
      }`.trim();
      setUserName(fullName);

      if (userProfile.photo_100) {
        setUserAvatar(userProfile.photo_100);
      }
    }
  }, [userProfile]);

  // Мутация для отправки сообщения
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest({
        method: "POST",
        url: `/api/channels/${channelId}/vk/dialogs/${peerId}/messages`,
        body: {
          message: content,
        },
      });
    },
    onSuccess: () => {
      setMessageInput("");
      // Обновляем историю диалога
      refetch();
      // Инвалидируем кеш списка диалогов, чтобы обновить последнее сообщение
      queryClient.invalidateQueries({
        queryKey: [`/api/channels/${channelId}/vk/dialogs`],
      });

      toast({
        title: "Сообщение отправлено",
      });
    },
    onError: (error) => {
      console.error("Ошибка при отправке сообщения", error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить сообщение",
        variant: "destructive",
      });
    },
  });

  // Прокручиваем в конец при получении новых сообщений
  useEffect(() => {
    if (scrollAreaRef.current) {
      const element = scrollAreaRef.current;
      element.scrollTop = element.scrollHeight;
    }
  }, [messages]);

  // Обработчик отправки сообщения
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || isMessageSending) return;

    setIsMessageSending(true);
    try {
      await apiRequest({
        method: "POST",
        url: `/api/channels/${channelId}/vk/dialogs/${peerId}/messages`,
        body: { message: messageInput },
      });

      setMessageInput("");
      await refetch();

      // Скролл к последнему сообщению после отправки
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector(
          "[data-radix-scroll-area-viewport]"
        );
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    } catch (error) {
      console.error("Ошибка при отправке сообщения:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить сообщение",
        variant: "destructive",
      });
    } finally {
      setIsMessageSending(false);
    }
  };

  // Форматирование времени сообщения
  const formatMessageTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return format(date, "HH:mm", { locale: ru });
  };

  // Функция для получения оптимального размера изображения
  const getOptimalPhotoUrl = (attachment: any) => {
    if (!attachment.photo || !attachment.photo.sizes) {
      // Если есть orig_photo, используем его URL
      if (attachment.photo && attachment.photo.orig_photo) {
        return attachment.photo.orig_photo.url;
      }
      return "";
    }

    // Сортируем размеры по убыванию и берем самый большой, но не больше 800px по ширине
    const sortedSizes = [...attachment.photo.sizes].sort(
      (a, b) => b.width - a.width
    );

    // Сначала ищем размер не больше 800px
    const optimalSize = sortedSizes.find((size) => size.width <= 800);

    // Если нет подходящего размера, берем самый маленький
    return optimalSize
      ? optimalSize.url
      : sortedSizes[sortedSizes.length - 1].url;
  };

  // Функция для поиска предыдущего сообщения пользователя
  const findPreviousUserMessage = (
    allMessages: VkMessage[],
    currentMessageIndex: number
  ): VkMessage | null => {
    // ВК API возвращает сообщения в обратном хронологическом порядке (новые сначала)
    // Поэтому предыдущее сообщение пользователя находится ПОСЛЕ текущего ответа ассистента
    for (let i = currentMessageIndex + 1; i < allMessages.length; i++) {
      if (allMessages[i].fromId > 0) {
        return allMessages[i];
      }
    }
    return null;
  };

  // Функция для проверки, был ли ответ исправлен
  const isResponseCorrected = (
    message: VkMessage,
    previousMessage: VkMessage | null
  ): { isGoodResponse: boolean; isCorrected: boolean } => {
    if (!correctionsData?.corrections || !previousMessage) {
      return { isGoodResponse: false, isCorrected: false };
    }

    let isGoodResponse = false;
    let isCorrected = false;

    correctionsData.corrections.forEach((correction: any) => {
      const queryMatch =
        correction.userQuery?.toLowerCase().trim() ===
        previousMessage.text?.toLowerCase().trim();
      const messageText = message.text?.toLowerCase().trim();

      if (queryMatch) {
        // Проверяем, соответствует ли сообщение оригинальному ответу
        const isOriginalResponse =
          correction.originalResponse?.toLowerCase().trim() === messageText;
        // Проверяем, соответствует ли сообщение исправленному ответу
        const isCorrectedResponse =
          correction.correctedResponse?.toLowerCase().trim() === messageText;

        if (isOriginalResponse || isCorrectedResponse) {
          // Если оригинальный и исправленный ответ одинаковые - это "хороший ответ"
          if (
            correction.originalResponse?.toLowerCase().trim() ===
            correction.correctedResponse?.toLowerCase().trim()
          ) {
            isGoodResponse = true;
          } else {
            // Если разные - это исправление
            isCorrected = true;
          }
        }
      }
    });

    return { isGoodResponse, isCorrected };
  };

  const handleSaveGoodResponse = (msg: VkMessage, idx: number) => {
    setTrainingMessage({
      id: msg.id,
      content: msg.text,
      conversationId: peerId,
    });

    // Получаем индекс в оригинальном массиве
    const originalIndex = (messages?.length || 0) - 1 - idx;
    const prev = findPreviousUserMessage(messages || [], originalIndex);
    setPreviousUserMessage(prev ? { content: prev.text } : null);
    setIsGoodResponse(true);
    setIsTrainingDialogOpen(true);
  };

  const handleEditMessage = (msg: VkMessage, idx: number) => {
    // ОТЛАДОЧНЫЕ ЛОГИ
    console.log("=== ОТЛАДКА ПОИСКА ПРЕДЫДУЩЕГО СООБЩЕНИЯ ===");
    console.log("Редактируемое сообщение:", msg.text);
    console.log("idx в обратном массиве:", idx);
    console.log("Длина массива messages:", messages?.length);

    // Получаем индекс в оригинальном массиве
    const originalIndex = (messages?.length || 0) - 1 - idx;
    console.log("originalIndex в оригинальном массиве:", originalIndex);

    if (messages) {
      console.log("Сообщение на originalIndex:", messages[originalIndex]?.text);
      console.log("Все сообщения (порядок как в БД):");
      messages.forEach((m, i) => {
        console.log(
          `  ${i}: ${m.fromId > 0 ? "USER" : "ASSISTANT"} - "${m.text}"`
        );
      });
    }

    const prev = findPreviousUserMessage(messages || [], originalIndex);
    console.log("Найденное предыдущее сообщение пользователя:", prev?.text);
    console.log("=== КОНЕЦ ОТЛАДКИ ===");

    setTrainingMessage({
      id: msg.id,
      content: msg.text,
      conversationId: peerId,
    });

    setPreviousUserMessage(prev ? { content: prev.text } : null);
    setIsGoodResponse(false);
    setIsTrainingDialogOpen(true);
  };

  // Для корректного индекса — реверсируем массив заранее
  const reversedMessages = messages ? [...messages].reverse() : [];

  // Плейсхолдер при загрузке
  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b px-4 py-3 flex items-center">
          <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-700 animate-pulse"></div>
          <div className="ml-3 h-5 w-32 bg-neutral-200 dark:bg-neutral-700 animate-pulse rounded"></div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start">
                <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-700 animate-pulse mr-3"></div>
                <div className="bg-neutral-200 dark:bg-neutral-700 animate-pulse rounded-lg p-3 max-w-[80%]">
                  <div className="h-4 w-48 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t p-3">
          <div className="h-10 w-full bg-neutral-200 dark:bg-neutral-700 animate-pulse rounded"></div>
        </div>
      </div>
    );
  }

  // Отображение ошибки
  if (error) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b px-4 py-3">
          <h3 className="font-medium">Ошибка загрузки</h3>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-4">
            <p className="text-red-500 mb-2">
              Не удалось загрузить историю сообщений
            </p>
            <Button onClick={() => refetch()}>Повторить</Button>
          </div>
        </div>
      </div>
    );
  }

  // Состояние отправки сообщения
  const isSending = sendMessageMutation.isPending;

  return (
    <div className="flex flex-col h-full">
      {/* Заголовок чата */}
      <div className="border-b px-4 py-3 flex items-center">
        <Avatar className="h-8 w-8">
          {userAvatar ? (
            <AvatarImage
              src={userAvatar}
              alt={userName || `Собеседник ${peerId}`}
            />
          ) : (
            <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
              <span className="material-icons text-sm">person</span>
            </AvatarFallback>
          )}
        </Avatar>
        <h3 className="ml-3 font-medium">
          {userName || `Собеседник ${peerId}`}
        </h3>
      </div>

      {/* Область сообщений */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {loadingMore && (
          <div className="flex justify-center mb-4">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
          </div>
        )}

        {messages && Array.isArray(messages) && messages.length > 0 ? (
          <div className="space-y-4">
            {reversedMessages.map((message: VkMessage, idx: number) => {
              const isAssistant = message.fromId < 0;
              const isFromMe = isAssistant;

              // Получаем индекс в оригинальном массиве
              const originalIndex = (messages?.length || 0) - 1 - idx;

              // Определяем, был ли ответ исправлен
              const { isGoodResponse, isCorrected } = isResponseCorrected(
                message,
                findPreviousUserMessage(messages || [], originalIndex)
              );

              return (
                <div
                  key={`message-${message.id}-${message.date}-${message.fromId}-${idx}`}
                  className={`flex items-start ${
                    isFromMe ? "justify-end" : ""
                  }`}
                >
                  {!isFromMe && (
                    <Avatar className="h-8 w-8 mr-3">
                      {userAvatar ? (
                        <AvatarImage
                          src={userAvatar}
                          alt={userName || `Собеседник ${peerId}`}
                        />
                      ) : (
                        <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                          <span className="material-icons text-sm">person</span>
                        </AvatarFallback>
                      )}
                    </Avatar>
                  )}

                  <div
                    className={`rounded-lg p-3 max-w-[80%] ${
                      isFromMe
                        ? "bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.text || "[вложение]"}
                    </p>

                    {/* Отображение вложенных изображений */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.attachments
                          .map((attachment: any, attachmentIdx: number) => {
                            if (
                              attachment.type === "photo" &&
                              attachment.photo
                            ) {
                              const photoUrl = getOptimalPhotoUrl(attachment);
                              return (
                                <Dialog
                                  key={`${
                                    message.id
                                  }-attachment-${attachmentIdx}-${
                                    attachment.photo.id || attachmentIdx
                                  }`}
                                >
                                  <DialogTrigger>
                                    <img
                                      src={photoUrl}
                                      alt="Вложенное изображение"
                                      className="max-w-full h-auto rounded"
                                      loading="lazy"
                                    />
                                  </DialogTrigger>
                                  <DialogContent className="max-w-[800px]">
                                    <img
                                      src={photoUrl}
                                      alt="Вложенное изображение"
                                      className="max-w-full h-auto rounded"
                                      loading="lazy"
                                    />
                                  </DialogContent>
                                </Dialog>
                              );
                            }
                            return null;
                          })
                          .filter(Boolean)}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {formatMessageTime(message.date)}
                      </span>
                      {isAssistant && (
                        <span className="flex gap-1 ml-2">
                          <button
                            className={`p-1 rounded ${
                              isGoodResponse
                                ? "bg-green-100"
                                : "hover:bg-neutral-200"
                            }`}
                            title="Хороший ответ"
                            onClick={() => handleSaveGoodResponse(message, idx)}
                          >
                            <ThumbsUp
                              className={`h-4 w-4 ${
                                isGoodResponse
                                  ? "text-green-700"
                                  : "text-green-500"
                              }`}
                            />
                          </button>
                          <button
                            className={`p-1 rounded ${
                              isCorrected
                                ? "bg-blue-100"
                                : "hover:bg-neutral-200"
                            }`}
                            title="Изменить ответ"
                            onClick={() => handleEditMessage(message, idx)}
                          >
                            <Edit
                              className={`h-4 w-4 ${
                                isCorrected ? "text-blue-700" : "text-blue-500"
                              }`}
                            />
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">
              Нет сообщений в этом диалоге
            </p>
          </div>
        )}
      </ScrollArea>

      {/* Поле ввода сообщения */}
      <Separator className="mb-0" />
      <form onSubmit={handleSendMessage} className="p-3 flex items-center">
        <Input
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Введите сообщение..."
          className="flex-1 mr-2"
          disabled={isSending}
        />
        <Button type="submit" disabled={isSending || !messageInput.trim()}>
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>

      <MessageTrainingDialog
        open={isTrainingDialogOpen}
        onOpenChange={setIsTrainingDialogOpen}
        message={trainingMessage}
        previousUserMessage={previousUserMessage}
        assistantName={userName || "Ассистент"}
        onSuccess={refreshData}
        isGoodResponse={isGoodResponse}
        channelId={channelId}
        correctionsData={correctionsData}
      />
    </div>
  );
}
