import { db } from "../db";
import { eq } from "drizzle-orm";
import { assistantExamples } from "@shared/schema";
import { OpenAIService } from "./openai";

/**
 * Сервис для обучения ассистентов с помощью исправленных ответов
 */
export class AssistantTrainingService {
  private openaiService: OpenAIService;

  constructor(openaiService: OpenAIService) {
    this.openaiService = openaiService;
  }

  /**
   * Сохраняет исправление ответа ассистента и обновляет его инструкции
   *
   * @param assistantId ID ассистента в локальной БД
   * @param openaiAssistantId ID ассистента в OpenAI
   * @param userQuery Запрос пользователя
   * @param originalResponse Оригинальный ответ ассистента
   * @param correctedResponse Исправленный ответ
   * @param instructions Базовые инструкции ассистента
   * @param channelId ID канала (опционально)
   * @param conversationId ID диалога (опционально)
   * @param dialogId ID диалога в конкретном сервисе (опционально)
   */
  async saveCorrection(
    assistantId: number,
    openaiAssistantId: string,
    userQuery: string,
    originalResponse: string,
    correctedResponse: string,
    instructions: string,
    channelId?: number,
    conversationId?: string,
    dialogId?: string
  ): Promise<{ success: boolean }> {
    try {
      // 1. Сохраняем пример в базу данных
      await db.insert(assistantExamples).values({
        assistantId,
        userQuery,
        originalResponse,
        correctedResponse,
        channelId,
        conversationId,
        dialogId,
        updatedAt: new Date(),
      });

      // 2. Получаем все примеры для этого ассистента
      const examples = await db
        .select()
        .from(assistantExamples)
        .where(eq(assistantExamples.assistantId, assistantId));

      // 3. Формируем инструкции с примерами
      const examplesFormatted = examples
        .map(
          (ex) =>
            `Когда пользователь спрашивает: "${ex.userQuery}"\n` +
            `Отвечай в стиле: "${ex.correctedResponse}"\n\n`
        )
        .join("");

      const instructionsWithExamples =
        `${instructions}\n\n` + `ПРИМЕРЫ ОТВЕТОВ:\n${examplesFormatted}`;

      // 4. Обновляем инструкции ассистента в OpenAI
      await this.openaiService.updateAssistant(openaiAssistantId, {
        instructions: instructionsWithExamples,
      });

      // 5. Сохраняем исправление в методе OpenAI для совместимости с существующим кодом
      await this.openaiService.saveTrainingCorrection(
        openaiAssistantId,
        userQuery,
        correctedResponse
      );

      return { success: true };
    } catch (error) {
      console.error("Ошибка при сохранении исправления:", error);
      throw error;
    }
  }

  /**
   * Получает все примеры для ассистента
   *
   * @param assistantId ID ассистента
   */
  async getExamples(assistantId: number) {
    try {
      return await db
        .select()
        .from(assistantExamples)
        .where(eq(assistantExamples.assistantId, assistantId));
    } catch (error) {
      console.error("Ошибка при получении примеров:", error);
      throw error;
    }
  }

  /**
   * Проверяет наличие исправленного ответа для запроса пользователя
   *
   * @param assistantId ID ассистента
   * @param userQuery Запрос пользователя
   * @returns Исправленный ответ или null, если не найден
   */
  async findCorrectedResponse(
    assistantId: number,
    userQuery: string
  ): Promise<string | null> {
    try {
      const examples = await db
        .select()
        .from(assistantExamples)
        .where(eq(assistantExamples.assistantId, assistantId));

      const matchingExample = examples.find(
        (ex) =>
          userQuery.toLowerCase().trim() === ex.userQuery.toLowerCase().trim()
      );

      if (matchingExample) {
        console.log(`Найдено исправление для запроса: ${userQuery}`);
        return matchingExample.correctedResponse;
      }

      return null;
    } catch (error) {
      console.error("Ошибка при поиске исправленного ответа:", error);
      return null;
    }
  }
}
