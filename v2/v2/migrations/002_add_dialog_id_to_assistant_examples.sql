-- Добавление поля dialog_id в таблицу assistant_examples
ALTER TABLE "assistant_examples" 
ADD COLUMN "dialog_id" TEXT;

-- Индекс для быстрого поиска по dialog_id и channel_id
CREATE INDEX IF NOT EXISTS "assistant_examples_dialog_channel_idx" 
ON "assistant_examples" ("dialog_id", "channel_id");

-- Комментарий к новому полю
COMMENT ON COLUMN "assistant_examples"."dialog_id" IS 'ID диалога в конкретном сервисе (peerId для ВК, chatId для Авито, dialogId для Веб)';

-- Обновляем существующие записи: заполняем dialog_id из conversation_id для совместимости
UPDATE "assistant_examples" 
SET "dialog_id" = "conversation_id" 
WHERE "dialog_id" IS NULL AND "conversation_id" IS NOT NULL; 