export interface Channel {
  id: number;
  name: string;
  type: 'telegram' | 'discord' | 'slack' | 'email';
  settings: any;
  createdAt: Date;
  updatedAt: Date | null;
} 