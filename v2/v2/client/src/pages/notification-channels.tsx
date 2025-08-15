import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, Plus, Bell, Book } from "lucide-react";
import { CreateNotificationChannelDialog } from "@/components/notification-channels/create-notification-channel-dialog";
import { CreateOpenAiFunctionDialog } from "@/components/notification-channels/create-openai-function-dialog";
import { EditNotificationChannelDialog } from "@/components/notification-channels/edit-notification-channel-dialog";
import { EditOpenAiFunctionDialog } from "@/components/notification-channels/edit-openai-function-dialog";
import { NotificationChannelCard } from "@/components/notification-channels/notification-channel-card";
import NotificationChannelsInstructionsDialog from "@/components/notification-channels/notification-channels-instructions-dialog";
import { useAuth } from "@/contexts/AuthContext";

// Типы для данных
interface NotificationChannel {
  id: number;
  name: string;
  type: string;
  status: string;
  settings: Record<string, any>;
  createdAt?: string;
  createdBy: number;
}

interface OpenAiFunction {
  id: number;
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
  channelId?: number; // ID канала, к которому привязана функция
  createdAt?: string;
  createdBy: number;
}

export default function NotificationChannels() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [_, setLocation] = useLocation();
  const { user } = useAuth();

  // Состояние для фильтрации каналов (для админа)
  const [channelFilter, setChannelFilter] = useState<"my" | "all">("my");

  // Состояния для диалогов
  const [createChannelDialogOpen, setCreateChannelDialogOpen] = useState(false);
  const [createFunctionDialogOpen, setCreateFunctionDialogOpen] =
    useState(false);
  const [editChannelDialogOpen, setEditChannelDialogOpen] = useState(false);
  const [editFunctionDialogOpen, setEditFunctionDialogOpen] = useState(false);
  const [editFunctionSuccess, setEditFunctionSuccess] = useState(true);
  const [instructionsDialogOpen, setInstructionsDialogOpen] = useState(false);

  // Выбранные элементы для редактирования
  const [selectedChannel, setSelectedChannel] =
    useState<NotificationChannel | null>(null);
  const [selectedFunction, setSelectedFunction] =
    useState<OpenAiFunction | null>(null);
  const [selectedChannelForFunction, setSelectedChannelForFunction] = useState<
    number | null
  >(null);

  // Запрос на получение каналов уведомлений
  const { data: channels, isLoading: isLoadingChannels } = useQuery<
    NotificationChannel[]
  >({
    queryKey: ["/api/notification-channels"],
  });

  // Запрос на получение OpenAI функций
  const { data: functions, isLoading: isLoadingFunctions } = useQuery<
    OpenAiFunction[]
  >({
    queryKey: ["/api/openai-functions"],
  });

  // Фильтрация каналов в зависимости от выбранного фильтра
  const filteredChannels = channels?.filter((channel) => {
    // Если не админ или выбран фильтр "мои" - показываем только каналы текущего пользователя
    if (!user?.role || channelFilter === "my") {
      return channel.createdBy === user?.id;
    }
    // Для админа с фильтром "все" показываем все каналы
    return true;
  });

  // Обработчик удаления канала
  const handleDeleteChannel = async (channelId: number) => {
    try {
      const response = await fetch(`/api/notification-channels/${channelId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Канал удален",
          description: "Канал оповещений успешно удален",
        });

        // Обновляем кэш запросов
        queryClient.invalidateQueries({
          queryKey: ["/api/notification-channels"],
        });
        queryClient.invalidateQueries({ queryKey: ["/api/openai-functions"] });
      } else {
        const error = await response.json();
        throw new Error(error.message || "Ошибка при удалении канала");
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description:
          error instanceof Error
            ? error.message
            : "Не удалось удалить канал оповещений",
        variant: "destructive",
      });
    }
  };

  // Обработчик удаления функции
  const handleDeleteFunction = async (functionId: number) => {
    try {
      const response = await fetch(`/api/openai-functions/${functionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Функция удалена",
          description: "OpenAI функция успешно удалена",
        });

        // Обновляем кэш запросов
        queryClient.invalidateQueries({ queryKey: ["/api/openai-functions"] });
      } else {
        const error = await response.json();
        throw new Error(error.message || "Ошибка при удалении функции");
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description:
          error instanceof Error
            ? error.message
            : "Не удалось удалить OpenAI функцию",
        variant: "destructive",
      });
    }
  };

  // Обработчик выбора канала для редактирования
  const handleEditChannel = (channel: NotificationChannel) => {
    setSelectedChannel(channel);
    setEditChannelDialogOpen(true);
  };

  // Обработчик выбора функции для редактирования
  const handleEditFunction = (
    func: OpenAiFunction,
    editFunctionSuccess: boolean
  ) => {
    setSelectedFunction(func);
    setEditFunctionDialogOpen(true);
    setEditFunctionSuccess(editFunctionSuccess);
  };

  // Обработчик открытия диалога создания функции для конкретного канала
  const handleCreateFunctionForChannel = (channelId: number) => {
    setSelectedChannelForFunction(channelId);
    setCreateFunctionDialogOpen(true);
  };

  // Получение функций для конкретного канала
  const getFunctionsForChannel = (channelId: number) => {
    if (!functions) return [];
    return functions.filter((func) => func.channelId === channelId);
  };

  // Определение статуса загрузки
  const isLoading = isLoadingChannels || isLoadingFunctions;

  return (
    <div className="px-4 sm:px-6">
      {/* Кастомный заголовок с кнопкой инструкций */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-2xl font-bold">Каналы оповещений</h1>
            <p className="text-muted-foreground">
              Создание и настройка каналов оповещений для функций ИИ
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setInstructionsDialogOpen(true)}
            title="Инструкция по работе с каналами оповещений"
            className="bg-purple-200 hover:bg-purple-300"
          >
            <Book className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {user?.role === "admin" && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground text-red-400">
            Ты авторизован как администратор, поэтому можешь просматривать и
            редактировать все каналы и функции, не кодключенные к ассистентам.
          </p>
          <p className="text-sm text-muted-foreground text-red-400">
            Твой id: {user?.id}
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <div className="flex flex-col items-center gap-2">
            <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Загрузка данных...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Кнопка для создания нового канала */}
          <div className="flex">
            <Button
              onClick={() => setCreateChannelDialogOpen(true)}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 flex-shrink-0" />
              <span className="whitespace-nowrap">
                Создать канал оповещений
              </span>
            </Button>
          </div>

          {/* Каналы оповещений */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Каналы оповещений</h2>
            {user?.role === "admin" && (
              <div className="flex flex-wrap gap-2 mb-4 items-end">
                <Button
                  variant={channelFilter === "my" ? "default" : "outline"}
                  onClick={() => setChannelFilter("my")}
                  className="flex-1 sm:flex-none"
                  size="sm"
                >
                  Мои
                </Button>
                <Button
                  variant={channelFilter === "all" ? "default" : "outline"}
                  onClick={() => setChannelFilter("all")}
                  className="flex-1 sm:flex-none"
                  size="sm"
                >
                  Все
                </Button>
                <p className="text-xs text-muted-foreground w-full sm:w-auto">
                  Фильтр только для админа
                </p>
              </div>
            )}
            {filteredChannels && filteredChannels.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {filteredChannels.map((channel) => (
                  <NotificationChannelCard
                    key={channel.id}
                    channel={channel}
                    channelFunctions={getFunctionsForChannel(channel.id)}
                    onEditChannel={handleEditChannel}
                    onEditFunction={handleEditFunction}
                    onCreateFunction={handleCreateFunctionForChannel}
                    onDeleteChannel={handleDeleteChannel}
                    onDeleteFunction={handleDeleteFunction}
                    createdUserId={channel.createdBy}
                    userRole={user?.role}
                    currentUserId={user?.id}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/20 rounded-lg">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Нет настроенных каналов
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6 px-4">
                  Создайте канал оповещений для отправки данных в Telegram или
                  на email
                </p>
                <Button
                  onClick={() => setCreateChannelDialogOpen(true)}
                  className="w-full sm:w-auto max-w-xs mx-auto"
                >
                  <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Создать канал</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Диалоги для создания и редактирования */}
      <CreateNotificationChannelDialog
        open={createChannelDialogOpen}
        onOpenChange={setCreateChannelDialogOpen}
      />

      <CreateOpenAiFunctionDialog
        open={createFunctionDialogOpen}
        onOpenChange={setCreateFunctionDialogOpen}
        channelId={selectedChannelForFunction}
        onCreated={() => setSelectedChannelForFunction(null)}
      />

      {selectedChannel && (
        <EditNotificationChannelDialog
          open={editChannelDialogOpen}
          onOpenChange={setEditChannelDialogOpen}
          channel={selectedChannel}
        />
      )}

      {selectedFunction && (
        <EditOpenAiFunctionDialog
          open={editFunctionDialogOpen}
          onOpenChange={setEditFunctionDialogOpen}
          func={selectedFunction}
          editFunctionSuccess={editFunctionSuccess}
        />
      )}

      {/* Dialog for instructions */}
      <NotificationChannelsInstructionsDialog
        open={instructionsDialogOpen}
        onOpenChange={setInstructionsDialogOpen}
      />
    </div>
  );
}
