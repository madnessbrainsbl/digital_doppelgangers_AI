// Типы для обычных сообщений
export interface Message {
  id: number;
  conversationId: number;
  senderType: string;
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Типы для бесед
export interface Conversation {
  id: number;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  unreadCount?: number;
  channel: string;
}

// Интерфейсы для VK
export interface VkMessage {
  id: number;
  date: number;
  fromId: number;
  peerId: number;
  text: string;
  attachments?: VkAttachment[];
  isCorrected?: boolean;
  correction?: string;
  is_edited?: boolean;
}

export interface VkAttachment {
  type: string;
  url?: string;
  title?: string;
  [key: string]: any;
}

export interface VkConversation {
  id: number;
  type: string;
  lastMessage: VkMessage;
  unreadCount?: number;
  canWrite?: {
    allowed: boolean;
  };
}

export interface VkUser {
  id: number;
  first_name: string;
  last_name?: string;
  photo_100?: string;
  deactivated?: string;
  is_closed?: boolean;
  can_access_closed?: boolean;
}

export interface VkDialogDisplay {
  id: number;
  peerId: number;
  fromId: number;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  unreadCount: number;
  avatarUrl?: string;
  hasAssistant?: boolean;
  assistantEnabled?: boolean;
  autoReply?: boolean;
}

// Интерфейс для данных ассистента диалога
export interface DialogAssistant {
  id: number;
  channelId: number;
  dialogId: number;
  assistantId: number;
  enabled: boolean;
  autoReply: boolean;
  settings?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  isChannelDefault?: boolean;
}
