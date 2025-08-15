import { useQuery, useInfiniteQuery } from "@tanstack/react-query";

export type CallHistoryItem = {
  id: number;
  userId: number;
  callerNumber: string;
  calleeNumber: string;
  callDuration: number;
  callCost: number;
  recordUrl?: string;
  callStatus: string;
  callType: string;
  callTime: string;
  chatHistory?: any[];
  assistantId?: number;
  createdAt: string;
};

export type CallHistoryResponse = {
  history: CallHistoryItem[];
  hasMore: boolean;
  totalCount: number;
  currentPage: number;
};

export type DateFilterPeriod = "today" | "week" | "month" | "year" | "all";

export function useFetchCallHistory({
  userId,
  limit = 10,
  period = "all",
}: {
  userId: number;
  limit?: number;
  period?: DateFilterPeriod;
}) {
  return useInfiniteQuery<CallHistoryResponse>({
    queryKey: ["call-history", userId, limit, period],
    queryFn: async ({ pageParam = 1 }) => {
      // Получаем токен авторизации из localStorage
      const token = localStorage.getItem("auth_token");

      const res = await fetch(
        `/api/telephony/call-history?page=${pageParam}&limit=${limit}&period=${period}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Ошибка при получении истории звонков");
      }

      const data = await res.json();
      return {
        history: data.history,
        hasMore: data.hasMore,
        totalCount: data.totalCount,
        currentPage: data.currentPage,
      };
    },
    getNextPageParam: (lastPage) => {
      // Если есть еще страницы, возвращаем номер следующей страницы
      if (lastPage.hasMore) {
        return lastPage.currentPage + 1;
      }
      // Если больше нет страниц, возвращаем undefined
      return undefined;
    },
    initialPageParam: 1,
  });
}
