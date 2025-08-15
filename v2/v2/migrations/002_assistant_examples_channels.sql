-- Добавляем поля для связи исправлений с каналами и диалогами
ALTER TABLE "assistant_examples" 
ADD COLUMN "channel_id" INTEGER,
ADD COLUMN "conversation_id" TEXT;

-- Добавляем индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS "assistant_examples_channel_conversation_idx" 
ON "assistant_examples" ("channel_id", "conversation_id");

-- Комментарии к новым колонкам
COMMENT ON COLUMN "assistant_examples"."channel_id" IS 'ID канала, где было сделано исправление';
COMMENT ON COLUMN "assistant_examples"."conversation_id" IS 'ID диалога/разговора, где было сделано исправление'; 