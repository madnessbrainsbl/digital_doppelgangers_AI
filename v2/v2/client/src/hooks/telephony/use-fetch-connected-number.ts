import { useQuery } from "@tanstack/react-query";
import { PhoneNumber } from "./type";

export function useFetchConnectedNumber({ userId }: { userId: number }) {
  return useQuery<PhoneNumber[]>({
    queryKey: ["connected-number", userId],
    queryFn: async () => {
      const res = await fetch("/api/telephony/connected-numbers");
      const data = await res.json();
      return data.numbers;
    },
  });
}
