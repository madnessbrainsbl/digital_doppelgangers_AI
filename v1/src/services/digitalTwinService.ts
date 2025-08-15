import { supabase } from '../lib/supabase';
import { ProcessedMessage, UserProfile, DigitalTwinData } from '../types/telegram';
import { DataTableService } from './dataTableService';

export interface DigitalTwin {
  id: string;
  user_id: string;
  name: string;
  system_prompt: string;
  analysis_data: {
    profile: UserProfile;
    messages_count: number;
    created_at: string;
  };
  created_at: string;
  updated_at: string;
}

export class DigitalTwinService {
  static async createTwin(
    name: string,
    systemPrompt: string,
    profile: UserProfile,
    messages: ProcessedMessage[]
  ): Promise<DigitalTwin> {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || `anonymous_${Date.now()}`;
    
    // Проверяем, нет ли уже двойника с таким же именем для этого пользователя
    const existingTwins = await this.getUserTwins(userId);
    const existingNames = existingTwins.map(twin => twin.name);
    
    let finalName = name;
    let counter = 1;
    while (existingNames.includes(finalName)) {
      finalName = `${name} (${counter})`;
      counter++;
    }
    
    const { data: twin, error: twinError } = await supabase
      .from('digital_twins')
      .insert({
        user_id: userId,
        name: finalName,
        system_prompt: systemPrompt,
        analysis_data: {
          profile,
          messages_count: messages.length,
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (twinError) throw twinError;

    // Save telegram messages
    const telegramMessages = messages.map(msg => ({
      twin_id: twin.id,
      content: msg.text,
      is_user: msg.isUser,
      timestamp: msg.timestamp.toISOString(),
      chat_name: msg.chatName || 'Unknown Chat'
    }));

    const { error: messagesError } = await supabase
      .from('telegram_messages')
      .insert(telegramMessages);

    if (messagesError) throw messagesError;

    return twin;
  }

  static async getTwin(twinId: string): Promise<DigitalTwin | null> {
    const { data, error } = await supabase
      .from('digital_twins')
      .select('*')
      .eq('id', twinId)
      .single();

    if (error) return null;
    return data;
  }

  static async getAllTwins(): Promise<DigitalTwinData[]> {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    let query = supabase
      .from('digital_twins')
      .select('*')
      .order('created_at', { ascending: false });

    // If user is authenticated, filter by user_id
    if (user) {
      query = query.eq('user_id', user.id);
    } else {
      // For anonymous users, show twins created by anonymous sessions
      query = query.like('user_id', 'anonymous_%');
    }

    const { data, error } = await query;

    if (error) throw error;
    
    return (data || []).map(twin => ({
      id: twin.id,
      name: twin.name,
      systemPrompt: twin.system_prompt,
      profile: twin.analysis_data.profile,
      messagesCount: twin.analysis_data.messages_count,
      createdAt: twin.created_at
    }));
  }

  static async deleteTwin(twinId: string): Promise<void> {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check if user owns this twin
    const { data: twin } = await supabase
      .from('digital_twins')
      .select('user_id')
      .eq('id', twinId)
      .single();

    if (twin && user && twin.user_id !== user.id) {
      throw new Error('Вы не можете удалить чужого двойника');
    }

    const { error } = await supabase
      .from('digital_twins')
      .delete()
      .eq('id', twinId);

    if (error) throw error;
  }

  static async getUserTwins(userId: string): Promise<DigitalTwin[]> {
    const { data, error } = await supabase
      .from('digital_twins')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async updateTwinPrompt(twinId: string, systemPrompt: string): Promise<void> {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check if user owns this twin
    const { data: twin } = await supabase
      .from('digital_twins')
      .select('user_id')
      .eq('id', twinId)
      .single();

    if (twin && user && twin.user_id !== user.id) {
      throw new Error('Вы не можете редактировать чужого двойника');
    }

    const { error } = await supabase
      .from('digital_twins')
      .update({ 
        system_prompt: systemPrompt,
        updated_at: new Date().toISOString()
      })
      .eq('id', twinId);

    if (error) throw error;
  }

  static async updateTwinName(twinId: string, name: string): Promise<void> {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check if user owns this twin
    const { data: twin } = await supabase
      .from('digital_twins')
      .select('user_id')
      .eq('id', twinId)
      .single();

    if (twin && user && twin.user_id !== user.id) {
      throw new Error('Вы не можете редактировать чужого двойника');
    }

    const { error } = await supabase
      .from('digital_twins')
      .update({ 
        name: name,
        updated_at: new Date().toISOString()
      })
      .eq('id', twinId);

    if (error) throw error;
  }

  static async getTelegramMessages(twinId: string): Promise<ProcessedMessage[]> {
    const { data, error } = await supabase
      .from('telegram_messages')
      .select('*')
      .eq('twin_id', twinId)
      .order('timestamp', { ascending: true });

    if (error) throw error;

    return (data || []).map(msg => ({
      text: msg.content,
      isUser: msg.is_user,
      timestamp: new Date(msg.timestamp),
      chatName: msg.chat_name
    }));
  }

  // Получить подключенные таблицы для двойника
  static async getTwinConnectedTables(twinId: string): Promise<any[]> {
    try {
      return await DataTableService.getTwinConnectedTables(twinId);
    } catch (error) {
      console.error('Error getting twin connected tables:', error);
      return [];
    }
  }

  // Получить данные из подключенных таблиц
  static async getTwinTableData(twinId: string): Promise<any> {
    try {
      const connectedTables = await this.getTwinConnectedTables(twinId);
      const tableData: any = {};

      for (const connection of connectedTables) {
        const table = connection.data_tables;
        if (table && connection.is_active) {
          // Получаем данные из таблицы
          const queryResult = await DataTableService.executeTableQuery(table.id, {
            query_type: 'select',
            query_data: {}
          });
          
          tableData[table.name] = {
            schema: table.table_schema,
            data: queryResult,
            access_level: connection.access_level
          };
        }
      }

      return tableData;
    } catch (error) {
      console.error('Error getting twin table data:', error);
      return {};
    }
  }

  // Обновить системный промпт с информацией о таблицах
  static async updateTwinPromptWithTableInfo(twinId: string, systemPrompt: string): Promise<void> {
    try {
      const tableData = await this.getTwinTableData(twinId);
      
      if (Object.keys(tableData).length > 0) {
        let enhancedPrompt = systemPrompt;
        
        // Добавляем информацию о доступных таблицах
        enhancedPrompt += '\n\nУ тебя есть доступ к следующим таблицам данных:\n';
        
        for (const [tableName, tableInfo] of Object.entries(tableData)) {
          const info = tableInfo as any;
          enhancedPrompt += `\nТаблица "${tableName}":\n`;
          enhancedPrompt += `- Уровень доступа: ${info.access_level}\n`;
          enhancedPrompt += `- Схема: ${JSON.stringify(info.schema)}\n`;
          enhancedPrompt += `- Пример данных: ${JSON.stringify(info.data.slice(0, 3))}\n`;
        }
        
        enhancedPrompt += '\n\nИспользуй эту информацию для более точных ответов. Если пользователь спрашивает о данных из таблиц, предоставь актуальную информацию.';
        
        await this.updateTwinPrompt(twinId, enhancedPrompt);
      } else {
        await this.updateTwinPrompt(twinId, systemPrompt);
      }
    } catch (error) {
      console.error('Error updating twin prompt with table info:', error);
      // Fallback to original prompt
      await this.updateTwinPrompt(twinId, systemPrompt);
    }
  }
}