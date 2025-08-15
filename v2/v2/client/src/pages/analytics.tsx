import { useState } from "react";
import PageHeader from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import OverviewTab from "@/components/analytics/overview-tab";
import ConversationsTab from "@/components/analytics/conversations-tab";
import AssistantsTab from "@/components/analytics/assistants-tab";
import TopicsTab from "@/components/analytics/topics-tab";
import EmailCampaignsTab from "@/components/analytics/email-campaigns-tab";
import AnalyticsInstructionsDialog from "@/components/analytics/analytics-instructions-dialog";
import { Book } from "lucide-react";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("week");
  const [tabValue, setTabValue] = useState("overview");
  const [instructionsDialogOpen, setInstructionsDialogOpen] = useState(false);

  // Обработчик изменения периода
  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-2xl font-bold">Аналитика</h1>
            <p className="text-muted-foreground">
              Обзор статистики и показателей эффективности ассистентов
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setInstructionsDialogOpen(true)}
            title="Инструкция по работе с аналитикой"
            className="bg-purple-200 hover:bg-purple-300"
          >
            <Book className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* мобильная версия */}
      <div className="block md:hidden">
        <div className="border rounded p-2 overflow-x-auto">
          <div className="flex gap-2 w-[300px]">
            <button
              value={"overview"}
              type="button"
              className={`rounded-md px-3 pb-1 whitespace-nowrap transition-colors ${
                tabValue === "overview"
                  ? "bg-blue-500 text-white"
                  : "bg-neutral-200 text-neutral-700"
              }`}
              onClick={() => setTabValue("overview")}
            >
              Обзор
            </button>
            <button
              value={"conversations"}
              type="button"
              className={`rounded-md px-3 pb-1 whitespace-nowrap transition-colors ${
                tabValue === "conversations"
                  ? "bg-blue-500 text-white"
                  : "bg-neutral-200 text-neutral-700"
              }`}
              onClick={() => setTabValue("conversations")}
            >
              Диалоги
            </button>
            <button
              value={"assistants"}
              type="button"
              className={`rounded-md px-3 pb-1 whitespace-nowrap transition-colors ${
                tabValue === "assistants"
                  ? "bg-blue-500 text-white"
                  : "bg-neutral-200 text-neutral-700"
              }`}
              onClick={() => setTabValue("assistants")}
            >
              Ассистенты
            </button>
            <button
              value={"topics"}
              type="button"
              className={`rounded-md px-3 pb-1 whitespace-nowrap transition-colors ${
                tabValue === "topics"
                  ? "bg-blue-500 text-white"
                  : "bg-neutral-200 text-neutral-700"
              }`}
              onClick={() => setTabValue("topics")}
            >
              Темы
            </button>
            <button
              value={"email-campaigns"}
              type="button"
              className={`rounded-md px-3 pb-1 whitespace-nowrap transition-colors ${
                tabValue === "email-campaigns"
                  ? "bg-blue-500 text-white"
                  : "bg-neutral-200 text-neutral-700"
              }`}
              onClick={() => setTabValue("email-campaigns")}
            >
              Рассылки
            </button>
          </div>
        </div>

        {tabValue === "overview" && (
          <OverviewTab
            timeRange={timeRange}
            handleTimeRangeChange={handleTimeRangeChange}
          />
        )}

        {tabValue === "conversations" && (
          <div className="mt-4">
            <ConversationsTab
              timeRange={timeRange}
              handleTimeRangeChange={handleTimeRangeChange}
            />
          </div>
        )}

        {tabValue === "assistants" && (
          <div className="mt-4">
            <AssistantsTab />
          </div>
        )}

        {tabValue === "topics" && (
          <div className="mt-4">
            <TopicsTab
              timeRange={timeRange}
              handleTimeRangeChange={handleTimeRangeChange}
            />
          </div>
        )}

        {tabValue === "email-campaigns" && (
          <div className="mt-4">
            <EmailCampaignsTab
              timeRange={timeRange}
              handleTimeRangeChange={handleTimeRangeChange}
            />
          </div>
        )}
      </div>

      {/* десктопная версия */}
      <Tabs
        defaultValue="overview"
        onValueChange={setTabValue}
        className="hidden md:block"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="conversations">Диалоги</TabsTrigger>
          <TabsTrigger value="assistants">Ассистенты</TabsTrigger>
          <TabsTrigger value="topics">Темы</TabsTrigger>
          <TabsTrigger value="email-campaigns">Рассылки</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab
            timeRange={timeRange}
            handleTimeRangeChange={handleTimeRangeChange}
          />
        </TabsContent>

        <TabsContent value="conversations">
          <ConversationsTab
            timeRange={timeRange}
            handleTimeRangeChange={handleTimeRangeChange}
          />
        </TabsContent>

        <TabsContent value="assistants">
          <AssistantsTab />
        </TabsContent>

        <TabsContent value="topics">
          <TopicsTab
            timeRange={timeRange}
            handleTimeRangeChange={handleTimeRangeChange}
          />
        </TabsContent>

        <TabsContent value="email-campaigns">
          <EmailCampaignsTab
            timeRange={timeRange}
            handleTimeRangeChange={handleTimeRangeChange}
          />
        </TabsContent>
      </Tabs>

      {/* Диалог инструкций */}
      <AnalyticsInstructionsDialog
        open={instructionsDialogOpen}
        onOpenChange={setInstructionsDialogOpen}
      />
    </div>
  );
}
