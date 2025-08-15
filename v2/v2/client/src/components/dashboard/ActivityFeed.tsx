import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityProps } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Link } from 'wouter';

interface ActivityFeedProps {
  activities: ActivityProps[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Недавняя активность</CardTitle>
        <Link href="/activities" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
          Показать все
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex">
              <div className="flex-shrink-0 mr-3">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", activity.iconBg)}>
                  <span className="material-icons text-[16px]">{activity.icon}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-neutral-800 dark:text-neutral-200" dangerouslySetInnerHTML={{ __html: activity.description }} />
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default ActivityFeed;
