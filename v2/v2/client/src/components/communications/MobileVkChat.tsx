import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Send,
  RefreshCw,
  Loader2,
  PaperclipIcon,
  ThumbsUp,
  Edit,
} from "lucide-react";
import { VkMessage } from "@/types/messages";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import MessageTrainingDialog from "./MessageTrainingDialog";

interface VkUser {
  id: number;
  first_name: string;
  last_name: string;
  photo_100?: string;
}

interface MobileVkChatProps {
  channelId: number;
  peerId: number | string;
  isVisible: boolean;
  onClose: () => void;
  contactName?: string;
  contactAvatar?: string;
}

export default function MobileVkChat({
  channelId,
  peerId,
  isVisible,
  onClose,
  contactName,
  contactAvatar,
}: MobileVkChatProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageInput, setMessageInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isMessageSending, setIsMessageSending] = useState(false);
  const [userName, setUserName] = useState<string | undefined>(contactName);
  const [userAvatar, setUserAvatar] = useState<string | undefined>(
    contactAvatar
  );

  // Добавляем состояния для функционала тренировки
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
    enabled: !!channelId && !!peerId && isVisible,
    refetchInterval: 10000, // Обновляем каждые 10 секунд
  });

  // Запрос информации о пользователе, если нет имени и аватара
  const { data: userProfile, refetch: refetchProfile } = useQuery<VkUser>({
    queryKey: [`/api/channels/${channelId}/vk/users/${peerId}`],
    enabled:
      !!channelId && !!peerId && (!contactName || !contactAvatar) && isVisible,
  });

  // Обновляем имя и аватар пользователя при получении данных профиля
  useEffect(() => {
    if (userProfile) {
      if (!userName) {
        setUserName(`${userProfile.first_name} ${userProfile.last_name}`);
      }
      if (!userAvatar && userProfile.photo_100) {
        setUserAvatar(userProfile.photo_100);
      }
    }
  }, [userProfile, userName, userAvatar]);

  // Мутация для отправки сообщения
  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      return await apiRequest({
        method: "POST",
        url: `/api/channels/${channelId}/vk/dialogs/${peerId}/messages`,
        body: { message: text },
      });
    },
    onSuccess: () => {
      // При успешной отправке обновляем историю сообщений
      queryClient.invalidateQueries({
        queryKey: [`/api/channels/${channelId}/vk/dialogs/${peerId}/history`],
      });
    },
    onError: (error: Error) => {
      console.error("Ошибка при отправке сообщения:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить сообщение",
        variant: "destructive",
      });
    },
  });

  // Обработчик отправки сообщения
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || isMessageSending) return;

    setIsMessageSending(true);
    try {
      await sendMessageMutation.mutateAsync(messageInput);
      setMessageInput("");
    } catch (error) {
      console.error("Ошибка при отправке сообщения:", error);
    } finally {
      setIsMessageSending(false);
    }
  };

  // Прокрутка в конец списка сообщений при получении новых данных
  useEffect(() => {
    if (messages?.length && isVisible) {
      const scrollContainer = document.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isVisible]);

  // Функция для обновления истории сообщений
  const refreshMessages = async () => {
    setRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Обновлено",
        description: "История сообщений обновлена",
      });
    } catch (error) {
      console.error("Ошибка при обновлении сообщений:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить историю сообщений",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
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

  // Добавляем запрос информации об исправлениях
  const { data: correctionsData } = useQuery<{
    corrections: Array<{
      userQuery: string;
      originalResponse: string;
      correctedResponse: string;
      createdAt: string;
    }>;
  }>({
    queryKey: [`/api/messages/corrections/${channelId}/${peerId}`],
    enabled: !!channelId && !!peerId && isVisible,
  });

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
        const isOriginalResponse =
          correction.originalResponse?.toLowerCase().trim() === messageText;
        const isCorrectedResponse =
          correction.correctedResponse?.toLowerCase().trim() === messageText;

        if (isOriginalResponse || isCorrectedResponse) {
          if (
            correction.originalResponse?.toLowerCase().trim() ===
            correction.correctedResponse?.toLowerCase().trim()
          ) {
            isGoodResponse = true;
          } else {
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
    console.log("=== МОБИЛЬНАЯ ОТЛАДКА ПОИСКА ПРЕДЫДУЩЕГО СООБЩЕНИЯ ===");
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
    console.log("=== КОНЕЦ МОБИЛЬНОЙ ОТЛАДКИ ===");

    setTrainingMessage({
      id: msg.id,
      content: msg.text,
      conversationId: peerId,
    });

    setPreviousUserMessage(prev ? { content: prev.text } : null);
    setIsGoodResponse(false);
    setIsTrainingDialogOpen(true);
  };

  // Функция для принудительного обновления данных
  const refreshData = async () => {
    if (!channelId || !peerId) return;

    setRefreshing(true);
    try {
      await refetch();
      await refetchProfile();

      // Обновляем информацию об исправлениях
      queryClient.invalidateQueries({
        queryKey: [`/api/messages/corrections/${channelId}/${peerId}`],
      });

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

  // Заглушка при загрузке
  if (isLoading) {
    return (
      <div
        className={`fixed inset-0 bg-white dark:bg-neutral-900 z-50 flex flex-col h-full transform transition-transform duration-300 ease-in-out ${
          isVisible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-3 border-b border-neutral-200 dark:border-neutral-700 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Skeleton className="h-8 w-8 rounded-full mr-3" />
          <Skeleton className="h-5 w-48" />
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`flex ${
                  i % 2 === 0 ? "justify-end" : "justify-start"
                }`}
              >
                <Skeleton
                  className={`h-10 w-52 rounded-lg ${
                    i % 2 === 0 ? "rounded-tr-none" : "rounded-tl-none"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-neutral-200 dark:border-neutral-700 p-3">
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 bg-white dark:bg-neutral-900 z-50 flex flex-col h-full transform transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Заголовок с именем собеседника и кнопкой возврата */}
      <div className="p-3 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-8 w-8 mr-2">
            {userAvatar ? (
              <AvatarImage
                src={userAvatar}
                alt={userName || `Собеседник ${peerId}`}
              />
            ) : (
              <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                <span className="text-sm">{userName?.charAt(0) || "В"}</span>
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <h3 className="font-medium text-sm">
              {userName || `Собеседник ${peerId}`}
            </h3>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={refreshMessages}
          disabled={refreshing}
          className="shrink-0"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
        </Button>
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
            {[...messages].reverse().map((message: VkMessage, idx: number) => {
              const isFromMe = message.fromId < 0; // сообщения от группы имеют отрицательный fromId

              // Получаем индекс в оригинальном массиве
              const originalIndex = (messages?.length || 0) - 1 - idx;

              // Определяем, был ли ответ исправлен
              const { isGoodResponse, isCorrected } = isResponseCorrected(
                message,
                findPreviousUserMessage(messages || [], originalIndex)
              );

              return (
                <div
                  key={message.id + "mobile"}
                  className={`flex items-start ${
                    isFromMe ? "justify-end" : ""
                  }`}
                >
                  {!isFromMe && (
                    <Avatar className="h-8 w-8 mr-3 shrink-0">
                      {userAvatar ? (
                        <AvatarImage
                          src={userAvatar}
                          alt={userName || `Собеседник ${peerId}`}
                        />
                      ) : (
                        <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                          <span className="text-sm">
                            {userName?.charAt(0) || "В"}
                          </span>
                        </AvatarFallback>
                      )}
                    </Avatar>
                  )}

                  <div
                    className={`rounded-lg p-3 max-w-[75%] ${
                      isFromMe
                        ? "bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100 rounded-tr-none"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-tl-none"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.text || "Вложение"}
                    </p>

                    {/* Отображение вложенных изображений */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.attachments.map(
                          (attachment: any, attachmentIdx: number) => {
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
                          }
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {formatMessageTime(message.date)}
                      </span>
                      {isFromMe && (
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
                              className={`h-3 w-3 ${
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
                              className={`h-3 w-3 ${
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
      <form
        onSubmit={handleSendMessage}
        className="border-t border-neutral-200 dark:border-neutral-700 p-3 flex items-center space-x-2"
      >
        <Input
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Введите сообщение..."
          className="flex-1"
          disabled={isMessageSending}
        />
        <Button
          type="submit"
          size="icon"
          disabled={isMessageSending || !messageInput.trim()}
        >
          {isMessageSending ? (
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
