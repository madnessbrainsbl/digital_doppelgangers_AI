import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { CallingNumbers } from "./calling-numbers";
import { Textarea } from "../ui/textarea";
import { useFetchUserAssistants } from "@/hooks/assistants/use-fetch-user-assistants";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { useFetchConnectedNumber } from "@/hooks/telephony/use-fetch-connected-number";
import { FunctionForCalling } from "./function-for-calling";
import { useFetchNotificationChannelsAndFunctions } from "@/hooks/telephony/use-fetch-notification-channels-and-functions";
import { formatFunctionName } from "@/lib/utils/format-function-name";
import { TariffActivationBanner } from "./tariff-activation-banner";
import { User } from "@/hooks/telephony/type";
import { PhoneNumberSelector } from "./phone-number-selector";
import { AssistantWarning } from "./assistant-warning";

// Минимальные требования для формы
const MIN_SCRIPT_LENGTH = 10; // Минимальная длина сценария

// Константы для расчета стоимости
const CALL_PRICE_PER_MINUTE = 5; // 5 рублей за минуту
const AVERAGE_CALL_DURATION = 3; // 3 минуты на звонок

export function ColdCall({ user }: { user: User }) {
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([]);
  const [callScript, setCallScript] = useState<string>("");
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>("");
  const [selectedCallerNumber, setSelectedCallerNumber] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const callingNumbersRef = useRef<{
    getPhoneNumbers: () => string[];
    clearPhoneNumbers: () => void;
  }>(null);
  const [callType, setCallType] = useState<"simple" | "function">("simple");
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");
  const [selectedFunctionId, setSelectedFunctionId] = useState<string>("");
  const functionForCallingRef = useRef<{
    getSelectedChannelId: () => string;
    getSelectedFunctionId: () => string;
  }>(null);

  // Используем хук для получения ассистентов
  const {
    data: assistants,
    isLoading: isLoadingAssistants,
    isError: isAssistantsError,
    error: assistantsError,
    refetch: refetchAssistants,
  } = useFetchUserAssistants({
    userId: user.id,
    enabled: true, // Всегда запрашиваем ассистентов
  });

  // Используем хук для получения подключенных номеров
  const {
    data: connectedNumbers,
    isLoading: isLoadingNumbers,
    isError: isNumbersError,
    error: numbersError,
    refetch: refetchNumbers,
  } = useFetchConnectedNumber({
    userId: user.id,
  });

  // Используем хук для получения каналов оповещения и функций
  const {
    data: channelsAndFunctions,
    isLoading: isLoadingChannelsAndFunctions,
    isError: isChannelsAndFunctionsError,
    refetch: refetchChannelsAndFunctions,
  } = useFetchNotificationChannelsAndFunctions({
    userId: user.id,
    enabled: callType === "function", // Запрашиваем только если выбран тип "function"
  });

  // Получаем номера из компонента CallingNumbers
  const updatePhoneNumbers = () => {
    if (callingNumbersRef.current) {
      const numbers = callingNumbersRef.current.getPhoneNumbers();
      setPhoneNumbers(numbers);
    }
  };

  // Обновляем выбранные каналы и функции
  const updateSelectedChannelAndFunction = () => {
    if (functionForCallingRef.current && callType === "function") {
      setSelectedChannelId(
        functionForCallingRef.current.getSelectedChannelId()
      );
      setSelectedFunctionId(
        functionForCallingRef.current.getSelectedFunctionId()
      );
    }
  };

  // Обновляем список номеров при монтировании компонента
  useEffect(() => {
    updatePhoneNumbers();
  }, []);

  // Обновляем выбранные каналы и функции каждые 500 мс, если выбран тип "function"
  useEffect(() => {
    if (callType !== "function") return;

    updateSelectedChannelAndFunction();

    const intervalId = setInterval(() => {
      updateSelectedChannelAndFunction();
    }, 500);

    return () => clearInterval(intervalId);
  }, [callType]);

  // Функция для расчета стоимости обзвона
  const calculateCallCost = () => {
    return CALL_PRICE_PER_MINUTE * AVERAGE_CALL_DURATION * phoneNumbers.length;
  };

  // Проверка достаточности баланса
  const isBalanceSufficient = () => {
    return (user.balance || 0) >= calculateCallCost();
  };

  // Проверяем валидность формы
  const isFormValid =
    selectedAssistantId &&
    selectedCallerNumber &&
    phoneNumbers.length > 0 &&
    callScript.trim().length >= MIN_SCRIPT_LENGTH &&
    (callType !== "function" || (selectedChannelId && selectedFunctionId));

  // Форматируем объект функции для Voximplant
  const formatFunctionObject = (selectedFunc: any) => {
    if (!selectedFunc) return null;

    // Создаем объект в требуемом формате
    const funcObj = {
      type: "function",
      name: formatFunctionName(selectedFunc.name),
      description: selectedFunc.description || "",
      parameters: selectedFunc.parameters || {
        type: "object",
        required: [],
        properties: {},
      },
    };

    // Проверяем, что объект имеет правильную структуру
    if (!funcObj.parameters.type) {
      funcObj.parameters.type = "object";
    }

    if (!Array.isArray(funcObj.parameters.required)) {
      funcObj.parameters.required = [];
    }

    if (
      !funcObj.parameters.properties ||
      typeof funcObj.parameters.properties !== "object"
    ) {
      funcObj.parameters.properties = {};
    }

    return funcObj;
  };

  const handleStartCalling = async () => {
    // Обновляем номера перед проверкой
    updatePhoneNumbers();
    updateSelectedChannelAndFunction();

    if (phoneNumbers.length === 0) {
      toast({
        title: "Нет номеров для обзвона",
        description: "Добавьте номера через файл или вручную",
        variant: "destructive",
      });
      return;
    }

    if (!selectedAssistantId) {
      toast({
        title: "Не выбран ассистент",
        description: "Выберите ассистента для выполнения обзвона",
        variant: "destructive",
      });
      return;
    }

    if (callScript.trim().length < MIN_SCRIPT_LENGTH) {
      toast({
        title: "Слишком короткий сценарий",
        description: `Сценарий должен содержать не менее ${MIN_SCRIPT_LENGTH} символов`,
        variant: "destructive",
      });
      return;
    }

    if (!selectedCallerNumber) {
      toast({
        title: "Не выбран номер для звонка",
        description: "Выберите номер, с которого будет совершаться обзвон",
        variant: "destructive",
      });
      return;
    }

    if (
      callType === "function" &&
      (!selectedChannelId || !selectedFunctionId)
    ) {
      toast({
        title: "Не выбран канал или функция",
        description:
          "Для обзвона с функцией необходимо выбрать канал оповещения и функцию",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Получаем информацию о выбранном ассистенте
      const selectedAssistant = assistants?.find(
        (a) => a.openaiAssistantId === selectedAssistantId
      );

      if (!selectedAssistant) {
        throw new Error("Выбранный ассистент не найден");
      }

      // Получаем информацию о выбранном канале и функции, если выбран тип "function"
      let selectedChannel = null;
      let selectedFunc = null;

      if (callType === "function" && channelsAndFunctions) {
        selectedChannel = channelsAndFunctions.notificationChannels.find(
          (channel) => channel.id.toString() === selectedChannelId
        );

        selectedFunc = channelsAndFunctions.userFunctions.find(
          (func) => func.id.toString() === selectedFunctionId
        );
      }

      // Форматируем объект функции
      const formattedFuncObj = formatFunctionObject(selectedFunc);

      // Подготавливаем данные для запуска обзвона
      const callData = {
        phoneNumbers: phoneNumbers,
        assistantId: selectedAssistantId,
        assistantName: selectedAssistant.name,
        callScript: callScript,
        userId: user.id,
        callerNumber: selectedCallerNumber,
        callType: callType,
        // Добавляем данные о канале и функции, если выбран тип "function"
        ...(callType === "function" && {
          chatidTg: selectedChannel?.settings.chatId,
          tokenTg: selectedChannel?.settings.botToken,
          // Добавляем отформатированный объект функции
          funcObj: formattedFuncObj,
        }),
      };

      // Получаем токен авторизации из localStorage
      const token = localStorage.getItem("auth_token");

      // Отправляем запрос на сервер для запуска обзвона
      const response = await axios.post(
        "/api/telephony/start-cold-call",
        callData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        toast({
          title: "Обзвон запущен",
          description: `Начат обзвон ${
            phoneNumbers.length
          } номеров с использованием ассистента "${selectedAssistant.name}"${
            callType === "function" ? " и функцией" : ""
          }`,
        });

        // Очищаем форму после успешного запуска обзвона
        if (callingNumbersRef.current) {
          // Очищаем список номеров
          callingNumbersRef.current.clearPhoneNumbers();
          setPhoneNumbers([]);
        }

        // Очищаем сценарий звонка
        setCallScript("");

        // Сбрасываем выбранные значения
        setCallType("simple");

        // Не сбрасываем выбранный номер для звонка и ассистента,
        // так как пользователь, скорее всего, будет использовать их повторно
      } else {
        throw new Error(response.data.message || "Не удалось запустить обзвон");
      }
    } catch (error: any) {
      toast({
        title: "Ошибка запуска обзвона",
        description: error.message || "Произошла ошибка при запуске обзвона",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (user.plan === "free" || user.plan === "basic") {
    return <TariffActivationBanner />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Холодный обзвон</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <CallingNumbers
            ref={callingNumbersRef}
            onNumbersChange={setPhoneNumbers}
            userBalance={(user.balance || 0) / 100}
            totalCost={calculateCallCost()}
          />

          <div className="space-y-2">
            <PhoneNumberSelector
              selectedPhoneNumber={selectedCallerNumber}
              onPhoneNumberChange={setSelectedCallerNumber}
              connectedNumbers={connectedNumbers || []}
              isLoadingNumbers={isLoadingNumbers}
              isNumbersError={isNumbersError}
              refetchNumbers={refetchNumbers}
              title="Выбор номера для звонка"
              placeholder="Выберите номер для звонка"
              smsOnly={false}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Сценарий звонка
            </h3>
            <div className="space-y-2">
              <div className="flex flex-col items-center space-x-2">
                <Textarea
                  id="template"
                  rows={7}
                  placeholder={`Введите сценарий звонка (минимум ${MIN_SCRIPT_LENGTH} символов)`}
                  onChange={(e) => setCallScript(e.target.value)}
                  value={callScript}
                />
                {callScript.trim().length > 0 &&
                  callScript.trim().length < MIN_SCRIPT_LENGTH && (
                    <div className="w-full text-xs text-amber-500 mt-1">
                      Минимальная длина сценария: {MIN_SCRIPT_LENGTH} символов.
                      Осталось: {MIN_SCRIPT_LENGTH - callScript.trim().length}
                    </div>
                  )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Тип обзвона
            </h3>
            <div className="flex gap-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  value="simple"
                  checked={callType === "simple"}
                  onChange={() => setCallType("simple")}
                  id="simple"
                />
                <label htmlFor="simple">Простой обзвон</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  value="function"
                  checked={callType === "function"}
                  onChange={() => setCallType("function")}
                  id="function"
                />
                <label htmlFor="function">Обзвон с функцией</label>
              </div>
            </div>

            {callType === "function" && (
              <FunctionForCalling
                userId={user.id}
                ref={functionForCallingRef}
              />
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Выбор ассистента
            </h3>
            <div className="relative">
              {isLoadingAssistants ? (
                <div className="flex items-center space-x-2 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />
                  <span className="text-sm text-neutral-500">
                    Загрузка ассистентов...
                  </span>
                </div>
              ) : isAssistantsError ? (
                <div className="text-sm text-red-500 py-2 flex justify-between">
                  <span>Ошибка при загрузке ассистентов</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => refetchAssistants()}
                    className="text-xs"
                  >
                    Повторить
                  </Button>
                </div>
              ) : !assistants || assistants.length === 0 ? (
                <AssistantWarning />
              ) : (
                <>
                  <select
                    className="w-full border border-neutral-300 dark:border-neutral-600 rounded-md py-2 px-3 pr-10 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none "
                    value={selectedAssistantId}
                    onChange={(e) => setSelectedAssistantId(e.target.value)}
                  >
                    <option value="">Выберите ассистента</option>
                    {assistants.map((assistant) => (
                      <option
                        key={assistant.openaiAssistantId}
                        value={assistant.openaiAssistantId}
                      >
                        {assistant.name}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 material-icons text-neutral-400 pointer-events-none">
                    expand_more
                  </span>
                </>
              )}
            </div>
          </div>

          <Button
            onClick={handleStartCalling}
            disabled={
              isLoadingAssistants ||
              isAssistantsError ||
              !assistants ||
              assistants.length === 0 ||
              !selectedAssistantId ||
              isLoadingNumbers ||
              isNumbersError ||
              !connectedNumbers ||
              connectedNumbers.length === 0 ||
              !selectedCallerNumber ||
              phoneNumbers.length === 0 ||
              callScript.trim().length < MIN_SCRIPT_LENGTH ||
              (callType === "function" &&
                (!selectedChannelId || !selectedFunctionId)) ||
              isLoading ||
              (phoneNumbers.length > 0 && !isBalanceSufficient())
            }
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span>Запуск...</span>
              </>
            ) : (
              <>
                <span className="material-icons text-[18px] mr-1">call</span>
                <span>Запустить обзвон</span>
              </>
            )}
          </Button>

          {/* Информация о минимальных требованиях */}
          <div className="text-xs text-neutral-500 border-t pt-4 mt-2">
            <p className="font-medium mb-1">
              Минимальные требования для запуска обзвона:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li
                className={
                  selectedCallerNumber ? "text-green-500" : "text-red-500"
                }
              >
                Выбран номер для звонка
              </li>
              <li
                className={
                  selectedAssistantId ? "text-green-500" : "text-red-500"
                }
              >
                Выбран ассистент
              </li>
              <li
                className={
                  phoneNumbers.length > 0 ? "text-green-500" : "text-red-500"
                }
              >
                Добавлен хотя бы один номер для обзвона
              </li>
              <li
                className={
                  callScript.trim().length >= MIN_SCRIPT_LENGTH
                    ? "text-green-500"
                    : "text-red-500"
                }
              >
                Сценарий содержит не менее {MIN_SCRIPT_LENGTH} символов
              </li>
              {callType === "function" && (
                <>
                  <li
                    className={
                      selectedChannelId ? "text-green-500" : "text-red-500"
                    }
                  >
                    Выбран канал оповещения
                  </li>
                  <li
                    className={
                      selectedFunctionId ? "text-green-500" : "text-red-500"
                    }
                  >
                    Выбрана функция
                  </li>
                </>
              )}
              <li
                className={
                  phoneNumbers.length > 0 && isBalanceSufficient()
                    ? "text-green-500"
                    : "text-red-500"
                }
              >
                Достаточно средств на балансе
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
