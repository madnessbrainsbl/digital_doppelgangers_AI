/*
  # Telegram Bot Integration Tables

  1. New Tables
    - `telegram_bots`
      - `id` (uuid, primary key)
      - `user_id` (text) - ID пользователя в приложении
      - `name` (text) - название бота
      - `username` (text) - username бота в Telegram
      - `token` (text) - токен бота
      - `status` (text) - статус бота (active, inactive, error)
      - `connected_twin_id` (uuid) - подключенный двойник
      - `webhook_url` (text) - URL вебхука
      - `voice_enabled` (boolean) - включены ли голосовые ответы
      - `messages_count` (integer) - количество обработанных сообщений
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `telegram_integration_messages`
      - `id` (uuid, primary key)
      - `bot_id` (uuid) - ID бота
      - `chat_id` (text) - ID чата в Telegram
      - `chat_name` (text) - название чата
      - `message_text` (text) - текст сообщения
      - `is_voice` (boolean) - голосовое ли сообщение
      - `is_incoming` (boolean) - входящее или исходящее
      - `response_text` (text) - текст ответа
      - `response_voice` (boolean) - голосовой ли ответ
      - `timestamp` (timestamp) - время сообщения
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for user access control

  3. Functions
    - Function to increment bot message count
*/

-- Telegram Bots Table
CREATE TABLE IF NOT EXISTS telegram_bots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  name text NOT NULL,
  username text NOT NULL,
  token text NOT NULL,
  status text NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error')),
  connected_twin_id uuid REFERENCES digital_twins(id) ON DELETE SET NULL,
  webhook_url text,
  voice_enabled boolean NOT NULL DEFAULT true,
  messages_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE telegram_bots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own bots"
  ON telegram_bots
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Anonymous users can manage demo bots"
  ON telegram_bots
  FOR ALL
  TO anon
  USING (user_id LIKE 'anonymous_%')
  WITH CHECK (user_id LIKE 'anonymous_%');

-- Telegram Integration Messages Table
CREATE TABLE IF NOT EXISTS telegram_integration_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid NOT NULL REFERENCES telegram_bots(id) ON DELETE CASCADE,
  chat_id text NOT NULL,
  chat_name text NOT NULL,
  message_text text NOT NULL,
  is_voice boolean NOT NULL DEFAULT false,
  is_incoming boolean NOT NULL DEFAULT true,
  response_text text,
  response_voice boolean NOT NULL DEFAULT false,
  timestamp timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE telegram_integration_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access messages for their bots"
  ON telegram_integration_messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM telegram_bots 
      WHERE telegram_bots.id = telegram_integration_messages.bot_id 
      AND telegram_bots.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM telegram_bots 
      WHERE telegram_bots.id = telegram_integration_messages.bot_id 
      AND telegram_bots.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Anonymous users can access demo bot messages"
  ON telegram_integration_messages
  FOR ALL
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM telegram_bots 
      WHERE telegram_bots.id = telegram_integration_messages.bot_id 
      AND telegram_bots.user_id LIKE 'anonymous_%'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM telegram_bots 
      WHERE telegram_bots.id = telegram_integration_messages.bot_id 
      AND telegram_bots.user_id LIKE 'anonymous_%'
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_telegram_bots_user_id ON telegram_bots(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_bots_status ON telegram_bots(status);
CREATE INDEX IF NOT EXISTS idx_telegram_bots_connected_twin_id ON telegram_bots(connected_twin_id);
CREATE INDEX IF NOT EXISTS idx_telegram_integration_messages_bot_id ON telegram_integration_messages(bot_id);
CREATE INDEX IF NOT EXISTS idx_telegram_integration_messages_chat_id ON telegram_integration_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_integration_messages_timestamp ON telegram_integration_messages(timestamp);

-- Update trigger for telegram_bots
CREATE TRIGGER update_telegram_bots_updated_at 
  BEFORE UPDATE ON telegram_bots 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment bot message count
CREATE OR REPLACE FUNCTION increment_bot_messages(bot_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE telegram_bots 
  SET messages_count = messages_count + 1,
      updated_at = now()
  WHERE id = bot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;