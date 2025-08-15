import { cn } from '@/lib/utils';
import { StatCardProps } from '@/lib/types';

export function StatCard({ title, value, icon, iconColor, change }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-4 border border-neutral-200 dark:border-neutral-700">
      <div className="flex items-center justify-between">
        <h3 className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">{title}</h3>
        <span className={cn(`material-icons text-${iconColor}-500 dark:text-${iconColor}-400`)}>{icon}</span>
      </div>
      <div className="mt-2">
        <p className="text-2xl font-semibold text-neutral-900 dark:text-white">{value}</p>
        {change && (
          <p className={cn(
            "text-xs flex items-center mt-1",
            change.positive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          )}>
            <span className="material-icons text-[14px] mr-1">{change.icon}</span>
            <span>{change.value}</span>
          </p>
        )}
      </div>
    </div>
  );
}

export default StatCard;
