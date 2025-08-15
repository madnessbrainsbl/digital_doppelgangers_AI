
-- Добавляем колонку referral_commission в таблицу users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS referral_commission INTEGER DEFAULT 0;
