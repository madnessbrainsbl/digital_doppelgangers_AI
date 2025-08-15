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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Упрощенная схема для Email канала - один канал содержит один почтовый ящик
const emailChannelFormSchema = z.object({
  name: z
    .string()
    .min(2, "Название должно содержать минимум 2 символа")
    .max(50, "Название не должно превышать 50 символов"),
  email: z.string().email("Введите корректный адрес электронной почты"),
  password: z.string().min(1, "Пароль обязателен"),
  smtpServer: z.string().min(1, "SMTP сервер обязателен"),
  smtpPort: z.coerce.number().min(1, "Укажите корректный порт"),
  imapServer: z.string().min(1, "IMAP сервер обязателен"),
  imapPort: z.coerce.number().min(1, "Укажите корректный порт"),
});

// Тип для значений формы
type EmailChannelFormValues = z.infer<typeof emailChannelFormSchema>;

// Интерфейс для канала
interface Channel {
  id: number;
  name: string;
  type: string;
  status: string;
  settings?: {
    email?: string;
    password?: string;
    smtpServer?: string;
    smtpPort?: number;
    imapServer?: string;
    imapPort?: number;
  };
}

// Интерфейс для пользователя
interface User {
  id: number;
  name: string;
  email: string | null;
  role: string;
}

// Интерфейс пропсов диалога
interface EmailChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingChannel?: Channel;
}

export function EmailChannelDialog({ open, onOpenChange, existingChannel }: EmailChannelDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Получаем данные текущего пользователя
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    refetchOnWindowFocus: false,
  });
  
  // Инициализация формы с использованием react-hook-form и zod-валидации
  const form = useForm<EmailChannelFormValues>({
    resolver: zodResolver(emailChannelFormSchema),
    defaultValues: {
      name: existingChannel?.name || "Мой Email канал",
      email: existingChannel?.settings?.email || "",
      password: existingChannel?.settings?.password || "",
      smtpServer: existingChannel?.settings?.smtpServer || "",
      smtpPort: existingChannel?.settings?.smtpPort || 25,
      imapServer: existingChannel?.settings?.imapServer || "",
      imapPort: existingChannel?.settings?.imapPort || 993,
    },
  });

  // Функция для определения настроек почтового сервера по домену
  const getEmailServerSettings = (email: string) => {
    const domain = email.split('@')[1]?.toLowerCase();
    
    // Настройки популярных почтовых сервисов
    const serverSettings: Record<string, { smtp: string; smtpPort: number; imap: string; imapPort: number }> = {
      'mail.ru': { smtp: 'smtp.mail.ru', smtpPort: 465, imap: 'imap.mail.ru', imapPort: 993 },
      'inbox.ru': { smtp: 'smtp.mail.ru', smtpPort: 465, imap: 'imap.mail.ru', imapPort: 993 },
      'bk.ru': { smtp: 'smtp.mail.ru', smtpPort: 465, imap: 'imap.mail.ru', imapPort: 993 },
      'list.ru': { smtp: 'smtp.mail.ru', smtpPort: 465, imap: 'imap.mail.ru', imapPort: 993 },
      'gmail.com': { smtp: 'smtp.gmail.com', smtpPort: 587, imap: 'imap.gmail.com', imapPort: 993 },
      'yandex.ru': { smtp: 'smtp.yandex.ru', smtpPort: 465, imap: 'imap.yandex.ru', imapPort: 993 },
      'ya.ru': { smtp: 'smtp.yandex.ru', smtpPort: 465, imap: 'imap.yandex.ru', imapPort: 993 },
      'outlook.com': { smtp: 'smtp.office365.com', smtpPort: 587, imap: 'outlook.office365.com', imapPort: 993 },
      'hotmail.com': { smtp: 'smtp.office365.com', smtpPort: 587, imap: 'outlook.office365.com', imapPort: 993 }
    };
    
    // Если домен найден в списке, возвращаем соответствующие настройки
    if (domain && serverSettings[domain]) {
      return serverSettings[domain];
    }
    
    // По умолчанию возвращаем пустые настройки
    return { 
      smtp: '',
      smtpPort: 25,
      imap: '',
      imapPort: 993
    };
  };

  // Мутация для создания канала
  const createMutation = useMutation({
    mutationFn: async (values: EmailChannelFormValues) => {
      return await apiRequest({
        url: "/api/channels",
        method: "POST",
        body: {
          name: values.name,
          type: "email",
          status: "active",
          createdBy: currentUser?.id || 1, // Используем ID текущего пользователя
          settings: {
            email: values.email,
            password: values.password,
            smtpServer: values.smtpServer,
            smtpPort: values.smtpPort,
            imapServer: values.imapServer,
            imapPort: values.imapPort,
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
        description: "Канал Email успешно создан и активирован",
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
    mutationFn: async (values: EmailChannelFormValues & { id: number }) => {
      return await apiRequest({
        url: `/api/channels/${values.id}`,
        method: "PATCH",
        body: {
          name: values.name,
          settings: {
            email: values.email,
            password: values.password,
            smtpServer: values.smtpServer,
            smtpPort: values.smtpPort,
            imapServer: values.imapServer,
            imapPort: values.imapPort,
          },
        },
      });
    },
    onSuccess: () => {
      // Инвалидируем кэш, чтобы обновить данные о каналах
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      
      // Инвалидируем кэш для конкретного канала
      if (existingChannel) {
        queryClient.invalidateQueries({ queryKey: [`/api/channels/${existingChannel.id}`] });
      }
      
      // Показываем уведомление об успешном обновлении
      toast({
        title: "Канал обновлен",
        description: "Настройки канала Email успешно обновлены",
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
  const onSubmit = async (values: EmailChannelFormValues) => {
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingChannel ? "Редактирование канала Email" : "Новый канал Email"}
          </DialogTitle>
          <DialogDescription>
            {existingChannel
              ? "Измените настройки подключения канала Email"
              : "Укажите данные для подключения канала Email"}
            <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md text-amber-600 dark:text-amber-400 text-xs">
              <strong>Обнаружена ошибка SMTP Яндекс!</strong> Для работы с Яндекс.Почтой необходимо:
              <ol className="list-decimal pl-4 mt-1 space-y-1">
                <li>Включить доступ к почте через сторонние приложения в <a href="https://id.yandex.ru/security" target="_blank" rel="noopener noreferrer" className="underline font-medium">настройках безопасности</a></li>
                <li>Создать <a href="https://yandex.ru/support/id/authorization/app-passwords.html" target="_blank" rel="noopener noreferrer" className="underline font-medium">пароль приложения</a> и использовать его вместо обычного пароля</li>
                <li>Убедиться, что у учетной записи нет временных блокировок</li>
              </ol>
            </div>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Настройте почтовый ящик для работы с электронной почтой. 
                Каждый почтовый ящик создается как отдельный канал.
              </AlertDescription>
            </Alert>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название канала</FormLabel>
                  <FormControl>
                    <Input placeholder="Мой Email канал" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Адрес электронной почты</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="example@mail.ru" 
                            {...field} 
                            onChange={(e) => {
                              // Обновляем поле email
                              field.onChange(e);

                              // Если введен полный email с доменом
                              if (e.target.value.includes('@')) {
                                // Получаем настройки серверов по домену
                                const settings = getEmailServerSettings(e.target.value);
                                
                                // Обновляем поля с настройками серверов
                                form.setValue('smtpServer', settings.smtp);
                                form.setValue('smtpPort', settings.smtpPort);
                                form.setValue('imapServer', settings.imap);
                                form.setValue('imapPort', settings.imapPort);
                              }
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Настройки серверов заполнятся автоматически для известных почтовых сервисов
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Пароль</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Введите пароль от почты"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          <span className="text-amber-500 font-medium">Важно!</span> Для большинства почтовых сервисов
                          необходимо использовать пароль приложения, а не обычный пароль от почты.
                          <br />
                          <p className="mt-1 mb-1">Инструкции по созданию пароля приложения:</p>
                          <ul className="list-disc pl-5 text-sm">
                            <li><a href="https://help.mail.ru/mail/security/protection/external" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Mail.ru</a></li>
                            <li><a href="https://yandex.ru/support/id/authorization/app-passwords.html" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Яндекс</a></li>
                            <li><a href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Gmail</a></li>
                            <li><a href="https://support.microsoft.com/ru-ru/account-billing/использование-паролей-приложений-с-приложениями-которым-требуется-двухэтапная-проверка-5896ed9b-4263-e681-128a-a6f2979a7944" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Outlook/Hotmail</a></li>
                          </ul>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="smtpServer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP сервер</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="smtp.mail.ru"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="smtpPort"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP порт</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="25"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="imapServer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IMAP сервер</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="imap.mail.ru"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="imapPort"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IMAP порт</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="993"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

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