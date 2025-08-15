import fs from "fs";
import path from "path";
import { tmpdir } from "os";
import { writeFileSync, unlinkSync } from "fs";
import { storage } from "../storage";

// Используем Gemini 2.0 Flash для лучшей производительности
const DEFAULT_MODEL = "gemini-2.0-flash-exp";

// Check if the Gemini API key is set
const hasGeminiKey = !!process.env.GEMINI_API_KEY;

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

export class GeminiService {
  // Хранилище исправлений ответов для каждого ассистента
  private corrections: AssistantCorrections = {};

  // Check if Gemini API key is configured
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

  // Создание ассистента (эмулируем для совместимости)
  async createAssistant(name: string, instructions?: string) {
    try {
      this.checkApiKey();
      
      // Для Gemini создаем виртуального ассистента в локальной базе
      const assistantId = `gemini_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      const assistant = {
        id: assistantId,
        name,
        instructions: instructions || `Вы полезный ассистент по имени ${name}.`,
        model: DEFAULT_MODEL,
        created_at: Math.floor(Date.now() / 1000),
        tools: [{ type: "file_search" }, { type: "code_interpreter" }]
      };

      // Сохраняем в локальном хранилище или базе данных
      // Здесь можно добавить логику сохранения в базу
      
      return assistant;
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
      // Для Gemini обновляем локальные данные ассистента
      const assistant = {
        id: assistantId,
        ...updates,
        updated_at: Math.floor(Date.now() / 1000)
      };
      
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
      // Для Gemini просто помечаем как удаленный
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
      // Возвращаем данные ассистента из локального хранилища
      const assistant = {
        id: assistantId,
        name: "Gemini Assistant",
        instructions: "Я - ИИ ассистент, работающий на основе Gemini API",
        model: DEFAULT_MODEL,
        created_at: Math.floor(Date.now() / 1000),
        tools: [{ type: "file_search" }, { type: "code_interpreter" }]
      };
      
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

  // Генерация ответа через Gemini API
  async generateResponse(
    messages: Array<{role: 'user' | 'assistant', content: string}>,
    systemPrompt?: string,
    model: string = DEFAULT_MODEL
  ): Promise<string> {
    try {
      this.checkApiKey();

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
      
      // Подготавливаем контент для Gemini
      const contents = [];
      
      // Добавляем системный промпт если есть
      if (systemPrompt) {
        contents.push({
          role: 'user',
          parts: [{ text: systemPrompt }]
        });
        contents.push({
          role: 'model',
          parts: [{ text: 'Понял! Я буду следовать этим инструкциям.' }]
        });
      }

      // Добавляем историю сообщений
      messages.forEach(msg => {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      });

      const requestBody = {
        contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048
        }
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('No response from Gemini API');
      }

      return data.candidates[0].content.parts[0].text;
    } catch (error: unknown) {
      console.error("Ошибка при генерации ответа через Gemini:", error);
      throw new Error(
        `Ошибка при генерации ответа: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  // Создание треда для чата (эмулируем для совместимости)
  async createThread() {
    const threadId = `thread_gemini_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    return {
      id: threadId,
      created_at: Math.floor(Date.now() / 1000),
      metadata: {}
    };
  }

  // Добавление сообщения в тред
  async addMessageToThread(threadId: string, content: string, role: 'user' | 'assistant' = 'user') {
    const messageId = `msg_gemini_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    return {
      id: messageId,
      thread_id: threadId,
      role,
      content: [
        {
          type: 'text',
          text: {
            value: content,
            annotations: []
          }
        }
      ],
      created_at: Math.floor(Date.now() / 1000)
    };
  }

  // Запуск ассистента (эмулируем для совместимости)
  async runAssistant(threadId: string, assistantId: string, instructions?: string) {
    const runId = `run_gemini_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    return {
      id: runId,
      thread_id: threadId,
      assistant_id: assistantId,
      status: 'completed' as const,
      created_at: Math.floor(Date.now() / 1000),
      completed_at: Math.floor(Date.now() / 1000)
    };
  }

  // Получение сообщений из треда
  async getThreadMessages(threadId: string): Promise<ThreadMessage[]> {
    // Возвращаем пустой массив для совместимости
    return [];
  }

  // Простой чат через Gemini (основной метод)
  async chat(
    message: string,
    systemPrompt?: string,
    conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = []
  ): Promise<string> {
    try {
      const messages = [...conversationHistory, { role: 'user' as const, content: message }];
      return await this.generateResponse(messages, systemPrompt);
    } catch (error) {
      console.error('Error in Gemini chat:', error);
      throw error;
    }
  }

  // Сохранить исправленный ответ
  saveCorrection(assistantId: string, query: string, correctedResponse: string) {
    if (!this.corrections[assistantId]) {
      this.corrections[assistantId] = [];
    }
    
    this.corrections[assistantId].push({
      query: query.toLowerCase(),
      correctedResponse
    });
    
    // Ограничиваем количество сохраненных исправлений
    if (this.corrections[assistantId].length > 50) {
      this.corrections[assistantId] = this.corrections[assistantId].slice(-50);
    }
  }

  // Получить исправленный ответ, если он есть
  getCorrection(assistantId: string, query: string): string | null {
    const assistantCorrections = this.corrections[assistantId];
    if (!assistantCorrections) return null;
    
    const normalizedQuery = query.toLowerCase();
    const correction = assistantCorrections.find(c => 
      normalizedQuery.includes(c.query) || c.query.includes(normalizedQuery)
    );
    
    return correction ? correction.correctedResponse : null;
  }
}
