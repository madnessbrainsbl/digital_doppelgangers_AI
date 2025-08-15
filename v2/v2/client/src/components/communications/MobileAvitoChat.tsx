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
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Send,
  RefreshCw,
  LoaderCircle,
  Image,
  ThumbsUp,
  Edit,
} from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import MessageTrainingDialog from "./MessageTrainingDialog";

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

// Информация об объявлении
interface ArticleInfo {
  title: string;
  price?: string;
  url: string;
  image?: string;
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

interface MobileAvitoChatProps {
  channelId: number;
  chatId: string;
  isVisible: boolean;
  onClose: () => void;
  contactName?: string;
  contactAvatar?: string;
}

export default function MobileAvitoChat({
  channelId,
  chatId,
  isVisible,
  onClose,
  contactName,
  contactAvatar,
}: MobileAvitoChatProps) {
  const [messageInput, setMessageInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isMessageSending, setIsMessageSending] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  // Добавляем состояния для функционала тренировки
  const [isTrainingDialogOpen, setIsTrainingDialogOpen] = useState(false);
  const [trainingMessage, setTrainingMessage] = useState<any>(null);
  const [previousUserMessage, setPreviousUserMessage] = useState<any>(null);
  const [isGoodResponse, setIsGoodResponse] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Запрос на получение полной информации о диалоге
  const {
    data: fullDialog,
    isLoading,
    error,
    refetch,
  } = useQuery<{
    articleInfo: {
      title: string;
      price: string;
      url: string;
      image?: string;
    };
    messages: AvitoMessage[];
    clientName?: string;
  }>({
    queryKey: [`/api/channels/${channelId}/avito/dialogs/${chatId}/full`],
    enabled: !!channelId && !!chatId && isVisible,
    refetchInterval: 10000, // Обновление каждые 10 секунд
  });

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
    enabled: !!channelId && !!chatId && isVisible,
  });

  // Извлекаем информацию о товаре и сообщениях
  const articleInfo = fullDialog?.articleInfo;

  // Преобразование сообщений для отображения
  const formattedMessages: MessageDisplay[] = fullDialog?.messages
    ? fullDialog.messages.map((message) => {
        const date = new Date(message.date * 1000);
        const formattedDate = format(date, "HH:mm", { locale: ru });
        return { ...message, formattedDate };
      })
    : [];

  // Сортировка сообщений по дате (от старых к новым)
  formattedMessages.sort((a, b) => a.date - b.date);

  // Прокрутка в конец списка сообщений при получении новых данных
  useEffect(() => {
    if (formattedMessages.length > 0 && isVisible && !hasScrolledToBottom) {
      scrollAreaRef.current?.scrollIntoView({ behavior: "smooth" });
      setHasScrolledToBottom(true);
    }
  }, [formattedMessages, isVisible, hasScrolledToBottom]);

  // Мутация для отправки сообщения
  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      return await apiRequest({
        url: `/api/channels/${channelId}/avito/dialogs/${chatId}/messages`,
        method: "POST",
        body: { message: text },
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

  // Обработчик отправки сообщения
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim()) return;

    setIsMessageSending(true);
    try {
      await sendMessageMutation.mutateAsync(messageInput);
      setMessageInput(""); // Очищаем поле ввода после отправки
    } catch (error) {
      console.error("Ошибка при отправке сообщения", error);
    } finally {
      setIsMessageSending(false);
    }
  };

  // Функция для обновления списка сообщений
  const refreshMessages = async () => {
    try {
      await refetch();
    } catch (error) {
      console.error("Ошибка при обновлении сообщений", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить сообщения",
        variant: "destructive",
      });
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
    }
  };

  const reversedMessages = fullDialog?.messages
    ? [...fullDialog.messages].reverse()
    : [];

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
      {/* Заголовок с именем собеседника и кнопкой назад */}
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
          <Avatar className="mr-2">
            <AvatarFallback>{actualContactName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-sm font-medium">{actualContactName}</h3>
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={refreshMessages}>
          <RefreshCw className="h-4 w-4" />
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
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {reversedMessages &&
        Array.isArray(reversedMessages) &&
        reversedMessages.length > 0 ? (
          <div className="space-y-4">
            {reversedMessages.map((message: AvitoMessage, idx: number) => {
              const isFromMe = message.out !== 0; // исходящие сообщения
              const isAssistant = isFromMe;

              // Получаем индекс в оригинальном массиве для поиска предыдущего сообщения
              const originalIndex =
                (fullDialog?.messages?.length || 0) - 1 - idx;

              // Определяем, был ли ответ исправлен
              const { isGoodResponse, isCorrected } = isResponseCorrected(
                message,
                findPreviousUserMessage(
                  fullDialog?.messages || [],
                  originalIndex
                )
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
                      <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                        <span className="text-sm">
                          {contactName?.charAt(0) || "А"}
                        </span>
                      </AvatarFallback>
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
                              attachment.content
                            ) {
                              return (
                                <Dialog
                                  key={`${message.id}-attachment-${attachmentIdx}`}
                                >
                                  <DialogTrigger>
                                    <img
                                      src={attachment.content}
                                      alt="Вложенное изображение"
                                      className="max-w-full h-auto rounded"
                                      loading="lazy"
                                    />
                                  </DialogTrigger>
                                  <DialogContent className="max-w-[800px]">
                                    <img
                                      src={attachment.content}
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
                        {format(new Date(message.date * 1000), "HH:mm", {
                          locale: ru,
                        })}
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

      {/* Форма отправки сообщения */}
      <form
        onSubmit={handleSendMessage}
        className="border-t border-neutral-200 dark:border-neutral-700 p-3 flex items-center space-x-2"
      >
        <Input
          type="text"
          placeholder="Введите сообщение..."
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          disabled={isMessageSending || !messageInput.trim()}
          className="flex-1"
        />
        <Button
          type="submit"
          size="icon"
          disabled={isMessageSending || !messageInput.trim()}
        >
          {isMessageSending ? (
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
        assistantName={contactName || "Ассистент"}
        onSuccess={refreshData}
        isGoodResponse={isGoodResponse}
        channelId={channelId}
      />
    </div>
  );
}
