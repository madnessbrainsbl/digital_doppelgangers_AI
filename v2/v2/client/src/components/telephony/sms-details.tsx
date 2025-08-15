import { format, formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SmsHistoryItem } from "@/hooks/telephony/type";

interface SmsDetailsProps {
  sms: SmsHistoryItem;
  formatCost: (fragments: number) => string;
  renderSmsStatus: (statusId: string, errorMessage?: string) => React.ReactNode;
}

export function SmsDetails({
  sms,
  formatCost,
  renderSmsStatus,
}: SmsDetailsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="text-sm text-neutral-500">Дата отправки</div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-neutral-400" />
            <div>
              {new Date(sms.processedDate).toLocaleDateString("ru-RU")}{" "}
              {new Date(sms.processedDate).toLocaleTimeString("ru-RU")}
            </div>
          </div>
          <div className="text-xs text-neutral-400">
            {formatDistanceToNow(new Date(sms.processedDate), {
              addSuffix: true,
              locale: ru,
            })}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm text-neutral-500">Номер отправителя</div>
          <div>{sms.sourceNumber}</div>
        </div>

        <div className="space-y-2">
          <div className="text-sm text-neutral-500">Номер получателя</div>
          <div>{sms.destinationNumber}</div>
        </div>

        <div className="space-y-2">
          <div className="text-sm text-neutral-500">Стоимость</div>
          <div>{formatCost(sms.fragments)}</div>
        </div>

        <div className="space-y-2">
          <div className="text-sm text-neutral-500">Количество фрагментов</div>
          <div>{sms.fragments}</div>
        </div>

        <div className="space-y-2">
          <div className="text-sm text-neutral-500">Статус</div>
          <div>{renderSmsStatus(sms.statusId, sms.errorMessage)}</div>
        </div>
      </div>

      {sms.text && (
        <div className="space-y-2">
          <div className="text-sm text-neutral-500">Текст сообщения</div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            <p className="text-sm">{sms.text}</p>
          </div>
        </div>
      )}

      {sms.errorMessage && (
        <div className="space-y-2">
          <div className="text-sm text-neutral-500">Сообщение об ошибке</div>
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
            <p className="text-sm text-red-700 dark:text-red-300">
              {sms.errorMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
