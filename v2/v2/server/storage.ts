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

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserByReferralCode(referralCode: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  listUsers(): Promise<User[]>;
  listUsersByRole(role: string): Promise<User[]>;
  listUsersByReferrer(referrerId: number): Promise<User[]>;
  listUsersByManager(managerId: number): Promise<User[]>;
  listUsersWithoutManager(): Promise<User[]>;

  // Assistants
  getAssistant(id: number): Promise<Assistant | undefined>;
  getAssistantByOpenAIId(
    openaiAssistantId: string
  ): Promise<Assistant | undefined>;
  createAssistant(assistant: InsertAssistant): Promise<Assistant>;
  updateAssistant(
    id: number,
    assistant: Partial<InsertAssistant>
  ): Promise<Assistant | undefined>;
  listAssistants(): Promise<Assistant[]>;
  listAssistantsByUser(userId: number): Promise<Assistant[]>;

  // Assistant Files
  getAssistantFile(id: number): Promise<AssistantFile | undefined>;
  createAssistantFile(file: InsertAssistantFile): Promise<AssistantFile>;
  listAssistantFiles(assistantId: number): Promise<AssistantFile[]>;
  deleteAssistantFile(id: number): Promise<boolean>;

  // Knowledge Base
  getKnowledgeItem(id: number): Promise<KnowledgeItem | undefined>;
  createKnowledgeItem(item: InsertKnowledgeItem): Promise<KnowledgeItem>;
  updateKnowledgeItem(
    id: number,
    item: Partial<InsertKnowledgeItem>
  ): Promise<KnowledgeItem | undefined>;
  deleteKnowledgeItem(id: number): Promise<boolean>;
  listKnowledgeItems(): Promise<KnowledgeItem[]>;
  listAssistantFilesByKnowledgeItem(
    knowledgeItemId: number
  ): Promise<AssistantFile[]>;

  // Channels
  getChannel(id: number): Promise<Channel | undefined>;
  createChannel(channel: InsertChannel): Promise<Channel>;
  updateChannel(
    id: number,
    channel: Partial<InsertChannel>
  ): Promise<Channel | undefined>;
  deleteChannel(id: number): Promise<boolean>;
  listChannels(): Promise<Channel[]>;

  // Conversations
  getConversation(id: number): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(
    id: number,
    conversation: Partial<InsertConversation>
  ): Promise<Conversation | undefined>;
  listConversations(status?: string, startDate?: Date): Promise<Conversation[]>;
  listConversationsByChannel(channelId: number): Promise<Conversation[]>;

  // Messages
  getMessage(id: number): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  listMessagesByConversation(conversationId: number): Promise<Message[]>;

  // Metrics
  getMetric(id: number): Promise<Metric | undefined>;
  createMetric(metric: InsertMetric): Promise<Metric>;
  getLatestMetrics(limit: number): Promise<Metric[]>;

  // Activity Logs
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  listRecentActivityLogs(
    limit: number,
    userId?: number
  ): Promise<ActivityLog[]>;

  // Referral Transactions
  createReferralTransaction(
    transaction: InsertReferralTransaction
  ): Promise<ReferralTransaction>;
  getReferralTransaction(id: number): Promise<ReferralTransaction | undefined>;
  updateReferralTransaction(
    id: number,
    transaction: Partial<InsertReferralTransaction>
  ): Promise<ReferralTransaction | undefined>;
  listReferralTransactions(): Promise<ReferralTransaction[]>;
  listReferralTransactionsByUser(
    userId: number
  ): Promise<ReferralTransaction[]>;
  listReferralTransactionsByReferrer(
    referrerId: number
  ): Promise<ReferralTransaction[]>;
  listReferralTransactionsByManager(
    managerId: number
  ): Promise<ReferralTransaction[]>;
  calculateTotalCommission(
    userId: number,
    role: "referrer" | "manager"
  ): Promise<number>;

  // Testimonials
  getTestimonial(id: number): Promise<Testimonial | undefined>;
  createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial>;
  updateTestimonial(
    id: number,
    testimonial: Partial<InsertTestimonial>
  ): Promise<Testimonial | undefined>;
  listTestimonials(): Promise<Testimonial[]>;
  listApprovedTestimonials(): Promise<Testimonial[]>;
  listTestimonialsByUser(userId: number): Promise<Testimonial[]>;

  // Assistant Channels
  getAssistantChannel(id: number): Promise<AssistantChannel | undefined>;
  getAssistantChannelByAssistantAndChannel(
    assistantId: number,
    channelId: number
  ): Promise<AssistantChannel | undefined>;
  getAssistantChannelByChannel(
    channelId: number
  ): Promise<AssistantChannel | undefined>;
  createAssistantChannel(
    assistantChannel: InsertAssistantChannel
  ): Promise<AssistantChannel>;
  updateAssistantChannel(
    id: number,
    assistantChannel: Partial<InsertAssistantChannel>
  ): Promise<AssistantChannel | undefined>;
  deleteAssistantChannel(id: number): Promise<boolean>;
  listAssistantChannelsByAssistant(
    assistantId: number
  ): Promise<AssistantChannel[]>;
  listAssistantChannelsByChannel(
    channelId: number
  ): Promise<AssistantChannel[]>;

  // Dialog Assistants
  getDialogAssistant(id: number): Promise<DialogAssistant | undefined>;
  getDialogAssistantByDialogAndChannel(
    dialogId: string,
    channelId: number
  ): Promise<DialogAssistant | undefined>;
  createDialogAssistant(
    dialogAssistant: InsertDialogAssistant
  ): Promise<DialogAssistant>;
  updateDialogAssistant(
    id: number,
    dialogAssistant: Partial<InsertDialogAssistant>
  ): Promise<DialogAssistant | undefined>;
  deleteDialogAssistant(id: number): Promise<boolean>;
  listDialogAssistantsByAssistant(
    assistantId: number
  ): Promise<DialogAssistant[]>;
  listDialogAssistantsByChannel(channelId: number): Promise<DialogAssistant[]>;
  listDialogAssistantsByDialog(dialogId: string): Promise<DialogAssistant[]>;

  // Payments (ЮKassa)
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentByExternalId(paymentId: string): Promise<Payment | undefined>;
  updatePayment(
    id: number,
    payment: Partial<InsertPayment>
  ): Promise<Payment | undefined>;
  listPaymentsByUser(userId: number): Promise<Payment[]>;

  // User Balance
  updateUserBalance(userId: number, amount: number): Promise<User | undefined>;

  // Email Campaigns
  getEmailCampaign(id: number): Promise<EmailCampaign | undefined>;
  createEmailCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign>;
  listEmailCampaigns(): Promise<EmailCampaign[]>;
  listEmailCampaignsByUser(userId: number): Promise<EmailCampaign[]>;
  listEmailCampaignsByChannel(channelId: number): Promise<EmailCampaign[]>;

  getEmailCampaigns(params: {
    userId?: number;
    dateFrom?: Date;
    dateTo?: Date;
    channelId?: number;
    status?: string;
  }): Promise<EmailCampaign[]>;

  getEmailCampaignsStats(): Promise<{
    totalCampaigns: number;
    totalRecipients: number;
    successRate: number;
    campaignsByTemplate: Record<string, number>;
    campaignsByMonth: Record<string, number>;
  }>;

  // Notification Channels
  getNotificationChannel(id: number): Promise<NotificationChannel | undefined>;
  createNotificationChannel(
    insertChannel: InsertNotificationChannel
  ): Promise<NotificationChannel>;
  updateNotificationChannel(
    id: number,
    channelData: Partial<InsertNotificationChannel>
  ): Promise<NotificationChannel | undefined>;
  deleteNotificationChannel(id: number): Promise<boolean>;
  listNotificationChannels(): Promise<NotificationChannel[]>;
  listNotificationChannelsByUser(
    userId: number
  ): Promise<NotificationChannel[]>;

  // OpenAI Functions
  getOpenAiFunction(id: number): Promise<OpenAiFunction | undefined>;
  createOpenAiFunction(
    insertFunction: InsertOpenAiFunction
  ): Promise<OpenAiFunction>;
  updateOpenAiFunction(
    id: number,
    functionData: Partial<InsertOpenAiFunction>
  ): Promise<OpenAiFunction | undefined>;
  deleteOpenAiFunction(id: number): Promise<boolean>;
  listOpenAiFunctions(): Promise<OpenAiFunction[]>;
  listOpenAiFunctionsByUser(userId: number): Promise<OpenAiFunction[]>;

  // Function Assistants
  getFunctionAssistant(id: number): Promise<FunctionAssistant | undefined>;
  getFunctionAssistantByFunctionAndAssistant(
    functionId: number,
    assistantId: number
  ): Promise<FunctionAssistant | undefined>;
  createFunctionAssistant(
    insertFunctionAssistant: InsertFunctionAssistant
  ): Promise<FunctionAssistant>;
  updateFunctionAssistant(
    id: number,
    data: Partial<InsertFunctionAssistant>
  ): Promise<FunctionAssistant | undefined>;
  deleteFunctionAssistant(id: number): Promise<boolean>;
  listFunctionAssistantsByAssistant(
    assistantId: number
  ): Promise<FunctionAssistant[]>;
  listFunctionAssistantsByFunction(
    functionId: number
  ): Promise<FunctionAssistant[]>;
  listFunctionAssistantsByNotificationChannel(
    notificationChannelId: number
  ): Promise<FunctionAssistant[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private assistants: Map<number, Assistant>;
  private knowledgeItems: Map<number, KnowledgeItem>;
  private channels: Map<number, Channel>;
  private conversations: Map<number, Conversation>;
  private messages: Map<number, Message>;
  private metrics: Map<number, Metric>;
  private activityLogs: Map<number, ActivityLog>;
  private referralTransactions: Map<number, ReferralTransaction>;
  private assistantFiles: Map<number, AssistantFile>;
  private testimonials: Map<number, Testimonial>;
  private assistantChannels: Map<number, AssistantChannel>;
  private dialogAssistants: Map<number, DialogAssistant>;
  private payments: Map<number, Payment>;
  private emailCampaigns: Map<number, EmailCampaign>;
  private notificationChannels: Map<number, NotificationChannel>;
  private notificationChannelIdCounter: number;
  private openAiFunctions: Map<number, OpenAiFunction>;
  private openAiFunctionIdCounter: number;
  private functionAssistants: Map<number, FunctionAssistant>;
  private functionAssistantIdCounter: number;

  private userIdCounter: number;
  private assistantIdCounter: number;
  private knowledgeItemIdCounter: number;
  private channelIdCounter: number;
  private conversationIdCounter: number;
  private messageIdCounter: number;
  private metricIdCounter: number;
  private activityLogIdCounter: number;
  private referralTransactionIdCounter: number;
  private assistantFileIdCounter: number;
  private testimonialIdCounter: number;
  private assistantChannelIdCounter: number;
  private dialogAssistantIdCounter: number;
  private paymentIdCounter: number;
  private emailCampaignIdCounter: number;

  constructor() {
    this.users = new Map();
    this.assistants = new Map();
    this.knowledgeItems = new Map();
    this.channels = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    this.metrics = new Map();
    this.activityLogs = new Map();
    this.referralTransactions = new Map();
    this.assistantFiles = new Map();
    this.testimonials = new Map();
    this.assistantChannels = new Map();
    this.dialogAssistants = new Map();
    this.payments = new Map();
    this.emailCampaigns = new Map();
    this.notificationChannels = new Map();

    this.userIdCounter = 1;
    this.assistantIdCounter = 1;
    this.knowledgeItemIdCounter = 1;
    this.channelIdCounter = 1;
    this.conversationIdCounter = 1;
    this.messageIdCounter = 1;
    this.metricIdCounter = 1;
    this.activityLogIdCounter = 1;
    this.referralTransactionIdCounter = 1;
    this.assistantFileIdCounter = 1;
    this.testimonialIdCounter = 1;
    this.assistantChannelIdCounter = 1;
    this.dialogAssistantIdCounter = 1;
    this.paymentIdCounter = 1;
    this.emailCampaignIdCounter = 1;
    this.notificationChannelIdCounter = 1;
    this.openAiFunctionIdCounter = 1;
    this.functionAssistantIdCounter = 1;

    // Add demo data
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Create admin user
    const adminUser: InsertUser = {
      name: "Анна Смирнова",
      email: "admin@asisto.com",
      role: "admin",
      status: "active",
      password: "$2b$10$7g5LkD2aX.nZ2OzjKuOZLe5iQrzYB8D888g8GhVD8XZqaUI1CS0TK", // 123456
    };
    this.createUser(adminUser);

    // Create manager user
    const managerUser: InsertUser = {
      name: "Иван Петров",
      email: "manager@asisto.com",
      role: "manager",
      status: "active",
      password: "$2b$10$7g5LkD2aX.nZ2OzjKuOZLe5iQrzYB8D888g8GhVD8XZqaUI1CS0TK", // 123456
    };
    this.createUser(managerUser);

    // Create referral user
    const referralUser: InsertUser = {
      name: "Сергей Иванов",
      email: "referral@asisto.com",
      role: "referral",
      status: "active",
      password: "$2b$10$7g5LkD2aX.nZ2OzjKuOZLe5iQrzYB8D888g8GhVD8XZqaUI1CS0TK", // 123456
    };
    this.createUser(referralUser);

    // Create regular users with referrals
    const user1: InsertUser = {
      name: "Алексей Сидоров",
      email: "user1@example.com",
      role: "user",
      status: "active",
      referrerId: 3, // referral user id
      managerId: 2, // manager user id
      plan: "standart",
      totalSpent: 5000,
      password: "$2b$10$7g5LkD2aX.nZ2OzjKuOZLe5iQrzYB8D888g8GhVD8XZqaUI1CS0TK", // 123456
    };
    this.createUser(user1);

    const user2: InsertUser = {
      name: "Ольга Козлова",
      email: "user2@example.com",
      role: "user",
      status: "active",
      referrerId: 3, // referral user id
      managerId: 3, // self-managed by the referral
      plan: "premium",
      totalSpent: 10000,
      password: "$2b$10$7g5LkD2aX.nZ2OzjKuOZLe5iQrzYB8D888g8GhVD8XZqaUI1CS0TK", // 123456
    };
    this.createUser(user2);

    // Create a few transactions
    const transaction1: InsertReferralTransaction = {
      userId: 4, // user1
      referrerId: 3,
      managerId: 2,
      amount: 5000,
      referralCommission: 1000, // 20%
      managerCommission: 500, // 10%
      description: "Оплата тарифа Standart",
      status: "processed",
    };
    this.createReferralTransaction(transaction1);

    const transaction2: InsertReferralTransaction = {
      userId: 5, // user2
      referrerId: 3,
      managerId: 3,
      amount: 10000,
      referralCommission: 2000, // 20%
      managerCommission: 1000, // 10%
      description: "Оплата тарифа Premium",
      status: "processed",
    };
    this.createReferralTransaction(transaction2);

    // Create demo metrics
    const demoMetric: InsertMetric = {
      date: new Date(),
      totalConversations: 2583,
      avgResponseTime: 1800, // milliseconds
      successRate: 94, // percentage
      topicData: {
        Цены: 85,
        Доставка: 68,
        Возврат: 54,
        Гарантия: 32,
        Оплата: 21,
      },
    };
    this.createMetric(demoMetric);

    // Create demo assistants
    const salesManager: InsertAssistant = {
      name: "Менеджер продаж",
      description: "Помощник для работы с клиентами по вопросам продаж",
      role: "sales",
      status: "active",
      createdBy: 1,
      prompt:
        "Вы - опытный менеджер по продажам, который помогает клиентам выбрать подходящий товар и отвечает на вопросы о ценах, скидках и акциях.",
      settings: {
        language: "ru",
        model: "gpt-4",
        temperature: 0.7,
      },
    };

    const productConsultant: InsertAssistant = {
      name: "Консультант по продуктам",
      description: "Помощник по вопросам о продуктах и их характеристиках",
      role: "consultant",
      status: "active",
      createdBy: 1,
      prompt:
        "Вы - эксперт по продуктам компании, который хорошо знает все характеристики товаров и может давать развернутые консультации.",
      settings: {
        language: "ru",
        model: "gpt-4",
        temperature: 0.5,
      },
    };

    const techSupport: InsertAssistant = {
      name: "Техническая поддержка",
      description: "Помощник по техническим вопросам и проблемам",
      role: "support",
      status: "training",
      createdBy: 1,
      prompt:
        "Вы - специалист технической поддержки, который помогает пользователям решать технические проблемы с товарами и сервисами компании.",
      settings: {
        language: "ru",
        model: "gpt-4",
        temperature: 0.3,
      },
    };

    this.createAssistant(salesManager);
    this.createAssistant(productConsultant);
    this.createAssistant(techSupport);

    // Create demo knowledge items
    const catalog: InsertKnowledgeItem = {
      title: "Каталог товаров 2023.pdf",
      fileType: "pdf",
      contentType: "application/pdf",
      fileSize: 4300000, // ~4.2MB
      content: "Содержимое каталога товаров",
      uploadedBy: 1,
      path: "/files/catalog2023.pdf",
    };

    const userGuide: InsertKnowledgeItem = {
      title: "Инструкция для новых пользователей.docx",
      fileType: "docx",
      contentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileSize: 1800000, // ~1.8MB
      content: "Содержимое инструкции для пользователей",
      uploadedBy: 1,
      path: "/files/userguide.docx",
    };

    const salesReport: InsertKnowledgeItem = {
      title: "Отчет по продажам Q3.xlsx",
      fileType: "xlsx",
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      fileSize: 2400000, // ~2.4MB
      content: "Содержимое отчета по продажам",
      uploadedBy: 1,
      path: "/files/salesreport_q3.xlsx",
    };

    this.createKnowledgeItem(catalog);
    this.createKnowledgeItem(userGuide);
    this.createKnowledgeItem(salesReport);

    // Create demo activity logs
    const activityLog1: InsertActivityLog = {
      userId: null,
      assistantId: 1,
      action: "processed_requests",
      details: { count: 15, successful: true },
    };

    const activityLog2: InsertActivityLog = {
      userId: 1,
      assistantId: null,
      action: "added_team_member",
      details: { name: "Мария Иванова", role: "Редактор базы знаний" },
    };

    const activityLog3: InsertActivityLog = {
      userId: 1,
      assistantId: null,
      action: "sent_newsletter",
      details: { recipients: 2150, name: "Рассылка новостей" },
    };

    const activityLog4: InsertActivityLog = {
      userId: 1,
      assistantId: null,
      action: "connected_channel",
      details: { type: "telegram", name: "Telegram канал" },
    };

    this.createActivityLog(activityLog1);
    this.createActivityLog(activityLog2);
    this.createActivityLog(activityLog3);
    this.createActivityLog(activityLog4);

    // Create demo testimonials
    const testimonial1: InsertTestimonial = {
      userId: 4,
      name: "Алексей Сидоров",
      company: "ТехноПлюс",
      position: "Директор по продажам",
      content:
        "Асиссто помог нам автоматизировать обработку типовых запросов от клиентов. Ассистенты отвечают на 70% вопросов без участия операторов, что позволило нам сократить время ответа и повысить удовлетворенность клиентов.",
      rating: 5,
      status: "approved",
      imageUrl: "https://randomuser.me/api/portraits/men/44.jpg",
    };

    const testimonial2: InsertTestimonial = {
      userId: 5,
      name: "Ольга Козлова",
      company: "МедиаСеть",
      position: "Руководитель отдела поддержки",
      content:
        "Мы используем Асиссто для поддержки клиентов нашего интернет-магазина. За три месяца использования количество обращений к живым операторам снизилось на 45%, а скорость ответа на типовые вопросы стала мгновенной. Очень рекомендую!",
      rating: 5,
      status: "approved",
      imageUrl: "https://randomuser.me/api/portraits/women/63.jpg",
    };

    const testimonial3: InsertTestimonial = {
      userId: 3,
      name: "Сергей Иванов",
      company: "ИТ Консалтинг",
      position: "CTO",
      content:
        "Внедрение Асиссто в нашу систему обслуживания клиентов позволило нам сэкономить около 30% бюджета на поддержку. Особенно впечатляет возможность обучать ассистентов на собственных данных компании.",
      rating: 4,
      status: "approved",
      imageUrl: "https://randomuser.me/api/portraits/men/32.jpg",
    };

    this.createTestimonial(testimonial1);
    this.createTestimonial(testimonial2);
    this.createTestimonial(testimonial3);
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  // Replaced with email-based auth

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.phone === phone);
  }

  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.referralCode === referralCode
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = {
      id,
      name: insertUser.name || null,
      email: insertUser.email || null,
      phone: insertUser.phone || null,
      password: insertUser.password || null,
      role: insertUser.role || "user",
      status: insertUser.status || "active",
      createdAt: now,
      lastLogin: null,
      plan: insertUser.plan || "free",
      referrerId: insertUser.referrerId || null,
      managerId: insertUser.managerId || null,
      totalSpent: insertUser.totalSpent || 0,
      balance: insertUser.balance || 0,
      referralCode: insertUser.referralCode || null,
      referralCommission: insertUser.referralCommission || 0,
      trialUsed: insertUser.trialUsed || false,
      trialEndDate: insertUser.trialEndDate || null,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(
    id: number,
    userData: Partial<InsertUser>
  ): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async listUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter((user) => user.role === role);
  }

  async listUsersByReferrer(referrerId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.referrerId === referrerId
    );
  }

  async listUsersByManager(managerId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.managerId === managerId
    );
  }

  async listUsersWithoutManager(): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.managerId === null
    );
  }

  // Assistants
  async getAssistant(id: number): Promise<Assistant | undefined> {
    return this.assistants.get(id);
  }

  async getAssistantByOpenAIId(
    openaiAssistantId: string
  ): Promise<Assistant | undefined> {
    return Array.from(this.assistants.values()).find(
      (assistant) => assistant.openaiAssistantId === openaiAssistantId
    );
  }

  async createAssistant(insertAssistant: InsertAssistant): Promise<Assistant> {
    const id = this.assistantIdCounter++;
    const now = new Date();
    const assistant: Assistant = {
      ...insertAssistant,
      id,
      lastUpdated: now,
      status: insertAssistant.status || "active",
      description: insertAssistant.description || null,
      openaiAssistantId: insertAssistant.openaiAssistantId || null,
      instructions: insertAssistant.instructions || null,
      model: insertAssistant.model || "gpt-4o",
    };
    this.assistants.set(id, assistant);
    return assistant;
  }

  async updateAssistant(
    id: number,
    assistantData: Partial<InsertAssistant>
  ): Promise<Assistant | undefined> {
    const assistant = this.assistants.get(id);
    if (!assistant) return undefined;

    const now = new Date();
    const updatedAssistant = {
      ...assistant,
      ...assistantData,
      lastUpdated: now,
    };
    this.assistants.set(id, updatedAssistant);
    return updatedAssistant;
  }

  async listAssistants(): Promise<Assistant[]> {
    return Array.from(this.assistants.values());
  }

  async listAssistantsByUser(userId: number): Promise<Assistant[]> {
    return Array.from(this.assistants.values()).filter(
      (assistant) => assistant.createdBy === userId
    );
  }

  // Assistant Files
  async getAssistantFile(id: number): Promise<AssistantFile | undefined> {
    return this.assistantFiles.get(id);
  }

  async createAssistantFile(file: InsertAssistantFile): Promise<AssistantFile> {
    const id = this.assistantFileIdCounter++;
    const now = new Date();
    const assistantFile: AssistantFile = {
      id,
      assistantId: file.assistantId,
      openaiFileId: file.openaiFileId,
      fileName: file.fileName,
      fileType: file.fileType || null,
      fileSize: file.fileSize || null,
      uploadedBy: file.uploadedBy,
      uploadedAt: now,
      knowledgeItemId: file.knowledgeItemId || null,
    };
    this.assistantFiles.set(id, assistantFile);
    return assistantFile;
  }

  async listAssistantFiles(assistantId: number): Promise<AssistantFile[]> {
    return Array.from(this.assistantFiles.values()).filter(
      (file) => file.assistantId === assistantId
    );
  }

  async deleteAssistantFile(id: number): Promise<boolean> {
    return this.assistantFiles.delete(id);
  }

  // Knowledge Base
  async getKnowledgeItem(id: number): Promise<KnowledgeItem | undefined> {
    return this.knowledgeItems.get(id);
  }

  async createKnowledgeItem(
    insertItem: InsertKnowledgeItem
  ): Promise<KnowledgeItem> {
    const id = this.knowledgeItemIdCounter++;
    const now = new Date();
    const item: KnowledgeItem = {
      id,
      path: insertItem.path || null,
      openaiFileId: insertItem.openaiFileId || null,
      fileType: insertItem.fileType,
      fileSize: insertItem.fileSize,
      uploadedBy: insertItem.uploadedBy,
      uploadedAt: now,
      title: insertItem.title,
      contentType: insertItem.contentType,
      content: insertItem.content || null,
    };
    this.knowledgeItems.set(id, item);
    return item;
  }

  async updateKnowledgeItem(
    id: number,
    itemData: Partial<InsertKnowledgeItem>
  ): Promise<KnowledgeItem | undefined> {
    const item = this.knowledgeItems.get(id);
    if (!item) return undefined;

    const updatedItem = { ...item, ...itemData };
    this.knowledgeItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteKnowledgeItem(id: number): Promise<boolean> {
    return this.knowledgeItems.delete(id);
  }

  async listKnowledgeItems(): Promise<KnowledgeItem[]> {
    return Array.from(this.knowledgeItems.values());
  }

  async listAssistantFilesByKnowledgeItem(
    knowledgeItemId: number
  ): Promise<AssistantFile[]> {
    return Array.from(this.assistantFiles.values()).filter(
      (file) => file.knowledgeItemId === knowledgeItemId
    );
  }

  // Channels
  async getChannel(id: number): Promise<Channel | undefined> {
    return this.channels.get(id);
  }

  async createChannel(insertChannel: InsertChannel): Promise<Channel> {
    const id = this.channelIdCounter++;
    const now = new Date();
    const channel: Channel = {
      ...insertChannel,
      id,
      createdAt: now,
      status: insertChannel.status || "active",
    };
    this.channels.set(id, channel);
    return channel;
  }

  async updateChannel(
    id: number,
    channelData: Partial<InsertChannel>
  ): Promise<Channel | undefined> {
    const channel = this.channels.get(id);
    if (!channel) return undefined;

    const updatedChannel = { ...channel, ...channelData };
    this.channels.set(id, updatedChannel);
    return updatedChannel;
  }

  async deleteChannel(id: number): Promise<boolean> {
    return this.channels.delete(id);
  }

  async listChannels(): Promise<Channel[]> {
    return Array.from(this.channels.values());
  }

  // Conversations
  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async createConversation(
    insertConversation: InsertConversation
  ): Promise<Conversation> {
    const id = this.conversationIdCounter++;
    const now = new Date();
    const conversation: Conversation = {
      id,
      startedAt: now,
      lastMessageAt: now,
      status: insertConversation.status || "active",
      assistantId: insertConversation.assistantId || null,
      userId: insertConversation.userId || null,
      threadId: insertConversation.threadId || null,
      channelId: insertConversation.channelId,
      createdBy: insertConversation.createdBy || 0,
      externalUserId: insertConversation.externalUserId || null,
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async updateConversation(
    id: number,
    conversationData: Partial<InsertConversation>
  ): Promise<Conversation | undefined> {
    const conversation = this.conversations.get(id);
    if (!conversation) return undefined;

    const updatedConversation = {
      ...conversation,
      ...conversationData,
      lastMessageAt: new Date(),
    };
    this.conversations.set(id, updatedConversation);
    return updatedConversation;
  }

  async listConversations(
    status?: string,
    startDate?: Date
  ): Promise<Conversation[]> {
    let conversations = Array.from(this.conversations.values());

    // Фильтруем по статусу, если указан
    if (status) {
      conversations = conversations.filter((conv) => conv.status === status);
    }

    // Фильтруем по дате начала, если указана
    if (startDate) {
      conversations = conversations.filter(
        (conv) => new Date(conv.startedAt) >= startDate
      );
      console.log(
        `Отфильтровано ${
          conversations.length
        } диалогов начиная с ${startDate.toISOString()}`
      );
    }

    return conversations;
  }

  async listConversationsByChannel(channelId: number): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).filter(
      (conversation) => conversation.channelId === channelId
    );
  }

  // Messages
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const now = new Date();
    const message: Message = {
      id,
      content: insertMessage.content,
      conversationId: insertMessage.conversationId,
      senderId: insertMessage.senderId || null,
      senderType: insertMessage.senderType,
      timestamp: now,
      metadata: insertMessage.metadata || null,
    };
    this.messages.set(id, message);

    // Update the conversation's lastMessageAt
    const conversation = this.conversations.get(insertMessage.conversationId);
    if (conversation) {
      this.conversations.set(insertMessage.conversationId, {
        ...conversation,
        lastMessageAt: now,
      });
    }

    return message;
  }

  async listMessagesByConversation(conversationId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((message) => message.conversationId === conversationId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  // Metrics
  async getMetric(id: number): Promise<Metric | undefined> {
    return this.metrics.get(id);
  }

  async createMetric(insertMetric: InsertMetric): Promise<Metric> {
    const id = this.metricIdCounter++;
    const now = new Date();
    const metric: Metric = {
      ...insertMetric,
      id,
      date: insertMetric.date || now,
      totalConversations: insertMetric.totalConversations || 0,
      totalMessages: insertMetric.totalMessages || 0,
      avgResponseTime: insertMetric.avgResponseTime || 0,
      successRate: insertMetric.successRate || 0,
      topicData: insertMetric.topicData || {},
    };
    this.metrics.set(id, metric);
    return metric;
  }

  async getLatestMetrics(limit: number): Promise<Metric[]> {
    return Array.from(this.metrics.values())
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit);
  }

  // Activity Logs
  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const id = this.activityLogIdCounter++;
    const now = new Date();
    const log: ActivityLog = {
      ...insertLog,
      id,
      timestamp: now,
      assistantId: insertLog.assistantId || null,
      userId: insertLog.userId || null,
      details: insertLog.details || {},
    };
    this.activityLogs.set(id, log);
    return log;
  }

  async listRecentActivityLogs(
    limit: number,
    userId?: number
  ): Promise<ActivityLog[]> {
    let logs = Array.from(this.activityLogs.values());

    // Фильтруем по userId, если указан
    if (userId !== undefined) {
      logs = logs.filter((log) => log.userId === userId);
    }

    // Сортируем по времени
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Возвращаем первые limit записей
    return logs.slice(0, limit);
  }

  // Referral Transactions
  async createReferralTransaction(
    transaction: InsertReferralTransaction
  ): Promise<ReferralTransaction> {
    const id = this.referralTransactionIdCounter++;
    const now = new Date();
    const newTransaction: ReferralTransaction = {
      ...transaction,
      id,
      createdAt: now,
      status: transaction.status || "pending",
      referrerId: transaction.referrerId || null,
      managerId: transaction.managerId || null,
      description: transaction.description || null,
      referralCommission: transaction.referralCommission || null,
      managerCommission: transaction.managerCommission || null,
    };
    this.referralTransactions.set(id, newTransaction);
    return newTransaction;
  }

  async getReferralTransaction(
    id: number
  ): Promise<ReferralTransaction | undefined> {
    return this.referralTransactions.get(id);
  }

  async updateReferralTransaction(
    id: number,
    transactionData: Partial<InsertReferralTransaction>
  ): Promise<ReferralTransaction | undefined> {
    const transaction = this.referralTransactions.get(id);
    if (!transaction) return undefined;

    const updatedTransaction = { ...transaction, ...transactionData };
    this.referralTransactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async listReferralTransactions(): Promise<ReferralTransaction[]> {
    return Array.from(this.referralTransactions.values());
  }

  async listReferralTransactionsByUser(
    userId: number
  ): Promise<ReferralTransaction[]> {
    return Array.from(this.referralTransactions.values()).filter(
      (transaction) => transaction.userId === userId
    );
  }

  async listReferralTransactionsByReferrer(
    referrerId: number
  ): Promise<ReferralTransaction[]> {
    return Array.from(this.referralTransactions.values()).filter(
      (transaction) => transaction.referrerId === referrerId
    );
  }

  async listReferralTransactionsByManager(
    managerId: number
  ): Promise<ReferralTransaction[]> {
    return Array.from(this.referralTransactions.values()).filter(
      (transaction) => transaction.managerId === managerId
    );
  }

  async calculateTotalCommission(
    userId: number,
    role: "referrer" | "manager"
  ): Promise<number> {
    const transactions =
      role === "referrer"
        ? await this.listReferralTransactionsByReferrer(userId)
        : await this.listReferralTransactionsByManager(userId);

    return transactions.reduce((total, transaction) => {
      const commission =
        role === "referrer"
          ? transaction.referralCommission || 0
          : transaction.managerCommission || 0;
      return total + commission;
    }, 0);
  }

  // Assistant Channels
  async getAssistantChannel(id: number): Promise<AssistantChannel | undefined> {
    return this.assistantChannels.get(id);
  }

  async getAssistantChannelByAssistantAndChannel(
    assistantId: number,
    channelId: number
  ): Promise<AssistantChannel | undefined> {
    return Array.from(this.assistantChannels.values()).find(
      (ac) => ac.assistantId === assistantId && ac.channelId === channelId
    );
  }

  async getAssistantChannelByChannel(
    channelId: number
  ): Promise<AssistantChannel | undefined> {
    const assistantChannels = Array.from(
      this.assistantChannels.values()
    ).filter((ac) => ac.channelId === channelId && ac.enabled === true);

    // Сначала ищем канал, который помечен как isDefault
    const defaultChannel = assistantChannels.find(
      (ac) => ac.isDefault === true
    );
    if (defaultChannel) {
      return defaultChannel;
    }

    // Если нет канала с isDefault, возвращаем первый найденный
    return assistantChannels.length > 0 ? assistantChannels[0] : undefined;
  }

  async createAssistantChannel(
    insertAssistantChannel: InsertAssistantChannel
  ): Promise<AssistantChannel> {
    const id = this.assistantChannelIdCounter++;
    const now = new Date();
    const assistantChannel: AssistantChannel = {
      id,
      assistantId: insertAssistantChannel.assistantId,
      channelId: insertAssistantChannel.channelId,
      enabled:
        insertAssistantChannel.enabled !== undefined
          ? insertAssistantChannel.enabled
          : true,
      autoReply:
        insertAssistantChannel.autoReply !== undefined
          ? insertAssistantChannel.autoReply
          : true,
      isDefault:
        insertAssistantChannel.isDefault !== undefined
          ? insertAssistantChannel.isDefault
          : false,
      settings: insertAssistantChannel.settings || {},
      createdAt: now,
      updatedAt: now,
    };
    this.assistantChannels.set(id, assistantChannel);
    return assistantChannel;
  }

  async updateAssistantChannel(
    id: number,
    assistantChannelData: Partial<InsertAssistantChannel>
  ): Promise<AssistantChannel | undefined> {
    const assistantChannel = this.assistantChannels.get(id);
    if (!assistantChannel) return undefined;

    const now = new Date();
    const updatedAssistantChannel = {
      ...assistantChannel,
      ...assistantChannelData,
      updatedAt: now,
    };
    this.assistantChannels.set(id, updatedAssistantChannel);
    return updatedAssistantChannel;
  }

  async deleteAssistantChannel(id: number): Promise<boolean> {
    return this.assistantChannels.delete(id);
  }

  async listAssistantChannelsByAssistant(
    assistantId: number
  ): Promise<AssistantChannel[]> {
    return Array.from(this.assistantChannels.values()).filter(
      (ac) => ac.assistantId === assistantId
    );
  }

  async listAssistantChannelsByChannel(
    channelId: number
  ): Promise<AssistantChannel[]> {
    return Array.from(this.assistantChannels.values()).filter(
      (ac) => ac.channelId === channelId
    );
  }

  // Testimonials
  async getTestimonial(id: number): Promise<Testimonial | undefined> {
    return this.testimonials.get(id);
  }

  async createTestimonial(
    insertTestimonial: InsertTestimonial
  ): Promise<Testimonial> {
    const id = this.testimonialIdCounter++;
    const now = new Date();
    const testimonial: Testimonial = {
      id,
      userId: insertTestimonial.userId,
      name: insertTestimonial.name,
      company: insertTestimonial.company || null,
      position: insertTestimonial.position || null,
      content: insertTestimonial.content,
      rating: insertTestimonial.rating,
      status: insertTestimonial.status || "pending",
      createdAt: now,
      imageUrl: insertTestimonial.imageUrl || null,
    };
    this.testimonials.set(id, testimonial);
    return testimonial;
  }

  async updateTestimonial(
    id: number,
    testimonialData: Partial<InsertTestimonial>
  ): Promise<Testimonial | undefined> {
    const testimonial = this.testimonials.get(id);
    if (!testimonial) return undefined;

    const updatedTestimonial = { ...testimonial, ...testimonialData };
    this.testimonials.set(id, updatedTestimonial);
    return updatedTestimonial;
  }

  async listTestimonials(): Promise<Testimonial[]> {
    return Array.from(this.testimonials.values());
  }

  async listApprovedTestimonials(): Promise<Testimonial[]> {
    return Array.from(this.testimonials.values())
      .filter((testimonial) => testimonial.status === "approved")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async listTestimonialsByUser(userId: number): Promise<Testimonial[]> {
    return Array.from(this.testimonials.values())
      .filter((testimonial) => testimonial.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Email Campaigns
  async getEmailCampaign(id: number): Promise<EmailCampaign | undefined> {
    return this.emailCampaigns.get(id);
  }

  async createEmailCampaign(
    insertCampaign: InsertEmailCampaign
  ): Promise<EmailCampaign> {
    const id = this.emailCampaignIdCounter++;
    const now = new Date();
    const campaign: EmailCampaign = {
      ...insertCampaign,
      id,
      createdAt: insertCampaign.createdAt || now,
      status: insertCampaign.status || "completed",
      successCount: insertCampaign.successCount || 0,
      failedCount: insertCampaign.failedCount || 0,
      templateType: insertCampaign.templateType || "standard",
    };
    this.emailCampaigns.set(id, campaign);
    return campaign;
  }

  async listEmailCampaigns(): Promise<EmailCampaign[]> {
    return Array.from(this.emailCampaigns.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async listEmailCampaignsByUser(userId: number): Promise<EmailCampaign[]> {
    return Array.from(this.emailCampaigns.values())
      .filter((campaign) => campaign.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async listEmailCampaignsByChannel(
    channelId: number
  ): Promise<EmailCampaign[]> {
    return Array.from(this.emailCampaigns.values())
      .filter((campaign) => campaign.channelId === channelId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getEmailCampaigns(params: {
    userId?: number;
    dateFrom?: Date;
    dateTo?: Date;
    channelId?: number;
    status?: string;
  }): Promise<EmailCampaign[]> {
    const { userId, dateFrom, dateTo, channelId, status } = params;

    return Array.from(this.emailCampaigns.values())
      .filter((campaign) => {
        // Фильтр по userId
        if (userId !== undefined && campaign.userId !== userId) {
          return false;
        }

        // Фильтр по dateFrom
        if (dateFrom && campaign.createdAt < dateFrom) {
          return false;
        }

        // Фильтр по dateTo
        if (dateTo && campaign.createdAt > dateTo) {
          return false;
        }

        // Фильтр по channelId
        if (channelId !== undefined && campaign.channelId !== channelId) {
          return false;
        }

        // Фильтр по status
        if (status !== undefined && campaign.status !== status) {
          return false;
        }

        return true;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getEmailCampaignsStats(): Promise<{
    totalCampaigns: number;
    totalRecipients: number;
    successRate: number;
    campaignsByTemplate: Record<string, number>;
    campaignsByMonth: Record<string, number>;
  }> {
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

  // Dialog Assistants
  async getDialogAssistant(id: number): Promise<DialogAssistant | undefined> {
    return this.dialogAssistants.get(id);
  }

  async getDialogAssistantByDialogAndChannel(
    dialogId: string,
    channelId: number
  ): Promise<DialogAssistant | undefined> {
    return Array.from(this.dialogAssistants.values()).find(
      (da) => da.dialogId === dialogId && da.channelId === channelId
    );
  }

  async createDialogAssistant(
    insertDialogAssistant: InsertDialogAssistant
  ): Promise<DialogAssistant> {
    const id = this.dialogAssistantIdCounter++;
    const now = new Date();
    const dialogAssistant: DialogAssistant = {
      id,
      channelId: insertDialogAssistant.channelId,
      dialogId: insertDialogAssistant.dialogId,
      assistantId: insertDialogAssistant.assistantId,
      enabled:
        insertDialogAssistant.enabled !== undefined
          ? insertDialogAssistant.enabled
          : true,
      autoReply:
        insertDialogAssistant.autoReply !== undefined
          ? insertDialogAssistant.autoReply
          : true,
      settings: insertDialogAssistant.settings || {},
      createdAt: now,
      updatedAt: now,
    };
    this.dialogAssistants.set(id, dialogAssistant);
    return dialogAssistant;
  }

  async updateDialogAssistant(
    id: number,
    dialogAssistantData: Partial<InsertDialogAssistant>
  ): Promise<DialogAssistant | undefined> {
    const dialogAssistant = this.dialogAssistants.get(id);
    if (!dialogAssistant) return undefined;

    const now = new Date();
    const updatedDialogAssistant = {
      ...dialogAssistant,
      ...dialogAssistantData,
      updatedAt: now,
    };
    this.dialogAssistants.set(id, updatedDialogAssistant);
    return updatedDialogAssistant;
  }

  async deleteDialogAssistant(id: number): Promise<boolean> {
    return this.dialogAssistants.delete(id);
  }

  async listDialogAssistantsByAssistant(
    assistantId: number
  ): Promise<DialogAssistant[]> {
    return Array.from(this.dialogAssistants.values()).filter(
      (da) => da.assistantId === assistantId
    );
  }

  async listDialogAssistantsByChannel(
    channelId: number
  ): Promise<DialogAssistant[]> {
    return Array.from(this.dialogAssistants.values()).filter(
      (da) => da.channelId === channelId
    );
  }

  async listDialogAssistantsByDialog(
    dialogId: string
  ): Promise<DialogAssistant[]> {
    return Array.from(this.dialogAssistants.values()).filter(
      (da) => da.dialogId === dialogId
    );
  }

  // Payments
  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = this.paymentIdCounter++;
    const now = new Date();
    const payment: Payment = {
      id,
      userId: insertPayment.userId,
      amount: insertPayment.amount,
      paymentId: insertPayment.paymentId || null,
      status: insertPayment.status || "pending",
      createdAt: now,
      completedAt: insertPayment.completedAt || null,
      description: insertPayment.description || null,
      paymentUrl: insertPayment.paymentUrl || null,
      metadata: insertPayment.metadata || null,
    };
    this.payments.set(id, payment);
    return payment;
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async getPaymentByExternalId(
    paymentId: string
  ): Promise<Payment | undefined> {
    return Array.from(this.payments.values()).find(
      (payment) => payment.paymentId === paymentId
    );
  }

  async updatePayment(
    id: number,
    paymentData: Partial<InsertPayment>
  ): Promise<Payment | undefined> {
    const payment = this.payments.get(id);
    if (!payment) return undefined;

    const updatedPayment = { ...payment, ...paymentData };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }

  async listPaymentsByUser(userId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      (payment) => payment.userId === userId
    );
  }

  // User Balance
  async updateUserBalance(
    userId: number,
    amount: number
  ): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    // Если баланс не установлен, устанавливаем его в 0
    const currentBalance = user.balance || 0;
    const updatedUser = { ...user, balance: currentBalance + amount };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Notification Channels
  async getNotificationChannel(
    id: number
  ): Promise<NotificationChannel | undefined> {
    return this.notificationChannels.get(id);
  }

  async createNotificationChannel(
    insertChannel: InsertNotificationChannel
  ): Promise<NotificationChannel> {
    const id = this.notificationChannelIdCounter++;
    const now = new Date();
    const channel: NotificationChannel = {
      ...insertChannel,
      id,
      createdAt: now,
      updatedAt: now,
      status: insertChannel.status || "active",
      priority: insertChannel.priority || 0,
      lastUsed: null,
    };
    this.notificationChannels.set(id, channel);
    return channel;
  }

  async updateNotificationChannel(
    id: number,
    channelData: Partial<InsertNotificationChannel>
  ): Promise<NotificationChannel | undefined> {
    const channel = this.notificationChannels.get(id);
    if (!channel) return undefined;

    const now = new Date();
    const updatedChannel = { ...channel, ...channelData, updatedAt: now };
    this.notificationChannels.set(id, updatedChannel);
    return updatedChannel;
  }

  async deleteNotificationChannel(id: number): Promise<boolean> {
    return this.notificationChannels.delete(id);
  }

  async listNotificationChannels(): Promise<NotificationChannel[]> {
    return Array.from(this.notificationChannels.values());
  }

  async listNotificationChannelsByUser(
    userId: number
  ): Promise<NotificationChannel[]> {
    return Array.from(this.notificationChannels.values()).filter(
      (channel) => channel.createdBy === userId
    );
  }

  // OpenAI Functions
  async getOpenAiFunction(id: number): Promise<OpenAiFunction | undefined> {
    return this.openAiFunctions.get(id);
  }

  async createOpenAiFunction(
    insertFunction: InsertOpenAiFunction
  ): Promise<OpenAiFunction> {
    const id = this.openAiFunctionIdCounter++;
    const now = new Date();
    const func: OpenAiFunction = {
      ...insertFunction,
      id,
      createdAt: now,
      updatedAt: now,
      description: insertFunction.description || null,
      channelId: insertFunction.channelId || null,
    };
    this.openAiFunctions.set(id, func);
    return func;
  }

  async updateOpenAiFunction(
    id: number,
    functionData: Partial<InsertOpenAiFunction>
  ): Promise<OpenAiFunction | undefined> {
    const func = this.openAiFunctions.get(id);
    if (!func) return undefined;

    const now = new Date();
    const updatedFunction = { ...func, ...functionData, updatedAt: now };
    this.openAiFunctions.set(id, updatedFunction);
    return updatedFunction;
  }

  async deleteOpenAiFunction(id: number): Promise<boolean> {
    return this.openAiFunctions.delete(id);
  }

  async listOpenAiFunctions(): Promise<OpenAiFunction[]> {
    return Array.from(this.openAiFunctions.values());
  }

  async listOpenAiFunctionsByUser(userId: number): Promise<OpenAiFunction[]> {
    return Array.from(this.openAiFunctions.values()).filter(
      (func) => func.createdBy === userId
    );
  }

  // Function Assistants
  async getFunctionAssistant(
    id: number
  ): Promise<FunctionAssistant | undefined> {
    return this.functionAssistants.get(id);
  }

  async getFunctionAssistantByFunctionAndAssistant(
    functionId: number,
    assistantId: number
  ): Promise<FunctionAssistant | undefined> {
    return Array.from(this.functionAssistants.values()).find(
      (item) =>
        item.functionId === functionId && item.assistantId === assistantId
    );
  }

  async createFunctionAssistant(
    insertFunctionAssistant: InsertFunctionAssistant
  ): Promise<FunctionAssistant> {
    const id = this.functionAssistantIdCounter++;
    const now = new Date();
    const functionAssistant: FunctionAssistant = {
      ...insertFunctionAssistant,
      id,
      createdAt: now,
      updatedAt: now,
      enabled:
        insertFunctionAssistant.enabled !== undefined
          ? insertFunctionAssistant.enabled
          : true,
      channelEnabled:
        insertFunctionAssistant.channelEnabled !== undefined
          ? insertFunctionAssistant.channelEnabled
          : true,
      settings: insertFunctionAssistant.settings || {},
      lastUsed: null,
    };
    this.functionAssistants.set(id, functionAssistant);
    return functionAssistant;
  }

  async updateFunctionAssistant(
    id: number,
    data: Partial<InsertFunctionAssistant>
  ): Promise<FunctionAssistant | undefined> {
    const functionAssistant = this.functionAssistants.get(id);
    if (!functionAssistant) return undefined;

    const now = new Date();
    const updatedFunctionAssistant = {
      ...functionAssistant,
      ...data,
      updatedAt: now,
    };
    this.functionAssistants.set(id, updatedFunctionAssistant);
    return updatedFunctionAssistant;
  }

  async deleteFunctionAssistant(id: number): Promise<boolean> {
    return this.functionAssistants.delete(id);
  }

  async listFunctionAssistantsByAssistant(
    assistantId: number
  ): Promise<FunctionAssistant[]> {
    return Array.from(this.functionAssistants.values()).filter(
      (item) => item.assistantId === assistantId
    );
  }

  async listFunctionAssistantsByFunction(
    functionId: number
  ): Promise<FunctionAssistant[]> {
    return Array.from(this.functionAssistants.values()).filter(
      (item) => item.functionId === functionId
    );
  }

  async listFunctionAssistantsByNotificationChannel(
    notificationChannelId: number
  ): Promise<FunctionAssistant[]> {
    return Array.from(this.functionAssistants.values()).filter(
      (item) => item.notificationChannelId === notificationChannelId
    );
  }
}

import { PostgresStorage } from "./postgres-storage";

// Create an in-memory storage instance for fallback or testing
export const memStorage = new MemStorage();

// Use PostgreSQL storage by default, falling back to in-memory if env var is not set
export const storage = process.env.DATABASE_URL
  ? new PostgresStorage()
  : memStorage;
