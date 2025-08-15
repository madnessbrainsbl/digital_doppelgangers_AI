import React from 'react';

export interface AssistantCardProps {
  icon: string;
  iconBg?: string;
  iconColor?: string;
  name: string;
  status: 'active' | 'inactive' | 'draft';
  lastUpdated: string;
}

export const AssistantCard = ({ 
  icon, 
  iconBg = 'bg-primary-100 dark:bg-primary-900', 
  iconColor = 'text-primary-600 dark:text-primary-300', 
  name, 
  status, 
  lastUpdated 
}: AssistantCardProps) => {
  const statusColor = status === 'active' 
    ? 'bg-green-500' 
    : status === 'inactive' 
      ? 'bg-neutral-400'
      : 'bg-amber-500';
      
  return (
    <div className="flex items-start p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:shadow-sm transition-all">
      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${iconBg} mr-3`}>
        <span className={`material-icons ${iconColor}`}>{icon}</span>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-neutral-900 dark:text-white truncate">{name}</h4>
          <div className="flex items-center">
            <span className={`h-2 w-2 rounded-full ${statusColor} mr-1`} />
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {status === 'active' ? 'Активен' : status === 'inactive' ? 'Неактивен' : 'Черновик'}
            </span>
          </div>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{lastUpdated}</p>
      </div>
    </div>
  );
};