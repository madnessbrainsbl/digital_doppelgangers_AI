import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from '@shared/schema';

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create a drizzle instance with the schema
export const db = drizzle(pool, { schema });

// Экспортируем пул для прямых запросов к PostgreSQL
export const pgPool = pool;

/**
 * Увеличивает счетчик использованных сообщений для пользователя
 * @param userId ID пользователя
 * @returns true, если счетчик успешно увеличен, false в случае ошибки
 */
export async function incrementUserMessagesCount(userId: number): Promise<boolean> {
  try {
    console.log(`Увеличение счетчика сообщений для пользователя ${userId}`);
    
    // Проверяем наличие пользователя и его тарифа
    const userQuery = `
      SELECT id, plan, balance FROM users 
      WHERE id = $1
    `;
    
    const userResult = await pool.query(userQuery, [userId]);
    const user = userResult.rows[0];
    
    if (!user) {
      console.error(`Пользователь с ID ${userId} не найден`);
      return false;
    }

    // Если у пользователя не установлен тариф, не учитываем сообщения
    if (!user.plan || user.plan === 'free') {
      console.log(`У пользователя ${userId} нет тарифа, сообщения не учитываются`);
      return false;
    }
    
    // Если тариф не 'basic', то сообщения не ограничены
    if (user.plan !== 'basic') {
      console.log(`У пользователя ${userId} тариф ${user.plan}, сообщения не ограничены`);
      return true;
    }

    // Получаем данные использования из базы данных
    const planUsageQuery = `
      SELECT * FROM user_plan_usage 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    const planUsageResult = await pool.query(planUsageQuery, [userId]);
    let planUsage = planUsageResult.rows[0];
    
    if (!planUsage) {
      console.error(`Данные использования для пользователя ${userId} не найдены`);
      return false;
    }

    // Проверяем, не превышен ли лимит сообщений
    // Приводим к числу для корректного сравнения
    const messagesUsed = parseInt(planUsage.messages_used) || 0;
    const messagesLimit = parseInt(planUsage.messages_limit) || 1000;
    
    if (messagesUsed >= messagesLimit) {
      console.warn(`Превышен лимит сообщений для пользователя ${userId}: ${messagesUsed}/${messagesLimit}`);
      // Не увеличиваем счетчик, так как лимит уже превышен
      return false;
    }

    // Увеличиваем счетчик использованных сообщений
    const newMessagesCount = messagesUsed + 1;
    
    console.log(`Обновляем количество сообщений в базе: было ${messagesUsed}, стало ${newMessagesCount}`);
    
    // Обновляем запись в базе данных
    const updateQuery = `
      UPDATE user_plan_usage 
      SET messages_used = $1,
          updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    
    await pool.query(updateQuery, [
      newMessagesCount,
      planUsage.id
    ]);
    
    return true;
  } catch (error) {
    console.error(`Ошибка при обновлении счетчика сообщений: ${error}`);
    return false;
  }
}