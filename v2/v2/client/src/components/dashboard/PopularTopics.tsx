import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TopicItem } from '@/lib/types';

interface PopularTopicsProps {
  topics: TopicItem[];
}

export function PopularTopics({ topics }: PopularTopicsProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Популярные темы</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {topics.map((topic) => (
            <li key={topic.name} className="flex items-center">
              <div className="h-2.5 rounded-full w-full bg-neutral-200 dark:bg-neutral-700">
                <div 
                  className={`h-2.5 rounded-full bg-${topic.color}-500 dark:bg-${topic.color}-400`} 
                  style={{ width: `${topic.percentage}%` }}
                />
              </div>
              <span className="ml-2 text-sm text-neutral-700 dark:text-neutral-300 min-w-[50px]">
                {topic.percentage}%
              </span>
              <span className="ml-2 text-sm text-neutral-700 dark:text-neutral-300">
                {topic.name}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default PopularTopics;
