/*
  # Создание схемы для Digital Twin MVP

  1. Новые таблицы
    - `digital_twins` - основная таблица цифровых двойников
      - `id` (uuid, primary key)
      - `user_id` (text) - идентификатор пользователя
      - `name` (text) - название двойника
      - `system_prompt` (text) - системный промпт
      - `analysis_data` (jsonb) - данные анализа профиля
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `telegram_messages` - сообщения из Telegram для анализа
      - `id` (uuid, primary key)
      - `twin_id` (uuid, foreign key)
      - `content` (text) - текст сообщения
      - `is_user` (boolean) - сообщение от пользователя или собеседника
      - `timestamp` (timestamptz) - время сообщения
      - `chat_name` (text) - название чата
      - `created_at` (timestamptz)
    
    - `chat_sessions` - сессии чата с двойником
      - `id` (uuid, primary key)
      - `twin_id` (uuid, foreign key)
      - `created_at` (timestamptz)
    
    - `chat_messages` - сообщения в чате с двойником
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key)
      - `content` (text) - текст сообщения
      - `is_user` (boolean) - от пользователя или от ИИ
      - `created_at` (timestamptz)

  2. Безопасность
    - Включить RLS для всех таблиц
    - Добавить политики для чтения и записи данных
*/

-- Создание таблицы цифровых двойников
CREATE TABLE IF NOT EXISTS digital_twins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  name text NOT NULL,
  system_prompt text NOT NULL,
  analysis_data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Создание таблицы сообщений Telegram
CREATE TABLE IF NOT EXISTS telegram_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  twin_id uuid NOT NULL REFERENCES digital_twins(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_user boolean NOT NULL DEFAULT false,
  timestamp timestamptz NOT NULL,
  chat_name text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Создание таблицы сессий чата
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  twin_id uuid NOT NULL REFERENCES digital_twins(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Создание таблицы сообщений чата
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_user boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Включение RLS для всех таблиц
ALTER TABLE digital_twins ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Создание политик безопасности (пока разрешаем все операции для демо)
CREATE POLICY "Allow all operations on digital_twins"
  ON digital_twins
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on telegram_messages"
  ON telegram_messages
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on chat_sessions"
  ON chat_sessions
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on chat_messages"
  ON chat_messages
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Создание индексов для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_telegram_messages_twin_id ON telegram_messages(twin_id);
CREATE INDEX IF NOT EXISTS idx_telegram_messages_timestamp ON telegram_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_twin_id ON chat_sessions(twin_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_digital_twins_user_id ON digital_twins(user_id);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для автоматического обновления updated_at в digital_twins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_digital_twins_updated_at'
  ) THEN
    CREATE TRIGGER update_digital_twins_updated_at
      BEFORE UPDATE ON digital_twins
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;