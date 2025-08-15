import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  LoaderCircle,
  RefreshCcw,
  Link as LinkIcon,
  Unlink,
} from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface WebhookSubscription {
  id: number;
  url: string;
  title: string;
}

interface WebhookSubscriptionProps {
  channelId: number;
}

export function WebhookSubscription({ channelId }: WebhookSubscriptionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Получаем список подписок на вебхуки с опцией отключения кэширования
  const {
    data: webhooks,
    isLoading: isLoadingWebhooks,
    refetch: refetchWebhooks,
  } = useQuery<WebhookSubscription[]>({
    queryKey: [`/api/channels/${channelId}/vk/webhooks`],
    enabled: !!channelId,
    staleTime: 0, // Данные всегда считаются устаревшими, чтобы запрос всегда шел на сервер
    refetchOnMount: true, // Перезапрашиваем данные при монтировании компонента
  });

  // Мутация для создания подписки на вебхук
  const createWebhookMutation = useMutation({
    mutationFn: async () => {
      // Принудительно очищаем кэш перед отправкой запроса
      queryClient.invalidateQueries({
        queryKey: [`/api/channels/${channelId}/vk/webhooks`],
      });

      // Отправляем запрос на создание вебхука, добавляя случайный параметр для предотвращения кэширования
      const timestamp = Date.now();
      return await apiRequest({
        url: `/api/channels/${channelId}/vk/webhooks`,
        method: "POST",
        params: {
          _t: timestamp,
        },
      });
    },
    onSuccess: () => {
      // Обновляем данные в кэше
      queryClient.invalidateQueries({
        queryKey: [`/api/channels/${channelId}/vk/webhooks`],
      });

      // Показываем уведомление
      toast({
        title: "Подписка создана",
        description: "Подписка на события VK успешно создана",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось создать подписку: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Мутация для удаления подписки на вебхук
  const deleteWebhookMutation = useMutation({
    mutationFn: async (serverId: number) => {
      // Сначала инвалидируем кэш
      queryClient.invalidateQueries({
        queryKey: [`/api/channels/${channelId}/vk/webhooks`],
      });

      // Отправляем запрос на удаление с параметром против кэширования
      const timestamp = Date.now();
      return await apiRequest({
        url: `/api/channels/${channelId}/vk/webhooks/${serverId}`,
        method: "DELETE",
        params: {
          _t: timestamp,
        },
      });
    },
    onSuccess: () => {
      // Принудительно обновляем данные в кэше после удаления
      queryClient.removeQueries({
        queryKey: [`/api/channels/${channelId}/vk/webhooks`],
      });

      queryClient.invalidateQueries({
        queryKey: [`/api/channels/${channelId}/vk/webhooks`],
      });

      // Показываем уведомление
      toast({
        title: "Подписка удалена",
        description: "Подписка на события VK успешно удалена",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось удалить подписку: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Обработчик обновления списка подписок
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Сначала сбрасываем кэш для получения актуальных данных с сервера
      queryClient.invalidateQueries({
        queryKey: [`/api/channels/${channelId}/vk/webhooks`],
      });

      await refetchWebhooks();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Обработчик создания подписки
  const handleCreate = async () => {
    // Принудительно инвалидируем кэш перед созданием новой подписки
    queryClient.invalidateQueries({
      queryKey: [`/api/channels/${channelId}/vk/webhooks`],
    });

    await createWebhookMutation.mutateAsync();
  };

  // Обработчик удаления подписки
  const handleDelete = async (serverId: number) => {
    // После удаления нужно принудительно инвалидировать кэш,
    // чтобы при следующем создании запрос шел на сервер без кэширования
    try {
      await deleteWebhookMutation.mutateAsync(serverId);
      // Инвалидируем кэш после удаления
      queryClient.invalidateQueries({
        queryKey: [`/api/channels/${channelId}/vk/webhooks`],
      });
    } catch (error) {
      console.error("Ошибка при удалении вебхука:", error);
    }
  };

  // Обработчик обновления вебхука - удаляет и создает заново
  const handleUpdate = async (serverId: number) => {
    try {
      // 1. Удаляем текущий вебхук
      await deleteWebhookMutation.mutateAsync(serverId);

      // 2. Очищаем кэш
      queryClient.invalidateQueries({
        queryKey: [`/api/channels/${channelId}/vk/webhooks`],
      });

      // 3. Создаем новый вебхук
      await createWebhookMutation.mutateAsync();

      // 4. Показываем сообщение об успехе
      toast({
        title: "Вебхук обновлен",
        description:
          "Подписка на события VK успешно обновлена с актуальным URL",
      });
    } catch (error) {
      console.error("Ошибка при обновлении вебхука:", error);
      toast({
        title: "Ошибка",
        description: `Не удалось обновить вебхук: ${
          error instanceof Error ? error.message : String(error)
        }`,
        variant: "destructive",
      });
    }
  };

  if (isLoadingWebhooks) {
    return (
      <div className="flex items-center justify-center p-4">
        <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
        Загрузка...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-medium">Подписка на события ВКонтакте</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="w-full sm:w-auto"
        >
          {isRefreshing ? (
            <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCcw className="h-4 w-4 mr-2" />
          )}
          Обновить
        </Button>
      </div>

      {!webhooks || webhooks.length === 0 ? (
        <Alert>
          <AlertTitle>Нет активных подписок</AlertTitle>
          <AlertDescription>
            Для автоматического получения новых сообщений из ВКонтакте,
            необходимо настроить подписку на события.
            <div className="mt-2">
              <Button
                onClick={handleCreate}
                disabled={createWebhookMutation.isPending}
                className="w-full sm:w-auto"
              >
                {createWebhookMutation.isPending && (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                )}
                <LinkIcon className="h-4 w-4 mr-2" />
                Создать подписку
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          <Alert>
            <AlertTitle>Активные подписки</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 space-y-2">
                {webhooks.map((webhook) => (
                  <li
                    key={webhook.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 border rounded"
                  >
                    <div className="flex-1 min-w-0 mb-2 sm:mb-0 sm:mr-2">
                      <div className="font-medium truncate">
                        {webhook.title}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground overflow-x-auto break-all sm:break-normal">
                        {webhook.url}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdate(webhook.id)}
                        disabled={
                          createWebhookMutation.isPending ||
                          deleteWebhookMutation.isPending
                        }
                        className="flex-1 sm:flex-none"
                      >
                        {(createWebhookMutation.isPending ||
                          deleteWebhookMutation.isPending) && (
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        <RefreshCcw className="h-4 w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Обновить</span>
                        <span className="sm:hidden">Обн.</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(webhook.id)}
                        disabled={deleteWebhookMutation.isPending}
                        className="flex-1 sm:flex-none"
                      >
                        {deleteWebhookMutation.isPending && (
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        <Unlink className="h-4 w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Удалить</span>
                        <span className="sm:hidden">Удал.</span>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>

          <div className="text-xs sm:text-sm text-muted-foreground">
            <p>Для корректной работы подписки на сообщения, убедитесь, что:</p>
            <ul className="list-disc list-inside mt-1">
              <li>
                Ваше сообщество ВКонтакте имеет активированный доступ через API
              </li>
              <li>Токен имеет необходимые права доступа</li>
              <li>Сервер доступен из интернета по указанному URL</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
