import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KNOWLEDGE_FILE_TYPES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

// Схема для валидации формы
const uploadFileSchema = z.object({
  title: z
    .string()
    .min(2, "Название файла должно содержать минимум 2 символа")
    .max(100),
  description: z
    .string()
    .max(500, "Описание не должно превышать 500 символов")
    .optional(),
  fileType: z.string(),
});

type FormData = z.infer<typeof uploadFileSchema>;

interface UploadFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UploadFileDialog({
  open,
  onOpenChange,
}: UploadFileDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(uploadFileSchema),
    defaultValues: {
      title: "",
      description: "",
      fileType: "pdf",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);

      // Автоматически определяем тип файла
      const extension = file.name.split(".").pop()?.toLowerCase() || "";
      const fileTypeMapping: { [key: string]: string } = {
        pdf: "pdf",
        doc: "doc",
        docx: "doc",
        xls: "xls",
        xlsx: "xls",
        ppt: "ppt",
        pptx: "ppt",
        txt: "txt",
        jpg: "image",
        jpeg: "image",
        png: "image",
        gif: "image",
        svg: "image",
      };

      const detectedType = fileTypeMapping[extension] || "doc";
      form.setValue("fileType", detectedType);

      // Если название не заполнено, используем имя файла
      if (!form.getValues("title")) {
        const fileName = file.name.split(".")[0];
        form.setValue("title", fileName);
      }
    }
  };

  const handleSubmit = async (data: FormData) => {
    if (!selectedFile) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, выберите файл для загрузки",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", data.title);
      formData.append("description", data.description || "");
      formData.append("fileType", data.fileType);

      // Приведение типов с FormData, потому что API ожидает formData
      await apiRequest<any>({
        url: "/api/knowledge",
        method: "POST",
        body: formData as any, // Необходимо для обхода типизации
        isFormData: true,
      });

      toast({
        title: "Файл загружен",
        description: "Файл успешно добавлен в базу знаний",
      });

      // Очищаем форму и закрываем диалог
      form.reset();
      setSelectedFile(null);
      onOpenChange(false);

      // Инвалидируем кеш, чтобы обновить список файлов
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge"] });
    } catch (error) {
      console.error("Ошибка при загрузке файла:", error);
      toast({
        title: "Ошибка при загрузке",
        description:
          "Не удалось загрузить файл. Пожалуйста, попробуйте еще раз.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      form.reset();
      setSelectedFile(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Загрузка файла в базу знаний</DialogTitle>
          <DialogDescription>
            Добавьте файл для использования ассистентами при ответах на вопросы
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="file">Выберите файл</Label>
              <Input
                id="file"
                type="file"
                className="mt-1.5"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.svg"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  Выбран: {selectedFile.name} (
                  {(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="title">Название</Label>
              <Input
                id="title"
                className="mt-1.5"
                {...form.register("title")}
                placeholder="Введите название файла"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Описание (опционально)</Label>
              <Textarea
                id="description"
                className="mt-1.5"
                {...form.register("description")}
                placeholder="Добавьте краткое описание содержимого файла"
                rows={3}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="fileType">Тип файла</Label>
              <Select
                defaultValue={form.getValues("fileType")}
                onValueChange={(value) => form.setValue("fileType", value)}
              >
                <SelectTrigger id="fileType" className="mt-1.5">
                  <SelectValue placeholder="Выберите тип файла" />
                </SelectTrigger>
                <SelectContent>
                  {KNOWLEDGE_FILE_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center">
                        <span className="material-icons text-[18px] mr-1.5">
                          {type.icon}
                        </span>
                        <span>{type.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mt-6 gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isUploading || !selectedFile}>
              {isUploading ? (
                <>
                  <span className="material-icons animate-spin mr-1.5">
                    sync
                  </span>
                  Загрузка...
                </>
              ) : (
                <>
                  <span className="material-icons mr-1.5">cloud_upload</span>
                  Загрузить
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
