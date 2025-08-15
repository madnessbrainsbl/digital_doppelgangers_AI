-- Создание таблицы assistant_examples
CREATE TABLE IF NOT EXISTS "assistant_examples" (
  "id" SERIAL PRIMARY KEY,
  "assistant_id" INTEGER NOT NULL,
  "user_query" TEXT NOT NULL,
  "original_response" TEXT,
  "corrected_response" TEXT NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Индекс для быстрого поиска примеров по assistant_id
CREATE INDEX IF NOT EXISTS "assistant_examples_assistant_id_idx" ON "assistant_examples" ("assistant_id");

-- Комментарии к таблице и колонкам
COMMENT ON TABLE "assistant_examples" IS 'Примеры обучения ассистентов на основе исправленных ответов';
COMMENT ON COLUMN "assistant_examples"."assistant_id" IS 'ID ассистента';
COMMENT ON COLUMN "assistant_examples"."user_query" IS 'Запрос пользователя';
COMMENT ON COLUMN "assistant_examples"."original_response" IS 'Оригинальный ответ ассистента';
COMMENT ON COLUMN "assistant_examples"."corrected_response" IS 'Исправленный ответ'; 