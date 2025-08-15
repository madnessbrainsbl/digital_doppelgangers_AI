import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface PlanChangeLog {
  timestamp: Date;
  changedBy: {
    id: number;
    email: string;
    name?: string;
  };
  targetUser: {
    id: number;
    email: string;
    name?: string;
  };
  oldPlan: string | null;
  newPlan: string;
}

export class PlanChangeLogger {
  private logFilePath: string;

  constructor() {
    const projectRoot = process.cwd();

    this.logFilePath = path.join(
      projectRoot,
      "server",
      "logs",
      "switch-plan-log.txt"
    );
  }

  async logPlanChange(logEntry: PlanChangeLog): Promise<void> {
    try {
      // Форматируем запись лога
      const logLine = this.formatLogEntry(logEntry);

      // Добавляем запись в файл
      await fs.appendFile(this.logFilePath, logLine + "\n", "utf8");

      console.log("План change logged:", logLine);
    } catch (error) {
      console.error("Ошибка при записи лога изменения тарифа:", error);
      // Не прерываем основной процесс из-за ошибки логирования
    }
  }

  private formatLogEntry(entry: PlanChangeLog): string {
    const date = entry.timestamp;
    const dateStr = date.toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const timeStr = date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const changedByName = entry.changedBy.name || entry.changedBy.email;
    const targetUserName = entry.targetUser.name || entry.targetUser.email;
    const oldPlan = entry.oldPlan || "не установлен";

    return `[${dateStr} ${timeStr}] ${changedByName} (ID: ${entry.changedBy.id}) изменил тариф пользователя ${targetUserName} (ID: ${entry.targetUser.id}) с "${oldPlan}" на "${entry.newPlan}"`;
  }

  async ensureLogFileExists(): Promise<void> {
    try {
      // Получаем путь к директории logs
      const logDir = path.dirname(this.logFilePath);

      // Проверяем существование директории logs
      try {
        await fs.access(logDir);
        console.log(`Директория logs уже существует: ${logDir}`);
      } catch {
        console.log(`Директория logs не найдена, создаем: ${logDir}`);
        // Создаем директорию рекурсивно (включая все родительские директории)
        await fs.mkdir(logDir, { recursive: true });
        console.log(`✅ Директория logs успешно создана: ${logDir}`);
      }

      // Проверяем существование файла лога
      try {
        await fs.access(this.logFilePath);
        console.log(`Лог-файл уже существует: ${this.logFilePath}`);
      } catch {
        console.log(`Лог-файл не найден, создаем: ${this.logFilePath}`);
        // Файл не существует, создаем его с заголовком
        const header = "=== Лог изменений тарифных планов ===\n";
        await fs.writeFile(this.logFilePath, header, "utf8");
        console.log(`✅ Лог-файл успешно создан: ${this.logFilePath}`);
      }
    } catch (error) {
      console.error("Ошибка при создании директории или лог-файла:", error);
      throw error; // Пробрасываем ошибку, чтобы вызывающий код знал о проблеме
    }
  }
}

// Экспортируем единственный экземпляр логгера
export const planChangeLogger = new PlanChangeLogger();
