export interface Database {
  public: {
    Tables: {
      digital_twins: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          system_prompt: string;
          analysis_data: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          system_prompt: string;
          analysis_data: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          system_prompt?: string;
          analysis_data?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_sessions: {
        Row: {
          id: string;
          twin_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          twin_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          twin_id?: string;
          created_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          session_id: string;
          content: string;
          is_user: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          content: string;
          is_user: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          content?: string;
          is_user?: boolean;
          created_at?: string;
        };
      };
      telegram_messages: {
        Row: {
          id: string;
          twin_id: string;
          content: string;
          is_user: boolean;
          timestamp: string;
          chat_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          twin_id: string;
          content: string;
          is_user: boolean;
          timestamp: string;
          chat_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          twin_id?: string;
          content?: string;
          is_user?: boolean;
          timestamp?: string;
          chat_name?: string;
          created_at?: string;
        };
      };
      voice_clones: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          status: string;
          audio_file_url: string | null;
          voice_model_id: string | null;
          processing_data: any;
          is_paid: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          status?: string;
          audio_file_url?: string | null;
          voice_model_id?: string | null;
          processing_data?: any;
          is_paid?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          status?: string;
          audio_file_url?: string | null;
          voice_model_id?: string | null;
          processing_data?: any;
          is_paid?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      telegram_bots: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          username: string;
          token: string;
          status: string;
          connected_twin_id: string | null;
          webhook_url: string | null;
          voice_enabled: boolean;
          messages_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          username: string;
          token: string;
          status?: string;
          connected_twin_id?: string | null;
          webhook_url?: string | null;
          voice_enabled?: boolean;
          messages_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          username?: string;
          token?: string;
          status?: string;
          connected_twin_id?: string | null;
          webhook_url?: string | null;
          voice_enabled?: boolean;
          messages_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      telegram_integration_messages: {
        Row: {
          id: string;
          bot_id: string;
          chat_id: string;
          chat_name: string;
          message_text: string;
          is_voice: boolean;
          is_incoming: boolean;
          response_text: string | null;
          response_voice: boolean;
          timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          bot_id: string;
          chat_id: string;
          chat_name: string;
          message_text: string;
          is_voice?: boolean;
          is_incoming?: boolean;
          response_text?: string | null;
          response_voice?: boolean;
          timestamp: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          bot_id?: string;
          chat_id?: string;
          chat_name?: string;
          message_text?: string;
          is_voice?: boolean;
          is_incoming?: boolean;
          response_text?: string | null;
          response_voice?: boolean;
          timestamp?: string;
          created_at?: string;
        };
      };
      data_tables: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          table_schema: any;
          sample_data: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          table_schema?: any;
          sample_data?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          table_schema?: any;
          sample_data?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      twin_data_table_connections: {
        Row: {
          id: string;
          twin_id: string;
          table_id: string;
          access_level: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          twin_id: string;
          table_id: string;
          access_level?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          twin_id?: string;
          table_id?: string;
          access_level?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      data_table_queries: {
        Row: {
          id: string;
          twin_id: string;
          table_id: string;
          query_type: string;
          query_text: string;
          result_count: number | null;
          execution_time: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          twin_id: string;
          table_id: string;
          query_type: string;
          query_text: string;
          result_count?: number | null;
          execution_time?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          twin_id?: string;
          table_id?: string;
          query_type?: string;
          query_text?: string;
          result_count?: number | null;
          execution_time?: number | null;
          created_at?: string;
        };
      };
    };
  };
}