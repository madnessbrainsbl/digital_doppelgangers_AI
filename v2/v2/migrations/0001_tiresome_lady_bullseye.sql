CREATE TABLE "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"assistant_id" integer,
	"action" text NOT NULL,
	"details" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assistant_channels" (
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
--> statement-breakpoint
CREATE TABLE "assistant_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"assistant_id" integer NOT NULL,
	"openai_file_id" text NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text,
	"file_size" integer,
	"uploaded_by" integer NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"knowledge_item_id" integer
);
--> statement-breakpoint
CREATE TABLE "assistants" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"role" text NOT NULL,
	"status" text DEFAULT 'training' NOT NULL,
	"created_by" integer NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"prompt" text NOT NULL,
	"settings" jsonb NOT NULL,
	"openai_assistant_id" text,
	"instructions" text,
	"model" text DEFAULT 'gpt-4o'
);
--> statement-breakpoint
CREATE TABLE "channels" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'inactive' NOT NULL,
	"settings" jsonb NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel_id" integer NOT NULL,
	"assistant_id" integer,
	"user_id" integer,
	"status" text DEFAULT 'active' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"last_message_at" timestamp DEFAULT now() NOT NULL,
	"thread_id" text,
	"external_user_id" text,
	"created_by" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dialog_assistants" (
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
--> statement-breakpoint
CREATE TABLE "knowledge_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"file_type" text NOT NULL,
	"content_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"content" text,
	"uploaded_by" integer NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"path" text,
	"openai_file_id" text
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"sender_id" integer,
	"sender_type" text NOT NULL,
	"content" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"total_conversations" integer DEFAULT 0 NOT NULL,
	"total_messages" integer DEFAULT 0 NOT NULL,
	"avg_response_time" integer DEFAULT 0 NOT NULL,
	"success_rate" integer DEFAULT 0 NOT NULL,
	"topic_data" jsonb
);
--> statement-breakpoint
CREATE TABLE "referral_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"referrer_id" integer,
	"manager_id" integer,
	"amount" integer NOT NULL,
	"referral_commission" integer,
	"manager_commission" integer,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'processed' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"company" text,
	"position" text,
	"content" text NOT NULL,
	"rating" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"image_url" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"password" text,
	"role" text DEFAULT 'user' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_login" timestamp,
	"plan" text DEFAULT 'free',
	"referrer_id" integer,
	"manager_id" integer,
	"total_spent" integer DEFAULT 0,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
