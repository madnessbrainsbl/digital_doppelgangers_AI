import { db, pgPool } from "./db";
import { and, eq, desc, sql, not, or, count, inArray } from "drizzle-orm";
import { gte, lte, ne } from "drizzle-orm/expressions";
import {
  User,
  InsertUser,
  users,
  Assistant,
  InsertAssistant,
  assistants,
  KnowledgeItem,
  InsertKnowledgeItem,
  knowledgeItems,
  Channel,
  InsertChannel,
  channels,
  Conversation,
  InsertConversation,
  conversations,
  Message,
  InsertMessage,
  messages,
  Metric,
  InsertMetric,
  metrics,
  ActivityLog,
  InsertActivityLog,
  activityLogs,
  ReferralTransaction,
  InsertReferralTransaction,
  referralTransactions,
  AssistantFile,
  InsertAssistantFile,
  assistantFiles,
  Testimonial,
  InsertTestimonial,
  testimonials,
  AssistantChannel,
  InsertAssistantChannel,
  assistantChannels,
  DialogAssistant,
  InsertDialogAssistant,
  dialogAssistants,
  Payment,
  InsertPayment,
  payments,
  EmailCampaign,
  InsertEmailCampaign,
  emailCampaigns,
  userPlanUsage,
  NotificationChannel,
  InsertNotificationChannel,
  notificationChannels,
  OpenAiFunction,
  InsertOpenAiFunction,
  openAiFunctions,
  FunctionAssistant,
  InsertFunctionAssistant,
  functionAssistants,
} from "@shared/schema";
import { IStorage } from "./storage";
import { VkDialogDisplay } from "@/types/messages";
import { id } from "date-fns/locale";

export class PostgresStorage implements IStorage {
  // USERS
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));

    // Убедимся, что все обязательные поля имеют значения, а не undefined
    if (result[0]) {
      return {
        ...result[0],
        referralCode: result[0].referralCode || "",
      };
    }
    return undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    // Преобразуем email в нижний регистр
    email = email.toLowerCase();
    console.log(`[POSTGRES-STORAGE] getUserByEmail (lowercase): ${email}`);

    const result = await db.select().from(users).where(eq(users.email, email));

    if (result[0]) {
      return {
        ...result[0],
        referralCode: result[0].referralCode || "",
      };
    }
    return undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.phone, phone));

    // Убедимся, что все обязательные поля имеют значения, а не undefined
    if (result[0]) {
      return {
        ...result[0],
        referralCode: result[0].referralCode || "",
      };
    }
    return undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    console.log(
      "[POSTGRES-STORAGE] Creating user with data:",
      JSON.stringify(user)
    );

    // Преобразуем email в нижний регистр, если он предоставлен
    if (user.email) {
      user.email = user.email.toLowerCase();
      console.log(
        `[POSTGRES-STORAGE] Email converted to lowercase: ${user.email}`
      );
    }

    // Убедимся, что referralCode не undefined, а пустая строка в крайнем случае
    const userData = {
      ...user,
      referralCode: user.referralCode || "",
    };

    try {
      const result = await db.insert(users).values(userData).returning();
      console.log(
        "[POSTGRES-STORAGE] Successfully created user, returning result"
      );
      return result[0];
    } catch (error) {
      console.error("[POSTGRES-STORAGE] Error creating user:", error);
      throw error;
    }
  }

  async updateUser(
    id: number,
    user: Partial<InsertUser>
  ): Promise<User | undefined> {
    console.log(
      "[POSTGRES-STORAGE] Updating user with data:",
      JSON.stringify(user)
    );

    // Преобразуем email в нижний регистр, если он предоставлен
    if (user.email) {
      user.email = user.email.toLowerCase();
      console.log(
        `[POSTGRES-STORAGE] Email converted to lowercase: ${user.email}`
      );
    }

    // Проверка уникальности email (если он передан)
    if (user.email) {
      const existingUserEmail = await db
        .select()
        .from(users)
        .where(and(eq(users.email, user.email), ne(users.id, id)))
        .then((rows) => rows[0]);

      if (existingUserEmail) {
        console.log(
          `Почта ${user.email} уже используется другим пользователем`
        );
        // Используем конкретный объект ошибки с кодом для лучшей идентификации типа ошибки
        const error = new Error(
          `Почта ${user.email} уже используется другим пользователем`
        ) as Error & { code?: string };
        error.code = "EMAIL_ALREADY_EXISTS";
        throw error;
      }
    }

    // Проверка уникальности телефона
    if (user.phone) {
      const existingUserPhone = await db
        .select()
        .from(users)
        .where(and(eq(users.phone, user.phone), ne(users.id, id)))
        .then((rows) => rows[0]);

      if (existingUserPhone) {
        console.log(
          `Телефон ${user.phone} уже используется другим пользователем`
        );
        // Используем конкретный объект ошибки с кодом для лучшей идентификации типа ошибки
        const error = new Error(
          `Телефон ${user.phone} уже используется другим пользователем`
        ) as Error & { code?: string };
        error.code = "PHONE_ALREADY_EXISTS";
        throw error;
      }
    }

    // Обновляем
    try {
      const result = await db
        .update(users)
        .set(user)
        .where(eq(users.id, id))
        .returning();

      console.log(
        "[POSTGRES-STORAGE] Successfully updated user, returning result"
      );
      return result[0];
    } catch (error) {
      console.error("[POSTGRES-STORAGE] Error updating user:", error);
      throw error;
    }
  }

  async listUsers(): Promise<User[]> {
    const result = await db.select().from(users);

    // Убедимся, что все обязательные поля имеют значения, а не undefined
    return result.map((user) => ({
      ...user,
      referralCode: user.referralCode || "",
    }));
  }

  async listUsersByRole(role: string): Promise<User[]> {
    const result = await db.select().from(users).where(eq(users.role, role));

    // Убедимся, что все обязательные поля имеют значения, а не undefined
    return result.map((user) => ({
      ...user,
      referralCode: user.referralCode || "",
    }));
  }

  async listUsersByReferrer(referrerId: number): Promise<User[]> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.referrerId, referrerId));

    // Убедимся, что все обязательные поля имеют значения, а не undefined
    return result.map((user) => ({
      ...user,
      referralCode: user.referralCode || "",
    }));
  }

  async listUsersByManager(managerId: number): Promise<User[]> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.managerId, managerId));

    // Убедимся, что все обязательные поля имеют значения, а не undefined
    return result.map((user) => ({
      ...user,
      referralCode: user.referralCode || "",
    }));
  }

  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.referralCode, referralCode));

    // Убедимся, что все обязательные поля имеют значения, а не undefined
    if (result[0]) {
      return {
        ...result[0],
        referralCode: result[0].referralCode || "",
      };
    }
    return undefined;
  }

  async listUsersWithoutManager(): Promise<User[]> {
    console.log("[POSTGRES-STORAGE] Поиск пользователей без менеджера");
    try {
      // Используем прямой запрос к PostgreSQL через пул соединений
      // для получения пользователей без менеджера, исключая admin и manager

      // Выполняем SQL запрос напрямую через пул соединений
      const result = await pgPool.query(`
        SELECT * FROM users 
        WHERE (manager_id IS NULL OR manager_id = 0) 
        AND role NOT IN ('admin', 'manager')
      `);

      // Получаем строки из результата
      const users = result.rows;

      console.log(
        `[POSTGRES-STORAGE] Найдено ${users.length} пользователей без менеджера (не админы и не менеджеры)`
      );

      // Трансформируем названия полей из snake_case в camelCase и добавляем все необходимые поля согласно схеме User
      return users.map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone || null,
        password: row.password,
        role: row.role,
        status: row.status || "active",
        createdAt: row.created_at || new Date(),
        lastLogin: row.last_login || null,
        plan: row.plan || null,
        referrerId: row.referrer_id,
        managerId: row.manager_id,
        totalSpent: row.total_spent || 0,
        referralCode: row.referral_code || "",
      }));
    } catch (error) {
      console.error(
        "[POSTGRES-STORAGE] Ошибка при получении пользователей без менеджера:",
        error
      );
      throw error;
    }
  }

  // ASSISTANTS
  async getAssistant(id: number): Promise<Assistant | undefined> {
    const result = await db
      .select()
      .from(assistants)
      .where(eq(assistants.id, id));
    return result[0];
  }

  async getAssistantByOpenAIId(
    openaiAssistantId: string
  ): Promise<Assistant | undefined> {
    const result = await db
      .select()
      .from(assistants)
      .where(eq(assistants.openaiAssistantId, openaiAssistantId));
    return result[0];
  }

  async createAssistant(assistant: InsertAssistant): Promise<Assistant> {
    const result = await db.insert(assistants).values(assistant).returning();
    return result[0];
  }

  async updateAssistant(
    id: number,
    assistant: Partial<InsertAssistant>
  ): Promise<Assistant | undefined> {
    const result = await db
      .update(assistants)
      .set(assistant)
      .where(eq(assistants.id, id))
      .returning();
    return result[0];
  }

  async listAssistants(): Promise<Assistant[]> {
    return await db
      .select()
      .from(assistants)
      .where(
        // Исключаем ассистентов со статусом "deleted"
        not(eq(assistants.status, "deleted"))
      );
  }

  async listAssistantsByUser(userId: number): Promise<Assistant[]> {
    return await db
      .select()
      .from(assistants)
      .where(
        and(
          eq(assistants.createdBy, userId),
          not(eq(assistants.status, "deleted"))
        )
      );
  }

  // ASSISTANT FILES
  async getAssistantFile(id: number): Promise<AssistantFile | undefined> {
    const result = await db
      .select()
      .from(assistantFiles)
      .where(eq(assistantFiles.id, id));
    return result[0];
  }

  async createAssistantFile(file: InsertAssistantFile): Promise<AssistantFile> {
    const result = await db.insert(assistantFiles).values(file).returning();
    return result[0];
  }

  async listAssistantFiles(assistantId: number): Promise<AssistantFile[]> {
    return await db
      .select()
      .from(assistantFiles)
      .where(eq(assistantFiles.assistantId, assistantId));
  }

  async deleteAssistantFile(id: number): Promise<boolean> {
    const result = await db
      .delete(assistantFiles)
      .where(eq(assistantFiles.id, id))
      .returning();
    return result.length > 0;
  }

  // KNOWLEDGE ITEMS
  async getKnowledgeItem(id: number): Promise<KnowledgeItem | undefined> {
    const result = await db
      .select()
      .from(knowledgeItems)
      .where(eq(knowledgeItems.id, id));
    return result[0];
  }

  async createKnowledgeItem(item: InsertKnowledgeItem): Promise<KnowledgeItem> {
    const result = await db.insert(knowledgeItems).values(item).returning();
    return result[0];
  }

  async updateKnowledgeItem(
    id: number,
    item: Partial<InsertKnowledgeItem>
  ): Promise<KnowledgeItem | undefined> {
    const result = await db
      .update(knowledgeItems)
      .set(item)
      .where(eq(knowledgeItems.id, id))
      .returning();
    return result[0];
  }

  async deleteKnowledgeItem(id: number): Promise<boolean> {
    const result = await db
      .delete(knowledgeItems)
      .where(eq(knowledgeItems.id, id))
      .returning();
    return result.length > 0;
  }

  async listKnowledgeItems(): Promise<KnowledgeItem[]> {
    return await db.select().from(knowledgeItems);
  }

  async listAssistantFilesByKnowledgeItem(
    knowledgeItemId: number
  ): Promise<AssistantFile[]> {
    return await db
      .select()
      .from(assistantFiles)
      .where(eq(assistantFiles.knowledgeItemId, knowledgeItemId));
  }

  // CHANNELS
  async getChannel(id: number): Promise<Channel | undefined> {
    const result = await db.select().from(channels).where(eq(channels.id, id));
    return result[0];
  }

  async createChannel(channel: InsertChannel): Promise<Channel> {
    const result = await db.insert(channels).values(channel).returning();
    return result[0];
  }

  async updateChannel(
    id: number,
    channel: Partial<InsertChannel>
  ): Promise<Channel | undefined> {
    const result = await db
      .update(channels)
      .set(channel)
      .where(eq(channels.id, id))
      .returning();
    return result[0];
  }

  async deleteChannel(id: number): Promise<boolean> {
    const result = await db
      .delete(channels)
      .where(eq(channels.id, id))
      .returning();
    return result.length > 0;
  }

  async listChannels(): Promise<Channel[]> {
    return await db.select().from(channels);
  }

  // CONVERSATIONS
  async getConversation(id: number): Promise<Conversation | undefined> {
    const result = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return result[0];
  }

  async createConversation(
    conversation: InsertConversation
  ): Promise<Conversation> {
    const result = await db
      .insert(conversations)
      .values(conversation)
      .returning();
    return result[0];
  }

  async updateConversation(
    id: number,
    conversation: Partial<InsertConversation>
  ): Promise<Conversation | undefined> {
    const result = await db
      .update(conversations)
      .set(conversation)
      .where(eq(conversations.id, id))
      .returning();
    return result[0];
  }

  async listConversations(): Promise<Conversation[]> {
    return await db.select().from(conversations);
  }

  async listConversationsByChannel(channelId: number): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.channelId, channelId));
  }

  // MESSAGES
  async getMessage(id: number): Promise<Message | undefined> {
    const result = await db.select().from(messages).where(eq(messages.id, id));
    return result[0];
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(message).returning();
    return result[0];
  }

  async listMessagesByConversation(conversationId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.timestamp);
  }

  //ЗАГОТОВКА ДЛЯ БЕСКОНЕЧНОГО СКРОЛА ПАГАНАЦИИ
  async listMessagesByConversationPage(
    conversationId: number,
    page: number,
    limit: number
  ): Promise<{ messages: Message[]; total: number }> {
    if (!conversationId || page < 1 || limit < 1) {
      console.warn("Некорректные параметры для получения сообщений");
      return { messages: [], total: 0 };
    }
    const offset = (page - 1) * limit;

    const [listMessages, total] = await Promise.all([
      db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(desc(messages.timestamp))
        .limit(limit)
        .offset(offset),

      db
        .select({ count: count() })
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .then((result) => result[0].count),
    ]);

    return { messages: listMessages, total };
  }

  // METRICS
  async getMetric(id: number): Promise<Metric | undefined> {
    const result = await db.select().from(metrics).where(eq(metrics.id, id));
    return result[0];
  }

  async createMetric(metric: InsertMetric): Promise<Metric> {
    const result = await db.insert(metrics).values(metric).returning();
    return result[0];
  }

  async getLatestMetrics(limit: number): Promise<Metric[]> {
    return await db
      .select()
      .from(metrics)
      .orderBy(desc(metrics.date))
      .limit(limit);
  }

  // ACTIVITY LOGS
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const result = await db.insert(activityLogs).values(log).returning();
    return result[0];
  }

  async listRecentActivityLogs(
    limit: number,
    userId?: number
  ): Promise<ActivityLog[]> {
    let query = db.select().from(activityLogs);

    // Фильтруем по userId, если указан
    if (userId !== undefined) {
      query = query.where(eq(activityLogs.userId, userId));
    }

    // Сортируем и ограничиваем количество
    return await query.orderBy(desc(activityLogs.timestamp)).limit(limit);
  }

  // REFERRAL TRANSACTIONS
  async createReferralTransaction(
    transaction: InsertReferralTransaction
  ): Promise<ReferralTransaction> {
    const result = await db
      .insert(referralTransactions)
      .values(transaction)
      .returning();
    return result[0];
  }

  async getReferralTransaction(
    id: number
  ): Promise<ReferralTransaction | undefined> {
    const result = await db
      .select()
      .from(referralTransactions)
      .where(eq(referralTransactions.id, id));
    return result[0];
  }

  async updateReferralTransaction(
    id: number,
    transaction: Partial<InsertReferralTransaction>
  ): Promise<ReferralTransaction | undefined> {
    const result = await db
      .update(referralTransactions)
      .set(transaction)
      .where(eq(referralTransactions.id, id))
      .returning();
    return result[0];
  }

  async listReferralTransactions(): Promise<ReferralTransaction[]> {
    return await db.select().from(referralTransactions);
  }

  async listReferralTransactionsByUser(
    userId: number
  ): Promise<ReferralTransaction[]> {
    return await db
      .select()
      .from(referralTransactions)
      .where(eq(referralTransactions.userId, userId));
  }

  async listReferralTransactionsByReferrer(
    referrerId: number
  ): Promise<ReferralTransaction[]> {
    return await db
      .select()
      .from(referralTransactions)
      .where(eq(referralTransactions.referrerId, referrerId));
  }

  async listReferralTransactionsByManager(
    managerId: number
  ): Promise<ReferralTransaction[]> {
    return await db
      .select()
      .from(referralTransactions)
      .where(eq(referralTransactions.managerId, managerId));
  }

  async calculateTotalCommission(
    userId: number,
    role: "referrer" | "manager"
  ): Promise<number> {
    if (role === "referrer") {
      const result = await db
        .select({
          total: sql<number>`SUM(${referralTransactions.referralCommission})`,
        })
        .from(referralTransactions)
        .where(eq(referralTransactions.referrerId, userId));
      return Number(result[0]?.total) || 0;
    } else {
      const result = await db
        .select({
          total: sql<number>`SUM(${referralTransactions.managerCommission})`,
        })
        .from(referralTransactions)
        .where(eq(referralTransactions.managerId, userId));
      return Number(result[0]?.total) || 0;
    }
  }

  // TESTIMONIALS
  async getTestimonial(id: number): Promise<Testimonial | undefined> {
    const result = await db
      .select()
      .from(testimonials)
      .where(eq(testimonials.id, id));
    return result[0];
  }

  async createTestimonial(
    testimonial: InsertTestimonial
  ): Promise<Testimonial> {
    const result = await db
      .insert(testimonials)
      .values(testimonial)
      .returning();
    return result[0];
  }

  async updateTestimonial(
    id: number,
    testimonial: Partial<InsertTestimonial>
  ): Promise<Testimonial | undefined> {
    const result = await db
      .update(testimonials)
      .set(testimonial)
      .where(eq(testimonials.id, id))
      .returning();
    return result[0];
  }

  async listTestimonials(): Promise<Testimonial[]> {
    return await db.select().from(testimonials);
  }

  async listApprovedTestimonials(): Promise<Testimonial[]> {
    return await db
      .select()
      .from(testimonials)
      .where(eq(testimonials.status, "approved"));
  }

  async listTestimonialsByUser(userId: number): Promise<Testimonial[]> {
    return await db
      .select()
      .from(testimonials)
      .where(eq(testimonials.userId, userId));
  }

  // EMAIL CAMPAIGNS
  async getEmailCampaign(id: number): Promise<EmailCampaign | undefined> {
    const result = await db
      .select()
      .from(emailCampaigns)
      .where(eq(emailCampaigns.id, id));
    return result[0];
  }

  async createEmailCampaign(
    campaign: InsertEmailCampaign
  ): Promise<EmailCampaign> {
    const result = await db.insert(emailCampaigns).values(campaign).returning();
    return result[0];
  }

  async listEmailCampaigns(): Promise<EmailCampaign[]> {
    return await db
      .select()
      .from(emailCampaigns)
      .orderBy(desc(emailCampaigns.createdAt));
  }

  async listEmailCampaignsByUser(userId: number): Promise<EmailCampaign[]> {
    return await db
      .select()
      .from(emailCampaigns)
      .where(eq(emailCampaigns.userId, userId))
      .orderBy(desc(emailCampaigns.createdAt));
  }

  async listEmailCampaignsByChannel(
    channelId: number
  ): Promise<EmailCampaign[]> {
    return await db
      .select()
      .from(emailCampaigns)
      .where(eq(emailCampaigns.channelId, channelId))
      .orderBy(desc(emailCampaigns.createdAt));
  }

  async getEmailCampaigns(params: {
    userId?: number;
    dateFrom?: Date;
    dateTo?: Date;
    channelId?: number;
    status?: string;
  }): Promise<EmailCampaign[]> {
    const { userId, dateFrom, dateTo, channelId, status } = params;

    // Начинаем с базового запроса
    let query = db.select().from(emailCampaigns);

    // Добавляем фильтры, если они указаны
    if (userId !== undefined) {
      query = query.where(eq(emailCampaigns.userId, userId));
    }

    if (dateFrom) {
      query = query.where(gte(emailCampaigns.createdAt, dateFrom));
    }

    if (dateTo) {
      query = query.where(lte(emailCampaigns.createdAt, dateTo));
    }

    if (channelId !== undefined) {
      query = query.where(eq(emailCampaigns.channelId, channelId));
    }

    if (status) {
      query = query.where(eq(emailCampaigns.status, status));
    }

    // Сортируем по убыванию даты создания
    return await query.orderBy(desc(emailCampaigns.createdAt));
  }

  async getEmailCampaignsStats(): Promise<{
    totalCampaigns: number;
    totalRecipients: number;
    successRate: number;
    campaignsByTemplate: Record<string, number>;
    campaignsByMonth: Record<string, number>;
  }> {
    // Получаем все кампании
    const campaigns = await this.listEmailCampaigns();

    if (campaigns.length === 0) {
      return {
        totalCampaigns: 0,
        totalRecipients: 0,
        successRate: 0,
        campaignsByTemplate: {},
        campaignsByMonth: {},
      };
    }

    // Общая статистика
    const totalCampaigns = campaigns.length;
    const totalRecipients = campaigns.reduce(
      (sum, campaign) => sum + campaign.recipientCount,
      0
    );
    const totalSuccessful = campaigns.reduce(
      (sum, campaign) => sum + campaign.successCount,
      0
    );

    // Расчет процента успешных отправок
    const successRate =
      totalRecipients > 0
        ? Math.round((totalSuccessful / totalRecipients) * 100)
        : 0;

    // Группировка по типам шаблонов
    const campaignsByTemplate: Record<string, number> = {};
    campaigns.forEach((campaign) => {
      const template = campaign.templateType;
      campaignsByTemplate[template] = (campaignsByTemplate[template] || 0) + 1;
    });

    // Группировка по месяцам
    const campaignsByMonth: Record<string, number> = {};
    campaigns.forEach((campaign) => {
      const date = new Date(campaign.createdAt);
      const monthYear = `${date.getMonth() + 1}-${date.getFullYear()}`;
      campaignsByMonth[monthYear] = (campaignsByMonth[monthYear] || 0) + 1;
    });

    return {
      totalCampaigns,
      totalRecipients,
      successRate,
      campaignsByTemplate,
      campaignsByMonth,
    };
  }

  // ASSISTANT CHANNELS
  async getAssistantChannel(id: number): Promise<AssistantChannel | undefined> {
    const result = await db
      .select()
      .from(assistantChannels)
      .where(eq(assistantChannels.id, id));
    return result[0];
  }

  async getAssistantChannelByAssistantAndChannel(
    assistantId: number,
    channelId: number
  ): Promise<AssistantChannel | undefined> {
    const result = await db
      .select()
      .from(assistantChannels)
      .where(
        and(
          eq(assistantChannels.assistantId, assistantId),
          eq(assistantChannels.channelId, channelId)
        )
      );
    return result[0];
  }

  async getAssistantChannelByChannel(
    channelId: number
  ): Promise<AssistantChannel | undefined> {
    // Сначала ищем канал, помеченный как isDefault и enabled
    const defaultResult = await db
      .select()
      .from(assistantChannels)
      .where(
        and(
          eq(assistantChannels.channelId, channelId),
          eq(assistantChannels.enabled, true),
          eq(assistantChannels.isDefault, true)
        )
      );

    // Если нашли дефолтный канал, возвращаем его
    if (defaultResult.length > 0) {
      return defaultResult[0];
    }

    // Иначе берем первый включенный канал для этого channel
    const enabledResult = await db
      .select()
      .from(assistantChannels)
      .where(
        and(
          eq(assistantChannels.channelId, channelId),
          eq(assistantChannels.enabled, true)
        )
      )
      .limit(1);

    return enabledResult[0];
  }

  async createAssistantChannel(
    assistantChannel: InsertAssistantChannel
  ): Promise<AssistantChannel> {
    const result = await db
      .insert(assistantChannels)
      .values(assistantChannel)
      .returning();
    return result[0];
  }

  async updateAssistantChannel(
    id: number,
    assistantChannel: Partial<InsertAssistantChannel>
  ): Promise<AssistantChannel | undefined> {
    const result = await db
      .update(assistantChannels)
      .set(assistantChannel)
      .where(eq(assistantChannels.id, id))
      .returning();
    return result[0];
  }

  async deleteAssistantChannel(id: number): Promise<boolean> {
    const result = await db
      .delete(assistantChannels)
      .where(eq(assistantChannels.id, id))
      .returning();
    return result.length > 0;
  }

  async listAssistantChannelsByAssistant(
    assistantId: number
  ): Promise<AssistantChannel[]> {
    return await db
      .select()
      .from(assistantChannels)
      .where(eq(assistantChannels.assistantId, assistantId));
  }

  async listAssistantChannelsByChannel(
    channelId: number
  ): Promise<AssistantChannel[]> {
    return await db
      .select()
      .from(assistantChannels)
      .where(eq(assistantChannels.channelId, channelId));
  }

  // DIALOG ASSISTANTS
  async getDialogAssistant(id: number): Promise<DialogAssistant | undefined> {
    const result = await db
      .select()
      .from(dialogAssistants)
      .where(eq(dialogAssistants.id, id));
    return result[0];
  }

  async getDialogAssistantByDialogAndChannel(
    dialogId: string,
    channelId: number
  ): Promise<DialogAssistant | undefined> {
    const result = await db
      .select()
      .from(dialogAssistants)
      .where(
        and(
          eq(dialogAssistants.dialogId, dialogId),
          eq(dialogAssistants.channelId, channelId)
        )
      );
    return result[0];
  }

  async createDialogAssistant(
    dialogAssistant: InsertDialogAssistant
  ): Promise<DialogAssistant> {
    const result = await db
      .insert(dialogAssistants)
      .values(dialogAssistant)
      .returning();
    return result[0];
  }

  async updateDialogAssistant(
    id: number,
    dialogAssistant: Partial<InsertDialogAssistant>
  ): Promise<DialogAssistant | undefined> {
    const result = await db
      .update(dialogAssistants)
      .set(dialogAssistant)
      .where(eq(dialogAssistants.id, id))
      .returning();
    return result[0];
  }

  async deleteDialogAssistant(id: number): Promise<boolean> {
    const result = await db
      .delete(dialogAssistants)
      .where(eq(dialogAssistants.id, id))
      .returning();
    return result.length > 0;
  }

  async listDialogAssistantsByAssistant(
    assistantId: number
  ): Promise<DialogAssistant[]> {
    return await db
      .select()
      .from(dialogAssistants)
      .where(eq(dialogAssistants.assistantId, assistantId));
  }

  async listDialogAssistantsByChannel(
    channelId: number
  ): Promise<DialogAssistant[]> {
    return await db
      .select()
      .from(dialogAssistants)
      .where(eq(dialogAssistants.channelId, channelId));
  }

  async listDialogAssistantsByDialog(
    dialogId: string
  ): Promise<DialogAssistant[]> {
    return await db
      .select()
      .from(dialogAssistants)
      .where(eq(dialogAssistants.dialogId, dialogId));
  }

  // Payments
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const result = await db
      .insert(payments)
      .values({
        userId: payment.userId,
        amount: payment.amount,
        paymentId: payment.paymentId || null,
        status: payment.status || "pending",
        createdAt: payment.createdAt || new Date(),
        completedAt: payment.completedAt || null,
        description: payment.description || null,
        paymentUrl: payment.paymentUrl || null,
        metadata: payment.metadata || null,
      })
      .returning();

    return result[0];
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    const result = await db.select().from(payments).where(eq(payments.id, id));
    return result[0];
  }

  async getPaymentByExternalId(
    paymentId: string
  ): Promise<Payment | undefined> {
    const result = await db
      .select()
      .from(payments)
      .where(eq(payments.paymentId, paymentId));
    return result[0];
  }

  async updatePayment(
    id: number,
    paymentData: Partial<InsertPayment>
  ): Promise<Payment | undefined> {
    const result = await db
      .update(payments)
      .set({
        paymentId:
          paymentData.paymentId !== undefined
            ? paymentData.paymentId
            : undefined,
        status:
          paymentData.status !== undefined ? paymentData.status : undefined,
        completedAt:
          paymentData.completedAt !== undefined
            ? paymentData.completedAt
            : undefined,
        paymentUrl:
          paymentData.paymentUrl !== undefined
            ? paymentData.paymentUrl
            : undefined,
        metadata:
          paymentData.metadata !== undefined ? paymentData.metadata : undefined,
      })
      .where(eq(payments.id, id))
      .returning();

    return result[0];
  }

  async listPaymentsByUser(userId: number): Promise<Payment[]> {
    const result = await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
    return result;
  }

  // User Balance
  async updateUserBalance(
    userId: number,
    amount: number
  ): Promise<User | undefined> {
    try {
      console.log(
        `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Запрос на обновление баланса пользователя ${userId} на сумму ${Math.floor(
          amount / 100
        )} руб.`
      );

      // Получаем текущий баланс пользователя
      const user = await this.getUser(userId);
      if (!user) {
        console.error(
          `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Пользователь ${userId} не найден при обновлении баланса`
        );
        return undefined;
      }

      // Рассчитываем новый баланс
      const currentBalance = user.balance || 0;
      const newBalance = currentBalance + amount;

      console.log(
        `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Обновление баланса пользователя ${userId}: ${Math.floor(
          currentBalance / 100
        )} руб. -> ${Math.floor(newBalance / 100)} руб. (+ ${Math.floor(
          amount / 100
        )} руб.)`
      );

      // Прямое обновление в базе данных через SQL-запрос для надежности
      try {
        // Обновляем баланс напрямую через SQL-запрос
        const updatedUserResult = await db.execute(
          sql`UPDATE users SET balance = ${newBalance} WHERE id = ${userId} RETURNING *`
        );

        if (!updatedUserResult.rows || updatedUserResult.rows.length === 0) {
          console.error(
            `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Ошибка при SQL-обновлении баланса пользователя ${userId}, ни одна строка не была обновлена`
          );

          // Пробуем альтернативный способ через ORM
          console.log(
            `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Попытка обновления баланса через ORM`
          );
          const ormResult = await db
            .update(users)
            .set({ balance: newBalance })
            .where(eq(users.id, userId))
            .returning();

          if (!ormResult || ormResult.length === 0) {
            console.error(
              `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Не удалось обновить баланс через ORM`
            );
            return undefined;
          }

          console.log(
            `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Успешное обновление баланса через ORM, новый баланс: ${
              ormResult[0]?.balance || "не определен"
            }`
          );
          return ormResult[0];
        }

        console.log(
          `ДИАГНОСТИКА ПЛАТЕЖЕЙ: SQL-запрос обновления баланса выполнен успешно, новый баланс: ${Math.floor(
            updatedUserResult.rows[0].balance / 100
          )} руб.`
        );

        // Преобразуем строки SQL-запроса в объект User
        const updatedUser: User = {
          id: updatedUserResult.rows[0].id,
          name: updatedUserResult.rows[0].name,
          email: updatedUserResult.rows[0].email,
          password: updatedUserResult.rows[0].password,
          role: updatedUserResult.rows[0].role,
          status: updatedUserResult.rows[0].status,
          createdAt: updatedUserResult.rows[0].created_at,
          lastLogin: updatedUserResult.rows[0].last_login,
          plan: updatedUserResult.rows[0].plan,
          referrerId: updatedUserResult.rows[0].referrer_id,
          managerId: updatedUserResult.rows[0].manager_id,
          totalSpent: updatedUserResult.rows[0].total_spent,
          balance: updatedUserResult.rows[0].balance,
          referralCode: updatedUserResult.rows[0].referral_code || "",
        };

        // Двойная проверка обновления баланса
        const verifiedUser = await this.getUser(userId);
        console.log(
          `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Проверка баланса после обновления: ${Math.floor(
            (verifiedUser?.balance || 0) / 100
          )} руб. (ожидалось ${Math.floor(newBalance / 100)} руб.)`
        );

        return updatedUser;
      } catch (sqlError) {
        console.error(
          `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Ошибка при выполнении SQL-запроса обновления баланса:`,
          sqlError
        );

        // Запасной вариант через ORM
        console.log(
          `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Попытка обновления баланса через ORM`
        );
        const result = await db
          .update(users)
          .set({ balance: newBalance })
          .where(eq(users.id, userId))
          .returning();

        if (!result || result.length === 0) {
          console.error(
            `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Не удалось обновить баланс через ORM`
          );
          return undefined;
        }

        console.log(
          `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Обновление баланса через ORM успешно, новый баланс: ${
            result[0]?.balance || "не определен"
          }`
        );
        return result[0];
      }
    } catch (error) {
      console.error(
        `ДИАГНОСТИКА ПЛАТЕЖЕЙ: Критическая ошибка при обновлении баланса пользователя ${userId}:`,
        error
      );
      throw error;
    }
  }

  // новая запись диалога Вк
  async newRecord(
    dialog: VkDialogDisplay,
    channelId: number,
    assistantId: number
  ) {
    const existingRecord = await db
      .select()
      .from(dialogAssistants)
      .where(
        and(
          eq(dialogAssistants.dialogId, String(dialog.peerId)),
          eq(dialogAssistants.channelId, channelId)
        )
      )
      .then((rows) => rows[0]);

    if (existingRecord) {
      return;
    }

    const data = {
      channelId: channelId,
      dialogId: String(dialog.peerId), // Преобразуем в строку
      assistantId: assistantId,
      enabled: dialog.assistantEnabled ?? false, // Добавляем дефолтное значение
      autoReply: dialog.autoReply ?? false, // Добавляем дефолтное значение
      settings: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(dialogAssistants).values(data);
  }

  async saveMessage(data: {
    conversationId: number;
    senderId: number;
    senderType: string;
    content: string;
    timestamp: string;
    metadata: object;
  }): Promise<{
    id: number;
    conversationId: number;
    senderId: number;
    senderType: string;
    content: string;
    timestamp: string;
    metadata: object;
  }> {
    const createdMessage = await db
      .insert(messages)
      .values({
        conversationId: data.conversationId,
        senderId: data.senderId,
        senderType: data.senderType,
        content: data.content,
        timestamp: new Date(data.timestamp),
        metadata: data.metadata,
      })
      .returning();

    if (createdMessage.length === 0) {
      throw new Error("Не удалось создать сообщение");
    }

    return {
      id: createdMessage[0].id,
      conversationId: createdMessage[0].conversationId,
      senderId: createdMessage[0].senderId || 0,
      senderType: createdMessage[0].senderType,
      content: createdMessage[0].content,
      timestamp: createdMessage[0].timestamp.toISOString(),
      metadata: (createdMessage[0].metadata as object) || {},
    };
  }

  //увеличение колонки messagesUsed при отправке сообщений.
  async getMessageUsed(userId: number) {
    // 1. Получаем текущий usage по userId
    let recordUsedPlan = await db
      .select()
      .from(userPlanUsage)
      .where(eq(userPlanUsage.userId, userId)); // 💥 исправлено

    // 2. Если запись найдена — увеличиваем messagesUsed на 1
    if (recordUsedPlan[0]) {
      const updated = await db
        .update(userPlanUsage)
        .set({ messagesUsed: recordUsedPlan[0].messagesUsed + 1 })
        .where(eq(userPlanUsage.userId, userId))
        .returning();

      return updated[0];
    }
    return recordUsedPlan[0];
  }

  // Notification Channels
  async getNotificationChannel(
    id: number
  ): Promise<NotificationChannel | undefined> {
    const result = await db
      .select()
      .from(notificationChannels)
      .where(eq(notificationChannels.id, id));
    return result[0];
  }

  async createNotificationChannel(
    insertChannel: InsertNotificationChannel
  ): Promise<NotificationChannel> {
    const result = await db
      .insert(notificationChannels)
      .values(insertChannel)
      .returning();
    return result[0];
  }

  async updateNotificationChannel(
    id: number,
    channelData: Partial<InsertNotificationChannel>
  ): Promise<NotificationChannel | undefined> {
    const result = await db
      .update(notificationChannels)
      .set(channelData)
      .where(eq(notificationChannels.id, id))
      .returning();
    return result[0];
  }

  async deleteNotificationChannel(id: number): Promise<boolean> {
    const result = await db
      .delete(notificationChannels)
      .where(eq(notificationChannels.id, id))
      .returning();
    return result.length > 0;
  }

  async listNotificationChannels(): Promise<NotificationChannel[]> {
    return await db.select().from(notificationChannels);
  }

  async listNotificationChannelsByUser(
    userId: number
  ): Promise<NotificationChannel[]> {
    return await db
      .select()
      .from(notificationChannels)
      .where(eq(notificationChannels.createdBy, userId));
  }

  // OpenAI Functions
  async getOpenAiFunction(id: number): Promise<OpenAiFunction | undefined> {
    const result = await db
      .select()
      .from(openAiFunctions)
      .where(eq(openAiFunctions.id, id));
    return result[0];
  }

  async createOpenAiFunction(
    insertFunction: InsertOpenAiFunction
  ): Promise<OpenAiFunction> {
    const result = await db
      .insert(openAiFunctions)
      .values(insertFunction)
      .returning();
    return result[0];
  }

  async updateOpenAiFunction(
    id: number,
    functionData: Partial<InsertOpenAiFunction>
  ): Promise<OpenAiFunction | undefined> {
    const result = await db
      .update(openAiFunctions)
      .set(functionData)
      .where(eq(openAiFunctions.id, id))
      .returning();
    return result[0];
  }

  async deleteOpenAiFunction(id: number): Promise<boolean> {
    const result = await db
      .delete(openAiFunctions)
      .where(eq(openAiFunctions.id, id))
      .returning();
    return result.length > 0;
  }

  async listOpenAiFunctions(): Promise<OpenAiFunction[]> {
    return await db.select().from(openAiFunctions);
  }

  async listOpenAiFunctionsByUser(userId: number): Promise<OpenAiFunction[]> {
    return await db
      .select()
      .from(openAiFunctions)
      .where(eq(openAiFunctions.createdBy, userId));
  }

  // Function Assistants
  async getFunctionAssistant(
    id: number
  ): Promise<FunctionAssistant | undefined> {
    const result = await db
      .select()
      .from(functionAssistants)
      .where(eq(functionAssistants.id, id));
    return result[0];
  }

  async getFunctionAssistantByFunctionAndAssistant(
    functionId: number,
    assistantId: number
  ): Promise<FunctionAssistant | undefined> {
    const result = await db
      .select()
      .from(functionAssistants)
      .where(
        and(
          eq(functionAssistants.functionId, functionId),
          eq(functionAssistants.assistantId, assistantId)
        )
      );
    return result[0];
  }

  async createFunctionAssistant(
    insertFunctionAssistant: InsertFunctionAssistant
  ): Promise<FunctionAssistant> {
    const result = await db
      .insert(functionAssistants)
      .values(insertFunctionAssistant)
      .returning();
    return result[0];
  }

  async updateFunctionAssistant(
    id: number,
    data: Partial<InsertFunctionAssistant>
  ): Promise<FunctionAssistant | undefined> {
    const result = await db
      .update(functionAssistants)
      .set(data)
      .where(eq(functionAssistants.id, id))
      .returning();
    return result[0];
  }

  async deleteFunctionAssistant(id: number): Promise<boolean> {
    const result = await db
      .delete(functionAssistants)
      .where(eq(functionAssistants.id, id))
      .returning();
    return result.length > 0;
  }

  async listFunctionAssistantsByAssistant(
    assistantId: number
  ): Promise<FunctionAssistant[]> {
    return await db
      .select()
      .from(functionAssistants)
      .where(eq(functionAssistants.assistantId, assistantId));
  }

  async listFunctionAssistantsByFunction(
    functionId: number
  ): Promise<FunctionAssistant[]> {
    return await db
      .select()
      .from(functionAssistants)
      .where(eq(functionAssistants.functionId, functionId));
  }

  async listFunctionAssistantsByNotificationChannel(
    notificationChannelId: number
  ): Promise<FunctionAssistant[]> {
    return await db
      .select()
      .from(functionAssistants)
      .where(
        eq(functionAssistants.notificationChannelId, notificationChannelId)
      );
  }

  async getAssistantsByFunction(
    channelId: number
  ): Promise<{ id: number; name: string; role: string; functionId: number }[]> {
    const functionAssistantsData = await db
      .select()
      .from(functionAssistants)
      .where(eq(functionAssistants.notificationChannelId, channelId));

    if (!functionAssistantsData.length) {
      return [];
    }

    // Создаём мапу: assistantId → functionId
    const assistantFunctionMap = new Map<number, number>();
    for (const row of functionAssistantsData) {
      assistantFunctionMap.set(row.assistantId, row.functionId);
    }

    const assistantIds = functionAssistantsData.map((fa) => fa.assistantId);

    const assistantsList = await db
      .select({
        id: assistants.id,
        name: assistants.name,
        role: assistants.role,
      })
      .from(assistants)
      .where(inArray(assistants.id, assistantIds));

    // Добавляем functionId из мапы
    const result = assistantsList.map((assistant) => ({
      ...assistant,
      functionId: assistantFunctionMap.get(assistant.id) || 0,
    }));

    return result;
  }
}

export const postgresStorage = new PostgresStorage();
