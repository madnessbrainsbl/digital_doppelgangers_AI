import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "../use-toast";

export function useNumbersConnection({
  selectedNumbers,
  userId,
}: {
  selectedNumbers: string;
  userId: number;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/telephony/connect-numbers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumbers: [selectedNumbers],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Не удалось подключить номера");
      }

      return response.json();
    },
    onSuccess: (data) => {
      const successCount = data.results.filter((r: any) => r.success).length;
      const savedCount = data.results.filter(
        (r: any) => r.success && r.saved
      ).length;

      toast({
        title: "Успешное подключение",
        description: `Успешно подключен номер ${selectedNumbers}. Сохранено в базу: ${savedCount}`,
      });

      // Обновляем кэш для списка подключенных номеров
      queryClient.invalidateQueries({ queryKey: ["connected-number", userId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка подключения",
        description: error.message || "Не удалось подключить выбранные номера",
        variant: "destructive",
      });
    },
  });
}
