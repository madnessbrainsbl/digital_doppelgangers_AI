import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertCircle, Upload, Book } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import NotificationsInstructionsDialog from "@/components/notifications/notifications-instructions-dialog";
import EmailTemplatesTab from "@/components/notifications/email-templates-tab";
import EmailStatisticsTab from "@/components/notifications/email-statistics-tab";

// Интерфейс для канала
interface Channel {
  id: number;
  name: string;
  type: string;
  status: string;
  settings?: {
    email?: string;
    password?: string;
    smtpServer?: string;
    smtpPort?: number;
    imapServer?: string;
    imapPort?: number;
    [key: string]: any;
  };
}

// Интерфейс для кампании рассылки
interface Campaign {
  id: number;
  name: string;
  channelType: string;
  channelId: number;
  message: string;
  status: string;
  recipientCount: number;
  createdAt: string;
}

export default function Notifications() {
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [selectedEmailChannel, setSelectedEmailChannel] =
    useState<Channel | null>(null);
  const [selectedSMSChannel, setSelectedSMSChannel] = useState<Channel | null>(
    null
  );
  const [campaignName, setCampaignName] = useState<string>("");
  const [campaignMessage, setCampaignMessage] = useState<string>("");
  const [emailList, setEmailList] = useState<string[]>([]);
  const [phoneList, setPhoneList] = useState<string[]>([]);
  const [hasFile, setHasFile] = useState<boolean>(false);
  const [fileData, setFileData] = useState<File | null>(null);
  const [isEmailActive, setIsEmailActive] = useState<boolean>(false);
  const [isSMSActive, setIsSMSActive] = useState<boolean>(false);
  const [singlePhoneNumber, setSinglePhoneNumber] = useState<string>("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templateType, setTemplateType] = useState<string>("standard");
  const [instructionsDialogOpen, setInstructionsDialogOpen] = useState(false);

  // Запрос на получение всех каналов
  const { data: channels = [], isLoading } = useQuery<Channel[]>({
    queryKey: ["/api/channels"],
  });

  // Фильтрация каналов по типу
  const emailChannels = channels.filter((channel) => channel.type === "email");
  const smsChannels = channels.filter((channel) => channel.type === "sms");

  // Проверка наличия Email-каналов и SMS-каналов
  useEffect(() => {
    setIsEmailActive(emailChannels.length > 0);
    // Обновляем состояние isSMSActive напрямую, так как это не функция setState
    if (smsChannels.length > 0) {
      setIsSMSActive(true);
    } else {
      setIsSMSActive(false);
    }
  }, [emailChannels, smsChannels]);

  // Функция для чтения файла и извлечения email адресов
  const processEmailFile = async (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          if (!e.target || typeof e.target.result !== "string") {
            resolve([]);
            return;
          }

          // Разбиваем текст файла на строки и фильтруем пустые
          const content = e.target.result;
          const lines = content
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

          // Простая валидация email через регулярное выражение
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const validEmails = lines.filter((line) => emailRegex.test(line));

          resolve(validEmails);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error("Не удалось прочитать файл"));
      };

      reader.readAsText(file);
    });
  };

  // Функция для обработки файла с телефонными номерами
  const processPhoneFile = async (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          if (!e.target || typeof e.target.result !== "string") {
            resolve([]);
            return;
          }

          // Разбиваем текст файла на строки и фильтруем пустые
          const content = e.target.result;
          const lines = content
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

          // Нормализуем и валидируем телефонные номера
          const validPhones = lines
            .map((line) => normalizePhoneNumber(line))
            .filter(Boolean) as string[];

          resolve(validPhones);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error("Не удалось прочитать файл"));
      };

      reader.readAsText(file);
    });
  };

  // Функция для нормализации телефонного номера
  const normalizePhoneNumber = (phone: string): string | null => {
    // Удаляем все нецифровые символы
    const digitsOnly = phone.replace(/\D/g, "");

    // Проверяем на российский номер (должно быть 11 цифр)
    if (digitsOnly.length === 11) {
      // Если номер начинается с 8 или 7, форматируем его с +7
      if (digitsOnly.startsWith("8") || digitsOnly.startsWith("7")) {
        return `+7${digitsOnly.substring(1)}`;
      }
    } else if (digitsOnly.length === 10) {
      // Если 10 цифр, считаем что это номер без кода страны, добавляем +7
      return `+7${digitsOnly}`;
    }

    // Если номер не соответствует формату, возвращаем null
    return null;
  };

  // Функция для обработки SMS-канала
  const handleSMSChannelChange = (value: string) => {
    const channelId = parseInt(value);
    const channel = smsChannels.find((ch) => ch.id === channelId) || null;
    setSelectedSMSChannel(channel);
  };

  // Функция для отправки рассылки
  const handleCreateCampaign = async () => {
    // Проверка заполнения обязательных полей
    if (!campaignName || !campaignMessage) {
      toast({
        title: "Ошибка",
        description: "Заполните название и текст рассылки",
        variant: "destructive",
      });
      return;
    }

    // Если выбран Email-канал
    if (selectedChannel === "email") {
      if (!selectedEmailChannel) {
        toast({
          title: "Ошибка",
          description: "Выберите канал Email для отправки",
          variant: "destructive",
        });
        return;
      }

      if (!hasFile || !fileData) {
        toast({
          title: "Ошибка",
          description: "Загрузите файл со списком адресов для рассылки",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);

      try {
        // Обрабатываем файл и получаем список email адресов
        const emails = await processEmailFile(fileData);

        if (emails.length === 0) {
          toast({
            title: "Ошибка",
            description:
              "В загруженном файле не найдено действительных email адресов",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        console.log(
          `Отправка Email рассылки через канал ${selectedEmailChannel.id} на ${emails.length} адресов`
        );

        // Отправляем запрос к API для создания рассылки
        const response = await fetch("/api/campaigns/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            channelId: selectedEmailChannel.id,
            name: campaignName,
            subject: campaignName, // Используем название рассылки как тему письма
            message: campaignMessage,
            recipients: emails, // Массив email адресов
            templateType: templateType, // Выбранный шаблон письма
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Полная информация об ошибке:", errorData);

          // Проверяем наличие ключевых слов, связанных с ошибками аутентификации SMTP
          const errorMsg =
            errorData.error || errorData.message || "Ошибка сервера";

          if (
            errorMsg.includes("EAUTH") ||
            errorMsg.includes("Invalid login") ||
            errorMsg.includes("authentication failed") ||
            errorMsg.includes("NEOBHODIM parol prilozheniya") ||
            errorMsg.includes("Application password is REQUIRED")
          ) {
            throw new Error(
              "Ошибка аутентификации на почтовом сервере. " +
                "Для данного почтового сервиса требуется использовать пароль приложения вместо обычного пароля. " +
                'Откройте "Настройки" канала и обновите пароль на пароль приложения.'
            );
          } else if (
            errorMsg.includes("ESOCKET") ||
            errorMsg.includes("ECONNECTION")
          ) {
            throw new Error(
              "Ошибка соединения с почтовым сервером. Проверьте настройки SMTP."
            );
          } else {
            throw new Error(errorData.message || "Ошибка сервера");
          }
        }

        const result = await response.json();

        // Создаем новую кампанию на основе ответа сервера
        const newCampaign: Campaign = {
          id: Date.now(), // Используем timestamp как временный ID
          name: campaignName,
          channelType: "email",
          channelId: selectedEmailChannel.id,
          message: campaignMessage,
          status: result.success ? "Отправлено" : "Ошибка",
          recipientCount: emails.length,
          createdAt: new Date().toISOString(),
        };

        // Добавляем новую кампанию в список
        setCampaigns([newCampaign, ...campaigns]);

        if (result.success) {
          toast({
            title: "Рассылка создана",
            description: `Рассылка успешно отправлена: ${result.successCount} из ${result.recipientCount} адресов`,
          });

          // Очищаем форму
          resetForm();
        } else {
          // Проверяем, есть ли специфичное сообщение об ошибке
          if (result.errorMessage) {
            toast({
              title: "Ошибка отправки",
              description: result.errorMessage,
              variant: "destructive",
            });
          } else {
            toast({
              title: "Предупреждение",
              description: `Рассылка отправлена с ошибками: успешно ${result.successCount}, с ошибками ${result.failedCount}`,
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error("Ошибка при создании Email рассылки:", error);
        toast({
          title: "Ошибка",
          description:
            error instanceof Error
              ? error.message
              : "Не удалось создать рассылку. Проверьте настройки и попробуйте снова.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    // Если выбран SMS-канал
    else if (selectedChannel === "sms") {
      if (!selectedSMSChannel) {
        toast({
          title: "Ошибка",
          description: "Выберите канал SMS для отправки",
          variant: "destructive",
        });
        return;
      }

      // Получаем список номеров телефонов (из файла или из ручного ввода)
      let phoneNumbers: string[] = [];

      // Если есть номера, добавленные вручную, используем их
      if (phoneList.length > 0) {
        phoneNumbers = [...phoneList];
      }
      // Иначе пробуем получить номера из файла
      else if (hasFile && fileData) {
        setLoading(true);
        try {
          phoneNumbers = await processPhoneFile(fileData);

          if (phoneNumbers.length === 0) {
            toast({
              title: "Ошибка",
              description: "Не найдено действительных номеров телефонов",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error("Ошибка при обработке файла с номерами:", error);
          toast({
            title: "Ошибка",
            description: "Не удалось обработать файл с номерами телефонов",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      } else {
        toast({
          title: "Ошибка",
          description:
            "Добавьте номера телефонов вручную или загрузите файл со списком номеров",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);

      try {
        console.log(
          `Отправка SMS рассылки через канал ${selectedSMSChannel.id} на ${phoneNumbers.length} номеров`
        );

        // Отправляем запрос к API для создания SMS рассылки
        const response = await fetch("/api/campaigns/sms", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            channelId: selectedSMSChannel.id,
            name: campaignName,
            message: campaignMessage,
            recipients: phoneNumbers, // Массив номеров телефонов
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Ошибка SMS рассылки:", errorData);

          const errorMsg =
            errorData.error || errorData.message || "Ошибка сервера";
          throw new Error(`Ошибка SMS рассылки: ${errorMsg}`);
        }

        const result = await response.json();

        // Обрабатываем результат запроса
        const campaignStatus = result.success ? "Отправлено" : "Ошибка";

        // Создаем новую кампанию на основе данных рассылки
        const newCampaign: Campaign = {
          id: result.campaignId || Date.now(), // Используем ID из ответа сервера или timestamp как временный ID
          name: campaignName,
          channelType: "sms",
          channelId: selectedSMSChannel.id,
          message: campaignMessage,
          status: campaignStatus,
          recipientCount: phoneNumbers.length,
          createdAt: new Date().toISOString(),
        };

        // Показываем статус отправки
        toast({
          title: result.success
            ? "SMS-рассылка отправлена"
            : "Отправлено с ошибками",
          description: `Отправлено ${result.successCount} из ${result.recipientCount} сообщений.`,
          variant: result.success ? "default" : "destructive",
        });

        // Добавляем новую кампанию в список
        setCampaigns([newCampaign, ...campaigns]);

        // Очищаем форму
        resetForm();
      } catch (error) {
        console.error("Ошибка при создании SMS рассылки:", error);
        toast({
          title: "Ошибка",
          description:
            error instanceof Error
              ? error.message
              : "Не удалось создать SMS рассылку",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    } else {
      toast({
        title: "Ошибка",
        description: "Выберите канал для отправки рассылки",
        variant: "destructive",
      });
    }
  };

  // Функция для сброса формы
  const resetForm = () => {
    // Общие поля
    setCampaignName("");
    setCampaignMessage("");
    setSelectedChannel("");
    setHasFile(false);
    setFileData(null);

    // Email-специфичные поля
    setSelectedEmailChannel(null);
    setEmailList([]);
    setTemplateType("standard"); // Сбрасываем шаблон на стандартный

    // SMS-специфичные поля
    setSelectedSMSChannel(null);
    setSinglePhoneNumber("");
    setPhoneList([]);

    // Сбрасываем значения input файлов
    const emailFileInput = document.getElementById(
      "email-list"
    ) as HTMLInputElement;
    if (emailFileInput) emailFileInput.value = "";

    const phoneFileInput = document.getElementById(
      "phone-list"
    ) as HTMLInputElement;
    if (phoneFileInput) phoneFileInput.value = "";
  };

  const handleChannelSelection = (type: string) => {
    if (type === "email" && !isEmailActive) {
      toast({
        title: "Канал Email недоступен",
        description:
          "Для использования Email рассылки, необходимо сначала настроить Email-канал в разделе Каналы",
        variant: "destructive",
      });
      return;
    }

    setSelectedChannel(selectedChannel === type ? "" : type);
  };

  const handleEmailChannelChange = (value: string) => {
    const channelId = parseInt(value);
    const channel = emailChannels.find((ch) => ch.id === channelId) || null;
    setSelectedEmailChannel(channel);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFileData(file);
      setHasFile(true);

      // Проверяем расширение файла
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      if (fileExtension !== "csv" && fileExtension !== "txt") {
        toast({
          title: "Неподдерживаемый формат",
          description: "Пожалуйста, загрузите файл в формате .csv или .txt",
          variant: "destructive",
        });
        return;
      }

      // Если загрузка происходит в SMS-канале, отображаем соответствующее сообщение
      if (selectedChannel === "sms") {
        toast({
          title: "Файл загружен",
          description: "Файл со списком телефонных номеров успешно загружен",
        });
      } else {
        toast({
          title: "Файл загружен",
          description: "Файл со списком адресов для рассылки успешно загружен",
        });
      }
    }
  };

  // Функция обработки телефонного номера, введенного вручную
  const handleAddSinglePhone = () => {
    if (!singlePhoneNumber) {
      toast({
        title: "Ошибка",
        description: "Введите номер телефона",
        variant: "destructive",
      });
      return;
    }

    // Нормализуем телефонный номер
    const normalizedPhone = normalizePhoneNumber(singlePhoneNumber);

    if (!normalizedPhone) {
      toast({
        title: "Ошибка формата",
        description:
          "Введен некорректный формат телефонного номера. Поддерживаются только российские номера.",
        variant: "destructive",
      });
      return;
    }

    // Добавляем номер в список
    setPhoneList([...phoneList, normalizedPhone]);

    // Очищаем поле ввода
    setSinglePhoneNumber("");

    toast({
      title: "Номер добавлен",
      description: `Номер ${normalizedPhone} добавлен в список для рассылки`,
    });
  };

  return (
    <div className="px-4 sm:px-6">
      {/* Кастомный заголовок с кнопкой инструкций */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-2xl font-bold">Рассылки</h1>
            <p className="text-muted-foreground">
              Управление рассылками и уведомлениями
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setInstructionsDialogOpen(true)}
            title="Инструкция по работе с рассылками"
            className="bg-purple-200 hover:bg-purple-300"
          >
            <Book className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList className="mb-6 w-full overflow-x-auto">
          <TabsTrigger value="campaigns" className="flex-1">
            Рассылки
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex-1">
            Шаблоны
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex-1">
            Статистика
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          {/* New Campaign Form */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Создать новую рассылку</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="campaign-name"
                    className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >
                    Название рассылки
                  </label>
                  <Input
                    id="campaign-name"
                    placeholder="Например: Анонс нового продукта"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Каналы рассылки
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={
                        selectedChannel === "email" ? "default" : "outline"
                      }
                      size="sm"
                      className={`gap-1 py-1 ${
                        isEmailActive ? "" : "opacity-50 cursor-not-allowed"
                      }`}
                      onClick={() => handleChannelSelection("email")}
                    >
                      <span className="material-icons text-[18px]">email</span>
                      <span>Email</span>
                    </Button>
                    <Button
                      variant={
                        selectedChannel === "sms" ? "default" : "outline"
                      }
                      size="sm"
                      className={`gap-1 py-1 ${
                        isSMSActive ? "" : "opacity-50 cursor-not-allowed"
                      }`}
                      onClick={() => {
                        if (!isSMSActive) {
                          toast({
                            title: "Канал SMS недоступен",
                            description:
                              "Для использования SMS рассылки, необходимо сначала настроить SMS-канал в разделе Каналы",
                            variant: "destructive",
                          });
                          return;
                        }
                        handleChannelSelection("sms");
                      }}
                    >
                      <span className="material-icons text-[18px]">sms</span>
                      <span>SMS</span>
                    </Button>
                    <Button
                      variant={
                        selectedChannel === "telegram" ? "default" : "outline"
                      }
                      size="sm"
                      className="gap-1 py-1 opacity-50 cursor-not-allowed"
                      onClick={() =>
                        toast({
                          title: "Канал недоступен",
                          description:
                            "Telegram канал будет доступен в ближайшем обновлении",
                        })
                      }
                    >
                      <span className="material-icons text-[18px]">
                        telegram
                      </span>
                      <span>Telegram</span>
                    </Button>
                    <Button
                      variant={
                        selectedChannel === "viber" ? "default" : "outline"
                      }
                      size="sm"
                      className="gap-1 py-1 opacity-50 cursor-not-allowed"
                      onClick={() =>
                        toast({
                          title: "Канал недоступен",
                          description:
                            "Viber канал будет доступен в ближайшем обновлении",
                        })
                      }
                    >
                      <span className="material-icons text-[18px]">
                        language
                      </span>
                      <span>Viber</span>
                    </Button>
                  </div>
                </div>

                {/* Дополнительные настройки для SMS канала */}
                {selectedChannel === "sms" && isSMSActive && (
                  <div className="space-y-4 border rounded-md p-4 bg-muted/30">
                    <Alert className="mb-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <AlertDescription className="text-xs sm:text-sm">
                        Выберите SMS-канал, с которого будет осуществляться
                        рассылка.
                        <br />
                        <span className="text-amber-600 font-medium">
                          Важно!
                        </span>{" "}
                        Убедитесь, что на счету SMS-сервиса достаточно средств
                        для отправки сообщений.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label htmlFor="sms-channel">Выберите канал SMS</Label>
                      <Select onValueChange={handleSMSChannelChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите SMS канал" />
                        </SelectTrigger>
                        <SelectContent>
                          {smsChannels.map((channel) => (
                            <SelectItem
                              key={channel.id}
                              value={channel.id.toString()}
                            >
                              {channel.name} ({channel.settings?.email || ""})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedSMSChannel && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone-input">
                            Введите номер телефона
                          </Label>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <Input
                              id="phone-input"
                              placeholder="+7 (999) 123-45-67"
                              value={singlePhoneNumber}
                              onChange={(e) =>
                                setSinglePhoneNumber(e.target.value)
                              }
                              className="flex-1"
                            />
                            <Button
                              variant="outline"
                              onClick={handleAddSinglePhone}
                              className="w-full sm:w-auto"
                            >
                              Добавить
                            </Button>
                          </div>
                          <p className="text-xs text-neutral-500">
                            Введите номер телефона в любом формате, система
                            автоматически преобразует его в международный формат
                          </p>

                          {/* Список добавленных номеров */}
                          {phoneList.length > 0 && (
                            <div className="mt-3">
                              <Label>
                                Добавленные номера ({phoneList.length})
                              </Label>
                              <div className="mt-1 flex flex-wrap gap-2 border p-2 rounded-md max-h-24 overflow-y-auto">
                                {phoneList.map((phone, index) => (
                                  <div
                                    key={index}
                                    className="bg-secondary text-secondary-foreground text-sm rounded px-2 py-1 flex items-center gap-1"
                                  >
                                    <span>{phone}</span>
                                    <button
                                      className="text-muted-foreground hover:text-foreground transition-colors"
                                      onClick={() =>
                                        setPhoneList(
                                          phoneList.filter(
                                            (_, i) => i !== index
                                          )
                                        )
                                      }
                                      aria-label="Удалить номер"
                                    >
                                      <span className="material-icons text-[16px]">
                                        close
                                      </span>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="text-center text-sm text-neutral-500">
                          — ИЛИ —
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone-list">
                            Загрузить список номеров
                          </Label>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <Input
                              id="phone-list"
                              type="file"
                              accept=".csv,.txt"
                              onChange={handleFileUpload}
                              className="flex-1"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="w-full sm:w-auto h-10 sm:h-10"
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-neutral-500">
                            Поддерживаемые форматы: .csv, .txt. Каждый номер
                            должен быть на новой строке.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Дополнительные настройки для Email канала */}
                {selectedChannel === "email" && isEmailActive && (
                  <div className="space-y-4 border rounded-md p-4 bg-muted/30">
                    <Alert className="mb-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <AlertDescription className="text-xs sm:text-sm">
                        Выберите почтовый канал, с которого будет осуществляться
                        рассылка.
                        <br />
                        <span className="text-amber-600 font-medium">
                          Важно!
                        </span>{" "}
                        Для большинства почтовых сервисов необходимо
                        использовать пароль приложения, а не обычный пароль от
                        почты.
                        <br />
                        <div className="mt-1">
                          <details className="cursor-pointer">
                            <summary className="text-blue-500 hover:underline text-sm">
                              Инструкции по созданию пароля приложения
                            </summary>
                            <div className="pl-4 mt-1 text-sm border-l-2 border-gray-200 ml-2">
                              <ul className="list-disc pl-5 text-sm space-y-1 mt-1">
                                <li>
                                  <a
                                    href="https://help.mail.ru/mail/security/protection/external"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline"
                                  >
                                    Mail.ru
                                  </a>
                                </li>
                                <li>
                                  <a
                                    href="https://yandex.ru/support/id/authorization/app-passwords.html"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline"
                                  >
                                    Яндекс
                                  </a>
                                </li>
                                <li>
                                  <a
                                    href="https://support.google.com/accounts/answer/185833"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline"
                                  >
                                    Gmail
                                  </a>
                                </li>
                                <li>
                                  <a
                                    href="https://support.microsoft.com/ru-ru/account-billing/использование-паролей-приложений-с-приложениями-которым-требуется-двухэтапная-проверка-5896ed9b-4263-e681-128a-a6f2979a7944"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline"
                                  >
                                    Outlook/Hotmail
                                  </a>
                                </li>
                              </ul>
                            </div>
                          </details>
                        </div>
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label htmlFor="email-channel">
                        Выберите канал Email
                      </Label>
                      <Select onValueChange={handleEmailChannelChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите почтовый канал" />
                        </SelectTrigger>
                        <SelectContent>
                          {emailChannels.map((channel) => (
                            <SelectItem
                              key={channel.id}
                              value={channel.id.toString()}
                            >
                              {channel.name} ({channel.settings?.email || ""})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedEmailChannel && (
                      <div className="space-y-2">
                        <Label htmlFor="email-list">
                          Загрузить список адресов
                        </Label>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <Input
                            id="email-list"
                            type="file"
                            accept=".csv,.txt"
                            onChange={handleFileUpload}
                            className="flex-1"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="w-full sm:w-auto h-10 sm:h-10"
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-neutral-500">
                          Поддерживаемые форматы: .csv, .txt. Каждый адрес
                          должен быть на новой строке.
                        </p>
                      </div>
                    )}

                    {/* Выбор шаблона письма */}
                    <div className="space-y-2 mt-4">
                      <Label>Шаблон письма</Label>
                      <RadioGroup
                        value={templateType}
                        onValueChange={setTemplateType}
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
                      >
                        <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/30">
                          <RadioGroupItem
                            value="standard"
                            id="template-standard"
                          />
                          <Label
                            htmlFor="template-standard"
                            className="font-normal flex flex-col"
                          >
                            <span className="font-medium">Стандартный</span>
                            <span className="text-xs text-muted-foreground">
                              Простой и элегантный шаблон
                            </span>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/30">
                          <RadioGroupItem value="info" id="template-info" />
                          <Label
                            htmlFor="template-info"
                            className="font-normal flex flex-col"
                          >
                            <span className="font-medium">Информационный</span>
                            <span className="text-xs text-muted-foreground">
                              С выделенным информационным блоком
                            </span>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/30">
                          <RadioGroupItem
                            value="marketing"
                            id="template-marketing"
                          />
                          <Label
                            htmlFor="template-marketing"
                            className="font-normal flex flex-col"
                          >
                            <span className="font-medium">Маркетинговый</span>
                            <span className="text-xs text-muted-foreground">
                              С кнопкой призыва к действию
                            </span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label
                    htmlFor="campaign-message"
                    className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >
                    Текст сообщения
                  </label>
                  <Textarea
                    id="campaign-message"
                    placeholder="Введите текст рассылки..."
                    className="min-h-32"
                    value={campaignMessage}
                    onChange={(e) => setCampaignMessage(e.target.value)}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleCreateCampaign}
                    disabled={loading}
                    className="w-full sm:w-auto"
                  >
                    {loading ? (
                      <>
                        <span className="material-icons text-[18px] mr-1 animate-spin">
                          refresh
                        </span>
                        <span>Отправка...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-icons text-[18px] mr-1">
                          send
                        </span>
                        <span>Создать рассылку</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle>Недавние рассылки</CardTitle>
            </CardHeader>
            <CardContent>
              {campaigns.length > 0 ? (
                <div className="space-y-4">
                  {campaigns.map((campaign) => {
                    let channel;
                    let channelName = "Неизвестный канал";
                    let channelIdentifier = "";
                    let channelIcon = "alternate_email";

                    // Определяем канал в зависимости от типа кампании
                    if (campaign.channelType === "email") {
                      channel = emailChannels.find(
                        (ch) => ch.id === campaign.channelId
                      );
                      channelName = channel
                        ? channel.name
                        : "Неизвестный канал";
                      channelIdentifier = channel?.settings?.email || "";
                      channelIcon = "alternate_email";
                    } else if (campaign.channelType === "sms") {
                      channel = smsChannels.find(
                        (ch) => ch.id === campaign.channelId
                      );
                      channelName = channel
                        ? channel.name
                        : "Неизвестный канал";
                      channelIdentifier = channel?.settings?.sender || "SMS";
                      channelIcon = "sms";
                    }

                    // Форматирование даты
                    const date = new Date(campaign.createdAt);
                    const formattedDate = new Intl.DateTimeFormat("ru", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(date);

                    // Определяем цвет статуса
                    let statusColorClass = "";
                    if (campaign.status === "Отправлено") {
                      statusColorClass =
                        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
                    } else if (campaign.status === "В обработке") {
                      statusColorClass =
                        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
                    } else {
                      statusColorClass =
                        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
                    }

                    return (
                      <div
                        key={campaign.id}
                        className="border rounded-md p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between mb-2 gap-1">
                          <div className="font-medium">{campaign.name}</div>
                          <div className="text-sm text-neutral-500">
                            {formattedDate}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 text-sm mb-2">
                          <span className="flex items-center gap-1">
                            <span className="material-icons text-[16px] text-neutral-400">
                              {channelIcon}
                            </span>
                            <span className="text-neutral-600">
                              {channelName}{" "}
                              {channelIdentifier
                                ? `(${channelIdentifier})`
                                : ""}
                            </span>
                          </span>
                          <span className="flex items-center gap-1 sm:ml-4">
                            <span className="material-icons text-[16px] text-neutral-400">
                              people
                            </span>
                            <span className="text-neutral-600">
                              {campaign.recipientCount} получателей
                            </span>
                          </span>
                        </div>

                        <div className="text-sm text-neutral-700 dark:text-neutral-300 bg-muted/20 p-2 rounded-md line-clamp-2 mb-2">
                          {campaign.message}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs ${statusColorClass} w-fit`}
                          >
                            {campaign.status}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="w-full sm:w-auto"
                          >
                            <span className="material-icons text-[16px] mr-1">
                              analytics
                            </span>
                            <span className="text-xs">Статистика</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <span className="material-icons text-4xl text-neutral-300 dark:text-neutral-600 mb-2">
                    campaign
                  </span>
                  <p className="text-neutral-500 dark:text-neutral-400">
                    У вас пока нет активных рассылок
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <EmailTemplatesTab />
        </TabsContent>

        <TabsContent value="analytics">
          <EmailStatisticsTab />
        </TabsContent>
      </Tabs>

      {/* Dialog for instructions */}
      <NotificationsInstructionsDialog
        open={instructionsDialogOpen}
        onOpenChange={setInstructionsDialogOpen}
      />
    </div>
  );
}
