import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ChatInterface from "@/components/communications/ChatInterface";
import MessageTrainingDialog from "@/components/communications/MessageTrainingDialog";
import CommunicationsInstructionsDialog from "@/components/communications/communications-instructions-dialog";
import ChannelSelector from "@/components/communications/ChannelSelector";
import ChannelDialogsList from "@/components/communications/ChannelDialogsList";
import VkMessageViewer from "@/components/communications/VkMessageViewer";
import AvitoChatInterface from "@/components/communications/AvitoChatInterface";
import WebChatInterface from "@/components/communications/WebChatInterface";
import MobileCommunicationsLayout from "@/components/communications/Mobile-communications-layout";
import { Message, Conversation } from "@/types/messages";
import { Bot, Book, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMediaQuery } from "@/hooks/use-media-query";

// Тип для данных канала
interface ChannelData {
  id: number;
  name: string;
  type: string;
  status: string;
  unreadCount?: number;
}

export default function Communications() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<
    number | null
  >(null);
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isEditingMessage, setIsEditingMessage] = useState<boolean>(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [previousUserMessage, setPreviousUserMessage] =
    useState<Message | null>(null);
  const [instructionsDialogOpen, setInstructionsDialogOpen] = useState(false);
  const [channelsSearchQuery, setChannelsSearchQuery] = useState("");

  // Состояние для работы с каналами и диалогами
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(
    null
  );
  const [selectedChannelType, setSelectedChannelType] = useState<string | null>(
    null
  );
  const [selectedDialogId, setSelectedDialogId] = useState<
    number | string | null
  >(null);
  const [selectedDialogType, setSelectedDialogType] = useState<string | null>(
    null
  );

  // Определяем текущий брейкпоинт для адаптивности
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // Запрос данных о выбранном канале
  const { data: channelData } = useQuery<ChannelData>({
    queryKey: [`/api/channels/${selectedChannelId}`],
    enabled: !!selectedChannelId,
  });

  // При изменении выбранного канала
  useEffect(() => {
    if (selectedChannelId && channelData) {
      setSelectedChannelType(channelData.type);
      // Сбрасываем выбранный диалог при смене канала
      setSelectedDialogId(null);
      setSelectedDialogType(null);
    } else {
      setSelectedChannelType(null);
    }
  }, [selectedChannelId, channelData]);

  // Запрос данных о диалогах
  const { data: conversationsData, isLoading: isLoadingConversations } =
    useQuery({
      queryKey: ["/api/conversations"],
    });

  // Демо данные для диалогов
  const demoConversations: Conversation[] = [
    {
      id: 1,
      name: "Александр Петров",
      lastMessage: "Здравствуйте! Интересует стоимость базового тарифа.",
      timestamp: "10:23",
      unread: true,
      channel: "telegram",
    },
  ];

  // Демо данные для каналов
  const demoChannels: ChannelData[] = [
    {
      id: 1,
      name: "VK Сообщества",
      type: "vk",
      status: "active",
      unreadCount: 5,
    },
  ];

  // Запрос данных о каналах
  const { data: channelsData } = useQuery<ChannelData[]>({
    queryKey: ["/api/channels"],
  });

  // Возвращаем реальные или демо данные
  const channels: ChannelData[] = channelsData || demoChannels;
  const conversations: Conversation[] =
    (conversationsData as Conversation[]) || demoConversations;

  // Фильтрация каналов по поисковому запросу
  const filteredChannels = channelsSearchQuery.trim()
    ? channels.filter((channel) =>
        channel.name.toLowerCase().includes(channelsSearchQuery.toLowerCase())
      )
    : channels;

  // Демо данные для сообщений
  const demoMessages: Message[] =
    selectedConversationId === 1
      ? [
          {
            id: 1,
            content: "Здравствуйте! Интересует стоимость базового тарифа.",
            senderType: "user",
            timestamp: new Date(Date.now() - 3600000).toLocaleString(),
            conversationId: 1,
          },
          {
            id: 2,
            content:
              "Здравствуйте! Базовый тариф стоит 5000₽ в месяц и включает до 5 ассистентов и все основные функции. Что именно вас интересует в работе с ассистентами?",
            senderType: "assistant",
            timestamp: new Date(Date.now() - 3500000).toLocaleString(),
            conversationId: 1,
          },
        ]
      : selectedConversationId === 2
      ? [
          {
            id: 3,
            content:
              "Спасибо за подробную демонстрацию, очень удобная система!",
            senderType: "user",
            timestamp: new Date(Date.now() - 86400000).toLocaleString(),
            conversationId: 2,
          },
          {
            id: 4,
            content:
              "Рады, что вам понравилось! Если у вас появятся вопросы по работе с платформой, обращайтесь в любое время.",
            senderType: "assistant",
            timestamp: new Date(Date.now() - 86000000).toLocaleString(),
            conversationId: 2,
          },
        ]
      : selectedConversationId === 3
      ? [
          {
            id: 5,
            content: "Когда будет доступна интеграция с 1С?",
            senderType: "user",
            timestamp: new Date(Date.now() - 90000000).toLocaleString(),
            conversationId: 3,
          },
          {
            id: 6,
            content:
              "Интеграция с 1С находится в разработке и будет доступна в течение следующего месяца. Мы можем уведомить вас, когда она будет готова.",
            senderType: "assistant",
            timestamp: new Date(Date.now() - 89900000).toLocaleString(),
            conversationId: 3,
          },
        ]
      : [];

  // Запрос сообщений выбранной беседы
  const { data: messagesData, refetch: refetchMessages } = useQuery({
    queryKey: ["/api/messages", selectedConversationId],
    enabled: !!selectedConversationId,
  });

  // При изменении выбранной беседы
  useEffect(() => {
    if (selectedConversationId) {
      if (messagesData) {
        setMessages(messagesData as Message[]);
      } else {
        // Используем демо данные, если API данные недоступны
        setMessages(demoMessages);
      }
    } else {
      setMessages([]);
    }
  }, [selectedConversationId, messagesData]);

  // Мутация для отправки сообщения
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedConversationId) return;

      return await apiRequest({
        method: "POST",
        url: "/api/messages",
        body: {
          conversationId: selectedConversationId,
          content,
        },
      });
    },
    onSuccess: () => {
      // Обновляем список сообщений
      refetchMessages();
      toast({
        title: "Сообщение отправлено",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить сообщение",
        variant: "destructive",
      });
    },
  });

  // Функция для обработки отправки сообщения
  const handleSendMessage = (content: string) => {
    // Оптимистичное обновление UI
    const newMessage: Message = {
      id: Date.now(),
      content,
      senderType: "user",
      timestamp: new Date().toLocaleString(),
      conversationId: selectedConversationId || 0,
    };

    setMessages((prev) => [...prev, newMessage]);

    // Отправка на сервер
    sendMessageMutation.mutate(content);
  };

  // Функция для обработки создания нового диалога
  const handleNewChat = () => {
    toast({
      title: "Новый диалог",
      description:
        "Функция создания нового диалога будет добавлена в следующем обновлении",
    });
  };

  // Функция для подготовки к редактированию сообщения
  const handleEditMessage = (message: Message) => {
    if (message.senderType !== "assistant") return;

    // Находим предыдущее сообщение от пользователя
    const messageIndex = messages.findIndex((m) => m.id === message.id);
    if (messageIndex <= 0) return;

    // Ищем последнее сообщение пользователя перед выбранным сообщением ассистента
    let userMessage: Message | null = null;
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].senderType === "user") {
        userMessage = messages[i];
        break;
      }
    }

    if (!userMessage) {
      toast({
        title: "Предупреждение",
        description: "Не найден предшествующий запрос пользователя",
        variant: "destructive",
      });
      return;
    }

    setSelectedMessage(message);
    setPreviousUserMessage(userMessage);
    setIsEditingMessage(true);
  };

  // Получение имени выбранной беседы
  const getSelectedConversationName = () => {
    if (!selectedConversationId) return "";
    const conversation = conversations.find(
      (c) => c.id === selectedConversationId
    );
    return conversation ? conversation.name : "";
  };

  // Получение типа канала выбранной беседы
  const getSelectedConversationChannel = () => {
    if (!selectedConversationId) return "";
    const conversation = conversations.find(
      (c) => c.id === selectedConversationId
    );
    return conversation ? conversation.channel : "";
  };

  // Обработчик выбора диалога из канала
  const handleDialogSelect = (
    dialogId: number | string,
    dialogType: string
  ) => {
    setSelectedDialogId(dialogId);
    setSelectedDialogType(dialogType);
  };

  useEffect(() => {
    // При смене канала сбрасываем выбранный диалог
    setSelectedDialogId(null);
    setSelectedDialogType(null);
  }, [selectedChannelId]);

  return (
    <div className="h-[calc(100vh-6rem)]">
      {/* Кастомный заголовок с кнопкой инструкций */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-2xl font-bold">Коммуникации</h1>
            <p className="text-muted-foreground">
              Управление диалогами с клиентами и пользователями
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setInstructionsDialogOpen(true)}
            title="Инструкция по работе с коммуникациями"
            className="bg-purple-200 hover:bg-purple-300"
          >
            <Book className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Селектор каналов - показывается только на десктопе */}
      <div className="hidden lg:block">
        <ChannelSelector
          onChannelSelect={setSelectedChannelId}
          selectedChannelId={selectedChannelId}
        />
      </div>

      {/* Мобильная версия интерфейса - показывается только на мобильных */}
      <div className="lg:hidden h-[calc(100vh-12rem)]">
        <MobileCommunicationsLayout
          selectedChannelId={selectedChannelId}
          setSelectedChannelId={setSelectedChannelId}
          selectedDialogId={selectedDialogId}
          setSelectedDialogId={setSelectedDialogId}
          selectedDialogType={selectedDialogType}
          setSelectedDialogType={setSelectedDialogType}
          channelsData={channels}
          selectedConversationId={selectedConversationId}
          setSelectedConversationId={setSelectedConversationId}
          messages={messages}
          handleSendMessage={handleSendMessage}
          handleEditMessage={handleEditMessage}
          getSelectedConversationName={getSelectedConversationName}
          getSelectedConversationChannel={getSelectedConversationChannel}
          handleDialogSelect={handleDialogSelect}
        />
      </div>

      {/* Десктопная версия интерфейса - показывается только на десктопе */}
      <div className="hidden lg:grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-16rem)]">
        {/* Список диалогов */}
        <div className="lg:col-span-1 border rounded-md overflow-hidden">
          <Tabs defaultValue="chats" className="w-full h-full flex flex-col">
            <div className="border-b">
              <TabsList className="w-full">
                <TabsTrigger value="chats" className="flex-1">
                  Диалоги
                </TabsTrigger>
                <TabsTrigger value="memory" className="flex-1">
                  Память
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="chats" className="flex-1 overflow-hidden">
              {selectedChannelId ? (
                // Если выбран канал, показываем диалоги из него
                <ChannelDialogsList
                  channelId={selectedChannelId}
                  channelType={selectedChannelType}
                  onSelectDialog={handleDialogSelect}
                  selectedDialogId={selectedDialogId}
                />
              ) : (
                // Если канал не выбран, показываем общий список диалогов
                <div className="flex flex-col h-full">
                  <div className="p-3 border-b border-neutral-200 dark:border-neutral-700">
                    <Input
                      placeholder="Поиск каналов..."
                      className="w-full"
                      value={channelsSearchQuery}
                      onChange={(e) => setChannelsSearchQuery(e.target.value)}
                    />
                  </div>
                  <ScrollArea className="h-full">
                    {/* Список каналов */}
                    <div className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-700">
                      <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-2">
                        Каналы
                      </p>
                      {filteredChannels.map(
                        (channel: ChannelData) =>
                          (channel.type === "web" ||
                            channel.type === "vk" ||
                            channel.type === "avito") && (
                            <div
                              key={channel.id}
                              onClick={() => {
                                setSelectedTab("channels");
                                setSelectedChannelId(channel.id);
                              }}
                              className="py-2 px-1 cursor-pointer flex items-center hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                            >
                              <div className="h-8 w-8 flex items-center justify-center bg-neutral-200 dark:bg-neutral-700 rounded-md">
                                <span className="material-icons text-neutral-600 dark:text-neutral-300 text-lg">
                                  {channel.type === "vk" ? "chat" : "mail"}
                                </span>
                              </div>
                              <div className="ml-3 flex-1 min-w-0">
                                <div className="flex justify-between items-center">
                                  <p className="text-sm font-medium truncate">
                                    {channel.name}
                                  </p>
                                  {channel.unreadCount !== undefined &&
                                    channel.unreadCount > 0 && (
                                      <span className="ml-2 min-w-5 px-1.5 py-0.5 bg-primary-500 text-white text-xs font-medium rounded-full flex-shrink-0 flex items-center justify-center">
                                        {channel.unreadCount > 99
                                          ? "99+"
                                          : channel.unreadCount}
                                      </span>
                                    )}
                                </div>
                              </div>
                            </div>
                          )
                      )}
                      {filteredChannels.filter(
                        (channel: ChannelData) =>
                          channel.type === "web" ||
                          channel.type === "vk" ||
                          channel.type === "avito"
                      ).length === 0 && (
                        <div className="py-4 text-center text-neutral-500 dark:text-neutral-400 text-sm">
                          {channelsSearchQuery.trim()
                            ? "Каналы не найдены"
                            : "Нет доступных каналов"}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </TabsContent>

            <TabsContent value="memory" className="flex-1 p-4">
              <div className="flex flex-col items-center justify-center h-full text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">База памяти</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Здесь будут храниться все исправления и обучающие примеры для
                  ваших ассистентов.
                </p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Будет доступно в ближайших обновлениях.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Область чата */}
        <div className="lg:col-span-3 border rounded-md overflow-hidden">
          {selectedChannelId && selectedDialogId && channelsData ? (
            // Проверяем совместимость канала и типа диалога
            channelsData.find((c) => c.id === selectedChannelId)?.type ===
            selectedDialogType ? (
              selectedDialogType === "vk" ? (
                <VkMessageViewer
                  channelId={selectedChannelId}
                  peerId={selectedDialogId}
                />
              ) : selectedDialogType === "avito" ? (
                <AvitoChatInterface
                  channelId={selectedChannelId}
                  chatId={selectedDialogId.toString()}
                />
              ) : selectedDialogType === "web" ? (
                <WebChatInterface
                  channelId={selectedChannelId}
                  dialogId={selectedDialogId.toString()}
                />
              ) : null
            ) : null
          ) : selectedConversationId ? (
            // Отображаем обычный диалог
            <ChatInterface
              conversationId={selectedConversationId}
              conversationName={getSelectedConversationName()}
              channelType={getSelectedConversationChannel()}
              messages={messages}
              onSendMessage={handleSendMessage}
              onEditMessage={handleEditMessage}
            />
          ) : (
            // Ничего не выбрано
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <Bot className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium text-neutral-900 dark:text-white mb-2">
                Выберите диалог
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400 max-w-md mb-6">
                {selectedChannelId
                  ? "Выберите диалог из списка слева, чтобы начать общение."
                  : "Выберите канал или диалог из списка слева, чтобы начать общение, или создайте новый."}
              </p>
              {!selectedChannelId && (
                <Button onClick={handleNewChat}>
                  <span className="material-icons text-[18px] mr-1">chat</span>
                  <span>Новый диалог</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Диалог исправления/обучения */}
      <MessageTrainingDialog
        open={isEditingMessage}
        onOpenChange={setIsEditingMessage}
        message={selectedMessage}
        previousUserMessage={previousUserMessage}
        assistantName="Ассистент"
        onSuccess={() => {
          toast({
            title: "Успешно",
            description: "Исправление сохранено в базе памяти ассистента",
          });
        }}
      />

      {/* Диалог инструкций */}
      <CommunicationsInstructionsDialog
        open={instructionsDialogOpen}
        onOpenChange={setInstructionsDialogOpen}
      />
    </div>
  );
}
