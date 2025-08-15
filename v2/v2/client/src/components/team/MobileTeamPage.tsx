import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  Users,
  BadgeDollarSign,
  UserCircle,
  UserCog,
  Clock,
  Filter,
} from "lucide-react";
import { User, ReferralTransaction } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TruncatedText } from "@/components/ui/truncated-text";

interface MobileTeamPageProps {
  // Данные для рефералов
  referrals: User[] | undefined;
  isReferralsLoading: boolean;
  // Данные для транзакций
  referralTransactions: ReferralTransaction[] | undefined;
  isTransactionsLoading: boolean;
  // Права доступа
  canAccessManaged: boolean;
  canAccessAllUsers: boolean;
  // Данные для сопровождаемых пользователей
  managedUsers: User[] | undefined;
  isManagedUsersLoading: boolean;
  // Данные для всех пользователей
  allUsers: User[] | undefined;
  isAllUsersLoading: boolean;
  allClientsData: User[] | undefined;
  // Список менеджеров для выбора
  managers: User[] | undefined;
  // Текущий пользователь
  currentUser: User | null;
  // Пользователи без менеджера
  usersWithoutManager: User[] | undefined;
  isUsersWithoutManagerLoading: boolean;
  // Вспомогательные функции
  formatDate: (date: string | Date) => string;
  getFilteredUsers: () => User[];
  handleEditUser: (user: User) => void;
  handleUpdateUserManager: (
    userId: number,
    currentManagerId: number | null,
    selectedManagerId?: number | null
  ) => void;
  // Функция установки активной вкладки в родительском компоненте
  setParentActiveTab: (tab: string) => void;
  // Текущая активная вкладка в родительском компоненте
  parentActiveTab: string;
  // Функция для повторного запроса данных о сопровождаемых пользователях
  refetchManagedUsers?: () => void;
  // Функция для открытия диалога фильтров
  setFilterDialogOpen?: (open: boolean) => void;
  // Состояние фильтров
  hasActiveFilters?: boolean;
}

export default function MobileTeamPage({
  referrals,
  isReferralsLoading,
  referralTransactions,
  isTransactionsLoading,
  canAccessManaged,
  canAccessAllUsers,
  managedUsers,
  isManagedUsersLoading,
  allUsers,
  isAllUsersLoading,
  allClientsData,
  managers,
  currentUser,
  usersWithoutManager,
  isUsersWithoutManagerLoading,
  formatDate,
  getFilteredUsers,
  handleEditUser,
  handleUpdateUserManager,
  setParentActiveTab,
  parentActiveTab,
  refetchManagedUsers,
  setFilterDialogOpen,
  hasActiveFilters,
}: MobileTeamPageProps) {
  // Состояние для мобильных вкладок, инициализируем значением из родительского компонента
  const [mobileActiveTab, setMobileActiveTab] =
    useState<string>(parentActiveTab);
  const [managedMobileTab, setManagedMobileTab] = useState<string>("current");

  // Обновленная функция для переключения вкладок, которая также обновляет родительское состояние
  const handleTabChange = (tab: string) => {
    setMobileActiveTab(tab);
    setParentActiveTab(tab); // Синхронизируем с родительским состоянием

    // Выполняем повторный запрос данных при переключении на вкладку "Сопровождение"
    if (tab === "managed" && refetchManagedUsers) {
      refetchManagedUsers();
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
    <div>
      <div className="mb-4">
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={mobileActiveTab === "referrals" ? "default" : "outline"}
            className="w-full"
            onClick={() => handleTabChange("referrals")}
          >
            Рефералы
          </Button>
          <Button
            type="button"
            variant={mobileActiveTab === "payments" ? "default" : "outline"}
            className="w-full"
            onClick={() => handleTabChange("payments")}
          >
            Выплаты
          </Button>
          {canAccessManaged && (
            <Button
              type="button"
              variant={mobileActiveTab === "managed" ? "default" : "outline"}
              className="w-full"
              onClick={() => handleTabChange("managed")}
            >
              Сопровождение
            </Button>
          )}
          {canAccessAllUsers && (
            <Button
              type="button"
              variant={mobileActiveTab === "all-users" ? "default" : "outline"}
              className="w-full"
              onClick={() => handleTabChange("all-users")}
            >
              Все пользователи
            </Button>
          )}
        </div>
      </div>

      {/* Мобильная версия для рефералов */}
      {mobileActiveTab === "referrals" && (
        <div>
          <h2 className="text-lg font-medium mb-4">Мои рефералы</h2>
          <div className="h-[calc(100vh-12rem)] overflow-y-auto">
            {isReferralsLoading ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : referrals && referrals.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 pb-8">
                {[...referrals]
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                  )
                  .map((referral) => (
                    <Card key={referral.id} className="border">
                      <CardContent className="p-4">
                        {/* Верхняя часть карточки - имя, статус и вознаграждение */}
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center">
                            <UserCircle className="w-5 h-5 text-slate-400 mr-1" />
                            <h3 className="font-medium text-base">
                              <TruncatedText
                                text={
                                  referral.name || referral.email || "Нет имени"
                                }
                                maxLength={20}
                              />
                            </h3>
                          </div>
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
                        </div>

                        {/* Средняя часть - дата регистрации и менеджер */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div>
                            <div className="flex items-center text-xs text-slate-500 mb-1">
                              <Clock className="w-3.5 h-3.5 mr-1" />
                              <span>Дата регистрации</span>
                            </div>
                            <p className="text-sm">
                              {formatDate(referral.createdAt)}
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center text-xs text-slate-500 mb-1">
                              <UserCog className="w-3.5 h-3.5 mr-1" />
                              <span>Менеджер</span>
                            </div>
                            <p className="text-sm">
                              {referral.managerId ? (
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
                              ) : (
                                <span className="text-slate-400">
                                  Не назначен
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Нижняя часть - вознаграждение и выбор менеджера */}
                        <div className="flex justify-between items-end">
                          <div>
                            <div className="text-xs text-slate-500 mb-1">
                              Вознаграждение
                            </div>
                            <p className="text-lg text-green-600 font-semibold">
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
                                        sum + (tx.referralCommission || 0),
                                      0
                                    ) || 0)) /
                                100
                              ).toFixed(2)}{" "}
                              ₽
                            </p>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 mb-1">
                              Выбор менеджера
                            </div>
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
                              <SelectTrigger className="w-[130px]">
                                <SelectValue placeholder="Выберите" />
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
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Users className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  У вас пока нет рефералов
                </h3>
                <p className="text-slate-500 mb-4 max-w-md mx-auto">
                  Чтобы привлечь рефералов, поделитесь своей реферальной ссылкой
                  с потенциальными клиентами.
                </p>
                <a href="/referrals">
                  <Button variant="outline" asChild>
                    Перейти к реферальной программе
                  </Button>
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Мобильная версия для выплат */}
      {mobileActiveTab === "payments" && (
        <div>
          <h2 className="text-lg font-medium mb-4">История выплат</h2>
          <p className="text-sm text-slate-500 mb-4">
            Вознаграждения от платежей ваших рефералов
          </p>
          <div className="h-[calc(100vh-14rem)] overflow-y-auto">
            {isTransactionsLoading ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : referralTransactions && referralTransactions.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 pb-8">
                {referralTransactions
                  .filter((tx) =>
                    tx.description?.includes("Пополнение баланса")
                  )
                  .map((transaction) => (
                    <Card key={transaction.id} className="border">
                      <CardContent className="p-4">
                        {/* Верхняя часть карточки - имя и дата */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center">
                            <UserCircle className="w-5 h-5 text-slate-400 mr-1" />
                            <h3 className="font-medium text-base">
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
                            </h3>
                          </div>
                          <div className="flex items-center text-sm text-slate-500">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>{formatDate(transaction.createdAt)}</span>
                          </div>
                        </div>

                        {/* Средняя часть - описание и статус */}
                        <div className="flex flex-col mb-3">
                          <div className="text-sm mb-2">
                            {transaction.description ||
                              `Пополнение баланса на ${Math.floor(
                                transaction.amount / 100
                              )} ₽` ||
                              "Платеж за услуги"}
                          </div>
                          <div
                            className={`px-2 py-1 rounded-full text-xs inline-block w-fit ${
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
                        </div>

                        {/* Нижняя часть - сумма платежа и вознаграждение */}
                        <div className="flex justify-between items-end">
                          <div>
                            <div className="text-xs text-slate-500 mb-1">
                              Сумма платежа
                            </div>
                            <p className="text-base font-medium">
                              {Math.floor(transaction.amount / 100)} ₽
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-slate-500 mb-1">
                              Вознаграждение
                            </div>
                            <p className="text-lg text-green-600 font-semibold">
                              {Math.floor(
                                (transaction.referralCommission || 0) / 100
                              )}{" "}
                              ₽
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
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
          </div>
        </div>
      )}

      {/* Мобильная версия для сопровождения (если есть доступ) */}
      {mobileActiveTab === "managed" && canAccessManaged && (
        <div>
          <h2 className="text-lg font-medium mb-2">
            Сопровождаемые пользователи
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Пользователи, которых вы сопровождаете как менеджер
          </p>

          {/* Табы для переключения между "Мои клиенты" и "Доступные для сопровождения" */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <Button
              type="button"
              variant="outline"
              className={`w-full ${
                managedMobileTab === "current"
                  ? "bg-blue-50 border-blue-500 dark:bg-blue-900 dark:border-blue-400"
                  : ""
              }`}
              onClick={() => setManagedMobileTab("current")}
            >
              Мои клиенты
            </Button>
            <Button
              type="button"
              variant="outline"
              className={`w-full ${
                managedMobileTab === "available"
                  ? "bg-blue-50 border-blue-500 dark:bg-blue-900 dark:border-blue-400"
                  : ""
              }`}
              onClick={() => setManagedMobileTab("available")}
            >
              Доступные для сопровождения
            </Button>
          </div>

          {/* Контент для "Мои клиенты" */}
          {managedMobileTab === "current" && (
            <div className="h-[calc(100vh-20rem)] overflow-y-auto">
              {isManagedUsersLoading ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : managedUsers && managedUsers.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 pb-8">
                  {[...managedUsers]
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                    )
                    .map((managedUser) => (
                      <Card key={managedUser.id} className="border">
                        <CardContent className="p-4">
                          {/* Верхняя часть карточки - имя, email и статус */}
                          <div className="flex flex-col mb-3">
                            <div className="flex justify-between items-start mb-1">
                              <div className="flex items-center">
                                <UserCircle className="w-5 h-5 text-slate-400 mr-1" />
                                <h3 className="font-medium text-base">
                                  <TruncatedText
                                    text={managedUser.name || "Нет имени"}
                                    maxLength={20}
                                  />
                                </h3>
                              </div>
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
                            </div>
                            <div className="text-sm text-slate-500">
                              {managedUser.email || "Email не указан"}
                            </div>
                          </div>

                          {/* Средняя часть - тариф и дата регистрации */}
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div>
                              <div className="text-xs text-slate-500 mb-1">
                                Тариф
                              </div>
                              <div
                                className={`px-2 py-1 rounded-full text-xs inline-block ${
                                  managedUser.plan === "enterprise"
                                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                                    : managedUser.plan === "standart"
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                }`}
                              >
                                {getRusPlan(managedUser.plan) || "free"}
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center text-xs text-slate-500 mb-1">
                                <Clock className="w-3.5 h-3.5 mr-1" />
                                <span>Дата регистрации</span>
                              </div>
                              <p className="text-sm">
                                {formatDate(managedUser.createdAt)}
                              </p>
                            </div>
                          </div>

                          {/* Нижняя часть - вознаграждение и выбор менеджера */}
                          <div className="flex justify-between items-end">
                            <div>
                              <div className="text-xs text-slate-500 mb-1">
                                Вознаграждение
                              </div>
                              <p className="text-lg text-green-600 font-semibold">
                                {Math.floor(
                                  (referralTransactions
                                    ?.filter(
                                      (tx) =>
                                        tx.userId === managedUser.id &&
                                        tx.description?.includes(
                                          "Пополнение баланса"
                                        )
                                    )
                                    ?.reduce(
                                      (sum, tx) =>
                                        sum + (tx.managerCommission || 0),
                                      0
                                    ) || 0) / 100
                                )}{" "}
                                ₽
                              </p>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500 mb-1">
                                Выбор менеджера
                              </div>
                              <Select
                                value={
                                  managedUser.managerId
                                    ? managedUser.managerId.toString()
                                    : "null"
                                }
                                onValueChange={(value) => {
                                  const newManagerId =
                                    value === "null" ? null : parseInt(value);
                                  handleUpdateUserManager(
                                    managedUser.id,
                                    managedUser.managerId,
                                    newManagerId
                                  );
                                }}
                              >
                                <SelectTrigger className="w-[130px]">
                                  <SelectValue placeholder="Выберите" />
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
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Users className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Нет сопровождаемых пользователей
                  </h3>
                  <p className="text-slate-500 mb-4 max-w-md mx-auto">
                    Вы пока не сопровождаете ни одного пользователя в качестве
                    менеджера.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Контент для "Доступные для сопровождения" */}
          {managedMobileTab === "available" && (
            <div className="h-[calc(100vh-20rem)] overflow-y-auto">
              {isUsersWithoutManagerLoading ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : usersWithoutManager && usersWithoutManager.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 pb-8">
                  {[...usersWithoutManager]
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                    )
                    .map((userWithoutManager) => (
                      <Card key={userWithoutManager.id} className="border">
                        <CardContent className="p-4">
                          {/* Верхняя часть карточки - имя, email и статус */}
                          <div className="flex flex-col mb-3">
                            <div className="flex justify-between items-start mb-1">
                              <div className="flex items-center">
                                <UserCircle className="w-5 h-5 text-slate-400 mr-1" />
                                <h3 className="font-medium text-base">
                                  <TruncatedText
                                    text={
                                      userWithoutManager.name || "Нет имени"
                                    }
                                    maxLength={20}
                                  />
                                </h3>
                              </div>
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
                            </div>
                            <div className="text-sm text-slate-500">
                              {userWithoutManager.email || "Email не указан"}
                            </div>
                          </div>

                          {/* Средняя часть - тариф и дата регистрации */}
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div>
                              <div className="text-xs text-slate-500 mb-1">
                                Тариф
                              </div>
                              <div
                                className={`px-2 py-1 rounded-full text-xs inline-block ${
                                  userWithoutManager.plan === "enterprise"
                                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                                    : userWithoutManager.plan === "standart"
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                }`}
                              >
                                {getRusPlan(userWithoutManager.plan) || "free"}
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center text-xs text-slate-500 mb-1">
                                <Clock className="w-3.5 h-3.5 mr-1" />
                                <span>Дата регистрации</span>
                              </div>
                              <p className="text-sm">
                                {formatDate(userWithoutManager.createdAt)}
                              </p>
                            </div>
                          </div>

                          {/* Кнопка действия */}
                          <div className="mt-2 flex justify-end">
                            <Button
                              size="sm"
                              onClick={() =>
                                handleUpdateUserManager(
                                  userWithoutManager.id,
                                  null,
                                  currentUser?.id
                                )
                              }
                            >
                              Взять на сопровождение
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
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
            </div>
          )}
        </div>
      )}

      {/* Мобильная версия для всех пользователей (только для админов) */}
      {mobileActiveTab === "all-users" && canAccessAllUsers && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-medium">Все пользователи</h2>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => {
                if (setFilterDialogOpen) {
                  setFilterDialogOpen(true);
                }
              }}
            >
              <Filter className="w-4 h-4" />
              Фильтры
              {hasActiveFilters && (
                <div className="w-2 h-2 rounded-full bg-blue-500 ml-1"></div>
              )}
            </Button>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Управление всеми пользователями системы
          </p>
          <div className="h-[calc(100vh-14rem)] overflow-y-auto">
            {isAllUsersLoading ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : allUsers && allUsers.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 pb-8">
                {getFilteredUsers().map((userItem) => (
                  <Card key={userItem.id} className="border">
                    <CardContent className="p-4">
                      {/* Верхняя часть карточки - ID, имя и роль */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-start">
                          <div className="bg-slate-100 dark:bg-slate-800 rounded px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 mr-2 min-w-[30px] text-center">
                            {userItem.id}
                          </div>
                          <div>
                            <div className="flex items-center">
                              <UserCircle className="w-5 h-5 text-slate-400 mr-1" />
                              <h3 className="font-medium text-base">
                                <TruncatedText
                                  text={userItem.name || "Без имени"}
                                  maxLength={20}
                                />
                              </h3>
                            </div>
                            <p className="text-sm text-slate-500">
                              {userItem.email || "Нет email"}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div
                            className={`px-2 py-1 rounded-full text-xs inline-block mb-1 ${
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
                          <div
                            className={`px-2 py-1 rounded-full text-xs inline-block ${
                              userItem.status === "active"
                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                          >
                            {userItem.status}
                          </div>
                        </div>
                      </div>

                      {/* Средняя часть - телефон и тариф */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                          <div className="text-xs text-slate-500 mb-1">
                            Телефон
                          </div>
                          <p className="text-sm">
                            {userItem.phone || "Не указан"}
                          </p>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">
                            Тариф
                          </div>
                          <div
                            className={`px-2 py-1 rounded-full text-xs inline-block ${
                              userItem.plan === "enterprise"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                                : userItem.plan === "standart"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                          >
                            {getRusPlan(userItem.plan) || "free"}
                          </div>
                        </div>
                      </div>

                      {/* Нижняя часть - выбор менеджера и кнопка редактирования */}
                      <div className="flex justify-between items-end">
                        <div className="max-w-[200px]">
                          <div className="text-xs text-slate-500 mb-1">
                            Менеджер
                          </div>
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
                            <SelectTrigger className="w-[150px]">
                              <SelectValue placeholder="Выберите менеджера" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="null">Не назначен</SelectItem>
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
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(userItem)}
                        >
                          Редактировать
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Users className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">Нет пользователей</h3>
                <p className="text-slate-500 mb-4 max-w-md mx-auto">
                  В системе пока нет зарегистрированных пользователей.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
