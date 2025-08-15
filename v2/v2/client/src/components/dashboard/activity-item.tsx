interface ActivityItemProps {
  icon: string;
  iconBg: string;
  iconColor: string;
  content: React.ReactNode;
  timestamp: string;
}

export default function ActivityItem({ 
  icon,
  iconBg,
  iconColor,
  content,
  timestamp 
}: ActivityItemProps) {
  return (
    <div className="flex">
      <div className="flex-shrink-0 mr-3">
        <div className={`w-8 h-8 rounded-full ${iconBg} ${iconColor} flex items-center justify-center`}>
          <span className="material-icons text-[16px]">{icon}</span>
        </div>
      </div>
      <div>
        <p className="text-sm text-neutral-800 dark:text-neutral-200">
          {content}
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{timestamp}</p>
      </div>
    </div>
  );
}
