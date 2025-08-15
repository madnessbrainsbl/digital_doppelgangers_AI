import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Assistant } from "@shared/schema";
import { Link } from "wouter";

interface AssistantsListProps {
  assistants: Assistant[];
}

export default function AssistantsList({ assistants }: AssistantsListProps) {
  const getStatusBadgeClass = (status: string) => {
    if (status === "active") {
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    } else if (status === "training") {
      return "bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300";
    } else {
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === "active") return "Активен";
    if (status === "training") return "Обучение";
    if (status === "inactive") return "Неактивен";
    return status;
  };

  const getIconClass = (role: string) => {
    switch (role) {
      case "sales":
        return "bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300";
      case "consultant":
        return "bg-secondary-100 text-secondary-600 dark:bg-secondary-900 dark:text-secondary-300";
      case "support":
        return "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300";
      default:
        return "bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300";
    }
  };

  const getIconName = (role: string) => {
    switch (role) {
      case "sales":
        return "support_agent";
      case "consultant":
        return "school";
      case "support":
        return "support";
      default:
        return "smart_toy";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">Недавние ассистенты</CardTitle>
        <Link href="/assistants">
          <a className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
            Все ассистенты
          </a>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {assistants.map((assistant) => (
            <div key={assistant.id} 
              className="flex items-center p-2 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-lg cursor-pointer">
              <div className={`w-10 h-10 rounded-full ${getIconClass(assistant.role)} flex items-center justify-center`}>
                <span className="material-icons">{getIconName(assistant.role)}</span>
              </div>
              <div className="ml-3 flex-1">
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">{assistant.name}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeClass(assistant.status)}`}>
                    {getStatusLabel(assistant.status)}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {new Date(assistant.updatedAt).toLocaleString('ru-RU', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    day: 'numeric',
                    month: 'numeric'
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button variant="outline" className="w-full">
          <span className="material-icons text-[18px] mr-1">add</span>
          <span>Создать ассистента</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
