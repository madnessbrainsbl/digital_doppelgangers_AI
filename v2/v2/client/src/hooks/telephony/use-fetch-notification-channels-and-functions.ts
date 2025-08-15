import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface NotificationChannel {
  id: number;
  createdBy: number;
  type: string; // "telegram", "whatsapp", etc.
  name: string;
  identifier: string; // Используется как chatId для Telegram
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  settings: {
    chatId: string;
    botToken: string;
  };
  config?: Record<string, any>; // Дополнительные настройки канала
}

// Интерфейс для параметров функции в формате, который ожидает Voximplant
interface FunctionParameters {
  type: string;
  required: string[];
  properties: Record<
    string,
    {
      type: string;
      description: string;
    }
  >;
}

interface UserFunction {
  id: number;
  createdBy: number;
  name: string;
  description: string;
  functionType: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parameters: FunctionParameters; // Параметры функции в формате для Voximplant
  code?: string; // Код функции
  config?: Record<string, any>; // Дополнительные настройки функции
}

interface NotificationChannelsAndFunctionsResponse {
  success: boolean;
  notificationChannels: NotificationChannel[];
  userFunctions: UserFunction[];
}

interface UseFetchNotificationChannelsAndFunctionsParams {
  userId: number;
  enabled?: boolean;
}

export function useFetchNotificationChannelsAndFunctions({
  userId,
  enabled = true,
}: UseFetchNotificationChannelsAndFunctionsParams) {
  return useQuery({
    queryKey: ["notificationChannelsAndFunctions", userId],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");

      const response =
        await axios.get<NotificationChannelsAndFunctionsResponse>(
          "/api/telephony/notification-channels-and-functions",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      return response.data;
    },
    enabled: !!userId && enabled,
  });
}
