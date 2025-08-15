import { pgPool } from "../db";
import { IStorage } from "../storage";

/**
 * Сервис для управления пробными периодами
 */
export class TrialManager {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Активирует пробный период для пользователя
   * @param userId ID пользователя
   * @returns Объект с информацией об активации
   */
  async activateTrial(userId: number) {
    const user = await this.storage.getUser(userId);
      
    if (!user) {
      throw new Error("Пользователь не найден");
    }

    // Проверяем, не использовал ли пользователь пробный период ранее
    if (user.trialUsed) {
      throw new Error("Пробный период уже был использован");
    }

    // Проверяем, не активирован ли уже платный тариф
    if (user.plan !== 'free') {
      throw new Error("У вас уже подключен платный тариф");
    }

    // Вычисляем дату окончания пробного периода (14 дней)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);

    // Устанавливаем тариф "basic" и отмечаем, что пробный период был использован
    await this.storage.updateUser(userId, {
      plan: "basic",
      trialUsed: true,
      trialEndDate,
    });

    // Логируем активность
    await this.storage.createActivityLog({
      userId,
      action: "trial_activated",
      details: {
        oldPlan: user.plan,
        newPlan: "basic",
        trialEndDate,
      },
    });

    return {
      success: true,
      message: "Пробный период успешно активирован",
      trialEndDate,
    };
  }

  /**
   * Проверяет и деактивирует истекшие пробные периоды
   * @returns Количество деактивированных пробных периодов
   */
  async deactivateExpiredTrials() {
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
        return 0;
      }
      
      console.log(`Найдено ${rows.length} пользователей с истекшим пробным периодом`);
      
      // Для каждого пользователя с истекшим пробным периодом
      for (const user of rows) {
        console.log(`Деактивация тарифа для пользователя ${user.id} (${user.email || user.name}): пробный период истек ${user.trial_end_date}`);
        
        // Обновляем тариф на free
        await this.storage.updateUser(user.id, {
          plan: "free",
          // Не сбрасываем trialUsed и trialEndDate, чтобы сохранить историю
        });
        
        // Логируем активность
        await this.storage.createActivityLog({
          userId: user.id,
          action: "trial_expired",
          details: {
            oldPlan: user.plan,
            newPlan: "free",
            trialEndDate: user.trial_end_date,
          },
        });
      }
      
      console.log("Деактивация истекших пробных периодов завершена успешно");
      return rows.length;
    } catch (error) {
      console.error("Ошибка при деактивации истекших пробных периодов:", error);
      return 0;
    }
  }

  /**
   * Проверяет, доступен ли пробный период для пользователя
   * @param userId ID пользователя
   * @returns true, если пробный период доступен
   */
  async isTrialAvailable(userId: number): Promise<boolean> {
    try {
      const user = await this.storage.getUser(userId);
      
      if (!user) {
        return false;
      }
      
      // Пробный период доступен, если:
      // 1. Пользователь еще не использовал пробный период (trialUsed = false)
      // 2. У пользователя нет активного платного тарифа (plan = 'free')
      return !user.trialUsed && user.plan === 'free';
    } catch (error) {
      console.error("Ошибка при проверке доступности пробного периода:", error);
      return false;
    }
  }
}