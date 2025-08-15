import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import ChannelDialogsList from "@/components/communications/ChannelDialogsList";
import VkMessageViewer from "@/components/communications/VkMessageViewer";
import AvitoChatInterface from "@/components/communications/AvitoChatInterface";
import WebChatInterface from "@/components/communications/WebChatInterface";
import ChatInterface from "@/components/communications/ChatInterface";
import { Message } from "@/types/messages";
import MobileAvitoChat from "@/components/communications/MobileAvitoChat";
import MobileVkChat from "@/components/communications/MobileVkChat";
import MobileWebChat from "@/components/communications/MobileWebChat";

// Тип для данных канала
interface ChannelData {
  id: number;
  name: string;
  type: string;
  status: string;
  unreadCount?: number;
}

// Интерфейс для пропсов мобильного компонента
interface MobileCommunicationsLayoutProps {
  selectedChannelId: number | null;
  setSelectedChannelId: (id: number | null) => void;
  selectedDialogId: number | string | null;
  setSelectedDialogId: (id: number | string | null) => void;
  selectedDialogType: string | null;
  setSelectedDialogType: (type: string | null) => void;
  channelsData: ChannelData[];
  selectedConversationId: number | null;
  setSelectedConversationId: (id: number | null) => void;
  messages: Message[];
  handleSendMessage: (content: string) => void;
  handleEditMessage: (message: Message) => void;
  getSelectedConversationName: () => string;
  getSelectedConversationChannel: () => string;
  handleDialogSelect: (dialogId: number | string, dialogType: string) => void;
}

// Компонент для мобильной версии интерфейса
function MobileCommunicationsLayout({
  selectedChannelId,
  setSelectedChannelId,
  selectedDialogId,
  setSelectedDialogId,
  selectedDialogType,
  setSelectedDialogType,
  channelsData,
  selectedConversationId,
  setSelectedConversationId,
  messages,
  handleSendMessage,
  handleEditMessage,
  getSelectedConversationName,
  getSelectedConversationChannel,
  handleDialogSelect,
}: MobileCommunicationsLayoutProps) {
  // Состояние для отслеживания мобильного экрана (каналы, диалоги, чат)
  const [mobileScreen, setMobileScreen] = useState("channels"); // channels, dialogs, chat

  // Обновляем мобильный экран при изменении выбранных элементов
  useEffect(() => {
    if (selectedDialogId) {
      setMobileScreen("chat");
    } else if (selectedChannelId) {
      setMobileScreen("dialogs");
    } else {
      setMobileScreen("channels");
    }
  }, [selectedChannelId, selectedDialogId]);

  // Функция для возврата назад
  const handleBack = () => {
    if (mobileScreen === "chat") {
      setSelectedDialogId(null);
      setSelectedDialogType(null);
      setMobileScreen("dialogs");
    } else if (mobileScreen === "dialogs") {
      setSelectedChannelId(null);
      setMobileScreen("channels");
    }
  };

  const renderMobileContent = () => {
    // Отображение списка каналов
    if (mobileScreen === "channels") {
      return (
        <div className="flex flex-col h-full">
          <div className="p-3 border-b border-neutral-200 dark:border-neutral-700">
            <Input
              placeholder="Поиск каналов и диалогов..."
              className="w-full"
            />
          </div>
          <ScrollArea className="h-full">
            {/* Список каналов */}
            <div className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-700">
              <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-2">
                Каналы
              </p>
              {channelsData?.map(
                (channel: ChannelData) =>
                  (channel.type === "web" ||
                    channel.type === "vk" ||
                    channel.type === "avito") && (
                    <div
                      key={channel.id + "mob"}
                      onClick={() => {
                        setSelectedChannelId(channel.id);
                        setMobileScreen("dialogs");
                      }}
                      className="py-2 px-1 cursor-pointer flex items-center hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                    >
                      <div className="h-8 w-8 flex items-center justify-center bg-neutral-200 dark:bg-neutral-700 rounded-md">
                        <span className="material-icons text-neutral-600 dark:text-neutral-300 text-lg">
                          {channel.type === "vk" ? "chat" : "mail"}
                        </span>
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium truncate">
                            {channel.name}
                          </p>
                          {channel.unreadCount !== undefined &&
                            channel.unreadCount > 0 && (
                              <span className="ml-2 min-w-5 px-1.5 py-0.5 bg-primary-500 text-white text-xs font-medium rounded-full flex-shrink-0 flex items-center justify-center">
                                {channel.unreadCount > 99
                                  ? "99+"
                                  : channel.unreadCount}
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                  )
              )}
            </div>
          </ScrollArea>
        </div>
      );
    }

    // Отображение списка диалогов выбранного канала
    if (mobileScreen === "dialogs") {
      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center p-3 border-b border-neutral-200 dark:border-neutral-700">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h3 className="font-medium text-neutral-900 dark:text-white truncate">
              {channelsData?.find(
                (c: ChannelData) => c.id === selectedChannelId
              )?.name || "Диалоги"}
            </h3>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChannelDialogsList
              channelId={selectedChannelId}
              channelType={
                channelsData?.find(
                  (c: ChannelData) => c.id === selectedChannelId
                )?.type || null
              }
              onSelectDialog={handleDialogSelect}
              selectedDialogId={selectedDialogId}
            />
          </div>
        </div>
      );
    }

    // Отображение чата
    if (mobileScreen === "chat") {
      if (selectedDialogType === "vk") {
        return (
          <MobileVkChat
            channelId={selectedChannelId!}
            peerId={selectedDialogId!}
            isVisible={true}
            onClose={handleBack}
          />
        );
      } else if (selectedDialogType === "avito") {
        return (
          <MobileAvitoChat
            channelId={selectedChannelId!}
            chatId={selectedDialogId!.toString()}
            isVisible={true}
            onClose={handleBack}
          />
        );
      } else if (selectedDialogType === "web") {
        return (
          <MobileWebChat
            channelId={selectedChannelId!}
            dialogId={selectedDialogId!.toString()}
            isVisible={true}
            onClose={handleBack}
          />
        );
      } else if (selectedConversationId) {
        return (
          <div className="flex flex-col h-full">
            <div className="flex items-center p-3 border-b border-neutral-200 dark:border-neutral-700">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="mr-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h3 className="font-medium text-neutral-900 dark:text-white">
                {getSelectedConversationName()}
              </h3>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatInterface
                conversationId={selectedConversationId}
                conversationName={getSelectedConversationName()}
                channelType={getSelectedConversationChannel()}
                messages={messages}
                onSendMessage={handleSendMessage}
                onEditMessage={handleEditMessage}
              />
            </div>
          </div>
        );
      }
    }

    return null;
  };

  return <div className="flex flex-col h-full">{renderMobileContent()}</div>;
}

export default MobileCommunicationsLayout;
