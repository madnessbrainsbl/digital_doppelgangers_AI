/**
 * Сервис для взаимодействия с Telegram Bot API
 * Используется для отправки сообщений через бота в каналы и чаты
 */

export class TelegramService {
  /**
   * Отправляет сообщение в указанный чат
   * @param botToken Токен бота Telegram
   * @param chatId ID чата или канала
   * @param text Текст сообщения
   * @param options Дополнительные параметры сообщения
   */
  async sendMessage(
    botToken: string,
    chatId: string | number, 
    text: string, 
    options: {
      disable_web_page_preview?: boolean;
      parse_mode?: 'Markdown' | 'HTML';
    } = {}
  ): Promise<any> {
    console.log(`[Telegram] Подготовка к отправке сообщения в чат ${chatId}`);
    console.log(`[Telegram] Длина сообщения: ${text.length} символов`);
    console.log(`[Telegram] Токен бота (первые 10 символов): ${botToken ? botToken.substring(0, 10) + '...' : 'не указан'}`);
    
    if (!botToken) {
      console.error('[Telegram] Не указан токен бота Telegram');
      throw new Error('Отсутствует токен бота Telegram');
    }
    
    // Проверка и очистка ID чата (иногда присылают с префиксом "@" или пробелами)
    let cleanChatId = String(chatId).trim();
    if (cleanChatId.startsWith('@')) {
      console.log(`[Telegram] ID чата начинается с @, используем как есть`);
    } else if (!/^-?\d+$/.test(cleanChatId) && !cleanChatId.startsWith('@')) {
      console.log(`[Telegram] ID чата не является числом и не начинается с @, может быть некорректным`);
    }
    
    try {
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      
      const params = {
        chat_id: cleanChatId,
        text,
        disable_web_page_preview: options.disable_web_page_preview ?? false,
        parse_mode: options.parse_mode
      };
      
      console.log(`[Telegram] Отправка запроса к API: ${url}`);
      console.log(`[Telegram] Параметры: ${JSON.stringify({
        chat_id: cleanChatId,
        text: text.length > 100 ? text.substring(0, 100) + '...' : text,
        disable_web_page_preview: options.disable_web_page_preview,
        parse_mode: options.parse_mode
      })}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      
      console.log(`[Telegram] Получен ответ с кодом: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Telegram] Ошибка отправки сообщения: ${response.status} ${errorText}`);
        
        // Дополнительная проверка конкретных ошибок Telegram API
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.description) {
            console.error(`[Telegram] Описание ошибки API: ${errorJson.description}`);
            
            // Рекомендации по исправлению типичных ошибок
            if (errorJson.description.includes("chat not found")) {
              console.error(`[Telegram] ⚠️ Чат не найден. Убедитесь, что бот добавлен в чат/группу и имеет права отправлять сообщения.`);
            } else if (errorJson.description.includes("bot was blocked")) {
              console.error(`[Telegram] ⚠️ Бот заблокирован пользователем.`);
            } else if (errorJson.description.includes("invalid token")) {
              console.error(`[Telegram] ⚠️ Неверный токен бота. Проверьте токен в настройках канала.`);
            }
          }
        } catch (parseError) {
          // Если ошибка не в формате JSON, игнорируем
        }
        
        throw new Error(`Ошибка API Telegram: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log(`[Telegram] Сообщение успешно отправлено, результат:`, result);
      return result;
    } catch (error) {
      console.error('[Telegram] Ошибка при отправке сообщения:', error);
      // Дополнительный вывод всех деталей ошибки для отладки
      if (error instanceof Error) {
        console.error('[Telegram] Сообщение ошибки:', error.message);
        console.error('[Telegram] Стек вызовов:', error.stack);
      }
      throw error;
    }
  }
  
  /**
   * Отправляет данные вызова функции
   * @param botToken Токен бота Telegram
   * @param chatId ID чата или канала
   * @param toolCall Данные вызова функции
   * @param toolName Имя функции (опционально)
   * @param toolArgs Аргументы функции в форматированном виде (опционально)
   * @param notificationChannelId ID канала уведомлений (опционально)
   */
  async sendToolCallMessage(
    botToken: string,
    chatId: string | number,
    toolCall: any,
    toolName?: string,
    toolArgs?: string,
    notificationChannelId?: number
  ): Promise<any> {
    console.log(`[Telegram] Подготовка к отправке данных функции в чат ${chatId}`);
    
    let data: any = {};
    
    // Получаем данные из аргументов
    if (toolArgs) {
      try {
        data = JSON.parse(toolArgs);
      } catch (e) {
        data = toolArgs;
      }
    } else if (toolCall?.function?.arguments) {
      try {
        data = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        data = toolCall.function.arguments;
      }
    }

    // Форматируем сообщение в читаемом виде
    let messageText = '';
    if (typeof data === 'object' && data !== null) {
      for (const [key, value] of Object.entries(data)) {
        messageText += `📌 ${key}: ${value}\n`;
      }
    } else {
      messageText = String(data);
    }

    // Если сообщение пустое, отправляем заглушку
    if (!messageText.trim()) {
      messageText = 'Нет данных';
    }

    return this.sendMessage(botToken, chatId, messageText);
  }
  
  /**
   * Отправляет результаты выполнения функции
   * @param botToken Токен бота Telegram
   * @param chatId ID чата или канала
   * @param toolName Имя функции
   * @param toolResult Результат выполнения функции
   * @param notificationChannelId ID канала уведомлений (опционально)
   */
  async sendToolResultMessage(
    botToken: string,
    chatId: string | number,
    toolName: string,
    toolResult: any,
    notificationChannelId?: number
  ): Promise<any> {
    console.log(`[Telegram] Подготовка к отправке результатов функции в чат ${chatId}`);
    
    let messageText = '';
    
    if (typeof toolResult === 'string') {
      try {
        const parsed = JSON.parse(toolResult);
        if (typeof parsed === 'object' && parsed !== null) {
          for (const [key, value] of Object.entries(parsed)) {
            messageText += `📌 ${key}: ${value}\n`;
          }
        } else {
          messageText = toolResult;
        }
      } catch (e) {
        messageText = toolResult;
      }
    } else if (toolResult === null || toolResult === undefined) {
      messageText = 'Нет данных';
    } else if (typeof toolResult === 'object') {
      for (const [key, value] of Object.entries(toolResult)) {
        messageText += `📌 ${key}: ${value}\n`;
      }
    } else {
      messageText = String(toolResult);
    }
    
    return this.sendMessage(botToken, chatId, messageText);
  }
  
  /**
   * Форматирует значение аргумента для отображения в Telegram
   * @param value Значение для форматирования
   */
  private formatArgValue(value: any): string {
    if (value === null || value === undefined) {
      return 'не указано';
    }
    
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch (e) {
        return 'сложный объект';
      }
    }
    
    return String(value);
  }
  
  /**
   * Проверяет возможность отправки сообщений в указанный чат/канал
   * @param botToken Токен бота Telegram
   * @param chatId ID чата или канала для проверки
   */
  async testConnection(botToken: string, chatId: string | number): Promise<boolean> {
    try {
      const message = 'Тестовое сообщение от бота. Проверка подключения.';
      const result = await this.sendMessage(botToken, chatId, message, { disable_web_page_preview: true });
      return !!result && !!result.ok;
    } catch (error) {
      console.error('Ошибка при проверке подключения к Telegram:', error);
      return false;
    }
  }
}

// Создаем экземпляр сервиса для использования в других модулях
export const telegramService = new TelegramService();