import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, Globe, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WidgetConnectionCheckerProps {
  channelId: number;
}

export function WidgetConnectionChecker({
  channelId,
}: WidgetConnectionCheckerProps) {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  // Валидация URL
  const isValidUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch {
      return false;
    }
  };

  // Нормализация URL (добавление https:// если отсутствует)
  const normalizeUrl = (url: string): string => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return "";

    // Если уже есть протокол, оставляем как есть
    if (trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")) {
      return trimmedUrl;
    }

    // Добавляем https:// по умолчанию
    return `https://${trimmedUrl}`;
  };

  // Обработчик проверки подключения
  const handleCheckConnection = () => {
    const normalizedUrl = normalizeUrl(websiteUrl);

    if (!normalizedUrl) {
      toast({
        title: "Ошибка",
        description: "Введите адрес сайта для проверки",
        variant: "destructive",
      });
      return;
    }

    if (!isValidUrl(normalizedUrl)) {
      toast({
        title: "Ошибка",
        description:
          "Введите корректный URL сайта (например: https://example.com)",
        variant: "destructive",
      });
      return;
    }

    setIsChecking(true);

    try {
      console.log(normalizedUrl);
      // Создаем URL с параметром chat-widget
      const urlObj = new URL(normalizedUrl);
      urlObj.searchParams.set("chat-widget", channelId.toString());
      const checkUrl = urlObj.toString();

      // Открываем сайт в новой вкладке
      window.open(checkUrl, "_blank", "noopener,noreferrer");

      toast({
        title: "Проверка запущена",
        description: `Сайт открыт в новой вкладке для проверки подключения виджета`,
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось открыть сайт для проверки",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setIsChecking(false), 1000);
    }
  };

  // Обработчик нажатия Enter в поле ввода
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCheckConnection();
    }
  };

  return (
    <Card className="border-2 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
          <Search className="h-5 w-5" />
          Блок проверки подключения чата
        </CardTitle>
        <CardDescription className="text-green-600 dark:text-green-400">
          Проверьте, правильно ли подключен виджет чата на вашем сайте
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type="url"
              placeholder="Введите адрес сайта (например: https://example.com)"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              className="bg-white dark:bg-gray-900"
            />
          </div>
          <Button
            onClick={handleCheckConnection}
            disabled={isChecking || !websiteUrl.trim()}
            className="bg-green-600 hover:bg-green-700 text-white min-w-[100px]"
          >
            {isChecking ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Проверка...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                Проверить
              </>
            )}
          </Button>
        </div>

        <Alert className="border-green-300 bg-green-100 dark:border-green-700 dark:bg-green-900">
          <Globe className="h-4 w-4" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>Как это работает:</strong>
            <ul className="mt-2 ml-4 list-disc space-y-1 text-sm">
              <li>Введите адрес сайта, где установлен виджет</li>
              <li>Нажмите "Проверить" - сайт откроется в новой вкладке</li>
              <li>
                Виджет автоматически покажет уведомление о статусе подключения
              </li>
              <li>Зеленое уведомление = виджет подключен правильно</li>
              <li>
                Красное уведомление = виджет подключен неправильно или
                отсутствует
              </li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
