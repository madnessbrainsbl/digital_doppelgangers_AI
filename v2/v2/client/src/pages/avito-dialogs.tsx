import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import PageHeader from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft } from "lucide-react";
import AvitoDialogsList from "@/components/communications/AvitoDialogsList";
import AvitoChatInterface from "@/components/communications/AvitoChatInterface";

// Интерфейс для каналов
interface Channel {
  id: number;
  name: string;
  type: string;
  status: string;
  settings: {
    profileId?: string;
    clientId?: string;
    clientSecret?: string;
    [key: string]: any;
  };
  createdBy: number;
  createdAt: string;
}

export default function AvitoDialogs() {
  const [location, setLocation] = useLocation();
  const params = useParams();
  const channelId = params.id ? parseInt(params.id) : null;
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // Запрос данных о канале
  const {
    data: channelData,
    isLoading: isLoadingChannel,
    error: channelError,
  } = useQuery<Channel>({
    queryKey: [`/api/channels/${channelId}`],
    enabled: !!channelId,
  });

  console.log(channelError);

  // Проверка доступных настроек Авито
  const hasValidAvitoSettings =
    channelData &&
    channelData.type === "avito" &&
    channelData.settings?.clientId &&
    channelData.settings?.clientSecret &&
    channelData.settings?.profileId;

  // Если параметр выбранного диалога меняется в URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const dialogId = urlParams.get("dialog");
    if (dialogId) {
      setSelectedChatId(dialogId);
    }
  }, [location]);

  // При выборе диалога обновляем URL
  const handleSelectDialog = (chatId: string) => {
    setSelectedChatId(chatId);

    // Обновляем параметр в URL
    const url = new URL(window.location.href);
    url.searchParams.set("dialog", chatId);
    window.history.pushState({}, "", url.toString());
  };

  // Если канал не найден или произошла ошибка
  if (channelError || (channelData && channelData.type !== "avito")) {
    return (
      <div className="h-full container mx-auto py-6">
        <PageHeader
          title="Диалоги Авито"
          description="Управление сообщениями из Авито"
        />

        <div className="mt-6">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>
              {channelError
                ? "Ошибка загрузки данных канала. Проверьте ID канала и попробуйте снова."
                : "Выбранный канал не является каналом Авито."}
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

  // Если канал найден, но нет настроек Авито
  if (channelData && !hasValidAvitoSettings) {
    return (
      <div className="h-full container mx-auto py-6">
        <PageHeader
          title="Диалоги Авито"
          description="Управление сообщениями из Авито"
        />

        <div className="mt-6">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>
              Для работы с диалогами Авито необходимо настроить параметры
              доступа (Client ID, Client Secret и Profile ID) в настройках
              канала.
            </AlertDescription>
          </Alert>

          <div className="flex space-x-4">
            <Link href="/channels">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Вернуться к списку каналов
              </Button>
            </Link>

            <Link href={`/channels/${channelId}`}>
              <Button>Настроить канал Авито</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  console.log(channelData);

  return (
    <div className="h-[calc(100vh-6rem)]">
      <PageHeader
        title="Диалоги Авито"
        description={`Управление сообщениями из канала "${
          channelData?.name || "Загрузка..."
        }"`}
        actions={
          <Link href="/channels">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />К списку каналов
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-14rem)]">
        {/* Список диалогов */}
        <div className="lg:col-span-1 border rounded-md overflow-hidden">
          {channelId && (
            <AvitoDialogsList
              channelId={channelId}
              onSelectDialog={handleSelectDialog}
              selectedChatId={selectedChatId}
            />
          )}
        </div>

        {/* Область чата */}
        <div className="lg:col-span-3 border rounded-md overflow-hidden">
          {channelId && selectedChatId ? (
            <AvitoChatInterface channelId={channelId} chatId={selectedChatId} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-3 mb-4">
                <span className="material-icons text-blue-600 dark:text-blue-300 text-3xl">
                  chat
                </span>
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
