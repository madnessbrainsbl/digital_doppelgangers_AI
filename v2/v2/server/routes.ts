import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, IStorage } from "./storage";
import { openaiService } from "./services/openai";
import { emailService } from "./services/email";
import { authService } from "./services/auth";
import { vkService, VkConversation } from "./services/vk";
import { avitoService } from "./services/avito";
import { yookassaService } from "./services/yukassa";
import { db, pgPool } from "./db";
import { sql, eq, and } from "drizzle-orm";
import { assistantExamples, tariffPlans } from "@shared/schema";
import { telegramService } from "./services/telegramService";
import { smsService } from "./services/sms";
import { registerTrialRoutes } from "./routes/trial-routes";
import { registerMetricsRoutes } from "./routes/metrics-routes";
import { registerUserRoutes } from "./routes/user-routes";
import { trackAssistantMessage } from "./utils/message-tracker";
import { FunctionToolsUpdater } from "./services/function-tools-updater";
import "dotenv/config";
import { isAssistantAvailableBySchedule } from "./utils/schedule-helper";
import { registerUpdateAssistantFunctionsRoutes } from "./routes/update-assistant-functions";
import { registerAddSingleFunctionRoute } from "./routes/add-single-function";
import { registerGetAssistantFunctionsRoute } from "./routes/get-assistant-functions";
import removeFunctionByNameRoutes from "./routes/remove-function-by-name";
import { z } from "zod";
import { uploadImageByUrlToStableServer } from "./utils/image-uploader";
import {
  insertUserSchema,
  insertAssistantSchema,
  insertKnowledgeItemSchema,
  insertChannelSchema,
  insertConversationSchema,
  insertMessageSchema,
  insertReferralTransactionSchema,
  insertActivityLogSchema,
  insertMetricSchema,
  insertAssistantFileSchema,
  insertTestimonialSchema,
  smsChannelSettingsSchema,
} from "@shared/schema";
import multer from "multer";
import { Buffer } from "buffer";
import { Request, Response, NextFunction } from "express";
import {
  isSpreadsheetFile,
  convertToSupportedFormat,
  isOpenAISupportedFormat,
} from "./utils/file-converter";
import { getErrorMessage } from "./utils/error-handler";
import { authenticateToken, checkRole } from "./middlewares/auth";
import type { Conversation, DialogAssistant, Channel } from "@shared/schema";
import { postgresStorage } from "./postgres-storage";
import { AssistantTrainingService } from "./services/assistant-training";

// Инициализация сервиса
const assistantTrainingService = new AssistantTrainingService(openaiService);
import { createUpdateFunctionChannelRoute } from "./routes/update-function-channel";
import { registerTelephonyRoutes } from "./routes/telephony-routes";

// Тип сообщения из VK
interface VkMessage {
  id: number;
  date: number;
  fromId: number;
  peerId: number;
  text: string;
  attachments?: Array<any>;
  important?: boolean;
  random_id?: number;
  is_hidden?: boolean;
  out?: number; // 1 для исходящих сообщений
}

// Интерфейс сообщения треда OpenAI
interface ThreadMessage {
  id: string;
  role: "user" | "assistant";
  content: Array<{
    type: string;
    text: {
      value: string;
      annotations: any[];
    };
  }>;
  created_at: number;
}

/**
 * Обрабатывает реферальное вознаграждение при регистрации нового пользователя
 * @param userId ID нового пользователя
 * @param referrerId ID реферала
 * @param storage Экземпляр хранилища
 */
async function processReferralRegistrationReward(
  userId: number,
  referrerId: number,
  storage: IStorage
): Promise<void> {
  try {
    console.log(
      `[REFERRAL] Начало обработки реферального вознаграждения для пользователя ${userId} от реферала ${referrerId}`
    );

    // Получаем информацию о реферале
    const referrer = await storage.getUser(referrerId);
    if (!referrer) {
      console.error(`[REFERRAL] Реферал с ID ${referrerId} не найден`);
      return;
    }

    // Проверяем, есть ли у реферала менеджер
    const managerId = referrer.managerId;

    // Стандартная сумма регистрации - бесплатно, но мы всё равно записываем транзакцию
    const amount = 0;

    // Комиссии за регистрацию - будут начислены в будущем при оплате
    const referralCommission = 0;
    const managerCommission = 0;

    // Создаем реферальную транзакцию
    const transaction = await storage.createReferralTransaction({
      userId,
      referrerId,
      managerId,
      amount,
      referralCommission,
      managerCommission,
      description: "Регистрация по реферальной ссылке",
      status: "processed",
    });

    console.log(
      `[REFERRAL] Создана реферальная транзакция ID: ${transaction.id}`
    );

    // Логируем активность
    await storage.createActivityLog({
      userId,
      action: "referral_registration",
      details: {
        referrerId,
        managerId: managerId || undefined,
        transactionId: transaction.id,
      },
    });

    console.log(`[REFERRAL] Вознаграждение за регистрацию обработано успешно`);
  } catch (error) {
    console.error(
      `[REFERRAL] Ошибка при обработке реферального вознаграждения:`,
      error
    );
    throw error;
  }
}

/**
 * Обрабатывает реферальное вознаграждение при пополнении баланса
 * @param userId ID пользователя, пополнившего баланс
 * @param amount Сумма пополнения в копейках
 * @param storage Экземпляр хранилища
 */
// Новая оптимизированная версия функции для обработки реферальных вознаграждений
async function processReferralPaymentRewardV2(
  userId: number,
  amount: number
): Promise<void> {
  try {
    console.log(
      `[REFERRAL-V2] Начало обработки реферального вознаграждения за пополнение баланса пользователем ${userId} на сумму ${Math.floor(
        amount / 100
      )} руб.`
    );

    // Проверка входных данных
    if (!userId || userId <= 0) {
      console.error(
        `[REFERRAL-V2] ОШИБКА: Некорректный ID пользователя: ${userId}`
      );
      return;
    }

    if (!amount || amount <= 0) {
      console.error(
        `[REFERRAL-V2] ОШИБКА: Некорректная сумма пополнения: ${amount}`
      );
      return;
    }

    // Проверяем, нет ли уже транзакции для этого пользователя и суммы
    const existingTransaction = await db.execute(
      sql`SELECT id FROM referral_transactions 
          WHERE user_id = ${userId} AND amount = ${amount} AND created_at > NOW() - INTERVAL '1 day'`
    );

    if (
      existingTransaction &&
      existingTransaction.rows &&
      existingTransaction.rows.length > 0
    ) {
      console.log(
        `[REFERRAL-V2] ВНИМАНИЕ: Найдена существующая реферальная транзакция для пользователя ${userId} на сумму ${amount} за последние 24 часа (ID: ${existingTransaction.rows[0].id}). Пропускаем обработку.`
      );
      return;
    }

    // Прямой запрос в базу для получения информации о пользователе и его реферере
    console.log(
      `[REFERRAL-V2] Выполняем запрос для получения данных пользователя ${userId}`
    );
    const userQuery = await db.execute(
      sql`SELECT 
            u.id, u.email, u.referrer_id, u.balance,
            r.id as ref_id, r.email as ref_email, r.balance as ref_balance, r.manager_id as ref_manager_id,
            m.id as manager_id, m.email as manager_email, m.balance as manager_balance
          FROM 
            users u
            LEFT JOIN users r ON u.referrer_id = r.id
            LEFT JOIN users m ON r.manager_id = m.id
          WHERE 
            u.id = ${userId}`
    );

    // Проверяем результаты запроса
    if (!userQuery || !userQuery.rows) {
      console.error(
        `[REFERRAL-V2] ОШИБКА: Запрос данных пользователя ${userId} вернул пустой результат`
      );
      return;
    }

    if (userQuery.rows.length === 0) {
      console.error(
        `[REFERRAL-V2] ОШИБКА: Пользователь с ID ${userId} не найден в базе данных`
      );
      return;
    }

    const userData = userQuery.rows[0];

    // Проверяем, есть ли у пользователя реферрер
    if (!userData.referrer_id) {
      console.log(
        `[REFERRAL-V2] Пользователь ${userId} (${userData.email}) не был приглашен по реферальной программе, вознаграждение не начисляется`
      );
      return;
    }

    // Проверяем корректность данных реферрера
    if (!userData.ref_id) {
      console.error(
        `[REFERRAL-V2] ОШИБКА: У пользователя ${userId} указан referrer_id=${userData.referrer_id}, но реферрер не найден в базе`
      );
      return;
    }

    const referrerId = userData.referrer_id;
    const referrerBalance = Number(userData.ref_balance || 0);
    const managerId = userData.ref_manager_id;
    const managerBalance = Number(userData.manager_balance || 0);

    let referralCommission = 0;
    let managerCommission = 0;

    // Рассчитываем комиссии в зависимости от наличия менеджера
    if (managerId) {
      // Если есть и реферрер, и менеджер: каждый получает 10%
      referralCommission = Math.floor(amount * 0.1); // 10% от суммы пополнения
      managerCommission = Math.floor(amount * 0.1); // 10% от суммы пополнения
    } else {
      // Если есть только реферрер: он получает 20%
      referralCommission = Math.floor(amount * 0.2); // 20% от суммы пополнения
      managerCommission = 0;
    }

    // Записываем транзакцию напрямую в базу
    try {
      const trxResult = await db.execute(
        sql`INSERT INTO referral_transactions 
            (user_id, referrer_id, manager_id, amount, referral_commission, manager_commission, description, status, created_at) 
            VALUES 
            (${userId}, ${referrerId}, ${
          managerId || null
        }, ${amount}, ${referralCommission}, ${managerCommission}, 
             ${
               "Пополнение баланса на " + Math.floor(amount / 100) + " руб."
             }, ${"processed"}, NOW())
            RETURNING id`
      );

      if (!trxResult.rows || trxResult.rows.length === 0) {
        console.error(
          `[REFERRAL-V2] ОШИБКА: Не удалось создать запись о реферальной транзакции`
        );
        return;
      }

      const transactionId = trxResult.rows[0]?.id;
      console.log(
        `[REFERRAL-V2] Создана реферальная транзакция ID: ${transactionId}`
      );

      // Обновляем баланс реферрера напрямую через SQL
      if (referralCommission > 0) {
        try {
          const newRefBalance = referrerBalance + referralCommission;
          await db.execute(
            sql`UPDATE users SET balance = ${newRefBalance} WHERE id = ${referrerId}`
          );

          console.log(
            `[REFERRAL-V2] Баланс реферрера ${referrerId} обновлен: ${referrerBalance} -> ${newRefBalance}`
          );

          // Логируем активность
          try {
            await db.execute(
              sql`INSERT INTO activity_logs 
                  (user_id, action, details, timestamp) 
                  VALUES 
                  (${referrerId}, ${"referral_commission"}, 
                   ${JSON.stringify({
                     userId,
                     transactionId,
                     amount: referralCommission,
                     transactionTotal: amount,
                   })}, 
                   NOW())`
            );
          } catch (logError) {
            console.error(
              `[REFERRAL-V2] ОШИБКА при записи в activity_logs для реферрера:`,
              logError
            );
          }
        } catch (error) {
          console.error(
            `[REFERRAL-V2] ОШИБКА при обновлении баланса реферрера:`,
            error
          );
        }
      }

      // Обновляем баланс менеджера напрямую через SQL
      if (managerCommission > 0 && managerId) {
        try {
          const newMgrBalance = managerBalance + managerCommission;

          await db.execute(
            sql`UPDATE users SET balance = ${newMgrBalance} WHERE id = ${managerId}`
          );

          console.log(
            `[REFERRAL-V2] Баланс менеджера ${managerId} обновлен: ${managerBalance} -> ${newMgrBalance}`
          );

          // Логируем активность
          try {
            await db.execute(
              sql`INSERT INTO activity_logs 
                  (user_id, action, details, timestamp) 
                  VALUES 
                  (${managerId}, ${"manager_commission"}, 
                   ${JSON.stringify({
                     userId,
                     transactionId,
                     amount: managerCommission,
                     transactionTotal: amount,
                   })}, 
                   NOW())`
            );
          } catch (logError) {
            console.error(
              `[REFERRAL-V2] ОШИБКА при записи в activity_logs для менеджера:`,
              logError
            );
          }
        } catch (error) {
          console.error(
            `[REFERRAL-V2] ОШИБКА при обновлении баланса менеджера:`,
            error
          );
        }
      }

      // Проверка результатов
      try {
        const checkResult = await db.execute(
          sql`SELECT 
                r.id as ref_id, r.balance as ref_balance,
                m.id as mgr_id, m.balance as mgr_balance
              FROM 
                users u
                LEFT JOIN users r ON u.referrer_id = r.id
                LEFT JOIN users m ON r.manager_id = m.id
              WHERE 
                u.id = ${userId}`
        );
      } catch (checkError) {
        console.error(
          `[REFERRAL-V2] ОШИБКА при проверке результатов:`,
          checkError
        );
      }

      console.log(`[REFERRAL-V2] Вознаграждение обработано успешно`);
    } catch (trxError) {
      console.error(
        `[REFERRAL-V2] КРИТИЧЕСКАЯ ОШИБКА при создании транзакции:`,
        trxError
      );
    }
  } catch (error) {
    console.error(
      `[REFERRAL-V2] КРИТИЧЕСКАЯ ОШИБКА обработки реферального вознаграждения:`,
      error
    );
  }
}

// Глобальный кэш для отслеживания обработанных сообщений
// Ключ: ID сообщения в формате channelId:chatId:messageId, Значение: временная метка обработки
const processedMessages = new Map<string, number>();

// Очистка кэша от старых записей (старше 24 часов)
const clearOldProcessedMessages = () => {
  const now = Date.now();
  const oneDayInMs = 24 * 60 * 60 * 1000;

  // Обходим кеш безопасным способом
  processedMessages.forEach((timestamp, messageId) => {
    if (now - timestamp > oneDayInMs) {
      processedMessages.delete(messageId);
    }
  });
};

// Запускаем периодическую очистку кэша (раз в час)
setInterval(clearOldProcessedMessages, 60 * 60 * 1000);

/**
 * Находит или создает разговор для указанного канала и внешнего ID пользователя
 */
async function findOrCreateConversation(
  storage: IStorage,
  channelId: number,
  externalUserId: string,
  assistantId: number | null = null,
  createdBy: number = 0
): Promise<Conversation> {
  console.log(
    `[CONVERSATION] Поиск диалога: канал=${channelId}, пользователь=${externalUserId}`
  );

  // Получаем все разговоры для этого канала
  const conversations = await storage.listConversationsByChannel(channelId);
  console.log(
    `[CONVERSATION] Найдено диалогов в канале: ${conversations.length}`
  );

  // Выводим все найденные диалоги для отладки
  conversations.forEach((conv) => {
    console.log(
      `[CONVERSATION] Диалог ${conv.id}: externalUserId=${conv.externalUserId}`
    );
  });

  // Ищем существующий разговор с этим внешним ID пользователя
  const existingConversation = conversations.find(
    (conv) => conv.externalUserId === externalUserId
  );

  if (existingConversation) {
    console.log(
      `[CONVERSATION] Найден существующий диалог ID=${existingConversation.id}`
    );
    return existingConversation;
  }

  console.log(
    `[CONVERSATION] Создаем новый диалог для пользователя ${externalUserId} в канале ${channelId}`
  );

  try {
    // Если не нашли, создаем новый разговор
    const newConversation = await storage.createConversation({
      channelId,
      externalUserId,
      status: "active",
      createdBy,
      assistantId,
      userId: null,
      threadId: null,
    });

    console.log(
      `[CONVERSATION] Создан новый диалог ID=${newConversation.id}, externalUserId=${newConversation.externalUserId}`
    );
    return newConversation;
  } catch (error) {
    console.error(`[CONVERSATION] Ошибка при создании диалога:`, error);
    // В случае ошибки, попробуем еще раз получить диалог (может он уже был создан в другом потоке)
    const conversations = await storage.listConversationsByChannel(channelId);
    const existingConversation = conversations.find(
      (conv) => conv.externalUserId === externalUserId
    );

    if (existingConversation) {
      console.log(
        `[CONVERSATION] Найден диалог после ошибки: ID=${existingConversation.id}`
      );
      return existingConversation;
    }

    throw error; // Если не нашли, пробрасываем ошибку дальше
  }
}

/**
 * Обрабатывает веб-сообщения для чат виджета и создает диалоги с соответствующими ассистентами
 * @param channelId ID канала веб-чата
 * @param visitorId ID посетителя сайта, сгенерированный на стороне клиента
 * @param content Содержимое сообщения
 * @param storage Экземпляр хранилища
 * @param conversationIdParam Опциональный ID существующего разговора
 */
async function processWebMessage(
  channelId: number,
  visitorId: string,
  content: string,
  storage: IStorage,
  conversationIdParam?: number | string,
  messageId?: string
): Promise<{
  success: boolean;
  conversation?: Conversation;
  message?: any;
  hasAssistant?: boolean;
  assistantEnabled?: boolean;
  assistantMessage?: any;
  error?: string;
}> {
  try {
    console.log(
      `[PROCESS-MSG] Старт обработки сообщения. Канал ID=${channelId}, visitorId=${visitorId}, длина=${content.length}`
    );

    // Получаем информацию о канале
    const channel = await storage.getChannel(channelId);
    if (!channel) {
      console.error(`[PROCESS-MSG] Канал не найден: ID=${channelId}`);
      return { success: false, error: "Канал не найден" };
    }

    if (channel.type !== "web") {
      console.error(
        `[PROCESS-MSG] Указанный канал не является веб-каналом: type=${channel.type}`
      );
      return {
        success: false,
        error: "Указанный канал не является веб-каналом",
      };
    }

    console.log(
      `[PROCESS-MSG] Канал найден: ${channel.name} (${channel.type})`
    );

    // Находим или создаем разговор для этого посетителя веб-сайта
    let conversation;

    if (conversationIdParam) {
      // Если передан ID разговора, пытаемся найти его
      const convId =
        typeof conversationIdParam === "string"
          ? parseInt(conversationIdParam)
          : conversationIdParam;
      console.log(`[PROCESS-MSG] Ищем разговор по ID: ${convId}`);
      if (!isNaN(convId)) {
        conversation = await storage.getConversation(convId);
      }

      if (!conversation) {
        console.log(
          `[PROCESS-MSG] Разговор не найден по ID, создаём новый для visitorId=${visitorId}`
        );
        // Если разговор не найден по ID, используем его как externalUserId
        conversation = await findOrCreateConversation(
          storage,
          channelId,
          visitorId,
          null, // Ассистент будет назначен позже
          channel.createdBy // Используем владельца канала вместо 0
        );
      } else {
        console.log(
          `[PROCESS-MSG] Найден существующий разговор ID=${conversation.id}`
        );
      }
    } else {
      console.log(
        `[PROCESS-MSG] ID разговора не передан, ищем/создаём по visitorId=${visitorId}`
      );
      // Создаем новый разговор
      conversation = await findOrCreateConversation(
        storage,
        channelId,
        visitorId,
        null, // Ассистент будет назначен позже
        channel.createdBy // Используем владельца канала вместо 0
      );
      console.log(`[PROCESS-MSG] Разговор установлен: ID=${conversation.id}`);
    }

    // Добавляем сообщение от пользователя
    const messageData = {
      conversationId: conversation.id,
      senderType: "user",
      content,
      metadata: {
        visitorId,
        timestamp: new Date().toISOString(),
        tempId: messageId, // Сохраняем временный ID из виджета для отслеживания дубликатов
      },
    };

    console.log(
      `[PROCESS-MSG] Создаём сообщение пользователя в разговоре ID=${conversation.id}:`,
      messageData
    );

    const createdMessageId = await storage.createMessage(messageData);

    // Обновляем время последнего сообщения в разговоре
    if (conversation.id) {
      // Обновляем статус разговора
      await storage.updateConversation(conversation.id, {
        status: "active",
      });
    }

    // Проверяем, есть ли ассистент для канала
    const assistantChannel = await storage.getAssistantChannelByChannel(
      channelId
    );
    if (!assistantChannel) {
      return {
        success: true,
        conversation,
        message: { id: createdMessageId, content, senderType: "user" },
        hasAssistant: false,
      };
    }

    // Проверяем, есть ли специальный ассистент для этого диалога
    const dialogAssistant = await storage.getDialogAssistantByDialogAndChannel(
      visitorId,
      channelId
    );

    // Если для этого диалога есть специальные настройки и ассистент отключен, не отправляем сообщение
    if (dialogAssistant && !dialogAssistant.enabled) {
      return {
        success: true,
        conversation,
        message: { id: createdMessageId, content, senderType: "user" },
        hasAssistant: true,
        assistantEnabled: false,
      };
    }

    // Определяем, какого ассистента использовать
    let assistantId = assistantChannel.assistantId;
    if (dialogAssistant && dialogAssistant.assistantId) {
      assistantId = dialogAssistant.assistantId;
    }

    // Получаем ассистента
    const assistant = await storage.getAssistant(assistantId);
    if (!assistant || !assistant.openaiAssistantId) {
      return {
        success: true,
        conversation,
        message: { id: createdMessageId, content, senderType: "user" },
        hasAssistant: false,
      };
    }

    // Определяем, должен ли ассистент автоматически отвечать
    let autoReply = assistantChannel.autoReply;
    if (dialogAssistant) {
      autoReply = dialogAssistant.autoReply;
    }

    // Если не настроен автоответ, просто возвращаем сообщение пользователя
    if (!autoReply) {
      return {
        success: true,
        conversation,
        message: { id: createdMessageId, content, senderType: "user" },
        hasAssistant: true,
        assistantEnabled: true,
      };
    }

    // Проверяем доступность ассистента по расписанию
    const isAssistantAvailable = await isAssistantAvailableBySchedule(
      channelId,
      storage
    );
    if (!isAssistantAvailable) {
      return {
        success: true,
        conversation,
        message: { id: createdMessageId, content, senderType: "user" },
        hasAssistant: true,
        assistantEnabled: false,
      };
    }

    try {
      // Получаем последние сообщения для контекста
      const recentMessages = await storage.listMessagesByConversation(
        conversation.id
      );

      // Создаем OpenAI Thread, если его еще нет
      let threadId = conversation.threadId;

      if (!threadId) {
        const thread = await openaiService.createThread();
        threadId = thread.id;

        // Сохраняем ID треда в базе данных, если есть функция обновления threadId
        if (conversation.id) {
          await storage.updateConversation(conversation.id, {
            threadId: threadId,
          });
        }
      }

      if (threadId) {
        try {
          // Используем метод generateResponse, который правильно обрабатывает requires_action
          console.log(
            `Используем generateResponse для обработки запроса от веб-канала`
          );

          // Метод generateResponse внутри себя добавляет сообщение в тред и запускает ассистента
          const assistantResponse = await openaiService.generateResponse(
            assistant.openaiAssistantId,
            threadId,
            content
          );

          // Проверяем ответ
          if (
            assistantResponse &&
            assistantResponse.content &&
            assistantResponse.content[0]?.text?.value
          ) {
            const responseText = assistantResponse.content[0].text.value;

            // Сохраняем ответ ассистента в базу данных
            const assistantMessageId = await storage.createMessage({
              conversationId: conversation.id,
              senderType: "assistant",
              senderId: assistant.id,
              content: responseText,
              metadata: {
                assistantId: assistant.id,
                threadId,
                messageId: assistantResponse.id,
                timestamp: new Date().toISOString(),
                responseToMessageId: createdMessageId,
              },
            });

            // Обновляем статус разговора
            if (conversation.id) {
              await storage.updateConversation(conversation.id, {
                status: "active",
              });
            }

            // Учитываем сообщение в ограничении тарифа для создателя канала
            await trackAssistantMessage(channelId, storage);

            console.log(
              `Отправлен ответ ассистента для веб-диалога ${conversation.id}, ID сообщения: ${assistantMessageId}`
            );

            return {
              success: true,
              conversation,
              message: { id: createdMessageId, content, senderType: "user" },
              assistantMessage: {
                id: assistantMessageId,
                content: responseText,
                senderType: "assistant",
              },
              hasAssistant: true,
              assistantEnabled: true,
            };
          } else {
            console.error(
              `Не удалось получить текст ответа из результата generateResponse`
            );
          }
        } catch (generateError: any) {
          console.error("Ошибка при вызове generateResponse:", generateError);

          // Если это ошибка связанная с requires_action, логируем отдельно для отладки
          if (
            generateError.message &&
            generateError.message.includes("requires_action")
          ) {
            console.error(
              "Ошибка обработки вызова функции (requires_action):",
              generateError
            );
          }
        }
      }
    } catch (assistantError) {
      console.error(
        "Ошибка при обработке ответа ассистента для веб-диалога:",
        assistantError
      );
    }

    // Если дошли до этой точки, значит не удалось получить ответ от ассистента
    return {
      success: true,
      conversation,
      message: { id: createdMessageId, content, senderType: "user" },
      hasAssistant: true,
      assistantEnabled: true,
    };
  } catch (error) {
    console.error("Ошибка при обработке веб-сообщения:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

// Настройка multer для обработки загрузки файлов
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

/**
 * Обновляет ассистента для всех диалогов в указанном канале
 * @param channelId ID канала
 * @param assistantId ID нового ассистента
 * @param storage Экземпляр хранилища
 */
async function updateAssistantForAllDialogs(
  channelId: number,
  assistantId: number,
  storage: IStorage
): Promise<void> {
  try {
    // Получаем текущий список диалог-ассистентов для канала
    const dialogAssistants = await storage.listDialogAssistantsByChannel(
      channelId
    );
    console.log(
      `[ОБНОВЛЕНИЕ АССИСТЕНТОВ] Найдено ${dialogAssistants.length} диалогов в канале ${channelId}`
    );

    // Для каждого диалога обновляем assistantId только если он отличается
    const updates = dialogAssistants
      .filter((da) => da.assistantId !== assistantId) // Фильтруем только те диалоги, где ассистент отличается
      .map(async (da) => {
        console.log(
          `[ОБНОВЛЕНИЕ АССИСТЕНТОВ] Диалог ${da.dialogId}: меняем assistantId с ${da.assistantId} на ${assistantId}`
        );
        return storage.updateDialogAssistant(da.id, { assistantId });
      });

    if (updates.length === 0) {
      console.log(
        `[ОБНОВЛЕНИЕ АССИСТЕНТОВ] Все диалоги в канале ${channelId} уже используют ассистента ${assistantId}`
      );
    }

    // Ждем завершения всех обновлений
    await Promise.all(updates);
    console.log(
      `[ОБНОВЛЕНИЕ АССИСТЕНТОВ] Успешно обновлены ассистенты для всех диалогов в канале ${channelId}`
    );
  } catch (error) {
    console.error(
      `[ОБНОВЛЕНИЕ АССИСТЕНТОВ] Ошибка при обновлении ассистентов:`,
      error
    );
  }
}

// Функция getErrorMessage теперь импортируется из ./utils/error-handler

export async function registerRoutes(
  app: Express,
  customStorage?: IStorage
): Promise<Server> {
  // Используем переданное хранилище или глобальное по умолчанию
  const storageInstance = customStorage || storage;
  // Регистрируем маршруты для пробного периода
  registerTrialRoutes(app, storageInstance);

  // Регистрируем маршруты для пользователей
  registerUserRoutes(app, storageInstance);

  // Регистрируем маршруты для телефонии
  registerTelephonyRoutes(app, storageInstance);

  // put application routes here
  // prefix all routes with /api

  registerAddSingleFunctionRoute(app, storageInstance);
  registerGetAssistantFunctionsRoute(app, storageInstance);
  registerUpdateAssistantFunctionsRoutes(app, storageInstance);
  registerMetricsRoutes(app, storageInstance, authenticateToken);

  app.use("/api", removeFunctionByNameRoutes);

  app.use("/api", createUpdateFunctionChannelRoute(storageInstance));

  /**
   * Получает актуальный URL приложения из запроса
   * Функция гарантирует, что всегда будет использоваться текущий рабочий домен
   */
  function getCurrentBaseUrl(req: Request): string {
    // Специальная переменная окружения для тестирования - используйте, только если она явно задана для тестов
    if (process.env.FORCE_PUBLIC_URL) {
      return process.env.FORCE_PUBLIC_URL;
    }

    // 1. Проверяем заголовки X-Forwarded-*
    if (req.headers["x-forwarded-host"] && req.headers["x-forwarded-proto"]) {
      return `${req.headers["x-forwarded-proto"]}://${req.headers["x-forwarded-host"]}`;
    }

    // 2. Используем обычный host и protocol если есть
    if (req.headers.host) {
      // Определяем протокол (http vs https)
      const protocol =
        req.secure || req.headers["x-forwarded-proto"] === "https"
          ? "https"
          : "http";
      return `${protocol}://${req.headers.host}`;
    }

    // 3. В крайнем случае используем PUBLIC_URL из .env
    // Но только как последний вариант
    if (process.env.PUBLIC_URL) {
      return process.env.PUBLIC_URL;
    }

    // 4. Дефолтное значение как самый последний вариант
    return "http://localhost:5000";
  }

  // Тестовый маршрут для проверки формирования URL вебхука
  app.get("/api/test/webhook-url", (req, res) => {
    const publicUrl = getCurrentBaseUrl(req);
    const callbackUrl = `${publicUrl}/api/channels/vk/webhook/1`;
    console.log(`[DEBUG] Переменная PUBLIC_URL: ${process.env.PUBLIC_URL}`);
    console.log(`[DEBUG] Текущий базовый URL: ${publicUrl}`);
    console.log(`[DEBUG] Сформированный URL вебхука: ${callbackUrl}`);
    res.json({ publicUrl, callbackUrl });
  });

  // Web Chat Widget API маршруты

  // API для получения переменных окружения
  app.get("/api/env/:name", (req, res) => {
    const name = req.params.name;
    // Разрешаем получать только определенные переменные окружения для безопасности
    const allowedEnvVars = ["WEB_CHAT_CHANNEL_ID"];

    if (allowedEnvVars.includes(name)) {
      return res.json({ success: true, value: process.env[name] });
    } else {
      return res.status(403).json({
        success: false,
        message: "Access denied to this environment variable",
      });
    }
  });

  // Отправка сообщения от посетителя через виджет
  app.post("/api/channels/:channelId/widget/messages", async (req, res) => {
    try {
      const channelId = parseInt(req.params.channelId);
      const { content, visitorId, timestamp, messageId } = req.body;

      console.log(
        `[WIDGET] Получено сообщение от посетителя ${visitorId} в канал ${channelId}: ${content}`
      );
      console.log(`[WIDGET] Данные запроса:`, {
        channelId,
        content,
        visitorId,
        timestamp: timestamp || "не указан",
        messageId: messageId || "не указан",
        headers: req.headers["content-type"],
        body: JSON.stringify(req.body),
      });

      if (isNaN(channelId)) {
        console.error(`[WIDGET] Ошибка: Неверный ID канала ${channelId}`);
        return res
          .status(400)
          .json({ success: false, message: "Invalid channel ID" });
      }

      if (!content || !visitorId) {
        console.error(`[WIDGET] Ошибка: отсутствует content или visitorId`);
        return res.status(400).json({
          success: false,
          message: "Content and visitorId are required",
        });
      }

      // Проверяем канал
      const channel = await storageInstance.getChannel(channelId);
      if (!channel) {
        console.error(`[WIDGET] Канал с ID ${channelId} не найден`);
        return res
          .status(404)
          .json({ success: false, message: "Channel not found" });
      }
      console.log(
        `[WIDGET] Найден канал типа ${channel.type}: ${channel.name} (ID: ${channel.id})`
      );

      // Обрабатываем сообщение от посетителя
      console.log(`[WIDGET] Обрабатываем сообщение от посетителя ${visitorId}`);

      // Проверяем, нет ли уже такого сообщения (защита от дублирования)
      if (messageId) {
        // Проверка на дубликаты по messageId
        console.log(
          `[WIDGET] Получен messageId: ${messageId}, используем для защиты от дублей`
        );

        // Проверяем существующие диалоги канала
        const conversations = await storageInstance.listConversationsByChannel(
          channelId
        );
        console.log(
          `[WIDGET] Найдено ${conversations.length} разговоров для канала ${channelId}`
        );

        // Находим разговор для этого посетителя
        const existingConversation = conversations.find(
          (c) => c.externalUserId === visitorId
        );
        if (existingConversation) {
          console.log(
            `[WIDGET] Найден существующий разговор ID=${existingConversation.id} для посетителя ${visitorId}`
          );

          // Получаем сообщения разговора
          const messages = await storageInstance.listMessagesByConversation(
            existingConversation.id
          );
          console.log(
            `[WIDGET] Найдено ${messages.length} сообщений в разговоре ID=${existingConversation.id}`
          );

          // Проверяем, есть ли сообщение с таким временным ID в метаданных
          const duplicate = messages.find((m) => {
            if (!m.metadata) return false;
            const meta = m.metadata as Record<string, any>;
            return meta.tempId === messageId || meta.messageId === messageId;
          });

          if (duplicate) {
            console.log(
              `[WIDGET] Обнаружен дубликат сообщения с ID=${duplicate.id}, предотвращаем повторную отправку`
            );
            return res.json({
              success: true,
              message: "Сообщение уже было обработано",
              isDuplicate: true,
              userMessage: {
                id: duplicate.id,
                content: duplicate.content,
                senderType: duplicate.senderType,
              },
            });
          } else {
            console.log(
              `[WIDGET] Дубликатов сообщения с messageId=${messageId} не найдено`
            );
          }
        }
      }

      // Обрабатываем сообщение
      console.log(
        `[WIDGET] Начинаем обработку сообщения через processWebMessage()`
      );
      const result = await processWebMessage(
        channelId,
        visitorId,
        content,
        storageInstance,
        undefined,
        messageId
      );

      if (!result.success) {
        console.error(
          `[WIDGET] Ошибка при обработке сообщения: ${result.error}`
        );
        return res.status(500).json({ success: false, message: result.error });
      }

      console.log(`[WIDGET] Сообщение успешно обработано:`);
      console.log(`[WIDGET] - Conversation ID: ${result.conversation?.id}`);
      console.log(`[WIDGET] - Message ID: ${result.message?.id}`);
      console.log(
        `[WIDGET] - Has Assistant: ${result.hasAssistant ? "Да" : "Нет"}`
      );
      console.log(
        `[WIDGET] - Assistant Enabled: ${
          result.assistantEnabled ? "Да" : "Нет"
        }`
      );

      // Проверяем, есть ли сообщение от ассистента
      if (result.assistantMessage) {
        console.log(
          `[WIDGET] Есть ответ от ассистента: ${result.assistantMessage.content}`
        );
        // Если есть, возвращаем его вместе с сообщением пользователя
        return res.json({
          success: true,
          userMessage: result.message,
          assistantMessage: result.assistantMessage,
          conversation: result.conversation,
        });
      }

      // Если нет, возвращаем просто сообщение пользователя
      console.log(`[WIDGET] Нет ответа от ассистента`);
      return res.json({
        success: true,
        message: result.message,
        conversation: result.conversation,
      });
    } catch (error) {
      console.error("Error sending web widget message:", error);
      return res.status(500).json({
        success: false,
        message: "Error processing message",
        error: getErrorMessage(error),
      });
    }
  });

  // Получение сообщений для чат-виджета
  app.get("/api/channels/:channelId/widget/messages", async (req, res) => {
    try {
      const channelId = parseInt(req.params.channelId);
      const visitorId = req.query.visitorId as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (isNaN(channelId)) {
        return res.status(400).json({ message: "Invalid channel ID" });
      }

      if (!visitorId) {
        return res.status(400).json({ message: "visitorId is required" });
      }

      // Получаем канал
      const channel = await storageInstance.getChannel(channelId);
      if (!channel || channel.type !== "web") {
        return res.status(404).json({ message: "Web channel not found" });
      }

      // Находим разговор для этого посетителя
      const conversations = await storageInstance.listConversationsByChannel(
        channelId
      );
      const conversation = conversations.find(
        (c) => c.externalUserId === visitorId
      );

      if (!conversation) {
        // Если разговор не найден, возвращаем пустой список сообщений
        return res.json({
          messages: [],
          hasMore: false,
        });
      }

      // Получаем сообщения с пагинацией
      const allMessages = await storageInstance.listMessagesByConversation(
        conversation.id
      );

      // Сортируем сообщения по времени (от старых к новым для отображения)
      const sortedMessages = [...allMessages].sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeA - timeB;
      });

      // Применяем пагинацию (берем последние сообщения, а не первые)
      let paginatedMessages = [];

      // Для первой страницы берем последние limit сообщений
      if (page === 1) {
        const startIndex = Math.max(0, sortedMessages.length - limit);
        paginatedMessages = sortedMessages.slice(startIndex);
      } else {
        // Для остальных страниц используем обычную пагинацию
        const offset = (page - 1) * limit;
        paginatedMessages = sortedMessages.slice(offset, offset + limit);
      }

      // Преобразуем сообщения в формат для клиента
      const formattedMessages = paginatedMessages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        senderType: msg.senderType,
        timestamp: msg.timestamp,
      }));

      return res.json({
        messages: formattedMessages,
        hasMore: false, // отключаем пагинацию для чат-виджета
      });
    } catch (error) {
      console.error("Error getting web widget messages:", error);
      return res.status(500).json({
        success: false,
        message: "Error retrieving messages",
        error: getErrorMessage(error),
      });
    }
  });

  // Получение разговора для диалога по dialogId
  app.get("/api/channels/:channelId/conversations", async (req, res) => {
    try {
      const channelId = parseInt(req.params.channelId);
      const dialogId = req.query.dialogId as string;
      const includeDetails = req.query.includeDetails === "true";

      if (isNaN(channelId)) {
        return res.status(400).json({ message: "Invalid channel ID" });
      }

      // Если указан dialogId - логика для веб-виджета
      if (dialogId) {
        const conversations = await storageInstance.listConversationsByChannel(
          channelId
        );
        const conversation = conversations.find(
          (c) => c.id.toString() === dialogId || c.externalUserId === dialogId
        );

        if (conversation) {
          return res.json({ conversation });
        } else {
          // Создаем новый разговор если не найден
          if (dialogId && dialogId.length > 0) {
            try {
              // Получаем информацию о канале для определения владельца
              const channel = await storageInstance.getChannel(channelId);
              const channelOwnerId = channel?.createdBy || 0;

              const newConversation = await findOrCreateConversation(
                storageInstance,
                channelId,
                dialogId,
                null,
                channelOwnerId // Используем владельца канала вместо 0
              );
              return res.json({ conversation: newConversation });
            } catch (error) {
              console.error("Error creating conversation:", error);
              return res
                .status(500)
                .json({ message: "Error creating conversation" });
            }
          }
          return res.status(404).json({ message: "Conversation not found" });
        }
      }

      // Иначе - возвращаем все разговоры
      const conversations = await storageInstance.listConversationsByChannel(
        channelId
      );

      // Если запрошены детали - добавляем информацию о последнем сообщении
      if (includeDetails) {
        const enhancedConversations = await Promise.all(
          conversations.map(async (conversation) => {
            const messages = await storageInstance.listMessagesByConversation(
              conversation.id
            );
            const lastMessage =
              messages.length > 0 ? messages[messages.length - 1] : null;

            return {
              ...conversation,
              lastMessage: lastMessage
                ? {
                    content: lastMessage.content,
                    timestamp: lastMessage.timestamp,
                    senderType: lastMessage.senderType,
                  }
                : null,
              messageCount: messages.length,
            };
          })
        );
        return res.json(enhancedConversations);
      }

      return res.json(conversations);
    } catch (error) {
      console.error("Error fetching channel conversations:", error);
      res.status(500).json({
        message: "Failed to fetch conversations",
        error: getErrorMessage(error),
      });
    }
  });

  // Проверка непрочитанных сообщений для чат-виджета
  app.get("/api/channels/:channelId/widget/unread", async (req, res) => {
    try {
      const channelId = parseInt(req.params.channelId);
      const visitorId = req.query.visitorId as string;

      if (isNaN(channelId)) {
        return res.status(400).json({ message: "Invalid channel ID" });
      }

      if (!visitorId) {
        return res.status(400).json({ message: "visitorId is required" });
      }

      // Получаем канал
      const channel = await storageInstance.getChannel(channelId);
      if (!channel || channel.type !== "web") {
        return res.status(404).json({ message: "Web channel not found" });
      }

      // Находим разговор для этого посетителя
      const conversations = await storageInstance.listConversationsByChannel(
        channelId
      );
      const conversation = conversations.find(
        (c) => c.externalUserId === visitorId
      );

      if (!conversation) {
        // Если разговор не найден, возвращаем 0 непрочитанных сообщений
        return res.json({
          count: 0,
        });
      }

      // Получаем последнее время чтения из запроса
      const lastRead = req.query.lastRead
        ? new Date(req.query.lastRead as string)
        : null;

      // Если lastRead не указан, считаем непрочитанными все сообщения ассистента
      const allMessages = await storageInstance.listMessagesByConversation(
        conversation.id
      );

      // Фильтруем сообщения от ассистента, которые еще не прочитаны
      let unreadMessages;
      if (lastRead) {
        unreadMessages = allMessages.filter(
          (msg) =>
            msg.senderType === "assistant" && new Date(msg.timestamp) > lastRead
        );
      } else {
        unreadMessages = allMessages.filter(
          (msg) => msg.senderType === "assistant"
        );
      }

      return res.json({
        count: unreadMessages.length,
      });
    } catch (error) {
      console.error("Error checking web widget unread messages:", error);
      return res.status(500).json({
        success: false,
        message: "Error checking unread messages",
        error: getErrorMessage(error),
      });
    }
  });

  // Получить JavaScript виджета для веб-канала
  app.get("/api/channels/:channelId/widget.js", async (req, res) => {
    try {
      const channelId = parseInt(req.params.channelId);

      if (isNaN(channelId)) {
        return res.status(400).json({ message: "Invalid channel ID" });
      }

      // Получаем канал
      const channel = await storageInstance.getChannel(channelId);
      if (!channel || channel.type !== "web") {
        return res.status(404).json({ message: "Web channel not found" });
      }

      // Отправляем файл chat-widget.js
      res.sendFile("chat-widget.js", { root: "./client/public" });
    } catch (error) {
      console.error("Error serving web widget script:", error);
      return res.status(500).json({
        success: false,
        message: "Error serving widget script",
        error: getErrorMessage(error),
      });
    }
  });

  // Получить HTML для встраивания виджета в веб-сайт
  app.get("/api/channels/:channelId/widget-code", async (req, res) => {
    try {
      const channelId = parseInt(req.params.channelId);

      if (isNaN(channelId)) {
        return res.status(400).json({ message: "Invalid channel ID" });
      }

      // Получаем канал
      const channel = await storageInstance.getChannel(channelId);
      if (!channel || channel.type !== "web") {
        return res.status(404).json({ message: "Web channel not found" });
      }

      // Формируем HTML-код для встраивания виджета
      const baseUrl = getCurrentBaseUrl(req);
      const widgetScriptUrl = `${baseUrl}/api/channels/${channelId}/widget.js`;

      // Получаем настройки виджета из канала
      const settings = (channel.settings as Record<string, any>) || {};
      // Используем настройки канала или дефолтные значения
      const widgetColor = settings.widgetColor || "#3B82F6";
      // Поддержка позиций: bottom-right, bottom-left, bottom-center, left-center, right-center
      const widgetPosition = settings.widgetPosition || "bottom-right";
      const widgetHeaderName = settings.widgetHeaderName || "Онлайн-чат";
      const widgetFontSize = settings.widgetFontSize || "14px";
      const widgetIcon = settings.widgetIcon || `${baseUrl}/robot-icon.svg`;

      // Генерируем HTML-код для встраивания
      const widgetCode = `<script src="${widgetScriptUrl}"></script>
        <script>
          document.addEventListener('DOMContentLoaded', function() {
            chatInit(${channelId}, {
              primaryColor: "${widgetColor}",
              position: "${widgetPosition}",
              headerText: "${widgetHeaderName}",
              fontSize: "${widgetFontSize}",
              iconUrl: "${widgetIcon}"
            });
          });
        </script>`;

      return res.json({
        success: true,
        code: widgetCode,
        scriptUrl: widgetScriptUrl,
      });
    } catch (error) {
      console.error("Error generating web widget embed code:", error);
      return res.status(500).json({
        success: false,
        message: "Error generating widget code",
        error: getErrorMessage(error),
      });
    }
  });

  // Auth routes
  // Отправка кода подтверждения на email
  app.post("/api/auth/send-code", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email || typeof email !== "string") {
        return res.status(400).json({ message: "Email обязателен" });
      }

      // Валидация формата email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Некорректный формат email" });
      }

      try {
        // Отправляем код подтверждения
        const code = await emailService.sendVerificationCode(email);

        // В продакшн-версии не возвращаем код
        return res.json({
          success: true,
          message: "Код подтверждения отправлен на указанный email",
        });
      } catch (emailError) {
        console.error("Ошибка при отправке email:", emailError);
        return res.status(500).json({
          message:
            "Ошибка отправки письма. Пожалуйста, проверьте ваш email или попробуйте позже.",
        });
      }
    } catch (error) {
      console.error("Ошибка при отправке кода:", error);
      return res.status(500).json({
        message: "Не удалось отправить код подтверждения",
        error: getErrorMessage(error),
      });
    }
  });

  // Отправка SMS-кода подтверждения на телефон
  app.post("/api/auth/send-sms-code", async (req, res) => {
    try {
      const { phone } = req.body;

      if (!phone || typeof phone !== "string") {
        return res.status(400).json({ message: "Номер телефона обязателен" });
      }

      console.log(`[API] Received SMS code request for phone: ${phone}`);

      // Импортируем сервис SMS
      const { smsService } = await import("./services/sms");

      // Проверяем валидность телефона
      if (!smsService.isValidRussianPhone(phone)) {
        console.log(`[API] Invalid phone format: ${phone}`);
        return res.status(400).json({
          message:
            "Некорректный формат номера телефона. Должен быть российский номер, начинающийся с +7",
        });
      }

      try {
        console.log(`[API] Generating verification code for ${phone}`);

        // Отправляем SMS с кодом подтверждения
        const code = await smsService.sendVerificationCode(phone);

        // Проверяем, в каком режиме работаем (тестовый или реальный)
        const isTestMode = process.env.SMS_TEST_MODE === "true";

        // Возвращаем ответ с кодом только в тестовом режиме
        if (isTestMode) {
          console.log(`[API] Returning test mode response with code`);
          return res.status(200).json({
            success: true,
            message: "Код подтверждения отправлен на указанный номер телефона",
            testMode: true,
            code: code, // В тестовом режиме возвращаем код
          });
        } else {
          console.log(
            `[API] Returning production mode response (without code)`
          );
          return res.status(200).json({
            success: true,
            message: "Код подтверждения отправлен на указанный номер телефона",
          });
        }
      } catch (smsError) {
        console.error(`[API] Error sending SMS to ${phone}:`, smsError);

        // Добавляем функцию для получения сохраненного кода (если есть) в fallback режиме
        const getSavedCode = (phoneNumber: string) => {
          try {
            const savedData = smsService.verificationCodes?.get(phoneNumber);
            return savedData?.code;
          } catch (err) {
            console.log(`[API] Error getting saved verification code: ${err}`);
            return null;
          }
        };

        // В тестовом режиме или при явном fallback можем вернуть код
        if (
          process.env.SMS_FALLBACK_TO_TEST_ON_ERROR === "true" ||
          process.env.SMS_TEST_MODE === "true"
        ) {
          const savedCode = getSavedCode(phone);
          if (savedCode) {
            console.log(
              `[API] Using fallback mode for ${phone}, code: ${savedCode}`
            );
            return res.status(200).json({
              success: true,
              message: "Код подтверждения сгенерирован",
              testMode: true,
              fallbackMode:
                process.env.SMS_FALLBACK_TO_TEST_ON_ERROR === "true",
              code: savedCode,
            });
          } else {
            console.log(
              `[API] Fallback mode enabled but no saved code found for ${phone}`
            );
          }
        }

        return res.status(500).json({
          message:
            "Ошибка отправки SMS. Пожалуйста, проверьте номер телефона или попробуйте позже.",
        });
      }
    } catch (error) {
      console.error("Ошибка при отправке SMS-кода:", error);
      return res.status(500).json({
        message: "Не удалось отправить SMS-код подтверждения",
        error: getErrorMessage(error),
      });
    }
  });

  // Проверка кода подтверждения (email или телефон)
  app.post("/api/auth/verify-code", async (req, res) => {
    try {
      const { email, phone, code, referralCode } = req.body;

      // Проверяем наличие идентификатора (email или телефон) и кода
      if ((!email && !phone) || !code) {
        return res.status(400).json({
          message: "Email или телефон, а также код подтверждения обязательны",
        });
      }

      // Проверяем, что указан только один идентификатор
      if (email && phone) {
        return res.status(400).json({
          message: "Укажите только email или телефон, но не оба сразу",
        });
      }

      // Определяем режим аутентификации и проверяем код
      let isValid = false;
      let identifier = "";
      let isPhone = false;

      if (email) {
        // Проверка кода из email
        isValid = emailService.verifyCode(email, code);
        identifier = email;
        isPhone = false;
      } else {
        // Проверка SMS-кода
        const { smsService } = await import("./services/sms");
        isValid = smsService.verifyCode(phone, code);
        identifier = phone;
        isPhone = true;
      }

      if (!isValid) {
        return res.status(400).json({
          message: "Неверный код подтверждения или истек срок действия",
        });
      }

      // Предупреждение о реферальном коде (будет добавлено к ответу, если код неверный)
      let warning = null;

      // Проверяем реферальный код, если он указан
      if (referralCode) {
        const referrer = await storageInstance.getUserByReferralCode(
          referralCode
        );
        if (!referrer) {
          // Продолжаем регистрацию, но без указания реферала
          console.log(`Неверный реферальный код: ${referralCode}`);
          warning = "Неверный реферальный код";
        }
      }

      // Создаем или получаем существующего пользователя
      const user = await authService.findOrCreateUser(
        identifier,
        undefined,
        undefined,
        referralCode,
        isPhone
      );

      // Обрабатываем реферальное вознаграждение, если пользователь новый и есть реферал
      if (user && user.referrerId && !warning) {
        try {
          await processReferralRegistrationReward(
            user.id,
            user.referrerId,
            storageInstance
          );
          console.log(
            `[AUTH] Реферальное вознаграждение создано для пользователя ${user.id} и реферала ${user.referrerId}`
          );
        } catch (rewardError) {
          console.error(
            `[AUTH] Ошибка при обработке реферального вознаграждения:`,
            rewardError
          );
          // Не останавливаем процесс регистрации из-за ошибки вознаграждения
        }
      }

      // Генерируем JWT токен
      const token = authService.generateToken(user);

      // Отправляем уведомление в Telegram о новом пользователе
      try {
        const dataNow = new Date().getTime();
        const dataCreate = new Date(user.createdAt).getTime();
        const differenceTime = dataNow - dataCreate;
        if (differenceTime < 180 * 1000) {
          // Подготавливаем данные для отправки
          const dataReq = {
            name: user.name,
            email: user.email,
            phone: user.phone,
          };

          const chatId = process.env.TELEGRAM_CHAT_ID || "-1002413323859";
          const botToken =
            process.env.TELEGRAM_BOT_TOKEN ||
            "7990616547:AAG-4jvHgWhR6JtR6pk3wOxzeWmreHnzMyY";

          // Отправляем уведомление асинхронно (не ждем завершения, чтобы не задерживать ответ пользователю)
          telegramService
            .sendNewUserNotification(dataReq, chatId, botToken)
            .then((result) => {
              if (result) {
                console.log(
                  `[TELEGRAM] Успешно отправлено уведомление о новом пользователе ${user.id}`
                );
              } else {
                console.error(
                  `[TELEGRAM] Не удалось отправить уведомление о новом пользователе ${user.id}`
                );
              }
            })
            .catch((error) => {
              console.error(
                `[TELEGRAM] Ошибка при отправке уведомления:`,
                error
              );
            });
        } else {
          console.log(
            `[TELEGRAM] Пользователь с ${user.id} повторно зашёл на сайт: ${
              user.email || user.phone || user.name
            }`
          );
        }
      } catch (telegramError) {
        // Логируем ошибку, но не прерываем авторизацию
        console.error(
          "[TELEGRAM] Ошибка при подготовке уведомления:",
          telegramError
        );
      }

      // Возвращаем токен и информацию о пользователе (и предупреждение, если есть)
      return res.json({
        user,
        token,
        ...(warning ? { warning } : {}),
      });
    } catch (error) {
      console.error("Ошибка при проверке кода:", error);
      return res.status(500).json({ message: "Не удалось выполнить вход" });
    }
  });

  // Получение текущего пользователя
  app.get("/api/auth/me", authenticateToken, async (req, res) => {
    // Пользователь уже добавлен в req middleware-ом authenticateToken
    return res.json(req.user);
  });

  // User routes
  app.get("/api/users", async (req, res) => {
    const users = await storageInstance.listUsers();
    res.json(users);
  });

  // Маршрут для получения пользователей без менеджера
  app.get("/api/users/without-manager", authenticateToken, async (req, res) => {
    try {
      console.log(
        "Запрос на получение пользователей без менеджера от пользователя:",
        req.user.id
      );

      // Проверяем права доступа - только администратор или менеджер могут видеть список
      if (req.user.role !== "admin" && req.user.role !== "manager") {
        return res
          .status(403)
          .json({ message: "У вас нет доступа к этим данным" });
      }

      // Получаем пользователей без менеджера
      const users = await storageInstance.listUsersWithoutManager();
      console.log(`Найдено ${users.length} пользователей без менеджера`);
      return res.json(users);
    } catch (error) {
      console.error("Ошибка при получении пользователей без менеджера:", error);
      return res.status(500).json({ message: "Внутренняя ошибка сервера" });
    }
  });

  // Маршрут для получения базовой информации о всех клиентах (для отображения имен и т.д.)
  app.get("/api/users/all-clients", authenticateToken, async (req, res) => {
    try {
      // Разрешаем доступ менеджерам и рефералам для отображения информации о клиентах

      const users = await storageInstance.listUsers();

      // Возвращаем только необходимые поля, чтобы минимизировать объем данных
      const clientsInfo = users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
      }));

      res.json(clientsInfo);
    } catch (error) {
      console.error(
        "Ошибка при получении базовой информации о клиентах:",
        error
      );
      res.status(500).json({ message: "Внутренняя ошибка сервера" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await storageInstance.getUser(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Проверяем, не зарегистрирован ли уже этот email
      if (userData.email) {
        const existingUserByEmail = await storageInstance.getUserByEmail(
          userData.email
        );
        if (existingUserByEmail) {
          return res.status(400).json({ message: "Email already registered" });
        }
      }

      // Проверяем, не зарегистрирован ли уже этот телефон
      if (userData.phone) {
        const existingUserByPhone = await storageInstance.getUserByPhone(
          userData.phone
        );
        if (existingUserByPhone) {
          return res
            .status(400)
            .json({ message: "Номер телефона уже зарегистрирован" });
        }
      }

      const newUser = await storageInstance.createUser(userData);

      // Отправляем уведомление в Telegram о новом пользователе
      try {
        await telegramService.sendNewUserNotification(newUser);
      } catch (error) {
        console.warn("Ошибка отправки уведомления в Telegram:", error);
      }
      res.status(201).json(newUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid user data", errors: error.errors });
      }
      throw error;
    }
  });

  // Реферальная система - маршруты

  // Маршрут для получения пользователей по ID реферера
  // Проверка реферального кода
  app.get("/api/referral-code/:code", async (req, res) => {
    try {
      const code = req.params.code;

      if (!code) {
        return res.status(400).json({ message: "Код не указан" });
      }

      const referrer = await storageInstance.getUserByReferralCode(code);

      if (!referrer) {
        return res.status(404).json({
          valid: false,
          message: "Реферальный код не найден",
        });
      }

      // Возвращаем ограниченную информацию о реферале
      res.json({
        valid: true,
        referrer: {
          id: referrer.id,
          name: referrer.name,
        },
      });
    } catch (error) {
      console.error("Ошибка при проверке реферального кода:", error);
      res.status(500).json({ message: "Внутренняя ошибка сервера" });
    }
  });

  app.get(
    "/api/users/referrer/:referrerId",
    authenticateToken,
    async (req, res) => {
      try {
        const referrerId = parseInt(req.params.referrerId);
        if (isNaN(referrerId)) {
          return res.status(400).json({ message: "Некорректный ID реферера" });
        }

        // Проверяем права доступа - только администратор или сам реферер могут видеть список рефералов
        if (req.user.role !== "admin" && req.user.id !== referrerId) {
          return res
            .status(403)
            .json({ message: "У вас нет доступа к этим данным" });
        }

        const users = await storageInstance.listUsersByReferrer(referrerId);
        res.json(users);
      } catch (error) {
        console.error(
          `Ошибка при получении пользователей реферера ${req.params.referrerId}:`,
          error
        );
        res.status(500).json({ message: "Внутренняя ошибка сервера" });
      }
    }
  );

  // Маршрут для пополнения баланса пользователя и создания реферальной транзакции
  app.post("/api/users/:id/balance", authenticateToken, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res
          .status(400)
          .json({ message: "Некорректный ID пользователя" });
      }

      const { amount, description } = req.body;
      if (!amount || typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({
          message: "Сумма пополнения должна быть положительным числом",
        });
      }

      // Проверяем, что пользователь существует
      const user = await storageInstance.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      // Проверяем, является ли текущий пользователь администратором или тем пользователем, чей баланс пополняется
      if (req.user.role !== "admin" && req.user.id !== userId) {
        return res
          .status(403)
          .json({ message: "Недостаточно прав для пополнения баланса" });
      }

      // Получаем информацию о реферале пользователя, если он есть
      let referrerId = null;
      if (user.referrerId) {
        const referrer = await storageInstance.getUser(user.referrerId);
        if (
          referrer &&
          (referrer.role === "referral" || referrer.role === "manager")
        ) {
          referrerId = referrer.id;
        }
      }

      // Получаем информацию о менеджере пользователя, если он есть
      let managerId = null;
      if (user.managerId) {
        const manager = await storageInstance.getUser(user.managerId);
        if (manager && manager.role === "manager") {
          managerId = manager.id;
        }
      }

      // Рассчитываем комиссии в соответствии с правилами:
      // 1. Если есть только пригласивший (реферер): 20% от суммы пополнения
      // 2. Если есть только менеджер: 10% от суммы пополнения
      // 3. Если есть и реферер, и менеджер: по 10% каждому
      let referralCommission = null;
      let managerCommission = null;

      if (referrerId && managerId) {
        // Если есть и реферер, и менеджер, то по 10% каждому
        referralCommission = Math.floor(amount * 0.1);
        managerCommission = Math.floor(amount * 0.1);
      } else if (referrerId && !managerId) {
        // Если есть только реферер, то 20%
        referralCommission = Math.floor(amount * 0.2);
      } else if (!referrerId && managerId) {
        // Если есть только менеджер, то 10%
        managerCommission = Math.floor(amount * 0.1);
      }

      // Создаем транзакцию
      const transaction = await storageInstance.createReferralTransaction({
        userId,
        referrerId,
        managerId,
        amount,
        referralCommission,
        managerCommission,
        description: description || "Пополнение баланса",
        status: "processed",
      });

      // Обновляем общую сумму, потраченную пользователем
      const updatedUser = await storageInstance.updateUser(userId, {
        totalSpent: (user.totalSpent || 0) + amount,
      });

      // Логируем активность
      await storageInstance.createActivityLog({
        userId: req.user.id,
        action: "add_balance",
        details: {
          userId,
          amount,
          referralCommission,
          managerCommission,
        },
      });

      res.status(200).json({
        success: true,
        transaction,
        updatedBalance: (user.totalSpent || 0) + amount,
      });
    } catch (error) {
      console.error("Ошибка при пополнении баланса:", error);
      res.status(500).json({ message: "Внутренняя ошибка сервера" });
    }
  });

  // Маршрут для получения пользователей по ID менеджера
  app.get(
    "/api/users/manager/:managerId",
    authenticateToken,
    async (req, res) => {
      try {
        const managerId = parseInt(req.params.managerId);
        if (isNaN(managerId)) {
          return res.status(400).json({ message: "Некорректный ID менеджера" });
        }

        // Проверяем права доступа - только администратор или сам менеджер могут видеть список клиентов
        if (req.user.role !== "admin" && req.user.id !== managerId) {
          return res
            .status(403)
            .json({ message: "У вас нет доступа к этим данным" });
        }

        const users = await storageInstance.listUsersByManager(managerId);
        res.json(users);
      } catch (error) {
        console.error(
          `Ошибка при получении пользователей менеджера ${req.params.managerId}:`,
          error
        );
        res.status(500).json({ message: "Внутренняя ошибка сервера" });
      }
    }
  );

  // Маршрут для проверки реферального кода
  app.get("/api/referral/check/:code", async (req, res) => {
    try {
      const { code } = req.params;

      if (!code) {
        return res.status(400).json({ message: "Реферальный код обязателен" });
      }

      const referrer = await storageInstance.getUserByReferralCode(code);

      if (!referrer) {
        return res.status(404).json({
          valid: false,
          message: "Неверный реферальный код",
        });
      }

      return res.json({
        valid: true,
        referrer: {
          id: referrer.id,
          name: referrer.name,
        },
      });
    } catch (error) {
      console.error("Ошибка при проверке реферального кода:", error);
      res.status(500).json({ message: "Внутренняя ошибка сервера" });
    }
  });

  // Маршруты для реферальных транзакций
  app.get("/api/referral/transactions", authenticateToken, async (req, res) => {
    try {
      let transactions;

      // В зависимости от роли пользователя, возвращаем разные списки транзакций
      if (req.user.role === "admin") {
        // Администратор видит все транзакции
        transactions = await storageInstance.listReferralTransactions();
      } else if (req.user.role === "manager") {
        // Менеджер видит только транзакции, где он указан как менеджер
        transactions = await storageInstance.listReferralTransactionsByManager(
          req.user.id
        );
      } else if (req.user.role === "referral") {
        // Реферал видит только транзакции, где он указан как реферер
        transactions = await storageInstance.listReferralTransactionsByReferrer(
          req.user.id
        );
      } else {
        // Обычный пользователь видит только свои транзакции
        transactions = await storageInstance.listReferralTransactionsByUser(
          req.user.id
        );
      }

      res.json(transactions);
    } catch (error) {
      console.error("Ошибка при получении реферальных транзакций:", error);
      res.status(500).json({ message: "Внутренняя ошибка сервера" });
    }
  });

  // Получение общей суммы комиссии для пользователя
  app.get("/api/referral/commission", authenticateToken, async (req, res) => {
    try {
      if (
        req.user.role !== "referral" &&
        req.user.role !== "manager" &&
        req.user.role !== "admin"
      ) {
        return res
          .status(403)
          .json({ message: "У вас нет доступа к этим данным" });
      }

      const role = req.user.role === "referral" ? "referrer" : "manager";
      const totalCommission = await storageInstance.calculateTotalCommission(
        req.user.id,
        role
      );

      res.json({ totalCommission });
    } catch (error) {
      console.error("Ошибка при получении комиссии:", error);
      res.status(500).json({ message: "Внутренняя ошибка сервера" });
    }
  });

  // Assistant routes
  app.get("/api/assistants", authenticateToken, async (req, res) => {
    // Отключаем кеширование для получения актуальных данных
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    // Получаем только ассистентов, созданных этим пользователем
    const assistants = await storageInstance.listAssistantsByUser(req.user.id);
    res.json(assistants);
  });

  app.get("/api/assistants/:id", authenticateToken, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid assistant ID" });
    }

    const assistant = await storageInstance.getAssistant(id);
    if (!assistant) {
      return res.status(404).json({ message: "Assistant not found" });
    }

    // Проверяем, что ассистент принадлежит текущему пользователю
    if (assistant.createdBy !== req.user.id) {
      return res
        .status(403)
        .json({ message: "У вас нет доступа к этому ассистенту" });
    }

    res.json(assistant);
  });

  app.post("/api/assistants", authenticateToken, async (req, res) => {
    try {
      const assistantData = insertAssistantSchema.parse(req.body);

      // Устанавливаем текущего пользователя как создателя ассистента
      assistantData.createdBy = req.user.id;

      // Если передан openaiAssistantId, то используем его
      if (!assistantData.openaiAssistantId) {
        // Создаём ассистента в OpenAI
        try {
          const openaiAssistant = await openaiService.createAssistant(
            assistantData.name,
            assistantData.instructions || undefined
          );

          // Добавляем ID ассистента OpenAI в данные ассистента
          assistantData.openaiAssistantId = openaiAssistant.id;

          // Логируем активность создания ассистента
          await storageInstance.createActivityLog({
            userId: assistantData.createdBy,
            action: "created_assistant",
            details: { name: assistantData.name },
          });
        } catch (error) {
          console.error("Ошибка при создании ассистента в OpenAI", error);
          return res.status(500).json({
            message: "Failed to create assistant in OpenAI",
            error: getErrorMessage(error),
          });
        }
      }

      const newAssistant = await storageInstance.createAssistant(assistantData);
      res.status(201).json(newAssistant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid assistant data", errors: error.errors });
      }
      throw error;
    }
  });

  app.put("/api/assistants/:id", authenticateToken, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid assistant ID" });
    }

    try {
      const assistantData = insertAssistantSchema.partial().parse(req.body);

      // Получаем текущего ассистента
      const currentAssistant = await storageInstance.getAssistant(id);
      if (!currentAssistant) {
        return res.status(404).json({ message: "Assistant not found" });
      }

      // Проверяем права доступа - только создатель может обновлять своего ассистента
      if (currentAssistant.createdBy !== req.user.id) {
        return res.status(403).json({
          message: "У вас нет прав на редактирование этого ассистента",
        });
      }

      // Если есть OpenAI ассистент, обновляем его
      if (currentAssistant.openaiAssistantId) {
        try {
          const updates: any = {};
          if (assistantData.name) updates.name = assistantData.name;
          if (assistantData.instructions)
            updates.instructions = assistantData.instructions;

          await openaiService.updateAssistant(
            currentAssistant.openaiAssistantId,
            updates
          );

          // Логируем активность обновления ассистента
          await storageInstance.createActivityLog({
            userId: req.user.id,
            assistantId: currentAssistant.id,
            action: "updated_assistant",
            details: { name: currentAssistant.name },
          });
        } catch (error) {
          console.error("Ошибка при обновлении ассистента в OpenAI", error);
          // Продолжаем выполнение, даже если обновление в OpenAI не удалось
          // Но логируем ошибку в активность
          await storageInstance.createActivityLog({
            userId: req.user.id,
            assistantId: currentAssistant.id,
            action: "update_assistant_failed",
            details: {
              error: error instanceof Error ? error.message : String(error),
            },
          });
        }
      }

      const updatedAssistant = await storageInstance.updateAssistant(
        id,
        assistantData
      );
      res.json(updatedAssistant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid assistant data", errors: error.errors });
      }
      throw error;
    }
  });

  // Добавляем PATCH метод для частичного обновления ассистентов
  app.patch("/api/assistants/:id", authenticateToken, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid assistant ID" });
    }

    try {
      const assistantData = insertAssistantSchema.partial().parse(req.body);

      // Получаем текущего ассистента
      const currentAssistant = await storageInstance.getAssistant(id);
      if (!currentAssistant) {
        return res.status(404).json({ message: "Assistant not found" });
      }

      // Проверяем права доступа - только создатель может обновлять своего ассистента
      if (currentAssistant.createdBy !== req.user.id) {
        return res.status(403).json({
          message: "У вас нет прав на редактирование этого ассистента",
        });
      }

      console.log(`Обновление статуса ассистента ID:${id}`, req.body);

      // Если есть OpenAI ассистент и мы обновляем имя или инструкции, обновляем его в OpenAI
      if (
        currentAssistant.openaiAssistantId &&
        (assistantData.name || assistantData.instructions)
      ) {
        try {
          const updates: any = {};
          if (assistantData.name) updates.name = assistantData.name;
          if (assistantData.instructions)
            updates.instructions = assistantData.instructions;

          await openaiService.updateAssistant(
            currentAssistant.openaiAssistantId,
            updates
          );

          // Логируем активность обновления ассистента
          await storageInstance.createActivityLog({
            userId: req.user.id,
            assistantId: currentAssistant.id,
            action: "updated_assistant",
            details: { name: currentAssistant.name },
          });
        } catch (error) {
          console.error("Ошибка при обновлении ассистента в OpenAI", error);
          // Продолжаем выполнение, даже если обновление в OpenAI не удалось
          // Но логируем ошибку в активность
          await storageInstance.createActivityLog({
            userId: req.user.id,
            assistantId: currentAssistant.id,
            action: "update_assistant_failed",
            details: {
              error: error instanceof Error ? error.message : String(error),
            },
          });
        }
      }

      const updatedAssistant = await storageInstance.updateAssistant(
        id,
        assistantData
      );
      console.log(`Ассистент ${id} обновлен:`, updatedAssistant);
      res.json(updatedAssistant);
    } catch (error) {
      console.error(`Ошибка при обновлении ассистента ${id}:`, error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid assistant data", errors: error.errors });
      }
      throw error;
    }
  });

  app.delete("/api/assistants/:id", authenticateToken, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid assistant ID" });
    }

    // Получаем ассистента перед удалением для логирования и удаления в OpenAI
    const assistant = await storageInstance.getAssistant(id);
    if (!assistant) {
      return res.status(404).json({ message: "Assistant not found" });
    }

    // Проверяем права доступа - только создатель может удалять своего ассистента
    if (assistant.createdBy !== req.user.id) {
      return res
        .status(403)
        .json({ message: "У вас нет прав на удаление этого ассистента" });
    }

    // Если есть OpenAI ассистент, удаляем его
    if (assistant.openaiAssistantId) {
      try {
        await openaiService.deleteAssistant(assistant.openaiAssistantId);
      } catch (error) {
        console.error("Ошибка при удалении ассистента в OpenAI", error);
        // Продолжаем выполнение, даже если удаление в OpenAI не удалось
      }
    }

    // Логируем активность удаления ассистента
    await storageInstance.createActivityLog({
      userId: req.user.id,
      action: "deleted_assistant",
      details: { name: assistant.name },
    });

    // Обновляем статус ассистента на "deleted"
    const updatedAssistant = await storageInstance.updateAssistant(id, {
      status: "deleted",
    });
    res.json({ success: true, assistant: updatedAssistant });
  });

  // Обработчик для сохранения исправлений ответов ассистента (для использования через тестовый диалог)
  app.post("/api/assistants/:id/train", authenticateToken, async (req, res) => {
    try {
      const assistantId = parseInt(req.params.id);
      if (isNaN(assistantId)) {
        return res.status(400).json({ message: "Invalid assistant ID" });
      }

      // Проверяем существование ассистента
      const assistant = await storageInstance.getAssistant(assistantId);
      if (!assistant) {
        return res.status(404).json({ message: "Ассистент не найден" });
      }

      // Проверяем права доступа
      if (assistant.createdBy !== req.user.id) {
        return res
          .status(403)
          .json({ message: "У вас нет прав на обучение этого ассистента" });
      }

      // Проверяем параметры запроса
      const { query, originalResponse, correctedResponse } = req.body;
      if (!query || !correctedResponse) {
        return res.status(400).json({
          message: "Отсутствуют обязательные поля: query и correctedResponse",
        });
      }

      // Если у ассистента нет OpenAI ID, возвращаем ошибку
      if (!assistant.openaiAssistantId) {
        return res.status(400).json({
          message:
            "Ассистент не имеет ID в OpenAI, сначала синхронизируйте его",
        });
      }

      // Сохраняем исправление через сервис обучения ассистентов
      await assistantTrainingService.saveCorrection(
        assistantId,
        assistant.openaiAssistantId,
        query,
        originalResponse || "",
        correctedResponse,
        assistant.instructions || assistant.prompt,
        undefined, // channelId
        undefined, // conversationId
        undefined // dialogId
      );

      // Логируем активность
      await storageInstance.createActivityLog({
        userId: req.user.id,
        assistantId: assistantId,
        action: "trained_assistant",
        details: { query, originalResponse, correctedResponse },
      });

      res.json({
        success: true,
        message:
          "Исправление сохранено и применено ко всем диалогам ассистента",
      });
    } catch (error) {
      console.error("Ошибка при сохранении исправления ответа:", error);
      res.status(500).json({
        message: "Не удалось сохранить исправление",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Обработчик для сохранения исправлений ответов из диалогов (VK, Avito, Web)
  app.post("/api/messages/train", authenticateToken, async (req, res) => {
    try {
      const {
        query,
        originalResponse,
        correctedResponse,
        conversationId,
        channelId,
        isGoodResponse = false,
      } = req.body;

      if (!query || !correctedResponse) {
        return res.status(400).json({
          message: "Отсутствуют обязательные поля: query и correctedResponse",
        });
      }

      console.log("[DEBUG] Сохранение обучающих данных:", {
        query,
        originalResponse,
        correctedResponse,
        conversationId,
        channelId,
        isGoodResponse,
        userId: req.user.id,
      });

      // Получаем информацию о канале
      const channel = await storageInstance.getChannel(channelId);
      if (!channel) {
        return res.status(404).json({ message: "Канал не найден" });
      }

      // Проверяем права доступа к каналу
      if (channel.createdBy !== req.user.id) {
        return res.status(403).json({
          message: "У вас нет прав на обучение ассистентов в этом канале",
        });
      }

      // Получаем ассистента для диалога или канала
      let assistant = null;

      // Сначала пытаемся найти ассистента для конкретного диалога
      const dialogAssistant =
        await storageInstance.getDialogAssistantByDialogAndChannel(
          conversationId.toString(),
          channelId
        );

      if (dialogAssistant) {
        assistant = await storageInstance.getAssistant(
          dialogAssistant.assistantId
        );
      } else {
        // Если нет ассистента для диалога, ищем дефолтного для канала
        const channelAssistants =
          await storageInstance.listAssistantChannelsByChannel(channelId);
        const defaultAssistant = channelAssistants.find((ac) => ac.isDefault);
        if (defaultAssistant) {
          assistant = await storageInstance.getAssistant(
            defaultAssistant.assistantId
          );
        }
      }

      if (!assistant) {
        return res.status(404).json({
          message: "Не найден ассистент для этого диалога",
        });
      }

      if (!assistant.openaiAssistantId) {
        return res.status(400).json({
          message:
            "Ассистент не имеет ID в OpenAI, сначала синхронизируйте его",
        });
      }

      // Сохраняем исправление через сервис обучения ассистентов
      await assistantTrainingService.saveCorrection(
        assistant.id,
        assistant.openaiAssistantId,
        query,
        originalResponse || "",
        correctedResponse,
        assistant.instructions || assistant.prompt,
        channelId,
        conversationId,
        conversationId
      );

      // Логируем активность
      await storageInstance.createActivityLog({
        userId: req.user.id,
        assistantId: assistant.id,
        action: isGoodResponse ? "saved_good_response" : "corrected_response",
        details: {
          query,
          originalResponse,
          correctedResponse,
          conversationId,
          channelId,
        },
      });

      res.json({
        success: true,
        message: isGoodResponse
          ? "Хороший ответ сохранен для обучения ассистента"
          : "Исправление сохранено и применено к ассистенту",
      });
    } catch (error) {
      console.error("Ошибка при сохранении обучающих данных:", error);
      res.status(500).json({
        message: "Не удалось сохранить обучающие данные",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Роуты для работы с файлами ассистентов
  app.get("/api/assistants/:assistantId/files", async (req, res) => {
    try {
      const assistantId = parseInt(req.params.assistantId);
      if (isNaN(assistantId)) {
        return res.status(400).json({ message: "Invalid assistant ID" });
      }

      // Проверяем существование ассистента
      const assistant = await storageInstance.getAssistant(assistantId);
      if (!assistant) {
        return res.status(404).json({ message: "Assistant not found" });
      }

      const files = await storageInstance.listAssistantFiles(assistantId);

      // Получаем дополнительную информацию для каждого файла
      const filesWithDetails = await Promise.all(
        files.map(async (file) => {
          // Если есть связь с элементом базы знаний, добавляем информацию о нём
          if (file.knowledgeItemId) {
            const knowledgeItem = await storageInstance.getKnowledgeItem(
              file.knowledgeItemId
            );
            if (knowledgeItem) {
              return {
                ...file,
                knowledgeItem: {
                  id: knowledgeItem.id,
                  title: knowledgeItem.title,
                  fileType: knowledgeItem.fileType,
                  fileSize: knowledgeItem.fileSize,
                  contentType: knowledgeItem.contentType,
                  openaiFileId: knowledgeItem.openaiFileId,
                },
              };
            }
          }

          return file;
        })
      );

      res.json(filesWithDetails);
    } catch (error: any) {
      console.error("Error fetching assistant files:", error);
      res.status(500).json({
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.post("/api/channels/:channelId/dialogs/records", async (req, res) => {
    const channelId = parseInt(req.params.channelId);
    const dialogs = req.body.dialogs;
    const assistantId = req.body.assistantId;

    for (const dialog of dialogs) {
      await postgresStorage.newRecord(dialog, channelId, assistantId);
    }
  });

  app.post(
    "/api/assistants/:assistantId/files",
    upload.single("file"),
    async (req, res) => {
      try {
        const assistantId = parseInt(req.params.assistantId);
        if (isNaN(assistantId)) {
          return res.status(400).json({ message: "Invalid assistant ID" });
        }

        // Проверяем существование ассистента
        const assistant = await storageInstance.getAssistant(assistantId);
        if (!assistant) {
          return res.status(404).json({ message: "Assistant not found" });
        }

        // Проверяем наличие загруженного файла
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        // Загружаем файл в OpenAI
        const fileBuffer = req.file.buffer;
        const fileName = req.file.originalname;

        // Если у ассистента нет OpenAI ID, то создаем ассистента в OpenAI
        if (!assistant.openaiAssistantId) {
          try {
            const openaiAssistant = await openaiService.createAssistant(
              assistant.name,
              assistant.instructions || undefined
            );

            // Обновляем ассистента с OpenAI ID
            await storageInstance.updateAssistant(assistantId, {
              openaiAssistantId: openaiAssistant.id,
            });

            // Обновляем локальный объект
            assistant.openaiAssistantId = openaiAssistant.id;
          } catch (error) {
            console.error("Ошибка при создании ассистента в OpenAI", error);
            return res.status(500).json({
              message: "Failed to create assistant in OpenAI",
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }

        try {
          // Получаем расширение файла из имени
          const fileExtension =
            fileName.split(".").pop()?.toLowerCase() || "txt";

          // Проверяем поддерживается ли формат файла в OpenAI
          const supportedExtensions = ["txt", "pdf", "doc", "docx"];
          if (!supportedExtensions.includes(fileExtension)) {
            return res.status(400).json({
              message: `Неподдерживаемый формат файла для OpenAI: ${fileExtension}. Поддерживаются: ${supportedExtensions.join(
                ", "
              )}`,
            });
          }

          // Загружаем файл в OpenAI
          const uploadedFile = await openaiService.uploadFile(
            fileBuffer,
            fileName
          );

          // Прикрепляем файл к ассистенту
          if (assistant.openaiAssistantId) {
            await openaiService.attachFileToAssistant(
              assistant.openaiAssistantId,
              uploadedFile.fileId
            );
          }

          // Определяем тип контента на основе расширения
          let contentType = req.file.mimetype || "application/octet-stream";

          // Создаем запись о файле в БД
          const fileData = {
            assistantId,
            openaiFileId: uploadedFile.fileId,
            fileName,
            fileType: fileExtension,
            fileSize: req.file.size,
            uploadedBy: assistant.createdBy || 1,
          };

          const assistantFile = await storageInstance.createAssistantFile(
            fileData
          );

          // Логируем активность загрузки файла
          await storageInstance.createActivityLog({
            userId: assistant.createdBy,
            assistantId,
            action: "uploaded_file",
            details: { fileName, fileSize: req.file.size },
          });

          res.status(201).json(assistantFile);
        } catch (error) {
          console.error("Ошибка при загрузке файла", error);
          return res.status(500).json({
            message: "Failed to upload file",
            error: error instanceof Error ? error.message : String(error),
          });
        }
      } catch (error) {
        console.error("Ошибка при обработке загрузки файла", error);
        res.status(500).json({
          message: "Internal server error",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Маршрут для подключения файлов базы знаний к ассистенту
  app.post("/api/assistants/:assistantId/knowledge", async (req, res) => {
    try {
      console.log(
        `[START] ${new Date().toLocaleString()} Обработка запроса на подключение файлов к ассистенту`
      );
      const assistantId = parseInt(req.params.assistantId);
      if (isNaN(assistantId)) {
        console.warn(
          `[WARN] ${new Date().toLocaleString()} Невалидный ID ассистента`
        );
        return res.status(400).json({ message: "Invalid assistant ID" });
      }

      // Проверяем существование ассистента
      const assistant = await storageInstance.getAssistant(assistantId);
      if (!assistant) {
        console.warn(
          `[WARN] ${new Date().toLocaleString()} Ассистент не найден`
        );
        return res.status(404).json({ message: "Assistant not found" });
      }

      // Проверяем наличие OpenAI ассистента
      if (!assistant.openaiAssistantId) {
        console.warn(
          `[WARN] ${new Date().toLocaleString()} Отсутствует OpenAI ID у ассистента`
        );
        return res
          .status(400)
          .json({ message: "Assistant does not have an OpenAI assistant ID" });
      }

      // Получаем список ID файлов из запроса
      const { fileIds } = req.body;
      if (!Array.isArray(fileIds)) {
        console.warn(
          `[WARN] ${new Date().toLocaleString()} Неверный формат параметра fileIds`
        );
        return res
          .status(400)
          .json({ message: "Invalid fileIds parameter: expected an array" });
      }

      // Получаем список существующих файлов ассистента
      const existingFiles = await storageInstance.listAssistantFiles(
        assistantId
      );
      console.log(
        `Существующие файлы ассистента (${existingFiles.length}):`,
        existingFiles.map((f) => `${f.fileName} (${f.openaiFileId})`)
      );

      // Массив для успешно прикрепленных файлов
      const attachedFiles = [];
      const failedFiles = [];

      // Для каждого файла из базы знаний
      for (const knowledgeFileId of fileIds) {
        // Проверяем, не прикреплен ли уже этот файл к ассистенту
        const alreadyAttached = existingFiles.some(
          (f) => f.knowledgeItemId === knowledgeFileId
        );
        if (alreadyAttached) {
          console.log(
            `Файл с ID ${knowledgeFileId} уже прикреплен к ассистенту, пропускаем`
          );

          // Находим существующий файл и добавляем его в результаты
          const existingFile = existingFiles.find(
            (f) => f.knowledgeItemId === knowledgeFileId
          );
          if (existingFile) {
            attachedFiles.push(existingFile);
          }
          continue;
        }

        // Получаем файл из базы знаний
        const knowledgeItem = await storageInstance.getKnowledgeItem(
          knowledgeFileId
        );
        if (!knowledgeItem) {
          console.error(
            `[ERROR] ${new Date().toLocaleString()} Файл ${knowledgeFileId} не найден`
          );
          failedFiles.push({ id: knowledgeFileId, reason: "File not found" });
          continue;
        }

        // Проверяем, поддерживается ли тип файла OpenAI
        const supportedTypes = ["pdf", "txt", "doc", "docx"];

        // Получаем реальное расширение файла из его имени
        const fileNameParts = knowledgeItem.title.split(".");
        const extension =
          fileNameParts.length > 1
            ? fileNameParts[fileNameParts.length - 1].toLowerCase()
            : knowledgeItem.fileType;

        if (!supportedTypes.includes(extension)) {
          failedFiles.push({
            id: knowledgeFileId,
            reason: `тип файла ${extension} не поддерживается на OpenAI. Supported types: ${supportedTypes.join(
              ", "
            )}`,
          });
          continue;
        }

        try {
          // Если файла нет в OpenAI, загружаем его
          let openaiFileId = knowledgeItem.openaiFileId;

          if (!openaiFileId) {
            // Загружаем содержимое файла из base64 в буфер
            if (!knowledgeItem.content) {
              console.warn(`[SKIP] Отсутствует содержимое для файла`);
              failedFiles.push({
                id: knowledgeFileId,
                reason: `[SKIP] ${new Date().toLocaleString()} Отсутствует содержимое для файла`,
              });
              continue;
            }

            // Получаем расширение файла из имени
            const fileNameParts = knowledgeItem.title.split(".");
            const extension =
              fileNameParts.length > 1
                ? fileNameParts[fileNameParts.length - 1].toLowerCase()
                : knowledgeItem.fileType;

            // Формируем полное имя файла с правильным расширением
            let fileName = knowledgeItem.title;

            // Если в имени файла нет расширения, добавляем его
            if (fileNameParts.length === 1) {
              fileName = `${fileName}.${extension}`;
            }

            console.log(
              `Проверка типа файла: ${knowledgeItem.title}, расширение: ${extension}`
            );
            let fileContent = Buffer.from(
              knowledgeItem.content as string,
              "base64"
            );
            let finalFileName = fileName;

            // Утилита конвертации файлов импортирована в начале файла

            // Проверяем поддерживается ли формат OpenAI
            if (!isOpenAISupportedFormat(extension)) {
              // Если это табличный файл, конвертируем его в PDF
              if (isSpreadsheetFile(extension)) {
                try {
                  console.log(
                    `Конвертация табличного файла ${fileName} в PDF...`
                  );
                  const converted = await convertToSupportedFormat(
                    fileContent,
                    fileName
                  );
                  fileContent = converted.buffer;
                  finalFileName = converted.fileName;
                  console.log(`Файл успешно конвертирован в ${finalFileName}`);
                } catch (convError: any) {
                  console.error(`Ошибка при конвертации файла:`, convError);
                  failedFiles.push({
                    id: knowledgeFileId,
                    reason: `Тип файла ${extension} не поддерживается в OpenAI. Поддерживаемые типы: pdf, txt, doc, docx`,
                  });
                  continue; // Пропускаем этот файл и переходим к следующему
                }
              } else {
                // Если формат не поддерживается и не табличный, добавляем в список неудачных файлов
                failedFiles.push({
                  id: knowledgeFileId,
                  reason: `Тип файла ${extension} не поддерживается в OpenAI. Поддерживаемые типы: pdf, txt, doc, docx`,
                });
                continue; // Пропускаем этот файл и переходим к следующему
              }
            }

            // Загружаем файл в OpenAI с корректным именем
            const uploadedFile = await openaiService.uploadFile(
              fileContent,
              finalFileName
            );
            console.log(
              `[INFO] ${new Date().toLocaleString()} Загрузил файл в OpenAI`,
              uploadedFile
            );

            // Обновляем запись в базе знаний с ID файла OpenAI
            await storageInstance.updateKnowledgeItem(knowledgeFileId, {
              openaiFileId: uploadedFile.fileId,
            });

            openaiFileId = uploadedFile.fileId;
          }

          // Прикрепляем файл к ассистенту в OpenAI
          if (openaiFileId && assistant.openaiAssistantId) {
            await openaiService.attachFileToAssistant(
              assistant.openaiAssistantId,
              openaiFileId
            );
          } else {
            throw new Error("Missing openaiFileId or assistantId");
          }

          // Сохраняем информацию о прикреплении файла к ассистенту
          const assistantFile = await storageInstance.createAssistantFile({
            assistantId,
            fileName: knowledgeItem.title,
            fileSize: knowledgeItem.fileSize,
            fileType: knowledgeItem.fileType,
            openaiFileId: openaiFileId as string, // Используем обновленный openaiFileId
            knowledgeItemId: knowledgeItem.id,
            uploadedBy: assistant.createdBy,
          });

          // Логируем активность
          await storageInstance.createActivityLog({
            userId: assistant.createdBy,
            assistantId,
            action: "attached_knowledge_file",
            details: {
              fileName: knowledgeItem.title,
              fileId: knowledgeItem.id,
            },
          });

          attachedFiles.push(assistantFile);
        } catch (error) {
          console.error(
            `Ошибка при прикреплении файла ${knowledgeFileId} к ассистенту:`,
            error
          );
          failedFiles.push({
            id: knowledgeFileId,
            reason: "Failed to attach file to OpenAI assistant",
          });
        }
      }

      res.status(200).json({
        success: true,
        attachedFiles,
        failedFiles,
        message: `Successfully attached ${
          attachedFiles.length
        } files to assistant${
          failedFiles.length > 0 ? `, ${failedFiles.length} files failed` : ""
        }`,
      });
    } catch (error) {
      console.error(
        "Ошибка при подключении файлов базы знаний к ассистенту:",
        error
      );
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          error instanceof Error
            ? error instanceof Error
              ? error.message
              : String(error)
            : String(error),
      });
    }
  });

  app.delete("/api/assistants/:assistantId/files/:fileId", async (req, res) => {
    const assistantId = parseInt(req.params.assistantId);
    const fileId = parseInt(req.params.fileId);

    if (isNaN(assistantId) || isNaN(fileId)) {
      return res.status(400).json({ message: "Invalid ID parameters" });
    }

    // Получаем файл
    const file = await storageInstance.getAssistantFile(fileId);
    if (!file || file.assistantId !== assistantId) {
      return res
        .status(404)
        .json({ message: "File not found for this assistant" });
    }

    // Получаем ассистента
    const assistant = await storageInstance.getAssistant(assistantId);
    if (!assistant) {
      return res.status(404).json({ message: "Assistant not found" });
    }

    try {
      // Открепляем файл от ассистента в OpenAI (не удаляем сам файл)
      if (file.openaiFileId && assistant.openaiAssistantId) {
        await openaiService.detachFileFromAssistant(
          assistant.openaiAssistantId,
          file.openaiFileId
        );
      }

      // Удаляем запись о прикреплении файла в нашей БД
      await storageInstance.deleteAssistantFile(fileId);

      // Логируем активность
      await storageInstance.createActivityLog({
        userId: assistant.createdBy,
        assistantId,
        action: "detached_file",
        details: { fileName: file.fileName, fileId: file.id },
      });

      return res.status(200).json({
        success: true,
        message: "File detached from assistant successfully",
      });
    } catch (error) {
      console.error("Ошибка при откреплении файла:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to detach file: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
    }
  });

  // Маршрут для удаления файла из базы знаний
  app.delete("/api/knowledge/:fileId", async (req, res) => {
    const fileId = parseInt(req.params.fileId);

    if (isNaN(fileId)) {
      return res.status(400).json({ message: "Invalid file ID" });
    }

    // Получаем запись о файле из базы знаний
    const knowledgeItem = await storageInstance.getKnowledgeItem(fileId);
    if (!knowledgeItem) {
      return res.status(404).json({ message: "Knowledge item not found" });
    }

    try {
      // Сначала проверяем, прикреплен ли этот файл к каким-либо ассистентам
      // и открепляем его от всех ассистентов
      const assistantFiles =
        await storageInstance.listAssistantFilesByKnowledgeItem(fileId);

      for (const assistantFile of assistantFiles) {
        // Получаем ассистента
        const assistant = await storageInstance.getAssistant(
          assistantFile.assistantId
        );
        if (
          assistant &&
          assistant.openaiAssistantId &&
          assistantFile.openaiFileId
        ) {
          // Открепляем файл от ассистента в OpenAI
          try {
            await openaiService.detachFileFromAssistant(
              assistant.openaiAssistantId,
              assistantFile.openaiFileId
            );
          } catch (error) {
            console.error(
              `Ошибка при откреплении файла от ассистента ${assistant.id}:`,
              error
            );
            // Продолжаем выполнение, даже если открепление не удалось
          }

          // Удаляем запись о прикреплении в нашей БД
          await storageInstance.deleteAssistantFile(assistantFile.id);

          // Логируем активность
          await storageInstance.createActivityLog({
            userId: assistant.createdBy,
            assistantId: assistant.id,
            action: "deleted_file",
            details: { fileName: knowledgeItem.title, fileId },
          });
        }
      }

      // Удаляем файл в OpenAI, если у него есть openaiFileId
      if (knowledgeItem.openaiFileId) {
        try {
          await openaiService.deleteFile(knowledgeItem.openaiFileId);
        } catch (error) {
          console.error("Ошибка при удалении файла в OpenAI:", error);
          // Продолжаем выполнение, даже если удаление в OpenAI не удалось
        }
      }

      // Удаляем запись о файле из базы знаний
      const deleted = await storageInstance.deleteKnowledgeItem(fileId);

      if (!deleted) {
        return res.status(500).json({
          success: false,
          message: "Failed to delete knowledge item from database",
        });
      }

      return res.status(200).json({
        success: true,
        message: "File deleted successfully from knowledge base",
      });
    } catch (error) {
      console.error("Ошибка при удалении файла из базы знаний:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to delete file: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
    }
  });

  // Knowledge Base routes
  app.get("/api/knowledge", authenticateToken, async (req, res) => {
    // Фильтрация по пользователю не реализована в хранилище, фильтруем вручную
    const allItems = await storageInstance.listKnowledgeItems();
    // Возвращаем только элементы, загруженные текущим пользователем
    const userItems = allItems.filter(
      (item) => item.uploadedBy === req.user.id
    );
    res.json(userItems);
  });

  app.get("/api/knowledge/:id", authenticateToken, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid knowledge item ID" });
    }

    const knowledgeItem = await storageInstance.getKnowledgeItem(id);
    if (!knowledgeItem) {
      return res.status(404).json({ message: "Knowledge item not found" });
    }

    // Проверяем, что элемент принадлежит текущему пользователю
    if (knowledgeItem.uploadedBy !== req.user.id) {
      return res
        .status(403)
        .json({ message: "У вас нет доступа к этому элементу базы знаний" });
    }

    res.json(knowledgeItem);
  });

  app.post(
    "/api/knowledge",
    authenticateToken,
    upload.single("file"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Файл не был загружен" });
        }

        const { title, description, fileType } = req.body;

        if (!title || !fileType) {
          return res
            .status(400)
            .json({ message: "Необходимо указать название и тип файла" });
        }

        // Загружаем файл в OpenAI, если он поддерживается OpenAI
        let openaiFileId = null;

        try {
          const supportedTypes = ["pdf", "txt", "doc", "docx"];

          // Получаем расширение файла из имени
          const fileNameParts = req.file.originalname.split(".");
          const extension =
            fileNameParts.length > 1
              ? fileNameParts[fileNameParts.length - 1].toLowerCase()
              : fileType;

          // Проверяем и корректируем имя файла, если нужно
          let fileName = req.file.originalname;
          if (fileNameParts.length === 1 && extension) {
            fileName = `${fileName}.${extension}`;
            console.log(`Добавлено расширение к имени файла: ${fileName}`);
          }

          if (supportedTypes.includes(extension)) {
            console.log(
              `Загрузка файла ${fileName} в OpenAI, тип: ${extension}`
            );
            const uploadedFile = await openaiService.uploadFile(
              req.file.buffer,
              fileName
            );
            openaiFileId = uploadedFile.fileId;
            console.log(`Файл успешно загружен в OpenAI с ID: ${openaiFileId}`);
          } else {
            console.log(
              `Тип файла ${extension} не поддерживается OpenAI, пропускаем загрузку`
            );
          }
        } catch (uploadError) {
          console.error("Ошибка при загрузке файла в OpenAI:", uploadError);
          // Продолжаем выполнение даже при ошибке загрузки в OpenAI
        }

        // Определение типа контента на основе расширения файла
        const extension = (fileType as string).toLowerCase();
        let contentType = "application/octet-stream"; // По умолчанию

        // Устанавливаем соответствующий contentType
        switch (extension) {
          case "pdf":
            contentType = "application/pdf";
            break;
          case "txt":
            contentType = "text/plain";
            break;
          case "doc":
          case "docx":
            contentType = "application/msword";
            break;
          case "xlsx":
          case "xls":
            contentType = "application/vnd.ms-excel";
            break;
          case "pptx":
          case "ppt":
            contentType = "application/vnd.ms-powerpoint";
            break;
          case "jpg":
          case "jpeg":
            contentType = "image/jpeg";
            break;
          case "png":
            contentType = "image/png";
            break;
        }

        // Сохраняем информацию о файле в базу данных
        const knowledgeItemData = {
          title,
          fileType,
          contentType, // Добавляем contentType поле
          fileSize: req.file.size,
          content: req.file.buffer.toString("base64"), // Сохраняем файл в base64 формате
          openaiFileId,
          uploadedBy: req.user.id, // ID текущего пользователя
        };

        const newKnowledgeItem = await storageInstance.createKnowledgeItem(
          knowledgeItemData
        );

        // Логируем активность загрузки файла
        await storageInstance.createActivityLog({
          userId: req.user.id,
          action: "uploaded_knowledge_item",
          details: { fileName: title, fileSize: req.file.size },
        });

        res.status(201).json(newKnowledgeItem);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            message: "Invalid knowledge item data",
            errors: error.errors,
          });
        }
        throw error;
      }
    }
  );

  // Маршрут для загрузки файлов в базу знаний
  app.post(
    "/api/knowledge/upload",
    authenticateToken,
    upload.single("file"),
    async (req, res) => {
      try {
        // Проверяем наличие загруженного файла
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        // Получаем данные из FormData
        const fileType = req.body.fileType || "txt";
        const contentType = req.body.contentType || req.file.mimetype;
        const title = req.body.title || req.file.originalname;

        // Используем ID текущего пользователя вместо параметра
        const uploadedBy = req.user.id;

        // Создаем элемент базы знаний с базовой информацией о файле
        const knowledgeItemData = {
          title,
          fileType,
          contentType,
          fileSize: req.file.size,
          uploadedBy,
          // Для простоты храним содержимое файла в base64
          content: req.file.buffer.toString("base64"),
        };

        try {
          // Создаем запись в базе знаний
          const knowledgeItem = await storageInstance.createKnowledgeItem(
            knowledgeItemData
          );

          // Логируем активность загрузки файла
          await storageInstance.createActivityLog({
            userId: uploadedBy,
            action: "uploaded_knowledge_item",
            details: { fileName: title, fileSize: req.file.size },
          });

          // Отправляем ответ с созданной записью
          res.status(201).json(knowledgeItem);
        } catch (error) {
          console.error("Ошибка при создании записи в базе знаний", error);
          return res.status(500).json({
            message: "Failed to create knowledge item",
            error: error instanceof Error ? error.message : String(error),
          });
        }
      } catch (error) {
        console.error(
          "Ошибка при обработке загрузки файла в базу знаний",
          error
        );
        res.status(500).json({
          message: "Internal server error",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Channel routes
  app.get("/api/channels", authenticateToken, async (req, res) => {
    // Получаем все каналы и фильтруем по текущему пользователю
    const allChannels = await storageInstance.listChannels();
    const userChannels = allChannels.filter(
      (channel) => channel.createdBy === req.user.id
    );
    res.json(userChannels);
  });

  app.get("/api/channels/:id", authenticateToken, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid channel ID" });
    }

    const channel = await storageInstance.getChannel(id);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // Проверяем, что канал принадлежит текущему пользователю
    if (channel.createdBy !== req.user.id) {
      return res
        .status(403)
        .json({ message: "У вас нет доступа к этому каналу" });
    }

    res.json(channel);
  });

  app.delete("/api/channels/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid channel ID" });
      }

      // Получаем канал
      const channel = await storageInstance.getChannel(id);
      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }

      // Проверяем, что канал принадлежит текущему пользователю
      if (channel.createdBy !== req.user.id) {
        return res
          .status(403)
          .json({ message: "У вас нет прав на удаление этого канала" });
      }

      // Если это канал VK, удаляем вебхуки перед удалением канала
      if (channel.type === "vk" && channel.settings) {
        try {
          const webhooks = await vkService.getWebhookSubscriptions(channel);

          // Удаляем все вебхуки для этого канала
          for (const webhook of webhooks) {
            try {
              await vkService.deleteWebhookSubscription(channel, webhook.id);
              console.log(`Удален вебхук ID ${webhook.id} для канала ${id}`);
            } catch (webhookError) {
              console.error(
                `Ошибка при удалении вебхука ${webhook.id}:`,
                webhookError
              );
              // Продолжаем удаление других вебхуков
            }
          }
        } catch (error) {
          console.error(
            `Ошибка при получении вебхуков для канала ${id}:`,
            error
          );
          // Продолжаем удаление канала даже если не удалось удалить вебхуки
        }
      }

      // Получаем все разговоры для этого канала
      const conversations = await storageInstance.listConversationsByChannel(
        id
      );

      // Удаляем сообщения для каждого разговора
      for (const conversation of conversations) {
        // Получаем все сообщения для этого разговора
        const messages = await storageInstance.listMessagesByConversation(
          conversation.id
        );

        // Удаляем каждое сообщение (здесь предполагается, что есть метод deleteMessage)
        // Добавим проверку на наличие метода, если он не реализован
        if ("deleteMessage" in storageInstance) {
          for (const message of messages) {
            try {
              // @ts-ignore - Проверяем наличие метода во время выполнения
              await storageInstance.deleteMessage(message.id);
            } catch (messageError) {
              console.error(
                `Ошибка при удалении сообщения ${message.id}:`,
                messageError
              );
              // Продолжаем удаление других сообщений
            }
          }
        } else {
          console.warn(
            "Метод deleteMessage не реализован, пропускаем удаление сообщений"
          );
        }

        // Удаляем разговор (предполагается, что есть метод deleteConversation)
        // Добавим проверку на наличие метода, если он не реализован
        if ("deleteConversation" in storageInstance) {
          try {
            // @ts-ignore - Проверяем наличие метода во время выполнения
            await storageInstance.deleteConversation(conversation.id);
          } catch (convError) {
            console.error(
              `Ошибка при удалении разговора ${conversation.id}:`,
              convError
            );
            // Продолжаем процесс удаления канала
          }
        } else {
          console.warn(
            "Метод deleteConversation не реализован, пропускаем удаление разговоров"
          );
        }
      }

      // Удаляем ассоциации ассистентов с каналом (AssistantChannel)
      const assistantChannels =
        await storageInstance.listAssistantChannelsByChannel(id);
      for (const assistantChannel of assistantChannels) {
        try {
          await storageInstance.deleteAssistantChannel(assistantChannel.id);
        } catch (acError) {
          console.error(
            `Ошибка при удалении связи ассистент-канал ${assistantChannel.id}:`,
            acError
          );
          // Продолжаем удаление других связей
        }
      }

      // Наконец удаляем сам канал
      // Обратите внимание, что метод deleteChannel должен быть реализован в хранилище
      if ("deleteChannel" in storageInstance) {
        try {
          // @ts-ignore - Проверяем наличие метода во время выполнения
          const result = await storageInstance.deleteChannel(id);

          // Логируем активность
          await storageInstance.createActivityLog({
            userId: req.user.id,
            action: "deleted_channel",
            details: { channelId: id, channelType: channel.type },
          });

          return res.status(200).json({
            success: true,
            message: "Channel and related data deleted successfully",
          });
        } catch (channelError) {
          console.error(`Ошибка при удалении канала ${id}:`, channelError);
          return res.status(500).json({
            success: false,
            message: "Error deleting channel",
            error:
              channelError instanceof Error
                ? channelError.message
                : String(channelError),
          });
        }
      } else {
        return res.status(501).json({
          success: false,
          message: "Channel deletion not implemented",
        });
      }
    } catch (error) {
      console.error("Ошибка при удалении канала:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Тестирование подключения к Telegram
  app.post("/api/channels/test-telegram-connection", async (req, res) => {
    try {
      const { token, botUsername } = req.body;

      if (!token || !botUsername) {
        return res.status(400).json({
          message: "Отсутствуют обязательные параметры",
          errors: ["Токен и имя пользователя бота обязательны"],
        });
      }

      const isConnected = await telegramService.testConnection(
        token,
        botUsername
      );

      if (isConnected) {
        return res.status(200).json({
          success: true,
          message: "Подключение к Telegram успешно установлено",
        });
      } else {
        return res.status(400).json({
          success: false,
          message:
            "Не удалось подключиться к Telegram. Проверьте токен и имя пользователя.",
        });
      }
    } catch (error: any) {
      console.error("Ошибка при проверке подключения к Telegram:", error);
      return res.status(500).json({
        message: "Ошибка на сервере",
        error: error.message,
      });
    }
  });

  // Тестирование подключения к SMS
  app.post("/api/channels/test-sms-connection", async (req, res) => {
    try {
      const { email, apiKey } = req.body;

      if (!email || !apiKey) {
        return res.status(400).json({
          message: "Отсутствуют обязательные параметры",
          errors: ["Email и API ключ обязательны"],
        });
      }

      // В реальном проекте здесь должна быть проверка подключения к SMS API
      // Для тестирования просто возвращаем успешный результат
      return res.status(200).json({
        success: true,
        message: "Подключение к SMS.AERO успешно установлено",
      });
    } catch (error: any) {
      console.error("Ошибка при проверке подключения к SMS.AERO:", error);
      return res.status(500).json({
        message: "Ошибка на сервере",
        error: error.message,
      });
    }
  });

  app.post("/api/channels", authenticateToken, async (req, res) => {
    try {
      console.log(
        "Создание канала. Входящие данные:",
        JSON.stringify(req.body)
      );

      // Проверяем структуру входящих данных для SMS канала
      if (req.body.type === "sms") {
        console.log("Запрос на создание SMS канала. Проверка данных...");
        const { channelName, email, apiKey, sender } = req.body;

        // Формируем правильные данные для парсинга схемой insertChannelSchema
        req.body = {
          name: channelName,
          type: "sms",
          status: "active",
          settings: {
            email,
            apiKey,
            sender,
          },
        };

        console.log(
          "Преобразованные данные для SMS канала:",
          JSON.stringify(req.body)
        );
      }

      // Добавляем поле createdBy перед валидацией
      req.body.createdBy = req.user.id;

      const channelData = insertChannelSchema.parse(req.body);
      console.log(
        "Данные после валидации insertChannelSchema:",
        JSON.stringify(channelData)
      );

      // Дополнительная валидация для SMS каналов
      if (channelData.type === "sms" && channelData.settings) {
        console.log(
          "Выполняем валидацию SMS канала. Настройки:",
          JSON.stringify(channelData.settings)
        );
        try {
          // Валидируем настройки SMS канала
          const validatedSettings = smsChannelSettingsSchema.parse(
            channelData.settings
          );
          console.log(
            "SMS настройки после валидации:",
            JSON.stringify(validatedSettings)
          );

          const { email, apiKey } = validatedSettings;

          // Проверяем обязательные поля
          if (!email || !apiKey) {
            console.log("Отсутствуют обязательные поля email или apiKey");
            return res.status(400).json({
              message: "Отсутствуют обязательные параметры",
              errors: ["Email и API ключ обязательны"],
            });
          }
        } catch (validationError) {
          console.error("Ошибка валидации SMS канала:", validationError);
          if (validationError instanceof z.ZodError) {
            return res.status(400).json({
              message: "Некорректные настройки SMS канала",
              errors: validationError.errors,
            });
          }
          throw validationError;
        }
      }

      const newChannel = await storageInstance.createChannel(channelData);

      // Логируем активность создания канала
      await storageInstance.createActivityLog({
        userId: req.user.id,
        action: "created_channel",
        details: { name: channelData.name, type: channelData.type },
      });

      res.status(201).json(newChannel);
    } catch (error) {
      console.error("Ошибка создания канала:", error);

      if (error instanceof z.ZodError) {
        console.error(
          "ZodError details:",
          JSON.stringify(error.errors, null, 2)
        );

        return res
          .status(400)
          .json({ message: "Invalid channel data", errors: error.errors });
      }
      console.error(
        "Unexpected error:",
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  });

  app.patch("/api/channels/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid channel ID" });
      }

      // Проверяем существование канала
      const existingChannel = await storageInstance.getChannel(id);
      if (!existingChannel) {
        return res.status(404).json({ message: "Channel not found" });
      }

      // Проверяем, что канал принадлежит текущему пользователю
      if (existingChannel.createdBy !== req.user.id) {
        return res
          .status(403)
          .json({ message: "У вас нет прав на редактирование этого канала" });
      }

      // Разрешаем частичное обновление
      const channelData = insertChannelSchema.partial().parse(req.body);

      // Запрещаем изменение createdBy
      if (channelData.createdBy && channelData.createdBy !== req.user.id) {
        delete channelData.createdBy;
      }

      const updatedChannel = await storageInstance.updateChannel(
        id,
        channelData
      );

      if (!updatedChannel) {
        return res.status(500).json({ message: "Failed to update channel" });
      }

      // Логируем активность обновления канала
      await storageInstance.createActivityLog({
        userId: req.user.id,
        action: "updated_channel",
        details: {
          id: updatedChannel.id,
          name: updatedChannel.name,
          type: updatedChannel.type,
        },
      });

      res.json(updatedChannel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid channel data", errors: error.errors });
      }
      throw error;
    }
  });

  // Webhook для VK API
  app.post("/api/channels/vk/webhook/:channelId", async (req, res) => {
    try {
      const channelId = parseInt(req.params.channelId);
      if (isNaN(channelId)) {
        return res.status(400).json({ message: "Invalid channel ID" });
      }

      const channel = await storageInstance.getChannel(channelId);
      if (!channel || channel.type !== "vk") {
        return res.status(404).json({ message: "VK channel not found" });
      }

      const body = req.body;

      // Логирование входящего запроса
      console.log("Получен запрос от VK API:", body);

      // Проверка наличия параметра type в запросе
      if (!body.type) {
        return res
          .status(400)
          .json({ message: "Invalid request: type parameter is missing" });
      }

      // Обработка запроса подтверждения
      if (body.type === "confirmation") {
        // Получаем id группы из параметров запроса
        const groupId = body.group_id;
        if (!groupId) {
          return res.status(400).json({
            message: "Invalid request: group_id parameter is missing",
          });
        }

        // Ищем канал в базе данных по group_id
        const channels = await storageInstance.listChannels();
        const vkChannel = channels.find(
          (channel) =>
            channel.type === "vk" &&
            (channel.settings as any).groupId === String(groupId)
        );

        if (!vkChannel) {
          return res
            .status(404)
            .json({ message: "Channel not found for this group_id" });
        }

        // Получаем код подтверждения
        try {
          const confirmationCode = await vkService.getConfirmationCode(
            vkChannel
          );
          return res.send(confirmationCode);
        } catch (error) {
          console.error("Ошибка при получении кода подтверждения:", error);
          return res
            .status(500)
            .json({ message: "Failed to get confirmation code" });
        }
      }

      // Обработка сообщений
      if (body.type === "message_new") {
        // Получаем id группы из параметров запроса
        const groupId = body.group_id;
        // Получаем информацию о сообщении
        const message = body.object?.message;

        if (!groupId || !message) {
          return res.status(400).json({ message: "Invalid message_new event" });
        }

        try {
          // Логируем получение сообщения
          console.log(
            `Получено сообщение от пользователя ${message.from_id} в группе ${groupId}: ${message.text}`
          );

          // Находим соответствующий канал
          const channels = await storageInstance.listChannels();
          const vkChannel = channels.find(
            (channel) =>
              channel.type === "vk" &&
              (channel.settings as any) &&
              typeof (channel.settings as any) === "object" &&
              "groupId" in (channel.settings as any) &&
              (channel.settings as any).groupId === String(groupId)
          );

          if (!vkChannel) {
            console.error(`Канал VK для группы ${groupId} не найден`);
            return res.send("ok");
          }

          // Находим или создаем разговор для этого пользователя
          let conversation = await findOrCreateConversation(
            storageInstance,
            vkChannel.id,
            String(message.from_id),
            vkChannel.createdBy
          );

          // Проверяем, не обрабатывали ли мы уже это сообщение
          const savedMessages =
            await storageInstance.listMessagesByConversation(conversation.id);
          const messageAlreadyProcessed = savedMessages.some((msg) => {
            if (!msg.metadata || typeof msg.metadata !== "object") return false;

            const metadata = msg.metadata as Record<string, any>;
            return (
              "vk_message_id" in metadata &&
              metadata.vk_message_id === message.id
            );
          });

          if (messageAlreadyProcessed) {
            console.log(
              `Сообщение ${message.id} уже было обработано ранее, пропускаем`
            );
            return res.send("ok");
          }

          // Сохраняем входящее сообщение
          await storageInstance.createMessage({
            conversationId: conversation.id,
            content: message.text || "[вложение без текста]",
            senderType: "user",
            metadata: {
              vk_message_id: message.id,
              from_id: message.from_id,
            },
          });

          // Обрабатываем сообщение через ассистента OpenAI и отправляем ответ
          // Создаем VkMessage для обработки ассистентом
          const vkMessage: VkMessage = {
            id: message.id,
            date: message.date,
            fromId: message.from_id,
            peerId: message.peer_id || message.from_id, // Убедимся, что peerId установлен
            text: message.text || "",
            attachments: message.attachments,
          };

          // Запускаем асинхронную обработку сообщения, но не ждем завершения
          // чтобы быстро ответить "ok" на webhook
          processNewUserMessagesWithAssistant(
            vkChannel,
            message.peer_id || message.from_id,
            [vkMessage],
            storageInstance
          ).catch((error) => {
            console.error("Ошибка при обработке сообщения ассистентом:", error);
          });

          // Отправляем "ok" для подтверждения получения
          return res.send("ok");
        } catch (error) {
          console.error("Ошибка при обработке сообщения VK:", error);
          return res.send("ok");
        }
      }

      // Для всех остальных типов событий возвращаем "ok"
      return res.send("ok");
    } catch (error) {
      console.error("Ошибка при обработке webhook от VK:", error);
      // VK API ожидает строку "ok" в теле ответа
      return res.send("ok");
    }
  });

  // Маршруты для работы с VK диалогами
  app.get(
    "/api/channels/:id/vk/dialogs",
    authenticateToken,
    async (req, res) => {
      try {
        const channelId = parseInt(req.params.id);
        if (isNaN(channelId)) {
          return res.status(400).json({ message: "Некорректный ID канала" });
        }

        // Получаем канал из БД
        const channel = await storageInstance.getChannel(channelId);
        if (!channel) {
          return res.status(404).json({ message: "Канал не найден" });
        }

        // Проверяем, что это канал VK
        if (channel.type !== "vk") {
          return;
        }

        // Получаем список диалогов через VK сервис
        const dialogs = await vkService.getConversations(channel);

        res.json(dialogs);
      } catch (error) {
        console.error("Ошибка при получении списка диалогов VK:", error);
        res.status(500).json({
          message: "Ошибка при получении диалогов",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  app.get(
    "/api/channels/:id/vk/dialogs/:peerId/history",
    authenticateToken,
    async (req, res) => {
      try {
        const channelId = parseInt(req.params.id);
        const peerId = parseInt(req.params.peerId);

        if (isNaN(channelId) || isNaN(peerId)) {
          return res
            .status(400)
            .json({ message: "Некорректные параметры запроса" });
        }

        // Получаем канал из БД
        const channel = await storageInstance.getChannel(channelId);
        if (!channel) {
          return res.status(404).json({ message: "Канал не найден" });
        }

        // Проверяем, что это канал VK
        if (channel.type !== "vk") {
          return;
        }

        // Определяем количество сообщений для загрузки
        const count = req.query.count
          ? parseInt(req.query.count as string)
          : 30;

        // Получаем историю сообщений через VK сервис
        let messages = await vkService.getConversationHistory(
          channel,
          peerId,
          count
        );
        // Маркируем сообщения как прочитанные
        try {
          await vkService.markMessagesAsRead(channel, peerId);
          console.log(`Сообщения в диалоге ${peerId} помечены как прочитанные`);
        } catch (markError) {
          console.error("Ошибка при маркировке сообщений:", markError);
          // Даже если не удалось пометить как прочитанные, продолжаем и возвращаем историю
        }

        // Мы не обрабатываем сообщения здесь, т.к. это только просмотр истории
        // Обработка сообщений происходит через webhook при получении новых сообщений

        res.json(messages);
      } catch (error) {
        console.error("Ошибка при получении истории диалога VK:", error);
        res.status(500).json({
          message: "Ошибка при получении истории диалога",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  app.post(
    "/api/channels/:id/vk/dialogs/:peerId/messages",
    authenticateToken,
    async (req, res) => {
      try {
        const channelId = parseInt(req.params.id);
        const peerId = parseInt(req.params.peerId);

        if (isNaN(channelId) || isNaN(peerId)) {
          return res
            .status(400)
            .json({ message: "Некорректные параметры запроса" });
        }

        // Получаем канал из БД
        const channel = await storageInstance.getChannel(channelId);
        if (!channel) {
          return res.status(404).json({ message: "Канал не найден" });
        }

        // Проверяем, что это канал VK
        if (channel.type !== "vk") {
          return;
        }

        // Валидируем тело запроса
        const { message, attachment } = req.body;
        if (!message || typeof message !== "string") {
          return res
            .status(400)
            .json({ message: "Текст сообщения обязателен" });
        }

        // Находим или создаем разговор для этого пользователя
        const conversation = await findOrCreateConversation(
          storageInstance,
          channelId,
          String(peerId),
          req.user!.id
        );

        // Отправляем сообщение через VK сервис
        const result = await vkService.sendMessage(
          channel,
          peerId,
          message,
          attachment
        );

        // Сохраняем отправленное сообщение в БД
        await storageInstance.createMessage({
          conversationId: conversation.id,
          content: message,
          senderType: "assistant",
          metadata: {
            vk_message_id: result.message_id || null,
            attachment: attachment || null,
          },
        });

        // writeOff - списние
        // const writeOff = await postgresStorage.getMessageUsed(req.user!.id);
        // console.log(
        //   `[WRITEOFF] Для пользователя ${
        //     req.user!.id
        //   } увеличили messagesUsed на 1. Текущее значение: ${
        //     writeOff.messagesUsed
        //   }`
        // );

        res.json({ success: true, result });
      } catch (error) {
        console.error("Ошибка при отправке сообщения в VK:", error);
        res.status(500).json({
          message: "Ошибка при отправке сообщения",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Маршрут для получения информации о пользователе VK
  app.get(
    "/api/channels/:id/vk/users/:userId",
    authenticateToken,
    async (req, res) => {
      try {
        const channelId = parseInt(req.params.id);
        const userId = parseInt(req.params.userId);

        if (isNaN(channelId) || isNaN(userId)) {
          return res
            .status(400)
            .json({ message: "Некорректные параметры запроса" });
        }

        // Получаем канал из БД
        const channel = await storageInstance.getChannel(channelId);
        if (!channel) {
          return res.status(404).json({ message: "Канал не найден" });
        }

        // Проверяем, что это канал VK
        if (channel.type !== "vk") {
          return res
            .status(400)
            .json({ message: "Канал не является VK каналом" });
        }

        // Получаем информацию о пользователе через VK сервис
        const userInfo = await vkService.getUserInfo(channel, userId);

        if (!userInfo) {
          return res
            .status(404)
            .json({ message: "Информация о пользователе не найдена" });
        }

        res.json(userInfo);
      } catch (error) {
        console.error(
          "Ошибка при получении информации о пользователе VK:",
          error
        );
        res.status(500).json({
          message: "Ошибка при получении информации о пользователе",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Маршрут для получения информации о профилях пользователей VK
  app.get(
    "/api/channels/:id/vk/profiles",
    authenticateToken,
    async (req, res) => {
      try {
        const channelId = parseInt(req.params.id);

        if (isNaN(channelId)) {
          return res.status(400).json({ message: "Некорректный ID канала" });
        }

        // Получаем канал из БД
        const channel = await storageInstance.getChannel(channelId);
        if (!channel) {
          return res.status(404).json({ message: "Канал не найден" });
        }

        // Проверяем, что это канал VK
        if (channel.type !== "vk") {
          return res
            .status(400)
            .json({ message: "Канал не является VK каналом" });
        }

        // Получаем список диалогов, чтобы извлечь ID пользователей
        const dialogs = await vkService.getConversations(channel);

        if (!dialogs || !Array.isArray(dialogs)) {
          return res.json([]);
        }

        // Извлекаем уникальные ID пользователей из диалогов
        const userIds = Array.from(
          new Set(
            dialogs
              .filter(
                (dialog) =>
                  dialog.type === "user" &&
                  typeof dialog.lastMessage?.peerId === "number"
              )
              .map((dialog) => dialog.lastMessage.peerId)
          )
        );

        if (userIds.length === 0) {
          return res.json([]);
        }

        // Получаем информацию о пользователях
        const profiles = await vkService.getUsersInfo(channel, userIds);

        res.json(profiles);
      } catch (error) {
        console.error("Ошибка при получении профилей пользователей VK:", error);
        res.status(500).json({
          message: "Ошибка при получении профилей пользователей",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Маршрут для получения кода подтверждения для вебхука
  app.get(
    "/api/channels/:id/vk/confirmation-code",
    authenticateToken,
    async (req, res) => {
      try {
        const channelId = parseInt(req.params.id);

        if (isNaN(channelId)) {
          return res.status(400).json({ message: "Некорректный ID канала" });
        }

        // Получаем канал из БД
        const channel = await storageInstance.getChannel(channelId);
        if (!channel) {
          return res.status(404).json({ message: "Канал не найден" });
        }

        // Проверяем, что это канал VK
        if (channel.type !== "vk") {
          return res
            .status(400)
            .json({ message: "Канал не является VK каналом" });
        }

        // Получаем код подтверждения
        const code = await vkService.getConfirmationCode(channel);

        res.json({ code });
      } catch (error) {
        console.error("Ошибка при получении кода подтверждения VK:", error);
        res.status(500).json({
          message: "Ошибка при получении кода подтверждения",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Маршрут для получения списка подписок на вебхуки
  app.get(
    "/api/channels/:id/vk/webhooks",
    authenticateToken,
    async (req, res) => {
      try {
        const channelId = parseInt(req.params.id);

        if (isNaN(channelId)) {
          return res.status(400).json({ message: "Некорректный ID канала" });
        }

        // Получаем канал из БД
        const channel = await storageInstance.getChannel(channelId);
        if (!channel) {
          return res.status(404).json({ message: "Канал не найден" });
        }

        // Проверяем, что это канал VK
        if (channel.type !== "vk") {
          return res
            .status(400)
            .json({ message: "Канал не является VK каналом" });
        }

        // Получаем список подписок на вебхуки
        const webhooks = await vkService.getWebhookSubscriptions(channel);

        res.json(webhooks);
      } catch (error) {
        console.error("Ошибка при получении списка подписок VK:", error);
        res.status(500).json({
          message: "Ошибка при получении списка подписок",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Маршрут для создания подписки на вебхук
  app.post(
    "/api/channels/:id/vk/webhooks",
    authenticateToken,
    async (req, res) => {
      try {
        const channelId = parseInt(req.params.id);

        if (isNaN(channelId)) {
          return res.status(400).json({ message: "Некорректный ID канала" });
        }

        // Получаем канал из БД
        const channel = await storageInstance.getChannel(channelId);
        if (!channel) {
          return res.status(404).json({ message: "Канал не найден" });
        }

        // Проверяем, что это канал VK
        if (channel.type !== "vk") {
          return res
            .status(400)
            .json({ message: "Канал не является VK каналом" });
        }

        // Формируем URL для вебхука используя функцию определения текущего домена
        const publicUrl = getCurrentBaseUrl(req);
        const callbackUrl = `${publicUrl}/api/channels/vk/webhook/${channelId}`;
        console.log(`[DEBUG] Переменная PUBLIC_URL: ${process.env.PUBLIC_URL}`);
        console.log(`[DEBUG] Текущий базовый URL: ${publicUrl}`);
        console.log(`[DEBUG] Сформированный URL вебхука: ${callbackUrl}`);

        // Создаем подписку на вебхук
        const result = await vkService.createWebhookSubscription(
          channel,
          callbackUrl,
          "Asissto Bot"
        );

        res.status(201).json(result);
      } catch (error) {
        console.error("Ошибка при создании подписки VK:", error);
        res.status(500).json({
          message: "Ошибка при создании подписки на вебхук",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Маршрут для удаления подписки на вебхук
  app.delete(
    "/api/channels/:id/vk/webhooks/:serverId",
    authenticateToken,
    async (req, res) => {
      try {
        const channelId = parseInt(req.params.id);
        const serverId = parseInt(req.params.serverId);

        if (isNaN(channelId) || isNaN(serverId)) {
          return res.status(400).json({ message: "Некорректные параметры" });
        }

        // Получаем канал из БД
        const channel = await storageInstance.getChannel(channelId);
        if (!channel) {
          return res.status(404).json({ message: "Канал не найден" });
        }

        // Проверяем, что это канал VK
        if (channel.type !== "vk") {
          return res
            .status(400)
            .json({ message: "Канал не является VK каналом" });
        }

        // Удаляем подписку на вебхук
        const result = await vkService.deleteWebhookSubscription(
          channel,
          serverId
        );

        res.json(result);
      } catch (error) {
        console.error("Ошибка при удалении подписки VK:", error);
        res.status(500).json({
          message: "Ошибка при удалении подписки на вебхук",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Маркировка всех сообщений в диалоге как прочитанные
  app.post(
    "/api/channels/:id/vk/dialogs/:peerId/mark-as-read",
    authenticateToken,
    async (req, res) => {
      try {
        const channelId = parseInt(req.params.id);
        const peerId = parseInt(req.params.peerId);

        if (isNaN(channelId) || isNaN(peerId)) {
          return res.status(400).json({ message: "Некорректные параметры" });
        }

        // Получаем канал из БД
        const channel = await storageInstance.getChannel(channelId);
        if (!channel) {
          return res.status(404).json({ message: "Канал не найден" });
        }

        // Проверяем, что это канал VK
        if (channel.type !== "vk") {
          return res
            .status(400)
            .json({ message: "Канал не является VK каналом" });
        }

        // Отмечаем сообщения как прочитанные
        await vkService.markMessagesAsRead(channel, peerId);

        res.json({ success: true });
      } catch (error) {
        console.error("Ошибка при отметке сообщений как прочитанных:", error);
        res.status(500).json({
          message: "Ошибка при отметке сообщений",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // API для связи ассистентов с каналами

  // Получение всех каналов, связанных с ассистентом
  app.get(
    "/api/assistants/:assistantId/channels",
    authenticateToken,
    async (req, res) => {
      try {
        const assistantId = parseInt(req.params.assistantId);

        if (isNaN(assistantId)) {
          return res
            .status(400)
            .json({ message: "Некорректный ID ассистента" });
        }

        // Проверяем существование ассистента
        const assistant = await storageInstance.getAssistant(assistantId);
        if (!assistant) {
          return res.status(404).json({ message: "Ассистент не найден" });
        }

        // Получаем все связи ассистент-канал
        const assistantChannels =
          await storageInstance.listAssistantChannelsByAssistant(assistantId);

        res.json(assistantChannels);
      } catch (error) {
        console.error("Ошибка при получении каналов ассистента:", error);
        res.status(500).json({
          message: "Ошибка при получении связей ассистент-канал",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Получение связи ассистент-канал по ID
  app.get(
    "/api/assistants/:assistantId/channels/:channelId",
    authenticateToken,
    async (req, res) => {
      try {
        const assistantId = parseInt(req.params.assistantId);
        const channelId = parseInt(req.params.channelId);

        if (isNaN(assistantId) || isNaN(channelId)) {
          return res.status(400).json({ message: "Некорректные параметры" });
        }

        // Получаем связь ассистент-канал
        const assistantChannel =
          await storageInstance.getAssistantChannelByAssistantAndChannel(
            assistantId,
            channelId
          );

        if (!assistantChannel) {
          return res
            .status(404)
            .json({ message: "Связь ассистент-канал не найдена" });
        }

        res.json(assistantChannel);
      } catch (error) {
        console.error("Ошибка при получении связи ассистент-канал:", error);
        res.status(500).json({
          message: "Ошибка при получении связи",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Создание связи ассистент-канал
  app.post(
    "/api/assistants/:assistantId/channels",
    authenticateToken,
    async (req, res) => {
      try {
        const assistantId = parseInt(req.params.assistantId);

        if (isNaN(assistantId)) {
          return res
            .status(400)
            .json({ message: "Некорректный ID ассистента" });
        }

        // Проверяем существование ассистента
        const assistant = await storageInstance.getAssistant(assistantId);
        if (!assistant) {
          return res.status(404).json({ message: "Ассистент не найден" });
        }

        // Проверяем данные в теле запроса
        const { channelId, enabled, autoReply, isDefault, settings } = req.body;

        if (!channelId || isNaN(parseInt(channelId))) {
          return res.status(400).json({ message: "Некорректный ID канала" });
        }

        // Проверяем существование канала
        const channel = await storageInstance.getChannel(parseInt(channelId));
        if (!channel) {
          return res.status(404).json({ message: "Канал не найден" });
        }

        // Проверяем, существует ли уже такая связь
        const existingAssistantChannel =
          await storageInstance.getAssistantChannelByAssistantAndChannel(
            assistantId,
            parseInt(channelId)
          );

        if (existingAssistantChannel) {
          return res.status(409).json({
            message: "Связь между этим ассистентом и каналом уже существует",
          });
        }

        // Если новый ассистент устанавливается как дефолтный, нужно сбросить флаг у других ассистентов канала
        if (isDefault) {
          const channelAssistants =
            await storageInstance.listAssistantChannelsByChannel(
              parseInt(channelId)
            );
          for (const ca of channelAssistants) {
            if (ca.isDefault) {
              await storageInstance.updateAssistantChannel(ca.id, {
                isDefault: false,
              });
            }
          }
        }

        // Создаем связь ассистент-канал
        const assistantChannel = await storageInstance.createAssistantChannel({
          assistantId,
          channelId: parseInt(channelId),
          enabled: enabled !== undefined ? enabled : true,
          autoReply: autoReply !== undefined ? autoReply : true,
          isDefault: isDefault !== undefined ? isDefault : false,
          settings: settings || {},
        });

        // Обновляем ассистента для всех диалогов этого канала
        await updateAssistantForAllDialogs(
          parseInt(channelId),
          assistantId,
          storageInstance
        );

        res.status(201).json(assistantChannel);
      } catch (error) {
        console.error("Ошибка при создании связи ассистент-канал:", error);
        res.status(500).json({
          message: "Ошибка при создании связи",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Обновление связи ассистент-канал
  app.patch(
    "/api/assistants/:assistantId/channels/:channelId",
    authenticateToken,
    async (req, res) => {
      try {
        const assistantId = parseInt(req.params.assistantId);
        const channelId = parseInt(req.params.channelId);

        if (isNaN(assistantId) || isNaN(channelId)) {
          return res.status(400).json({ message: "Некорректные параметры" });
        }
        // Получаем связь ассистент-канал
        const assistantChannel =
          await storageInstance.getAssistantChannelByAssistantAndChannel(
            assistantId,
            channelId
          );
        if (!assistantChannel) {
          return res
            .status(404)
            .json({ message: "Связь ассистент-канал не найдена" });
        }

        // Проверяем, устанавливается ли ассистент по умолчанию
        if (req.body.isDefault) {
          // Сбрасываем флаг у других ассистентов этого канала
          const channelAssistants =
            await storageInstance.listAssistantChannelsByChannel(channelId);
          for (const ca of channelAssistants) {
            if (ca.id !== assistantChannel.id && ca.isDefault) {
              await storageInstance.updateAssistantChannel(ca.id, {
                isDefault: false,
              });
            }
          }
        }
        // Обновляем связь ассистент-канал
        const updatedAssistantChannel =
          await storageInstance.updateAssistantChannel(
            assistantChannel.id,
            req.body
          );
        // Получаем все диалоги для этого канала и ассистента
        const dialogAssistants =
          await storageInstance.listDialogAssistantsByChannel(channelId);
        // Обновляем auto_reply для всех диалогов
        for (const dialogAssistant of dialogAssistants) {
          await storageInstance.updateDialogAssistant(dialogAssistant.id, {
            autoReply:
              req.body.autoReply !== undefined
                ? req.body.autoReply
                : dialogAssistant.autoReply,
          });
        }

        // Обновляем ассистента для всех диалогов этого канала
        await updateAssistantForAllDialogs(
          channelId,
          assistantId,
          storageInstance
        );

        res.json(updatedAssistantChannel);
      } catch (error) {
        console.error("Ошибка при обновлении связи ассистент-канал:", error);
        res.status(500).json({
          message: "Ошибка при обновлении связи",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Удаление связи ассистент-канал
  app.delete(
    "/api/assistants/:assistantId/channels/:channelId",
    authenticateToken,
    async (req, res) => {
      try {
        const assistantId = parseInt(req.params.assistantId);
        const channelId = parseInt(req.params.channelId);

        if (isNaN(assistantId) || isNaN(channelId)) {
          return res.status(400).json({ message: "Некорректные параметры" });
        }

        // Получаем связь ассистент-канал
        const assistantChannel =
          await storageInstance.getAssistantChannelByAssistantAndChannel(
            assistantId,
            channelId
          );

        if (!assistantChannel) {
          return res
            .status(404)
            .json({ message: "Связь ассистент-канал не найдена" });
        }

        // Удаляем связь ассистент-канал
        await storageInstance.deleteAssistantChannel(assistantChannel.id);

        res.status(204).send();
      } catch (error) {
        console.error("Ошибка при удалении связи ассистент-канал:", error);
        res.status(500).json({
          message: "Ошибка при удалении связи",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Получение ассистента для канала
  // Получение информации о привязанных ассистентах к диалогам канала
  app.get(
    "/api/channels/:id/dialogs/assistants",
    authenticateToken,
    async (req, res) => {
      try {
        const channelId = parseInt(req.params.id);

        if (isNaN(channelId)) {
          return res.status(400).json({ message: "Некорректный ID канала" });
        }

        // Проверяем существование канала
        const channel = await storageInstance.getChannel(channelId);
        if (!channel) {
          return res.status(404).json({ message: "Канал не найден" });
        }

        // Получаем все настройки ассистентов для диалогов данного канала
        const dialogAssistants =
          await storageInstance.listDialogAssistantsByChannel(channelId);

        res.json(dialogAssistants);
      } catch (error) {
        console.error(
          "Ошибка при получении настроек ассистентов для диалогов:",
          error
        );
        res.status(500).json({
          message: "Ошибка при получении настроек ассистентов",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  app.get(
    "/api/channels/:id/conversation/:conversationId/messages",
    authenticateToken,
    async (req, res) => {
      try {
        const channelId = parseInt(req.params.id);
        const conversationId = parseInt(req.params.conversationId);

        if (isNaN(channelId) || isNaN(conversationId)) {
          return res.status(400).json({ message: "Некорректные параметры" });
        }

        // Получаем разговор по dialogId
        const conversation = await postgresStorage.getConversation(
          conversationId
        );

        if (!conversation) {
          return res.status(404).json({
            message: "Разговор не найден",
          });
        }

        if (conversation.channelId !== channelId) {
          return res.status(403).json({
            message: "Разговор не принадлежит указанному каналу",
          });
        }

        // Получаем сообщения для разговора
        const messages = await postgresStorage.listMessagesByConversation(
          conversation.id
        );

        res.json(messages);
      } catch (error) {
        console.log("Не удалось получить список сообщений для диалога", error);
        res.status(500).json({
          message: "Ошибка при получении списка сообщений",
        });
      }
    }
  );

  // Управление ассистентом для конкретного диалога
  app.post(
    "/api/channels/:id/dialogs/:dialogId/assistant",
    authenticateToken,
    async (req, res) => {
      try {
        const channelId = parseInt(req.params.id); // Number

        const dialogId = req.params.dialogId; // String
        const { enabled, assistantId, autoReply } = req.body;

        if (isNaN(channelId) || !dialogId) {
          return res.status(400).json({ message: "Некорректные параметры" });
        }

        // Проверяем существование канала
        const channel = await storageInstance.getChannel(channelId);
        if (!channel) {
          return res.status(404).json({ message: "Канал не найден" });
        }

        // Получаем настройки ассистента для канала
        const assistantChannels =
          await storageInstance.listAssistantChannelsByChannel(channelId);
        if (assistantChannels.length === 0) {
          return res
            .status(404)
            .json({ message: "Для канала не настроен ассистент" });
        }

        // Проверяем, существует ли уже связь между диалогом и ассистентом
        // dialogId может быть как числом, так и строкой, обеспечиваем совместимость
        const existingDialogAssistant =
          await storageInstance.getDialogAssistantByDialogAndChannel(
            String(dialogId),
            channelId
          );

        if (existingDialogAssistant) {
          // Обновляем существующую связь
          const updatedDialogAssistant =
            await storageInstance.updateDialogAssistant(
              existingDialogAssistant.id,
              {
                autoReply,
              }
            );
          res.json(updatedDialogAssistant);
        } else {
          // Если связи нет, создаем новую связь
          // Определяем какой assistantId использовать
          let actualAssistantId = assistantId;
          if (!actualAssistantId) {
            // Если assistantId не передан, используем первый доступный из настроек канала
            actualAssistantId = assistantChannels[0].assistantId;
          }

          // Проверяем существование ассистента
          const assistant = await storageInstance.getAssistant(
            actualAssistantId
          );
          if (!assistant) {
            return res.status(404).json({ message: "Ассистент не найден" });
          }

          // Создаем новую связь
          const newDialogAssistant =
            await storageInstance.createDialogAssistant({
              channelId,
              dialogId,
              assistantId: actualAssistantId,
              enabled: enabled !== undefined ? enabled : true,
              autoReply,
            });

          res.status(201).json(newDialogAssistant);
        }
      } catch (error) {
        console.error(
          "Ошибка при обновлении настроек ассистента для диалога:",
          error
        );
        res.status(500).json({
          message: "Ошибка при обновлении настроек",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Получение информации об ассистенте для конкретного диалога
  app.get(
    "/api/channels/:id/dialogs/:dialogId/assistant",
    authenticateToken,
    async (req, res) => {
      try {
        const channelId = parseInt(req.params.id);
        // В Avito диалоги могут иметь строковые ID, поэтому не преобразуем в число для всех случаев
        const dialogId = req.params.dialogId;

        if (isNaN(channelId) || !dialogId) {
          return res.status(400).json({ message: "Некорректные параметры" });
        }

        // Проверяем существование канала
        const channel = await storageInstance.getChannel(channelId);
        if (!channel) {
          return res.status(404).json({ message: "Канал не найден" });
        }

        // Получаем настройки ассистента для диалога
        // Убедимся, что dialogId передается как строка
        const dialogAssistant =
          await storageInstance.getDialogAssistantByDialogAndChannel(
            String(dialogId),
            channelId
          );

        if (!dialogAssistant) {
          // Если настроек нет, проверяем наличие общих настроек для канала
          const assistantChannels =
            await storageInstance.listAssistantChannelsByChannel(channelId);
          if (assistantChannels.length === 0) {
            return res.json(null);
          }

          // Возвращаем информацию о первом найденном ассистенте для канала
          // с флагом, что это не настройки конкретно для диалога
          return res.json({
            channelId,
            dialogId,
            assistantId: assistantChannels[0].assistantId,
            enabled: assistantChannels[0].enabled,
            autoReply: assistantChannels[0].autoReply,
            isChannelDefault: true,
          });
        }

        // Возвращаем настройки для диалога
        res.json({
          ...dialogAssistant,
          isChannelDefault: false,
        });
      } catch (error) {
        console.error("Ошибка при получении ассистента для диалога:", error);
        res.status(500).json({
          message: "Ошибка при получении ассистента",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Получение информации о привязанном ассистенте для канала
  app.get(
    "/api/channels/:id/assistant",
    authenticateToken,
    async (req, res) => {
      try {
        const channelId = parseInt(req.params.id);

        if (isNaN(channelId)) {
          return res.status(400).json({ message: "Некорректный ID канала" });
        }

        // Проверяем существование канала
        const channel = await storageInstance.getChannel(channelId);
        if (!channel) {
          return res.status(404).json({ message: "Канал не найден" });
        }

        // Получаем связи ассистент-канал
        const assistantChannels =
          await storageInstance.listAssistantChannelsByChannel(channelId);

        // Если связей нет, возвращаем null
        if (assistantChannels.length === 0) {
          return res.json(null);
        }

        // Возвращаем первую связь (обычно должна быть только одна)
        res.json(assistantChannels[0]);
      } catch (error) {
        console.error("Ошибка при получении ассистента для канала:", error);
        res.status(500).json({
          message: "Ошибка при получении ассистента",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Conversation routes
  app.get("/api/conversations", async (req, res) => {
    const channelId = req.query.channelId
      ? parseInt(req.query.channelId as string)
      : undefined;

    if (channelId) {
      if (isNaN(channelId)) {
        return res.status(400).json({ message: "Invalid channel ID" });
      }
      const conversations = await storageInstance.listConversationsByChannel(
        channelId
      );
      return res.json(conversations);
    }

    const conversations = await storageInstance.listConversations();
    res.json(conversations);
  });

  app.get("/api/conversations/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid conversation ID" });
    }

    const conversation = await storageInstance.getConversation(id);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    res.json(conversation);
  });

  app.post("/api/conversations", async (req, res) => {
    try {
      const conversationData = insertConversationSchema.parse(req.body);

      // Если указан assistantId, проверяем, что ассистент существует
      if (conversationData.assistantId) {
        const assistant = await storageInstance.getAssistant(
          conversationData.assistantId
        );
        if (!assistant) {
          return res.status(400).json({ message: "Assistant not found" });
        }

        // Если у ассистента есть OpenAI ID, создаем тред
        if (assistant.openaiAssistantId) {
          try {
            const thread = await openaiService.createThread();
            conversationData.threadId = thread.id;

            // Логируем активность создания треда
            await storageInstance.createActivityLog({
              userId: conversationData.userId || null,
              assistantId: conversationData.assistantId,
              action: "created_thread",
              details: { assistantName: assistant.name },
            });
          } catch (error) {
            console.error("Ошибка при создании треда в OpenAI", error);
            return res.status(500).json({
              message: "Failed to create thread in OpenAI",
              error:
                error instanceof Error
                  ? error instanceof Error
                    ? error.message
                    : String(error)
                  : String(error),
            });
          }
        }
      }

      const newConversation = await storageInstance.createConversation(
        conversationData
      );
      res.status(201).json(newConversation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid conversation data", errors: error.errors });
      }
      throw error;
    }
  });

  // Message routes
  app.get("/api/conversations/:id/messages", async (req, res) => {
    const conversationId = parseInt(req.params.id);
    if (isNaN(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation ID" });
    }

    const messages = await storageInstance.listMessagesByConversation(
      conversationId
    );

    // Сортируем сообщения по времени (от старых к новым для отображения)
    const sortedMessages = [...messages].sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeA - timeB;
    });

    res.json(sortedMessages);
  });

  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content, senderId } = req.body;

      // Проверяем существование разговора
      const conversation = await storageInstance.getConversation(
        conversationId
      );
      if (!conversation) {
        return res.status(404).json({
          error: "Разговор не найден",
        });
      }

      // объект для сохранения в таблицу сообщений
      const data = {
        conversationId,
        senderId: Number(senderId),
        senderType: "operator",
        content: String(content),
        timestamp: new Date().toISOString(),
        metadata: {
          userId: senderId,
          timestamp: new Date().toISOString(),
        } as object,
      };

      // Сохраняем сообщение
      const createdMessage = await postgresStorage.saveMessage(data);

      //списание сообщений при отправке
      // if (createdMessage) {
      //   const incrimentMessages = await postgresStorage.getMessageUsed(
      //     createdMessage.senderId
      //   );
      //   console.log(
      //     `[WRITEOFF] Для пользователя ${senderId} увеличили messagesUsed на 1. Текущее значение: `,
      //     incrimentMessages.messagesUsed
      //   );
      // }

      // Возвращаем успешный ответ с сообщением
      return res.status(200).json({
        message: "Сообщение отправлено",
      });
    } catch (error) {
      console.error("Ошибка при сохранении сообщения:", error);
      return res.status(500).json({
        error: "Внутренняя ошибка сервера",
      });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);

      // Получаем информацию о беседе
      const conversation = await storageInstance.getConversation(
        messageData.conversationId
      );
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      // Создаем сообщение в БД
      const newMessage = await storageInstance.createMessage(messageData);

      // Если это беседа с ассистентом и у нее есть threadId, отправляем сообщение в OpenAI
      if (conversation.assistantId && conversation.threadId) {
        const assistant = await storageInstance.getAssistant(
          conversation.assistantId
        );
        if (!assistant || !assistant.openaiAssistantId) {
          return res
            .status(404)
            .json({ message: "Assistant not found or not configured" });
        }

        try {
          // Отправляем сообщение в OpenAI
          await openaiService.sendMessage(
            conversation.threadId,
            messageData.content
          );

          // Запускаем ассистента для обработки сообщения
          const run = await openaiService.runAssistantV1(
            conversation.threadId,
            assistant.openaiAssistantId
          );

          // Логируем активность отправки сообщения ассистенту
          await storageInstance.createActivityLog({
            userId: messageData.senderId || null,
            assistantId: conversation.assistantId,
            action: "sent_message_to_assistant",
            details: {
              messageLength: messageData.content.length,
              runId: run.id,
            },
          });

          // Ждем, пока ассистент обработает сообщение
          let runStatus = await openaiService.getRunStatus(
            conversation.threadId,
            run.id
          );
          let attempts = 0;
          const maxAttempts = 60; // 60 секунд максимум

          while (
            (runStatus.status === "queued" ||
              runStatus.status === "in_progress") &&
            attempts < maxAttempts
          ) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            runStatus = await openaiService.getRunStatus(
              conversation.threadId,
              run.id
            );
            attempts++;
          }

          if (runStatus.status !== "completed") {
            return res.status(500).json({
              message: "Assistant processing timed out",
              status: runStatus.status,
              userMessage: newMessage,
            });
          }

          // Получаем ответы от ассистента
          const openaiMessages = await openaiService.getMessages(
            conversation.threadId
          );

          // Берем только сообщения от ассистента (т.е. не от пользователя)
          const assistantMessages = openaiMessages.filter(
            (msg: any) => msg.role === "assistant"
          );
          if (assistantMessages.length > 0) {
            // Берем последнее сообщение от ассистента
            const lastAssistantMessage = assistantMessages[0];

            // Создаем сообщение в БД от имени ассистента
            const assistantMessageContent =
              typeof lastAssistantMessage.content[0] === "object"
                ? lastAssistantMessage.content[0].type === "text"
                  ? lastAssistantMessage.content[0].text.value
                  : JSON.stringify(lastAssistantMessage.content)
                : String(lastAssistantMessage.content);

            const assistantMessage = await storageInstance.createMessage({
              conversationId: messageData.conversationId,
              content: assistantMessageContent,
              senderId: null, // Сообщение от ассистента
              senderType: "assistant",
              metadata: {
                openaiMessageId: lastAssistantMessage.id,
                threadId: conversation.threadId,
                runId: run.id,
              },
            });

            // Учитываем сообщение в ограничении тарифа для создателя канала
            await trackAssistantMessage(channel.id, storageInstance);

            // Добавляем сообщение ассистента в ответ
            return res.status(201).json({
              userMessage: newMessage,
              assistantMessage: assistantMessage,
            });
          }
        } catch (error) {
          console.error("Ошибка при обработке сообщения в OpenAI", error);
          // Возвращаем сообщение пользователя, но с информацией об ошибке
          return res.status(500).json({
            message: "Failed to process message with OpenAI",
            error:
              error instanceof Error
                ? error instanceof Error
                  ? error.message
                  : String(error)
                : String(error),
            userMessage: newMessage,
          });
        }
      }

      // Если это не беседа с ассистентом или произошла ошибка, возвращаем просто сообщение пользователя
      res.status(201).json(newMessage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid message data", errors: error.errors });
      }
      throw error;
    }
  });

  // Metrics routes
  app.get("/api/metrics", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      // Получаем существующие метрики
      let metrics = await storageInstance.getLatestMetrics(limit);

      // Если метрик нет или запрошено обновление, создаем новую метрику
      if (metrics.length === 0 || req.query.update === "true") {
        // Импортируем сервис метрик только при необходимости
        const { MetricsService } = await import("./services/metrics");
        const metricsService = new MetricsService(storageInstance);

        // Обновляем метрики
        await metricsService.updateSystemMetrics();

        // Получаем обновленные метрики
        metrics = await storageInstance.getLatestMetrics(limit);
      }

      // Проверка наличия метрик после обновления
      if (!metrics || metrics.length === 0) {
        console.log(
          "Метрики не найдены или не созданы. Отправляем пустой массив."
        );
        return res.json([]);
      }

      // Преобразуем время ответа из миллисекунд в секунды для более удобного отображения
      const formattedMetrics = metrics.map((metric) => ({
        ...metric,
        avgResponseTime: metric.avgResponseTime, // Оставляем в миллисекундах, преобразование будет на фронтенде
      }));

      res.json(formattedMetrics);
    } catch (error) {
      console.error("Ошибка при получении метрик:", error);
      res.status(500).json({ error: "Не удалось получить метрики" });
    }
  });

  // Маршрут для принудительного обновления метрик
  app.post("/api/metrics/update", async (req, res) => {
    try {
      console.log("Запущено обновление метрик...");

      // Очищаем кэш метрик перед обновлением (добавить эти строки)
      const { clearMetricsCache } = await import("./utils/metrics-calculator");
      clearMetricsCache();

      const { MetricsService } = await import("./services/metrics");
      const metricsService = new MetricsService(storageInstance);

      // Обновляем метрики системы
      await metricsService.updateSystemMetrics();
      console.log("Метрики системы успешно обновлены");

      res.json({
        success: true,
        message: "Metrics updated successfully",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating metrics:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update metrics",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Маршрут для получения метрик за указанный период
  app.get("/api/metrics/period", authenticateToken, async (req, res) => {
    const userId = req.user?.id;
    try {
      const period = (req.query.period as string) || "week";
      console.log(
        `[METRICS] ${new Date().toLocaleString()} Запрошены метрики пользователя ${userId} за период: ${period}`
      );

      const { MetricsService } = await import("./services/metrics");
      const metricsService = new MetricsService(storageInstance);

      // Получаем метрики за указанный период
      const metrics = await metricsService.getMetricsForPeriod(
        period,
        String(userId)
      );

      res.json(metrics);
    } catch (error) {
      console.error("Ошибка при получении метрик за период:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get metrics for period",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Получение статистики активных диалогов с различной детализацией в зависимости от выбранного периода
  app.get(
    "/api/metrics/active-dialogs",
    authenticateToken,
    async (req, res) => {
      const userId = req.user?.id;
      try {
        const period = (req.query.period as string) || "week";

        console.log(
          `[METRICS DIALOGS] ${new Date().toLocaleString()} Загрузка данных активных диалогов за период: ${period}${
            userId ? ` для пользователя ${userId}` : ""
          }`
        );

        // Получаем все разговоры с учетом даты
        let conversations = await storageInstance.listConversations();

        // Фильтруем по пользователю, если указан userId
        if (userId) {
          conversations = conversations.filter(
            (conv) => conv.createdBy === userId
          );
          console.log(
            `[METRICS DIALOGS] ${new Date().toLocaleString()} Отфильтровано ${
              conversations.length
            } диалогов для пользователя ${userId}`
          );
        }

        // Получаем сообщения для каждого разговора
        const messagesPromises = conversations.map((conv) =>
          storageInstance.listMessagesByConversation(conv.id)
        );

        // Используем Promise.allSettled вместо Promise.all для более устойчивой обработки ошибок
        const messagesResults = await Promise.allSettled(messagesPromises);
        const messages = messagesResults.map((result, index) => {
          if (result.status === "fulfilled") {
            return result.value;
          } else {
            console.error(
              `Ошибка при получении сообщений для разговора ${conversations[index].id}:`,
              result.reason
            );
            return [];
          }
        });

        // Определяем интервал и начальную дату для периода
        let startDate = new Date();
        let interval = 7; // По умолчанию неделя (7 дней)
        let groupBy = "day"; // Тип группировки: hour, day, week, month

        switch (period) {
          case "day":
            startDate.setDate(startDate.getDate() - 1);
            interval = 24; // 24 часа
            groupBy = "hour";
            break;
          case "week":
            startDate.setDate(startDate.getDate() - 7);
            interval = 7; // 7 дней
            groupBy = "day";
            break;
          case "month":
            startDate.setMonth(startDate.getMonth() - 1);
            interval = 4; // 4 недели
            groupBy = "week";
            break;
          case "year":
            startDate.setFullYear(startDate.getFullYear() - 1);
            interval = 12; // 12 месяцев
            groupBy = "month";
            break;
          default:
            startDate.setDate(startDate.getDate() - 7);
        }

        // Создаем хэш-карту для группировки данных
        const groupMap: Record<string, number> = {};

        // Заполняем все интервалы нулями
        if (groupBy === "hour") {
          // Для часов в течение дня
          for (let i = 0; i < interval; i++) {
            const date = new Date();
            date.setHours(date.getHours() - i);
            // Используем более стабильный и сортируемый формат: 01:00, 02:00 и т.д.
            const hour = date.getHours().toString().padStart(2, "0");
            const hourKey = `${hour}:00`;
            groupMap[hourKey] = 0;
          }
        } else if (groupBy === "day") {
          // Для дней недели
          for (let i = 0; i < interval; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split("T")[0];
            groupMap[dateKey] = 0;
          }
        } else if (groupBy === "week") {
          // Для недель месяца
          for (let i = 0; i < interval; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i * 7);
            const weekNumber = Math.ceil(
              (date.getDate() +
                new Date(date.getFullYear(), date.getMonth(), 1).getDay()) /
                7
            );
            const dateKey = `${date.getFullYear()}-${(date.getMonth() + 1)
              .toString()
              .padStart(2, "0")}-W${weekNumber}`;
            groupMap[dateKey] = 0;
          }
        } else if (groupBy === "month") {
          // Для месяцев года
          for (let i = 0; i < interval; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const dateKey = `${date.getFullYear()}-${(date.getMonth() + 1)
              .toString()
              .padStart(2, "0")}`;
            groupMap[dateKey] = 0;
          }
        }

        // Подсчитываем активные диалоги с учетом выбранной группировки
        let activeDialogCount = 0;
        conversations.forEach((conversation, idx) => {
          const conversationMessages = messages[idx];

          if (conversationMessages && conversationMessages.length > 0) {
            // Проверяем наличие сообщений за указанный период
            const hasMessagesInPeriod = conversationMessages.some((msg) => {
              const messageDate = new Date(msg.timestamp);
              return messageDate >= startDate;
            });

            if (hasMessagesInPeriod) {
              activeDialogCount++;

              // Создаем карту для отслеживания уникальных периодов для диалога
              const periodMap = new Map<string, boolean>();

              // Находим все сообщения для этого диалога в указанном периоде
              const messagesInPeriod = conversationMessages.filter((msg) => {
                const messageDate = new Date(msg.timestamp);
                return messageDate >= startDate;
              });

              // Группируем сообщения по нужному параметру
              messagesInPeriod.forEach((message) => {
                const messageDate = new Date(message.timestamp);
                let groupKey = "";

                if (groupBy === "hour") {
                  // Используем тот же формат с ведущим нулем для часов
                  const hour = messageDate
                    .getHours()
                    .toString()
                    .padStart(2, "0");
                  groupKey = `${hour}:00`;
                } else if (groupBy === "day") {
                  groupKey = messageDate.toISOString().split("T")[0];
                } else if (groupBy === "week") {
                  const weekNumber = Math.ceil(
                    (messageDate.getDate() +
                      new Date(
                        messageDate.getFullYear(),
                        messageDate.getMonth(),
                        1
                      ).getDay()) /
                      7
                  );
                  groupKey = `${messageDate.getFullYear()}-${(
                    messageDate.getMonth() + 1
                  )
                    .toString()
                    .padStart(2, "0")}-W${weekNumber}`;
                } else if (groupBy === "month") {
                  groupKey = `${messageDate.getFullYear()}-${(
                    messageDate.getMonth() + 1
                  )
                    .toString()
                    .padStart(2, "0")}`;
                }

                // Увеличиваем счетчик только если этот период еще не учтен для данного диалога
                if (
                  groupMap[groupKey] !== undefined &&
                  !periodMap.has(groupKey)
                ) {
                  groupMap[groupKey]++;
                  periodMap.set(groupKey, true);
                }
              });
            }
          }
        });

        console.log(
          `[METRICS DIALOGS] ${new Date().toLocaleString()} Найдено ${activeDialogCount} активных диалогов за указанный период${
            userId ? ` для пользователя ${userId}` : ""
          }`
        );

        // Преобразуем в формат для фронтенда и сортируем в зависимости от типа группировки
        let result = Object.entries(groupMap).map(([date, count]) => ({
          date,
          count,
        }));

        // Сортировка по дате/времени
        if (groupBy === "hour") {
          // Сортировка по часам
          result.sort((a, b) => {
            const hourA = parseInt(a.date.split(":")[0]);
            const hourB = parseInt(b.date.split(":")[0]);
            return hourA - hourB;
          });
        } else if (groupBy === "week") {
          // Сортировка по номеру недели
          result.sort((a, b) => {
            const weekNumberA = parseInt(a.date.split("-W")[1] || "0");
            const weekNumberB = parseInt(b.date.split("-W")[1] || "0");
            return weekNumberA - weekNumberB;
          });
        } else {
          // Сортировка по дате
          result.sort((a, b) => a.date.localeCompare(b.date));
        }

        res.json(result);
      } catch (error) {
        console.error("Failed to fetch active dialogs metrics:", error);
        res
          .status(500)
          .json({ error: "Failed to fetch active dialogs metrics" });
      }
    }
  );

  // Activity logs routes
  app.get("/api/activity", authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const logs = await storageInstance.listRecentActivityLogs(limit, userId);
    res.json(logs);
  });

  // Extended user routes for referral system
  app.get("/api/users/role/:role", async (req, res) => {
    const role = req.params.role;
    const users = await storageInstance.listUsersByRole(role);
    res.json(users);
  });

  app.get("/api/users/referrer/:referrerId", async (req, res) => {
    const referrerId = parseInt(req.params.referrerId);
    if (isNaN(referrerId)) {
      return res.status(400).json({ message: "Invalid referrer ID" });
    }
    const users = await storageInstance.listUsersByReferrer(referrerId);
    res.json(users);
  });

  app.get("/api/users/manager/:managerId", async (req, res) => {
    const managerId = parseInt(req.params.managerId);
    if (isNaN(managerId)) {
      return res.status(400).json({ message: "Invalid manager ID" });
    }
    const users = await storageInstance.listUsersByManager(managerId);
    res.json(users);
  });

  // Маршрут для обновления менеджера пользователя
  app.put("/api/users/:id/manager", authenticateToken, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res
          .status(400)
          .json({ message: "Некорректный ID пользователя" });
      }

      // Проверяем тело запроса
      const { managerId } = req.body;

      // Разрешаем managerId быть null (убрать менеджера)
      if (
        managerId !== null &&
        managerId !== undefined &&
        (isNaN(managerId) || managerId < 0)
      ) {
        return res.status(400).json({ message: "Некорректный ID менеджера" });
      }

      // Проверяем существование пользователя
      const user = await storageInstance.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      // Проверяем права доступа:
      // - Администратор может менять менеджера для любого пользователя
      // - Менеджер может назначать/убирать себя как менеджера для пользователя
      // - Реферрер может менять менеджера своим рефералам
      const isAdmin = req.user.role === "admin";
      const isManager = req.user.role === "manager";
      const isCurrentManager = user.managerId === req.user.id;
      const isBecomingManager = managerId === req.user.id;
      const isReferrer = user.referrerId === req.user.id; // Проверяем, является ли текущий пользователь реферером для целевого пользователя

      console.log(
        `[TEAM] Проверка прав: isAdmin=${isAdmin}, isManager=${isManager}, isCurrentManager=${isCurrentManager}, isBecomingManager=${isBecomingManager}, isReferrer=${isReferrer}`
      );

      // Пользователь может изменить менеджера, если:
      // 1. Он администратор, или
      // 2. Он менеджер и (текущий менеджер или становится менеджером), или
      // 3. Он реферрер этого пользователя

      const hasPermission =
        isAdmin || // Администратор всегда может менять менеджера
        (isManager && (isCurrentManager || isBecomingManager)) || // Менеджер с условиями
        isReferrer; // Реферер всегда может менять менеджера своих рефералов

      if (!hasPermission) {
        return res.status(403).json({
          message: "У вас нет прав для изменения менеджера этого пользователя",
        });
      }

      // Если новый менеджер указан, проверяем его существование и роль
      if (managerId !== null) {
        const manager = await storageInstance.getUser(managerId);
        if (!manager) {
          return res.status(404).json({ message: "Менеджер не найден" });
        }

        // Разрешаем реферреру назначить себя менеджером, даже если он не имеет роли менеджера
        const isUserBecomingManagerForOwnReferral =
          isReferrer && managerId === req.user.id;

        if (
          manager.role !== "manager" &&
          !isUserBecomingManagerForOwnReferral
        ) {
          return res.status(400).json({
            message: "Указанный пользователь не является менеджером",
          });
        }
      }

      // Обновляем менеджера пользователя
      const updatedUser = await storageInstance.updateUser(userId, {
        managerId: managerId === null ? null : managerId,
      });

      // Логируем активность
      await storageInstance.createActivityLog({
        userId: req.user.id,
        action: managerId ? "assign_manager" : "remove_manager",
        details: {
          userId,
          managerId,
          previousManagerId: user.managerId,
        },
      });

      return res.json({
        success: true,
        user: updatedUser,
      });
    } catch (error) {
      console.error("Ошибка при обновлении менеджера пользователя:", error);
      return res.status(500).json({ message: "Внутренняя ошибка сервера" });
    }
  });

  app.put("/api/users/:id", authenticateToken, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    try {
      // Получаем текущие данные пользователя для сравнения
      const currentUser = await storageInstance.getUser(id);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const userData = insertUserSchema.partial().parse(req.body);
      const updatedUser = await storageInstance.updateUser(id, userData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Проверяем, изменился ли тариф
      if (userData.plan && userData.plan !== currentUser.plan && req.user) {
        // Импортируем логгер
        const { planChangeLogger } = await import(
          "./services/plan-change-logger.js"
        );

        // Инициализируем логгер (создаем файл если нужно)
        await planChangeLogger.ensureLogFileExists();

        // Логируем изменение тарифа
        await planChangeLogger.logPlanChange({
          timestamp: new Date(),
          changedBy: {
            id: req.user.id,
            email: req.user.email,
            name: req.user.name || undefined,
          },
          targetUser: {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name || undefined,
          },
          oldPlan: currentUser.plan,
          newPlan: userData.plan,
        });

        // Также сохраняем в активити лог
        await storageInstance.createActivityLog({
          userId: req.user.id,
          action: "plan_changed",
          details: {
            targetUserId: id,
            targetUserEmail: updatedUser.email,
            oldPlan: currentUser.plan,
            newPlan: userData.plan,
          },
        });
      }

      res.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid user data", errors: error.errors });
      }

      // Возвращаем текст ошибки в формате JSON
      return res.status(400).json({ message: (error as Error).message });
    }
  });

  //Заготовка для удаления пользователя (если баланс больше нуля - запертить удаление)
  app.delete("/api/users/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Не корректное ID пользователя" });
    }
    try {
      // ЗДЕСЬ ПОИСК И УДАЛЕНИЕ
    } catch {}
  });

  // Referral Transactions routes
  app.get("/api/transactions", async (req, res) => {
    const transactions = await storageInstance.listReferralTransactions();
    res.json(transactions);
  });

  app.get("/api/transactions/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid transaction ID" });
    }

    const transaction = await storageInstance.getReferralTransaction(id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json(transaction);
  });

  app.get("/api/transactions/user/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const transactions = await storageInstance.listReferralTransactionsByUser(
      userId
    );
    res.json(transactions);
  });

  app.get("/api/transactions/referrer/:referrerId", async (req, res) => {
    const referrerId = parseInt(req.params.referrerId);
    if (isNaN(referrerId)) {
      return res.status(400).json({ message: "Invalid referrer ID" });
    }
    const transactions =
      await storageInstance.listReferralTransactionsByReferrer(referrerId);
    res.json(transactions);
  });

  app.get("/api/transactions/manager/:managerId", async (req, res) => {
    const managerId = parseInt(req.params.managerId);
    if (isNaN(managerId)) {
      return res.status(400).json({ message: "Invalid manager ID" });
    }
    const transactions =
      await storageInstance.listReferralTransactionsByManager(managerId);
    res.json(transactions);
  });

  app.get("/api/commission/:userId/:role", async (req, res) => {
    const userId = parseInt(req.params.userId);
    const role = req.params.role as "referrer" | "manager";

    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (role !== "referrer" && role !== "manager") {
      return res
        .status(400)
        .json({ message: "Invalid role, must be 'referrer' or 'manager'" });
    }

    const totalCommission = await storageInstance.calculateTotalCommission(
      userId,
      role
    );
    res.json({ userId, role, totalCommission });
  });

  // Роут для проверки статуса подключения к OpenAI
  app.get("/api/openai/status", async (req, res) => {
    try {
      const models = await openaiService.listModels();
      res.json({
        status: "connected",
        models: models.slice(0, 10), // Возвращаем только первые 10 моделей
      });
    } catch (error) {
      console.error("Ошибка при проверке подключения к OpenAI", error);
      res.status(500).json({
        status: "error",
        message: "Не удалось подключиться к OpenAI API",
        error:
          error instanceof Error
            ? error instanceof Error
              ? error.message
              : String(error)
            : String(error),
      });
    }
  });

  // Роуты для работы с тредами и генерацией ответов от ассистентов
  app.post("/api/threads", async (req, res) => {
    try {
      const thread = await openaiService.createThread();
      res.json({
        threadId: thread.id,
        success: true,
      });
    } catch (error) {
      console.error("Ошибка при создании треда:", error);
      res.status(500).json({
        success: false,
        message: "Не удалось создать тред",
        error:
          error instanceof Error
            ? error instanceof Error
              ? error.message
              : String(error)
            : String(error),
      });
    }
  });

  app.post("/api/generate", async (req, res) => {
    try {
      const { message, threadId, assistantId } = req.body;

      console.log("Получен запрос на генерацию ответа:", {
        message:
          message?.substring(0, 50) + (message?.length > 50 ? "..." : ""),
        threadId,
        assistantId,
      });

      // Примечание: Удалена прямая обработка сообщений пользователя с использованием регулярных выражений
      // Вместо этого используем встроенный механизм OpenAI функций через FunctionHandler.processFunctionCalls

      if (!message || !threadId || !assistantId) {
        return res.status(400).json({
          success: false,
          message:
            "Отсутствуют обязательные параметры (message, threadId, assistantId)",
        });
      }

      console.log("Отправляем сообщение пользователя в тред...");

      // Отправляем сообщение в тред
      await openaiService.sendMessage(threadId, message);

      console.log("Запускаем ассистента для генерации ответа...");

      // Запускаем ассистента для генерации ответа
      const run = await openaiService.runAssistantV1(threadId, assistantId);

      // Ждем результатов
      console.log("Ждем результаты запроса от OpenAI...");
      let runStatus = await openaiService.getRunStatus(threadId, run.id);
      let attempts = 0;
      const maxAttempts = 30; // 30 секунд максимум

      while (
        (runStatus.status === "queued" || runStatus.status === "in_progress") &&
        attempts < maxAttempts
      ) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        runStatus = await openaiService.getRunStatus(threadId, run.id);
        console.log(
          `Статус запроса [${attempts + 1}/${maxAttempts}]: ${runStatus.status}`
        );
        attempts++;
      }

      if (runStatus.status === "requires_action") {
        console.log("\n=== REQUIRES_ACTION: ВЫЗОВ ФУНКЦИЙ ===");
        console.log("Ассистент требует выполнения функции, обрабатываем...");
        console.log(
          "Полный статус запроса:",
          JSON.stringify(runStatus, null, 2)
        );

        // Проверяем, есть ли запрос на выполнение функции
        if (
          runStatus.required_action &&
          runStatus.required_action.type === "submit_tool_outputs" &&
          runStatus.required_action.submit_tool_outputs &&
          runStatus.required_action.submit_tool_outputs.tool_calls
        ) {
          const toolCalls =
            runStatus.required_action?.submit_tool_outputs?.tool_calls || [];
          console.log(
            `\n=== ПОЛУЧЕНО ${toolCalls.length} ЗАПРОСОВ НА ВЫПОЛНЕНИЕ ФУНКЦИЙ ===`
          );

          // Выводим подробную информацию о каждом вызове функции
          toolCalls.forEach((tool: ToolCall, index: number) => {
            console.log(`\n[Функция ${index + 1}]`);
            console.log(`ID вызова: ${tool.id}`);
            console.log(`Имя функции: ${tool.function?.name}`);

            try {
              // Пытаемся разобрать и красиво вывести аргументы
              const argsRaw = tool.function?.arguments || "{}";
              console.log(`Аргументы (raw): ${argsRaw}`);

              const args = JSON.parse(argsRaw);
              console.log(
                `Аргументы (parsed): ${JSON.stringify(args, null, 2)}`
              );

              // Сохраняем информацию о вызове в активности
              storageInstance
                .createActivityLog({
                  userId: null,
                  assistantId: null, // Здесь нужен числовой ID, который получаем позже
                  action: "function_called",
                  details: {
                    functionName: tool.function?.name,
                    arguments: args,
                    toolCallId: tool.id,
                  },
                })
                .catch((e) =>
                  console.error("Ошибка при логировании вызова функции:", e)
                );
            } catch (e) {
              console.error(`Ошибка при разборе аргументов функции: ${e}`);
            }
          });

          // Используем OpenAIFunctionProcessor для обработки вызовов функций
          console.log("Используем процессор функций для обработки вызовов...");

          // Динамически импортируем OpenAIFunctionProcessor с помощью ESM import
          const { OpenAIFunctionProcessor } = await import(
            "./services/openai-function-processor.js"
          );
          const functionProcessor = new OpenAIFunctionProcessor(
            storageInstance
          );

          // Обрабатываем вызовы функций и получаем результаты
          let toolOutputs;
          try {
            toolOutputs = await functionProcessor.processFunctionCalls(
              assistantId,
              toolCalls
            );
            console.log(
              `Получены результаты обработки ${toolOutputs.length} функций`
            );

            // Модифицируем результаты, чтобы ассистент не писал о них в чате
            toolOutputs = toolOutputs.map((output) => {
              try {
                // Попытка распарсить уже существующий результат
                const parsedOutput = JSON.parse(output.output);

                // Создаем новый результат, который не будет отображаться в чате
                return {
                  tool_call_id: output.tool_call_id,
                  output: JSON.stringify({
                    ...parsedOutput,
                    // Добавляем флаг, чтобы указать, что ответ уже был отправлен в нотификацию
                    // Это подсказка для ассистента не включать информацию о результате в сообщение
                    notification_sent: true,
                    message: parsedOutput.success
                      ? "Данные успешно отправлены"
                      : "Произошла ошибка при отправке данных",
                  }),
                };
              } catch (e) {
                // Если не удалось распарсить, оставляем как есть
                return output;
              }
            });
          } catch (processorError) {
            console.error("Ошибка при обработке функций:", processorError);

            // В случае ошибки создаем заглушки ответов
            toolOutputs = toolCalls.map((tool: ToolCall) => {
              const errorOutput = {
                success: false,
                error:
                  processorError instanceof Error
                    ? processorError.message
                    : "Неизвестная ошибка",
                message: `Ошибка при обработке функции ${tool.function?.name}`,
                notification_sent: true, // Добавляем этот флаг чтобы ассистент не сообщал об ошибке в чате
              };

              return {
                tool_call_id: tool.id,
                output: JSON.stringify(errorOutput),
              };
            });
          }

          // Отправляем результаты выполнения функций
          console.log("\n=== ОТПРАВКА РЕЗУЛЬТАТОВ ФУНКЦИЙ В OPENAI ===");
          console.log(
            "Подготовленные ответы:",
            JSON.stringify(toolOutputs, null, 2)
          );

          const submitResponse = await openaiService.submitToolOutputs(
            threadId,
            run.id,
            toolOutputs
          );
          console.log("\n=== ОТВЕТ НА ОТПРАВКУ РЕЗУЛЬТАТОВ ===");
          console.log(JSON.stringify(submitResponse, null, 2));

          // Ждем завершения запроса после выполнения функций
          attempts = 0;
          while (
            runStatus.status !== "completed" &&
            runStatus.status !== "failed" &&
            attempts < maxAttempts
          ) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            runStatus = await openaiService.getRunStatus(threadId, run.id);
            console.log(
              `Статус запроса после выполнения функций [${
                attempts + 1
              }/${maxAttempts}]: ${runStatus.status}`
            );
            attempts++;
          }
        }
      }

      if (runStatus.status !== "completed") {
        console.error(`Запрос не был завершен. Статус: ${runStatus.status}`);
        throw new Error(`Запрос не был завершен. Статус: ${runStatus.status}`);
      }

      // Получаем сообщения
      console.log("Получаем сообщения из треда...");
      const messages = await openaiService.getMessages(threadId);
      console.log(`Получено ${messages.length} сообщений`);

      // Обрабатываем ответ ассистента для извлечения вызовов функций OpenAI
      if (messages.length > 0 && messages[0].role === "assistant") {
        console.log("Успешно получен ответ от ассистента");

        try {
          // Импортируем OpenAIFunctionProcessor для обработки ответа ассистента
          const { OpenAIFunctionProcessor } = await import(
            "./services/openai-function-processor.js"
          );
          const functionProcessor = new OpenAIFunctionProcessor(
            storageInstance
          );

          // Получаем числовой ID ассистента из базы данных
          const assistantData = await storageInstance.getAssistantByOpenAIId(
            assistantId
          );
          if (assistantData) {
            console.log(
              `Найден ассистент в БД: ID=${assistantData.id}, Name=${assistantData.name}`
            );

            // Текст сообщения пользователя для поиска данных
            console.log(`Исходное сообщение пользователя: "${message}"`);

            // Безопасно логируем структуру сообщения для отладки
            try {
              const messagePreview = JSON.stringify(
                messages[0],
                (key, value) => {
                  if (typeof value === "string" && value.length > 100)
                    return value.substring(0, 100) + "...";
                  return value;
                },
                2
              ).substring(0, 300);
              console.log(`Структура сообщения (частичная): ${messagePreview}`);

              // Проверяем наличие tool_calls в сообщении
              if (
                messages[0].content &&
                Array.isArray(messages[0].tool_calls) &&
                messages[0].tool_calls.length > 0
              ) {
                console.log(
                  `Обнаружено ${messages[0].tool_calls.length} вызовов функций в сообщении`
                );

                // Асинхронно обрабатываем вызовы функций, не дожидаясь завершения
                (async () => {
                  try {
                    // Обрабатываем вызовы функций
                    const toolOutputs =
                      await functionProcessor.processFunctionCalls(
                        assistantId,
                        messages[0].tool_calls
                      );
                    console.log("Вызовы функций обработаны успешно");

                    // Хотя мы не отправляем ответы обратно в OpenAI (поскольку это асинхронная обработка),
                    // все равно логируем результаты для отладки
                    const modifiedResults = toolOutputs.map((output) => {
                      try {
                        const parsedOutput = JSON.parse(output.output);
                        return {
                          ...output,
                          output: JSON.stringify({
                            ...parsedOutput,
                            notification_sent: true,
                            message: parsedOutput.success
                              ? "Данные успешно отправлены"
                              : "Произошла ошибка при отправке данных",
                          }),
                        };
                      } catch (e) {
                        return output;
                      }
                    });

                    console.log(
                      `Результаты обработки функций:`,
                      JSON.stringify(modifiedResults, null, 2)
                    );
                  } catch (fcError) {
                    console.error(
                      "Ошибка при обработке вызовов функций:",
                      fcError
                    );
                  }
                })().catch((err) =>
                  console.error("Ошибка при запуске обработки функций:", err)
                );
              } else {
                console.log("В сообщении не обнаружено вызовов функций");
              }
            } catch (logError) {
              console.log(
                `Не удалось проанализировать структуру сообщения:`,
                logError
              );
            }
          } else {
            console.error(
              `Не удалось найти ассистента с OpenAI ID ${assistantId} в базе данных`
            );
          }
        } catch (functionError) {
          console.error(
            "Ошибка при инициализации обработчика функций:",
            functionError
          );
          // Продолжаем выполнение, чтобы пользователь получил ответ в любом случае
        }

        return res.json(messages[0]);
      }

      throw new Error("Не удалось получить ответ от ассистента");
    } catch (error) {
      console.error("Ошибка при генерации ответа:", error);
      res.status(500).json({
        success: false,
        message: "Не удалось сгенерировать ответ",
        error:
          error instanceof Error
            ? error instanceof Error
              ? error.message
              : String(error)
            : String(error),
      });
    }
  });

  // Маршрут для тестирования ассистента
  app.post("/api/assistants/:id/test", async (req, res) => {
    try {
      const assistantId = parseInt(req.params.id);
      const { message } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ message: "Сообщение обязательно" });
      }

      // Получаем данные ассистента из хранилища
      const assistant = await storageInstance.getAssistant(assistantId);
      if (!assistant) {
        return res.status(404).json({ message: "Ассистент не найден" });
      }

      // Проверяем, есть ли у ассистента ID в OpenAI
      if (!assistant.openaiAssistantId) {
        return res
          .status(400)
          .json({ message: "Ассистент не синхронизирован с OpenAI" });
      }

      // Сначала проверяем наличие сохранённого исправления для этого сообщения
      const correctedResponse =
        await assistantTrainingService.findCorrectedResponse(
          assistantId,
          message
        );

      if (correctedResponse) {
        console.log(
          `[ТЕСТИРОВАНИЕ] Найдено сохранённое исправление для запроса: ${message}`
        );
        // Возвращаем сохранённое исправление без обращения к OpenAI
        return res.json({
          reply: correctedResponse,
          fromSavedCorrection: true, // Флаг для фронтенда, что ответ из сохранённых исправлений
        });
      }

      // Если исправления нет, отправляем запрос к OpenAI
      console.log(
        `[ТЕСТИРОВАНИЕ] Исправление не найдено, отправляем запрос в OpenAI`
      );
      const reply = await openaiService.testAssistant(
        assistant.openaiAssistantId,
        message
      );

      // Отправляем ответ клиенту
      return res.json({
        reply,
        fromSavedCorrection: false, // Флаг для фронтенда, что ответ от OpenAI
      });
    } catch (error) {
      console.error("Error testing assistant:", error);
      return res.status(500).json({
        message: "Не удалось выполнить тестирование ассистента",
        error:
          error instanceof Error
            ? error instanceof Error
              ? error.message
              : String(error)
            : String(error),
      });
    }
  });

  // Маршрут для получения всех исправлений для ассистента
  app.get("/api/assistants/:id/corrections", async (req, res) => {
    try {
      const assistantId = parseInt(req.params.id);

      // Получаем данные ассистента из хранилища
      const assistant = await storageInstance.getAssistant(assistantId);
      if (!assistant) {
        return res.status(404).json({ message: "Ассистент не найден" });
      }

      // Проверяем, есть ли у ассистента ID в OpenAI
      if (!assistant.openaiAssistantId) {
        return res
          .status(400)
          .json({ message: "Ассистент не синхронизирован с OpenAI" });
      }

      // Получаем все исправления для этого ассистента
      const corrections = await openaiService.getTrainingCorrections(
        assistant.openaiAssistantId
      );

      return res.json({ corrections });
    } catch (error) {
      console.error("Error getting assistant corrections:", error);
      return res.status(500).json({
        message: "Не удалось получить исправления",
        error:
          error instanceof Error
            ? error instanceof Error
              ? error.message
              : String(error)
            : String(error),
      });
    }
  });

  // Testimonials routes (Отзывы)
  app.get("/api/testimonials", async (req, res) => {
    try {
      // Query-параметр status для фильтрации по статусу
      const status = req.query.status as string;

      let testimonials;
      if (status === "approved") {
        testimonials = await storageInstance.listApprovedTestimonials();
      } else {
        testimonials = await storageInstance.listTestimonials();
      }

      res.json(testimonials);
    } catch (error) {
      console.error("Ошибка при получении отзывов:", error);
      res.status(500).json({ message: "Failed to get testimonials" });
    }
  });

  app.get("/api/testimonials/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid testimonial ID" });
      }

      const testimonial = await storageInstance.getTestimonial(id);
      if (!testimonial) {
        return res.status(404).json({ message: "Testimonial not found" });
      }

      res.json(testimonial);
    } catch (error) {
      console.error("Ошибка при получении отзыва:", error);
      res.status(500).json({ message: "Failed to get testimonial" });
    }
  });

  app.get(
    "/api/users/:userId/testimonials",
    authenticateToken,
    async (req, res) => {
      try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
          return res.status(400).json({ message: "Invalid user ID" });
        }

        // Проверка прав доступа - пользователь может просматривать только свои отзывы или админ может просматривать любые
        if (req.user?.id !== userId && req.user?.role !== "admin") {
          return res
            .status(403)
            .json({ message: "Unauthorized access to user testimonials" });
        }

        const testimonials = await storageInstance.listTestimonialsByUser(
          userId
        );
        res.json(testimonials);
      } catch (error) {
        console.error("Ошибка при получении отзывов пользователя:", error);
        res.status(500).json({ message: "Failed to get user testimonials" });
      }
    }
  );

  app.post("/api/testimonials", authenticateToken, async (req, res) => {
    try {
      const testimonialData = insertTestimonialSchema.parse({
        ...req.body,
        userId: req.user?.id, // Используем ID текущего пользователя
      });

      // Если пользователь не админ, устанавливаем статус "pending"
      if (req.user?.role !== "admin" && testimonialData.status !== "pending") {
        testimonialData.status = "pending";
      }

      const newTestimonial = await storageInstance.createTestimonial(
        testimonialData
      );

      // Логируем активность создания отзыва
      await storageInstance.createActivityLog({
        userId: req.user?.id,
        action: "created_testimonial",
        details: { id: newTestimonial.id },
      });

      res.status(201).json(newTestimonial);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid testimonial data", errors: error.errors });
      }
      console.error("Ошибка при создании отзыва:", error);
      res.status(500).json({ message: "Failed to create testimonial" });
    }
  });

  app.put("/api/testimonials/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid testimonial ID" });
      }

      // Получаем текущий отзыв
      const testimonial = await storageInstance.getTestimonial(id);
      if (!testimonial) {
        return res.status(404).json({ message: "Testimonial not found" });
      }

      // Проверка прав доступа - пользователь может редактировать только свои отзывы
      // или админ может менять статус любого отзыва
      const isOwner = testimonial.userId === req.user?.id;
      const isAdmin = req.user?.role === "admin";

      if (!isOwner && !isAdmin) {
        return res
          .status(403)
          .json({ message: "Unauthorized update of testimonial" });
      }

      let testimonialData;

      if (isAdmin) {
        // Админ может обновлять всё, включая статус
        testimonialData = insertTestimonialSchema.partial().parse(req.body);
      } else {
        // Владелец отзыва может обновлять только содержимое, но не статус
        const { status, ...allowedUpdates } = req.body;
        testimonialData = insertTestimonialSchema
          .partial()
          .parse(allowedUpdates);

        // Устанавливаем статус "pending" после редактирования
        testimonialData.status = "pending";
      }

      const updatedTestimonial = await storageInstance.updateTestimonial(
        id,
        testimonialData
      );

      // Логируем активность обновления отзыва
      await storageInstance.createActivityLog({
        userId: req.user?.id,
        action:
          isAdmin && req.body.status
            ? "updated_testimonial_status"
            : "updated_testimonial",
        details: { id, status: updatedTestimonial?.status },
      });

      res.json(updatedTestimonial);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid testimonial data", errors: error.errors });
      }
      console.error("Ошибка при обновлении отзыва:", error);
      res.status(500).json({ message: "Failed to update testimonial" });
    }
  });

  // Функция для получения оптимального URL изображения из вложения
  function getImageUrlFromAttachment(attachment: any): string | null {
    if (!attachment || attachment.type !== "photo" || !attachment.photo) {
      return null;
    }

    // Если есть orig_photo, используем его URL
    if (attachment.photo.orig_photo) {
      return attachment.photo.orig_photo.url;
    }

    // Если есть sizes, находим оптимальный размер
    if (attachment.photo.sizes && attachment.photo.sizes.length > 0) {
      // Сортируем размеры по убыванию и берем самый большой, но не больше 800px по ширине
      const sortedSizes = [...attachment.photo.sizes].sort(
        (a, b) => b.width - a.width
      );

      // Сначала ищем размер не больше 800px
      const optimalSize = sortedSizes.find((size) => size.width <= 800);

      // Если нет подходящего размера, берем самый маленький
      return optimalSize
        ? optimalSize.url
        : sortedSizes[sortedSizes.length - 1].url;
    }

    return null;
  }

  /**
   * Функция для обработки новых сообщений от пользователя и отправки ответов ассистента
   * @param channel Канал ВК
   * @param peerId ID диалога/пользователя
   * @param messages Сообщения из диалога
   * @param storage Экземпляр хранилища
   */
  async function processNewUserMessagesWithAssistant(
    channel: Channel,
    peerId: number,
    messages: VkMessage[],
    storage: IStorage
  ) {
    try {
      // Проверяем, есть ли сообщения от пользователя (не от группы)
      const userMessages = messages.filter(
        (msg) =>
          msg.fromId > 0 && // положительный fromId - сообщение от пользователя
          (msg.out === 0 || !msg.out) // не исходящее сообщение
      );

      if (userMessages.length === 0) {
        console.log(`Нет сообщений от пользователя в диалоге ${peerId}`);
        return; // Нет сообщений от пользователя
      }

      console.log(
        `Найдено ${userMessages.length} сообщений от пользователя ${peerId}`
      );

      // Берем последнее сообщение пользователя для обработки
      const latestUserMessage = userMessages[userMessages.length - 1];

      // Создаем уникальный идентификатор сообщения для кэша
      const messageIdForCache = `${channel.id}:${peerId}:${latestUserMessage.id}`;

      // Сначала проверяем глобальный кэш, обработали ли мы уже это сообщение
      if (processedMessages.has(messageIdForCache)) {
        console.log(
          `[КЭШИРОВАНИЕ] Сообщение ${latestUserMessage.id} уже было обработано (найдено в глобальном кэше), пропускаем`
        );
        return;
      }

      // Находим или создаем разговор
      const conversation = await findOrCreateConversation(
        storage,
        channel.id,
        String(peerId),
        channel.createdBy
      );

      const userText = latestUserMessage.text;

      // Проверяем наличие исправленного ответа
      const assistantIdForFindAnswer = conversation.assistantId;
      let correctedResponse = null;
      if (assistantIdForFindAnswer) {
        correctedResponse =
          await assistantTrainingService.findCorrectedResponse(
            assistantIdForFindAnswer,
            userText
          );
      }

      if (correctedResponse) {
        console.log(
          `[ВК] Применяем сохраненное исправление для запроса: ${userText}`
        );

        // Отправляем исправленный ответ в ВК
        await vkService.sendMessage(channel, peerId, correctedResponse);

        // Сохраняем отправленное сообщение в БД
        await storage.createMessage({
          conversationId: conversation.id,
          content: correctedResponse,
          senderType: "assistant",
          metadata: {
            assistant_id: assistant.id,
            is_modified_response: true,
            reply_to_vk_message_id: latestUserMessage.id,
          },
        });

        // Учитываем сообщение в ограничении тарифа
        await trackAssistantMessage(channel.id, storage);

        return; // Завершаем обработку
      }

      // Проверяем, было ли это сообщение уже обработано - получаем сохраненные сообщения для этого разговора
      const savedMessages = await storage.listMessagesByConversation(
        conversation.id
      );
      console.log(
        `[DEBUG] Найдено ${savedMessages.length} сохраненных сообщений для разговора ${conversation.id}`
      );

      // Выводим подробную информацию о последних сообщениях в чате для отладки
      const recentMessages = savedMessages.slice(0, 5); // только 5 последних для краткости
      recentMessages.forEach((msg, idx) => {
        console.log(
          `[DEBUG] Сообщение ${idx + 1}/${recentMessages.length}: senderType=${
            msg.senderType
          }, ID=${msg.id}`
        );
        if (msg.metadata && typeof msg.metadata === "object") {
          const metadata = msg.metadata as Record<string, any>;
          console.log(`[DEBUG]   Метаданные: ${JSON.stringify(metadata)}`);
        }
      });

      // Расширенное логирование для отладки проверки ответов ассистента
      console.log(
        `[DEBUG] Проверяем, было ли сообщение ${latestUserMessage.id} уже обработано`
      );

      // Проверка обработанных сообщений с учетом ответов ассистента
      // Ищем сообщения ассистента, связанные с этим сообщением пользователя
      const assistantResponses = savedMessages.filter((msg) => {
        if (
          msg.senderType !== "assistant" ||
          !msg.metadata ||
          typeof msg.metadata !== "object"
        ) {
          return false;
        }

        const metadata = msg.metadata as Record<string, any>;
        // Проверяем, ссылается ли ответ ассистента на текущее сообщение пользователя через metadata
        const result = metadata.reply_to_vk_message_id === latestUserMessage.id;
        if (result) {
          console.log(
            `[DEBUG] Найден ответ ассистента на сообщение ${
              latestUserMessage.id
            }: ${JSON.stringify(metadata)}`
          );
        }
        return result;
      });

      const messageAlreadyProcessed = assistantResponses.length > 0;

      console.log(
        `[DEBUG] Сообщение ${latestUserMessage.id} ${
          messageAlreadyProcessed ? "уже было" : "еще не было"
        } обработано ассистентом`
      );

      if (messageAlreadyProcessed) {
        // Добавляем в кэш, если есть в базе, но не в кэше
        processedMessages.set(messageIdForCache, Date.now());
        console.log(
          `[КЭШИРОВАНИЕ] Сообщение ${latestUserMessage.id} помечено как обработанное в глобальном кэше`
        );
        console.log(
          `Сообщение ${latestUserMessage.id} уже было обработано ассистентом (найдено ${assistantResponses.length} ответов), пропускаем`
        );
        return;
      }

      // Проверяем, сохранено ли уже сообщение пользователя в базе
      const messageInDb = savedMessages.some((msg) => {
        if (!msg.metadata || typeof msg.metadata !== "object") return false;

        const metadata = msg.metadata as Record<string, any>;
        const result =
          "vk_message_id" in metadata &&
          metadata.vk_message_id === latestUserMessage.id;
        if (result) {
          console.log(
            `[DEBUG] Найдено сообщение пользователя в базе: vk_message_id=${metadata.vk_message_id}`
          );
        }
        return result; // Возвращаем true, если сообщение найдено
      });

      // Выводим результат проверки для отладки
      console.log(
        `[DEBUG] Сообщение ${latestUserMessage.id} ${
          messageInDb ? "найдено" : "не найдено"
        } в базе данных`
      );

      // Есл сообщение отсутствует в базе, сохраняем его
      if (!messageInDb) {
        console.log(
          `[DEBUG] Сохраняем новое сообщение пользователя в базе: ${latestUserMessage.id}`
        );
        await storage.createMessage({
          conversationId: conversation.id,
          content: latestUserMessage.text || "[вложение без текста]",
          senderType: "user",
          metadata: {
            vk_message_id: latestUserMessage.id,
            from_id: latestUserMessage.fromId,
          },
        });
      }

      // Сразу же добавляем сообщение в глобальный кэш для предотвращения дублирования обработки
      processedMessages.set(messageIdForCache, Date.now());

      // Для диалога VK ID диалога и peer_id часто совпадают, но могут отличаться
      // в групповых чатах. Для надежности используем peerId как dialogId
      const dialogId = peerId;
      console.log(`Используем ID диалога: ${dialogId} (peerId: ${peerId})`);

      // Проверяем есть ли связь диалог-ассистент
      // dialogId уже является строкой (peerId), преобразовывать в число не нужно
      const dialogAssistants = await storage.listDialogAssistantsByDialog(
        String(dialogId)
      );

      // Сначала проверяем, есть ли настройка для диалога
      const dialogAssistant = dialogAssistants.find(
        (da) => da.channelId === channel.id
      );

      // Если для диалога есть настройка и autoReply явно выключен, прекращаем обработку
      if (
        dialogAssistant &&
        dialogAssistant.enabled &&
        dialogAssistant.autoReply === false
      ) {
        console.log(
          `[ВК] Ассистент для диалога ${dialogId} имеет отключенный автоответ, пропускаем обработку`
        );
        return;
      }

      // Если ассистент отключен для диалога, прекращаем обработку
      if (dialogAssistant && dialogAssistant.enabled === false) {
        console.log(
          `[ВК] Ассистент отключен для диалога ${dialogId}, пропускаем обработку`
        );
        return;
      }

      // Если нет явного назначения для этого диалога, используем ассистента канала
      let assistantId: number | null = dialogAssistant?.assistantId || null;

      if (!assistantId) {
        // Проверяем, есть ли ассистент по умолчанию для канала
        try {
          // Получаем все ассистенты, связанные с этим каналом
          const channelAssistants =
            await storage.listAssistantChannelsByChannel(channel.id);

          // Приоритет 1: Ищем ассистента с активным autoReply
          const autoReplyAssistant = channelAssistants.find(
            (ca) => ca.enabled === true && ca.autoReply === true
          );

          if (autoReplyAssistant) {
            assistantId = autoReplyAssistant.assistantId;
            console.log(
              `Для диалога ${dialogId} не найден ассистент, используем ассистента канала с автоответчиком: ${assistantId}`
            );
          } else {
            // Приоритет 2: Ищем ассистента, помеченного как дефолтный
            const defaultAssistant = channelAssistants.find(
              (ca) => ca.isDefault === true && ca.enabled === true
            );

            if (defaultAssistant) {
              assistantId = defaultAssistant.assistantId;
              console.log(
                `Для диалога ${dialogId} не найден ассистент, используем ассистента канала по умолчанию: ${assistantId}`
              );
            } else {
              // Приоритет 3: Используем первого активного ассистента
              const firstActiveAssistant = channelAssistants.find(
                (ca) => ca.enabled === true
              );

              if (firstActiveAssistant) {
                assistantId = firstActiveAssistant.assistantId;
                console.log(
                  `Для диалога ${dialogId} не найден ассистент, используем первого активного ассистента канала: ${assistantId}`
                );
              } else {
                console.log(
                  `Для диалога ${dialogId} не найден ассистент, и нет активных ассистентов для канала`
                );
                return;
              }
            }
          }
        } catch (error) {
          console.error("Ошибка при поиске ассистента канала:", error);
          return;
        }
      }

      // Получаем ассистента
      const assistant = await storage.getAssistant(assistantId);

      if (!assistant || !assistant.openaiAssistantId) {
        console.log(
          `Ассистент не найден или не имеет OpenAI ID: ${assistantId}`
        );
        return;
      }

      // Проверяем доступность ассистента по расписанию
      const isAssistantAvailable = await isAssistantAvailableBySchedule(
        channel.id,
        storage
      );
      if (!isAssistantAvailable) {
        console.log(
          `[АССИСТЕНТ] Ассистент недоступен по расписанию для канала ${channel.id}`
        );
        return;
      }

      // Расширенное логирование информации об ассистенте для отладки
      console.log(
        `[АССИСТЕНТ] ID в базе данных: ${assistant.id}, Имя: ${assistant.name}`
      );
      console.log(`[АССИСТЕНТ] OpenAI ID: ${assistant.openaiAssistantId}`);

      if (dialogAssistant) {
        console.log(
          `[ДИАЛОГ-АССИСТЕНТ] ID: ${dialogAssistant.id}, ChannelID: ${dialogAssistant.channelId}, DialogID: ${dialogAssistant.dialogId}`
        );
        console.log(
          `[ДИАЛОГ-АССИСТЕНТ] Связь между: диалог ${dialogAssistant.dialogId} -> ассистент ${dialogAssistant.assistantId}`
        );
        console.log(
          `[ДИАЛОГ-АССИСТЕНТ] AutoReply: ${dialogAssistant.autoReply}, Enabled: ${dialogAssistant.enabled}`
        );
      } else {
        console.log(
          `[КАНАЛ-АССИСТЕНТ] Используется ассистент канала ID: ${assistant.id}`
        );
      }

      console.log(
        `Обрабатываем сообщение от пользователя ${peerId}: ${latestUserMessage.text}`
      );

      // Если у разговора нет thread_id, создаем его
      if (!conversation.threadId) {
        const thread = await openaiService.createThread();
        await storage.updateConversation(conversation.id, {
          threadId: thread.id,
        });
        conversation.threadId = thread.id;
      }

      const threadId = conversation.threadId as string; // Гарантируем, что threadId не null

      // Проверяем наличие вложений с изображениями
      let imageUrl: string | null = null;

      if (
        latestUserMessage.attachments &&
        latestUserMessage.attachments.length > 0
      ) {
        // Ищем первое вложение-фото
        const photoAttachment = latestUserMessage.attachments.find(
          (att) => att.type === "photo"
        );
        if (photoAttachment) {
          imageUrl = getImageUrlFromAttachment(photoAttachment);
          console.log(`[ВК] Найдено изображение во вложении, URL: ${imageUrl}`);
        }
      }

      // Добавляем сообщение в тред
      if (imageUrl) {
        // Если есть изображение, используем sendMessage вместо addMessageToThread
        console.log(
          `[ВК->OpenAI] Отправка сообщения с изображением: ${imageUrl}`
        );
        await openaiService.sendMessage(
          threadId,
          latestUserMessage.text || "[Изображение]",
          imageUrl
        );
      } else {
        // Если изображений нет, используем стандартный метод
        await openaiService.addMessageToThread(
          threadId,
          latestUserMessage.text || "[вложение без текста]"
        );
      }

      // Сначала проверяем, есть ли исправленный ответ для этого запроса
      const userQuery = latestUserMessage.text;

      // Если запрос пустой, пропускаем проверку исправлений
      if (userQuery && userQuery.trim() && assistant.openaiAssistantId) {
        console.log(
          `[ПРОВЕРКА ИСПРАВЛЕНИЙ] Проверяем наличие исправленных ответов для запроса: "${userQuery}"`
        );

        // Ищем исправленный ответ в коллекции
        const correctedResponse = await openaiService.testAssistant(
          assistant.openaiAssistantId,
          userQuery
        );

        // Если найден исправленный ответ, используем его напрямую
        if (correctedResponse && typeof correctedResponse === "string") {
          console.log(
            `[ИСПРАВЛЕННЫЙ ОТВЕТ] Найден исправленный ответ для запроса "${userQuery}"`
          );
          console.log(
            `[ИСПРАВЛЕННЫЙ ОТВЕТ] Контент: ${correctedResponse.substring(
              0,
              100
            )}...`
          );

          // Отправляем ответ через VK API
          await vkService.sendMessage(channel, peerId, correctedResponse);

          // Сохраняем отправленное сообщение в БД с ссылкой на исходное сообщение пользователя
          await storage.createMessage({
            conversationId: conversation.id,
            content: correctedResponse,
            senderType: "assistant",
            metadata: {
              assistant_id: assistant.id,
              openai_assistant_id: assistant.openaiAssistantId,
              reply_to_vk_message_id: latestUserMessage.id,
              is_corrected_response: true,
            },
          });

          // Учитываем сообщение в ограничении тарифа для создателя канала
          await trackAssistantMessage(channel.id, storage);

          console.log(`Отправлен исправленный ответ пользователю ${peerId}`);
          return; // Завершаем функцию, так как ответ уже отправлен
        }
      }

      // Если исправленного ответа не найдено, продолжаем с обычной логикой
      // Запускаем выполнение ассистента
      console.log(
        `[ЗАПУСК АССИСТЕНТА] OpenAI ID: ${assistant.openaiAssistantId}, ThreadID: ${threadId}`
      );
      const run = await openaiService.runAssistant(
        assistant.openaiAssistantId as string, // Порядок аргументов: assistantId, threadId
        threadId
      );
      console.log(`[ЗАПУСК АССИСТЕНТА] Успешный запуск, RunID: ${run.id}`);

      // Ждем завершения выполнения
      const runResult = await openaiService.waitForRunCompletion(
        run.id,
        threadId
      );

      if (runResult.status === "completed") {
        // Получаем сообщения из треда
        const messages = await openaiService.getThreadMessages(threadId);

        // Находим последнее сообщение от ассистента
        const assistantMessages = messages.filter(
          (msg: ThreadMessage) => msg.role === "assistant"
        );

        if (assistantMessages.length > 0) {
          // OpenAI API возвращает сообщения в порядке от новых к старым,
          // поэтому самое новое сообщение будет первым в массиве
          const latestAssistantMessage = assistantMessages[0];

          console.log(
            `[ОТВЕТ АССИСТЕНТА] Получен ответ от ассистента OpenAI ${assistant.openaiAssistantId}`
          );
          console.log(
            `[ОТВЕТ АССИСТЕНТА] Сообщение ID: ${latestAssistantMessage.id}`
          );

          // Проверяем, что сообщение содержит текст и имеет правильную структуру
          if (
            latestAssistantMessage.content &&
            latestAssistantMessage.content.length > 0 &&
            latestAssistantMessage.content[0].type === "text" &&
            latestAssistantMessage.content[0].text &&
            latestAssistantMessage.content[0].text.value
          ) {
            const responseText = latestAssistantMessage.content[0].text.value;
            console.log(
              `[ОТВЕТ АССИСТЕНТА] Контент: ${responseText.substring(0, 100)}...`
            );

            // Отправляем ответ через VK API
            await vkService.sendMessage(channel, peerId, responseText);

            // Сохраняем отправленное сообщение в БД с ссылкой на исходное сообщение пользователя
            await storage.createMessage({
              conversationId: conversation.id,
              content: responseText,
              senderType: "assistant",
              metadata: {
                openai_message_id: latestAssistantMessage.id,
                run_id: run.id,
                assistant_id: assistant.id,
                openai_assistant_id: assistant.openaiAssistantId,
                reply_to_vk_message_id: latestUserMessage.id, // Добавляем связь с исходным сообщением пользователя
              },
            });

            // Учитываем сообщение в ограничении тарифа для создателя канала
            await trackAssistantMessage(channel.id, storage);
          } else {
            console.error(
              "[ОТВЕТ АССИСТЕНТА] Получен ответ в неверном формате:",
              latestAssistantMessage
            );
          }

          console.log(`Отправлен ответ ассистента пользователю ${peerId}`);
        }
      } else {
        console.error(`Ошибка выполнения ассистента: ${runResult.status}`);
      }
    } catch (error) {
      console.error("Ошибка при обработке сообщений ассистентом:", error);
    }
  }

  // Маршруты для работы с Avito вебхуками

  // Маршрут для приема вебхуков от Avito
  app.post("/api/channels/avito/webhook/:channelId", async (req, res) => {
    try {
      const channelId = parseInt(req.params.channelId);
      if (isNaN(channelId)) {
        console.error(
          `[Avito Webhook] Неверный ID канала: ${req.params.channelId}`
        );
        return res.status(400).json({ message: "Invalid channel ID" });
      }

      const channel = await storageInstance.getChannel(channelId);
      if (!channel || channel.type !== "avito") {
        console.error(
          `[Avito Webhook] Канал Avito не найден для ID: ${channelId}`
        );
        return res.status(404).json({ message: "Avito channel not found" });
      }

      // Логирование входящего запроса
      console.log(
        `[Avito Webhook] Получен запрос от Avito API для канала ${channelId}:`,
        JSON.stringify(req.body)
      );

      const eventData = req.body;

      // Проверка на наличие payload для событий v3
      if (!eventData) {
        console.warn(
          `[Avito Webhook] Получено пустое событие от Avito для канала ${channelId}`
        );
        return res.status(200).json({ status: "ok" });
      }

      // Если есть поле payload, это webhook API v3, иначе старый формат
      const isV3Format = !!eventData.payload;

      // Используем глобальный кэш для отслеживания обработанных сообщений

      // Обработка сообщения из webhook API v3
      if (
        isV3Format &&
        eventData.payload &&
        eventData.payload.type === "message"
      ) {
        try {
          console.log(
            `[Avito Webhook] Получено событие нового сообщения для канала ${channelId}`
          );

          // Извлекаем данные сообщения из поля value в payload
          const messageData = eventData.payload.value || {};
          const chatId = String(messageData.chat_id); // Убедимся, что chatId является строкой
          const messageId = messageData.id;
          const authorId = messageData.author_id;

          if (!chatId || !messageId) {
            console.error(
              `[Avito Webhook] Неполные данные о сообщении: ${JSON.stringify(
                messageData
              )}`
            );
            return res.status(200).json({ status: "ok" });
          }

          // Проверяем, не обрабатывали ли мы уже это сообщение
          const messageKey = `${channelId}:${chatId}:${messageId}`;
          if (processedMessages.has(messageKey)) {
            console.log(
              `[Avito Webhook] Сообщение ${messageId} уже обработано ранее, пропускаем.`
            );
            return res.status(200).json({ status: "ok" });
          }

          // Получаем профиль ID из настроек канала
          const settings = channel.settings as any;
          const profileId =
            settings && settings.profileId
              ? String(settings.profileId).replace(/\s/g, "")
              : null;

          // Если это исходящее сообщение от нас или автор сообщения совпадает с нашим profileId, игнорируем его
          if (
            messageData.direction === "out" ||
            (profileId && String(authorId) === profileId)
          ) {
            console.log(
              `[Avito Webhook] Игнорируем исходящее сообщение: ${messageId} (direction: ${messageData.direction}, authorId: ${authorId}, наш profileId: ${profileId})`
            );
            // Помечаем сообщение как обработанное
            processedMessages.set(messageKey, Date.now());
            return res.status(200).json({ status: "ok" });
          }

          // Определяем тип сообщения и его содержимое
          const messageType = messageData.type || "text";
          let messageText = messageData.content?.text || "";
          let imageUrl = "";

          // Обработка изображений
          if (messageType === "image" && messageData.content?.image?.sizes) {
            // Получаем URL изображения в максимальном размере
            const imageSizes = messageData.content.image.sizes;
            // Выбираем наибольший размер изображения
            if (imageSizes["1280x960"]) {
              imageUrl = imageSizes["1280x960"];
            } else if (imageSizes["640x480"]) {
              imageUrl = imageSizes["640x480"];
            } else {
              // Берем первый доступный размер
              const firstSize = Object.keys(imageSizes)[0];
              if (firstSize) {
                imageUrl = imageSizes[firstSize];
              }
            }

            // Перезагружаем изображение на стабильный сервер Bytescale
            if (imageUrl) {
              try {
                const stableImageUrl = await uploadImageByUrlToStableServer(
                  imageUrl
                );
                if (stableImageUrl !== imageUrl) {
                  console.log(
                    `[Avito Webhook] Изображение перезагружено на стабильный URL: ${stableImageUrl}`
                  );
                  imageUrl = stableImageUrl;
                }
              } catch (uploadError) {
                console.error(
                  `[Avito Webhook] Ошибка перезагрузки изображения: ${uploadError}`
                );
                // Продолжаем с оригинальным URL в случае ошибки
              }
            }

            // Если текст пустой, создаем описание для изображения
            if (!messageText) {
              messageText = "[Изображение]";
            }

            console.log(`[Avito Webhook] Получено изображение: ${imageUrl}`);
          }

          // Проверяем текст сообщения на совпадение с нашими стандартными ответами
          if (
            messageText.includes(
              "Извините, произошла ошибка при обработке вашего сообщения"
            ) ||
            messageText.includes(
              "Спасибо за ваше сообщение. Мы обработаем его в ближайшее время"
            )
          ) {
            console.log(
              `[Avito Webhook] Игнорируем наше автоматическое сообщение`
            );
            // Помечаем сообщение как обработанное
            processedMessages.set(messageKey, Date.now());
            return res.status(200).json({ status: "ok" });
          }

          // Получаем информацию об ассистенте для этого канала
          const assistantChannel =
            await storageInstance.getAssistantChannelByChannel(channelId);
          if (!assistantChannel) {
            console.log(
              `[Avito Webhook] Для канала ${channelId} не настроен ассистент`
            );
            return res.status(200).json({ status: "ok" });
          }

          const assistant = await storageInstance.getAssistant(
            assistantChannel.assistantId
          );
          if (!assistant) {
            console.log(
              `[Avito Webhook] Не найден ассистент с ID ${assistantChannel.assistantId}`
            );
            return res.status(200).json({ status: "ok" });
          }

          console.log(
            `[Avito Webhook] Найден ассистент ${assistant.name} для канала ${channelId}`
          );

          // Проверяем включен ли ассистент для этого диалога
          const dialogId = chatId; // В Avito chat_id используется как dialogId

          // Проверяем, есть ли настройки диалог-ассистент
          // dialogId уже является строкой в контексте Avito
          const dialogAssistants =
            await storageInstance.listDialogAssistantsByDialog(
              String(dialogId)
            );

          // Проверяем, включен ли ассистент для этого диалога
          const dialogAssistant = dialogAssistants.find(
            (da) => da.channelId === channelId
          );

          if (dialogAssistant && dialogAssistant.enabled === false) {
            console.log(
              `[Avito Webhook] Ассистент отключен для диалога ${dialogId}, пропускаем обработку`
            );
            return res.status(200).json({ status: "ok" });
          }

          // Проверка на autoReply - если явно выключен, прекращаем обработку
          if (
            dialogAssistant &&
            dialogAssistant.enabled &&
            dialogAssistant.autoReply === false
          ) {
            console.log(
              `[Avito Webhook] Автоответ отключен для диалога ${dialogId}, пропускаем обработку`
            );
            return res.status(200).json({ status: "ok" });
          }

          // Текст сообщения уже получен ранее
          // const messageText = messageData.content?.text || "";

          // Маркируем сообщение как прочитанное
          try {
            await avitoService.markMessagesAsRead(channel, chatId);
          } catch (readError) {
            console.error(
              `[Avito Webhook] Ошибка при маркировке сообщения как прочитанного:`,
              readError
            );
            // Продолжаем обработку даже при ошибке маркировки
          }

          // Генерируем ответ от ассистента
          console.log(
            `[Avito Webhook] Генерируем ответ для сообщения: ${messageText}`
          );

          // Проверяем, есть ли у ассистента OpenAI ассистент ID
          if (!assistant.openaiAssistantId) {
            console.error(
              `[Avito Webhook] Ассистент ${assistant.id} не имеет OpenAI Assistant ID`
            );
            const assistantResponse =
              "Спасибо за ваше сообщение. Мы обработаем его в ближайшее время.";
            try {
              await avitoService.sendMessage(
                channel,
                chatId,
                assistantResponse
              );
            } catch (sendError: any) {
              // Если получили ошибку ограничения частоты запросов (429), добавляем задержку и пробуем еще раз
              if (sendError.status === 429) {
                console.log(
                  `[Avito Webhook] Получено ограничение частоты запросов (429), ожидаем 2 секунды и пробуем снова`
                );
                await new Promise((resolve) => setTimeout(resolve, 2000));
                await avitoService.sendMessage(
                  channel,
                  chatId,
                  assistantResponse
                );
              } else {
                throw sendError;
              }
            }
            return res.status(200).json({ status: "ok" });
          }

          // Отмечаем сообщение как обрабатываемое до отправки ассистенту
          processedMessages.set(messageKey, Date.now());
          console.log(
            `[КЭШИРОВАНИЕ] Сообщение ${messageId} добавлено в глобальный кэш обработанных сообщений`
          );

          try {
            // Проверяем или создаем тред для этого диалога
            let conversation = await findOrCreateConversation(
              storageInstance,
              channel.id,
              chatId, // Используем chatId как externalUserId
              channel.createdBy
            );

            // Если у разговора еще нет threadId, создаем его
            if (!conversation.threadId) {
              console.log(
                `[Avito Webhook] Создаем новый тред для диалога ${chatId}`
              );
              const thread = await openaiService.createThread();
              const updatedConversation =
                await storageInstance.updateConversation(conversation.id, {
                  threadId: thread.id,
                  assistantId: assistant.id,
                });

              if (!updatedConversation) {
                throw new Error(
                  `Не удалось обновить разговор ${conversation.id} с новым threadId`
                );
              }

              conversation = updatedConversation;
              console.log(
                `[Avito Webhook] Создан новый тред ${thread.id} для диалога ${chatId}`
              );
            }

            console.log(
              `[Avito Webhook] Генерируем ответ с использованием OpenAI для сообщения: "${messageText}"`
            );

            // Формируем метаданные сообщения
            const messageMetadata: any = {
              externalUserId: messageData.author_id,
              avito_message_id: messageId,
              chat_id: chatId,
            };

            // Добавляем URL изображения в метаданные, если есть
            if (imageUrl) {
              messageMetadata.image_url = imageUrl;
              messageMetadata.message_type = "image";
            }

            // Создаем сообщение в базе данных
            await storageInstance.createMessage({
              conversationId: conversation.id,
              content: messageText,
              senderType: "user",
              senderId: null,
              metadata: messageMetadata,
            });

            // Если у нас есть изображение, достаточно просто передать URL изображения
            // напрямую в OpenAI при запросе, без модификации текста
            let promptMessage = messageText;

            // Проверяем наличие исправленного ответа
            const correctedResponse =
              await assistantTrainingService.findCorrectedResponse(
                assistant.id,
                messageText
              );

            if (correctedResponse) {
              console.log(
                `[Авито] Применяем сохраненное исправление для запроса: ${messageText}`
              );

              // Отправляем ответ пользователю через Avito API
              await avitoService.sendMessage(
                channel,
                chatId,
                correctedResponse
              );

              // Сохраняем ответ ассистента в базе данных
              await storageInstance.createMessage({
                conversationId: conversation.id,
                content: correctedResponse,
                senderType: "assistant",
                senderId: null,
                metadata: {
                  assistantId: assistant.id,
                  is_modified_response: true,
                  reply_to_avito_message_id: messageId,
                  chat_id: chatId,
                },
              });

              // Учитываем сообщение в ограничении тарифа
              await trackAssistantMessage(channel.id, storageInstance);

              return res.status(200).json({ status: "ok" });
            }

            // Получаем ответ от OpenAI
            console.log(
              `[Avito Webhook] Отправляем запрос в OpenAI${
                imageUrl ? " с изображением" : ""
              }: "${promptMessage}"`
            );
            const response = await openaiService.generateResponse(
              assistant.openaiAssistantId,
              conversation.threadId as string,
              promptMessage, // Используем текст сообщения
              imageUrl // Передаем URL изображения напрямую в OpenAI
            );

            // Извлекаем текст ответа
            const assistantResponse =
              response.content[0]?.text?.value ||
              "Извините, я не смог сгенерировать ответ. Пожалуйста, попробуйте позже.";

            // Сохраняем ответ ассистента в базе данных с расширенными метаданными
            await storageInstance.createMessage({
              conversationId: conversation.id,
              content: assistantResponse,
              senderType: "assistant",
              senderId: null,
              metadata: {
                assistantId: assistant.id,
                openai_assistant_id: assistant.openaiAssistantId,
                reply_to_avito_message_id: messageId, // Добавляем связь с исходным сообщением
                chat_id: chatId,
              },
            });

            // Учитываем сообщение в ограничении тарифа для создателя канала
            await trackAssistantMessage(channel.id, storage);

            console.log(
              `[Avito Webhook] Получен ответ от OpenAI: "${assistantResponse}"`
            );

            // Отправляем ответ пользователю через Avito API
            try {
              // Сначала помечаем сообщения в диалоге как прочитанные
              await avitoService.markMessagesAsRead(channel, chatId);
              console.log(
                `[Avito Webhook] Сообщения в чате ${chatId} отмечены как прочитанные`
              );

              // Затем отправляем ответ от ассистента
              await avitoService.sendMessage(
                channel,
                chatId,
                assistantResponse
              );
              console.log(
                `[Avito Webhook] Ответ успешно отправлен в Avito чат ${chatId}`
              );
            } catch (sendError: any) {
              // Если получили ошибку ограничения частоты запросов (429), добавляем задержку и пробуем еще раз
              if (sendError.status === 429) {
                console.log(
                  `[Avito Webhook] Получено ограничение частоты запросов (429), ожидаем 2 секунды и пробуем снова`
                );
                await new Promise((resolve) => setTimeout(resolve, 2000));

                // Повторная попытка пометить сообщения как прочитанные
                try {
                  await avitoService.markMessagesAsRead(channel, chatId);
                  console.log(
                    `[Avito Webhook] Сообщения в чате ${chatId} отмечены как прочитанные (повторная попытка)`
                  );
                } catch (readError) {
                  console.error(
                    `[Avito Webhook] Ошибка при отметке сообщений как прочитанных:`,
                    readError
                  );
                }

                // Повторная отправка сообщения
                await avitoService.sendMessage(
                  channel,
                  chatId,
                  assistantResponse
                );
                console.log(
                  `[Avito Webhook] Ответ успешно отправлен в Avito чат ${chatId} (после повторной попытки)`
                );
              } else {
                throw sendError;
              }
            }
          } catch (aiError) {
            console.error(
              `[Avito Webhook] Ошибка при работе с OpenAI:`,
              aiError
            );
            const fallbackResponse =
              "Извините, произошла ошибка при обработке вашего сообщения. Наши специалисты уже работают над решением проблемы.";
            try {
              // Сначала помечаем сообщения в диалоге как прочитанные
              await avitoService.markMessagesAsRead(channel, chatId);
              console.log(
                `[Avito Webhook] Сообщения в чате ${chatId} отмечены как прочитанные (при ошибке)`
              );

              // Затем отправляем ответ с сообщением об ошибке
              await avitoService.sendMessage(channel, chatId, fallbackResponse);
            } catch (sendError: any) {
              // Если получили ошибку ограничения частоты запросов (429), добавляем задержку и пробуем еще раз
              if (sendError.status === 429) {
                console.log(
                  `[Avito Webhook] Получено ограничение частоты запросов (429), ожидаем 2 секунды и пробуем снова`
                );
                await new Promise((resolve) => setTimeout(resolve, 2000));

                // Повторная попытка пометить сообщения как прочитанные
                try {
                  await avitoService.markMessagesAsRead(channel, chatId);
                  console.log(
                    `[Avito Webhook] Сообщения в чате ${chatId} отмечены как прочитанные (повторная попытка при ошибке)`
                  );
                } catch (readError) {
                  console.error(
                    `[Avito Webhook] Ошибка при отметке сообщений как прочитанных:`,
                    readError
                  );
                }

                await avitoService.sendMessage(
                  channel,
                  chatId,
                  fallbackResponse
                );
              } else {
                throw sendError;
              }
            }
          }
        } catch (messageError) {
          console.error(
            `[Avito Webhook] Ошибка при обработке нового сообщения:`,
            messageError
          );
        }
      } else if (isV3Format) {
        console.log(
          `[Avito Webhook] Получено событие типа ${
            eventData.payload?.type || "unknown"
          } (не обрабатывается)`
        );
      } else {
        console.log(
          `[Avito Webhook] Получено событие старого формата или неизвестного типа`
        );
      }

      // Для Avito возвращаем успешный ответ
      return res.status(200).json({ status: "ok" });
    } catch (error) {
      console.error(`[Avito Webhook] Ошибка при обработке webhook:`, error);
      // Возвращаем успешный ответ, чтобы Avito не пыталось переотправить запрос
      return res.status(200).json({ status: "ok" });
    }
  });

  // Маршрут для получения списка подписок на вебхуки Avito
  app.get(
    "/api/channels/:id/avito/webhooks",
    authenticateToken,
    async (req, res) => {
      try {
        const channelId = parseInt(req.params.id);

        if (isNaN(channelId)) {
          return res.status(400).json({ message: "Некорректный ID канала" });
        }

        // Получаем канал из БД
        const channel = await storageInstance.getChannel(channelId);
        if (!channel) {
          return res.status(404).json({ message: "Канал не найден" });
        }

        // Проверяем, что это канал Avito
        if (channel.type !== "avito") {
          return;
        }

        // Получаем список подписок
        const webhooks = await avitoService.getWebhookSubscriptions(channel);

        res.json(webhooks);
      } catch (error) {
        console.error("Ошибка при получении списка подписок Avito:", error);
        res.status(500).json({
          message: "Ошибка при получении списка подписок Avito",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Маршрут для создания подписки на вебхук Avito
  app.post(
    "/api/channels/:id/avito/webhooks",
    authenticateToken,
    async (req, res) => {
      try {
        const channelId = parseInt(req.params.id);

        if (isNaN(channelId)) {
          return res.status(400).json({ message: "Некорректный ID канала" });
        }

        // Получаем канал из БД
        const channel = await storageInstance.getChannel(channelId);
        if (!channel) {
          return res.status(404).json({ message: "Канал не найден" });
        }

        // Проверяем, что это канал Avito
        if (channel.type !== "avito") {
          return res
            .status(400)
            .json({ message: "Канал не является Avito каналом" });
        }

        // Извлекаем настройки канала
        const { clientId, clientSecret } = channel.settings as {
          clientId: string;
          clientSecret: string;
          profileId: string;
        };

        if (!clientId || !clientSecret) {
          return res.status(400).json({
            message:
              "Отсутствуют необходимые настройки канала (clientId, clientSecret)",
          });
        }

        // Формируем URL для вебхука используя функцию определения текущего домена
        const publicUrl = getCurrentBaseUrl(req);
        const callbackUrl = `${publicUrl}/api/channels/avito/webhook/${channelId}`;
        console.log(`[DEBUG] Переменная PUBLIC_URL: ${process.env.PUBLIC_URL}`);
        console.log(`[DEBUG] Текущий базовый URL: ${publicUrl}`);
        console.log(
          `[DEBUG] Сформированный URL вебхука для Avito: ${callbackUrl}`
        );

        console.log(
          `[DEBUG] Отправка запроса на подписку вебхука Avito для канала ${channelId}`
        );
        console.log(`[DEBUG] clientId: ${clientId.substring(0, 3)}...`);
        console.log(`[DEBUG] callbackUrl: ${callbackUrl}`);

        // Используем прямой метод подписки на вебхук v3
        const result = await avitoService.subscribeWebhook(
          clientId,
          clientSecret,
          callbackUrl
        );

        console.log(`[DEBUG] Результат создания подписки Avito:`, result);

        res.status(201).json({
          success: true,
          webhookId: 1, // Используем фиктивный ID, т.к. API Avito не возвращает ID подписки
          message: "Подписка на вебхук успешно создана",
        });
      } catch (error) {
        console.error("Ошибка при создании подписки Avito:", error);
        res.status(500).json({
          message: "Ошибка при создании подписки на вебхук Avito",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Маршрут для удаления подписки на вебхук Avito
  app.delete(
    "/api/channels/:id/avito/webhooks/:webhookId",
    authenticateToken,
    async (req, res) => {
      try {
        const channelId = parseInt(req.params.id);
        const webhookId = parseInt(req.params.webhookId);

        if (isNaN(channelId) || isNaN(webhookId)) {
          return res.status(400).json({ message: "Некорректные параметры" });
        }

        // Получаем канал из БД
        const channel = await storageInstance.getChannel(channelId);
        if (!channel) {
          return res.status(404).json({ message: "Канал не найден" });
        }

        // Проверяем, что это канал Avito
        if (channel.type !== "avito") {
          return res
            .status(400)
            .json({ message: "Канал не является Avito каналом" });
        }

        // Извлекаем настройки канала
        const { clientId, clientSecret } = channel.settings as {
          clientId: string;
          clientSecret: string;
          profileId: string;
        };

        if (!clientId || !clientSecret) {
          return res.status(400).json({
            message:
              "Отсутствуют необходимые настройки канала (clientId, clientSecret)",
          });
        }

        // Получаем текущие подписки
        const subscriptions = await avitoService.getWebhookSubscriptions(
          channel
        );
        const subscription = subscriptions.find((s) => s.id === webhookId);

        if (!subscription) {
          return res.status(404).json({ message: "Подписка не найдена" });
        }

        console.log(
          `[DEBUG] Отправка запроса на отписку от вебхука Avito для канала ${channelId}`
        );
        console.log(`[DEBUG] URL подписки: ${subscription.url}`);

        // Используем unsubscribeWebhook для отписки
        const result = await avitoService.unsubscribeWebhook(
          clientId,
          clientSecret,
          subscription.url
        );

        console.log(`[DEBUG] Результат удаления подписки Avito:`, result);

        res.json({
          success: true,
          message: "Подписка на вебхук успешно удалена",
        });
      } catch (error) {
        console.error("Ошибка при удалении подписки Avito:", error);
        res.status(500).json({
          message: "Ошибка при удалении подписки на вебхук Avito",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Маршруты для работы с Avito диалогами
  app.get(
    "/api/channels/:id/avito/dialogs",
    authenticateToken,
    async (req, res) => {
      try {
        const channelId = parseInt(req.params.id);
        if (isNaN(channelId)) {
          return res.status(400).json({ message: "Некорректный ID канала" });
        }

        // Получаем канал из БД
        const channel = await storageInstance.getChannel(channelId);
        if (!channel) {
          return res.status(404).json({ message: "Канал не найден" });
        }

        // Проверяем, что это канал Avito
        if (channel.type !== "avito") {
          return;
        }

        // Параметры пагинации
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        // Получаем список диалогов через Avito сервис с поддержкой пагинации
        const dialogs = await avitoService.getDialogs(channel, limit, offset);
        const channelAssistant =
          await storageInstance.getAssistantChannelByChannel(channelId);

        if (channelAssistant) {
          for (const dialog of dialogs) {
            const dialogId = String(dialog.id); // dialog.id — это строка!
            const existDialogs =
              await storageInstance.getDialogAssistantByDialogAndChannel(
                dialogId,
                channelId
              );

            if (!existDialogs) {
              console.log(
                `[Avito] Добавляю диалог ${dialogId} в dialog_assistants`
              );
              await storageInstance.createDialogAssistant({
                channelId,
                dialogId,
                assistantId: channelAssistant.assistantId,
                enabled: true,
                autoReply: channelAssistant.autoReply, // из настроек канала!
                settings: {},
              });
            }
          }
        }

        res.json(dialogs);
      } catch (error) {
        console.error("Ошибка при получении списка диалогов Avito:", error);
        res.status(500).json({
          message: "Ошибка при получении диалогов",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  app.get(
    "/api/channels/:id/avito/dialogs/:chatId/history",
    authenticateToken,
    async (req, res) => {
      try {
        const channelId = parseInt(req.params.id);
        const chatId = req.params.chatId; // chatId в Avito может быть строкой, поэтому не преобразуем в число

        if (isNaN(channelId) || !chatId) {
          return res
            .status(400)
            .json({ message: "Некорректные параметры запроса" });
        }

        // Получаем канал из БД
        const channel = await storageInstance.getChannel(channelId);
        if (!channel) {
          return res.status(404).json({ message: "Канал не найден" });
        }

        // Проверяем, что это канал Avito
        if (channel.type !== "avito") {
          return;
        }

        // Получаем историю сообщений через Avito сервис
        const history = await avitoService.getConversationHistory(
          channel,
          chatId
        );

        res.json(history);
      } catch (error) {
        console.error("Ошибка при получении истории сообщений Avito:", error);
        res.status(500).json({
          message: "Ошибка при получении истории сообщений",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Маршрут для получения полной информации о диалоге Avito (с информацией о товаре)
  app.get(
    "/api/channels/:id/avito/dialogs/:chatId/full",
    authenticateToken,
    async (req, res) => {
      try {
        const channelId = parseInt(req.params.id);
        const chatId = req.params.chatId; // chatId в Avito может быть строкой, поэтому не преобразуем в число

        if (isNaN(channelId) || !chatId) {
          return res
            .status(400)
            .json({ message: "Некорректные параметры запроса" });
        }

        // Получаем канал из БД
        const channel = await storageInstance.getChannel(channelId);
        if (!channel) {
          return res.status(404).json({ message: "Канал не найден" });
        }

        // Проверяем, что это канал Avito
        if (channel.type !== "avito") {
          return;
        }

        console.log(
          `[API] Запрос полной информации о диалоге Avito: каналId=${channelId}, чатId=${chatId}`
        );

        // Получаем полную информацию о диалоге через Avito сервис
        const fullDialog = await avitoService.getFullDialog(channel, chatId);

        res.json(fullDialog);
      } catch (error) {
        console.error(
          "Ошибка при получении полной информации о диалоге Avito:",
          error
        );
        res.status(500).json({
          message: "Ошибка при получении информации о диалоге",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Маршрут для отправки сообщений в Avito
  app.post(
    "/api/channels/:id/avito/dialogs/:chatId/messages",
    authenticateToken,
    async (req, res) => {
      try {
        const channelId = parseInt(req.params.id);
        const chatId = req.params.chatId; // chatId в Avito может быть строкой, поэтому не преобразуем в число

        if (isNaN(channelId) || !chatId) {
          return res
            .status(400)
            .json({ message: "Некорректные параметры запроса" });
        }

        const { message, attachment } = req.body;

        if (!message || typeof message !== "string") {
          return res
            .status(400)
            .json({ message: "Текст сообщения обязателен" });
        }

        // Получаем канал из БД
        const channel = await storageInstance.getChannel(channelId);
        if (!channel) {
          return res.status(404).json({ message: "Канал не найден" });
        }

        // Проверяем, что это канал Avito
        if (channel.type !== "avito") {
          return res
            .status(400)
            .json({ message: "Канал не является Avito каналом" });
        }

        // Сначала помечаем сообщения в диалоге как прочитанные
        try {
          await avitoService.markMessagesAsRead(channel, chatId);
          console.log(
            `[API] Сообщения в чате Avito ${chatId} отмечены как прочитанные перед отправкой ручного сообщения`
          );
        } catch (readError) {
          console.error(
            `[API] Ошибка при отметке сообщений как прочитанных:`,
            readError
          );
          // Продолжаем выполнение, даже если не удалось пометить сообщения как прочитанные
        }

        // Отправляем сообщение через Avito сервис
        const result = await avitoService.sendMessage(
          channel,
          chatId,
          message,
          attachment
        );
        console.log(`[API] Сообщение успешно отправлено в чат Avito ${chatId}`);

        res.json(result);
      } catch (error) {
        console.error("Ошибка при отправке сообщения в Avito:", error);
        res.status(500).json({
          message: "Ошибка при отправке сообщения",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // =====================================================================
  // Маршруты для веб-виджета чата
  // =====================================================================

  // Получение JS файла виджета
  app.get("/chat-widget.js", (req, res) => {
    res.setHeader("Content-Type", "application/javascript");
    res.sendFile("client/public/chat-widget.js", { root: "." });
  });

  // Отправка сообщения от посетителя через виджет
  app.post("/api/web-widget/messages", async (req, res) => {
    try {
      const { channelId, content, visitorId, dialogId } = req.body;
      console.log(content, visitorId);

      if (!channelId || !content || !visitorId) {
        return res.status(400).json({
          success: false,
          message: "Required fields missing: channelId, content, visitorId",
        });
      }

      // Обрабатываем сообщение
      const result = await processWebMessage(
        Number(channelId),
        visitorId,
        content,
        storageInstance,
        dialogId
      );

      res.json({
        success: true,
        message: "Message sent successfully",
        data: result,
      });
    } catch (error) {
      console.error("[Web Widget API] Error processing message:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process message",
        error: getErrorMessage(error),
      });
    }
  });

  // Получение сообщений диалога для посетителя
  app.get("/api/web-widget/messages", async (req, res) => {
    try {
      const { channelId, visitorId, limit = 20, before } = req.query;

      if (!channelId || !visitorId) {
        return res.status(400).json({
          success: false,
          message: "Required query parameters missing: channelId, visitorId",
        });
      }

      // Проверяем канал
      const channel = await storageInstance.getChannel(Number(channelId));
      if (!channel || channel.type !== "web") {
        return res.status(404).json({
          success: false,
          message: "Channel not found or not a web channel",
        });
      }

      // Находим разговор
      const conversations = await storageInstance.listConversationsByChannel(
        Number(channelId)
      );
      const conversation = conversations.find(
        (c) => c.externalUserId === visitorId
      );

      if (!conversation) {
        return res.json({
          success: true,
          messages: [],
        });
      }

      // Получаем сообщения разговора
      let messages = await storageInstance.listMessagesByConversation(
        conversation.id
      );

      // Если указан параметр before, фильтруем сообщения
      if (before) {
        const beforeMessageIndex = messages.findIndex(
          (m) => m.id === Number(before)
        );
        if (beforeMessageIndex !== -1) {
          messages = messages.slice(0, beforeMessageIndex);
        }
      }

      // Ограничиваем количество сообщений
      messages = messages.slice(-Number(limit));

      // Форматируем сообщения для веб-виджета
      const formattedMessages = messages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        senderType: msg.senderType,
        timestamp: msg.timestamp.toISOString(),
      }));

      res.json({
        success: true,
        messages: formattedMessages,
      });
    } catch (error) {
      console.error("[Web Widget API] Error fetching messages:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch messages",
        error: getErrorMessage(error),
      });
    }
  });

  // Получение настроек веб-виджета для канала
  app.get("/api/web-widget/settings/:channelId", async (req, res) => {
    try {
      const { channelId } = req.params;

      if (!channelId) {
        return res.status(400).json({
          success: false,
          message: "Channel ID is required",
        });
      }

      // Получаем канал
      const channel = await storageInstance.getChannel(Number(channelId));
      if (!channel || channel.type !== "web") {
        return res.status(404).json({
          success: false,
          message: "Channel not found or not a web channel",
        });
      }

      // Получаем настройки канала, или используем дефолтные
      const settings = (channel.settings as Record<string, string>) || {};

      // Дефолтные настройки веб-виджета
      const defaultSettings = {
        siteName: "Мой сайт",
        widgetColor: "#3B82F6",
        widgetFontSize: "14px",
        widgetPosition: "bottom-right",
        widgetHeaderName: "Чат поддержки",
        widgetIcon: null as string | null,
      };

      // Возвращаем публичные настройки виджета, с подстановкой дефолтных значений
      res.json({
        success: true,
        settings: {
          siteName: settings.siteName || defaultSettings.siteName,
          widgetColor: settings.widgetColor || defaultSettings.widgetColor,
          widgetFontSize:
            settings.widgetFontSize || defaultSettings.widgetFontSize,
          widgetPosition:
            settings.widgetPosition || defaultSettings.widgetPosition,
          widgetHeaderName:
            settings.widgetHeaderName || defaultSettings.widgetHeaderName,
          widgetIcon: settings.widgetIcon || defaultSettings.widgetIcon,
        },
      });
    } catch (error) {
      console.error("[Web Widget API] Error fetching settings:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch settings",
        error: getErrorMessage(error),
      });
    }
  });

  // API для работы с реферальной системой

  // Получение пользователей по реферреру
  app.get(
    "/api/users/referrer/:referrerId",
    authenticateToken,
    async (req, res) => {
      try {
        const referrerId = parseInt(req.params.referrerId);
        if (isNaN(referrerId)) {
          return res.status(400).json({ message: "Invalid referrer ID" });
        }

        // Только админ, менеджер или сам реферрер может видеть список рефералов
        if (
          req.user.id !== referrerId &&
          req.user.role !== "admin" &&
          req.user.role !== "manager"
        ) {
          return res
            .status(403)
            .json({ message: "У вас нет прав для просмотра этих данных" });
        }

        const referrals = await storageInstance.listUsersByReferrer(referrerId);
        res.json(referrals);
      } catch (error) {
        console.error("Ошибка при получении списка рефералов:", error);
        res.status(500).json({
          message: "Не удалось получить список рефералов",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Получение пользователей без менеджера
  app.get("/api/users/no-manager", authenticateToken, async (req, res) => {
    try {
      // Только админы и менеджеры могут видеть список пользователей без менеджера
      if (req.user.role !== "admin" && req.user.role !== "manager") {
        return res
          .status(403)
          .json({ message: "У вас нет прав для просмотра этих данных" });
      }

      const users = await storageInstance.listUsersWithoutManager();
      res.json(users);
    } catch (error) {
      console.error(
        "Ошибка при получении списка пользователей без менеджера:",
        error
      );
      res.status(500).json({
        message: "Не удалось получить список пользователей без менеджера",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Получение пользователей по менеджеру
  app.get(
    "/api/users/manager/:managerId",
    authenticateToken,
    async (req, res) => {
      try {
        const managerId = parseInt(req.params.managerId);
        if (isNaN(managerId)) {
          return res.status(400).json({ message: "Invalid manager ID" });
        }

        // Только админ или сам менеджер может видеть список своих пользователей
        if (req.user.id !== managerId && req.user.role !== "admin") {
          return res
            .status(403)
            .json({ message: "У вас нет прав для просмотра этих данных" });
        }

        const users = await storageInstance.listUsersByManager(managerId);
        res.json(users);
      } catch (error) {
        console.error(
          "Ошибка при получении списка пользователей менеджера:",
          error
        );
        res.status(500).json({
          message: "Не удалось получить список пользователей менеджера",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Обновление пользователя
  app.patch("/api/users/:id", authenticateToken, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Проверяем права доступа - только админ или сам пользователь может обновлять свои данные
      if (req.user.id !== userId && req.user.role !== "admin") {
        return res.status(403).json({
          message: "У вас нет прав на изменение данных этого пользователя",
        });
      }

      const userData = insertUserSchema.partial().parse(req.body);
      const updatedUser = await storageInstance.updateUser(userId, userData);

      if (!updatedUser) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      // Если обновление выполнено другим пользователем (админом)
      if (req.user.id !== userId) {
        await storageInstance.createActivityLog({
          userId: req.user.id,
          action: "updated_user",
          details: { targetUserId: userId, changes: Object.keys(userData) },
        });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Ошибка при обновлении пользователя:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({
        message: "Не удалось обновить пользователя",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Генерация реферального кода
  app.post(
    "/api/users/:id/referral-code",
    authenticateToken,
    async (req, res) => {
      try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
          return res.status(400).json({ message: "Invalid user ID" });
        }

        // Только сам пользователь может сгенерировать свой реферальный код
        if (req.user.id !== userId) {
          return res
            .status(403)
            .json({ message: "У вас нет прав для выполнения этого действия" });
        }

        // Получаем пользователя
        const user = await storageInstance.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "Пользователь не найден" });
        }

        // Если у пользователя уже есть реферальный код, возвращаем его
        if (user.referralCode) {
          return res.json({ referralCode: user.referralCode, role: user.role });
        }

        // Генерируем новый реферальный код
        const referralCode = authService.generateReferralCode();

        // Обновляем роль пользователя на "referral", если она ещё не установлена
        const role = user.role === "user" ? "referral" : user.role;

        // Обновляем пользователя с новым кодом и ролью
        const updatedUser = await storageInstance.updateUser(userId, {
          referralCode,
          role,
        });

        // Логируем активность
        await storageInstance.createActivityLog({
          userId: req.user.id,
          action: "generated_referral_code",
          details: { referralCode },
        });

        res.json({ referralCode, role });
      } catch (error) {
        console.error("Ошибка при генерации реферального кода:", error);
        res.status(500).json({
          message: "Не удалось сгенерировать реферальный код",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Получение комиссии пользователя
  app.get(
    "/api/commission/:userId/:role",
    authenticateToken,
    async (req, res) => {
      try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
          return res.status(400).json({ message: "Invalid user ID" });
        }

        const role = req.params.role;
        if (role !== "referrer" && role !== "manager") {
          return res
            .status(400)
            .json({ message: "Invalid role, must be 'referrer' or 'manager'" });
        }

        // Только админ или сам пользователь может видеть свою комиссию
        if (req.user.id !== userId && req.user.role !== "admin") {
          return res
            .status(403)
            .json({ message: "У вас нет прав для просмотра этих данных" });
        }

        const totalCommission = await storageInstance.calculateTotalCommission(
          userId,
          role
        );
        res.json({ totalCommission });
      } catch (error) {
        console.error("Ошибка при получении комиссии:", error);
        res.status(500).json({
          message: "Не удалось получить комиссию",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Получение реферальных транзакций пользователя
  app.get(
    "/api/transactions/user/:userId",
    authenticateToken,
    async (req, res) => {
      try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
          return res.status(400).json({ message: "Invalid user ID" });
        }

        // Только админ или сам пользователь может видеть свои транзакции
        if (req.user.id !== userId && req.user.role !== "admin") {
          return res
            .status(403)
            .json({ message: "У вас нет прав для просмотра этих данных" });
        }

        const transactions =
          await storageInstance.listReferralTransactionsByUser(userId);
        res.json(transactions);
      } catch (error) {
        console.error("Ошибка при получении транзакций:", error);
        res.status(500).json({
          message: "Не удалось получить транзакции",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Получение реферальных транзакций, где пользователь является реферрером
  app.get(
    "/api/transactions/referrer/:referrerId",
    authenticateToken,
    async (req, res) => {
      try {
        const referrerId = parseInt(req.params.referrerId);
        if (isNaN(referrerId)) {
          return res.status(400).json({ message: "Invalid referrer ID" });
        }

        // Только админ или сам реферрер может видеть свои транзакции
        if (req.user.id !== referrerId && req.user.role !== "admin") {
          return res
            .status(403)
            .json({ message: "У вас нет прав для просмотра этих данных" });
        }

        const transactions =
          await storageInstance.listReferralTransactionsByReferrer(referrerId);
        res.json(transactions);
      } catch (error) {
        console.error("Ошибка при получении транзакций реферрера:", error);
        res.status(500).json({
          message: "Не удалось получить транзакции реферрера",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Получение реферальных транзакций, где пользователь является менеджером
  app.get(
    "/api/transactions/manager/:managerId",
    authenticateToken,
    async (req, res) => {
      try {
        const managerId = parseInt(req.params.managerId);
        if (isNaN(managerId)) {
          return res.status(400).json({ message: "Invalid manager ID" });
        }

        // Только админ или сам менеджер может видеть свои транзакции
        if (req.user.id !== managerId && req.user.role !== "admin") {
          return res
            .status(403)
            .json({ message: "У вас нет прав для просмотра этих данных" });
        }

        const transactions =
          await storageInstance.listReferralTransactionsByManager(managerId);
        res.json(transactions);
      } catch (error) {
        console.error("Ошибка при получении транзакций менеджера:", error);
        res.status(500).json({
          message: "Не удалось получить транзакции менеджера",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Создание новой реферальной транзакции (например, при оплате подписки)
  app.post("/api/transactions", authenticateToken, async (req, res) => {
    try {
      // Валидация данных
      const transactionData = insertReferralTransactionSchema.parse(req.body);

      // Проверяем права доступа - только админ может создавать транзакции
      if (req.user.role !== "admin") {
        return res
          .status(403)
          .json({ message: "У вас нет прав для создания транзакций" });
      }

      // Создаем транзакцию
      const transaction = await storageInstance.createReferralTransaction(
        transactionData
      );

      // Логируем активность
      await storageInstance.createActivityLog({
        userId: req.user.id,
        action: "created_referral_transaction",
        details: { transactionId: transaction.id, amount: transaction.amount },
      });

      res.status(201).json(transaction);
    } catch (error) {
      console.error("Ошибка при создании реферальной транзакции:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid transaction data", errors: error.errors });
      }
      res.status(500).json({
        message: "Не удалось создать реферальную транзакцию",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // === Платежи ЮKassa ===

  // Создание нового платежа
  app.post("/api/payments", authenticateToken, async (req, res) => {
    try {
      // Проверка, что запрос содержит сумму платежа
      const { amount } = req.body;
      if (!amount || typeof amount !== "number" || amount <= 0) {
        return res
          .status(400)
          .json({ message: "Необходимо указать положительную сумму платежа" });
      }

      // Проверка наличия email у пользователя
      const user = await storageInstance.getUser(req.user.id);
      if (!user || !user.email) {
        return res.status(400).json({
          message: "Для пополнения баланса необходимо указать email в профиле",
        });
      }

      // Формируем URL для возврата после оплаты
      const baseUrl = process.env.PUBLIC_URL || "http://localhost:5000";
      const returnUrl = `${baseUrl}/dashboard?payment=success`;

      // Создаем платеж в базе данных сначала
      const dbPayment = await storageInstance.createPayment({
        userId: req.user.id,
        amount: amount, // Используем сумму платежа в копейках
        status: "pending",
        description: `Пополнение баланса на ${Math.floor(amount / 100)} руб.`,
      });

      // Создаем платеж в ЮKassa с добавлением email пользователя для чека
      const paymentData = await yookassaService.createPayment({
        amount: amount, // Сумма в копейках
        description: `Пополнение баланса на ${Math.floor(amount / 100)} руб.`,
        returnUrl,
        metadata: {
          paymentId: dbPayment.id,
          userId: req.user.id,
        },
        email: user.email, // Передаем email пользователя для чека
      });

      // Обновляем информацию о платеже в нашей базе
      const updatedPayment = await storageInstance.updatePayment(dbPayment.id, {
        paymentId: paymentData.id,
        status: yookassaService.mapPaymentStatus(paymentData.status),
        paymentUrl: paymentData.confirmation.confirmation_url,
      });

      // Логируем активность
      await storageInstance.createActivityLog({
        userId: req.user.id,
        action: "payment_created",
        details: {
          paymentId: dbPayment.id,
          amount: amount,
          yookassaPaymentId: paymentData.id,
        },
      });

      // Возвращаем информацию о платеже
      if (updatedPayment) {
        res.status(201).json({
          id: updatedPayment.id,
          amount: updatedPayment.amount,
          status: updatedPayment.status,
          paymentUrl: updatedPayment.paymentUrl, // URL для перехода к оплате
        });
      } else {
        // На случай если обновление не прошло успешно
        res.status(201).json({
          id: dbPayment.id,
          amount: dbPayment.amount,
          status: "pending",
          paymentUrl: paymentData.confirmation.confirmation_url,
        });
      }
    } catch (error) {
      console.error("Ошибка при создании платежа:", error);
      res.status(500).json({
        message: "Не удалось создать платеж",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Получение списка платежей пользователя (обратная совместимость)
  app.get("/api/payments", authenticateToken, async (req, res) => {
    try {
      const payments = await storageInstance.listPaymentsByUser(req.user.id);
      res.json(payments);
    } catch (error) {
      console.error("Ошибка при получении списка платежей:", error);
      res.status(500).json({
        message: "Не удалось получить список платежей",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Получение платежей конкретного пользователя с пагинацией
  app.get("/api/payments/user/:userId", authenticateToken, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;

      // Проверяем права доступа (только свои платежи или администратор)
      if (req.user.id !== userId && req.user.role !== "admin") {
        console.log(
          `❌ [SERVER] Доступ запрещен: user ${req.user.id} (роль: ${req.user.role}) пытается получить платежи user ${userId}`
        );
        return res.status(403).json({
          message:
            "Недостаточно прав для просмотра платежей другого пользователя",
        });
      }

      const payments = await storageInstance.listPaymentsByUser(userId);

      // Сортируем платежи по дате (новые сначала)
      const sortedPayments = payments.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Применяем пагинацию
      const totalPayments = sortedPayments.length;
      const paginatedPayments = sortedPayments.slice(offset, offset + limit);
      const hasMore = offset + limit < totalPayments;

      const response = {
        payments: paginatedPayments,
        totalCount: totalPayments,
        hasMore,
        currentOffset: offset,
        limit,
      };

      res.json(response);
    } catch (error) {
      console.error(
        `❌ [SERVER] ОШИБКА при получении платежей пользователя ${req.params.userId}:`,
        error
      );
      res.status(500).json({
        message: "Не удалось получить список платежей",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Получение информации о конкретном платеже
  app.get("/api/payments/:id", authenticateToken, async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      if (isNaN(paymentId)) {
        return res.status(400).json({ message: "Некорректный ID платежа" });
      }

      const payment = await storageInstance.getPayment(paymentId);

      // Проверка, что платеж существует и принадлежит текущему пользователю или пользователь - админ
      if (!payment) {
        return res.status(404).json({ message: "Платеж не найден" });
      }

      if (payment.userId !== req.user.id && req.user.role !== "admin") {
        return res
          .status(403)
          .json({ message: "У вас нет прав для доступа к этому платежу" });
      }

      // Если платеж находится в статусе "pending", проверяем его статус в ЮKassa
      if (payment.status === "pending" && payment.paymentId) {
        try {
          console.log(
            `Проверка статуса платежа ${payment.id} (внешний ID: ${payment.paymentId}) в ЮKassa`
          );
          const yookassaPayment = await yookassaService.getPayment(
            payment.paymentId
          );
          console.log(
            `Получен ответ от ЮKassa для платежа ${payment.id}, статус: ${yookassaPayment.status}`
          );

          // Если статус изменился, обновляем его в нашей базе
          if (
            yookassaService.mapPaymentStatus(yookassaPayment.status) !==
            payment.status
          ) {
            const newStatus = yookassaService.mapPaymentStatus(
              yookassaPayment.status
            );
            console.log(
              `Статус платежа ${payment.id} изменился с ${payment.status} на ${newStatus}`
            );

            // Обновляем платеж в базе
            const updatedPayment = await storageInstance.updatePayment(
              paymentId,
              {
                status: newStatus,
                completedAt: newStatus === "succeeded" ? new Date() : undefined,
              }
            );

            console.log(
              `Платеж ${payment.id} обновлен в базе, новый статус: ${
                updatedPayment?.status || "не определен"
              }`
            );

            // Если платеж завершен успешно, обновляем баланс пользователя
            if (newStatus === "succeeded") {
              console.log(
                `Платеж ${payment.id} успешно завершен, обновляем баланс пользователя ${payment.userId} на сумму ${payment.amount} рублей`
              );

              try {
                const updatedUser = await storageInstance.updateUserBalance(
                  payment.userId,
                  payment.amount
                );
                console.log(
                  `Баланс пользователя ${
                    payment.userId
                  } обновлен, новый баланс: ${
                    updatedUser?.balance || "не определен"
                  }`
                );

                // Выводим дополнительную диагностику о пользователе и его реферере
                const user = await storageInstance.getUser(payment.userId);
                console.log(
                  `ДИАГНОСТИКА ПЛАТЕЖЕЙ (GET payments/:id): Информация о пользователе ${payment.userId}:`,
                  JSON.stringify(
                    {
                      id: user?.id,
                      email: user?.email,
                      referrerId: user?.referrerId,
                      balance: user?.balance,
                    },
                    null,
                    2
                  )
                );

                if (user?.referrerId) {
                  const referrer = await storageInstance.getUser(
                    user.referrerId
                  );
                  console.log(
                    `ДИАГНОСТИКА ПЛАТЕЖЕЙ (GET payments/:id): Информация о реферере ${user.referrerId}:`,
                    JSON.stringify(
                      {
                        id: referrer?.id,
                        email: referrer?.email,
                        balance: referrer?.balance,
                      },
                      null,
                      2
                    )
                  );
                }

                // Обрабатываем реферальные вознаграждения
                try {
                  console.log(
                    `ДИАГНОСТИКА ПЛАТЕЖЕЙ (GET payments/:id): Начинаем обработку реферальных вознаграждений для пользователя ${payment.userId} на сумму ${payment.amount}`
                  );
                  await processReferralPaymentRewardV2(
                    payment.userId,
                    payment.amount
                  );
                  console.log(
                    `ДИАГНОСТИКА ПЛАТЕЖЕЙ (GET payments/:id): Реферальные вознаграждения за платеж #${payment.id} обработаны`
                  );
                } catch (refErr) {
                  console.error(
                    `ДИАГНОСТИКА ПЛАТЕЖЕЙ (GET payments/:id): Ошибка при обработке реферальных вознаграждений:`,
                    refErr
                  );
                }
              } catch (err) {
                console.error(
                  `Ошибка при обновлении баланса пользователя ${payment.userId}:`,
                  err
                );
              }

              // Логируем активность
              await storageInstance.createActivityLog({
                userId: payment.userId,
                action: "payment_succeeded",
                details: {
                  paymentId: payment.id,
                  amount: payment.amount,
                },
              });
            }

            return res.json(updatedPayment);
          } else {
            console.log(
              `Статус платежа ${payment.id} не изменился: ${payment.status}`
            );
          }
        } catch (error) {
          console.error("Ошибка при проверке статуса платежа в ЮKassa:", error);
          // Если не удалось проверить статус в ЮKassa, возвращаем текущий статус из базы
        }
      }

      res.json(payment);
    } catch (error) {
      console.error("Ошибка при получении информации о платеже:", error);
      res.status(500).json({
        message: "Не удалось получить информацию о платеже",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Проверка статуса платежа по внешнему ID (для возврата с платежной страницы)
  app.get(
    "/api/payments/external/:paymentId",
    authenticateToken,
    async (req, res) => {
      try {
        // Получаем внешний ID платежа из URL
        const externalPaymentId = req.params.paymentId;

        if (!externalPaymentId) {
          console.error("ДИАГНОСТИКА ПЛАТЕЖЕЙ: Не указан ID платежа в запросе");
          return res.status(400).json({ message: "Не указан ID платежа" });
        }

        console.log(
          `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Запрос на проверку статуса платежа ЮKassa с внешним ID: ${externalPaymentId}, пользователь: ${req.user.id}`
        );

        // Ищем платеж по внешнему ID
        let payment = null;

        try {
          payment = await storageInstance.getPaymentByExternalId(
            externalPaymentId
          );
          console.log(
            `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Результат поиска платежа по внешнему ID:`,
            payment ? "Найден" : "Не найден"
          );
        } catch (err) {
          console.error(
            `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Ошибка при поиске платежа по внешнему ID:`,
            err
          );
        }

        if (!payment) {
          console.log(
            `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Платеж с внешним ID ${externalPaymentId} не найден в базе`
          );

          // Дополнительная проверка всех платежей для диагностики
          const allPayments = await storageInstance.listPaymentsByUser(
            req.user.id
          );
          console.log(
            `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Все платежи пользователя (${allPayments.length}):`
          );
          allPayments.forEach((p) =>
            console.log(
              `  - ID: ${p.id}, ExternalID: ${p.paymentId}, Status: ${p.status}, Amount: ${p.amount}`
            )
          );

          return res.status(404).json({
            message: "Платеж не найден",
            diagnostic: {
              searchedId: externalPaymentId,
              userPayments: allPayments.map((p) => ({
                id: p.id,
                externalId: p.paymentId,
                status: p.status,
              })),
            },
          });
        }

        console.log(
          `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Найден платеж #${payment.id} с внешним ID ${externalPaymentId}, статус: ${payment.status}`
        );

        // Проверяем права доступа: только владелец платежа или админ
        if (payment.userId !== req.user.id && req.user.role !== "admin") {
          console.error(
            `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Ошибка доступа, пользователь ${req.user.id} пытается получить доступ к платежу пользователя ${payment.userId}`
          );
          return res
            .status(403)
            .json({ message: "У вас нет прав для доступа к этому платежу" });
        }

        // Проверяем текущий баланс пользователя до обновления
        const userBefore = await storageInstance.getUser(req.user.id);
        console.log(
          `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Текущий баланс пользователя ${
            req.user.id
          } ДО обновления: ${userBefore?.balance || 0}`
        );

        // Если платеж уже успешно завершен, возвращаем результат
        if (payment.status === "succeeded") {
          console.log(
            `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Платеж #${payment.id} уже имеет статус succeeded`
          );

          // Проверяем, был ли обновлен баланс
          if (userBefore && payment.amount > 0) {
            console.log(
              `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Платеж уже был успешно завершен, но проверим баланс на всякий случай`
            );

            // Повторно обновим баланс для подстраховки
            try {
              const updatedUser = await storageInstance.updateUserBalance(
                payment.userId,
                payment.amount
              );
              console.log(
                `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Повторное обновление баланса, новый баланс: ${
                  updatedUser?.balance || "не определен"
                }`
              );

              // Обрабатываем реферальные вознаграждения
              try {
                console.log(
                  `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Повторная обработка реферальных вознаграждений для пользователя ${payment.userId} на сумму ${payment.amount}`
                );
                await processReferralPaymentRewardV2(
                  payment.userId,
                  payment.amount
                );
                console.log(
                  `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Реферальные вознаграждения за платеж #${payment.id} обработаны повторно`
                );
              } catch (refErr) {
                console.error(
                  `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Ошибка при повторной обработке реферальных вознаграждений:`,
                  refErr
                );
              }
            } catch (err) {
              console.error(
                `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Ошибка при повторном обновлении баланса:`,
                err
              );
            }
          }

          return res.json({
            success: true,
            payment,
            diagnostics: {
              balanceBefore: userBefore?.balance || 0,
              paymentAmount: payment.amount,
            },
          });
        }

        // Проверяем статус платежа в ЮKassa
        try {
          console.log(
            `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Запрос статуса платежа ${externalPaymentId} в ЮKassa API`
          );
          const yookassaPayment = await yookassaService.getPayment(
            externalPaymentId
          );

          console.log(
            `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Ответ от ЮKassa API:`,
            yookassaPayment
          );
          const newStatus = yookassaService.mapPaymentStatus(
            yookassaPayment.status
          );

          console.log(
            `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Получен статус платежа ${externalPaymentId} от ЮKassa: ${yookassaPayment.status} -> ${newStatus}`
          );

          // Если статус изменился, обновляем его в нашей базе
          if (newStatus !== payment.status) {
            console.log(
              `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Обновляем статус платежа #${payment.id} с ${payment.status} на ${newStatus}`
            );

            const updatedPayment = await storageInstance.updatePayment(
              payment.id,
              {
                status: newStatus,
                completedAt: newStatus === "succeeded" ? new Date() : undefined,
              }
            );

            console.log(
              `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Платеж #${payment.id} обновлен в базе`
            );

            // Если платеж завершен успешно, обновляем баланс пользователя
            if (newStatus === "succeeded") {
              console.log(
                `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Платеж #${
                  payment.id
                } успешно завершен, обновляем баланс пользователя ${
                  payment.userId
                } на сумму ${Math.floor(payment.amount / 100)} руб.`
              );

              try {
                const updatedUser = await storageInstance.updateUserBalance(
                  payment.userId,
                  payment.amount
                );
                console.log(
                  `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Баланс пользователя ${
                    payment.userId
                  } обновлен, новый баланс: ${
                    updatedUser?.balance || "не определен"
                  }`
                );

                // Проверяем, действительно ли обновлен баланс
                const userAfter = await storageInstance.getUser(payment.userId);
                console.log(
                  `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Баланс ПОСЛЕ обновления: ${
                    userAfter?.balance || 0
                  }, ожидаемый: ${(userBefore?.balance || 0) + payment.amount}`
                );

                // Логируем активность
                await storageInstance.createActivityLog({
                  userId: payment.userId,
                  action: "payment_succeeded",
                  details: {
                    paymentId: payment.id,
                    amount: payment.amount,
                    via: "return_url",
                    balanceBefore: userBefore?.balance || 0,
                    balanceAfter: userAfter?.balance || 0,
                  },
                });

                // Обрабатываем реферальные вознаграждения
                try {
                  await processReferralPaymentRewardV2(
                    payment.userId,
                    payment.amount
                  );
                  console.log(
                    `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Реферальные вознаграждения за платеж #${payment.id} обработаны`
                  );
                } catch (refErr) {
                  console.error(
                    `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Ошибка при обработке реферальных вознаграждений:`,
                    refErr
                  );
                }
              } catch (err) {
                console.error(
                  `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Ошибка при обновлении баланса пользователя ${payment.userId}:`,
                  err
                );
              }

              // Повторно получаем обновленный платеж из базы
              const finalPayment = await storageInstance.getPayment(payment.id);
              const finalUser = await storageInstance.getUser(payment.userId);

              return res.json({
                success: true,
                payment: finalPayment,
                diagnostics: {
                  balanceBefore: userBefore?.balance || 0,
                  balanceAfter: finalUser?.balance || 0,
                  paymentAmount: payment.amount,
                },
              });
            }

            return res.json({ success: true, payment: updatedPayment });
          } else {
            console.log(
              `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Статус платежа не изменился: ${payment.status}`
            );
            return res.json({ success: true, payment });
          }
        } catch (error) {
          console.error(
            `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Ошибка при проверке статуса платежа в ЮKassa:`,
            error
          );
          return res.status(500).json({
            message: "Ошибка при проверке статуса платежа",
            error: error instanceof Error ? error.message : String(error),
          });
        }
      } catch (error) {
        console.error(
          "ДИАГНОСТИКА ПЛАТЕЖЕЙ: Общая ошибка при проверке статуса платежа:",
          error
        );
        res.status(500).json({
          message: "Не удалось проверить статус платежа",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Вебхук для уведомлений от ЮKassa
  app.post("/api/payments/webhook", async (req, res) => {
    try {
      const signature = req.headers["x-request-signature"] as string;
      if (!signature) {
        console.error("Получен запрос без подписи");
        return res.status(400).json({ message: "Отсутствует подпись запроса" });
      }

      // Проверяем подпись и обрабатываем уведомление
      const yookassaPayment = yookassaService.processNotification(
        req.body,
        signature
      );
      if (!yookassaPayment) {
        console.error("Недействительная подпись запроса");
        return res
          .status(400)
          .json({ message: "Недействительная подпись запроса" });
      }

      console.log("Получено уведомление от ЮKassa:", yookassaPayment);

      // Получаем ID платежа из метаданных
      const paymentId = req.body.object.metadata?.paymentId;
      if (!paymentId) {
        console.error("ID платежа отсутствует в метаданных");
        return res
          .status(400)
          .json({ message: "ID платежа отсутствует в метаданных" });
      }

      // Находим платеж в нашей базе
      const payment = await storageInstance.getPayment(parseInt(paymentId));
      if (!payment) {
        console.error(`Платеж с ID ${paymentId} не найден в базе`);
        return res.status(404).json({ message: "Платеж не найден" });
      }

      // Обновляем статус платежа
      const newStatus = yookassaService.mapPaymentStatus(
        yookassaPayment.status
      );
      const updatedPayment = await storageInstance.updatePayment(payment.id, {
        status: newStatus,
        completedAt: newStatus === "succeeded" ? new Date() : undefined,
      });

      // Если платеж успешно завершен, обновляем баланс пользователя
      if (newStatus === "succeeded") {
        console.log(
          `Вебхук: Платеж ${payment.id} успешно завершен, обновляем баланс пользователя ${payment.userId} на сумму ${payment.amount} рублей`
        );

        try {
          const updatedUser = await storageInstance.updateUserBalance(
            payment.userId,
            payment.amount
          );
          console.log(
            `Вебхук: Баланс пользователя ${
              payment.userId
            } обновлен, новый баланс: ${updatedUser?.balance || "не определен"}`
          );

          // Выводим дополнительную диагностику о пользователе и его реферере
          const user = await storageInstance.getUser(payment.userId);
          console.log(
            `Вебхук: Подробная информация о пользователе ${payment.userId}:`,
            JSON.stringify(
              {
                id: user?.id,
                email: user?.email,
                referrerId: user?.referrerId,
                balance: user?.balance,
              },
              null,
              2
            )
          );

          if (user?.referrerId) {
            const referrer = await storageInstance.getUser(user.referrerId);
            console.log(
              `Вебхук: Подробная информация о реферере ${user.referrerId}:`,
              JSON.stringify(
                {
                  id: referrer?.id,
                  email: referrer?.email,
                  balance: referrer?.balance,
                },
                null,
                2
              )
            );
          }
        } catch (err) {
          console.error(
            `Вебхук: Ошибка при обновлении баланса пользователя ${payment.userId}:`,
            err
          );
        }

        // Логируем активность
        await storageInstance.createActivityLog({
          userId: payment.userId,
          action: "payment_succeeded",
          details: {
            paymentId: payment.id,
            amount: payment.amount,
            via: "webhook",
          },
        });

        // Обрабатываем реферальные вознаграждения
        try {
          console.log(
            `Вебхук: Начинаем обработку реферальных вознаграждений для пользователя ${payment.userId} на сумму ${payment.amount}`
          );
          await processReferralPaymentRewardV2(payment.userId, payment.amount);
          console.log(
            `Вебхук: Реферальные вознаграждения за платеж #${payment.id} обработаны (новый метод)`
          );
        } catch (refErr) {
          console.error(
            `Вебхук: Ошибка при обработке реферальных вознаграждений:`,
            refErr
          );
        }
      }

      // Возвращаем 200 OK, чтобы ЮKassa знала, что уведомление обработано
      res.status(200).json({ message: "Уведомление обработано успешно" });
    } catch (error) {
      console.error("Ошибка при обработке вебхука от ЮKassa:", error);
      res.status(500).json({
        message: "Ошибка при обработке уведомления",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Получение текущего баланса пользователя (старый метод для обратной совместимости)
  app.get("/api/balance", authenticateToken, async (req, res) => {
    try {
      console.log(`Запрос баланса для пользователя ${req.user.id}`);
      const user = await storageInstance.getUser(req.user.id);

      if (!user) {
        console.error(`Пользователь с ID ${req.user.id} не найден`);
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      const balance = user.balance || 0;
      console.log(`Текущий баланс пользователя ${req.user.id}: ${balance}`);

      res.json({ balance });
    } catch (error) {
      console.error("Ошибка при получении баланса:", error);
      res.status(500).json({
        message: "Не удалось получить баланс",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Получение баланса конкретного пользователя
  app.get("/api/balance/:userId", authenticateToken, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);

      // Проверяем, что запрашивающий пользователь имеет доступ к данному балансу
      // (либо это его собственный баланс, либо он администратор)
      if (req.user.id !== userId && req.user.role !== "admin") {
        return res.status(403).json({
          message:
            "Недостаточно прав для просмотра баланса другого пользователя",
        });
      }

      const user = await storageInstance.getUser(userId);

      if (!user) {
        console.error(`Пользователь с ID ${userId} не найден`);
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      const balance = user.balance || 0;
      console.log(`Текущий баланс пользователя ${userId}: ${balance}`);

      res.json({ balance });
    } catch (error) {
      console.error(`Ошибка при получении баланса: ${error}`);
      res.status(500).json({
        message: "Не удалось получить баланс",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Получение стоимости тарифа (в копейках)
  // Кэш для тарифных планов, чтобы не делать запрос к БД каждый раз
  let tariffPlansCache: Record<string, any> = {};
  let tariffPlansCacheTime = 0;

  /**
   * Получает список тарифных планов из базы данных или кэша
   */
  async function getTariffPlans() {
    // Обновление кэша раз в 5 минут
    const now = Date.now();
    if (
      now - tariffPlansCacheTime > 5 * 60 * 1000 ||
      Object.keys(tariffPlansCache).length === 0
    ) {
      try {
        const plans = await db
          .select()
          .from(tariffPlans)
          .where(eq(tariffPlans.active, true));
        tariffPlansCache = {};

        for (const plan of plans) {
          tariffPlansCache[plan.id] = plan;
        }

        tariffPlansCacheTime = now;
        console.log(
          `Обновлен кэш тарифных планов: ${Object.keys(tariffPlansCache).join(
            ", "
          )}`
        );
      } catch (error) {
        console.error("Ошибка при получении тарифных планов:", error);
      }
    }

    return Object.values(tariffPlansCache);
  }

  /**
   * Получает цену тарифа из базы данных или кэша
   * @param tariffId ID тарифного плана
   * @returns Цена тарифа в копейках
   */
  async function getTariffPrice(tariffId: string): Promise<number> {
    // Получаем все тарифные планы
    await getTariffPlans();

    // Если план найден в кэше, возвращаем его цену
    if (tariffPlansCache[tariffId]) {
      // Убедимся, что возвращаем числовое значение
      const price = tariffPlansCache[tariffId].price;
      if (typeof price === "number") {
        return price;
      } else if (typeof price === "string") {
        return parseInt(price, 10) || 0;
      }
    }

    // Если план не найден, возвращаем значение по умолчанию
    switch (tariffId) {
      case "basic":
        return 290000; // 2 900 руб.
      case "standart":
        return 690000; // 6 900 руб.
      case "enterprise":
        return 1490000; // 14 900 руб.
      default:
        return 0;
    }
  }

  // Endpoint для получения всех активных тарифных планов
  app.get("/api/tariff-plans", async (req, res) => {
    try {
      const plans = await getTariffPlans();
      res.json({
        success: true,
        plans: plans,
      });
    } catch (error) {
      console.error("Ошибка при получении тарифных планов:", error);
      res.status(500).json({
        success: false,
        message: "Не удалось получить список тарифных планов",
      });
    }
  });

  // Endpoint для получения конкретного тарифного плана по ID
  app.get("/api/tariff-plans/:planId", async (req, res) => {
    try {
      const planId = req.params.planId;

      // Получаем все тарифные планы
      await getTariffPlans();

      // Ищем запрашиваемый план в кэше
      const plan = tariffPlansCache[planId];

      if (!plan) {
        return res.status(404).json({
          success: false,
          message: "Тарифный план не найден",
        });
      }

      res.json({
        success: true,
        plan: plan,
      });
    } catch (error) {
      console.error(
        `Ошибка при получении тарифного плана ${req.params.planId}:`,
        error
      );
      res.status(500).json({
        success: false,
        message: "Не удалось получить информацию о тарифном плане",
      });
    }
  });

  // Принудительное обновление баланса по последним платежам (обратная совместимость)
  // Получение информации об использовании ресурсов
  app.get("/api/usage/:userId", authenticateToken, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);

      // Проверяем, имеет ли пользователь право на просмотр использования
      if (req.user.id !== userId && req.user.role !== "admin") {
        return res.status(403).json({
          message:
            "Недостаточно прав для просмотра использования ресурсов другого пользователя",
        });
      }

      console.log(`Запрос данных использования для пользователя ${userId}`);

      // Получаем данные пользователя
      const user = await storageInstance.getUser(userId);
      if (!user) {
        console.error(`Пользователь с ID ${userId} не найден`);
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      // Определяем стандартные лимиты на основе текущего тарифа пользователя
      let messageLimits = 1000; // Базовый тариф по умолчанию
      let knowledgeLimit = 0.5; // 500 МБ по умолчанию
      let callMinutesLimit = 0; // 0 минут по умолчанию
      let usersLimit = 2; // 2 пользователя по умолчанию
      let assistantsLimit = 1; // 1 ассистент по умолчанию
      let channelsLimit = 2; // 2 канала по умолчанию
      let apiCallsLimit = 0; // API-вызовы недоступны в базовом тарифе
      let smsLimit = 0; // SMS недоступны в базовом тарифе

      // Устанавливаем лимиты в зависимости от тарифа пользователя
      if (user.plan === "standart") {
        messageLimits = 5000;
        knowledgeLimit = 2; // 2 ГБ
        callMinutesLimit = 100;
        smsLimit = 200;
        usersLimit = 5;
        assistantsLimit = 5;
        channelsLimit = 5;
        apiCallsLimit = 1000;
      } else if (user.plan === "enterprise") {
        messageLimits = 20000;
        knowledgeLimit = 10; // 10 ГБ
        callMinutesLimit = 1000;
        smsLimit = 1000;
        usersLimit = 999; // Неограниченное количество пользователей
        assistantsLimit = 999;
        channelsLimit = 10;
        apiCallsLimit = 10000;
      }

      // Если пользователь не имеет тарифа, возвращаем информацию с 0 в полях used
      if (!user.plan || user.plan === "free") {
        return res.json({
          noPlan: true,
          messages: { used: 0, limit: messageLimits, percentage: 0 },
          knowledge: { used: 0, limit: knowledgeLimit, percentage: 0 },
          callMinutes: { used: 0, limit: callMinutesLimit, percentage: 0 },
          users: { used: 0, limit: usersLimit, percentage: 0 },
          assistants: { used: 0, limit: assistantsLimit, percentage: 0 },
          channels: { used: 0, limit: channelsLimit, percentage: 0 },
          apiCalls: { used: 0, limit: apiCallsLimit, percentage: 0 },
          smsMessages: { used: 0, limit: smsLimit, percentage: 0 },
          nextReset: new Date(new Date().setMonth(new Date().getMonth() + 1))
            .toISOString()
            .split("T")[0],
        });
      }

      // Получаем реальное количество активных ассистентов пользователя (исключая удаленные)
      const assistantsResult = await pgPool.query(
        `SELECT COUNT(*) as count FROM assistants 
         WHERE created_by = $1 AND (status IS NULL OR status != 'deleted')`,
        [userId]
      );
      const assistantsUsed = parseInt(
        assistantsResult.rows[0]?.count || "0",
        10
      );
      console.log(
        `Реальное количество ассистентов для пользователя ${userId}: ${assistantsUsed}`
      );

      // Получаем реальное количество активных каналов пользователя
      const channelsResult = await pgPool.query(
        `SELECT COUNT(*) as count FROM channels 
         WHERE created_by = $1 AND (status IS NULL OR status != 'deleted')`,
        [userId]
      );
      const channelsUsed = parseInt(channelsResult.rows[0]?.count || "0", 10);
      console.log(
        `Реальное количество каналов для пользователя ${userId}: ${channelsUsed}`
      );

      // Получаем данные использования из базы данных
      const planUsageQuery = `
        SELECT * FROM user_plan_usage 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 1
      `;

      const planUsageResult = await pgPool.query(planUsageQuery, [userId]);
      let planUsage = planUsageResult.rows[0];

      // Если у пользователя нет записи использования в базе, создаем её
      if (!planUsage) {
        // Генерируем данные об использовании на основе текущего тарифа
        const insertQuery = `
          INSERT INTO user_plan_usage (
            user_id, plan, 
            messages_used, messages_limit, 
            knowledge_used, knowledge_limit, 
            call_minutes_used, call_minutes_limit,
            sms_used, sms_limit,
            users_used, users_limit,
            assistants_used, assistants_limit,
            channels_used, channels_limit,
            api_calls_used, api_calls_limit,
            next_reset
          ) VALUES (
            $1, $2, 
            $3, $4, 
            $5, $6, 
            $7, $8,
            $9, $10,
            $11, $12,
            $13, $14,
            $15, $16,
            $17, $18,
            (CURRENT_DATE + INTERVAL '1 month')
          ) RETURNING *
        `;

        // Для остальных метрик пока используем рассчитываемые значения,
        // в будущем их можно будет также заменить на реальные показатели
        const messagesUsed = 0;

        // Получаем суммарный размер файлов пользователя в ГБ
        const filesSizeResult = await pgPool.query(
          `
          SELECT COALESCE(SUM(file_size), 0) as total_size 
          FROM knowledge_items 
          WHERE uploaded_by = $1
        `,
          [userId]
        );
        const knowledgeUsed = parseFloat(
          (filesSizeResult.rows[0].total_size / (1024 * 1024 * 1024)).toFixed(2)
        ); // Конвертируем байты в ГБ

        const callMinutesUsed = 0;
        const smsUsed = 0;
        const usersUsed = 1;
        const channelsUsed = 0;
        const apiCallsUsed = 0;

        const insertResult = await pgPool.query(insertQuery, [
          userId,
          user.plan,
          messagesUsed,
          messageLimits,
          knowledgeUsed,
          knowledgeLimit,
          callMinutesUsed,
          callMinutesLimit,
          smsUsed,
          smsLimit,
          usersUsed,
          usersLimit,
          assistantsUsed,
          assistantsLimit,
          channelsUsed,
          channelsLimit,
          apiCallsUsed,
          apiCallsLimit,
        ]);

        planUsage = insertResult.rows[0];
      } else if (
        planUsage.assistants_used !== assistantsUsed ||
        planUsage.channels_used !== channelsUsed
      ) {
        // Обновляем существующую запись, если количество ассистентов или каналов изменилось
        if (planUsage.assistants_used !== assistantsUsed) {
          console.log(
            `Обновляем количество ассистентов в базе: было ${planUsage.assistants_used}, стало ${assistantsUsed}`
          );
        }

        if (planUsage.channels_used !== channelsUsed) {
          console.log(
            `Обновляем количество каналов в базе: было ${planUsage.channels_used}, стало ${channelsUsed}`
          );
        }

        const updateQuery = `
          UPDATE user_plan_usage 
          SET assistants_used = $1, channels_used = $2
          WHERE id = $3
          RETURNING *
        `;

        const updateResult = await pgPool.query(updateQuery, [
          assistantsUsed,
          channelsUsed,
          planUsage.id,
        ]);

        planUsage = updateResult.rows[0];
      }

      // Формируем ответ на основе данных использования
      const response = {
        messages: {
          used: planUsage.messages_used,
          limit: planUsage.messages_limit,
          percentage: Math.round(
            (planUsage.messages_used / planUsage.messages_limit) * 100
          ),
        },
        knowledge: {
          used: parseFloat(planUsage.knowledge_used),
          limit: parseFloat(planUsage.knowledge_limit),
          percentage: Math.round(
            (parseFloat(planUsage.knowledge_used) /
              parseFloat(planUsage.knowledge_limit)) *
              100
          ),
        },
        callMinutes: {
          used: planUsage.call_minutes_used,
          limit: planUsage.call_minutes_limit,
          percentage:
            planUsage.call_minutes_limit > 0
              ? Math.round(
                  (planUsage.call_minutes_used / planUsage.call_minutes_limit) *
                    100
                )
              : 0,
        },
        users: {
          used: planUsage.users_used,
          limit: planUsage.users_limit,
          percentage: Math.round(
            (planUsage.users_used / planUsage.users_limit) * 100
          ),
        },
        assistants: {
          used: planUsage.assistants_used,
          limit: planUsage.assistants_limit,
          percentage: Math.round(
            (planUsage.assistants_used / planUsage.assistants_limit) * 100
          ),
        },
        channels: {
          used: planUsage.channels_used,
          limit: planUsage.channels_limit,
          percentage: Math.round(
            (planUsage.channels_used / planUsage.channels_limit) * 100
          ),
        },
        apiCalls: {
          used: planUsage.api_calls_used,
          limit: planUsage.api_calls_limit,
          percentage:
            planUsage.api_calls_limit > 0
              ? Math.round(
                  (planUsage.api_calls_used / planUsage.api_calls_limit) * 100
                )
              : 0,
        },
        smsMessages: {
          used: planUsage.sms_used,
          limit: planUsage.sms_limit,
          percentage:
            planUsage.sms_limit > 0
              ? Math.round((planUsage.sms_used / planUsage.sms_limit) * 100)
              : 0,
        },
        nextReset: planUsage.next_reset,
      };

      console.log(`Данные использования для пользователя ${userId}:`, response);
      res.json(response);
    } catch (error) {
      console.error(
        `Ошибка при получении информации об использовании: ${error}`
      );
      res.status(500).json({
        message: "Не удалось получить информацию об использовании",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Подключение тарифа для пользователя
  // API для активации пробного периода
  app.post("/api/user/activate-trial", authenticateToken, async (req, res) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "Не указан ID пользователя" });
      }

      // Получаем информацию о пользователе
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      // Проверяем, не использовал ли пользователь пробный период ранее
      if (user.trialUsed) {
        return res
          .status(400)
          .json({ message: "Пробный период уже был использован" });
      }

      // Проверяем, не активирован ли уже платный тариф
      if (user.plan !== "free") {
        return res
          .status(400)
          .json({ message: "У вас уже подключен платный тариф" });
      }

      // Вычисляем дату окончания пробного периода (14 дней)
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 14);

      // Устанавливаем тариф "basic" и отмечаем, что пробный период был использован
      await storage.updateUser(userId, {
        plan: "basic",
        trialUsed: true,
        trialEndDate,
      });

      // Создаем или обновляем запись использования тарифа
      await updateOrCreateUserPlanUsage(userId, "basic");

      // Логируем активность
      await storage.createActivityLog({
        userId,
        action: "trial_activated",
        details: {
          oldPlan: user.plan,
          newPlan: "basic",
          trialEndDate,
        },
      });

      return res.json({
        success: true,
        message: "Пробный период успешно активирован",
        trialEndDate,
      });
    } catch (error) {
      console.error("Ошибка при активации пробного периода:", error);
      return res.status(500).json({
        message: "Ошибка сервера при активации пробного периода",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.post("/api/user/plan", authenticateToken, async (req, res) => {
    try {
      const { userId, planId, amount: newPlanAmount } = req.body;

      // Проверяем, имеет ли пользователь право на выполнение операции
      if (req.user.id !== userId && req.user.role !== "admin") {
        return res.status(403).json({
          message: "Нет прав для изменения тарифа другого пользователя",
        });
      }

      // Проверяем, существует ли пользователь
      const user = await storageInstance.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      // Получаем текущую дату
      const today = new Date();

      // Проверяем, если пользователь уже имеет тариф
      let refundAmount = 0;

      if (user.plan && user.plan !== "free" && user.plan !== planId) {
        console.log(
          `Пользователь переключается с тарифа "${user.plan}" на "${planId}"`
        );

        // Проверяем данные использования текущего тарифа
        const planUsageQuery = `
          SELECT * FROM user_plan_usage 
          WHERE user_id = $1 AND plan = $2
          ORDER BY created_at DESC 
          LIMIT 1
        `;

        const planUsageResult = await pgPool.query(planUsageQuery, [
          userId,
          user.plan,
        ]);
        const planUsage = planUsageResult.rows[0];

        if (planUsage && planUsage.next_reset) {
          // Рассчитываем пропорциональный возврат средств за неиспользованный период
          const nextReset = new Date(planUsage.next_reset);
          const currentPlanPrice = await getTariffPrice(user.plan);

          if (nextReset > today) {
            // Количество оставшихся дней
            const totalDays = Math.ceil(
              (nextReset.getTime() - planUsage.created_at.getTime()) /
                (1000 * 60 * 60 * 24)
            );
            // Минимум 1 день считается использованным
            const usedDays = Math.max(
              1,
              Math.ceil(
                (today.getTime() - planUsage.created_at.getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            );
            const remainingDays = Math.max(0, totalDays - usedDays);

            // Убедимся, что цена текущего плана - числовое значение
            let currentPlanPriceNumeric = 0;
            if (
              typeof currentPlanPrice === "number" &&
              !isNaN(currentPlanPrice)
            ) {
              currentPlanPriceNumeric = currentPlanPrice;
            } else if (typeof currentPlanPrice === "string") {
              currentPlanPriceNumeric = parseInt(currentPlanPrice, 10) || 0;
            }

            // Расчет стоимости за день (предполагаем ровно 30 дней в месяце для упрощения)
            const dailyPrice = Math.round(currentPlanPriceNumeric / 30);

            // По правилам, списывается стоимость за один день текущего тарифа
            // независимо от того, сколько дней осталось
            const amountForOneDay = dailyPrice;

            // Сумма к возврату - вся стоимость текущего тарифа минус стоимость одного дня
            refundAmount = currentPlanPriceNumeric - amountForOneDay;

            console.log(`Расчет возврата при смене тарифа:
              Общий период: ${totalDays} дней
              Общая стоимость текущего тарифа: ${currentPlanPriceNumeric} коп. (${(
              currentPlanPriceNumeric / 100
            ).toFixed(2)} руб.)
              Стоимость за один день: ${dailyPrice} коп. (${(
              dailyPrice / 100
            ).toFixed(2)} руб.)
              Списывается за текущий день: ${amountForOneDay} коп. (${(
              amountForOneDay / 100
            ).toFixed(2)} руб.)
              Сумма к возврату: ${refundAmount} коп. (${(
              refundAmount / 100
            ).toFixed(2)} руб.)
            `);

            // Защита от отрицательных значений
            if (refundAmount < 0) {
              refundAmount = 0;
              console.log(
                "Сумма возврата получилась отрицательной, устанавливаем 0."
              );
            }
          }
        }
      }

      // Проверяем, достаточно ли средств на балансе для нового тарифа (все значения в копейках)
      const currentBalance = user.balance || 0;
      if (currentBalance < newPlanAmount) {
        return res.status(400).json({
          message: "Недостаточно средств на балансе",
          currentBalance,
          requiredAmount: newPlanAmount,
          refundAmount,
        });
      }

      // Возвращаем средства за неиспользованное время, если это применимо
      if (refundAmount > 0) {
        console.log(
          `Возврат средств за неиспользованный период: ${refundAmount} коп.`
        );
        await storageInstance.updateUserBalance(userId, refundAmount);

        // Создаем запись о возврате
        await storageInstance.createPayment({
          userId,
          amount: refundAmount,
          description: `Возврат средств за неиспользованный период тарифа "${user.plan}"`,
          status: "completed",
          completedAt: new Date(),
        });
      }

      // Определяем переменные для сохранения обновленных данных
      let userWithNewPlan;
      let payment;

      // Сбрасываем метрики использования при подключении тарифа
      console.log(`Подключение тарифа "${planId}" со сбросом метрик`);

      // Удаляем текущие метрики использования, чтобы создать новые при первом запросе
      const deletePlanUsageQuery = `
        DELETE FROM user_plan_usage 
        WHERE user_id = $1
      `;
      await pgPool.query(deletePlanUsageQuery, [userId]);

      // Обновляем тариф пользователя
      userWithNewPlan = await storageInstance.updateUser(userId, {
        plan: planId,
      });
      if (!userWithNewPlan) {
        return res
          .status(500)
          .json({ message: "Ошибка при обновлении тарифа пользователя" });
      }

      // Списываем полную стоимость нового тарифа с баланса пользователя (отрицательное значение)
      const updatedUser = await storageInstance.updateUserBalance(
        userId,
        -newPlanAmount
      );
      if (!updatedUser) {
        return res
          .status(500)
          .json({ message: "Ошибка при списании средств с баланса" });
      }

      // Создаем запись о платеже для подключения тарифа (одна операция)
      payment = await storageInstance.createPayment({
        userId,
        amount: newPlanAmount,
        description: `Подключение тарифа "${planId}"`,
        status: "completed",
        completedAt: new Date(),
      });

      // Формируем сообщение в зависимости от типа операции
      let resultMessage = "Тариф успешно подключен";
      if (refundAmount > 0) {
        resultMessage = `Тариф успешно подключен. Возврат средств за неиспользованное время: ${(
          refundAmount / 100
        ).toFixed(2)} ₽`;
      }

      // Расчет стоимости за день для нового тарифа
      const newDailyPrice = Math.floor(newPlanAmount / 30);

      // Рассчитываем дневную стоимость старого тарифа
      let oldTariffDailyPrice = 0;
      if (user.plan && user.plan !== "free" && user.plan !== planId) {
        const oldPlanPrice = await getTariffPrice(user.plan);
        if (typeof oldPlanPrice === "number" && !isNaN(oldPlanPrice)) {
          oldTariffDailyPrice = Math.floor(oldPlanPrice / 30);
        }
      }

      res.json({
        message: resultMessage,
        user: userWithNewPlan,
        payment,
        refundAmount,
        // Добавляем информацию о ежедневной стоимости тарифов
        dailyPriceInfo: {
          newTariffDailyPrice: newDailyPrice,
          oldTariffDailyPrice: oldTariffDailyPrice,
        },
      });
    } catch (error) {
      console.error("Ошибка при подключении тарифа:", error);
      res.status(500).json({
        message: "Не удалось подключить тариф",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
  app.post("/api/balance/force-update", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      console.log(
        `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Запрос на принудительное обновление баланса для пользователя ${userId}`
      );

      // Получаем текущий баланс
      const user = await storageInstance.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      const currentBalance = user.balance || 0;
      console.log(
        `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Текущий баланс пользователя: ${currentBalance}`
      );

      // Получаем все платежи пользователя
      const payments = await storageInstance.listPaymentsByUser(userId);
      console.log(
        `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Найдено ${payments.length} платежей пользователя`
      );

      // Начинаем с проверки существующих платежей
      let updatedPayments = 0;
      let totalAmount = 0;

      // Сначала проверяем "pending" платежи через ЮKassa
      for (const payment of payments) {
        if (payment.status === "pending" && payment.paymentId) {
          try {
            console.log(
              `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Проверка статуса платежа #${payment.id} (${payment.paymentId}) в ЮKassa`
            );
            const yookassaPayment = await yookassaService.getPayment(
              payment.paymentId
            );
            const newStatus = yookassaService.mapPaymentStatus(
              yookassaPayment.status
            );

            // Если статус изменился или это успешный платеж
            if (newStatus !== payment.status || yookassaPayment.paid === true) {
              const updatedStatus =
                yookassaPayment.paid === true ? "succeeded" : newStatus;
              console.log(
                `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Обновляем статус платежа #${payment.id} с ${payment.status} на ${updatedStatus}`
              );

              await storageInstance.updatePayment(payment.id, {
                status: updatedStatus,
                completedAt:
                  updatedStatus === "succeeded" ? new Date() : undefined,
              });

              updatedPayments++;

              if (updatedStatus === "succeeded") {
                totalAmount += payment.amount;
              }
            }
          } catch (error) {
            console.error(
              `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Ошибка при проверке платежа #${payment.id}:`,
              error
            );

            // Если не удается проверить платеж, но он старше 10 минут и мы в тестовом режиме, считаем его успешным
            if (
              payment.createdAt &&
              new Date().getTime() - payment.createdAt.getTime() >
                10 * 60 * 1000
            ) {
              console.log(
                `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Платеж #${payment.id} старше 10 минут, принудительно помечаем как успешный`
              );

              await storageInstance.updatePayment(payment.id, {
                status: "succeeded",
                completedAt: new Date(),
              });

              updatedPayments++;
              totalAmount += payment.amount;
            }
          }
        } else if (payment.status === "succeeded") {
          // Платеж уже помечен как успешный, просто учитываем его
          totalAmount += payment.amount;
        }
      }

      // Обновляем баланс пользователя, если были изменения
      if (updatedPayments > 0 || totalAmount > 0) {
        console.log(
          `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Принудительно обновляем баланс пользователя на ${Math.floor(
            totalAmount / 100
          )} руб.`
        );

        try {
          console.log(
            `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Попытка обновления баланса напрямую через SQL`
          );

          // Прямое обновление баланса в базе данных
          await db.execute(
            sql`UPDATE users SET balance = ${totalAmount} WHERE id = ${userId}`
          );

          console.log(
            `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Баланс пользователя обновлен напрямую через SQL (${totalAmount})`
          );
        } catch (sqlError) {
          console.error(
            `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Ошибка при прямом обновлении баланса через SQL:`,
            sqlError
          );

          // Запасной вариант - обновление через storage
          console.log(
            `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Попытка обновления баланса через storage`
          );
          const updatedUser = await storageInstance.updateUser(userId, {
            balance: totalAmount,
          });
          console.log(
            `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Баланс пользователя обновлен через storage: ${
              updatedUser?.balance || "undefined"
            }`
          );
        }

        // Получаем обновленные данные пользователя
        const updatedUser = await storageInstance.getUser(userId);

        // Логируем операцию
        await storageInstance.createActivityLog({
          userId,
          action: "balance_force_updated",
          details: {
            previousBalance: currentBalance,
            newBalance: updatedUser?.balance || 0,
            updatedPayments,
            totalAmount,
          },
        });

        return res.json({
          success: true,
          message: `Баланс пользователя обновлен. Обработано платежей: ${updatedPayments}`,
          previousBalance: currentBalance,
          newBalance: updatedUser?.balance || 0,
          updatedPayments,
        });
      }

      // Если нет изменений
      return res.json({
        success: true,
        message: "Баланс не требует обновления",
        balance: currentBalance,
      });
    } catch (error) {
      console.error(
        "ДИАГНОСТИКА ПЛАТЕЖЕЙ: Ошибка при принудительном обновлении баланса:",
        error
      );
      res.status(500).json({
        message: "Не удалось обновить баланс",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Принудительное обновление баланса конкретного пользователя
  app.post(
    "/api/balance/:userId/refresh",
    authenticateToken,
    async (req, res) => {
      try {
        const userId = parseInt(req.params.userId, 10);

        // Проверяем права доступа (только свой баланс или администратор)
        if (req.user.id !== userId && req.user.role !== "admin") {
          return res.status(403).json({
            message:
              "Недостаточно прав для обновления баланса другого пользователя",
          });
        }

        console.log(
          `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Запрос на принудительное обновление баланса для пользователя ${userId}`
        );

        // Получаем текущий баланс
        const user = await storageInstance.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "Пользователь не найден" });
        }

        const currentBalance = user.balance || 0;
        console.log(
          `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Текущий баланс пользователя ${userId}: ${currentBalance}`
        );

        // Получаем все платежи пользователя
        const payments = await storageInstance.listPaymentsByUser(userId);
        console.log(
          `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Найдено ${payments.length} платежей пользователя ${userId}`
        );

        // Начинаем с проверки существующих платежей
        let updatedPayments = 0;
        let totalAmount = 0;

        // Сначала проверяем "pending" платежи через ЮKassa
        for (const payment of payments) {
          if (payment.status === "pending" && payment.paymentId) {
            try {
              console.log(
                `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Проверка статуса платежа #${payment.id} (${payment.paymentId}) в ЮKassa`
              );
              const yookassaPayment = await yookassaService.getPayment(
                payment.paymentId
              );
              const newStatus = yookassaService.mapPaymentStatus(
                yookassaPayment.status
              );

              // Если статус изменился или это успешный платеж
              if (
                newStatus !== payment.status ||
                yookassaPayment.paid === true
              ) {
                const updatedStatus =
                  yookassaPayment.paid === true ? "succeeded" : newStatus;
                console.log(
                  `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Обновляем статус платежа #${payment.id} с ${payment.status} на ${updatedStatus}`
                );

                await storageInstance.updatePayment(payment.id, {
                  status: updatedStatus,
                  completedAt:
                    updatedStatus === "succeeded" ? new Date() : undefined,
                });

                updatedPayments++;

                if (updatedStatus === "succeeded") {
                  totalAmount += payment.amount;
                }
              }
            } catch (error) {
              console.error(
                `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Ошибка при проверке платежа #${payment.id}:`,
                error
              );

              // Если не удается проверить платеж, но он старше 10 минут, считаем его успешным в тестовом режиме
              if (
                payment.createdAt &&
                new Date().getTime() - payment.createdAt.getTime() >
                  10 * 60 * 1000
              ) {
                console.log(
                  `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Платеж #${payment.id} старше 10 минут, принудительно помечаем как успешный`
                );

                await storageInstance.updatePayment(payment.id, {
                  status: "succeeded",
                  completedAt: new Date(),
                });

                updatedPayments++;
                totalAmount += payment.amount;
              }
            }
          } else if (payment.status === "succeeded") {
            // Платеж уже помечен как успешный, просто учитываем его
            totalAmount += payment.amount;
          }
        }

        // Обновляем баланс пользователя, если были изменения
        if (updatedPayments > 0 || totalAmount > 0) {
          console.log(
            `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Принудительно обновляем баланс пользователя ${userId} на ${Math.floor(
              totalAmount / 100
            )} руб.`
          );

          try {
            console.log(
              `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Попытка обновления баланса напрямую через SQL`
            );

            // Прямое обновление баланса в базе данных
            await db.execute(
              sql`UPDATE users SET balance = ${totalAmount} WHERE id = ${userId}`
            );

            console.log(
              `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Баланс пользователя ${userId} обновлен напрямую через SQL (${totalAmount})`
            );
          } catch (sqlError) {
            console.error(
              `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Ошибка при прямом обновлении баланса через SQL:`,
              sqlError
            );

            // Запасной вариант - обновление через storage
            console.log(
              `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Попытка обновления баланса через storage`
            );
            const updatedUser = await storageInstance.updateUser(userId, {
              balance: totalAmount,
            });
            console.log(
              `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Баланс пользователя ${userId} обновлен через storage: ${
                updatedUser?.balance || "undefined"
              }`
            );
          }

          // Обрабатываем реферальные вознаграждения для каждого успешного платежа
          try {
            console.log(
              `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Начинаем обработку реферальных вознаграждений для пользователя ${userId}`
            );
            // Обрабатываем только платежи со статусом "succeeded"
            for (const payment of payments.filter(
              (p) => p.status === "succeeded"
            )) {
              console.log(
                `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Обработка реферальных вознаграждений для платежа #${payment.id} на сумму ${payment.amount}`
              );
              await processReferralPaymentRewardV2(userId, payment.amount);
            }
            console.log(
              `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Реферальные вознаграждения обработаны`
            );
          } catch (refErr) {
            console.error(
              `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Ошибка при обработке реферальных вознаграждений:`,
              refErr
            );
          }

          // Получаем обновленные данные пользователя
          const updatedUser = await storageInstance.getUser(userId);

          // Логируем операцию
          await storageInstance.createActivityLog({
            userId,
            action: "balance_force_updated",
            details: {
              previousBalance: currentBalance,
              newBalance: updatedUser?.balance || 0,
              updatedPayments,
              totalAmount,
            },
          });

          return res.json({
            success: true,
            message: `Баланс пользователя ${userId} обновлен. Обработано платежей: ${updatedPayments}`,
            previousBalance: currentBalance,
            newBalance: updatedUser?.balance || 0,
            updatedPayments,
          });
        }

        // Если нет изменений
        return res.json({
          success: true,
          message: `Баланс пользователя ${userId} не требует обновления`,
          balance: currentBalance,
        });
      } catch (error) {
        console.error(
          `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Ошибка при принудительном обновлении баланса пользователя:`,
          error
        );
        res.status(500).json({
          message: "Не удалось обновить баланс",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Тестовый эндпоинт для принудительного вызова обработки реферального вознаграждения - открыт для всех без авторизации
  app.get("/api/test/referral-reward/:userId/:amount", async (req, res) => {
    console.log("===============================================");
    console.log("ТЕСТОВЫЙ ЭНДПОИНТ ВЫЗВАН");
    console.log("===============================================");
    try {
      const userId = parseInt(req.params.userId);
      const amount = parseInt(req.params.amount);

      if (isNaN(userId) || isNaN(amount)) {
        return res
          .status(400)
          .json({ error: "Некорректные параметры запроса" });
      }

      console.log(
        `ТЕСТ: Вызов функции обработки реферальных вознаграждений для пользователя ${userId} на сумму ${amount}`
      );

      // Вывод дополнительной диагностической информации
      const user = await storageInstance.getUser(userId);
      console.log(
        `ДИАГНОСТИКА: Информация о пользователе ${userId}:`,
        JSON.stringify(user, null, 2)
      );

      if (user?.referrerId) {
        const referrer = await storageInstance.getUser(user.referrerId);
        console.log(
          `ДИАГНОСТИКА: Информация о реферере ${user.referrerId}:`,
          JSON.stringify(referrer, null, 2)
        );
        console.log(
          `ДИАГНОСТИКА: Баланс реферера до обработки: ${referrer?.balance || 0}`
        );
      }

      console.log(
        `ТЕСТ: Начинаем вызов новой функции processReferralPaymentRewardV2...`
      );
      await processReferralPaymentRewardV2(userId, amount);
      console.log(
        `ТЕСТ: Завершён вызов функции processReferralPaymentRewardV2`
      );

      // Проверяем, изменились ли балансы после обработки
      if (user?.referrerId) {
        const referrerAfter = await storageInstance.getUser(user.referrerId);
        console.log(
          `ДИАГНОСТИКА: Баланс реферера после обработки: ${referrerAfter?.balance}`
        );

        if (referrerAfter?.managerId) {
          const managerAfter = await storageInstance.getUser(
            referrerAfter.managerId
          );
          console.log(
            `ДИАГНОСТИКА: Баланс менеджера после обработки: ${managerAfter?.balance}`
          );
        }
      }

      res.json({
        success: true,
        message: "Реферальное вознаграждение обработано",
      });
    } catch (error) {
      console.error(
        "Ошибка при тестовом вызове обработки реферального вознаграждения:",
        error
      );
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Маршрут для отправки сообщений в Telegram
  app.post("/api/send-to-telegram", async (req, res) => {
    try {
      const { dataReq, chatId, token } = req.body;

      if (!dataReq) {
        return res
          .status(400)
          .json({ success: false, message: "Отсутствуют данные для отправки" });
      }

      // Отправляем уведомление о новом пользователе
      const result = await telegramService.sendNewUserNotification(
        dataReq, // данные пользователя (email или телефон)
        chatId, // опциональный chatId
        token // опциональный токен
      );

      if (result) {
        return res
          .status(200)
          .json({ success: true, message: "Сообщение успешно отправлено" });
      } else {
        return res
          .status(500)
          .json({ success: false, message: "Не удалось отправить сообщение" });
      }
    } catch (error) {
      console.error("[API] Ошибка при отправке сообщения в Telegram:", error);
      return res
        .status(500)
        .json({ success: false, message: "Внутренняя ошибка сервера" });
    }
  });

  // Маршрут для отправки массовых email-рассылок
  app.post("/api/campaigns/email", authenticateToken, async (req, res) => {
    console.log("[API] Получен запрос на отправку email-рассылки");

    try {
      const { channelId, name, subject, message, recipients, templateType } =
        req.body;

      if (
        !channelId ||
        !name ||
        !subject ||
        !message ||
        !recipients ||
        !Array.isArray(recipients) ||
        recipients.length === 0
      ) {
        console.log("[API] Некорректные данные запроса:", req.body);
        return res.status(400).json({
          success: false,
          message:
            "Необходимы channelId, name, subject, message и непустой массив recipients",
        });
      }

      // Получаем канал для отправки
      const channel = await storageInstance.getChannel(channelId);
      if (!channel) {
        console.log(`[API] Канал ${channelId} не найден`);
        return res
          .status(404)
          .json({ success: false, message: "Канал не найден" });
      }

      if (channel.type !== "email") {
        console.log(
          `[API] Попытка использовать не-email канал (${channel.type}) для рассылки`
        );
        return res.status(400).json({
          success: false,
          message: "Для рассылки email требуется канал типа email",
        });
      }

      console.log(
        `[API] Начинаем отправку email-рассылки через канал ${channel.id} на ${recipients.length} адресов`
      );

      // Отправляем рассылку с выбранным шаблоном (или стандартным по умолчанию)
      // Передаем userId и имя кампании для сохранения в БД
      const result = await emailService.sendBulkEmails(
        channel,
        recipients,
        subject,
        message,
        templateType || "standard",
        req.user.id,
        name
      );

      // Активность уже логируется в методе sendBulkEmails

      // Формируем более информативное сообщение об ошибке
      let errorMessage = undefined;
      if (!result.success && result.errors && result.errors.length > 0) {
        // Извлекаем текст первой ошибки
        const firstError = result.errors[0];
        const errorStr = JSON.stringify(firstError);

        if (
          errorStr.includes("535 5.7.8") &&
          errorStr.includes("authentication failed") &&
          channel.settings?.smtpServer?.toLowerCase().includes("yandex")
        ) {
          errorMessage =
            "Ошибка аутентификации Яндекс.Почты: необходимо создать пароль приложения и разрешить доступ для сторонних приложений в настройках безопасности Яндекс ID.";
        } else if (
          errorStr.includes("534-5.7.14") &&
          channel.settings?.smtpServer?.toLowerCase().includes("gmail")
        ) {
          errorMessage =
            "Ошибка для Gmail: требуется включить двухфакторную аутентификацию и создать пароль приложения";
        } else if (errorStr.includes("EAUTH")) {
          errorMessage = "Ошибка аутентификации: неверный логин или пароль";
        }
      }

      // Возвращаем результат
      res.status(200).json({
        success: result.success,
        name,
        channelId,
        recipientCount: recipients.length,
        successCount: result.successCount,
        failedCount: result.failedCount,
        errors: result.errors.length > 0 ? result.errors.slice(0, 5) : [], // Показываем только первые 5 ошибок
        errorMessage: errorMessage,
      });
    } catch (error) {
      console.error("[API] Ошибка при отправке email-рассылки:", error);
      return res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера при отправке рассылки",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Маршрут для отправки массовых SMS-рассылок
  app.post("/api/campaigns/sms", authenticateToken, async (req, res) => {
    console.log("[API] Получен запрос на отправку SMS-рассылки");

    try {
      const { channelId, name, message, recipients } = req.body;

      if (
        !channelId ||
        !name ||
        !message ||
        !recipients ||
        !Array.isArray(recipients) ||
        recipients.length === 0
      ) {
        console.log("[API] Некорректные данные запроса для SMS:", req.body);
        return res.status(400).json({
          success: false,
          message:
            "Необходимы channelId, name, message и непустой массив recipients",
        });
      }

      // Получаем канал для отправки
      const channel = await storageInstance.getChannel(channelId);
      if (!channel) {
        console.log(`[API] SMS канал ${channelId} не найден`);
        return res
          .status(404)
          .json({ success: false, message: "Канал не найден" });
      }

      if (channel.type !== "sms") {
        console.log(
          `[API] Попытка использовать не-SMS канал (${channel.type}) для SMS рассылки`
        );
        return res.status(400).json({
          success: false,
          message: "Для SMS рассылки требуется канал типа sms",
        });
      }

      // Проверяем, что все номера в правильном формате
      const validPhones: string[] = [];
      const invalidPhones: string[] = [];

      for (const phone of recipients) {
        // Проверяем формат номера телефона
        if (smsService.isValidRussianPhone(phone)) {
          validPhones.push(phone);
        } else {
          console.log(`[API] Некорректный формат номера: ${phone}`);
          invalidPhones.push(phone);
        }
      }

      if (validPhones.length === 0) {
        console.log("[API] Нет валидных номеров телефонов для отправки SMS");
        return res.status(400).json({
          success: false,
          message: "Нет валидных номеров телефонов для отправки",
          invalidPhones,
        });
      }

      console.log(
        `[API] Начинаем отправку SMS-рассылки через канал ${channel.id} на ${validPhones.length} номеров`
      );

      // Гарантированно используем SMSAero как имя отправителя
      const sender = "SMSAero";

      console.log(`[API] Используем отправителя SMS: ${sender}`);

      // Отправляем SMS через SMS сервис с фиксированным именем отправителя
      const result = await smsService.sendBulkSms(validPhones, message, sender);

      // Логируем активность
      await storageInstance.createActivityLog({
        userId: req.user.id,
        action: "Отправка SMS-рассылки",
        details: {
          message: `Отправлено SMS на ${validPhones.length} номеров. Успешно: ${result.successCount}, с ошибками: ${result.failedCount}`,
          channelId,
          count: validPhones.length,
          success: result.successCount,
          failed: result.failedCount,
        },
      });

      // Создаем запись о кампании
      await storageInstance.createEmailCampaign({
        name,
        channelId,
        userId: req.user.id,
        subject: "SMS рассылка", // Фиктивное поле для совместимости с таблицей email_campaigns
        message,
        recipientCount: validPhones.length,
        successCount: result.successCount,
        failedCount: result.failedCount,
        status: result.success ? "completed" : "failed",
        templateType: "sms", // Помечаем как SMS-кампанию
        createdAt: new Date(),
      });

      // Возвращаем результат
      res.status(200).json({
        success: result.success,
        name,
        channelId,
        recipientCount: validPhones.length,
        successCount: result.successCount,
        failedCount: result.failedCount,
        invalidPhones: invalidPhones.length > 0 ? invalidPhones : [],
      });
    } catch (error) {
      console.error("[API] Ошибка при отправке SMS-рассылки:", error);
      return res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера при отправке SMS",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // API для получения списка email-кампаний с возможностью фильтрации по периоду
  app.get("/api/email-campaigns", authenticateToken, async (req, res) => {
    try {
      const { period, startDate, endDate } = req.query;

      // Определяем диапазон дат на основе параметра period или custom диапазона
      let dateFrom: Date | undefined;
      let dateTo: Date | undefined;

      const now = new Date();

      if (period === "week") {
        // Последние 7 дней
        dateFrom = new Date(now);
        dateFrom.setDate(dateFrom.getDate() - 7);
      } else if (period === "month") {
        // Последние 30 дней
        dateFrom = new Date(now);
        dateFrom.setDate(dateFrom.getDate() - 30);
      } else if (period === "year") {
        // С начала текущего года
        dateFrom = new Date(now.getFullYear(), 0, 1);
      } else if (period === "all") {
        // Все время (без ограничений)
        dateFrom = undefined;
      } else if (startDate && endDate) {
        // Пользовательский период
        dateFrom = new Date(startDate as string);
        dateTo = new Date(endDate as string);
      } else {
        // По умолчанию - последние 30 дней
        dateFrom = new Date(now);
        dateFrom.setDate(dateFrom.getDate() - 30);
      }

      // Получаем список кампаний с учетом временного диапазона
      const campaigns = await storageInstance.getEmailCampaigns({
        userId: req.user.id,
        dateFrom,
        dateTo,
      });

      res.json({ campaigns });
    } catch (error) {
      console.error("[API] Ошибка при получении списка email-кампаний:", error);
      res.status(500).json({
        message: "Ошибка при получении данных о кампаниях",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // API для получения детальной информации о конкретной email-кампании
  app.get("/api/email-campaigns/:id", authenticateToken, async (req, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      if (isNaN(campaignId)) {
        return res.status(400).json({ message: "Некорректный ID кампании" });
      }

      // Получаем кампанию
      const campaign = await storageInstance.getEmailCampaign(campaignId);

      if (!campaign) {
        return res.status(404).json({ message: "Кампания не найдена" });
      }

      // Проверяем права доступа - только владелец может просматривать свои кампании
      if (campaign.userId !== req.user.id) {
        return res
          .status(403)
          .json({ message: "У вас нет прав для просмотра этой кампании" });
      }

      res.json({ campaign });
    } catch (error) {
      console.error(
        "[API] Ошибка при получении информации о email-кампании:",
        error
      );
      res.status(500).json({
        message: "Ошибка при получении данных о кампании",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // API для получения статистики по email-кампаниям в разрезе периода
  app.get("/api/email-statistics", authenticateToken, async (req, res) => {
    try {
      const { period } = req.query;

      // Определяем диапазон дат на основе параметра period
      let dateFrom: Date;
      const now = new Date();

      if (period === "week") {
        // Последние 7 дней
        dateFrom = new Date(now);
        dateFrom.setDate(dateFrom.getDate() - 7);
      } else if (period === "month") {
        // Последние 30 дней
        dateFrom = new Date(now);
        dateFrom.setDate(dateFrom.getDate() - 30);
      } else if (period === "year") {
        // С начала текущего года
        dateFrom = new Date(now.getFullYear(), 0, 1);
      } else {
        // По умолчанию - последние 30 дней
        dateFrom = new Date(now);
        dateFrom.setDate(dateFrom.getDate() - 30);
      }

      // Получаем кампании за указанный период
      const campaigns = await storageInstance.getEmailCampaigns({
        userId: req.user.id,
        dateFrom,
      });

      // Вычисляем суммарную статистику
      const totalRecipients = campaigns.reduce(
        (sum, campaign) => sum + campaign.recipientCount,
        0
      );
      const totalSuccess = campaigns.reduce(
        (sum, campaign) => sum + campaign.successCount,
        0
      );
      const totalFailed = campaigns.reduce(
        (sum, campaign) => sum + campaign.failedCount,
        0
      );
      const averageSuccess =
        totalRecipients > 0
          ? Math.round((totalSuccess / totalRecipients) * 100)
          : 0;

      // Группируем данные по дням для построения графика
      const dailyStats: {
        [date: string]: { sent: number; success: number; failed: number };
      } = {};

      // Инициализируем данные для каждого дня в выбранном периоде
      let currentDate = new Date(dateFrom);
      while (currentDate <= now) {
        const dateStr = currentDate.toISOString().split("T")[0];
        dailyStats[dateStr] = { sent: 0, success: 0, failed: 0 };
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Заполняем статистику по дням
      campaigns.forEach((campaign) => {
        const campaignDate = new Date(campaign.createdAt)
          .toISOString()
          .split("T")[0];
        if (dailyStats[campaignDate]) {
          dailyStats[campaignDate].sent += campaign.recipientCount;
          dailyStats[campaignDate].success += campaign.successCount;
          dailyStats[campaignDate].failed += campaign.failedCount;
        }
      });

      // Преобразуем в массив для удобства использования на фронтенде
      const dailyData = Object.entries(dailyStats).map(([date, stats]) => ({
        date,
        sent: stats.sent,
        success: stats.success,
        failed: stats.failed,
      }));

      // Сортируем по дате
      dailyData.sort((a, b) => a.date.localeCompare(b.date));

      res.json({
        summary: {
          totalCampaigns: campaigns.length,
          totalRecipients,
          totalSuccess,
          totalFailed,
          averageSuccess,
        },
        dailyData,
      });
    } catch (error) {
      console.error(
        "[API] Ошибка при получении статистики по email-кампаниям:",
        error
      );
      res.status(500).json({
        message: "Ошибка при получении статистики",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // ===== API для каналов оповещений =====

  // Получение списка каналов оповещений
  app.get("/api/notification-channels", authenticateToken, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Пользователь не авторизован" });
      }

      // Проверяем, является ли пользователь администратором
      const user = await storageInstance.getUser(userId);
      const isAdmin = user?.role === "admin";

      let channels;
      if (isAdmin) {
        // Администраторы видят все каналы
        channels = await storageInstance.listNotificationChannels();
      } else {
        // Обычные пользователи видят только свои каналы
        channels = await storageInstance.listNotificationChannelsByUser(userId);
      }

      res.json(channels);
    } catch (error) {
      console.error("Ошибка при получении списка каналов оповещений:", error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Получение одного канала оповещений
  app.get(
    "/api/notification-channels/:id",
    authenticateToken,
    async (req, res) => {
      try {
        const channelId = parseInt(req.params.id);
        const userId = req.user?.id;

        if (!userId) {
          return res.status(401).json({ error: "Пользователь не авторизован" });
        }

        if (isNaN(channelId)) {
          return res.status(400).json({ error: "Некорректный ID канала" });
        }

        const channel = await storageInstance.getNotificationChannel(channelId);

        if (!channel) {
          return res.status(404).json({ error: "Канал оповещений не найден" });
        }

        // Проверяем права доступа
        const user = await storageInstance.getUser(userId);
        if (channel.createdBy !== userId && user?.role !== "admin") {
          return res
            .status(403)
            .json({ error: "Нет доступа к этому каналу оповещений" });
        }

        res.json(channel);
      } catch (error) {
        console.error(`Ошибка при получении канала оповещений:`, error);
        res.status(500).json({ error: getErrorMessage(error) });
      }
    }
  );

  // Создание канала оповещений
  app.post(
    "/api/notification-channels",
    authenticateToken,
    async (req, res) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ error: "Пользователь не авторизован" });
        }

        const { name, type, settings } = req.body;

        if (!name || !type || !settings) {
          return res
            .status(400)
            .json({ error: "Отсутствуют обязательные поля" });
        }

        const channel = await storageInstance.createNotificationChannel({
          name,
          type,
          settings,
          createdBy: userId,
          status: "active",
        });

        res.status(201).json(channel);
      } catch (error) {
        console.error("Ошибка при создании канала оповещений:", error);
        res.status(500).json({ error: getErrorMessage(error) });
      }
    }
  );

  // Обновление канала оповещений
  app.patch(
    "/api/notification-channels/:id",
    authenticateToken,
    async (req, res) => {
      try {
        const channelId = parseInt(req.params.id);
        const userId = req.user?.id;

        if (!userId) {
          return res.status(401).json({ error: "Пользователь не авторизован" });
        }

        if (isNaN(channelId)) {
          return res.status(400).json({ error: "Некорректный ID канала" });
        }

        const existingChannel = await storageInstance.getNotificationChannel(
          channelId
        );

        if (!existingChannel) {
          return res.status(404).json({ error: "Канал оповещений не найден" });
        }

        // Проверяем права доступа
        const user = await storageInstance.getUser(userId);
        if (existingChannel.createdBy !== userId && user?.role !== "admin") {
          return res
            .status(403)
            .json({ error: "Нет прав на редактирование этого канала" });
        }

        const { name, type, status, settings } = req.body;
        const updateData: Partial<InsertNotificationChannel> = {};

        if (name !== undefined) updateData.name = name;
        if (type !== undefined) updateData.type = type;
        if (status !== undefined) updateData.status = status;
        if (settings !== undefined) updateData.settings = settings;

        const updatedChannel = await storageInstance.updateNotificationChannel(
          channelId,
          updateData
        );

        res.json(updatedChannel);
      } catch (error) {
        console.error("Ошибка при обновлении канала оповещений:", error);
        res.status(500).json({ error: getErrorMessage(error) });
      }
    }
  );

  // Удаление канала оповещений
  app.delete(
    "/api/notification-channels/:id",
    authenticateToken,
    async (req, res) => {
      try {
        const channelId = parseInt(req.params.id);
        const userId = req.user?.id;

        if (!userId) {
          return res.status(401).json({ error: "Пользователь не авторизован" });
        }

        if (isNaN(channelId)) {
          return res.status(400).json({ error: "Некорректный ID канала" });
        }

        const channel = await storageInstance.getNotificationChannel(channelId);

        if (!channel) {
          return res.status(404).json({ error: "Канал оповещений не найден" });
        }

        // Проверяем права доступа
        const user = await storageInstance.getUser(userId);
        if (channel.createdBy !== userId && user?.role !== "admin") {
          return res
            .status(403)
            .json({ error: "Нет прав на удаление этого канала" });
        }

        await storageInstance.deleteNotificationChannel(channelId);

        res.json({ success: true });
      } catch (error) {
        console.error("Ошибка при удалении канала оповещений:", error);
        res.status(500).json({ error: getErrorMessage(error) });
      }
    }
  );

  // ===== API для OpenAI функций =====

  // Получение списка функций
  app.get("/api/openai-functions", authenticateToken, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Пользователь не авторизован" });
      }

      // Проверяем, является ли пользователь администратором
      const user = await storageInstance.getUser(userId);
      const isAdmin = user?.role === "admin";

      let functions;
      if (isAdmin) {
        // Администраторы видят все функции
        functions = await storageInstance.listOpenAiFunctions();
      } else {
        // Обычные пользователи видят только свои функции
        functions = await storageInstance.listOpenAiFunctionsByUser(userId);
      }

      res.json(functions);
    } catch (error) {
      console.error("Ошибка при получении списка OpenAI функций:", error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Получение одной функции
  app.get("/api/openai-functions/:id", authenticateToken, async (req, res) => {
    try {
      const functionId = parseInt(req.params.id);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Пользователь не авторизован" });
      }

      if (isNaN(functionId)) {
        return res.status(400).json({ error: "Некорректный ID функции" });
      }

      const func = await storageInstance.getOpenAiFunction(functionId);

      if (!func) {
        return res.status(404).json({ error: "Функция не найдена" });
      }

      // Проверяем права доступа
      const user = await storageInstance.getUser(userId);
      if (func.createdBy !== userId && user?.role !== "admin") {
        return res.status(403).json({ error: "Нет доступа к этой функции" });
      }

      res.json(func);
    } catch (error) {
      console.error(`Ошибка при получении OpenAI функции:`, error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Создание функции
  app.post("/api/openai-functions", authenticateToken, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Пользователь не авторизован" });
      }

      const { name, description, parameters, channelId } = req.body;

      if (!name || !parameters) {
        return res.status(400).json({ error: "Отсутствуют обязательные поля" });
      }

      // Если указан channelId, проверяем его существование
      if (channelId) {
        const channel = await storageInstance.getNotificationChannel(channelId);
        if (!channel) {
          return res
            .status(404)
            .json({ error: "Указанный канал оповещений не найден" });
        }
      }

      const func = await storageInstance.createOpenAiFunction({
        name,
        description,
        parameters,
        channelId: channelId || null,
        createdBy: userId,
      });

      res.status(201).json(func);
    } catch (error) {
      console.error("Ошибка при создании OpenAI функции:", error);
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Обновление функции
  app.patch(
    "/api/openai-functions/:id",
    authenticateToken,
    async (req, res) => {
      try {
        const functionId = parseInt(req.params.id);
        const userId = req.user?.id;

        if (!userId) {
          return res.status(401).json({ error: "Пользователь не авторизован" });
        }

        if (isNaN(functionId)) {
          return res.status(400).json({ error: "Некорректный ID функции" });
        }

        const existingFunction = await storageInstance.getOpenAiFunction(
          functionId
        );

        if (!existingFunction) {
          return res.status(404).json({ error: "Функция не найдена" });
        }

        // Проверяем права доступа
        const user = await storageInstance.getUser(userId);
        if (existingFunction.createdBy !== userId && user?.role !== "admin") {
          return res
            .status(403)
            .json({ error: "Нет прав на редактирование этой функции" });
        }

        const { name, description, parameters } = req.body;
        const updateData: Partial<InsertOpenAiFunction> = {};

        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (parameters !== undefined) updateData.parameters = parameters;

        const updatedFunction = await storageInstance.updateOpenAiFunction(
          functionId,
          updateData
        );

        res.json(updatedFunction);
      } catch (error) {
        console.error("Ошибка при обновлении OpenAI функции:", error);
        res.status(500).json({ error: getErrorMessage(error) });
      }
    }
  );

  // Удаление функции
  app.delete(
    "/api/openai-functions/:id",
    authenticateToken,
    async (req, res) => {
      try {
        const functionId = parseInt(req.params.id);
        const userId = req.user?.id;

        if (!userId) {
          return res.status(401).json({ error: "Пользователь не авторизован" });
        }

        if (isNaN(functionId)) {
          return res.status(400).json({ error: "Некорректный ID функции" });
        }

        const func = await storageInstance.getOpenAiFunction(functionId);

        if (!func) {
          return res.status(404).json({ error: "Функция не найдена" });
        }

        // Проверяем права доступа
        const user = await storageInstance.getUser(userId);
        if (func.createdBy !== userId && user?.role !== "admin") {
          return res
            .status(403)
            .json({ error: "Нет прав на удаление этой функции" });
        }

        await storageInstance.deleteOpenAiFunction(functionId);

        res.json({ success: true });
      } catch (error) {
        console.error("Ошибка при удалении OpenAI функции:", error);
        res.status(500).json({ error: getErrorMessage(error) });
      }
    }
  );

  // ===== API для связей между ассистентами и функциями =====

  // Получение всех функций для ассистента
  app.get(
    "/api/assistants/:assistantId/functions",
    authenticateToken,
    async (req, res) => {
      try {
        const assistantId = parseInt(req.params.assistantId);
        const userId = req.user?.id;

        if (!userId) {
          return res.status(401).json({ error: "Пользователь не авторизован" });
        }

        if (isNaN(assistantId)) {
          return res.status(400).json({ error: "Некорректный ID ассистента" });
        }

        // Проверяем, существует ли ассистент
        const assistant = await storageInstance.getAssistant(assistantId);
        if (!assistant) {
          return res.status(404).json({ error: "Ассистент не найден" });
        }

        // Проверяем права доступа
        const user = await storageInstance.getUser(userId);
        if (assistant.createdBy !== userId && user?.role !== "admin") {
          return res
            .status(403)
            .json({ error: "Нет доступа к этому ассистенту" });
        }

        // Получаем связи функций с ассистентом
        const functionAssistants =
          await storageInstance.listFunctionAssistantsByAssistant(assistantId);

        // Получаем информацию о каждой функции
        const result = await Promise.all(
          functionAssistants.map(async (fa) => {
            const func = await storageInstance.getOpenAiFunction(fa.functionId);
            const channel = await storageInstance.getNotificationChannel(
              fa.notificationChannelId
            );
            return {
              id: fa.id,
              assistantId: fa.assistantId,
              function: func,
              channel: channel,
              enabled: fa.enabled,
              settings: fa.settings,
              createdAt: fa.createdAt,
              updatedAt: fa.updatedAt,
            };
          })
        );

        res.json(result);
      } catch (error) {
        console.error("Ошибка при получении функций ассистента:", error);
        res.status(500).json({ error: getErrorMessage(error) });
      }
    }
  );

  // Подключение функции к ассистенту
  app.post(
    "/api/assistants/:assistantId/functions",
    authenticateToken,
    async (req, res) => {
      try {
        const assistantId = parseInt(req.params.assistantId);
        const userId = req.user?.id;

        if (!userId) {
          return res.status(401).json({ error: "Пользователь не авторизован" });
        }

        if (isNaN(assistantId)) {
          return res.status(400).json({ error: "Некорректный ID ассистента" });
        }

        const { functionId, notificationChannelId, enabled, settings } =
          req.body;

        if (!functionId || !notificationChannelId) {
          return res
            .status(400)
            .json({ error: "Отсутствуют обязательные поля" });
        }

        // Проверяем, существует ли ассистент
        const assistant = await storageInstance.getAssistant(assistantId);
        if (!assistant) {
          return res.status(404).json({ error: "Ассистент не найден" });
        }

        // Проверяем права доступа
        const user = await storageInstance.getUser(userId);
        if (assistant.createdBy !== userId && user?.role !== "admin") {
          return res
            .status(403)
            .json({ error: "Нет прав на редактирование этого ассистента" });
        }

        // Проверяем, существует ли функция
        const func = await storageInstance.getOpenAiFunction(functionId);
        if (!func) {
          return res.status(404).json({ error: "Функция не найдена" });
        }

        // Проверяем, существует ли канал оповещений
        const channel = await storageInstance.getNotificationChannel(
          notificationChannelId
        );
        if (!channel) {
          return res.status(404).json({ error: "Канал оповещений не найден" });
        }

        // Проверяем, нет ли уже такой связи
        const existingConnection =
          await storageInstance.getFunctionAssistantByFunctionAndAssistant(
            functionId,
            assistantId
          );
        if (existingConnection) {
          // Если функция уже подключена, возвращаем существующую связь вместо ошибки
          return res.status(200).json(existingConnection);
        }

        // Создаем связь
        const functionAssistant = await storageInstance.createFunctionAssistant(
          {
            functionId,
            assistantId,
            notificationChannelId,
            enabled: enabled !== undefined ? enabled : true,
            settings: settings || {},
          }
        );

        // Используем новый метод addSingleFunction вместо syncAssistantFunctions для добавления только одной функции
        const updater = new FunctionToolsUpdater(storageInstance);
        const addResult = await updater.addSingleFunction(
          assistantId,
          functionId
        );

        console.log(
          `[DEBUG] Результат добавления функции ${functionId} для ассистента ${assistantId}:`,
          JSON.stringify(addResult, null, 2)
        );

        res.status(201).json({
          ...functionAssistant,
          syncResult: {
            success: addResult.success,
            changes: {
              added: addResult.added ? [addResult.functionName] : [],
              removed: [],
            },
          },
        });
      } catch (error) {
        console.error("Ошибка при подключении функции к ассистенту:", error);
        res.status(500).json({ error: getErrorMessage(error) });
      }
    }
  );

  // Обновление параметров связи
  app.patch(
    "/api/function-assistants/:id",
    authenticateToken,
    async (req, res) => {
      try {
        const connectionId = parseInt(req.params.id);
        const userId = req.user?.id;

        if (!userId) {
          return res.status(401).json({ error: "Пользователь не авторизован" });
        }

        if (isNaN(connectionId)) {
          return res.status(400).json({ error: "Некорректный ID связи" });
        }

        const connection = await storageInstance.getFunctionAssistant(
          connectionId
        );
        if (!connection) {
          return res.status(404).json({ error: "Связь не найдена" });
        }

        // Получаем ассистента, чтобы проверить права доступа
        const assistant = await storageInstance.getAssistant(
          connection.assistantId
        );
        if (!assistant) {
          return res.status(404).json({ error: "Ассистент не найден" });
        }

        // Проверяем права доступа
        const user = await storageInstance.getUser(userId);
        if (assistant.createdBy !== userId && user?.role !== "admin") {
          return res
            .status(403)
            .json({ error: "Нет прав на редактирование этой связи" });
        }

        const { notificationChannelId, enabled, channelEnabled, settings } =
          req.body;
        const updateData: Partial<InsertFunctionAssistant> = {};

        if (notificationChannelId !== undefined) {
          // Проверяем, существует ли канал оповещений
          const channel = await storageInstance.getNotificationChannel(
            notificationChannelId
          );
          if (!channel) {
            return res
              .status(404)
              .json({ error: "Канал оповещений не найден" });
          }
          updateData.notificationChannelId = notificationChannelId;
        }

        if (enabled !== undefined) updateData.enabled = enabled;
        if (channelEnabled !== undefined) {
          console.log(
            `[DEBUG] Обновление статуса канала для связи ${connectionId}: ${channelEnabled}`
          );
          updateData.channelEnabled = channelEnabled;
        }
        if (settings !== undefined) updateData.settings = settings;

        const updatedConnection = await storageInstance.updateFunctionAssistant(
          connectionId,
          updateData
        );

        // Создаем экземпляр обновления функций
        const updater = new FunctionToolsUpdater(storageInstance);

        // Если функция включена, используем addSingleFunction вместо syncAssistantFunctions
        if (enabled === true) {
          // Добавляем только одну конкретную функцию
          const addResult = await updater.addSingleFunction(
            connection.assistantId,
            connection.functionId
          );
          console.log(
            `[DEBUG] Результат добавления функции ${connection.functionId} для ассистента ${connection.assistantId}:`,
            JSON.stringify(addResult, null, 2)
          );

          res.json({
            ...updatedConnection,
            syncResult: {
              success: addResult.success,
              changes: {
                added: addResult.added ? [addResult.functionName] : [],
                removed: [],
              },
            },
          });
        } else {
          // Если функция отключена, используем полную синхронизацию для удаления
          const syncResult = await updater.syncAssistantFunctions(
            connection.assistantId
          );
          console.log(
            `[DEBUG] Результат синхронизации функций для ассистента ${connection.assistantId}:`,
            JSON.stringify(syncResult, null, 2)
          );

          res.json({
            ...updatedConnection,
            syncResult,
          });
        }
      } catch (error) {
        console.error(
          "Ошибка при обновлении связи ассистента с функцией:",
          error
        );
        res.status(500).json({ error: getErrorMessage(error) });
      }
    }
  );

  // Удаление связи
  app.delete(
    "/api/function-assistants/:id",
    authenticateToken,
    async (req, res) => {
      try {
        const connectionId = parseInt(req.params.id);
        const userId = req.user?.id;

        if (!userId) {
          return res.status(401).json({ error: "Пользователь не авторизован" });
        }

        if (isNaN(connectionId)) {
          return res.status(400).json({ error: "Некорректный ID связи" });
        }

        const connection = await storageInstance.getFunctionAssistant(
          connectionId
        );
        if (!connection) {
          return res.status(404).json({ error: "Связь не найдена" });
        }

        // Получаем ассистента, чтобы проверить права доступа
        const assistant = await storageInstance.getAssistant(
          connection.assistantId
        );
        if (!assistant) {
          return res.status(404).json({ error: "Ассистент не найден" });
        }

        // Проверяем права доступа
        const user = await storageInstance.getUser(userId);
        if (assistant.createdBy !== userId && user?.role !== "admin") {
          return res
            .status(403)
            .json({ error: "Нет прав на удаление этой связи" });
        }

        // Сохраняем ID ассистента и функции перед удалением связи
        const assistantId = connection.assistantId;
        const functionId = connection.functionId;

        console.log(
          `[DEBUG] Удаляем связь ассистента ${assistantId} с функцией ${functionId}`
        );

        // Получаем данные функции, чтобы знать её имя
        const functionData = await storageInstance.getOpenAiFunction(
          functionId
        );
        if (!functionData) {
          return res.status(404).json({ error: "Функция не найдена" });
        }

        // Удаляем запись из базы данных
        await storageInstance.deleteFunctionAssistant(connectionId);

        // Создаем экземпляр обновителя функций
        const updater = new FunctionToolsUpdater(storageInstance);

        // Удаляем функцию из ассистента OpenAI по имени (новый метод)
        const removeFunctionResult = await updater.removeFunctionByName(
          assistantId,
          functionData.name
        );

        if (!removeFunctionResult) {
          console.log(
            `[DEBUG] Не удалось напрямую удалить функцию ${functionData.name} из ассистента OpenAI, пробуем через синхронизацию`
          );

          // Если прямое удаление не удалось, пробуем через синхронизацию всех функций
          const syncResult = await updater.syncAssistantFunctions(assistantId);
          console.log(
            `[DEBUG] Результат синхронизации функций для ассистента ${assistantId} (удаление):`,
            JSON.stringify(syncResult, null, 2)
          );

          res.json({
            success: syncResult,
            message: syncResult
              ? `Функция ${functionData.name} успешно отключена от ассистента ${assistantId}`
              : `Ошибка при отключении функции ${functionData.name} от ассистента ${assistantId}`,
          });
        } else {
          console.log(
            `[DEBUG] Функция ${functionData.name} успешно удалена из ассистента OpenAI напрямую`
          );

          res.json({
            success: true,
            message: `Функция ${functionData.name} успешно отключена от ассистента ${assistantId}`,
          });
        }
      } catch (error) {
        console.error(
          "Ошибка при удалении связи ассистента с функцией:",
          error
        );
        res.status(500).json({ error: getErrorMessage(error) });
      }
    }
  );

  // Ручная синхронизация функций с ассистентом
  app.post(
    "/api/assistants/:assistantId/sync-functions",
    authenticateToken,
    async (req, res) => {
      try {
        const assistantId = parseInt(req.params.assistantId);
        const userId = req.user?.id;

        if (!userId) {
          return res.status(401).json({ error: "Пользователь не авторизован" });
        }

        if (isNaN(assistantId)) {
          return res.status(400).json({ error: "Некорректный ID ассистента" });
        }

        // Проверяем, существует ли ассистент
        const assistant = await storageInstance.getAssistant(assistantId);
        if (!assistant) {
          return res.status(404).json({ error: "Ассистент не найден" });
        }

        // Проверяем права доступа
        const user = await storageInstance.getUser(userId);
        if (assistant.createdBy !== userId && user?.role !== "admin") {
          return res
            .status(403)
            .json({ error: "Нет прав для выполнения этого действия" });
        }

        // Запускаем полную синхронизацию функций
        const updater = new FunctionToolsUpdater(storageInstance);
        const syncResult = await updater.syncAssistantFunctions(assistantId);

        console.log(
          `[DEBUG] Результат ручной синхронизации функций для ассистента ${assistantId}:`,
          JSON.stringify(syncResult, null, 2)
        );

        res.json({
          success: syncResult.success,
          changes: syncResult.changes,
        });
      } catch (error) {
        console.error("Ошибка при синхронизации функций с ассистентом:", error);
        res.status(500).json({ error: getErrorMessage(error) });
      }
    }
  );

  // Получение списка ассистентов подключенных к функции.
  app.get(
    "/api/channels/:channelId/assistants",
    authenticateToken,
    async (req, res) => {
      const channelId = parseInt(req.params.channelId);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Пользователь не авторизован" });
      }

      const assistants = await postgresStorage.getAssistantsByFunction(
        channelId
      );
      res.json(assistants);
    }
  );

  // Получение информации об исправленных ответах для диалога
  app.get(
    "/api/messages/corrections/:channelId/:conversationId",
    authenticateToken,
    async (req, res) => {
      try {
        const channelId = parseInt(req.params.channelId);
        const conversationId = req.params.conversationId;

        if (isNaN(channelId)) {
          return res.status(400).json({ message: "Invalid channel ID" });
        }

        // Получаем информацию о канале
        const channel = await storageInstance.getChannel(channelId);
        if (!channel) {
          return res.status(404).json({ message: "Канал не найден" });
        }

        // Проверяем права доступа к каналу
        if (channel.createdBy !== req.user.id) {
          return res.status(403).json({
            message: "У вас нет прав на просмотр исправлений в этом канале",
          });
        }

        // Получаем ассистента для диалога
        let assistant = null;
        const dialogAssistant =
          await storageInstance.getDialogAssistantByDialogAndChannel(
            conversationId.toString(),
            channelId
          );

        if (dialogAssistant) {
          assistant = await storageInstance.getAssistant(
            dialogAssistant.assistantId
          );
        } else {
          // Если нет ассистента для диалога, ищем дефолтного для канала
          const channelAssistants =
            await storageInstance.listAssistantChannelsByChannel(channelId);

          const defaultAssistant = channelAssistants.find((ac) => ac.isDefault);
          if (defaultAssistant) {
            assistant = await storageInstance.getAssistant(
              defaultAssistant.assistantId
            );
          }
        }

        if (!assistant) {
          return res.json({ corrections: [] }); // Если нет ассистента, возвращаем пустой массив
        }

        // Получаем все исправления для этого ассистента из БД
        // Фильтруем по dialogId для конкретного диалога
        const examples = await db
          .select()
          .from(assistantExamples)
          .where(
            and(
              eq(assistantExamples.assistantId, assistant.id),
              eq(assistantExamples.dialogId, conversationId.toString())
            )
          );

        // Возвращаем информацию об исправлениях
        const corrections = examples.map((ex) => ({
          userQuery: ex.userQuery,
          originalResponse: ex.originalResponse,
          correctedResponse: ex.correctedResponse,
          createdAt: ex.createdAt,
        }));

        res.json({ corrections });
      } catch (error) {
        console.error("Ошибка при получении исправлений:", error);
        res.status(500).json({
          message: "Не удалось получить информацию об исправлениях",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  const httpServer = createServer(app);

  return httpServer;
}
