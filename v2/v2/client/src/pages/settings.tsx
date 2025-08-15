import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Book } from "lucide-react";
import SettingsInstructionsDialog from "@/components/settings/settings-instructions-dialog";

// Схема для валидации формы
const formSchema = z.object({
  email: z.string().email({ message: "Введите корректный email-адрес" }),
});

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [instructionsDialogOpen, setInstructionsDialogOpen] = useState(false);

  // Получаем баланс пользователя
  const { data: balanceData } = useQuery({
    queryKey: ["/api/balance", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return apiRequest({
        url: `/api/balance/${user.id}`,
        method: "GET",
      });
    },
    enabled: !!user?.id,
  });

  // Настраиваем форму
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: user?.email || "",
    },
  });

  // Следим за изменениями в форме
  const currentEmail = form.watch("email");
  const isEmailUnchanged = currentEmail === user?.email;

  // Обновляем значение email в форме, когда данные пользователя загружены
  useEffect(() => {
    if (user?.email) {
      form.setValue("email", user.email);
    }
  }, [user?.email, form]);

  // Мутация для обновления email
  const updateEmailMutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      if (!user?.id) throw new Error("Пользователь не авторизован");
      return apiRequest({
        url: `/api/users/${user.id}/update-email`,
        method: "PATCH",
        body: data,
      });
    },
    onSuccess: () => {
      // Сбрасываем возможные ошибки формы
      form.clearErrors();

      toast({
        title: "Успешно!",
        description: "Ваш email успешно обновлен",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: any) => {
      let errorMessage = "Произошла ошибка при обновлении email";

      // Проверяем различные варианты ошибки о том, что email уже используется
      const isEmailInUseError =
        error?.message?.includes("already in use") ||
        error?.message?.includes("409") ||
        (error?.response?.data?.error &&
          error?.response?.data?.error.includes("already in use")) ||
        (error?.response?.data?.message &&
          error?.response?.data?.message.includes("already in use")) ||
        error?.response?.status === 409;

      if (isEmailInUseError) {
        errorMessage =
          "Этот email уже используется другим пользователем. Пожалуйста, укажите другой адрес электронной почты.";

        // Устанавливаем ошибку прямо в форму для более заметного отображения
        form.setError("email", {
          type: "manual",
          message: "Email уже используется. Укажите другой адрес.",
        });
      }

      // Отображаем уведомление с понятным сообщением об ошибке
      toast({
        title: "Не удалось обновить email",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      await updateEmailMutation.mutateAsync(data);
    } catch (error) {
      // Ошибка уже обрабатывается в onError функции мутации,
      // здесь мы просто перехватываем её, чтобы не прерывать выполнение
      console.log("Email update error intercepted:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-3xl font-bold">Настройки профиля</h1>
            <p className="text-muted-foreground">
              Управление личными данными и безопасностью аккаунта
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setInstructionsDialogOpen(true)}
            title="Инструкция по настройкам профиля"
            className="bg-purple-200 hover:bg-purple-300"
          >
            <Book className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Блок с формой обновления email */}
      <Card>
        <CardHeader>
          <CardTitle>Обновление email</CardTitle>
          <CardDescription>
            Введите и сохраните ваш email-адрес для получения уведомлений
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="your@email.com"
                        {...field}
                        onChange={(e) => {
                          const lower = e.target.value.toLowerCase();
                          field.onChange(lower);
                        }}
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      Заглавные буквы будут приведены к нижнему регистру
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  updateEmailMutation.isPending ||
                  isEmailUnchanged
                }
              >
                {isSubmitting ? "Сохранение..." : "Сохранить"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Блок с информацией о пользователе */}
      <Card>
        <CardHeader>
          <CardTitle>Данные пользователя</CardTitle>
          <CardDescription>
            Основная информация о вашем аккаунте
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  ID пользователя
                </p>
                <p className="text-lg font-medium">
                  {user?.id || "Загрузка..."}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Баланс
                </p>
                <p className="text-lg font-medium">
                  {balanceData
                    ? `${new Intl.NumberFormat("ru-RU", {
                        style: "decimal",
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(balanceData.balance / 100)} руб.`
                    : "Загрузка..."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Тарифный план
                </p>
                <p className="text-lg font-medium">
                  {user?.plan || "Не указан"}
                </p>
              </div>
              {user?.phone && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Номер телефона
                  </p>
                  <p className="text-lg font-medium">{user.phone}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog for instructions */}
      <SettingsInstructionsDialog
        open={instructionsDialogOpen}
        onOpenChange={setInstructionsDialogOpen}
      />
    </div>
  );
}
