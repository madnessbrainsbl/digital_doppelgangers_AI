export interface Message {
  id: number;
  channelId: number;
  content: string;
  role: 'user' | 'assistant' | 'system';
  metadata?: {
    functionCall?: {
      name: string;
      arguments: string;
    };
    functionResponse?: {
      name: string;
      content: string;
    };
  };
  createdAt: Date;
  updatedAt: Date | null;
} 