/**
 * Сервис для отправки электронных писем с кодами подтверждения и массовых рассылок
 */
import "dotenv/config";
import nodemailer from "nodemailer";
import { Channel } from "@shared/schema";
import fs from "fs";
import {
  getTemplateByType,
  EmailTemplateType,
} from "../templates/email-templates";

// Тип для settings email канала
type EmailChannelSettings = {
  email: string;
  password: string;
  smtpServer: string;
  smtpPort: number;
  imapServer?: string;
  imapPort?: number;
  [key: string]: any;
};

// Расширяем тип для канала с конкретными настройками
interface EmailChannel extends Omit<Channel, "settings"> {
  settings: EmailChannelSettings;
}

type VerificationCode = {
  email: string;
  code: string;
  expires: Date;
};

export class EmailService {
  private verificationCodes: Map<string, VerificationCode>;
  private codeExpirationMinutes: number;
  private transporter: nodemailer.Transporter;


  constructor() {
    this.verificationCodes = new Map();
    this.codeExpirationMinutes = 30; // Код действителен 30 минут

    // Проверяем наличие учетных данных
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      console.log(
        `Настройка SMTP с учетной записью: ${process.env.EMAIL_USER}`
      );

      // Если есть настройки, создаем реальный транспорт для отправки писем
      this.transporter = nodemailer.createTransport({
        host: "smtp.mail.ru", // Для mail.ru
        port: 465,
        secure: true, // true для 465, false для других портов
        auth: {
          user: process.env.EMAIL_USER, // Учетная запись для отправки писем
          pass: process.env.EMAIL_PASS, // Пароль или спец. ключ для приложений
        },
        tls: {
          rejectUnauthorized: true, // Для безопасности
        },
        debug: true, // Для отладки SMTP-соединения в консоли
      });

      // Верификация транспорта при запуске
      this.transporter.verify((error, success) => {
        if (error) {
          console.error("Ошибка при проверке SMTP-соединения:", error);
        } else {
          console.log("Сервер готов к отправке писем");
        }
      });
    } else {
      // Если нет настроек, выводим предупреждение
      console.warn(
        "EMAIL_USER или EMAIL_PASS не заданы в переменных окружения."
      );
      console.log("Коды подтверждения будут отображаться только в консоли.");

      // Создаем транспорт-заглушку, который не будет реально отправлять письма
      this.transporter = nodemailer.createTransport({
        jsonTransport: true, // Просто создает JSON вместо реальной отправки
      });
    }
  }

  /**
   * Генерация случайного кода подтверждения
   */
  private generateVerificationCode(): string {
    // Генерируем 6-значный код
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Отправка кода подтверждения на email
   */
  async sendVerificationCode(email: string): Promise<string> {
    // Генерируем случайный код
    const code = this.generateVerificationCode();
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + this.codeExpirationMinutes);

    // Сохраняем код в памяти
    this.verificationCodes.set(email, { email, code, expires });

    try {
      // Настройки письма
      const mailOptions = {
        from: `"Asisto" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Код подтверждения Asisto",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #333;">Код подтверждения для Asisto</h2>
            <p>Ваш код подтверждения:</p>
            <div style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; text-align: center; font-size: 24px; letter-spacing: 2px; margin: 20px 0;">
              <strong>${code}</strong>
            </div>
            <p>Код действителен в течение ${this.codeExpirationMinutes} минут.</p>
            <p>Если вы не запрашивали этот код, пожалуйста, проигнорируйте это письмо.</p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
            <p style="color: #777; font-size: 12px;">© Asisto, Inc.</p>
          </div>
        `,
      };

      // Проверяем, заданы ли EMAIL_USER и EMAIL_PASS
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
          // Отправляем письмо
          const info = await this.transporter.sendMail(mailOptions);
          console.log(info);
          console.log(
            `Код подтверждения успешно отправлен на ${email}. ID сообщения: ${info.messageId}`
          );
        } catch (emailError) {
          console.error("Ошибка при отправке письма:", emailError);
          // Для дополнительной отладки
          console.log(`Детали ошибки: ${JSON.stringify(emailError, null, 2)}`);

          // В случае ошибки отправки письма, все равно показываем код в консоли
          // для возможности тестирования и отладки
          console.log(
            `⚠️ ТОЛЬКО ДЛЯ ТЕСТИРОВАНИЯ - Код подтверждения для ${email}: ${code}`
          );
        }
      } else {
        // Если EMAIL_USER или EMAIL_PASS не заданы, отображаем код в консоли
        console.warn(
          "EMAIL_USER или EMAIL_PASS не заданы в переменных окружения."
        );
        console.log(
          `⚠️ ТОЛЬКО ДЛЯ ТЕСТИРОВАНИЯ - Код подтверждения для ${email}: ${code}`
        );
      }
    } catch (error) {
      console.error("Ошибка отправки email:", error);
      // Для дополнительной отладки
      console.log(`Детали ошибки: ${JSON.stringify(error, null, 2)}`);

      // В случае непредвиденной ошибки, все равно показываем код в консоли
      console.log(
        `⚠️ ТОЛЬКО ДЛЯ ТЕСТИРОВАНИЯ - Код подтверждения для ${email}: ${code}`
      );
    }

    return code;
  }

  /**
   * Проверка кода подтверждения
   */
  verifyCode(email: string, code: string): boolean {
    const verification = this.verificationCodes.get(email);
    if (!verification) return false;

    const now = new Date();
    if (now > verification.expires) {
      this.verificationCodes.delete(email);
      return false;
    }

    if (verification.code !== code) return false;

    // Код верный и не истек, удалим его, чтобы нельзя было использовать повторно
    this.verificationCodes.delete(email);
    return true;
  }

  /**
   * Создание транспортера для конкретного email-канала
   */
  private createChannelTransporter(channel: Channel): nodemailer.Transporter {
    // Проверяем, что канал имеет все необходимые настройки для типа EmailChannel
    if (
      !channel.settings ||
      typeof (channel.settings as EmailChannelSettings).email !== "string" ||
      typeof (channel.settings as EmailChannelSettings).password !== "string" ||
      typeof (channel.settings as EmailChannelSettings).smtpServer !== "string" ||
      typeof (channel.settings as EmailChannelSettings).smtpPort !== "number"
    ) {
      console.error(
        `[EmailService] Канал ${channel.id} не имеет настроенных учетных данных`
      );
      throw new Error("Email канал не имеет корректных настроек");
    }

    // После проверки мы можем приводить канал к типу EmailChannel
    const emailChannel = channel as unknown as EmailChannel;

    const { email, password, smtpServer, smtpPort } = emailChannel.settings;

    // Проверяем наличие обязательных параметров
    if (!smtpServer || !smtpPort) {
      console.error(
        `[EmailService] Канал ${channel.id} не имеет настроенных SMTP параметров`
      );
      throw new Error("SMTP-сервер не настроен для этого канала");
    }

    console.log(
      `[EmailService] Создание транспорта для канала [${channel.id}] ${channel.name} (${email})`
    );
    console.log(`[EmailService] SMTP сервер: ${smtpServer}:${smtpPort}`);

    // Создаем новый транспортер с настройками канала
    return nodemailer.createTransport({
      host: smtpServer,
      port: smtpPort,
      secure: smtpPort === 465, // true для 465, false для других портов
      auth: {
        user: email,
        pass: password,
      },
      tls: {
        rejectUnauthorized: true,
      },
      debug: true,
    });
  }

  /**
   * Отправка письма через указанный канал
   */
  async sendEmailWithChannel(
    channel: Channel,
    to: string,
    subject: string,
    html: string
  ): Promise<boolean> {
    try {
      console.log(
        `[EmailService] Отправка письма через канал [${channel.id}] ${channel.name} на адрес ${to}`
      );

      // Создаем транспортер для канала
      const transporter = this.createChannelTransporter(channel);

      // Приводим канал к типу EmailChannel после проверки в createChannelTransporter
      const emailChannel = channel as unknown as EmailChannel;

      // Настройки письма
      const mailOptions = {
        from: `"${channel.name}" <${emailChannel.settings.email}>`,
        to,
        subject,
        html,
      };

      // Попытка отправки письма
      const info = await transporter.sendMail(mailOptions);
      console.log(
        `[EmailService] Письмо успешно отправлено. ID сообщения: ${info.messageId}`
      );

      return true;
    } catch (error) {
      console.error(
        `[EmailService] Ошибка при отправке письма на ${to}:`,
        error
      );
      return false;
    }
  }
  private createTransporter(channelSettings: any): nodemailer.Transporter {
    try {
      // Проверяем наличие настроек SMTP
      if (channelSettings && channelSettings.smtpHost && channelSettings.smtpUser && channelSettings.smtpPass) {
        // Создаем транспорт для SMTP
        console.log(`[EMAIL] Создание SMTP транспорта для хоста ${channelSettings.smtpHost}`);
        
        return nodemailer.createTransport({
          host: channelSettings.smtpHost,
          port: channelSettings.smtpPort || 465,
          secure: channelSettings.smtpSecure !== false, // По умолчанию true
          auth: {
            user: channelSettings.smtpUser,
            pass: channelSettings.smtpPass
          },
        });
      }
      
      // Если настройки не заданы, используем транспорт по умолчанию
      console.log(`[EMAIL] Настройки SMTP не предоставлены, используем транспорт по умолчанию`);
      return this.transporter;
    } catch (error) {
      console.error('[EMAIL] Ошибка при создании транспорта:', error);
      return this.transporter;
    }
  }

  async sendFunctionDataWithChannel(
    channelSettings: any,
    to: string,
    functionName: string,
    functionData: any
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log(`[EMAIL] Отправка данных функции "${functionName}" на email: ${to} с настройками канала`);
      
      // Проверяем, есть ли SMTP-настройки в объекте
      const smtpSettings = {
        host: process.env.EMAIL_HOST || 'smtp.mail.ru',
        port: parseInt(process.env.EMAIL_PORT || '465'),
        user: process.env.EMAIL_USER || 'alt-nn@mail.ru',
        pass: process.env.EMAIL_PASS,
        secure: process.env.EMAIL_SECURE !== 'false'
      };
      
      console.log(`[EMAIL] Используем общие настройки SMTP для отправки c почты ${smtpSettings.user} на ${to}`);
      
      // Создаем транспортер напрямую, минуя createTransporter
      const transporter = nodemailer.createTransport({
        host: smtpSettings.host,
        port: smtpSettings.port,
        secure: smtpSettings.secure,
        auth: {
          user: smtpSettings.user,
          pass: smtpSettings.pass
        }
      });
      
      // Настройки письма
      const mailOptions = {
        from: `"Asisto" <${smtpSettings.user}>`,
        to: to,
        subject: channelSettings.subject || `Сообщение от Asisto`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0; font-family: monospace; white-space: pre-wrap;">
              ${functionData}
            </div>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
            <p style="color: #777; font-size: 12px;">© Asisto, Inc.</p>
          </div>
        `,
        text: functionData
      };
      
      // Отправляем письмо
      const info = await transporter.sendMail(mailOptions);
      console.log(`[EMAIL] Сообщение успешно отправлено на ${to}. ID сообщения: ${info.messageId}`);
      
      return { 
        success: true, 
        messageId: info.messageId 
      };
    } catch (error) {
      console.error('[EMAIL] Ошибка при отправке сообщения:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Неизвестная ошибка отправки email' 
      };
    }
  }

  /**
   * Отправка массовой рассылки по списку адресов
   */
  async sendBulkEmails(
    channel: Channel,
    recipients: string[],
    subject: string,
    body: string,
    templateType: EmailTemplateType = "standard",
    userId?: number,
    campaignName?: string
  ): Promise<{
    success: boolean;
    successCount: number;
    failedCount: number;
    errors: any[];
    campaignId?: number;
  }> {
    console.log(
      `[EmailService] Начало массовой рассылки через канал [${channel.id}] ${channel.name}`
    );
    console.log(`[EmailService] Количество получателей: ${recipients.length}`);
    console.log(`[EmailService] Используемый шаблон: ${templateType}`);

    // Проверяем, что канал имеет все необходимые настройки для типа EmailChannel
    if (
      !channel.settings ||
      typeof (channel.settings as EmailChannelSettings).email !== "string" ||
      typeof (channel.settings as EmailChannelSettings).password !== "string" ||
      typeof (channel.settings as EmailChannelSettings).smtpServer !== "string" ||
      typeof (channel.settings as EmailChannelSettings).smtpPort !== "number"
    ) {
      console.error("[EmailService] Некорректные настройки канала");
      return {
        success: false,
        successCount: 0,
        failedCount: recipients.length,
        errors: [{ message: "Некорректные настройки канала" }],
      };
    }

    try {
      // Приводим канал к типу EmailChannel после проверки настроек
      const emailChannel = channel as unknown as EmailChannel;

      // Создаем транспортер для канала
      const transporter = this.createChannelTransporter(channel);

      // Проверяем соединение
      await new Promise<void>((resolve, reject) => {
        transporter.verify((error) => {
          if (error) {
            console.error("[EmailService] Ошибка проверки транспорта:", error);

            // Проверяем конкретные коды ошибок для лучшей диагностики
            const errorStr = error.toString();

            // Ошибки Яндекс почты
            if (
              errorStr.includes("535 5.7.8") &&
              errorStr.includes("authentication failed") &&
              emailChannel.settings.smtpServer.includes("yandex")
            ) {
              console.error(
                "[EmailService] Ошибка аутентификации для Яндекс.Почты. Вероятно, требуется создать пароль приложения и разрешить доступ для сторонних приложений"
              );
            }

            // Ошибки Gmail
            if (
              errorStr.includes("534-5.7.14") &&
              emailChannel.settings.smtpServer.includes("gmail")
            ) {
              console.error(
                "[EmailService] Ошибка для Gmail: требуется включить двухфакторную аутентификацию и создать пароль приложения"
              );
            }

            reject(error);
          } else {
            console.log("[EmailService] Транспорт успешно проверен");
            resolve();
          }
        });
      });

      // Данные для отслеживания результатов
      let successCount = 0;
      let failedCount = 0;
      const errors: any[] = [];

      // Формируем HTML-контент письма с использованием шаблона
      const htmlContent = getTemplateByType(templateType, subject, body);

      // Обработка каждого получателя отдельно
      for (const recipient of recipients) {
        try {
          console.log(`[EmailService] Отправка письма на адрес: ${recipient}`);

          // Настройки письма
          const mailOptions = {
            from: `"${channel.name}" <${emailChannel.settings.email}>`,
            to: recipient,
            subject,
            html: htmlContent,
          };

          // Отправка письма
          const info = await transporter.sendMail(mailOptions);
          console.log(
            `[EmailService] Письмо успешно отправлено на ${recipient}. ID сообщения: ${info.messageId}`
          );

          successCount++;
        } catch (error) {
          console.error(
            `[EmailService] Ошибка при отправке письма на ${recipient}:`,
            error
          );
          failedCount++;
          errors.push({
            recipient,
            message:
              error instanceof Error ? error.message : "Неизвестная ошибка",
            error,
          });
        }
      }

      // Сохраняем информацию о рассылке в базу данных, если указан userId
      let campaignId: number | undefined;

      if (userId) {
        try {
          // Импортируем storage здесь, чтобы избежать циклической зависимости
          const { storage } = await import("../storage");

          // Создаем запись о кампании в базе данных
          const emailCampaign = await storage.createEmailCampaign({
            userId: userId,
            channelId: channel.id,
            name:
              campaignName || `Рассылка от ${new Date().toLocaleDateString()}`,
            subject: subject,
            message: body,
            templateType: templateType,
            recipientCount: recipients.length,
            successCount: successCount,
            failedCount: failedCount,
            status: failedCount === 0 ? "completed" : "completed_with_errors",
          });

          campaignId = emailCampaign.id;
          console.log(
            `[EmailService] Сохранена информация о рассылке с ID: ${campaignId}`
          );

          // Также создаем запись в журнале активности
          await storage.createActivityLog({
            userId: userId,
            action: "sent_newsletter",
            details: {
              recipients: recipients.length,
              name:
                campaignName ||
                `Рассылка от ${new Date().toLocaleDateString()}`,
              successCount: successCount,
              failedCount: failedCount,
            },
          });
        } catch (error) {
          console.error(
            "[EmailService] Ошибка при сохранении данных о рассылке:",
            error
          );
        }
      }

      // Формируем итоговый отчет
      const result = {
        success: failedCount === 0,
        successCount,
        failedCount,
        errors,
        campaignId,
      };

      console.log(`[EmailService] Результат рассылки:`, result);
      return result;
    } catch (error) {
      console.error("[EmailService] Общая ошибка при рассылке:", error);
      return {
        success: false,
        successCount: 0,
        failedCount: recipients.length,
        errors: [{ message: "Ошибка инициализации рассылки", error }],
      };
    }
  }
}

export const emailService = new EmailService();
