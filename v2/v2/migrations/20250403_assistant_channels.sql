-- Create assistant_channels table if not exists
CREATE TABLE IF NOT EXISTS "assistant_channels" (
  "id" SERIAL PRIMARY KEY,
  "assistant_id" INTEGER NOT NULL,
  "channel_id" INTEGER NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "auto_reply" BOOLEAN NOT NULL DEFAULT true,
  "settings" JSONB DEFAULT '{}',
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now()
);

-- Modify conversations to ensure created_by can be NULL
ALTER TABLE "conversations" 
  ALTER COLUMN "created_by" DROP NOT NULL,
  ALTER COLUMN "created_by" SET DEFAULT NULL;