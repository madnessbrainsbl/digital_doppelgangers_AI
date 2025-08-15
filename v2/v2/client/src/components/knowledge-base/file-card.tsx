import { Trash2 } from "lucide-react";
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface FileCardProps {
  icon: string;
  iconBg: string;
  iconColor: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  onClick: () => void;
  id: number;
}

export default function FileCard({
  icon,
  iconBg,
  iconColor,
  fileName,
  fileSize,
  uploadDate,
  onClick,
  id,
}: FileCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const deleteFile = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/knowledge/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Ошибка при удалении файла");
      }

      const result = await response.json();

      toast({
        title: "Успех",
        description: "Фаил успешно удалён",
        variant: "default",
      });

      // Инвалидируем кеш запроса списка файлов
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge"] });
    } catch (error) {
      console.error("Ошибка при удалении файла:", error);
      toast({
        title: "Ошибка",
        description: `Не удалось удалить фаил: ${
          error instanceof Error ? error.message : String(error)
        }`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const confirmDelete = () => {
    deleteFile();
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(false);
  };

  return (
    <div
      className="flex items-center py-2 sm:py-3 px-2 sm:px-4 gap-2 sm:gap-4 flex-wrap hover:bg-neutral-50 dark:hover:bg-neutral-800/30 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div
        className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg mr-2 sm:mr-4 ${iconBg}`}
      >
        <span className={`material-icons ${iconColor}`}>{icon}</span>
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-sm sm:text-base font-medium text-foreground truncate">
          {fileName}
        </h4>
        <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm text-muted-foreground">
          <span className="flex-shrink-0">{fileSize}</span>
          <span className="hidden sm:block mx-1.5">•</span>
          <span>{uploadDate}</span>
        </div>
      </div>

      <div className="ml-2 sm:ml-4 flex items-center gap-1 sm:gap-2 flex-wrap">
        <button
          className="h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Просмотреть файл"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          <span className="material-icons text-[18px] sm:text-[20px] text-muted-foreground">
            visibility
          </span>
        </button>
        <button
          className="h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Удаление файла"
          onClick={handleDeleteClick}
        >
          <Trash2 className="text-red-500 w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {showDeleteDialog && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={cancelDelete}
        >
          <div
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium mb-4">Подтверждение удаления</h3>
            <p className="mb-6">
              Вы уверены, что хотите удалить файл "{fileName}"? Это действие
              нельзя отменить.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                onClick={cancelDelete}
                disabled={isDeleting}
              >
                Отмена
              </button>
              <button
                className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white transition-colors"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Удаление..." : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
