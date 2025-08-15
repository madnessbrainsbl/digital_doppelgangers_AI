/**
 * Утилиты для работы с пробным периодом
 */
import { IStorage } from "../storage";

// Количество дней пробного периода
const TRIAL_DAYS = 14;

/**
 * Проверяет и деактивирует истекшие пробные периоды
 * @param storage Экземпляр хранилища
 * @returns Количество деактивированных тарифов
 */
export async function deactivateExpiredTrials(storage: IStorage): Promise<number> {
  try {
    // Получаем всех пользователей, у которых активирован пробный период
    const users = await storage.listUsers();
    const trialUsers = users.filter(user => 
      user.trialUsed === true && 
      user.trialEndDate && 
      new Date(user.trialEndDate) < new Date()
    );

    // Для каждого пользователя с истекшим пробным периодом отключаем тариф
    let deactivatedCount = 0;
    
    for (const user of trialUsers) {
      try {
        await storage.updateUser(user.id, {
          plan: 'free',  // Сбрасываем тариф на бесплатный
          // Не сбрасываем trialUsed, чтобы пользователь не мог повторно активировать пробный период
        });
        
        // Логируем действие для возможного отслеживания в будущем
        await storage.createActivityLog({
          userId: user.id,
          action: 'trial_deactivated',
          details: {
            trialEndDate: user.trialEndDate,
            previousPlan: user.plan
          }
        });
        
        deactivatedCount++;
      } catch (error) {
        console.error(`Ошибка при деактивации пробного периода для пользователя ${user.id}:`, error);
      }
    }
    
    return deactivatedCount;
  } catch (error) {
    console.error('Ошибка при деактивации истекших пробных периодов:', error);
    return 0;
  }
}

/**
 * Проверяет, доступен ли пробный период для пользователя
 * @param userId ID пользователя
 * @param storage Экземпляр хранилища
 * @returns true, если пробный период доступен
 */
export async function isTrialAvailable(userId: number, storage: IStorage): Promise<boolean> {
  try {
    const user = await storage.getUser(userId);
    
    // Пробный период недоступен, если:
    // 1. Пользователь не найден
    // 2. У пользователя уже был использован пробный период (trialUsed === true)
    // 3. У пользователя текущий тариф не равен 'free' (уже есть активный тариф)
    
    if (!user) {
      return false;
    }
    
    return user.trialUsed !== true && (user.plan === 'free' || !user.plan);
  } catch (error) {
    console.error(`Ошибка при проверке доступности пробного периода для пользователя ${userId}:`, error);
    return false;
  }
}

/**
 * Активирует пробный период для пользователя
 * @param userId ID пользователя
 * @param storage Экземпляр хранилища
 * @returns Результат активации
 */
export async function activateTrialPeriod(
  userId: number,
  storage: IStorage,
): Promise<{ success: boolean; message?: string }> {
  try {
    // Проверяем доступность пробного периода
    const isAvailable = await isTrialAvailable(userId, storage);
    
    if (!isAvailable) {
      return { 
        success: false, 
        message: 'Пробный период недоступен для данного пользователя или уже был использован' 
      };
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return { success: false, message: 'Пользователь не найден' };
    }
    
    // Рассчитываем дату окончания пробного периода (текущая дата + TRIAL_DAYS дней)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + TRIAL_DAYS);
    
    // Обновляем информацию о пользователе
    await storage.updateUser(userId, {
      plan: 'basic', // Устанавливаем тариф Basic
      trialUsed: true,
      trialEndDate: trialEndDate, // Передаем объект Date для совместимости с DB
    });
    
    // Создаем запись в таблице использования тарифа или обновляем существующую
    // Устанавливаем стандартные лимиты для тарифа Basic
    // Это должно быть реализовано через отдельную функцию updateOrCreateUserPlanUsage
    
    // Логируем активацию пробного периода
    await storage.createActivityLog({
      userId,
      action: 'trial_activated',
      details: {
        trialEndDate: trialEndDate.toISOString(),
        plan: 'basic'
      }
    });
    
    return { 
      success: true, 
      message: `Пробный период тарифа Basic успешно активирован до ${trialEndDate.toLocaleDateString('ru-RU')}` 
    };
  } catch (error) {
    console.error(`Ошибка при активации пробного периода для пользователя ${userId}:`, error);
    return { 
      success: false, 
      message: `Произошла ошибка при активации пробного периода: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}` 
    };
  }
}