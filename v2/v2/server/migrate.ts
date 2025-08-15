import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from '@shared/schema';
import { MemStorage } from './storage';
import { PostgresStorage } from './postgres-storage';
import * as fs from 'fs';

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize drizzle
const db = drizzle(pool, { schema });

/**
 * Выполняет SQL-файл миграции напрямую через пул соединений
 * @param path Путь к SQL-файлу
 */
async function runSqlMigration(path: string) {
  try {
    const sql = fs.readFileSync(path, 'utf8');
    await pool.query(sql);
    console.log(`✅ Успешно выполнена SQL-миграция: ${path}`);
    return true;
  } catch (error) {
    console.error(`❌ Ошибка при выполнении SQL-миграции ${path}:`, error);
    return false;
  }
}

/**
 * This function runs database migrations and populates the database with initial demo data
 */
export async function setupDatabase() {
  try {
    console.log('🔄 Running database migrations...');
    try {
      // Run migrations
      await migrate(db, { migrationsFolder: './migrations' });
      console.log('✅ Migrations completed successfully');
    } catch (migrationError: any) {
      // Если ошибка связана с тем, что таблицы уже существуют, можем продолжить
      if (migrationError && migrationError.code === '42P07') {
        console.log('ℹ️ Некоторые таблицы уже существуют, продолжаем работу');
      } else {
        // Если это другая ошибка, выбрасываем её
        throw migrationError;
      }
    }
    
    // Check if we already have users in the database
    const usersExist = await db.select().from(schema.users).limit(1);
    
    // If no users exist, populate with demo data from MemStorage
    if (usersExist.length === 0) {
      console.log('🔄 Populating database with demo data...');
      const memStorage = new MemStorage();
      const pgStorage = new PostgresStorage();
      
      // Get all data from memory storage
      const memUsers = await memStorage.listUsers();
      const memAssistants = await memStorage.listAssistants();
      const memKnowledgeItems = await memStorage.listKnowledgeItems();
      const memReferralTransactions = await memStorage.listReferralTransactions();
      const memMetrics = await memStorage.getLatestMetrics(10);
      
      // Transfer to PostgreSQL database
      try {
        // Insert users
        for (const user of memUsers) {
          const { id, ...userData } = user;
          await pgStorage.createUser(userData);
        }
        
        // Insert assistants
        for (const assistant of memAssistants) {
          try {
            const { id, lastUpdated, ...assistantData } = assistant;
            const { settings, ...otherData } = assistantData;
            
            // Create a well-formed JSON object from settings
            const sanitizedSettings = settings ? 
              (typeof settings === 'string' ? 
                JSON.parse(settings) : 
                JSON.parse(JSON.stringify(settings))
              ) : {};
            
            await pgStorage.createAssistant({
              ...otherData,
              settings: sanitizedSettings
            });
          } catch (err) {
            console.error('Error creating assistant:', err);
          }
        }
        
        // Insert knowledge items
        for (const item of memKnowledgeItems) {
          try {
            const { id, ...itemData } = item;
            await pgStorage.createKnowledgeItem(itemData);
          } catch (err) {
            console.error('Error creating knowledge item:', err);
          }
        }
        
        // Insert referral transactions
        for (const transaction of memReferralTransactions) {
          try {
            const { id, ...transactionData } = transaction;
            await pgStorage.createReferralTransaction(transactionData);
          } catch (err) {
            console.error('Error creating referral transaction:', err);
          }
        }
        
        // Insert metrics
        for (const metric of memMetrics) {
          try {
            const { id, ...metricData } = metric;
            const { topicData, ...otherData } = metricData;
            
            // Create a well-formed JSON object from topicData
            const sanitizedTopicData = topicData ? 
              (typeof topicData === 'string' ? 
                JSON.parse(topicData) : 
                JSON.parse(JSON.stringify(topicData))
              ) : null;
            
            await pgStorage.createMetric({
              ...otherData,
              topicData: sanitizedTopicData
            });
          } catch (err) {
            console.error('Error creating metric:', err);
          }
        }
        
        console.log('✅ Demo data populated successfully');
      } catch (error) {
        console.error('Error during demo data population:', error);
      }
    } else {
      console.log('ℹ️ Database already contains data, skipping demo data population');
    }
    
    // Проверяем, нужно ли выполнить последние миграции
    try {
      console.log('🔄 Проверка необходимости выполнения миграции баланса и платежей...');
      
      // Проверим, существует ли колонка balance в таблице users
      const hasBalanceColumn = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'balance'
      `);
      
      if (hasBalanceColumn.rowCount === 0) {
        console.log('🔄 Колонка balance отсутствует, выполняем миграцию...');
        await runSqlMigration('./migrations/20250411_add_balance_and_payments.sql');
      } else {
        console.log('✅ Колонка balance уже существует, миграция не требуется');
      }

      // Проверим, существует ли таблица payments
      const hasPaymentsTable = await pool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_name = 'payments'
      `);
      
      if (hasPaymentsTable.rowCount === 0) {
        console.log('🔄 Таблица payments отсутствует, выполняем миграцию...');
        await runSqlMigration('./migrations/20250411_add_balance_and_payments.sql');
      } else {
        console.log('✅ Таблица payments уже существует, миграция не требуется');
      }
      
      // Проверяем референтный код
      const hasReferralCodeColumn = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'referral_code'
      `);
      
      if (hasReferralCodeColumn.rowCount === 0) {
        console.log('🔄 Колонка referral_code отсутствует, выполняем миграцию...');
        await runSqlMigration('./migrations/20250411_add_referral_code_to_users.sql');
      } else {
        console.log('✅ Колонка referral_code уже существует, миграция не требуется');
      }
      
      // Проверяем колонку referral_commission в таблице users
      const hasReferralCommissionColumn = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'referral_commission'
      `);
      
      if (hasReferralCommissionColumn.rowCount === 0) {
        console.log('🔄 Колонка referral_commission отсутствует, выполняем миграцию...');
        await runSqlMigration('./migrations/20250411_add_referral_commission.sql');
      } else {
        console.log('✅ Колонка referral_commission уже существует, миграция не требуется');
      }
      
    } catch (migrationError) {
      console.error('❌ Ошибка при проверке или выполнении миграций:', migrationError);
    }
    
    console.log('✅ Database setup complete');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
}