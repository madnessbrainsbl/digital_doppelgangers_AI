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
import { Loader2, Send, PaperclipIcon } from "lucide-react";

interface VkChatInterfaceProps {
  channelId: number;
  peerId: number;
  contactName: string;
  contactAvatar?: string;
}

export default function VkChatInterface({
  channelId,
  peerId,
  contactName,
  contactAvatar,
}: VkChatInterfaceProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageInput, setMessageInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Запрос истории диалога
  const {
    data: messages,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [`/api/channels/${channelId}/vk/dialogs/${peerId}/history`],
    enabled: !!channelId && !!peerId,
  });

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
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    sendMessageMutation.mutate(messageInput);
  };

  // Форматирование времени сообщения
  const formatMessageTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return format(date, "HH:mm", { locale: ru });
  };

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
          {contactAvatar ? (
            <AvatarImage src={contactAvatar} alt={contactName} />
          ) : (
            <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
              <span className="material-icons text-sm">person</span>
            </AvatarFallback>
          )}
        </Avatar>
        <h3 className="ml-3 font-medium">
          {contactName || `Собеседник ${peerId}`}
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
            {messages.map((message: VkMessage) => {
              const isFromMe = message.fromId < 0; // сообщения от группы имеют отрицательный fromId

              return (
                <div
                  key={message.id}
                  className={`flex items-start ${
                    isFromMe ? "justify-end" : ""
                  }`}
                >
                  {!isFromMe && (
                    <Avatar className="h-8 w-8 mr-3">
                      {contactAvatar ? (
                        <AvatarImage src={contactAvatar} alt={contactName} />
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

                    {/* Если есть вложения, показываем индикатор */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-1 text-xs flex items-center text-neutral-500 dark:text-neutral-400">
                        <PaperclipIcon className="h-3 w-3 mr-1" />
                        <span>Вложение ({message.attachments.length})</span>
                      </div>
                    )}

                    <p className="text-xs mt-1 text-right text-neutral-500 dark:text-neutral-400">
                      {formatMessageTime(message.date)}
                    </p>
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
    </div>
  );
}
