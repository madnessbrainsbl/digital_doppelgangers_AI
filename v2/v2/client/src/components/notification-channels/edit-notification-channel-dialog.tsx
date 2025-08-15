import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Схема валидации для Telegram
const telegramConfigSchema = z.object({
  botToken: z.string().min(1, "Токен бота обязателен"),
  chatId: z.string().min(1, "ID чата обязателен"),
});

// Схема валидации для Email
const emailConfigSchema = z.object({
  email: z.string().email("Введите корректный email"),
  subject: z.string().optional(),
});

// Схема валидации для Webhook
const webhookConfigSchema = z.object({
  url: z.string().url("Введите корректный URL"),
  headers: z.record(z.string()).optional(),
});

// Основная схема валидации
const formSchema = z.object({
  name: z.string().min(3, "Название должно содержать не менее 3 символов"),
  type: z.enum(["telegram", "email", "webhook"]),
  status: z.enum(["active", "inactive"]).default("active"),
  config: z.union([
    telegramConfigSchema,
    emailConfigSchema,
    webhookConfigSchema,
  ]),
});

// Тип для формы
type FormValues = z.infer<typeof formSchema>;

interface NotificationChannel {
  id: number;
  name: string;
  type: string;
  status: string;
  config?: Record<string, any>; // Обратите внимание: мы получаем из API "config", но отправляем "settings"
  settings?: Record<string, any>;
  createdAt?: string;
  createdBy: number;
}

interface EditNotificationChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: NotificationChannel;
}

export function EditNotificationChannelDialog({
  open,
  onOpenChange,
  channel,
}: EditNotificationChannelDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Инициализируем значения конфигурации с пустыми значениями по умолчанию
  const getInitialConfig = () => {
    // Получаем данные конфигурации из config или settings в зависимости от того, что доступно
    const configData = channel.config || channel.settings || {};
    if (!configData) return {};

    // Преобразуем в объект с явно указанными полями, чтобы избежать undefined значений
    const config: Record<string, any> = {};

    if (channel.type === "telegram") {
      config.botToken = configData.botToken || "";
      config.chatId = configData.chatId || "";
    } else if (channel.type === "email") {
      config.email = configData.email || "";
      config.subject = configData.subject || "";
    } else if (channel.type === "webhook") {
      config.url = configData.url || "";
      config.headers = configData.headers || {};
    }

    return config;
  };

  // Форма с валидацией и начальными значениями
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: channel.name || "",
      type: (channel.type as "telegram" | "email" | "webhook") || "telegram",
      status: (channel.status as "active" | "inactive") || "active",
      config: getInitialConfig(),
    },
  });

  // Обновляем форму при изменении данных канала
  useEffect(() => {
    if (channel) {
      form.reset({
        name: channel.name || "",
        type: (channel.type as "telegram" | "email" | "webhook") || "telegram",
        status: (channel.status as "active" | "inactive") || "active",
        config: getInitialConfig(),
      });
    }
  }, [channel]);

  // Получаем текущий тип канала
  const channelType = form.watch("type");

  // Сброс формы при закрытии
  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
  };

  // Отправка формы
  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      const channelData = {
        name: data.name,
        type: data.type,
        status: data.status,
        settings: data.config, // API ожидает поле settings, а не config
      };

      const response = await fetch(`/api/notification-channels/${channel.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(channelData),
      });

      if (response.ok) {
        // Обновляем список каналов
        queryClient.invalidateQueries({
          queryKey: ["/api/notification-channels"],
        });

        toast({
          title: "Канал обновлен",
          description: "Канал оповещений успешно обновлен",
        });

        handleOpenChange(false);
      } else {
        const error = await response.json();
        throw new Error(error.message || "Ошибка при обновлении канала");
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description:
          error instanceof Error
            ? error.message
            : "Не удалось обновить канал оповещений",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Редактировать канал оповещений</DialogTitle>
          <DialogDescription>
            Измените настройки канала для отправки данных
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название канала</FormLabel>
                  <FormControl>
                    <Input placeholder="Мой Telegram бот" {...field} />
                  </FormControl>
                  <FormDescription>
                    Понятное название, которое поможет идентифицировать канал
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Статус</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите статус" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Активен</SelectItem>
                      <SelectItem value="inactive">Отключен</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Активные каналы будут получать оповещения от функций
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Поля настроек в зависимости от типа канала */}
            {channelType === "telegram" && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="config.botToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Токен бота</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="1234567890:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Токен бота, полученный от @BotFather
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="config.chatId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID чата</FormLabel>
                      <FormControl>
                        <Input placeholder="-1001234567890" {...field} />
                      </FormControl>
                      <FormDescription>
                        ID чата или канала, куда будут отправляться сообщения
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {channelType === "email" && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="config.email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="example@example.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        Email-адрес для получения оповещений
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="config.subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Тема письма</FormLabel>
                      <FormControl>
                        <Input placeholder="Новое оповещение" {...field} />
                      </FormControl>
                      <FormDescription>
                        Стандартная тема писем (можно изменить в настройках
                        функций)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {channelType === "webhook" && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="config.url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/webhook"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        URL для отправки HTTP запросов с данными
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <DialogFooter className="grid grid-cols-1 gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Сохранение..." : "Сохранить изменения"}
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => handleOpenChange(false)}
              >
                Отмена
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
