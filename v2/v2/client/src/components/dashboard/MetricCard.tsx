import { ReactNode } from "react";

type TrendDirection = "up" | "down" | "none";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: string;
  iconColor: string;
  trendLabel?: string;
  trendDirection?: TrendDirection;
  trendValue?: string;
}

export default function MetricCard({
  title,
  value,
  icon,
  iconColor,
  trendLabel,
  trendDirection = "none",
  trendValue,
}: MetricCardProps) {
  const getColorClass = () => {
    switch (iconColor) {
      case "primary":
        return "text-primary-500 dark:text-primary-400";
      case "secondary":
        return "text-secondary-500 dark:text-secondary-400";
      case "amber":
        return "text-amber-500 dark:text-amber-400";
      case "green":
        return "text-green-500 dark:text-green-400";
      case "red":
        return "text-red-500 dark:text-red-400";
      default:
        return "text-primary-500 dark:text-primary-400";
    }
  };

  const getTrendIcon = (): string => {
    switch (trendDirection) {
      case "up":
        return "trending_up";
      case "down":
        return "trending_down";
      default:
        return "remove";
    }
  };

  const getTrendColorClass = (): string => {
    switch (trendDirection) {
      case "up":
        return "text-green-600 dark:text-green-400";
      case "down":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-neutral-500 dark:text-neutral-400";
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-4 border border-neutral-200 dark:border-neutral-700">
      <div className="flex items-center justify-between">
        <h3 className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">{title}</h3>
        <span className={`material-icons ${getColorClass()}`}>{icon}</span>
      </div>
      <div className="mt-2">
        <p className="text-2xl font-semibold text-neutral-900 dark:text-white">{value}</p>
        {trendLabel && (
          <p className={`text-xs ${getTrendColorClass()} flex items-center mt-1`}>
            {trendDirection !== "none" && (
              <span className="material-icons text-[14px] mr-1">{getTrendIcon()}</span>
            )}
            <span>{trendLabel}</span>
          </p>
        )}
      </div>
    </div>
  );
}
