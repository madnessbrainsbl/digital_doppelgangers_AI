import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, ChevronRight } from "lucide-react";
import PlanCard from "@/components/billing/plan-card";
import PaymentCard from "@/components/billing/payment-card";
import PaymentHistoryInfinite from "../payment-history-infinite";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

interface Usage {
  noPlan?: boolean;
  nextReset: string;
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
  apiCalls?: {
    used: number;
    limit: number;
    percentage: number;
  };
}

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  isPopular: boolean;
  color: string;
}

interface MobileBillingPageProps {
  // Значения и функции для вкладок
  activeTab: string;
  setParentActiveTab: (tab: string) => void;

  // Данные для тарифных планов
  plans: Plan[];
  isTariffsLoading: boolean;
  currentPlan: string | null;
  trialAvailability?: { available: boolean };

  // Данные для использования ресурсов
  usageData: Usage;
  isUsageLoading: boolean;

  // ID пользователя для компонента истории платежей
  userId?: number;

  // Вспомогательные функции
  handlePlanAction: (action: string, planName: string, planId: string) => void;
  handleTrialActivation: (planId: string, planName: string) => void;
  handlePaymentAction: () => void;
  getWordForm: (number: number, words: [string, string, string]) => string;
}

export default function MobileBillingPage({
  activeTab,
  setParentActiveTab,
  plans,
  isTariffsLoading,
  currentPlan,
  trialAvailability,
  usageData,
  isUsageLoading,
  userId,
  handlePlanAction,
  handleTrialActivation,
  handlePaymentAction,
  getWordForm,
}: MobileBillingPageProps) {
  // Состояние для мобильных вкладок
  const [mobileActiveTab, setMobileActiveTab] = useState<string>(activeTab);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Синхронизируем локальное состояние с пропом activeTab
  useEffect(() => {
    setMobileActiveTab(activeTab);
  }, [activeTab]);

  // Обновленная функция для переключения вкладок, которая также обновляет родительское состояние
  const handleTabChange = (tab: string) => {
    setMobileActiveTab(tab);
    setParentActiveTab(tab); // Синхронизируем с родительским состоянием

    // Принудительно обновляем баланс при переходе на вкладку платежей
    if (tab === "payment" && user?.id) {
      queryClient.invalidateQueries({ queryKey: ["/api/balance", user.id] });
    }
  };

  return (
    <div>
      <div className="mb-4">
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant={mobileActiveTab === "plans" ? "default" : "outline"}
            className="w-full"
            onClick={() => handleTabChange("plans")}
          >
            Тарифные планы
          </Button>
          <Button
            type="button"
            variant={mobileActiveTab === "usage" ? "default" : "outline"}
            className="w-full"
            onClick={() => handleTabChange("usage")}
          >
            Использование
          </Button>
          <Button
            type="button"
            variant={mobileActiveTab === "payment" ? "default" : "outline"}
            className="w-full"
            onClick={() => handleTabChange("payment")}
          >
            История платежей
          </Button>
        </div>
      </div>

      {/* Вкладка тарифных планов */}
      {mobileActiveTab === "plans" && (
        <div>
          <h2 className="text-lg font-medium mb-4">Тарифные планы</h2>
          <div className="space-y-4">
            {isTariffsLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                <p className="mt-4 text-neutral-600 dark:text-neutral-400">
                  Загрузка тарифных планов...
                </p>
              </div>
            ) : (
              <div className="space-y-4 pb-4">
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
          </div>

          <div className="mt-6 pb-8">
            <h3 className="font-medium text-neutral-900 dark:text-white mb-4">
              Дополнительные опции
            </h3>
            <div className="space-y-3">
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
          </div>
        </div>
      )}

      {/* Вкладка использования ресурсов */}
      {mobileActiveTab === "usage" && (
        <div>
          <h2 className="text-lg font-medium mb-4">Использование ресурсов</h2>
          <ScrollArea className="h-[calc(100vh-14rem)]">
            {isUsageLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                <p className="mt-4 text-neutral-600 dark:text-neutral-400">
                  Загрузка данных об использовании...
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
                <Button onClick={() => handleTabChange("plans")}>
                  Выбрать тариф
                </Button>
              </div>
            ) : (
              <div className="space-y-6 pb-4">
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
                    {new Date(usageData.nextReset).toLocaleDateString("ru-RU")}
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      База знаний
                    </h4>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {usageData.knowledge.used.toLocaleString("ru-RU")} ГБ /{" "}
                      {usageData.knowledge.limit.toLocaleString("ru-RU")} ГБ
                    </p>
                  </div>
                  <div className="h-2.5 bg-neutral-200 dark:bg-neutral-700 rounded-full">
                    <div
                      className="h-2.5 bg-green-500 rounded-full"
                      style={{ width: `${usageData.knowledge.percentage}%` }}
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
                      style={{ width: `${usageData.assistants.percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {usageData.assistants.limit > usageData.assistants.used
                      ? `Осталось ${(
                          usageData.assistants.limit - usageData.assistants.used
                        ).toLocaleString("ru-RU")} ${getWordForm(
                          usageData.assistants.limit -
                            usageData.assistants.used,
                          ["ассистент", "ассистента", "ассистентов"]
                        )}`
                      : "Достигнут лимит ассистентов"}
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Голосовые звонки
                    </h4>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {usageData.callMinutes.used.toLocaleString("ru-RU")} мин /{" "}
                      {usageData.callMinutes.limit.toLocaleString("ru-RU")} мин
                    </p>
                  </div>
                  <div className="h-2.5 bg-neutral-200 dark:bg-neutral-700 rounded-full">
                    <div
                      className="h-2.5 bg-yellow-500 rounded-full"
                      style={{ width: `${usageData.callMinutes.percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Осталось{" "}
                    {(
                      usageData.callMinutes.limit - usageData.callMinutes.used
                    ).toLocaleString("ru-RU")}{" "}
                    минут до{" "}
                    {new Date(usageData.nextReset).toLocaleDateString("ru-RU")}
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      SMS сообщения
                    </h4>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {usageData.smsMessages.used.toLocaleString("ru-RU")} /{" "}
                      {usageData.smsMessages.limit.toLocaleString("ru-RU")} SMS
                    </p>
                  </div>
                  <div className="h-2.5 bg-neutral-200 dark:bg-neutral-700 rounded-full">
                    <div
                      className="h-2.5 bg-cyan-500 rounded-full"
                      style={{ width: `${usageData.smsMessages.percentage}%` }}
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

                {usageData.apiCalls && (
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
                        className="h-2.5 bg-blue-500 rounded-full"
                        style={{ width: `${usageData.apiCalls.percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      {usageData.apiCalls.limit > 0
                        ? `Осталось ${(
                            usageData.apiCalls.limit - usageData.apiCalls.used
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
          </ScrollArea>
        </div>
      )}

      {/* Вкладка истории платежей */}
      {mobileActiveTab === "payment" && (
        <div>
          <h2 className="text-lg font-medium mb-4">История платежей</h2>
          <div className="md:col-span-1 mb-4">
            <PaymentCard />
          </div>
          <div className="h-[calc(100vh-16rem)]">
            {userId ? (
              <PaymentHistoryInfinite userId={userId} variant="card" title="" />
            ) : (
              <div className="text-center py-8 text-neutral-500">
                Необходимо авторизоваться для просмотра истории платежей
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
