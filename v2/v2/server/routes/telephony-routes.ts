import { Express, Request, Response } from "express";
import axios from "axios";
import { authenticateToken } from "../middlewares/auth";
import "dotenv/config";
import { db } from "../db";
import {
  telephonyNumbers,
  telephonyCallHistory,
  users,
  userPlanUsage,
  telephonyIncomingParams,
} from "../../shared/schema";
import { and, eq, count, gte, lte, desc, sql } from "drizzle-orm";
import { formatFunctionName } from "../utils/format-function-name";
import { IStorage } from "../storage";

// Конфигурация Voximplant API
const VOXIMPLANT_API_URL = "https://api.voximplant.com/platform_api";
const VOXIMPLANT_API_KEY = process.env.VOXIMPLANT_API_KEY;
const VOXIMPLANT_ACCOUNT_ID = process.env.VOXIMPLANT_ACCOUNT_ID;
const VOXIMPLANT_RULE_ID = process.env.VOXIMPLANT_RULE_ID; // ID правила для запуска сценария обзвона
const SERVER_URL = process.env.VITE_PUBLIC_BASE_URL; // URL сервера для обратных вызовов

const APPLICATION_ID = 44456743; // trolltest
const INCOMING_CALL_RULE_ID = 7895282; // входящие

// Стоимость одной минуты звонка в рублях
const CALL_PRICE_PER_MINUTE = 5;

/**
 * Останавливает все активные обзвоны для указанного номера телефона пользователя
 * @param userId ID пользователя
 * @param phoneNumber Номер телефона, для которого нужно остановить обзвон
 */
async function stopCallListsForUser(
  userId: number,
  phoneNumber: string
): Promise<void> {
  try {
    console.log(
      `[ОБЗВОН] Остановка обзвона для пользователя ${userId} с номера ${phoneNumber}`
    );

    // 1. Сначала попробуем остановить обзвон через StopCallListProcessing API
    try {
      const apiUrl = `${VOXIMPLANT_API_URL}/StopCallListProcessing`;

      // Получаем все активные сессии пользователя с указанного номера из базы данных
      const activeCallLists = await db.query.telephonyCallHistory.findMany({
        where: (telephonyCallHistory, { and, eq, gte }) =>
          and(
            eq(telephonyCallHistory.userId, userId),
            eq(telephonyCallHistory.callerNumber, phoneNumber),
            gte(
              telephonyCallHistory.callTime,
              new Date(Date.now() - 24 * 60 * 60 * 1000)
            )
          ),
        orderBy: (telephonyCallHistory, { desc }) => [
          desc(telephonyCallHistory.callTime),
        ],
        limit: 1,
      });

      if (activeCallLists.length > 0) {
        const listId = activeCallLists[0].id;

        // Отправляем запрос на остановку обзвона
        const response = await axios.post(apiUrl, null, {
          params: {
            api_key: VOXIMPLANT_API_KEY,
            account_id: VOXIMPLANT_ACCOUNT_ID,
            list_id: listId,
          },
        });

        if (response.data && response.data.result) {
          console.log(
            `[ОБЗВОН] Обзвон успешно остановлен для пользователя ${userId} с номера ${phoneNumber}`
          );
          return;
        }
      }
    } catch (error: any) {
      console.error(
        `[ОБЗВОН] Не удалось остановить через StopCallListProcessing API:`,
        error.message
      );
    }

    // 2. Если первый метод не сработал, пробуем получить активные сессии и остановить их
    try {
      const getCallHistoryUrl = `${VOXIMPLANT_API_URL}/GetCallHistory`;

      const callHistoryResponse = await axios.post(getCallHistoryUrl, null, {
        params: {
          api_key: VOXIMPLANT_API_KEY,
          account_id: VOXIMPLANT_ACCOUNT_ID,
          from_date: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          count: 100,
          with_calls: true,
          output: "json",
          phone_number: phoneNumber,
        },
      });

      if (callHistoryResponse.data && callHistoryResponse.data.result) {
        const activeSessions = callHistoryResponse.data.result.filter(
          (session: any) => session.finished === false
        );

        if (activeSessions.length > 0) {
          console.log(
            `[ОБЗВОН] Найдено ${activeSessions.length} активных сессий для номера ${phoneNumber}`
          );

          // Останавливаем каждую активную сессию
          for (const session of activeSessions) {
            try {
              const terminateUrl = `${VOXIMPLANT_API_URL}/TerminateSession`;

              const terminateResponse = await axios.post(terminateUrl, null, {
                params: {
                  api_key: VOXIMPLANT_API_KEY,
                  account_id: VOXIMPLANT_ACCOUNT_ID,
                  session_id: session.session_id,
                },
              });

              if (terminateResponse.data && terminateResponse.data.result) {
                console.log(
                  `[ОБЗВОН] Сессия ${session.session_id} для номера ${phoneNumber} остановлена`
                );
              }
            } catch (sessionError: any) {
              console.error(
                `[ОБЗВОН] Не удалось остановить сессию ${session.session_id}:`,
                sessionError.message
              );
            }
          }
        }
      }
    } catch (historyError: any) {
      console.error(
        `[ОБЗВОН] Ошибка получения истории звонков для номера ${phoneNumber}:`,
        historyError.message
      );
    }
  } catch (error: any) {
    console.error(
      `[ОБЗВОН] Ошибка при остановке обзвона для пользователя ${userId}:`,
      error.message
    );
  }
}

export function registerTelephonyRoutes(
  app: Express,
  storageInstance: IStorage
): void {
  /**
   * @route GET /api/telephony/notification-channels-and-functions
   * @desc Получает список каналов оповещения Telegram и функций пользователя
   * @access Private
   */
  app.get(
    "/api/telephony/notification-channels-and-functions",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const userId = req.user?.id;

        if (!userId) {
          return res.status(401).json({
            success: false,
            message: "Пользователь не авторизован",
          });
        }

        // Получаем каналы оповещения Telegram пользователя из базы данных
        const allNotificationChannels =
          await db.query.notificationChannels.findMany({
            where: (notificationChannels, { eq }) =>
              eq(notificationChannels.createdBy, userId),
          });

        // Фильтруем только каналы Telegram
        const telegramChannels = allNotificationChannels.filter(
          (channel) => channel.type.toLowerCase() === "telegram"
        );

        // Получаем функции пользователя из базы данных
        const userFunctions = await db.query.openAiFunctions.findMany({
          where: (openAiFunctions, { eq }) =>
            eq(openAiFunctions.createdBy, userId),
        });

        return res.status(200).json({
          success: true,
          notificationChannels: telegramChannels,
          userFunctions,
        });
      } catch (error: any) {
        console.error(
          "Ошибка при получении каналов оповещения и функций:",
          error
        );
        return res.status(500).json({
          success: false,
          message: "Ошибка при получении каналов оповещения и функций",
          error: error.message,
        });
      }
    }
  );

  /**
   * @route GET /api/telephony/available-numbers
   * @desc Получает список доступных номеров для подключения
   * @access Private
   */
  app.get(
    "/api/telephony/available-numbers",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const sms = req.query.sms;
        // Получаем параметры из запроса
        const countryCode = "RU";
        const count = 20;

        // Формируем URL для запроса к API Voximplant
        const apiUrl = `${VOXIMPLANT_API_URL}/GetNewPhoneNumbers`;

        // Параметры запроса
        let params: any;
        if (sms) {
          params = {
            api_key: VOXIMPLANT_API_KEY,
            account_id: VOXIMPLANT_ACCOUNT_ID,
            country_code: countryCode,
            phone_category_name: "MOBILE", // Мобильные номера с поддержкой SMS
            phone_region_id: "177", // Москва
            count,
          };
        } else {
          params = {
            api_key: VOXIMPLANT_API_KEY,
            account_id: VOXIMPLANT_ACCOUNT_ID,
            country_code: countryCode,
            phone_category_name: "GEOGRAPHIC", // Географические номера
            phone_region_id: "1", // Москва
            count,
          };
        }
        // Выполняем запрос к API Voximplant
        const response = await axios.post(apiUrl, null, { params });
        // Проверяем успешность запроса
        if (response.data && response.data.result) {
          return res.status(200).json({
            success: true,
            numbers: response.data.result,
          });
        } else {
          return res.status(400).json({
            success: false,
            message: "Не удалось получить список доступных номеров",
            error: response.data?.error || "Неизвестная ошибка",
          });
        }
      } catch (error: any) {
        console.error("Ошибка при получении доступных номеров:", error);

        // Формируем информативное сообщение об ошибке
        let errorMessage = "Ошибка при получении доступных номеров";
        let errorDetails = error.message;

        // Если есть ответ от API с деталями ошибки
        if (error.response?.data) {
          errorDetails = error.response.data.error || error.response.data;
        }

        return res.status(500).json({
          success: false,
          message: errorMessage,
          error: errorDetails,
        });
      }
    }
  );

  /**
   * @route GET /api/telephony/connected-numbers
   * @desc Получает список подключенных номеров пользователя из БД
   * @access Private
   */
  app.get(
    "/api/telephony/connected-numbers",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const userId = req.user?.id;

        if (!userId) {
          return res.status(401).json({
            success: false,
            message: "Пользователь не авторизован",
          });
        }

        // Получаем номера пользователя из базы данных
        const userNumbers = await db.query.telephonyNumbers.findMany({
          where: (telephonyNumbers, { eq }) =>
            eq(telephonyNumbers.userId, userId),
        });

        // Если у пользователя нет номеров, возвращаем пустой массив
        if (!userNumbers || userNumbers.length === 0) {
          return res.status(200).json({
            success: true,
            numbers: [],
          });
        }

        // Формируем URL для запроса к API Voximplant для получения актуальной информации
        const apiUrl = `${VOXIMPLANT_API_URL}/GetPhoneNumbers`;

        // Выполняем запрос к API Voximplant
        const response = await axios.post(apiUrl, null, {
          params: {
            api_key: VOXIMPLANT_API_KEY,
            account_id: VOXIMPLANT_ACCOUNT_ID,
          },
        });

        // Если запрос к Voximplant успешен, объединяем данные
        if (response.data && response.data.result) {
          // Создаем карту номеров из Voximplant для быстрого поиска
          const voximplantNumbersMap = new Map();
          response.data.result.forEach((number: any) => {
            voximplantNumbersMap.set(number.phone_number, number);
          });

          // Обновляем информацию о номерах пользователя с актуальными данными из Voximplant
          const updatedNumbers = userNumbers.map((userNumber) => {
            const voximplantNumber = voximplantNumbersMap.get(
              userNumber.phone_number
            );

            // Если номер найден в Voximplant, объединяем данные, иначе возвращаем данные из БД
            return voximplantNumber
              ? {
                  ...userNumber,
                  // Обновляем поля, которые могли измениться
                  phone_next_renewal: voximplantNumber.phone_next_renewal,
                  auto_charge: voximplantNumber.auto_charge,
                  can_be_used: voximplantNumber.can_be_used,
                  deactivated: voximplantNumber.deactivated,
                  is_sms_enabled: voximplantNumber.is_sms_enabled,
                  is_sms_supported: voximplantNumber.is_sms_supported,
                  issues: voximplantNumber.issues,
                  modified: voximplantNumber.modified,
                  verification_status: voximplantNumber.verification_status,
                }
              : userNumber;
          });

          return res.status(200).json({
            success: true,
            numbers: updatedNumbers,
          });
        } else {
          // Если запрос к Voximplant не удался, возвращаем данные только из БД
          return res.status(200).json({
            success: true,
            numbers: userNumbers,
            warning:
              "Данные могут быть неактуальными, не удалось получить обновления от провайдера",
          });
        }
      } catch (error: any) {
        console.error("Ошибка при получении подключенных номеров:", error);

        // Формируем информативное сообщение об ошибке
        let errorMessage = "Ошибка при получении подключенных номеров";
        let errorDetails = error.message;

        // Если есть ответ от API с деталями ошибки
        if (error.response?.data) {
          errorDetails = error.response.data.error || error.response.data;
        }

        return res.status(500).json({
          success: false,
          message: errorMessage,
          error: errorDetails,
        });
      }
    }
  );

  /**
   * @route POST /api/telephony/connect-numbers
   * @desc Подключает выбранные телефонные номера и сохраняет их в БД
   * @access Private
   */
  app.post(
    "/api/telephony/connect-numbers",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const { phoneNumbers, applicationId } = req.body;
        const userId = req.user?.id;

        if (!userId) {
          return res.status(401).json({
            success: false,
            message: "Пользователь не авторизован",
          });
        }

        if (
          !phoneNumbers ||
          !Array.isArray(phoneNumbers) ||
          phoneNumbers.length === 0
        ) {
          return res.status(400).json({
            success: false,
            message: "Необходимо указать массив номеров для подключения",
          });
        }

        // Получаем информацию о пользователе для проверки баланса
        const user = await storageInstance.getUser(userId);
        if (!user) {
          return res.status(404).json({
            success: false,
            message: "Пользователь не найден",
          });
        }

        // Если указан applicationId, будем привязывать номера к приложению
        const appId = applicationId || null;

        // Результаты подключения для каждого номера
        const results = [];
        let totalCost = 0; // Общая стоимость подключения всех номеров

        // Сначала получаем информацию о всех номерах и рассчитываем общую стоимость
        for (const phoneNumber of phoneNumbers) {
          try {
            // Получаем информацию о номере из API GetNewPhoneNumbers
            const getNewNumbersUrl = `${VOXIMPLANT_API_URL}/GetNewPhoneNumbers`;

            const newNumbersResponse = await axios.post(
              getNewNumbersUrl,
              null,
              {
                params: {
                  api_key: VOXIMPLANT_API_KEY,
                  account_id: VOXIMPLANT_ACCOUNT_ID,
                  phone_number: phoneNumber,
                  country_code: "RU",
                  count: 1,
                },
              }
            );

            if (
              newNumbersResponse.data &&
              newNumbersResponse.data.result &&
              newNumbersResponse.data.result.length > 0
            ) {
              const phoneInfo = newNumbersResponse.data.result[0];
              // Рассчитываем стоимость: цена номера (округляем в меньшую сторону) + 100 рублей
              // phone_price в рублях, переводим в копейки
              const phonePrice =
                Math.floor(parseFloat(phoneInfo.phone_price)) * 100; // округляем в меньшую сторону и переводим в копейки
              const connectionFee = 100 * 100; // 100 рублей в копейках
              const phoneCost = phonePrice + connectionFee;

              totalCost += phoneCost;

              console.log(
                `[ПОДКЛЮЧЕНИЕ НОМЕРА] Номер ${phoneNumber}: цена ${Math.floor(
                  parseFloat(phoneInfo.phone_price)
                )} руб + 100 руб = ${phoneCost / 100} руб (${phoneCost} коп.)`
              );
            } else {
              // Если не удалось получить информацию о номере, считаем базовую стоимость
              const baseCost = 305 * 100; // 305 рублей в копейках как базовая стоимость
              totalCost += baseCost;
              console.warn(
                `[ПОДКЛЮЧЕНИЕ НОМЕРА] Не удалось получить цену номера ${phoneNumber}, используем базовую стоимость ${
                  baseCost / 100
                } руб`
              );
            }
          } catch (priceError) {
            console.error(
              `[ПОДКЛЮЧЕНИЕ НОМЕРА] Ошибка при получении цены номера ${phoneNumber}:`,
              priceError
            );
            // В случае ошибки добавляем базовую стоимость
            const baseCost = 305 * 100; // 305 рублей в копейках
            totalCost += baseCost;
          }
        }

        console.log(
          `[ПОДКЛЮЧЕНИЕ НОМЕРА] Общая стоимость подключения ${
            phoneNumbers.length
          } номеров: ${totalCost / 100} руб (${totalCost} коп.)`
        );
        console.log(
          `[ПОДКЛЮЧЕНИЕ НОМЕРА] Баланс пользователя: ${
            (user.balance || 0) / 100
          } руб (${user.balance || 0} коп.)`
        );

        // Проверяем, достаточно ли средств для подключения всех номеров
        const currentBalance = user.balance || 0;
        if (currentBalance < totalCost) {
          return res.status(400).json({
            success: false,
            message: `Недостаточно средств для подключения номеров. Требуется: ${
              totalCost / 100
            } руб, доступно: ${currentBalance / 100} руб`,
            requiredAmount: totalCost,
            availableAmount: currentBalance,
          });
        }

        // Обрабатываем каждый номер последовательно
        for (const phoneNumber of phoneNumbers) {
          try {
            // Формируем URL для запроса к API Voximplant (привязка телефонного номера)
            const apiUrl = `${VOXIMPLANT_API_URL}/AttachPhoneNumber`;

            // Параметры запроса
            const params: any = {
              api_key: VOXIMPLANT_API_KEY,
              account_id: VOXIMPLANT_ACCOUNT_ID,
              phone_number: phoneNumber,
              country_code: "RU", // Можно передавать динамически
              auto_charge: false, // Отключаем автопродление при подключении номера
            };

            // Если указан ID приложения, добавляем его в параметры
            if (appId) {
              params.application_id = appId;
            }

            // Выполняем запрос на подключение номера
            const response = await axios.post(apiUrl, null, { params });

            // Если успешно подключили номер, получаем дополнительную информацию
            if (response.data && response.data.result) {
              // Явно отключаем автопродление для номера через SetPhoneNumberInfo
              try {
                const setInfoUrl = `${VOXIMPLANT_API_URL}/SetPhoneNumberInfo`;
                await axios.post(setInfoUrl, null, {
                  params: {
                    api_key: VOXIMPLANT_API_KEY,
                    account_id: VOXIMPLANT_ACCOUNT_ID,
                    phone_number: phoneNumber,
                    auto_charge: false,
                  },
                });
              } catch (setInfoError) {
                console.error(
                  `Ошибка при отключении автопродления для номера ${phoneNumber}:`,
                  setInfoError
                );
                // Продолжаем выполнение, даже если не удалось отключить автопродление
              }

              // Получаем детальную информацию о номере
              const detailsUrl = `${VOXIMPLANT_API_URL}/GetPhoneNumbers`;
              const detailsResponse = await axios.post(detailsUrl, null, {
                params: {
                  api_key: VOXIMPLANT_API_KEY,
                  account_id: VOXIMPLANT_ACCOUNT_ID,
                  phone_number: phoneNumber,
                },
              });

              const phoneDetails = detailsResponse.data?.result?.[0];

              if (phoneDetails) {
                // Сначала проверяем, не существует ли уже такой номер у пользователя
                const existingNumber =
                  await db.query.telephonyNumbers.findFirst({
                    where: (telephonyNumbers, { and, eq }) =>
                      and(
                        eq(telephonyNumbers.userId, userId),
                        eq(
                          telephonyNumbers.phone_number,
                          phoneDetails.phone_number
                        )
                      ),
                  });

                if (existingNumber) {
                  console.log(
                    `[ПОДКЛЮЧЕНИЕ НОМЕРА] Номер ${phoneNumber} уже подключен к пользователю ${userId}`
                  );
                  results.push({
                    phoneNumber,
                    success: false,
                    error: "Номер уже подключен к вашему аккаунту",
                  });
                  continue;
                }

                // Рассчитываем стоимость подключения для этого номера
                const phonePrice =
                  Math.floor(parseFloat(phoneDetails.phone_price)) * 100;
                const connectionFee = 100 * 100; // 100 рублей в копейках
                const phoneCost = phonePrice + connectionFee;

                // Списываем средства с баланса пользователя
                console.log(
                  `[ПОДКЛЮЧЕНИЕ НОМЕРА] Списываем ${
                    phoneCost / 100
                  } руб с баланса пользователя ${userId} за номер ${phoneNumber}`
                );

                const updatedUser = await storageInstance.updateUserBalance(
                  userId,
                  -phoneCost
                );
                if (!updatedUser) {
                  console.error(
                    `[ПОДКЛЮЧЕНИЕ НОМЕРА] Не удалось списать средства с баланса пользователя ${userId}`
                  );
                  results.push({
                    phoneNumber,
                    success: false,
                    error: "Не удалось списать средства с баланса",
                  });
                  continue;
                }

                console.log(
                  `[ПОДКЛЮЧЕНИЕ НОМЕРА] Средства успешно списаны. Новый баланс: ${
                    (updatedUser.balance || 0) / 100
                  } руб`
                );

                try {
                  // Сохраняем информацию о номере в базу данных
                  const now = new Date();
                  await db.insert(telephonyNumbers).values({
                    userId: userId,
                    phone_number: phoneDetails.phone_number,
                    phone_price: phoneDetails.phone_price,
                    phone_region_name: phoneDetails.phone_region_name,
                    phone_country_code: phoneDetails.phone_country_code,
                    phone_category_name: phoneDetails.category_name,
                    phone_purchase_date: phoneDetails.phone_purchase_date
                      ? new Date(phoneDetails.phone_purchase_date)
                      : now,
                    phone_next_renewal: phoneDetails.phone_next_renewal
                      ? new Date(phoneDetails.phone_next_renewal)
                      : new Date(now.setMonth(now.getMonth() + 1)),
                    account_id: phoneDetails.account_id,
                    auto_charge: false, // Сохраняем значение auto_charge = false в БД
                    can_be_used: phoneDetails.can_be_used || true,
                    category_name: phoneDetails.category_name,
                    deactivated: phoneDetails.deactivated || false,
                    is_sms_enabled: phoneDetails.is_sms_enabled || false,
                    is_sms_supported: phoneDetails.is_sms_supported || false,
                    issues: phoneDetails.issues || [],
                    modified: phoneDetails.modified
                      ? new Date(phoneDetails.modified)
                      : now,
                    phone_id: phoneDetails.phone_id,
                    phone_region_id: phoneDetails.phone_region_id,
                    subscription_id: phoneDetails.subscription_id,
                    verification_status: phoneDetails.verification_status,
                  });

                  console.log(
                    `[ПОДКЛЮЧЕНИЕ НОМЕРА] Номер ${phoneNumber} успешно сохранен в БД`
                  );

                  // Включаем SMS для номера, если он поддерживает SMS
                  if (phoneDetails.is_sms_supported) {
                    try {
                      console.log(
                        `[ПОДКЛЮЧЕНИЕ НОМЕРА] Включение SMS для номера ${phoneNumber}`
                      );

                      const controlSmsUrl = `${VOXIMPLANT_API_URL}/ControlSms`;
                      const controlResponse = await axios.post(
                        controlSmsUrl,
                        null,
                        {
                          params: {
                            api_key: VOXIMPLANT_API_KEY,
                            account_id: VOXIMPLANT_ACCOUNT_ID,
                            phone_number: phoneNumber,
                            command: "enable",
                          },
                        }
                      );

                      if (controlResponse.data && controlResponse.data.result) {
                        console.log(
                          `[ПОДКЛЮЧЕНИЕ НОМЕРА] SMS успешно включено для номера ${phoneNumber}`
                        );

                        // Обновляем статус SMS в БД
                        await db
                          .update(telephonyNumbers)
                          .set({ is_sms_enabled: true })
                          .where(
                            and(
                              eq(telephonyNumbers.userId, userId),
                              eq(telephonyNumbers.phone_number, phoneNumber)
                            )
                          );
                      } else {
                        console.warn(
                          `[ПОДКЛЮЧЕНИЕ НОМЕРА] Не удалось включить SMS для номера ${phoneNumber}:`,
                          controlResponse.data
                        );
                      }
                    } catch (smsError: any) {
                      console.error(
                        `[ПОДКЛЮЧЕНИЕ НОМЕРА] Ошибка при включении SMS для номера ${phoneNumber}:`,
                        smsError.response?.data?.error || smsError.message
                      );
                      // Продолжаем выполнение, даже если не удалось включить SMS
                    }
                  } else {
                    console.log(
                      `[ПОДКЛЮЧЕНИЕ НОМЕРА] Номер ${phoneNumber} не поддерживает SMS`
                    );
                  }

                  // Добавляем результат в общий массив
                  results.push({
                    phoneNumber,
                    success: true,
                    result: response.data.result,
                    saved: true,
                    cost: phoneCost,
                  });
                } catch (dbError: any) {
                  console.error(
                    `[ПОДКЛЮЧЕНИЕ НОМЕРА] Ошибка при сохранении номера ${phoneNumber} в БД:`,
                    dbError
                  );

                  // Откатываем списание с баланса
                  console.log(
                    `[ПОДКЛЮЧЕНИЕ НОМЕРА] Откатываем списание ${
                      phoneCost / 100
                    } руб для номера ${phoneNumber}`
                  );

                  try {
                    const rollbackUser =
                      await storageInstance.updateUserBalance(
                        userId,
                        phoneCost
                      );
                    if (rollbackUser) {
                      console.log(
                        `[ПОДКЛЮЧЕНИЕ НОМЕРА] Списание успешно отменено. Баланс восстановлен до ${
                          (rollbackUser.balance || 0) / 100
                        } руб`
                      );
                    } else {
                      console.error(
                        `[ПОДКЛЮЧЕНИЕ НОМЕРА] КРИТИЧЕСКАЯ ОШИБКА: Не удалось отменить списание для номера ${phoneNumber}!`
                      );
                    }
                  } catch (rollbackError) {
                    console.error(
                      `[ПОДКЛЮЧЕНИЕ НОМЕРА] КРИТИЧЕСКАЯ ОШИБКА: Ошибка при отмене списания для номера ${phoneNumber}:`,
                      rollbackError
                    );
                  }

                  results.push({
                    phoneNumber,
                    success: false,
                    error: `Ошибка сохранения в БД: ${dbError.message}`,
                  });
                }
              } else {
                // Не удалось получить детальную информацию о номере
                results.push({
                  phoneNumber,
                  success: true,
                  result: response.data.result,
                  saved: false,
                  error: "Не удалось получить детальную информацию о номере",
                });
              }
            } else {
              // Добавляем результат в общий массив
              results.push({
                phoneNumber,
                success: false,
                error: "Не удалось подключить номер",
              });
            }
          } catch (error: any) {
            console.error(
              `Ошибка при подключении номера ${phoneNumber}:`,
              error
            );

            let errorDetails = error.message;
            if (error.response?.data) {
              errorDetails = error.response.data.error || error.response.data;
            }

            // Добавляем информацию об ошибке в общий массив результатов
            results.push({
              phoneNumber,
              success: false,
              error: errorDetails,
            });
          }
        }

        // Определяем, были ли успешные подключения
        const hasSuccessfulConnections = results.some((r) => r.success);
        const allSaved = results.every((r) => r.success && r.saved);
        const totalSpent = results.reduce((sum, r) => sum + (r.cost || 0), 0);

        return res.status(hasSuccessfulConnections ? 200 : 400).json({
          success: hasSuccessfulConnections,
          message: allSaved
            ? `Номера успешно подключены и сохранены. Списано: ${
                totalSpent / 100
              } руб`
            : hasSuccessfulConnections
            ? `Номера подключены, но не все сохранены в базе данных. Списано: ${
                totalSpent / 100
              } руб`
            : "Не удалось подключить номера",
          results,
          totalCost: totalSpent,
        });
      } catch (error: any) {
        console.error("Ошибка при подключении номеров:", error);

        let errorMessage = "Ошибка при подключении номеров";
        let errorDetails = error.message;

        if (error.response?.data) {
          errorDetails = error.response.data.error || error.response.data;
        }

        return res.status(500).json({
          success: false,
          message: errorMessage,
          error: errorDetails,
        });
      }
    }
  );

  /**
   * @route POST /api/telephony/disconnect-number
   * @desc Отключает телефонный номер
   * @access Private
   */
  app.post(
    "/api/telephony/disconnect-number",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const { phoneNumber } = req.body;
        const userId = req.user?.id;

        if (!userId) {
          return res.status(401).json({
            success: false,
            message: "Пользователь не авторизован",
          });
        }

        if (!phoneNumber) {
          return res.status(400).json({
            success: false,
            message: "Необходимо указать номер телефона для отключения",
          });
        }

        // Формируем URL для запроса к API Voximplant
        const apiUrl = `${VOXIMPLANT_API_URL}/DeactivatePhoneNumber`;

        // Выполняем запрос к API Voximplant
        const response = await axios.post(apiUrl, null, {
          params: {
            api_key: VOXIMPLANT_API_KEY,
            account_id: VOXIMPLANT_ACCOUNT_ID,
            phone_number: phoneNumber,
          },
        });

        // Проверяем успешность запроса
        if (response.data && response.data.result) {
          // Вместо удаления помечаем номер как неактивный в базе данных
          try {
            const updateResult = await db
              .update(telephonyNumbers)
              .set({
                deactivated: true,
                can_be_used: false,
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(telephonyNumbers.userId, userId),
                  eq(telephonyNumbers.phone_number, phoneNumber)
                )
              )
              .execute();

            const updatedCount = updateResult.rowCount || 0;

            return res.status(200).json({
              success: true,
              message: `Номер успешно отключен${
                updatedCount > 0
                  ? " и помечен как неактивный"
                  : ", но не найден в базе данных"
              }`,
              result: response.data.result,
              dbUpdated: updatedCount > 0,
            });
          } catch (dbError: unknown) {
            console.error("Ошибка при обновлении номера в БД:", dbError);

            // Даже если не удалось обновить в БД, номер уже отключен в Voximplant
            return res.status(200).json({
              success: true,
              message:
                "Номер успешно отключен, но не удалось обновить запись в базе данных",
              result: response.data.result,
              dbUpdated: false,
              dbError:
                dbError instanceof Error ? dbError.message : String(dbError),
            });
          }
        } else {
          return res.status(400).json({
            success: false,
            message: "Не удалось отключить номер",
            error: response.data?.error || "Неизвестная ошибка",
          });
        }
      } catch (error: any) {
        console.error("Ошибка при отключении номера:", error);

        // Формируем информативное сообщение об ошибке
        let errorMessage = "Ошибка при отключении номера";
        let errorDetails = error.message;

        // Если есть ответ от API с деталями ошибки
        if (error.response?.data) {
          errorDetails = error.response.data.error || error.response.data;
        }

        return res.status(500).json({
          success: false,
          message: errorMessage,
          error: errorDetails,
        });
      }
    }
  );

  /**
   * @route POST /api/telephony/start-cold-call
   * @desc Запускает холодный обзвон по списку номеров с использованием выбранного ассистента
   * @access Private
   */
  app.post(
    "/api/telephony/start-cold-call",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const {
          phoneNumbers,
          assistantId,
          assistantName,
          callScript,
          userId,
          callerNumber,
          callType,
          chatidTg,
          tokenTg,
          funcObj,
        } = req.body;

        // Логируем только важную информацию о запросе
        console.log(
          `[ОБЗВОН] Запуск: ${phoneNumbers?.length} номеров, тип: ${callType}, ассистент: ${assistantId}`
        );

        if (!req.user?.id) {
          return res.status(401).json({
            success: false,
            message: "Пользователь не авторизован",
          });
        }

        // Проверка наличия необходимых параметров
        if (
          !phoneNumbers ||
          !Array.isArray(phoneNumbers) ||
          phoneNumbers.length === 0
        ) {
          return res.status(400).json({
            success: false,
            message: "Необходимо указать массив номеров для обзвона",
          });
        }

        if (!assistantId) {
          return res.status(400).json({
            success: false,
            message: "Необходимо указать ID ассистента",
          });
        }

        if (!callScript) {
          return res.status(400).json({
            success: false,
            message: "Необходимо указать сценарий звонка",
          });
        }

        if (!callerNumber) {
          return res.status(400).json({
            success: false,
            message:
              "Необходимо указать номер, с которого будет совершаться звонок",
          });
        }

        // Дополнительные проверки для обзвона с функцией
        if (callType === "function") {
          if (!chatidTg) {
            return res.status(400).json({
              success: false,
              message: "Необходимо указать ID чата Telegram",
            });
          }

          if (!funcObj) {
            return res.status(400).json({
              success: false,
              message: "Необходимо указать объект функции",
            });
          }
        }

        // Проверяем наличие необходимых переменных окружения
        if (
          !VOXIMPLANT_API_KEY ||
          !VOXIMPLANT_ACCOUNT_ID ||
          !VOXIMPLANT_RULE_ID
        ) {
          return res.status(500).json({
            success: false,
            message: "Отсутствуют необходимые настройки Voximplant API",
          });
        }

        // Проверяем, принадлежит ли указанный номер пользователю
        const userNumber = await db.query.telephonyNumbers.findFirst({
          where: (telephonyNumbers, { and, eq }) =>
            and(
              eq(telephonyNumbers.userId, req.user!.id),
              eq(telephonyNumbers.phone_number, callerNumber)
            ),
        });

        if (!userNumber) {
          return res.status(400).json({
            success: false,
            message: "Указанный номер не принадлежит вам или не существует",
          });
        }

        // Проверяем, активен ли номер
        if (userNumber.deactivated || !userNumber.can_be_used) {
          return res.status(400).json({
            success: false,
            message:
              "Указанный номер не активен или не может быть использован для звонков",
          });
        }

        // Подготавливаем данные для запуска сценария
        const customData = {
          caller_id: callerNumber, // Используем переданный номер
          toNumber: phoneNumbers.join(","), // Объединяем номера через запятую
          desc: callScript,
          assistantId: assistantId,
          assistantName: assistantName,
          userId: userId,
          callbackUrl: SERVER_URL, // URL сервера для обратных вызовов
          // Добавляем данные для обзвона с функцией
          ...(callType === "function" && {
            callType: "function",
            chatidTg: chatidTg,
            tokenTg: tokenTg,
            // Преобразуем объект функции в строку, если он не строка
            funcObj:
              typeof funcObj === "string" ? funcObj : JSON.stringify(funcObj),
          }),
        };

        // Формируем URL для запроса к API Voximplant
        const apiUrl = `${VOXIMPLANT_API_URL}/StartScenarios`;

        // Выполняем запрос к API Voximplant для запуска сценария
        const response = await axios.post(apiUrl, null, {
          params: {
            api_key: VOXIMPLANT_API_KEY,
            account_id: VOXIMPLANT_ACCOUNT_ID,
            rule_id: VOXIMPLANT_RULE_ID,
            script_custom_data: JSON.stringify(customData),
          },
        });

        // Проверяем успешность запроса
        if (response.data && response.data.result) {
          console.log(
            `[ОБЗВОН] Успешно запущен: ${phoneNumbers.length} номеров с ${callerNumber}`
          );
          return res.status(200).json({
            success: true,
            message: `Запущен обзвон ${phoneNumbers.length} номеров с номера ${callerNumber}`,
            result: response.data.result,
            sessionId: response.data.result.session_id,
          });
        } else {
          return res.status(400).json({
            success: false,
            message: "Не удалось запустить обзвон",
            error: response.data?.error || "Неизвестная ошибка",
          });
        }
      } catch (error: any) {
        console.error("[ОБЗВОН] Ошибка при запуске:", error);

        // Формируем информативное сообщение об ошибке
        let errorMessage = "Ошибка при запуске обзвона";
        let errorDetails = error.message;

        // Если есть ответ от API с деталями ошибки
        if (error.response?.data) {
          errorDetails = error.response.data.error || error.response.data;
        }

        return res.status(500).json({
          success: false,
          message: errorMessage,
          error: errorDetails,
        });
      }
    }
  );

  /**
   * @route POST /api/telephony-accepts-history
   * @desc Принимает историю звонков от Voximplant
   * @access Public (требуется для получения данных от Voximplant)
   */
  app.post(
    "/api/telephony-accepts-history",
    async (req: Request, res: Response) => {
      try {
        const {
          history,
          callee,
          callDuration,
          caller,
          callCost,
          recordUrl,
          incoming,
          status,
        } = req.body;

        console.log(
          `[${new Date().toLocaleTimeString()}] [ИСТОРИЯ] Получена история звонка:`,
          {
            callee,
            callDuration,
            caller,
            callCost,
            recordUrl,
            incoming,
            status,
          }
        );

        // Проверяем, что callDuration определено и является числом
        if (
          callDuration === undefined ||
          callDuration === null ||
          isNaN(Number(callDuration)) ||
          Number(callDuration) < 0
        ) {
          console.error(`[ИСТОРИЯ] Недопустимая длительность: ${callDuration}`);
          return res.status(400).json({
            success: false,
            message: "Недопустимая длительность звонка",
          });
        }

        // Сохраняем историю звонка в базу данных
        try {
          // Находим пользователя по номеру телефона отправителя
          const userNumber = await db.query.telephonyNumbers.findFirst({
            where: (telephonyNumbers, { eq }) =>
              eq(telephonyNumbers.phone_number, caller),
          });

          if (!userNumber) {
            console.warn(
              `[ИСТОРИЯ] Пользователь с номером ${caller} не найден`
            );
            return res.status(404).json({
              success: false,
              message: `Не найден пользователь с номером телефона ${caller}`,
            });
          }

          const userId = userNumber?.userId || 0;
          const callDurationNum = Number(callDuration);
          const durationInMinutes = Math.ceil(callDurationNum / 60);

          // Получаем текущее использование тарифа пользователя
          const userPlanUsageResult = await db.query.userPlanUsage.findFirst({
            where: (userPlanUsage, { eq }) => eq(userPlanUsage.userId, userId),
            orderBy: (userPlanUsage, { desc }) => [
              desc(userPlanUsage.createdAt),
            ],
          });

          let minutesFromPlan = 0;
          let minutesToPayFor = 0;
          let callCostKopecks = 0;

          if (userPlanUsageResult) {
            const currentCallMinutesUsed =
              userPlanUsageResult.callMinutesUsed || 0;
            const callMinutesLimit = userPlanUsageResult.callMinutesLimit || 0;
            const availableMinutes = callMinutesLimit - currentCallMinutesUsed;

            if (availableMinutes > 0) {
              minutesFromPlan = Math.min(durationInMinutes, availableMinutes);
              minutesToPayFor = durationInMinutes - minutesFromPlan;

              // Обновляем использованные минуты в тарифе
              const newCallMinutesUsed =
                currentCallMinutesUsed + minutesFromPlan;

              try {
                await db
                  .update(userPlanUsage)
                  .set({
                    callMinutesUsed: newCallMinutesUsed,
                    updatedAt: new Date(),
                  })
                  .where(eq(userPlanUsage.id, userPlanUsageResult.id));

                console.log(
                  `[ТАРИФ] Обновлено: пользователь ${userId}, ${newCallMinutesUsed}/${callMinutesLimit} мин`
                );
              } catch (updateError) {
                console.error(
                  `[ТАРИФ] Ошибка обновления минут пользователя ${userId}:`,
                  updateError
                );
              }
            } else {
              minutesToPayFor = durationInMinutes;
            }
          } else {
            minutesToPayFor = durationInMinutes;
            console.warn(
              `[ТАРИФ] Не найден тариф пользователя ${userId}, все минуты платные`
            );
          }

          // Если есть минуты к доплате, списываем с баланса
          if (minutesToPayFor > 0) {
            const callCostRubles = minutesToPayFor * CALL_PRICE_PER_MINUTE;
            callCostKopecks = callCostRubles * 100;

            const userResult = await db.query.users.findFirst({
              where: (users, { eq }) => eq(users.id, userId),
            });

            if (!userResult) {
              console.warn(`[СПИСАНИЕ] Пользователь ${userId} не найден`);
              return res.status(404).json({
                success: false,
                message: `Пользователь с ID ${userId} не найден`,
              });
            }

            const currentBalance = userResult.balance || 0;
            const newBalance = currentBalance - callCostKopecks;

            console.log(
              `[СПИСАНИЕ] Пользователь ${userId}: ${minutesToPayFor}мин × ${CALL_PRICE_PER_MINUTE}₽ = ${callCostRubles}₽, баланс: ${
                currentBalance / 100
              }₽ → ${newBalance / 100}₽`
            );

            // Обновляем баланс пользователя
            try {
              await db
                .update(users)
                .set({ balance: newBalance })
                .where(eq(users.id, userId));

              // Проверяем, не стал ли баланс нулевым или отрицательным
              if (newBalance <= 0) {
                console.log(
                  `[СПИСАНИЕ] Баланс пользователя ${userId} стал ${
                    newBalance / 100
                  }₽. Останавливаем обзвон.`
                );
                await stopCallListsForUser(userId, caller);
              }
            } catch (updateError) {
              console.error(
                `[СПИСАНИЕ] Ошибка обновления баланса пользователя ${userId}:`,
                updateError
              );
            }
          }

          // Создаем запись в истории звонков
          await db.insert(telephonyCallHistory).values({
            userId: userId,
            callerNumber: caller,
            calleeNumber: callee,
            callDuration: callDurationNum || 0,
            callCost: callCostKopecks,
            recordUrl: recordUrl || "",
            callStatus: status,
            callType: incoming ? "inbound" : "outbound",
            callTime: new Date(),
            chatHistory: history || [],
            assistantId: req.body.assistantId || null,
          });

          console.log(
            `[ИСТОРИЯ] Звонок сохранен: ${caller}→${callee}, ${durationInMinutes}мин, тариф: ${minutesFromPlan}мин, доплата: ${
              callCostKopecks / 100
            }₽`
          );
        } catch (dbError) {
          console.error("[ИСТОРИЯ] Ошибка сохранения в БД:", dbError);
          return res.status(500).json({
            success: false,
            message: "Ошибка при сохранении истории звонка в БД",
            error: dbError,
          });
        }

        return res.status(200).json({
          success: true,
          message: "История звонка успешно получена и обработана",
        });
      } catch (error: any) {
        console.error("[ИСТОРИЯ] Ошибка обработки:", error);
        return res.status(500).json({
          success: false,
          message: "Ошибка при обработке истории звонка",
          error: error.message,
        });
      }
    }
  );

  /**
   * @route GET /api/telephony/call-history
   * @desc Получает историю звонков пользователя с поддержкой пагинации и фильтрации по периодам
   * @access Private
   */
  app.get(
    "/api/telephony/call-history",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const userId = req.user?.id;

        if (!userId) {
          return res.status(401).json({
            success: false,
            message: "Пользователь не авторизован",
          });
        }

        // Получаем параметры пагинации из запроса
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const period = (req.query.period as string) || "all";
        const offset = (page - 1) * limit;

        // Формируем условие для фильтрации по дате
        let dateFilter = {};
        const now = new Date();

        switch (period) {
          case "today":
            // Сегодня: от начала текущего дня до сейчас
            const startOfToday = new Date(now);
            startOfToday.setHours(0, 0, 0, 0);

            dateFilter = {
              callTime: {
                gte: startOfToday,
                lte: now,
              },
            };
            break;

          case "week":
            // За неделю: последние 7 дней
            const weekAgo = new Date(now);
            weekAgo.setDate(now.getDate() - 7);

            dateFilter = {
              callTime: {
                gte: weekAgo,
                lte: now,
              },
            };
            break;

          case "month":
            // За месяц: последние 30 дней
            const monthAgo = new Date(now);
            monthAgo.setDate(now.getDate() - 30);

            dateFilter = {
              callTime: {
                gte: monthAgo,
                lte: now,
              },
            };
            break;

          case "year":
            // За год: последние 365 дней
            const yearAgo = new Date(now);
            yearAgo.setDate(now.getDate() - 365);

            dateFilter = {
              callTime: {
                gte: yearAgo,
                lte: now,
              },
            };
            break;

          default:
            // По умолчанию ("all"): без фильтрации по дате
            dateFilter = {};
        }

        // Получаем общее количество записей для этого пользователя с учетом фильтра по дате
        const totalCountResult = await db
          .select({ count: count() })
          .from(telephonyCallHistory)
          .where(
            and(
              eq(telephonyCallHistory.userId, userId),
              // Добавляем фильтр по дате, если он задан
              ...(Object.keys(dateFilter).length > 0
                ? [
                    and(
                      gte(
                        telephonyCallHistory.callTime,
                        (dateFilter as any).callTime.gte
                      ),
                      lte(
                        telephonyCallHistory.callTime,
                        (dateFilter as any).callTime.lte
                      )
                    ),
                  ]
                : [])
            )
          );

        const totalCount = totalCountResult[0]?.count || 0;

        // Получаем историю звонков пользователя из базы данных с пагинацией и фильтрацией по дате
        const callHistory = await db.query.telephonyCallHistory.findMany({
          where: (telephonyCallHistory, { eq, and, gte, lte }) => {
            const baseFilter = eq(telephonyCallHistory.userId, userId);

            // Если есть фильтр по дате, добавляем его к условию
            if (Object.keys(dateFilter).length > 0) {
              return and(
                baseFilter,
                and(
                  gte(
                    telephonyCallHistory.callTime,
                    (dateFilter as any).callTime.gte
                  ),
                  lte(
                    telephonyCallHistory.callTime,
                    (dateFilter as any).callTime.lte
                  )
                )
              );
            }

            return baseFilter;
          },
          orderBy: (telephonyCallHistory, { desc }) => [
            desc(telephonyCallHistory.callTime),
          ],
          limit: limit,
          offset: offset,
        });

        // Определяем, есть ли еще страницы
        const hasMore = offset + callHistory.length < totalCount;

        return res.status(200).json({
          success: true,
          history: callHistory,
          currentPage: page,
          totalCount: totalCount,
          hasMore: hasMore,
          totalPages: Math.ceil(totalCount / limit),
        });
      } catch (error: any) {
        console.error("Ошибка при получении истории звонков:", error);
        return res.status(500).json({
          success: false,
          message: "Ошибка при получении истории звонков",
          error: error.message,
        });
      }
    }
  );

  /**
   *  @route POST /api/telephony/ingoing-params
   *  @desc Получает параметры входящего звонка
   *  @access Public
   */
  app.post(
    "/api/telephony/ingoing-params",
    async (req: Request, res: Response) => {
      try {
        const { phone } = req.body;
        console.log(`[ВХОДЯЩИЙ] Запрос параметров для номера: ${phone}`);

        const params = await db.query.telephonyIncomingParams.findFirst({
          where: (params, { eq }) => eq(params.phone, phone),
        });

        if (!params) {
          return res.status(404).json({
            success: false,
            message: "Параметры для указанного номера не найдены",
          });
        }
        const balance = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.id, params.userId),
          columns: {
            balance: true,
          },
        });

        if (
          !balance ||
          typeof balance.balance !== "number" ||
          balance.balance === null
        ) {
          return res.status(404).json({
            success: false,
            message: "Баланс пользователя не найден",
          });
        }

        // Форматируем объект функции, если он существует, name должно быть английскими буквами
        let formattedFuncObj = null;
        if (params.functionObj) {
          formattedFuncObj = {
            ...params.functionObj,
            // @ts-ignore
            name: formatFunctionName(params.functionObj.name || ""),
          };
        }

        return res.status(200).json({
          success: true,
          message: "Параметры входящего звонка успешно получены",
          params: {
            ptomptTask: params.promptTask,
            chatidTg: params.tgChatId,
            tokenTg: params.tgToken,
            funcObj: formattedFuncObj,
            assistantId: params.assistantId,
            callbackUrl: SERVER_URL,
            balance: balance.balance === 0 ? 0 : balance.balance / 100,
          },
        });
      } catch (error: any) {
        console.error(`[ВХОДЯЩИЙ] Ошибка получения параметров:`, error);
        return res.status(500).json({
          success: false,
          message: "Ошибка при получении параметров входящего звонка",
          error: error.message,
        });
      }
    }
  );

  /**
   *  @route POST /api/telephony/new-incoming-params
   *  @desc Сохранение новых настроек для входящих звонков
   *  @access Private
   */
  app.post(
    "/api/telephony/new-incoming-params",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const {
          phone,
          assistantId,
          tgChatId,
          tgToken,
          functionObj,
          promptTask,
        } = req.body;
        const userId = req.user?.id;

        if (!userId) {
          return res.status(401).json({
            success: false,
            message: "Пользователь не авторизован",
          });
        }

        if (!phone) {
          return res.status(400).json({
            success: false,
            message: "Номер телефона не указан",
          });
        }

        // Прикрепляем номер к приложению с роутингом
        try {
          const bindUrl = `${VOXIMPLANT_API_URL}/BindPhoneNumberToApplication`;
          const response = await axios.post(bindUrl, null, {
            params: {
              api_key: VOXIMPLANT_API_KEY,
              account_id: VOXIMPLANT_ACCOUNT_ID,
              phone_number: String(phone),
              application_id: APPLICATION_ID,
              rule_id: INCOMING_CALL_RULE_ID,
              bind: true,
            },
          });
          console.log(`[ВХОДЯЩИЙ] Номер ${phone} прикреплен к приложению`);
        } catch (bindError: any) {
          console.error(
            `[ВХОДЯЩИЙ] Ошибка прикрепления ${phone}:`,
            bindError.response?.data?.error || bindError.message
          );
        }

        // Проверяем, существует ли уже запись для этого номера и пользователя
        const existingRecord = await db.query.telephonyIncomingParams.findFirst(
          {
            where: (params, { and, eq }) =>
              and(eq(params.userId, userId), eq(params.phone, phone)),
          }
        );

        let result;

        if (existingRecord) {
          // Если запись существует, обновляем её
          console.log(`[ВХОДЯЩИЙ] Обновление параметров для ${phone}`);

          result = await db
            .update(telephonyIncomingParams)
            .set({
              assistantId,
              tgChatId,
              tgToken,
              functionObj,
              promptTask,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(telephonyIncomingParams.userId, userId),
                eq(telephonyIncomingParams.phone, phone)
              )
            )
            .returning();

          return res.status(200).json({
            success: true,
            message: "Параметры входящего звонка успешно обновлены",
            record: result[0],
            updated: true,
          });
        } else {
          // Если записи нет, создаём новую
          console.log(`[ВХОДЯЩИЙ] Создание параметров для ${phone}`);

          result = await db
            .insert(telephonyIncomingParams)
            .values({
              userId,
              phone,
              assistantId,
              tgChatId,
              tgToken,
              functionObj,
              promptTask,
            })
            .returning();

          return res.status(200).json({
            success: true,
            message: "Параметры входящего звонка успешно сохранены",
            record: result[0],
            updated: false,
          });
        }
      } catch (error: any) {
        console.error(`[ВХОДЯЩИЙ] Ошибка сохранения параметров:`, error);

        return res.status(500).json({
          success: false,
          message: "Ошибка при сохранении параметров входящего звонка",
          error: error.message,
        });
      }
    }
  );

  /**
   *  @route GET /api/telephony/incoming-params/:phoneNumber
   *  @desc Получение параметров входящего звонка по номеру телефона
   *  @access Private
   */
  app.get(
    "/api/telephony/incoming-params/:phoneNumber",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const phoneNumber = req.params.phoneNumber;
        const userId = req.user?.id;

        if (!userId) {
          return res.status(401).json({
            success: false,
            message: "Пользователь не авторизован",
          });
        }

        if (!phoneNumber) {
          return res.status(400).json({
            success: false,
            message: "Номер телефона не указан",
          });
        }

        // Ищем параметры для указанного номера телефона и пользователя
        const params = await db.query.telephonyIncomingParams.findFirst({
          where: (params, { and, eq }) =>
            and(eq(params.userId, userId), eq(params.phone, phoneNumber)),
        });

        if (params) {
          return res.status(200).json({
            success: true,
            params,
          });
        } else {
          return res.status(200).json({
            success: true,
            params: null,
            message: "У номера нет настроек входящих звонков",
          });
        }
      } catch (error: any) {
        console.error(`[ВХОДЯЩИЙ] Ошибка получения параметров:`, error);

        return res.status(500).json({
          success: false,
          message: "Ошибка при получении параметров входящего звонка",
          error: error.message,
        });
      }
    }
  );

  /**
   *  @route DELETE /api/telephony/incoming-params/:phoneNumber
   *  @desc Удаление параметров входящего звонка по номеру телефона
   *  @access Private
   */
  app.delete(
    "/api/telephony/incoming-params/:phoneNumber",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const phoneNumber = req.params.phoneNumber;
        const userId = req.user?.id;

        if (!userId) {
          return res.status(401).json({
            success: false,
            message: "Пользователь не авторизован",
          });
        }

        if (!phoneNumber) {
          return res.status(400).json({
            success: false,
            message: "Номер телефона не указан",
          });
        }

        console.log(`[ВХОДЯЩИЙ] Удаление параметров для ${phoneNumber}`);

        // Открепляем номер от приложения с роутингом
        try {
          const bindUrl = `${VOXIMPLANT_API_URL}/BindPhoneNumberToApplication`;
          const response = await axios.post(bindUrl, null, {
            params: {
              api_key: VOXIMPLANT_API_KEY,
              account_id: VOXIMPLANT_ACCOUNT_ID,
              phone_number: phoneNumber,
              application_id: APPLICATION_ID,
              rule_id: INCOMING_CALL_RULE_ID,
              bind: false,
            },
          });
          console.log(
            `[ВХОДЯЩИЙ] Номер ${phoneNumber} откреплен от приложения`
          );
        } catch (unbindError: any) {
          console.error(
            `[ВХОДЯЩИЙ] Ошибка открепления ${phoneNumber}:`,
            unbindError.response?.data?.error || unbindError.message
          );
        }

        // Удаляем параметры для указанного номера телефона и пользователя
        const result = await db
          .delete(telephonyIncomingParams)
          .where(
            and(
              eq(telephonyIncomingParams.userId, userId),
              eq(telephonyIncomingParams.phone, phoneNumber)
            )
          )
          .returning();

        if (result && result.length > 0) {
          return res.status(200).json({
            success: true,
            message: "Параметры входящего звонка успешно удалены",
            deletedRecord: result[0],
          });
        } else {
          return res.status(404).json({
            success: false,
            message: "Параметры для указанного номера не найдены",
          });
        }
      } catch (error: any) {
        console.error(`[ВХОДЯЩИЙ] Ошибка удаления параметров:`, error);

        return res.status(500).json({
          success: false,
          message: "Ошибка при удалении параметров входящего звонка",
          error: error.message,
        });
      }
    }
  );

  /**
   * @route POST /api/telephony/send-sms
   * @desc Отправка SMS сообщений через Voximplant SendSmsMessage API
   * @access Private
   */
  app.post(
    "/api/telephony/send-sms",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const { srcNumber, dstNumbers, text } = req.body;
        const userId = req.user?.id;

        if (!userId) {
          return res.status(401).json({
            success: false,
            message: "Пользователь не авторизован",
          });
        }

        // Валидация входных данных
        if (!srcNumber) {
          return res.status(400).json({
            success: false,
            message: "Номер отправителя обязателен",
          });
        }

        if (
          !dstNumbers ||
          !Array.isArray(dstNumbers) ||
          dstNumbers.length === 0
        ) {
          return res.status(400).json({
            success: false,
            message: "Необходимо указать массив номеров получателей",
          });
        }

        if (!text || text.trim().length === 0) {
          return res.status(400).json({
            success: false,
            message: "Текст сообщения обязателен",
          });
        }

        if (text.length > 765) {
          return res.status(400).json({
            success: false,
            message: "Текст сообщения не должен превышать 765 символов",
          });
        }

        console.log(
          `[SMS] Отправка с ${srcNumber} на ${dstNumbers.length} получателей`
        );

        // Проверяем, принадлежит ли номер отправителя пользователю
        const userNumber = await db.query.telephonyNumbers.findFirst({
          where: (telephonyNumbers, { and, eq }) =>
            and(
              eq(telephonyNumbers.userId, userId),
              eq(telephonyNumbers.phone_number, srcNumber)
            ),
        });

        if (!userNumber) {
          return res.status(400).json({
            success: false,
            message:
              "Указанный номер отправителя не принадлежит вам или не существует",
          });
        }

        // Проверяем поддержку SMS
        if (!userNumber.is_sms_supported) {
          return res.status(400).json({
            success: false,
            message: "Указанный номер не поддерживает отправку SMS",
          });
        }

        // Проверяем, включен ли SMS для номера
        if (!userNumber.is_sms_enabled) {
          return res.status(400).json({
            success: false,
            message:
              "SMS не включен для указанного номера. Обратитесь в поддержку для включения SMS.",
          });
        }

        // Проверяем, активен ли номер
        if (userNumber.deactivated || !userNumber.can_be_used) {
          return res.status(400).json({
            success: false,
            message: "Указанный номер не активен или не может быть использован",
          });
        }

        // Проверяем статус SMS для номера
        try {
          const controlSmsUrl = `${VOXIMPLANT_API_URL}/ControlSms`;
          const statusResponse = await axios.post(controlSmsUrl, null, {
            params: {
              api_key: VOXIMPLANT_API_KEY,
              account_id: VOXIMPLANT_ACCOUNT_ID,
              phone_number: srcNumber,
              command: "enable",
            },
          });

          if (!(statusResponse.data && statusResponse.data.result)) {
            console.warn(
              `[SMS] Проблема со статусом SMS для номера ${srcNumber}`
            );
          }
        } catch (statusError: any) {
          console.error(
            `[SMS] Ошибка проверки статуса SMS ${srcNumber}:`,
            statusError.response?.data?.error || statusError.message
          );
          return res.status(400).json({
            success: false,
            message: "Не удалось проверить статус SMS для номера",
            error: statusError.response?.data?.error || statusError.message,
          });
        }

        // Форматируем номера получателей
        const formattedNumbers = dstNumbers.map((number: string) => {
          let cleanNumber = number.replace(/[^\d]/g, "");
          if (!cleanNumber.startsWith("7") && cleanNumber.length === 10) {
            cleanNumber = "7" + cleanNumber;
          }
          return cleanNumber;
        });

        // Отправляем SMS на каждый номер отдельно
        const results: any[] = [];
        let successCount = 0;
        let failedCount = 0;

        for (const dstNumber of formattedNumbers) {
          try {
            const apiUrl = `${VOXIMPLANT_API_URL}/SendSmsMessage`;
            const response = await axios.post(apiUrl, null, {
              params: {
                api_key: VOXIMPLANT_API_KEY,
                account_id: VOXIMPLANT_ACCOUNT_ID,
                source: srcNumber,
                destination: dstNumber,
                sms_body: text.trim(),
                store_body: true,
              },
            });

            if (response.data && response.data.result) {
              successCount++;
              results.push({
                phone: dstNumber,
                success: true,
                messageId: response.data.message_id,
                fragmentsCount: response.data.fragments_count,
              });
            } else {
              failedCount++;
              results.push({
                phone: dstNumber,
                success: false,
                error: response.data?.error || "Неизвестная ошибка",
              });
            }
          } catch (error: any) {
            console.error(
              `[SMS] Ошибка отправки на ${dstNumber}:`,
              error.response?.data || error.message
            );
            failedCount++;
            results.push({
              phone: dstNumber,
              success: false,
              error: error.response?.data?.error || error.message,
            });
          }
        }

        console.log(
          `[SMS] Результат: ${successCount} успешно, ${failedCount} ошибок`
        );

        // Списываем SMS с тарифа и баланса пользователя за успешно отправленные SMS
        if (successCount > 0) {
          try {
            const calculateSmsCount = (text: string): number => {
              if (!text.trim()) return 0;
              return Math.ceil(text.length / 70);
            };

            const smsCountPerMessage = calculateSmsCount(text);
            const totalSmsToDeduct = smsCountPerMessage * successCount;

            // Получаем информацию о тарифном плане пользователя
            const userPlanUsageResult = await db.query.userPlanUsage.findFirst({
              where: (userPlanUsage, { eq }) =>
                eq(userPlanUsage.userId, userId),
              orderBy: (userPlanUsage, { desc }) => [
                desc(userPlanUsage.createdAt),
              ],
            });

            let smsFromPlan = 0;
            let smsToPay = 0;

            if (userPlanUsageResult) {
              const currentSmsUsed = userPlanUsageResult.smsUsed || 0;
              const smsLimit = userPlanUsageResult.smsLimit || 0;
              const availableSms = smsLimit - currentSmsUsed;

              if (availableSms > 0) {
                smsFromPlan = Math.min(totalSmsToDeduct, availableSms);
                smsToPay = totalSmsToDeduct - smsFromPlan;

                // Обновляем использованные SMS в тарифе
                const newSmsUsed = currentSmsUsed + smsFromPlan;

                try {
                  await db
                    .update(userPlanUsage)
                    .set({
                      smsUsed: newSmsUsed,
                      updatedAt: new Date(),
                    })
                    .where(eq(userPlanUsage.id, userPlanUsageResult.id));

                  console.log(
                    `[SMS] [ТАРИФ] Обновлено: ${newSmsUsed}/${smsLimit} SMS`
                  );
                } catch (updateError) {
                  console.error(
                    `[SMS] [ТАРИФ] Ошибка обновления SMS:`,
                    updateError
                  );
                }
              } else {
                smsToPay = totalSmsToDeduct;
              }
            } else {
              smsToPay = totalSmsToDeduct;
              console.warn(
                `[SMS] [ТАРИФ] Не найден тариф пользователя ${userId}, все SMS платные`
              );
            }

            // Если есть SMS к доплате, списываем с баланса
            if (smsToPay > 0) {
              const pricePerSms = 5.0;
              const totalCostInRubles = smsToPay * pricePerSms;
              const totalCostInKopecks = Math.round(totalCostInRubles * 100);

              const currentUser = await db.query.users.findFirst({
                where: eq(users.id, userId),
                columns: { balance: true },
              });

              if (
                currentUser &&
                currentUser.balance !== null &&
                currentUser.balance >= totalCostInKopecks
              ) {
                // Списываем средства с баланса
                await db
                  .update(users)
                  .set({
                    balance: currentUser.balance - totalCostInKopecks,
                    totalSpent: sql`${users.totalSpent} + ${totalCostInKopecks}`,
                  })
                  .where(eq(users.id, userId));

                console.log(
                  `[SMS] [СПИСАНИЕ] Списано ${totalCostInRubles}₽ с баланса пользователя ${userId}. Остаток: ${
                    (currentUser.balance - totalCostInKopecks) / 100
                  }₽`
                );
              } else {
                console.warn(
                  `[SMS] [СПИСАНИЕ] Недостаточно средств. Требуется: ${totalCostInRubles}₽, доступно: ${
                    (currentUser?.balance || 0) / 100
                  }₽`
                );
              }
            }

            console.log(
              `[SMS] [ИТОГО] Отправлено ${totalSmsToDeduct} SMS: ${smsFromPlan} из тарифа + ${smsToPay} платных`
            );
          } catch (balanceError: any) {
            console.error(`[SMS] Ошибка при списании SMS:`, balanceError);
          }
        }

        return res.status(successCount > 0 ? 200 : 400).json({
          success: successCount > 0,
          message: `SMS отправлено. Успешно: ${successCount}, ошибок: ${failedCount}`,
          successCount,
          failedCount,
          totalCount: dstNumbers.length,
          results,
        });
      } catch (error: any) {
        console.error(`[SMS] Ошибка при отправке SMS:`, error);

        return res.status(500).json({
          success: false,
          message: "Ошибка при отправке SMS",
          error: error.message,
        });
      }
    }
  );

  /**
   *  @route GET /api/telephony/balance/:phoneNumber
   *  @desc Получение баланса пользователя и информации о доступных минутах тарифа
   *  @access Private
   */
  app.get(
    "/api/telephony/balance/:phoneNumber",
    async (req: Request, res: Response) => {
      try {
        const phone = req.params.phoneNumber;

        if (!phone) {
          return res.status(400).json({
            success: false,
            message: "Номер телефона не указан",
          });
        }

        const userRecord = await db.query.telephonyNumbers.findFirst({
          where: (numbers, { eq }) => eq(numbers.phone_number, phone),
          columns: {
            userId: true,
          },
        });

        if (!userRecord) {
          return res.status(404).json({
            success: false,
            message: "Пользователь не найден",
          });
        }

        // Получаем баланс пользователя
        const userBalance = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.id, userRecord.userId),
          columns: {
            balance: true,
          },
        });

        if (
          !userBalance ||
          typeof userBalance.balance !== "number" ||
          userBalance.balance === null
        ) {
          return res.status(404).json({
            success: false,
            message: "Баланс пользователя не найден",
          });
        }

        // Получаем информацию о тарифном плане пользователя
        const userPlanUsageResult = await db.query.userPlanUsage.findFirst({
          where: (userPlanUsage, { eq }) =>
            eq(userPlanUsage.userId, userRecord.userId),
          orderBy: (userPlanUsage, { desc }) => [desc(userPlanUsage.createdAt)],
        });

        const balance = Math.round(userBalance.balance / 100);

        // Рассчитываем доступные минуты из тарифа
        let availableMinutes = 0;

        if (userPlanUsageResult) {
          const currentCallMinutesUsed =
            userPlanUsageResult.callMinutesUsed || 0;
          const callMinutesLimit = userPlanUsageResult.callMinutesLimit || 0;
          availableMinutes = Math.max(
            0,
            callMinutesLimit - currentCallMinutesUsed
          );

          console.log(
            `[${new Date().toLocaleTimeString()}] [БАЛАНС] Информация о тарифе для пользователя ${
              userRecord.userId
            }: ${availableMinutes} из ${callMinutesLimit} мин доступно`
          );
        } else {
          console.log(
            `[${new Date().toLocaleTimeString()}] [БАЛАНС] У пользователя ${
              userRecord.userId
            } нет активного тарифного плана`
          );
        }

        return res.status(200).json({
          success: true,
          balance,
          availableMinutes, // доступные минуты
        });
      } catch (error: any) {
        console.error(
          "не удалось получить баланс пользователя по номеру телефона",
          error
        );
        return res.status(500).json({
          success: false,
          message: "Не удалось получить баланс пользователя по номеру телефона",
          error: error.message,
        });
      }
    }
  );

  /**
   * @route GET /api/telephony/sms-history
   * @desc Получение истории SMS через Voximplant GetSmsHistory API
   * @access Private
   */
  app.get(
    "/api/telephony/sms-history",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const userId = req.user?.id;

        if (!userId) {
          return res.status(401).json({
            success: false,
            message: "Пользователь не авторизован",
          });
        }

        // Получаем параметры фильтрации из query string
        const {
          count = "20",
          offset = "0",
          direction,
          source_number,
          destination_number,
          from_date,
          to_date,
        } = req.query;

        // Проверяем, что указан номер телефона
        if (!source_number) {
          return res.status(400).json({
            success: false,
            message: "Необходимо указать номер телефона для получения истории",
          });
        }

        // Проверяем, принадлежит ли номер пользователю
        const userNumber = await db.query.telephonyNumbers.findFirst({
          where: (telephonyNumbers, { and, eq }) =>
            and(
              eq(telephonyNumbers.userId, userId),
              eq(telephonyNumbers.phone_number, source_number.toString())
            ),
        });

        if (!userNumber) {
          return res.status(403).json({
            success: false,
            message: "Указанный номер телефона не принадлежит вам",
          });
        }

        // Формируем два запроса: для исходящих и входящих SMS
        const promises = [];

        // Запрос для исходящих SMS (где выбранный номер - отправитель)
        if (!direction || direction === "ALL" || direction === "OUT") {
          const outgoingParams: any = {
            api_key: VOXIMPLANT_API_KEY,
            account_id: VOXIMPLANT_ACCOUNT_ID,
            count: count.toString(),
            offset: offset.toString(),
            output: "json",
            direction: "OUT",
            source_number: source_number.toString(),
          };

          // Добавляем дополнительные фильтры
          if (destination_number) {
            outgoingParams.destination_number = destination_number.toString();
          }
          if (from_date && typeof from_date === "string") {
            outgoingParams.from_date = from_date;
          }
          if (to_date && typeof to_date === "string") {
            outgoingParams.to_date = to_date;
          }

          const apiUrl = `${VOXIMPLANT_API_URL}/GetSmsHistory`;
          promises.push(
            axios.get(apiUrl, { params: outgoingParams }).then((response) => ({
              type: "outgoing",
              data: response.data,
            }))
          );
        }

        // Запрос для входящих SMS (где выбранный номер - получатель)
        if (!direction || direction === "ALL" || direction === "IN") {
          const incomingParams: any = {
            api_key: VOXIMPLANT_API_KEY,
            account_id: VOXIMPLANT_ACCOUNT_ID,
            count: count.toString(),
            offset: offset.toString(),
            output: "json",
            direction: "IN",
            destination_number: source_number.toString(),
          };

          // Добавляем дополнительные фильтры
          if (from_date && typeof from_date === "string") {
            incomingParams.from_date = from_date;
          }
          if (to_date && typeof to_date === "string") {
            incomingParams.to_date = to_date;
          }

          const apiUrl = `${VOXIMPLANT_API_URL}/GetSmsHistory`;
          promises.push(
            axios.get(apiUrl, { params: incomingParams }).then((response) => ({
              type: "incoming",
              data: response.data,
            }))
          );
        }

        // Выполняем запросы параллельно
        const responses = await Promise.all(promises);

        // Объединяем результаты
        let allSms: any[] = [];
        let totalCount = 0;

        responses.forEach((response) => {
          if (response.data && response.data.result) {
            allSms = allSms.concat(response.data.result);
            totalCount += response.data.total_count || 0;
          }
        });

        // Применяем дополнительную фильтрацию по destination_number если он задан
        if (destination_number) {
          allSms = allSms.filter((sms) => {
            // Для исходящих SMS проверяем destination_number
            if (sms.direction === "OUT") {
              return (
                sms.destination_number?.toString() ===
                destination_number.toString()
              );
            }
            // Для входящих SMS проверяем source_number (от кого получили)
            if (sms.direction === "IN") {
              return (
                sms.source_number?.toString() === destination_number.toString()
              );
            }
            return false;
          });
          // Пересчитываем общее количество после фильтрации
          totalCount = allSms.length;
        }

        // Сортируем по дате (новые первыми)
        allSms.sort((a, b) => {
          const dateA = new Date(a.processed_date || 0).getTime();
          const dateB = new Date(b.processed_date || 0).getTime();
          return dateB - dateA;
        });

        // Применяем пагинацию к объединенным результатам
        const startIndex = parseInt(offset.toString());
        const limitCount = parseInt(count.toString());
        const paginatedSms = allSms.slice(startIndex, startIndex + limitCount);

        // Преобразуем данные в нужный формат
        const transformedResult = paginatedSms.map((sms: any) => ({
          messageId: sms.message_id,
          sourceNumber: sms.source_number?.toString() || "",
          destinationNumber: sms.destination_number?.toString() || "",
          text: sms.text || null,
          direction: sms.direction || "",
          processedDate: sms.processed_date || "",
          statusId: sms.status_id?.toString() || "",
          cost: sms.cost || 0, // Стоимость в рублях от Voximplant
          fragments: sms.fragments || 1,
          errorMessage: sms.error_message || null,
          transactionId: sms.transaction_id || null,
        }));

        return res.status(200).json({
          result: transformedResult,
          total_count: totalCount,
        });
      } catch (error: any) {
        console.error(
          `[SMS HISTORY] Ошибка получения истории:`,
          error.response?.data || error.message
        );

        return res.status(500).json({
          success: false,
          message: "Ошибка при получении истории SMS",
          error: error.response?.data?.error || error.message,
        });
      }
    }
  );

  /**
   * @route POST /api/telephony/check-expired-numbers
   * @desc Запускает проверку истекших номеров вручную (для администраторов)
   * @access Private
   */
  app.post(
    "/api/telephony/check-expired-numbers",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const userId = req.user?.id;

        if (!userId) {
          return res.status(401).json({
            success: false,
            message: "Пользователь не авторизован",
          });
        }

        // Импортируем функцию проверки
        const { checkPhoneNumbersExpiration } = await import(
          "../cron/check-phone-numbers-expiration"
        );

        // Запускаем проверку асинхронно
        checkPhoneNumbersExpiration().catch((error) => {
          console.error(
            "[API] Ошибка при выполнении проверки истекших номеров:",
            error
          );
        });

        return res.status(200).json({
          success: true,
          message: "Проверка истекших номеров запущена",
        });
      } catch (error: any) {
        console.error(
          "[API] Ошибка при запуске проверки истекших номеров:",
          error
        );

        return res.status(500).json({
          success: false,
          message: "Ошибка при запуске проверки",
          error: error.message,
        });
      }
    }
  );
}
