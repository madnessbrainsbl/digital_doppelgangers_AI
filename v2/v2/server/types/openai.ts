export interface OpenAiFunction {
  id: number;
  name: string;
  description: string | null;
  parameters: any;
  channelId: number | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface FunctionExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
} 