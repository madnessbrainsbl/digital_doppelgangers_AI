import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Send,
  RefreshCw,
  LoaderCircle,
  SendHorizonal,
  Bot,
  Loader2,
  ThumbsUp,
  Edit,
} from "lucide-react";
import { Message, Conversation } from "@/types/messages";
import { useAuth } from "@/contexts/AuthContext";
import MessageTrainingDialog from "./MessageTrainingDialog";

// Интерфейс для настроек ассистента диалога
interface DialogAssistant {
  id: number;
  channelId: number;
  dialogId: string;
  assistantId: number;
  enabled: boolean;
  autoReply: boolean;
  settings: any;
}

// Интерфейс для ассистента канала
interface ChannelAssistant {
  id: number;
  channelId: number;
  assistantId: number;
  enabled: boolean;
  autoReply: boolean;
  settings: any;
}

// Интерфейс для информации о канале веб-сайта
interface WebChannel {
  id: number;
  name: string;
  type: string;
  status: string;
  settings: {
    siteName?: string;
    widgetColor?: string;
    widgetPosition?: string;
    widgetHeaderName?: string;
  };
}

// Интерфейс для информации об ассистенте
interface Assistant {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface MobileWebChatProps {
  channelId: number;
  dialogId: string;
  isVisible: boolean;
  onClose: () => void;
  contactName?: string;
}

export default function MobileWebChat({
  channelId,
  dialogId,
  isVisible,
  onClose,
  contactName,
}: MobileWebChatProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);

  // Добавляем состояния для функционала тренировки
  const [isTrainingDialogOpen, setIsTrainingDialogOpen] = useState(false);
  const [trainingMessage, setTrainingMessage] = useState<any>(null);
  const [previousUserMessage, setPreviousUserMessage] = useState<any>(null);
  const [isGoodResponse, setIsGoodResponse] = useState(false);

  // Запрос информации о канале
  const { data: channel } = useQuery<WebChannel>({
    queryKey: [`/api/channels/${channelId}`],
    enabled: !!channelId && isVisible,
  });

  // Запрос списка разговоров канала
  const { data: conversations } = useQuery<Conversation[]>({
    queryKey: [`/api/channels/${channelId}/conversations`],
    enabled: !!channelId && isVisible,
  });

  // Запрос сообщений
  const {
    data: messages,
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = useQuery<Message[]>({
    queryKey: [
      `/api/channels/${channelId}/conversation/${conversation?.id}/messages`,
    ],
    enabled: !!channelId && !!dialogId && !!conversation && isVisible,
  });

  // Получение информации об ассистентах
  const { data: assistants } = useQuery<Assistant[]>({
    queryKey: ["/api/assistants"],
    enabled: isVisible,
  });

  // Получение информации об ассистенте канала
  const { data: channelAssistant } = useQuery<ChannelAssistant>({
    queryKey: [`/api/channels/${channelId}/assistant`],
    enabled: !!channelId && isVisible,
  });

  // Получение информации об ассистенте диалога
  const { data: dialogAssistant } = useQuery<DialogAssistant>({
    queryKey: [`/api/channels/${channelId}/dialogs/${dialogId}/assistant`],
    enabled: !!channelId && !!dialogId && !!channelAssistant && isVisible,
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
    queryKey: [`/api/messages/corrections/${channelId}/${dialogId}`],
    enabled: !!channelId && !!dialogId && isVisible,
  });

  // Настройка разговора при изменении списка разговоров
  useEffect(() => {
    if (conversations && Array.isArray(conversations) && isVisible) {
      // Ищем разговор по dialogId
      const foundConversation = conversations.find(
        (c) => c.id && c.id.toString() === dialogId
      );

      if (foundConversation) {
        setConversation(foundConversation);
      } else {
        console.log(
          `[MobileWebChat] Разговор не найден для dialogId=${dialogId}`
        );

        // Если не нашли, делаем отдельный запрос для получения разговора
        apiRequest({
          url: `/api/channels/${channelId}/conversations?dialogId=${dialogId}`,
          method: "GET",
        })
          .then((response) => {
            if (response && response.conversation) {
              setConversation(response.conversation);
            }
          })
          .catch((err) => {
            console.error(
              `[MobileWebChat] Ошибка при получении разговора:`,
              err
            );
          });
      }
    }
  }, [conversations, dialogId, channelId, isVisible]);

  // Мутация для отправки сообщения
  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      return await apiRequest({
        url: `/api/channels/${channelId}/dialogs/${dialogId}/messages`,
        method: "POST",
        body: { message: text },
      });
    },
    onSuccess: () => {
      // При успешной отправке обновляем сообщения
      queryClient.invalidateQueries({
        queryKey: [`/api/channels/${channelId}/dialogs/${dialogId}/messages`],
      });

      // Обновляем также список разговоров
      queryClient.invalidateQueries({
        queryKey: [`/api/channels/${channelId}/conversations`],
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

  // Обработчик отправки сообщения
  const handleSendMessage = async () => {
    if (!messageText.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessageMutation.mutateAsync(messageText);
      setMessageText("");
    } catch (error) {
      console.error("Ошибка при отправке сообщения:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Обработчик нажатия клавиши Enter
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Прокрутка в конец списка сообщений при получении новых данных
  useEffect(() => {
    if (messages?.length && isVisible) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isVisible]);

  // Определяем ID текущего ассистента для отображения имени
  const currentAssistantId =
    dialogAssistant?.assistantId || channelAssistant?.assistantId || 0;

  const getAssistantName = (id: number) => {
    const assistant = assistants?.find((a) => a.id === id);
    return assistant?.name || "Ассистент";
  };

  const formatMessageTime = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return format(date, "HH:mm", { locale: ru });
  };

  const findPreviousUserMessage = (
    allMessages: any[],
    currentIndex: number
  ): any | null => {
    // Ищем предыдущее сообщение пользователя
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (allMessages[i].senderType === "user") {
        return allMessages[i];
      }
    }
    return null;
  };

  const isResponseCorrected = (
    message: any,
    previousMessage: any | null
  ): { isGoodResponse: boolean; isCorrected: boolean } => {
    if (!correctionsData?.corrections || !previousMessage) {
      return { isGoodResponse: false, isCorrected: false };
    }

    let isGoodResponse = false;
    let isCorrected = false;

    correctionsData.corrections.forEach((correction: any) => {
      const queryMatch =
        correction.userQuery?.toLowerCase().trim() ===
        previousMessage.content?.toLowerCase().trim();
      const messageText = message.content?.toLowerCase().trim();

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

  const handleSaveGoodResponse = (msg: any, idx: number) => {
    setTrainingMessage({
      id: msg.id,
      content: msg.content,
      conversationId: dialogId,
    });

    const prev = findPreviousUserMessage(messages || [], idx);
    setPreviousUserMessage(prev ? { content: prev.content } : null);
    setIsGoodResponse(true);
    setIsTrainingDialogOpen(true);
  };

  const handleEditMessage = (msg: any, idx: number) => {
    setTrainingMessage({
      id: msg.id,
      content: msg.content,
      conversationId: dialogId,
    });

    const prev = findPreviousUserMessage(messages || [], idx);
    setPreviousUserMessage(prev ? { content: prev.content } : null);
    setIsGoodResponse(false);
    setIsTrainingDialogOpen(true);
  };

  const refreshData = async () => {
    if (!channelId || !dialogId) return;

    try {
      await refetchMessages();

      // Обновляем информацию об исправлениях
      queryClient.invalidateQueries({
        queryKey: [`/api/messages/corrections/${channelId}/${dialogId}`],
      });
    } catch (error) {
      console.error("Ошибка при обновлении сообщений:", error);
    }
  };

  // Загрузка
  if (isLoadingMessages) {
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
      {/* Заголовок с информацией о посетителе и кнопкой возврата */}
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
          <Avatar className="h-8 w-8 mr-2 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
            <AvatarFallback>
              <span className="material-icons text-sm">language</span>
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium text-sm">
              Посетитель {dialogId.substring(0, 8)}
            </h3>
            <p className="text-xs text-neutral-500">
              {channel?.settings?.siteName || "Веб-сайт"}
            </p>
          </div>
        </div>
      </div>

      {/* Область сообщений */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages && messages.length > 0 ? (
            messages.map((msg, idx) => {
              // Определяем, от кого сообщение
              const isOperator =
                msg.senderType === "operator" || msg.senderType === "system";
              const isCustomer = msg.senderType === "user";
              const isAssistant = msg.senderType === "assistant";

              // Сообщения оператора и ассистента отображаются справа, клиента - слева
              const showOnRight = isOperator || isAssistant;

              // Форматируем время
              const messageTime = new Date(msg.timestamp);
              const formattedTime = format(messageTime, "HH:mm", {
                locale: ru,
              });

              // Определяем, был ли ответ исправлен для сообщений ассистента
              const {
                isGoodResponse: responseGood,
                isCorrected: responseCorrected,
              } = isAssistant
                ? isResponseCorrected(
                    msg,
                    findPreviousUserMessage(messages || [], idx)
                  )
                : { isGoodResponse: false, isCorrected: false };

              // Определяем стили для блока сообщения
              let messageClasses = "rounded-lg p-3 max-w-[75%] ";

              if (isAssistant) {
                messageClasses +=
                  "bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100 rounded-tr-none";
              } else if (isOperator) {
                messageClasses +=
                  "bg-white dark:bg-blue-900 text-blue-900 dark:text-blue-100 border border-neutral-200 dark:border-blue-700 rounded-tr-none";
              } else if (showOnRight) {
                messageClasses +=
                  "bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100 rounded-tr-none";
              } else {
                messageClasses +=
                  "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-tl-none";
              }

              return (
                <div
                  key={msg.id}
                  className={`flex items-start ${
                    showOnRight ? "justify-end" : "justify-start"
                  }`}
                >
                  {isCustomer && (
                    <Avatar className="h-8 w-8 mr-2 bg-neutral-200 dark:bg-neutral-700">
                      <AvatarFallback>
                        <span className="material-icons text-sm">person</span>
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className={messageClasses}>
                    {/* Если сообщение от ассистента, показываем его имя */}
                    {isAssistant && (
                      <p className="text-xs font-medium mb-1 text-green-700 dark:text-green-300">
                        {getAssistantName(currentAssistantId)}
                      </p>
                    )}

                    <p className="text-sm whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>

                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {formattedTime}
                      </span>
                      {isAssistant && (
                        <span className="flex gap-1 ml-2">
                          <button
                            className={`p-1 rounded ${
                              responseGood
                                ? "bg-green-100"
                                : "hover:bg-neutral-200"
                            }`}
                            title="Хороший ответ"
                            onClick={() => handleSaveGoodResponse(msg, idx)}
                          >
                            <ThumbsUp
                              className={`h-3 w-3 ${
                                responseGood
                                  ? "text-green-700"
                                  : "text-green-500"
                              }`}
                            />
                          </button>
                          <button
                            className={`p-1 rounded ${
                              responseCorrected
                                ? "bg-blue-100"
                                : "hover:bg-neutral-200"
                            }`}
                            title="Изменить ответ"
                            onClick={() => handleEditMessage(msg, idx)}
                          >
                            <Edit
                              className={`h-3 w-3 ${
                                responseCorrected
                                  ? "text-blue-700"
                                  : "text-blue-500"
                              }`}
                            />
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                Нет сообщений в этом диалоге
              </p>
            </div>
          )}
          {/* Элемент для прокрутки в конец списка */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Форма отправки сообщения */}
      <div className="border-t border-neutral-200 dark:border-neutral-700 p-3 flex items-center space-x-2">
        <Input
          type="text"
          placeholder="Введите сообщение..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={isSending}
          className="flex-1"
        />
        <Button
          onClick={handleSendMessage}
          size="icon"
          disabled={isSending || !messageText.trim()}
        >
          {isSending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      <MessageTrainingDialog
        open={isTrainingDialogOpen}
        onOpenChange={setIsTrainingDialogOpen}
        message={trainingMessage}
        previousUserMessage={previousUserMessage}
        assistantName={getAssistantName(currentAssistantId)}
        onSuccess={refreshData}
        isGoodResponse={isGoodResponse}
        channelId={channelId}
      />
    </div>
  );
}
