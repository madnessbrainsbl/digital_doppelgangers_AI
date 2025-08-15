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
import { useToast } from "@/hooks/use-toast";

// Тип свойства параметра
export type ParameterProperty = {
  name: string;
  type: string;
  description: string;
  required: boolean;
};

interface EditParameterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parameter: ParameterProperty | null;
  onSave: (updatedParameter: ParameterProperty) => void;
}

export function EditParameterDialog({
  open,
  onOpenChange,
  parameter,
  onSave,
}: EditParameterDialogProps) {
  const { toast } = useToast();
  const [editedParam, setEditedParam] = useState<ParameterProperty>({
    name: "",
    type: "string",
    description: "",
    required: true,
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Обновляем состояние при изменении параметра
  useEffect(() => {
    if (parameter) {
      setEditedParam({ ...parameter });
      setHasChanges(false);
    }
  }, [parameter]);

  // Проверяем наличие изменений
  useEffect(() => {
    if (!parameter) return;

    const changed =
      editedParam.name !== parameter.name ||
      editedParam.type !== parameter.type ||
      editedParam.description !== parameter.description;

    setHasChanges(changed);
  }, [editedParam, parameter]);

  // Обработчик изменения полей
  const handleFieldChange = (
    field: keyof ParameterProperty,
    value: string | boolean
  ) => {
    setEditedParam((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Сохранение изменений
  const handleSave = () => {
    if (!editedParam.name.trim()) {
      toast({
        title: "Ошибка",
        description: "Имя параметра не может быть пустым",
        variant: "destructive",
      });
      return;
    }

    onSave(editedParam);
    onOpenChange(false);

    toast({
      title: "Параметр обновлен",
      description: "Изменения параметра успешно сохранены",
    });
  };

  // Отмена изменений
  const handleCancel = () => {
    if (parameter) {
      setEditedParam({ ...parameter });
    }
    setHasChanges(false);
    onOpenChange(false);
  };

  if (!parameter) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Редактировать параметр</DialogTitle>
          <DialogDescription>
            Измените свойства параметра функции
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Имя параметра */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Имя параметра</label>
            <Input
              placeholder="username"
              value={editedParam.name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
            />
          </div>

          {/* Тип параметра */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Тип данных</label>
            <select
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={editedParam.type}
              onChange={(e) => handleFieldChange("type", e.target.value)}
            >
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="object">Object</option>
              <option value="array">Array</option>
            </select>
          </div>

          {/* Описание параметра */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Описание</label>
            <Input
              placeholder="Описание параметра"
              value={editedParam.description}
              onChange={(e) => handleFieldChange("description", e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel}>
            Отменить
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            Сохранить изменения
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
