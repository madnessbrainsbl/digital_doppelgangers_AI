import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatFileSize, KNOWLEDGE_FILE_TYPES } from "@/lib/constants";
import { Loader2, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { KnowledgeItem } from "@shared/schema";

interface KnowledgeFilesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assistantId: number;
  selectedFileIds?: number[];
}

export default function KnowledgeFilesDialog({
  open,
  onOpenChange,
  assistantId,
  selectedFileIds = []
}: KnowledgeFilesDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [tabValue, setTabValue] = useState("all");
  const [selectedFiles, setSelectedFiles] = useState<number[]>(selectedFileIds);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Получение всех файлов из базы знаний
  const { data: knowledgeItems, isLoading } = useQuery<KnowledgeItem[]>({
    queryKey: ["/api/knowledge"],
    enabled: open,
  });
  
  // Получение данных об ассистенте
  const { data: assistant } = useQuery({
    queryKey: [`/api/assistants/${assistantId}`],
    enabled: open && !!assistantId,
  });

  // Получение существующих файлов ассистента
  const { data: assistantFiles } = useQuery<{id: number, knowledgeItemId?: number}[]>({
    queryKey: [`/api/assistants/${assistantId}/files`],
    enabled: open && !!assistantId,
  });

  // Сбрасываем выбранные файлы при открытии диалога с новыми selectedFileIds
  useEffect(() => {
    if (open) {
      setSelectedFiles(selectedFileIds);
    }
  }, [open, selectedFileIds]);
  
  // Устанавливаем выбранные файлы из данных ассистента при открытии диалога
  useEffect(() => {
    if (open && assistantFiles && assistantFiles.length > 0) {
      const fileIds = assistantFiles
        .filter(file => file.knowledgeItemId)
        .map(file => file.knowledgeItemId as number);
      setSelectedFiles(prevSelected => {
        // Объединяем существующие выбранные с файлами из ассистента
        const uniqueFiles = Array.from(new Set([...prevSelected, ...fileIds]));
        return uniqueFiles;
      });
    }
  }, [open, assistantFiles]);

  // Фильтрация файлов по критериям поиска и типу
  const filteredItems = knowledgeItems?.filter((item) => {
    const matchesSearch = searchQuery.trim() === "" || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = tabValue === "all" || item.fileType === tabValue;
    return matchesSearch && matchesTab;
  });

  // Переключение выбора файла (добавление/удаление из списка)
  const toggleFileSelection = (fileId: number) => {
    // Проверяем, выбран ли файл
    const isCurrentlySelected = selectedFiles.includes(fileId);
    
    // Меняем состояние
    if (isCurrentlySelected) {
      // Если файл уже выбран - удаляем из списка
      setSelectedFiles(selectedFiles.filter(id => id !== fileId));
    } else {
      // Если файл не выбран - добавляем в список
      setSelectedFiles([...selectedFiles, fileId]);
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    
    try {
      // Отправляем список ID выбранных файлов на сервер
      await apiRequest({
        url: `/api/assistants/${assistantId}/knowledge`,
        method: 'POST',
        body: { fileIds: selectedFiles }
      });

      // Сообщаем об успехе
      toast({
        title: "Файлы подключены",
        description: `К ассистенту подключено ${selectedFiles.length} файлов из базы знаний`,
      });

      // Инвалидируем кеши запросов
      queryClient.invalidateQueries({ queryKey: [`/api/assistants/${assistantId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/assistants/${assistantId}/files`] });
      
      // Закрываем диалог
      onOpenChange(false);
    } catch (error) {
      console.error("Ошибка при подключении файлов к ассистенту:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось подключить файлы к ассистенту. Пожалуйста, попробуйте еще раз.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] p-0 max-h-[90vh] overflow-hidden flex flex-col bg-white dark:bg-neutral-900">
        <DialogHeader className="p-6 pb-4">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl">Подключение файлов из базы знаний к ассистенту</DialogTitle>
            <DialogClose className="w-8 h-8 flex items-center justify-center rounded-sm opacity-70 ring-offset-background hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
          <DialogDescription className="text-base font-normal text-neutral-600 dark:text-neutral-400">
            Выберите файлы, которые будут доступны ассистенту при ответах на вопросы
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-0">
          {/* Строка поиска */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-400">
              <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Input
              type="search"
              placeholder="Поиск файлов..."
              className="pl-10 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 h-11"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Фильтр по типам файлов */}
          <div className="mb-2">
            <Tabs defaultValue="all" onValueChange={setTabValue} className="w-full">
              <TabsList className="bg-neutral-100 dark:bg-neutral-800 p-0.5 h-auto flex flex-wrap">
                <TabsTrigger 
                  value="all" 
                  className="rounded py-1.5 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:shadow-sm"
                >
                  Все
                </TabsTrigger>
                <TabsTrigger 
                  value="pdf" 
                  className="rounded py-1.5 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:shadow-sm"
                >
                  PDF
                </TabsTrigger>
                <TabsTrigger 
                  value="word" 
                  className="rounded py-1.5 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:shadow-sm"
                >
                  Word
                </TabsTrigger>
                <TabsTrigger 
                  value="powerpoint" 
                  className="rounded py-1.5 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:shadow-sm"
                >
                  PowerPoint
                </TabsTrigger>
                <TabsTrigger 
                  value="excel" 
                  className="rounded py-1.5 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:shadow-sm"
                >
                  Excel
                </TabsTrigger>
                <TabsTrigger 
                  value="text" 
                  className="rounded py-1.5 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:shadow-sm"
                >
                  Text
                </TabsTrigger>
                <TabsTrigger 
                  value="image" 
                  className="rounded py-1.5 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:shadow-sm"
                >
                  Image
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Список файлов */}
        <div className="flex-1 overflow-auto px-0 min-h-[350px]">
          <TabsContent value={tabValue} className="m-0 p-0">
            {isLoading ? (
              <div className="flex items-center justify-center p-4 h-full min-h-[200px]">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
              </div>
            ) : filteredItems?.length === 0 ? (
              <div className="text-center p-8 text-neutral-500 dark:text-neutral-400">
                {searchQuery 
                  ? `Нет файлов, соответствующих запросу "${searchQuery}"` 
                  : "В базе знаний нет файлов этого типа"}
              </div>
            ) : (
              <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {filteredItems?.map((file) => {
                  const isSelected = selectedFiles.includes(file.id);
                  const isNotSupported = file.fileType === 'word' || file.fileType === 'excel';
                  const supportWarning = isNotSupported ? <span className="text-red-500 text-xs ml-2 whitespace-nowrap">• Не поддерживается OpenAI</span> : null;
                  
                  return (
                    <div
                      key={file.id}
                      className={`flex items-center px-6 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 ${isSelected ? 'bg-neutral-50 dark:bg-neutral-800/50' : ''} transition-colors`}
                      onClick={() => !isNotSupported && toggleFileSelection(file.id)}
                    >
                      <Checkbox
                        id={`file-${file.id}`}
                        className="mr-4"
                        checked={isSelected}
                        disabled={isNotSupported}
                        onCheckedChange={() => !isNotSupported && toggleFileSelection(file.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center">
                          {/* Иконка типа файла */}
                          <div className={`bg-red-100 p-1 rounded flex items-center justify-center mr-3`}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-red-600">
                              <path d="M7 21C6.45 21 5.979 20.804 5.587 20.412C5.195 20.02 4.999 19.5493 5 19V5C5 4.45 5.196 3.979 5.588 3.587C5.98 3.195 6.45067 2.999 7 3H14L19 8V19C19 19.55 18.804 20.021 18.413 20.413C18.0217 20.805 17.5507 21.0007 17 21H7ZM13 9V4H7V19H17V9H13Z" fill="currentColor"/>
                            </svg>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-1">
                              <span className="font-medium text-neutral-900 dark:text-white truncate">
                                {file.title}
                              </span>
                              {supportWarning}
                            </div>
                            <div className="flex items-center text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                              <span>{formatFileSize(file.fileSize)}</span>
                              <span className="mx-1">•</span>
                              <span>{new Date(file.uploadedAt).toLocaleDateString('ru-RU', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'})}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </div>
        
        <div className="p-4 bg-neutral-50 dark:bg-neutral-800 flex items-center justify-between border-t border-neutral-200 dark:border-neutral-700">
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            Выбрано: <span className="font-medium">{selectedFiles.length}</span> файлов
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-neutral-300 dark:border-neutral-700"
            >
              Отмена
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSubmitting}
              className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {isSubmitting ? 'Сохраняем...' : 'Сохранить'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}