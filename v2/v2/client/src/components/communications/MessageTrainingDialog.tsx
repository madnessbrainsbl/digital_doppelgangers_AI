import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Check, Loader2, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface MessageTrainingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: any | null; // Может быть VkMessage или другой тип
  previousUserMessage: any | null;
  assistantName: string;
  onSuccess?: () => void;
  isGoodResponse?: boolean; // Флаг для определения типа действия
  channelId?: number; // ID канала для VK диалогов
  correctionsData?: {
    // Данные об исправлениях из БД
    corrections: Array<{
      userQuery: string;
      originalResponse: string;
      correctedResponse: string;
      createdAt: string;
    }>;
  };
}

export default function MessageTrainingDialog({
  open,
  onOpenChange,
  message,
  previousUserMessage,
  assistantName,
  onSuccess,
  isGoodResponse = false,
  channelId,
  correctionsData,
}: MessageTrainingDialogProps) {
  const [correctedResponse, setCorrectedResponse] = useState("");
  const { toast } = useToast();

  // Сброс состояния при открытии/закрытии диалога
  useEffect(() => {
    if (open && message) {
      const messageText = message.content || message.text || "";

      // Ищем существующее исправление в БД
      let existingCorrection = null;
      if (correctionsData?.corrections && previousUserMessage) {
        const userQuery = (
          previousUserMessage.content ||
          previousUserMessage.text ||
          ""
        )
          .toLowerCase()
          .trim();

        existingCorrection = correctionsData.corrections.find((correction) => {
          const correctionQuery = correction.userQuery?.toLowerCase().trim();
          const correctionOriginal = correction.originalResponse
            ?.toLowerCase()
            .trim();
          const currentMessage = messageText.toLowerCase().trim();

          return (
            correctionQuery === userQuery &&
            correctionOriginal === currentMessage
          );
        });
      }

      // Если найдено исправление, используем его, иначе оригинальный текст
      if (existingCorrection) {
        setCorrectedResponse(existingCorrection.correctedResponse);
      } else {
        setCorrectedResponse(messageText);
      }
    } else {
      setCorrectedResponse("");
    }
  }, [open, message, correctionsData, previousUserMessage]);

  // Мутация для обновления тренировочных данных
  const saveTrainingMutation = useMutation({
    mutationFn: async (data: {
      query: string;
      originalResponse: string;
      correctedResponse: string;
      conversationId: number | string;
      channelId?: number;
      isGoodResponse?: boolean;
    }) => {
      return await apiRequest({
        method: "POST",
        url: "/api/messages/train",
        body: data,
      });
    },
    onSuccess: () => {
      toast({
        title: isGoodResponse
          ? "Хороший ответ сохранен"
          : "Исправление сохранено",
        description: isGoodResponse
          ? "Ответ отмечен как хороший и будет использован для обучения ассистента"
          : "Исправленный ответ сохранен и будет использован для обучения ассистента",
      });
      onOpenChange(false);
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error("Ошибка при сохранении исправления:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить исправление ответа",
        variant: "destructive",
      });
    },
  });

  const handleSaveCorrection = () => {
    if (
      !message ||
      !previousUserMessage ||
      (!isGoodResponse && !correctedResponse.trim())
    ) {
      toast({
        title: "Ошибка",
        description:
          "Не удалось сохранить исправление: отсутствуют необходимые данные",
        variant: "destructive",
      });
      return;
    }

    const originalResponse = message.content || message.text || "";
    const userQuery =
      previousUserMessage.content || previousUserMessage.text || "";
    const finalResponse = isGoodResponse
      ? originalResponse
      : correctedResponse.trim();

    saveTrainingMutation.mutate({
      query: userQuery,
      originalResponse: originalResponse,
      correctedResponse: finalResponse,
      conversationId: message.conversationId || message.peerId,
      channelId: channelId,
      isGoodResponse: isGoodResponse,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isGoodResponse
              ? "Сохранение хорошего ответа"
              : "Исправление ответа ассистента"}
          </DialogTitle>
          <DialogDescription>
            {isGoodResponse
              ? "Отметить этот ответ как хороший для обучения ассистента"
              : "Отредактируйте ответ, чтобы улучшить точность и качество ответов ассистента в будущем"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {previousUserMessage && (
            <div>
              <p className="text-sm font-medium mb-1 text-neutral-500 dark:text-neutral-400">
                Запрос пользователя:
              </p>
              <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-md">
                <p className="text-sm">
                  {previousUserMessage.content || previousUserMessage.text}
                </p>
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-medium mb-1 text-neutral-500 dark:text-neutral-400">
              {isGoodResponse ? "Хороший ответ" : "Оригинальный ответ"}{" "}
              {assistantName}:
            </p>
            <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-md">
              <p className="text-sm">{message?.content || message?.text}</p>
            </div>
          </div>

          {!isGoodResponse && (
            <div>
              <p className="text-sm font-medium mb-1 text-neutral-500 dark:text-neutral-400">
                Исправленный ответ:
              </p>
              <textarea
                value={correctedResponse}
                onChange={(e) => setCorrectedResponse(e.target.value)}
                className="w-full min-h-[150px] p-3 rounded-md border border-neutral-200 dark:border-neutral-700 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Введите исправленный ответ ассистента..."
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Отмена
          </Button>
          <Button
            onClick={handleSaveCorrection}
            disabled={
              (!isGoodResponse && !correctedResponse.trim()) ||
              saveTrainingMutation.isPending
            }
          >
            {saveTrainingMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            {isGoodResponse ? "Сохранить как хороший" : "Сохранить исправление"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
