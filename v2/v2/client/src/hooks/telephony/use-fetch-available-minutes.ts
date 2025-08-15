import { useQuery } from "@tanstack/react-query";

export function useFetchAvailableMinutes(phoneNumber?: string) {
  return useQuery({
    queryKey: ["available-minutes", phoneNumber],
    queryFn: async () => {
      if (!phoneNumber) {
        throw new Error("Номер телефона не указан");
      }

      const res = await fetch(`/api/telephony/balance/${phoneNumber}`);

      if (!res.ok) {
        throw new Error("Ошибка при получении информации о минутах");
      }

      const data = await res.json();
      return {
        balance: data.balance,
        availableMinutes: data.availableMinutes,
      };
    },
    enabled: !!phoneNumber,
    refetchInterval: 30000, // Обновляем каждые 30 секунд
  });
}
