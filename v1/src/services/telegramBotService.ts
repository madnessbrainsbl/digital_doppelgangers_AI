import { supabase } from '../lib/supabase';

export interface TelegramBot {
  id: string;
  name: string;
  username: string;
  token: string;
  status: 'active' | 'inactive' | 'error';
  connectedTwinId?: string;
  connectedTwinName?: string;
  messagesCount: number;
  voiceEnabled: boolean;
  createdAt: string;
  webhookUrl?: string;
}

export interface TelegramMessage {
  id: string;
  chatId: string;
  chatName: string;
  messageText: string;
  isVoice: boolean;
  isIncoming: boolean;
  responseText?: string;
  responseVoice?: boolean;
  timestamp: string;
}

export class TelegramBotService {
  private static readonly WEBHOOK_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-webhook`;

  static async createBot(name: string, token: string): Promise<TelegramBot> {
    try {
      // Валидируем токен
      if (!this.validateBotToken(token)) {
        throw new Error('Неверный формат токена бота');
      }

      // Проверяем токен через Telegram API
      const botInfo = await this.validateBotWithTelegram(token);
      
      // Получаем текущего пользователя
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || `anonymous_${Date.now()}`;

      // Создаем запись в базе данных
      const { data: bot, error } = await supabase
        .from('telegram_bots')
        .insert({
          user_id: userId,
          name: name,
          username: botInfo.username,
          token: token,
          status: 'inactive',
          voice_enabled: true,
          messages_count: 0
        })
        .select()
        .single();

      if (error) throw error;

      // Настраиваем вебхук
      const webhookUrl = `${this.WEBHOOK_BASE_URL}/${bot.id}`;
      await this.setupWebhook(token, webhookUrl);

      // Обновляем статус бота
      const { data: updatedBot, error: updateError } = await supabase
        .from('telegram_bots')
        .update({ 
          status: 'active',
          webhook_url: webhookUrl
        })
        .eq('id', bot.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return {
        id: updatedBot.id,
        name: updatedBot.name,
        username: updatedBot.username,
        token: updatedBot.token,
        status: updatedBot.status,
        connectedTwinId: updatedBot.connected_twin_id,
        messagesCount: updatedBot.messages_count,
        voiceEnabled: updatedBot.voice_enabled,
        createdAt: updatedBot.created_at,
        webhookUrl: updatedBot.webhook_url
      };
    } catch (error) {
      console.error('Error creating bot:', error);
      throw error;
    }
  }

  static async getAllBots(): Promise<TelegramBot[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from('telegram_bots')
        .select(`
          *,
          digital_twins!telegram_bots_connected_twin_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        query = query.like('user_id', 'anonymous_%');
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(bot => ({
        id: bot.id,
        name: bot.name,
        username: bot.username,
        token: bot.token,
        status: bot.status,
        connectedTwinId: bot.connected_twin_id,
        connectedTwinName: bot.digital_twins?.name,
        messagesCount: bot.messages_count,
        voiceEnabled: bot.voice_enabled,
        createdAt: bot.created_at,
        webhookUrl: bot.webhook_url
      }));
    } catch (error) {
      console.error('Error loading bots:', error);
      throw error;
    }
  }

  static async deleteBot(botId: string): Promise<void> {
    try {
      // Получаем информацию о боте
      const { data: bot, error: fetchError } = await supabase
        .from('telegram_bots')
        .select('token')
        .eq('id', botId)
        .single();

      if (fetchError) throw fetchError;

      // Удаляем вебхук
      if (bot?.token) {
        await this.removeWebhook(bot.token);
      }

      // Удаляем бота из базы данных
      const { error } = await supabase
        .from('telegram_bots')
        .delete()
        .eq('id', botId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting bot:', error);
      throw error;
    }
  }

  static async connectTwinToBot(botId: string, twinId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('telegram_bots')
        .update({ 
          connected_twin_id: twinId,
          updated_at: new Date().toISOString()
        })
        .eq('id', botId);

      if (error) throw error;
    } catch (error) {
      console.error('Error connecting twin to bot:', error);
      throw error;
    }
  }

  static async updateBotSettings(
    botId: string, 
    settings: { voiceEnabled?: boolean; status?: string }
  ): Promise<void> {
    try {
      const updateData: any = { updated_at: new Date().toISOString() };
      
      if (settings.voiceEnabled !== undefined) {
        updateData.voice_enabled = settings.voiceEnabled;
      }
      
      if (settings.status !== undefined) {
        updateData.status = settings.status;
      }

      const { error } = await supabase
        .from('telegram_bots')
        .update(updateData)
        .eq('id', botId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating bot settings:', error);
      throw error;
    }
  }

  static async getRecentMessages(limit: number = 50): Promise<TelegramMessage[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from('telegram_integration_messages')
        .select(`
          *,
          telegram_bots!telegram_integration_messages_bot_id_fkey(user_id)
        `)
        .order('timestamp', { ascending: false })
        .limit(limit);

      const { data, error } = await query;
      if (error) throw error;

      // Фильтруем по владельцу
      const filteredData = (data || []).filter(message => {
        if (user) {
          return message.telegram_bots?.user_id === user.id;
        } else {
          return message.telegram_bots?.user_id?.startsWith('anonymous_');
        }
      });

      return filteredData.map(message => ({
        id: message.id,
        chatId: message.chat_id,
        chatName: message.chat_name,
        messageText: message.message_text,
        isVoice: message.is_voice,
        isIncoming: message.is_incoming,
        responseText: message.response_text,
        responseVoice: message.response_voice,
        timestamp: message.timestamp
      }));
    } catch (error) {
      console.error('Error loading messages:', error);
      return [];
    }
  }

  private static validateBotToken(token: string): boolean {
    const tokenRegex = /^\d+:[A-Za-z0-9_-]{35}$/;
    return tokenRegex.test(token);
  }

  private static async validateBotWithTelegram(token: string): Promise<{ username: string; id: number }> {
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const data = await response.json();
      
      if (!data.ok) {
        throw new Error('Неверный токен бота или бот недоступен');
      }

      return {
        username: data.result.username,
        id: data.result.id
      };
    } catch (error) {
      console.error('Error validating bot with Telegram:', error);
      throw new Error('Не удалось проверить бота в Telegram. Проверьте токен.');
    }
  }

  private static async setupWebhook(token: string, webhookUrl: string): Promise<void> {
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['message', 'voice'],
          drop_pending_updates: true
        })
      });

      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(`Ошибка настройки вебхука: ${data.description}`);
      }
    } catch (error) {
      console.error('Error setting up webhook:', error);
      throw error;
    }
  }

  private static async removeWebhook(token: string): Promise<void> {
    try {
      await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error removing webhook:', error);
      // Не бросаем ошибку, так как это не критично
    }
  }
}