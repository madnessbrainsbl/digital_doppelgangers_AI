import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  EditParameterDialog,
  type ParameterProperty,
} from "./EditParameterDialog";
import { PenBox, Trash2 } from "lucide-react";

// Схема параметров функции (JSONSchema)
const parametersSchema = z.object({
  type: z.string().default("object"),
  properties: z.record(z.any()).default({}),
  required: z.array(z.string()).default([]),
});

// Основная схема формы
const formSchema = z.object({
  name: z.string().min(1, "Название функции обязательно"),
  description: z.string().optional(),
  parameters: parametersSchema,
});

// Тип формы
type FormValues = z.infer<typeof formSchema>;

interface OpenAiFunction {
  id: number;
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
  channelId?: number | null;
  createdAt?: string;
  createdBy: number;
}

interface EditOpenAiFunctionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  func: OpenAiFunction;
  editFunctionSuccess: boolean;
}

export function EditOpenAiFunctionDialog({
  open,
  onOpenChange,
  func,
  editFunctionSuccess,
}: EditOpenAiFunctionDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [parameters, setParameters] = useState<ParameterProperty[]>([]);
  const [newParam, setNewParam] = useState<ParameterProperty>({
    name: "",
    type: "string",
    description: "",
    required: true, // Всегда true как в create-dialog
  });

  // Состояние для диалога редактирования
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingParameter, setEditingParameter] =
    useState<ParameterProperty | null>(null);

  // Форма с валидацией
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: func.name,
      description: func.description,
      parameters: func.parameters || {
        type: "object",
        properties: {},
        required: [],
      },
    },
  });

  // Инициализация параметров из данных функции
  useEffect(() => {
    if (func && func.parameters && func.parameters.properties) {
      const params: ParameterProperty[] = [];

      Object.entries(func.parameters.properties).forEach(([key, value]) => {
        params.push({
          name: key,
          type: value.type || "string",
          description: value.description || "",
          required: true, // Всегда true для консистентности
        });
      });

      setParameters(params);

      // Обновляем форму
      form.reset({
        name: func.name,
        description: func.description,
        parameters: func.parameters,
      });
    }
  }, [func, form]);

  // Добавление нового параметра
  const addParameter = () => {
    if (!newParam.name.trim()) {
      toast({
        title: "Ошибка",
        description: "Имя параметра не может быть пустым",
        variant: "destructive",
      });
      return;
    }

    // Добавляем параметр в список
    setParameters([...parameters, { ...newParam }]);

    // Обновляем JSONSchema параметров
    const updatedProperties = { ...form.getValues().parameters.properties };
    updatedProperties[newParam.name] = {
      type: newParam.type,
      description: newParam.description,
    };

    // Обновляем список обязательных параметров (все параметры обязательные)
    let updatedRequired = [...form.getValues().parameters.required];
    if (newParam.required) {
      updatedRequired.push(newParam.name);
    }

    form.setValue("parameters", {
      type: "object",
      properties: updatedProperties,
      required: updatedRequired,
    });

    // Сбрасываем форму нового параметра
    setNewParam({
      name: "",
      type: "string",
      description: "",
      required: true, // Всегда true
    });
  };

  // Удаление параметра
  const removeParameter = (paramName: string) => {
    // Удаляем из списка
    setParameters(parameters.filter((p) => p.name !== paramName));

    // Обновляем JSONSchema
    const updatedProperties = { ...form.getValues().parameters.properties };
    delete updatedProperties[paramName];

    // Удаляем из списка обязательных
    const updatedRequired = form
      .getValues()
      .parameters.required.filter((name) => name !== paramName);

    form.setValue("parameters", {
      type: "object",
      properties: updatedProperties,
      required: updatedRequired,
    });
  };

  // Редактирование параметра
  const editParameter = (param: ParameterProperty) => {
    setEditingParameter(param);
    setEditDialogOpen(true);
  };

  // Сохранение изменений параметра
  const handleParameterSave = (updatedParameter: ParameterProperty) => {
    if (!editingParameter) return;

    const oldName = editingParameter.name;
    const newName = updatedParameter.name;

    // Обновляем в списке параметров
    setParameters(
      parameters.map((p) => (p.name === oldName ? updatedParameter : p))
    );

    // Обновляем JSONSchema
    const updatedProperties = { ...form.getValues().parameters.properties };
    const updatedRequired = [...form.getValues().parameters.required];

    // Если имя изменилось, удаляем старое и добавляем новое
    if (oldName !== newName) {
      delete updatedProperties[oldName];

      // Обновляем список обязательных параметров
      const oldRequiredIndex = updatedRequired.indexOf(oldName);
      if (oldRequiredIndex !== -1) {
        updatedRequired[oldRequiredIndex] = newName;
      }
    }

    // Обновляем или добавляем новые данные
    updatedProperties[newName] = {
      type: updatedParameter.type,
      description: updatedParameter.description,
    };

    // Убеждаемся, что параметр в списке обязательных (так как все параметры обязательные)
    if (!updatedRequired.includes(newName)) {
      updatedRequired.push(newName);
    }

    form.setValue("parameters", {
      type: "object",
      properties: updatedProperties,
      required: updatedRequired,
    });

    setEditingParameter(null);
  };

  // Отправка формы
  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      // Подготавливаем данные для API
      const functionData = {
        name: data.name,
        description: data.description || "",
        parameters: data.parameters,
        // Сохраняем channelId, если он был задан
        channelId: func.channelId,
      };

      const response = await fetch(`/api/openai-functions/${func.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(functionData),
      });

      if (response.ok) {
        // Обновляем список функций
        queryClient.invalidateQueries({ queryKey: ["/api/openai-functions"] });

        toast({
          title: "Функция обновлена",
          description: "OpenAI функция успешно обновлена",
        });

        onOpenChange(false);
      } else {
        const error = await response.json();
        throw new Error(error.message || "Ошибка при обновлении функции");
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description:
          error instanceof Error
            ? error.message
            : "Не удалось обновить OpenAI функцию",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Сброс состояния при закрытии диалога
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setEditDialogOpen(false);
      setEditingParameter(null);
    }
    onOpenChange(open);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать OpenAI функцию</DialogTitle>
            <DialogDescription>
              Измените настройки функции для передачи структурированных данных
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название функции</FormLabel>
                    <FormControl>
                      <Input placeholder="get_user_data" {...field} />
                    </FormControl>
                    <FormDescription>
                      Название функции, которое будет использоваться ассистентом
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Описание</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Получает данные о пользователе для отправки в канал"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Описание функции для модели OpenAI
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Параметры функции */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Параметры функции</h3>
                </div>

                {/* Форма добавления параметра */}
                <div className="border rounded-md p-4 space-y-4">
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                    <div className="col-span-2">
                      <label className="text-xs">Имя параметра</label>
                      <Input
                        size={16}
                        placeholder="username"
                        value={newParam.name}
                        onChange={(e) =>
                          setNewParam({ ...newParam, name: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs">Тип</label>
                      <select
                        className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                        value={newParam.type}
                        onChange={(e) =>
                          setNewParam({ ...newParam, type: e.target.value })
                        }
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="object">Object</option>
                        <option value="array">Array</option>
                      </select>
                    </div>
                    <div className="col-span-2 flex items-end space-x-2">
                      <div className="flex-1">
                        <label className="text-xs">Описание</label>
                        <Input
                          size={16}
                          placeholder="Имя пользователя"
                          value={newParam.description}
                          onChange={(e) =>
                            setNewParam({
                              ...newParam,
                              description: e.target.value,
                            })
                          }
                        />
                      </div>
                      {/* Убираем чекбокс обязательности - все параметры всегда обязательные */}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      onClick={addParameter}
                      disabled={isLoading || !editFunctionSuccess}
                    >
                      Добавить параметр
                    </Button>
                  </div>
                </div>

                {/* Список параметров */}
                {parameters.length > 0 ? (
                  <div className="border rounded-md divide-y">
                    {parameters.map((param, index) => (
                      <div
                        key={index}
                        className="p-3 flex justify-between items-center"
                      >
                        <div>
                          <div className="font-medium text-sm">
                            {param.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {param.type}
                            {param.required && (
                              <span className="text-destructive">*</span>
                            )}
                            {param.description && ` - ${param.description}`}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() => editParameter(param)}
                            disabled={isLoading || !editFunctionSuccess}
                          >
                            <PenBox color={"#22c55e"} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() => removeParameter(param.name)}
                            disabled={isLoading || !editFunctionSuccess}
                          >
                            <Trash2 color="red" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border rounded-md bg-muted/10">
                    <p className="text-sm text-muted-foreground">
                      Пока не добавлено ни одного параметра
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                {!editFunctionSuccess && (
                  <p className="text-destructive text-sm">
                    Нельзя редактировать функцию, пока она подключена к
                    ассистенту
                  </p>
                )}
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => handleOpenChange(false)}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !editFunctionSuccess}
                >
                  {isLoading ? "Сохранение..." : "Сохранить изменения"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования параметра */}
      <EditParameterDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        parameter={editingParameter}
        onSave={handleParameterSave}
      />
    </>
  );
}
