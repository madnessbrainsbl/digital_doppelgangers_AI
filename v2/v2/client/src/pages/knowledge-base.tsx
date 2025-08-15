import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import FileCard from "@/components/knowledge-base/file-card";
import UploadFileDialog from "@/components/knowledge-base/upload-file-dialog";
import KnowledgeBaseInstructionsDialog from "@/components/knowledge-base/knowledge-base-instructions-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { formatFileSize, KNOWLEDGE_FILE_TYPES } from "@/lib/constants";
import { KnowledgeItem } from "@shared/schema";
import { Book } from "lucide-react";

export default function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [tabValue, setTabValue] = useState("all");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [instructionsDialogOpen, setInstructionsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch knowledge base data
  const { data: knowledgeItems, isLoading } = useQuery<KnowledgeItem[]>({
    queryKey: ["/api/knowledge"],
  });

  const filteredItems = knowledgeItems?.filter((item: KnowledgeItem) => {
    // Filter by search query
    const matchesSearch = item.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    // Filter by tab (file type)
    const matchesTab = tabValue === "all" || item.fileType === tabValue;

    return matchesSearch && matchesTab;
  });

  const handleUploadFile = () => {
    setUploadDialogOpen(true);
  };

  const handleFileClick = (file: KnowledgeItem) => {
    toast({
      title: "Просмотр файла",
      description: `Просмотр файла "${file.title}" будет доступен в следующем обновлении`,
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-2xl font-bold">База знаний</h1>
            <p className="text-muted-foreground">
              Управление информацией, доступной для ассистентов
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setInstructionsDialogOpen(true)}
            title="Инструкция по работе с базой знаний"
            className="bg-purple-200 hover:bg-purple-300"
          >
            <Book className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-6 gap-4">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
            <span className="material-icons text-[20px]">search</span>
          </span>
          <Input
            type="text"
            placeholder="Поиск файлов..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={handleUploadFile}>
          <span className="material-icons text-[18px] mr-1">upload_file</span>
          <span>Загрузить файл</span>
        </Button>
      </div>

      <div className="block md:hidden">
        <div className="border rounded p-2 overflow-x-auto">
          <div className="flex gap-2 w-[300px]">
            <button
              value={"all"}
              type="button"
              className={`rounded-md px-3 pb-1 whitespace-nowrap transition-colors ${
                tabValue === "all"
                  ? "bg-blue-500 text-white"
                  : "bg-neutral-200 text-neutral-700"
              }`}
              onClick={() => setTabValue("all")}
            >
              Все
            </button>
            {KNOWLEDGE_FILE_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                className={`rounded-md px-3 pb-1 whitespace-nowrap transition-colors ${
                  tabValue === type.id
                    ? "bg-blue-500 text-white"
                    : "bg-neutral-200 text-neutral-700"
                }`}
                onClick={() => setTabValue(type.id)}
              >
                {type.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 border rounded-md">
          {isLoading ? (
            <div className="py-4 text-center text-neutral-500 dark:text-neutral-400">
              Загрузка базы знаний...
            </div>
          ) : filteredItems?.length === 0 ? (
            <div className="py-4 text-center text-neutral-500 dark:text-neutral-400">
              {searchQuery
                ? `Нет файлов, соответствующих запросу "${searchQuery}"`
                : "База знаний пуста"}
            </div>
          ) : (
            <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {filteredItems?.map((file: KnowledgeItem) => {
                const fileTypeInfo =
                  KNOWLEDGE_FILE_TYPES.find(
                    (type) => type.id === file.fileType
                  ) || KNOWLEDGE_FILE_TYPES[0];

                return (
                  <FileCard
                    key={file.id}
                    icon={fileTypeInfo.icon}
                    iconBg={fileTypeInfo.bg}
                    iconColor={fileTypeInfo.color}
                    fileName={file.title}
                    fileSize={formatFileSize(file.fileSize)}
                    uploadDate={`Добавлен ${new Date(
                      file.uploadedAt
                    ).toLocaleDateString("ru-RU", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`}
                    onClick={() => handleFileClick(file)}
                    id={file.id}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tabs and Content */}
      <Tabs
        defaultValue="all"
        onValueChange={setTabValue}
        className="hidden md:block"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="all">Все</TabsTrigger>
          {KNOWLEDGE_FILE_TYPES.map((type) => (
            <TabsTrigger key={type.id} value={type.id}>
              {type.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tabValue}>
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="py-4 text-center text-neutral-500 dark:text-neutral-400">
                  Загрузка базы знаний...
                </div>
              ) : filteredItems?.length === 0 ? (
                <div className="py-4 text-center text-neutral-500 dark:text-neutral-400">
                  {searchQuery
                    ? `Нет файлов, соответствующих запросу "${searchQuery}"`
                    : "База знаний пуста"}
                </div>
              ) : (
                <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {filteredItems?.map((file: KnowledgeItem) => {
                    const fileTypeInfo =
                      KNOWLEDGE_FILE_TYPES.find(
                        (type) => type.id === file.fileType
                      ) || KNOWLEDGE_FILE_TYPES[0];

                    return (
                      <FileCard
                        key={file.id}
                        icon={fileTypeInfo.icon}
                        iconBg={fileTypeInfo.bg}
                        iconColor={fileTypeInfo.color}
                        fileName={file.title}
                        fileSize={formatFileSize(file.fileSize)}
                        uploadDate={`Добавлен ${new Date(
                          file.uploadedAt
                        ).toLocaleDateString("ru-RU", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`}
                        onClick={() => handleFileClick(file)}
                        id={file.id}
                      />
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Диалог загрузки файла */}
      <UploadFileDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
      />

      {/* Диалог инструкций */}
      <KnowledgeBaseInstructionsDialog
        open={instructionsDialogOpen}
        onOpenChange={setInstructionsDialogOpen}
      />
    </div>
  );
}
