import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DataPoint {
  name: string;
  conversations: number;
  responseTime: number;
  successRate: number;
}

interface AnalyticsCardProps {
  title: string;
  data: DataPoint[];
  description?: string;
  timeFrame: "day" | "week" | "month" | "year";
  onTimeFrameChange: (value: "day" | "week" | "month" | "year") => void;
}

export default function AnalyticsCard({
  title,
  data,
  description,
  timeFrame,
  onTimeFrameChange,
}: AnalyticsCardProps) {
  const [activeMetric, setActiveMetric] = useState<"conversations" | "responseTime" | "successRate">("conversations");

  const metricColors = {
    conversations: "hsl(var(--chart-1))",
    responseTime: "hsl(var(--chart-2))",
    successRate: "hsl(var(--chart-3))",
  };

  const yAxisConfig = useMemo(() => {
    switch (activeMetric) {
      case "conversations":
        return { label: "Диалогов", unit: "" };
      case "responseTime":
        return { label: "Время ответа", unit: " сек" };
      case "successRate":
        return { label: "Успешность", unit: "%" };
    }
  }, [activeMetric]);

  const timeFrameLabel = useMemo(() => {
    switch (timeFrame) {
      case "day":
        return "За день";
      case "week":
        return "За неделю";
      case "month":
        return "За месяц";
      case "year":
        return "За год";
    }
  }, [timeFrame]);

  const tooltipFormatter = (value: number, name: string) => {
    switch (name) {
      case "conversations":
        return [value, "Диалогов"];
      case "responseTime":
        return [value.toFixed(1), "сек"];
      case "successRate":
        return [value, "%"];
      default:
        return [value, name];
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">{title}</CardTitle>
        <div className="flex items-center space-x-2">
          <Select
            value={activeMetric}
            onValueChange={(value) => setActiveMetric(value as "conversations" | "responseTime" | "successRate")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Метрика" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="conversations">Количество диалогов</SelectItem>
              <SelectItem value="responseTime">Время ответа</SelectItem>
              <SelectItem value="successRate">Успешность</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={timeFrame}
            onValueChange={(value) => onTimeFrameChange(value as "day" | "week" | "month" | "year")}
          >
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder={timeFrameLabel} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">За день</SelectItem>
              <SelectItem value="week">За неделю</SelectItem>
              <SelectItem value="month">За месяц</SelectItem>
              <SelectItem value="year">За год</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {description && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">{description}</p>
        )}
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey="name"
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
                tick={{ fontSize: 12 }}
                label={{ 
                  value: yAxisConfig.label, 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fontSize: 12 }
                }}
                unit={yAxisConfig.unit}
              />
              <Tooltip formatter={tooltipFormatter} />
              <Legend />
              
              {activeMetric === "conversations" && (
                <Bar
                  dataKey="conversations"
                  name="Диалогов"
                  fill={metricColors.conversations}
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                />
              )}
              
              {activeMetric === "responseTime" && (
                <Line
                  type="monotone"
                  dataKey="responseTime"
                  name="Время ответа"
                  stroke={metricColors.responseTime}
                  strokeWidth={3}
                  dot={{ r: 4, fill: metricColors.responseTime }}
                  activeDot={{ r: 6 }}
                />
              )}
              
              {activeMetric === "successRate" && (
                <Line
                  type="monotone"
                  dataKey="successRate"
                  name="Успешность"
                  stroke={metricColors.successRate}
                  strokeWidth={3}
                  dot={{ r: 4, fill: metricColors.successRate }}
                  activeDot={{ r: 6 }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
