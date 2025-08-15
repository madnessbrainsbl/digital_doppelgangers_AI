import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Topic {
  name: string;
  percentage: number;
  color: string;
}

interface TopicsListProps {
  topics: Topic[];
}

export default function TopicsList({ topics }: TopicsListProps) {
  // Helper to get color class
  const getColorClass = (color: string) => {
    switch (color) {
      case "primary":
        return "bg-primary-600 dark:bg-primary-500";
      case "secondary":
        return "bg-secondary-500 dark:bg-secondary-400";
      case "amber":
        return "bg-amber-500 dark:bg-amber-400";
      case "red":
        return "bg-red-500 dark:bg-red-400";
      case "purple":
        return "bg-purple-500 dark:bg-purple-400";
      default:
        return "bg-primary-600 dark:bg-primary-500";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-md font-medium">Популярные темы</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {topics.map((topic, index) => (
            <li key={index} className="flex items-center">
              <div className="h-2.5 rounded-full w-full bg-neutral-200 dark:bg-neutral-700">
                <div
                  className={`h-2.5 rounded-full ${getColorClass(topic.color)}`}
                  style={{ width: `${topic.percentage}%` }}
                ></div>
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
