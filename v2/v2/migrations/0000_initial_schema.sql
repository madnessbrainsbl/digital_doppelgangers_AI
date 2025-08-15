CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT,
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT,
  "role" TEXT NOT NULL DEFAULT 'user',
  "status" TEXT NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "last_login" TIMESTAMP,
  "plan" TEXT DEFAULT 'free',
  "referrer_id" INTEGER,
  "manager_id" INTEGER,
  "total_spent" INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "assistants" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "role" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'inactive',
  "created_by" INTEGER NOT NULL,
  "last_updated" TIMESTAMP NOT NULL DEFAULT NOW(),
  "prompt" TEXT NOT NULL,
  "settings" JSONB NOT NULL,
  "openai_assistant_id" TEXT,
  "instructions" TEXT,
  "model" TEXT DEFAULT 'gpt-4o'
);

CREATE TABLE IF NOT EXISTS "knowledge_items" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "file_type" TEXT NOT NULL,
  "content_type" TEXT NOT NULL,
  "file_size" INTEGER NOT NULL,
  "content" TEXT,
  "uploaded_by" INTEGER NOT NULL,
  "uploaded_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "path" TEXT,
  "openai_file_id" TEXT
);

CREATE TABLE IF NOT EXISTS "assistant_files" (
  "id" SERIAL PRIMARY KEY,
  "assistant_id" INTEGER NOT NULL,
  "openai_file_id" TEXT NOT NULL,
  "file_name" TEXT NOT NULL,
  "file_type" TEXT,
  "file_size" INTEGER,
  "uploaded_by" INTEGER NOT NULL,
  "uploaded_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "knowledge_item_id" INTEGER
);

CREATE TABLE IF NOT EXISTS "channels" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'inactive',
  "settings" JSONB NOT NULL,
  "created_by" INTEGER NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "conversations" (
  "id" SERIAL PRIMARY KEY,
  "channel_id" INTEGER NOT NULL,
  "assistant_id" INTEGER,
  "user_id" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'active',
  "started_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "last_message_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "thread_id" TEXT
);

CREATE TABLE IF NOT EXISTS "messages" (
  "id" SERIAL PRIMARY KEY,
  "conversation_id" INTEGER NOT NULL,
  "sender_id" INTEGER,
  "sender_type" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
  "metadata" JSONB
);

CREATE TABLE IF NOT EXISTS "metrics" (
  "id" SERIAL PRIMARY KEY,
  "date" TIMESTAMP NOT NULL DEFAULT NOW(),
  "total_conversations" INTEGER NOT NULL DEFAULT 0,
  "avg_response_time" INTEGER NOT NULL DEFAULT 0,
  "success_rate" INTEGER NOT NULL DEFAULT 0,
  "topic_data" JSONB
);

CREATE TABLE IF NOT EXISTS "activity_logs" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER,
  "assistant_id" INTEGER,
  "action" TEXT NOT NULL,
  "details" JSONB,
  "timestamp" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "referral_transactions" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "referrer_id" INTEGER,
  "manager_id" INTEGER,
  "amount" INTEGER NOT NULL,
  "referral_commission" INTEGER,
  "manager_commission" INTEGER,
  "description" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "status" TEXT NOT NULL DEFAULT 'processed'
);