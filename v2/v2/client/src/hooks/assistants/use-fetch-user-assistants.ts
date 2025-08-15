import { useQuery } from "@tanstack/react-query";
import { toast } from "../use-toast";
import axios from "axios";

export interface Assistant {
  id: number;
  name: string;
  description: string;
  type: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  createdBy?: number;
  openaiAssistantId?: string;
}

export function useFetchUserAssistants({
  userId,
  enabled = true,
}: {
  userId: number;
  enabled?: boolean;
}) {
  return useQuery<Assistant[], Error>({
    queryKey: ["/api/assistants", userId],
    queryFn: async () => {
      try {
        // Получаем токен авторизации из localStorage
        const token = localStorage.getItem("auth_token");

        if (!token) {
          console.error("Токен авторизации отсутствует в localStorage");
          throw new Error("Токен авторизации отсутствует");
        }

        const response = await axios.get<Assistant[]>(`/api/assistants`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Проверяем структуру данных
        if (!Array.isArray(response.data)) {
          console.error("Некорректный формат данных API:", response.data);
          return [];
        }

        // Фильтруем ассистентов по createdBy, который должен соответствовать userId
        const userAssistants = response.data.filter(
          (assistant) => assistant.createdBy === userId
        );

        return userAssistants;
      } catch (error) {
        console.error("Ошибка при получении ассистентов:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить список ассистентов",
          variant: "destructive",
        });
        throw error;
      }
    },
    enabled,
    retry: 1, // Ограничиваем количество повторных попыток
  });
}
