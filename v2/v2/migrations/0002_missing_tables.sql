-- Создание таблицы assistant_channels, если она не существует
CREATE TABLE IF NOT EXISTS "assistant_channels" (
    "id" serial PRIMARY KEY NOT NULL,
    "assistant_id" integer NOT NULL,
    "channel_id" integer NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "auto_reply" boolean DEFAULT true NOT NULL,
    "is_default" boolean DEFAULT false NOT NULL,
    "settings" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Создание таблицы dialog_assistants, если она не существует
CREATE TABLE IF NOT EXISTS "dialog_assistants" (
    "id" serial PRIMARY KEY NOT NULL,
    "channel_id" integer NOT NULL,
    "dialog_id" text NOT NULL,
    "assistant_id" integer NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "auto_reply" boolean DEFAULT true NOT NULL,
    "settings" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);