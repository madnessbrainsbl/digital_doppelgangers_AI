import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ASSISTANT_ICONS } from "@/lib/constants";

interface EditAssistantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assistant: {
    id: number;
    name: string;
    role: string;
    status: string;
    instructions?: string;
    openaiAssistantId?: string;
  } | null;
}

// Создаем схему для валидации формы
const formSchema = z.object({
  name: z.string().min(2, { message: "Название должно содержать минимум 2 символа" }).max(50, { message: "Название не может превышать 50 символов" }),
  role: z.string().min(1, { message: "Выберите роль ассистента" }),
  status: z.enum(["active", "inactive", "training"], { 
    required_error: "Выберите статус ассистента",
    invalid_type_error: "Статус должен быть одним из: active, inactive, training"
  }),
  instructions: z.string().max(1000, { message: "Инструкции не могут превышать 1000 символов" }).optional(),
});

export default function EditAssistantDialog({ open, onOpenChange, assistant }: EditAssistantDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Создаем форму с использованием useForm
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: assistant?.name || "",
      role: assistant?.role || "general",
      status: (assistant?.status as "active" | "inactive" | "training") || "training",
      instructions: assistant?.instructions || "",
    },
  });

  // Обновляем значения формы при изменении ассистента
  useEffect(() => {
    if (assistant) {
      form.reset({
        name: assistant.name,
        role: assistant.role,
        status: assistant.status as "active" | "inactive" | "training",
        instructions: assistant.instructions || "",
      });
    }
  }, [assistant, form]);

  // Мутация для обновления ассистента
  const updateAssistantMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (!assistant) return null;
      return await apiRequest({
        url: `/api/assistants/${assistant.id}`,
        method: "PUT",
        body: values
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assistants"] });
      toast({
        title: "Ассистент обновлен",
        description: "Данные ассистента успешно обновлены",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось обновить ассистента: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // Мутация для удаления ассистента
  const deleteAssistantMutation = useMutation({
    mutationFn: async () => {
      if (!assistant) return null;
      return await apiRequest({
        url: `/api/assistants/${assistant.id}`,
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assistants"] });
      toast({
        title: "Ассистент удален",
        description: "Ассистент успешно удален",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось удалить ассистента: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsDeleting(false);
    },
  });

  // Функция для обработки отправки формы
  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    updateAssistantMutation.mutate(values);
  }

  // Функция для обработки удаления
  function handleDelete() {
    setIsDeleting(true);
    deleteAssistantMutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Редактировать ассистента</DialogTitle>
          <DialogDescription>
            Измените параметры ассистента или удалите его.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название</FormLabel>
                  <FormControl>
                    <Input placeholder="Название ассистента" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Роль</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите роль ассистента" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ASSISTANT_ICONS.map((icon) => (
                        <SelectItem key={icon.id} value={icon.id}>
                          <div className="flex items-center">
                            <span className="material-icons mr-2">{icon.icon}</span>
                            <span>{icon.id.charAt(0).toUpperCase() + icon.id.slice(1)}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Статус</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите статус ассистента" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Активный</SelectItem>
                      <SelectItem value="inactive">Неактивный</SelectItem>
                      <SelectItem value="training">Обучение</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Инструкции</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Напишите инструкции для ассистента..."
                      className="resize-none h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {assistant?.openaiAssistantId && (
              <div className="pt-2">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  OpenAI ID: {assistant.openaiAssistantId}
                </p>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      type="button" 
                      variant="destructive"
                      disabled={isSubmitting || isDeleting} 
                      className="flex-1 sm:flex-grow-0"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Удалить
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Это действие нельзя отменить. Ассистент будет удален, включая все связанные с ним данные.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Отмена</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Удалить
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting || isDeleting}
                  className="flex-1 sm:flex-grow-0"
                >
                  Отмена
                </Button>
              </div>
              <Button 
                type="submit" 
                disabled={isSubmitting || isDeleting}
                className="flex-1 sm:flex-grow-0"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Сохранить
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}