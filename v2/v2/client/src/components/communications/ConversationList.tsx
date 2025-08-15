import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Conversation } from "@/types/messages";

interface ConversationListProps {
  conversations: Conversation[];
  onSelectConversation: (id: number) => void;
  selectedConversationId: number | null;
  compact?: boolean; // Режим компактного отображения
}

export default function ConversationList({
  conversations,
  onSelectConversation,
  selectedConversationId,
  compact = false
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Фильтрация бесед по поисковому запросу
  const filteredConversations = searchQuery.trim() 
    ? conversations.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "telegram":
        return "send";
      case "whatsapp":
        return "whatsapp";
      case "web":
        return "language";
      case "email":
        return "email";
      default:
        return "chat";
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case "telegram":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300";
      case "whatsapp":
        return "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300";
      case "web":
        return "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300";
      case "email":
        return "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300";
      default:
        return "bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300";
    }
  };

  // Определяем классы и размеры в зависимости от режима
  const containerClasses = compact ? "flex flex-col" : "flex flex-col h-full";
  const avatarSize = compact ? "h-8 w-8" : "h-10 w-10";
  const itemClasses = compact
    ? "px-2 py-1.5 cursor-pointer flex items-center hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors mb-1"
    : "px-3 py-2 cursor-pointer flex items-center border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors";

  return (
    <div className={containerClasses}>
      {!compact && (
        <div className="p-3 border-b border-neutral-200 dark:border-neutral-700">
          <Input
            placeholder="Поиск диалогов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
      )}

      <ScrollArea className={compact ? "" : "flex-1"}>
        {filteredConversations.length > 0 ? (
          <div>
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={`${itemClasses} ${
                  selectedConversationId === conversation.id 
                    ? "bg-neutral-100 dark:bg-neutral-800" 
                    : ""
                }`}
              >
                <Avatar className={`${avatarSize} ${getChannelColor(conversation.channel)}`}>
                  <AvatarFallback>
                    <span className="material-icons text-[16px]">{getChannelIcon(conversation.channel)}</span>
                  </AvatarFallback>
                </Avatar>

                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className={`text-sm font-medium truncate ${
                      conversation.unread 
                        ? "text-neutral-900 dark:text-white" 
                        : "text-neutral-600 dark:text-neutral-300"
                    }`}>
                      {conversation.name}
                    </p>
                    <div className="flex items-center gap-2">
                      {conversation.unreadCount !== undefined && conversation.unreadCount > 0 && (
                        <span className="min-w-[20px] h-[20px] flex items-center justify-center bg-primary-500 text-white text-xs font-medium rounded-full px-1">
                          {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                        </span>
                      )}
                      {!compact && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                          {conversation.timestamp}
                        </p>
                      )}
                    </div>
                  </div>

                  {!compact && (
                    <div className="flex justify-between items-center mt-1">
                      <p className={`text-xs truncate ${
                        conversation.unread 
                          ? "text-neutral-800 dark:text-neutral-200 font-medium" 
                          : "text-neutral-500 dark:text-neutral-400"
                      }`}>
                        {conversation.lastMessage}
                      </p>

                      {conversation.unread && (
                        <span className="ml-2 h-2 w-2 bg-primary-500 rounded-full flex-shrink-0"></span>
                      )}
                    </div>
                  )}

                  {compact && conversation.unread && (
                    <span className="ml-1 h-2 w-2 bg-primary-500 rounded-full flex-shrink-0"></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {searchQuery.trim() 
                ? "Диалоги не найдены" 
                : "Нет доступных диалогов"}
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}