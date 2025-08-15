import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LoaderCircle, Clock, Minus, Plus, Calendar } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Типы для данных
interface Assistant {
  id: number;
  name: string;
  status: string;
}

interface ScheduleSettings {
  enabled: boolean;
  workMode: "24/7" | "schedule";
  startTime: string; // в формате HH:MM
  endTime: string; // в формате HH:MM
  weekdays: string[]; // массив выбранных дней недели ("mon", "tue", ...)
}

interface AssistantChannel {
  id: number;
  assistantId: number;
  channelId: number;
  enabled: boolean;
  autoReply: boolean;
  settings?: {
    responseTimeSeconds?: number;
    schedule?: ScheduleSettings;
    [key: string]: any;
  };
}

interface AssistantSelectorProps {
  channelId: number;
  onSuccess?: () => void;
}

const DAYS_OF_WEEK = [
  { value: "mon", label: "Понедельник" },
  { value: "tue", label: "Вторник" },
  { value: "wed", label: "Среда" },
  { value: "thu", label: "Четверг" },
  { value: "fri", label: "Пятница" },
  { value: "sat", label: "Суббота" },
  { value: "sun", label: "Воскресенье" },
];

const TIME_OPTIONS = Array.from({ length: 24 }).map((_, i) => {
  const hour = i.toString().padStart(2, "0");
  return { value: `${hour}:00`, label: `${hour}:00` };
});

export function AssistantSelector({
  channelId,
  onSuccess,
}: AssistantSelectorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAssistantId, setSelectedAssistantId] = useState<number | null>(
    null
  );
  const [isEnabled, setIsEnabled] = useState(false);
  const [isAutoReply, setIsAutoReply] = useState(false);
  const [responseTime, setResponseTime] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Состояние для расписания
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [workMode, setWorkMode] = useState<"24/7" | "schedule">("24/7");
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("08:00");
  const [selectedDays, setSelectedDays] = useState<string[]>([
    "mon",
    "tue",
    "wed",
    "thu",
    "fri",
  ]);

  // Получаем список всех ассистентов
  const { data: assistants, isLoading: isLoadingAssistants } = useQuery<
    Assistant[]
  >({
    queryKey: ["/api/assistants"],
  });

  // Получаем информацию о текущем ассистенте для канала
  const { data: channelAssistant, isLoading: isLoadingChannelAssistant } =
    useQuery<AssistantChannel | null>({
      queryKey: [`/api/channels/${channelId}/assistant`],
      enabled: !!channelId,
    });

  // При получении данных о текущем ассистенте канала, устанавливаем значения в форму
  useEffect(() => {
    if (channelAssistant) {
      setSelectedAssistantId(channelAssistant.assistantId);
      setIsEnabled(channelAssistant.enabled);
      setIsAutoReply(channelAssistant.autoReply);
      setResponseTime(channelAssistant.settings?.responseTimeSeconds || 5);

      // Загружаем настройки расписания, если они есть
      if (channelAssistant.settings?.schedule) {
        const schedule = channelAssistant.settings.schedule;
        setScheduleEnabled(schedule.enabled);
        setWorkMode(schedule.workMode);
        setStartTime(schedule.startTime);
        setEndTime(schedule.endTime);
        setSelectedDays(schedule.weekdays);
      }
    }
  }, [channelAssistant]);

  // Функция увеличения времени ответа
  const increaseResponseTime = () => {
    if (responseTime < 30) {
      setResponseTime((prev) => prev + 1);
    }
  };

  // Функция уменьшения времени ответа
  const decreaseResponseTime = () => {
    if (responseTime > 0) {
      setResponseTime((prev) => prev - 1);
    }
  };

  // Функция для переключения выбора дня недели
  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // Функция для выбора всех дней недели
  const selectAllDays = () => {
    setSelectedDays(DAYS_OF_WEEK.map((day) => day.value));
  };

  // Функция для выбора только рабочих дней
  const selectWorkDays = () => {
    setSelectedDays(["mon", "tue", "wed", "thu", "fri"]);
  };

  // Функция для очистки выбора дней
  const clearDaySelection = () => {
    setSelectedDays([]);
  };

  // Мутация для создания или обновления связи ассистент-канал
  const createOrUpdateAssistantChannelMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAssistantId) {
        throw new Error("Ассистент не выбран");
      }

      // Проверяем, что выбран хотя бы один день недели, если включено расписание
      if (
        scheduleEnabled &&
        workMode === "schedule" &&
        selectedDays.length === 0
      ) {
        throw new Error(
          "Необходимо выбрать хотя бы один день недели для работы ассистента"
        );
      }

      const payload = {
        assistantId: selectedAssistantId,
        channelId,
        enabled: isEnabled,
        autoReply: isAutoReply,
        settings: {
          ...(channelAssistant?.settings || {}),
          responseTimeSeconds: responseTime,
          schedule: {
            enabled: scheduleEnabled,
            workMode,
            startTime,
            endTime,
            weekdays: selectedDays,
          },
        },
      };

      if (channelAssistant) {
        // Если выбран новый ассистент и он отличается от текущего
        if (channelAssistant.assistantId !== selectedAssistantId) {
          // Сначала удаляем старую связь
          await apiRequest({
            url: `/api/assistants/${channelAssistant.assistantId}/channels/${channelId}`,
            method: "DELETE",
          });

          // Затем создаем новую связь
          return await apiRequest({
            url: `/api/assistants/${selectedAssistantId}/channels`,
            method: "POST",
            body: payload,
          });
        } else {
          // Обновляем существующую связь для того же ассистента
          return await apiRequest({
            url: `/api/assistants/${channelAssistant.assistantId}/channels/${channelId}`,
            method: "PATCH",
            body: payload,
          });
        }
      } else {
        // Создаем новую связь
        return await apiRequest({
          url: `/api/assistants/${selectedAssistantId}/channels`,
          method: "POST",
          body: payload,
        });
      }
    },
    onSuccess: () => {
      // Обновляем данные в кэше
      queryClient.invalidateQueries({
        queryKey: [`/api/channels/${channelId}/assistant`],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/assistants"] });
      queryClient.invalidateQueries({
        queryKey: [`/api/channels/${channelId}/dialogs/assistants`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/channels/${channelId}/avito/dialogs`],
      });

      // Обновляем кеш виджета, чтобы сообщения отправлялись корректно
      queryClient.invalidateQueries({
        queryKey: [`/api/channels/${channelId}/widget/messages`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/channels/${channelId}/widget/unread`],
      });

      // Определяем, был ли это обмен ассистентов
      const isAssistantChange =
        channelAssistant &&
        channelAssistant.assistantId !== selectedAssistantId;

      // Показываем уведомление
      toast({
        title: isAssistantChange
          ? "Ассистент изменён"
          : channelAssistant
          ? "Настройки обновлены"
          : "Ассистент привязан",
        description: isAssistantChange
          ? "Для этого канала назначен новый ассистент"
          : channelAssistant
          ? "Настройки автоматических ответов обновлены"
          : "Ассистент успешно привязан к каналу связи",
      });

      // Вызываем колбэк успеха
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      // Определяем, был ли это обмен ассистентов
      const isAssistantChange =
        channelAssistant &&
        channelAssistant.assistantId !== selectedAssistantId;

      toast({
        title: "Ошибка",
        description: isAssistantChange
          ? `Не удалось заменить ассистента: ${error.message}`
          : `Не удалось ${channelAssistant ? "обновить" : "создать"} связь: ${
              error.message
            }`,
        variant: "destructive",
      });
    },
  });

  // Мутация для удаления связи ассистент-канал
  const removeAssistantChannelMutation = useMutation({
    mutationFn: async () => {
      if (!channelAssistant) {
        throw new Error("Связь не существует");
      }

      return await apiRequest({
        url: `/api/assistants/${channelAssistant.assistantId}/channels/${channelId}`,
        method: "DELETE",
      });
    },
    onSuccess: () => {
      // Обновляем данные в кэше
      queryClient.invalidateQueries({
        queryKey: [`/api/channels/${channelId}/assistant`],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/assistants"] });

      // Обновляем кеш виджета, чтобы сообщения отправлялись корректно
      queryClient.invalidateQueries({
        queryKey: [`/api/channels/${channelId}/widget/messages`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/channels/${channelId}/widget/unread`],
      });

      // Показываем уведомление
      toast({
        title: "Ассистент отвязан",
        description: "Ассистент успешно отвязан от канала связи",
      });

      // Сбрасываем состояние
      setSelectedAssistantId(null);
      setIsEnabled(false);
      setIsAutoReply(false);
      setResponseTime(5);
      setScheduleEnabled(false);
      setWorkMode("24/7");
      setStartTime("18:00");
      setEndTime("08:00");
      setSelectedDays(["mon", "tue", "wed", "thu", "fri"]);

      // Вызываем колбэк успеха
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось удалить связь: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Обработчик сохранения
  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await createOrUpdateAssistantChannelMutation.mutateAsync();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Обработчик удаления
  const handleRemove = async () => {
    setIsSubmitting(true);
    try {
      await removeAssistantChannelMutation.mutateAsync();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingAssistants || isLoadingChannelAssistant) {
    return (
      <div className="flex items-center justify-center p-4">
        <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
        Загрузка...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="assistant-select">Выберите ассистента</Label>
        <Select
          value={selectedAssistantId?.toString() || ""}
          onValueChange={(value) => setSelectedAssistantId(Number(value))}
        >
          <SelectTrigger id="assistant-select" className="w-full mt-1">
            <SelectValue placeholder="Выберите ассистента для автоматических ответов" />
          </SelectTrigger>
          <SelectContent>
            {assistants?.map((assistant) => (
              <SelectItem
                key={assistant.id}
                value={assistant.id.toString()}
                disabled={assistant.status !== "active"}
              >
                {assistant.name}{" "}
                {assistant.status !== "active" && "(неактивен)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="enabled-toggle"
          checked={isEnabled}
          onCheckedChange={setIsEnabled}
          disabled={!selectedAssistantId}
        />
        <Label htmlFor="enabled-toggle">
          Активировать ассистента для этого канала
        </Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="auto-reply-toggle"
          checked={isAutoReply}
          onCheckedChange={setIsAutoReply}
          disabled={!selectedAssistantId || !isEnabled}
        />
        <Label htmlFor="auto-reply-toggle">
          Автоматически отвечать на сообщения
        </Label>
      </div>

      <div className="space-y-2">
        <div className="flex items-center mb-2">
          <Clock className="h-4 w-4 mr-2" />
          <Label>Время задержки ответа (секунды): {responseTime}</Label>
        </div>

        <div className="flex items-center">
          <Button
            variant="outline"
            size="icon"
            type="button"
            onClick={decreaseResponseTime}
            disabled={
              !selectedAssistantId ||
              !isEnabled ||
              !isAutoReply ||
              responseTime <= 0
            }
            className="h-8 w-8"
          >
            <Minus className="h-4 w-4" />
            <span className="sr-only">Уменьшить</span>
          </Button>

          <div className="relative flex-1 mx-4 h-2">
            <div className="absolute inset-0 bg-secondary rounded-full"></div>
            <div
              className="absolute inset-y-0 left-0 bg-primary rounded-full"
              style={{ width: `${(responseTime / 30) * 100}%` }}
            ></div>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={responseTime}
              onChange={(e) => setResponseTime(parseInt(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
              disabled={!selectedAssistantId || !isEnabled || !isAutoReply}
            />
          </div>

          <Button
            variant="outline"
            size="icon"
            type="button"
            onClick={increaseResponseTime}
            disabled={
              !selectedAssistantId ||
              !isEnabled ||
              !isAutoReply ||
              responseTime >= 30
            }
            className="h-8 w-8"
          >
            <Plus className="h-4 w-4" />
            <span className="sr-only">Увеличить</span>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          Время в секундах, через которое ассистент будет отвечать на сообщения.
          Установите 0 для мгновенного ответа.
        </p>
      </div>

      {/* Блок настройки расписания работы */}
      <div className="space-y-2 border rounded-md p-4 mt-4">
        <div className="flex flex-wrap justify-between items-center mb-2">
          <div className="flex items-center mb-2 sm:mb-0">
            <Calendar className="h-4 w-4 mr-2" />
            <Label htmlFor="schedule-toggle" className="font-medium">
              Расписание работы ассистента
            </Label>
          </div>
          <Switch
            id="schedule-toggle"
            checked={scheduleEnabled}
            onCheckedChange={setScheduleEnabled}
            disabled={!selectedAssistantId || !isEnabled || !isAutoReply}
          />
        </div>

        {scheduleEnabled && (
          <div className="space-y-4 pt-2">
            <RadioGroup
              value={workMode}
              onValueChange={(value) =>
                setWorkMode(value as "24/7" | "schedule")
              }
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="24/7" id="mode-24-7" />
                <Label htmlFor="mode-24-7">Круглосуточно</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="schedule" id="mode-schedule" />
                <Label htmlFor="mode-schedule">По расписанию</Label>
              </div>
            </RadioGroup>

            {workMode === "schedule" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-time-select">Начало работы</Label>
                    <Select value={startTime} onValueChange={setStartTime}>
                      <SelectTrigger id="start-time-select">
                        <SelectValue placeholder="Выберите время" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((time) => (
                          <SelectItem key={time.value} value={time.value}>
                            {time.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="end-time-select">Окончание работы</Label>
                    <Select value={endTime} onValueChange={setEndTime}>
                      <SelectTrigger id="end-time-select">
                        <SelectValue placeholder="Выберите время" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((time) => (
                          <SelectItem key={time.value} value={time.value}>
                            {time.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator className="my-4" />

                <div>
                  <div className="flex flex-col sm:flex-row sm:justify-between mb-2 gap-2">
                    <Label className="mb-2 sm:mb-0">Дни недели</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectWorkDays}
                        type="button"
                      >
                        Пн-Пт
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAllDays}
                        type="button"
                      >
                        Все
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearDaySelection}
                        type="button"
                      >
                        Очистить
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <div
                        key={day.value}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`day-${day.value}`}
                          checked={selectedDays.includes(day.value)}
                          onCheckedChange={() => toggleDay(day.value)}
                        />
                        <Label htmlFor={`day-${day.value}`} className="text-sm">
                          {day.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="pt-2">
              <p className="text-xs text-muted-foreground">
                Настройка периода времени, когда ассистент будет отвечать на
                сообщения.
                {workMode === "schedule" &&
                  startTime &&
                  endTime &&
                  selectedDays.length > 0 && (
                    <>
                      <br />
                      Ассистент будет работать{" "}
                      {selectedDays.length === 7
                        ? "каждый день"
                        : selectedDays.length === 5 &&
                          selectedDays.includes("mon") &&
                          selectedDays.includes("fri")
                        ? "в будние дни (пн-пт)"
                        : `в выбранные дни недели`}{" "}
                      с {startTime} до {endTime}.
                    </>
                  )}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-4">
        {channelAssistant && (
          <Button
            variant="outline"
            onClick={handleRemove}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting && (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            )}
            Отвязать ассистента
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={!selectedAssistantId || isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting && (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          )}
          {channelAssistant ? "Обновить настройки" : "Привязать ассистента"}
        </Button>
      </div>
    </div>
  );
}
