export interface ResponseSpeedSettings {
  minDelay: number; // Минимальная задержка в миллисекундах
  maxDelay: number; // Максимальная задержка в миллисекундах
  typingSpeed: number; // Скорость печати (символов в секунду)
  thinkingTime: number; // Время "размышления" в миллисекундах
  enableTypingIndicator: boolean; // Показывать индикатор печати
  enableThinkingDelay: boolean; // Добавлять задержку размышления
}

export class ResponseTimerService {
  private static instance: ResponseTimerService;
  private settings: ResponseSpeedSettings = {
    minDelay: 1000,
    maxDelay: 3000,
    typingSpeed: 50, // 50 символов в секунду
    thinkingTime: 2000,
    enableTypingIndicator: true,
    enableThinkingDelay: true
  };

  private constructor() {}

  static getInstance(): ResponseTimerService {
    if (!ResponseTimerService.instance) {
      ResponseTimerService.instance = new ResponseTimerService();
    }
    return ResponseTimerService.instance;
  }

  // Установка настроек скорости ответа
  setSettings(settings: Partial<ResponseSpeedSettings>) {
    this.settings = { ...this.settings, ...settings };
  }

  // Получение текущих настроек
  getSettings(): ResponseSpeedSettings {
    return { ...this.settings };
  }

  // Предустановленные профили скорости
  setSpeedProfile(profile: 'instant' | 'fast' | 'normal' | 'slow' | 'very-slow' | 'realistic') {
    const profiles = {
      instant: {
        minDelay: 0,
        maxDelay: 100,
        typingSpeed: 1000,
        thinkingTime: 0,
        enableTypingIndicator: false,
        enableThinkingDelay: false
      },
      fast: {
        minDelay: 500,
        maxDelay: 1500,
        typingSpeed: 200,
        thinkingTime: 500,
        enableTypingIndicator: true,
        enableThinkingDelay: false
      },
      normal: {
        minDelay: 1000,
        maxDelay: 3000,
        typingSpeed: 50,
        thinkingTime: 2000,
        enableTypingIndicator: true,
        enableThinkingDelay: true
      },
      slow: {
        minDelay: 2000,
        maxDelay: 5000,
        typingSpeed: 30,
        thinkingTime: 3000,
        enableTypingIndicator: true,
        enableThinkingDelay: true
      },
      'very-slow': {
        minDelay: 3000,
        maxDelay: 8000,
        typingSpeed: 20,
        thinkingTime: 5000,
        enableTypingIndicator: true,
        enableThinkingDelay: true
      },
      realistic: {
        minDelay: 1500,
        maxDelay: 4000,
        typingSpeed: 40,
        thinkingTime: 2500,
        enableTypingIndicator: true,
        enableThinkingDelay: true
      }
    };

    this.setSettings(profiles[profile]);
  }

  // Расчет времени печати на основе длины текста
  calculateTypingTime(textLength: number): number {
    return Math.ceil((textLength / this.settings.typingSpeed) * 1000);
  }

  // Расчет случайной задержки в заданном диапазоне
  calculateRandomDelay(): number {
    return Math.random() * (this.settings.maxDelay - this.settings.minDelay) + this.settings.minDelay;
  }

  // Полный расчет времени ответа
  calculateTotalResponseTime(textLength: number): number {
    let totalTime = 0;

    // Добавляем время размышления
    if (this.settings.enableThinkingDelay) {
      totalTime += this.settings.thinkingTime;
    }

    // Добавляем случайную задержку
    totalTime += this.calculateRandomDelay();

    // Добавляем время печати
    if (this.settings.enableTypingIndicator) {
      totalTime += this.calculateTypingTime(textLength);
    }

    return totalTime;
  }

  // Создание задержки с прогрессивным показом текста
  async simulateTyping(
    text: string,
    onProgress: (partialText: string, isComplete: boolean) => void,
    onComplete: () => void
  ): Promise<void> {
    const totalTime = this.calculateTotalResponseTime(text.length);
    
    // Начальная задержка (размышление + случайная задержка)
    const initialDelay = this.settings.enableThinkingDelay 
      ? this.settings.thinkingTime + this.calculateRandomDelay()
      : this.calculateRandomDelay();

    await this.delay(initialDelay);

    // Симуляция печати
    if (this.settings.enableTypingIndicator) {
      const typingTime = this.calculateTypingTime(text.length);
      const chunkSize = Math.max(1, Math.ceil(text.length / (typingTime / 100)));
      const delayPerChunk = typingTime / Math.ceil(text.length / chunkSize);

      let currentText = '';
      for (let i = 0; i < text.length; i += chunkSize) {
        currentText = text.substring(0, i + chunkSize);
        onProgress(currentText, false);
        await this.delay(delayPerChunk);
      }
    } else {
      // Если индикатор печати отключен, показываем весь текст сразу
      onProgress(text, false);
    }

    onProgress(text, true);
    onComplete();
  }

  // Простая задержка
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Получение настроек для конкретного двойника
  getTwinResponseSettings(twinId: string): ResponseSpeedSettings {
    // В будущем можно добавить персональные настройки для каждого двойника
    // Пока возвращаем общие настройки
    return this.getSettings();
  }

  // Сохранение настроек в localStorage
  saveSettings(): void {
    try {
      localStorage.setItem('responseTimerSettings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving response timer settings:', error);
    }
  }

  // Загрузка настроек из localStorage
  loadSettings(): void {
    try {
      const saved = localStorage.getItem('responseTimerSettings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Error loading response timer settings:', error);
    }
  }
}

// Экспорт экземпляра для использования
export const responseTimerService = ResponseTimerService.getInstance(); 