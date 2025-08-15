import { useState, useEffect, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Bot,
  User,
  SendHorizontal,
  RefreshCcw,
  Check,
  Download,
  Clipboard,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface AssistantTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assistant: {
    id: number;
    name: string;
    role: string;
    openaiAssistantId?: string;
  } | null;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AssistantTestDialog({
  open,
  onOpenChange,
  assistant,
}: AssistantTestDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCorrectingResponse, setIsCorrectingResponse] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [correctedResponse, setCorrectedResponse] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();

  // Сброс состояния при открытии/закрытии диалога
  useEffect(() => {
    if (open) {
      // Если есть ассистент, добавим вводное сообщение
      if (assistant) {
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content: `Здравствуйте! Я ${assistant.name}, виртуальный ассистент. Чем я могу вам помочь?`,
            timestamp: new Date(),
          },
        ]);
      } else {
        setMessages([]);
      }
      setNewMessage("");
      setSelectedMessage(null);
      setCorrectedResponse("");
    }
  }, [open, assistant]);

  // Прокрутка вниз при добавлении новых сообщений
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Автоматический фокус на поле ввода при открытии диалога
  useEffect(() => {
    if (open) {
      const inputElement = document.getElementById("message-input");
      if (inputElement) {
        setTimeout(() => {
          inputElement.focus();
        }, 100);
      }
    }
  }, [open]);

  // Функция отправки сообщения
  const sendMessage = async () => {
    if (!newMessage.trim()) {
      return;
    }

    if (!assistant?.openaiAssistantId) {
      toast({
        title: "Ошибка конфигурации",
        description: "Ассистент не имеет ID в OpenAI или не синхронизирован.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: newMessage,
      timestamp: new Date(),
    };

    // Добавляем сообщение пользователя в массив сообщений
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    // Очищаем поле ввода
    setNewMessage("");

    // Показываем индикатор загрузки
    setIsLoading(true);

    try {
      // Отправляем запрос к API
      const response = await fetch(`/api/assistants/${assistant.id}/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage.content }),
      });

      // Получаем данные ответа
      const responseData = await response.json();

      // Проверяем статус ответа
      if (!response.ok) {
        const errorMessage =
          responseData.message ||
          responseData.error ||
          `Ошибка сервера: ${response.status}`;
        throw new Error(errorMessage);
      }

      // Проверяем, есть ли ответ от API
      if (responseData && responseData.reply) {
        // Добавляем ответ ассистента в массив сообщений
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: responseData.reply,
            timestamp: new Date(),
          },
        ]);
      } else if (responseData && responseData.error) {
        // Если есть сообщение об ошибке, добавляем его
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: `assistant-error-${Date.now()}`,
            role: "assistant",
            content: `Извините, произошла ошибка: ${responseData.error}`,
            timestamp: new Date(),
          },
        ]);

        toast({
          title: "Ошибка API",
          description: responseData.error,
          variant: "destructive",
        });
      } else {
        // Если нет ни ответа, ни сообщения об ошибке
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: `assistant-error-${Date.now()}`,
            role: "assistant",
            content: "Извините, произошла ошибка при обработке вашего запроса.",
            timestamp: new Date(),
          },
        ]);

        toast({
          title: "Ошибка",
          description: "Не удалось получить ответ от ассистента.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);

      // В случае ошибки добавляем сообщение об ошибке
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: "Извините, произошла ошибка при обработке вашего запроса.",
          timestamp: new Date(),
        },
      ]);

      toast({
        title: "Ошибка",
        description: "Не удалось отправить сообщение.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Обработчик нажатия Enter для отправки сообщения
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Функция для выбора сообщения (для исправления)
  const handleSelectMessage = (message: Message) => {
    if (message.role === "assistant") {
      setSelectedMessage(message);
      setCorrectedResponse(message.content);
      setIsCorrectingResponse(true);
    }
  };

  // Сохранение исправленного ответа
  const saveCorrection = async () => {
    if (!selectedMessage || !correctedResponse.trim() || !assistant) {
      toast({
        title: "Ошибка",
        description: "Необходимо выбрать сообщение и ввести исправление",
        variant: "destructive",
      });
      return;
    }

    try {
      // Оптимистичное обновление UI
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === selectedMessage.id
            ? { ...msg, content: correctedResponse }
            : msg
        )
      );

      // Находим запрос пользователя непосредственно перед выбранным сообщением
      let userQuery = "";
      const messageIndex = messages.indexOf(selectedMessage);
      if (messageIndex > 0) {
        // Ищем самый последний user-запрос перед выбранным сообщением
        for (let i = messageIndex - 1; i >= 0; i--) {
          if (messages[i].role === "user") {
            userQuery = messages[i].content;
            break;
          }
        }
      }

      if (!userQuery) {
        toast({
          title: "Предупреждение",
          description: "Не найден предшествующий запрос пользователя",
          variant: "destructive",
        });
        return; // Прерываем выполнение, если запрос не найден
      }

      console.log(`Отправляем исправление для запроса: "${userQuery}"`);

      try {
        // Отправка исправления на сервер
        const response = await fetch(`/api/assistants/${assistant.id}/train`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            query: userQuery,
            originalResponse: selectedMessage.content,
            correctedResponse: correctedResponse,
          }),
          credentials: "include",
        });

        // Проверяем статус ответа
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData.message ||
            errorData.error ||
            `Ошибка сервера: ${response.status}`;
          throw new Error(errorMessage);
        }

        toast({
          title: "Успешно",
          description:
            "Исправление сохранено и будет использовано для обучения ассистента.",
        });

        // Сброс состояния исправления
        setIsCorrectingResponse(false);
        setSelectedMessage(null);
        setCorrectedResponse("");
      } catch (fetchError) {
        throw fetchError;
      }
    } catch (error) {
      console.error("Error saving correction:", error);

      // Отображаем более детальное сообщение об ошибке
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Не удалось сохранить исправление.";

      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Отмена исправления
  const cancelCorrection = () => {
    setIsCorrectingResponse(false);
    setSelectedMessage(null);
    setCorrectedResponse("");
  };

  // Копирование сообщения в буфер обмена
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Скопировано",
          description: "Текст скопирован в буфер обмена",
        });
      },
      (err) => {
        console.error("Не удалось скопировать текст: ", err);
        toast({
          title: "Ошибка",
          description: "Не удалось скопировать текст",
          variant: "destructive",
        });
      }
    );
  };

  // Экспорт истории сообщений
  const exportConversation = () => {
    const conversation = messages
      .map(
        (msg) =>
          `${msg.role === "user" ? "Пользователь" : "Ассистент"}: ${
            msg.content
          }`
      )
      .join("\n\n");
    const blob = new Blob([conversation], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversation-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Очистка истории сообщений
  const clearConversation = () => {
    // Оставляем только приветственное сообщение
    if (assistant) {
      setMessages([
        {
          id: "welcome-new",
          role: "assistant",
          content: `Здравствуйте! Я ${assistant.name}, виртуальный ассистент. Чем я могу вам помочь?`,
          timestamp: new Date(),
        },
      ]);
    } else {
      setMessages([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl flex items-center">
            <Bot className="h-5 w-5 mr-2" />
            {assistant
              ? `Тестирование: ${assistant.name}`
              : "Тестирование ассистента"}
          </DialogTitle>
          <DialogDescription>
            Протестируйте ассистента и улучшите его ответы с помощью обучающих
            исправлений
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isCorrectingResponse ? (
            <div className="flex flex-col h-full p-6">
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">
                  Исправление ответа ассистента
                </h3>
                <div className="bg-secondary/30 p-4 rounded-md mb-2">
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedMessage?.content}
                  </p>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium mb-2">Ваше исправление</h3>
                <textarea
                  value={correctedResponse}
                  onChange={(e) => setCorrectedResponse(e.target.value)}
                  className="w-full h-[calc(100%-3rem)] min-h-[200px] p-3 text-sm rounded-md border border-input bg-background"
                  placeholder="Введите исправленный ответ ассистента..."
                />
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={cancelCorrection}>
                  Отмена
                </Button>
                <Button onClick={saveCorrection}>Сохранить исправление</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center px-6 py-2 border-b">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="flex items-center">
                    {assistant ? assistant.role : "Роль не указана"}
                  </Badge>
                </div>
                <div className="flex space-x-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={clearConversation}
                        >
                          <RefreshCcw className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Очистить историю</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={exportConversation}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Экспорт истории</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              <ScrollArea
                ref={scrollAreaRef}
                className="h-[calc(100%-48px)] px-6 py-4"
              >
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg p-3 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground ml-4"
                            : "bg-muted mr-4"
                        }`}
                        onClick={() => handleSelectMessage(message)}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          {message.role === "user" ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                          <span className="text-xs font-medium">
                            {message.role === "user"
                              ? "Вы"
                              : assistant?.name || "Ассистент"}
                          </span>
                          <span className="text-xs text-white/70">
                            {formatDistanceToNow(message.timestamp, {
                              addSuffix: true,
                              locale: ru,
                            })}
                          </span>

                          {message.role === "assistant" && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 p-0 ml-auto"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyToClipboard(message.content);
                                    }}
                                  >
                                    <Clipboard className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Копировать</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        <p className="whitespace-pre-wrap text-sm">
                          {message.content}
                        </p>

                        {message.role === "assistant" && (
                          <div className="mt-2 text-xs text-right">
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectMessage(message);
                              }}
                            >
                              Исправить ответ
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        {!isCorrectingResponse && (
          <DialogFooter className="p-4 pt-2 border-t">
            <div className="flex w-full space-x-2">
              <Input
                id="message-input"
                placeholder="Введите сообщение..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading || !assistant?.openaiAssistantId}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={
                  !newMessage.trim() ||
                  isLoading ||
                  !assistant?.openaiAssistantId
                }
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <SendHorizontal className="h-4 w-4" />
                )}
                <span className="sr-only">Отправить</span>
              </Button>
            </div>
            {!assistant?.openaiAssistantId && (
              <p className="text-xs text-destructive w-full text-center mt-2">
                Ассистент не синхронизирован с OpenAI. Необходимо настроить его
                в разделе редактирования.
              </p>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
