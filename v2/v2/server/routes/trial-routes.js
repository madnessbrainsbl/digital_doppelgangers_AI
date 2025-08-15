import { pgPool } from "../db";

/**
 * Регистрирует API эндпоинты для работы с пробным периодом
 * @param {Express} app Express приложение
 * @param {IStorage} storage Хранилище данных
 */
export function registerTrialRoutes(app, storage) {
  // API для активации пробного периода
  app.post("/api/user/activate-trial", async (req, res) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "Не указан ID пользователя" });
      }

      // Получаем информацию о пользователе
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      // Проверяем, не использовал ли пользователь пробный период ранее
      if (user.trialUsed) {
        return res.status(400).json({ message: "Пробный период уже был использован" });
      }

      // Проверяем, не активирован ли уже платный тариф
      if (user.plan !== 'free') {
        return res.status(400).json({ message: "У вас уже подключен платный тариф" });
      }

      // Вычисляем дату окончания пробного периода (14 дней)
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 14);

      // Устанавливаем тариф "basic" и отмечаем, что пробный период был использован
      await storage.updateUser(userId, {
        plan: "basic",
        trialUsed: true,
        trialEndDate,
      });

      // Сбрасываем метрики использования, чтобы они создались заново при следующем запросе
      try {
        const deleteUsageQuery = `DELETE FROM user_plan_usage WHERE user_id = $1`;
        await pgPool.query(deleteUsageQuery, [userId]);
      } catch (error) {
        console.error("Ошибка при сбросе метрик использования:", error);
      }

      // Логируем активность
      await storage.createActivityLog({
        userId,
        action: "trial_activated",
        details: {
          oldPlan: user.plan,
          newPlan: "basic",
          trialEndDate,
        },
      });

      return res.json({ 
        success: true, 
        message: "Пробный период успешно активирован",
        trialEndDate,
      });
    } catch (error) {
      console.error("Ошибка при активации пробного периода:", error);
      return res.status(500).json({ 
        message: "Ошибка сервера при активации пробного периода",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // API для проверки доступности пробного периода
  app.get("/api/user/trial-availability/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ 
          success: false, 
          message: "Не указан ID пользователя" 
        });
      }
      
      // Получаем информацию о пользователе
      const user = await storage.getUser(parseInt(userId));
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "Пользователь не найден" 
        });
      }
      
      // Пробный период доступен, если:
      // 1. Пользователь еще не использовал пробный период (trialUsed = false)
      // 2. У пользователя нет активного платного тарифа (plan = 'free')
      const isAvailable = !user.trialUsed && user.plan === 'free';
      
      return res.json({ 
        success: true,
        isAvailable
      });
    } catch (error) {
      console.error("Ошибка при проверке доступности пробного периода:", error);
      return res.status(500).json({ 
        success: false,
        message: "Ошибка при проверке доступности пробного периода",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Добавление проверки истекших пробных периодов в ежедневный планировщик
  // (функция для вызова из основного планировщика)
  app.get("/api/scheduler/check-trials", async (req, res) => {
    try {
      const today = new Date();
      
      // Находим пользователей с истекшим пробным периодом
      const query = `
        SELECT id, email, name, plan, trial_end_date
        FROM users
        WHERE trial_used = TRUE 
        AND trial_end_date < $1
        AND plan = 'basic'
      `;
      
      const { rows } = await pgPool.query(query, [today]);
      
      if (rows.length === 0) {
        console.log("Нет пользователей с истекшим пробным периодом");
        return res.json({ 
          success: true, 
          message: "Нет пользователей с истекшим пробным периодом",
          deactivatedCount: 0
        });
      }
      
      console.log(`Найдено ${rows.length} пользователей с истекшим пробным периодом`);
      
      let deactivatedCount = 0;
      
      // Для каждого пользователя с истекшим пробным периодом
      for (const user of rows) {
        console.log(`Деактивация тарифа для пользователя ${user.id} (${user.email || user.name}): пробный период истек ${user.trial_end_date}`);
        
        // Обновляем тариф на free
        await storage.updateUser(user.id, {
          plan: "free",
          // Не сбрасываем trialUsed и trialEndDate, чтобы сохранить историю
        });
        
        // Логируем активность
        await storage.createActivityLog({
          userId: user.id,
          action: "trial_expired",
          details: {
            oldPlan: user.plan,
            newPlan: "free",
            trialEndDate: user.trial_end_date,
          },
        });
        
        deactivatedCount++;
      }
      
      console.log("Деактивация истекших пробных периодов завершена успешно");
      
      return res.json({ 
        success: true, 
        message: `Проверка истекших пробных периодов завершена. Деактивировано тарифов: ${deactivatedCount}`,
        deactivatedCount
      });
    } catch (error) {
      console.error("Ошибка при проверке истекших пробных периодов:", error);
      return res.status(500).json({ 
        success: false,
        message: "Ошибка при проверке истекших пробных периодов",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
}