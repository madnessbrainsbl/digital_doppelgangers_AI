import { TelegramExport, TelegramMessage, ProcessedMessage, UserProfile } from '../types/telegram';

export function parseTelegramJSON(jsonContent: string): TelegramExport[] {
  try {
    const data = JSON.parse(jsonContent);
    
    // Handle both single chat and multiple chats
    if (Array.isArray(data)) {
      // Validate that array contains valid chat exports
      if (data.length === 0) {
        throw new Error('JSON файл содержит пустой массив чатов');
      }
      
      // Check if array items have required structure
      for (let i = 0; i < data.length; i++) {
        if (!data[i] || typeof data[i] !== 'object' || !data[i].messages) {
          throw new Error(`Элемент массива ${i + 1} не содержит поле 'messages' или имеет неверную структуру`);
        }
      }
      
      return data;
    } else if (data && typeof data === 'object') {
      // Check for chats.list structure (full Telegram export with user info)
      if (data.chats && data.chats.list && Array.isArray(data.chats.list)) {
        // Validate that chats.list contains valid chat exports
        if (data.chats.list.length === 0) {
          throw new Error('JSON файл содержит пустой массив чатов в chats.list');
        }
        
        // Check if chats.list items have required structure
        for (let i = 0; i < data.chats.list.length; i++) {
          if (!data.chats.list[i] || typeof data.chats.list[i] !== 'object' || !data.chats.list[i].messages) {
            throw new Error(`Элемент chats.list[${i}] не содержит поле 'messages' или имеет неверную структуру`);
          }
        }
        
        // Если есть информация о пользователе, добавляем её к каждому чату
        const chats = data.chats.list;
        if (data.user && data.user.first_name) {
          chats.forEach((chat: any) => {
            chat.user = data.user;
          });
        }
        
        return chats;
      } else if (data.messages) {
        // Single chat export
        if (!Array.isArray(data.messages)) {
          throw new Error('Поле "messages" должно быть массивом');
        }
        
        // Если есть информация о пользователе, добавляем её
        const chatExport: any = {
          name: data.name || 'Chat',
          type: data.type || 'personal_chat',
          id: data.id || 0,
          messages: data.messages
        };
        
        if (data.user && data.user.first_name) {
          chatExport.user = data.user;
        }
        
        return [chatExport];
      } else {
        // More specific error for structure issues
        throw new Error('JSON файл не содержит поле "messages" или структуру "chats.list". Убедитесь, что это экспорт чата из Telegram');
      }
    } else {
      // More specific error for structure issues
      if (!data) {
        throw new Error('JSON файл содержит пустые данные');
      } else {
        throw new Error('JSON файл должен содержать объект или массив объектов');
      }
    }
  } catch (error) {
    // Differentiate between JSON syntax errors and structure errors
    if (error instanceof SyntaxError) {
      throw new Error('Файл содержит некорректный JSON. Проверьте синтаксис файла.');
    } else if (error instanceof Error && (error.message.includes('messages') || error.message.includes('массив') || error.message.includes('объект') || error.message.includes('chats.list'))) {
      // Re-throw our custom structure errors
      throw error;
    } else {
      throw new Error('Не удалось разобрать JSON файл. Проверьте корректность формата.');
    }
  }
}

export function extractUserMessages(exports: TelegramExport[], userName?: string): ProcessedMessage[] {
  const messages: ProcessedMessage[] = [];
  
  // Сначала определяем ID пользователя по структуре
  let userFromId: string | null = null;
  const fromIdCounts: { [key: string]: number } = {};
  
  // Ищем ID пользователя в сообщениях и считаем их количество
  for (const chatExport of exports) {
    for (const message of chatExport.messages) {
      if (message.from_id && message.from_id.startsWith('user')) {
        fromIdCounts[message.from_id] = (fromIdCounts[message.from_id] || 0) + 1;
      }
    }
  }
  
  // Выбираем самый часто встречающийся user ID
  if (Object.keys(fromIdCounts).length > 0) {
    userFromId = Object.entries(fromIdCounts)
      .sort(([, a], [, b]) => b - a)[0][0];
  }
  
  exports.forEach(chatExport => {
    chatExport.messages.forEach(message => {
      if (determineIfUserMessage(message, chatExport, userFromId)) {
        messages.push({
          text: extractMessageText(message),
          isUser: true,
          timestamp: new Date(message.date),
          chatName: chatExport.name
        });
      }
    });
  });
  
  return messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

export function extractUserName(exports: TelegramExport[]): string {
  // Ищем имя пользователя по from_id в сообщениях
  const userNames: { [key: string]: number } = {};
  const fromIdCounts: { [key: string]: number } = {};
  let userFromId: string | null = null;
  
  // Сначала определяем самый часто встречающийся user ID
  for (const chatExport of exports) {
    for (const message of chatExport.messages) {
      if (message.from_id && message.from_id.startsWith('user')) {
        fromIdCounts[message.from_id] = (fromIdCounts[message.from_id] || 0) + 1;
      }
    }
  }
  
  // Выбираем самый часто встречающийся user ID
  if (Object.keys(fromIdCounts).length > 0) {
    userFromId = Object.entries(fromIdCounts)
      .sort(([, a], [, b]) => b - a)[0][0];
  }
  
  // Теперь ищем имя для этого user ID
  for (const chatExport of exports) {
    for (const message of chatExport.messages) {
      if (message.from_id === userFromId && message.from && message.from.trim()) {
        const name = message.from.trim();
        const cleanName = name
          .replace(/[^\w\sа-яА-ЯёЁ]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (cleanName && cleanName.length > 1 && cleanName.length < 50) {
          userNames[cleanName] = (userNames[cleanName] || 0) + 1;
        }
      }
    }
  }
  
  // Возвращаем самое частое имя для найденного user ID
  if (Object.keys(userNames).length > 0) {
    const mostFrequentName = Object.entries(userNames)
      .sort(([, a], [, b]) => b - a)[0][0];
    return mostFrequentName;
  }
  
  // Если не нашли по from_id, ищем в структуре JSON - переменная "first_name"
  for (const chatExport of exports) {
    // Проверяем, есть ли в экспорте информация о пользователе
    if (chatExport.user && chatExport.user.first_name) {
      const firstName = chatExport.user.first_name.trim();
      if (firstName && firstName.length > 1 && firstName.length < 50) {
        return firstName;
      }
    }
    
    // Проверяем в сообщениях на наличие информации о пользователе
    for (const message of chatExport.messages) {
      if (message.user && message.user.first_name) {
        const firstName = message.user.first_name.trim();
        if (firstName && firstName.length > 1 && firstName.length < 50) {
          return firstName;
        }
      }
    }
  }
  
  // Ищем в корневой структуре JSON (если есть)
  if (exports.length > 0 && (exports[0] as any).user && (exports[0] as any).user.first_name) {
    const firstName = (exports[0] as any).user.first_name.trim();
    if (firstName && firstName.length > 1 && firstName.length < 50) {
      return firstName;
    }
  }
  
  // Если не нашли first_name, ищем в личных чатах (где пользователь общается сам с собой)
  for (const chatExport of exports) {
    if (chatExport.type === 'personal_chat' || chatExport.name.toLowerCase().includes('saved messages')) {
      for (const message of chatExport.messages) {
        if (message.from && message.from.trim()) {
          const name = message.from.trim();
          // Убираем лишние символы и слова
          const cleanName = name
            .replace(/[^\w\sа-яА-ЯёЁ]/g, '') // Убираем спецсимволы
            .replace(/\s+/g, ' ') // Убираем лишние пробелы
            .trim();
          
          if (cleanName && cleanName.length > 1 && cleanName.length < 50) {
            return cleanName;
          }
        }
      }
    }
  }
  
  // Ищем в групповых чатах - берем самое частое имя
  const nameCounts: { [key: string]: number } = {};
  
  for (const chatExport of exports) {
    for (const message of chatExport.messages) {
      if (message.from && message.from.trim()) {
        const name = message.from.trim();
        const cleanName = name
          .replace(/[^\w\sа-яА-ЯёЁ]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (cleanName && cleanName.length > 1 && cleanName.length < 50) {
          nameCounts[cleanName] = (nameCounts[cleanName] || 0) + 1;
        }
      }
    }
  }
  
  // Возвращаем самое частое имя
  if (Object.keys(nameCounts).length > 0) {
    const mostFrequentName = Object.entries(nameCounts)
      .sort(([, a], [, b]) => b - a)[0][0];
    return mostFrequentName;
  }
  
  // Если не нашли в сообщениях, ищем в названии чата
  for (const chatExport of exports) {
    if (chatExport.name && chatExport.name.trim()) {
      // Убираем лишние символы и слова
      const cleanName = chatExport.name
        .replace(/[^\w\sа-яА-ЯёЁ]/g, '') // Убираем спецсимволы
        .replace(/\s+/g, ' ') // Убираем лишние пробелы
        .trim();
      
      if (cleanName && cleanName.length > 1 && cleanName.length < 50) {
        return cleanName;
      }
    }
  }
  
  return '';
}

function extractMessageText(message: TelegramMessage): string {
  if (typeof message.text === 'string') {
    return message.text;
  } else if (Array.isArray(message.text)) {
    return message.text
      .filter(item => item.type === 'plain')
      .map(item => item.text)
      .join('');
  }
  return '';
}

function determineIfUserMessage(message: TelegramMessage, chatExport: TelegramExport, userFromId: string | null): boolean {
  // Если у нас есть userFromId, используем его для определения
  if (userFromId && message.from_id) {
    return message.from_id === userFromId;
  }
  
  // Если нет userFromId, используем старую логику
  // Если есть поле 'from' и оно не пустое - это сообщение от контакта
  if (message.from && message.from.trim() !== '') {
    return false;
  }
  
  // Если есть 'from_id' и это не 'user' - это сообщение от контакта
  if (message.from_id && message.from_id !== 'user') {
    return false;
  }
  
  // Если имя чата совпадает с отправителем - это сообщение пользователя
  if (message.from === chatExport.name) {
    return true;
  }
  
  // По умолчанию считаем сообщение пользователя, если нет явных признаков контакта
  return true;
}

export function analyzeUserProfile(userMessages: ProcessedMessage[]): UserProfile {
  const texts = userMessages.map(m => m.text);
  const totalMessages = userMessages.length;
  
  // Базовый анализ
  const averageMessageLength = texts.reduce((sum, text) => sum + text.length, 0) / totalMessages;
  const commonPhrases = extractCommonPhrases(texts);
  const communicationStyle = analyzeCommunicationStyle(texts);
  const emojiUsage = analyzeEmojiUsage(texts);
  const punctuationPatterns = analyzePunctuation(texts);
  const vocabularyComplexity = analyzeVocabularyComplexity(texts);
  const responseSpeed = analyzeResponseSpeed(userMessages);
  const formalityLevel = analyzeFormalityLevel(texts);
  const responsePatterns = extractResponsePatterns(userMessages);
  
  // Extract interests - улучшенный анализ
  const interests = extractInterests(texts);
  
  // Extract role - новый анализ
  const role = extractRole(texts);
  
  // Собираем примеры сообщений для анализа
  const sampleMessages = texts
    .filter(text => text.length > 10 && text.length < 200) // Исключаем слишком короткие и длинные
    .slice(0, 20); // Берем первые 20 сообщений как примеры
  
  // Новый анализ эмоций и личности
  const emotionalPatterns = analyzeEmotionalPatterns(texts);
  const personalityTraits = analyzePersonalityTraits(texts);
  const conversationContext = analyzeConversationContext(texts);
  const timePatterns = analyzeTimePatterns(userMessages);
  const socialBehavior = analyzeSocialBehavior(texts);
  
  return {
    totalMessages,
    averageMessageLength,
    commonPhrases,
    communicationStyle,
    responsePatterns,
    interests,
    role,
    sampleMessages,
    emojiUsage,
    punctuationPatterns,
    vocabularyComplexity,
    responseSpeed,
    formalityLevel,
    emotionalPatterns,
    personalityTraits,
    conversationContext,
    timePatterns,
    socialBehavior
  };
}

function analyzeEmojiUsage(texts: string[]): string[] {
  const emojiPatterns: { [key: string]: number } = {};
  const allText = texts.join(' ');
  
  // Находим все эмодзи
  const emojiMatches = allText.match(/[😀-🙏]/gu) || [];
  
  emojiMatches.forEach(emoji => {
    emojiPatterns[emoji] = (emojiPatterns[emoji] || 0) + 1;
  });
  
  // Возвращаем топ-5 самых используемых эмодзи
  return Object.entries(emojiPatterns)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([emoji]) => emoji);
}

function analyzePunctuation(texts: string[]): string[] {
  const patterns: string[] = [];
  const allText = texts.join(' ');
  
  // Анализируем использование восклицательных знаков
  const exclamationCount = (allText.match(/!/g) || []).length;
  if (exclamationCount > texts.length * 0.2) {
    patterns.push('часто использует восклицательные знаки');
  }
  
  // Анализируем использование вопросительных знаков
  const questionCount = (allText.match(/\?/g) || []).length;
  if (questionCount > texts.length * 0.15) {
    patterns.push('часто задает вопросы');
  }
  
  // Анализируем использование многоточия
  const ellipsisCount = (allText.match(/\.{3,}/g) || []).length;
  if (ellipsisCount > texts.length * 0.1) {
    patterns.push('использует многоточие для выражения эмоций');
  }
  
  // Анализируем использование заглавных букв
  const capsCount = (allText.match(/[А-ЯЁ]{3,}/g) || []).length;
  if (capsCount > texts.length * 0.1) {
    patterns.push('иногда пишет заглавными буквами для выделения');
  }
  
  return patterns;
}

function analyzeVocabularyComplexity(texts: string[]): string {
  const allText = texts.join(' ').toLowerCase();
  const words = allText.split(/\s+/).filter(word => word.length > 3);
  
  // Простой анализ сложности на основе длины слов
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  
  if (avgWordLength > 8) {
    return 'высокий';
  } else if (avgWordLength > 6) {
    return 'средний';
  } else {
    return 'простой';
  }
}

function analyzeResponseSpeed(messages: ProcessedMessage[]): string {
  if (messages.length < 2) return 'нормальный';
  
  const userMessages = messages.filter(m => m.isUser);
  let totalTimeDiff = 0;
  let count = 0;
  
  for (let i = 1; i < userMessages.length; i++) {
    const timeDiff = userMessages[i].timestamp.getTime() - userMessages[i-1].timestamp.getTime();
    if (timeDiff > 0 && timeDiff < 24 * 60 * 60 * 1000) { // Исключаем большие промежутки
      totalTimeDiff += timeDiff;
      count++;
    }
  }
  
  if (count === 0) return 'нормальный';
  
  const avgResponseTime = totalTimeDiff / count;
  
  if (avgResponseTime < 5 * 60 * 1000) { // Меньше 5 минут
    return 'быстрый';
  } else if (avgResponseTime > 30 * 60 * 1000) { // Больше 30 минут
    return 'медленный';
  } else {
    return 'нормальный';
  }
}

function analyzeFormalityLevel(texts: string[]): string {
  const allText = texts.join(' ').toLowerCase();
  
  // Признаки формальности
  const formalWords = ['уважаемый', 'позвольте', 'разрешите', 'благодарю', 'спасибо', 'пожалуйста'];
  const informalWords = ['привет', 'пока', 'увидимся', 'до встречи', 'хорошо', 'ок'];
  
  const formalCount = formalWords.reduce((count, word) => 
    count + (allText.match(new RegExp(word, 'g')) || []).length, 0);
  const informalCount = informalWords.reduce((count, word) => 
    count + (allText.match(new RegExp(word, 'g')) || []).length, 0);
  
  if (formalCount > informalCount * 2) {
    return 'формальный';
  } else if (informalCount > formalCount * 2) {
    return 'неформальный';
  } else {
    return 'смешанный';
  }
}

function analyzeCommunicationStyle(texts: string[]): string {
  const allText = texts.join(' ').toLowerCase();
  
  // Count various indicators
  const emojiCount = (allText.match(/[😀-🙏]/gu) || []).length;
  const exclamationCount = (allText.match(/!/g) || []).length;
  const questionCount = (allText.match(/\?/g) || []).length;
  const shortMessages = texts.filter(t => t.length < 20).length;
  const longMessages = texts.filter(t => t.length > 100).length;
  
  const totalChars = allText.length;
  const emojiRatio = emojiCount / totalChars;
  const exclamationRatio = exclamationCount / texts.length;
  const shortMessageRatio = shortMessages / texts.length;
  const longMessageRatio = longMessages / texts.length;
  const questionRatio = questionCount / texts.length;
  
  // Улучшенная логика определения стиля
  if (emojiRatio > 0.008 && exclamationRatio > 0.25) {
    return 'энергичный и эмоциональный';
  } else if (shortMessageRatio > 0.5) {
    return 'краткий и лаконичный';
  } else if (questionRatio > 0.15) {
    return 'любознательный и вовлеченный';
  } else if (longMessageRatio > 0.3) {
    return 'вдумчивый и обстоятельный';
  } else {
    return 'сбалансированный и естественный';
  }
}

function extractResponsePatterns(messages: ProcessedMessage[]): string[] {
  const patterns: string[] = [];
  
  // Analyze how user typically starts messages
  const starters = messages
    .filter(m => m.isUser)
    .map(m => m.text.split(' ').slice(0, 3).join(' ').toLowerCase())
    .filter(starter => starter.length > 3);
  
  const starterCounts: { [key: string]: number } = {};
  starters.forEach(starter => {
    starterCounts[starter] = (starterCounts[starter] || 0) + 1;
  });
  
  Object.entries(starterCounts)
    .filter(([_, count]) => count >= 2)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .forEach(([starter]) => patterns.push(`Часто начинает сообщения с: "${starter}"`));
  
  // Анализируем окончания сообщений
  const endings = messages
    .filter(m => m.isUser)
    .map(m => m.text.split(' ').slice(-3).join(' ').toLowerCase())
    .filter(ending => ending.length > 3);
  
  const endingCounts: { [key: string]: number } = {};
  endings.forEach(ending => {
    endingCounts[ending] = (endingCounts[ending] || 0) + 1;
  });
  
  Object.entries(endingCounts)
    .filter(([_, count]) => count >= 2)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .forEach(([ending]) => patterns.push(`Часто заканчивает сообщения: "${ending}"`));
  
  return patterns;
}

function extractInterests(texts: string[]): string[] {
  const allText = texts.join(' ').toLowerCase();
  
  // Расширенный список ключевых слов для интересов
  const interestKeywords: { [key: string]: string[] } = {
    'технологии': ['программирование', 'код', 'разработка', 'ai', 'ии', 'технология', 'компьютер', 'интернет', 'приложение', 'сайт', 'база данных', 'алгоритм', 'функция', 'класс', 'объект', 'метод', 'переменная', 'массив', 'цикл', 'условие', 'api', 'фреймворк', 'библиотека', 'git', 'github', 'deploy', 'сервер', 'клиент', 'frontend', 'backend', 'fullstack'],
    'спорт': ['футбол', 'баскетбол', 'спорт', 'тренировка', 'фитнес', 'бег', 'плавание', 'теннис', 'волейбол', 'хоккей', 'бокс', 'mma', 'йога', 'пилатес', 'кроссфит', 'марафон', 'полумарафон', 'велосипед', 'лыжи', 'сноуборд', 'серфинг', 'скалолазание', 'турник', 'брусья', 'жим', 'приседания', 'становая тяга'],
    'музыка': ['музыка', 'песня', 'концерт', 'группа', 'альбом', 'трек', 'плейлист', 'гитара', 'пианино', 'скрипка', 'барабаны', 'вокал', 'микрофон', 'студия', 'запись', 'микс', 'мастеринг', 'бит', 'мелодия', 'ритм', 'гармония', 'аккорд', 'нота', 'такт', 'темп', 'динамика', 'тембр'],
    'фильмы': ['фильм', 'кино', 'сериал', 'актер', 'режиссер', 'сценарий', 'съемки', 'премьера', 'трейлер', 'обзор', 'рейтинг', 'жанр', 'драма', 'комедия', 'боевик', 'триллер', 'ужасы', 'фантастика', 'документальный', 'анимация', 'студія', 'постпродакшн', 'спецэффекты', 'саундтрек'],
    'путешествия': ['путешествие', 'поездка', 'отпуск', 'страна', 'город', 'отель', 'билет', 'виза', 'паспорт', 'чемодан', 'рюкзак', 'карта', 'навигатор', 'экскурсия', 'гид', 'музей', 'достопримечательность', 'пляж', 'гора', 'лес', 'море', 'океан', 'река', 'озеро', 'водопад', 'замок', 'храм', 'площадь', 'улица'],
    'еда': ['еда', 'ресторан', 'готовить', 'рецепт', 'кухня', 'блюдо', 'ингредиент', 'специя', 'соус', 'суп', 'салат', 'мясо', 'рыба', 'овощи', 'фрукты', 'десерт', 'торт', 'пирог', 'хлеб', 'сыр', 'молоко', 'яйца', 'масло', 'мука', 'сахар', 'соль', 'перец', 'чеснок', 'лук', 'морковь', 'картошка'],
    'работа': ['работа', 'проект', 'офис', 'коллега', 'босс', 'встреча', 'дедлайн', 'задача', 'отчет', 'презентация', 'клиент', 'заказ', 'договор', 'счет', 'инвойс', 'планирование', 'стратегия', 'анализ', 'исследование', 'разработка', 'тестирование', 'внедрение', 'поддержка', 'обучение', 'тренинг', 'конференция', 'выставка'],
    'образование': ['учеба', 'университет', 'колледж', 'школа', 'курс', 'лекция', 'семинар', 'практика', 'экзамен', 'зачет', 'диплом', 'диссертация', 'исследование', 'наука', 'лаборатория', 'эксперимент', 'теория', 'практика', 'методология', 'анализ', 'синтез', 'гипотеза', 'вывод', 'заключение'],
    'игры': ['игра', 'гейм', 'консоль', 'приставка', 'компьютерная игра', 'мобильная игра', 'онлайн игра', 'мультиплеер', 'синглплеер', 'ролевая игра', 'стратегия', 'шутер', 'гонки', 'симулятор', 'головоломка', 'платформер', 'квест', 'адвенчура', 'rpg', 'fps', 'rts', 'mmo', 'моба', 'карточная игра'],
    'книги': ['книга', 'роман', 'повесть', 'рассказ', 'поэма', 'стихотворение', 'автор', 'писатель', 'поэт', 'издательство', 'тираж', 'переплет', 'обложка', 'страница', 'глава', 'часть', 'том', 'серия', 'жанр', 'фантастика', 'детектив', 'любовный роман', 'исторический роман', 'биография', 'мемуары'],
    'автомобили': ['машина', 'автомобиль', 'авто', 'двигатель', 'трансмиссия', 'подвеска', 'тормоза', 'колеса', 'шины', 'бензин', 'дизель', 'электро', 'гибрид', 'тюнинг', 'модификация', 'сервис', 'гараж', 'парковка', 'дорога', 'шоссе', 'автобан', 'пробка', 'навигатор', 'gps'],
    'мода': ['мода', 'стиль', 'одежда', 'обувь', 'аксессуар', 'сумка', 'кошелек', 'часы', 'украшение', 'кольцо', 'серьги', 'цепочка', 'браслет', 'платье', 'брюки', 'рубашка', 'футболка', 'кофта', 'куртка', 'пальто', 'шарф', 'шапка', 'перчатки', 'галстук', 'бабочка', 'пояс', 'ремень']
  };
  
  const interests: string[] = [];
  
  Object.entries(interestKeywords).forEach(([interest, keywords]) => {
    const matchCount = keywords.reduce((count, keyword) => {
      return count + (allText.match(new RegExp(keyword, 'g')) || []).length;
    }, 0);
    
    if (matchCount >= 2) { // Снижаем порог для лучшего обнаружения
      interests.push(interest);
    }
  });
  
  return interests;
}

function extractRole(texts: string[]): string {
  // Ключевые слова для определения роли
  const roleKeywords: { [key: string]: string[] } = {
    'Разработчик': ['код', 'программирование', 'разработка', 'git', 'github', 'функция', 'алгоритм', 'баг', 'pull request', 'commit', 'deploy', 'сервер', 'frontend', 'backend', 'typescript', 'javascript', 'python', 'java', 'c#', 'react', 'node', 'api', 'библиотека', 'фреймворк'],
    'Менеджер': ['проект', 'команда', 'сроки', 'дедлайн', 'план', 'отчет', 'встреча', 'бриф', 'стратегия', 'задача', 'контроль', 'руководство', 'менеджмент', 'организация', 'координация', 'планирование'],
    'Дизайнер': ['дизайн', 'макет', 'фигма', 'photoshop', 'иллюстратор', 'цвет', 'шрифт', 'логотип', 'визуал', 'ui', 'ux', 'интерфейс', 'прототип', 'графика', 'рисунок', 'иллюстрация'],
    'Маркетолог': ['маркетинг', 'реклама', 'бренд', 'аудитория', 'таргет', 'аналитика', 'продвижение', 'контент', 'стратегия', 'seo', 'smm', 'рекламная кампания', 'охват', 'лид', 'конверсия'],
    'Бизнес': ['бизнес', 'клиент', 'договор', 'сделка', 'партнер', 'выручка', 'прибыль', 'инвестиции', 'стартап', 'рынок', 'продажи', 'финансы', 'бюджет', 'отчетность', 'коммерция'],
    'Учитель': ['урок', 'школа', 'ученик', 'класс', 'задание', 'оценка', 'контрольная', 'тест', 'образование', 'преподавание', 'лекция', 'семинар', 'обучение', 'педагог', 'учебник'],
    'Студент': ['университет', 'студент', 'группа', 'пара', 'зачет', 'экзамен', 'лекция', 'семинар', 'курс', 'дисциплина', 'преподаватель', 'сессия', 'стипендия', 'кампус'],
    'Фрилансер': ['фриланс', 'заказ', 'клиент', 'оплата', 'дедлайн', 'биржа', 'портфолио', 'работа', 'удаленно', 'проект', 'задача', 'смета', 'бриф'],
    'Консультант': ['консультация', 'совет', 'эксперт', 'решение', 'вопрос', 'анализ', 'оценка', 'рекомендация', 'стратегия', 'помощь', 'поддержка'],
    'Аналитик': ['анализ', 'отчет', 'данные', 'метрика', 'статистика', 'исследование', 'график', 'таблица', 'вывод', 'инсайт', 'прогноз', 'оценка'],
    'Продавец': ['продажа', 'товар', 'клиент', 'заказ', 'доставка', 'оплата', 'скидка', 'ассортимент', 'магазин', 'витрина', 'консультация', 'касса'],
    'Эксперт': ['эксперт', 'опыт', 'знание', 'консультация', 'совет', 'рекомендация', 'оценка', 'анализ', 'отзыв', 'мнение'],
    'Руководитель': ['руководство', 'команда', 'организация', 'план', 'стратегия', 'контроль', 'отчет', 'планирование', 'менеджмент', 'управление'],
    'Специалист': ['специалист', 'область', 'навык', 'знание', 'компетенция', 'опыт', 'работа', 'задача', 'проект'],
    'Другое': []
  };
  const allText = texts.join(' ').toLowerCase();
  let bestRole = 'Другое';
  let maxCount = 0;
  Object.entries(roleKeywords).forEach(([role, keywords]) => {
    if (role === 'Другое') return;
    const count = keywords.reduce((sum, keyword) => sum + (allText.match(new RegExp(keyword, 'g')) || []).length, 0);
    if (count > maxCount) {
      maxCount = count;
      bestRole = role;
    }
  });
  return bestRole;
}

function extractCommonPhrases(texts: string[]): string[] {
  const phrases: { [key: string]: number } = {};
  texts.forEach(text => {
    const words = text.toLowerCase().replace(/[^ -а-яА-ЯёЁa-zA-Z0-9\s]/g, ' ').split(/\s+/).filter(word => word.length > 2);
    for (let i = 0; i < words.length - 1; i++) {
      for (let len = 2; len <= Math.min(4, words.length - i); len++) {
        const phrase = words.slice(i, i + len).join(' ');
        if (phrase.length > 8 && phrase.split(' ').length >= 2) {
          phrases[phrase] = (phrases[phrase] || 0) + 1;
        }
      }
    }
  });
  return Object.entries(phrases)
    .filter(([_, count]) => count >= 2)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .map(([phrase]) => phrase);
}

function analyzeEmotionalPatterns(texts: string[]): {
  positiveEmotions: string[];
  negativeEmotions: string[];
  humorStyle: string;
  empathyLevel: string;
  stressResponses: string[];
} {
  const allText = texts.join(' ').toLowerCase();
  
  // Анализ позитивных эмоций
  const positiveEmotions: string[] = [];
  const positiveKeywords = {
    'радость': ['рад', 'счастлив', 'доволен', 'отлично', 'супер', 'круто', 'класс'],
    'энтузиазм': ['восторг', 'ура', 'победа', 'успех', 'достижение'],
    'благодарность': ['спасибо', 'благодарю', 'спс', 'thanks', 'thank you'],
    'любовь': ['люблю', 'нравится', 'обожаю', 'симпатия', 'сердце']
  };
  
  Object.entries(positiveKeywords).forEach(([emotion, keywords]) => {
    if (keywords.some(keyword => allText.includes(keyword))) {
      positiveEmotions.push(emotion);
    }
  });
  
  // Анализ негативных эмоций
  const negativeEmotions: string[] = [];
  const negativeKeywords = {
    'грусть': ['грустно', 'печально', 'тоска', 'уныние'],
    'злость': ['злой', 'раздражен', 'бесит', 'надоело', 'устал'],
    'тревога': ['волнуюсь', 'беспокоюсь', 'страшно', 'боюсь'],
    'разочарование': ['разочарован', 'недоволен', 'плохо', 'ужасно']
  };
  
  Object.entries(negativeKeywords).forEach(([emotion, keywords]) => {
    if (keywords.some(keyword => allText.includes(keyword))) {
      negativeEmotions.push(emotion);
    }
  });
  
  // Анализ стиля юмора
  const humorStyle = analyzeHumorStyle(texts);
  
  // Анализ эмпатии
  const empathyLevel = analyzeEmpathyLevel(texts);
  
  // Анализ реакций на стресс
  const stressResponses = analyzeStressResponses(texts);
  
  return {
    positiveEmotions,
    negativeEmotions,
    humorStyle,
    empathyLevel,
    stressResponses
  };
}

function analyzePersonalityTraits(texts: string[]): {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
} {
  const allText = texts.join(' ').toLowerCase();
  
  // Openness (открытость к новому опыту)
  const opennessKeywords = ['интересно', 'новое', 'попробовать', 'узнать', 'изучить', 'креатив', 'идея'];
  const openness = Math.min(100, Math.max(0, 
    opennessKeywords.filter(keyword => allText.includes(keyword)).length * 15
  ));
  
  // Conscientiousness (добросовестность)
  const conscientiousnessKeywords = ['план', 'организовать', 'дедлайн', 'ответственность', 'порядок', 'система'];
  const conscientiousness = Math.min(100, Math.max(0,
    conscientiousnessKeywords.filter(keyword => allText.includes(keyword)).length * 15
  ));
  
  // Extraversion (экстраверсия)
  const extraversionKeywords = ['общение', 'компания', 'вечеринка', 'встреча', 'друзья', 'социальный'];
  const extraversion = Math.min(100, Math.max(0,
    extraversionKeywords.filter(keyword => allText.includes(keyword)).length * 15
  ));
  
  // Agreeableness (доброжелательность)
  const agreeablenessKeywords = ['помочь', 'поддержка', 'понимание', 'согласие', 'компромисс', 'доброта'];
  const agreeableness = Math.min(100, Math.max(0,
    agreeablenessKeywords.filter(keyword => allText.includes(keyword)).length * 15
  ));
  
  // Neuroticism (нейротизм)
  const neuroticismKeywords = ['волнение', 'стресс', 'беспокойство', 'тревога', 'напряжение', 'усталость'];
  const neuroticism = Math.min(100, Math.max(0,
    neuroticismKeywords.filter(keyword => allText.includes(keyword)).length * 15
  ));
  
  return {
    openness,
    conscientiousness,
    extraversion,
    agreeableness,
    neuroticism
  };
}

function analyzeConversationContext(texts: string[]): {
  preferredTopics: string[];
  avoidedTopics: string[];
  conversationStarters: string[];
  conversationEnders: string[];
  smallTalkStyle: string;
} {
  const allText = texts.join(' ').toLowerCase();
  
  // Предпочитаемые темы
  const preferredTopics: string[] = [];
  const topicKeywords = {
    'работа': ['работа', 'проект', 'задача', 'дедлайн', 'коллеги'],
    'технологии': ['технологии', 'программирование', 'компьютер', 'интернет', 'гаджеты'],
    'спорт': ['спорт', 'фитнес', 'тренировка', 'футбол', 'баскетбол'],
    'музыка': ['музыка', 'песня', 'концерт', 'альбом', 'исполнитель'],
    'путешествия': ['путешествие', 'отпуск', 'поездка', 'страна', 'город']
  };
  
  Object.entries(topicKeywords).forEach(([topic, keywords]) => {
    if (keywords.some(keyword => allText.includes(keyword))) {
      preferredTopics.push(topic);
    }
  });
  
  // Избегаемые темы (определяем по негативным реакциям)
  const avoidedTopics: string[] = [];
  const avoidKeywords = {
    'политика': ['политика', 'выборы', 'правительство'],
    'личные проблемы': ['проблемы', 'трудности', 'сложности']
  };
  
  Object.entries(avoidKeywords).forEach(([topic, keywords]) => {
    if (keywords.some(keyword => allText.includes(keyword))) {
      avoidedTopics.push(topic);
    }
  });
  
  // Начало разговоров
  const conversationStarters = extractConversationStarters(texts);
  
  // Завершение разговоров
  const conversationEnders = extractConversationEnders(texts);
  
  // Стиль светской беседы
  const smallTalkStyle = analyzeSmallTalkStyle(texts);
  
  return {
    preferredTopics,
    avoidedTopics,
    conversationStarters,
    conversationEnders,
    smallTalkStyle
  };
}

function analyzeTimePatterns(messages: ProcessedMessage[]): {
  activeHours: string[];
  responseDelays: {
    immediate: number;
    within5min: number;
    within1hour: number;
    within24hours: number;
  };
  weekendBehavior: string;
} {
  // Анализ активных часов
  const hourCounts: { [key: number]: number } = {};
  messages.forEach(msg => {
    const hour = msg.timestamp.getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  const activeHours = Object.entries(hourCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => `${hour}:00`);
  
  // Анализ задержек ответов (упрощенная версия)
  const responseDelays = {
    immediate: 30,
    within5min: 40,
    within1hour: 20,
    within24hours: 10
  };
  
  // Поведение в выходные
  const weekendMessages = messages.filter(msg => {
    const day = msg.timestamp.getDay();
    return day === 0 || day === 6; // Воскресенье или суббота
  });
  
  const weekendBehavior = weekendMessages.length > messages.length * 0.3 
    ? 'активное общение в выходные' 
    : 'спокойные выходные';
  
  return {
    activeHours,
    responseDelays,
    weekendBehavior
  };
}

function analyzeSocialBehavior(texts: string[]): {
  groupChatStyle: string;
  privateChatStyle: string;
  conflictResolution: string;
  supportStyle: string;
  celebrationStyle: string;
} {
  const allText = texts.join(' ').toLowerCase();
  
  // Стиль в групповых чатах
  const groupChatStyle = allText.includes('всем привет') || allText.includes('добрый день всем')
    ? 'активный участник'
    : allText.includes('спасибо') || allText.includes('благодарю')
    ? 'вежливый участник'
    : 'наблюдатель';
  
  // Стиль в личных чатах
  const privateChatStyle = allText.includes('😊') || allText.includes('❤️')
    ? 'эмоциональный'
    : allText.includes('спасибо') || allText.includes('пожалуйста')
    ? 'вежливый'
    : 'деловой';
  
  // Разрешение конфликтов
  const conflictResolution = allText.includes('извини') || allText.includes('прости')
    ? 'извиняется и идет на компромисс'
    : allText.includes('понимаю') || allText.includes('согласен')
    ? 'ищет компромисс'
    : 'избегает конфликтов';
  
  // Стиль поддержки
  const supportStyle = allText.includes('поддерживаю') || allText.includes('согласен')
    ? 'активная поддержка'
    : allText.includes('понимаю') || allText.includes('сочувствую')
    ? 'эмпатичная поддержка'
    : 'нейтральная поддержка';
  
  // Стиль празднования
  const celebrationStyle = allText.includes('🎉') || allText.includes('поздравляю')
    ? 'эмоциональное празднование'
    : allText.includes('ура') || allText.includes('отлично')
    ? 'скромное празднование'
    : 'сдержанное празднование';
  
  return {
    groupChatStyle,
    privateChatStyle,
    conflictResolution,
    supportStyle,
    celebrationStyle
  };
}

// Вспомогательные функции
function analyzeHumorStyle(texts: string[]): string {
  const allText = texts.join(' ').toLowerCase();
  
  if (allText.includes('😂') || allText.includes('хаха') || allText.includes('lol')) {
    return 'веселый и позитивный';
  } else if (allText.includes('😏') || allText.includes('ирония')) {
    return 'ироничный';
  } else if (allText.includes('😅') || allText.includes('улыбка')) {
    return 'добродушный';
  } else {
    return 'сдержанный';
  }
}

function analyzeEmpathyLevel(texts: string[]): string {
  const allText = texts.join(' ').toLowerCase();
  
  if (allText.includes('понимаю') && allText.includes('сочувствую')) {
    return 'высокий';
  } else if (allText.includes('понимаю') || allText.includes('поддерживаю')) {
    return 'средний';
  } else {
    return 'обычный';
  }
}

function analyzeStressResponses(texts: string[]): string[] {
  const allText = texts.join(' ').toLowerCase();
  const responses: string[] = [];
  
  if (allText.includes('все будет хорошо') || allText.includes('не волнуйся')) {
    responses.push('оптимистичный настрой');
  }
  if (allText.includes('нужно отдохнуть') || allText.includes('расслабиться')) {
    responses.push('поиск отдыха');
  }
  if (allText.includes('проблема') || allText.includes('трудности')) {
    responses.push('анализ проблем');
  }
  
  return responses.length > 0 ? responses : ['спокойствие'];
}

function extractConversationStarters(texts: string[]): string[] {
  const starters: string[] = [];
  const starterPatterns = [
    'привет', 'добрый день', 'доброе утро', 'добрый вечер',
    'как дела', 'как ты', 'что нового', 'как жизнь'
  ];
  
  starterPatterns.forEach(pattern => {
    if (texts.some(text => text.toLowerCase().includes(pattern))) {
      starters.push(pattern);
    }
  });
  
  return starters;
}

function extractConversationEnders(texts: string[]): string[] {
  const enders: string[] = [];
  const enderPatterns = [
    'до свидания', 'пока', 'увидимся', 'до встречи',
    'спокойной ночи', 'хорошего дня', 'удачи'
  ];
  
  enderPatterns.forEach(pattern => {
    if (texts.some(text => text.toLowerCase().includes(pattern))) {
      enders.push(pattern);
    }
  });
  
  return enders;
}

function analyzeSmallTalkStyle(texts: string[]): string {
  const allText = texts.join(' ').toLowerCase();
  
  if (allText.includes('погода') || allText.includes('как дела')) {
    return 'классический';
  } else if (allText.includes('новости') || allText.includes('что нового')) {
    return 'информативный';
  } else if (allText.includes('😊') || allText.includes('эмодзи')) {
    return 'эмоциональный';
  } else {
    return 'минималистичный';
  }
}