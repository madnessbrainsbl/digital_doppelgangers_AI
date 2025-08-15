/*
  # Telegram User API Integration

  1. New Tables
    - `telegram_sessions`
      - `id` (uuid, primary key)
      - `user_id` (text) - ID пользователя в Telegram
      - `phone` (text) - номер телефона
      - `session_data` (jsonb) - данные сессии MTProto
      - `is_active` (boolean) - активна ли сессия
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `telegram_user_messages`
      - `id` (uuid, primary key)
      - `telegram_user_id` (text) - ID пользователя в Telegram
      - `twin_id` (uuid) - связанный двойник
      - `chat_id` (bigint) - ID чата в Telegram
      - `message_id` (bigint) - ID сообщения в Telegram
      - `content` (text) - содержимое сообщения
      - `is_voice` (boolean) - голосовое ли сообщение
      - `is_incoming` (boolean) - входящее или исходящее
      - `timestamp` (timestamp) - время сообщения
      - `created_at` (timestamp)

    - `telegram_integrations`
      - `id` (uuid, primary key)
      - `app_user_id` (text) - ID пользователя в нашем приложении
      - `telegram_user_id` (text) - ID пользователя в Telegram
      - `twin_id` (uuid) - подключенный двойник
      - `is_active` (boolean) - активна ли интеграция
      - `settings` (jsonb) - настройки интеграции
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for user access control
*/

-- Telegram Sessions Table
CREATE TABLE IF NOT EXISTS telegram_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  phone text NOT NULL,
  session_data jsonb NOT NULL DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE telegram_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own telegram sessions"
  ON telegram_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id OR user_id LIKE 'anonymous_%')
  WITH CHECK (auth.uid()::text = user_id OR user_id LIKE 'anonymous_%');

CREATE POLICY "Anonymous users can manage demo telegram sessions"
  ON telegram_sessions
  FOR ALL
  TO anon
  USING (user_id LIKE 'anonymous_%')
  WITH CHECK (user_id LIKE 'anonymous_%');

-- Telegram User Messages Table
CREATE TABLE IF NOT EXISTS telegram_user_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id text NOT NULL,
  twin_id uuid REFERENCES digital_twins(id) ON DELETE CASCADE,
  chat_id bigint NOT NULL,
  message_id bigint,
  content text NOT NULL,
  is_voice boolean DEFAULT false,
  is_incoming boolean DEFAULT true,
  timestamp timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE telegram_user_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access messages for their twins"
  ON telegram_user_messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM digital_twins 
      WHERE digital_twins.id = telegram_user_messages.twin_id 
      AND (digital_twins.user_id = auth.uid()::text OR digital_twins.user_id LIKE 'anonymous_%')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM digital_twins 
      WHERE digital_twins.id = telegram_user_messages.twin_id 
      AND (digital_twins.user_id = auth.uid()::text OR digital_twins.user_id LIKE 'anonymous_%')
    )
  );

CREATE POLICY "Anonymous users can access demo messages"
  ON telegram_user_messages
  FOR ALL
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM digital_twins 
      WHERE digital_twins.id = telegram_user_messages.twin_id 
      AND digital_twins.user_id LIKE 'anonymous_%'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM digital_twins 
      WHERE digital_twins.id = telegram_user_messages.twin_id 
      AND digital_twins.user_id LIKE 'anonymous_%'
    )
  );

-- Telegram Integrations Table
CREATE TABLE IF NOT EXISTS telegram_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_user_id text NOT NULL,
  telegram_user_id text NOT NULL,
  twin_id uuid REFERENCES digital_twins(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE telegram_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own integrations"
  ON telegram_integrations
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = app_user_id OR app_user_id LIKE 'anonymous_%')
  WITH CHECK (auth.uid()::text = app_user_id OR app_user_id LIKE 'anonymous_%');

CREATE POLICY "Anonymous users can manage demo integrations"
  ON telegram_integrations
  FOR ALL
  TO anon
  USING (app_user_id LIKE 'anonymous_%')
  WITH CHECK (app_user_id LIKE 'anonymous_%');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_telegram_sessions_user_id ON telegram_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_sessions_active ON telegram_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_telegram_user_messages_twin_id ON telegram_user_messages(twin_id);
CREATE INDEX IF NOT EXISTS idx_telegram_user_messages_chat_id ON telegram_user_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_user_messages_timestamp ON telegram_user_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_telegram_integrations_app_user_id ON telegram_integrations(app_user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_integrations_telegram_user_id ON telegram_integrations(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_integrations_twin_id ON telegram_integrations(twin_id);

-- Update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_telegram_sessions_updated_at 
  BEFORE UPDATE ON telegram_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_telegram_integrations_updated_at 
  BEFORE UPDATE ON telegram_integrations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();