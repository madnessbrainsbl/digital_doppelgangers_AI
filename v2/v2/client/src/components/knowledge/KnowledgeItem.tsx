import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { KnowledgeItem as KnowledgeItemType } from "@shared/schema";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface KnowledgeItemProps {
  item: KnowledgeItemType;
}

export default function KnowledgeItem({ item }: KnowledgeItemProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return "picture_as_pdf";
      case "document":
      case "docx":
        return "description";
      case "spreadsheet":
      case "xlsx":
        return "insert_chart";
      case "image":
        return "image";
      default:
        return "insert_drive_file";
    }
  };

  const getIconClass = (type: string) => {
    switch (type) {
      case "pdf":
        return "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300";
      case "document":
      case "docx":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300";
      case "spreadsheet":
      case "xlsx":
        return "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300";
      case "image":
        return "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300";
      default:
        return "bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300";
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/knowledge/${item.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge"] });
      toast({
        title: "Успешно",
        description: "Файл успешно удален",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось удалить файл: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="flex items-center bg-white dark:bg-neutral-800 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:shadow-sm transition-shadow">
      <div className={`w-12 h-12 rounded-md ${getIconClass(item.type)} flex items-center justify-center flex-shrink-0`}>
        <span className="material-icons">{getFileIcon(item.type)}</span>
      </div>

      <div className="ml-4 flex-1 min-w-0">
        <h3 className="text-sm font-medium text-neutral-900 dark:text-white truncate">{item.title}</h3>
        <div className="flex items-center text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          <span>{item.fileSize}</span>
          <span className="mx-2">•</span>
          <span>Добавлен {formatDate(item.createdAt)}</span>
        </div>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие удалит файл "{item.title}" из базы знаний. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteMutation.mutate()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? "Удаление..." : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DropdownMenu>
        <DropdownMenuTrigger className="ml-2 p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700">
          <span className="material-icons text-neutral-500 dark:text-neutral-400">more_vert</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <span className="material-icons mr-2 text-sm">visibility</span>
            <span>Просмотр</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <span className="material-icons mr-2 text-sm">download</span>
            <span>Скачать</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-red-600 focus:text-red-600 dark:text-red-400 focus:dark:text-red-400"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <span className="material-icons mr-2 text-sm">delete</span>
            <span>Удалить</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
