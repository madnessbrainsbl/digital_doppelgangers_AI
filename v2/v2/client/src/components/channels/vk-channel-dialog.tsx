import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
    groupId?: string;
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
import { InfoIcon, LoaderCircle, Settings } from "lucide-react";

// Схема валидации для формы VK
const vkChannelFormSchema = z.object({
  channelName: z.string().min(1, "Название канала обязательно"),
  token: z.string().min(1, "Токен доступа обязателен"),
  groupId: z.string().min(1, "ID сообщества обязателен"),
});

type VkChannelFormValues = z.infer<typeof vkChannelFormSchema>;

interface VkChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingChannel?: Channel;
}

export function VkChannelDialog({
  open,
  onOpenChange,
  existingChannel,
}: VkChannelDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Используем переданный existingChannel, если он есть
  const existingVkChannel = existingChannel;

  // Настройка формы с валидацией
  const form = useForm<VkChannelFormValues>({
    resolver: zodResolver(vkChannelFormSchema),
    defaultValues: {
      channelName: "",
      token: "",
      groupId: "",
    },
  });

  // Загружаем существующие настройки, если канал существует
  useEffect(() => {
    if (existingVkChannel && existingVkChannel.settings) {
      form.reset({
        channelName: existingVkChannel.name || "",
        token: existingVkChannel.settings.token || "",
        groupId: existingVkChannel.settings.groupId || "",
      });
    }
  }, [existingVkChannel, form, open]);

  // Мутация для создания или обновления канала
  const createOrUpdateChannelMutation = useMutation({
    mutationFn: async (values: VkChannelFormValues) => {
      if (!user) {
        throw new Error("Пользователь не авторизован");
      }

      if (existingVkChannel) {
        // Обновляем существующий канал
        return await apiRequest({
          url: `/api/channels/${existingVkChannel.id}`,
          method: "PATCH",
          body: {
            name: values.channelName,
            settings: {
              token: values.token,
              groupId: values.groupId,
            },
          },
        });
      } else {
        // Создаем новый канал
        return await apiRequest({
          url: "/api/channels",
          method: "POST",
          body: {
            name: values.channelName || `ВКонтакте ${values.groupId}`,
            type: "vk",
            status: "active",
            settings: {
              token: values.token,
              groupId: values.groupId,
            },
            createdBy: user.id,
          },
        });
      }
    },
    onSuccess: () => {
      // Инвалидируем кеш каналов для обновления списка
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });

      // Показываем уведомление об успехе
      toast({
        title: existingVkChannel
          ? "Канал успешно обновлен"
          : "Канал успешно подключен",
        description: "Канал ВКонтакте успешно настроен и готов к использованию",
      });

      // Закрываем диалог
      onOpenChange(false);
    },
    onError: (error: Error) => {
      console.error("Ошибка при настройке канала ВКонтакте:", error);
      let errorMessage =
        "Не удалось настроить канал ВКонтакте. Проверьте правильность введенных данных.";

      if (error.message === "Пользователь не авторизован") {
        errorMessage =
          "Для подключения канала требуется авторизация. Пожалуйста, войдите в систему.";
      } else if (error.message.includes("createdBy")) {
        errorMessage =
          "Ошибка с ID пользователя. Пожалуйста, обновите страницу и попробуйте снова.";
      }

      toast({
        title: "Ошибка настройки",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Обработчик отправки формы
  const onSubmit = async (values: VkChannelFormValues) => {
    setIsSubmitting(true);
    try {
      await createOrUpdateChannelMutation.mutateAsync(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {existingVkChannel
              ? "Настройка канала ВКонтакте"
              : "Подключение ВКонтакте"}
          </DialogTitle>
          <DialogDescription>
            Настройте интеграцию с сообществом ВКонтакте для автоматических
            ответов на сообщения
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm">
                  <InfoIcon className="h-4 w-4 text-blue-500" />
                  <span className="text-xs sm:text-sm break-words">
                    Для настройки интеграции вам потребуется создать сообщество
                    ВКонтакте, получить токен доступа в разделе "Настройки" →
                    "Работа с API" и указать ID вашего сообщества.
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="channelName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название канала</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Введите название канала (например, Сообщество Техподдержки)"
                        className="w-full"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs sm:text-sm break-words">
                      Удобное название для идентификации этого канала ВКонтакте
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Токен доступа</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Введите токен доступа к API ВКонтакте"
                        type="password"
                        className="w-full"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs sm:text-sm break-words">
                      Получите токен в настройках сообщества в разделе "Работа с
                      API"
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="groupId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID сообщества</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Введите ID сообщества"
                        className="w-full"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs sm:text-sm break-words">
                      Числовой идентификатор вашего сообщества ВКонтакте
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Alert className="w-full max-w-full">
              <Settings className="h-4 w-4" />
              <AlertDescription className="text-xs sm:text-sm break-words">
                URL для Callback API:{" "}
                <code className="bg-muted px-1 py-0.5 rounded break-all text-xs">
                  {import.meta.env.VITE_PUBLIC_BASE_URL ||
                    window.location.origin}
                  /api/channels/vk/webhook
                </code>
              </AlertDescription>
            </Alert>

            <DialogFooter className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    {existingVkChannel ? "Обновление..." : "Подключение..."}
                  </>
                ) : existingVkChannel ? (
                  "Обновить настройки"
                ) : (
                  "Подключить"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
