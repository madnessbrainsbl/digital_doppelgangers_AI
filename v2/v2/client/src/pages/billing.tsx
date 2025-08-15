import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import PlanCard from "@/components/billing/plan-card";
import PaymentCard from "@/components/billing/payment-card";
import PaymentHistoryInfinite from "@/components/payment-history-infinite";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useMediaQuery } from "@/hooks/use-media-query";
import MobileBillingPage from "@/components/billing/mobile-billing-page";
import { Book } from "lucide-react";
import BillingInstructionsDialog from "@/components/billing/billing-instructions-dialog";

// Определение типов для платежа
interface Payment {
  id: number;
  userId: number;
  amount: number;
  status: string;
  description: string;
  completedAt?: string;
  createdAt: string;
  type: string;
  externalId?: string;
}

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
  smsMessages: {
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

// Интерфейс для данных пользователя
interface UserData {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  plan?: string | null;
  balance?: number | null;
  referrerId?: number | null;
  managerId?: number | null;
  referralCode?: string | null;
  totalSpent?: number;
}

// Функция для правильного склонения слов в зависимости от числа
const getWordForm = (
  number: number,
  words: [string, string, string]
): string => {
  const cases = [2, 0, 1, 1, 1, 2];
  return words[
    number % 100 > 4 && number % 100 < 20 ? 2 : cases[Math.min(number % 10, 5)]
  ];
};

export default function Billing() {
  const [tabValue, setTabValue] = useState("plans");
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [instructionsDialogOpen, setInstructionsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Определяем, является ли устройство десктопным
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // Проверяем мобильную версию и устанавливаем начальное значение для мобильных вкладок
  const [mobileActiveTab, setMobileActiveTab] = useState<string>("plans");

  // Получаем текущий тариф пользователя из объекта пользователя
  const { data: userData, isLoading: isUserLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: !!user?.id,
  });

  // Проверяем доступность пробного периода для пользователя
  const { data: trialAvailability, isLoading: isTrialCheckLoading } = useQuery({
    queryKey: ["/api/trial/available", user?.id],
    queryFn: async () => {
      if (!user?.id) return { available: false };
      const response = await fetch(`/api/trial/available/${user.id}`);
      if (!response.ok) {
        throw new Error("Ошибка при проверке доступности пробного периода");
      }
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Определяем текущий тариф из данных пользователя
  const isPlanLoading = isUserLoading || isTrialCheckLoading;

  // Устанавливаем текущий тариф при получении данных пользователя
  useEffect(() => {
    if (userData && typeof userData === "object" && "plan" in userData) {
      setCurrentPlan(userData.plan as string | null);
    }
  }, [userData]);

  // Синхронизируем мобильные и десктопные вкладки
  useEffect(() => {
    setMobileActiveTab(tabValue);
  }, [tabValue]);

  const handleMobileTabChange = (tab: string) => {
    setMobileActiveTab(tab);
    setTabValue(tab);
  };

  // При загрузке страницы и изменении URL проверяем параметры для выбора нужной вкладки
  useEffect(() => {
    // Функция для чтения параметров из URL
    const checkUrlParams = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get("tab");

      if (tab && ["plans", "usage", "payment"].includes(tab)) {
        setTabValue(tab);

        // Принудительно обновляем баланс при переходе на вкладку платежей
        if (tab === "payment" && user?.id) {
          queryClient.invalidateQueries({
            queryKey: ["/api/balance", user.id],
          });
        }
      }
    };

    // Проверяем при первой загрузке
    checkUrlParams();

    // Слушаем изменения в URL
    const handleUrlChange = () => {
      checkUrlParams();
    };

    window.addEventListener("popstate", handleUrlChange);

    // Очистка слушателя
    return () => {
      window.removeEventListener("popstate", handleUrlChange);
    };
  }, [user?.id, queryClient]); // Добавляем зависимости

  // Дополнительное обновление баланса при переключении на вкладку payment
  useEffect(() => {
    if (tabValue === "payment" && user?.id) {
      queryClient.invalidateQueries({ queryKey: ["/api/balance", user.id] });
    }
  }, [tabValue, user?.id, queryClient]);

  // Обработчик действий с тарифным планом
  const handlePlanAction = async (
    action: string,
    planName: string,
    planId: string
  ) => {
    try {
      // Этот обработчик вызывается из компонента PlanCard
      // когда пользователь нажимает кнопку "Подключить" в диалоговом окне
      // или кнопку "Текущий тариф"
      if (!user?.id) {
        toast({
          title: "Ошибка",
          description: "Необходимо авторизоваться для изменения тарифа",
          variant: "destructive",
        });
        return;
      }

      // Получаем цену тарифа из данных тарифов
      const selectedPlan = tariffData?.plans?.find(
        (plan) => plan.id === planId
      );
      if (!selectedPlan) {
        toast({
          title: "Ошибка",
          description: "Не удалось найти информацию о выбранном тарифе",
          variant: "destructive",
        });
        return;
      }

      // Отправляем запрос на сервер для изменения тарифа
      const response = await fetch("/api/user/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          planId: planId,
          amount: selectedPlan.price,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Ошибка при изменении тарифа");
      }

      // Устанавливаем тариф как текущий
      setCurrentPlan(planId);

      // Обновляем данные о пользователе, чтобы отразить изменение тарифа
      // (используем useQueryClient для инвалидации запроса к /api/auth/me)
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });

      // Обновляем данные об использовании
      queryClient.invalidateQueries({ queryKey: ["/api/usage", user.id] });

      // Обновляем историю платежей для обновления как на странице billing, так и на dashboard
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });

      // Сообщаем пользователю о результате действия
      toast({
        title: `${action} тарифа`,
        description: `Тариф "${planName}" ${
          action === "Продление" ? "продлен" : "выбран"
        } успешно`,
      });
    } catch (error) {
      console.error("Ошибка при изменении тарифа:", error);
      toast({
        title: "Ошибка",
        description:
          error instanceof Error ? error.message : "Не удалось изменить тариф",
        variant: "destructive",
      });
    }
  };

  const handlePaymentAction = () => {
    toast({
      title: "Оплата",
      description: "Функция оплаты будет доступна в следующем обновлении",
    });
  };

  // Обработчик активации пробного периода
  const handleTrialActivation = async (planId: string, planName: string) => {
    try {
      if (!user?.id) {
        toast({
          title: "Ошибка",
          description:
            "Необходимо авторизоваться для активации пробного периода",
          variant: "destructive",
        });
        return;
      }

      // Отправляем запрос на активацию пробного периода
      const response = await fetch("/api/trial/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Не удалось активировать пробный период"
        );
      }

      // Устанавливаем тариф как текущий
      setCurrentPlan(planId);

      // Обновляем данные пользователя и другие связанные запросы
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/usage", user.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/trial/available", user.id],
      });

      // Сообщаем пользователю об успешной активации
      toast({
        title: "Пробный период активирован",
        description: `Тариф "${planName}" активирован на 14 дней бесплатно`,
      });
    } catch (error) {
      console.error("Ошибка при активации пробного периода:", error);
      toast({
        title: "Ошибка",
        description:
          error instanceof Error
            ? error.message
            : "Не удалось активировать пробный период",
        variant: "destructive",
      });
    }
  };

  // Определим интерфейс для тарифных планов
  interface TariffPlan {
    id: string;
    name: string;
    price: number;
    period: string;
    messagesLimit: number;
    knowledgeLimit: number;
    callMinutesLimit: number;
    smsLimit: number;
    usersLimit: number;
    apiCallsLimit: number;
    assistantsLimit: number;
    channelsLimit: number;
    features: string[];
    isPopular: boolean;
    color: string;
    active: boolean;
  }

  // Функция для форматирования цены
  const formatPrice = (price: number): string => {
    return `${(price / 100).toLocaleString("ru-RU")} ₽`;
  };

  // Получаем список тарифных планов из API
  const { data: tariffData, isLoading: isTariffsLoading } = useQuery<{
    success: boolean;
    plans: TariffPlan[];
  }>({
    queryKey: ["/api/tariff-plans"],
    queryFn: async () => {
      const response = await fetch("/api/tariff-plans");
      if (!response.ok) {
        throw new Error("Не удалось получить список тарифных планов");
      }
      return response.json();
    },
  });

  // Преобразуем полученные данные в формат, подходящий для компонента PlanCard,
  // и сортируем их в нужном порядке: Базовый, Стандарт, Корпоративный
  const plans = tariffData?.plans
    ?.map((plan) => ({
      id: plan.id,
      name: plan.name,
      price: formatPrice(plan.price),
      period: plan.period,
      features: Array.isArray(plan.features) ? plan.features : [],
      isPopular: plan.isPopular,
      color:
        plan.color === "blue"
          ? "bg-white dark:bg-neutral-800"
          : plan.color === "indigo"
          ? "bg-primary-50 dark:bg-primary-900/20"
          : plan.color === "purple"
          ? "bg-purple-50 dark:bg-purple-900/20"
          : "bg-white dark:bg-neutral-800",
    }))
    .sort((a, b) => {
      // Определяем порядок тарифов: Базовый (1), Стандарт (2), Корпоративный (3)
      const order: { [key: string]: number } = {
        basic: 1,
        standart: 2,
        enterprise: 3,
      };
      return (order[a.id] || 99) - (order[b.id] || 99);
    }) || [
    // Резервные данные на случай, если API недоступен
    {
      id: "basic",
      name: "Базовый",
      price: "2 900 ₽",
      period: "месяц",
      features: [
        "1 виртуальный ассистент",
        "До 1,000 сообщений в месяц",
        "Базовый набор каналов (Telegram, Web)",
        "500 МБ базы знаний",
        "Базовая аналитика",
        "До 2 пользователей",
      ],
      isPopular: false,
      color: "bg-white dark:bg-neutral-800",
    },
    {
      id: "standart",
      name: "Стандарт",
      price: "6 900 ₽",
      period: "месяц",
      features: [
        "5 виртуальных ассистентов",
        "До 5,000 сообщений в месяц",
        "Все каналы коммуникаций",
        "2 ГБ базы знаний",
        "Расширенная аналитика",
        "До 5 пользователей",
        "100 минут звонков",
        "200 SMS сообщений",
      ],
      isPopular: true,
      color: "bg-primary-50 dark:bg-primary-900/20",
    },
    {
      id: "enterprise",
      name: "Корпоративный",
      price: "14 900 ₽",
      period: "месяц",
      features: [
        "Неограниченное число ассистентов",
        "До 20,000 сообщений в месяц",
        "Все каналы коммуникаций",
        "10 ГБ базы знаний",
        "Подробная аналитика и отчеты",
        "Неограниченное число пользователей",
        "1000 минут звонков",
        "1000 SMS сообщений",
        "Приоритетная поддержка",
      ],
      isPopular: false,
      color: "bg-white dark:bg-neutral-800",
    },
  ];

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

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-2xl font-bold">Тарифы</h1>
            <p className="text-muted-foreground">
              Управление подпиской и платежами
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setInstructionsDialogOpen(true)}
            title="Инструкция по тарифам и биллингу"
            className="bg-purple-200 hover:bg-purple-300"
          >
            <Book className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Мобильная версия страницы - показываем только на мобильных устройствах */}
      <div className={isDesktop ? "hidden" : "block"}>
        <MobileBillingPage
          activeTab={tabValue}
          setParentActiveTab={setTabValue}
          plans={plans}
          isTariffsLoading={isTariffsLoading}
          currentPlan={currentPlan}
          trialAvailability={trialAvailability}
          usageData={
            usageData || {
              noPlan: true,
              nextReset: "",
              messages: { used: 0, limit: 0, percentage: 0 },
              knowledge: { used: 0, limit: 0, percentage: 0 },
              callMinutes: { used: 0, limit: 0, percentage: 0 },
              smsMessages: { used: 0, limit: 0, percentage: 0 },
              users: { used: 0, limit: 0, percentage: 0 },
              assistants: { used: 0, limit: 0, percentage: 0 },
              channels: { used: 0, limit: 0, percentage: 0 },
            }
          }
          isUsageLoading={isUsageLoading}
          userId={user?.id}
          handlePlanAction={handlePlanAction}
          handleTrialActivation={handleTrialActivation}
          handlePaymentAction={handlePaymentAction}
          getWordForm={getWordForm}
        />
      </div>

      {/* Десктопная версия с табами - скрываем на мобильных */}
      <div className={isDesktop ? "block" : "hidden"}>
        <Tabs
          value={tabValue}
          onValueChange={(value) => setTabValue(value)}
          className="mt-6"
        >
          <TabsList className="mb-6">
            <TabsTrigger value="plans">Тарифные планы</TabsTrigger>
            <TabsTrigger value="usage">Использование</TabsTrigger>
            <TabsTrigger value="payment">История платежей</TabsTrigger>
          </TabsList>

          <TabsContent value="plans">
            {isPlanLoading || isTariffsLoading ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                <p className="mt-4 text-neutral-600 dark:text-neutral-400">
                  Загрузка тарифных планов...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    isCurrentPlan={currentPlan === plan.id}
                    isTrialAvailable={
                      trialAvailability?.available && plan.id === "basic"
                    }
                    onSelect={() =>
                      handlePlanAction(
                        currentPlan === plan.id ? "Продление" : "Выбор",
                        plan.name,
                        plan.id
                      )
                    }
                    onTrialActivate={() =>
                      handleTrialActivation(plan.id, plan.name)
                    }
                  />
                ))}
              </div>
            )}

            <Card className="mt-6">
              <CardContent className="pt-6">
                <h3 className="font-medium text-neutral-900 dark:text-white mb-4">
                  Дополнительные опции
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-neutral-900 dark:text-white">
                          Дополнительные сообщения
                        </h4>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          1000 сообщений
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-neutral-900 dark:text-white">
                          990 ₽
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePaymentAction()}
                        >
                          Купить
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-neutral-900 dark:text-white">
                          Дополнительное место
                        </h4>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          1 ГБ базы знаний
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-neutral-900 dark:text-white">
                          490 ₽
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePaymentAction()}
                        >
                          Купить
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-neutral-900 dark:text-white">
                          Минуты голосовых звонков
                        </h4>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          100 минут звонков
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-neutral-900 dark:text-white">
                          690 ₽
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePaymentAction()}
                        >
                          Купить
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-neutral-900 dark:text-white">
                          Дополнительный пользователь
                        </h4>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          1 пользователь
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-neutral-900 dark:text-white">
                          590 ₽
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePaymentAction()}
                        >
                          Купить
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium text-neutral-900 dark:text-white mb-4">
                  Использование ресурсов
                </h3>

                {isUsageLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                    <p className="mt-4 text-neutral-600 dark:text-neutral-400">
                      Загрузка данных использования...
                    </p>
                  </div>
                ) : !usageData ? (
                  <div className="text-center py-8">
                    <p className="text-neutral-600 dark:text-neutral-400">
                      Не удалось получить данные использования
                    </p>
                  </div>
                ) : usageData.noPlan ? (
                  <div className="text-center py-8">
                    <div className="mb-4">
                      <svg
                        className="w-16 h-16 mx-auto text-neutral-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-neutral-700 dark:text-neutral-200 mb-2">
                      Тариф не подключен
                    </h4>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                      Для доступа к использованию ресурсов необходимо подключить
                      тарифный план
                    </p>
                    <Button onClick={() => setTabValue("plans")}>
                      Выбрать тариф
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          Сообщения
                        </h4>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          {usageData.messages.used.toLocaleString("ru-RU")} /{" "}
                          {usageData.messages.limit.toLocaleString("ru-RU")}
                        </p>
                      </div>
                      <div className="h-2.5 bg-neutral-200 dark:bg-neutral-700 rounded-full">
                        <div
                          className="h-2.5 bg-red-500 rounded-full"
                          style={{ width: `${usageData.messages.percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        Осталось{" "}
                        {(
                          usageData.messages.limit - usageData.messages.used
                        ).toLocaleString("ru-RU")}{" "}
                        сообщений до{" "}
                        {new Date(usageData.nextReset).toLocaleDateString(
                          "ru-RU"
                        )}
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          База знаний
                        </h4>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          {usageData.knowledge.used.toLocaleString("ru-RU")} ГБ
                          / {usageData.knowledge.limit.toLocaleString("ru-RU")}{" "}
                          ГБ
                        </p>
                      </div>
                      <div className="h-2.5 bg-neutral-200 dark:bg-neutral-700 rounded-full">
                        <div
                          className="h-2.5 bg-green-500 rounded-full"
                          style={{
                            width: `${usageData.knowledge.percentage}%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        Осталось{" "}
                        {(
                          usageData.knowledge.limit - usageData.knowledge.used
                        ).toLocaleString("ru-RU")}{" "}
                        ГБ свободного места
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          Виртуальные ассистенты
                        </h4>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          {usageData.assistants.used.toLocaleString("ru-RU")} /{" "}
                          {usageData.assistants.limit.toLocaleString("ru-RU")}
                        </p>
                      </div>
                      <div className="h-2.5 bg-neutral-200 dark:bg-neutral-700 rounded-full">
                        <div
                          className="h-2.5 bg-blue-500 rounded-full"
                          style={{
                            width: `${usageData.assistants.percentage}%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        {usageData.assistants.limit > usageData.assistants.used
                          ? `Осталось ${(
                              usageData.assistants.limit -
                              usageData.assistants.used
                            ).toLocaleString("ru-RU")} ${getWordForm(
                              usageData.assistants.limit -
                                usageData.assistants.used,
                              ["ассистент", "ассистента", "ассистентов"]
                            )}`
                          : "Достигнут лимит ассистентов"}
                      </p>
                    </div>

                    {/* Показываем голосовые звонки только если они доступны в тарифе или были использованы */}
                    {(usageData.callMinutes.limit > 0 ||
                      usageData.callMinutes.used > 0) && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Голосовые звонки
                          </h4>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            {usageData.callMinutes.used.toLocaleString("ru-RU")}{" "}
                            мин /{" "}
                            {usageData.callMinutes.limit.toLocaleString(
                              "ru-RU"
                            )}{" "}
                            мин
                          </p>
                        </div>
                        <div className="h-2.5 bg-neutral-200 dark:bg-neutral-700 rounded-full">
                          <div
                            className="h-2.5 bg-amber-500 rounded-full"
                            style={{
                              width: `${usageData.callMinutes.percentage}%`,
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          {usageData.callMinutes.limit > 0
                            ? `Осталось ${(
                                usageData.callMinutes.limit -
                                usageData.callMinutes.used
                              ).toLocaleString("ru-RU")} минут до ${new Date(
                                usageData.nextReset
                              ).toLocaleDateString("ru-RU")}`
                            : "Голосовые звонки недоступны в вашем тарифе"}
                        </p>
                      </div>
                    )}

                    {/* Показываем SMS сообщения только если они доступны в тарифе или были использованы */}
                    {(usageData.smsMessages.limit > 0 ||
                      usageData.smsMessages.used > 0) && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            SMS сообщения
                          </h4>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            {usageData.smsMessages.used.toLocaleString("ru-RU")}{" "}
                            /{" "}
                            {usageData.smsMessages.limit.toLocaleString(
                              "ru-RU"
                            )}{" "}
                            SMS
                          </p>
                        </div>
                        <div className="h-2.5 bg-neutral-200 dark:bg-neutral-700 rounded-full">
                          <div
                            className="h-2.5 bg-cyan-500 rounded-full"
                            style={{
                              width: `${usageData.smsMessages.percentage}%`,
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          {usageData.smsMessages.limit > 0
                            ? `Осталось ${(
                                usageData.smsMessages.limit -
                                usageData.smsMessages.used
                              ).toLocaleString("ru-RU")} SMS до ${new Date(
                                usageData.nextReset
                              ).toLocaleDateString("ru-RU")}`
                            : "SMS сообщения недоступны в вашем тарифе"}
                        </p>
                      </div>
                    )}

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          Каналы связи
                        </h4>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          {usageData.channels.used.toLocaleString("ru-RU")} /{" "}
                          {usageData.channels.limit.toLocaleString("ru-RU")}
                        </p>
                      </div>
                      <div className="h-2.5 bg-neutral-200 dark:bg-neutral-700 rounded-full">
                        <div
                          className="h-2.5 bg-indigo-500 rounded-full"
                          style={{ width: `${usageData.channels.percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        Осталось{" "}
                        {(
                          usageData.channels.limit - usageData.channels.used
                        ).toLocaleString("ru-RU")}{" "}
                        {getWordForm(
                          usageData.channels.limit - usageData.channels.used,
                          ["канал", "канала", "каналов"]
                        )}
                      </p>
                    </div>

                    {/* Показываем API-вызовы только если они доступны в тарифе или были использованы */}
                    {(usageData.apiCalls.limit > 0 ||
                      usageData.apiCalls.used > 0) && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            API-вызовы
                          </h4>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            {usageData.apiCalls.used.toLocaleString("ru-RU")} /{" "}
                            {usageData.apiCalls.limit.toLocaleString("ru-RU")}
                          </p>
                        </div>
                        <div className="h-2.5 bg-neutral-200 dark:bg-neutral-700 rounded-full">
                          <div
                            className="h-2.5 bg-pink-500 rounded-full"
                            style={{
                              width: `${usageData.apiCalls.percentage}%`,
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          {usageData.apiCalls.limit > 0
                            ? `Осталось ${(
                                usageData.apiCalls.limit -
                                usageData.apiCalls.used
                              ).toLocaleString("ru-RU")} вызовов до ${new Date(
                                usageData.nextReset
                              ).toLocaleDateString("ru-RU")}`
                            : "API-вызовы недоступны в вашем тарифе"}
                        </p>
                      </div>
                    )}

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          Пользователи
                        </h4>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          {usageData.users.used.toLocaleString("ru-RU")} /{" "}
                          {usageData.users.limit.toLocaleString("ru-RU")}
                        </p>
                      </div>
                      <div className="h-2.5 bg-neutral-200 dark:bg-neutral-700 rounded-full">
                        <div
                          className="h-2.5 bg-purple-500 rounded-full"
                          style={{ width: `${usageData.users.percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        {usageData.users.limit > usageData.users.used
                          ? `Осталось ${(
                              usageData.users.limit - usageData.users.used
                            ).toLocaleString("ru-RU")} ${getWordForm(
                              usageData.users.limit - usageData.users.used,
                              ["место", "места", "мест"]
                            )} для пользователей`
                          : "Достигнут лимит пользователей"}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="md:col-span-1">
                <PaymentCard />
              </div>

              <div className="md:col-span-2">
                {user?.id && (
                  <PaymentHistoryInfinite
                    userId={user.id}
                    variant="table"
                    showExport={true}
                    title="История платежей"
                  />
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog for instructions */}
      <BillingInstructionsDialog
        open={instructionsDialogOpen}
        onOpenChange={setInstructionsDialogOpen}
      />
    </div>
  );
}
