import { format } from "date-fns";
import { useMemo } from "react";

type ChatHistoryItem = {
  role: string;
  text: string;
  timeEvent: string;
};

export function CallDialog({
  chatHistory,
}: {
  chatHistory: ChatHistoryItem[];
}) {
  const chatHistoryMemo = useMemo(() => {
    return chatHistory;
  }, [chatHistory]);

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">История диалога</div>
      <div className="bg-white dark:bg-neutral-900 rounded-md border border-neutral-200 dark:border-neutral-700 p-4 max-h-[400px] overflow-y-auto">
        <div className="space-y-3">
          {chatHistoryMemo.map((message, index) => {
            // Форматируем время сообщения, если оно есть
            const messageTime = message.timeEvent
              ? format(new Date(message.timeEvent), "HH:mm:ss")
              : "";

            const isAssistant = message.role === "assistant";

            return (
              <div
                key={index}
                className={`flex ${
                  isAssistant ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`max-w-[80%] ${
                    isAssistant
                      ? "bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30"
                      : "bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30"
                  } rounded-lg px-4 py-2`}
                >
                  <div className="text-xs font-medium text-neutral-500 mb-1">
                    {isAssistant ? "Ассистент" : "Клиент"}
                    {messageTime && (
                      <span className="ml-2 opacity-70">{messageTime}</span>
                    )}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">
                    {message.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
