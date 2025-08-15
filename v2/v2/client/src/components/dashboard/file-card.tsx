import React from 'react';

export interface FileCardProps {
  icon: string;
  iconBg?: string;
  iconColor?: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  onClick?: () => void;
}

export const FileCard = ({ 
  icon, 
  iconBg = 'bg-primary-100 dark:bg-primary-900', 
  iconColor = 'text-primary-600 dark:text-primary-300', 
  fileName, 
  fileSize, 
  uploadDate,
  onClick 
}: FileCardProps) => {
  return (
    <div 
      className={`flex items-start p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:shadow-sm transition-all ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${iconBg} mr-3`}>
        <span className={`material-icons ${iconColor}`}>{icon}</span>
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-neutral-900 dark:text-white truncate">{fileName}</h4>
        <div className="flex items-center text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          <span>{fileSize}</span>
          <span className="mx-1">•</span>
          <span>{uploadDate}</span>
        </div>
      </div>
    </div>
  );
};