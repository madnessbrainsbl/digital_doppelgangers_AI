import { ReactNode } from "react";
import { RefreshCw } from "lucide-react";

interface MetricsCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: {
    value: string;
    isPositive: boolean;
    label: string;
  };
  subtitle?: string;
  iconColor?: string;
  isLoading?: boolean;
}

export default function MetricsCard({ 
  title, 
  value, 
  icon,
  subtitle,
  trend,
  iconColor = "text-primary-500 dark:text-primary-400",
  isLoading = false
}: MetricsCardProps) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-4 border border-neutral-200 dark:border-neutral-700">
      <div className="flex items-center justify-between">
        <h3 className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">{title}</h3>
        <span className={`material-icons ${iconColor}`}>{icon}</span>
      </div>
      <div className="mt-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-10">
            <RefreshCw className="w-5 h-5 animate-spin text-neutral-400" />
          </div>
        ) : (
          <>
            <p className="text-2xl font-semibold text-neutral-900 dark:text-white">{value}</p>
            {subtitle && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{subtitle}</p>
            )}
            {trend && (
              <p className={`text-xs ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} flex items-center mt-1`}>
                <span className="material-icons text-[14px] mr-1">
                  {trend.isPositive ? 'trending_up' : 'trending_down'}
                </span>
                <span>{trend.value} {trend.label}</span>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
