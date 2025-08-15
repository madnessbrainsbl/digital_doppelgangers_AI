import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { NewNumbers } from "./new-numbers";
import { useFetchConnectedNumber } from "@/hooks/telephony/use-fetch-connected-number";
import { Loader2 } from "lucide-react";
import { ButtonDisconnect } from "./button-disconnect";
import { TariffActivationBanner } from "./tariff-activation-banner";
import { User } from "@/hooks/telephony/type";

export function TelephonyConnect({ user }: { user: User }) {
  const {
    data: connectedNumbers,
    isError,
    isPending,
    refetch,
  } = useFetchConnectedNumber({ userId: user.id });

  if (user.plan === "free" || user.plan === "basic") {
    return <TariffActivationBanner />;
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Настройка телефонии</CardTitle>
      </CardHeader>
      <CardContent>
        {(user.plan === "standart" || user.plan === "enterprise") && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Текущий статус
              </h3>
              <div className="flex items-center">
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span className="text-neutral-600 dark:text-neutral-400">
                      Загрузка...
                    </span>
                  </>
                ) : isError ? (
                  <span className="text-red-600 dark:text-red-400">
                    Ошибка при получении подключенных номеров
                  </span>
                ) : connectedNumbers && connectedNumbers.length > 0 ? (
                  <>
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500 mr-2"></span>
                    <span className="text-neutral-800 dark:text-neutral-200">
                      Подключено {connectedNumbers.length} номеров
                    </span>
                  </>
                ) : (
                  <>
                    <span className="h-2.5 w-2.5 rounded-full bg-neutral-400 mr-2"></span>
                    <span className="text-neutral-600 dark:text-neutral-400">
                      Не подключено
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Секция с подключенными номерами */}
            {!isPending &&
              !isError &&
              connectedNumbers &&
              connectedNumbers.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Подключенные номера
                  </h3>

                  <div className="border rounded-md hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Номер</TableHead>
                          <TableHead>Регион</TableHead>
                          <TableHead>Категория</TableHead>
                          <TableHead>SMS</TableHead>
                          <TableHead>Оплачен до</TableHead>
                          <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {connectedNumbers.map((phoneNumber) => (
                          <TableRow key={phoneNumber.phone_number}>
                            <TableCell className="font-medium">
                              {phoneNumber.phone_number}
                            </TableCell>
                            <TableCell>
                              {phoneNumber.phone_region_name || "Неизвестно"}
                            </TableCell>
                            <TableCell>
                              {phoneNumber.phone_category_name || "Неизвестно"}
                            </TableCell>
                            <TableCell>
                              {phoneNumber.is_sms_supported ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  Да
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                                  Нет
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {phoneNumber.deactivated ||
                              !phoneNumber.can_be_used ||
                              new Date() >=
                                new Date(phoneNumber.phone_next_renewal) ? (
                                <span className="text-red-600 dark:text-red-400">
                                  Неактивен
                                </span>
                              ) : (
                                <span className="text-green-600 dark:text-green-400">
                                  {new Date(
                                    phoneNumber.phone_next_renewal
                                  ).toLocaleDateString("ru-RU")}
                                </span>
                              )}
                            </TableCell>
                            {user.id && (
                              <TableCell className="text-right">
                                <ButtonDisconnect
                                  userId={user.id}
                                  phoneNumberDisconnect={
                                    phoneNumber.phone_number
                                  }
                                />
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="block md:hidden">
                    <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                      Подключенные номера
                    </h3>
                    {connectedNumbers.map((phoneNumber) => (
                      <div
                        key={phoneNumber.phone_number}
                        className="border rounded-md p-4 mb-4 bg-white dark:bg-neutral-900 shadow-sm"
                      >
                        <div className="mb-3">
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                            Номер телефона:
                          </div>
                          <div className="text-lg font-medium">
                            {phoneNumber.phone_number}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                              Категория:
                            </div>
                            <div>
                              {phoneNumber.phone_category_name || "Неизвестно"}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                              Регион:
                            </div>
                            <div>
                              {phoneNumber.phone_region_name || "Неизвестно"}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                              SMS поддержка:
                            </div>
                            <div>
                              {phoneNumber.is_sms_supported ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  Да
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                                  Нет
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                              Оплачен до:
                            </div>
                            {phoneNumber.deactivated ||
                            !phoneNumber.can_be_used ||
                            new Date() >=
                              new Date(phoneNumber.phone_next_renewal) ? (
                              <div className="text-red-600 dark:text-red-400 font-medium">
                                Неактивен
                              </div>
                            ) : (
                              <div className="text-green-600 dark:text-green-400 font-medium">
                                {new Date(
                                  phoneNumber.phone_next_renewal
                                ).toLocaleDateString("ru-RU")}
                              </div>
                            )}
                          </div>
                        </div>

                        {user.id && (
                          <div className="flex justify-end mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                            <ButtonDisconnect
                              userId={user.id}
                              phoneNumberDisconnect={phoneNumber.phone_number}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {user.id && <NewNumbers userId={user.id} balance={user.balance} />}

            <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg mt-4">
              <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Примечание
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                После подключения телефонии вы сможете:
              </p>
              <ul className="list-disc list-inside text-sm text-neutral-600 dark:text-neutral-400 mt-2 space-y-1">
                <li>Принимать входящие звонки через виртуальных ассистентов</li>
                <li>Настраивать сценарии обработки звонков</li>
                <li>Получать транскрипцию и запись звонков</li>
                <li>Анализировать эффективность обработки звонков</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
