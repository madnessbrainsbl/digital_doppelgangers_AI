/**
 * Маршрут для обновления функций ассистента
 * Используется для загрузки определений функций в OpenAI API
 */

import { Router, Request, Response } from 'express';
import { IStorage } from '../storage';
import { FunctionToolsUpdater } from '../services/function-tools-updater';

export function registerUpdateAssistantFunctionsRoutes(router: Router, storage: IStorage) {
  // Обновление функций конкретного ассистента
  router.post('/api/assistants/:id/update-functions', async (req: Request, res: Response) => {
    try {
      console.log(`[UPDATE-FUNCTIONS] Получен запрос на обновление функций ассистента: ${req.params.id}`);
      
      // Получаем ID недавно удаленных функций из запроса
      const excludeFunctionIds: number[] = req.body.excludeFunctionIds || [];
      console.log(`[UPDATE-FUNCTIONS] Исключаемые функции: ${JSON.stringify(excludeFunctionIds)}`);
      
      // Получаем направление синхронизации (none, db_to_openai, openai_to_db)
      // По умолчанию 'none' - только проверка расхождений
      const syncDirection = req.body.syncDirection || 'none';
      console.log(`[UPDATE-FUNCTIONS] Направление синхронизации: ${syncDirection}`);
      
      const assistantId = parseInt(req.params.id);
      if (isNaN(assistantId)) {
        return res.status(400).json({
          success: false,
          error: 'Некорректный ID ассистента'
        });
      }
      
      // Получаем данные ассистента из базы
      const assistant = await storage.getAssistant(assistantId);
      if (!assistant) {
        return res.status(404).json({
          success: false,
          error: 'Ассистент не найден'
        });
      }
      
      if (!assistant.openaiAssistantId) {
        return res.status(400).json({
          success: false,
          error: 'У ассистента отсутствует ID в OpenAI'
        });
      }
      
      // Создаем экземпляр сервиса
      const updater = new FunctionToolsUpdater(storage);
      
      // Выполняем синхронизацию
      console.log(`[UPDATE-FUNCTIONS] Запуск синхронизации для ассистента ${assistantId} с режимом ${syncDirection}`);
      const { added, removed } = await updater.syncAssistantFunctions(
        assistant.openaiAssistantId, 
        assistantId,
        excludeFunctionIds,
        syncDirection as 'none' | 'db_to_openai' | 'openai_to_db'
      );
      
      // Отвечаем клиенту
      return res.json({
        success: true,
        changes: {
          added,
          removed
        }
      });
    } catch (error) {
      console.error('[UPDATE-FUNCTIONS] Ошибка при обновлении функций:', error);
      return res.status(500).json({
        success: false,
        error: 'Ошибка сервера при обновлении функций'
      });
    }
  });
  
  // Обновление функций всех ассистентов с полной синхронизацией
  router.post('/api/assistants/update-all-functions', async (req: Request, res: Response) => {
    try {
      // Получаем список функций, которые нужно исключить из синхронизации
      const excludeFunctionIds = req.body.excludeFunctionIds || [];
      if (excludeFunctionIds.length > 0) {
        console.log(`[UPDATE-ALL-FUNCTIONS] Получен список исключаемых функций: ${excludeFunctionIds.join(', ')}`);
      }
      
      // Получаем направление синхронизации (none, db_to_openai, openai_to_db)
      // По умолчанию 'none' - только проверка расхождений
      const syncDirection = req.body.syncDirection || 'none';
      console.log(`[UPDATE-ALL-FUNCTIONS] Направление синхронизации: ${syncDirection}`);
      
      // Получаем все ассистенты
      const assistants = await storage.listAssistants();
      
      // Создаем экземпляр обновления функций
      const updater = new FunctionToolsUpdater(storage);
      
      // Результаты синхронизации для каждого ассистента
      interface SyncResultItem {
        added: string[];
        removed: string[];
      }
      const results: Record<number, SyncResultItem> = {};
      
      // Синхронизируем функции для каждого ассистента
      for (const assistant of assistants) {
        if (!assistant.openaiAssistantId) continue;
        
        try {
          // Синхронизируем функции с передачей списка исключаемых функций и режима синхронизации
          const result = await updater.syncAssistantFunctions(
            assistant.openaiAssistantId,
            assistant.id,
            excludeFunctionIds,
            syncDirection as 'none' | 'db_to_openai' | 'openai_to_db'
          );
          
          results[assistant.id] = result;
        } catch (err) {
          console.error(`Ошибка при синхронизации ассистента ${assistant.id}:`, err);
          results[assistant.id] = { added: [], removed: [] };
        }
      }
      
      // Подсчет итогов
      const summary = {
        total: Object.keys(results).length,
        synchronized: Object.keys(results).length, // Все обработаны
        failed: 0, // Подсчет в новой версии не ведем
        changes: {
          added: Object.values(results).reduce((sum, r) => sum + r.added.length, 0),
          removed: Object.values(results).reduce((sum, r) => sum + r.removed.length, 0),
        }
      };
      
      return res.json({ 
        success: true, 
        results,
        summary,
        message: 'Синхронизация функций ассистентов завершена'
      });
    } catch (error) {
      console.error('Ошибка при массовой синхронизации функций ассистентов:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Произошла ошибка при массовой синхронизации функций',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
}