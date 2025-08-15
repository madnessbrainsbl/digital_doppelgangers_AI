/**
 * Route для обновления статуса канала уведомлений для функции ассистента
 */
import { Router } from 'express';
import { IStorage } from '../storage';

export function createUpdateFunctionChannelRoute(storage: IStorage) {
  const router = Router();

  // Маршрут для обновления статуса канала уведомлений для функции ассистента
  router.patch('/function-assistants/:id/channel-status', async (req, res) => {
    try {
      const functionAssistantId = parseInt(req.params.id, 10);
      const { channelEnabled } = req.body;

      if (typeof channelEnabled !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'Не указан статус канала уведомлений (channelEnabled должен быть boolean)'
        });
      }

      // Получаем текущую запись
      const functionAssistant = await storage.getFunctionAssistant(functionAssistantId);
      
      if (!functionAssistant) {
        return res.status(404).json({
          success: false,
          error: `Связь функции с ассистентом с ID ${functionAssistantId} не найдена`
        });
      }

      // Обновляем статус канала
      const updatedFunctionAssistant = await storage.updateFunctionAssistant(functionAssistantId, {
        channelEnabled
      });

      // Возвращаем обновленную запись
      return res.json({
        success: true,
        functionAssistant: updatedFunctionAssistant
      });
    } catch (error) {
      console.error('Ошибка при обновлении статуса канала уведомлений:', error);
      return res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера'
      });
    }
  });

  return router;
}