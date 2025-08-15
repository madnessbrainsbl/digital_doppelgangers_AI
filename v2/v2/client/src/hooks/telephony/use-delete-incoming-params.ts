import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "@/hooks/use-toast";

export function useDeleteIncomingParams() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (phoneNumber: string) => {
      const token = localStorage.getItem("auth_token");

      const response = await axios.delete(
        `/api/telephony/incoming-params/${phoneNumber}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Успешно",
        description: "Параметры входящего звонка удалены",
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
          "Не удалось удалить параметры входящего звонка",
        variant: "destructive",
      });
    },
  });
}
