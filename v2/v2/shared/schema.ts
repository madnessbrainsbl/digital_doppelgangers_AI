import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  jsonb,
  decimal,
  date,
  real,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name"), // Имя пользователя (необязательное)
  email: text("email").unique(), // Email (может быть null при авторизации по телефону)
  phone: text("phone").unique(), // Номер телефона (используется для авторизации, может быть null при авторизации по email)
  password: text("password"), // Хэш пароля или одноразового кода (для аутентификации)
  role: text("role").notNull().default("user"), // "user", "admin", "referral", "manager"
  status: text("status").notNull().default("active"), // Статус пользователя
  createdAt: timestamp("created_at").notNull().defaultNow(), // Дата регистрации
  lastLogin: timestamp("last_login"), // Дата последнего входа
  plan: text("plan").default("free"), // Тарифный план
  referrerId: integer("referrer_id"), // ID пользователя-реферала, который пригласил
  managerId: integer("manager_id"), // ID менеджера, который ведет пользователя
  totalSpent: integer("total_spent").default(0), // Общая сумма, потраченная пользователем (для расчета комиссий)
  balance: integer("balance").default(0), // Баланс пользователя (для пополнения через ЮKassa)
  referralCode: text("referral_code"), // Уникальный реферальный код пользователя
  referralCommission: integer("referral_commission").default(0), // Комиссия полученная от рефералов
  trialUsed: boolean("trial_used").default(false), // Использовал ли пользователь пробный период
  trialEndDate: timestamp("trial_end_date"), // Дата окончания пробного периода
});

export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  phone: true,
  password: true,
  role: true,
  status: true,
  createdAt: true,
  lastLogin: true,
  plan: true,
  referrerId: true,
  managerId: true,
  totalSpent: true,
  balance: true,
  referralCode: true,
  referralCommission: true,
  trialUsed: true,
  trialEndDate: true,
});

// Добавляем модификацию к схеме, чтобы email мог быть null
export const insertUserWithPhoneSchema = insertUserSchema.extend({
  email: z.string().nullable(),
});

// Assistants
export const assistants = pgTable("assistants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  role: text("role").notNull(),
  status: text("status").notNull().default("training"),
  createdBy: integer("created_by").notNull(),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  prompt: text("prompt").notNull(),
  settings: jsonb("settings").notNull(),
  // OpenAI assistant ID
  openaiAssistantId: text("openai_assistant_id"),
  // Добавленные для OpenAI Assistants
  instructions: text("instructions"),
  model: text("model").default("gpt-4o"),
});

export const insertAssistantSchema = createInsertSchema(assistants).pick({
  name: true,
  description: true,
  role: true,
  status: true,
  createdBy: true,
  prompt: true,
  settings: true,
  openaiAssistantId: true,
  instructions: true,
  model: true,
});

// Knowledge Base
export const knowledgeItems = pgTable("knowledge_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  fileType: text("file_type").notNull(),
  contentType: text("content_type").notNull(),
  fileSize: integer("file_size").notNull(),
  content: text("content"),
  uploadedBy: integer("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  path: text("path"),
  openaiFileId: text("openai_file_id"), // ID файла в OpenAI API
});

export const insertKnowledgeItemSchema = createInsertSchema(
  knowledgeItems
).pick({
  title: true,
  fileType: true,
  contentType: true,
  fileSize: true,
  content: true,
  uploadedBy: true,
  path: true,
  openaiFileId: true,
});

// Assistant Files
export const assistantFiles = pgTable("assistant_files", {
  id: serial("id").primaryKey(),
  assistantId: integer("assistant_id").notNull(),
  openaiFileId: text("openai_file_id").notNull(), // OpenAI File ID
  fileName: text("file_name").notNull(),
  fileType: text("file_type"),
  fileSize: integer("file_size"),
  uploadedBy: integer("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  knowledgeItemId: integer("knowledge_item_id"), // Ссылка на элемент базы знаний, если файл взят оттуда
});

export const insertAssistantFileSchema = createInsertSchema(
  assistantFiles
).pick({
  assistantId: true,
  openaiFileId: true,
  fileName: true,
  fileType: true,
  fileSize: true,
  uploadedBy: true,
  knowledgeItemId: true,
});

// Channels
export const channels = pgTable("channels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull().default("inactive"),
  settings: jsonb("settings").notNull(),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertChannelSchema = createInsertSchema(channels).pick({
  name: true,
  type: true,
  status: true,
  settings: true,
  createdBy: true,
});

// Специальная схема валидации для SMS каналов
export const smsChannelSettingsSchema = z.object({
  email: z.string().email("Введите корректный email"),
  apiKey: z.string().min(3, "API ключ обязателен"),
  sender: z.string().optional(),
});

// Conversations
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").notNull(),
  assistantId: integer("assistant_id"),
  userId: integer("user_id"),
  status: text("status").notNull().default("active"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
  // OpenAI Thread ID для API
  threadId: text("thread_id"),
  // ID пользователя во внешней системе (VK, Telegram и т.д.)
  externalUserId: text("external_user_id"),
  // ID пользователя, создавшего разговор
  createdBy: integer("created_by").notNull().default(0),
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  channelId: true,
  assistantId: true,
  userId: true,
  status: true,
  threadId: true,
  externalUserId: true,
  createdBy: true,
});

// Messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  senderId: integer("sender_id"),
  senderType: text("sender_type").notNull(), // "user", "assistant", "system"
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  metadata: jsonb("metadata"), // Для хранения дополнительной информации (openaiMessageId, threadId, runId и т.д.)
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  conversationId: true,
  senderId: true,
  senderType: true,
  content: true,
  metadata: true,
});

// Analytics
export const metrics = pgTable("metrics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull().defaultNow(),
  totalConversations: integer("total_conversations").notNull().default(0),
  totalMessages: integer("total_messages").notNull().default(0),
  avgResponseTime: integer("avg_response_time").notNull().default(0),
  successRate: integer("success_rate").notNull().default(0),
  topicData: jsonb("topic_data"),
});

export const insertMetricSchema = createInsertSchema(metrics).pick({
  date: true,
  totalConversations: true,
  totalMessages: true,
  avgResponseTime: true,
  successRate: true,
  topicData: true,
});

// Activity Log
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  assistantId: integer("assistant_id"),
  action: text("action").notNull(),
  details: jsonb("details"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).pick({
  userId: true,
  assistantId: true,
  action: true,
  details: true,
});

// Referral Transactions
export const referralTransactions = pgTable("referral_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // ID пользователя, который совершил платеж
  referrerId: integer("referrer_id"), // ID реферала
  managerId: integer("manager_id"), // ID менеджера
  amount: integer("amount").notNull(), // Сумма транзакции
  referralCommission: integer("referral_commission"), // Комиссия реферала (20%)
  managerCommission: integer("manager_commission"), // Комиссия менеджера (10%)
  description: text("description"), // Описание транзакции
  createdAt: timestamp("created_at").notNull().defaultNow(), // Дата создания
  status: text("status").notNull().default("processed"), // Статус: processed, pending, failed
});

export const insertReferralTransactionSchema = createInsertSchema(
  referralTransactions
).pick({
  userId: true,
  referrerId: true,
  managerId: true,
  amount: true,
  referralCommission: true,
  managerCommission: true,
  description: true,
  status: true,
});

// Assistant Channels
export const assistantChannels = pgTable("assistant_channels", {
  id: serial("id").primaryKey(),
  assistantId: integer("assistant_id").notNull(),
  channelId: integer("channel_id").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  autoReply: boolean("auto_reply").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAssistantChannelSchema = createInsertSchema(
  assistantChannels
).pick({
  assistantId: true,
  channelId: true,
  enabled: true,
  autoReply: true,
  isDefault: true,
  settings: true,
});

// Dialog Assistants
export const dialogAssistants = pgTable("dialog_assistants", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").notNull(),
  dialogId: text("dialog_id").notNull(), // Используем text для совместимости с Avito и другими сервисами
  assistantId: integer("assistant_id").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  autoReply: boolean("auto_reply").notNull().default(true),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDialogAssistantSchema = createInsertSchema(
  dialogAssistants
).pick({
  channelId: true,
  dialogId: true,
  assistantId: true,
  enabled: true,
  autoReply: true,
  settings: true,
});

// Testimonials (отзывы клиентов)
export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // Автор отзыва
  name: text("name").notNull(), // Имя автора
  company: text("company"), // Компания автора (опционально)
  position: text("position"), // Должность автора (опционально)
  content: text("content").notNull(), // Содержание отзыва
  rating: integer("rating").notNull(), // Оценка от 1 до 5
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").notNull().defaultNow(), // Дата создания
  imageUrl: text("image_url"), // URL аватара пользователя (опционально)
});

export const insertTestimonialSchema = createInsertSchema(testimonials).pick({
  userId: true,
  name: true,
  company: true,
  position: true,
  content: true,
  rating: true,
  status: true,
  imageUrl: true,
});

// Email Campaigns (подписка по почте)
export const emailCampaigns = pgTable("email_campaigns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // ID пользователя, создавшего рассылку
  channelId: integer("channel_id").notNull(), // ID канала, через который отправлена рассылка
  name: text("name").notNull(), // Название рассылки
  subject: text("subject").notNull(), // Тема письма
  message: text("message").notNull(), // Текст сообщения
  templateType: text("template_type").notNull().default("standard"), // Тип шаблона (standard, info, marketing)
  recipientCount: integer("recipient_count").notNull(), // Количество получателей в рассылке
  successCount: integer("success_count").notNull().default(0), // Количество успешно отправленных писем
  failedCount: integer("failed_count").notNull().default(0), // Количество неудачных отправок
  status: text("status").notNull().default("completed"), // Статус рассылки (completed, failed, in_progress)
  createdAt: timestamp("created_at").notNull().defaultNow(), // Дата создания рассылки
});

export const insertEmailCampaignSchema = createInsertSchema(
  emailCampaigns
).omit({
  id: true,
});

// Примеры обучения ассистентов
export const assistantExamples = pgTable("assistant_examples", {
  id: serial("id").primaryKey(),
  assistantId: integer("assistant_id").notNull(), // ID ассистента
  userQuery: text("user_query").notNull(), // Запрос пользователя
  originalResponse: text("original_response"), // Оригинальный ответ ассистента
  correctedResponse: text("corrected_response").notNull(), // Исправленный ответ
  channelId: integer("channel_id"), // ID канала, где было сделано исправление
  conversationId: text("conversation_id"), // ID диалога/разговора (внутренний)
  dialogId: text("dialog_id"), // ID диалога в конкретном сервисе (peerId для ВК, chatId для Авито, dialogId для Веб)
  createdAt: timestamp("created_at").notNull().defaultNow(), // Дата создания примера
  updatedAt: timestamp("updated_at").notNull().defaultNow(), // Дата обновления примера
});

// Платежи ЮKassa
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // ID пользователя, который совершает платеж
  amount: integer("amount").notNull(), // Сумма платежа в копейках
  paymentId: text("payment_id"), // ID платежа в системе ЮKassa
  status: text("status").notNull().default("pending"), // pending, succeeded, canceled, waiting_for_capture
  createdAt: timestamp("created_at").notNull().defaultNow(), // Дата создания платежа
  completedAt: timestamp("completed_at"), // Дата завершения платежа
  description: text("description"), // Описание платежа
  paymentUrl: text("payment_url"), // URL для перехода к оплате
  metadata: jsonb("metadata"), // Дополнительные данные от ЮKassa
});

export const insertPaymentSchema = createInsertSchema(payments).pick({
  userId: true,
  amount: true,
  paymentId: true,
  status: true,
  description: true,
  paymentUrl: true,
  metadata: true,
  completedAt: true,
});

// Таблица тарифных планов
export const tariffPlans = pgTable("tariff_plans", {
  id: text("id").primaryKey(), // basic, standart, enterprise
  name: text("name").notNull(), // Название тарифа
  price: integer("price").notNull(), // Цена в копейках
  period: text("period").notNull().default("month"), // Период (month, year)
  messagesLimit: integer("messages_limit").notNull(), // Лимит сообщений
  knowledgeLimit: decimal("knowledge_limit", {
    precision: 10,
    scale: 2,
  }).notNull(), // Лимит базы знаний в ГБ
  callMinutesLimit: integer("call_minutes_limit").notNull(), // Лимит минут звонков
  smsLimit: integer("sms_limit").notNull().default(0), // Лимит SMS сообщений
  usersLimit: integer("users_limit").notNull(), // Лимит пользователей
  apiCallsLimit: integer("api_calls_limit").notNull(), // Лимит API вызовов
  assistantsLimit: integer("assistants_limit").notNull(), // Лимит ассистентов
  channelsLimit: integer("channels_limit").notNull(), // Лимит каналов
  features: jsonb("features").default([]), // Список особенностей плана
  isPopular: boolean("is_popular").default(false), // Популярный план (для выделения)
  color: text("color").default("blue"), // Цвет для отображения
  active: boolean("active").default(true), // Активен ли тариф
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Схема для вставки новых тарифов
export const insertTariffPlanSchema = createInsertSchema(tariffPlans).omit({
  createdAt: true,
  updatedAt: true,
});

// Таблица использования тарифного плана
export const userPlanUsage = pgTable("user_plan_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  plan: text("plan").notNull(), // basic, standart, enterprise
  messagesUsed: integer("messages_used").notNull().default(0),
  messagesLimit: integer("messages_limit").notNull().default(1000),
  knowledgeUsed: decimal("knowledge_used", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  knowledgeLimit: decimal("knowledge_limit", { precision: 10, scale: 2 })
    .notNull()
    .default("0.5"),
  callMinutesUsed: integer("call_minutes_used").notNull().default(0),
  callMinutesLimit: integer("call_minutes_limit").notNull().default(0),
  smsUsed: integer("sms_used").notNull().default(0),
  smsLimit: integer("sms_limit").notNull().default(0),
  usersUsed: integer("users_used").notNull().default(1),
  usersLimit: integer("users_limit").notNull().default(2),
  apiCallsUsed: integer("api_calls_used").notNull().default(0),
  apiCallsLimit: integer("api_calls_limit").notNull().default(0),
  assistantsUsed: integer("assistants_used").notNull().default(0),
  assistantsLimit: integer("assistants_limit").notNull().default(1),
  channelsUsed: integer("channels_used").notNull().default(0),
  channelsLimit: integer("channels_limit").notNull().default(2),
  nextReset: date("next_reset").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Схема для вставки новых записей использования тарифов
export const insertUserPlanUsageSchema = createInsertSchema(userPlanUsage).omit(
  {
    id: true,
    createdAt: true,
    updatedAt: true,
  }
);

// Notification Channels (каналы оповещений)
export const notificationChannels = pgTable("notification_channels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // telegram, email, webhook, etc.
  status: text("status").notNull().default("active"),
  priority: integer("priority").notNull().default(0), // Приоритет отправки уведомлений
  settings: jsonb("settings").notNull(),
  createdBy: integer("created_by").notNull(),
  lastUsed: timestamp("last_used"), // Дата последнего использования
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Схема валидации для типов каналов
export const notificationChannelTypes = [
  "telegram",
  "email",
  "webhook",
  "sms",
] as const;
export type NotificationChannelType = (typeof notificationChannelTypes)[number];

// Схема валидации для настроек каналов
export const notificationChannelSettingsSchema = z.object({
  // Общие настройки
  enabled: z.boolean().default(true),
  retryCount: z.number().min(0).max(5).default(3),
  retryDelay: z.number().min(1000).max(60000).default(5000),

  // Настройки для разных типов каналов
  telegram: z
    .object({
      botToken: z.string().optional(),
      chatId: z.string().optional(),
    })
    .optional(),

  email: z
    .object({
      smtpHost: z.string().optional(),
      smtpPort: z.number().optional(),
      username: z.string().optional(),
      password: z.string().optional(),
      fromEmail: z.string().email().optional(),
    })
    .optional(),

  webhook: z
    .object({
      url: z.string().url().optional(),
      method: z.enum(["GET", "POST", "PUT"]).optional(),
      headers: z.record(z.string()).optional(),
    })
    .optional(),

  sms: z
    .object({
      provider: z.string().optional(),
      apiKey: z.string().optional(),
      sender: z.string().optional(),
    })
    .optional(),
});

export const insertNotificationChannelSchema = createInsertSchema(
  notificationChannels
)
  .pick({
    name: true,
    type: true,
    status: true,
    priority: true,
    settings: true,
    createdBy: true,
  })
  .extend({
    type: z.enum(notificationChannelTypes),
    settings: notificationChannelSettingsSchema,
  });

// Function Assistants (связь между функциями и ассистентами)
export const functionAssistants = pgTable("function_assistants", {
  id: serial("id").primaryKey(),
  functionId: integer("function_id")
    .notNull()
    .references(() => openAiFunctions.id, { onDelete: "cascade" }),
  assistantId: integer("assistant_id")
    .notNull()
    .references(() => assistants.id, { onDelete: "cascade" }),
  notificationChannelId: integer("notification_channel_id")
    .notNull()
    .references(() => notificationChannels.id, { onDelete: "cascade" }),
  enabled: boolean("enabled").notNull().default(true),
  channelEnabled: boolean("channel_enabled").notNull().default(true),
  settings: jsonb("settings").default({}),
  lastUsed: timestamp("last_used"), // Дата последнего использования
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFunctionAssistantSchema = createInsertSchema(
  functionAssistants
).pick({
  functionId: true,
  assistantId: true,
  notificationChannelId: true,
  enabled: true,
  channelEnabled: true,
  settings: true,
});

// OpenAI Functions (функции для Function Calling)
export const openAiFunctions = pgTable("openai_functions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  parameters: jsonb("parameters").notNull(), // JSON Schema для параметров функции
  channelId: integer("channel_id").references(() => notificationChannels.id, {
    onDelete: "cascade",
  }),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertOpenAiFunctionSchema = createInsertSchema(
  openAiFunctions
).pick({
  name: true,
  description: true,
  parameters: true,
  channelId: true,
  createdBy: true,
});

// Telephony Numbers (номера телефонии пользователей)
export const telephonyNumbers = pgTable("telephony_numbers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  phone_number: text("phone_number").notNull(),
  phone_price: decimal("phone_price", { precision: 10, scale: 4 }).notNull(),
  phone_region_name: text("phone_region_name").notNull(),
  phone_country_code: text("phone_country_code").notNull(),
  phone_category_name: text("phone_category_name"),
  phone_purchase_date: timestamp("phone_purchase_date").notNull(),
  phone_next_renewal: timestamp("phone_next_renewal").notNull(),
  account_id: integer("account_id"),
  auto_charge: boolean("auto_charge").default(true),
  can_be_used: boolean("can_be_used").default(true),
  category_name: text("category_name"),
  deactivated: boolean("deactivated").default(false),
  is_sms_enabled: boolean("is_sms_enabled").default(false),
  is_sms_supported: boolean("is_sms_supported").default(false),
  issues: jsonb("issues").default([]),
  modified: timestamp("modified"),
  phone_id: integer("phone_id"),
  phone_region_id: integer("phone_region_id"),
  subscription_id: integer("subscription_id"),
  verification_status: text("verification_status"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTelephonyNumberSchema = createInsertSchema(
  telephonyNumbers
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Добавляем схему для истории звонков
export const telephonyCallHistory = pgTable("telephony_call_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  callerNumber: text("caller_number").notNull(),
  calleeNumber: text("callee_number").notNull(),
  callDuration: integer("call_duration").default(0),
  callCost: real("call_cost").default(0),
  recordUrl: text("record_url"),
  callStatus: text("call_status").notNull(),
  callType: text("call_type").notNull(),
  callTime: timestamp("call_time").defaultNow(),
  chatHistory: jsonb("chat_history"),
  assistantId: integer("assistant_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Добавляем схему для параметров входящих звонков
export const telephonyIncomingParams = pgTable("telephony_incoming_params", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  phone: text("phone").notNull(), // Обязательное поле - номер телефона
  assistantId: text("assistant_id"), // Опциональное поле - ID ассистента (строка)
  tgChatId: text("tg_chat_id"), // Опциональное поле - ID чата Telegram
  tgToken: text("tg_token"), // Опциональное поле - токен Telegram
  functionObj: jsonb("function_obj"), // Опциональное поле - объект функции для GPT
  promptTask: text("prompt_task"), // Задача для ассистента при входящем звонке
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTelephonyIncomingParamsSchema = createInsertSchema(
  telephonyIncomingParams
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Export types - основной файл
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertUserWithPhone = z.infer<typeof insertUserWithPhoneSchema>;

export type Assistant = typeof assistants.$inferSelect;
export type InsertAssistant = z.infer<typeof insertAssistantSchema>;

export type KnowledgeItem = typeof knowledgeItems.$inferSelect;
export type InsertKnowledgeItem = z.infer<typeof insertKnowledgeItemSchema>;

export type Channel = typeof channels.$inferSelect;
export type InsertChannel = z.infer<typeof insertChannelSchema>;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Metric = typeof metrics.$inferSelect;
export type InsertMetric = z.infer<typeof insertMetricSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

export type ReferralTransaction = typeof referralTransactions.$inferSelect;
export type InsertReferralTransaction = z.infer<
  typeof insertReferralTransactionSchema
>;

export type AssistantFile = typeof assistantFiles.$inferSelect;
export type InsertAssistantFile = z.infer<typeof insertAssistantFileSchema>;

export type AssistantChannel = typeof assistantChannels.$inferSelect;
export type InsertAssistantChannel = z.infer<
  typeof insertAssistantChannelSchema
>;

export type DialogAssistant = typeof dialogAssistants.$inferSelect;
export type InsertDialogAssistant = z.infer<typeof insertDialogAssistantSchema>;

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;

export type InsertEmailCampaign = z.infer<typeof insertEmailCampaignSchema>;
export type EmailCampaign = typeof emailCampaigns.$inferSelect;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

// Export types - из plan-schema
export type InsertTariffPlan = z.infer<typeof insertTariffPlanSchema>;
export type TariffPlan = typeof tariffPlans.$inferSelect;

export type InsertUserPlanUsage = z.infer<typeof insertUserPlanUsageSchema>;
export type UserPlanUsage = typeof userPlanUsage.$inferSelect;

// Типы для примеров обучения ассистентов
export type AssistantExample = typeof assistantExamples.$inferSelect;
export const insertAssistantExampleSchema = createInsertSchema(
  assistantExamples
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAssistantExample = z.infer<
  typeof insertAssistantExampleSchema
>;

// Добавляем типы для каналов оповещений
export type NotificationChannel = typeof notificationChannels.$inferSelect;
export type InsertNotificationChannel = z.infer<
  typeof insertNotificationChannelSchema
>;

export type FunctionAssistant = typeof functionAssistants.$inferSelect;
export type InsertFunctionAssistant = z.infer<
  typeof insertFunctionAssistantSchema
>;

export type OpenAiFunction = typeof openAiFunctions.$inferSelect;
export type InsertOpenAiFunction = z.infer<typeof insertOpenAiFunctionSchema>;

// Добавляем типы для телефонии
export type TelephonyNumber = typeof telephonyNumbers.$inferSelect;
export type InsertTelephonyNumber = z.infer<typeof insertTelephonyNumberSchema>;

// Добавляем типы для параметров входящих звонков
export type TelephonyIncomingParam =
  typeof telephonyIncomingParams.$inferSelect;
export type InsertTelephonyIncomingParam = z.infer<
  typeof insertTelephonyIncomingParamsSchema
>;

// Структура для ответа API использования ресурсов
export interface UsageResponse {
  messages: {
    used: number;
    limit: number;
    percentage: number;
  };
  knowledge: {
    used: number;
    limit: number;
    percentage: number;
  };
  callMinutes: {
    used: number;
    limit: number;
    percentage: number;
  };
  sms: {
    used: number;
    limit: number;
    percentage: number;
  };
  users: {
    used: number;
    limit: number;
    percentage: number;
  };
  assistants: {
    used: number;
    limit: number;
    percentage: number;
  };
  channels: {
    used: number;
    limit: number;
    percentage: number;
  };
  apiCalls: {
    used: number;
    limit: number;
    percentage: number;
  };
  nextReset: string;
}
