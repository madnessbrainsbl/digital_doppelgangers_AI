/**
 * Сервис аутентификации
 */

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { storage } from "../storage";
import { User, InsertUserWithPhone } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"; // В продакшене должен быть настоящий секретный ключ
const JWT_EXPIRATION = "7d"; // Токен действителен 7 дней
const SALT_ROUNDS = 10; // Количество раундов для bcrypt хеширования

export class AuthService {
  /**
   * Хеширование пароля
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Проверка пароля
   */
  async comparePasswords(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Генерация уникального реферального кода
   */
  generateReferralCode(): string {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    const charactersLength = characters.length;
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  /**
   * Аутентификация пользователя по email и паролю
   */
  async authenticateUser(
    email: string,
    password: string
  ): Promise<User | null> {
    const user = await storage.getUserByEmail(email);
    if (!user || !user.password) return null;

    const passwordMatch = await this.comparePasswords(password, user.password);
    if (!passwordMatch) return null;

    // Обновляем время последнего входа
    await storage.updateUser(user.id, { lastLogin: new Date() });

    return user;
  }

  /**
   * Генерация JWT токена для пользователя
   */
  generateToken(user: User): string {
    const payload = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
  }

  /**
   * Проверка JWT токена
   */
  verifyToken(
    token: string
  ): { id: number; email?: string; phone?: string; role: string } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: number;
        email?: string;
        phone?: string;
        role: string;
      };
      return decoded;
    } catch (error) {
      console.error("JWT verification failed:", error);
      return null;
    }
  }

  /**
   * Получение информации о пользователе из токена
   */
  async getUserFromToken(token: string): Promise<User | null> {
    const decoded = this.verifyToken(token);
    if (!decoded) return null;

    const user = await storage.getUser(decoded.id);
    return user || null;
  }

  /**
   * Получение пользователя по номеру телефона
   */
  async getUserByPhone(phone: string): Promise<User | null> {
    const user = await storage.getUserByPhone(phone);
    return user || null;
  }

  /**
   * Создание нового пользователя или получение существующего по email или номеру телефона
   * @param identifier Email или номер телефона
   * @param name Имя пользователя (опционально)
   * @param password Пароль (опционально)
   * @param referralCode Реферальный код (опционально)
   * @param isPhone Флаг, указывающий, что идентификатор - это номер телефона
   * @returns Информация о пользователе
   */
  async findOrCreateUser(
    identifier: string,
    name?: string,
    password?: string,
    referralCode?: string,
    isPhone: boolean = false
  ): Promise<User> {
    console.log(
      `[AUTH] findOrCreateUser called for ${
        isPhone ? "phone" : "email"
      }: ${identifier}, referralCode: ${referralCode || "none"}`
    );

    try {
      let user;

      // Для email приводим к нижнему регистру
      if (!isPhone) {
        identifier = identifier.toLowerCase();
        console.log(`[AUTH] Email converted to lowercase: ${identifier}`);
      }

      // Поиск пользователя по email или телефону в зависимости от isPhone
      if (isPhone) {
        user = await storage.getUserByPhone(identifier);
        console.log(
          `[AUTH] getUserByPhone result:`,
          user ? `Found user ID: ${user.id}` : "No user found"
        );
      } else {
        user = await storage.getUserByEmail(identifier);
        console.log(
          `[AUTH] getUserByEmail result:`,
          user ? `Found user ID: ${user.id}` : "No user found"
        );
      }

      if (!user) {
        // Хешируем пароль, если он предоставлен
        const hashedPassword = password
          ? await this.hashPassword(password)
          : null;
        console.log(`[AUTH] Password hashed:`, hashedPassword ? "Yes" : "No");

        // Получаем пользователя по реферальному коду, если он предоставлен
        let referrerId = null;
        if (referralCode) {
          try {
            const referrer = await storage.getUserByReferralCode(referralCode);
            if (referrer) {
              referrerId = referrer.id;
              console.log(
                `[AUTH] User registered with referral code: ${referralCode} (Referrer ID: ${referrerId})`
              );
            } else {
              console.log(`[AUTH] No referrer found for code: ${referralCode}`);
            }
          } catch (refErr) {
            console.error(`[AUTH] Error finding referrer:`, refErr);
          }
        }

        // Генерируем уникальный реферальный код для нового пользователя
        const userReferralCode = this.generateReferralCode();
        console.log(`[AUTH] Generated referral code: ${userReferralCode}`);

        try {
          // Создаем нового пользователя
          const userData: InsertUserWithPhone = {
            // Обязательные поля из схемы
            email: null, // По умолчанию null, будет заменено для пользователей email
            role: "user",
            status: "active",
            password: hashedPassword,
            referrerId: referrerId,
            managerId: null,
            plan: "free",
            totalSpent: 0,
            referralCode: userReferralCode,
          };

          // Добавляем email или телефон в зависимости от типа идентификатора
          if (isPhone) {
            userData.phone = identifier;
            userData.name = name || identifier; // Используем номер телефона как имя пользователя
            // Не создаем искусственный email для пользователей с телефоном
            userData.email = null; // Оставляем email пустым
          } else {
            userData.email = identifier; // Email уже приведен к нижнему регистру выше
            userData.name = name || identifier.split("@")[0]; // Используем часть email как имя, если не указано другое
          }

          console.log(
            `[AUTH] Creating user with data:`,
            JSON.stringify(userData)
          );
          user = await storage.createUser(userData);
          console.log(
            `[AUTH] Created new user: ${
              isPhone ? user.phone : user.email
            } (ID: ${user.id}) with referral code: ${userReferralCode}`
          );
        } catch (createErr) {
          console.error(`[AUTH] Error creating user:`, createErr);
          throw createErr;
        }
      }

      try {
        // Обновляем время последнего входа
        console.log(`[AUTH] Updating lastLogin for user ID: ${user.id}`);
        user = (await storage.updateUser(user.id, {
          lastLogin: new Date(),
        })) as User;
        console.log(`[AUTH] User lastLogin updated`);
      } catch (updateErr) {
        console.error(`[AUTH] Error updating lastLogin:`, updateErr);
        // Продолжаем работу, даже если обновление не удалось
      }

      return user;
    } catch (error) {
      console.error(`[AUTH] Error in findOrCreateUser:`, error);
      throw error;
    }
  }
}

export const authService = new AuthService();
