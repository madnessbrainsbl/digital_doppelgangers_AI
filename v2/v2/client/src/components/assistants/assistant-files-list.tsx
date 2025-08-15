import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Trash2,
  XCircle,
  File,
} from "lucide-react";
import { formatFileSize } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
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
import { Button } from "@/components/ui/button";

interface AssistantFile {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  openaiFileId: string;
  uploadedAt: string;
}

interface AssistantFilesListProps {
  assistantId: number;
}

export default function AssistantFilesList({
  assistantId,
}: AssistantFilesListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [fileToDetach, setFileToDetach] = useState<number | null>(null);
  const [fileToDelete, setFileToDelete] = useState<number | null>(null);

  // Загружаем список файлов ассистента
  const {
    data: files = [],
    isLoading,
    error,
    refetch,
  } = useQuery<AssistantFile[]>({
    queryKey: [`/api/assistants/${assistantId}/files`],
    enabled: !!assistantId,
  });

  // Мутация для открепления файла от ассистента
  const detachFileMutation = useMutation({
    mutationFn: async (fileId: number) => {
      const response = await fetch(
        `/api/assistants/${assistantId}/files/${fileId}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || "Не удалось открепить файл от ассистента"
        );
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Файл откреплен",
        description: "Файл успешно откреплен от ассистента",
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/assistants/${assistantId}/files`],
      });
      setFileToDetach(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось открепить файл: ${error.message}`,
        variant: "destructive",
      });
      setFileToDetach(null);
    },
  });

  // Мутация для удаления файла из базы знаний ПЕРЕНЕСТИ НА СТРАНИЦУ БАЗА ЗНАНИЙ /knowledge-base
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: number) => {
      // Сначала открепляем файл от ассистента
      await fetch(`/api/assistants/${assistantId}/files/${fileId}`, {
        method: "DELETE",
      });

      // Затем удаляем файл из базы знаний
      const response = await fetch(`/api/knowledge/${fileId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || "Не удалось удалить файл из базы знаний"
        );
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Файл удален",
        description:
          "Файл успешно удален из базы знаний и откреплен от ассистента",
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/assistants/${assistantId}/files`],
      });
      queryClient.invalidateQueries({ queryKey: [`/api/knowledge`] });
      setFileToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось удалить файл: ${error.message}`,
        variant: "destructive",
      });
      setFileToDelete(null);
    },
  });

  // Обработчики действий
  const handleDetachFile = (fileId: number) => {
    setFileToDetach(fileId);
  };

  const handleDeleteFile = (fileId: number) => {
    setFileToDelete(fileId);
  };

  const confirmDetachFile = () => {
    if (fileToDetach) {
      detachFileMutation.mutate(fileToDetach);
      // Сразу очищаем идентификатор удаляемого файла,
      // чтобы избежать повторных нажатий
      setFileToDetach(null);
    }
  };

  const confirmDeleteFile = () => {
    if (fileToDelete) {
      deleteFileMutation.mutate(fileToDelete);
      // Сразу очищаем идентификатор удаляемого файла,
      // чтобы избежать повторных нажатий
      setFileToDelete(null);
    }
  };

  // Обновляем список при изменении ID ассистента
  useEffect(() => {
    if (assistantId) {
      refetch();
    }
  }, [assistantId, refetch]);

  // Функция для отображения иконки файла в зависимости от типа
  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) {
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
              d="M8 2V5H3V7H8V10H10V7H14.74L16.74 5H10V2H8ZM16 2C12.0644 2 8.29489 3.91547 6.0288 7.12658C6.01182 7.15184 5.99548 7.17754 5.97977 7.20363C6.08564 7.45391 6.255 7.80422 6.51953 8.3164C6.52995 8.33732 6.54071 8.35841 6.55182 8.37965C6.77369 8.79473 7.30694 9.49722 8.03906 10.2637C8.04516 10.27 8.0513 10.2764 8.05747 10.2827C10.3208 12.6127 13.8999 15.0332 17.6758 15.0332H17.8418C18.3509 15.0332 19.1272 14.99 19.8105 14.6914C20.4939 14.3928 21.0859 13.7949 21.0859 12.9668C21.0859 12.7568 21.0644 12.6595 20.9219 12.3184C20.7126 11.8299 20.188 11.3232 19.5488 10.8594C18.9097 10.3955 18.1839 10.0105 17.6172 9.7168C17.5588 9.68567 17.5009 9.65518 17.4434 9.625C17.1434 9.48438 16.8658 9.375 16.6992 9.29297C16.6159 9.25195 16.5537 9.2207 16.5098 9.19727C16.4878 9.18555 16.4731 9.17703 16.4648 9.17188C16.4607 9.1693 16.4613 9.17047 16.4551 9.16602C16.436 9.15208 16.3457 9.0918 16.2461 8.94727C16.1465 8.80273 16.0117 8.54102 16.0117 8.14258C16.0117 7.48633 16.3838 7.13867 16.5879 6.97266C16.7919 6.80664 17.0019 6.72266 17.0918 6.6875C17.8467 6.40625 18.5747 6.12914 19.2188 5.74023C19.8628 5.35132 20.3359 4.81445 20.332 4.17383C20.332 3.52539 19.8467 3.03516 19.25 2.76758C18.6533 2.5 17.9473 2.40039 17.3242 2.37891C17.0229 2.36914 16.8867 2.37891 16.625 2.37891C16.4103 2.37891 16.3001 2.33984 16.1621 2.28711C16.1128 2.26876 16.0602 2.24696 16.0039 2.22266C16 2.14844 16 2.07422 16 2ZM16 4C16.5128 4 17.0643 4.07515 17.6855 4.41602C18.3067 4.75688 19 5.44922 19 6.5C19 7.55078 18.3067 8.24312 17.6855 8.58398C17.0643 8.92485 16.5128 9 16 9C15.4872 9 14.9357 8.92485 14.3145 8.58398C13.6933 8.24312 13 7.55078 13 6.5C13 5.44922 13.6933 4.75688 14.3145 4.41602C14.9357 4.07515 15.4872 4 16 4ZM3 9V11H9V14H11V11H14V9H11V7.2168L9 9.2168V9H3ZM16 11C18.0515 11 18.7393 12.5451 19.4434 13.6328C19.652 13.9487 19.8985 14.2324 20.1855 14.4434C20.4726 14.6544 20.7839 14.8046 21.1973 14.8477C22.1602 14.9458 23 15.873 23 17C23 18.127 22.1602 19.0542 21.1973 19.1523C20.7839 19.1954 20.4726 19.3456 20.1855 19.5566C19.8985 19.7676 19.652 20.0513 19.4434 20.3672C18.7393 21.4549 18.0515 23 16 23C13.9485 23 13.2607 21.4549 12.5566 20.3672C12.348 20.0513 12.1015 19.7676 11.8145 19.5566C11.5274 19.3456 11.2161 19.1954 10.8027 19.1523C9.83977 19.0542 9 18.127 9 17C9 15.873 9.83977 14.9458 10.8027 14.8477C11.2161 14.8046 11.5274 14.6544 11.8145 14.4434C12.1015 14.2324 12.348 13.9487 12.5566 13.6328C13.2607 12.5451 13.9485 11 16 11ZM16 13C15.4872 13 14.9357 13.0751 14.3145 13.416C13.6933 13.7569 13 14.4492 13 15.5C13 16.5508 13.6933 17.2431 14.3145 17.584C14.9357 17.9249 15.4872 18 16 18C16.5128 18 17.0643 17.9249 17.6855 17.584C18.3067 17.2431 19 16.5508 19 15.5C19 14.4492 18.3067 13.7569 17.6855 13.416C17.0643 13.0751 16.5128 13 16 13ZM3 13V15H8V19H10V15H14V13H10V12H8V13H3ZM3 17V19H5V22H7V19H14V17H7V16H5V17H3Z"
              fill="currentColor"
            />
          </svg>
        </div>
      );
    } else if (fileType.includes("doc")) {
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
              d="M6 2C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2H6ZM6 4H13V9H18V20H6V4ZM8 12V14H16V12H8ZM8 16V18H16V16H8Z"
              fill="currentColor"
            />
          </svg>
        </div>
      );
    } else if (fileType.includes("xls")) {
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
              d="M14 2H6C4.89 2 4 2.89 4 4V20C4 21.11 4.89 22 6 22H18C19.11 22 20 21.11 20 20V8L14 2ZM18 20H6V4H13V9H18V20ZM10 19L12 15L14 19H10ZM12 13L10 9H14L12 13Z"
              fill="currentColor"
            />
          </svg>
        </div>
      );
    } else if (fileType.includes("txt")) {
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
              d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM6 4H13V9H18V20H6V4ZM8 12V14H16V12H8ZM8 16V18H16V16H8Z"
              fill="currentColor"
            />
          </svg>
        </div>
      );
    } else {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-4 text-red-500">
        <AlertCircle className="w-4 h-4 mr-2" />
        <span className="text-sm">Ошибка загрузки файлов</span>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="border-t border-dashed border-neutral-200 dark:border-neutral-700 mt-4 pt-4">
        <div className="text-sm font-medium mb-2 text-left">
          Подключенные файлы:
        </div>
        <div className="border border-neutral-200 rounded-md p-6 flex flex-col items-center justify-center">
          <FileText className="h-8 w-8 mb-2 text-neutral-400" />
          <span className="text-center text-neutral-500">
            У этого ассистента пока нет файлов
          </span>
          <span className="text-center text-xs text-neutral-400 mt-1">
            Загрузите файлы или добавьте их из базы знаний
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-dashed border-neutral-200 dark:border-neutral-700 mt-4 pt-4">
      <div className="text-sm font-medium mb-2 text-left">
        Подключенные файлы:
      </div>
      <div className="relative divide-y divide-neutral-200 dark:divide-neutral-700 border border-neutral-200 rounded-md">
        {detachFileMutation.isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-400 opacity-50">
            <Loader2 className="h-4 w-4 text-white animate-spin" />
          </div>
        )}
        {files.map((file: AssistantFile) => (
          <div
            key={file.id}
            className="px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between group hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            <div className="flex items-center flex-1 min-w-0">
              {getFileIcon(file.fileType)}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-neutral-900 dark:text-white truncate text-sm sm:text-base">
                  {file.fileName}
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  <span>{formatFileSize(file.fileSize)}</span>
                  <span className="hidden sm:inline mx-1">•</span>
                  <span className="mt-0.5 sm:mt-0">
                    Добавлен{" "}
                    {new Date(file.uploadedAt).toLocaleDateString("ru-RU", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center ml-2">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-1 sm:mr-2 opacity-0" />
              <div className="flex gap-1">
                <AlertDialog
                  open={fileToDetach === file.id}
                  onOpenChange={(open) => !open && setFileToDetach(null)}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      disabled={detachFileMutation.isPending}
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 sm:h-8 sm:w-8 transition-opacity opacity-100 max-sm:opacity-100 group-hover:opacity-100"
                      onClick={() => handleDetachFile(file.id)}
                    >
                      <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-base sm:text-lg">
                        Открепить файл от ассистента
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-sm">
                        Вы уверены, что хотите открепить файл "{file.fileName}"
                        от ассистента? Файл останется в базе знаний и может быть
                        прикреплен повторно.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                      <AlertDialogCancel className="w-full sm:w-auto">
                        Отмена
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={confirmDetachFile}
                        className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        Открепить
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
