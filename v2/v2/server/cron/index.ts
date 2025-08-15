import { checkPhoneNumbersExpiration } from "./check-phone-numbers-expiration";

// Интервал проверки телефонных номеров (каждый час)
const PHONE_CHECK_INTERVAL = 60 * 60 * 1000; // 1 час

// Интервалы для cron задач
let phoneCheckInterval: NodeJS.Timeout | null = null;

export function startCronJobs() {
  console.log("[CRON] Запуск cron задач...");

  // Запускаем проверку телефонных номеров
  // Первый запуск через минуту после старта сервера
  setTimeout(() => {
    checkPhoneNumbersExpiration();
  }, 60 * 1000);

  // Затем запускаем каждый час
  phoneCheckInterval = setInterval(() => {
    checkPhoneNumbersExpiration();
  }, PHONE_CHECK_INTERVAL);

  console.log("[CRON] Cron задачи запущены:");
  console.log(`- Проверка телефонных номеров: каждый час`);
}

export function stopCronJobs() {
  console.log("[CRON] Остановка cron задач...");

  if (phoneCheckInterval) {
    clearInterval(phoneCheckInterval);
    phoneCheckInterval = null;
  }

  console.log("[CRON] Cron задачи остановлены");
}
