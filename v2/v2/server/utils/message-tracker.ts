import { incrementUserMessagesCount } from '../db';
import { IStorage } from '../storage';

/**
 * Хелпер для отслеживания использования сообщений ассистентом
 * Увеличивает счетчик использованных сообщений для владельца канала
 * 
 * @param channelId ID канала
 * @param storage Экземпляр хранилища
 */
export async function trackAssistantMessage(channelId: number, storage: IStorage): Promise<void> {
  try {
    // Получаем канал, чтобы узнать, кто его создал
    const channel = await storage.getChannel(channelId);
    if (!channel || !channel.createdBy) {
      console.log(`Не удалось найти владельца канала ${channelId} для учета сообщений`);
      return;
    }
    
    // Учитываем сообщение в лимите пользователя
    const success = await incrementUserMessagesCount(channel.createdBy);
    if (success) {
      console.log(`Учтено сообщение ассистента для пользователя ID=${channel.createdBy} (канал ${channelId})`);
    } else {
      console.log(`Не удалось учесть сообщение для пользователя ID=${channel.createdBy} (канал ${channelId})`);
    }
  } catch (error) {
    console.error(`Ошибка при учете сообщения ассистента: ${error}`);
  }
}