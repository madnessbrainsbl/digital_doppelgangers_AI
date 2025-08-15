export interface TelegramMessage {
  id: number;
  type: string;
  date: string;
  from?: string;
  from_id?: string;
  text: string | Array<{ type: string; text: string }>;
  reply_to_message_id?: number;
  user?: {
    first_name?: string;
    last_name?: string;
    username?: string;
  };
}

export interface TelegramChat {
  name: string;
  type: string;
  id: number;
  messages: TelegramMessage[];
}

export interface TelegramExport {
  name: string;
  type: string;
  id: number;
  messages: TelegramMessage[];
  user?: {
    first_name?: string;
    last_name?: string;
    username?: string;
  };
}

export interface ProcessedMessage {
  text: string;
  isUser: boolean;
  timestamp: Date;
  chatName: string;
}

export interface UserProfile {
  totalMessages: number;
  averageMessageLength: number;
  commonPhrases: string[];
  communicationStyle: string;
  responsePatterns: string[];
  interests: string[];
  role: string;
  sampleMessages: string[];
  emojiUsage: string[];
  punctuationPatterns: string[];
  vocabularyComplexity: string;
  responseSpeed: string;
  formalityLevel: string;
  emotionalPatterns: {
    positiveEmotions: string[];
    negativeEmotions: string[];
    humorStyle: string;
    empathyLevel: string;
    stressResponses: string[];
  };
  personalityTraits: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  conversationContext: {
    preferredTopics: string[];
    avoidedTopics: string[];
    conversationStarters: string[];
    conversationEnders: string[];
    smallTalkStyle: string;
  };
  timePatterns: {
    activeHours: string[];
    responseDelays: {
      immediate: number;
      within5min: number;
      within1hour: number;
      within24hours: number;
    };
    weekendBehavior: string;
  };
  socialBehavior: {
    groupChatStyle: string;
    privateChatStyle: string;
    conflictResolution: string;
    supportStyle: string;
    celebrationStyle: string;
  };
}

export interface DigitalTwinData {
  id: string;
  name: string;
  systemPrompt: string;
  profile: UserProfile;
  messagesCount: number;
  createdAt: string;
}

export interface TelegramBot {
  id: string;
  user_id: string;
  name: string;
  username: string;
  token: string;
  status: 'active' | 'inactive' | 'error';
  connected_twin_id?: string;
  webhook_url?: string;
  voice_enabled: boolean;
  messages_count: number;
  created_at: string;
  updated_at: string;
}

export interface TelegramIntegrationMessage {
  id: string;
  bot_id: string;
  chat_id: string;
  chat_name: string;
  message_text: string;
  is_voice: boolean;
  is_incoming: boolean;
  response_text?: string;
  response_voice?: boolean;
  timestamp: string;
  created_at: string;
}