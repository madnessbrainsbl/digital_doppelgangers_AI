-- Добавление поля sms_limit в таблицу tariff_plans
ALTER TABLE tariff_plans 
ADD COLUMN sms_limit INTEGER NOT NULL DEFAULT 0;

-- Добавление полей sms_used и sms_limit в таблицу user_plan_usage
ALTER TABLE user_plan_usage 
ADD COLUMN sms_used INTEGER NOT NULL DEFAULT 0,
ADD COLUMN sms_limit INTEGER NOT NULL DEFAULT 0;

-- Обновление существующих тарифных планов с количеством SMS
UPDATE tariff_plans 
SET sms_limit = CASE 
    WHEN id = 'basic' THEN 0
    WHEN id = 'standard' THEN 200
    WHEN id = 'enterprise' THEN 1000
    ELSE 0
END;

-- Обновление существующих записей использования тарифов
UPDATE user_plan_usage 
SET sms_limit = CASE 
    WHEN plan = 'basic' THEN 0
    WHEN plan = 'standard' THEN 200
    WHEN plan = 'enterprise' THEN 1000
    ELSE 0
END; 