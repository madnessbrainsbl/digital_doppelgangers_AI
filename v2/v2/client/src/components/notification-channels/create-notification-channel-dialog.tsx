import { useState } from "react";
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
import { Label } from "@/components/ui/label";
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
  settings: z.union([
    telegramConfigSchema,
    emailConfigSchema,
    webhookConfigSchema,
  ]),
});

// Тип для формы
type FormValues = {
  name: string;
  type: "telegram" | "email" | "webhook";
  status: "active" | "inactive";
  settings: Record<string, any>;
};

interface CreateNotificationChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateNotificationChannelDialog({
  open,
  onOpenChange,
}: CreateNotificationChannelDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Форма с валидацией
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "telegram",
      status: "active",
      settings: {
        botToken: "",
        chatId: "",
      },
    },
  });

  // Получаем текущий тип канала
  const channelType = form.watch("type");

  // Обновляем settings при изменении типа
  const onTypeChange = (type: "telegram" | "email" | "webhook") => {
    form.setValue("type", type);

    // Обновляем структуру settings в зависимости от типа
    if (type === "telegram") {
      form.setValue("settings", { botToken: "", chatId: "" });
    } else if (type === "email") {
      form.setValue("settings", { email: "", subject: "Новое оповещение" });
    } else if (type === "webhook") {
      form.setValue("settings", { url: "", headers: {} });
    }
  };

  // Сброс формы при закрытии
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
    }
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
        settings: data.settings,
      };

      const response = await fetch("/api/notification-channels", {
        method: "POST",
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
          title: "Канал создан",
          description: "Канал оповещений успешно создан",
        });

        handleOpenChange(false);
      } else {
        const error = await response.json();
        throw new Error(error.message || "Ошибка при создании канала");
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description:
          error instanceof Error
            ? error.message
            : "Не удалось создать канал оповещений",
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
          <DialogTitle>Создать канал оповещений</DialogTitle>
          <DialogDescription>
            Создайте канал для отправки данных, полученных с помощью функций
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
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тип канала</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      onTypeChange(value as "telegram" | "email" | "webhook")
                    }
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тип канала" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="telegram">Telegram</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="webhook" disabled>
                        Webhook
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Способ отправки оповещений и данных
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
                  name="settings.botToken"
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
                  name="settings.chatId"
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
                  name="settings.email"
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
                  name="settings.subject"
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
                  name="settings.url"
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

            <DialogFooter className="gap-1 sm:gap-0">
              <Button
                variant="outline"
                type="button"
                onClick={() => handleOpenChange(false)}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={
                  isLoading ||
                  !form.formState.isValid ||
                  form.getValues("name").length < 2
                }
              >
                {isLoading ? "Создание..." : "Создать канал"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
