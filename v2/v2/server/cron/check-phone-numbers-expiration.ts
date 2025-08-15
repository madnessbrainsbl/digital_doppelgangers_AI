import { db } from "../db";
import { telephonyNumbers, users, payments } from "../../shared/schema";
import { eq, and, lte } from "drizzle-orm";
import axios from "axios";
import "dotenv/config";

// Конфигурация Voximplant API
const VOXIMPLANT_API_URL = "https://api.voximplant.com/platform_api";
const VOXIMPLANT_API_KEY = process.env.VOXIMPLANT_API_KEY;
const VOXIMPLANT_ACCOUNT_ID = process.env.VOXIMPLANT_ACCOUNT_ID;

// Стоимость одной минуты звонка в рублях
const PHONE_RENTAL_MARKUP = 100; // Наценка в рублях

export async function checkPhoneNumbersExpiration() {
  console.log(
    `[CRON] Проверка истекших телефонных номеров начата: ${new Date().toISOString()}`
  );

  try {
    // Получаем все активные номера с истекшим сроком аренды
    const expiredNumbers = await db
      .select({
        number: telephonyNumbers,
        user: users,
      })
      .from(telephonyNumbers)
      .innerJoin(users, eq(telephonyNumbers.userId, users.id))
      .where(
        and(
          eq(telephonyNumbers.deactivated, false),
          lte(telephonyNumbers.phone_next_renewal, new Date())
        )
      );

    console.log(`[CRON] Найдено ${expiredNumbers.length} истекших номеров`);

    for (const { number, user } of expiredNumbers) {
      try {
        // Рассчитываем стоимость продления (цена + наценка) в копейках
        // number.phone_price - цена указана в рублях
        const renewalCost =
          (Number(number.phone_price) + PHONE_RENTAL_MARKUP) * 100;
        // user.balance - баланс указан в копейках
        const userBalance = user.balance || 0;

        console.log(
          `[CRON] Обработка номера ${number.phone_number} пользователя ${user.email}`
        );
        console.log(
          `[CRON] Стоимость продления: ${renewalCost / 100} руб., баланс: ${
            userBalance / 100
          } руб.`
        );

        if (userBalance >= renewalCost) {
          // Достаточно средств - продляем номер
          console.log(
            `[CRON] Автоматическое продление номера ${number.phone_number}`
          );

          // Списываем средства с баланса пользователя
          await db
            .update(users)
            .set({
              balance: userBalance - renewalCost,
            })
            .where(eq(users.id, user.id));

          // Обновляем дату следующего продления (добавляем месяц)
          const nextRenewalDate = new Date();
          nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 1);

          await db
            .update(telephonyNumbers)
            .set({
              phone_next_renewal: nextRenewalDate,
              updatedAt: new Date(),
            })
            .where(eq(telephonyNumbers.id, number.id));

          // Создаем запись о платеже для истории
          await db.insert(payments).values({
            userId: user.id,
            amount: renewalCost,
            status: "succeeded",
            description: `Автоматическое продление номера ${number.phone_number}`,
            completedAt: new Date(),
            metadata: {
              type: "phone_renewal",
              phoneNumber: number.phone_number,
              renewalDate: nextRenewalDate.toISOString(),
            },
          });

          console.log(
            `[CRON] Номер ${
              number.phone_number
            } успешно продлен до ${nextRenewalDate.toISOString()}`
          );
        } else {
          // Недостаточно средств - отключаем номер
          console.log(
            `[CRON] Недостаточно средств для продления номера ${number.phone_number}`
          );

          try {
            // Отключаем номер через Voximplant API
            const apiUrl = `${VOXIMPLANT_API_URL}/DeactivatePhoneNumber`;
            const response = await axios.post(apiUrl, null, {
              params: {
                api_key: VOXIMPLANT_API_KEY,
                account_id: VOXIMPLANT_ACCOUNT_ID,
                phone_number: number.phone_number,
              },
            });

            if (response.data && response.data.result) {
              console.log(
                `[CRON] Номер ${number.phone_number} успешно отключен в Voximplant`
              );

              // Помечаем номер как деактивированный в БД
              await db
                .update(telephonyNumbers)
                .set({
                  deactivated: true,
                  can_be_used: false,
                  updatedAt: new Date(),
                })
                .where(eq(telephonyNumbers.id, number.id));

              // Создаем запись в истории платежей для отслеживания
              await db.insert(payments).values({
                userId: user.id,
                amount: 0,
                status: "canceled",
                description: `Автоматическое отключение номера ${number.phone_number} (недостаточно средств)`,
                completedAt: new Date(),
                metadata: {
                  type: "phone_deactivation",
                  phoneNumber: number.phone_number,
                  reason: "insufficient_balance",
                  requiredAmount: renewalCost,
                  availableBalance: userBalance,
                },
              });

              console.log(
                `[CRON] Номер ${number.phone_number} помечен как неактивный в БД`
              );
            } else {
              console.error(
                `[CRON] Не удалось отключить номер ${number.phone_number}:`,
                response.data?.error || "Неизвестная ошибка"
              );
            }
          } catch (error: any) {
            console.error(
              `[CRON] Ошибка при отключении номера ${number.phone_number}:`,
              error.response?.data || error.message
            );
          }
        }
      } catch (error) {
        console.error(
          `[CRON] Ошибка при обработке номера ${number.phone_number}:`,
          error
        );
      }
    }

    console.log(`[CRON] Проверка истекших телефонных номеров завершена`);
  } catch (error) {
    console.error(
      `[CRON] Критическая ошибка при проверке истекших номеров:`,
      error
    );
  }
}
