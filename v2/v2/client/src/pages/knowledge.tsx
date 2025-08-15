import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import KnowledgeItem from "@/components/knowledge/KnowledgeItem";
import FileUploader from "@/components/knowledge/FileUploader";
import { Search, FolderPlus } from "lucide-react";

export default function Knowledge() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  // Fetch knowledge items
  const { data: knowledgeItems, isLoading } = useQuery({
    queryKey: ["/api/knowledge"],
  });

  const filteredItems = knowledgeItems?.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    
    return matchesSearch && matchesType;
  }) || [];

  return (
    <div>
      {/* Page Title */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">База знаний</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">Управление документами и файлами</p>
        </div>
        <Button onClick={() => setIsUploadDialogOpen(true)}>
          <span className="material-icons mr-2">upload_file</span>
          Загрузить файл
        </Button>
      </div>

      {/* Filter Controls */}
      <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Поиск по базе знаний..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Тип файла" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="document">Документы</SelectItem>
                <SelectItem value="spreadsheet">Таблицы</SelectItem>
                <SelectItem value="image">Изображения</SelectItem>
                <SelectItem value="text">Текст</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Knowledge Base Content */}
      <Tabs defaultValue="files" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="files">
              <span className="material-icons mr-1">insert_drive_file</span>
              Файлы
            </TabsTrigger>
            <TabsTrigger value="folders">
              <span className="material-icons mr-1">folder</span>
              Папки
            </TabsTrigger>
          </TabsList>
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            {filteredItems.length} файлов
          </div>
        </div>

        <TabsContent value="files" className="mt-0">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center bg-white dark:bg-neutral-800 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 animate-pulse">
                  <div className="w-12 h-12 rounded-md bg-neutral-200 dark:bg-neutral-700"></div>
                  <div className="ml-4 flex-1 space-y-2">
                    <div className="h-4 w-48 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                    <div className="h-3 w-32 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <KnowledgeItem key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <span className="material-icons text-4xl text-neutral-400 dark:text-neutral-600 mb-4">search_off</span>
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-1">Файлы не найдены</h3>
              <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                {searchTerm || typeFilter !== "all" 
                  ? "Попробуйте изменить параметры поиска" 
                  : "В базе знаний пока нет файлов"}
              </p>
              {!searchTerm && typeFilter === "all" && (
                <Button onClick={() => setIsUploadDialogOpen(true)}>
                  <span className="material-icons mr-1">upload_file</span>
                  Загрузить файл
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="folders" className="mt-0">
          <div className="text-center py-16 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <FolderPlus className="w-12 h-12 mx-auto mb-4 text-neutral-400 dark:text-neutral-600" />
            <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-1">Папки не созданы</h3>
            <p className="text-neutral-500 dark:text-neutral-400 mb-4">
              Вы можете организовать файлы по категориям, создав папки
            </p>
            <Button variant="outline">
              <span className="material-icons mr-1">create_new_folder</span>
              Создать папку
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <FileUploader />
        </DialogContent>
      </Dialog>
    </div>
  );
}
