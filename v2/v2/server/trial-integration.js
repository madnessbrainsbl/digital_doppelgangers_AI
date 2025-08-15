// Этот файл для добавления в routes.ts вручную
// Импорт в верхней части файла routes.ts
import { registerTrialRoutes } from "./routes/trial-routes";

// Вызов функции в начале registerRoutes
registerTrialRoutes(app, storageInstance);

// Также добавить проверку истекших пробных периодов в ежедневный планировщик:
// Найти функцию или эндпоинт /api/scheduler/daily и добавить вызов:
await fetch("/api/scheduler/check-trials");