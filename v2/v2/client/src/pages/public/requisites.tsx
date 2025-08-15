import { PublicLayout } from "@/components/public/layout";
import { Building2, Copy, Check } from "lucide-react";
import { useState } from "react";

export default function RequisitesPage() {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const requisites = [
    {
      label: "Наименование:",
      value:
        'ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ИНТЕЛЛЕКТУАЛЬНЫЕ БИЗНЕС СИСТЕМЫ"',
      key: "name",
    },
    {
      label: "Адрес:",
      value:
        "УЛИЦА ПРОЛЕТАРСКАЯ, Д. 4, КВ./ОФ. 165, НИЖЕГОРОДСКАЯ ОБЛАСТЬ, Р-Н НИЖНИЙ НОВГОРОД, Г. НИЖНИЙ НОВГОРОД",
      key: "address",
    },
    {
      label: "Номер счёта:",
      value: "40702810329380002818",
      key: "account",
    },
    {
      label: "Валюта:",
      value: "РОССИЙСКИЙ РУБЛЬ",
      key: "currency",
    },
    {
      label: "ИНН:",
      value: "5257218470",
      key: "inn",
    },
    {
      label: "КПП:",
      value: "525701001",
      key: "kpp",
    },
    {
      label: "Банк:",
      value: "ФИЛИАЛ «НИЖЕГОРОДСКИЙ» АО «АЛЬФА-БАНК»",
      key: "bank",
    },
    {
      label: "Корреспондентский счёт:",
      value: "30101810200000000824",
      key: "correspondent",
    },
    {
      label: "БИК:",
      value: "042202824",
      key: "bik",
    },
  ];

  return (
    <PublicLayout>
      {/* Заголовок */}
      <section className="bg-gradient-to-b from-primary/5 to-white py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-5xl font-bold text-gray-900 mb-6">
              Реквизиты
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Банковские и юридические реквизиты нашей компании для оформления
              документов и проведения платежей.
            </p>
          </div>
        </div>
      </section>

      {/* Основное содержание */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Таблица реквизитов */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <tbody className="divide-y divide-gray-200">
                    {requisites.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900 align-top w-1/3 min-w-[120px]">
                          {item.label}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-gray-700 relative group">
                          <div className="flex items-start justify-between">
                            <span className="flex-1 break-words">
                              {item.value}
                            </span>
                            <button
                              onClick={() =>
                                copyToClipboard(item.value, item.key)
                              }
                              className="ml-2 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                              title="Скопировать"
                            >
                              {copiedField === item.key ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Дополнительная информация */}
            <div className="mt-8 text-center">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Важная информация
                </h3>
                <p className="text-blue-700 text-sm">
                  При оформлении документов и проведении платежей обязательно
                  свяжитесь с техподержкой.
                </p>
              </div>
            </div>

            {/* Последнее обновление */}
            <div className="mt-8 text-center text-gray-500">
              <p className="text-sm">
                Последнее обновление:{" "}
                {new Date().toLocaleDateString("ru-RU", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
