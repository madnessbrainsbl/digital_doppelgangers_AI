import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export interface IncomingParam {
  id: string;
  userId: number;
  phone: string;
  assistantId: string | null;
  tgChatId: string | null;
  tgToken: string | null;
  functionObj: any | null;
  promptTask: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useFetchIncomingParams({
  userId,
  phoneNumber,
  enabled = true,
}: {
  userId: number;
  phoneNumber?: string;
  enabled?: boolean;
}) {
  return useQuery<IncomingParam | null>({
    queryKey: ["incoming-params", userId, phoneNumber],
    queryFn: async () => {
      if (!phoneNumber) return null;

      const token = localStorage.getItem("auth_token");

      try {
        const response = await axios.get(
          `/api/telephony/incoming-params/${phoneNumber}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        return null;
      } catch (error: any) {
        // Теперь обрабатываем только реальные сетевые ошибки
        console.error(
          "Ошибка при получении параметров входящих звонков:",
          error
        );

        return null; // Возвращаем null вместо выброса ошибки
      }
    },
    enabled: !!userId && !!phoneNumber && enabled,
    // Добавляем настройки для более стабильной работы
    retry: false, // Не повторяем запрос при ошибке
    refetchOnWindowFocus: false, // Не перезапрашиваем при фокусе на окно
  });
}
