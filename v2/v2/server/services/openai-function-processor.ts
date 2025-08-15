/**
 * Обработчик вызовов функций OpenAI для отправки данных в каналы уведомлений
 */
import { IStorage } from "../storage";
import { FunctionHandler } from "./function-handler";

// Интерфейс для вызова функции
interface FunctionCall {
  name: string;
  arguments: any;
}

// Интерфейс для инструмента OpenAI
interface ToolCall {
  id: string;
  function?: {
    name?: string;
    arguments?: string;
  };
}

// Результат обработки функции
interface FunctionResult {
  tool_call_id: string;
  output: string;
}

/**
 * Класс для обработки вызовов функций OpenAI и отправки данных в каналы уведомлений
 */
export class OpenAIFunctionProcessor {
  private storage: IStorage;
  private functionHandler: FunctionHandler;

  constructor(storage: IStorage) {
    this.storage = storage;
    this.functionHandler = new FunctionHandler(storage);
  }

  /**
   * Обрабатывает вызовы функций OpenAI
   * @param assistantOpenAIId ID ассистента в OpenAI
   * @param toolCalls Массив вызовов функций от OpenAI
   * @returns Массив результатов обработки функций
   */
  public async processFunctionCalls(
    assistantOpenAIId: string,
    toolCalls: ToolCall[]
  ): Promise<FunctionResult[]> {
    console.log(
      `\n=== ОБРАБОТКА ${toolCalls.length} ФУНКЦИЙ ДЛЯ АССИСТЕНТА ${assistantOpenAIId} ===`
    );

    // Получаем ID ассистента из базы данных
    const assistantData = await this.storage.getAssistantByOpenAIId(
      assistantOpenAIId
    );
    if (!assistantData) {
      console.error(
        `Ассистент с OpenAI ID ${assistantOpenAIId} не найден в базе данных`
      );
      return this.createDefaultResponses(
        toolCalls,
        "Ассистент не найден в базе данных"
      );
    }

    console.log(
      `Найден ассистент в БД: ID=${assistantData.id}, Name=${assistantData.name}`
    );

    // Обрабатываем каждый вызов функции
    const results: FunctionResult[] = [];

    for (const tool of toolCalls) {
      try {
        console.log(`\n[Функция] ID: ${tool.id}, Имя: ${tool.function?.name}`);

        // Пытаемся разобрать аргументы функции
        const args = JSON.parse(tool.function?.arguments || "{}");
        console.log(`Аргументы: ${JSON.stringify(args, null, 2)}`);

        // Формируем объект вызова функции
        const functionCall: FunctionCall = {
          name: tool.function?.name || "",
          arguments: args,
        };

        // Вызываем обработчик функции
        console.log(`Вызов handleFunctionCall для ${functionCall.name}`);
        const result = await this.functionHandler.handleFunctionCall(
          assistantData.id,
          functionCall
        );
        console.log(`Результат: ${JSON.stringify(result, null, 2)}`);

        // Добавляем результат в массив
        results.push({
          tool_call_id: tool.id,
          output: JSON.stringify(result),
        });
      } catch (error) {
        console.error(
          `Ошибка при обработке функции ${tool.function?.name}:`,
          error
        );
        results.push({
          tool_call_id: tool.id,
          output: JSON.stringify({
            success: false,
            error:
              error instanceof Error ? error.message : "Неизвестная ошибка",
            message: `Ошибка при обработке функции ${tool.function?.name}`,
          }),
        });
      }
    }

    return results;
  }

  /**
   * Создает заглушки ответов в случае ошибки
   * @param toolCalls Массив вызовов функций
   * @param errorMessage Сообщение об ошибке
   * @returns Массив заглушек ответов
   */
  private createDefaultResponses(
    toolCalls: ToolCall[],
    errorMessage: string
  ): FunctionResult[] {
    return toolCalls.map((tool) => ({
      tool_call_id: tool.id,
      output: JSON.stringify({
        success: false,
        error: errorMessage,
        message: `Не удалось обработать функцию ${tool.function?.name}`,
      }),
    }));
  }
}
