/**
 * Маршруты для работы с пробным периодом
 */
import { Request, Response } from "express";
import { Express } from "express";
import { IStorage } from "../storage";
import { isTrialAvailable, activateTrialPeriod } from "../utils/trial-utils";

export function registerTrialRoutes(app: Express, storage: IStorage) {
  /**
   * Проверяет доступность пробного периода для пользователя
   */
  app.get("/api/trial/available/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: "Некорректный ID пользователя" 
        });
      }
      
      const available = await isTrialAvailable(userId, storage);
      
      return res.json({ 
        success: true, 
        available 
      });
    } catch (error) {
      console.error("Ошибка при проверке доступности пробного периода:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Ошибка при проверке доступности пробного периода" 
      });
    }
  });
  
  /**
   * Активирует пробный период для пользователя
   */
  app.post("/api/trial/activate", async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ 
          success: false, 
          message: "Не указан ID пользователя" 
        });
      }
      
      // Для упрощения тестирования мы временно отключаем проверку авторизации
      // В реальном приложении здесь должна быть проверка текущего аутентифицированного пользователя
      
      const result = await activateTrialPeriod(userId, storage);
      
      return res.json(result);
    } catch (error) {
      console.error("Ошибка при активации пробного периода:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Ошибка при активации пробного периода" 
      });
    }
  });
  
  /**
   * Проверяет и деактивирует истекшие пробные периоды
   * Этот эндпоинт должен вызываться планировщиком задач, например, ежедневно
   */
  app.get("/api/scheduler/check-trials", async (_req: Request, res: Response) => {
    try {
      const { deactivateExpiredTrials } = await import("../utils/trial-utils");
      const deactivatedCount = await deactivateExpiredTrials(storage);
      
      return res.json({ 
        success: true, 
        deactivatedCount 
      });
    } catch (error) {
      console.error("Ошибка при проверке истекших пробных периодов:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Ошибка при проверке истекших пробных периодов" 
      });
    }
  });
}