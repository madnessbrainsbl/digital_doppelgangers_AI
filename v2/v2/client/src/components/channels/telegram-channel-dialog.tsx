import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// Тип для канала
interface Channel {
  id: number;
  name: string;
  type: string;
  status: string;
  settings?: {
    token?: string;
    botUsername?: string;
  };
}

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { InfoIcon, LoaderCircle, ExternalLink } from "lucide-react";

// Схема валидации для формы Telegram
const telegramChannelFormSchema = z.object({
  channelName: z.string().min(1, "Название канала обязательно"),
  token: z.string().min(1, "Токен бота обязателен"),
  botUsername: z.string().min(1, "Имя пользователя бота обязательно"),
});

type TelegramChannelFormValues = z.infer<typeof telegramChannelFormSchema>;

export function TelegramChannelDialog({
  open,
  onOpenChange,
  existingChannel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingChannel?: Channel;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Инициализируем форму
  const form = useForm<TelegramChannelFormValues>({
    resolver: zodResolver(telegramChannelFormSchema),
    defaultValues: {
      channelName: existingChannel?.name || "Telegram",
      token: existingChannel?.settings?.token || "",
      botUsername: existingChannel?.settings?.botUsername || "",
    },
  });

  // Мутация для создания/обновления канала
  const mutation = useMutation({
    mutationFn: async (data: TelegramChannelFormValues) => {
      // Определяем URL и метод в зависимости от того, создаем или обновляем
      const url = existingChannel ? `/api/channels/${existingChannel.id}` : "/api/channels";
      const method = existingChannel ? "PATCH" : "POST";

      // Подготавливаем данные для отправки
      const channelData = {
        name: data.channelName,
        type: "telegram",
        status: "active",
        settings: {
          token: data.token,
          botUsername: data.botUsername,
        },
      };

      return apiRequest({
        url, 
        method, 
        body: channelData
      } as any);
    },
    onSuccess: async () => {
      // Инвалидируем кеш и показываем уведомление
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      toast({
        title: existingChannel ? "Канал обновлен" : "Канал создан",
        description: existingChannel
          ? "Настройки канала Telegram успешно обновлены"
          : "Канал Telegram успешно создан",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: `Не удалось ${existingChannel ? "обновить" : "создать"} канал: ${
          error?.message || "Неизвестная ошибка"
        }`,
        variant: "destructive",
      });
    },
  });

  // Функция для проверки подключения к Telegram
  const testConnection = async () => {
    const { token, botUsername } = form.getValues();

    if (!token || !botUsername) {
      setConnectionStatus("error");
      setConnectionError("Для проверки заполните токен и имя пользователя бота");
      return;
    }

    setTestingConnection(true);
    setConnectionStatus("idle");
    setConnectionError(null);

    try {
      // Обращаемся к API для проверки подключения
      const response = await fetch("/api/channels/test-telegram-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          botUsername,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setConnectionStatus("success");
        // Если успешно, можно автоматически заполнить некоторые поля из ответа при необходимости
      } else {
        setConnectionStatus("error");
        setConnectionError(data.message || "Не удалось выполнить проверку");
      }
    } catch (error: any) {
      setConnectionStatus("error");
      setConnectionError(error?.message || "Ошибка при проверке подключения");
    } finally {
      setTestingConnection(false);
    }
  };

  // Обработчик отправки формы
  const onSubmit = async (data: TelegramChannelFormValues) => {
    setIsSubmitting(true);
    try {
      await mutation.mutateAsync(data);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingChannel ? "Редактирование канала Telegram" : "Подключение Telegram"}
          </DialogTitle>
          <DialogDescription>
            {existingChannel
              ? "Измените настройки канала Telegram для взаимодействия с пользователями"
              : "Настройте канал Telegram для автоматической обработки сообщений"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="channelName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название канала</FormLabel>
                  <FormControl>
                    <Input placeholder="Например: Telegram Поддержка" {...field} />
                  </FormControl>
                  <FormDescription>
                    Внутреннее название канала для удобной идентификации
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    <InfoIcon className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium">Создание Telegram бота</p>
                      <p className="text-muted-foreground">
                        Для подключения Telegram необходимо создать бота через BotFather:
                      </p>
                      <ol className="list-decimal list-inside mt-2 space-y-1 text-muted-foreground">
                        <li>Откройте Telegram и найдите @BotFather</li>
                        <li>Отправьте команду /newbot</li>
                        <li>Следуйте инструкциям для создания бота</li>
                        <li>Получите токен бота и скопируйте его</li>
                      </ol>
                      <div className="mt-2">
                        <a
                          href="https://t.me/botfather"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-primary hover:underline"
                        >
                          Открыть BotFather <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <FormField
              control={form.control}
              name="token"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Токен бота</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Например: 1234567890:AAFEASx_dQVZmXcZ0RbPXPM5QNNfxT..."
                      {...field}
                      type="password"
                    />
                  </FormControl>
                  <FormDescription>
                    Токен, полученный от BotFather после создания бота
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="botUsername"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Имя пользователя бота</FormLabel>
                  <FormControl>
                    <Input placeholder="Например: my_support_bot" {...field} />
                  </FormControl>
                  <FormDescription>
                    Имя пользователя вашего бота (без символа @)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={testConnection}
                disabled={testingConnection}
              >
                {testingConnection ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Проверка подключения...
                  </>
                ) : (
                  "Проверить подключение"
                )}
              </Button>

              {connectionStatus === "success" && (
                <Alert className="mt-4 border-green-500 bg-green-50 text-green-800">
                  <AlertDescription>
                    Подключение к Telegram успешно установлено! Бот готов к работе.
                  </AlertDescription>
                </Alert>
              )}

              {connectionStatus === "error" && (
                <Alert className="mt-4 border-red-500 bg-red-50 text-red-800">
                  <AlertDescription>
                    {connectionError || "Ошибка при подключении к Telegram. Проверьте токен бота."}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                {existingChannel ? "Сохранить" : "Создать"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}