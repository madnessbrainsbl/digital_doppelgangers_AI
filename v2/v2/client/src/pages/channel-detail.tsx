import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Settings,
  // MessageSquare, // Временно закомментировано
  ArrowLeft,
  Bot,
  LoaderCircle,
  Trash,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AssistantSelector } from "@/components/assistants/AssistantSelector";
import { VkChannelDialog } from "@/components/channels/vk-channel-dialog";
import { AvitoChannelDialog } from "@/components/channels/avito-channel-dialog";
import { WebChannelDialog } from "@/components/channels/web-channel-dialog";
import { EmailChannelDialog } from "@/components/channels/email-channel-dialog";
import { TelegramChannelDialog } from "@/components/channels/telegram-channel-dialog";
import { SmsChannelDialog } from "@/components/channels/sms-channel-dialog";
import WebWidgetCode from "@/components/channels/WebWidgetCode";
import { WebhookSubscription } from "@/components/vk/webhook-subscription";
import AvitoWebhookSubscription from "@/components/avito/webhook-subscription";
import { WidgetConnectionChecker } from "@/components/channels/WidgetConnectionChecker";

// Тип для канала
interface Channel {
  id: number;
  name: string;
  type: string;
  status: string;
  settings?: {
    token?: string;
    groupId?: string;
    botUsername?: string;
    email?: string;
    apiKey?: string;
    sender?: string;
    [key: string]: any;
  };
  createdAt: string;
}

export default function ChannelDetailPage() {
  const [_, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const channelId = parseInt(params.id);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Загружаем данные о канале
  const {
    data: channel,
    isLoading,
    refetch,
  } = useQuery<Channel>({
    queryKey: [`/api/channels/${channelId}`],
    enabled: !isNaN(channelId),
  });

  // Обновляем данные после закрытия диалога редактирования
  const handleEditDialogChange = (open: boolean) => {
    setEditDialogOpen(open);
    if (!open) {
      // Обновляем данные о канале
      setTimeout(() => {
        refetch();
      }, 500); // добавляем небольшую задержку для обновления данных на сервере
    }
  };

  // Мутация для удаления канала
  const deleteChannelMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest({
        url: `/api/channels/${channelId}`,
        method: "DELETE",
      });
    },
    onSuccess: () => {
      // Инвалидируем кеш каналов для обновления списка
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });

      // Показываем уведомление об успехе
      toast({
        title: "Канал успешно удален",
        description: "Канал и все связанные с ним данные были удалены",
      });

      // Перенаправляем на страницу каналов
      setLocation("/channels");
    },
    onError: (error: Error) => {
      console.error("Ошибка при удалении канала:", error);

      toast({
        title: "Ошибка удаления",
        description:
          "Не удалось удалить канал. Попробуйте позже или обратитесь к администратору.",
        variant: "destructive",
      });

      setIsDeleting(false);
    },
  });

  // Обработчик удаления канала
  const handleDeleteChannel = async () => {
    setIsDeleting(true);
    try {
      await deleteChannelMutation.mutateAsync();
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  // Если ID некорректный, перенаправляем на страницу каналов
  useEffect(() => {
    if (isNaN(channelId)) {
      setLocation("/channels");
    }
  }, [channelId, setLocation]);

  // Функция получения названия типа канала
  const getChannelTypeName = (type: string) => {
    const types: Record<string, string> = {
      vk: "ВКонтакте",
      telegram: "Telegram",
      whatsapp: "WhatsApp",
      website: "Веб-сайт",
      email: "Email",
      phone: "Телефония",
    };
    return types[type] || type;
  };

  // Если данные загружаются
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            className="mr-2 h-8 w-8 p-0"
            onClick={() => setLocation("/channels")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-80" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Если данные о канале не найдены
  if (!channel) {
    return (
      <div className="container mx-auto px-4 py-6">
        <PageHeader
          title="Канал не найден"
          description="Запрошенный канал не существует или был удален"
          actions={
            <Button onClick={() => setLocation("/channels")}>
              <ArrowLeft className="h-4 w-4 mr-2" />К списку каналов
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <PageHeader
          title={`Канал: ${channel.name}`}
          description={`Управление каналом связи ${getChannelTypeName(
            channel.type
          )}`}
          actions={
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setLocation("/channels")}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад
              </Button>
              <Button
                onClick={() => handleEditDialogChange(true)}
                className="w-full sm:w-auto"
              >
                <Settings className="h-4 w-4 mr-2" />
                Настройки
              </Button>
            </div>
          }
        />
      </div>

      <div className="mt-6">
        <Tabs defaultValue="assistant" className="w-full">
          <TabsList className="mb-4 w-full flex overflow-x-auto">
            <TabsTrigger value="assistant" className="flex-1">
              <Bot className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Ассистент</span>
              <span className="sm:hidden">Асс.</span>
            </TabsTrigger>
            {/* Временно закомментировано
            <TabsTrigger value="dialogs" className="flex-1">
              <MessageSquare className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Диалоги</span>
              <span className="sm:hidden">Диал.</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1">
              <Users className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Пользователи</span>
              <span className="sm:hidden">Польз.</span>
            </TabsTrigger>
            */}
          </TabsList>

          <TabsContent value="assistant">
            <div className="grid gap-6">
              {/* Для Email и SMS каналов не показываем блок подключения ассистента */}
              {channel.type !== "email" && channel.type !== "sms" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Подключение ассистента</CardTitle>
                    <CardDescription>
                      Настройте автоматические ответы на сообщения с помощью
                      виртуального ассистента
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AssistantSelector channelId={channelId} />
                  </CardContent>
                </Card>
              )}

              {/* Компонент для управления подпиской на вебхуки (для VK и Avito) */}
              {channel.type === "vk" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Подписка на уведомления</CardTitle>
                    <CardDescription>
                      Настройте получение уведомлений о новых сообщениях через
                      Callback API ВКонтакте
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <WebhookSubscription channelId={channelId} />
                  </CardContent>
                </Card>
              )}

              {/* Компонент для управления подпиской на вебхуки Авито */}
              {channel.type === "avito" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Подписка на уведомления</CardTitle>
                    <CardDescription>
                      Настройте получение уведомлений о новых сообщениях через
                      API Авито
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AvitoWebhookSubscription channelId={channelId} />
                  </CardContent>
                </Card>
              )}

              {/* Компонент для кода встраивания веб-виджета */}
              {channel.type === "web" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Код для вставки на сайт</CardTitle>
                    <CardDescription>
                      Скопируйте этот код и разместите его на вашем сайте перед
                      закрывающим тегом &lt;/body&gt;
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <WebWidgetCode channelId={channelId} />
                  </CardContent>
                </Card>
              )}

              {/* Блок проверки подключения чат-виджета */}
              {channel.type === "web" && (
                <WidgetConnectionChecker channelId={channelId} />
              )}
            </div>
          </TabsContent>

          {/* Временно закомментировано
          <TabsContent value="dialogs">
            <Card>
              <CardHeader>
                <CardTitle>Диалоги</CardTitle>
                <CardDescription>
                  Список диалогов в этом канале связи
                </CardDescription>
              </CardHeader>
              <CardContent>
                {channel.type === "vk" ? (
                  <div className="grid gap-4">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setLocation(`/channels/${channelId}/vk-dialogs`)
                      }
                      className="w-full sm:w-auto"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Открыть диалоги ВКонтакте
                    </Button>
                  </div>
                ) : channel.type === "avito" ? (
                  <div className="grid gap-4">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setLocation(`/channels/${channelId}/avito-dialogs`)
                      }
                      className="w-full sm:w-auto"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Открыть диалоги Авито
                    </Button>
                  </div>
                ) : channel.type === "web" ? (
                  <div className="grid gap-4">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setLocation(`/channels/${channelId}/web-dialogs`)
                      }
                      className="w-full sm:w-auto"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Открыть диалоги веб-сайта
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    Диалоги для данного типа канала пока недоступны
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Пользователи</CardTitle>
                <CardDescription>
                  Пользователи, взаимодействующие с вами через этот канал
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6 text-muted-foreground">
                  Список пользователей пока недоступен
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          */}
        </Tabs>
      </div>

      {/* Диалог редактирования настроек канала */}
      {channel.type === "vk" && (
        <VkChannelDialog
          open={editDialogOpen}
          onOpenChange={handleEditDialogChange}
          existingChannel={channel}
        />
      )}

      {/* Диалог редактирования настроек канала Авито */}
      {channel.type === "avito" && (
        <AvitoChannelDialog
          open={editDialogOpen}
          onOpenChange={handleEditDialogChange}
          existingChannel={channel as any}
        />
      )}

      {/* Диалог редактирования настроек веб-канала */}
      {channel.type === "web" && (
        <WebChannelDialog
          open={editDialogOpen}
          onOpenChange={handleEditDialogChange}
          existingChannel={{
            id: channel.id,
            name: channel.name,
            type: channel.type,
            status: channel.status,
            settings: channel.settings as any,
          }}
        />
      )}

      {/* Диалог редактирования настроек канала Email */}
      {channel.type === "email" && (
        <EmailChannelDialog
          open={editDialogOpen}
          onOpenChange={handleEditDialogChange}
          existingChannel={{
            id: channel.id,
            name: channel.name,
            type: channel.type,
            status: channel.status,
            settings: channel.settings as any,
          }}
        />
      )}

      {/* Диалог редактирования настроек канала Telegram */}
      {channel.type === "telegram" && (
        <TelegramChannelDialog
          open={editDialogOpen}
          onOpenChange={handleEditDialogChange}
          existingChannel={{
            id: channel.id,
            name: channel.name,
            type: channel.type,
            status: channel.status,
            settings: channel.settings as any,
          }}
        />
      )}

      {/* Диалог редактирования настроек канала SMS */}
      {channel.type === "sms" && (
        <SmsChannelDialog
          open={editDialogOpen}
          onOpenChange={handleEditDialogChange}
          existingChannel={{
            id: channel.id,
            name: channel.name,
            type: channel.type,
            status: channel.status,
            settings: channel.settings as any,
          }}
        />
      )}

      {/* Карточка для управления каналом (включая удаление) */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Управление каналом</CardTitle>
          <CardDescription>Дополнительные действия с каналом</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-red-600 mb-2">
                Опасная зона
              </h3>
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>
                  Удаление канала приведет к потере всех связанных с ним данных,
                  включая историю диалогов. Это действие нельзя отменить.
                </AlertDescription>
              </Alert>
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                className="w-full sm:w-auto"
              >
                <Trash className="h-4 w-4 mr-2" />
                Удалить канал
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Диалог подтверждения удаления канала */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Удаление канала</DialogTitle>
            <DialogDescription>
              Вы действительно хотите удалить канал "{channel.name}"? Это
              действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>
                При удалении канала будут удалены все связанные с ним данные,
                включая историю диалогов и настройки.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteChannel}
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              {isDeleting ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Удаление...
                </>
              ) : (
                "Удалить"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
