export interface NavItem {
  href: string;
  icon: string;
  label: string;
}

export interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  iconColor: string;
  change?: {
    value: string;
    icon: string;
    positive: boolean;
  };
}

export interface TopicItem {
  name: string;
  percentage: number;
  color: string;
}

export interface ChartData {
  day: string;
  value: number;
}

export interface AssistantProps {
  id: number;
  name: string;
  icon: string;
  iconBg: string;
  status: 'active' | 'training' | 'inactive';
  updatedAt: string;
}

export interface DocumentProps {
  id: number;
  name: string;
  icon: string;
  iconBg: string;
  fileSize: string;
  uploadedAt: string;
}

export interface ActivityProps {
  id: number;
  type: 'conversation' | 'team' | 'notification' | 'channel' | 'assistant' | 'document';
  description: string;
  time: string;
  icon: string;
  iconBg: string;
}
