import axios from "axios";
import "dotenv/config";

/**
 * Класс для отправки SMS через сервис SMS AERO (https://smsaero.ru/)
 * В режиме разработки работает в тестовом режиме без отправки реальных SMS
 */
export class SmsService {
  private readonly apiKey: string;
  private readonly email: string;
  private readonly fromName: string;
  private readonly codeTTL: number = 10 * 60 * 1000; // 10 минут в миллисекундах
  private readonly apiBaseUrl: string = "https://gate.smsaero.ru/v2";

  // Используем публичное поле для доступа к кодам из API-маршрутов
  public readonly verificationCodes: Map<
    string,
    { code: string; expires: number }
  > = new Map();

  // Определяем режим работы на основе переменных окружения
  // По умолчанию используем "живой" режим
  private readonly testMode: boolean = process.env.SMS_TEST_MODE === "true";

  constructor(apiKey: string, email: string, fromName: string = "") {
    this.apiKey = apiKey;
    this.email = email;
    this.fromName = fromName;

    console.log(
      `[SMS] Initialized SMS service in ${
        this.testMode ? "TEST" : "PRODUCTION"
      } mode`
    );

    // Проверяем наличие необходимых данных для работы с API
    if (!this.testMode) {
      if (!this.apiKey || !this.email) {
        console.warn(
          "[SMS] WARNING: Missing SMS API credentials. Set SMS_TEST_MODE=true or provide SMS_AERO_API_KEY and SMS_AERO_EMAIL env variables."
        );
      } else {
        console.log("[SMS] API credentials provided, ready to send real SMS.");
      }
    }
  }

  /**
   * Проверяет, является ли номер телефона российским (+7XXXXXXXXXX)
   */
  isValidRussianPhone(phone: string): boolean {
    const russianPhoneRegex = /^\+7\d{10}$/;
    return russianPhoneRegex.test(phone);
  }

  /**
   * Генерирует случайный код подтверждения
   * @returns Строка с 6-значным кодом
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Выполняет запрос к API SMS Aero
   * @param endpoint Конечная точка API
   * @param params Параметры запроса
   * @returns Результат запроса
   */
  private async makeApiRequest(
    endpoint: string,
    params: Record<string, string>
  ): Promise<any> {
    // Создаем базовую авторизацию (Basic Auth)
    const auth = Buffer.from(`${this.email}:${this.apiKey}`).toString("base64");

    console.log(`[SMS] Making API request to ${endpoint} with params:`, params);

    try {
      const response = await axios({
        method: "GET",
        url: `${this.apiBaseUrl}/${endpoint}`,
        params,
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });

      console.log(`[SMS] API response:`, {
        status: response.status,
        data: response.data,
      });

      // Если есть подробности валидационной ошибки, показываем их
      if (
        response.data &&
        !response.data.success &&
        response.data.message === "Validation error." &&
        response.data.data
      ) {
        console.log("[SMS] Validation error details:", response.data.data);
      }

      return response.data;
    } catch (error: any) {
      console.error("[SMS] API request error:", {
        message: error.message,
        response: error.response?.data || "No response data",
      });

      if (error.response && error.response.data) {
        return error.response.data;
      }

      throw error;
    }
  }

  /**
   * Отправляет SMS с кодом подтверждения на указанный номер
   * @param phone Номер телефона в формате +7XXXXXXXXXX
   * @returns Код подтверждения в тестовом режиме, иначе null
   */
  async sendVerificationCode(phone: string): Promise<string> {
    if (!this.isValidRussianPhone(phone)) {
      throw new Error(
        "Некорректный формат номера телефона. Должен быть в формате +7XXXXXXXXXX"
      );
    }

    // Генерируем код подтверждения
    const code = this.generateCode();
    console.log(`[SMS] Generated verification code for ${phone}: ${code}`);

    try {
      // Сохраняем код и срок его действия независимо от режима (для возможности проверки)
      const expires = Date.now() + this.codeTTL;
      this.verificationCodes.set(phone, { code, expires });

      // В тестовом режиме не отправляем реальное SMS
      if (this.testMode) {
        console.log(
          `[SMS] TEST MODE: Verification code saved for ${phone}: ${code}, expires at ${new Date(
            expires
          )}`
        );
        return code; // В тестовом режиме возвращаем код для отображения
      }

      // Реальный режим - отправляем SMS через SMS AERO API
      console.log(
        `[SMS] PRODUCTION MODE: Sending verification code to ${phone}`
      );

      // Формируем текст SMS
      const message = `Ваш код подтверждения: ${code}`;

      // Формируем номер телефона без '+'
      const phoneNumber = phone.substring(1); // Убираем '+' в начале

      // Подготавливаем параметры запроса, на основе вашего рабочего примера
      const params: Record<string, string> = {
        number: phoneNumber,
        text: message,
      };

      // Используем 'SMSAero' как имя отправителя (без пробела)
      // Это предварительно одобренное имя отправителя в SMS Aero
      params.sign = "SMSAero";

      console.log("[SMS] Sending SMS using SMS Aero API with params:", params);

      // Делаем запрос к API напрямую
      const response = await this.makeApiRequest("sms/send", params);

      if (!response.success) {
        console.error(
          "[SMS] Error sending SMS via SMS Aero API:",
          response.message
        );
        throw new Error(
          `SMS Aero API error: ${response.message || "Unknown error"}`
        );
      }

      console.log(
        `[SMS] SMS sent successfully to ${phone}. Message ID: ${
          response.data?.id || "unknown"
        }`
      );

      // Даже в реальном режиме мы возвращаем код, чтобы fallback мог работать
      return code;
    } catch (error: any) {
      console.error(`[SMS] Error sending SMS to ${phone}:`, error);

      // Если включен тестовый режим при ошибке, возвращаем код
      if (process.env.SMS_FALLBACK_TO_TEST_ON_ERROR === "true") {
        console.log(
          `[SMS] Fallback to test mode. Verification code for ${phone}: ${code}`
        );
        return code;
      }

      throw new Error(`Failed to send verification code: ${error.message}`);
    }
  }

  /**
   * Проверяет код подтверждения для указанного номера телефона
   * @param phone Номер телефона
   * @param code Код подтверждения для проверки
   * @returns true если код верный и не истек, иначе false
   */
  verifyCode(phone: string, code: string): boolean {
    // Получаем сохраненный код и время истечения
    const savedData = this.verificationCodes.get(phone);

    if (!savedData) {
      console.log(`[SMS] No verification code found for ${phone}`);
      return false;
    }

    // Проверяем, не истек ли срок действия кода
    const now = Date.now();
    if (now > savedData.expires) {
      console.log(
        `[SMS] Verification code for ${phone} expired at ${new Date(
          savedData.expires
        )}`
      );
      this.verificationCodes.delete(phone); // Удаляем истекший код
      return false;
    }

    // Проверяем совпадение кодов
    const isValid = savedData.code === code;
    console.log(
      `[SMS] Verification result for ${phone}: ${isValid ? "valid" : "invalid"}`
    );

    // Если код верный, удаляем его, чтобы нельзя было использовать повторно
    if (isValid) {
      this.verificationCodes.delete(phone);
    }

    return isValid;
  }

  /**
   * Получает баланс аккаунта SMS Aero
   * @returns Информация о балансе
   */
  async getBalance(): Promise<any> {
    try {
      if (this.testMode) {
        return { success: true, data: { balance: 1000, currency: "rub" } };
      }

      return await this.makeApiRequest("balance", {});
    } catch (error) {
      console.error("[SMS] Error getting balance:", error);
      throw error;
    }
  }

  /**
   * Отправляет массовую SMS рассылку на указанные номера
   * @param phones Массив номеров телефонов в формате +7XXXXXXXXXX
   * @param message Текст сообщения для отправки
   * @param senderName Имя отправителя (если отличается от заданного по умолчанию)
   * @returns Результаты отправки сообщений
   */
  async sendBulkSms(
    phones: string[],
    message: string,
    senderName?: string
  ): Promise<{
    success: boolean;
    totalCount: number;
    successCount: number;
    failedCount: number;
    results: Array<{
      phone: string;
      success: boolean;
      error?: string;
      messageId?: string;
    }>;
  }> {
    console.log(
      `[SMS] Starting bulk SMS campaign to ${phones.length} recipients`
    );

    // Результаты отправки
    const results: Array<{
      phone: string;
      success: boolean;
      error?: string;
      messageId?: string;
    }> = [];
    let successCount = 0;
    let failedCount = 0;

    // В тестовом режиме имитируем успешную отправку
    if (this.testMode) {
      console.log(
        `[SMS] TEST MODE: Simulating bulk SMS campaign to ${phones.length} recipients`
      );

      // Имитируем отправку с небольшой задержкой
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Записываем результаты для всех номеров
      for (const phone of phones) {
        results.push({
          phone,
          success: true,
          messageId: `test-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        });
        successCount++;
      }

      return {
        success: true,
        totalCount: phones.length,
        successCount,
        failedCount,
        results,
      };
    }

    // Проверяем наличие API-ключа и email
    if (!this.apiKey || !this.email) {
      throw new Error(
        "Отсутствуют учетные данные для API SMS Aero. Проверьте настройки."
      );
    }

    // Игнорируем все параметры и всегда используем 'SMSAero' как имя отправителя
    // SMS Aero имеет предварительно одобренные имена отправителей, включая SMSAero
    // SMSAero (без пробела) - это гарантированно работающий вариант
    const sign = "SMSAero";

    // Отправляем SMS на каждый номер по отдельности
    for (const phone of phones) {
      try {
        // Проверяем формат номера
        if (!this.isValidRussianPhone(phone)) {
          results.push({
            phone,
            success: false,
            error: "Некорректный формат номера телефона",
          });
          failedCount++;
          continue;
        }

        // Формируем номер без '+'
        const phoneNumber = phone.substring(1);

        // Параметры запроса
        const params: Record<string, string> = {
          number: phoneNumber,
          text: message,
          sign,
        };

        console.log(`[SMS] Sending SMS to ${phone} with message: "${message}"`);

        // Отправляем запрос к API
        const response = await this.makeApiRequest("sms/send", params);

        if (response.success) {
          results.push({
            phone,
            success: true,
            messageId: response.data?.id,
          });
          successCount++;
        } else {
          results.push({
            phone,
            success: false,
            error: response.message || "Неизвестная ошибка",
          });
          failedCount++;
        }
      } catch (error: any) {
        console.error(`[SMS] Error sending SMS to ${phone}:`, error);

        results.push({
          phone,
          success: false,
          error: error.message || "Ошибка отправки",
        });
        failedCount++;
      }
    }

    console.log(
      `[SMS] Bulk SMS campaign completed. Success: ${successCount}, Failed: ${failedCount}`
    );

    return {
      success: successCount > 0,
      totalCount: phones.length,
      successCount,
      failedCount,
      results,
    };
  }
}

// Создаем экземпляр сервиса
const apiKey = process.env.SMS_AERO_API_KEY || "";
const email = process.env.SMS_AERO_EMAIL || "";
// Игнорируем переменную окружения, всегда используем SMSAero как имя отправителя
const fromName = "SMSAero";

console.log(`[SMS] Initializing SMS service with the following configuration:
  - API Key: ${apiKey ? "Configured (hidden)" : "Not configured"}
  - Email: ${email || "Not configured"}
  - From Name: ${fromName}
  - Test Mode: ${process.env.SMS_TEST_MODE === "true" ? "Enabled" : "Disabled"}
  - Fallback Mode: ${
    process.env.SMS_FALLBACK_TO_TEST_ON_ERROR === "true"
      ? "Enabled"
      : "Disabled"
  }`);

export const smsService = new SmsService(apiKey, email, fromName);
