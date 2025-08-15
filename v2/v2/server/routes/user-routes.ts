import { Express, Request, Response } from "express";
import { authenticateToken } from "../middlewares/auth";
import { IStorage } from "../storage";

/**
 * Регистрирует маршруты для управления пользователями
 * @param app Express приложение
 * @param storageInstance Экземпляр хранилища
 */
export function registerUserRoutes(app: Express, storageInstance: IStorage) {
  // Маршрут для обновления email пользователя
  app.patch(
    "/api/users/:id/update-email",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const userId = parseInt(req.params.id);
        const { email } = req.body;

        // Проверяем, авторизован ли пользователь для обновления этого аккаунта
        if (req.user?.id !== userId && req.user?.role !== "admin") {
          return res
            .status(403)
            .json({
              error: "Недостаточно прав для обновления данного пользователя",
            });
        }

        // Проверяем формат email
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return res.status(400).json({ error: "Некорректный формат email" });
        }

        // Проверяем, используется ли уже этот email другим пользователем
        const existingUser = await storageInstance.getUserByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          return res.status(409).json({
            error: "Этот email уже используется другим пользователем",
            code: "email_already_in_use",
          });
        }

        // Обновляем email пользователя
        const updatedUser = await storageInstance.updateUser(userId, {
          email,
        });

        // Создаем запись в логе активности
        await storageInstance.createActivityLog({
          userId,
          action: "update_email",
          details: { email },
        });

        res.json({ success: true, user: updatedUser });
      } catch (error) {
        console.error("Ошибка при обновлении email:", error);
        res.status(500).json({ error: "Ошибка сервера при обновлении email" });
      }
    }
  );

  // Маршрут для получения баланса пользователя
  app.get(
    "/api/balance/:userId",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const userId = parseInt(req.params.userId);

        // Проверяем, авторизован ли пользователь для просмотра этого баланса
        if (req.user?.id !== userId && req.user?.role !== "admin") {
          return res
            .status(403)
            .json({ error: "Недостаточно прав для просмотра баланса" });
        }

        // Получаем пользователя
        const user = await storageInstance.getUser(userId);
        if (!user) {
          return res.status(404).json({ error: "Пользователь не найден" });
        }

        // Возвращаем баланс (если balance не определен, возвращаем 0)
        res.json({ balance: user.balance || 0 });
      } catch (error) {
        console.error("Ошибка при получении баланса:", error);
        res.status(500).json({ error: "Ошибка сервера при получении баланса" });
      }
    }
  );
}
