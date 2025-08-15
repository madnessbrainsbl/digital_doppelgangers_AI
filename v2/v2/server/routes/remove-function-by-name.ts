import { Router, Request, Response } from 'express';
import { FunctionToolsUpdater } from '../services/function-tools-updater';
import { db } from '../db';
import { z } from 'zod';
import { storage } from '../storage';

const router = Router();

// Маршрут для удаления функции у ассистента напрямую через OpenAI API по имени функции
router.post('/assistants/:id/remove-function-by-name', async (req: Request, res: Response) => {
  try {
    console.log(`[REMOVE-FUNCTION-BY-NAME] Получен запрос:`, req.body);
    
    const assistantId = parseInt(req.params.id);
    console.log(`[REMOVE-FUNCTION-BY-NAME] ID ассистента: ${assistantId}`);
    
    // Проверяем валидность запроса
    const schema = z.object({
      functionName: z.string().min(1),
    });
    
    const result = schema.safeParse(req.body);
    if (!result.success) {
      console.log(`[REMOVE-FUNCTION-BY-NAME] Ошибка валидации:`, result.error.issues);
      return res.status(400).json({
        success: false,
        error: 'Некорректные параметры запроса',
        details: result.error.issues
      });
    }
    
    const { functionName } = result.data;
    console.log(`[REMOVE-FUNCTION-BY-NAME] Имя функции для удаления: "${functionName}"`);
    
    // Получаем данные ассистента из нашей БД
    const assistant = await db.query.assistants.findFirst({
      where: (assistants, { eq }) => eq(assistants.id, assistantId)
    });
    
    if (!assistant) {
      console.log(`[REMOVE-FUNCTION-BY-NAME] Ассистент с ID ${assistantId} не найден`);
      return res.status(404).json({
        success: false,
        error: `Ассистент с ID ${assistantId} не найден`
      });
    }
    
    console.log(`[REMOVE-FUNCTION-BY-NAME] Найден ассистент: ${assistant.name}, openaiAssistantId=${assistant.openaiAssistantId || 'не задан'}`);
    
    if (!assistant.openaiAssistantId) {
      console.log(`[REMOVE-FUNCTION-BY-NAME] У ассистента нет openaiAssistantId`);
      return res.status(400).json({
        success: false,
        error: `У ассистента с ID ${assistantId} нет связи с OpenAI (отсутствует openaiAssistantId)`
      });
    }
    
    // Создаем экземпляр FunctionToolsUpdater с хранилищем
    const functionToolsUpdater = new FunctionToolsUpdater(storage);
    
    console.log(`[REMOVE-FUNCTION-BY-NAME] Вызываем метод удаления функции "${functionName}" у ассистента ${assistantId}`);
    
    // Вызываем метод для удаления функции по имени
    // Первый параметр - ID ассистента в нашей БД
    const result2 = await functionToolsUpdater.removeFunctionByName(assistantId, functionName);
    
    console.log(`[REMOVE-FUNCTION-BY-NAME] Результат удаления: ${result2 ? 'успешно' : 'неудачно'}`);
    
    if (result2) {
      return res.json({
        success: true,
        message: `Функция "${functionName}" успешно удалена у ассистента OpenAI`
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Ошибка при удалении функции из OpenAI'
      });
    }
  } catch (error: any) {
    console.error('[REMOVE-FUNCTION-BY-NAME] Ошибка при удалении функции по имени:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Неизвестная ошибка сервера'
    });
  }
});

export default router;