/**
 * Middleware для проверки аутентификации
 */

import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Проверка JWT токена и добавление пользователя в запрос
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({ message: 'Отсутствует токен авторизации' });
    }

    const user = await authService.getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ message: 'Недействительный токен авторизации' });
    }

    // Добавляем пользователя в объект запроса
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Ошибка авторизации' });
  }
};

/**
 * Проверка роли пользователя
 */
export const checkRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Необходима авторизация' });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Недостаточно прав для выполнения операции' });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({ message: 'Ошибка при проверке роли' });
    }
  };
};