import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LoaderCircle,
  Send,
  RefreshCw,
  PaperclipIcon,
  ThumbsUp,
  Edit,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import MessageTrainingDialog from "./MessageTrainingDialog";

// Интерфейс для информации о товаре
interface ArticleInfo {
  title: string;
  price: string;
  url: string;
  image?: string;
}

// Интерфейс для сообщений Авито
interface AvitoMessage {
  id: string;
  date: number; // timestamp
  text: string;
  out: number;
  read: boolean;
  attachments?: Array<{
    type: string;
    content: string;
  }>;
}

// Интерфейс для полной информации о диалоге
interface AvitoFullDialog {
  articleInfo: ArticleInfo;
  messages: AvitoMessage[];
  clientName?: string; // Имя клиента/собеседника, если доступно
}

// Интерфейс для отображения сообщения
interface MessageDisplay extends AvitoMessage {
  formattedDate: string;
}

interface AvitoChatInterfaceProps {
  channelId: number;
  chatId: string;
}

export default function AvitoChatInterface({
  channelId,
  chatId,
}: AvitoChatInterfaceProps) {
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Добавляем состояния для функционала тренировки
  const [isTrainingDialogOpen, setIsTrainingDialogOpen] = useState(false);
  const [trainingMessage, setTrainingMessage] = useState<any>(null);
  const [previousUserMessage, setPreviousUserMessage] = useState<any>(null);
  const [isGoodResponse, setIsGoodResponse] = useState(false);

  // Запрос на получение полной информации о диалоге
  const {
    data: fullDialog,
    isLoading,
    refetch,
  } = useQuery<AvitoFullDialog>({
    queryKey: [`/api/channels/${channelId}/avito/dialogs/${chatId}/full`],
    enabled: !!channelId && !!chatId,
    refetchInterval: 30000, // Автоматически обновлять каждые 10 секунд
  });
  console.log("Полный диалог", fullDialog);

  // Добавляем запрос информации об исправлениях
  const { data: correctionsData } = useQuery<{
    corrections: Array<{
      userQuery: string;
      originalResponse: string;
      correctedResponse: string;
      createdAt: string;
    }>;
  }>({
    queryKey: [`/api/messages/corrections/${channelId}/${chatId}`],
    enabled: !!channelId && !!chatId,
  });

  // Извлекаем сообщения из полного диалога
  const messages = fullDialog?.messages || [];

  // Извлекаем информацию о товаре
  const articleInfo = fullDialog?.articleInfo;

  // Мутация для отправки сообщения
  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      return await apiRequest({
        url: `/api/channels/${channelId}/avito/dialogs/${chatId}/messages`,
        method: "POST",
        body: { message: text }, // API ожидает параметр 'message', а не 'text'
      });
    },
    onSuccess: () => {
      // При успешной отправке обновляем полную информацию о диалоге
      queryClient.invalidateQueries({
        queryKey: [`/api/channels/${channelId}/avito/dialogs/${chatId}/full`],
      });

      // Обновляем также список диалогов, чтобы отразить последнее сообщение
      queryClient.invalidateQueries({
        queryKey: [`/api/channels/${channelId}/avito/dialogs`],
      });
    },
    onError: (error: Error) => {
      console.error("Ошибка при отправке сообщения", error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить сообщение",
        variant: "destructive",
      });
    },
  });

  // Имя собеседника из пропсов или из данных диалога, если доступно
  const actualContactName = fullDialog?.clientName || "Собеседник";

  // Преобразование сообщений для отображения
  const formattedMessages: MessageDisplay[] = messages
    ? messages
        .map((message) => {
          const date = new Date(message.date * 1000);

          // Форматирование даты/времени
          let formattedDate: string;
          const now = new Date();

          if (date.toDateString() === now.toDateString()) {
            // Сегодня - показываем только время
            formattedDate = format(date, "HH:mm", { locale: ru });
          } else if (
            Math.abs(now.getTime() - date.getTime()) <
            7 * 24 * 60 * 60 * 1000
          ) {
            // Меньше недели назад - показываем день недели и время
            formattedDate = format(date, "EEEE, HH:mm", { locale: ru });
          } else {
            // Более старые сообщения - показываем полную дату и время
            formattedDate = format(date, "d MMM yyyy, HH:mm", { locale: ru });
          }

          return {
            ...message,
            formattedDate,
          };
        })
        .reverse() // Переворачиваем массив, чтобы новые сообщения были внизу
    : [];

  // Прокрутка вниз при получении новых сообщений
  useEffect(() => {
    if (
      messagesEndRef.current &&
      formattedMessages.length > 0 &&
      !hasScrolledToBottom
    ) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      setHasScrolledToBottom(true);
    }
  }, [formattedMessages, hasScrolledToBottom]);

  // Обработчик отправки сообщения
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageText.trim()) return;

    setIsSending(true);
    try {
      await sendMessageMutation.mutateAsync(messageText);
      setMessageText(""); // Очищаем поле ввода после отправки
    } catch (error) {
      console.error("Ошибка при отправке сообщения", error);
    } finally {
      setIsSending(false);
    }
  };

  // Функция для обновления списка сообщений
  const refreshMessages = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error("Ошибка при обновлении сообщений", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить сообщения",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Функция для поиска предыдущего сообщения пользователя
  const findPreviousUserMessage = (
    allMessages: AvitoMessage[],
    currentIndex: number
  ): AvitoMessage | null => {
    // Ищем предыдущее сообщение пользователя в оригинальном массиве
    // Идем назад от текущего индекса
    for (let i = currentIndex + 1; i < allMessages.length; i++) {
      if (allMessages[i].out === 0) return allMessages[i]; // Сообщения пользователя имеют out === 0
    }
    return null;
  };

  // Функция для проверки, был ли ответ исправлен
  const isResponseCorrected = (
    message: AvitoMessage,
    previousMessage: AvitoMessage | null
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

  const handleSaveGoodResponse = (msg: AvitoMessage, idx: number) => {
    setTrainingMessage({
      id: msg.id,
      content: msg.text,
      conversationId: chatId,
    });

    // Получаем индекс в оригинальном массиве и ищем предыдущее сообщение
    const originalIndex = (fullDialog?.messages?.length || 0) - 1 - idx;
    const prev = findPreviousUserMessage(
      fullDialog?.messages || [],
      originalIndex
    );
    setPreviousUserMessage(prev ? { content: prev.text } : null);
    setIsGoodResponse(true);
    setIsTrainingDialogOpen(true);
  };

  const handleEditMessage = (msg: AvitoMessage, idx: number) => {
    setTrainingMessage({
      id: msg.id,
      content: msg.text,
      conversationId: chatId,
    });

    // Получаем индекс в оригинальном массиве и ищем предыдущее сообщение
    const originalIndex = (fullDialog?.messages?.length || 0) - 1 - idx;
    const prev = findPreviousUserMessage(
      fullDialog?.messages || [],
      originalIndex
    );
    setPreviousUserMessage(prev ? { content: prev.text } : null);
    setIsGoodResponse(false);
    setIsTrainingDialogOpen(true);
  };

  // Функция для принудительного обновления данных
  const refreshData = async () => {
    if (!channelId || !chatId) return;

    setIsRefreshing(true);
    try {
      await refetch();

      // Обновляем информацию об исправлениях
      queryClient.invalidateQueries({
        queryKey: [`/api/messages/corrections/${channelId}/${chatId}`],
      });

      // Обновляем список диалогов
      queryClient.invalidateQueries({
        queryKey: [`/api/channels/${channelId}/avito/dialogs`],
      });
    } catch (error) {
      console.error("Ошибка при обновлении сообщений:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Заглушка при загрузке
  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-neutral-200 dark:border-neutral-700 flex items-center">
          <Skeleton className="h-10 w-10 rounded-full mr-3" />
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

  return (
    <div className="flex flex-col h-full">
      {/* Заголовок с именем собеседника */}
      <div className="p-3 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
        <div className="flex items-center">
          <Avatar className="mr-2">
            <AvatarFallback>{actualContactName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-sm font-medium">{actualContactName}</h3>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={refreshMessages}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      {/* Информация о товаре */}
      {articleInfo && (
        <div className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-700 flex items-center">
          {articleInfo.image && (
            <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 mr-3">
              <img
                src={articleInfo.image}
                alt={articleInfo.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <a
              href={articleInfo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium hover:underline text-primary-600 dark:text-primary-400 truncate block"
            >
              {articleInfo.title}
            </a>
            {articleInfo.price && (
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                {articleInfo.price}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Область сообщений */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {formattedMessages.length === 0 ? (
            <div className="text-center py-10 text-neutral-500">
              <p>Нет сообщений</p>
            </div>
          ) : (
            formattedMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.out !== 0 ? "justify-end" : "justify-start"
                }`}
              >
                {/* Avatar for incoming messages */}
                {message.out === 0 && (
                  <Avatar className="mr-2 h-8 w-8">
                    <AvatarFallback>
                      {actualContactName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`
                    max-w-[75%] rounded-lg px-3 py-2 
                    ${
                      message.out === 0
                        ? "bg-blue-600 text-white rounded-tr-none shadow-sm"
                        : "bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-gray-100 rounded-tl-none shadow-sm"
                    }
                  `}
                >
                  {/* Текст сообщения */}
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.text}
                  </p>

                  {/* Вложения (если есть) */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.attachments.map((attachment, index) => (
                        <div key={index} className="text-sm">
                          {attachment.type === "photo" &&
                            attachment.content && (
                              <Dialog>
                                <DialogTrigger>
                                  <img
                                    src={attachment.content}
                                    alt="Вложение"
                                    className="max-w-full rounded"
                                  />
                                </DialogTrigger>
                                <DialogContent className="max-w-[800px]">
                                  <img
                                    src={attachment.content}
                                    alt="Вложение"
                                    className="max-w-full rounded"
                                  />
                                </DialogContent>
                              </Dialog>
                            )}

                          {attachment.type === "doc" && attachment.content && (
                            <a
                              href={attachment.content}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`
                                flex items-center p-2 rounded
                                ${
                                  message.out === 0
                                    ? "bg-blue-600 hover:bg-blue-700"
                                    : "bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600"
                                }
                              `}
                            >
                              <PaperclipIcon className="h-4 w-4 mr-2" />
                              <span className="truncate">{"Документ"}</span>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Время отправки и статус */}
                  <div
                    className={`
                    text-xs mt-1 flex items-center justify-between
                    ${message.out === 0 ? "text-blue-100" : "text-neutral-500"}
                  `}
                  >
                    <span>{message.formattedDate}</span>
                    <div className="flex items-center">
                      {message.out !== 0 && (
                        <span className="mr-2">
                          {message.read ? "✓✓" : "✓"}
                        </span>
                      )}
                      {message.out !== 0 &&
                        (() => {
                          const idx = formattedMessages.findIndex(
                            (m) => m.id === message.id
                          );

                          // Получаем индекс в оригинальном массиве для поиска предыдущего сообщения
                          const originalIndex =
                            (fullDialog?.messages?.length || 0) - 1 - idx;

                          const { isGoodResponse, isCorrected } =
                            isResponseCorrected(
                              message,
                              findPreviousUserMessage(
                                fullDialog?.messages || [],
                                originalIndex
                              )
                            );

                          return (
                            <span className="flex gap-1">
                              <button
                                className={`p-1 rounded ${
                                  isGoodResponse
                                    ? "bg-green-200"
                                    : "hover:bg-neutral-200"
                                }`}
                                title="Хороший ответ"
                                onClick={() =>
                                  handleSaveGoodResponse(message, idx)
                                }
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
                                    ? "bg-blue-200"
                                    : "hover:bg-neutral-200"
                                }`}
                                title="Изменить ответ"
                                onClick={() => handleEditMessage(message, idx)}
                              >
                                <Edit
                                  className={`h-3 w-3 ${
                                    isCorrected
                                      ? "text-blue-700"
                                      : "text-blue-500"
                                  }`}
                                />
                              </button>
                            </span>
                          );
                        })()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          {/* Элемент для прокрутки в конец списка */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Форма отправки сообщения */}
      <form
        onSubmit={handleSendMessage}
        className="border-t border-neutral-200 dark:border-neutral-700 p-3 flex items-center space-x-2"
      >
        <Input
          type="text"
          placeholder="Введите сообщение..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          disabled={isSending}
          className="flex-1"
        />
        <Button
          type="submit"
          size="icon"
          disabled={isSending || !messageText.trim()}
        >
          {isSending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
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
        assistantName={actualContactName || "Ассистент"}
        onSuccess={refreshData}
        isGoodResponse={isGoodResponse}
        channelId={channelId}
      />
    </div>
  );
}
