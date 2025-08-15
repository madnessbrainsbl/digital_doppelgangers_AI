import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import PageHeader from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft } from "lucide-react";
import VkDialogsList from "@/components/communications/VkDialogsList";
import VkChatInterface from "@/components/communications/VkChatInterface";

// Интерфейс для каналов
interface Channel {
  id: number;
  name: string;
  type: string;
  status: string;
  settings: {
    accessToken?: string;
    groupId?: string;
    [key: string]: any;
  };
  createdBy: number;
  createdAt: string;
}

export default function VkDialogs() {
  const [location, setLocation] = useLocation();
  const params = useParams();
  const channelId = params.id ? parseInt(params.id) : null;
  const [selectedPeerId, setSelectedPeerId] = useState<number | null>(null);
  
  // Запрос данных о канале
  const { data: channelData, isLoading: isLoadingChannel, error: channelError } = useQuery<Channel>({
    queryKey: [`/api/channels/${channelId}`],
    enabled: !!channelId,
  });
  
  // Проверка доступного токена ВК
  const hasValidVkToken = channelData && 
                          channelData.type === "vk" && 
                          channelData.settings && 
                          channelData.settings.accessToken;
  
  // Если параметр выбранного диалога меняется в URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const dialogId = urlParams.get("dialog");
    if (dialogId) {
      setSelectedPeerId(parseInt(dialogId));
    }
  }, [location]);
  
  // При выборе диалога обновляем URL
  const handleSelectDialog = (peerId: number) => {
    setSelectedPeerId(peerId);
    
    // Обновляем параметр в URL
    const url = new URL(window.location.href);
    url.searchParams.set("dialog", peerId.toString());
    window.history.pushState({}, "", url.toString());
  };

  // Если канал не найден или произошла ошибка
  if (channelError || (channelData && channelData.type !== "vk")) {
    return (
      <div className="h-full container mx-auto py-6">
        <PageHeader 
          title="Диалоги VK"
          description="Управление сообщениями из VK"
        />
        
        <div className="mt-6">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>
              {channelError
                ? "Ошибка загрузки данных канала. Проверьте ID канала и попробуйте снова."
                : "Выбранный канал не является каналом VK."}
            </AlertDescription>
          </Alert>
          
          <Link href="/channels">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Вернуться к списку каналов
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  // Если канал найден, но нет токена VK
  if (channelData && !hasValidVkToken) {
    return (
      <div className="h-full container mx-auto py-6">
        <PageHeader 
          title="Диалоги VK"
          description="Управление сообщениями из VK"
        />
        
        <div className="mt-6">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>
              Для работы с диалогами VK необходимо настроить токен доступа в настройках канала.
            </AlertDescription>
          </Alert>
          
          <div className="flex space-x-4">
            <Link href="/channels">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Вернуться к списку каналов
              </Button>
            </Link>
            
            <Link href={`/channels/edit/${channelId}`}>
              <Button>
                Настроить канал VK
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)]">
      <PageHeader 
        title="Диалоги VK"
        description={`Управление сообщениями из канала "${channelData?.name || 'Загрузка...'}"`}
        actions={
          <Link href="/channels">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              К списку каналов
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-14rem)]">
        {/* Список диалогов */}
        <div className="lg:col-span-1 border rounded-md overflow-hidden">
          {channelId && (
            <VkDialogsList
              channelId={channelId}
              onSelectDialog={handleSelectDialog}
              selectedPeerId={selectedPeerId}
            />
          )}
        </div>

        {/* Область чата */}
        <div className="lg:col-span-3 border rounded-md overflow-hidden">
          {channelId && selectedPeerId ? (
            <VkChatInterface
              channelId={channelId}
              peerId={selectedPeerId}
              contactName={`Собеседник ${selectedPeerId}`}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-3 mb-4">
                <span className="material-icons text-blue-600 dark:text-blue-300 text-3xl">chat</span>
              </div>
              <h3 className="text-xl font-medium text-neutral-900 dark:text-white mb-2">
                Выберите диалог
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400 max-w-md">
                Выберите диалог из списка слева, чтобы начать общение.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}