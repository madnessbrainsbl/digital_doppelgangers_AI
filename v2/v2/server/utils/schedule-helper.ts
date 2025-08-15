/**
 * Вспомогательные функции для работы с расписанием ассистентов
 */

interface ScheduleSettings {
  enabled: boolean;
  workMode: "24/7" | "schedule";
  startTime: string; // в формате HH:MM
  endTime: string; // в формате HH:MM
  weekdays: string[]; // массив выбранных дней недели ("mon", "tue", ...)
}

import { Channel, Storage } from "../storage";

/**
 * Проверяет, доступен ли ассистент по расписанию для указанного канала
 * @param channelId ID канала
 * @param storage Экземпляр хранилища
 * @returns true если ассистент доступен (или расписание не настроено), false если недоступен
 */
export async function isAssistantAvailableBySchedule(
  channelId: number,
  storage: Storage
): Promise<boolean> {
  try {
    // Получаем настройки канала
    const channel = await storage.getChannel(channelId);
    if (!channel) {
      console.error(`Канал с ID ${channelId} не найден`);
      return false;
    }

    // Получаем ассистента канала
    const channelAssistant = await storage.getAssistantChannelByChannel(
      channelId
    );
    if (!channelAssistant) {
      console.log(
        `Канал ${channelId} не имеет подключенного ассистента, считаем доступным`
      );
      return true;
    }

    // Если у ассистента не включен график работы, считаем что он доступен всегда
    if (!channelAssistant.settings?.schedule?.enabled) {
      return true;
    }

    // Получаем расписание из настроек канала
    const schedule = {
      startHour:
        channelAssistant.settings?.schedule?.startTime?.split(":")[0] || "00",
      startMinute:
        channelAssistant.settings?.schedule?.startTime?.split(":")[1] || "00",
      endHour:
        channelAssistant.settings?.schedule?.endTime?.split(":")[0] || "23",
      endMinute:
        channelAssistant.settings?.schedule?.endTime?.split(":")[1] || "59",
    };

    // Парсим часы и минуты из расписания
    const startHour = parseInt(schedule.startHour);
    const startMinute = parseInt(schedule.startMinute);
    const endHour = parseInt(schedule.endHour);
    const endMinute = parseInt(schedule.endMinute);

    // Проверяем корректность данных
    if (
      isNaN(startHour) ||
      isNaN(startMinute) ||
      isNaN(endHour) ||
      isNaN(endMinute)
    ) {
      console.error(
        `Некорректное расписание для канала ${channelId}: ${JSON.stringify(
          schedule
        )}`
      );
      // В случае ошибки считаем ассистента доступным
      return true;
    }

    // Получаем текущее время
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Преобразуем время в минуты для удобства сравнения
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;

    // Проверяем, переходит ли расписание через полночь
    const isOvernight = startTimeInMinutes > endTimeInMinutes;

    let isAvailable;
    if (isOvernight) {
      // Если расписание переходит через полночь, проверяем, что текущее время
      // либо после начала, либо до конца
      isAvailable =
        currentTimeInMinutes >= startTimeInMinutes ||
        currentTimeInMinutes <= endTimeInMinutes;
    } else {
      // Стандартный случай - проверяем, что текущее время между началом и концом
      isAvailable =
        currentTimeInMinutes >= startTimeInMinutes &&
        currentTimeInMinutes <= endTimeInMinutes;
    }

    if (!isAvailable) {
      console.log(
        `[АССИСТЕНТ] Ассистент недоступен по расписанию для канала ${channelId}`
      );
    }

    return isAvailable;
  } catch (error) {
    console.error(
      `Ошибка при проверке доступности ассистента по расписанию:`,
      error
    );
    // В случае ошибки считаем ассистента доступным
    return true;
  }
}
