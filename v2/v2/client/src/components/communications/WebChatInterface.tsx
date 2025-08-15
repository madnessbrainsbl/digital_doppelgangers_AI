import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { SendHorizonal, Bot, Loader2, ThumbsUp, Edit } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import MessageTrainingDialog from "./MessageTrainingDialog";

// Интерфейс для сообщения
interface Message {
  id: number;
  conversationId: number;
  senderType: string;
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

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

// Интерфейс для ассистента
interface Assistant {
  id: number;
  name: string;
  description: string;
  openaiAssistantId: string;
}

interface WebChatInterfaceProps {
  channelId: number;
  dialogId: string;
}

export default function WebChatInterface({
  channelId,
  dialogId,
}: WebChatInterfaceProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [conversation, setConversation] = useState<any>(null);

  // Добавляем состояния для функционала тренировки
  const [isTrainingDialogOpen, setIsTrainingDialogOpen] = useState(false);
  const [trainingMessage, setTrainingMessage] = useState<any>(null);
  const [previousUserMessage, setPreviousUserMessage] = useState<any>(null);
  const [isGoodResponse, setIsGoodResponse] = useState(false);

  // Получение канала
  const { data: channel } = useQuery<WebChannel>({
    queryKey: [`/api/channels/${channelId}`],
    enabled: !!channelId,
  });

  // Получение разговора
  const { data: conversations } = useQuery<any[]>({
    queryKey: [`/api/channels/${channelId}/conversations`],
    enabled: !!channelId && !!dialogId,
  });

  // Получение сообщений
  const {
    data: messages,
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = useQuery<Message[]>({
    queryKey: [
      `/api/channels/${channelId}/conversation/${conversation?.id}/messages`,
    ],
    enabled: !!channelId && !!dialogId && !!conversation,
    refetchInterval: 10000, // Обновление каждые 10 секунд
    select: (data) => {
      // Сортируем сообщения по времени создания
      return [...data].sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeA - timeB;
      });
    },
  });

  // Эффект для проверки сообщений и загрузки их через дополнительный API при необходимости
  useEffect(() => {
    // Если нет данных и у нас есть ID разговора, попробуем получить сообщения по conversationId
    if (
      (!messages || messages.length === 0) &&
      conversation &&
      conversation.id
    ) {
      // Загружаем сообщения напрямую из базы через API разговоров
      apiRequest({
        url: `/api/conversations/${conversation.id}/messages`,
        method: "GET",
      })
        .then((conversationMessages) => {
          // Если получили сообщения, инвалидируем текущий запрос для обновления UI
          if (conversationMessages && conversationMessages.length > 0) {
            // Сортируем сообщения по времени создания для правильного отображения
            const sortedMessages = [...conversationMessages].sort((a, b) => {
              const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
              const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
              return timeA - timeB;
            });

            // Обновляем данные в кэше запроса
            queryClient.setQueryData(
              [`/api/channels/${channelId}/dialogs/${dialogId}/messages`],
              sortedMessages
            );
          }
        })
        .catch((err) => {
          console.error(
            `[WebChatInterface] Ошибка при получении сообщений разговора:`,
            err
          );
        });
    }
  }, [messages, conversation, channelId, dialogId, queryClient]);

  // Получение ассистентов
  const { data: assistants } = useQuery<Assistant[]>({
    queryKey: ["/api/assistants"],
    enabled: !!user,
  });

  // Получение информации об ассистенте канала
  const { data: channelAssistant } = useQuery<ChannelAssistant>({
    queryKey: [`/api/channels/${channelId}/assistant`],
    enabled: !!channelId,
  });

  // Получение информации об ассистенте диалога
  const { data: dialogAssistant, refetch: refetchDialogAssistant } =
    useQuery<DialogAssistant>({
      queryKey: [`/api/channels/${channelId}/dialogs/${dialogId}/assistant`],
      enabled: !!channelId && !!dialogId && !!channelAssistant,
    });

  // Настройка разговора при изменении списка разговоров
  useEffect(() => {
    if (conversations && Array.isArray(conversations)) {
      // Ищем разговор по externalUserId (ID посетителя) или по ID разговора
      const foundConversation = conversations.find(
        (c) =>
          (c.externalUserId && c.externalUserId === dialogId) ||
          (c.id && c.id.toString() === dialogId)
      );

      if (foundConversation) {
        setConversation(foundConversation);
      } else {
        console.log(
          `[WebChatInterface] Разговор не найден для dialogId=${dialogId}`
        );
        console.log(`[WebChatInterface] Доступные разговоры:`, conversations);

        // Если в консоли видим сообщения, но не можем загрузить их,
        // делаем отдельный запрос для получения разговора по dialogId
        apiRequest({
          url: `/api/channels/${channelId}/conversations?dialogId=${dialogId}`,
          method: "GET",
        })
          .then((response) => {
            if (response && response.conversation) {
              console.log(
                `[WebChatInterface] Получен разговор через отдельный запрос:`,
                response.conversation
              );
              setConversation(response.conversation);
            }
          })
          .catch((err) => {
            console.error(
              `[WebChatInterface] Ошибка при получении разговора по dialogId:`,
              err
            );
          });
      }
    }
  }, [conversations, dialogId, channelId]);

  // Мутация для отправки сообщения
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      if (!user) throw new Error("Пользователь не авторизован");

      // Используем conversationId если он есть, чтобы гарантировать правильную отправку
      if (conversation && conversation.id) {
        return await apiRequest({
          url: `/api/conversations/${conversation.id}/messages`,
          method: "POST",
          body: {
            content: messageText,
            senderId: user.id,
          },
        });
      }

      // Запасной вариант - обычный API
      return await apiRequest({
        url: `/api/channels/${channelId}/dialogs/${dialogId}/messages`,
        method: "POST",
        body: {
          content: messageText,
          senderId: user.id,
        },
      });
    },
    onSuccess: () => {
      // Очищаем поле ввода и обновляем список сообщений
      setMessage("");
      refetchMessages();

      // Прокручиваем вниз к последнему сообщению
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    },
    onError: (error: Error) => {
      console.error("Ошибка при отправке сообщения:", error);
      toast({
        title: "Ошибка при отправке сообщения",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Обработчик отправки сообщения
  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  // Обработчик нажатия клавиши Enter
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Функция для прокрутки к последнему сообщению
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Прокрутка к последнему сообщению при обновлении списка сообщений
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const currentAssistantId = dialogAssistant
    ? dialogAssistant.assistantId
    : channelAssistant?.assistantId || 0;

  // Получение названия ассистента
  const getAssistantName = (id: number) => {
    if (!assistants) return "Ассистент";
    const assistant = assistants.find((a) => a.id === id);
    return assistant ? assistant.name : "Ассистент";
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
    queryKey: [`/api/messages/corrections/${channelId}/${dialogId}`],
    enabled: !!channelId && !!dialogId,
  });

  // Функция для поиска предыдущего сообщения пользователя
  const findPreviousUserMessage = (
    allMessages: Message[],
    currentIndex: number
  ): Message | null => {
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (allMessages[i].senderType === "user") return allMessages[i];
    }
    return null;
  };

  // Функция для проверки, был ли ответ исправлен
  const isResponseCorrected = (
    message: Message,
    previousMessage: Message | null
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

  const handleSaveGoodResponse = (msg: Message, idx: number) => {
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

  const handleEditMessage = (msg: Message, idx: number) => {
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

  // Функция для принудительного обновления данных
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

  // Если нет разговора, показываем заглушку
  if (!conversation && !isLoading && conversations) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-6 text-center">
        <div className="rounded-full bg-neutral-100 dark:bg-neutral-800 p-4 mb-4">
          <span className="material-icons text-neutral-500 text-4xl">
            error_outline
          </span>
        </div>
        <h2 className="text-xl font-medium mb-2">Диалог не найден</h2>
        <p className="text-neutral-500 dark:text-neutral-400 mb-6">
          Диалог с ID {dialogId} не найден в канале{" "}
          {channel?.name || "Веб-сайт"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Шапка диалога */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
        <div className="flex items-center">
          <Avatar className="h-10 w-10 mr-3 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
            <AvatarFallback>
              <span className="material-icons">language</span>
            </AvatarFallback>
          </Avatar>

          <div>
            <h2 className="text-lg font-medium">
              Посетитель {dialogId.substring(0, 8)}
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {channel?.settings?.siteName || "Веб-сайт"}
            </p>
          </div>
        </div>
      </div>

      {/* Область сообщений */}
      <ScrollArea className="flex-1 p-4">
        {isLoadingMessages ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex ${
                  i % 2 === 0 ? "justify-end" : "justify-start"
                }`}
              >
                <div className="max-w-[70%]">
                  <Skeleton
                    className={`h-16 w-64 rounded-lg ${
                      i % 2 === 0 ? "ml-auto" : "mr-auto"
                    }`}
                  />
                  <Skeleton className="h-3 w-20 mt-1" />
                </div>
              </div>
            ))}
          </div>
        ) : messages && messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((msg, idx) => {
              // Определяем, от кого сообщение
              const isOperator =
                msg.senderType === "operator" || msg.senderType === "system"; // От оператора или системы
              const isCustomer = msg.senderType === "user"; // От клиента (внешнего пользователя)
              const isAssistant = msg.senderType === "assistant"; // От ассистента

              // Сообщения оператора и ассистента отображаются справа, клиента - слева
              const showOnRight = isOperator || isAssistant;

              // Форматируем время
              const messageTime = new Date(msg.timestamp);
              const formattedTime = format(messageTime, "HH:mm", {
                locale: ru,
              });
              const formattedDate = format(messageTime, "d MMM", {
                locale: ru,
              });

              const {
                isGoodResponse: responseGood,
                isCorrected: responseCorrected,
              } = isResponseCorrected(
                msg,
                findPreviousUserMessage(messages, idx)
              );

              return (
                <div
                  key={msg.id}
                  className={`flex ${
                    showOnRight ? "justify-end" : "justify-start"
                  }`}
                >
                  <div className="max-w-[70%] space-y-1">
                    <div
                      className={`p-3 rounded-lg ${
                        isOperator
                          ? "bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100"
                          : isAssistant
                          ? "bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100"
                          : "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                      }`}
                    >
                      {msg.content}

                      {/* Показываем автора сообщения */}
                      <div className="flex items-center justify-between mt-1">
                        {isAssistant && (
                          <div className="text-xs text-green-600 dark:text-green-400 flex items-center">
                            <Bot className="h-3 w-3 mr-1" />
                            {getAssistantName(currentAssistantId)}
                          </div>
                        )}

                        {isAssistant && (
                          <span className="flex gap-1 ml-2">
                            <button
                              className={`p-1 rounded ${
                                responseGood
                                  ? "bg-green-200"
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
                                  ? "bg-blue-200"
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

                    <div
                      className={`text-xs text-neutral-500 dark:text-neutral-400 ${
                        showOnRight ? "text-right" : "text-left"
                      }`}
                    >
                      {formattedTime}, {formattedDate}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="rounded-full bg-neutral-100 dark:bg-neutral-800 p-4 mb-4">
              <span className="material-icons text-neutral-500 text-4xl">
                chat
              </span>
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 text-center">
              Нет сообщений в этом диалоге.
              <br />
              Начните общение, отправив сообщение.
            </p>
          </div>
        )}
      </ScrollArea>

      {/* Форма отправки сообщения */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
        <div className="flex gap-2">
          <Input
            placeholder="Введите сообщение..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sendMessageMutation.isPending}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={sendMessageMutation.isPending || !message.trim()}
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SendHorizonal className="h-4 w-4" />
            )}
          </Button>
        </div>
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
