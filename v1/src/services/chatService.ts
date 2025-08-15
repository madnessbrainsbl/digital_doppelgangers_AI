import { supabase } from '../lib/supabase';
import { DigitalTwinService } from './digitalTwinService';

export interface ChatSession {
  id: string;
  twin_id: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  content: string;
  is_user: boolean;
  created_at: string;
}

export class ChatService {
  static async createSession(twinId: string): Promise<ChatSession> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({ twin_id: twinId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async saveMessage(sessionId: string, content: string, isUser: boolean): Promise<void> {
    const { error } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        content,
        is_user: isUser
      });

    if (error) throw error;
  }

  static async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getRecentSessions(twinId: string, limit: number = 5): Promise<ChatSession[]> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('twin_id', twinId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  static async deleteSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;
  }

  // Новая функция для получения контекста из предыдущих сессий
  static async getContextFromPreviousSessions(twinId: string, currentSessionId: string): Promise<string> {
    try {
      // Получаем последние 3 сессии (кроме текущей)
      const recentSessions = await this.getRecentSessions(twinId, 4);
      const otherSessions = recentSessions.filter(session => session.id !== currentSessionId);
      
      if (otherSessions.length === 0) {
        return '';
      }

      let context = '';
      
      for (const session of otherSessions.slice(0, 2)) { // Берем только 2 последние сессии
        const messages = await this.getSessionMessages(session.id);
        if (messages.length > 0) {
          context += `\n\nПредыдущий разговор (${new Date(session.created_at).toLocaleDateString()}):\n`;
          messages.slice(-4).forEach(msg => { // Последние 4 сообщения из каждой сессии
            context += `${msg.is_user ? 'Пользователь' : 'Ты'}: ${msg.content}\n`;
          });
        }
      }

      return context;
    } catch (error) {
      console.error('Error getting context from previous sessions:', error);
      return '';
    }
  }

  // Функция для анализа качества ответа
  static analyzeResponseQuality(response: string, systemPrompt: string): {
    followsStyle: boolean;
    usesPersonality: boolean;
    isNatural: boolean;
    suggestions: string[];
  } {
    const suggestions: string[] = [];
    let followsStyle = true;
    let usesPersonality = true;
    let isNatural = true;

    // Проверяем, не упоминает ли ответ ИИ
    if (response.toLowerCase().includes('искусственный интеллект') || 
        response.toLowerCase().includes('ai') ||
        response.toLowerCase().includes('я ии') ||
        response.toLowerCase().includes('я искусственный')) {
      followsStyle = false;
      suggestions.push('Не упоминай, что ты ИИ или искусственный интеллект');
    }

    // Проверяем длину ответа
    const avgLength = systemPrompt.includes('краткий') ? 50 : 100;
    if (response.length < avgLength * 0.5) {
      suggestions.push('Ответ слишком короткий для твоего стиля');
    }

    // Проверяем наличие эмоций и междометий для энергичного стиля
    if (systemPrompt.includes('энергичный') || systemPrompt.includes('живой')) {
      const hasEmotions = /[!?]|ха|ого|вау|круто|отлично/i.test(response);
      if (!hasEmotions) {
        suggestions.push('Добавь больше эмоций и междометий');
        usesPersonality = false;
      }
    }

    // Проверяем формальность для делового стиля
    if (systemPrompt.includes('формальный') || systemPrompt.includes('деловой')) {
      const isFormal = /здравствуйте|позвольте|считаю|полагаю/i.test(response);
      if (!isFormal) {
        suggestions.push('Используй более формальный тон');
        usesPersonality = false;
      }
    }

    // Проверяем естественность
    const isRobotic = /согласно|в соответствии|как указано|как следует/i.test(response);
    if (isRobotic) {
      isNatural = false;
      suggestions.push('Избегай канцелярских выражений');
    }

    return {
      followsStyle,
      usesPersonality,
      isNatural,
      suggestions
    };
  }

  // Получить контекст с данными из таблиц
  static async getContextWithTableData(twinId: string, currentSessionId: string): Promise<string> {
    try {
      // Получаем базовый контекст из предыдущих сессий
      const baseContext = await this.getContextFromPreviousSessions(twinId, currentSessionId);
      
      // Получаем данные из подключенных таблиц
      const tableData = await DigitalTwinService.getTwinTableData(twinId);
      
      if (Object.keys(tableData).length === 0) {
        return baseContext;
      }

      // Формируем контекст с данными таблиц
      let tableContext = '\n\nДоступные данные из таблиц:\n';
      
      for (const [tableName, tableInfo] of Object.entries(tableData)) {
        const info = tableInfo as any;
        tableContext += `\nТаблица "${tableName}":\n`;
        tableContext += `- Уровень доступа: ${info.access_level}\n`;
        tableContext += `- Количество записей: ${info.data.length}\n`;
        tableContext += `- Пример данных: ${JSON.stringify(info.data.slice(0, 2))}\n`;
      }

      return baseContext + tableContext;
    } catch (error) {
      console.error('Error getting context with table data:', error);
      return await this.getContextFromPreviousSessions(twinId, currentSessionId);
    }
  }
}