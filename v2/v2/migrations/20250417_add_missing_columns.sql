-- Добавление колонки balance в таблицу users, если её ещё нет
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'balance'
    ) THEN
        ALTER TABLE users ADD COLUMN balance integer DEFAULT 0;
    END IF;
END $$;

-- Добавление колонки referral_code в таблицу users, если её ещё нет
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'referral_code'
    ) THEN
        ALTER TABLE users ADD COLUMN referral_code text;
    END IF;
END $$;

-- Добавление колонки referral_commission в таблицу users, если её ещё нет
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'referral_commission'
    ) THEN
        ALTER TABLE users ADD COLUMN referral_commission integer DEFAULT 0;
    END IF;
END $$;