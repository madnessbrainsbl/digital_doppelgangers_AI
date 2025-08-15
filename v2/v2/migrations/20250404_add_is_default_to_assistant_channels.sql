-- Add is_default column to assistant_channels table
ALTER TABLE "assistant_channels" ADD COLUMN IF NOT EXISTS "is_default" BOOLEAN NOT NULL DEFAULT false;