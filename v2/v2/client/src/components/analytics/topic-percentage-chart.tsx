import { getColorPalette } from "@/lib/utils/charts";

interface TopicDataItem {
  label: string;
  value: number;
}

interface TopicPercentageChartProps {
  topicData: TopicDataItem[];
  showLegend?: boolean;
}

export default function TopicPercentageChart({ topicData, showLegend = false }: TopicPercentageChartProps) {
  if (!topicData || topicData.length === 0) {
    return (
      <div className="text-center py-4 text-neutral-500 dark:text-neutral-400">
        Нет данных для отображения
      </div>
    );
  }

  const colors = getColorPalette(topicData.length);

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {topicData.map((topic, index) => (
          <li key={index} className="flex items-center">
            <div className="h-2.5 rounded-full w-full bg-neutral-200 dark:bg-neutral-700">
              <div 
                className="h-2.5 rounded-full" 
                style={{ 
                  width: `${topic.value}%`,
                  backgroundColor: colors[index]
                }}
              />
            </div>
            <span className="ml-2 text-sm text-neutral-700 dark:text-neutral-300 min-w-[50px]">{topic.value}%</span>
            <span className="ml-2 text-sm text-neutral-700 dark:text-neutral-300">{topic.label}</span>
          </li>
        ))}
      </ul>

      {showLegend && (
        <div className="flex flex-wrap gap-4 pt-2">
          {topicData.map((topic, index) => (
            <div key={index} className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: colors[index] }}
              />
              <span className="text-xs text-neutral-700 dark:text-neutral-300">{topic.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
