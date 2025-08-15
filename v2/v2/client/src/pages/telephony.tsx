import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TelephonyConnect } from "@/components/telephony/telephony-connect";
import { ColdCall } from "@/components/telephony/cold-call";
import { useAuth } from "@/contexts/AuthContext";
import { HistoryCall } from "@/components/telephony/history-call";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { IncomingCalls } from "@/components/telephony/incoming-calls";
import { TariffMinutesWarning } from "@/components/telephony/tariff-minutes-warning";
import { PhoneExpirationWarning } from "@/components/telephony/phone-expiration-warning";
import { useFetchConnectedNumber } from "@/hooks/telephony/use-fetch-connected-number";
import { useFetchAvailableMinutes } from "@/hooks/telephony/use-fetch-available-minutes";
import { Sms } from "@/components/telephony/sms";
import { SmsHistory } from "@/components/telephony/sms-history";
import { Book } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { TelephonyInstructions } from "@/components/telephony/telephony-instructions";
import { useQuery } from "@tanstack/react-query";

export default function Telephony() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("calls");
  const [shouldPulse, setShouldPulse] = useState(true);
  const [instructionsDialogOpen, setInstructionsDialogOpen] = useState(false);

  // Проверяем localStorage при загрузке
  useEffect(() => {
    const hasViewedInstructions = localStorage.getItem(
      "telephony-instructions-viewed"
    );
    if (hasViewedInstructions) {
      setShouldPulse(false);
    }
  }, []);

  // Обработчик клика по кнопке инструкций
  const handleInstructionsClick = () => {
    localStorage.setItem("telephony-instructions-viewed", "true");
    setShouldPulse(false);
    setInstructionsDialogOpen(true);
  };

  // Получаем подключенные номера пользователя
  const { data: connectedNumbers } = useFetchConnectedNumber({
    userId: user?.id || 0,
  });

  // Получаем баланс пользователя
  const { data: balanceData } = useQuery({
    queryKey: ["/api/balance", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await fetch(`/api/balance/${user.id}`);
      if (!response.ok) throw new Error("Failed to fetch balance");
      const data = await response.json();
      return data.balance;
    },
    enabled: !!user?.id,
  });

  // Берем первый активный номер для получения информации о минутах
  const firstActiveNumber = connectedNumbers?.find(
    (number) => !number.deactivated && number.can_be_used
  )?.phone_number;

  // Получаем информацию о доступных минутах
  const { data: minutesData } = useFetchAvailableMinutes(firstActiveNumber);

  return (
    <div className="pb-8">
      {/* Кастомный заголовок с кнопкой инструкций */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-2xl font-bold">Голосовой модуль</h1>
            <p className="text-muted-foreground">
              Управление голосовыми звонками и телефонией
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleInstructionsClick}
            title="Инструкция по работе с голосовым модулем"
            className={`${
              shouldPulse
                ? "animate-pulse bg-green-200 hover:bg-green-300"
                : "bg-purple-200 hover:bg-purple-300"
            }`}
          >
            <Book className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Диалог инструкций */}
      <Dialog
        open={instructionsDialogOpen}
        onOpenChange={setInstructionsDialogOpen}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <TelephonyInstructions />
        </DialogContent>
      </Dialog>

      {/* Уведомление о скором отключении номеров */}
      {connectedNumbers && connectedNumbers.length > 0 && (
        <div className="mb-6">
          <PhoneExpirationWarning
            connectedNumbers={connectedNumbers}
            userBalance={balanceData || 0}
          />
        </div>
      )}

      {/* Уведомление о закончившихся минутах - показываем на всей странице */}
      {minutesData && (
        <TariffMinutesWarning availableMinutes={minutesData.availableMinutes} />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 hidden md:block">
          <TabsTrigger value="calls" className="text-xs md:text-base">
            Подключение
          </TabsTrigger>
          <TabsTrigger value="outgoing" className="text-xs md:text-base">
            Исходящие звонки
          </TabsTrigger>
          <TabsTrigger value="incoming" className="text-xs md:text-base">
            Входящие звонки
          </TabsTrigger>
          <TabsTrigger value="historyOutgoing" className="text-xs md:text-base">
            История звонков
          </TabsTrigger>
          <TabsTrigger value="sms" className="text-xs md:text-base">
            СМС
          </TabsTrigger>
          <TabsTrigger value="smsHistory" className="text-xs md:text-base">
            История СМС
          </TabsTrigger>
        </TabsList>

        <div className="flex md:hidden border rounded-md py-1 px-2 bg-gray-100 overflow-x-auto max-w-[340px]">
          <Button
            variant={activeTab === "calls" ? "outline" : "ghost"}
            onClick={() => setActiveTab("calls")}
            className="text-xs"
          >
            Подключение
          </Button>
          <Button
            variant={activeTab === "outgoing" ? "outline" : "ghost"}
            onClick={() => setActiveTab("outgoing")}
            className="text-xs"
          >
            Исходящие звонки
          </Button>
          <Button
            variant={activeTab === "incoming" ? "outline" : "ghost"}
            onClick={() => setActiveTab("incoming")}
            className="text-xs"
          >
            Входящие звонки
          </Button>
          <Button
            variant={activeTab === "historyOutgoing" ? "outline" : "ghost"}
            onClick={() => setActiveTab("historyOutgoing")}
            className="text-xs"
          >
            История звонков
          </Button>
          <Button
            variant={activeTab === "sms" ? "outline" : "ghost"}
            onClick={() => setActiveTab("sms")}
            className="text-xs"
          >
            СМС
          </Button>
          <Button
            variant={activeTab === "smsHistory" ? "outline" : "ghost"}
            onClick={() => setActiveTab("smsHistory")}
            className="text-xs"
          >
            История СМС
          </Button>
        </div>

        <TabsContent value="calls">
          {user?.id && <TelephonyConnect user={user} />}
        </TabsContent>

        <TabsContent value="outgoing">
          {user?.id && user?.plan && <ColdCall user={user} />}
        </TabsContent>

        <TabsContent value="incoming">
          {user?.id && <IncomingCalls user={user} />}
        </TabsContent>

        <TabsContent value="historyOutgoing">
          {user?.id && <HistoryCall user={user} />}
        </TabsContent>

        <TabsContent value="sms">{user?.id && <Sms user={user} />}</TabsContent>

        <TabsContent value="smsHistory">
          {user?.id && <SmsHistory user={user} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
