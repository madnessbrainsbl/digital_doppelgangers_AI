import { Settings, MessageSquare, Bot, TestTube2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"

interface AssistantCardProps {
  id: number | string;
  name: string;
  status: "active" | "inactive" | "training";
  channels: string[];
  icon?: string;
  onSettingsClick?: () => void;
  onDialogsClick?: () => void;
  onTestClick?: () => void;
  onDeleteClick?: () => void;
  onClick?: () => void;
  className?: string;
}

export default function AssistantCard({
  id,
  name,
  status,
  channels = [],
  icon = "smart_toy",
  onSettingsClick,
  onDialogsClick,
  onTestClick,
  onDeleteClick,
  onClick,
  className = ""
}: AssistantCardProps) {
  // Конвертация статуса для отображения
  const statusText = status === 'active' ? 'Активен' : status === 'training' ? 'Обучение' : 'Неактивен';

  const statusClassName = status === 'active' 
    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    : status === 'training'
    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" 
    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";

  // Обработчик клика по кнопке "Настроить"
  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSettingsClick) onSettingsClick();
  };

  // Обработчик клика по кнопке "Диалоги"
  const handleDialogsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDialogsClick) onDialogsClick();
  };
  
  // Обработчик клика по кнопке "Тестировать"
  const handleTestClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTestClick) onTestClick();
  };
  
  // Обработчик клика по кнопке "Удалить"
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteClick) onDeleteClick();
  };

  return (
    <Card className={className} onClick={onClick}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bot className="h-5 w-5 mr-2" />
          {name}
        </CardTitle>
        <CardDescription>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${statusClassName}`}>
            {statusText}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Подключенные каналы</h4>
            <div className="flex flex-wrap gap-2">
              {channels.map((channel, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-primary/10 text-primary"
                >
                  {channel}
                </span>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={handleSettingsClick}
        >
          <Settings className="h-4 w-4 mr-2" />
          Настроить
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          className="flex-1"
          onClick={handleDialogsClick}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Диалоги
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Дополнительные действия</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleTestClick}>
              <TestTube2 className="h-4 w-4 mr-2" />
              Тестировать
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleDeleteClick}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}
