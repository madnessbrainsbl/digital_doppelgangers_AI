-- Add total_messages column to metrics table
ALTER TABLE metrics ADD COLUMN IF NOT EXISTS total_messages INTEGER NOT NULL DEFAULT 0;