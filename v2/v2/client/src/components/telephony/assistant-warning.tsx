import { AlertCircle } from "lucide-react";

interface AssistantWarningProps {
  message?: string;
}

export function AssistantWarning({
  message = 'У вас пока нет ассистентов. Сначала создайте ассистента в разделе "Ассистенты".',
}: AssistantWarningProps) {
  return (
    <div className="flex items-start space-x-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
      <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-amber-700 dark:text-amber-300">{message}</p>
      </div>
    </div>
  );
}
