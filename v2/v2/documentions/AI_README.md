# Asissto-v2 AI Documentation

## Project Overview

Asissto-v2 is a comprehensive communication automation system that uses AI assistants to handle customer interactions across multiple channels. The system is built with a modern tech stack and follows best practices for scalability and maintainability.

## Core Components

### 1. Database Schema (shared/schema.ts)

The project uses Drizzle ORM with PostgreSQL. Key tables include:

```typescript
// Users
users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: text("email").unique(),
  phone: text("phone").unique(),
  role: text("role").notNull().default("user"),
  status: text("status").notNull().default("active"),
  // ... other fields
});

// Assistants
assistants = pgTable("assistants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  role: text("role").notNull(),
  status: text("status").notNull().default("training"),
  // ... other fields
});

// Channels
channels = pgTable("channels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull().default("inactive"),
  // ... other fields
});
```

### 2. API Structure

The project uses tRPC for type-safe API endpoints. Main routers are located in:

- `server/routers/users.ts`
- `server/routers/assistants.ts`
- `server/routers/channels.ts`
- `server/routers/conversations.ts`

### 3. Frontend Components

The frontend is built with Next.js and React. Key components include:

- Dashboard layout
- Assistant management interface
- Channel configuration
- Conversation viewer
- Analytics dashboard

## Key Features

1. **AI Assistant Management**

   - Creation and configuration of AI assistants
   - Knowledge base integration
   - Prompt and instruction management
   - OpenAI API integration

2. **Multi-channel Support**

   - SMS, Email, VK, Telegram integration
   - Unified channel management
   - Channel-specific settings

3. **User System**

   - Authentication and authorization
   - Role-based access control
   - Subscription management
   - Referral system

4. **Analytics**
   - Usage tracking
   - Performance monitoring
   - Conversation analysis

## Technical Implementation

### Database Operations

When working with the database:

1. Always use Drizzle ORM methods
2. Validate input data using Zod schemas
3. Handle transactions properly
4. Implement proper error handling

Example:

```typescript
const user = await db
  .insert(users)
  .values({
    name: "John Doe",
    email: "john@example.com",
    role: "user",
  })
  .returning();
```

### API Development

When creating new API endpoints:

1. Use tRPC procedures
2. Implement proper input validation
3. Handle errors appropriately
4. Add proper TypeScript types

Example:

```typescript
export const userRouter = router({
  create: publicProcedure
    .input(insertUserSchema)
    .mutation(async ({ input }) => {
      // Implementation
    }),
});
```

### Frontend Development

When working with the frontend:

1. Use TypeScript for type safety
2. Follow the component structure
3. Implement proper error handling
4. Use the design system

## Error Handling

The system uses a consistent error handling approach:

1. Use TRPCError for API errors
2. Implement proper error boundaries in React
3. Log errors appropriately
4. Provide user-friendly error messages

## Security Considerations

1. Always validate input data
2. Implement proper authentication checks
3. Use role-based access control
4. Protect sensitive data
5. Implement rate limiting

## Testing

The project uses:

1. Unit tests for business logic
2. Integration tests for API endpoints
3. E2E tests for critical flows
4. Component tests for UI elements

## Deployment

The system can be deployed using:

1. Docker containers
2. CI/CD pipelines
3. Environment-specific configurations
4. Database migrations

## Troubleshooting

Common issues and solutions:

1. Database connection issues
2. API authentication problems
3. Frontend rendering errors
4. Performance bottlenecks

## Best Practices

1. Follow TypeScript best practices
2. Implement proper error handling
3. Use proper logging
4. Follow security guidelines
5. Maintain code quality
6. Write proper documentation

## Recovery Points

If the AI agent encounters issues:

1. Check the database schema in shared/schema.ts
2. Verify API endpoints in server/routers/
3. Review frontend components in client/
4. Check environment configuration
5. Verify authentication flow
6. Review error logs

## Environment Configuration

### Required Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/asissto
DATABASE_AUTH_TOKEN=your_auth_token

# OpenAI
OPENAI_API_KEY=your_openai_api_key
OPENAI_ORGANIZATION=your_organization_id

# Authentication
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# External Services
SMS_API_KEY=your_sms_api_key
EMAIL_SMTP_HOST=smtp.example.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=your_email
EMAIL_SMTP_PASS=your_password
VK_API_KEY=your_vk_api_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Server
PORT=3000
NODE_ENV=development
```

### Environment-specific Configurations

1. **Development**

   - Enable detailed logging
   - Disable rate limiting
   - Use local database

2. **Production**
   - Enable caching
   - Enable rate limiting
   - Use production database
   - Enable SSL

## Database Migrations

### Migration Structure

```typescript
// migrations/0001_initial_schema.ts
import { sql } from "drizzle-orm";
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: text("email").unique(),
  // ... other fields
});

export async function up(db: any) {
  await db.schema.createTable(users);
}

export async function down(db: any) {
  await db.schema.dropTable(users);
}
```

### Running Migrations

```bash
# Generate migration
npm run drizzle-kit generate:pg

# Apply migration
npm run drizzle-kit push:pg

# Rollback migration
npm run drizzle-kit down:pg
```

## External Service Integrations

### SMS Integration

```typescript
// server/services/sms.ts
import { SMSProvider } from "./providers/sms";

export class SMSService {
  constructor(private provider: SMSProvider) {}

  async sendMessage(phone: string, message: string) {
    return this.provider.send({
      to: phone,
      text: message,
      from: process.env.SMS_SENDER,
    });
  }
}
```

### Email Integration

```typescript
// server/services/email.ts
import { createTransport } from "nodemailer";

export class EmailService {
  private transporter = createTransport({
    host: process.env.EMAIL_SMTP_HOST,
    port: parseInt(process.env.EMAIL_SMTP_PORT || "587"),
    auth: {
      user: process.env.EMAIL_SMTP_USER,
      pass: process.env.EMAIL_SMTP_PASS,
    },
  });

  async sendEmail(to: string, subject: string, html: string) {
    return this.transporter.sendMail({
      from: process.env.EMAIL_SMTP_USER,
      to,
      subject,
      html,
    });
  }
}
```

### VK Integration

```typescript
// server/services/vk.ts
import { VK } from "vk-io";

export class VKService {
  private vk = new VK({
    token: process.env.VK_API_KEY,
  });

  async sendMessage(userId: number, message: string) {
    return this.vk.api.messages.send({
      user_id: userId,
      message,
      random_id: Math.random(),
    });
  }
}
```

### Telegram Integration

```typescript
// server/services/telegram.ts
import { Telegraf } from "telegraf";

export class TelegramService {
  private bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

  async sendMessage(chatId: number, message: string) {
    return this.bot.telegram.sendMessage(chatId, message);
  }
}
```

## AI Assistant Prompts

### Base Prompt Template

```typescript
// server/prompts/base.ts
export const basePrompt = `
You are an AI assistant for {company_name}.
Your role is to {role_description}.
You should always:
1. Be professional and courteous
2. Stay within your defined role
3. Use appropriate language
4. Follow company guidelines
5. Maintain conversation context
`;
```

### Channel-specific Prompts

```typescript
// server/prompts/channels.ts
export const smsPrompt = `
You are an SMS assistant.
Keep messages concise and clear.
Use appropriate SMS language.
`;

export const emailPrompt = `
You are an email assistant.
Use professional email format.
Include proper greetings and closings.
`;

export const vkPrompt = `
You are a VK messenger assistant.
Use casual but respectful language.
Follow VK community guidelines.
`;

export const telegramPrompt = `
You are a Telegram bot assistant.
Use Telegram-specific formatting.
Support markdown and emoji.
`;
```

## Deployment

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@db:5432/asissto
    depends_on:
      - db

  db:
    image: postgres:14
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=asissto
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm install

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Deploy to production
        run: |
          docker-compose -f docker-compose.prod.yml up -d
```

### Production Deployment Checklist

1. **Pre-deployment**

   - Run all tests
   - Check environment variables
   - Verify database migrations
   - Backup database

2. **Deployment**

   - Build Docker images
   - Push to registry
   - Deploy to production
   - Run migrations

3. **Post-deployment**

   - Verify application health
   - Check logs
   - Monitor performance
   - Test critical features

4. **Rollback Plan**
   - Keep previous version
   - Database backup
   - Quick rollback procedure
   - Monitoring alerts

## Monitoring and Logging

### Logging Configuration

```typescript
// server/utils/logger.ts
import winston from "winston";

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}
```

### Health Checks

```typescript
// server/health.ts
import { router, publicProcedure } from "./trpc";

export const healthRouter = router({
  check: publicProcedure.query(async () => {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: await checkDatabase(),
        openai: await checkOpenAI(),
        sms: await checkSMS(),
        email: await checkEmail(),
      },
    };
  }),
});
```

### Performance Monitoring

```typescript
// server/middleware/performance.ts
import { middleware } from "@trpc/server";

export const performanceMiddleware = middleware(async ({ path, next }) => {
  const start = Date.now();
  const result = await next();
  const duration = Date.now() - start;

  logger.info({
    type: "performance",
    path,
    duration,
    timestamp: new Date().toISOString(),
  });

  return result;
});
```
