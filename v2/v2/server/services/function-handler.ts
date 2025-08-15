/**
 * Сервис для обработки вызовов функций OpenAI
 * Обрабатывает вызовы функций от ассистента и выполняет соответствующие действия
 */

import { IStorage } from '../storage';
import { OpenAiFunction, FunctionExecutionResult } from '../types/openai';
import { Channel } from '../types/channel';
import { TelegramSettings } from '../types/telegram';
// Используем типы без импорта, чтобы избежать проблем с путями
type FunctionAssistant = {
  id: number;
  functionId: number;
  assistantId: number;
  notificationChannelId: number | null;
  enabled: boolean;
  channelEnabled: boolean;
  settings: any;
  createdAt: Date;
  updatedAt: Date;
};
import { TelegramService } from './telegram';
import { emailService } from './email';

interface FunctionCallDetails {
  name: string;
  arguments: Record<string, any>;
}

export class FunctionHandler {
  private storage: IStorage;
  private telegramService: TelegramService;
  private emailService: typeof emailService;

  constructor(storage: IStorage) {
    this.storage = storage;
    this.telegramService = new TelegramService();
    this.emailService = emailService;
  }
  
  /**
   * Форматирует имя функции в соответствии с требованиями OpenAI API
   * Преобразует кириллические символы в латиницу и удаляет недопустимые символы
   * @param name Исходное имя функции
   * @returns Отформатированное имя, содержащее только a-z, A-Z, 0-9, _ и -
   */
  private formatFunctionName(name: string): string {
    if (!name) return 'unnamed_function';
    
    // Транслитерация с русского на английский
    const translitMap: {[key: string]: string} = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
      'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
      'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
      'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
      'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
      'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E',
      'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
      'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
      'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch', 'Ъ': '',
      'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
    };
    
    // Транслитерация строки
    let transliterated = '';
    for (let i = 0; i < name.length; i++) {
      const char = name[i];
      transliterated += translitMap[char] || char;
    }
    
    // Заменяем пробелы на подчеркивания
    transliterated = transliterated.replace(/\s+/g, '_');
    
    // Удаляем все недопустимые символы (оставляем только a-z, A-Z, 0-9, _, -)
    transliterated = transliterated.replace(/[^a-zA-Z0-9_-]/g, '');
    
    // Если после обработки строка пустая, возвращаем значение по умолчанию
    if (!transliterated) {
      return 'function_' + Date.now().toString(36);
    }
    
    return transliterated;
  }
  
  /**
   * Определяет категорию функции на основе её имени
   * @param name Имя функции
   * @returns Категория функции или null, если не удалось определить
   */
  private getCategoryOfFunction(name: string): string | null {
    if (!name) return null;
    
    const lowerName = name.toLowerCase();
    
    // Определяем категорию по ключевым словам
    if (lowerName.includes('телефон') || 
        lowerName.includes('phone') || 
        lowerName.includes('nomer') || 
        lowerName.includes('номер')) {
      return 'phone';
    }
    
    if (lowerName.includes('имя') || 
        lowerName.includes('фамилия') || 
        lowerName.includes('name') || 
        lowerName.includes('surname')) {
      return 'name';
    }
    
    if (lowerName.includes('автомобиль') || 
        lowerName.includes('car') || 
        lowerName.includes('авто') || 
        lowerName.includes('марка') ||
        lowerName.includes('avto') ||
        lowerName.includes('avtomobil') ||
        lowerName.includes('марка автомобиля')) {
      return 'car';
    }
    
    return null;
  }
  
  /**
   * Определяет категорию функции на основе её имени
   * @param name Имя функции
   * @returns Категория функции или null, если не удалось определить
   */
  private getFunctionCategory(name: string): string | null {
    if (!name) return null;
    
    const lowerName = name.toLowerCase();
    
    // Определяем категорию по ключевым словам
    if (lowerName.includes('телефон') || 
        lowerName.includes('phone') || 
        lowerName.includes('nomer') || 
        lowerName.includes('номер')) {
      return 'phone';
    }
    
    if (lowerName.includes('имя') || 
        lowerName.includes('фамилия') || 
        lowerName.includes('name') || 
        lowerName.includes('surname')) {
      return 'name';
    }
    
    if (lowerName.includes('автомобиль') || 
        lowerName.includes('car') || 
        lowerName.includes('авто') || 
        lowerName.includes('марка') ||
        lowerName.includes('avto') ||
        lowerName.includes('марка автомобиля')) {
      return 'car';
    }
    
    return null;
  }

  /**
   * Обрабатывает вызов функции от ассистента
   * @param assistantId ID ассистента, который вызвал функцию
   * @param functionCall Детали вызова функции
   */
  async handleFunctionCall(assistantId: number, functionCall: FunctionCallDetails): Promise<FunctionExecutionResult> {
    try {
      console.log(`Обработка вызова функции ${functionCall.name} для ассистента ${assistantId}`);
      
      // Получаем все функции, связанные с ассистентом
      const functionAssistants = await this.storage.listFunctionAssistantsByAssistant(assistantId);
      if (!functionAssistants || functionAssistants.length === 0) {
        console.log(`У ассистента ${assistantId} нет привязанных функций`);
        return { success: false, error: 'Функции не найдены' };
      }
      
      // Получаем все доступные функции
      const allFunctions = await this.storage.listOpenAiFunctions();
      
      // Ищем функцию по имени
      // Учитываем, что в OpenAI API имя функции приходит в транслитерированном виде,
      // а в нашей базе данных может храниться оригинальное название на русском
      const calledFunctionName = functionCall.name;
      console.log(`Ищем функцию с именем ${calledFunctionName} среди функций ассистента ${assistantId}`);
      
      const functionAssistant = functionAssistants.find(fa => {
        const func = allFunctions.find(f => f.id === fa.functionId);
        if (!func || !fa.enabled) return false;
        
        const formattedDbFunctionName = this.formatFunctionName(func.name);
        
        // Различные варианты сравнения имен функций
        const exactMatch = formattedDbFunctionName === calledFunctionName;
        const caseInsensitiveMatch = formattedDbFunctionName.toLowerCase() === calledFunctionName.toLowerCase();
        const containsMatch = formattedDbFunctionName.toLowerCase().includes(calledFunctionName.toLowerCase()) || 
                             calledFunctionName.toLowerCase().includes(formattedDbFunctionName.toLowerCase());
        
        // Проверка на ключевые слова по категориям функций
      const functionCategory = this.getCategoryOfFunction(func.name);
      const calledFunctionCategory = this.getCategoryOfFunction(calledFunctionName);
      const categoryMatch = functionCategory && calledFunctionCategory && functionCategory === calledFunctionCategory;
      
      // Больше логирования для отладки
      console.log(`Категория функции в БД: ${functionCategory}, Категория вызываемой функции: ${calledFunctionCategory}`);
      
      // Более глубокое сравнение - проверка на сходство слов
      const formattedWords = formattedDbFunctionName.toLowerCase().split(/[_\- ]/).filter(w => w.length > 2);
      const calledWords = calledFunctionName.toLowerCase().split(/[_\- ]/).filter(w => w.length > 2);
      
      console.log(`Слова в функции БД: [${formattedWords.join(', ')}], Слова в вызываемой функции: [${calledWords.join(', ')}]`);
      
      // Если хотя бы одно слово совпадает, считаем это частичным совпадением
      let wordMatch = false;
      for (const word1 of formattedWords) {
        for (const word2 of calledWords) {
          if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
            wordMatch = true;
            console.log(`Найдено совпадение по словам: "${word1}" и "${word2}"`);
            break;
          }
        }
        if (wordMatch) break;
      }
        
        const match = exactMatch || caseInsensitiveMatch || containsMatch || wordMatch;
        
        if (match) {
          console.log(`Найдено соответствие: DB функция "${func.name}" (${formattedDbFunctionName}) ~ вызов "${calledFunctionName}"`);
          if (exactMatch) console.log('(точное совпадение)');
          else if (caseInsensitiveMatch) console.log('(совпадение без учета регистра)');
          else if (containsMatch) console.log('(частичное совпадение)');
          else if (wordMatch) console.log('(совпадение по словам)');
        }
        
        return match;
      });
      
      if (!functionAssistant) {
        console.log(`Функция ${functionCall.name} не найдена для ассистента ${assistantId}`);
        return { success: false, error: 'Функция не найдена' };
      }
      
      // Получаем детали функции
      const func = allFunctions.find(f => f.id === functionAssistant.functionId);
      if (!func) {
        console.log(`Не найдены детали функции с ID ${functionAssistant.functionId}`);
        return { success: false, error: 'Детали функции не найдены' };
      }
      
      // Определяем какой канал использовать - привязанный к функции или к связи функция-ассистент
      let channelId = functionAssistant.notificationChannelId;
      
      // Если у связи функция-ассистент нет указанного канала, используем канал из самой функции
      if (!channelId && func.channelId) {
        channelId = func.channelId;
        console.log(`Используем канал из функции: ${channelId}`);
      } else if (channelId) {
        console.log(`Используем канал из связи функция-ассистент: ${channelId}`);
      }
      
      if (!channelId) {
        console.log(`Для функции ${func.name} не указан канал уведомлений`);
        return { success: false, error: 'Канал уведомлений не указан' };
      }
      
      const channel = await this.storage.getNotificationChannel(channelId);
      if (!channel) {
        console.log(`Не найден канал уведомлений с ID ${channelId}`);
        return { success: false, error: 'Канал уведомлений не найден' };
      }
      
      // Используем упрощенную схему: если функция активна, просто отправляем данные в канал
      console.log(`\n===== ОТПРАВКА ДАННЫХ В КАНАЛ =====`);
      console.log(`ID Функции: ${func.id}, Название: ${func.name}`);
      console.log(`ID Канала: ${channelId}, Тип: ${channel.type}`);
      console.log(`Функция активна: ${functionAssistant.enabled}`);
      console.log(`Аргументы функции:`, functionCall.arguments);
      
      console.log(`✅ Отправляем данные функции ${func.name} в канал типа ${channel.type}`);
      // Логируем действие для аналитики
      await this.storage.createActivityLog({
        userId: null,
        assistantId: assistantId,
        action: "function_data_sent",
        details: { 
          functionId: func.id, 
          functionName: func.name, 
          channelId: channelId, 
          channelType: channel.type 
        }
      });
      

      // Выполняем действия в зависимости от типа канала
      if (channel.type === 'telegram') {
        return await this.sendToTelegram(channel, func.name, functionCall.arguments);
      } else if (channel.type === 'email') {
        return await this.sendToEmail(channel, func, functionCall.arguments);
      } else {
        console.log(`Неподдерживаемый тип канала: ${channel.type}`);
        return { success: false, error: `Неподдерживаемый тип канала: ${channel.type}` };
      }
      
    } catch (error) {
      console.error(`Ошибка при обработке вызова функции:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      };
    }
  }
  
  /**
   * Отправляет данные в Telegram канал
   * В соответствии с требованиями отправляет только массив данных без форматирования
   */
  private async sendToTelegram(channel: Channel, functionName: string, args: any): Promise<FunctionExecutionResult> {
    console.log(`[Function Handler] Отправка данных в Telegram канал ${channel.id}`);
    console.log(`[Function Handler] Функция: ${functionName}`);
    console.log(`[Function Handler] Аргументы:`, args);

    const settings = channel.settings as TelegramSettings;
    
    if (!settings?.botToken) {
      console.error(`[Function Handler] Отсутствует токен бота для канала ${channel.id}`);
      return { success: false, error: 'Ошибка: не указан токен бота Telegram' };
    }

    if (!settings?.chatId) {
      console.error(`[Function Handler] Отсутствует ID чата для канала ${channel.id}`);
      return { success: false, error: 'Ошибка: не указан ID чата Telegram' };
    }

    try {
      // Форматируем данные в читаемый вид
      let messageText = '';
      
      if (typeof args === 'object' && args !== null) {
        for (const [key, value] of Object.entries(args)) {
          messageText += `📌 ${key}: ${value}\n`;
        }
      } else {
        messageText = String(args);
      }

      if (!messageText.trim()) {
        messageText = 'Нет данных';
      }

      const result = await this.telegramService.sendMessage(
        settings.botToken,
        settings.chatId,
        messageText
      );

      console.log(`[Function Handler] Сообщение успешно отправлено в Telegram`);
      return { success: true, data: 'Данные успешно отправлены в Telegram' };
    } catch (error) {
      console.error(`[Function Handler] Ошибка при отправке в Telegram:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      return { success: false, error: `Ошибка при отправке в Telegram: ${errorMessage}` };
    }
  }
  
  /**
   * Отправляет данные на Email
   */
  private async sendToEmail(
    channel: any, 
    func: OpenAiFunction, 
    args: Record<string, any>
  ): Promise<FunctionExecutionResult> {
    console.log(`[EMAIL SEND DEBUG] НАЧИНАЕМ ОТПРАВКУ НА EMAIL`);
    
    try {
      // Проверяем наличие настроек канала
      if (!channel.settings || typeof channel.settings !== 'object') {
        console.log(`❌ Для Email канала не указаны настройки`);
        return { success: false, error: 'Не указаны настройки для Email канала' };
      }
      
      // Проверяем наличие email получателя
      if (!('email' in channel.settings)) {
        console.log(`❌ Для Email канала не указан адрес получателя`);
        return { success: false, error: 'Не указан email для отправки' };
      }
      
      const toEmail = channel.settings.email as string;
      
      // Проверяем, что email выглядит валидно (простая проверка)
      if (!toEmail || !toEmail.includes('@')) {
        console.log(`❌ Некорректный формат email: ${toEmail}`);
        return { success: false, error: 'Некорректный формат email' };
      }
      
      try {
        // Форматируем данные в читаемый вид
        let messageText = '';
        
        if (Array.isArray(args)) {
          // Если данные пришли в виде массива, преобразуем их в строку
          messageText = args.map(item => {
            if (typeof item === 'string') {
              return item;
            } else if (typeof item === 'object') {
              return Object.entries(item)
                .map(([key, value]) => `📌 ${key}: ${value}`)
                .join('\n');
            }
            return String(item);
          }).join('\n');
        } else if (typeof args === 'object' && args !== null) {
          // Если данные пришли в виде объекта
          messageText = Object.entries(args)
            .map(([key, value]) => `📌 ${key}: ${value}`)
            .join('\n');
        } else {
          messageText = String(args);
        }

        if (!messageText.trim()) {
          messageText = 'Нет данных';
        }
        
        console.log(`[EMAIL] Подготовленный текст сообщения:`, messageText);
        
        // Отправляем форматированный текст как строку
        const result = await emailService.sendFunctionDataWithChannel(
          channel.settings,
          toEmail,
          func.name,
          messageText
        );
        
        if (result.success) {
          console.log(`[EMAIL] Данные функции успешно отправлены на email ${toEmail}, ID сообщения: ${result.messageId}`);
          return { 
            success: true, 
            data: `Данные успешно отправлены на email ${toEmail}` 
          };
        } else {
          console.error(`[EMAIL] Ошибка при отправке на email:`, result.error);
          return { 
            success: false, 
            error: result.error || 'Ошибка отправки email'
          };
        }
      } catch (error) {
        console.error(`[EMAIL] Ошибка при отправке на email:`, error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Ошибка отправки на email'
        };
      }
    } catch (error) {
      console.error(`[EMAIL] Ошибка при обработке данных функции для email:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Ошибка обработки данных функции'
      };
    }
  }
  
  /**
   * Анализирует сообщение от ассистента для выделения информации, 
   * которую нужно отправить по каналу уведомлений
   * @param assistantId ID ассистента
   * @param content Содержимое сообщения от ассистента
   */
  async extractDataFromMessage(assistantId: number, content: any[]): Promise<any> {
    try {
      if (!content || !Array.isArray(content)) {
        console.log('Пустой или неверный формат содержимого сообщения');
        return null;
      }
      
      // ВАЖНО: Проверяем, должны ли мы вообще обрабатывать сообщения этого ассистента
      console.log(`⚠️ Автоматическое извлечение данных отключено`);
      return null;
      
    } catch (error) {
      console.error(`Ошибка при извлечении данных из сообщения:`, error);
      return null;
    }
  }

  /**
   * Ищет и исполняет вызовы функций из ответа ассистента
   * @param assistantId ID ассистента
   * @param runObject Объект выполнения из OpenAI API, содержащий вызовы функций
   */
  async processFunctionCalls(assistantId: number, runObject: any): Promise<void> {
    try {
      if (!runObject) {
        console.log('Передан пустой объект исполнения (runObject)');
        return;
      }
      
      if (!runObject.tool_calls || !Array.isArray(runObject.tool_calls)) {
        console.log('Нет вызовов функций в ответе ассистента или формат некорректен');
        return;
      }
      
      console.log(`\n=== ОБРАБОТКА ВЫЗОВОВ ФУНКЦИЙ ===`);
      console.log(`Найдено ${runObject.tool_calls.length} вызовов функций`);
      
      // Лог полного объекта для анализа
      try {
        console.log(`Структура объекта с вызовами:\n${JSON.stringify(runObject, null, 2)}`);
      } catch (logError) {
        console.log(`Не удалось логировать полную структуру объекта: ${logError}`);
      }
      
      for (const toolCall of runObject.tool_calls) {
        try {
          if (!toolCall || typeof toolCall !== 'object') {
            console.log(`Пропускаем некорректный вызов:`, toolCall);
            continue;
          }
          
          if (toolCall.type !== 'function') {
            console.log(`Пропускаем вызов типа "${toolCall.type}" (поддерживается только "function")`);
            continue;
          }
          
          if (!toolCall.function || !toolCall.function.name) {
            console.log(`Пропускаем вызов без имени функции:`, toolCall);
            continue;
          }
          
          console.log(`\n=== ВЫЗОВ ФУНКЦИИ: ${toolCall.function.name} ===`);
          console.log(`ID вызова: ${toolCall.id}`);
          console.log(`Тип: ${toolCall.type}`);
          console.log(`Сырые аргументы: ${toolCall.function.arguments}`);
          
          let functionArgs;
          try {
            functionArgs = typeof toolCall.function.arguments === 'string' 
                          ? JSON.parse(toolCall.function.arguments)
                          : toolCall.function.arguments || {};
                          
            console.log(`Аргументы (parsed):\n${JSON.stringify(functionArgs, null, 2)}`);
          } catch (parseError) {
            console.error(`Ошибка при разборе аргументов функции: ${parseError}`);
            console.error(`Исходный текст аргументов: ${toolCall.function.arguments}`);
            functionArgs = {}; // Используем пустой объект в случае ошибки
          }
          
          const functionCall = {
            name: toolCall.function.name,
            arguments: functionArgs
          };
          
          // Создаем лог активности о вызове функции
          await this.storage.createActivityLog({
            userId: null,
            assistantId: assistantId,
            action: "function_called",
            details: {
              functionName: functionCall.name,
              arguments: functionArgs
            }
          }).catch((e: Error) => console.error("Ошибка при создании лога активности:", e));
          
          console.log(`\n=== ВЫПОЛНЕНИЕ ФУНКЦИИ ${functionCall.name} ===`);
          
          // Выполняем функцию
          const result = await this.handleFunctionCall(assistantId, functionCall);
          
          // Логируем результат
          console.log(`\n=== РЕЗУЛЬТАТ ВЫПОЛНЕНИЯ ФУНКЦИИ ${functionCall.name} ===`);
          if (result.success) {
            console.log(`Успех: ${result.success}`);
            
            if (result.data) {
              console.log(`Данные результата:\n${JSON.stringify(result.data, null, 2)}`);
            }
            
            if (result.message) {
              console.log(`Сообщение: ${result.message}`);
            }
          } else {
            console.error(`Ошибка при выполнении функции:`);
            console.error(`Сообщение об ошибке: ${result.error}`);
          }
          
          // Добавляем лог результата выполнения
          await this.storage.createActivityLog({
            userId: null,
            assistantId: assistantId,
            action: result.success ? "function_success" : "function_error",
            details: {
              functionName: functionCall.name,
              result: result
            }
          }).catch((e: Error) => console.error("Ошибка при создании лога результата:", e));
          
        } catch (toolCallError) {
          console.error(`\n=== ОШИБКА ОБРАБОТКИ ВЫЗОВА ФУНКЦИИ ===`);
          console.error(`Детали ошибки: ${toolCallError}`);
          
          // Логируем ошибку обработки
          await this.storage.createActivityLog({
            userId: null,
            assistantId: assistantId,
            action: "function_processing_error",
            details: {
              error: String(toolCallError)
            }
          }).catch((e: Error) => console.error("Ошибка при создании лога ошибки:", e));
          
          // Продолжаем с следующим вызовом
        }
      }
      
    } catch (error) {
      console.error(`\n=== КРИТИЧЕСКАЯ ОШИБКА ПРИ ОБРАБОТКЕ ВЫЗОВОВ ФУНКЦИЙ ===`);
      console.error(`Детали ошибки:`, error);
      
      // Логируем критическую ошибку
      await this.storage.createActivityLog({
        userId: null,
        assistantId: assistantId,
        action: "function_critical_error",
        details: {
          error: String(error)
        }
      }).catch((e: Error) => console.error("Ошибка при создании лога критической ошибки:", e));
    }
  }
  
  /**
   * Обрабатывает сообщение от ассистента, извлекая из него функциональные вызовы
   * @param message Сообщение от ассистента (API v2)
   * @param assistantId ID ассистента в базе данных
   */
  async processAssistantMessage(message: any, assistantId: number): Promise<void> {
    try {
      if (!message) {
        console.log('Пустое сообщение ассистента');
        return;
      }
      
      console.log(`\n=== ОБРАБОТКА СООБЩЕНИЯ ОТ АССИСТЕНТА [ID=${assistantId}] ===`);
      
      // Получаем информацию об ассистенте для логирования
      try {
        const assistant = await this.storage.getAssistant(assistantId);
        if (assistant) {
          console.log(`Ассистент: ${assistant.name} (${assistant.openaiAssistantId || 'нет OpenAI ID'})`);
        }
      } catch (assistantError) {
        console.error(`Ошибка при получении данных ассистента: ${assistantError}`);
      }
      
      // Логируем структуру сообщения для отладки с более подробной информацией
      try {
        // Сначала логируем базовую информацию
        console.log(`\n=== СТРУКТУРА ВХОДЯЩЕГО СООБЩЕНИЯ ===`);
        if (message.id) console.log(`ID сообщения: ${message.id}`);
        if (message.role) console.log(`Роль: ${message.role}`);
        if (message.created_at) console.log(`Создано: ${new Date(message.created_at * 1000).toISOString()}`);
        
        // Затем более подробно логируем содержимое и вызовы функций
        const preview = JSON.stringify(message, (key, value) => {
          if (typeof value === 'string' && value.length > 100) 
            return value.substring(0, 100) + '...';
          return value;
        }, 2).substring(0, 800);
        console.log(`Детали сообщения (частичные):\n${preview}`);
        
        // Специально проверяем наличие tool_calls
        if (message.tool_calls || 
            (message.run && message.run.tool_calls) || 
            (message.content && message.content.some((item: any) => item.tool_calls))) {
          console.log(`\n=== ОБНАРУЖЕНЫ ВЫЗОВЫ ФУНКЦИЙ В СООБЩЕНИИ ===`);
        }
      } catch (logError) {
        console.log(`Не удалось логировать структуру сообщения: ${logError}`);
      }
      
      // Проверяем разные варианты структуры сообщения
      
      // Вариант 1: Новый формат API OpenAI v2 с run.tool_calls
      if (message.run && message.run.tool_calls && message.run.tool_calls.length > 0) {
        console.log(`Обнаружены вызовы функций в сообщении (формат API v2): ${message.run.tool_calls.length}`);
        await this.processFunctionCalls(assistantId, message.run);
        return;
      } 
      
      // Вариант 2: Старый формат OpenAI v1 с tool_calls напрямую
      if (message.tool_calls && message.tool_calls.length > 0) {
        console.log(`Обнаружены вызовы функций в сообщении (формат API v1): ${message.tool_calls.length}`);
        await this.processFunctionCalls(assistantId, message);
        return;
      }
      
      // Вариант 3: Найти tool_calls внутри сложной структуры сообщения
      let toolCalls = null;
      try {
        // Рекурсивно ищем tool_calls в объекте
        const findToolCalls = (obj: any): any[] | null => {
          if (!obj || typeof obj !== 'object') return null;
          
          if (obj.tool_calls && Array.isArray(obj.tool_calls) && obj.tool_calls.length > 0) {
            return obj.tool_calls;
          }
          
          for (const key in obj) {
            if (typeof obj[key] === 'object') {
              const found = findToolCalls(obj[key]);
              if (found) return found;
            }
          }
          
          return null;
        };
        
        toolCalls = findToolCalls(message);
        
        if (toolCalls) {
          console.log(`Найдены вызовы функций в сложной структуре сообщения: ${toolCalls.length}`);
          const runData = { tool_calls: toolCalls };
          await this.processFunctionCalls(assistantId, runData);
          return;
        }
      } catch (searchError) {
        console.error(`Ошибка при поиске tool_calls в структуре сообщения:`, searchError);
      }
      
      // Вариант 4: Не извлекаем данные автоматически из сообщений, 
      // это приводит к ложным срабатываниям и нежелательной отправке
      if (message.content) {
        console.log(`Сообщение содержит контент, но не обрабатываем его для извлечения данных.`);
        console.log(`Данные будут отправлены в Telegram ТОЛЬКО при явном вызове функции.`);
        
        // Логируем формат сообщения для отладки
        if (Array.isArray(message.content)) {
          console.log(`Формат content: массив из ${message.content.length} элементов`);
        } else if (typeof message.content === 'string') {
          console.log(`Формат content: строка длиной ${message.content.length} символов`);
        } else if (typeof message.content === 'object') {
          console.log(`Формат content: объект с ключами: ${Object.keys(message.content).join(', ')}`);
        } else {
          console.log(`Формат content: ${typeof message.content}`);
        }
        
        // Логируем, что автоматическое извлечение отключено
        console.log(`⚠️ Автоматическое извлечение данных отключено. Данные будут отправлены только при явном вызове функции.`);
        return;
      }
      
      console.log(`Не найдены вызовы функций или содержимое в сообщении ассистента`);
        
    } catch (error) {
      console.error(`Ошибка при обработке сообщения ассистента:`, error);
      // Не выбрасываем ошибку дальше, так как это может привести к сбою основного кода
      // Просто логируем ошибку и продолжаем
    }
  }
}