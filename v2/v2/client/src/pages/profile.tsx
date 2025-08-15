import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import {
  Loader2,
  User,
  CreditCard,
  Phone,
  Mail,
  Award,
  Server,
  Pencil,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

// Интерфейс для данных использования ресурсов
interface UsageData {
  noPlan?: boolean;
  messages: {
    used: number;
    limit: number;
    percentage: number;
  };
  knowledge: {
    used: number;
    limit: number;
    percentage: number;
  };
  callMinutes: {
    used: number;
    limit: number;
    percentage: number;
  };
  users: {
    used: number;
    limit: number;
    percentage: number;
  };
  assistants: {
    used: number;
    limit: number;
    percentage: number;
  };
  channels: {
    used: number;
    limit: number;
    percentage: number;
  };
  apiCalls: {
    used: number;
    limit: number;
    percentage: number;
  };
  nextReset: string;
}

// Схема для валидации данных пользователя
const userFormSchema = z
  .object({
    name: z.string().optional(),
    email: z
      .string()
      .email("Некорректный формат email")
      .optional()
      .or(z.literal("")),
    phone: z
      .string()
      .regex(/^\+7\d{10}$/, "Телефон должен быть в формате +79XXXXXXXXX")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      // Проверяем, что хотя бы одно из полей (email или phone) заполнено
      return data.email || data.phone;
    },
    {
      message: "Необходимо указать email или телефон",
      path: ["email"], // Указываем путь к полю, чтобы сообщение об ошибке отображалось под полем email
    }
  );

type UserFormData = z.infer<typeof userFormSchema>;

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Получаем данные об использовании ресурсов
  const { data: usageData, isLoading: isUsageLoading } = useQuery<UsageData>({
    queryKey: ["/api/usage", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await fetch(`/api/usage/${user.id}`);
      if (!response.ok) {
        throw new Error("Не удалось получить данные использования");
      }
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Настройка формы с react-hook-form
  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });

  // Мутация для обновления данных пользователя
  const updateUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      if (!user?.id) throw new Error("User ID is required");

      // Обработка пустых строк
      const formattedData = {
        ...data,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
      };

      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: "Не удалось обновить данные пользователя",
        }));

        // Проверяем сообщение ошибки на типичные случаи
        const errorMessage =
          errorData.message ||
          errorData.error ||
          "Не удалось обновить данные пользователя";
        const errorCode = errorData.code || errorData.error;

        // Обрабатываем конкретные коды ошибок, если они есть
        if (
          errorCode === "EMAIL_ALREADY_EXISTS" ||
          (errorMessage.includes("Почта") &&
            errorMessage.includes("уже используется"))
        ) {
          throw new Error(`Этот email уже используется другим пользователем`);
        } else if (
          errorCode === "PHONE_ALREADY_EXISTS" ||
          (errorMessage.includes("Телефон") &&
            errorMessage.includes("уже используется"))
        ) {
          throw new Error(
            `Этот номер телефона уже используется другим пользователем`
          );
        } else {
          throw new Error(errorMessage);
        }
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Профиль обновлен",
        description: "Данные пользователя успешно обновлены",
      });
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка сохранения",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UserFormData) => {
    updateUserMutation.mutate(data);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p>Загрузка данных пользователя...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-16">
      <h1 className="text-2xl font-bold tracking-tight">
        Профиль пользователя
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Карточка с основной информацией о пользователе */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Личная информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center mb-6">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-12 w-12 text-primary" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm font-medium">Имя:</span>
                <span className="ml-auto font-medium">
                  {user.name || "Не указано"}
                </span>
                <button
                  onClick={() => setIsDialogOpen(true)}
                  className="ml-2 rounded-full p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm font-medium">Email:</span>
                <span className="ml-auto font-medium">
                  {user.email || "Не указан"}
                </span>
              </div>

              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm font-medium">Телефон:</span>
                <span className="ml-auto font-medium">
                  {user.phone || "Не указан"}
                </span>
              </div>

              <div className="flex items-center">
                <Badge
                  className="ml-auto"
                  variant={user.status === "active" ? "default" : "destructive"}
                >
                  {user.status === "active" ? "Активен" : "Неактивен"}
                </Badge>
              </div>

              <div className="flex items-center">
                <Award className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm font-medium">Роль:</span>
                <span className="ml-auto font-medium capitalize">
                  {user.role || "Пользователь"}
                </span>
              </div>

              {user.referralCode && (
                <div className="flex items-center">
                  <Server className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm font-medium">Реферальный код:</span>
                  <span className="ml-auto font-medium">
                    {user.referralCode}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Карточка с тарифным планом */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Тарифный план</CardTitle>
          </CardHeader>
          <CardContent>
            {isUsageLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <p>Загрузка информации о тарифе...</p>
              </div>
            ) : usageData ? (
              <div>
                <div className="flex items-center mb-4">
                  <CreditCard className="h-6 w-6 mr-2 text-primary" />
                  <h3 className="text-lg font-semibold">
                    {usageData.noPlan
                      ? "Тариф не подключен"
                      : `Тариф: ${user.plan || "Базовый"}`}
                  </h3>
                </div>

                {usageData.noPlan ? (
                  <div className="mt-6">
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg mb-4">
                      <h4 className="text-base font-medium mb-2">
                        Подключите тариф для доступа к полному функционалу
                      </h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Выберите подходящий тарифный план, чтобы использовать
                        все возможности платформы: автоматические ответы, базу
                        знаний, интеграции с каналами и многое другое.
                      </p>
                      <Link href="/billing?tab=plans">
                        <Button className="w-full sm:w-auto">
                          Выбрать тариф <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>

                    {user.balance !== undefined && user.balance !== null && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Баланс:{" "}
                        {Math.floor(user.balance / 100).toLocaleString("ru-RU")}{" "}
                        ₽
                      </p>
                    )}
                    {user.totalSpent !== undefined && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Всего потрачено:{" "}
                        {Math.floor(user.totalSpent / 100).toLocaleString(
                          "ru-RU"
                        )}{" "}
                        ₽
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground">
                        Следующее списание:{" "}
                        {new Date(usageData.nextReset).toLocaleDateString(
                          "ru-RU"
                        )}
                      </p>
                      {user.balance !== undefined && user.balance !== null && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Баланс:{" "}
                          {Math.floor(user.balance / 100).toLocaleString(
                            "ru-RU"
                          )}{" "}
                          ₽
                        </p>
                      )}
                      {user.totalSpent !== undefined && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Всего потрачено:{" "}
                          {Math.floor(user.totalSpent / 100).toLocaleString(
                            "ru-RU"
                          )}{" "}
                          ₽
                        </p>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-medium">Сообщения</h4>
                          <p className="text-sm text-muted-foreground">
                            {usageData.messages.used.toLocaleString("ru-RU")} /{" "}
                            {usageData.messages.limit.toLocaleString("ru-RU")}
                          </p>
                        </div>
                        <div className="h-2 bg-secondary rounded-full">
                          <div
                            className="h-2 bg-primary rounded-full"
                            style={{
                              width: `${usageData.messages.percentage}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-medium">База знаний</h4>
                          <p className="text-sm text-muted-foreground">
                            {usageData.knowledge.used.toLocaleString("ru-RU")}{" "}
                            ГБ /{" "}
                            {usageData.knowledge.limit.toLocaleString("ru-RU")}{" "}
                            ГБ
                          </p>
                        </div>
                        <div className="h-2 bg-secondary rounded-full">
                          <div
                            className="h-2 bg-emerald-500 rounded-full"
                            style={{
                              width: `${usageData.knowledge.percentage}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-medium">
                            Виртуальные ассистенты
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {usageData.assistants.used.toLocaleString("ru-RU")}{" "}
                            /{" "}
                            {usageData.assistants.limit.toLocaleString("ru-RU")}
                          </p>
                        </div>
                        <div className="h-2 bg-secondary rounded-full">
                          <div
                            className="h-2 bg-blue-500 rounded-full"
                            style={{
                              width: `${usageData.assistants.percentage}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-medium">Каналы связи</h4>
                          <p className="text-sm text-muted-foreground">
                            {usageData.channels.used.toLocaleString("ru-RU")} /{" "}
                            {usageData.channels.limit.toLocaleString("ru-RU")}
                          </p>
                        </div>
                        <div className="h-2 bg-secondary rounded-full">
                          <div
                            className="h-2 bg-indigo-500 rounded-full"
                            style={{
                              width: `${usageData.channels.percentage}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="text-center py-4">Информация о тарифе недоступна</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Диалог редактирования пользователя */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактирование пользователя</DialogTitle>
            <DialogDescription>
              Измените данные пользователя и нажмите "Сохранить" для сохранения
              изменений.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Имя</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Полное имя пользователя или название компании"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Полное имя пользователя или название компании
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Email пользователя для входа в систему"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Email пользователя для входа в систему
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Телефон</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Номер телефона пользователя в формате +7XXXXXXXXXX"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Номер телефона пользователя в формате +79XXXXXXXXX
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Отмена
                </Button>
                <Button type="submit" disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Сохранить
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
