/**
 * Утилита для детерминированного расчета метрик системы
 * Обеспечивает стабильные, воспроизводимые результаты для одинаковых входных данных
 */

import { db } from "../db";
import { eq, and, gte, lte, sql, inArray } from "drizzle-orm";
import { messages, conversations } from "../../shared/schema";
import { analyzeTopics, TopicData } from "./topic-analyzer";
import { storage as storageInstance } from "../storage";

// Задаем время кэширования результатов (5 минут)
const CACHE_TTL = 1 * 60 * 1000;

// Интерфейс для кэша метрик
interface MetricsResult {
  totalConversations: number;
  totalMessages: number;
  avgResponseTime: number;
  successRate: number;
  topicData: TopicData;
}

// Интерфейс для кэша метрик по периодам
export interface MetricsCache {
  [period: string]: {
    lastCalculation: number;
    metrics: MetricsResult | null;
  };
}

// Кэш для хранения результатов расчетов метрик по периодам
export const metricsCache: MetricsCache = {
  day: { lastCalculation: 0, metrics: null },
  week: { lastCalculation: 0, metrics: null },
  month: { lastCalculation: 0, metrics: null },
  year: { lastCalculation: 0, metrics: null },
};

/**
 * Рассчитывает среднее время ответа на основе сообщений
 * @param messagesList - Список сообщений для анализа
 * @returns Среднее время ответа в миллисекундах
 */
export const calculateAvgResponseTime = (messagesList: any[]): number => {
  // Сортируем сообщения по conversationId и времени создания
  // Добавляем id как третий критерий сортировки для абсолютного детерминизма
  const sortedMessages = [...messagesList].sort((a: any, b: any) => {
    if (a.conversationId !== b.conversationId) {
      return a.conversationId - b.conversationId;
    }
    const timeA = new Date(a.timestamp || a.createdAt).getTime();
    const timeB = new Date(b.timestamp || b.createdAt).getTime();
    if (timeA !== timeB) {
      return timeA - timeB;
    }
    // Если времена создания совпадают, используем ID для стабильной сортировки
    return a.id - b.id;
  });

  let totalResponseTime = 0;
  let responseCount = 0;

  // Группируем сообщения по диалогам
  const conversationMap = new Map<number, any[]>();

  sortedMessages.forEach((msg) => {
    if (!conversationMap.has(msg.conversationId)) {
      conversationMap.set(msg.conversationId, []);
    }
    const messages = conversationMap.get(msg.conversationId);
    if (messages) {
      messages.push(msg);
    }
  });

  // Для каждого диалога рассчитываем время ответа
  const conversationIds = Array.from(conversationMap.keys()).sort(
    (a, b) => a - b
  );

  for (const conversationId of conversationIds) {
    const conversationMessages = conversationMap.get(conversationId);
    if (!conversationMessages) continue;

    // Дополнительно сортируем сообщения по времени и id для гарантии порядка
    conversationMessages.sort((a: any, b: any) => {
      const timeA = new Date(a.timestamp || a.createdAt).getTime();
      const timeB = new Date(b.timestamp || b.createdAt).getTime();
      if (timeA !== timeB) {
        return timeA - timeB;
      }
      return a.id - b.id;
    });

    for (let i = 0; i < conversationMessages.length - 1; i++) {
      const current = conversationMessages[i];
      const next = conversationMessages[i + 1];

      // Если текущее сообщение от пользователя, а следующее от ассистента - это пара вопрос-ответ
      if (current.senderType === "user" && next.senderType === "assistant") {
        const currentTime = new Date(
          current.timestamp || current.createdAt
        ).getTime();
        const nextTime = new Date(next.timestamp || next.createdAt).getTime();
        const responseTime = nextTime - currentTime;

        // Игнорируем нереалистично быстрые ответы (менее 100 мс) и очень долгие ответы (более 30 секунд)
        if (responseTime >= 100 && responseTime <= 30000) {
          totalResponseTime += responseTime;
          responseCount++;
        }
      }
    }
  }

  // Если нет данных, возвращаем 0, иначе округляем до целого числа
  return responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0;
};

/**
 * Рассчитывает процент успешных ответов
 * @param messagesList - Список сообщений для анализа
 * @returns Процент успешных ответов (0-100)
 */
export const calculateSuccessRate = (messagesList: any[]): number => {
  // Если нет сообщений вообще, возвращаем 0
  if (!messagesList || messagesList.length === 0) {
    return 0;
  }

  // Сортируем сообщения по conversationId и времени создания
  const sortedMessages = [...messagesList].sort((a: any, b: any) => {
    if (a.conversationId !== b.conversationId) {
      return a.conversationId - b.conversationId;
    }
    const timeA = new Date(a.timestamp || a.createdAt).getTime();
    const timeB = new Date(b.timestamp || b.createdAt).getTime();
    return timeA - timeB;
  });

  // Группируем сообщения по диалогам
  const conversationMap = new Map<number, any[]>();

  sortedMessages.forEach((msg) => {
    if (!conversationMap.has(msg.conversationId)) {
      conversationMap.set(msg.conversationId, []);
    }
    const messages = conversationMap.get(msg.conversationId);
    if (messages) {
      messages.push(msg);
    }
  });

  // Ключевые фразы, которые могут указывать на проблемный ответ
  const errorPhrases = [
    "извините, я не могу",
    "извините, но я не могу",
    "я не понимаю",
    "не удалось",
    "ошибка",
    "не знаю",
    "не могу ответить",
    "не имею доступа",
    "недостаточно информации",
    "не удалось найти",
  ];

  let totalAssistantResponses = 0;
  let successfulResponses = 0;

  // Проходим по каждому диалогу
  conversationMap.forEach((messages) => {
    for (let i = 1; i < messages.length; i++) {
      const prevMessage = messages[i - 1];
      const currentMessage = messages[i];

      // Если текущее сообщение от ассистента и предыдущее от пользователя
      if (
        currentMessage.senderType === "assistant" &&
        prevMessage.senderType === "user"
      ) {
        totalAssistantResponses++;

        // Проверяем содержимое на наличие ключевых фраз, указывающих на проблему
        const content = currentMessage.content.toLowerCase();
        const hasErrorPhrase = errorPhrases.some((phrase) =>
          content.includes(phrase.toLowerCase())
        );

        // Если ошибки не найдены, считаем ответ успешным
        if (!hasErrorPhrase) {
          successfulResponses++;
        }
      }
    }
  });

  // Если нет ответов ассистента на сообщения пользователя, возвращаем 0
  if (totalAssistantResponses === 0) {
    return 0;
  }

  // Возвращаем процент успешных ответов
  return Math.round((successfulResponses / totalAssistantResponses) * 100);
};

/**
 * Принудительно очищает весь кэш метрик
 */
export function clearMetricsCache(): void {
  Object.keys(metricsCache).forEach((period) => {
    metricsCache[period].lastCalculation = 0;
    metricsCache[period].metrics = null;
  });
}

/**
 * Комплексный расчет всех метрик
 * @param startDate - Начальная дата для расчета
 * @param period - Период ('day', 'week', 'month', 'year')
 * @param userId - ID пользователя для фильтрации данных (опционально)
 * @returns Объект с рассчитанными метриками
 */
export const calculateAllMetrics = async (
  startDate: Date,
  period: string = "week",
  userId?: string
): Promise<MetricsResult> => {
  // Проверяем, есть ли актуальный кэш для указанного периода
  const now = Date.now();
  const cachePeriod = period || "week";

  // Создаем уникальный ключ кэша с учетом userId
  const cacheKey = userId ? `${cachePeriod}_user_${userId}` : cachePeriod;

  // Инициализируем кэш для периода, если он не существует
  if (!metricsCache[cacheKey]) {
    metricsCache[cacheKey] = { lastCalculation: 0, metrics: null };
  }

  const cache = metricsCache[cacheKey];

  if (cache.metrics && now - cache.lastCalculation < CACHE_TTL) {
    return cache.metrics;
  }

  // Получаем все диалоги с учетом даты
  let allConversations = await storageInstance.listConversations(
    undefined, // status
    startDate // startDate
  );

  // Фильтруем по пользователю, если указан userId
  if (userId) {
    const userIdNumber = parseInt(userId);
    allConversations = allConversations.filter(
      (conv) => conv.createdBy === userIdNumber
    );
  }

  // Получаем сообщения с фильтрацией по пользователю, если указан
  let recentMessages: any[];
  if (userId && allConversations.length > 0) {
    // Фильтруем сообщения по диалогам пользователя
    const userConversationIds = allConversations.map((conv) => conv.id);
    recentMessages = await db
      .select()
      .from(messages)
      .where(
        and(
          sql`${messages.timestamp} >= ${startDate.toISOString()}`,
          inArray(messages.conversationId, userConversationIds)
        )
      );
  } else if (userId && allConversations.length === 0) {
    // У пользователя нет диалогов
    recentMessages = [];
  } else {
    // Получаем все сообщения за указанный период (глобальный режим)
    recentMessages = await db
      .select()
      .from(messages)
      .where(sql`${messages.timestamp} >= ${startDate.toISOString()}`);
  }

  // Определяем диалоги, в которых были сообщения за период
  const activeConversationIds = new Set(
    recentMessages.map((msg) => msg.conversationId)
  );

  // Фильтруем беседы, в которых действительно были сообщения за период
  const activeConversations = allConversations.filter((conv) =>
    activeConversationIds.has(conv.id)
  );

  // Фильтруем сообщения только от ассистента
  const assistantMessages = recentMessages.filter(
    (msg) => msg.senderType === "assistant"
  );

  // Рассчитываем все метрики
  const avgResponseTime = calculateAvgResponseTime(recentMessages);
  const successRate = calculateSuccessRate(recentMessages);
  const topicData = analyzeTopics(recentMessages);

  // Создаем результат
  const result: MetricsResult = {
    totalConversations: activeConversations.length,
    totalMessages: assistantMessages.length,
    avgResponseTime,
    successRate,
    topicData,
  };

  // Кэшируем результат
  metricsCache[cacheKey].metrics = result;
  metricsCache[cacheKey].lastCalculation = now;

  console.log(
    `[METRICS] Рассчитаны метрики [${cacheKey}]: ${activeConversations.length} диалогов, ${assistantMessages.length} сообщений, время ответа: ${avgResponseTime}мс, успешность: ${successRate}%`
  );

  return result;
};
