import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";
import { CHANNEL_TYPES } from "@/lib/constants";

// Схема для формы канала Avito
const avitoChannelFormSchema = z.object({
  name: z
    .string()
    .min(2, "Название должно содержать минимум 2 символа")
    .max(50, "Название не должно превышать 50 символов"),
  profileId: z
    .string()
    .min(1, "Номер профиля должен содержать минимум 1 символ")
    .max(30, "Номер профиля не должен превышать 30 символов"),
  clientId: z
    .string()
    .min(5, "Client ID должен содержать минимум 5 символов")
    .max(255, "Client ID не должен превышать 255 символов"),
  clientSecret: z
    .string()
    .min(5, "Client Secret должен содержать минимум 5 символов")
    .max(255, "Client Secret не должен превышать 255 символов"),
});

// Тип для значений формы
type AvitoChannelFormValues = z.infer<typeof avitoChannelFormSchema>;

// Интерфейс для канала
interface Channel {
  id: number;
  name: string;
  type: string;
  status: string;
  settings?: {
    profileId?: string;
    clientId?: string;
    clientSecret?: string;
  };
}

// Интерфейс пропсов диалога
interface AvitoChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingChannel?: Channel;
}

export function AvitoChannelDialog({
  open,
  onOpenChange,
  existingChannel,
}: AvitoChannelDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Получаем данные текущего пользователя
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
    refetchOnWindowFocus: false,
  });

  // Инициализация формы с использованием react-hook-form и zod-валидации
  const form = useForm<AvitoChannelFormValues>({
    resolver: zodResolver(avitoChannelFormSchema),
    defaultValues: {
      name: existingChannel?.name || "Мой канал Авито",
      profileId: existingChannel?.settings?.profileId || "",
      clientId: existingChannel?.settings?.clientId || "",
      clientSecret: existingChannel?.settings?.clientSecret || "",
    },
  });

  // Мутация для создания канала
  const createMutation = useMutation({
    mutationFn: async (values: AvitoChannelFormValues) => {
      return await apiRequest({
        url: "/api/channels",
        method: "POST",
        body: {
          name: values.name,
          type: "avito",
          status: "active",
          createdBy: currentUser?.id || 1, // Используем ID текущего пользователя
          settings: {
            profileId: values.profileId,
            clientId: values.clientId,
            clientSecret: values.clientSecret,
          },
        },
      });
    },
    onSuccess: () => {
      // Инвалидируем кэш, чтобы обновить данные о каналах
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });

      // Показываем уведомление об успешном создании
      toast({
        title: "Канал создан",
        description: "Канал Авито успешно создан и активирован",
      });

      // Закрываем диалог
      onOpenChange(false);

      // Сбрасываем форму
      form.reset();
    },
    onError: (error: Error) => {
      // Показываем уведомление об ошибке
      toast({
        title: "Ошибка",
        description: `Не удалось создать канал: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Мутация для обновления канала
  const updateMutation = useMutation({
    mutationFn: async (values: AvitoChannelFormValues & { id: number }) => {
      return await apiRequest({
        url: `/api/channels/${values.id}`,
        method: "PATCH",
        body: {
          name: values.name,
          settings: {
            profileId: values.profileId,
            clientId: values.clientId,
            clientSecret: values.clientSecret,
          },
        },
      });
    },
    onSuccess: () => {
      // Инвалидируем кэш, чтобы обновить данные о каналах
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });

      // Показываем уведомление об успешном обновлении
      toast({
        title: "Канал обновлен",
        description: "Настройки канала Авито успешно обновлены",
      });

      // Закрываем диалог
      onOpenChange(false);
    },
    onError: (error: Error) => {
      // Показываем уведомление об ошибке
      toast({
        title: "Ошибка",
        description: `Не удалось обновить канал: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Обработчик отправки формы
  const onSubmit = async (values: AvitoChannelFormValues) => {
    setIsSubmitting(true);
    try {
      if (existingChannel) {
        // Если редактируем существующий канал
        await updateMutation.mutateAsync({
          ...values,
          id: existingChannel.id,
        });
      } else {
        // Если создаем новый канал
        await createMutation.mutateAsync(values);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {existingChannel
              ? "Редактирование канала Авито"
              : "Новый канал Авито"}
          </DialogTitle>
          <DialogDescription>
            {existingChannel
              ? "Измените настройки подключения канала Авито"
              : "Укажите данные для подключения канала Авито"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название канала</FormLabel>
                  <FormControl>
                    <Input placeholder="Мой канал Авито" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="profileId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Номер профиля</FormLabel>
                  <FormControl>
                    <Input placeholder="Например: 12 345 678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Введите Client ID из кабинета Авито"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientSecret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Secret</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Введите Client Secret из кабинета Авито"
                      type="password"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {isSubmitting && (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                )}
                {existingChannel ? "Сохранить" : "Создать"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
