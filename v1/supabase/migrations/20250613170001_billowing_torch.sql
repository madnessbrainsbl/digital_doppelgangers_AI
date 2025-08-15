/*
  # Добавление функции клонирования голоса

  1. Новые таблицы
    - `voice_clones` - таблица клонированных голосов
      - `id` (uuid, primary key)
      - `user_id` (text) - идентификатор пользователя
      - `name` (text) - название голоса
      - `status` (text) - статус обработки (processing, completed, failed)
      - `audio_file_url` (text) - URL загруженного аудио файла
      - `voice_model_id` (text) - ID модели голоса в ElevenLabs
      - `processing_data` (jsonb) - данные обработки
      - `is_paid` (boolean) - оплачен ли доступ к голосу
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Безопасность
    - Включить RLS для таблицы voice_clones
    - Добавить политики для пользователей и анонимных сессий
*/

-- Создание таблицы клонированных голосов
CREATE TABLE IF NOT EXISTS voice_clones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  audio_file_url text,
  voice_model_id text,
  processing_data jsonb NOT NULL DEFAULT '{}',
  is_paid boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Включение RLS
ALTER TABLE voice_clones ENABLE ROW LEVEL SECURITY;

-- Политики безопасности
CREATE POLICY "Users can manage their own voice clones"
  ON voice_clones
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Anonymous users can manage demo voice clones"
  ON voice_clones
  FOR ALL
  TO anon
  USING (user_id LIKE 'anonymous_%')
  WITH CHECK (user_id LIKE 'anonymous_%');

-- Индексы
CREATE INDEX IF NOT EXISTS idx_voice_clones_user_id ON voice_clones(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_clones_status ON voice_clones(status);

-- Триггер для автоматического обновления updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_voice_clones_updated_at'
  ) THEN
    CREATE TRIGGER update_voice_clones_updated_at
      BEFORE UPDATE ON voice_clones
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;