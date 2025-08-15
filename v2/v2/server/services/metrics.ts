import { IStorage } from "../storage";
import { db } from "../db";
import { InsertMetric } from "@shared/schema";
import { count, desc, eq, avg, max, sum, sql, and, gte } from "drizzle-orm";
import {
  messages,
  conversations,
  assistants,
  activityLogs,
} from "@shared/schema";
import { inArray } from "drizzle-orm/expressions";
import {
  calculateAvgResponseTime,
  calculateSuccessRate,
  calculateAllMetrics,
} from "../utils/metrics-calculator";
import { analyzeTopics } from "../utils/topic-analyzer";

/**
 * Сервис для работы с метриками и аналитикой
 */
export class MetricsService {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Обновляет метрики на основе текущего состояния системы
   * Данная функция должна вызываться по расписанию (например, раз в день)
   */
  async updateSystemMetrics(): Promise<void> {
    try {
      // Получаем дату начала периода (7 дней назад)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      // Очищаем кэш метрик для всех периодов перед обновлением
      const { metricsCache } = await import("../utils/metrics-calculator");
      if (metricsCache) {
        Object.keys(metricsCache).forEach((period) => {
          metricsCache[period].lastCalculation = 0;
          metricsCache[period].metrics = null;
        });
        console.log("Кэш метрик очищен перед обновлением");
      }

      // Используем детерминированный алгоритм расчета всех метрик
      const metrics = await calculateAllMetrics(startDate);

      // Создаем новую метрику для сохранения в БД
      const metric: InsertMetric = {
        totalConversations: metrics.totalConversations,
        totalMessages: metrics.totalMessages,
        avgResponseTime: metrics.avgResponseTime,
        successRate: metrics.successRate,
        topicData: metrics.topicData,
      };

      // Сохраняем метрику в базе данных
      await this.storage.createMetric(metric);

      console.log("Metrics updated successfully:", metric);
    } catch (error) {
      console.error("Error updating metrics:", error);
    }
  }

  /**
   * Получает метрики за указанный период
   * @param period Период ('day', 'week', 'month', 'year')
   * @param userId ID пользователя для фильтрации данных (опционально)
   * @returns Метрики за указанный период
   */
  async getMetricsForPeriod(period: string, userId?: string): Promise<any> {
    try {
      // Определяем дату начала периода
      let startDate = new Date();
      switch (period) {
        case "day":
          startDate.setDate(startDate.getDate() - 1);
          break;
        case "week":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case "year":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7); // По умолчанию за неделю
      }

      // Вызываем функцию calculateAllMetrics с указанием периода и userId
      const { calculateAllMetrics } = await import(
        "../utils/metrics-calculator"
      );
      const metrics = await calculateAllMetrics(startDate, period, userId);

      // Возвращаем результат, добавив информацию о периоде
      return {
        period,
        ...metrics,
      };
    } catch (error) {
      console.error(`Ошибка при получении метрик за период ${period}:`, error);
      throw error;
    }
  }
}
