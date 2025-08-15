import { supabase } from '../lib/supabase';

export interface TelegramAuthResponse {
  success: boolean;
  phone_code_hash?: string;
  user?: any;
  session?: any;
  error?: string;
  requires_2fa?: boolean;
  message?: string;
}

export interface TelegramSession {
  id: string;
  user_id: string;
  phone: string;
  session_data: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TelegramUserMessage {
  id: string;
  telegram_user_id: string;
  twin_id: string;
  chat_id: string;
  message_id?: string;
  content: string;
  is_voice: boolean;
  is_incoming: boolean;
  timestamp: string;
  created_at: string;
}

export interface TelegramIntegration {
  id: string;
  app_user_id: string;
  telegram_user_id: string;
  twin_id: string;
  is_active: boolean;
  settings: {
    auto_reply: boolean;
    voice_replies: boolean;
    delay_min: number;
    delay_max: number;
    work_hours?: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
  created_at: string;
  updated_at: string;
}

export class TelegramUserService {
  // Теперь ВСЕ запросы идут через Edge Functions
  private static readonly EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-user-api`;
  private static readonly INTEGRATION_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-integration-manager`;
  private static readonly REQUEST_TIMEOUT = 15000; // 15 seconds timeout

  private static async callEdgeFunction(action: string, payload: any = {}): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);
    
    try {
      const response = await fetch(this.EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action,
          ...payload
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Edge Function error: ${response.status} - ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Превышено время ожидания ответа от Edge Function. Попробуйте позже.');
        }
      }
      
      throw error;
    }
  }

  private static async callIntegrationFunction(action: string, payload: any = {}): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);
    
    try {
      const response = await fetch(this.INTEGRATION_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action,
          ...payload
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Integration Function error: ${response.status} - ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Превышено время ожидания ответа от Integration Function. Попробуйте позже.');
        }
      }
      
      throw error;
    }
  }

  static async checkServerStatus(): Promise<{ available: boolean; error?: string }> {
    try {
      const result = await this.callEdgeFunction('check_status');
      return { 
        available: result.success || false,
        error: result.error
      };
    } catch (error) {
      console.error('Server status check failed:', error);
      return { 
        available: false, 
        error: error instanceof Error ? error.message : 'Edge Function недоступен'
      };
    }
  }

  static async sendAuthCode(phone: string): Promise<TelegramAuthResponse> {
    try {
      console.log('Отправляем код на номер через Edge Function:', phone);
      
      const result = await this.callEdgeFunction('send_code', {
        phone_number: phone.trim()
      });
      
      if (result.success) {
        return {
          success: true,
          phone_code_hash: result.data?.phone_number || phone,
          message: 'Код отправлен в Telegram через Edge Function'
        };
      } else {
        return {
          success: false,
          error: result.error || 'Ошибка при отправке кода через Edge Function'
        };
      }
    } catch (error) {
      console.error('Error sending auth code:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ошибка при отправке кода через Edge Function'
      };
    }
  }

  static async verifyAuthCode(
    phone: string, 
    code: string, 
    phoneCodeHash: string,
    password?: string
  ): Promise<TelegramAuthResponse> {
    try {
      console.log('Проверяем код для номера через Edge Function:', phone);
      
      const payload: any = {
        phone_number: phone.trim(),
        code: code.trim()
      };

      if (password) {
        payload.password = password;
      }

      const result = await this.callEdgeFunction('verify_code', payload);
      
      if (result.success) {
        return {
          success: true,
          user: {
            phone: phone,
            session: result.data
          },
          message: 'Успешная авторизация через Edge Function! MTProto сессия создана.'
        };
      } else if (result.requires_2fa) {
        return {
          success: false,
          requires_2fa: true,
          error: 'Требуется двухфакторная аутентификация'
        };
      } else {
        return {
          success: false,
          error: result.error || 'Ошибка при проверке кода через Edge Function'
        };
      }
    } catch (error) {
      console.error('Error verifying auth code:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ошибка при проверке кода через Edge Function'
      };
    }
  }

  static async getTelegramSessions(): Promise<TelegramSession[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || `anonymous_${Date.now()}`;

      const { data, error } = await supabase
        .from('telegram_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting telegram sessions:', error);
      return [];
    }
  }

  static async getTelegramIntegrations(): Promise<TelegramIntegration[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || `anonymous_${Date.now()}`;

      const { data, error } = await supabase
        .from('telegram_integrations')
        .select(`
          *,
          digital_twins!telegram_integrations_twin_id_fkey(name)
        `)
        .eq('app_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting telegram integrations:', error);
      return [];
    }
  }

  static async getTelegramMessages(limit: number = 50): Promise<TelegramUserMessage[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || `anonymous_${Date.now()}`;

      // Получаем сообщения через связь с интеграциями
      const { data, error } = await supabase
        .from('telegram_user_messages')
        .select(`
          *,
          digital_twins!telegram_user_messages_twin_id_fkey(
            user_id
          )
        `)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Фильтруем по пользователю
      const filteredData = (data || []).filter(message => 
        message.digital_twins?.user_id === userId || 
        message.digital_twins?.user_id?.startsWith('anonymous_')
      );

      return filteredData;
    } catch (error) {
      console.error('Error getting telegram messages:', error);
      return [];
    }
  }

  static async startIntegration(
    telegramUserId: string, 
    twinId: string,
    settings: Partial<TelegramIntegration['settings']> = {}
  ): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const result = await this.callIntegrationFunction('start', {
        telegram_user_id: telegramUserId,
        twin_id: twinId,
        settings: {
          auto_reply: true,
          voice_replies: true,
          delay_min: 30,
          delay_max: 300,
          work_hours: {
            enabled: false,
            start: '09:00',
            end: '18:00'
          },
          ...settings
        }
      });

      return {
        success: result.success || false,
        message: result.message || 'Интеграция создана через Edge Function',
        error: result.error
      };
    } catch (error) {
      console.error('Error starting integration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ошибка при запуске интеграции через Edge Function'
      };
    }
  }

  static async stopIntegration(integrationId: string): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const result = await this.callIntegrationFunction('stop', {
        integration_id: integrationId
      });

      return {
        success: result.success || false,
        message: result.message || 'Интеграция остановлена через Edge Function',
        error: result.error
      };
    } catch (error) {
      console.error('Error stopping integration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ошибка при остановке интеграции через Edge Function'
      };
    }
  }

  static async getDialogs(limit: number = 10): Promise<any> {
    try {
      const result = await this.callEdgeFunction('get_dialogs', {
        limit: limit
      });

      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Ошибка при получении диалогов');
      }
    } catch (error) {
      console.error('Error getting dialogs:', error);
      throw error;
    }
  }

  static async sendMessage(chatId: string, message: string): Promise<any> {
    try {
      const result = await this.callEdgeFunction('send_message', {
        chat_id: chatId,
        message: message
      });

      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Ошибка при отправке сообщения');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  static async isConfigured(): Promise<boolean> {
    try {
      const status = await this.checkServerStatus();
      return status.available;
    } catch (error) {
      console.error('Error checking configuration:', error);
      return false;
    }
  }

  static getApiCredentials() {
    return {
      edge_function_url: this.EDGE_FUNCTION_URL,
      integration_function_url: this.INTEGRATION_FUNCTION_URL,
      configured: true
    };
  }
}