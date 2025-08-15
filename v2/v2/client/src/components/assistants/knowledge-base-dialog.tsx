import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Database,
  FileText,
  X,
  Loader2,
  Check,
  Info,
  RefreshCw,
  ExternalLink,
  Upload,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Assistant, KnowledgeItem } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface KnowledgeBaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assistant?: Assistant;
  initialUploadMode?: boolean;
}

export function KnowledgeBaseDialog({
  open,
  onOpenChange,
  assistant,
  initialUploadMode = false,
}: KnowledgeBaseDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(
    initialUploadMode ? "upload" : "existing"
  );

  // При открытии диалога устанавливаем активную вкладку в зависимости от параметра
  useEffect(() => {
    // Устанавливаем активную вкладку только при изменении состояния диалога или параметра initialUploadMode
    if (open && initialUploadMode) {
      setActiveTab("upload");
    } else if (open && !initialUploadMode) {
      setActiveTab("existing");
    }
  }, [open, initialUploadMode]);

  // Запрос для получения всех элементов базы знаний
  const {
    data: knowledgeItems = [],
    isLoading: isLoadingKnowledge,
    refetch: refetchKnowledge,
  } = useQuery<KnowledgeItem[]>({
    queryKey: ["/api/knowledge"],
    enabled: open,
  });

  // Запрос для получения списка файлов, уже прикрепленных к ассистенту
  const {
    data: attachedFiles = [],
    isLoading: isLoadingAttached,
    refetch: refetchAttachedFiles,
  } = useQuery<any[]>({
    queryKey: [`/api/assistants/${assistant?.id}/files`],
    enabled: open && !!assistant?.id,
  });

  // Мемоизируем список ID прикрепленных файлов
  const attachedIds = useMemo(() => {
    if (!attachedFiles || !knowledgeItems || !Array.isArray(knowledgeItems)) {
      return [];
    }

    const ids: number[] = [];
    if (Array.isArray(attachedFiles)) {
      knowledgeItems.forEach((item: KnowledgeItem) => {
        const isAttached = attachedFiles.some(
          (file: any) =>
            file.knowledgeItemId === item.id ||
            (file.openaiFileId && file.openaiFileId === item.openaiFileId)
        );

        if (isAttached) {
          ids.push(item.id);
        }
      });
    }
    return ids;
  }, [attachedFiles, knowledgeItems]);

  // Обновляем useEffect для использования мемоизированного значения
  useEffect(() => {
    if (
      attachedIds.length > 0 &&
      JSON.stringify(attachedIds) !== JSON.stringify(selectedItems)
    ) {
      console.log("Прикреплены следующие ID:", attachedIds);
      setSelectedItems(attachedIds);
    }
  }, [attachedIds]);

  // Мутация для добавления файлов из базы знаний к ассистенту
  const attachKnowledgeMutation = useMutation({
    mutationFn: async (fileIds: number[]) => {
      if (!assistant) return null;

      setIsLoading(true);
      console.log(
        "Прикрепляем файлы с ID:",
        fileIds,
        "к ассистенту:",
        assistant.id
      );
      const response = await fetch(
        `/api/assistants/${assistant.id}/knowledge`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ fileIds }),
        }
      );

      const data = await response.json();
      console.log("Ответ от сервера:", data);
      return { data, ok: response.ok, status: response.status };
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({
        queryKey: [`/api/assistants/${assistant?.id}/files`],
      });

      if (!result || !result.ok) {
        // Если запрос не прошел
        const errorMsg =
          result?.data?.error ||
          result?.data?.message ||
          `Ошибка сервера: ${result?.status || "неизвестная ошибка"}`;
        toast({
          title: "Ошибка при прикреплении",
          description: errorMsg,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const { data } = result;

      if (data && data.error) {
        // Если сервер вернул ошибку
        toast({
          title: "Ошибка при прикреплении",
          description: data.error,
          variant: "destructive",
        });
      } else if (
        data &&
        data.attachedFiles &&
        Array.isArray(data.attachedFiles) &&
        data.attachedFiles.length === 0
      ) {
        // Если ни один файл не был прикреплен
        toast({
          title: "Предупреждение",
          description:
            "Не удалось прикрепить файлы. Возможно, формат файлов не поддерживается.",
          variant: "destructive",
        });
      } else {
        // Успешное прикрепление
        toast({
          title: "Файлы прикреплены",
          description:
            "Выбранные файлы базы знаний успешно прикреплены к ассистенту",
        });

        // Сбрасываем выбранные элементы
        setSelectedItems([]);
      }

      setIsLoading(false);
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast({
        title: "Ошибка",
        description: `Не удалось прикрепить файлы: ${errorMessage}`,
        variant: "destructive",
      });
      setIsLoading(false);
    },
  });

  // Обработчик изменения выбора элемента
  const handleItemSelectionChange = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, id]);
    } else {
      setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  // Обработчик добавления выбранных файлов к ассистенту
  const handleAttachKnowledge = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: "Предупреждение",
        description: "Необходимо выбрать хотя бы один файл для добавления",
        variant: "default",
      });
      return;
    }

    try {
      await attachKnowledgeMutation.mutateAsync(selectedItems);
    } catch (error) {
      console.error("Ошибка при прикреплении файлов:", error);
    }
  };

  // Мутация для загрузки файла
  const uploadFileMutation = useMutation({
    mutationFn: async () => {
      if (!assistant || !selectedFile) return null;

      // Шаг 1: Загружаем файл в базу знаний
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", selectedFile.name);
      formData.append("fileType", selectedFile.name.split(".").pop() || "txt");

      try {
        setIsUploading(true);
        // Сначала загружаем файл в базу знаний
        const knowledgeResponse = await fetch("/api/knowledge", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!knowledgeResponse.ok) {
          const errorText = await knowledgeResponse.text();
          throw new Error(errorText || knowledgeResponse.statusText);
        }

        // Получаем данные о загруженном файле
        const knowledgeData = await knowledgeResponse.json();
        console.log("Файл загружен в базу знаний:", knowledgeData);

        // Шаг 2: Прикрепляем файл к ассистенту
        const attachResponse = await fetch(
          `/api/assistants/${assistant.id}/knowledge`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fileIds: [knowledgeData.id], // Используем ID только что загруженного файла
            }),
            credentials: "include",
          }
        );

        if (!attachResponse.ok) {
          const errorText = await attachResponse.text();
          throw new Error(
            `Файл загружен в базу знаний, но не прикреплен к ассистенту: ${
              errorText || attachResponse.statusText
            }`
          );
        }

        // Получаем результат прикрепления файла к ассистенту
        const attachData = await attachResponse.json();
        console.log("Файл прикреплен к ассистенту:", attachData);

        return {
          knowledgeData,
          attachData,
        };
      } catch (error) {
        console.error("Ошибка загрузки и прикрепления файла:", error);
        throw error;
      }
    },
    onSuccess: (result) => {
      // Обновляем кэш запросов и принудительно запрашиваем данные заново
      queryClient.invalidateQueries({
        queryKey: [`/api/assistants/${assistant?.id}/files`],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge"] });

      // Явно вызываем refetch для обновления данных
      refetchAttachedFiles();
      refetchKnowledge();

      // Проверяем результат загрузки и отображаем соответствующее сообщение
      if (
        result &&
        result.attachData &&
        result.attachData.failedFiles &&
        result.attachData.failedFiles.length > 0
      ) {
        const failReason =
          result.attachData.failedFiles[0].reason || "Неизвестная ошибка";
        toast({
          title: "Файл загружен частично",
          description: `Файл добавлен в базу знаний, но не прикреплен к ассистенту. Причина: ${failReason}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Файл загружен",
          description:
            "Файл успешно добавлен в базу знаний и прикреплен к ассистенту",
        });
      }

      setSelectedFile(null);
      setActiveTab("existing"); // Переключаемся на вкладку существующих файлов
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось загрузить файл: ${
          error instanceof Error ? error.message : String(error)
        }`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  // Обработчик выбора файла
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Функция для загрузки файла
  const handleUpload = () => {
    if (!selectedFile) return;
    uploadFileMutation.mutate();
  };

  // Форматирование размера файла в читаемый вид
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full w-full min-h-[60vh] max-h-[90vh] flex flex-col p-2 sm:max-w-3xl sm:p-0">
        <DialogHeader className="p-3 sm:p-6 pb-2">
          <DialogTitle className="text-lg sm:text-xl flex items-center">
            <Database className="h-5 w-5 mr-2" />
            {assistant
              ? `База знаний: ${assistant.name}`
              : "База знаний ассистента"}
          </DialogTitle>
          <DialogDescription>
            Добавьте файлы из базы знаний к ассистенту для расширения его
            возможностей
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="px-2 sm:px-6 pt-2">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-2 mb-4">
                <TabsTrigger value="existing">Из базы знаний</TabsTrigger>
                <TabsTrigger value="upload">Загрузить файл</TabsTrigger>
              </TabsList>

              <TabsContent value="existing">
                {isLoadingKnowledge || isLoadingAttached ? (
                  <div className="flex items-center justify-center h-60">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : Array.isArray(knowledgeItems) &&
                  knowledgeItems.length > 0 ? (
                  <ScrollArea className="h-[calc(60vh-120px)] sm:h-[calc(100vh-320px)]">
                    <div className="space-y-4">
                      {knowledgeItems.map((item: KnowledgeItem) => {
                        // Проверяем, прикреплен ли уже этот файл к ассистенту
                        const isAlreadyAttached = attachedFiles.some(
                          (file: any) =>
                            file.knowledgeItemId === item.id ||
                            (file.openaiFileId &&
                              file.openaiFileId === item.openaiFileId)
                        );

                        // Пропускаем уже прикрепленные файлы, чтобы скрыть их из списка доступных
                        if (isAlreadyAttached) {
                          return null;
                        }

                        return (
                          <Card key={item.id} className="overflow-hidden">
                            <CardHeader className="p-2 sm:p-4 pb-2 flex flex-row items-start">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  <CardTitle className="text-sm sm:text-base">
                                    {item.title}
                                  </CardTitle>
                                  <Badge variant="outline" className="ml-2">
                                    {item.fileType.toUpperCase()}
                                  </Badge>
                                </div>
                                <CardDescription className="mt-1">
                                  {"Нет описания"}
                                </CardDescription>
                              </div>
                              <div>
                                <Checkbox
                                  id={`item-${item.id}`}
                                  checked={selectedItems.includes(item.id)}
                                  onCheckedChange={(checked) =>
                                    handleItemSelectionChange(
                                      item.id,
                                      checked === true
                                    )
                                  }
                                />
                              </div>
                            </CardHeader>
                            <CardContent className="p-2 sm:p-4 pt-0 pb-2">
                              <div className="text-xs text-muted-foreground">
                                {item.path && (
                                  <div className="mb-1">
                                    Путь:{" "}
                                    <span className="font-mono">
                                      {item.path}
                                    </span>
                                  </div>
                                )}
                                <div className="flex space-x-2">
                                  {item.fileSize && (
                                    <div>
                                      Размер: {formatFileSize(item.fileSize)}
                                    </div>
                                  )}
                                  {item.uploadedAt && (
                                    <div>
                                      Загружен:{" "}
                                      {new Date(
                                        item.uploadedAt
                                      ).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                            {item.openaiFileId && (
                              <CardFooter className="p-2 sm:p-4 pt-2 flex items-center justify-start bg-muted/30">
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <Check className="h-3 w-3 mr-1 text-green-500" />
                                  Синхронизирован с платформой
                                </div>
                              </CardFooter>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex flex-col items-center justify-center h-60 text-center">
                    <Database className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">База знаний пуста</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-md">
                      Добавьте файлы в базу знаний, чтобы использовать их для
                      обучения ассистента
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="upload" className="p-2 sm:p-6">
                <div className="flex flex-col items-center justify-center p-3 sm:p-6 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg mb-4">
                  <Upload className="h-10 w-10 text-neutral-400 mb-4" />
                  <h3 className="text-base sm:text-lg font-medium mb-2">
                    Загрузите новый файл
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground text-center mb-4 max-w-md">
                    Загруженный файл будет добавлен в базу знаний и
                    автоматически прикреплен к ассистенту. Поддерживаются PDF,
                    DOC, DOCX, XLS, XLSX, CSV, TXT и другие текстовые форматы.
                  </p>

                  <div className="grid grid-cols-2 md:flex flex-col w-full max-w-md gap-4">
                    <input
                      type="file"
                      id="fileUpload"
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.ppt,.pptx"
                    />
                    <label
                      htmlFor="fileUpload"
                      className="flex items-center justify-center h-11 px-4 w-full border border-neutral-300 dark:border-neutral-700 rounded-md cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
                    >
                      <span className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 truncate">
                        {selectedFile
                          ? selectedFile.name
                          : "Выберите файл для загрузки..."}
                      </span>
                    </label>

                    <Button
                      onClick={handleUpload}
                      disabled={!selectedFile || isUploading}
                      className="w-full"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Загрузка...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Загрузить и прикрепить
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="text-xs sm:text-sm text-muted-foreground">
                  <p className="flex items-center mb-2">
                    <Info className="h-4 w-4 mr-2" />
                    Файл будет автоматически загружен в базу знаний и прикреплен
                    к ассистенту.
                  </p>
                  <p className="flex items-center">
                    <Info className="h-4 w-4 mr-2" />
                    Максимальный размер файла: 20MB. Для оптимальной работы
                    рекомендуется загружать файлы до 10MB.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogFooter className="p-2 sm:p-4 border-t flex-col sm:flex-row gap-2 sm:gap-0">
          <div className="flex items-center mr-auto">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Файлы из базы знаний будут использоваться ассистентом для
                    ответов на вопросы.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <p className="text-xs text-muted-foreground">
              Выбрано файлов:{" "}
              <span className="font-medium">{selectedItems.length}</span>
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Отмена
          </Button>

          <Button
            onClick={handleAttachKnowledge}
            disabled={selectedItems.length === 0 || isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Прикрепление...
              </>
            ) : (
              <>Прикрепить к ассистенту</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
