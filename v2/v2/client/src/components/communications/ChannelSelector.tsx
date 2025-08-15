import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Channel {
  id: number;
  name: string;
  type: string;
  status: string;
}

interface ChannelSelectorProps {
  onChannelSelect: (channelId: number | null) => void;
  selectedChannelId: number | null;
}

export default function ChannelSelector({
  onChannelSelect,
  selectedChannelId,
}: ChannelSelectorProps) {
  // Запрос данных о доступных каналах
  const { data: channels, isLoading } = useQuery<Channel[]>({
    queryKey: ["/api/channels"],
  });

  // Получение иконки для типа канала
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
        return "chat";
      default:
        return "chat_bubble";
    }
  };

  // Обработчик выбора канала
  const handleChannelChange = (value: string) => {
    if (value === "all") {
      onChannelSelect(null);
      return;
    }
    onChannelSelect(parseInt(value));
  };

  if (isLoading) {
    return <Skeleton className="h-9 w-48" />;
  }

  return (
    <div className="mb-4">
      <Select
        value={selectedChannelId ? String(selectedChannelId) : "all"}
        onValueChange={handleChannelChange}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Выберите канал" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex items-center">
              <span className="material-icons text-lg mr-2">all_inbox</span>
              <span>Все каналы</span>
            </div>
          </SelectItem>

          {channels &&
            channels.map(
              (channel) =>
                (channel.type === "web" ||
                  channel.type === "vk" ||
                  channel.type === "avito") && (
                  <SelectItem key={channel.id} value={String(channel.id)}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        <span className="material-icons text-lg mr-2">
                          {getChannelIcon(channel.type)}
                        </span>
                        <span>{channel.name}</span>
                      </div>
                      <Badge
                        variant={
                          channel.status === "active" ? "default" : "outline"
                        }
                        className="ml-2"
                      >
                        {channel.type}
                      </Badge>
                    </div>
                  </SelectItem>
                )
            )}
        </SelectContent>
      </Select>
    </div>
  );
}
