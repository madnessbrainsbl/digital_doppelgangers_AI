import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Trash2, AlertCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatFileSize } from "@/lib/constants";
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

interface AssistantFilesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assistant: {
    id: number;
    name: string;
  } | null;
}

interface AssistantFile {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  openaiFileId: string;
  uploadedAt: string;
}

export default function AssistantFilesDialog({
  open,
  onOpenChange,
  assistant,
}: AssistantFilesDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Загрузка списка файлов ассистента
  const {
    data: files = [],
    isLoading,
    error,
    refetch,
  } = useQuery<AssistantFile[]>({
    queryKey: [`/api/assistants/${assistant?.id || 0}/files`],
    enabled: !!assistant && open,
  });

  // Обновляем данные при открытии/закрытии диалога
  useEffect(() => {
    if (open && assistant?.id) {
      // Принудительно обновляем данные при открытии диалога
      refetch();
    } else if (!open) {
      // Сбрасываем выбранный файл при закрытии диалога
      setSelectedFile(null);
    }
  }, [open, assistant?.id, refetch]);

  // Мутация для загрузки файла
  const uploadFileMutation = useMutation({
    mutationFn: async () => {
      if (!assistant || !selectedFile) return null;

      // Шаг 1: Загружаем файл в базу знаний
      const formData = new FormData();
      formData.append("file", selectedFile);

      try {
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
        console.error("Upload and attach file error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Обновляем кэш запросов и принудительно запрашиваем данные заново
      queryClient.invalidateQueries({
        queryKey: [`/api/assistants/${assistant?.id || 0}/files`],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge"] });

      // Явно вызываем refetch для обновления данных
      refetch();

      toast({
        title: "Файл загружен",
        description:
          "Файл успешно добавлен в базу знаний и прикреплен к ассистенту",
      });
      setSelectedFile(null);
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

  // Мутация для удаления файла
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: number) => {
      if (!assistant) return null;
      return await apiRequest({
        url: `/api/assistants/${assistant.id}/files/${fileId}`,
        method: "DELETE",
      });
    },
    onSuccess: () => {
      // Обновляем кэш запроса и принудительно запрашиваем данные заново
      queryClient.invalidateQueries({
        queryKey: [`/api/assistants/${assistant?.id || 0}/files`],
      });
      // Явно вызываем refetch для обновления данных
      refetch();
      toast({
        title: "Файл удален",
        description: "Файл успешно удален",
      });
      setFileToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось удалить файл: ${
          error instanceof Error ? error.message : String(error)
        }`,
        variant: "destructive",
      });
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
    setIsUploading(true);
    uploadFileMutation.mutate();
  };

  // Функция для удаления файла
  const handleDelete = (fileId: number) => {
    setFileToDelete(fileId);
  };

  // Подтверждение удаления
  const confirmDelete = () => {
    if (fileToDelete !== null) {
      deleteFileMutation.mutate(fileToDelete);
    }
  };

  // Получение иконки для типа файла
  const getFileIcon = (fileType: string) => {
    // Определяем тип файла по расширению
    const ext = fileType.toLowerCase();

    if (ext.includes("pdf")) {
      return (
        <div className="bg-red-100 p-1 rounded flex items-center justify-center mr-3">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-red-600"
          >
            <path
              d="M7 21C6.45 21 5.979 20.804 5.587 20.412C5.195 20.02 4.999 19.5493 5 19V5C5 4.45 5.196 3.979 5.588 3.587C5.98 3.195 6.45067 2.999 7 3H14L19 8V19C19 19.55 18.804 20.021 18.413 20.413C18.0217 20.805 17.5507 21.0007 17 21H7ZM13 9V4H7V19H17V9H13Z"
              fill="currentColor"
            />
          </svg>
        </div>
      );
    } else if (ext.includes("doc") || ext.includes("word")) {
      return (
        <div className="bg-blue-100 p-1 rounded flex items-center justify-center mr-3">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-blue-600"
          >
            <path
              d="M7 21C6.45 21 5.979 20.804 5.587 20.412C5.195 20.02 4.999 19.5493 5 19V5C5 4.45 5.196 3.979 5.588 3.587C5.98 3.195 6.45067 2.999 7 3H14L19 8V19C19 19.55 18.804 20.021 18.413 20.413C18.0217 20.805 17.5507 21.0007 17 21H7ZM13 9V4H7V19H17V9H13Z"
              fill="currentColor"
            />
          </svg>
        </div>
      );
    } else if (ext.includes("xls") || ext.includes("excel")) {
      return (
        <div className="bg-green-100 p-1 rounded flex items-center justify-center mr-3">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-green-600"
          >
            <path
              d="M7 21C6.45 21 5.979 20.804 5.587 20.412C5.195 20.02 4.999 19.5493 5 19V5C5 4.45 5.196 3.979 5.588 3.587C5.98 3.195 6.45067 2.999 7 3H14L19 8V19C19 19.55 18.804 20.021 18.413 20.413C18.0217 20.805 17.5507 21.0007 17 21H7ZM13 9V4H7V19H17V9H13Z"
              fill="currentColor"
            />
          </svg>
        </div>
      );
    } else if (ext.includes("txt") || ext.includes("text")) {
      return (
        <div className="bg-gray-100 p-1 rounded flex items-center justify-center mr-3">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-gray-600"
          >
            <path
              d="M7 21C6.45 21 5.979 20.804 5.587 20.412C5.195 20.02 4.999 19.5493 5 19V5C5 4.45 5.196 3.979 5.588 3.587C5.98 3.195 6.45067 2.999 7 3H14L19 8V19C19 19.55 18.804 20.021 18.413 20.413C18.0217 20.805 17.5507 21.0007 17 21H7ZM13 9V4H7V19H17V9H13Z"
              fill="currentColor"
            />
          </svg>
        </div>
      );
    } else {
      // Для остальных типов файлов
      return (
        <div className="bg-purple-100 p-1 rounded flex items-center justify-center mr-3">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-purple-600"
          >
            <path
              d="M7 21C6.45 21 5.979 20.804 5.587 20.412C5.195 20.02 4.999 19.5493 5 19V5C5 4.45 5.196 3.979 5.588 3.587C5.98 3.195 6.45067 2.999 7 3H14L19 8V19C19 19.55 18.804 20.021 18.413 20.413C18.0217 20.805 17.5507 21.0007 17 21H7ZM13 9V4H7V19H17V9H13Z"
              fill="currentColor"
            />
          </svg>
        </div>
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 max-h-[90vh] overflow-hidden flex flex-col bg-white dark:bg-neutral-900">
        <DialogHeader className="p-6 pb-4">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl">
              Файлы ассистента {assistant?.name}
            </DialogTitle>
            <DialogClose className="w-8 h-8 flex items-center justify-center rounded-sm opacity-70 hover:opacity-100 focus:outline-none">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
          <DialogDescription className="text-base font-normal text-neutral-600 dark:text-neutral-400">
            Добавьте файлы к базе знаний ассистента. Поддерживаются документы
            различных форматов (PDF, Word, Excel, текст).
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-4">
          {/* Загрузка файла */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1">
              <input
                type="file"
                id="fileUpload"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.ppt,.pptx"
              />
              <label
                htmlFor="fileUpload"
                className="flex items-center h-11 px-4 w-full border border-dashed border-neutral-300 dark:border-neutral-700 rounded-md cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
              >
                <span className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
                  {selectedFile
                    ? selectedFile.name
                    : "Выберите файл для загрузки..."}
                </span>
              </label>
            </div>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="h-11 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 sm:w-auto"
            >
              {isUploading ? (
                <span className="flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Загрузка...
                </span>
              ) : (
                <span className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M11 14.9861C11 15.5384 11.4477 15.9861 12 15.9861C12.5523 15.9861 13 15.5384 13 14.9861V7.82831L16.2428 11.0711C16.6333 11.4616 17.2665 11.4616 17.657 11.0711C18.0475 10.6806 18.0475 10.0474 17.657 9.65692L12.7071 4.70703C12.3166 4.31651 11.6834 4.31651 11.2929 4.70703L6.34315 9.65692C5.95262 10.0474 5.95262 10.6806 6.34315 11.0711C6.73367 11.4616 7.36684 11.4616 7.75736 11.0711L11 7.82831V14.9861Z"
                      fill="currentColor"
                    />
                    <path
                      d="M4 14C4 13.4477 3.55228 13 3 13C2.44772 13 2 13.4477 2 14V19C2 19.7957 2.31607 20.5587 2.87868 21.1213C3.44129 21.6839 4.20435 22 5 22H19C19.7957 22 20.5587 21.6839 21.1213 21.1213C21.6839 20.5587 22 19.7957 22 19V14C22 13.4477 21.5523 13 21 13C20.4477 13 20 13.4477 20 14V19C20 19.2652 19.8946 19.5196 19.7071 19.7071C19.5196 19.8946 19.2652 20 19 20H5C4.73478 20 4.48043 19.8946 4.29289 19.7071C4.10536 19.5196 4 19.2652 4 19V14Z"
                      fill="currentColor"
                    />
                  </svg>
                  Загрузить
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Разделитель */}
        <div className="border-t border-neutral-200 dark:border-neutral-700 mx-6 my-2"></div>

        {/* Список файлов */}
        <div className="flex-1 overflow-auto px-6 min-h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center p-4 h-full min-h-[200px]">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-4 text-red-500 h-full min-h-[200px]">
              <AlertCircle className="w-6 h-6 mr-2" />
              <span>Ошибка загрузки файлов</span>
            </div>
          ) : files?.length === 0 ? (
            <div className="text-center p-8 text-neutral-500 dark:text-neutral-400 h-full min-h-[200px] flex items-center justify-center">
              <span>У этого ассистента пока нет файлов</span>
            </div>
          ) : (
            <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {files?.map((file: AssistantFile) => (
                <div
                  key={file.id}
                  className="py-3 flex items-center justify-between group"
                >
                  <div className="flex items-center flex-1 min-w-0">
                    {getFileIcon(file.fileType)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 dark:text-white truncate">
                        {file.fileName}
                      </p>
                      <div className="flex items-center text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        <span>{formatFileSize(file.fileSize)}</span>
                        <span className="mx-1">•</span>
                        <span>
                          {new Date(file.uploadedAt).toLocaleDateString(
                            "ru-RU",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setFileToDelete(file.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                        12313
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Подтвердите удаление
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Вы уверены, что хотите удалить файл "{file.fileName}"?
                          Это действие нельзя отменить.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={confirmDelete}
                          className="bg-red-500 hover:bg-red-600 text-white"
                        >
                          Удалить
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-neutral-50 dark:bg-neutral-800 flex items-center justify-end border-t border-neutral-200 dark:border-neutral-700">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
