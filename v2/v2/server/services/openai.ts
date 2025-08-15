import fs from "fs";
import path from "path";
import { tmpdir } from "os";
import { writeFileSync, unlinkSync } from "fs";
import { GeminiService } from "./gemini";
import { storage } from "../storage";

// DEPRECATED: OpenAI replaced with Gemini
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const DEFAULT_MODEL = "gemini-2.0-flash-exp";

// Check if the Gemini API key is set
const hasGeminiKey = !!process.env.GEMINI_API_KEY;

// Initialize the Gemini client
const gemini = new GeminiService();

// Интерфейс для объекта исправленного ответа
interface CorrectionItem {
  query: string;
  correctedResponse: string;
}

// Интерфейс для хранения всех исправлений для конкретного ассистента
interface AssistantCorrections {
  [assistantId: string]: CorrectionItem[];
}

// Интерфейс сообщения треда
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

// Интерфейс статуса выполнения ассистента
interface RunStatus {
  id: string;
  status:
    | "queued"
    | "in_progress"
    | "completed"
    | "failed"
    | "cancelled"
    | "expired"
    | "requires_action";
  thread_id: string;
  assistant_id: string;
  created_at: number;
  completed_at?: number;
  error?: any;
  required_action?: {
    type: string;
    submit_tool_outputs?: {
      tool_calls: Array<{
        id: string;
        type: string;
        function?: {
          name?: string;
          arguments?: string;
        };
      }>;
    };
  };
}

// Определите тип ToolCall
interface ToolCall {
  id: string;
  type: string;
  function?: {
    name?: string;
    arguments?: string;
  };
}

export class OpenAIService {
  // Хранилище исправлений ответов для каждого ассистента
  private corrections: AssistantCorrections = {};

  // Check if Gemini API key is configured (OpenAI API deprecated)
  private checkApiKey() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error(
        "Gemini API key is not configured. Please set the GEMINI_API_KEY environment variable."
      );
    }
  }

  // Вспомогательная функция для безопасного чтения ответа от API
  private async safelyReadResponseData(response: Response) {
    if (response.ok) {
      return await response.json();
    } else {
      const responseClone = response.clone();
      let errorMessage = `Ошибка ${response.status}: `;
      try {
        const errorData = await response.json();
        errorMessage += errorData.error?.message || "Ошибка API";
        return { error: errorMessage, data: errorData };
      } catch (jsonError) {
        try {
          const errorText = await responseClone.text();
          errorMessage += errorText || "Неизвестная ошибка";
          return { error: errorMessage, data: null };
        } catch (textError) {
          errorMessage += "Не удалось прочитать ответ";
          return { error: errorMessage, data: null };
        }
      }
    }
  }
  // Создание ассистента (теперь через Gemini)
  async createAssistant(name: string, instructions?: string) {
    try {
      this.checkApiKey();
      // Используем Gemini сервис вместо OpenAI API
      return await gemini.createAssistant(name, instructions);
    } catch (error: unknown) {
      console.error("Ошибка при создании ассистента:", error);
      throw new Error(
        `Ошибка при создании ассистента: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  // Обновление ассистента
  async updateAssistant(
    assistantId: string,
    updates: { name?: string; instructions?: string }
  ) {
    try {
      // Прямой вызов API для совместимости с v2
      const response = await fetch(
        `https://api.openai.com/v1/assistants/${assistantId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
          },
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        let errorMessage = `Ошибка ${response.status}: `;
        try {
          const errorData = await response.json();
          errorMessage +=
            errorData.error?.message || "Ошибка обновления ассистента";
        } catch (jsonError) {
          const errorText = await response.text();
          errorMessage +=
            errorText || "Неизвестная ошибка обновления ассистента";
        }
        throw new Error(errorMessage);
      }

      const assistant = await response.json();
      return assistant;
    } catch (error: unknown) {
      console.error("Ошибка при обновлении ассистента:", error);
      throw new Error(
        `Ошибка при обновлении ассистента: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  // Удаление ассистента
  async deleteAssistant(assistantId: string) {
    try {
      // Прямой вызов API для совместимости с v2
      const response = await fetch(
        `https://api.openai.com/v1/assistants/${assistantId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
          },
        }
      );

      if (!response.ok) {
        let errorMessage = `Ошибка ${response.status}: `;
        try {
          const errorData = await response.json();
          errorMessage +=
            errorData.error?.message || "Ошибка удаления ассистента";
        } catch (jsonError) {
          const errorText = await response.text();
          errorMessage += errorText || "Неизвестная ошибка удаления ассистента";
        }
        throw new Error(errorMessage);
      }

      return { success: true, deleted: true };
    } catch (error: unknown) {
      console.error("Ошибка при удалении ассистента:", error);
      throw new Error(
        `Ошибка при удалении ассистента: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  // Получение ассистента
  async getAssistant(assistantId: string) {
    try {
      // Прямой вызов API для совместимости с v2
      const response = await fetch(
        `https://api.openai.com/v1/assistants/${assistantId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
          },
        }
      );

      if (!response.ok) {
        let errorMessage = `Ошибка ${response.status}: `;
        try {
          const errorData = await response.json();
          errorMessage +=
            errorData.error?.message || "Ошибка получения ассистента";
        } catch (jsonError) {
          const errorText = await response.text();
          errorMessage +=
            errorText || "Неизвестная ошибка получения ассистента";
        }
        throw new Error(errorMessage);
      }

      const assistant = await response.json();
      return assistant;
    } catch (error: unknown) {
      console.error("Ошибка при получении ассистента:", error);
      throw new Error(
        `Ошибка при получении ассистента: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  // Загрузка файла для ассистента
  async uploadFile(file: Buffer, fileName: string) {
    try {
      console.log("[UPLOAD] Начало загрузки файла:", fileName);

      const fileSizeInMB = file.length / (1024 * 1024);
      if (fileSizeInMB > 20) {
        throw new Error(
          `Файл слишком большой: ${fileSizeInMB.toFixed(2)}MB. Максимум 20MB.`
        );
      }

      const extension = path.extname(fileName).toLowerCase().replace(".", "");
      const supportedExtensions = ["txt", "pdf", "docx", "doc"];

      if (!supportedExtensions.includes(extension)) {
        throw new Error(
          `Неподдерживаемый формат файла: ${extension}. Допустимые: ${supportedExtensions.join(
            ", "
          )}`
        );
      }

      if (!openai) {
        throw new Error("OpenAI SDK не инициализирован (openai = null)");
      }

      // Генерируем временный путь для сохранения файла
      const tempFilePath = path.join(tmpdir(), `${Date.now()}-${fileName}`);
      writeFileSync(tempFilePath, file);

      // Создаем поток из файла
      const stream = fs.createReadStream(tempFilePath);
      const uploaded = await openai.files.create({
        file: stream as any, // обходим типизацию Uploadable
        purpose: "assistants",
      });

      console.log(
        `[UPLOAD] ${new Date().toLocaleString()} Файл успешно загружен: ID = ${
          uploaded.id
        }`
      );

      // Удаляем временный файл
      // unlinkSync(tempFilePath);
      // console.log("[UPLOAD] Временный файл удалён");

      return { fileId: uploaded.id, fileName };
    } catch (error: any) {
      console.error(
        "[UPLOAD] Ошибка при загрузке файла:",
        error?.message || error
      );
      throw new Error(
        `Ошибка при загрузке файла: ${error?.message || "Неизвестная ошибка"}`
      );
    }
  }

  // Добавление файла к ассистенту
  async attachFileToAssistant(assistantId: string, fileId: string) {
    try {
      console.log(
        `ОТЛАДКА V2: Попытка прикрепить файл ${fileId} к ассистенту ${assistantId}`
      );

      // Проверим сначала, существует ли ассистент с таким ID
      try {
        console.log(
          `ОТЛАДКА V2: Проверяем существование ассистента ${assistantId}`
        );
        const checkAssistant = await this.getAssistant(assistantId);
        console.log(`ОТЛАДКА V2: Ассистент найден:`, checkAssistant);
      } catch (checkError) {
        console.error(
          `ОТЛАДКА V2: Ошибка при проверке ассистента:`,
          checkError
        );

        // Если ассистент не найден, возможно, он был создан в API v1, пробуем создать новый
        console.log(
          `ОТЛАДКА V2: Пробуем создать нового ассистента через API v2`
        );
        const newAssistant = await this.createAssistant("Временный ассистент");
        assistantId = newAssistant.id;
        console.log(`ОТЛАДКА V2: Создан новый ассистент с ID ${assistantId}`);
      }

      // В API v2 изменилась структура API для файлов
      // Теперь мы должны обновить ассистента с новым инструментом tool_resources
      console.log(
        `ОТЛАДКА V2: Обновляем ассистента для прикрепления файла ${fileId}`
      );

      // Получаем текущие настройки ассистента
      const assistant = await this.getAssistant(assistantId);
      console.log(`ОТЛАДКА V2: Текущие настройки ассистента:`, assistant);

      // Обновляем настройки ассистента, добавляя fileId в tool_resources.file_search.vector_store_ids для file_search
      // или в tool_resources.code_interpreter.file_ids для code_interpreter
      const fileSearchEnabled = assistant.tools.some(
        (tool: any) => tool.type === "file_search"
      );
      const codeInterpreterEnabled = assistant.tools.some(
        (tool: any) => tool.type === "code_interpreter"
      );

      const url = `https://api.openai.com/v1/assistants/${assistantId}`;
      console.log(`ОТЛАДКА V2: URL запроса: ${url}`);

      // Создаем структуру tool_resources на основе текущей конфигурации
      const tool_resources: any = { ...assistant.tool_resources };

      // Добавляем файл в соответствующий ресурс
      if (fileSearchEnabled) {
        if (!tool_resources.file_search)
          tool_resources.file_search = { vector_store_ids: [] };
        if (!tool_resources.file_search.vector_store_ids)
          tool_resources.file_search.vector_store_ids = [];

        // Проверим, существует ли уже vector store для этого ассистента
        let vectorStoreId = null;
        if (tool_resources.file_search.vector_store_ids.length > 0) {
          // Берем первый vector store для обновления
          vectorStoreId = tool_resources.file_search.vector_store_ids[0];
          console.log(
            `ОТЛАДКА V2: Найден существующий vector store ${vectorStoreId}, обновляем его`
          );

          // Получаем информацию о текущем векторном хранилище
          const getVectorStore = await fetch(
            `https://api.openai.com/v1/vector_stores/${vectorStoreId}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                "OpenAI-Beta": "assistants=v2",
              },
            }
          );

          if (getVectorStore.ok) {
            const existingVectorStore = await getVectorStore.json();
            console.log(
              `ОТЛАДКА V2: Текущий vector store:`,
              existingVectorStore
            );

            // Добавляем новый файл к существующим
            const existingFileIds = existingVectorStore.file_ids || [];
            // Проверяем, не прикреплен ли файл уже
            if (!existingFileIds.includes(fileId)) {
              console.log(
                `ОТЛАДКА V2: Добавляем файл ${fileId} напрямую в векторное хранилище ${vectorStoreId}`
              );

              try {
                // Используем метод для прямого добавления файла в векторное хранилище
                const result = await this.addFileToVectorStore(
                  vectorStoreId,
                  fileId
                );

                // Сохраняем тот же ID хранилища в ассистенте
                tool_resources.file_search.vector_store_ids = [vectorStoreId];
                console.log(
                  `ОТЛАДКА V2: Файл успешно добавлен в векторное хранилище:`,
                  result
                );
              } catch (addError) {
                console.error(
                  "ОТЛАДКА V2: Ошибка при добавлении файла в vector store:",
                  addError
                );
                console.log(
                  "ОТЛАДКА V2: Пробуем создать новое хранилище с обновленным списком файлов"
                );

                // Если метод добавления не сработал, используем подход с созданием нового хранилища
                const newVectorStoreResponse = await fetch(
                  `https://api.openai.com/v1/vector_stores`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                      "OpenAI-Beta": "assistants=v2",
                    },
                    body: JSON.stringify({
                      name: `updated_store_${Date.now()}`,
                      file_ids: [...existingFileIds, fileId],
                    }),
                  }
                );

                if (!newVectorStoreResponse.ok) {
                  const vectorStoreError = await newVectorStoreResponse.json();
                  console.error(
                    "ОТЛАДКА V2: Ошибка при создании нового vector store:",
                    vectorStoreError
                  );
                  throw new Error(
                    `Ошибка при создании нового vector store: ${vectorStoreError.error?.message}`
                  );
                }

                const newVectorStore = await newVectorStoreResponse.json();

                // Обновляем ID хранилища в ассистенте
                tool_resources.file_search.vector_store_ids = [
                  newVectorStore.id,
                ];
                console.log(
                  `ОТЛАДКА V2: Создан новый vector store вместо добавления файла:`,
                  newVectorStore
                );
              }
            } else {
              console.log(
                `ОТЛАДКА V2: Файл ${fileId} уже прикреплен к vector store ${vectorStoreId}`
              );
            }
          } else {
            console.error(
              "ОТЛАДКА V2: Не удалось получить информацию о векторном хранилище:",
              await getVectorStore.text()
            );
            // Если не удалось получить информацию, создаем новое хранилище
            vectorStoreId = null;
          }
        }

        // Если нет существующего vector store или не удалось обновить существующий, создаем новый
        if (!vectorStoreId) {
          console.log(
            `ОТЛАДКА V2: Создаем новый vector store для файла ${fileId}`
          );
          const vectorStoreResponse = await fetch(
            `https://api.openai.com/v1/vector_stores`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                "OpenAI-Beta": "assistants=v2",
              },
              body: JSON.stringify({
                name: `store_for_${fileId.split("-")[1]}`,
                file_ids: [fileId],
              }),
            }
          );

          if (!vectorStoreResponse.ok) {
            const vectorStoreError = await vectorStoreResponse.json();
            console.error(
              "ОТЛАДКА V2: Ошибка при создании vector store:",
              vectorStoreError
            );
            throw new Error(
              `Ошибка при создании vector store: ${vectorStoreError.error?.message}`
            );
          }

          const vectorStore = await vectorStoreResponse.json();
          console.log(`ОТЛАДКА V2: Создан vector store:`, vectorStore);

          // Очищаем существующие vector_store_ids и добавляем новый
          tool_resources.file_search.vector_store_ids = [vectorStore.id];
        }
      }

      // Не добавляем файлы в code_interpreter
      // Файлы из базы знаний должны использоваться только через векторное хранилище
      if (codeInterpreterEnabled) {
        // Проверяем, инициализирован ли объект tool_resources.code_interpreter
        if (!tool_resources.code_interpreter)
          tool_resources.code_interpreter = { file_ids: [] };
        if (!tool_resources.code_interpreter.file_ids)
          tool_resources.code_interpreter.file_ids = [];

        // Не добавляем файлы в code_interpreter, чтобы они использовались только для поиска
        // tool_resources.code_interpreter.file_ids.push(fileId);
        console.log(
          `ОТЛАДКА V2: Файл ${fileId} не добавлен в code_interpreter, будет использоваться только в векторном хранилище`
        );
      }

      const requestBody = {
        tool_resources,
      };
      console.log(
        `ОТЛАДКА V2: Тело запроса:`,
        JSON.stringify(requestBody, null, 2)
      );

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2",
      };
      console.log(`ОТЛАДКА V2: Заголовки запроса:`, headers);

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });

      console.log(`ОТЛАДКА V2: Статус ответа: ${response.status}`);
      console.log(
        `ОТЛАДКА V2: Заголовки ответа:`,
        Object.fromEntries(response.headers.entries())
      );

      // Проверяем ответ
      if (!response.ok) {
        let errorMessage = `Ошибка ${response.status}: `;
        try {
          // Пробуем получить JSON с ошибкой
          const errorData = await response.json();
          errorMessage +=
            errorData.error?.message || "Ошибка прикрепления файла";
          console.error(
            "ОТЛАДКА V2: Ошибка при прикреплении файла (JSON):",
            errorData
          );
        } catch (jsonError) {
          // Если не получается распарсить JSON, используем текст ответа
          const errorText = await response.text();
          errorMessage += errorText || "Неизвестная ошибка прикрепления файла";
          console.error(
            "ОТЛАДКА V2: Ошибка при прикреплении файла (текст):",
            errorText
          );
        }
        throw new Error(errorMessage);
      }

      // Получаем ответ
      const responseData = await response.json();
      console.log(
        "ОТЛАДКА V2: Ответ API после прикрепления файла:",
        JSON.stringify(responseData, null, 2)
      );

      // Получаем обновленного ассистента для проверки
      const updatedAssistant = await this.getAssistant(assistantId);
      console.log(
        `ОТЛАДКА V2: Файл ${fileId} успешно прикреплен к ассистенту ${assistantId}`
      );
      console.log(
        "ОТЛАДКА V2: Обновленный ассистент:",
        JSON.stringify(updatedAssistant, null, 2)
      );

      return updatedAssistant;
    } catch (error: any) {
      console.error(
        "ОТЛАДКА V2: Ошибка при добавлении файла к ассистенту:",
        error
      );
      throw new Error(
        `Ошибка при добавлении файла к ассистенту: ${
          error.message || "Неизвестная ошибка"
        }`
      );
    }
  }

  // Метод для добавления файла в векторное хранилище
  async addFileToVectorStore(vectorStoreId: string, fileId: string) {
    try {
      console.log(
        `Добавление файла ${fileId} в векторное хранилище ${vectorStoreId}...`
      );

      // Используем API OpenAI для добавления файла в векторное хранилище
      const response = await fetch(
        `https://api.openai.com/v1/vector_stores/${vectorStoreId}/files`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
          },
          body: JSON.stringify({
            file_id: fileId, // Правильный ключ - file_id (единичный ID файла)
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(
          "Ошибка при добавлении файла в векторное хранилище:",
          errorData
        );
        throw new Error(
          `Ошибка при добавлении файла в векторное хранилище: ${
            errorData.error?.message || response.statusText
          }`
        );
      }

      const result = await response.json();
      console.log(`Файл успешно добавлен в векторное хранилище:`, result);
      return result;
    } catch (error: any) {
      console.error(
        `Ошибка при добавлении файла ${fileId} в векторное хранилище ${vectorStoreId}:`,
        error
      );
      throw new Error(
        `Ошибка при добавлении файла в векторное хранилище: ${
          error.message || "Неизвестная ошибка"
        }`
      );
    }
  }

  // Метод для обновления vector_store по API v2 (УСТАРЕЛ)
  async updateVectorStore(
    vectorStoreId: string,
    options: { name?: string; file_ids?: string[] }
  ) {
    try {
      console.log(
        `ОТЛАДКА V2: Обновляем vector store ${vectorStoreId} с параметрами:`,
        options
      );

      // Этот метод не работает напрямую для добавления файлов в существующее хранилище
      const response = await fetch(
        `https://api.openai.com/v1/vector_stores/${vectorStoreId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
          },
          body: JSON.stringify(options),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(
          "ОТЛАДКА V2: Ошибка при обновлении vector store:",
          errorData
        );
        throw new Error(
          `Ошибка при обновлении vector store: ${
            errorData.error?.message || response.statusText
          }`
        );
      }

      const result = await response.json();
      console.log(`ОТЛАДКА V2: Векторное хранилище успешно обновлено:`, result);
      return result;
    } catch (error: any) {
      console.error(
        `ОТЛАДКА V2: Ошибка при обновлении vector store ${vectorStoreId}:`,
        error
      );
      throw new Error(
        `Ошибка при обновлении vector store: ${
          error.message || "Неизвестная ошибка"
        }`
      );
    }
  }

  // Метод для получения файлов векторного хранилища
  async getVectorStoreFiles(vectorStoreId: string) {
    try {
      // Сначала получаем метаданные хранилища
      const response = await fetch(
        `https://api.openai.com/v1/vector_stores/${vectorStoreId}/files`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
          },
        }
      );

      if (!response.ok) {
        console.error(
          `Ошибка при получении файлов хранилища ${vectorStoreId}: ${response.status} ${response.statusText}`
        );
        return [];
      }

      const result = await response.json();
      console.log(
        `Получены файлы хранилища ${vectorStoreId}:`,
        JSON.stringify(result)
      );

      // Проверяем корректность структуры данных
      if (result.data && Array.isArray(result.data)) {
        // Извлекаем ID файлов, учитывая различные варианты структуры данных
        const fileIds = result.data
          .map((file: any) => {
            if (file.file_id) return file.file_id;
            if (file.id) return file.id;
            if (typeof file === "string") return file;
            // Если это объект, ищем поле, которое может содержать ID
            if (typeof file === "object") {
              for (const key in file) {
                if (
                  key.toLowerCase().includes("id") &&
                  typeof file[key] === "string"
                ) {
                  return file[key];
                }
              }
            }
            return null;
          })
          .filter((id: any) => id !== null);

        console.log(
          `Извлечено ${fileIds.length} идентификаторов файлов:`,
          fileIds
        );
        return fileIds;
      }

      // Проверяем альтернативную структуру данных
      if (result.file_ids && Array.isArray(result.file_ids)) {
        console.log(`Найдены ID файлов в поле file_ids:`, result.file_ids);
        return result.file_ids;
      }

      // Еще один вариант структуры
      if (result.files && Array.isArray(result.files)) {
        const fileIds = result.files
          .map((file: any) =>
            typeof file === "string" ? file : file.id || file.file_id
          )
          .filter((id: any) => id);
        console.log(`Найдены ID в поле files:`, fileIds);
        return fileIds;
      }

      // Если результат сам по себе массив
      if (Array.isArray(result)) {
        const fileIds = result
          .map((file: any) =>
            typeof file === "string" ? file : file.id || file.file_id
          )
          .filter((id: any) => id);
        console.log(`Результат - массив:`, fileIds);
        return fileIds;
      }

      console.log(`Не удалось извлечь идентификаторы файлов из ответа API`);
      return [];
    } catch (error: any) {
      console.error(
        `Ошибка при получении файлов хранилища ${vectorStoreId}:`,
        error
      );
      return [];
    }
  }

  // Метод для открепления файла от ассистента
  async detachFileFromAssistant(assistantId: string, fileId: string) {
    console.log(`\n=== ОТКРЕПЛЕНИЕ ФАЙЛА ===`);
    console.log(`Откреплeние файла ${fileId} от ассистента ${assistantId}`);

    try {
      // 1. Получаем текущую информацию об ассистенте
      const assistant = await this.getAssistant(assistantId);
      console.log(`Получен ассистент: ${assistant.name} (${assistantId})`);

      // 2. Подготавливаем обновление ассистента
      const requestBody: any = {
        tools: assistant.tools || [],
        tool_resources: {
          file_search: { vector_store_ids: [] },
          code_interpreter: { file_ids: [] },
        },
      };

      // 3. Обрабатываем code_interpreter файлы
      if (assistant.tool_resources?.code_interpreter?.file_ids) {
        const updatedCodeInterpreterIds =
          assistant.tool_resources.code_interpreter.file_ids.filter(
            (id: any) => id !== fileId
          );
        console.log(
          `Code Interpreter файлы: было ${assistant.tool_resources.code_interpreter.file_ids.length}, осталось ${updatedCodeInterpreterIds.length}`
        );
        requestBody.tool_resources.code_interpreter.file_ids =
          updatedCodeInterpreterIds;
      }

      // 4. Проверяем наличие и обрабатываем векторное хранилище
      let vectorStoreId = null;
      if (assistant.tool_resources?.file_search?.vector_store_ids?.length > 0) {
        vectorStoreId =
          assistant.tool_resources.file_search.vector_store_ids[0];
        console.log(`Найдено векторное хранилище: ${vectorStoreId}`);

        try {
          // Получаем данные о хранилище
          const vectorStore = await this.getVectorStore(vectorStoreId);
          console.log(
            `Получены данные хранилища: ${vectorStore?.name || vectorStoreId}`
          );

          // Получаем файлы хранилища
          const fileIds = await this.getVectorStoreFiles(vectorStoreId);
          console.log(`Найдено ${fileIds.length} файлов в хранилище:`, fileIds);

          // Проверяем наличие удаляемого файла
          if (fileIds.includes(fileId)) {
            console.log(`Файл ${fileId} найден в хранилище, будет удален`);

            // Фильтруем удаляемый файл
            const remainingFileIds = fileIds.filter((id: any) => id !== fileId);
            console.log(
              `После удаления останется ${remainingFileIds.length} файлов`
            );

            if (remainingFileIds.length > 0) {
              try {
                // Создаем новое хранилище с оставшимися файлами
                const newVectorStore = await this.createVectorStore(
                  `updated_store_${Date.now()}`,
                  remainingFileIds
                );
                console.log(
                  `Создано новое хранилище: ${newVectorStore.id} с ${remainingFileIds.length} файлами`
                );
                requestBody.tool_resources.file_search.vector_store_ids = [
                  newVectorStore.id,
                ];
              } catch (createError: any) {
                console.log(
                  `Ошибка при создании нового хранилища: ${createError.message}`
                );
                requestBody.tool_resources.file_search.vector_store_ids = [
                  vectorStoreId,
                ];
              }
            } else {
              console.log(`Файлов в хранилище больше не останется`);
              requestBody.tool_resources.file_search.vector_store_ids = [];
            }
          } else {
            console.log(
              `Файл ${fileId} не найден в хранилище, сохраняем текущее хранилище`
            );
            requestBody.tool_resources.file_search.vector_store_ids = [
              vectorStoreId,
            ];
          }
        } catch (vectorStoreError: any) {
          console.log(
            `Ошибка при обработке хранилища: ${vectorStoreError.message}`
          );
          requestBody.tool_resources.file_search.vector_store_ids = [
            vectorStoreId,
          ];
        }
      } else {
        console.log(`Векторное хранилище не найдено у ассистента`);
      }

      // 5. Отправляем запрос на обновление ассистента
      console.log(
        `Обновляем ассистента с данными:`,
        JSON.stringify(requestBody, null, 2)
      );

      const updateResponse = await fetch(
        `https://api.openai.com/v1/assistants/${assistantId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!updateResponse.ok) {
        let errorMessage = `Ошибка ${updateResponse.status}: `;
        try {
          const errorData = await updateResponse.json();
          errorMessage +=
            errorData.error?.message || "Ошибка открепления файла";
        } catch (jsonError) {
          const errorText = await updateResponse.text();
          errorMessage += errorText || "Неизвестная ошибка открепления файла";
        }
        throw new Error(errorMessage);
      }

      // 6. Возвращаем обновленного ассистента
      const updatedAssistant = await updateResponse.json();
      console.log(`Ассистент успешно обновлен. Файл ${fileId} откреплен.`);
      console.log(`=== ОТКРЕПЛЕНИЕ ЗАВЕРШЕНО ===\n`);

      return updatedAssistant;
    } catch (error: any) {
      console.error(`Ошибка при откреплении файла: ${error.message}`);
      throw new Error(
        `Ошибка при откреплении файла от ассистента: ${
          error?.message || "Неизвестная ошибка"
        }`
      );
    }
  }

  // Вспомогательный метод для получения информации о векторном хранилище
  async getVectorStore(vectorStoreId: string) {
    try {
      const response = await fetch(
        `https://api.openai.com/v1/vector_stores/${vectorStoreId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
          },
        }
      );

      if (!response.ok) {
        console.log(
          `Ошибка при получении данных векторного хранилища: ${response.status}`
        );
        return null;
      }

      return await response.json();
    } catch (error: any) {
      console.error(
        `Ошибка при получении данных векторного хранилища: ${error.message}`
      );
      return null;
    }
  }

  // Вспомогательный метод для создания нового векторного хранилища
  async createVectorStore(name: string, fileIds: string[]) {
    try {
      const response = await fetch(`https://api.openai.com/v1/vector_stores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
        },
        body: JSON.stringify({
          name,
          file_ids: fileIds,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(
          `Ошибка создания нового хранилища: ${response.status}, ${errorText}`
        );
        throw new Error(`Ошибка создания хранилища: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error(`Ошибка при создании нового хранилища: ${error.message}`);
      throw error;
    }
  }

  // Удаление файла
  async deleteFile(fileId: string) {
    try {
      // Прямой вызов API для совместимости с v2
      const response = await fetch(
        `https://api.openai.com/v1/files/${fileId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
          },
        }
      );

      if (!response.ok) {
        let errorMessage = `Ошибка ${response.status}: `;
        try {
          const errorData = await response.json();
          errorMessage += errorData.error?.message || "Ошибка удаления файла";
        } catch (jsonError) {
          const errorText = await response.text();
          errorMessage += errorText || "Неизвестная ошибка удаления файла";
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return { success: true, result };
    } catch (error) {
      if (error instanceof Error) {
        console.error("Ошибка при удалении файла:", error);
        throw new Error(`Ошибка при удалении файла: ${error.message}`);
      } else {
        console.error("Ошибка при удалении файла:", error);
        throw new Error(`Ошибка при удалении файла. Что-то пошло не так`);
      }
    }
  }

  // Создание треда для общения определено ниже

  /**
   * Отправляет сообщение в тред
   */
  async sendMessage(threadId: string, content: string, imageUrl?: string) {
    this.checkApiKey();

    try {
      console.log(`[OpenAI API] Отправка сообщения в тред ${threadId}`);

      const messageData: any = {
        role: "user",
        content: content,
      };

      // Если есть URL изображения, добавляем его как изображение
      if (imageUrl) {
        console.log(
          `[OpenAI API] К сообщению прикреплено изображение: ${imageUrl}`
        );
        messageData.content = [
          { type: "text", text: content || "[Изображение]" },
          {
            type: "image_url",
            image_url: {
              url: imageUrl,
            },
          },
        ];
      }

      const response = await fetch(
        `https://api.openai.com/v1/threads/${threadId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
          },
          body: JSON.stringify(messageData),
        }
      );

      const data = await this.safelyReadResponseData(response);
      return data;
    } catch (error) {
      console.error("[OpenAI API] Ошибка отправки сообщения:", error);
      throw error;
    }
  }

  // Запуск запроса к ассистенту (старая версия, порядок аргументов threadId, assistantId)
  async runAssistantV1(threadId: string, assistantId: string) {
    try {
      // Прямой вызов API для совместимости с v2
      console.log(
        `[ОТЛАДКА] runAssistantV1: threadId=${threadId}, assistantId=${assistantId}`
      );
      return this.runAssistant(assistantId, threadId);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Неизвестная ошибка";
      console.error("Ошибка при запуске ассистента V1:", errorMessage);
      throw error;
    }
  }

  // Вспомогательная функция для поддержки старого вызова runAssistant
  // Используется только для этой реализации метода
  private async _callRunAssistantAPI(threadId: string, assistantId: string) {
    try {
      const response = await fetch(
        `https://api.openai.com/v1/threads/${threadId}/runs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
          },
          body: JSON.stringify({
            assistant_id: assistantId,
          }),
        }
      );

      if (!response.ok) {
        let errorMessage = `Ошибка ${response.status}: `;
        try {
          const errorData = await response.json();
          errorMessage +=
            errorData.error?.message || "Ошибка запуска ассистента";
        } catch (jsonError) {
          const errorText = await response.text();
          errorMessage += errorText || "Неизвестная ошибка запуска ассистента";
        }
        throw new Error(errorMessage);
      }

      const run = await response.json();
      return run;
    } catch (error) {
      if (error instanceof Error) {
        console.error("Ошибка при запуске ассистента:", error);
        throw new Error(`Ошибка при запуске ассистента: ${error.message}`);
      } else {
        console.error("Ошибка при запуске ассистента:", error);
        throw new Error(`Ошибка при запуске ассистента. Что-то пошло не так`);
      }
    }
  }

  // Получение статуса запроса к ассистенту
  async getRunStatusV1(threadId: string, runId: string) {
    try {
      // Прямой вызов API для совместимости с v2
      const response = await fetch(
        `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
          },
        }
      );

      // Используем безопасный метод чтения
      const result = await this.safelyReadResponseData(response);

      if (!response.ok) {
        throw new Error(result.error || "Ошибка получения статуса запроса");
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        console.error("Ошибка при получении статуса запроса:", error);
        throw new Error(
          `Ошибка при получении статуса запроса: ${error.message}`
        );
      } else {
        console.error("Ошибка при получении статуса запроса:", error);
        throw new Error(
          `Ошибка при получении статуса запроса. Что-то пошло не так`
        );
      }
    }
  }

  // Получение сообщений из треда
  async getMessages(threadId: string) {
    try {
      // Прямой вызов API для совместимости с v2
      const response = await fetch(
        `https://api.openai.com/v1/threads/${threadId}/messages`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
          },
        }
      );

      // Используем безопасный метод чтения
      const result = await this.safelyReadResponseData(response);

      if (!response.ok) {
        throw new Error(result.error || "Ошибка получения сообщений");
      }

      return result.data;
    } catch (error) {
      if (error instanceof Error) {
        console.error("Ошибка при получении сообщений:", error);
        throw new Error(`Ошибка при получении сообщений: ${error.message}`);
      } else {
        console.error("Ошибка при получении сообщений:", error);
        throw new Error(`Ошибка при получении сообщений. Что-то пошло не так`);
      }
    }
  }

  // Получение списка доступных моделей
  async listModels() {
    try {
      // Прямой вызов API для совместимости с v2
      const response = await fetch("https://api.openai.com/v1/models", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
        },
      });

      if (!response.ok) {
        let errorMessage = `Ошибка ${response.status}: `;
        try {
          const errorData = await response.json();
          errorMessage +=
            errorData.error?.message || "Ошибка получения списка моделей";
        } catch (jsonError) {
          const errorText = await response.text();
          errorMessage +=
            errorText || "Неизвестная ошибка получения списка моделей";
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result.data.map((model: any) => ({
        id: model.id,
        created: model.created,
        owned_by: model.owned_by,
      }));
    } catch (error) {
      if (error instanceof Error) {
        console.error("Ошибка при получении списка моделей:", error);
        throw new Error(
          `Ошибка при получении списка моделей: ${error.message}`
        );
      } else {
        console.error("Ошибка при получении списка моделей:", error);
        throw new Error(
          `Ошибка при получении списка моделей. Что-то пошло не так`
        );
      }
    }
  }

  /**
   * Отправляет сообщения из истории диалога к ассистенту и получает его ответ
   * @param assistantId OpenAI ID ассистента
   * @param messages Массив сообщений для отправки в диалог
   * @param metadata Дополнительные метаданные
   * @returns Ответ ассистента
   */
  async sendMessageToAssistant(
    assistantId: string,
    messages: Array<{ role: "user" | "assistant"; content: string }>,
    metadata: Record<string, string> = {}
  ) {
    try {
      console.log(
        `Отправка сообщений ассистенту ${assistantId}, количество сообщений: ${messages.length}`
      );

      // Проверяем, есть ли ассистент
      const assistant = await this.getAssistant(assistantId);
      if (!assistant) {
        throw new Error(`Ассистент не найден: ${assistantId}`);
      }

      // Создаем временный тред для диалога
      const thread = await this.createThread();
      const threadId = thread.id;

      // Отправляем все сообщения из истории в тред
      for (const message of messages) {
        await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
          },
          body: JSON.stringify({
            role: message.role,
            content: message.content,
          }),
        });
      }

      // Запускаем ассистента с метаданными
      const run = await this.runAssistant(assistantId, threadId, metadata);

      // Ждем результатов
      let runStatus = await this.getRunStatus(threadId, run.id);
      let attempts = 0;
      const maxAttempts = 30; // 30 секунд максимум

      while (
        (runStatus.status === "queued" || runStatus.status === "in_progress") &&
        attempts < maxAttempts
      ) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        runStatus = await this.getRunStatus(threadId, run.id);
        attempts++;
      }

      if (runStatus.status !== "completed") {
        console.warn(
          `Не удалось получить ответ от ассистента: ${runStatus.status}`
        );
        throw new Error(
          `Не удалось получить ответ от ассистента: ${runStatus.status}`
        );
      }

      // Получаем сообщения из треда
      const threadMessages = await this.getMessages(threadId);

      // Находим последнее сообщение от ассистента
      const assistantMessages = threadMessages.filter(
        (msg: any) => msg.role === "assistant"
      );

      if (assistantMessages.length === 0) {
        throw new Error("Ассистент не ответил на сообщение");
      }

      // Берем самое последнее сообщение ассистента
      const lastAssistantMessage =
        assistantMessages[assistantMessages.length - 1];

      // Форматируем ответ
      const assistantResponse = {
        id: lastAssistantMessage.id,
        content: lastAssistantMessage.content[0].text.value,
        threadId,
        runId: run.id,
      };

      return assistantResponse;
    } catch (error: any) {
      console.error("Ошибка при отправке сообщения ассистенту:", error);
      throw new Error(
        `Ошибка при отправке сообщения ассистенту: ${error.message}`
      );
    }
  }

  /**
   * Генерирует ответ от ассистента на сообщение
   */
  async generateResponse(
    assistantId: string,
    threadId: string,
    message: string,
    imageUrl?: string
  ) {
    try {
      // Отправляем сообщение
      await this.sendMessage(threadId, message, imageUrl);

      // Запускаем ассистента
      const run = await this.runAssistant(assistantId, threadId);

      // Ждем результатов
      let runStatus = await this.getRunStatus(threadId, run.id);
      let attempts = 0;
      const maxAttempts = 30;

      // Обработка различных статусов
      while (
        ["queued", "in_progress"].includes(runStatus.status) &&
        attempts < maxAttempts
      ) {
        console.log(
          `Статус запроса [${attempts + 1}/${maxAttempts}]: ${runStatus.status}`
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
        runStatus = await this.getRunStatus(threadId, run.id);
        attempts++;
      }

      // Обработка статуса requires_action
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
            runStatus.required_action.submit_tool_outputs.tool_calls || [];
          console.log(
            `\n=== ПОЛУЧЕНО ${toolCalls.length} ЗАПРОСОВ НА ВЫПОЛНЕНИЕ ФУНКЦИЙ ===`
          );

          // Выводим информацию о каждом вызове
          toolCalls.forEach((tool, index) => {
            console.log(`\n[Функция ${index + 1}]`);
            console.log(`ID вызова: ${tool.id}`);
            console.log(`Имя функции: ${tool.function?.name}`);

            try {
              const argsRaw = tool.function?.arguments || "{}";
              console.log(`Аргументы (raw): ${argsRaw}`);
              const args = JSON.parse(argsRaw);
              console.log(
                `Аргументы (parsed): ${JSON.stringify(args, null, 2)}`
              );
            } catch (e) {
              console.error(`Ошибка при разборе аргументов функции: ${e}`);
            }
          });

          try {
            // Обработка функций
            const { OpenAIFunctionProcessor } = await import(
              "./openai-function-processor.js"
            );
            const functionProcessor = new OpenAIFunctionProcessor(storage);

            let toolOutputs;
            try {
              // Обрабатываем вызовы функций
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
                  const parsedOutput = JSON.parse(output.output);
                  return {
                    tool_call_id: output.tool_call_id,
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
            } catch (processorError) {
              console.error("Ошибка при обработке функций:", processorError);

              // Создаем заглушки в случае ошибки
              toolOutputs = toolCalls.map((tool) => ({
                tool_call_id: tool.id,
                output: JSON.stringify({
                  success: false,
                  error:
                    processorError instanceof Error
                      ? processorError.message
                      : "Неизвестная ошибка",
                  message: `Ошибка при обработке функции ${tool.function?.name}`,
                  notification_sent: true,
                }),
              }));
            }

            // Отправляем результаты выполнения функций
            console.log("\n=== ОТПРАВКА РЕЗУЛЬТАТОВ ФУНКЦИЙ В OPENAI ===");
            console.log(
              "Подготовленные ответы:",
              JSON.stringify(toolOutputs, null, 2)
            );

            const submitResponse = await this.submitToolOutputs(
              threadId,
              run.id,
              toolOutputs
            );
            console.log("\n=== ОТВЕТ НА ОТПРАВКУ РЕЗУЛЬТАТОВ ===");
            console.log(JSON.stringify(submitResponse, null, 2));

            // Ждем завершения запроса после выполнения функций
            attempts = 0;
            runStatus = await this.getRunStatus(threadId, run.id);

            // Обработка возможного статуса "queued" после отправки результатов функций
            let queuedCounter = 0;
            const maxQueuedAttempts = 5;

            while (
              runStatus.status === "queued" &&
              queuedCounter < maxQueuedAttempts
            ) {
              queuedCounter++;
              console.log(
                `Ожидание разблокировки после отправки результатов... (попытка ${queuedCounter}/${maxQueuedAttempts})`,
                runStatus.status
              );

              await new Promise((resolve) => setTimeout(resolve, 2000));
              runStatus = await this.getRunStatus(threadId, run.id);

              // Если достигли лимита попыток, отправляем успешные заглушки
              if (queuedCounter >= maxQueuedAttempts) {
                console.log(
                  "Превышен лимит ожидания в статусе 'queued', отправляем заглушки"
                );

                // Проверяем наличие новых required_action
                if (
                  runStatus.required_action &&
                  runStatus.required_action.type === "submit_tool_outputs" &&
                  runStatus.required_action.submit_tool_outputs?.tool_calls
                ) {
                  const newToolCalls =
                    runStatus.required_action.submit_tool_outputs.tool_calls;
                  const successOutputs = newToolCalls.map((tool) => ({
                    tool_call_id: tool.id,
                    output: JSON.stringify({ success: true }),
                  }));

                  try {
                    await this.submitToolOutputs(
                      threadId,
                      run.id,
                      successOutputs
                    );
                    console.log("Отправлены заглушки для разблокировки");
                  } catch (submitError) {
                    console.error("Ошибка при отправке заглушек:", submitError);

                    // Пробуем отменить run
                    try {
                      await fetch(
                        `https://api.openai.com/v1/threads/${threadId}/runs/${run.id}/cancel`,
                        {
                          method: "POST",
                          headers: {
                            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                            "OpenAI-Beta": "assistants=v2",
                          },
                        }
                      );
                      console.log("Run был принудительно отменен");
                    } catch (cancelError) {
                      console.error("Ошибка при отмене run:", cancelError);
                    }
                  }
                }
              }
            }

            // Ждем пока статус не станет завершенным
            while (
              ["in_progress", "requires_action"].includes(runStatus.status) &&
              attempts < maxAttempts
            ) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
              runStatus = await this.getRunStatus(threadId, run.id);
              console.log(
                `Статус запроса [${attempts + 1}/${maxAttempts}]: ${
                  runStatus.status
                }`
              );
              attempts++;
            }
          } catch (error: any) {
            console.error("Ошибка при обработке вызовов функций:", error);
            throw new Error(
              `Ошибка при обработке вызовов функций: ${error.message}`
            );
          }
        }
      }

      // Если статус все еще "queued", пробуем разблокировать
      if (runStatus.status === "queued") {
        console.log(
          "Статус запроса остался 'queued' после обработки функций, пробуем разблокировать"
        );

        try {
          // Отменяем run
          await fetch(
            `https://api.openai.com/v1/threads/${threadId}/runs/${run.id}/cancel`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                "OpenAI-Beta": "assistants=v2",
              },
            }
          );
          console.log("Run был отменен");
          throw new Error("Запрос не был завершен. Статус: queued (отменен)");
        } catch (cancelError) {
          console.error("Ошибка при отмене run:", cancelError);
          throw new Error("Запрос не был завершен. Статус: queued");
        }
      }

      // Проверяем итоговый статус
      if (runStatus.status !== "completed") {
        throw new Error(`Запрос не был завершен. Статус: ${runStatus.status}`);
      }

      // Получаем сообщения
      const messages = await this.getMessages(threadId);

      // Первое сообщение - это последнее добавленное (ответ ассистента)
      if (messages.length > 0 && messages[0].role === "assistant") {
        return messages[0];
      }

      throw new Error("Не удалось получить ответ от ассистента");
    } catch (error: any) {
      console.error("Ошибка при генерации ответа:", error);
      throw new Error(`Ошибка при генерации ответа: ${error.message}`);
    }
  }

  // Сохранение исправленного ответа
  async saveTrainingCorrection(
    assistantId: string,
    query: string,
    correctedResponse: string
  ) {
    try {
      // Инициализируем массив корректировок для ассистента, если его еще нет
      if (!this.corrections[assistantId]) {
        this.corrections[assistantId] = [];
      }

      // Добавляем новую корректировку
      this.corrections[assistantId].push({
        query,
        correctedResponse,
      });

      // Сохраняем корректировки
      console.log(
        `Сохранены корректировки для ассистента ${assistantId}:`,
        JSON.stringify(this.corrections[assistantId], null, 2)
      );

      return true;
    } catch (error: any) {
      console.error("Ошибка при сохранении корректировки:", error);
      throw new Error(
        `Ошибка при сохранении корректировки: ${
          error.message || "Неизвестная ошибка"
        }`
      );
    }
  }

  // Получение всех исправлений для ассистента
  async getTrainingCorrections(assistantId: string) {
    return this.corrections[assistantId] || [];
  }

  // Создание файла с исправлениями для загрузки в OpenAI
  async generateCorrectionsFile(assistantId: string) {
    try {
      const corrections = this.corrections[assistantId] || [];

      if (corrections.length === 0) {
        throw new Error("Нет исправлений для создания файла");
      }

      // Форматирование исправлений по примеру из Python-скрипта
      let fileContent = "";

      for (const correction of corrections) {
        fileContent += `Query: ${correction.query}\nCorrected Answer: ${correction.correctedResponse}\n\n`;
      }

      // Создаем буфер из строки
      const fileBuffer = Buffer.from(fileContent, "utf-8");

      // Имя файла с датой для уникальности
      const fileName = `corrections_${assistantId}_${new Date()
        .toISOString()
        .slice(0, 10)}.txt`;

      // Загружаем файл в OpenAI
      const uploadedFile = await this.uploadFile(fileBuffer, fileName);

      return uploadedFile;
    } catch (error: any) {
      console.error("Ошибка при создании файла исправлений:", error);
      throw new Error(
        `Ошибка при создании файла исправлений: ${
          error.message || "Неизвестная ошибка"
        }`
      );
    }
  }

  // Тестирование ассистента - вариант для тестового диалога
  async testAssistant(assistantId: string, message: string) {
    const storageInstance = storage;
    try {
      // Проверяем наличие исправлений для этого запроса
      const corrections = this.corrections[assistantId] || [];

      // Нормализуем входное сообщение для сравнения
      const normalizedMessage = message.toLowerCase().trim();

      // Ищем исправление для этого запроса
      const matchedCorrection = corrections.find((c) => {
        const normalizedQuery = c.query.toLowerCase().trim();
        return normalizedQuery === normalizedMessage;
      });

      // Если есть исправление, возвращаем его вместо запроса к OpenAI
      if (matchedCorrection) {
        console.log(`Найдено исправление для запроса: ${message}`);
        return matchedCorrection.correctedResponse;
      }

      // Иначе создаем новый тред для тестирования
      const thread = await this.createThread();

      // Отправляем сообщение пользователя
      const threadMessage = await this.safelyReadResponseData(
        await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
          },
          body: JSON.stringify({
            role: "user",
            content: message,
          }),
        })
      );

      if (threadMessage.error) {
        throw new Error(threadMessage.error);
      }

      // Запускаем ассистента
      const runResponse = await this.safelyReadResponseData(
        await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
          },
          body: JSON.stringify({
            assistant_id: assistantId,
          }),
        })
      );

      if (runResponse.error) {
        throw new Error(runResponse.error);
      }

      const run = runResponse;

      // Ждем результатов
      let runStatus = await this.getRunStatus(thread.id, run.id);
      let attempts = 0;
      const maxAttempts = 30; // 30 секунд максимум

      while (
        (runStatus.status === "queued" || runStatus.status === "in_progress") &&
        attempts < maxAttempts
      ) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        runStatus = await this.getRunStatus(thread.id, run.id);
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

              // УДАЛИТЬ или заменить на альтернативный механизм логирования
              // т.к. storageInstance отсутствует
              /*
              storageInstance
                .createActivityLog({
                  userId: null,
                  assistantId: null,
                  action: "function_called",
                  details: {
                    functionName: tool.function?.name,
                    arguments: args,
                    toolCallId: tool.id,
                  },
                })
                .catch((e: Error) =>
                  console.error("Ошибка при логировании вызова функции:", e)
                );
              */
            } catch (e) {
              console.error(`Ошибка при разборе аргументов функции: ${e}`);
            }
          });

          // Используем OpenAIFunctionProcessor для обработки вызовов функций
          console.log("Используем процессор функций для обработки вызовов...");

          try {
            // Динамически импортируем OpenAIFunctionProcessor с помощью ESM import
            // ИСПРАВИТЬ путь к файлу если он неверный
            const { OpenAIFunctionProcessor } = await import(
              "./openai-function-processor.js"
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
                  notification_sent: true,
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

            // ИСПРАВЛЕНО: используем this вместо openaiService и thread.id вместо threadId
            const submitResponse = await this.submitToolOutputs(
              thread.id,
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
              // ИСПРАВЛЕНО: используем this вместо openaiService и thread.id вместо threadId
              runStatus = await this.getRunStatus(thread.id, run.id);
              console.log(
                `Статус запроса после выполнения функций [${
                  attempts + 1
                }/${maxAttempts}]: ${runStatus.status}`
              );
              attempts++;
            }
          } catch (importError) {
            console.error(
              "Ошибка при импорте процессора функций:",
              importError
            );
          }
        }
      }

      // Добавляем счетчик попыток
      let counter = 0;
      const maxCounter = 5;

      while (runStatus.status === "queued") {
        counter++;
        console.log(
          `Ожидание завершения запроса... (попытка ${counter}/${maxCounter})`,
          runStatus.status
        );

        if (counter >= maxCounter) {
          console.log(
            "Достигнуто максимальное количество попыток, пробуем отправить завершающий статус ассистенту"
          );

          // Проверяем, есть ли в runStatus информация о required_action
          if (
            runStatus.required_action &&
            runStatus.required_action.type === "submit_tool_outputs" &&
            runStatus.required_action.submit_tool_outputs &&
            runStatus.required_action.submit_tool_outputs.tool_calls
          ) {
            const toolCalls =
              runStatus.required_action.submit_tool_outputs.tool_calls;

            // Формируем заглушки успешных ответов для всех запрошенных функций
            const toolOutputs = toolCalls.map((tool) => ({
              tool_call_id: tool.id,
              output: JSON.stringify({ success: true }),
            }));

            try {
              // Отправляем ответы, чтобы разблокировать ассистента
              console.log(
                "Отправляем искусственные успешные ответы для разблокировки ассистента"
              );
              await this.submitToolOutputs(thread.id, run.id, toolOutputs);
              break; // Выходим из цикла после отправки ответов
            } catch (submitError) {
              console.error(
                "Ошибка при отправке заглушек ответов:",
                submitError
              );
            }
          } else {
            // Если нет required_action, пробуем отменить run
            try {
              console.log("Отменяем зависший run");
              await fetch(
                `https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}/cancel`,
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    "OpenAI-Beta": "assistants=v2",
                  },
                }
              );
              break; // Выходим из цикла после отмены
            } catch (cancelError) {
              console.error("Ошибка при отмене run:", cancelError);
            }
          }

          break; // В любом случае выходим из цикла
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
        runStatus = await this.getRunStatus(thread.id, run.id);
      }

      // Получаем сообщения через наш безопасный метод
      const messagesResponse = await this.safelyReadResponseData(
        await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
          },
        })
      );

      if (messagesResponse.error) {
        throw new Error(messagesResponse.error);
      }

      const messages = messagesResponse.data || [];

      // Находим ответ ассистента
      const assistantMessage = messages.find(
        (msg: ThreadMessage) => msg.role === "assistant"
      );

      if (assistantMessage) {
        // Извлекаем текстовое содержимое
        const content =
          assistantMessage.content[0].type === "text"
            ? assistantMessage.content[0].text.value
            : "Получен нетекстовый ответ";

        return content;
      }

      throw new Error("Не удалось получить ответ от ассистента");
    } catch (error: any) {
      console.error("Ошибка при тестировании ассистента:", error);
      throw new Error(
        `Ошибка при тестировании ассистента: ${
          error.message || "Неизвестная ошибка"
        }`
      );
    }
  }

  // Создание нового треда
  async createThread() {
    try {
      this.checkApiKey();

      const response = await fetch("https://api.openai.com/v1/threads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        let errorMessage = `Ошибка ${response.status}: `;
        try {
          const errorData = await response.json();
          errorMessage += errorData.error?.message || "Ошибка создания треда";
        } catch (jsonError) {
          const errorText = await response.text();
          errorMessage += errorText || "Неизвестная ошибка создания треда";
        }
        throw new Error(errorMessage);
      }

      const thread = await response.json();
      return thread;
    } catch (error) {
      if (error instanceof Error) {
        console.error("Ошибка при создании треда:", error);
        throw new Error(`Ошибка при создании треда: ${error.message}`);
      } else {
        console.error("Ошибка при создании треда:", error);
        throw new Error(`Ошибка при создании треда. Что-то пошло не так`);
      }
    }
  }

  // Добавление сообщения в тред
  async addMessageToThread(threadId: string, content: string) {
    try {
      this.checkApiKey();

      const response = await fetch(
        `https://api.openai.com/v1/threads/${threadId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
          },
          body: JSON.stringify({
            role: "user",
            content,
          }),
        }
      );

      if (!response.ok) {
        let errorMessage = `Ошибка ${response.status}: `;
        try {
          const errorData = await response.json();
          errorMessage +=
            errorData.error?.message || "Ошибка добавления сообщения";
        } catch (jsonError) {
          const errorText = await response.text();
          errorMessage +=
            errorText || "Неизвестная ошибка добавления сообщения";
        }
        throw new Error(errorMessage);
      }

      const message = await response.json();
      return message;
    } catch (error) {
      if (error instanceof Error) {
        console.error("Ошибка при добавлении сообщения:", error);
        throw new Error(`Ошибка при добавлении сообщения: ${error.message}`);
      } else {
        console.error("Ошибка при добавлении сообщения:", error);
        throw new Error(`Ошибка при добавлении сообщения. Что-то пошло не так`);
      }
    }
  }

  // Запуск ассистента на треде
  async runAssistant(
    assistantId: string,
    threadId: string,
    metadata?: Record<string, string>
  ) {
    try {
      console.log(`[OpenAI API] Запуск ассистента с параметрами:`);
      console.log(`[OpenAI API] - assistant_id: ${assistantId}`);
      console.log(`[OpenAI API] - thread_id: ${threadId}`);
      if (metadata)
        console.log(`[OpenAI API] - metadata: ${JSON.stringify(metadata)}`);

      this.checkApiKey();

      // Формируем тело запроса
      const body: any = {
        assistant_id: assistantId,
      };

      // Добавляем метаданные, если они переданы
      if (metadata && Object.keys(metadata).length > 0) {
        body.metadata = metadata;
      }

      const response = await fetch(
        `https://api.openai.com/v1/threads/${threadId}/runs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        let errorMessage = `Ошибка ${response.status}: `;
        try {
          const errorData = await response.json();
          errorMessage +=
            errorData.error?.message || "Ошибка запуска ассистента";
        } catch (jsonError) {
          const errorText = await response.text();
          errorMessage += errorText || "Неизвестная ошибка запуска ассистента";
        }
        throw new Error(errorMessage);
      }

      const run = await response.json();
      return run;
    } catch (error) {
      if (error instanceof Error) {
        console.error("Ошибка при запуске ассистента:", error);
        throw new Error(`Ошибка при запуске ассистента: ${error.message}`);
      } else {
        console.error("Ошибка при запуске ассистента:", error);
        throw new Error(`Ошибка при запуске ассистента. Что-то пошло не так`);
      }
    }
  }

  // Получение статуса выполнения
  async getRunStatus(threadId: string, runId: string): Promise<RunStatus> {
    try {
      this.checkApiKey();
      const response = await fetch(
        `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
            "OpenAI-Beta": "assistants=v2",
          },
        }
      );

      if (!response.ok) {
        const errorMessage = `Ошибка при получении статуса выполнения: ${response.status} ${response.statusText}`;
        console.error(errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result as RunStatus;
    } catch (error) {
      console.error("Ошибка при получении статуса выполнения:", error);
      throw error;
    }
  }

  // Отправляет результаты выполнения функций в OpenAI API
  async submitToolOutputs(threadId: string, runId: string, toolOutputs: any[]) {
    try {
      this.checkApiKey();
      console.log(`[OpenAI API] Отправка результатов функций:
      - thread_id: ${threadId}
      - run_id: ${runId}
      - number of outputs: ${toolOutputs?.length || 0}`);

      const response = await fetch(
        `https://api.openai.com/v1/threads/${threadId}/runs/${runId}/submit_tool_outputs`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
            "OpenAI-Beta": "assistants=v2",
          },
          body: JSON.stringify({
            tool_outputs: toolOutputs,
          }),
        }
      );

      if (!response.ok) {
        const errorMessage = `Ошибка при отправке результатов функций: ${response.status} ${response.statusText}`;
        console.error(errorMessage);
        try {
          const errorData = await response.json();
          console.error("Детали ошибки:", JSON.stringify(errorData, null, 2));
        } catch (e) {
          console.error("Не удалось получить детали ошибки");
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Ошибка при отправке результатов функций:", error);
      throw error;
    }
  }

  // Ожидание завершения выполнения
  async waitForRunCompletion(
    runId: string,
    threadId: string,
    maxAttempts = 60
  ): Promise<RunStatus> {
    let attempts = 0;
    let runStatus = await this.getRunStatus(threadId, runId);

    while (
      ["queued", "in_progress"].includes(runStatus.status) &&
      attempts < maxAttempts
    ) {
      // Ждем 1 секунду между запросами
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runStatus = await this.getRunStatus(threadId, runId);
      attempts++;
    }

    return runStatus;
  }

  // Получение сообщений из треда
  async getThreadMessages(threadId: string): Promise<ThreadMessage[]> {
    try {
      this.checkApiKey();

      // Добавляем explicit параметр order=desc для гарантии получения сообщений от новых к старым
      const response = await fetch(
        `https://api.openai.com/v1/threads/${threadId}/messages?order=desc`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
          },
        }
      );

      // Используем безопасный метод чтения
      const result = await this.safelyReadResponseData(response);

      if (!response.ok) {
        throw new Error(result.error || "Ошибка получения сообщений");
      }

      // Логирование для отладки
      if (result.data && result.data.length > 0) {
        console.log(
          `Получено ${result.data.length} сообщений из треда. Первое сообщение: ${result.data[0].role}:${result.data[0].id}`
        );
      }

      return result.data;
    } catch (error: unknown) {
      console.error("Ошибка при получении сообщений из треда:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Неизвестная ошибка";
      throw new Error(
        `Ошибка при получении сообщений из треда: ${errorMessage}`
      );
    }
  }
}

export const openaiService = new OpenAIService();
