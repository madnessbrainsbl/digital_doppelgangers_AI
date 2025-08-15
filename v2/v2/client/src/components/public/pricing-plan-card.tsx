import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanProps {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  isPopular: boolean;
  color: string;
}

interface PricingPlanCardProps {
  plan: PlanProps;
  isAuth: boolean; // Флаг для определения, авторизован ли пользователь
  onSelect: () => void; // Обработчик для кнопки "Подключить"
  onTryFree: () => void; // Обработчик для кнопки "Попробовать бесплатно"
  isTrialAvailable?: boolean; // Доступен ли пробный период
}

export default function PricingPlanCard({
  plan,
  isAuth,
  onSelect,
  onTryFree,
  isTrialAvailable = false,
}: PricingPlanCardProps) {
  return (
    <Card
      className={cn(
        "flex flex-col relative overflow-hidden border border-neutral-200 dark:border-neutral-700",
        plan.isPopular && "border-primary-300 dark:border-primary-700"
      )}
    >
      {plan.isPopular && (
        <div className="absolute top-0 right-0">
          <div className="bg-primary-500 text-white text-xs font-semibold px-3 py-1 transform rotate-45 translate-x-[30%] translate-y-[-10%] shadow-md">
            Популярный
          </div>
        </div>
      )}

      {/* Добавляем метку "Выгодно" на план "Стандарт" */}
      {plan.id === "standart" && (
        <div className="absolute top-3 -right-1">
          <div className="bg-red-500 text-white text-xs font-semibold px-6 py-1 transform rotate-45 translate-x-[20%] translate-y-[10%] shadow-md">
            Выгодно
          </div>
        </div>
      )}

      <div className={cn("p-6 flex-1", plan.color)}>
        <h3 className="font-semibold text-xl text-neutral-900 dark:text-white mb-2">
          {plan.name}
        </h3>
        <div className="mt-2 mb-4">
          <span className="text-3xl font-bold text-neutral-900 dark:text-white">
            {plan.price}
          </span>
          <span className="text-neutral-500 dark:text-neutral-400 ml-1">
            / {plan.period}
          </span>
        </div>

        <ul className="space-y-3 mb-6">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex">
              <Check className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 shrink-0" />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <CardContent className="p-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
        {/* Разная логика отображения кнопок в зависимости от авторизации */}
        {!isAuth ? (
          // Для неавторизованных пользователей
          <div className="space-y-3">
            <Button
              onClick={onTryFree}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              Попробовать бесплатно
            </Button>
          </div>
        ) : (
          // Для авторизованных пользователей
          <div>
            {plan.id === "basic" && isTrialAvailable ? (
              <div className="space-y-3">
                <Button
                  onClick={onTryFree}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                >
                  Активировать пробный период
                </Button>
                <p className="text-xs text-center text-gray-500">
                  14 дней бесплатно, затем {plan.price}/{plan.period}
                </p>
              </div>
            ) : (
              <Button onClick={onSelect} className="w-full" variant="outline">
                Подключить
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
