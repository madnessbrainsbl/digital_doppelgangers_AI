import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { LoaderCircle, InfoIcon, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Схема валидации для формы SMS канала
const smsChannelFormSchema = z.object({
  channelName: z.string().min(3, "Название должно содержать минимум 3 символа"),
  email: z.string().email("Введите корректный email"),
  apiKey: z.string().min(3, "API ключ обязателен"),
  sender: z.string().optional(), // Имя отправителя опциональное
});

// Тип на основе схемы валидации
type SmsChannelFormValues = z.infer<typeof smsChannelFormSchema>;

// Интерфейс для канала
interface Channel {
  id: number;
  name: string;
  type: string;
  status: string;
  settings?: {
    email?: string;
    apiKey?: string;
    sender?: string;
    [key: string]: any;
  };
}

// Свойства компонента
interface SmsChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingChannel?: Channel;
}

export function SmsChannelDialog({
  open,
  onOpenChange,
  existingChannel,
}: SmsChannelDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Инициализация формы с начальными значениями
  const form = useForm<SmsChannelFormValues>({
    resolver: zodResolver(smsChannelFormSchema),
    defaultValues: {
      channelName: existingChannel?.name || "SMS рассылка",
      email: existingChannel?.settings?.email || "",
      apiKey: existingChannel?.settings?.apiKey || "",
      sender: existingChannel?.settings?.sender || "",
    },
  });

  // Мутация для создания/обновления канала
  const mutation = useMutation({
    mutationFn: async (data: SmsChannelFormValues) => {
      // Определяем URL и метод в зависимости от того, создаем или обновляем
      const url = existingChannel ? `/api/channels/${existingChannel.id}` : "/api/channels";
      const method = existingChannel ? "PATCH" : "POST";

      // Для отладки - выводим данные формы
      console.log("Отправка данных канала SMS:", data);

      // Подготавливаем данные для отправки
      const channelData = existingChannel ? {
        // Для обновления существующего канала используем вложенную структуру
        name: data.channelName,
        type: "sms",
        status: "active",
        settings: {
          email: data.email,
          apiKey: data.apiKey,
          sender: data.sender || undefined, // Отправляем undefined если пустая строка
        },
      } : {
        // Для создания нового канала просто отправляем плоские данные
        // Обработка будет на сервере в routes.ts
        type: "sms",
        channelName: data.channelName,
        email: data.email,
        apiKey: data.apiKey,
        sender: data.sender || undefined, // Отправляем undefined если пустая строка
      };

      console.log("Подготовленные данные для отправки:", channelData);

      return apiRequest({
        url, 
        method, 
        body: channelData
      });
    },
    onSuccess: async () => {
      // Инвалидируем кеш и показываем уведомление
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      toast({
        title: existingChannel ? "Канал обновлен" : "Канал создан",
        description: existingChannel
          ? "Настройки канала SMS успешно обновлены"
          : "Канал SMS успешно создан",
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

  // Функция для проверки подключения к SMS сервису
  const testConnection = async () => {
    const { email, apiKey, sender } = form.getValues();

    if (!email || !apiKey) {
      setConnectionStatus("error");
      setConnectionError("Для проверки необходимо заполнить Email и API ключ");
      return;
    }

    setTestingConnection(true);
    setConnectionStatus("idle");
    setConnectionError(null);

    try {
      // Обращаемся к API для проверки подключения
      const response = await fetch("/api/channels/test-sms-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          apiKey,
          sender, // Теперь sender может быть пустой строкой или определен
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setConnectionStatus("success");
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
  const onSubmit = async (data: SmsChannelFormValues) => {
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
            {existingChannel ? "Редактирование SMS канала" : "Подключение SMS канала"}
          </DialogTitle>
          <DialogDescription>
            {existingChannel
              ? "Измените настройки SMS канала для отправки сообщений пользователям"
              : "Настройте SMS канал для отправки сообщений пользователям"}
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
                    <Input placeholder="Например: SMS рассылка" {...field} />
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
                      <p className="font-medium">Настройки SMS.AERO</p>
                      <p className="text-muted-foreground">
                        Для отправки SMS необходимо указать данные вашего аккаунта SMS.AERO:
                      </p>
                      <ol className="list-decimal list-inside mt-2 space-y-1 text-muted-foreground">
                        <li>Зарегистрируйтесь на сайте SMS.AERO</li>
                        <li>Получите API ключ в личном кабинете</li>
                        <li>Зарегистрируйте отправителя (имя отправителя)</li>
                      </ol>
                      <div className="mt-2">
                        <a
                          href="https://smsaero.ru"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-primary hover:underline"
                        >
                          Перейти на сайт SMS.AERO <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Ваш email на SMS.AERO" {...field} />
                  </FormControl>
                  <FormDescription>
                    Email, используемый для входа в личный кабинет SMS.AERO
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API ключ</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="API ключ из личного кабинета"
                      {...field}
                      type="password"
                    />
                  </FormControl>
                  <FormDescription>
                    API ключ, полученный в личном кабинете SMS.AERO
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Имя отправителя</FormLabel>
                  <FormControl>
                    <Input placeholder="Например: MyCompany" {...field} />
                  </FormControl>
                  <FormDescription>
                    Зарегистрированное имя отправителя в SMS.AERO. Требует предварительной регистрации в личном кабинете. Если не указано, будет использована подпись по умолчанию.
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
                    Подключение к SMS.AERO успешно установлено! Канал готов к работе.
                  </AlertDescription>
                </Alert>
              )}

              {connectionStatus === "error" && (
                <Alert className="mt-4 border-red-500 bg-red-50 text-red-800">
                  <AlertDescription>
                    {connectionError || "Ошибка при подключении к SMS.AERO. Проверьте данные."}
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