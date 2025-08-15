import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface DeleteAssistantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assistantId?: number;
  assistantName?: string;
}

export function DeleteAssistantDialog({ 
  open, 
  onOpenChange,
  assistantId,
  assistantName 
}: DeleteAssistantDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteAssistantMutation = useMutation({
    mutationFn: async () => {
      if (!assistantId) return null;
      
      try {
        setIsDeleting(true);
        return await apiRequest({
          url: `/api/assistants/${assistantId}`,
          method: "DELETE"
        });
      } catch (error) {
        console.error("Ошибка при удалении ассистента:", error);
        throw new Error(
          error instanceof Error 
            ? error.message 
            : "Неизвестная ошибка при удалении ассистента"
        );
      }
    },
    onSuccess: () => {
      // Инвалидируем кэш запросов ассистентов
      queryClient.invalidateQueries({ queryKey: ["/api/assistants"] });
      
      // Важно: обновляем информацию об использовании тарифа, чтобы UI кнопок обновился мгновенно
      const userData = queryClient.getQueryData<{id: number, name: string, email: string, plan: string}>(['/api/auth/me']);
      if (userData?.id) {
        queryClient.invalidateQueries({ queryKey: ['/api/usage', userData.id] });
      }
      
      // Закрываем диалог
      onOpenChange(false);
      
      // Уведомляем пользователя
      toast({
        title: "Ассистент удален",
        description: `Ассистент "${assistantName}" успешно удален`,
      });
    },
    onError: (error) => {
      console.error("Ошибка при удалении ассистента:", error);
      toast({
        title: "Ошибка",
        description: `Не удалось удалить ассистента: ${error instanceof Error ? error.message : "Неизвестная ошибка"}`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsDeleting(false);
    },
  });

  const handleDelete = () => {
    deleteAssistantMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-destructive">
            <Trash2 className="h-5 w-5 mr-2" />
            Удаление ассистента
          </DialogTitle>
          <DialogDescription>
            Вы уверены, что хотите удалить ассистента "{assistantName}"? Это действие нельзя отменить.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            При удалении ассистента будут удалены все его настройки, файлы и данные из OpenAI. 
            Восстановление данных будет невозможно.
          </p>
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Отмена
          </Button>
          
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Удаление...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Удалить ассистента
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}