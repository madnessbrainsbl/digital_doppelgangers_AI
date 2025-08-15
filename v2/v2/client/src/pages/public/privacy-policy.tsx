import { PublicLayout } from "@/components/public/layout";
import { Shield, Lock, Eye, UserCheck, FileText, Clock } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <PublicLayout>
      {/* Заголовок */}
      <section className="bg-gradient-to-b from-primary/5 to-white py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full">
                <Shield className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-5xl font-bold text-gray-900 mb-6">
              Политика конфиденциальности
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Информация о том, как мы собираем, используем, храним и защищаем
              ваши личные данные. Мы заботимся о вашей конфиденциальности и
              стремимся обеспечить безопасность вашей информации в соответствии
              с действующими нормами и стандартами.
            </p>
          </div>
        </div>
      </section>

      {/* Основное содержание */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Содержание политики */}
            <div className="prose prose-lg max-w-none">
              <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-6 h-6 text-primary mr-3" />
                  1. Общие положения
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    <strong>1.1.</strong> Настоящая Политика конфиденциальности
                    (далее — «Политика») определяет порядок обработки и защиты
                    персональных данных, полученных от пользователей (далее —
                    «Пользователь») в рамках использования нашего сервиса (далее
                    — «Сервис»).
                  </p>
                  <p>
                    <strong>1.2.</strong> Используя Сервис, Пользователь
                    соглашается с условиями данной Политики и предоставляет
                    согласие на обработку своих персональных данных в
                    соответствии с указанными в ней положениями.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  2. Сбор персональных данных
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    <strong>2.1.</strong> Мы собираем и обрабатываем
                    персональные данные, необходимые для предоставления доступа
                    к Сервису и его функциональным возможностям. К таким данным
                    могут относиться:
                  </p>
                  <ul className="list-disc ml-6 space-y-2">
                    <li>Имя и фамилия Пользователя;</li>
                    <li>
                      Контактные данные (номер телефона, адрес электронной
                      почты);
                    </li>
                    <li>
                      Информация об учетных записях на сторонних платформах
                      (например, Авито, Одноклассники, ВКонтакте);
                    </li>
                    <li>
                      Логины и пароли от учетных записей, используемых для
                      интеграции с Сервисом;
                    </li>
                    <li>
                      Другая информация, необходимая для предоставления услуг
                    </li>
                  </ul>
                  <p>
                    <strong>2.2.</strong> Мы можем собирать и обрабатывать
                    данные, связанные с использованием Сервиса, включая, но не
                    ограничиваясь: IP-адреса, информацию о браузере, устройстве
                    и операционной системе, дату и время доступа, историю
                    взаимодействий с Сервисом.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  3. Цели обработки данных
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    <strong>3.1.</strong> Мы обрабатываем персональные данные
                    Пользователя для следующих целей:
                  </p>
                  <ul className="list-disc ml-6 space-y-2">
                    <li>
                      Предоставление доступа к Сервису и его функциональным
                      возможностям;
                    </li>
                    <li>Обеспечение безопасности использования Сервиса;</li>
                    <li>Управление учетной записью Пользователя;</li>
                    <li>
                      Поддержка и обслуживание Сервиса, включая устранение
                      технических неисправностей;
                    </li>
                    <li>Улучшение качества предоставляемых услуг;</li>
                    <li>
                      Отправка уведомлений, связанных с использованием Сервиса;
                    </li>
                    <li>Анализ и улучшение пользовательского опыта.</li>
                  </ul>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  4. Передача данных третьим лицам
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    <strong>4.1.</strong> Мы не передаем персональные данные
                    Пользователя третьим лицам без его предварительного
                    согласия, за исключением случаев, предусмотренных настоящей
                    Политикой или действующим законодательством.
                  </p>
                  <p>
                    <strong>4.2.</strong> Персональные данные могут быть
                    переданы третьим лицам в следующих случаях:
                  </p>
                  <ul className="list-disc ml-6 space-y-2">
                    <li>
                      В рамках исполнения обязательств перед Пользователем
                      (например, интеграция с внешними платформами);
                    </li>
                    <li>
                      Для защиты наших прав и законных интересов в случае
                      правовых споров;
                    </li>
                    <li>
                      При выполнении законных требований государственных
                      органов.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  5. Защита данных
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    <strong>5.1.</strong> Мы принимаем все необходимые
                    организационные и технические меры для защиты персональных
                    данных Пользователей от несанкционированного доступа,
                    изменения, раскрытия или уничтожения.
                  </p>
                  <p>
                    <strong>5.2.</strong> Доступ к персональным данным имеют
                    только уполномоченные сотрудники, которые обязаны соблюдать
                    конфиденциальность данных.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Clock className="w-6 h-6 text-primary mr-3" />
                  6. Хранение данных
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    <strong>6.1.</strong> Персональные данные Пользователей
                    хранятся на протяжении времени, необходимого для выполнения
                    целей, для которых они были собраны, или на протяжении
                    времени, установленного действующим законодательством.
                  </p>
                  <p>
                    <strong>6.2.</strong> После достижения целей обработки или
                    по истечении срока хранения данные подлежат удалению или
                    анонимизации.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  7. Права Пользователя
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    <strong>7.1.</strong> Пользователь имеет право на доступ к
                    своим персональным данным, их исправление, удаление, а также
                    на ограничение обработки.
                  </p>
                  <p>
                    <strong>7.2.</strong> Пользователь может отозвать согласие
                    на обработку персональных данных в любое время, связавшись с
                    нами по контактной информации, указанной на нашем сайте.
                  </p>
                  <p>
                    <strong>7.3.</strong> Пользователь имеет право подать жалобу
                    в надзорный орган в случае нарушения его прав в сфере
                    обработки персональных данных.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  8. Изменение Политики
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    <strong>8.1.</strong> Мы оставляем за собой право изменять
                    настоящую Политику в любое время. Обо всех изменениях будет
                    сообщено на нашем сайте.
                  </p>
                  <p>
                    <strong>8.2.</strong> Продолжение использования Сервиса
                    после внесения изменений означает согласие Пользователя с
                    обновленной Политикой.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  9. Контактная информация
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    <strong>9.1.</strong> Если у вас есть вопросы или
                    предложения по поводу данной Политики, вы можете связаться с
                    нами по электронной почте или другим контактным данным,
                    указанным на нашем сайте.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  10. Применимое право
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    <strong>10.1.</strong> Настоящая Политика регулируется
                    законодательством страны, в которой зарегистрирована
                    компания, предоставляющая Сервис.
                  </p>
                  <p>
                    <strong>10.2.</strong> Все споры, возникающие в связи с
                    обработкой персональных данных, подлежат разрешению в
                    соответствии с законодательством указанной страны.
                  </p>
                </div>
              </div>
            </div>

            {/* Последнее обновление */}
            <div className="mt-12 text-center text-gray-500">
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
