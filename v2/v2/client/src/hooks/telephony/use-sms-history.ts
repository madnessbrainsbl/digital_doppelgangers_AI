import { useInfiniteQuery } from "@tanstack/react-query";
import { SmsHistoryFilters, SmsHistoryResponse } from "./type";

export function useSmsHistory({
  userId,
  phoneNumber,
  filters = {},
}: {
  userId: number;
  phoneNumber?: string;
  filters?: SmsHistoryFilters;
}) {
  return useInfiniteQuery({
    queryKey: ["sms-history", userId, phoneNumber, filters],
    queryFn: async ({ pageParam = 0 }) => {
      const token = localStorage.getItem("auth_token");

      const params = new URLSearchParams({
        count: "20", // Загружаем по 20 записей за раз
        offset: pageParam.toString(),
      });

      // Добавляем фильтры если они заданы
      if (filters.direction && filters.direction !== "ALL") {
        params.append("direction", filters.direction);
      }

      // Всегда фильтруем по выбранному номеру как source_number для исходящих
      // и как destination_number для входящих (для получения всех SMS связанных с номером)
      if (phoneNumber) {
        // Получаем SMS где выбранный номер участвует как отправитель или получатель
        params.append("source_number", phoneNumber);
      }

      if (filters.destinationNumber) {
        params.append("destination_number", filters.destinationNumber);
      }

      if (filters.fromDate) {
        const formattedFromDate = formatDateForAPI(filters.fromDate);
        params.append("from_date", formattedFromDate);
      }

      if (filters.toDate) {
        const formattedToDate = formatDateForAPI(filters.toDate);
        params.append("to_date", formattedToDate);
      }

      const response = await fetch(`/api/telephony/sms-history?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Ошибка при загрузке истории SMS");
      }

      const data: SmsHistoryResponse = await response.json();

      return {
        history: data.result || [],
        totalCount: data.total_count || 0,
        nextOffset: data.result?.length === 20 ? pageParam + 20 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialPageParam: 0,
    enabled: !!userId && !!phoneNumber, // Запрос выполняется только если указан номер
  });
}

// Функция для форматирования даты в формат API (yyyy-MM-dd HH:mm:ss для Voximplant в UTC)
function formatDateForAPI(date: Date): string {
  // Voximplant ожидает даты в формате yyyy-MM-dd HH:mm:ss в UTC
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
