import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface DataPoint {
  name: string;
  value: number;
}

interface AnalyticsChartProps {
  title: string;
  data: DataPoint[];
  timeFrame: "week" | "month" | "year";
  onTimeFrameChange: (value: "week" | "month" | "year") => void;
}

export default function AnalyticsChart({ 
  title, 
  data, 
  timeFrame, 
  onTimeFrameChange 
}: AnalyticsChartProps) {
  const chartColor = useMemo(() => {
    return "hsl(var(--primary))";
  }, []);

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">{title}</CardTitle>
        <Select
          value={timeFrame}
          onValueChange={(value) => onTimeFrameChange(value as "week" | "month" | "year")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="За неделю" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">За неделю</SelectItem>
            <SelectItem value="month">За месяц</SelectItem>
            <SelectItem value="year">За год</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value) => [value, "Диалогов"]}
                labelFormatter={(label) => `День: ${label}`}
              />
              <Bar 
                dataKey="value" 
                fill={chartColor}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
