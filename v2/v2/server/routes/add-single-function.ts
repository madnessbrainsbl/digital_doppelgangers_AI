/**
 * Маршрут для добавления одной функции к ассистенту OpenAI
 * В отличие от update-functions, этот маршрут добавляет только одну конкретную функцию
 */

import { Router, Request, Response } from 'express';
import { IStorage } from '../storage';
import { FunctionToolsUpdater } from '../services/function-tools-updater';

export function registerAddSingleFunctionRoute(router: Router, storage: IStorage) {
  // Маршрут для добавления одной функции к ассистенту
  router.post('/api/assistants/:id/add-single-function', async (req: Request, res: Response) => {
    try {
      console.log(`[ADD-SINGLE-FUNCTION] Получен запрос на добавление функции к ассистенту: ${req.params.id}`);
      console.log(`[ADD-SINGLE-FUNCTION] Тело запроса:`, req.body);
      
      // Валидация параметров запроса
      const assistantId = parseInt(req.params.id);
      if (isNaN(assistantId)) {
        console.log(`[ADD-SINGLE-FUNCTION] Ошибка: неверный ID ассистента: ${req.params.id}`);
        return res.status(400).json({ 
          success: false, 
          message: 'Неверный ID ассистента' 
        });
      }
      
      const { functionId } = req.body;
      if (!functionId || isNaN(parseInt(functionId))) {
        console.log(`[ADD-SINGLE-FUNCTION] Ошибка: не указан или неверный ID функции: ${functionId}`);
        return res.status(400).json({ 
          success: false, 
          message: 'Не указан или неверный ID функции' 
        });
      }
      
      // Получаем ассистента из БД
      const assistant = await storage.getAssistant(assistantId);
      if (!assistant) {
        console.log(`[ADD-SINGLE-FUNCTION] Ошибка: ассистент с ID ${assistantId} не найден`);
        return res.status(404).json({ 
          success: false, 
          message: 'Ассистент не найден' 
        });
      }
      
      // Проверяем ID OpenAI
      if (!assistant.openaiAssistantId) {
        console.log(`[ADD-SINGLE-FUNCTION] Ошибка: ассистент ${assistantId} не имеет OpenAI ID`);
        return res.status(400).json({ 
          success: false, 
          message: 'Ассистент не связан с OpenAI' 
        });
      }
      
      // Добавляем функцию к ассистенту используя сервис FunctionToolsUpdater
      const updater = new FunctionToolsUpdater(storage);
      const result = await updater.addSingleFunction(assistantId, parseInt(functionId));
      
      console.log(`[ADD-SINGLE-FUNCTION] Результат добавления функции ${functionId} для ассистента ${assistantId}:`, result);
      
      if (result.success) {
        if (result.added) {
          console.log(`[ADD-SINGLE-FUNCTION] Функция ${functionId} успешно добавлена к ассистенту ${assistantId}`);
          return res.status(200).json({
            success: true,
            added: true,
            functionName: result.functionName,
            message: 'Функция успешно добавлена к ассистенту'
          });
        } else {
          console.log(`[ADD-SINGLE-FUNCTION] Функция ${functionId} уже была добавлена ранее`);
          return res.status(200).json({
            success: true,
            added: false,
            functionName: result.functionName,
            message: 'Функция уже была добавлена ранее'
          });
        }
      } else {
        console.log(`[ADD-SINGLE-FUNCTION] Ошибка при добавлении функции ${functionId}`);
        return res.status(500).json({
          success: false,
          message: 'Ошибка при добавлении функции к ассистенту'
        });
      }
    } catch (error: any) {
      console.error('[ADD-SINGLE-FUNCTION] Ошибка при обработке запроса:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Внутренняя ошибка сервера'
      });
    }
  });
  
  // Новый маршрут для совместимости с клиентским кодом
  router.post('/api/assistants/:id/function-tools/:functionId', async (req: Request, res: Response) => {
    try {
      console.log(`[FUNCTION-TOOLS] Получен запрос на добавление функции ${req.params.functionId} к ассистенту ${req.params.id}`);
      
      // Валидация параметров запроса
      const assistantId = parseInt(req.params.id);
      if (isNaN(assistantId)) {
        console.log(`[FUNCTION-TOOLS] Ошибка: неверный ID ассистента: ${req.params.id}`);
        return res.status(400).json({ 
          success: false, 
          message: 'Неверный ID ассистента' 
        });
      }
      
      const functionId = parseInt(req.params.functionId);
      if (isNaN(functionId)) {
        console.log(`[FUNCTION-TOOLS] Ошибка: неверный ID функции: ${req.params.functionId}`);
        return res.status(400).json({ 
          success: false, 
          message: 'Неверный ID функции' 
        });
      }
      
      // Получаем ассистента из БД
      const assistant = await storage.getAssistant(assistantId);
      if (!assistant) {
        console.log(`[FUNCTION-TOOLS] Ошибка: ассистент с ID ${assistantId} не найден`);
        return res.status(404).json({ 
          success: false, 
          message: 'Ассистент не найден' 
        });
      }
      
      // Проверяем ID OpenAI
      if (!assistant.openaiAssistantId) {
        console.log(`[FUNCTION-TOOLS] Ошибка: ассистент ${assistantId} не имеет OpenAI ID`);
        return res.status(400).json({ 
          success: false, 
          message: 'Ассистент не связан с OpenAI' 
        });
      }
      
      // Добавляем функцию к ассистенту используя сервис FunctionToolsUpdater
      const updater = new FunctionToolsUpdater(storage);
      const result = await updater.addSingleFunction(assistantId, functionId);
      
      console.log(`[FUNCTION-TOOLS] Результат добавления функции ${functionId} для ассистента ${assistantId}:`, result);
      
      if (result.success) {
        if (result.added) {
          console.log(`[FUNCTION-TOOLS] Функция ${functionId} успешно добавлена к ассистенту ${assistantId}`);
          return res.status(200).json({
            success: true,
            added: true,
            functionName: result.functionName,
            message: 'Функция успешно добавлена к ассистенту'
          });
        } else {
          console.log(`[FUNCTION-TOOLS] Функция ${functionId} уже была добавлена ранее`);
          return res.status(200).json({
            success: true,
            added: false,
            functionName: result.functionName,
            message: 'Функция уже была добавлена ранее'
          });
        }
      } else {
        console.log(`[FUNCTION-TOOLS] Ошибка при добавлении функции ${functionId}`);
        return res.status(500).json({
          success: false,
          message: 'Ошибка при добавлении функции к ассистенту'
        });
      }
    } catch (error: any) {
      console.error('[FUNCTION-TOOLS] Ошибка при обработке запроса:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Внутренняя ошибка сервера'
      });
    }
  });
}