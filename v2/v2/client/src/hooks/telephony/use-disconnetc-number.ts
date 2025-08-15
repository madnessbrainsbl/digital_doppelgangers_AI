import { useMutation } from "@tanstack/react-query";
import { toast } from "../use-toast";
import { queryClient } from "@/lib/queryClient";

export function useDisconnectNumber({ userId }: { userId: number }) {
  return useMutation({
    mutationFn: async (phoneNumber: string) => {
      const response = await fetch("/api/telephony/disconnect-number", {
        method: "POST",
        body: JSON.stringify({
          phoneNumber,
        }),
      });

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connected-number", userId] });
      toast({
        title: "Успешное отключение",
        description: "Номер успешно отключен",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка отключения",
        description: error.message || "Не удалось отключить номер",
      });
    },
  });
}
