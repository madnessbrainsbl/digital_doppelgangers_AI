import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "@/hooks/use-toast";

export interface SaveIncomingParamsData {
  phone: string;
  assistantId?: string | null;
  tgChatId?: string | null;
  tgToken?: string | null;
  functionObj?: any | null;
  promptTask?: string | null;
}

export function useSaveIncomingParams() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SaveIncomingParamsData) => {
      const token = localStorage.getItem("auth_token");

      const response = await axios.post(
        "/api/telephony/new-incoming-params",
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Успешно",
        description: "Параметры входящего звонка сохранены",
      });

      // Инвалидируем кеш для обновления данных
      queryClient.invalidateQueries({
        queryKey: ["incoming-params"],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description:
          error.response?.data?.message ||
          "Не удалось сохранить параметры входящего звонка",
        variant: "destructive",
      });
    },
  });
}
