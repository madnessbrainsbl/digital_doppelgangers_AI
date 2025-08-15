/**
 * Маршрут для получения списка функций, активных у ассистента на платформе OpenAI
 */
import { Request, Response, Router } from 'express';
import { IStorage } from '../storage';
import { openaiService } from '../services/openai';

// Определение типа Tool для инструментов ассистента OpenAI
interface Tool {
  type: string;
  function?: {
    name: string;
    description?: string;
    parameters?: any;
  };
}

export function registerGetAssistantFunctionsRoute(app: any, storage: IStorage) {
  app.get('/api/assistants/:id/openai-functions', async (req: Request, res: Response) => {
    try {
      const assistantId = Number(req.params.id);
      if (isNaN(assistantId)) {
        return res.status(400).json({
          success: false,
          error: 'Невалидный ID ассистента'
        });
      }

      // Получаем ассистента из базы данных
      const assistant = await storage.getAssistant(assistantId);
      if (!assistant) {
        return res.status(404).json({
          success: false,
          error: 'Ассистент не найден'
        });
      }

      // Проверяем наличие ID ассистента на платформе OpenAI
      if (!assistant.openaiAssistantId) {
        return res.status(404).json({
          success: false,
          error: 'Ассистент не связан с платформой OpenAI'
        });
      }

      // Получаем ассистента из OpenAI API
      const openaiAssistant = await openaiService.getAssistant(assistant.openaiAssistantId);
      
      console.log(`[GET-OPENAI-FUNCTIONS] Получен ассистент из OpenAI: ${JSON.stringify(openaiAssistant, null, 2)}`);
      
      if (!openaiAssistant) {
        return res.status(404).json({
          success: false,
          error: 'Ассистент не найден на платформе OpenAI'
        });
      }

      // Получаем список активных функций
      const activeFunctions: string[] = [];
      
      console.log(`[GET-OPENAI-FUNCTIONS] Анализ инструментов ассистента: ${JSON.stringify(openaiAssistant.tools, null, 2)}`);
      
      if (openaiAssistant.tools && Array.isArray(openaiAssistant.tools)) {
        // Извлекаем имена функций из инструментов ассистента
        openaiAssistant.tools.forEach((tool: Tool) => {
          console.log(`[GET-OPENAI-FUNCTIONS] Обрабатываем инструмент: ${JSON.stringify(tool, null, 2)}`);
          if (tool.type === 'function' && tool.function && tool.function.name) {
            activeFunctions.push(tool.function.name);
            console.log(`[GET-OPENAI-FUNCTIONS] Добавлена активная функция: ${tool.function.name}`);
          }
        });
      }
      
      console.log(`[GET-OPENAI-FUNCTIONS] Итоговый список активных функций: ${JSON.stringify(activeFunctions, null, 2)}`);

      return res.json({
        success: true,
        activeFunctions
      });
    } catch (error: unknown) {
      console.error('Ошибка при получении функций ассистента:', error);
      return res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера'
      });
    }
  });
}