import PaymentHistoryInfinite from "../payment-history-infinite";

interface PaymentHistoryProps {
  userId: number;
}

export default function PaymentHistory({ userId }: PaymentHistoryProps) {
  return (
    <PaymentHistoryInfinite
      userId={userId}
      variant="card"
      title="История платежей"
    />
  );
}
