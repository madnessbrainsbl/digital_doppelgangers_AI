import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

// Типы для FunctionToggle компонента
interface FunctionToggleProps {
  functionId: number;
  channelId: number;
  isActive: boolean;
  functionName: string;
  disabled?: boolean;
  loading?: boolean; // Новое свойство для индикации загрузки
  onToggle: (params: {
    functionId: number;
    channelId: number;
    enabled: boolean;
    functionName: string;
  }) => void;
}

/**
 * Компонент для отображения переключателя, который решает проблему с переключением
 * компонентов, изначально находящихся в положении ON
 */
export function FunctionToggle({
  functionId,
  channelId,
  isActive,
  functionName,
  disabled = false,
  loading = false,
  onToggle,
}: FunctionToggleProps) {
  // Локальное состояние для немедленного обновления UI
  const [checked, setChecked] = useState(isActive);

  // Обновляем локальное состояние при изменении isActive из пропсов
  useEffect(() => {
    setChecked(isActive);
  }, [isActive, functionName]);

  // Обработчик изменения состояния переключателя
  const onCheckedChange = (isChecked: boolean) => {
    // Обновляем локальное состояние для мгновенной обратной связи
    setChecked(isChecked);

    // Вызываем callback из родительского компонента
    onToggle({
      functionId,
      channelId,
      enabled: isChecked,
      functionName,
    });
  };

  return (
    <div className="flex items-center">
      {loading && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
      )}
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled || loading}
      />
    </div>
  );
}
