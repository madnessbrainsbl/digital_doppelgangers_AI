/**
 * Шаблоны для электронных писем
 */

// Базовый шаблон с логотипом
export const baseTemplate = (content: string): string => `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Сообщение</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f9f9f9;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 1px solid #eeeeee;
      margin-bottom: 20px;
    }
    .logo {
      max-width: 150px;
      height: auto;
    }
    .content {
      padding: 20px 0;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #eeeeee;
      font-size: 12px;
      color: #999999;
    }
    .button {
      display: inline-block;
      padding: 10px 20px;
      margin: 20px 0;
      background-color: #4a6cf7;
      color: #ffffff !important;
      text-decoration: none;
      border-radius:
      4px;
      font-weight: bold;
    }
    @media only screen and (max-width: 600px) {
      .container {
        width: 100%;
        padding: 10px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://d70f0616-4a7a-41e5-a128-0e1e32b599af-00-2lu72yg0tsdub.worf.replit.dev/src/assets/logo.svg" alt="Asisto" class="logo">
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Asisto. Все права защищены.</p>
      <p>Если вы получили это письмо по ошибке, пожалуйста, проигнорируйте его.</p>
    </div>
  </div>
</body>
</html>
`;

// Шаблон "Стандартный" - простой и лаконичный дизайн
export const standardTemplate = (subject: string, message: string): string => {
  const content = `
    <h2 style="color: #333333; margin-bottom: 20px;">${subject}</h2>
    <div style="margin-bottom: 20px; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</div>
    <p style="margin-top: 30px; font-style: italic;">С уважением, <br>Команда Asisto</p>
  `;
  return baseTemplate(content);
};

// Шаблон "Информационный" - с дополнительным блоком информации
export const infoTemplate = (subject: string, message: string): string => {
  const content = `
    <h2 style="color: #4a6cf7; margin-bottom: 20px;">${subject}</h2>
    <div style="margin-bottom: 20px; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</div>
    <div style="background-color: #f5f7ff; border-left: 4px solid #4a6cf7; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold;">Важная информация</p>
      <p style="margin: 10px 0 0 0;">Вы всегда можете связаться с нами по телефону или электронной почте для получения дополнительной информации.</p>
    </div>
    <p style="margin-top: 30px; font-style: italic;">С уважением, <br>Команда Asisto</p>
  `;
  return baseTemplate(content);
};

// Шаблон "Маркетинговый" - с призывом к действию
export const marketingTemplate = (subject: string, message: string): string => {
  const content = `
    <h2 style="color: #2ecc71; margin-bottom: 20px;">${subject}</h2>
    <div style="margin-bottom: 20px; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://asisto.ru" class="button" style="background-color: #2ecc71;">Узнать больше</a>
    </div>
    <p style="margin-top: 20px; font-style: italic;">С уважением, <br>Команда Asisto</p>
  `;
  return baseTemplate(content);
};

// Типы шаблонов
export type EmailTemplateType = 'standard' | 'info' | 'marketing';

// Функция для получения HTML шаблона по типу
export const getTemplateByType = (type: EmailTemplateType, subject: string, message: string): string => {
  switch (type) {
    case 'standard':
      return standardTemplate(subject, message);
    case 'info':
      return infoTemplate(subject, message);
    case 'marketing':
      return marketingTemplate(subject, message);
    default:
      return standardTemplate(subject, message);
  }
};