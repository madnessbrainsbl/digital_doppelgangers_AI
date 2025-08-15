import { GoogleGenAI } from '@google/genai';
import { ProcessedMessage, UserProfile } from '../types/telegram';

class GeminiService {
  private client: GoogleGenAI | null = null;
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (this.apiKey) {
      this.client = new GoogleGenAI({
        apiKey: this.apiKey,
      });
    } else {
      console.warn('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your .env file.');
    }
  }

  async generateEnhancedPrompt(
    basePrompt: string, 
    profile: UserProfile, 
    personalInfo: { name: string; role: string; interests: string[]; additionalInfo: string }
  ): Promise<string> {
    if (!this.client) {
      throw new Error('Gemini client not initialized');
    }

    try {
      const enhancementPrompt = `Улучши следующий системный промпт для цифрового двойника, сделав его более детальным, естественным и эффективным. 

ОСНОВНЫЕ ТРЕБОВАНИЯ:
1. Сохрани всю важную информацию из базового промпта
2. Добавь больше конкретных примеров и деталей
3. Сделай инструкции более четкими и практичными
4. Улучши структуру и читаемость
5. Добавь больше контекста о личности пользователя
6. Включи больше эмоциональных и поведенческих паттернов

БАЗОВЫЙ ПРОМПТ:
${basePrompt}

УЛУЧШЕННЫЙ ПРОМПТ ДОЛЖЕН ВКЛЮЧАТЬ:
- Более детальное описание личности
- Конкретные примеры поведения
- Эмоциональные триггеры и реакции
- Стилистические особенности речи
- Социальные паттерны
- Временные предпочтения
- Контекстные адаптации

Сделай промпт максимально эффективным для создания естественного цифрового двойника.`;

      const response = await this.client.models.generateContentStream({
        model: 'gemini-2.5-pro-preview-06-05',
        config: {
          responseMimeType: 'text/plain',
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: enhancementPrompt,
              },
            ],
          },
        ],
      });

      let enhancedPrompt = '';
      for await (const chunk of response) {
        if (chunk.text) {
          enhancedPrompt += chunk.text;
        }
      }

      return enhancedPrompt.trim() || basePrompt;
    } catch (error) {
      console.error('Error enhancing prompt:', error);
      return basePrompt; // Возвращаем базовый промпт в случае ошибки
    }
  }

  async generateResponse(
    userMessage: string,
    systemPrompt: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    allTelegramMessages: ProcessedMessage[] = []
  ): Promise<string> {
    if (!this.client) {
      throw new Error('Gemini client not initialized. Please check your VITE_GEMINI_API_KEY in the .env file.');
    }

    try {
      const config = {
        responseMimeType: 'text/plain',
      };

      // Создаем расширенный системный промпт с примерами из Telegram
      const enhancedSystemPrompt = this.createEnhancedSystemPrompt(systemPrompt, allTelegramMessages);

      // Подготавливаем контент для Gemini с правильной структурой
      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: enhancedSystemPrompt,
            },
          ],
        },
        {
          role: 'model',
          parts: [
            {
              text: 'Понял! Я буду отвечать в соответствии с заданным стилем и характером.',
            },
          ],
        },
      ];

      // Добавляем историю разговора (последние 6 сообщений для контекста)
      conversationHistory.slice(-6).forEach(msg => {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [
            {
              text: msg.content,
            },
          ],
        });
      });

      // Добавляем текущее сообщение пользователя
      contents.push({
        role: 'user',
        parts: [
          {
            text: userMessage,
          },
        ],
      });

      const response = await this.client.models.generateContentStream({
        model: 'gemini-2.5-pro-preview-06-05',
        config,
        contents,
      });

      let fullResponse = '';
      for await (const chunk of response) {
        if (chunk.text) {
          fullResponse += chunk.text;
        }
      }

      if (!fullResponse.trim()) {
        throw new Error('Пустой ответ от Gemini');
      }

      return fullResponse.trim();
    } catch (error) {
      console.error('Gemini API Error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('quota') || error.message.includes('429')) {
          throw new Error('Превышен лимит Gemini API. Проверьте ваш баланс или попробуйте позже.');
        } else if (error.message.includes('api_key') || error.message.includes('401')) {
          throw new Error('Неверный ключ Gemini API. Проверьте VITE_GEMINI_API_KEY в .env файле.');
        } else if (error.message.includes('rate_limit')) {
          throw new Error('Превышен лимит запросов. Попробуйте позже.');
        }
      }
      
      throw new Error('Ошибка при генерации ответа через Gemini. Проверьте настройки API ключа.');
    }
  }

  private createEnhancedSystemPrompt(systemPrompt: string, telegramMessages: ProcessedMessage[]): string {
    // Выбираем случайные примеры сообщений пользователя для контекста
    const userMessages = telegramMessages
      .filter(msg => msg.isUser && msg.text.length > 10 && msg.text.length < 200)
      .slice(0, 5); // Берем до 5 примеров

    let enhancedPrompt = systemPrompt;

    if (userMessages.length > 0) {
      enhancedPrompt += '\n\nПРИМЕРЫ ТВОЕГО СТИЛЯ ОБЩЕНИЯ:';
      userMessages.forEach((msg, index) => {
        enhancedPrompt += `\nПример ${index + 1}: "${msg.text}"`;
      });
      enhancedPrompt += '\n\nВАЖНО: Отвечай в точно таком же стиле, используя похожие выражения и манеру речи.';
    }

    enhancedPrompt += '\n\nПРАВИЛА:';
    enhancedPrompt += '\n1. НИКОГДА не упоминай, что ты ИИ или искусственный интеллект';
    enhancedPrompt += '\n2. Отвечай как живой человек в своем стиле';
    enhancedPrompt += '\n3. Используй естественные паузы, междометия и эмоции';
    enhancedPrompt += '\n4. Будь последовательным в характере и манере речи';
    enhancedPrompt += '\n5. Адаптируйся к собеседнику, но сохраняй свою индивидуальность';

    return enhancedPrompt;
  }

  isConfigured(): boolean {
    return this.client !== null && !!this.apiKey;
  }
}

export const geminiService = new GeminiService();