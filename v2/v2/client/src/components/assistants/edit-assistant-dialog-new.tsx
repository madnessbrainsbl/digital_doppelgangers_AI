import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { NotificationChannelsSettings } from "./notification-channels-settings";
import { useForm } from "react-hook-form";
import {
  Save,
  ChevronDown,
  BarChart3,
  Loader2,
  Database,
  FileText,
  TestTube2,
  AlertCircle,
  Upload,
  Maximize2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

// Импортируем диалоги для работы с ассистентом
import { KnowledgeBaseDialog } from "./knowledge-base-dialog";
import AssistantTestDialog from "./assistant-test-dialog";
import AssistantFilesList from "./assistant-files-list";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ASSISTANT_ICONS } from "@/lib/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";

interface EditAssistantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assistant: {
    id: number;
    name: string;
    role: string;
    status: string;
    description?: string;
    instructions?: string;
    openaiAssistantId?: string;
    model?: string;
  } | null;
}

// Define validation schema
const formSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Имя должно содержать минимум 2 символа" }),
  description: z.string().optional(),
  instructions: z.string().optional(),
  role: z.string(),
  model: z.string().optional(),
  status: z.string(),
});

export default function EditAssistantDialog({
  open,
  onOpenChange,
  assistant,
}: EditAssistantDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Состояние для мобильной версии табов
  const [mobileActiveTab, setMobileActiveTab] = useState("basic");

  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      instructions: "",
      role: "support",
      model: "gpt-4-turbo",
      status: "training",
    },
  });

  // Update form values when assistant changes
  useEffect(() => {
    if (assistant) {
      form.reset({
        name: assistant.name,
        description: assistant.description || "",
        instructions: assistant.instructions || "",
        role: assistant.role,
        model: assistant.model || "gpt-4-turbo",
        status: assistant.status,
      });
    }
  }, [assistant, form]);

  // Следим за изменениями в полях формы для автоматического сохранения
  const formValues = form.watch();
  const [formChanged, setFormChanged] = useState(false);

  useEffect(() => {
    // Сравниваем текущие значения с начальными
    if (assistant && form.formState.isDirty) {
      setFormChanged(true);
    } else {
      setFormChanged(false);
    }
  }, [formValues, assistant, form.formState.isDirty]);

  // Update assistant mutation
  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (!assistant) return null;
      const response = await apiRequest({
        method: "PATCH",
        url: `/api/assistants/${assistant.id}`,
        body: data,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assistants"] });
      toast({
        title: "Ассистент обновлен",
        description: "Настройки успешно сохранены",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось обновить: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Sync with OpenAI mutation
  const syncWithOpenAIMutation = useMutation({
    mutationFn: async () => {
      if (!assistant) return null;
      const response = await apiRequest({
        method: "POST",
        url: `/api/assistants/${assistant.id}/sync`,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/assistants"] });
      toast({
        title: "Синхронизация выполнена",
        description: `Ассистент синхронизирован с OpenAI (ID: ${data.openaiAssistantId?.substring(
          0,
          8
        )}...)`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка синхронизации",
        description: `Не удалось синхронизировать: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    updateMutation.mutate(data);
  };

  const isUpdating = updateMutation.isPending;
  const isSyncing = syncWithOpenAIMutation.isPending;

  // Состояния для диалогов
  const [knowledgeBaseDialogOpen, setKnowledgeBaseDialogOpen] = useState(false);
  const [knowledgeBaseFileUpload, setKnowledgeBaseFileUpload] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);

  // Хелпер для получения статуса в виде текста
  const getStatusText = (status: string) => {
    return status === "active" ? "Активен" : "Обучение";
  };

  if (!assistant) return null;

  // Обработчик закрытия диалога
  const handleDialogClose = (isOpen: boolean) => {
    // Если диалог закрывается, обновляем список ассистентов
    if (!isOpen) {
      queryClient.invalidateQueries({ queryKey: ["/api/assistants"] });
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="w-[90%] m-auto max-w-full sm:max-w-[90%] md:max-w-4xl p-0 max-h-[90vh] overflow-y-auto">
        <VisuallyHidden>
          <DialogTitle>Настройки</DialogTitle>
        </VisuallyHidden>
        <VisuallyHidden>
          <DialogDescription>
            Измените настройки вашего виртуального ассистента
          </DialogDescription>
        </VisuallyHidden>
        <Card className="border-0">
          <CardHeader className="pb-0">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="mr-2"
                >
                  <ChevronDown className="h-5 w-5 rotate-90" />
                </Button>
                <CardTitle className="text-base md:text-lg lg:text-xl">
                  Настройка ассистента: {assistant.name}
                </CardTitle>
              </div>
              <div className="flex flex-col md:flex-row gap-2 items-center space-x-2">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                    form.getValues("status") === "active"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  }`}
                >
                  {getStatusText(form.getValues("status"))}
                </span>
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <Switch
                      checked={field.value === "active"}
                      onCheckedChange={(checked) => {
                        field.onChange(checked ? "active" : "training");
                        // Trigger form submission when status changes
                        form.handleSubmit(onSubmit)();
                      }}
                    />
                  )}
                />
              </div>
            </div>
            <CardDescription>
              Измените настройки вашего виртуального ассистента
            </CardDescription>
          </CardHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="hidden lg:block">
                <Tabs defaultValue="basic">
                  <TabsList className="mb-6">
                    <TabsTrigger value="basic">Основные настройки</TabsTrigger>
                    <TabsTrigger value="knowledge">База знаний</TabsTrigger>
                    <TabsTrigger value="testing">Тестирование</TabsTrigger>
                    <TabsTrigger value="channels">Каналы связи</TabsTrigger>
                    {/* <TabsTrigger value="behavior">Поведение</TabsTrigger> */}
                    <TabsTrigger value="analytics">Аналитика</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Название ассистента</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Роль ассистента</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Выберите роль" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ASSISTANT_ICONS.map((role) => (
                                  <SelectItem key={role.id} value={role.id}>
                                    {role.id}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Описание</FormLabel>
                            <FormControl>
                              <Textarea
                                rows={3}
                                {...field}
                                value={field.value || ""}
                                placeholder="Укажите описание ассистента, характер поведения, особенности работы."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="instructions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Задачи ассистента</FormLabel>
                            <FormControl>
                              <Textarea
                                rows={4}
                                {...field}
                                value={field.value || ""}
                                placeholder="Укажите задачи ассистента. Что должен делать? Как отвечать на вопросы? Какие задачи решать?"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="knowledge" className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center">
                          <Label>Подключенные источники знаний</Label>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setKnowledgeBaseDialogOpen(true)}
                            >
                              <Database className="h-4 w-4 mr-2" />
                              Добавить из базы знаний
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setKnowledgeBaseFileUpload(true);
                                setKnowledgeBaseDialogOpen(true);
                              }}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Загрузить файл
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2 p-6 border rounded-md border-dashed text-center">
                          <FileText className="h-12 w-12 mx-auto mb-2 text-muted-foreground/80" />
                          <h3 className="text-lg font-medium mb-2">
                            Управление файлами
                          </h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Добавьте файлы из базы знаний или загрузите новые,
                            чтобы ассистент мог использовать их содержимое для
                            ответов.
                          </p>
                          <div className="flex justify-center gap-3 mb-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setKnowledgeBaseDialogOpen(true)}
                            >
                              <Database className="h-4 w-4 mr-2" />
                              Добавить из базы знаний
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setKnowledgeBaseFileUpload(true);
                                setKnowledgeBaseDialogOpen(true);
                              }}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Загрузить файл
                            </Button>
                          </div>

                          <AssistantFilesList assistantId={assistant.id} />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="channels" className="space-y-6">
                    <div className="space-y-4">
                      {/* РАСКОММЕНТИРОВЫВАТЬ АККУРАТНО! HTML и JS ПО-РАЗНОМУ РАБОТАЮТ */}
                      {/* <div>
                        <Label>Подключенные каналы</Label>
                        <div className="mt-2 grid gap-2"> */}
                      {/* VK Channel - Активный канал с настройками  // НЕ РАСКОММЕНТИРОВЫВАТЬ*/}
                      {/* <div className="flex items-center justify-between p-3 border rounded-md">
                            <div className="flex items-center">
                              <Switch
                                id="channel-vk-edit"
                                checked={true}
                                disabled
                              />
                              <Label htmlFor="channel-vk-edit" className="ml-2">
                                ВКонтакте
                              </Label>
                            </div>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  Настроить
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[550px]">
                                <DialogHeader>
                                  <DialogTitle>
                                    Настройка канала ВКонтакте
                                  </DialogTitle>
                                  <DialogDescription>
                                    Настройте интеграцию с сообществом ВКонтакте
                                    для автоматических ответов на сообщения
                                  </DialogDescription>
                                </DialogHeader>
                                {assistant && (
                                  <VkChannelSettings
                                    assistantId={assistant.id}
                                  />
                                )}
                              </DialogContent>
                            </Dialog>
                          </div> */}

                      {/* Остальные каналы - Неактивные */}
                      {/* {[
                            "Telegram",
                            "WhatsApp",
                            "Сайт",
                            "Email",
                            "Телефония",
                          ].map((channel) => ( */}
                      {/* <div
                              key={channel}
                              className="flex items-center justify-between p-3 border rounded-md"
                            >
                              <div className="flex items-center">
                                <Switch
                                  id={`channel-${channel}-edit`}
                                  disabled
                                />
                                <Label
                                  htmlFor={`channel-${channel}-edit`}
                                  className="ml-2"
                                >
                                  {channel}
                                </Label>
                              </div>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" disabled>
                                    Настроить
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>
                                      Настройка канала {channel}
                                    </DialogTitle>
                                    <DialogDescription>
                                      Настройте параметры подключения и работы с
                                      каналом {channel}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div>
                                      <Label htmlFor={`${channel}-token`}>
                                        API Токен
                                      </Label>
                                      <div className="flex mt-1">
                                        <Input
                                          id={`${channel}-webhook`}
                                          value="https://asissto.app/webhook/12345"
                                          readOnly
                                          className="rounded-r-none"
                                        />
                                        <Button className="rounded-l-none">
                                          Копировать
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Switch id={`${channel}-auto-reply`} />
                                      <Label htmlFor={`${channel}-auto-reply`}>
                                        Автоматические ответы
                                      </Label>
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button>Сохранить настройки</Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div> */}
                      {/* ))} */}
                      {/* </div>
                      </div> */}
                      {/* Секция каналов оповещений */}
                      <div className="pt-4">
                        <h3 className="text-base font-medium mb-4">
                          Каналы оповещений и функции
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Выберите каналы оповещений и функции для извлечения
                          данных из чата с пользователем. Функции будут
                          отслеживать сообщения пользователей и отправлять
                          структурированные данные в подключенные каналы
                          оповещений.
                        </p>
                        {assistant && (
                          <NotificationChannelsSettings
                            assistantId={assistant.id}
                          />
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="behavior" className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label>Стиль общения</Label>
                        <Select defaultValue="professional">
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Выберите стиль" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="formal">Формальный</SelectItem>
                            <SelectItem value="friendly">
                              Дружелюбный
                            </SelectItem>
                            <SelectItem value="professional">
                              Профессиональный
                            </SelectItem>
                            <SelectItem value="casual">
                              Непринужденный
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Сценарии поведения</Label>
                        <Accordion type="single" collapsible className="mt-2">
                          <AccordionItem value="greeting">
                            <AccordionTrigger>Приветствие</AccordionTrigger>
                            <AccordionContent>
                              <Textarea
                                rows={3}
                                defaultValue="Здравствуйте! Я менеджер продаж компании. Чем я могу вам помочь сегодня?"
                              />
                            </AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="unknown">
                            <AccordionTrigger>
                              Неизвестный запрос
                            </AccordionTrigger>
                            <AccordionContent>
                              <Textarea
                                rows={3}
                                defaultValue="Извините, я не совсем понимаю ваш запрос. Не могли бы вы уточнить, что именно вас интересует из нашего каталога продуктов?"
                              />
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="testing" className="space-y-6">
                    <div className="space-y-4">
                      <div className="p-6 border rounded-md border-dashed text-center">
                        <TestTube2 className="h-12 w-12 mx-auto mb-2 text-muted-foreground/80" />
                        <h3 className="text-lg font-medium mb-2">
                          Тестирование ассистента
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Протестируйте работу ассистента и улучшите его ответы
                          с помощью обучающих исправлений. Это поможет сделать
                          вашего ассистента более точным и полезным.
                        </p>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setTestDialogOpen(true)}
                          disabled={!assistant?.openaiAssistantId}
                        >
                          <TestTube2 className="h-4 w-4 mr-2" />
                          Тестировать ассистента
                        </Button>

                        {!assistant?.openaiAssistantId && (
                          <div className="mt-4 p-4 bg-destructive/10 rounded text-sm text-destructive">
                            <AlertCircle className="h-4 w-4 inline-block mr-2" />
                            Для тестирования ассистент должен быть
                            синхронизирован с OpenAI.
                            <Button
                              variant="link"
                              className="p-0 h-auto text-sm text-destructive underline"
                              onClick={() => syncWithOpenAIMutation.mutate()}
                              disabled={isSyncing}
                            >
                              {isSyncing
                                ? "Синхронизация..."
                                : "Синхронизировать сейчас"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="analytics" className="space-y-6">
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Статистика использования</CardTitle>
                          <CardDescription>
                            Данные за последние 30 дней
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">
                                Обработано обращений
                              </p>
                              <p className="text-2xl font-bold">458</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">
                                Средняя оценка
                              </p>
                              <p className="text-2xl font-bold">4.8/5</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">
                                Успешность ответов
                              </p>
                              <p className="text-2xl font-bold">96%</p>
                            </div>
                          </div>

                          <div className="mt-6 h-64 flex items-center justify-center bg-muted/20 rounded-md">
                            <BarChart3 className="h-16 w-16 text-muted" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Популярные запросы</CardTitle>
                          <CardDescription>
                            Часто задаваемые вопросы
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {[
                              "Какая цена на товар X?",
                              "Как оформить заказ?",
                              "Когда будет доставка?",
                              "Есть ли скидки?",
                              "Как связаться с менеджером?",
                            ].map((query, i) => (
                              <li
                                key={i}
                                className="flex justify-between items-center p-2 border-b last:border-0"
                              >
                                <span>{query}</span>
                                <span className="text-muted-foreground text-sm">
                                  {Math.floor(Math.random() * 50) + 10} раз
                                </span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>

              <CardContent className="block lg:hidden">
                <div className="border rounded p-2">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className={`${
                        mobileActiveTab === "basic"
                          ? "bg-blue-600"
                          : "bg-blue-500"
                      } text-white rounded-md px-3 pb-1 whitespace-nowrap`}
                      onClick={() => setMobileActiveTab("basic")}
                    >
                      Основные
                    </button>
                    <button
                      type="button"
                      className={`${
                        mobileActiveTab === "knowledge"
                          ? "bg-blue-600"
                          : "bg-blue-500"
                      } text-white rounded-md px-3 pb-1 whitespace-nowrap`}
                      onClick={() => setMobileActiveTab("knowledge")}
                    >
                      База знаний
                    </button>
                    <button
                      type="button"
                      className={`${
                        mobileActiveTab === "testing"
                          ? "bg-blue-600"
                          : "bg-blue-500"
                      } text-white rounded-md px-3 pb-1 whitespace-nowrap`}
                      onClick={() => setMobileActiveTab("testing")}
                    >
                      Тестирование
                    </button>
                    <button
                      type="button"
                      className={`${
                        mobileActiveTab === "channels"
                          ? "bg-blue-600"
                          : "bg-blue-500"
                      } text-white rounded-md px-3 pb-1 whitespace-nowrap`}
                      onClick={() => setMobileActiveTab("channels")}
                    >
                      Каналы связи
                    </button>
                    {/* <button
                      type="button"
                      className={`${
                        mobileActiveTab === "behavior"
                          ? "bg-blue-600"
                          : "bg-blue-500"
                      } text-white rounded-md px-3 pb-1 whitespace-nowrap`}
                      onClick={() => setMobileActiveTab("behavior")}
                    >
                      Поведение
                    </button>
                    <button
                      type="button"
                      className={`${
                        mobileActiveTab === "analytics"
                          ? "bg-blue-600"
                          : "bg-blue-500"
                      } text-white rounded-md px-3 pb-1 whitespace-nowrap`}
                      onClick={() => setMobileActiveTab("analytics")}
                    >
                      Аналитика
                    </button> */}
                  </div>
                </div>

                {/* Контентные блоки для мобильной версии */}
                <div className="mt-4 w-full mx-auto">
                  {/* Блок "Основные настройки" */}
                  {mobileActiveTab === "basic" && (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Название ассистента</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Роль ассистента</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Выберите роль" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ASSISTANT_ICONS.map((role) => (
                                  <SelectItem key={role.id} value={role.id}>
                                    {role.id}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Описание</FormLabel>
                            <FormControl>
                              <Textarea
                                rows={3}
                                {...field}
                                value={field.value || ""}
                                placeholder="Укажите описание ассистента, характер поведения, особенности работы."
                              />
                            </FormControl>
                            <FormMessage />
                            <Dialog>
                              <DialogTrigger asChild>
                                <div className="flex justify-end">
                                  <button
                                    type="button"
                                    className="text-sm px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                  >
                                    <Maximize2 />
                                  </button>
                                </div>
                              </DialogTrigger>
                              <DialogContent className="h-[50%]">
                                <Textarea
                                  rows={8}
                                  value={field.value || ""}
                                  onChange={(e) =>
                                    field.onChange(e.target.value)
                                  }
                                  placeholder="Опиши ассистента здесь..."
                                  className="mt-6"
                                />
                              </DialogContent>
                            </Dialog>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="instructions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Задачи ассистента</FormLabel>
                            <FormControl>
                              <Textarea
                                rows={4}
                                {...field}
                                value={field.value || ""}
                                placeholder="Укажите задачи ассистента. Что должен делать? Как отвечать на вопросы? Какие задачи решать?"
                              />
                            </FormControl>
                            <FormMessage />
                            <Dialog>
                              <DialogTrigger asChild>
                                <div className="flex justify-end">
                                  <button
                                    type="button"
                                    className="text-sm px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                  >
                                    <Maximize2 />
                                  </button>
                                </div>
                              </DialogTrigger>
                              <DialogContent className="h-[50%]">
                                <Textarea
                                  rows={8}
                                  value={field.value || ""}
                                  onChange={(e) =>
                                    field.onChange(e.target.value)
                                  }
                                  placeholder="Укажите задачи ассистента."
                                  className="mt-6"
                                />
                              </DialogContent>
                            </Dialog>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Блок "База знаний" */}
                  {mobileActiveTab === "knowledge" && (
                    <div className="space-y-4">
                      <div>
                        <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                          <Label>Подключенные источники знаний</Label>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setKnowledgeBaseDialogOpen(true)}
                            >
                              <Database className="h-4 w-4 mr-2" />
                              Добавить из базы знаний
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setKnowledgeBaseFileUpload(true);
                                setKnowledgeBaseDialogOpen(true);
                              }}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Загрузить файл
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2 p-4 border rounded-md border-dashed text-center">
                          <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground/80" />
                          <h3 className="text-base font-medium mb-2">
                            Управление файлами
                          </h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Добавьте файлы из базы знаний или загрузите новые,
                            чтобы ассистент мог использовать их содержимое для
                            ответов.
                          </p>

                          {assistant && (
                            <AssistantFilesList assistantId={assistant.id} />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Блок "Тестирование" */}
                  {mobileActiveTab === "testing" && (
                    <div className="space-y-4">
                      <div className="p-4 border rounded-md border-dashed text-center">
                        <TestTube2 className="h-10 w-10 mx-auto mb-2 text-muted-foreground/80" />
                        <h3 className="text-base font-medium mb-2">
                          Тестирование ассистента
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Протестируйте работу ассистента и улучшите его ответы
                          с помощью обучающих исправлений.
                        </p>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setTestDialogOpen(true)}
                          disabled={!assistant?.openaiAssistantId}
                        >
                          <TestTube2 className="h-4 w-4 mr-2" />
                          Тестировать ассистента
                        </Button>

                        {!assistant?.openaiAssistantId && (
                          <div className="mt-4 p-3 bg-destructive/10 rounded text-xs text-destructive">
                            <AlertCircle className="h-3 w-3 inline-block mr-1" />
                            Для тестирования ассистент должен быть
                            синхронизирован с OpenAI.
                            <Button
                              variant="link"
                              className="p-0 h-auto text-xs text-destructive underline"
                              onClick={() => syncWithOpenAIMutation.mutate()}
                              disabled={isSyncing}
                            >
                              {isSyncing
                                ? "Синхронизация..."
                                : "Синхронизировать сейчас"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Блок "Каналы связи" */}
                  {mobileActiveTab === "channels" && (
                    <div className="space-y-4">
                      <div className="pt-2">
                        <h3 className="text-base font-medium mb-3">
                          Каналы оповещений и функции
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Выберите каналы оповещений и функции для извлечения
                          данных из чата с пользователем.
                        </p>
                        {assistant && (
                          <NotificationChannelsSettings
                            assistantId={assistant.id}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Блок "Поведение" */}
                  {mobileActiveTab === "behavior" && (
                    <div className="space-y-4">
                      <div>
                        <Label>Стиль общения</Label>
                        <Select defaultValue="professional">
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Выберите стиль" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="formal">Формальный</SelectItem>
                            <SelectItem value="friendly">
                              Дружелюбный
                            </SelectItem>
                            <SelectItem value="professional">
                              Профессиональный
                            </SelectItem>
                            <SelectItem value="casual">
                              Непринужденный
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Сценарии поведения</Label>
                        <Accordion type="single" collapsible className="mt-2">
                          <AccordionItem value="greeting">
                            <AccordionTrigger>Приветствие</AccordionTrigger>
                            <AccordionContent>
                              <Textarea
                                rows={3}
                                defaultValue="Здравствуйте! Я менеджер продаж компании. Чем я могу вам помочь сегодня?"
                              />
                            </AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="unknown">
                            <AccordionTrigger>
                              Неизвестный запрос
                            </AccordionTrigger>
                            <AccordionContent>
                              <Textarea
                                rows={3}
                                defaultValue="Извините, я не совсем понимаю ваш запрос. Не могли бы вы уточнить, что именно вас интересует из нашего каталога продуктов?"
                              />
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    </div>
                  )}

                  {/* Блок "Аналитика" */}
                  {mobileActiveTab === "analytics" && (
                    <div className="space-y-4">
                      <Card className="border shadow-none">
                        <CardHeader className="px-3 py-2">
                          <CardTitle className="text-base">
                            Статистика использования
                          </CardTitle>
                          <CardDescription className="text-xs">
                            Данные за последние 30 дней
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="px-3 py-2">
                          <div className="grid gap-3 grid-cols-2">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                Обработано обращений
                              </p>
                              <p className="text-lg font-bold">458</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                Средняя оценка
                              </p>
                              <p className="text-lg font-bold">4.8/5</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                Успешность ответов
                              </p>
                              <p className="text-lg font-bold">96%</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border shadow-none">
                        <CardHeader className="px-3 py-2">
                          <CardTitle className="text-base">
                            Популярные запросы
                          </CardTitle>
                          <CardDescription className="text-xs">
                            Часто задаваемые вопросы
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="px-3 py-2">
                          <ul className="space-y-1 text-sm">
                            {[
                              "Какая цена на товар X?",
                              "Как оформить заказ?",
                              "Когда будет доставка?",
                              "Есть ли скидки?",
                              "Как связаться с менеджером?",
                            ].map((query, i) => (
                              <li
                                key={i}
                                className="flex justify-between items-center p-1 border-b last:border-0"
                              >
                                <span className="text-xs">{query}</span>
                                <span className="text-muted-foreground text-xs">
                                  {Math.floor(Math.random() * 50) + 10} раз
                                </span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Назад
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdating || !formChanged}
                  className={
                    !formChanged ? "opacity-50 cursor-not-allowed" : ""
                  }
                >
                  {isUpdating && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  <Save className="h-4 w-4 mr-2" />
                  Сохранить изменения
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </DialogContent>

      {/* Диалоги для управления ассистентом */}
      <KnowledgeBaseDialog
        open={knowledgeBaseDialogOpen}
        onOpenChange={(open) => {
          // При закрытии диалога сбрасываем флаг initialUploadMode
          if (!open) {
            setKnowledgeBaseFileUpload(false);
          }
          setKnowledgeBaseDialogOpen(open);
        }}
        initialUploadMode={knowledgeBaseFileUpload}
        assistant={{
          id: assistant.id,
          name: assistant.name,
          role: assistant.role,
          status: assistant.status,
          description: assistant.description || null,
          instructions: assistant.instructions || null,
          openaiAssistantId: assistant.openaiAssistantId || null,
          model: assistant.model || null,
          createdBy: 1,
          lastUpdated: new Date(),
          prompt: "",
          settings: {},
        }}
      />

      <AssistantTestDialog
        open={testDialogOpen}
        onOpenChange={setTestDialogOpen}
        assistant={assistant}
      />
    </Dialog>
  );
}
