import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Channel } from "@shared/schema";

interface ChannelCardProps {
  channel: Channel;
  onEdit: (channel: Channel) => void;
}

export default function ChannelCard({ channel, onEdit }: ChannelCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleActivation = useMutation({
    mutationFn: async () => {
      const updatedStatus = channel.status === "active" ? "inactive" : "active";
      await apiRequest("PUT", `/api/channels/${channel.id}`, {
        status: updatedStatus
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      toast({
        title: "Успешно",
        description: `Канал ${channel.status === "active" ? "деактивирован" : "активирован"}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось обновить статус канала: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const getChannelIcon = (type: string) => {
    switch (type) {
      case "telegram":
        return "send";
      case "whatsapp":
        return "whatsapp";
      case "web":
        return "language";
      case "email":
        return "email";
      case "vk":
        return "forum";
      default:
        return "chat";
    }
  };

  const getChannelColor = (type: string) => {
    switch (type) {
      case "telegram":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300";
      case "whatsapp":
        return "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300";
      case "web":
        return "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300";
      case "email":
        return "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300";
      case "vk":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300";
    }
  };

  const getChannelName = (type: string) => {
    switch (type) {
      case "telegram":
        return "Telegram";
      case "whatsapp":
        return "WhatsApp";
      case "web":
        return "Веб-чат";
      case "email":
        return "Email";
      case "vk":
        return "ВКонтакте";
      default:
        return type;
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-6 bg-white dark:bg-neutral-800">
        <div className="flex items-center mb-4">
          <div className={`w-12 h-12 rounded-full ${getChannelColor(channel.type)} flex items-center justify-center`}>
            <span className="material-icons text-2xl">{getChannelIcon(channel.type)}</span>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-medium text-neutral-900 dark:text-white">
              {channel.name}
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {getChannelName(channel.type)}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              {channel.status === "active" ? "Активен" : "Неактивен"}
            </span>
            <Switch
              checked={channel.status === "active"}
              onCheckedChange={() => toggleActivation.mutate()}
              disabled={toggleActivation.isPending}
            />
          </div>
        </div>

        <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4">
          {channel.type === "telegram" ? "Канал Telegram для общения с клиентами через бота" :
           channel.type === "whatsapp" ? "Подключение WhatsApp Business API для обработки сообщений" :
           channel.type === "web" ? "Виджет чата для вашего сайта" :
           "Канал связи с клиентами"}
        </p>

        <div className="flex justify-end">
          <button
            onClick={() => onEdit(channel)}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium flex items-center"
          >
            <span className="material-icons text-sm mr-1">edit</span>
            Настроить
          </button>
        </div>
      </div>
    </Card>
  );
}
