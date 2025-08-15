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
    siteName?: string;
    widgetColor?: string;
    widgetFontSize?: string;
    widgetPosition?: string;
    widgetHeaderName?: string;
    widgetIcon?: string;
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { InfoIcon, LoaderCircle, Settings, Code } from "lucide-react";

// Схема валидации для формы Web Channel
const webChannelFormSchema = z.object({
  channelName: z.string().min(1, "Название канала обязательно"),
  siteName: z.string().min(1, "Название сайта обязательно"),
  widgetColor: z.string().default("#3B82F6"),
  widgetFontSize: z.string().default("14px"),
  widgetPosition: z.string().default("bottom-right"),
  widgetHeaderName: z.string().default("Чат поддержки"),
  widgetIcon: z.string().optional(),
});

type WebChannelFormValues = z.infer<typeof webChannelFormSchema>;

interface WebChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingChannel?: Channel;
}

export function WebChannelDialog({ open, onOpenChange, existingChannel }: WebChannelDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [scriptCode, setScriptCode] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Настройка формы с валидацией
  const form = useForm<WebChannelFormValues>({
    resolver: zodResolver(webChannelFormSchema),
    defaultValues: {
      channelName: "",
      siteName: "",
      widgetColor: "#3B82F6",
      widgetFontSize: "14px",
      widgetPosition: "bottom-right",
      widgetHeaderName: "Чат поддержки",
      widgetIcon: "",
    },
  });

  // Загружаем существующие настройки, если канал существует
  useEffect(() => {
    if (existingChannel && existingChannel.settings) {
      form.reset({
        channelName: existingChannel.name || "",
        siteName: existingChannel.settings.siteName || "",
        widgetColor: existingChannel.settings.widgetColor || "#3B82F6",
        widgetFontSize: existingChannel.settings.widgetFontSize || "14px",
        widgetPosition: existingChannel.settings.widgetPosition || "bottom-right",
        widgetHeaderName: existingChannel.settings.widgetHeaderName || "Чат поддержки",
        widgetIcon: existingChannel.settings.widgetIcon || "",
      });
    }
  }, [existingChannel, form, open]);

  // Мутация для создания или обновления канала
  const createOrUpdateChannelMutation = useMutation({
    mutationFn: async (values: WebChannelFormValues) => {
      if (!user) {
        throw new Error("Пользователь не авторизован");
      }
      
      if (existingChannel) {
        // Обновляем существующий канал
        return await apiRequest({
          url: `/api/channels/${existingChannel.id}`,
          method: "PATCH",
          body: {
            name: values.channelName,
            settings: {
              siteName: values.siteName,
              widgetColor: values.widgetColor,
              widgetFontSize: values.widgetFontSize,
              widgetPosition: values.widgetPosition,
              widgetHeaderName: values.widgetHeaderName,
              widgetIcon: values.widgetIcon,
            },
          },
        });
      } else {
        // Создаем новый канал
        return await apiRequest({
          url: "/api/channels",
          method: "POST",
          body: {
            name: values.channelName,
            type: "web",
            status: "active",
            settings: {
              siteName: values.siteName,
              widgetColor: values.widgetColor,
              widgetFontSize: values.widgetFontSize,
              widgetPosition: values.widgetPosition,
              widgetHeaderName: values.widgetHeaderName,
              widgetIcon: values.widgetIcon,
            },
            createdBy: user.id,
          },
        });
      }
    },
    onSuccess: (data) => {
      // Инвалидируем кеш каналов для обновления списка
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      
      // Получаем код для вставки на сайт от API
      const fetchWidgetCode = async () => {
        try {
          const channelId = data.id;
          const response = await apiRequest({
            url: `/api/channels/${channelId}/widget-code`,
            method: "GET"
          });
          
          if (response && response.code) {
            setScriptCode(response.code);
          } else {
            // Используем запасной вариант генерации кода, если API не сработал
            const baseUrl = window.location.origin;
            const scriptTemplate = `<script src="${baseUrl}/api/channels/${channelId}/widget.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    chatInit(${channelId}, {
      primaryColor: "${data.settings?.widgetColor || "#3B82F6"}",
      position: "${data.settings?.widgetPosition || "bottom-right"}",
      headerText: "${data.settings?.widgetHeaderName || "Онлайн-чат"}",
      fontSize: "${data.settings?.widgetFontSize || "14px"}",
      iconUrl: "${data.settings?.widgetIcon || window.location.origin + "/robot-icon.svg"}"
    });
  });
</script>`;
            setScriptCode(scriptTemplate);
          }
        } catch (error) {
          console.error("Error fetching widget code:", error);
          // Запасной вариант, если запрос не сработал
          const baseUrl = window.location.origin;
          const channelId = data.id;
          const scriptTemplate = `<script src="${baseUrl}/api/channels/${channelId}/widget.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    chatInit(${channelId});
  });
</script>`;
          setScriptCode(scriptTemplate);
        }
      };
      
      fetchWidgetCode();
      setShowScript(true);
      
      // Показываем уведомление об успехе
      toast({
        title: existingChannel ? "Канал успешно обновлен" : "Канал успешно подключен",
        description: "Канал Веб-сайт успешно настроен и готов к использованию",
      });
    },
    onError: (error: Error) => {
      console.error("Ошибка при настройке канала Веб-сайт:", error);
      let errorMessage = "Не удалось настроить канал Веб-сайт. Проверьте правильность введенных данных.";
      
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
      
      setShowScript(false);
    },
  });

  // Обработчик отправки формы
  const onSubmit = async (values: WebChannelFormValues) => {
    setIsSubmitting(true);
    try {
      await createOrUpdateChannelMutation.mutateAsync(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Обработчик копирования скрипта в буфер обмена
  const handleCopyScript = () => {
    navigator.clipboard.writeText(scriptCode);
    toast({
      title: "Скопировано",
      description: "Код скрипта скопирован в буфер обмена",
    });
  };

  // Закрытие диалога со скриптом
  const handleCloseScript = () => {
    setShowScript(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto mx-auto">
        {!showScript ? (
          <>
            <DialogHeader>
              <DialogTitle>{existingChannel ? "Настройка канала Веб-сайт" : "Подключение Веб-сайта"}</DialogTitle>
              <DialogDescription>
                Настройте интеграцию с веб-сайтом для добавления чат-виджета
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm">
                      <InfoIcon className="h-4 w-4 text-blue-500" />
                      <span>
                        Настройте виджет чата для вашего веб-сайта. После сохранения настроек вы получите 
                        код для интеграции, который нужно будет вставить на ваш сайт.
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
                        <FormLabel>Название подключения</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Введите название подключения (например, Наш сайт)"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Удобное название для идентификации этого канала
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="siteName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Название сайта</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Введите название сайта"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Название сайта для отображения в административной панели
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="widgetColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Цвет виджета</FormLabel>
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            className="w-12 h-8 p-1"
                            {...field}
                          />
                          <Input
                            type="text"
                            placeholder="#3B82F6"
                            className="flex-1"
                            {...field}
                          />
                        </div>
                        <FormDescription>
                          Основной цвет виджета
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="widgetFontSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Размер шрифта</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите размер шрифта" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="12px">Маленький (12px)</SelectItem>
                            <SelectItem value="14px">Средний (14px)</SelectItem>
                            <SelectItem value="16px">Большой (16px)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Размер шрифта в виджете
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="widgetPosition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Положение на экране</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите расположение виджета" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bottom-right">Нижний правый угол</SelectItem>
                            <SelectItem value="bottom-left">Нижний левый угол</SelectItem>
                            <SelectItem value="bottom-center">Внизу экрана по центру</SelectItem>
                            <SelectItem value="left-center">Левый край по центру</SelectItem>
                            <SelectItem value="right-center">Правый край по центру</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Расположение виджета на странице
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="widgetHeaderName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Заголовок чата</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Введите заголовок чата"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Название, которое будет отображаться в шапке открытого виджета
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="widgetIcon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Иконка для виджета (URL)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Введите URL изображения для иконки"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          URL изображения для иконки виджета (поддерживаются форматы PNG, JPG, SVG)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    Отмена
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        {existingChannel ? "Обновление..." : "Подключение..."}
                      </>
                    ) : existingChannel ? "Обновить настройки" : "Подключить"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Код для вставки на сайт</DialogTitle>
              <DialogDescription>
                Вставьте этот код на ваш сайт перед закрывающим тегом &lt;/body&gt;
              </DialogDescription>
            </DialogHeader>

            <Card>
              <CardContent className="p-4 bg-muted relative">
                <pre className="text-sm overflow-x-auto whitespace-pre-wrap break-all max-h-60 overflow-y-auto">
                  {scriptCode}
                </pre>
                <Button 
                  variant="secondary" 
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleCopyScript}
                >
                  <Code className="h-4 w-4 mr-1" />
                  Копировать
                </Button>
              </CardContent>
            </Card>

            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                После добавления кода на сайт виджет будет автоматически отображаться в правом нижнем углу страницы. Все настройки внешнего вида можно изменить позже в настройках канала.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button onClick={handleCloseScript}>
                Закрыть
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}