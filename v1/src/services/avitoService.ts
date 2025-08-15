import { supabase } from '../lib/supabase';

export interface AvitoIntegration {
  id: string;
  name: string;
  phone: string;
  status: 'active' | 'inactive' | 'error';
  connectedTwinId?: string;
  connectedTwinName?: string;
  messagesCount: number;
  autoReply: boolean;
  createdAt: string;
  lastActivity?: string;
}

export interface AvitoMessage {
  id: string;
  chatId: string;
  chatName: string;
  messageText: string;
  isIncoming: boolean;
  timestamp: string;
  responseText?: string;
  itemTitle?: string;
  itemPrice?: string;
}

export interface CreateIntegrationData {
  name: string;
  phone: string;
}

export interface IntegrationSettings {
  autoReply?: boolean;
  connectedTwinId?: string;
}

export interface AvitoUserCredentials {
  id: string;
  avitoApiKey: string;
  avitoApiUrl: string;
  webhookSecret?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCredentialsData {
  avitoApiKey: string;
  avitoApiUrl?: string;
  webhookSecret?: string;
}

export class AvitoService {
  static async getAllIntegrations(): Promise<AvitoIntegration[]> {
    try {
      const { data, error } = await supabase
        .from('avito_integrations')
        .select(`
          *,
          digital_twins(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((integration: any) => ({
        id: integration.id,
        name: integration.name,
        phone: integration.phone,
        status: integration.status,
        connectedTwinId: integration.connected_twin_id,
        connectedTwinName: integration.digital_twins?.name,
        messagesCount: integration.messages_count || 0,
        autoReply: integration.auto_reply || false,
        createdAt: integration.created_at,
        lastActivity: integration.last_activity
      }));
    } catch (error) {
      console.error('Error fetching Avito integrations:', error);
      throw new Error('Ошибка при загрузке интеграций с Авито');
    }
  }

  static async createIntegration(name: string, phone: string): Promise<AvitoIntegration> {
    try {
      const { data, error } = await supabase
        .from('avito_integrations')
        .insert({
          name,
          phone,
          status: 'inactive',
          auto_reply: false,
          messages_count: 0
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        phone: data.phone,
        status: data.status,
        messagesCount: data.messages_count || 0,
        autoReply: data.auto_reply || false,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('Error creating Avito integration:', error);
      throw new Error('Ошибка при создании интеграции с Авито');
    }
  }

  static async deleteIntegration(integrationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('avito_integrations')
        .delete()
        .eq('id', integrationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting Avito integration:', error);
      throw new Error('Ошибка при удалении интеграции с Авито');
    }
  }

  static async connectTwinToIntegration(integrationId: string, twinId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('avito_integrations')
        .update({
          connected_twin_id: twinId,
          status: 'active'
        })
        .eq('id', integrationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error connecting twin to Avito integration:', error);
      throw new Error('Ошибка при подключении двойника к интеграции');
    }
  }

  static async updateIntegrationSettings(integrationId: string, settings: IntegrationSettings): Promise<void> {
    try {
      const updateData: any = {};
      
      if (settings.autoReply !== undefined) {
        updateData.auto_reply = settings.autoReply;
      }
      
      if (settings.connectedTwinId !== undefined) {
        updateData.connected_twin_id = settings.connectedTwinId;
      }

      const { error } = await supabase
        .from('avito_integrations')
        .update(updateData)
        .eq('id', integrationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating Avito integration settings:', error);
      throw new Error('Ошибка при обновлении настроек интеграции');
    }
  }

  static async getRecentMessages(limit: number = 50): Promise<AvitoMessage[]> {
    try {
      const { data, error } = await supabase
        .from('avito_messages')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map((message: any) => ({
        id: message.id,
        chatId: message.chat_id,
        chatName: message.chat_name,
        messageText: message.message_text,
        isIncoming: message.is_incoming,
        timestamp: message.timestamp,
        responseText: message.response_text,
        itemTitle: message.item_title,
        itemPrice: message.item_price
      }));
    } catch (error) {
      console.error('Error fetching Avito messages:', error);
      throw new Error('Ошибка при загрузке сообщений из Авито');
    }
  }

  static async sendMessage(chatId: string, message: string): Promise<boolean> {
    try {
      // Здесь будет вызов Edge Function для отправки сообщения в Авито
      const { data, error } = await supabase.functions.invoke('avito-send-message', {
        body: {
          chatId,
          message
        }
      });

      if (error) throw error;
      return data.success;
    } catch (error) {
      console.error('Error sending message to Avito:', error);
      throw new Error('Ошибка при отправке сообщения в Авито');
    }
  }

  static async getIntegrationStatus(integrationId: string): Promise<{ status: string; lastActivity?: string }> {
    try {
      const { data, error } = await supabase
        .from('avito_integrations')
        .select('status, last_activity')
        .eq('id', integrationId)
        .single();

      if (error) throw error;

      return {
        status: data.status,
        lastActivity: data.last_activity
      };
    } catch (error) {
      console.error('Error fetching integration status:', error);
      throw new Error('Ошибка при получении статуса интеграции');
    }
  }

  static async activateIntegration(integrationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('avito_integrations')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', integrationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error activating Avito integration:', error);
      throw new Error('Ошибка при активации интеграции с Авито');
    }
  }

  static async deactivateIntegration(integrationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('avito_integrations')
        .update({
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', integrationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deactivating Avito integration:', error);
      throw new Error('Ошибка при деактивации интеграции с Авито');
    }
  }

  static async getUserCredentials(): Promise<AvitoUserCredentials | null> {
    try {
      const { data, error } = await supabase
        .from('avito_user_credentials')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned

      if (!data) return null;

      return {
        id: data.id,
        avitoApiKey: data.avito_api_key,
        avitoApiUrl: data.avito_api_url,
        webhookSecret: data.webhook_secret,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error fetching user credentials:', error);
      throw new Error('Ошибка при загрузке учетных данных');
    }
  }

  static async saveUserCredentials(credentials: CreateCredentialsData): Promise<AvitoUserCredentials> {
    try {
      const { data, error } = await supabase
        .from('avito_user_credentials')
        .upsert({
          avito_api_key: credentials.avitoApiKey,
          avito_api_url: credentials.avitoApiUrl || 'https://api.avito.ru',
          webhook_secret: credentials.webhookSecret,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        avitoApiKey: data.avito_api_key,
        avitoApiUrl: data.avito_api_url,
        webhookSecret: data.webhook_secret,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error saving user credentials:', error);
      throw new Error('Ошибка при сохранении учетных данных');
    }
  }

  static async deleteUserCredentials(): Promise<void> {
    try {
      const { error } = await supabase
        .from('avito_user_credentials')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all user's credentials

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting user credentials:', error);
      throw new Error('Ошибка при удалении учетных данных');
    }
  }

  static async testApiConnection(apiKey: string, apiUrl: string = 'https://api.avito.ru'): Promise<boolean> {
    try {
      const response = await fetch(`${apiUrl}/test`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error testing API connection:', error);
      return false;
    }
  }
} 