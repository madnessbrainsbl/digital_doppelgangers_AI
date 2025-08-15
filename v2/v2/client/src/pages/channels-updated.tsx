import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import PageHeader from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CHANNEL_TYPES } from "@/lib/constants";
import { VkChannelDialog } from "@/components/channels/vk-channel-dialog";
import { AvitoChannelDialog } from "@/components/channels/avito-channel-dialog";
import { WebChannelDialog } from "@/components/channels/web-channel-dialog";
import { EmailChannelDialog } from "@/components/channels/email-channel-dialog";
import { TelegramChannelDialog } from "@/components/channels/telegram-channel-dialog";
import { SmsChannelDialog } from "@/components/channels/sms-channel-dialog";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LoaderCircle, Settings, MessageSquare, AlertTriangle } from "lucide-react";
import { useTariffLimits } from "@/hooks/use-tariff-limits";

// Тип для канала
interface Channel {
  id: number;
  name: string;
  type: string;
  status: string;
  settings?: Record<string, string>;
  createdAt?: string;
}

export default function Channels() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [vkDialogOpen, setVkDialogOpen] = useState(false);
  const [avitoDialogOpen, setAvitoDialogOpen] = useState(false);
  const [webDialogOpen, setWebDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [telegramDialogOpen, setTelegramDialogOpen] = useState(false);
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  
  // Получаем лимиты тарифного плана
  const {
    canCreateChannel,
    channelsLimit,
    channelsUsed,
    isBasicPlan,
    allowedChannelTypes
  } = useTariffLimits();
  
  // Получаем данные о каналах
  const { data, isLoading } = useQuery<Channel[]>({
    queryKey: ["/api/channels"],
  });
  
  // Используем данные с проверкой типов
  const channels = data || [];
  
  const handleConnect = (channel: { id: string, name: string }) => {
    // Проверяем, можем ли создать ещё один канал
    if (!canCreateChannel) {
      toast({
        title: "Ограничение тарифа",
        description: `Достигнут лимит каналов (${channelsUsed}/${channelsLimit}). Для добавления новых каналов необходимо перейти на тариф выше.`,
        variant: "destructive",
      });
      return;
    }
    
    // Проверяем, доступен ли этот тип канала для текущего тарифа
    if (isBasicPlan && !allowedChannelTypes.includes(channel.id)) {
      toast({
        title: "Ограничение тарифа",
        description: `Каналы типа ${channel.name} недоступны на тарифе Базовый. Для использования этого типа канала необходимо перейти на тариф выше.`,
        variant: "destructive",
      });
      return;
    }
    
    if (channel.id === "vk") {
      setVkDialogOpen(true);
    } else if (channel.id === "avito") {
      setAvitoDialogOpen(true);
    } else if (channel.id === "web") {
      setWebDialogOpen(true);
    } else if (channel.id === "email") {
      setEmailDialogOpen(true);
    } else if (channel.id === "telegram") {
      setTelegramDialogOpen(true);
    } else if (channel.id === "sms") {
      setSmsDialogOpen(true);
    } else {
      toast({
        title: `Подключение ${channel.name}`,
        description: `Подключение канала ${channel.name} будет доступно в следующем обновлении`,
      });
    }
  };
  
  // Переход на страницу детализации канала
  const handleChannelDetails = (channelId: number) => {
    setLocation(`/channels/${channelId}`);
  };

  return (
    <div>
      <PageHeader 
        title="Каналы связи"
        description="Подключение и настройка каналов коммуникации"
      />

      {/* Состояние загрузки */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <div className="flex flex-col items-center gap-2">
            <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Загрузка данных о каналах...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Подключенные каналы */}
          {channels.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Подключенные каналы</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {channels.map((channel) => (
                  <Card key={channel.id}>
                    <CardContent className="pt-6 flex flex-col items-center text-center p-6">
                      <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mb-4">
                        <span className="material-icons text-3xl text-primary-600 dark:text-primary-400">
                          {channel.type === "telegram" ? "telegram" : 
                           channel.type === "whatsapp" ? "whatsapp" : 
                           channel.type === "vk" ? "public" : 
                           channel.type === "avito" ? "shopping_cart" :
                           channel.type === "facebook" ? "facebook" : 
                           channel.type === "email" ? "email" : 
                           channel.type === "web" ? "language" : 
                           channel.type === "voice" ? "phone" :
                           channel.type === "sms" ? "sms" : "chat"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-medium text-neutral-900 dark:text-white">{channel.name}</h3>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {channel.status === "active" ? "Активен" : "Неактивен"}
                        </Badge>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                          {channel.type === "vk" ? "ВКонтакте" : 
                           channel.type === "telegram" ? "Telegram" : 
                           channel.type === "whatsapp" ? "WhatsApp" : 
                           channel.type === "avito" ? "Авито" : channel.type}
                        </Badge>
                      </div>
                      
                      <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                        Канал настроен и готов к работе
                      </p>
                      
                      <div className="flex gap-2 w-full mt-auto">
                        <Button 
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleChannelDetails(channel.id)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Настройки
                        </Button>
                        
                        {(channel.type === "vk" || channel.type === "avito") && (
                          <Button 
                            variant="default"
                            className="flex-1"
                            onClick={() => setLocation(`/channels/${channel.id}/${channel.type === "vk" ? "vk" : "avito"}-dialogs`)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Диалоги
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Информация о лимите каналов */}
          {!canCreateChannel && (
            <div className="mt-6 p-4 border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/30 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-amber-800 dark:text-amber-300">Достигнут лимит каналов</h4>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                    Вы используете {channelsUsed} из {channelsLimit} доступных каналов в вашем тарифном плане.
                    Для создания дополнительных каналов перейдите на тариф выше.
                  </p>
                  <Button asChild className="mt-3" variant="outline" size="sm">
                    <Link href="/billing">
                      Изменить тариф
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Ограничение тарифа Базовый */}
          {isBasicPlan && (
            <div className="mt-6 p-4 border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/30 rounded-lg">
              <div className="flex items-start">
                <span className="material-icons text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0">info</span>
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-300">Ограничение тарифа Базовый</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                    На тарифе Базовый доступны только каналы типа Web и Telegram.
                    Для использования других типов каналов перейдите на тариф выше.
                  </p>
                  <Button asChild className="mt-3" variant="outline" size="sm">
                    <Link href="/billing">
                      Изменить тариф
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Доступные для подключения каналы */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Доступные каналы</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {CHANNEL_TYPES
                .filter(channel => {
                  // Отфильтровываем каналы, недоступные для тарифа Базовый
                  if (isBasicPlan && !allowedChannelTypes.includes(channel.id)) {
                    return false;
                  }
                  
                  // Для каналов с поддержкой множественного подключения всегда показываем возможность добавить новый канал
                  if (channel.allowMultiple) {
                    return true;
                  }
                  // Для остальных - только если еще не подключены
                  return !channels.some(c => c.type === channel.id);
                })
                .map((channel) => (
                <Card key={channel.id}>
                  <CardContent className="pt-6 flex flex-col items-center text-center p-6">
                    <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mb-4">
                      <span className="material-icons text-3xl text-primary-600 dark:text-primary-400">
                        {channel.id === "telegram" ? "telegram" : 
                         channel.id === "whatsapp" ? "whatsapp" : 
                         channel.id === "vk" ? "public" : 
                         channel.id === "avito" ? "shopping_cart" :
                         channel.id === "facebook" ? "facebook" : 
                         channel.id === "email" ? "email" : 
                         channel.id === "web" ? "language" : 
                         channel.id === "voice" ? "phone" :
                         channel.id === "sms" ? "sms" : "chat"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-medium text-neutral-900 dark:text-white">{channel.name}</h3>
                    </div>
                    
                    <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                      Подключите {channel.name} для общения с вашей аудиторией через этот канал.
                    </p>
                    
                    <Button 
                      variant="outline"
                      className="mt-auto w-full"
                      onClick={() => handleConnect(channel)}
                      disabled={!canCreateChannel}
                    >
                      <span className="material-icons text-[18px] mr-1">add_link</span>
                      <span>Подключить</span>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Диалоги для настройки каналов */}
      <VkChannelDialog open={vkDialogOpen} onOpenChange={setVkDialogOpen} />
      <AvitoChannelDialog open={avitoDialogOpen} onOpenChange={setAvitoDialogOpen} />
      <WebChannelDialog open={webDialogOpen} onOpenChange={setWebDialogOpen} />
      <EmailChannelDialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen} />
      <TelegramChannelDialog open={telegramDialogOpen} onOpenChange={setTelegramDialogOpen} />
      <SmsChannelDialog open={smsDialogOpen} onOpenChange={setSmsDialogOpen} />
    </div>
  );
}