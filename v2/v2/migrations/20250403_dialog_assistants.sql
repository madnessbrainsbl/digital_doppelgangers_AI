-- Создаем таблицу для настроек ассистентов для конкретных диалогов
CREATE TABLE IF NOT EXISTS dialog_assistants (
  id SERIAL PRIMARY KEY,
  channel_id INTEGER NOT NULL,
  dialog_id INTEGER NOT NULL,
  assistant_id INTEGER NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  auto_reply BOOLEAN NOT NULL DEFAULT TRUE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(channel_id, dialog_id)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_dialog_assistants_channel_id ON dialog_assistants (channel_id);
CREATE INDEX IF NOT EXISTS idx_dialog_assistants_dialog_id ON dialog_assistants (dialog_id);