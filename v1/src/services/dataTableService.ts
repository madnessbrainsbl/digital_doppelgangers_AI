import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type DataTable = Database['public']['Tables']['data_tables']['Row'];
type DataTableInsert = Database['public']['Tables']['data_tables']['Insert'];
type DataTableUpdate = Database['public']['Tables']['data_tables']['Update'];

type TwinDataTableConnection = Database['public']['Tables']['twin_data_table_connections']['Row'];
type TwinDataTableConnectionInsert = Database['public']['Tables']['twin_data_table_connections']['Insert'];

export interface TableSchema {
  name: string;
  type: 'text' | 'integer' | 'numeric' | 'boolean' | 'date' | 'timestamp';
  required?: boolean;
  description?: string;
}

export interface DataTableQuery {
  query_type: 'select' | 'insert' | 'update' | 'delete';
  query_data: any;
}

export class DataTableService {
  // Получить все таблицы пользователя
  static async getUserTables(): Promise<DataTable[]> {
    const { data, error } = await supabase
      .from('data_tables')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user tables:', error);
      throw error;
    }

    return data || [];
  }

  // Создать новую таблицу
  static async createTable(tableData: DataTableInsert): Promise<DataTable> {
    const { data, error } = await supabase
      .from('data_tables')
      .insert(tableData)
      .select()
      .single();

    if (error) {
      console.error('Error creating table:', error);
      throw error;
    }

    return data;
  }

  // Обновить таблицу
  static async updateTable(id: string, updates: DataTableUpdate): Promise<DataTable> {
    const { data, error } = await supabase
      .from('data_tables')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating table:', error);
      throw error;
    }

    return data;
  }

  // Удалить таблицу
  static async deleteTable(id: string): Promise<void> {
    const { error } = await supabase
      .from('data_tables')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting table:', error);
      throw error;
    }
  }

  // Получить таблицу по ID
  static async getTableById(id: string): Promise<DataTable | null> {
    const { data, error } = await supabase
      .from('data_tables')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching table:', error);
      throw error;
    }

    return data;
  }

  // Получить подключенные таблицы для двойника
  static async getTwinConnectedTables(twinId: string): Promise<TwinDataTableConnection[]> {
    const { data, error } = await supabase
      .from('twin_data_table_connections')
      .select(`
        *,
        data_tables (
          id,
          name,
          description,
          table_schema,
          sample_data
        )
      `)
      .eq('twin_id', twinId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching twin connected tables:', error);
      throw error;
    }

    return data || [];
  }

  // Подключить таблицу к двойнику
  static async connectTableToTwin(connectionData: TwinDataTableConnectionInsert): Promise<TwinDataTableConnection> {
    const { data, error } = await supabase
      .from('twin_data_table_connections')
      .insert(connectionData)
      .select()
      .single();

    if (error) {
      console.error('Error connecting table to twin:', error);
      throw error;
    }

    return data;
  }

  // Отключить таблицу от двойника
  static async disconnectTableFromTwin(twinId: string, tableId: string): Promise<void> {
    const { error } = await supabase
      .from('twin_data_table_connections')
      .delete()
      .eq('twin_id', twinId)
      .eq('table_id', tableId);

    if (error) {
      console.error('Error disconnecting table from twin:', error);
      throw error;
    }
  }

  // Обновить уровень доступа к таблице
  static async updateTableAccess(twinId: string, tableId: string, accessLevel: string): Promise<void> {
    const { error } = await supabase
      .from('twin_data_table_connections')
      .update({ access_level: accessLevel })
      .eq('twin_id', twinId)
      .eq('table_id', tableId);

    if (error) {
      console.error('Error updating table access:', error);
      throw error;
    }
  }

  // Выполнить запрос к таблице
  static async executeTableQuery(tableId: string, query: DataTableQuery): Promise<any> {
    const { data, error } = await supabase
      .rpc('execute_data_table_query', {
        p_table_id: tableId,
        p_query_type: query.query_type,
        p_query_data: query.query_data
      });

    if (error) {
      console.error('Error executing table query:', error);
      throw error;
    }

    return data;
  }

  // Получить историю запросов для таблицы
  static async getTableQueryHistory(tableId: string, limit: number = 50): Promise<any[]> {
    const { data, error } = await supabase
      .from('data_table_queries')
      .select('*')
      .eq('table_id', tableId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching table query history:', error);
      throw error;
    }

    return data || [];
  }

  // Валидировать схему таблицы
  static validateTableSchema(schema: TableSchema[]): boolean {
    if (!Array.isArray(schema)) {
      return false;
    }

    for (const column of schema) {
      if (!column.name || !column.type) {
        return false;
      }

      const validTypes = ['text', 'integer', 'numeric', 'boolean', 'date', 'timestamp'];
      if (!validTypes.includes(column.type)) {
        return false;
      }
    }

    return true;
  }

  // Создать пример данных на основе схемы
  static generateSampleData(schema: TableSchema[], count: number = 5): any[] {
    const sampleData = [];

    for (let i = 0; i < count; i++) {
      const row: any = {};
      
      for (const column of schema) {
        switch (column.type) {
          case 'text':
            row[column.name] = `Sample ${column.name} ${i + 1}`;
            break;
          case 'integer':
            row[column.name] = Math.floor(Math.random() * 1000);
            break;
          case 'numeric':
            row[column.name] = parseFloat((Math.random() * 1000).toFixed(2));
            break;
          case 'boolean':
            row[column.name] = Math.random() > 0.5;
            break;
          case 'date':
            row[column.name] = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            break;
          case 'timestamp':
            row[column.name] = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString();
            break;
        }
      }
      
      sampleData.push(row);
    }

    return sampleData;
  }

  // Получить доступные таблицы для подключения к двойнику
  static async getAvailableTablesForTwin(twinId: string): Promise<DataTable[]> {
    // Получаем все таблицы пользователя
    const allTables = await this.getUserTables();
    
    // Получаем уже подключенные таблицы
    const connectedTables = await this.getTwinConnectedTables(twinId);
    const connectedTableIds = connectedTables.map(ct => ct.table_id);
    
    // Возвращаем только те таблицы, которые еще не подключены
    return allTables.filter(table => !connectedTableIds.includes(table.id));
  }
} 