import { supabase } from '../lib/supabase';
import { TelegramBot, TelegramIntegrationMessage } from '../types/telegram';

export interface TelegramBotData {
  id: string;
  name: string;
  username: string;
  status: 'active' | 'inactive' | 'error';
  connectedTwinId?: string;
  connectedTwinName?: string;
  messagesCount: number;
  voiceEnabled: boolean;
  createdAt: string;
}

export interface TelegramMessageData {
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

export class TelegramService {
  static async createBot(
    name: string,
    username: string,
    token: string
  ): Promise<TelegramBot> {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || `anonymous_${Date.now()}`;
    
    // Validate bot token format
    if (!this.validateBotToken(token)) {
      throw new Error('Неверный формат токена бота');
    }

    // Create bot record
    const { data: bot, error: createError } = await supabase
      .from('telegram_bots')
      .insert({
        user_id: userId,
        name,
        username,
        token,
        status: 'active',
        voice_enabled: true,
        messages_count: 0
      })
      .select()
      .single();

    if (createError) throw createError;

    // In a real implementation, here you would:
    // 1. Verify the bot token with Telegram API
    // 2. Set up webhook URL
    // 3. Configure bot commands
    
    return bot;
  }

  static async getAllBots(): Promise<TelegramBotData[]> {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    let query = supabase
      .from('telegram_bots')
      .select(`
        *,
        digital_twins!telegram_bots_connected_twin_id_fkey(name)
      `)
      .order('created_at', { ascending: false });

    // If user is authenticated, filter by user_id
    if (user) {
      query = query.eq('user_id', user.id);
    } else {
      // For anonymous users, show bots created by anonymous sessions
      query = query.like('user_id', 'anonymous_%');
    }

    const { data, error } = await query;

    if (error) throw error;
    
    return (data || []).map(bot => ({
      id: bot.id,
      name: bot.name,
      username: bot.username,
      status: bot.status,
      connectedTwinId: bot.connected_twin_id,
      connectedTwinName: bot.digital_twins?.name,
      messagesCount: bot.messages_count,
      voiceEnabled: bot.voice_enabled,
      createdAt: bot.created_at
    }));
  }

  static async deleteBot(botId: string): Promise<void> {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check if user owns this bot
    const { data: bot } = await supabase
      .from('telegram_bots')
      .select('user_id')
      .eq('id', botId)
      .single();

    if (bot && user && bot.user_id !== user.id) {
      throw new Error('Вы не можете удалить чужого бота');
    }

    // In a real implementation, here you would:
    // 1. Remove webhook from Telegram
    // 2. Clean up any active connections

    const { error } = await supabase
      .from('telegram_bots')
      .delete()
      .eq('id', botId);

    if (error) throw error;
  }

  static async connectTwinToBot(botId: string, twinId: string): Promise<void> {
    const { error } = await supabase
      .from('telegram_bots')
      .update({ 
        connected_twin_id: twinId,
        updated_at: new Date().toISOString()
      })
      .eq('id', botId);

    if (error) throw error;
  }

  static async updateBotSettings(
    botId: string, 
    settings: { voiceEnabled?: boolean; status?: string }
  ): Promise<void> {
    const { error } = await supabase
      .from('telegram_bots')
      .update({ 
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', botId);

    if (error) throw error;
  }

  static async getRecentMessages(limit: number = 50): Promise<TelegramMessageData[]> {
    // Get current user
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
    
    // Filter by user ownership
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
  }

  static async saveMessage(
    botId: string,
    chatId: string,
    chatName: string,
    messageText: string,
    isVoice: boolean = false,
    isIncoming: boolean = true,
    responseText?: string,
    responseVoice: boolean = false
  ): Promise<TelegramIntegrationMessage> {
    const { data: message, error } = await supabase
      .from('telegram_integration_messages')
      .insert({
        bot_id: botId,
        chat_id: chatId,
        chat_name: chatName,
        message_text: messageText,
        is_voice: isVoice,
        is_incoming: isIncoming,
        response_text: responseText,
        response_voice: responseVoice,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Update bot message count
    await supabase.rpc('increment_bot_messages', { bot_id: botId });

    return message;
  }

  private static validateBotToken(token: string): boolean {
    // Telegram bot token format: {bot_id}:{bot_token}
    // Example: 123456789:AAEhBOweik9ai2o01234567890abcdef
    const tokenRegex = /^\d+:[A-Za-z0-9_-]{35}$/;
    return tokenRegex.test(token);
  }

  // Webhook handling methods (for server-side implementation)
  static async handleWebhook(botToken: string, update: any): Promise<void> {
    // This would be implemented on the server side
    // 1. Verify the webhook is from the correct bot
    // 2. Process the incoming message
    // 3. Generate response using the connected digital twin
    // 4. Send response back to Telegram
    // 5. Handle voice messages with STT/TTS
    
    console.log('Webhook handling would be implemented on server side');
  }

  static async setupWebhook(botToken: string, webhookUrl: string): Promise<boolean> {
    // This would make a request to Telegram Bot API
    // POST https://api.telegram.org/bot{token}/setWebhook
    
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['message', 'voice']
        })
      });

      const result = await response.json();
      return result.ok;
    } catch (error) {
      console.error('Error setting up webhook:', error);
      return false;
    }
  }
}