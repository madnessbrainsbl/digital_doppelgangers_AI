import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Code, Copy, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WebWidgetCodeProps {
  channelId: number;
}

export function WebWidgetCode({ channelId }: WebWidgetCodeProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [scriptCode, setScriptCode] = useState<string>("");

  // Запрос для получения кода виджета
  const { data, isLoading, error } = useQuery<{
    success: boolean;
    code: string;
  }>({
    queryKey: [`/api/channels/${channelId}/widget-code`],
    enabled: !!channelId,
  });

  // Устанавливаем код виджета при получении данных
  useEffect(() => {
    if (data && data.success && data.code) {
      setScriptCode(data.code);
    }
  }, [data]);

  // Обработчик копирования кода
  const handleCopyScript = () => {
    if (scriptCode) {
      navigator.clipboard
        .writeText(scriptCode)
        .then(() => {
          setCopied(true);
          toast({
            title: "Код скопирован",
            description: "Код виджета скопирован в буфер обмена",
          });

          // Сбрасываем состояние через 2 секунды
          setTimeout(() => {
            setCopied(false);
          }, 2000);
        })
        .catch((err) => {
          console.error("Ошибка при копировании:", err);
          toast({
            title: "Ошибка копирования",
            description:
              "Не удалось скопировать код. Попробуйте скопировать вручную.",
            variant: "destructive",
          });
        });
    }
  };

  // Если данные загружаются
  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="animate-pulse h-32 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
      </div>
    );
  }

  // Если произошла ошибка при загрузке
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Не удалось загрузить код виджета. Пожалуйста, попробуйте обновить
          страницу.
        </AlertDescription>
      </Alert>
    );
  }

  // Если код отсутствует
  if (!scriptCode) {
    return (
      <Alert>
        <AlertDescription>
          Код виджета не найден. Попробуйте обновить настройки канала.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium">Код для вставки:</div>
          <Button
            variant="secondary"
            size="sm"
            className={`transition-colors hover:bg-gray-300 dark:hover:bg-gray-700 ${
              copied ? "text-green-600 dark:text-green-500" : ""
            }`}
            onClick={handleCopyScript}
          >
            {copied ? (
              <Check className="h-4 w-4 mr-1" />
            ) : (
              <Copy className="h-4 w-4 mr-1" />
            )}
          </Button>
        </div>
        <div className="bg-muted p-4 rounded-md">
          <pre className="text-xs sm:text-sm overflow-x-auto whitespace-pre-wrap break-all max-h-60 overflow-y-auto">
            {scriptCode}
          </pre>
        </div>
      </div>

      <Alert>
        <Code className="h-4 w-4 mr-2 flex-shrink-0" />
        <AlertDescription className="text-xs sm:text-sm">
          Разместите этот код на вашем сайте перед закрывающим тегом
          &lt;/body&gt; и перезапустите сайт. После этого виджет будет
          автоматически отображаться на вашем сайте.
        </AlertDescription>
      </Alert>
    </div>
  );
}

export default WebWidgetCode;
