import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  UserCircle,
  Clock,
  BadgeDollarSign,
  Users,
  Filter,
  UserCog,
  Book,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { User, ReferralTransaction } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useToastContext } from "@/contexts/ToastContext";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { UserForm } from "@/components/team/UserForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { TruncatedText } from "@/components/ui/truncated-text";
import { useMediaQuery } from "@/hooks/use-media-query";
import MobileTeamPage from "@/components/team/MobileTeamPage";
import TeamInstructionsDialog from "@/components/team/team-instructions-dialog";

export default function TeamPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { showSuccessToast, showErrorToast } = useToastContext();
  const [activeTab, setActiveTab] = useState("referrals");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [instructionsDialogOpen, setInstructionsDialogOpen] = useState(false);

  // Определяем текущий брейкпоинт для адаптивности
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  // Состояние для мобильных вкладок
  const [mobileActiveTab, setMobileActiveTab] = useState<string>("referrals");

  // Состояния для фильтров
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");

  // Получаем список рефералов
  const { data: referrals, isLoading: isReferralsLoading } = useQuery<User[]>({
    queryKey: ["/api/users/referrer", user?.id],
    queryFn: () =>
      apiRequest({
        url: `/api/users/referrer/${user?.id}`,
        method: "GET",
      }),
    enabled: !!user?.id,
  });

  // Получаем список транзакций
  const { data: referralTransactions, isLoading: isTransactionsLoading } =
    useQuery<ReferralTransaction[]>({
      queryKey: ["/api/transactions/referrer", user?.id],
      queryFn: () =>
        apiRequest({
          url: `/api/transactions/referrer/${user?.id}`,
          method: "GET",
        }),
      enabled: !!user?.id,
    });

  // Получаем всех пользователей для отображения данных в транзакциях и других разделах
  const { data: allClientsData } = useQuery<User[]>({
    queryKey: ["/api/users/all-clients"],
    queryFn: () =>
      apiRequest({
        url: "/api/users/all-clients",
        method: "GET",
      }),
    enabled: !!user?.id,
    retry: (failureCount, error) => {
      // Если получаем 403, не пытаемся повторять запрос
      if (error && (error as any).status === 403) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Получаем список сопровождаемых пользователей
  const {
    data: managedUsers,
    isLoading: isManagedUsersLoading,
    refetch: refetchManagedUsers,
  } = useQuery<User[]>({
    queryKey: ["/api/users/manager", user?.id],
    queryFn: () =>
      apiRequest({
        url: `/api/users/manager/${user?.id}`,
        method: "GET",
      }),
    enabled:
      !!user?.id &&
      (user?.role === "manager" || user?.role === "admin") &&
      activeTab === "managed",
  });

  // Получаем список пользователей без менеджера
  const { data: usersWithoutManager, isLoading: isUsersWithoutManagerLoading } =
    useQuery<User[]>({
      queryKey: ["/api/users/without-manager"],
      queryFn: () =>
        apiRequest({
          url: "/api/users/without-manager",
          method: "GET",
        }),
      enabled:
        !!user?.id &&
        (user?.role === "manager" || user?.role === "admin") &&
        activeTab === "managed",
    });

  // Получаем список всех пользователей (только для админов)
  const { data: allUsers, isLoading: isAllUsersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: () =>
      apiRequest({
        url: "/api/users",
        method: "GET",
      }),
    enabled: !!user?.id && user?.role === "admin" && activeTab === "all-users",
  });

  // Получаем вознаграждение
  const { data: commission } = useQuery<{ totalCommission: number }>({
    queryKey: ["/api/commission", user?.id, "referrer"],
    queryFn: () =>
      apiRequest({
        url: `/api/commission/${user?.id}/referrer`,
        method: "GET",
      }),
    enabled:
      !!user?.id &&
      (user?.role === "referral" ||
        user?.role === "admin" ||
        user?.role === "manager" ||
        user?.role === "user"),
  });

  // Получаем список всех менеджеров для выпадающих списков
  const { data: managersData, isLoading: isManagersLoading } = useQuery<User[]>(
    {
      queryKey: ["/api/users/role/manager"],
      queryFn: () =>
        apiRequest({
          url: "/api/users/role/manager",
          method: "GET",
        }),
      enabled:
        !!user?.id &&
        (activeTab === "managed" ||
          activeTab === "referrals" ||
          activeTab === "all-users"),
    }
  );

  // Создаем полный список менеджеров, включая текущего пользователя (реферрера)
  // Это позволит реферреру назначить себя менеджером своих рефералов
  const managers = useMemo(() => {
    // Если пользователь еще не загружен или менеджеры не загружены, возвращаем пустой массив
    if (!user || !managersData) return [];

    // Создаем копию массива менеджеров
    const allManagers = [...managersData];

    // Проверяем, является ли текущий пользователь реферрером для отображаемых рефералов
    const isUserReferrerForDisplayedUsers = !!referrals?.length;

    // Если пользователь является реферрером и его еще нет в списке менеджеров
    if (
      isUserReferrerForDisplayedUsers &&
      !allManagers.some((m) => m.id === user.id)
    ) {
      // Добавляем только необходимые свойства для менеджера
      allManagers.push({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone ?? null,
        // Остальные поля с дефолтными значениями, требуемыми типом
        password: null,
        status: "active",
        createdAt: new Date(),
        lastLogin: null,
        plan: null,
        referrerId: null,
        managerId: null,
        totalSpent: null,
        referralCode: user.referralCode || "",
        balance: 0,
        referralCommission: 0,
        trialUsed: false, // 🆕 добавлено
        trialEndDate: null,
      });
    }

    return allManagers;
  }, [user, managersData, referrals]);

  // Функция для форматирования даты
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  // Доступны ли определенные вкладки для текущего пользователя
  const canAccessManaged = user?.role === "manager" || user?.role === "admin";
  const canAccessAllUsers = user?.role === "admin";
  const canAccessPayments = true; // Все пользователи имеют доступ к вкладке платежей

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Функция для обновления менеджера пользователя
  const handleUpdateUserManager = async (
    userId: number,
    currentManagerId: number | null,
    selectedManagerId?: number | null
  ) => {
    if (!user) return;

    try {
      console.log(`Обновление менеджера для пользователя ${userId}`);
      console.log(
        `Текущий менеджер: ${currentManagerId}, Выбранный менеджер: ${selectedManagerId}`
      );

      // Используем или выбранный пользователем ID, или текущего пользователя
      let newManagerId: number | null;

      if (selectedManagerId !== undefined) {
        // Если передан выбранный ID, используем его
        newManagerId = selectedManagerId;
        console.log(`Используем выбранный ID менеджера: ${newManagerId}`);
      } else {
        // Иначе логика по умолчанию - если текущим менеджером является текущий пользователь, убираем его
        // иначе - назначаем текущего пользователя менеджером
        newManagerId = currentManagerId === user.id ? null : user.id;
        console.log(
          `Используем логику по умолчанию для менеджера: ${newManagerId}`
        );
      }

      console.log(`Отправляем запрос на обновление менеджера: ${newManagerId}`);

      const response = await apiRequest({
        url: `/api/users/${userId}/manager`,
        method: "PUT",
        body: { managerId: newManagerId },
        headers: { "Content-Type": "application/json" },
      });

      console.log("Ответ сервера:", response);

      // Перезагружаем все связанные данные
      queryClient.invalidateQueries({ queryKey: ["/api/users/manager"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/referrer"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/users/without-manager"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/all-clients"] });

      // Отображаем тост через контекст
      showSuccessToast(
        newManagerId
          ? "Пользователь добавлен в сопровождение"
          : "Сопровождение отменено",
        newManagerId
          ? "Вы стали менеджером этого пользователя"
          : "Вы больше не сопровождаете этого пользователя"
      );

      // Отображаем также через стандартный механизм
      toast({
        title: newManagerId
          ? "Пользователь добавлен в сопровождение"
          : "Сопровождение отменено",
        description: newManagerId
          ? "Вы стали менеджером этого пользователя"
          : "Вы больше не сопровождаете этого пользователя",
      });
    } catch (error) {
      console.error("Error updating user manager:", error);

      // Используем оба метода отображения тостов для надежности
      showErrorToast(
        "Ошибка",
        error instanceof Error
          ? error.message
          : "Не удалось обновить менеджера пользователя"
      );

      toast({
        title: "Ошибка",
        description:
          error instanceof Error
            ? error.message
            : "Не удалось обновить менеджера пользователя",
        variant: "destructive",
      });
    }
  };

  // Открытие диалога редактирования пользователя
  const handleEditUser = (userToEdit: User) => {
    setEditingUser(userToEdit);
    setUserDialogOpen(true);
  };

  // Закрытие диалога редактирования
  const handleCloseUserDialog = () => {
    setEditingUser(null);
    setUserDialogOpen(false);
  };

  // Функция для фильтрации пользователей
  const getFilteredUsers = () => {
    if (!allUsers) return [];

    return [...allUsers]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .filter((userItem) => {
        const passesNameFilter =
          !nameFilter ||
          (userItem.name?.toLowerCase().includes(nameFilter.toLowerCase()) ??
            false);

        const passesEmailFilter =
          !emailFilter ||
          userItem.email?.toLowerCase().includes(emailFilter.toLowerCase());

        const passesRoleFilter =
          !roleFilter || roleFilter === "all" || userItem.role === roleFilter;

        const passesPlanFilter =
          !planFilter || planFilter === "all" || userItem.plan === planFilter;

        // Все фильтры должны проходить для отображения пользователя
        return (
          passesNameFilter &&
          passesEmailFilter &&
          passesRoleFilter &&
          passesPlanFilter
        );
      });
  };

  // Сброс всех фильтров
  const resetFilters = () => {
    setNameFilter("");
    setEmailFilter("");
    setRoleFilter("");
    setPlanFilter("");
    setFilterDialogOpen(false);
  };

  // Обработка отправки формы редактирования пользователя
  const handleUserFormSubmit = async (data: any) => {
    if (!editingUser) return;

    // Проверяем наличие email или телефона
    if (!data.email && !data.phone) {
      toast({
        title: "Ошибка сохранения",
        description: "Необходимо указать email или телефон пользователя",
        variant: "destructive",
      });
      return;
    }

    try {
      // Обновляем данные пользователя через API
      await apiRequest({
        url: `/api/users/${editingUser.id}`,
        method: "PUT",
        body: data,
        headers: { "Content-Type": "application/json" },
      });

      // Закрываем диалог и обновляем данные
      setUserDialogOpen(false);

      // Обновляем все данные на странице
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/manager"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/referrer"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/all-clients"] });

      // Если изменился тариф, дополнительно обновляем данные о лимитах и использовании
      if (data.plan && data.plan !== editingUser.plan) {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
        queryClient.invalidateQueries({ queryKey: ["/api/limits"] });
        queryClient.invalidateQueries({ queryKey: ["/api/user-plan-usage"] });
      }

      toast({
        title: "Пользователь обновлен",
        description: "Данные пользователя успешно обновлены",
      });
    } catch (error: any) {
      console.error("Error updating user:", error);

      // Пытаемся извлечь текст ошибки из ответа сервера
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Не удалось обновить данные пользователя";

      toast({
        title: "Ошибка",
        description: message,
        variant: "destructive",
      });
    }
  };

  function getRusPlan(plan: string | null) {
    if (plan === "free") return "Бесплатный";
    if (plan === "basic") return "Базовый";
    if (plan === "standart") return "Стандартный";
    if (plan === "enterprise") return "Корпоративный";
  }

  function getRusRole(role: string | null) {
    if (role === "admin") return "Админ";
    if (role === "manager") return "Менеджер";
    if (role === "user") return "Клиент";
    if (role === "referral") return "Реферал";
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-3xl font-bold">Моя команда</h1>
            <p className="text-slate-500 mt-1">
              Управление рефералами и вознаграждениями
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setInstructionsDialogOpen(true)}
            title="Инструкция по работе с командой"
            className="bg-purple-200 hover:bg-purple-300"
          >
            <Book className="h-5 w-5" />
          </Button>
        </div>

        {commission && (
          <Card className="md:w-64 mt-4 md:mt-0">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <BadgeDollarSign className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm text-slate-500">Общее вознаграждение</p>
                  <p className="text-2xl font-bold">
                    {(commission.totalCommission / 100).toFixed(2)} ₽
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Десктопная версия с табами - скрываем на мобильных */}
      <div className={isDesktop ? "block" : "hidden"}>
        <Tabs defaultValue="referrals" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="referrals">Рефералы</TabsTrigger>
            <TabsTrigger value="payments">Выплаты</TabsTrigger>
            {canAccessManaged && (
              <TabsTrigger value="managed">Сопровождение</TabsTrigger>
            )}
            {canAccessAllUsers && (
              <TabsTrigger value="all-users">Все пользователи</TabsTrigger>
            )}
          </TabsList>

          {/* Вкладка Рефералы */}
          <TabsContent value="referrals" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Мои рефералы</CardTitle>
                <CardDescription>
                  Пользователи, зарегистрированные по вашей реферальной ссылке
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isReferralsLoading ? (
                  <div className="py-8 flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : referrals && referrals.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Пользователь</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Дата регистрации</TableHead>
                        <TableHead>Менеджер</TableHead>
                        <TableHead className="text-right">
                          Вознаграждение
                        </TableHead>
                        <TableHead>Выбор менеджера</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...referrals]
                        .sort(
                          (a, b) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime()
                        )
                        .map((referral) => (
                          <TableRow key={referral.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center space-x-2">
                                <UserCircle className="w-5 h-5 text-slate-400" />
                                <TruncatedText
                                  text={referral.name || referral.email}
                                  maxLength={20}
                                />
                              </div>
                            </TableCell>
                            <TableCell>
                              <div
                                className={`px-2 py-1 rounded-full text-xs inline-block ${
                                  referral.status === "active"
                                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                }`}
                              >
                                {referral.status === "active"
                                  ? "Активен"
                                  : referral.status}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4 text-slate-400" />
                                <span>{formatDate(referral.createdAt)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {referral.managerId ? (
                                <div className="flex items-center space-x-1">
                                  <UserCog className="w-4 h-4 text-slate-400" />
                                  <TruncatedText
                                    text={
                                      managers?.find(
                                        (m) => m.id === referral.managerId
                                      )?.name ||
                                      managers?.find(
                                        (m) => m.id === referral.managerId
                                      )?.email ||
                                      `ID: ${referral.managerId}`
                                    }
                                    maxLength={20}
                                  />
                                </div>
                              ) : (
                                <span className="text-slate-400 text-sm">
                                  Не назначен
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {isTransactionsLoading ? (
                                <div className="flex justify-end">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                </div>
                              ) : (
                                <div className="flex items-center justify-center space-x-1">
                                  <span className="font-semibold text-green-600 dark:text-green-400">
                                    {(
                                      ((referral.referralCommission || 0) +
                                        (referralTransactions
                                          ?.filter(
                                            (tx) =>
                                              tx.userId === referral.id &&
                                              tx.description?.includes(
                                                "Пополнение баланса"
                                              )
                                          )
                                          ?.reduce(
                                            (sum, tx) =>
                                              sum +
                                              (tx.referralCommission || 0),
                                            0
                                          ) || 0)) /
                                      100
                                    ).toFixed(2)}{" "}
                                    ₽
                                  </span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Select
                                value={
                                  referral.managerId
                                    ? referral.managerId.toString()
                                    : "null"
                                }
                                onValueChange={(value) => {
                                  const newManagerId =
                                    value === "null" ? null : parseInt(value);
                                  handleUpdateUserManager(
                                    referral.id,
                                    referral.managerId,
                                    newManagerId
                                  );
                                }}
                              >
                                <SelectTrigger className="w-[200px] justify-center">
                                  <SelectValue placeholder="Выберите менеджера" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="null">
                                    Не назначен
                                  </SelectItem>
                                  {managers?.map((manager) => (
                                    <SelectItem
                                      key={manager.id}
                                      value={manager.id.toString()}
                                    >
                                      {manager.name ||
                                        manager.email ||
                                        `ID: ${manager.id}`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-12 text-center">
                    <Users className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      У вас пока нет рефералов
                    </h3>
                    <p className="text-slate-500 mb-4 max-w-md mx-auto">
                      Чтобы привлечь рефералов, поделитесь своей реферальной
                      ссылкой с потенциальными клиентами.
                    </p>
                    <a href="/referrals">
                      <Button variant="outline" asChild>
                        Перейти к реферальной программе
                      </Button>
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Вкладка Выплаты */}
          <TabsContent value="payments" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>История выплат</CardTitle>
                <CardDescription>
                  Вознаграждения от платежей ваших рефералов
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isTransactionsLoading ? (
                  <div className="py-8 flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : referralTransactions && referralTransactions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Реферал</TableHead>
                        <TableHead>Дата</TableHead>
                        <TableHead>Описание</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Сумма платежа</TableHead>
                        <TableHead>Вознаграждение</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {referralTransactions
                        .filter((tx) =>
                          tx.description?.includes("Пополнение баланса")
                        )
                        .map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium">
                              <TruncatedText
                                text={
                                  allClientsData?.find(
                                    (user) => user.id === transaction.userId
                                  )?.name ||
                                  allClientsData?.find(
                                    (user) => user.id === transaction.userId
                                  )?.email ||
                                  `ID: ${transaction.userId}`
                                }
                                maxLength={20}
                              />
                            </TableCell>
                            <TableCell>
                              {formatDate(transaction.createdAt)}
                            </TableCell>
                            <TableCell>
                              {`Пополнение баланса на ${Math.floor(
                                transaction.amount / 100
                              )} ₽` || "Платеж за услуги"}
                            </TableCell>
                            <TableCell>
                              <div
                                className={`px-2 py-1 rounded-full text-xs inline-block ${
                                  transaction.status === "processed"
                                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                    : transaction.status === "pending"
                                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                                    : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                }`}
                              >
                                {transaction.status === "processed"
                                  ? "Обработан"
                                  : transaction.status === "pending"
                                  ? "В обработке"
                                  : "Ошибка"}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {Math.floor(transaction.amount / 100)} ₽
                            </TableCell>
                            <TableCell className="text-center font-semibold text-green-600 dark:text-green-400">
                              {Math.floor(
                                (transaction.referralCommission || 0) / 100
                              )}{" "}
                              ₽
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-12 text-center">
                    <BadgeDollarSign className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      Нет информации о выплатах
                    </h3>
                    <p className="text-slate-500 mb-4 max-w-md mx-auto">
                      Когда ваши рефералы начнут оплачивать услуги, вы будете
                      получать вознаграждение с каждого платежа.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Вкладка Сопровождение (для менеджеров) */}
          {canAccessManaged && (
            <TabsContent value="managed" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Сопровождаемые пользователи</CardTitle>
                  <CardDescription>
                    Пользователи, которых вы сопровождаете как менеджер
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isManagedUsersLoading || isUsersWithoutManagerLoading ? (
                    <div className="py-8 flex justify-center">
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                  ) : (
                    <Tabs defaultValue="current" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="current">Мои клиенты</TabsTrigger>
                        <TabsTrigger value="available">
                          Доступные для сопровождения
                        </TabsTrigger>
                      </TabsList>

                      {/* Вкладка с текущими клиентами менеджера */}
                      <TabsContent value="current">
                        {managedUsers && managedUsers.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Пользователь</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Статус</TableHead>
                                <TableHead>Тариф</TableHead>
                                <TableHead>Дата регистрации</TableHead>
                                <TableHead className="text-right">
                                  Вознаграждение
                                </TableHead>
                                <TableHead>Выбор менеджера</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {[...managedUsers]
                                .sort(
                                  (a, b) =>
                                    new Date(b.createdAt).getTime() -
                                    new Date(a.createdAt).getTime()
                                )
                                .map((managedUser) => (
                                  <TableRow key={managedUser.id}>
                                    <TableCell className="font-medium">
                                      <div className="flex items-center space-x-2">
                                        <UserCircle className="w-5 h-5 text-slate-400" />
                                        <TruncatedText
                                          text={managedUser.name || "Нет имени"}
                                          maxLength={20}
                                        />
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <TruncatedText
                                        text={managedUser.email || ""}
                                        maxLength={25}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <div
                                        className={`px-2 py-1 rounded-full text-xs inline-block ${
                                          managedUser.status === "active"
                                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                        }`}
                                      >
                                        {managedUser.status === "active"
                                          ? "Активен"
                                          : managedUser.status}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div
                                        className={`px-2 py-1 rounded-full text-xs inline-block ${
                                          managedUser.plan === "enterprise"
                                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                                            : managedUser.plan === "standart"
                                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                        }`}
                                      >
                                        {getRusPlan(managedUser.plan)}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {formatDate(managedUser.createdAt)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {isTransactionsLoading ? (
                                        <div className="flex justify-end">
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-end space-x-1">
                                          <span className="font-semibold text-green-600 dark:text-green-400">
                                            {Math.floor(
                                              (referralTransactions
                                                ?.filter(
                                                  (tx) =>
                                                    tx.userId ===
                                                      managedUser.id &&
                                                    tx.description?.includes(
                                                      "Пополнение баланса"
                                                    )
                                                )
                                                ?.reduce(
                                                  (sum, tx) =>
                                                    sum +
                                                    (tx.managerCommission || 0),
                                                  0
                                                ) || 0) / 100
                                            )}{" "}
                                            ₽
                                          </span>
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Select
                                        value={
                                          managedUser.managerId
                                            ? managedUser.managerId.toString()
                                            : "null"
                                        }
                                        onValueChange={(value) => {
                                          const newManagerId =
                                            value === "null"
                                              ? null
                                              : parseInt(value);
                                          handleUpdateUserManager(
                                            managedUser.id,
                                            managedUser.managerId,
                                            newManagerId
                                          );
                                        }}
                                      >
                                        <SelectTrigger className="w-[200px]">
                                          <SelectValue placeholder="Выберите менеджера" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="null">
                                            Не назначен
                                          </SelectItem>
                                          {managers?.map((manager) => (
                                            <SelectItem
                                              key={manager.id}
                                              value={manager.id.toString()}
                                            >
                                              {manager.name ||
                                                manager.email ||
                                                `ID: ${manager.id}`}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="py-12 text-center">
                            <Users className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                            <h3 className="text-lg font-medium mb-2">
                              Нет сопровождаемых пользователей
                            </h3>
                            <p className="text-slate-500 mb-4 max-w-md mx-auto">
                              Вы пока не сопровождаете ни одного пользователя в
                              качестве менеджера.
                            </p>
                          </div>
                        )}
                      </TabsContent>

                      {/* Вкладка с пользователями без менеджера */}
                      <TabsContent value="available">
                        {usersWithoutManager &&
                        usersWithoutManager.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Пользователь</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Статус</TableHead>
                                <TableHead>Тариф</TableHead>
                                <TableHead>Дата регистрации</TableHead>
                                <TableHead>Действия</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {[...usersWithoutManager]
                                .sort(
                                  (a, b) =>
                                    new Date(b.createdAt).getTime() -
                                    new Date(a.createdAt).getTime()
                                )
                                .map((userWithoutManager) => (
                                  <TableRow key={userWithoutManager.id}>
                                    <TableCell className="font-medium">
                                      <div className="flex items-center space-x-2">
                                        <UserCircle className="w-5 h-5 text-slate-400" />
                                        <TruncatedText
                                          text={
                                            userWithoutManager.name ||
                                            "Нет имени"
                                          }
                                          maxLength={20}
                                        />
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <TruncatedText
                                        text={userWithoutManager.email}
                                        maxLength={25}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <div
                                        className={`px-2 py-1 rounded-full text-xs inline-block ${
                                          userWithoutManager.status === "active"
                                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                        }`}
                                      >
                                        {userWithoutManager.status === "active"
                                          ? "Активен"
                                          : userWithoutManager.status}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div
                                        className={`px-2 py-1 rounded-full text-xs inline-block ${
                                          userWithoutManager.plan ===
                                          "enterprise"
                                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                                            : userWithoutManager.plan ===
                                              "standart"
                                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                        }`}
                                      >
                                        {getRusPlan(userWithoutManager.plan)}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {formatDate(userWithoutManager.createdAt)}
                                    </TableCell>
                                    <TableCell>
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          handleUpdateUserManager(
                                            userWithoutManager.id,
                                            null,
                                            user?.id
                                          )
                                        }
                                      >
                                        Взять на сопровождение
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="py-12 text-center">
                            <Users className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                            <h3 className="text-lg font-medium mb-2">
                              Нет пользователей без менеджера
                            </h3>
                            <p className="text-slate-500 mb-4 max-w-md mx-auto">
                              Все пользователи уже имеют назначенных менеджеров.
                            </p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Вкладка Все пользователи (только для админов) */}
          {canAccessAllUsers && (
            <TabsContent value="all-users" className="mt-6">
              <Card>
                <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>Все пользователи</CardTitle>
                    <CardDescription>
                      Управление всеми пользователями системы
                    </CardDescription>
                  </div>
                  <div className="mt-4 md:mt-0 flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => setFilterDialogOpen(true)}
                    >
                      <Filter className="w-4 h-4 mr-1" />
                      Фильтры
                      {(nameFilter ||
                        emailFilter ||
                        roleFilter ||
                        planFilter) && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 ml-2"></div>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isAllUsersLoading ? (
                    <div className="py-8 flex justify-center">
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                  ) : allUsers && allUsers.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Пользователь</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Телефон</TableHead>
                          <TableHead>Роль</TableHead>
                          <TableHead>Статус</TableHead>
                          <TableHead>Тариф</TableHead>
                          <TableHead>Менеджер</TableHead>
                          <TableHead>Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getFilteredUsers().map((userItem) => (
                          <TableRow key={userItem.id}>
                            <TableCell>{userItem.id}</TableCell>
                            <TableCell className="font-medium">
                              <TruncatedText
                                text={userItem.name || "Без имени"}
                                maxLength={20}
                              />
                            </TableCell>
                            <TableCell>
                              <TruncatedText
                                text={userItem.email}
                                maxLength={25}
                              />
                            </TableCell>
                            <TableCell>
                              <TruncatedText
                                text={userItem.phone || "Не указан"}
                                maxLength={15}
                              />
                            </TableCell>
                            <TableCell>
                              <div
                                className={`px-2 py-1 rounded-full text-xs inline-block ${
                                  userItem.role === "admin"
                                    ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                    : userItem.role === "manager"
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                    : userItem.role === "referral"
                                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                }`}
                              >
                                {getRusRole(userItem.role)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div
                                className={`px-2 py-1 rounded-full text-xs inline-block ${
                                  userItem.status === "active"
                                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                }`}
                              >
                                {userItem.status}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div
                                className={`px-2 py-1 rounded-full text-xs inline-block ${
                                  userItem.plan === "enterprise"
                                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                                    : userItem.plan === "standart"
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                }`}
                              >
                                {getRusPlan(userItem.plan)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={
                                  userItem.managerId
                                    ? userItem.managerId.toString()
                                    : "null"
                                }
                                onValueChange={(value) => {
                                  const newManagerId =
                                    value === "null" ? null : parseInt(value);
                                  handleUpdateUserManager(
                                    userItem.id,
                                    userItem.managerId,
                                    newManagerId
                                  );
                                }}
                              >
                                <SelectTrigger className="w-[200px]">
                                  <SelectValue placeholder="Выберите менеджера" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="null">
                                    Не назначен
                                  </SelectItem>
                                  {managers?.map((manager) => (
                                    <SelectItem
                                      key={manager.id}
                                      value={manager.id.toString()}
                                    >
                                      {manager.name ||
                                        manager.email ||
                                        `ID: ${manager.id}`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditUser(userItem)}
                              >
                                Редактировать
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="py-12 text-center">
                      <Users className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        Нет пользователей
                      </h3>
                      <p className="text-slate-500 mb-4 max-w-md mx-auto">
                        В системе пока нет зарегистрированных пользователей.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Мобильная версия - показываем только на мобильных */}
      <div className={isDesktop ? "hidden" : "block"}>
        <MobileTeamPage
          referrals={referrals}
          isReferralsLoading={isReferralsLoading}
          referralTransactions={referralTransactions}
          isTransactionsLoading={isTransactionsLoading}
          canAccessManaged={canAccessManaged}
          canAccessAllUsers={canAccessAllUsers}
          managedUsers={managedUsers}
          isManagedUsersLoading={isManagedUsersLoading}
          allUsers={allUsers}
          isAllUsersLoading={isAllUsersLoading}
          allClientsData={allClientsData}
          managers={managers}
          currentUser={user as User | null}
          usersWithoutManager={usersWithoutManager}
          isUsersWithoutManagerLoading={isUsersWithoutManagerLoading}
          formatDate={formatDate}
          getFilteredUsers={getFilteredUsers}
          handleEditUser={handleEditUser}
          handleUpdateUserManager={handleUpdateUserManager}
          setParentActiveTab={setActiveTab}
          parentActiveTab={activeTab}
          refetchManagedUsers={refetchManagedUsers}
          setFilterDialogOpen={setFilterDialogOpen}
          hasActiveFilters={
            !!(nameFilter || emailFilter || roleFilter || planFilter)
          }
        />
      </div>

      {/* Диалог редактирования пользователя */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto w-[90%] md:w-auto">
          <DialogHeader>
            <DialogTitle>Редактирование пользователя</DialogTitle>
            <DialogDescription>
              Измените данные пользователя и нажмите "Сохранить" для сохранения
              изменений.
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <UserForm
              user={editingUser}
              onSubmit={handleUserFormSubmit}
              onCancel={handleCloseUserDialog}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Диалог фильтрации пользователей */}
      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto w-[90%] md:w-auto">
          <DialogHeader>
            <DialogTitle>Фильтры</DialogTitle>
            <DialogDescription>
              Настройте фильтры для отображения пользователей
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label htmlFor="name-filter" className="text-sm font-medium">
                Имя пользователя
              </label>
              <input
                id="name-filter"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Введите имя пользователя"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="email-filter" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email-filter"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Введите email"
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="role-filter" className="text-sm font-medium">
                Роль
              </label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите роль" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все роли</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label htmlFor="plan-filter" className="text-sm font-medium">
                Тариф
              </label>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тариф" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все тарифы</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex justify-between mt-3 gap-3">
            <Button variant="outline" onClick={resetFilters} size="sm">
              Сбросить
            </Button>
            <Button onClick={() => setFilterDialogOpen(false)} size="sm">
              Применить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for instructions */}
      <TeamInstructionsDialog
        open={instructionsDialogOpen}
        onOpenChange={setInstructionsDialogOpen}
        userRole={user?.role}
      />
    </div>
  );
}
