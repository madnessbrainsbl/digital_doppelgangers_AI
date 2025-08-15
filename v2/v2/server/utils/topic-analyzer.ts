/**
 * Утилита для детерминированного анализа тем в сообщениях
 */

export type TopicData = Record<string, number>;

/**
 * Анализирует темы в сообщениях и возвращает их распределение
 * @param messages - Список сообщений для анализа
 * @returns Объект с распределением тем
 */
export const analyzeTopics = (messages: any[]): TopicData => {
  if (!messages || messages.length === 0) {
    return {};
  }

  // Извлекаем и анализируем темы из метаданных сообщений
  const topicCounts: Record<string, number> = {};
  let totalTopics = 0;

  messages.forEach((message) => {
    try {
      // Пытаемся извлечь тему из метаданных
      const metadata = message.metadata
        ? typeof message.metadata === "string"
          ? JSON.parse(message.metadata)
          : message.metadata
        : {};

      const topic = metadata.topic || "Другие";

      if (!topicCounts[topic]) {
        topicCounts[topic] = 0;
      }

      topicCounts[topic]++;
      totalTopics++;
    } catch (e) {
      // Если не удалось разобрать метаданные, считаем тему как "Другие"
      if (!topicCounts["Другие"]) {
        topicCounts["Другие"] = 0;
      }
      topicCounts["Другие"]++;
      totalTopics++;
    }
  });

  // Если нет данных, возвращаем пустой объект
  if (totalTopics === 0) {
    return {};
  }

  // Преобразуем количество в проценты
  const result: TopicData = {};

  // Сортируем темы по убыванию частоты для детерминированного порядка
  const sortedTopics = Object.entries(topicCounts).sort((a, b) => {
    // Сначала сортируем по количеству (по убыванию)
    if (b[1] !== a[1]) {
      return b[1] - a[1];
    }
    // При равном количестве - по алфавиту
    return a[0].localeCompare(b[0]);
  });

  // Берем топ-5 тем, остальные группируем в "Другие"
  let otherPercentage = 0;

  sortedTopics.forEach(([topic, count], index) => {
    const percentage = Math.round((count / totalTopics) * 100);

    if (index < 5 && percentage >= 5) {
      result[topic] = percentage;
    } else {
      otherPercentage += percentage;
    }
  });

  // Добавляем "Другие" только если есть что добавлять
  if (otherPercentage > 0) {
    result["Другие"] = otherPercentage;
  }

  return result;
};
