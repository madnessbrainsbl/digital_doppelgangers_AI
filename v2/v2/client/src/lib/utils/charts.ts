import { format } from "date-fns";
import { ru } from "date-fns/locale";

// Function to generate date labels for the chart (7 days)
export const generateDateLabels = (days = 7): string[] => {
  const labels: string[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    labels.push(format(date, "EEEEEE", { locale: ru }));
  }

  return labels;
};

// Function to generate demo data for charts
export const generateDemoData = (days = 7, min = 30, max = 100): number[] => {
  return Array.from({ length: days }, () =>
    Math.floor(Math.random() * (max - min + 1) + min)
  );
};

// Function to format topic data for chart display
export const formatTopicData = (topicData: Record<string, number>) => {
  return Object.entries(topicData)
    .map(([label, value]) => ({
      label,
      value,
    }))
    .sort((a, b) => b.value - a.value);
};

// Colors for chart elements
export const chartColors = {
  primary: {
    100: "rgba(224, 231, 255, 1)",
    200: "rgba(199, 210, 254, 1)",
    300: "rgba(165, 180, 252, 1)",
    400: "rgba(129, 140, 248, 1)",
    500: "rgba(99, 102, 241, 1)",
    600: "rgba(79, 70, 229, 1)",
    700: "rgba(67, 56, 202, 1)",
    800: "rgba(55, 48, 163, 1)",
    900: "rgba(49, 46, 129, 1)",
  },
  secondary: {
    500: "rgba(16, 185, 129, 1)",
  },
  amber: {
    500: "rgba(245, 158, 11, 1)",
  },
  red: {
    500: "rgba(239, 68, 68, 1)",
  },
  purple: {
    500: "rgba(168, 85, 247, 1)",
  },
  neutral: {
    200: "rgba(229, 231, 235, 1)",
    700: "rgba(55, 65, 81, 1)",
  },
};

// Function to get a color palette for charts
export const getColorPalette = (count: number) => {
  const baseColors = [
    chartColors.primary[500],
    chartColors.secondary[500],
    chartColors.amber[500],
    chartColors.red[500],
    chartColors.purple[500],
  ];

  if (count <= baseColors.length) {
    return baseColors.slice(0, count);
  }

  // Generate more colors if needed
  const result = [...baseColors];
  for (let i = baseColors.length; i < count; i++) {
    const hue = (i * 137) % 360; // Golden ratio to distribute hues
    result.push(`hsla(${hue}, 70%, 60%, 1)`);
  }

  return result;
};
