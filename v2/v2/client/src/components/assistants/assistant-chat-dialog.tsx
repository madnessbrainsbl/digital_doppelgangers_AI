import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { ASSISTANT_ICONS } from "@/lib/constants";

interface AssistantChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assistant: {
    id: number;
    name: string;
    role: string;
    openaiAssistantId?: string;
  } | null;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AssistantChatDialog({ open, onOpenChange, assistant }: AssistantChatDialogProps) {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Получаем иконку для ассистента
  const getAssistantIcon = () => {
    const foundIcon = ASSISTANT_ICONS.find(icon => icon.id === assistant?.role);
    return foundIcon?.icon || 'smart_toy';
  };

  // Создание треда при открытии диалога
  useEffect(() => {
    if (open && assistant && !threadId) {
      createThread();
    }
    
    // Сбрасываем сообщения при закрытии диалога
    if (!open) {
      setMessages([]);
      setThreadId(null);
    }
  }, [open, assistant]);

  // Автоскролл к последнему сообщению
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Мутация для создания треда
  const createThreadMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest({
        url: "/api/threads",
        method: "POST"
      });
    },
    onSuccess: (data) => {
      setThreadId(data.threadId);
      // Добавляем приветственное сообщение от ассистента
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Здравствуйте! Я ${assistant?.name}, чем я могу вам помочь?`,
        timestamp: new Date()
      }]);
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось создать беседу: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    },
  });

  // Мутация для отправки сообщения
  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, threadId }: { message: string, threadId: string }) => {
      if (!assistant?.openaiAssistantId) {
        throw new Error("Ассистент не найден в OpenAI");
      }
      
      return await apiRequest({
        url: "/api/generate",
        method: "POST",
        body: {
          message,
          threadId,
          assistantId: assistant.openaiAssistantId
        }
      });
    },
    onSuccess: (data) => {
      // Добавляем ответ ассистента
      setMessages(prev => [...prev, {
        id: data.id,
        role: 'assistant',
        content: data.content[0].text.value,
        timestamp: new Date()
      }]);
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось получить ответ: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsProcessing(false);
    },
  });

  // Создание треда
  const createThread = () => {
    createThreadMutation.mutate();
  };

  // Отправка сообщения
  const handleSendMessage = () => {
    if (!messageInput.trim() || !threadId || isProcessing) return;
    
    // Проверяем, есть ли OpenAI ID у ассистента
    if (!assistant?.openaiAssistantId) {
      toast({
        title: "Ошибка",
        description: "Этот ассистент не подключен к OpenAI. Отредактируйте ассистента для синхронизации.",
        variant: "destructive",
      });
      return;
    }
    
    // Добавляем сообщение пользователя
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageInput,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setMessageInput('');
    setIsProcessing(true);
    
    // Отправляем сообщение в OpenAI
    sendMessageMutation.mutate({ 
      message: messageInput, 
      threadId 
    });
  };

  // Обработчик нажатия Enter для отправки сообщения
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Чат с ассистентом {assistant?.name}</DialogTitle>
        </DialogHeader>

        <Card className="flex-1 overflow-hidden">
          <CardContent className="p-4 flex flex-col h-[400px]">
            {/* Область сообщений */}
            <div className="flex-1 overflow-y-auto mb-4 pr-2">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-neutral-500 dark:text-neutral-400">
                    {createThreadMutation.isPending ? (
                      <div className="flex items-center flex-col">
                        <Loader2 className="h-6 w-6 animate-spin mb-2" />
                        <span>Инициализация чата...</span>
                      </div>
                    ) : (
                      <span>Начните диалог с ассистентом</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`flex items-start ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                          <span className="material-icons text-[16px] text-primary">
                            {getAssistantIcon()}
                          </span>
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] px-4 py-2 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground mr-2'
                            : 'bg-neutral-100 dark:bg-neutral-800'
                        }`}
                      >
                        {message.content}
                      </div>
                      {message.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center ml-2">
                          <span className="material-icons text-[16px]">person</span>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Поле ввода сообщения */}
            <div className="flex items-center space-x-2 mt-auto">
              <Input
                placeholder="Напишите сообщение..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isProcessing || !threadId}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || isProcessing || !threadId}
                size="icon"
              >
                {isProcessing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}