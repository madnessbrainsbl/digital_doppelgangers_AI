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
import { InfoIcon, LoaderCircle, Settings, ExternalLink } from "lucide-react";

// Схема валидации для формы VK
const vkChannelFormSchema = z.object({
  token: z.string().min(1, "Токен доступа обязателен"),
  groupId: z.string().min(1, "ID сообщества обязателен"),
});

type VkChannelFormValues = z.infer<typeof vkChannelFormSchema>;

interface VkChannelSettingsProps {
  assistantId: number;
  onSuccess?: () => void;
}

export function VkChannelSettings({ assistantId, onSuccess }: VkChannelSettingsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Получаем данные о каналах
  const { data, isLoading } = useQuery<Channel[]>({
    queryKey: ["/api/channels"],
  });
  
  // Используем данные с проверкой типов
  const channels = data || [];
  
  // Проверяем, существует ли уже канал VK
  const existingVkChannel = channels.find(
    (channel) => channel.type === "vk" && channel.status === "active"
  );

  // Настройка формы с валидацией
  const form = useForm<VkChannelFormValues>({
    resolver: zodResolver(vkChannelFormSchema),
    defaultValues: {
      token: "",
      groupId: "",
    },
  });

  // Загружаем существующие настройки, если канал существует
  useEffect(() => {
    if (existingVkChannel && existingVkChannel.settings) {
      form.reset({
        token: existingVkChannel.settings.token || "",
        groupId: existingVkChannel.settings.groupId || "",
      });
    }
  }, [existingVkChannel, form]);

  // Мутация для создания канала
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
            name: "ВКонтакте",
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
        title: existingVkChannel ? "Канал успешно обновлен" : "Канал успешно подключен",
        description: "Канал ВКонтакте успешно настроен и готов к использованию",
      });
      
      // Вызываем колбэк успеха
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      console.error("Ошибка при настройке канала ВКонтакте:", error);
      let errorMessage = "Не удалось настроить канал ВКонтакте. Проверьте правильность введенных данных.";
      
      if (error.message === "Пользователь не авторизован") {
        errorMessage = "Для подключения канала требуется авторизация. Пожалуйста, войдите в систему.";
      } else if (error.message.includes("createdBy")) {
        errorMessage = "Ошибка с ID пользователя. Пожалуйста, обновите страницу и попробуйте снова.";
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

  if (isLoading) {
    return <div className="py-4 text-center">Загрузка настроек...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm">
              <InfoIcon className="h-4 w-4 text-blue-500" />
              <span>
                Для настройки интеграции вам потребуется создать сообщество ВКонтакте, 
                получить токен доступа в разделе "Настройки" → "Работа с API" и 
                указать ID вашего сообщества.
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
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
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Получите токен в настройках сообщества в разделе "Работа с API"
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
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Числовой идентификатор вашего сообщества ВКонтакте
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Alert>
          <Settings className="h-4 w-4" />
          <AlertDescription>
            URL для Callback API: <code className="bg-muted px-1 py-0.5 rounded">{import.meta.env.VITE_PUBLIC_BASE_URL || window.location.origin}/api/channels/vk/webhook</code>
          </AlertDescription>
        </Alert>

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.open("https://vk.com/dev/bots_docs", "_blank")}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Документация ВКонтакте
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                {existingVkChannel ? "Обновление..." : "Подключение..."}
              </>
            ) : existingVkChannel ? "Обновить" : "Подключить"}
          </Button>
        </div>
      </form>
    </Form>
  );
}