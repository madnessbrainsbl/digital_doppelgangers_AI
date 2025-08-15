import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Book, Sparkles, X } from "lucide-react";

interface InstructionsFeatureNotificationProps {
  // Колбэк для открытия инструкций текущей страницы
  onOpenInstructions?: () => void;
  // Название текущей страницы для персонализации сообщения
  pageName?: string;
  // ID пользователя для уникальности уведомления
  userId?: number;
}

export default function InstructionsFeatureNotification({
  onOpenInstructions,
  pageName = "этой страницы",
  userId,
}: InstructionsFeatureNotificationProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Ключ для localStorage с учетом ID пользователя
  const storageKey = `instructionsNotificationShown_${userId || "guest"}`;

  useEffect(() => {
    // Проверяем, показывалось ли уже уведомление для этого пользователя
    const hasShown = localStorage.getItem(storageKey);

    // Если не показывалось и есть userId (пользователь авторизован), показываем
    if (!hasShown && userId) {
      // Добавляем небольшую задержку для лучшего UX
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [storageKey, userId]);

  const handleClose = () => {
    // Закрываем диалог и сохраняем флаг в localStorage
    setIsOpen(false);
    localStorage.setItem(storageKey, "true");
  };

  const handleTryInstructions = () => {
    // Открываем инструкции для текущей страницы
    if (onOpenInstructions) {
      onOpenInstructions();
    }
    handleClose();
  };

  // Если userId нет (пользователь не авторизован), не показываем уведомление
  if (!userId) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br bg-purple-300 hover:bg-purple-400 rounded-lg flex items-center justify-center">
                <Book className="h-8 w-8" />
              </div>
              <div className="absolute -top-2 -right-6">
                <Badge className="bg-yellow-400 text-yellow-900 text-xs px-1 py-0.5 rounded-full">
                  <Sparkles className="h-3 w-3 mr-1" />
                  NEW
                </Badge>
              </div>
            </div>
          </div>
          <DialogTitle className="text-xl font-bold text-center">
            🎉 Новая функция!
          </DialogTitle>
          <DialogDescription className="text-center mt-2">
            Теперь на каждой странице есть{" "}
            <strong>"Книга с инструкциями"</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-3">
              Мы добавили подробные руководства для всех разделов платформы!
            </p>

            <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
              <div className="flex items-center justify-center mb-2">
                <Book className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
                <span className="font-medium text-purple-800 dark:text-purple-300">
                  Что нового?
                </span>
              </div>
              <ul className="text-xs text-purple-700 dark:text-purple-400 space-y-1">
                <li>📊 Подробные инструкции по аналитике</li>
                <li>📡 Руководство по настройке каналов</li>
                <li>📚 Гайд по работе с базой знаний</li>
                <li>💡 Лучшие практики и советы</li>
              </ul>
            </div>

            <p className="mt-3 text-xs">
              Ищите фиолетовую кнопку с иконкой книги рядом с заголовком каждой
              страницы!
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {onOpenInstructions ? (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Понятно
              </Button>
              <Button
                onClick={handleTryInstructions}
                className="flex-1 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
              >
                <Book className="h-4 w-4 mr-2" />
                Открыть инструкции {pageName}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleClose}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
            >
              <Book className="h-4 w-4 mr-2" />
              Понятно
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
