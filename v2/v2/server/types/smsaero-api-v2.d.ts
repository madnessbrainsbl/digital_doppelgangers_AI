declare module 'smsaero-api-v2' {
  interface SendSMSOptions {
    number: string;
    text: string;
    sign?: string;
    channel?: string;
    dateSend?: number;
    callbackUrl?: string;
  }

  class SmsAero {
    constructor(email: string, apiKey: string);
    
    // Отправка SMS сообщения
    send(options: SendSMSOptions): Promise<any>;
    
    // Получение баланса
    balance(): Promise<any>;
    
    // Получение статистики
    statistics(): Promise<any>;
    
    // Другие методы API
    // ...
  }

  export default SmsAero;
}