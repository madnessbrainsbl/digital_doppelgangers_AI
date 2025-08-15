/**
 * Сервис для обновления инструментов и функций ассистента OpenAI
 */

import { IStorage } from '../storage';
import OpenAI from 'openai';

export class FunctionToolsUpdater {
  private storage: IStorage;
  private openai: OpenAI;
  
  constructor(storage: IStorage) {
    this.storage = storage;
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  
  /**
   * Удаляет функцию из ассистента OpenAI по имени функции
   * @param assistantId ID ассистента в нашей базе данных
   * @param functionName Имя функции, которую нужно удалить
   */
  async removeFunctionByName(assistantId: number, functionName: string): Promise<boolean> {
    try {
      console.log(`[DEBUG] Удаление функции "${functionName}" у ассистента ${assistantId}`);
      
      // 1. Получаем ассистента из базы данных
      const assistant = await this.storage.getAssistant(assistantId);
      if (!assistant || !assistant.openaiAssistantId) {
        console.error(`[DEBUG] Ассистент не найден или не имеет ID в OpenAI`);
        return false;
      }
      
      try {
        // 2. Получаем ассистента из OpenAI
        const currentAssistant = await this.openai.beta.assistants.retrieve(assistant.openaiAssistantId);
        console.log(`[DEBUG] Получен ассистент из OpenAI: ${currentAssistant.name}`);
        
        // Выводим список текущих инструментов и функций
        console.log('[DEBUG] Текущие инструменты ассистента:');
        currentAssistant.tools.forEach(tool => {
          if (tool.type === 'function' && tool.function) {
            console.log(`[DEBUG] - Функция: ${tool.function.name}`);
          } else {
            console.log(`[DEBUG] - Инструмент: ${tool.type}`);
          }
        });
        
        // 3. Фильтруем tools, исключая ненужную функцию по имени
        let formattedFunctionName = this.formatFunctionName(functionName);
        console.log(`[DEBUG] Имя функции для удаления (после форматирования): "${formattedFunctionName}"`);
        
        // Проверяем, есть ли функция с таким именем
        const functionExists = currentAssistant.tools.some(
          tool => tool.type === 'function' && 
                 tool.function && 
                 tool.function.name === formattedFunctionName
        );
        
        if (!functionExists) {
          console.log(`[DEBUG] Функция "${formattedFunctionName}" не найдена в списке, попробуем другое форматирование`);
          
          // Простое форматирование без всяких сложностей
          formattedFunctionName = functionName.toLowerCase();
          console.log(`[DEBUG] Пробуем искать по простому имени: "${formattedFunctionName}"`);
        }
        
        const updatedTools = currentAssistant.tools.filter(tool => {
          if (tool.type !== 'function') return true;
          if (!tool.function || !tool.function.name) return true;
          
          // Проверяем и с форматированным именем, и с исходным
          const nameMatches = 
            tool.function.name === formattedFunctionName || 
            tool.function.name === functionName;
          
          if (nameMatches) {
            console.log(`[DEBUG] Найдена функция "${tool.function.name}" для удаления`);
            return false;
          }
          return true;
        });
        
        console.log(`[DEBUG] Удаляем функцию "${formattedFunctionName}" из ассистента.`);
        console.log(`[DEBUG] Было ${currentAssistant.tools.length} инструментов, осталось ${updatedTools.length}`);
        
        // Если количество инструментов не изменилось, значит функция не была найдена
        if (currentAssistant.tools.length === updatedTools.length) {
          console.log(`[DEBUG] Предупреждение: количество инструментов не изменилось. Функция не найдена.`);
          
          // Пробуем посмотреть, есть ли похожие функции
          console.log(`[DEBUG] Поиск похожих функций:`);
          currentAssistant.tools.forEach(tool => {
            if (tool.type === 'function' && tool.function && tool.function.name) {
              if (tool.function.name.includes(formattedFunctionName) || 
                  formattedFunctionName.includes(tool.function.name)) {
                console.log(`[DEBUG] Похожая функция: ${tool.function.name}`);
              }
            }
          });
          
          // Несмотря на отсутствие изменений, всё равно обновляем ассистента
          console.log(`[DEBUG] Обновляем ассистента без изменений.`);
        }
        
        // 4. Обновляем ассистента без этой функции
        try {
          const updatedAssistant = await this.openai.beta.assistants.update(
            assistant.openaiAssistantId,
            { tools: updatedTools }
          );
          
          console.log(`[DEBUG] Ассистент успешно обновлен. Количество инструментов: ${updatedAssistant.tools.length}`);
          return true;
        } catch (updateError) {
          console.error(`[DEBUG] Ошибка при обновлении ассистента:`, updateError);
          return false;
        }
      } catch (error) {
        console.error(`[DEBUG] Ошибка при работе с API OpenAI:`, error);
        return false;
      }
    } catch (error) {
      console.error(`Ошибка при удалении функции из ассистента:`, error);
      return false;
    }
  }
  
  /**
   * Форматирует имя функции для требований OpenAI API
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
      'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
    };
    
    // Замена символов и транслитерация
    const transliterated = name
      .split('')
      .map(char => translitMap[char] || char)
      .join('');
    
    // Удаление недопустимых символов и приведение к snake_case
    const cleaned = transliterated
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
    
    // Обрезаем до 64 символов и удаляем начальные и конечные подчеркивания
    const withoutStartingUnderscore = cleaned.replace(/^_+/, '');
    const deduplicatedUnderscores = withoutStartingUnderscore.replace(/_+$/, '');
    
    return deduplicatedUnderscores.slice(0, 64) || 'unnamed_function';
  }
  
  /**
   * Обновляет функцию ассистента OpenAI - добавляет новую функцию при активации
   * Этот метод работает только с одной конкретной функцией, в отличие от syncAssistantFunctions,
   * который обновляет сразу все функции ассистента
   */
  async addSingleFunction(assistantId: number, functionId: number): Promise<{ success: boolean; added: boolean; functionName: string | null }> {
    try {
      console.log(`[DEBUG] Добавление одной функции ${functionId} к ассистенту ${assistantId}`);
      
      // Результат по умолчанию
      const result = {
        success: false,
        added: false,
        functionName: null as string | null
      };
      
      // 1. Получаем ассистента из базы данных
      const assistant = await this.storage.getAssistant(assistantId);
      if (!assistant || !assistant.openaiAssistantId) {
        console.error(`[DEBUG] Ассистент не найден или не имеет ID в OpenAI`);
        return result;
      }
      
      // 2. Получаем функцию, которую нужно добавить
      const func = await this.storage.getOpenAiFunction(functionId);
      if (!func) {
        console.error(`[DEBUG] Функция ${functionId} не найдена`);
        return result;
      }
      
      try {
        // 3. Получаем ассистента из OpenAI
        const currentAssistant = await this.openai.beta.assistants.retrieve(assistant.openaiAssistantId);
        console.log(`[DEBUG] Получен ассистент из OpenAI: ${currentAssistant.name}`);
        
        // 4. Форматируем имя функции для OpenAI API
        const formattedName = this.formatFunctionName(func.name);
        result.functionName = formattedName;
        
        // 5. Проверяем, есть ли уже такая функция
        const functionExists = currentAssistant.tools.some(
          tool => tool.type === 'function' && 
                 tool.function && 
                 tool.function.name === formattedName
        );
        
        if (functionExists) {
          console.log(`[DEBUG] Функция "${formattedName}" уже существует у ассистента`);
          result.success = true;
          return result;
        }
        
        // 6. Парсим параметры функции
        let parameters: any;
        try {
          parameters = typeof func.parameters === 'string' 
            ? JSON.parse(func.parameters) 
            : func.parameters;
        } catch (e) {
          console.log(`[DEBUG] Ошибка при разборе параметров функции ${func.name}:`, e);
          parameters = { type: "object", properties: {}, required: [] };
        }
        
        // 7. Создаем новый инструмент для функции
        const functionTool = {
          type: 'function' as const,
          function: {
            name: formattedName,
            description: func.description || func.name,
            parameters: parameters
          }
        };
        
        // 8. Собираем все инструменты (с правильным типом)
        const updatedTools = [
          ...currentAssistant.tools,
          functionTool
        ];
        
        console.log(`[DEBUG] Добавляем функцию "${formattedName}" к ассистенту. Всего инструментов: ${updatedTools.length}`);
        
        // 9. Обновляем ассистента в OpenAI
        const updatedAssistant = await this.openai.beta.assistants.update(
          assistant.openaiAssistantId,
          { tools: updatedTools }
        );
        
        console.log(`[DEBUG] Ассистент обновлен, количество инструментов: ${updatedAssistant.tools.length}`);
        result.success = true;
        result.added = true;
        
        return result;
      } catch (error) {
        console.error(`[DEBUG] Ошибка при обновлении ассистента:`, error);
        return result;
      }
    } catch (error) {
      console.error(`Ошибка при добавлении функции к ассистенту:`, error);
      return {
        success: false,
        added: false,
        functionName: null
      };
    }
  }
  
  /**
   * Синхронизирует список функций ассистента с OpenAI API
   * @param assistantOaiId ID ассистента в OpenAI API
   * @param assistantId ID ассистента в нашей базе данных
   * @param excludeFunctionIds Список ID функций, которые нужно исключить из синхронизации (недавно удаленные)
   * @param syncDirection Направление синхронизации: "none" - только проверить расхождения (по умолчанию),
   *                      "db_to_openai" - добавить отсутствующие в OpenAI функции из БД,
   *                      "openai_to_db" - удалить из БД функции, отсутствующие в OpenAI
   * @returns Результат синхронизации - список добавленных и удаленных функций
   */
  async syncAssistantFunctions(
    assistantOaiId: string, 
    assistantId: number, 
    excludeFunctionIds: number[] = [],
    syncDirection: 'none' | 'db_to_openai' | 'openai_to_db' = 'none'
  ): Promise<{added: string[], removed: string[]}> {
    try {
      console.log(`[SYNC] Синхронизация функций для ассистента ${assistantId} (OpenAI ID: ${assistantOaiId})`);
      console.log(`[SYNC] Режим синхронизации: ${syncDirection}`);
      
      // Получаем список активных функций ассистента в OpenAI
      const assistant = await this.openai.beta.assistants.retrieve(assistantOaiId);
      const activeTools = assistant.tools || [];
      
      // Фильтруем только инструменты типа "function"
      const activeFunctions = activeTools
        .filter(tool => tool.type === "function")
        .map(tool => (tool as any).function.name);
      
      console.log(`[SYNC] Активные функции в OpenAI: ${JSON.stringify(activeFunctions)}`);
      
      // Получаем список функций, подключенных к ассистенту в нашей базе данных
      const functionAssistants = await this.storage.listFunctionAssistantsByAssistant(assistantId);
      console.log(`[SYNC] Найдено ${functionAssistants.length} связей с функциями в БД`);
      
      // Отфильтровываем исключенные функции
      const filteredFunctionAssistants = functionAssistants.filter(fa => 
        !excludeFunctionIds.includes(fa.functionId)
      );
      
      if (excludeFunctionIds.length > 0) {
        console.log(`[SYNC] Исключено ${excludeFunctionIds.length} недавно удаленных функций: ${JSON.stringify(excludeFunctionIds)}`);
        console.log(`[SYNC] Осталось ${filteredFunctionAssistants.length} функций для синхронизации`);
      }
      
      // Собираем функции по ID
      const functionIds = filteredFunctionAssistants.map(fa => fa.functionId);
      const dbFunctions: any[] = [];
      
      // Загружаем каждую функцию по отдельности (поскольку нет метода для пакетной загрузки)
      for (const functionId of functionIds) {
        const func = await this.storage.getOpenAiFunction(functionId);
        if (func) {
          dbFunctions.push(func);
        }
      }
      
      // Функции, которые нужно добавить в OpenAI
      const functionsToAdd = dbFunctions.filter(func => {
        const transliterated = this.formatFunctionName(func.name);
        return !activeFunctions.includes(transliterated);
      });
      
      // Имена функций, которые нужно удалить из OpenAI
      const activeTransliteratedNames = activeFunctions;
      const dbFunctionNames = dbFunctions.map(func => this.formatFunctionName(func.name));
      const namesToRemove = activeTransliteratedNames.filter(name => !dbFunctionNames.includes(name));
      
      console.log(`[SYNC] Функции для добавления (${functionsToAdd.length}): ${JSON.stringify(functionsToAdd.map(f => f.name))}`);
      console.log(`[SYNC] Функции для удаления (${namesToRemove.length}): ${JSON.stringify(namesToRemove)}`);
      
      // Результаты операций
      const addedFunctions: string[] = [];
      const removedFunctions: string[] = [];
      
      // Проверка режима синхронизации
      if (syncDirection === 'none') {
        console.log('[SYNC] Режим "none" - только проверка расхождений, без изменений');
        return {
          added: [],
          removed: []
        };
      }
      
      // Удаляем лишние функции из OpenAI только если указан соответствующий режим
      if (syncDirection === 'openai_to_db') {
        for (const funcName of namesToRemove) {
          try {
            const deleted = await this.removeFunctionByName(assistantId, funcName);
            if (deleted) {
              removedFunctions.push(funcName);
            }
          } catch (err) {
            console.error(`[SYNC] Ошибка при удалении функции ${funcName}:`, err);
          }
        }
      }
      
      // Добавляем недостающие функции в OpenAI только если указан соответствующий режим
      if (syncDirection === 'db_to_openai') {
        for (const func of functionsToAdd) {
          try {
            const transliterated = this.formatFunctionName(func.name);
            // Пропускаем функции, которые недавно были удалены
            if (excludeFunctionIds.includes(func.id)) {
              console.log(`[SYNC] Пропускаем недавно удаленную функцию ${func.name} (ID: ${func.id})`);
              continue;
            }
            
            // Добавляем функцию в OpenAI
            const added = await this.addFunctionToAssistant(assistantOaiId, func);
            if (added) {
              addedFunctions.push(transliterated);
            }
          } catch (err) {
            console.error(`[SYNC] Ошибка при добавлении функции ${func.name}:`, err);
          }
        }
      }
      
      console.log(`[SYNC] Результат синхронизации для ассистента ${assistantId}: добавлено=${addedFunctions.length}, удалено=${removedFunctions.length}`);
      
      return {
        added: addedFunctions,
        removed: removedFunctions
      };
    } catch (err) {
      console.error(`[SYNC] Ошибка при синхронизации функций ассистента:`, err);
      return { added: [], removed: [] };
    }
  }

  /**
   * Добавляет функцию к ассистенту в OpenAI API
   * @param assistantOaiId ID ассистента в OpenAI API
   * @param func Объект функции для добавления
   * @returns true если функция успешно добавлена, false в противном случае
   */
  async addFunctionToAssistant(assistantOaiId: string, func: any): Promise<boolean> {
    try {
      console.log(`[ADD-FUNCTION] Добавление функции ${func.name} к ассистенту ${assistantOaiId}`);
      
      // Получаем текущие инструменты ассистента
      const assistant = await this.openai.beta.assistants.retrieve(assistantOaiId);
      const currentTools = assistant.tools || [];
      
      // Форматируем имя функции
      const formattedName = this.formatFunctionName(func.name);
      
      // Проверяем, есть ли уже такая функция
      const existingFunction = currentTools.find(tool => 
        tool.type === 'function' && 
        (tool as any).function.name === formattedName
      );
      
      if (existingFunction) {
        console.log(`[ADD-FUNCTION] Функция ${formattedName} уже присутствует у ассистента`);
        return false;
      }
      
      // Парсим параметры
      let parameters: any;
      try {
        parameters = typeof func.parameters === 'string' 
          ? JSON.parse(func.parameters) 
          : func.parameters;
      } catch (e) {
        console.log(`[ADD-FUNCTION] Ошибка при разборе параметров функции ${func.name}:`, e);
        parameters = { type: "object", properties: {}, required: [] };
      }
      
      // Создаем новый инструмент
      const functionTool = {
        type: 'function' as const,
        function: {
          name: formattedName,
          description: func.description || func.name,
          parameters: parameters
        }
      };
      
      // Добавляем новый инструмент к текущим
      const updatedTools = [...currentTools, functionTool];
      
      // Обновляем ассистента
      await this.openai.beta.assistants.update(
        assistantOaiId,
        { tools: updatedTools }
      );
      
      console.log(`[ADD-FUNCTION] Функция ${formattedName} успешно добавлена к ассистенту`);
      return true;
    } catch (error) {
      console.error(`[ADD-FUNCTION] Ошибка при добавлении функции:`, error);
      return false;
    }
  }
}