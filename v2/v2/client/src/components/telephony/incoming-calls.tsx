import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { useFetchConnectedNumber } from "@/hooks/telephony/use-fetch-connected-number";
import { useFetchUserAssistants } from "@/hooks/assistants/use-fetch-user-assistants";
import { useFetchNotificationChannelsAndFunctions } from "@/hooks/telephony/use-fetch-notification-channels-and-functions";
import { useFetchIncomingParams } from "@/hooks/telephony/use-fetch-incoming-params";
import { useSaveIncomingParams } from "@/hooks/telephony/use-save-incoming-params";
import { useDeleteIncomingParams } from "@/hooks/telephony/use-delete-incoming-params";
import { toast } from "@/hooks/use-toast";
import { TariffActivationBanner } from "./tariff-activation-banner";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { Textarea } from "../ui/textarea";
import { User } from "@/hooks/telephony/type";
import { PhoneNumberSelector } from "./phone-number-selector";
import { AssistantWarning } from "./assistant-warning";

export function IncomingCalls({ user }: { user: User }) {
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<string>("");
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>("");
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");
  const [selectedFunctionId, setSelectedFunctionId] = useState<string>("");
  const [promptTask, setPromptTask] = useState<string>("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Получаем список подключенных номеров
  const {
    data: connectedNumbers,
    isLoading: isLoadingNumbers,
    isError: isNumbersError,
    refetch: refetchNumbers,
  } = useFetchConnectedNumber({
    userId: user.id,
  });

  // Получаем список ассистентов
  const {
    data: assistants,
    isLoading: isLoadingAssistants,
    isError: isAssistantsError,
    refetch: refetchAssistants,
  } = useFetchUserAssistants({
    userId: user.id,
    enabled: true,
  });

  // Получаем каналы оповещения и функции
  const {
    data: channelsAndFunctions,
    isLoading: isLoadingChannelsAndFunctions,
    isError: isChannelsAndFunctionsError,
    refetch: refetchChannelsAndFunctions,
  } = useFetchNotificationChannelsAndFunctions({
    userId: user.id,
    enabled: true,
  });

  // Получаем параметры для выбранного номера
  const {
    data: incomingParams,
    isLoading: isLoadingParams,
    refetch: refetchParams,
  } = useFetchIncomingParams({
    userId: user.id,
    phoneNumber: selectedPhoneNumber,
    enabled: !!selectedPhoneNumber,
  });

  // Мутация для сохранения параметров
  const { mutate: saveParams, isPending: isSaving } = useSaveIncomingParams();

  // Мутация для удаления параметров
  const { mutate: deleteParams, isPending: isDeleting } =
    useDeleteIncomingParams();

  // При выборе номера загружаем его параметры и заполняем форму
  const handlePhoneNumberChange = (phoneNumber: string) => {
    setSelectedPhoneNumber(phoneNumber);

    // Сбрасываем значения формы при смене номера
    setSelectedAssistantId("");
    setSelectedChannelId("");
    setSelectedFunctionId("");
    setPromptTask("");

    // Если выбран номер, загружаем его параметры
    if (phoneNumber) {
      refetchParams();
    }
  };

  // Заполняем форму данными из загруженных параметров
  useEffect(() => {
    if (incomingParams) {
      if (incomingParams.assistantId) {
        setSelectedAssistantId(incomingParams.assistantId);
      }

      if (incomingParams.promptTask) {
        setPromptTask(incomingParams.promptTask);
      }

      if (
        incomingParams.tgChatId &&
        incomingParams.tgToken &&
        channelsAndFunctions
      ) {
        // Находим канал с соответствующими параметрами
        const channel = channelsAndFunctions.notificationChannels.find(
          (ch) =>
            ch.settings.chatId === incomingParams.tgChatId &&
            ch.settings.botToken === incomingParams.tgToken
        );

        if (channel) {
          setSelectedChannelId(channel.id.toString());
        }
      }

      if (incomingParams.functionObj && channelsAndFunctions) {
        // Находим функцию с соответствующими параметрами
        const func = channelsAndFunctions.userFunctions.find(
          (f) =>
            JSON.stringify(f.parameters) ===
            JSON.stringify(incomingParams.functionObj.parameters)
        );

        if (func) {
          setSelectedFunctionId(func.id.toString());
        }
      }
    }
  }, [incomingParams, channelsAndFunctions]);

  // Получаем выбранную функцию
  const selectedFunction = channelsAndFunctions?.userFunctions?.find(
    (func) => func.id.toString() === selectedFunctionId
  );

  // Получаем выбранный канал
  const selectedChannel = channelsAndFunctions?.notificationChannels?.find(
    (channel) => channel.id.toString() === selectedChannelId
  );

  // Обработчик сохранения параметров
  const handleSaveParams = () => {
    if (!selectedPhoneNumber) return;

    const data = {
      phone: selectedPhoneNumber,
      assistantId: selectedAssistantId || null,
      tgChatId: selectedChannel?.settings.chatId || null,
      tgToken: selectedChannel?.settings.botToken || null,
      promptTask: promptTask || null,
      functionObj: selectedFunction
        ? {
            type: "function",
            name: selectedFunction.name,
            description: selectedFunction.description || "",
            parameters: selectedFunction.parameters || {
              type: "object",
              required: [],
              properties: {},
            },
          }
        : null,
    };

    saveParams(data);
  };

  // Обработчик удаления параметров
  const handleDeleteParams = () => {
    if (!selectedPhoneNumber) return;

    deleteParams(selectedPhoneNumber, {
      onSuccess: () => {
        // Сбрасываем выбранные значения после удаления
        setSelectedAssistantId("");
        setSelectedChannelId("");
        setSelectedFunctionId("");
        setPromptTask("");
        setIsDeleteDialogOpen(false);
      },
    });
  };

  // Если план пользователя Free или Basic, показываем баннер
  if (user?.plan === "free" || user?.plan === "basic") {
    return <TariffActivationBanner />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Настройка входящих звонков</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Выбор номера */}
          <PhoneNumberSelector
            selectedPhoneNumber={selectedPhoneNumber}
            onPhoneNumberChange={handlePhoneNumberChange}
            connectedNumbers={connectedNumbers || []}
            isLoadingNumbers={isLoadingNumbers}
            isNumbersError={isNumbersError}
            refetchNumbers={refetchNumbers}
            title="Выберите номер для настройки входящих звонков"
            placeholder="Выберите номер"
            smsOnly={false}
          />

          {/* Форма настройки параметров входящих звонков */}
          {selectedPhoneNumber && (
            <div className="space-y-6 border border-neutral-200 dark:border-neutral-700 rounded-md p-2 md:p-4">
              {isLoadingParams ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                  <span className="ml-2">Загрузка параметров...</span>
                </div>
              ) : (
                <>
                  {/* Выбор ассистента */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Выберите ассистента для входящих звонков
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
                            className="w-full border border-neutral-300 dark:border-neutral-600 rounded-md py-2 px-3 pr-10 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
                            value={selectedAssistantId}
                            onChange={(e) =>
                              setSelectedAssistantId(e.target.value)
                            }
                          >
                            <option value="">Выберите ассистента</option>
                            {assistants.map((assistant) => (
                              <option
                                key={assistant.id}
                                value={assistant.openaiAssistantId || ""}
                                disabled={!assistant.openaiAssistantId}
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

                  {/* Выбор канала Telegram */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Выбор канала (Telegram)
                    </h3>
                    <div className="relative">
                      {isLoadingChannelsAndFunctions ? (
                        <div className="flex items-center space-x-2 py-2">
                          <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />
                          <span className="text-sm text-neutral-500">
                            Загрузка каналов...
                          </span>
                        </div>
                      ) : isChannelsAndFunctionsError ? (
                        <div className="text-sm text-red-500 py-2 flex justify-between">
                          <span>Ошибка при загрузке каналов Telegram</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => refetchChannelsAndFunctions()}
                            className="text-xs"
                          >
                            Повторить
                          </Button>
                        </div>
                      ) : !channelsAndFunctions?.notificationChannels ||
                        channelsAndFunctions.notificationChannels.length ===
                          0 ? (
                        <div className="text-sm text-amber-500 py-2">
                          У вас нет подключенных каналов Telegram.
                        </div>
                      ) : (
                        <>
                          <select
                            className="w-full border border-neutral-300 dark:border-neutral-600 rounded-md py-2 px-3 pr-10 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
                            value={selectedChannelId}
                            onChange={(e) =>
                              setSelectedChannelId(e.target.value)
                            }
                          >
                            <option value="">Выберите канал Telegram</option>
                            {channelsAndFunctions.notificationChannels.map(
                              (channel) => (
                                <option
                                  key={channel.id}
                                  value={channel.id.toString()}
                                >
                                  {channel.name}
                                </option>
                              )
                            )}
                          </select>
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 material-icons text-neutral-400 pointer-events-none">
                            expand_more
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Выбор функции */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Выбор функции
                    </h3>
                    <div className="relative">
                      {isLoadingChannelsAndFunctions ? (
                        <div className="flex items-center space-x-2 py-2">
                          <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />
                          <span className="text-sm text-neutral-500">
                            Загрузка функций...
                          </span>
                        </div>
                      ) : isChannelsAndFunctionsError ? (
                        <div className="text-sm text-red-500 py-2 flex justify-between">
                          <span>Ошибка при загрузке функций</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => refetchChannelsAndFunctions()}
                            className="text-xs"
                          >
                            Повторить
                          </Button>
                        </div>
                      ) : !channelsAndFunctions?.userFunctions ||
                        channelsAndFunctions.userFunctions.length === 0 ? (
                        <div className="text-sm text-amber-500 py-2">
                          У вас нет созданных функций.
                        </div>
                      ) : (
                        <>
                          <select
                            className="w-full border border-neutral-300 dark:border-neutral-600 rounded-md py-2 px-3 pr-10 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
                            value={selectedFunctionId}
                            onChange={(e) =>
                              setSelectedFunctionId(e.target.value)
                            }
                          >
                            <option value="">Выберите функцию</option>
                            {channelsAndFunctions.userFunctions.map((func) => (
                              <option key={func.id} value={func.id.toString()}>
                                {func.name}
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

                  {/* Информация о выбранной функции */}
                  {selectedFunctionId && selectedFunction && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md w-full max-w-[275px] md:max-w-full overflow-x-auto">
                      <h4 className="text-sm font-medium mb-1">
                        Информация о функции:
                      </h4>
                      <div className="text-xs text-neutral-600 dark:text-neutral-300">
                        <p>
                          <strong>Название:</strong> {selectedFunction.name}
                        </p>
                        <p>
                          <strong>Описание:</strong>{" "}
                          {selectedFunction.description || "Нет описания"}
                        </p>
                      </div>

                      {/* Отображение параметров функции */}
                      {selectedFunction?.parameters && (
                        <div className="mt-3">
                          <h4 className="text-sm font-medium mb-1">
                            Параметры функции:
                          </h4>
                          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md overflow-auto">
                            <pre className="text-xs text-green-600 dark:text-green-400">
                              {JSON.stringify(
                                selectedFunction.parameters,
                                null,
                                2
                              )}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Поле для ввода задачи ассистента */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Задача для ассистента
                    </h3>
                    <Textarea
                      placeholder="Введите задачу для ассистента при входящем звонке"
                      value={promptTask}
                      onChange={(e) => setPromptTask(e.target.value)}
                      rows={5}
                      className="resize-none"
                    />
                    <p className="text-xs text-neutral-500">
                      Опишите, что должен делать ассистент при входящем звонке
                    </p>
                  </div>

                  {/* Кнопки сохранения и удаления */}
                  <div className="grid grid-cols-1 gap-2 md:flex justify-between pt-4">
                    <Button
                      variant="destructive"
                      onClick={() => setIsDeleteDialogOpen(true)}
                      disabled={isDeleting || !incomingParams}
                    >
                      {isDeleting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Удалить настройки
                    </Button>

                    <Button
                      onClick={handleSaveParams}
                      disabled={
                        !selectedPhoneNumber ||
                        isSaving ||
                        !selectedAssistantId ||
                        !promptTask ||
                        promptTask.length < 10
                      }
                    >
                      {isSaving && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Сохранить настройки
                    </Button>
                  </div>

                  {/* Информация о минимальных требованиях */}
                  <div className="text-xs text-neutral-500 border-t pt-4 mt-2">
                    <p className="font-medium mb-1">
                      Минимальные требования для запуска обзвона:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li
                        className={
                          selectedPhoneNumber
                            ? "text-green-500"
                            : "text-red-500"
                        }
                      >
                        Выбран номер для звонков
                      </li>
                      <li
                        className={
                          selectedAssistantId
                            ? "text-green-500"
                            : "text-red-500"
                        }
                      >
                        Выбран ассистент
                      </li>
                      <li
                        className={
                          promptTask && promptTask.length >= 10
                            ? "text-green-500"
                            : "text-red-500"
                        }
                      >
                        Сценарий содержит не менее 10 символов
                      </li>
                      <li className="text-green-500">
                        Достаточно средств на балансе
                      </li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>

      {/* Диалог подтверждения удаления */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteParams}
        title="Удаление настроек"
        description="Вы уверены, что хотите удалить параметры входящего звонка?"
        isLoading={isDeleting}
      />
    </Card>
  );
}
