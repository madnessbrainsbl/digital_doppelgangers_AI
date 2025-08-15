import { useState } from 'react';
import { ChartData } from '@/lib/types';
import { DAYS_OF_WEEK, CHART_COLORS } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ActivityChartProps {
  data: ChartData[];
  title: string;
}

export function ActivityChart({ data, title }: ActivityChartProps) {
  const [period, setPeriod] = useState('week');

  // Find max value to normalize heights
  const maxValue = Math.max(...data.map(item => item.value));
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-neutral-900 dark:text-white">{title}</h3>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Выберите период" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">За неделю</SelectItem>
              <SelectItem value="month">За месяц</SelectItem>
              <SelectItem value="year">За год</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="h-64 flex items-end space-x-2 bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-800 dark:to-neutral-900 rounded">
          {data.map((item, index) => (
            <div 
              key={item.day} 
              className="flex-1 flex flex-col items-center"
            >
              <div 
                className={`w-full rounded-t transition-all duration-500 ease-in-out ${
                  index < 4 
                    ? `bg-primary-${300 + index * 100} dark:bg-primary-${800 - index * 100}` 
                    : `bg-primary-${700 - (index - 4) * 100} dark:bg-primary-${400 + (index - 4) * 100}`
                }`}
                style={{ height: `${Math.max(5, (item.value / maxValue) * 100)}%` }}
              ></div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-between mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          {data.map((item) => (
            <span key={item.day}>{item.day}</span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default ActivityChart;
