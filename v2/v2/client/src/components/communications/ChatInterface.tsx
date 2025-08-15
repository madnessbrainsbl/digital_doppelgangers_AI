import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { Edit, MoreVertical, Copy, ThumbsUp, ThumbsDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Message } from "@/types/messages";

interface ChatInterfaceProps {
  conversationId: number;
  conversationName: string;
  channelType: string;
  messages: Message[];
  onSendMessage: (content: string) => void;
  onEditMessage?: (message: Message) => void;
}

export default function ChatInterface({
  conversationId,
  conversationName,
  channelType,
  messages,
  onSendMessage,
  onEditMessage,
}: ChatInterfaceProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (message.trim() === "") return;
    onSendMessage(message);
    setMessage("");
    setIsExpanded(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Копирование сообщения в буфер обмена
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Скопировано",
          description: "Текст скопирован в буфер обмена",
        });
      },
      (err) => {
        console.error("Не удалось скопировать текст: ", err);
        toast({
          title: "Ошибка",
          description: "Не удалось скопировать текст",
          variant: "destructive",
        });
      }
    );
  };

  // Обработка исправления ответа
  const handleEdit = (msg: Message) => {
    if (onEditMessage) {
      const updatedMsg = {
        ...msg,
        conversationId: conversationId
      };
      onEditMessage(updatedMsg);
    } else {
      toast({
        title: "Функция недоступна",
        description: "Функция редактирования ответов в разработке",
      });
    }
  };

  // Обработка оценки ответа
  const handleFeedback = (msgId: number, isPositive: boolean) => {
    toast({
      title: isPositive ? "Положительная оценка" : "Отрицательная оценка",
      description: "Спасибо за вашу оценку! Она поможет улучшить качество ответов.",
    });
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "telegram":
        return "send";
      case "whatsapp":
        return "whatsapp";
      case "web":
        return "language";
      case "email":
        return "email";
      default:
        return "chat";
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <div className="p-3 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 flex items-center">
        <div className="flex items-center flex-1">
          <Avatar className="h-10 w-10 bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300">
            <AvatarFallback>
              <span className="material-icons">{getChannelIcon(channelType)}</span>
            </AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="text-sm font-medium text-neutral-900 dark:text-white">{conversationName}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {channelType === "telegram" ? "Telegram" : 
              channelType === "whatsapp" ? "WhatsApp" : 
              channelType === "web" ? "Веб-чат" : "Чат"}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon">
            <span className="material-icons">search</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => copyToClipboard(messages.map(m => `${m.sender === 'user' ? 'Пользователь' : 'Ассистент'}: ${m.content}`).join('\n\n'))}>
                <Copy className="h-4 w-4 mr-2" />
                <span>Копировать переписку</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span className="material-icons text-sm mr-2">history</span>
                <span>История диалога</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span className="material-icons text-sm mr-2">archive</span>
                <span>Архивировать</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender !== 'user' && (
                <Avatar className="h-8 w-8 mr-2">
                  {msg.sender === 'assistant' ? (
                    <AvatarFallback className="bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300">
                      <span className="material-icons text-sm">smart_toy</span>
                    </AvatarFallback>
                  ) : (
                    <AvatarFallback className="bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                      <span className="material-icons text-sm">info</span>
                    </AvatarFallback>
                  )}
                </Avatar>
              )}
              <div 
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  msg.sender === 'user' 
                    ? 'bg-primary-500 text-white ml-2'
                    : msg.sender === 'assistant'
                      ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                <div className="flex items-center justify-between mt-1">
                  <div className={`text-xs ${
                    msg.sender === 'user' 
                      ? 'text-primary-100' 
                      : 'text-neutral-500 dark:text-neutral-400'
                  }`}>
                    {formatTimestamp(msg.timestamp)}
                  </div>
                  
                  {msg.sender === 'assistant' && (
                    <div className="flex items-center space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={() => handleFeedback(msg.id, true)}
                      >
                        <ThumbsUp className="h-3 w-3 text-neutral-500 hover:text-green-500" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={() => handleFeedback(msg.id, false)}
                      >
                        <ThumbsDown className="h-3 w-3 text-neutral-500 hover:text-red-500" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={() => handleEdit(msg)}
                      >
                        <Edit className="h-3 w-3 text-neutral-500 hover:text-primary-500" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
        {isExpanded ? (
          <div className="space-y-2">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Введите сообщение..."
              className="min-h-[80px] resize-none"
              autoFocus
            />
            <div className="flex justify-between">
              <div className="flex space-x-1">
                <Button variant="ghost" size="icon">
                  <span className="material-icons">attach_file</span>
                </Button>
                <Button variant="ghost" size="icon">
                  <span className="material-icons">sentiment_satisfied</span>
                </Button>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsExpanded(false)}
                >
                  Отмена
                </Button>
                <Button 
                  onClick={handleSendMessage}
                  disabled={message.trim() === ""}
                >
                  Отправить
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon">
              <span className="material-icons">attach_file</span>
            </Button>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              onKeyDown={handleKeyPress}
              placeholder="Введите сообщение..."
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={message.trim() === ""}
            >
              <span className="material-icons">send</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
