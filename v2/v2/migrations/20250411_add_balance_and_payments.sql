-- Добавляем колонку balance в таблицу users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS balance integer DEFAULT 0;

-- Создаем таблицу payments для работы с ЮKassa
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  description TEXT,
  payment_url TEXT,
  metadata JSONB
);