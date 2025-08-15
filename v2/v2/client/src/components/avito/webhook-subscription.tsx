import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, CheckCircle, AlertCircle, LoaderCircle, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Интерфейс для данных о подписке на вебхуки Avito
interface WebhookSubscription {
  id: number;
  url: string;
  title: string;
}

interface AvitoWebhookSubscriptionProps {
  channelId: number;
}

export default function AvitoWebhookSubscription({ channelId }: AvitoWebhookSubscriptionProps) {
  const [baseUrl, setBaseUrl] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Получаем текущий домен для формирования URL вебхука
  useEffect(() => {
    const url = new URL(window.location.href);
    setBaseUrl(`${url.protocol}//${url.host}`);
  }, []);

  // Формируем URL вебхука на основе базового URL и идентификатора канала
  useEffect(() => {
    if (baseUrl) {
      setWebhookUrl(`${baseUrl}/api/channels/avito/webhook/${channelId}`);
    }
  }, [baseUrl, channelId]);

  // Запрос на получение информации о подписке на вебхуки
  const { data: webhookSubscriptions, isLoading, refetch } = useQuery<WebhookSubscription[]>({
    queryKey: [`/api/channels/${channelId}/avito/webhooks`],
    enabled: !!channelId,
  });

  // Мутация для создания подписки на вебхуки
  const createSubscriptionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest({
        url: `/api/channels/${channelId}/avito/webhooks`,
        method: "POST",
      });
    },
    onSuccess: () => {
      // При успешном создании обновляем данные
      queryClient.invalidateQueries({ queryKey: [`/api/channels/${channelId}/avito/webhooks`] });
      toast({
        title: "Подписка создана",
        description: "Подписка на уведомления Авито успешно создана",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось создать подписку: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Мутация для удаления подписки на вебхуки
  const deleteSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: number) => {
      return await apiRequest({
        url: `/api/channels/${channelId}/avito/webhooks/${subscriptionId}`,
        method: "DELETE",
      });
    },
    onSuccess: () => {
      // При успешном удалении обновляем данные
      queryClient.invalidateQueries({ queryKey: [`/api/channels/${channelId}/avito/webhooks`] });
      toast({
        title: "Подписка удалена",
        description: "Подписка на уведомления Авито успешно удалена",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось удалить подписку: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Функция для копирования URL вебхука в буфер обмена
  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
          title: "URL скопирован",
          description: "URL вебхука скопирован в буфер обмена",
        });
      },
      (err) => {
        console.error("Не удалось скопировать URL", err);
        toast({
          title: "Ошибка",
          description: "Не удалось скопировать URL",
          variant: "destructive",
        });
      }
    );
  };

  // Создание новой подписки
  const handleCreateSubscription = async () => {
    try {
      await createSubscriptionMutation.mutateAsync();
    } catch (error) {
      console.error("Ошибка при создании подписки", error);
    }
  };

  // Удаление подписки
  const handleDeleteSubscription = async (subscriptionId: number) => {
    try {
      await deleteSubscriptionMutation.mutateAsync(subscriptionId);
    } catch (error) {
      console.error("Ошибка при удалении подписки", error);
    }
  };

  // Обновление списка подписок
  const refreshSubscriptions = async () => {
    try {
      await refetch();
    } catch (error) {
      console.error("Ошибка при обновлении списка подписок", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить список подписок",
        variant: "destructive",
      });
    }
  };

  // Если идет загрузка данных
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  // Проверяем, есть ли активная подписка
  const hasActiveSubscription = webhookSubscriptions && webhookSubscriptions.length > 0;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-medium">URL для подписки</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshSubscriptions}
            className="h-7 px-2 py-1"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex space-x-2">
          <Input
            value={webhookUrl}
            readOnly
            className="font-mono text-sm"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={copyWebhookUrl}
            className="shrink-0"
          >
            {copied ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Этот URL необходимо указать при настройке уведомлений в API Авито.
        </p>
      </div>

      {hasActiveSubscription ? (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Активные подписки</h3>
          <div className="space-y-4">
            {webhookSubscriptions && webhookSubscriptions.map((subscription) => (
              <Card key={subscription.id}>
                <CardHeader className="py-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base">Подписка #{subscription.id}</CardTitle>
                    <div className="flex items-center text-green-500">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span className="text-sm">Активна</span>
                    </div>
                  </div>
                  <CardDescription>
                    {subscription.title || "Вебхук Авито"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-0">
                  <div className="space-y-2">
                    <div>
                      <Label className="text-sm text-neutral-500">URL вебхука</Label>
                      <div className="text-sm font-mono break-all">{subscription.url}</div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 pb-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteSubscription(subscription.id)}
                    disabled={deleteSubscriptionMutation.isPending}
                  >
                    {deleteSubscriptionMutation.isPending && subscription.id === deleteSubscriptionMutation.variables ? (
                      <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Удалить подписку
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Alert variant="default" className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              У этого канала нет активных подписок на уведомления. Создайте подписку для получения сообщений от пользователей.
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleCreateSubscription}
            disabled={createSubscriptionMutation.isPending}
          >
            {createSubscriptionMutation.isPending ? (
              <>
                <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                Создание подписки...
              </>
            ) : (
              "Создать подписку на уведомления"
            )}
          </Button>
        </div>
      )}

      <div className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
        <p className="mb-2">
          <strong>Важно:</strong> После создания подписки необходимо настроить вебхуки в личном кабинете Авито.
        </p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Войдите в личный кабинет Авито</li>
          <li>Перейдите в настройки API</li>
          <li>Укажите URL вебхука, указанный выше</li>
          <li>Выберите события, на которые хотите подписаться</li>
          <li>Сохраните настройки</li>
        </ol>
      </div>
    </div>
  );
}