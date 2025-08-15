import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Clock } from "lucide-react";

interface TariffMinutesWarningProps {
  availableMinutes: number;
}

export function TariffMinutesWarning({
  availableMinutes,
}: TariffMinutesWarningProps) {
  // Показываем предупреждение если минуты закончились
  if (availableMinutes > 0) {
    return null;
  }

  return (
    <Alert className="mb-4 border-orange-200 bg-orange-50 text-orange-800">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        Минуты тарифного плана закончились
      </AlertTitle>
      <AlertDescription>
        Бесплатные минуты вашего тарифного плана исчерпаны. За следующие звонки
        будут списываться средства с баланса по тарифу{" "}
        <span className="font-semibold">5 ₽ за минуту</span>.
      </AlertDescription>
    </Alert>
  );
}
