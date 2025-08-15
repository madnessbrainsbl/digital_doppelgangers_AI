-- Добавляем колонку referral_code в таблицу users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- Устанавливаем значение по умолчанию для существующих пользователей
UPDATE users 
SET referral_code = '' 
WHERE referral_code IS NULL;