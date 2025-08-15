-- Добавляем колонку priority в таблицу notification_channels
ALTER TABLE notification_channels ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 0; 