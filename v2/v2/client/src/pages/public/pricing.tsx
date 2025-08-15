import { useState } from "react";
import MainLayout from "@/components/public/layout";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import PricingPlanCard from "@/components/public/pricing-plan-card";

// Определение типа для плана подписки (месяц/год)
type PlanPeriod = "month" | "year";

// Определим интерфейс для тарифных планов
interface TariffPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  messagesLimit: number;
  knowledgeLimit: number;
  callMinutesLimit: number;
  usersLimit: number;
  apiCallsLimit: number;
  assistantsLimit: number;
  channelsLimit: number;
  features: string[];
  isPopular: boolean;
  color: string;
  active: boolean;
}

export default function PricingPage() {
  const [planPeriod, setPlanPeriod] = useState<PlanPeriod>("month");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  // Функция для переключения периода подписки
  const switchPlan = (newPlan: PlanPeriod) => {
    setPlanPeriod(newPlan);
  };

  // Проверяем доступность пробного периода для пользователя
  const { data: trialAvailability } = useQuery({
    queryKey: ["/api/trial/available", user?.id],
    queryFn: async () => {
      if (!user?.id) return { available: true }; // Для незарегистрированных пользователей считаем, что пробный период доступен
      const response = await fetch(`/api/trial/available/${user.id}`);
      if (!response.ok) {
        return { available: false };
      }
      return response.json();
    },
    enabled: !!user,
  });

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

  // Обработчик для кнопки "Попробовать бесплатно"
  // Всегда перенаправляет неавторизованных пользователей на страницу регистрации
  const handleTryFree = (planId: string) => {
    // Для неавторизованных пользователей - перенаправление на страницу регистрации
    navigate(`/auth?signup=true&plan=${planId}`);
  };

  // Обработчик для активации пробного периода (только для авторизованных пользователей)
  const handleTrialActivation = async (planId: string) => {
    if (!user?.id) {
      navigate(`/auth?signup=true&plan=${planId}`);
      return;
    }

    try {
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

      // Показываем уведомление об успешной активации
      toast({
        title: "Пробный период активирован",
        description: "Ваш 14-дневный пробный период успешно активирован",
      });

      // Перенаправляем в личный кабинет после активации
      navigate("/dashboard");
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

  // Обработчик для подключения тарифа (для авторизованных пользователей)
  const handlePlanAction = (planName: string, planId: string) => {
    if (!user) {
      // Если пользователь не авторизован, перенаправляем на страницу входа
      navigate(`/auth?signup=true&plan=${planId}`);
      return;
    }

    // Перенаправляем на страницу биллинга для подключения тарифа
    navigate("/billing?tab=plans");

    // Уведомляем пользователя
    toast({
      title: "Переход к подключению тарифа",
      description: `Выберите тариф "${planName}" на странице тарифов`,
    });
  };

  // Преобразуем полученные данные в формат, подходящий для компонента PricingPlanCard,
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
      const order: Record<string, number> = {
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
        "Голосовые звонки (100 мин.)",
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
        "Голосовые звонки (1000 мин.)",
        "Приоритетная поддержка",
      ],
      isPopular: false,
      color: "bg-white dark:bg-neutral-800",
    },
  ];

  return (
    <MainLayout>
      <div className="bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Тарифные планы
            </h1>
            <p className="mt-6 text-xl text-gray-500 max-w-2xl mx-auto">
              Выберите подходящий тариф для вашего бизнеса. Начните бесплатно и
              масштабируйте по мере роста.
            </p>
          </div>

          {/* <div className="mt-12 flex justify-center">
            <div className="relative bg-white rounded-lg p-1 flex">
              <button
                type="button"
                className={`relative w-28 rounded-md py-2 text-sm font-medium ${
                  planPeriod === "month"
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => switchPlan("month")}
              >
                Ежемесячно
              </button>
              <button
                type="button"
                className={`relative w-28 rounded-md py-2 text-sm font-medium ${
                  planPeriod === "year"
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => switchPlan("year")}
              >
                Ежегодно
                <span className="absolute -top-2 -right-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  -20%
                </span>
              </button>
            </div>
          </div> */}

          {isTariffsLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <p className="mt-4 text-neutral-600 dark:text-neutral-400">
                Загрузка тарифных планов...
              </p>
            </div>
          ) : (
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <PricingPlanCard
                  key={plan.id}
                  plan={plan}
                  isAuth={!!user} // Флаг авторизации
                  isTrialAvailable={
                    trialAvailability?.available && plan.id === "basic"
                  }
                  onSelect={() => handlePlanAction(plan.name, plan.id)}
                  onTryFree={() => handleTryFree(plan.id)}
                />
              ))}
            </div>
          )}

          <div className="mt-12 bg-gray-50 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Часто задаваемые вопросы
              </h2>
            </div>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Как начать бесплатный пробный период?
                </h3>
                <p className="mt-2 text-gray-500">
                  Зарегистрируйтесь на платформе, выберите подходящий план и
                  получите 14-дневный бесплатный период без обязательств.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Могу ли я сменить тариф позже?
                </h3>
                <p className="mt-2 text-gray-500">
                  Да, вы можете перейти на другой тариф в любое время через
                  личный кабинет. Изменения вступят в силу со следующего
                  платежного периода.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Что происходит при превышении лимита сообщений?
                </h3>
                <p className="mt-2 text-gray-500">
                  При достижении 80% от лимита мы уведомим вас. Если вы
                  превысите лимит, вы можете приобрести дополнительные сообщения
                  или перейти на более высокий тариф.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Предлагаете ли вы особые условия для стартапов?
                </h3>
                <p className="mt-2 text-gray-500">
                  Да, у нас есть специальная программа для стартапов. Свяжитесь
                  с нами для получения дополнительной информации о скидках и
                  специальных условиях.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Остались вопросы?
            </h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
              Наша команда готова помочь вам выбрать оптимальное решение для
              вашего бизнеса и ответить на любые вопросы.
            </p>
            <div className="mt-6">
              <Button variant="outline" onClick={() => navigate("/contact")}>
                Связаться с нами
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
