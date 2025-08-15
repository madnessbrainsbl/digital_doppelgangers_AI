import { useQuery } from "@tanstack/react-query";
import { PhoneNumber } from "./type";

export function useAvailableNumbers(sms?: boolean) {
  return useQuery<PhoneNumber[]>({
    queryKey: ["available-numbers", sms],
    queryFn: async () => {
      const url = sms
        ? "/api/telephony/available-numbers?sms=true"
        : "/api/telephony/available-numbers";
      const res = await fetch(url);
      const data = await res.json();
      return data.numbers;
    },
  });
}
