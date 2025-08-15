import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import * as React from "react";
import {
  Bot,
  Plus,
  CheckCircle,
  AlertCircle,
  Loader2,
  Search,
  AlertTriangle,
  Book,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import AssistantCard from "@/components/assistants/assistant-card";
import CreateAssistantDialog from "@/components/assistants/create-assistant-dialog";
import EditAssistantDialog from "@/components/assistants/edit-assistant-dialog-new";
import AssistantFilesDialog from "@/components/assistants/assistant-files-dialog";
import AssistantChatDialog from "@/components/assistants/assistant-chat-dialog";
import AssistantTestDialog from "@/components/assistants/assistant-test-dialog";
import KnowledgeFilesDialog from "@/components/assistants/knowledge-files-dialog";
import AssistantsInstructionsDialog from "@/components/assistants/assistants-instructions-dialog";
import { DeleteAssistantDialog } from "@/components/assistants/delete-assistant-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useTariffLimits } from "@/hooks/use-tariff-limits";
import { Link } from "wouter";

// Определение типа для ассистента
interface Assistant {
  id: number;
  name: string;
  description?: string;
  status?: string;
  role?: string;
  openaiAssistantId?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number;
  [key: string]: any; // Для других возможных полей
}

// Определение типа для статуса OpenAI
interface OpenAIStatus {
  status: string;
  [key: string]: any;
}

export default function Assistants() {
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [filesDialogOpen, setFilesDialogOpen] = useState(false);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [knowledgeFilesDialogOpen, setKnowledgeFilesDialogOpen] =
    useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [instructionsDialogOpen, setInstructionsDialogOpen] = useState(false);
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(
    null
  );
  const { toast } = useToast();

  // Получаем информацию о лимитах тарифа
  const {
    canCreateAssistant,
    assistantsLimit,
    assistantsUsed,
    isLoading: isLimitsLoading,
    isPlanLimited,
  } = useTariffLimits();

  // Fetch assistants data
  const {
    data: assistants = [],
    isLoading,
    isError,
  } = useQuery<Assistant[]>({
    queryKey: ["/api/assistants"],
    // Отключаем кеширование для получения актуальных данных
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Проверка состояния OpenAI API
  const { data: openaiStatus, isLoading: isCheckingOpenAI } =
    useQuery<OpenAIStatus>({
      queryKey: ["/api/openai/status"],
      retry: 1,
    });

  const filteredAssistants = assistants?.filter((assistant: any) => {
    // Filter by search query
    return (
      searchQuery === "" ||
      assistant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assistant.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Получение каналов ассистента (демо)
  const getAssistantChannels = (assistant: any) => {
    if (assistant.role === "sales_manager") {
      return ["Telegram", "WhatsApp", "Сайт"];
    } else if (assistant.role === "support") {
      return ["Telegram", "Email", "Телефон"];
    } else if (assistant.role === "consultant") {
      return ["WhatsApp", "VK", "Сайт"];
    } else {
      return ["Телефон"];
    }
  };

  // Получаем queryClient для ручного обновления данных
  const queryClient = useQueryClient();

  // Принудительное обновление данных
  const refreshData = useCallback(() => {
    // Обновляем список ассистентов
    queryClient.invalidateQueries({ queryKey: ["/api/assistants"] });

    // Обновляем данные использования
    const userData = queryClient.getQueryData<{
      id: number;
      name: string;
      email: string;
      plan: string;
    }>(["/api/auth/me"]);
    if (userData?.id) {
      queryClient.invalidateQueries({ queryKey: ["/api/usage", userData.id] });
    }
  }, [queryClient]);

  const handleCreateAssistant = () => {
    // Проверяем статус OpenAI перед созданием
    if (openaiStatus?.status !== "connected") {
      toast({
        title: "Ошибка соединения",
        description:
          "Невозможно создать ассистента: нет соединения с OpenAI API",
        variant: "destructive",
      });
      return;
    }

    // Проверяем ограничения тарифного плана
    if (!canCreateAssistant) {
      toast({
        title: "Ограничение тарифа",
        description: `Достигнут лимит ассистентов (${assistantsUsed}/${assistantsLimit}). Для добавления новых ассистентов необходимо перейти на тариф выше.`,
        variant: "destructive",
      });
      return;
    }

    setCreateDialogOpen(true);
  };

  const handleAssistantSettingsClick = (assistant: any) => {
    setSelectedAssistant(assistant);
    setEditDialogOpen(true);
  };

  const handleAssistantDialogsClick = (assistant: any) => {
    // Проверяем возможность открытия чата
    if (!assistant.openaiAssistantId) {
      toast({
        title: "Ошибка",
        description:
          "Этот ассистент не синхронизирован с OpenAI. Необходимо настроить ассистента для синхронизации.",
        variant: "destructive",
      });
      return;
    }
    setSelectedAssistant(assistant);
    setChatDialogOpen(true);
  };

  const handleKnowledgeClick = (assistant: any) => {
    // Проверяем возможность открытия диалога базы знаний
    if (!assistant.openaiAssistantId) {
      toast({
        title: "Ошибка",
        description:
          "Этот ассистент не синхронизирован с OpenAI. Отредактируйте его данные для синхронизации.",
        variant: "destructive",
      });
      return;
    }
    setSelectedAssistant(assistant);
    setKnowledgeFilesDialogOpen(true);
  };

  const handleFilesClick = (assistant: any) => {
    setSelectedAssistant(assistant);
    setFilesDialogOpen(true);
  };

  const handleTestClick = (assistant: any) => {
    // Проверяем возможность открытия тестового диалога
    if (!assistant.openaiAssistantId) {
      toast({
        title: "Ошибка",
        description:
          "Этот ассистент не синхронизирован с OpenAI. Необходимо настроить ассистента для синхронизации.",
        variant: "destructive",
      });
      return;
    }
    setSelectedAssistant(assistant);
    setTestDialogOpen(true);
  };

  // Обработчик кнопки "Удалить"
  const handleDeleteClick = (assistant: any) => {
    setSelectedAssistant(assistant);
    setDeleteDialogOpen(true);
  };

  // Отображение статуса OpenAI
  const renderOpenAIStatus = () => {
    if (isCheckingOpenAI) {
      return (
        <div className="flex items-center text-xs md:text-sm text-neutral-500">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Проверка соединения...
        </div>
      );
    }

    if (openaiStatus?.status === "connected") {
      return (
        <div className="flex items-center text-xs md:text-sm text-green-600">
          <CheckCircle className="w-4 h-4 mr-2" />
          Соединение установлено
        </div>
      );
    }

    return (
      <div className="flex items-center text-sm text-red-600">
        <AlertCircle className="w-4 h-4 mr-2" />
        Нет соединения
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Заголовок и статус */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <h2 className="text-2xl font-bold">Ваши ассистенты</h2>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setInstructionsDialogOpen(true)}
            title="Инструкция по работе с ассистентами"
            className="bg-purple-200 hover:bg-purple-300"
          >
            <Book className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          {renderOpenAIStatus()}
          <Button
            onClick={handleCreateAssistant}
            disabled={
              openaiStatus?.status !== "connected" || !canCreateAssistant
            }
            title={
              !canCreateAssistant
                ? `Достигнут лимит ассистентов (${assistantsUsed}/${assistantsLimit})`
                : undefined
            }
          >
            <Plus className="h-4 w-4 md:mr-2" />
            <span className="hidden md:block">Создать ассистента</span>
          </Button>
        </div>
      </div>

      {/* Поиск */}
      {filteredAssistants.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Поиск ассистентов..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {/* Информация о необходимости подключения тарифа */}
      {!isLimitsLoading && !assistantsLimit && (
        <div className="mt-6 p-4 border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/30 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-800 dark:text-blue-300">
                Необходимо активировать тариф
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                Для создания ассистентов требуется активный тарифный план.
                {!isPlanLimited && (
                  <span>
                    {" "}
                    Как новому пользователю, вам доступен бесплатный пробный
                    период для ознакомления с возможностями платформы.
                  </span>
                )}
              </p>
              <div className="flex gap-3 mt-3">
                <Button asChild className="" variant="default" size="sm">
                  <Link href="/billing">
                    {!isPlanLimited
                      ? "Активировать пробный период"
                      : "Подключить тариф"}
                  </Link>
                </Button>
                <Button asChild className="" variant="outline" size="sm">
                  <Link href="/pricing">Сравнить тарифы</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Контент */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Загрузка ассистентов...</p>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center h-[400px]">
          <AlertCircle className="h-8 w-8 text-destructive mb-4" />
          <p className="text-destructive">Ошибка при загрузке ассистентов</p>
        </div>
      ) : filteredAssistants.length === 0 && searchQuery === "" ? (
        <div className="flex flex-col items-center justify-center p-12 h-[400px] border border-dashed rounded-xl">
          <Bot className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">
            Нет доступных ассистентов
          </h3>
          <p className="text-muted-foreground mb-6 text-center max-w-md">
            Создайте своего первого виртуального ассистента, чтобы начать
            общение с клиентами
          </p>
          <Button
            onClick={handleCreateAssistant}
            disabled={
              openaiStatus?.status !== "connected" || !canCreateAssistant
            }
            title={
              !canCreateAssistant
                ? `Достигнут лимит ассистентов (${assistantsUsed}/${assistantsLimit})`
                : undefined
            }
          >
            <Plus className="h-4 w-4 mr-2" />
            Создать ассистента
          </Button>
        </div>
      ) : filteredAssistants.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-xl">
          <p className="text-muted-foreground">
            Нет ассистентов, соответствующих запросу "{searchQuery}"
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAssistants.map((assistant: any) => (
            <AssistantCard
              key={assistant.id}
              id={assistant.id}
              name={assistant.name}
              status={assistant.status as any}
              channels={getAssistantChannels(assistant)}
              onSettingsClick={() => handleAssistantSettingsClick(assistant)}
              onDialogsClick={() => handleAssistantDialogsClick(assistant)}
              onTestClick={() => handleTestClick(assistant)}
              onDeleteClick={() => handleDeleteClick(assistant)}
              onClick={() => handleAssistantSettingsClick(assistant)}
            />
          ))}

          <Card className="border-dashed bg-muted/50">
            <CardContent className="flex items-center justify-center py-12">
              <Button
                variant="outline"
                onClick={handleCreateAssistant}
                disabled={!canCreateAssistant}
                title={
                  !canCreateAssistant
                    ? `Достигнут лимит ассистентов (${assistantsUsed}/${assistantsLimit})`
                    : undefined
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Создать ассистента
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Информация о лимите ассистентов */}
      {filteredAssistants.length > 0 && !canCreateAssistant && (
        <div className="mt-6 p-4 border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/30 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-amber-800 dark:text-amber-300">
                Достигнут лимит ассистентов
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                Вы используете {assistantsUsed} из {assistantsLimit} доступных
                ассистентов в вашем тарифном плане. Для создания дополнительных
                ассистентов перейдите на тариф выше.
              </p>
              <Button asChild className="mt-3" variant="outline" size="sm">
                <Link href="/billing">Изменить тариф</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Диалоги */}
      <CreateAssistantDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            // Когда диалог закрывается, обновляем данные
            refreshData();
          }
        }}
      />

      <EditAssistantDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        assistant={selectedAssistant as any}
      />

      <AssistantFilesDialog
        open={filesDialogOpen}
        onOpenChange={setFilesDialogOpen}
        assistant={selectedAssistant}
      />

      <AssistantChatDialog
        open={chatDialogOpen}
        onOpenChange={setChatDialogOpen}
        assistant={selectedAssistant as any}
      />

      <KnowledgeFilesDialog
        open={knowledgeFilesDialogOpen}
        onOpenChange={setKnowledgeFilesDialogOpen}
        assistantId={selectedAssistant?.id || 0}
      />

      <AssistantTestDialog
        open={testDialogOpen}
        onOpenChange={setTestDialogOpen}
        assistant={selectedAssistant as any}
      />

      <AssistantsInstructionsDialog
        open={instructionsDialogOpen}
        onOpenChange={setInstructionsDialogOpen}
      />

      <DeleteAssistantDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            // Когда диалог закрывается, обновляем данные
            refreshData();
          }
        }}
        assistantId={selectedAssistant?.id}
        assistantName={selectedAssistant?.name}
      />
    </div>
  );
}
