import { useState } from "react";
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
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ASSISTANT_ICONS } from "@/lib/constants";

interface CreateAssistantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  createdBy: z.number().optional(), // ID пользователя, создавшего ассистента
  // Добавим обязательные поля из схемы
  prompt: z.string().default("Вы полезный ассистент."),
  settings: z.any().default({}),
  model: z.string().default("gpt-4o").optional(),
});

export default function CreateAssistantDialog({ open, onOpenChange }: CreateAssistantDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Создаем форму с использованием useForm
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      role: "general",
      status: "training",
      instructions: "",
      createdBy: 1, // По умолчанию ID пользователя, который сейчас залогинен (здесь захардкожено 1)
      prompt: "Вы полезный ассистент.",
      settings: {},
      model: "gpt-4o",
    },
  });

  // Мутация для создания ассистента
  const createAssistantMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      return await apiRequest({
        url: "/api/assistants", 
        method: "POST", 
        body: values
      });
    },
    onSuccess: () => {
      // Инвалидируем кэш запросов ассистентов и данных использования
      queryClient.invalidateQueries({ queryKey: ["/api/assistants"] });
      
      // Важно: обновляем информацию об использовании тарифа, чтобы UI кнопок обновился мгновенно
      const userData = queryClient.getQueryData<{id: number, name: string, email: string, plan: string}>(['/api/auth/me']);
      if (userData?.id) {
        queryClient.invalidateQueries({ queryKey: ['/api/usage', userData.id] });
      }
      
      toast({
        title: "Ассистент создан",
        description: "Новый ассистент успешно создан",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось создать ассистента: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // Функция для обработки отправки формы
  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    createAssistantMutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Создать нового ассистента</DialogTitle>
          <DialogDescription>
            Создайте нового AI-ассистента с нужными параметрами. Вы сможете добавить файлы в его базу знаний позже.
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

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Создать
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}