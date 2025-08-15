import { PublicLayout } from "@/components/public/layout";
import {
  Scale,
  FileText,
  CreditCard,
  Shield,
  AlertTriangle,
  Clock,
} from "lucide-react";

export default function TermsPage() {
  return (
    <PublicLayout>
      {/* Заголовок */}
      <section className="bg-gradient-to-b from-primary/5 to-white py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full">
                <Scale className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-5xl font-bold text-gray-900 mb-6">
              Условия использования и предоставления услуг
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Здесь вы найдете важную информацию о правилах и условиях, которые
              регулируют использование нашего сайта и предоставляемых нами
              услуг.
            </p>
          </div>
        </div>
      </section>

      {/* Основное содержание */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Содержание условий */}
            <div className="prose prose-lg max-w-none">
              <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-6 h-6 text-primary mr-3" />
                  1. Общие положения
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    <strong>1.1.</strong> Настоящие условия использования (далее
                    — «Условия») регулируют порядок предоставления и
                    использования услуг нашего сервиса (далее — «Сервис»).
                    Пользуясь нашим Сервисом, вы соглашаетесь с настоящими
                    Условиями и обязуетесь их соблюдать.
                  </p>
                  <p>
                    <strong>1.2.</strong> Сервис предназначен для автоматизации
                    процесса управления коммуникациями с клиентами,
                    предоставления доступа к сообщениям с различных платформ, а
                    также для интеграции и управления чат-ботами.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  2. Регистрация и учетная запись
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    <strong>2.1.</strong> Для использования Сервиса вам
                    необходимо создать учетную запись, предоставив достоверную и
                    актуальную информацию.
                  </p>
                  <p>
                    <strong>2.2.</strong> Вы несете ответственность за
                    сохранение конфиденциальности своих учетных данных и за все
                    действия, совершаемые с использованием вашей учетной записи.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  3. Предоставление услуг
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    <strong>3.1.</strong> Сервис предоставляет вам возможность
                    интегрировать различные платформы обмена сообщениями (Авито,
                    Одноклассники, ВКонтакте и другие), объединяя их в одном
                    интерфейсе.
                  </p>
                  <p>
                    <strong>3.2.</strong> Сервис предоставляет доступ к
                    обученному боту, который может отвечать на сообщения
                    клиентов в автоматическом режиме. Вы несете ответственность
                    за настройки и корректность работы данного бота.
                  </p>
                  <p>
                    <strong>3.3.</strong> В случае возникновения технических
                    сбоев или ошибок в работе Сервиса, мы обязуемся принять все
                    необходимые меры для их устранения в разумные сроки.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <CreditCard className="w-6 h-6 text-primary mr-3" />
                  4. Платные услуги
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    <strong>4.1.</strong> Некоторые функции Сервиса могут
                    предоставляться на платной основе. Информация о стоимости
                    платных услуг и способах оплаты будет доступна на
                    соответствующих страницах нашего сайта.
                  </p>
                  <p>
                    <strong>4.2.</strong> Оплаченные услуги не подлежат
                    возврату, за исключением случаев, предусмотренных
                    действующим законодательством.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Shield className="w-6 h-6 text-primary mr-3" />
                  5. Конфиденциальность и защита данных
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    <strong>5.1.</strong> Мы придаем большое значение защите
                    ваших персональных данных и данных ваших клиентов. Вся
                    информация, полученная через Сервис, будет обрабатываться в
                    соответствии с Политикой конфиденциальности.
                  </p>
                  <p>
                    <strong>5.2.</strong> Вы соглашаетесь не использовать Сервис
                    для передачи, хранения или обработки данных, нарушающих
                    права третьих лиц, в том числе авторские права, права на
                    товарные знаки и коммерческую тайну.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <AlertTriangle className="w-6 h-6 text-primary mr-3" />
                  6. Ограничение ответственности
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    <strong>6.1.</strong> Мы не несем ответственности за прямые,
                    косвенные, случайные, особые или иные убытки, возникшие в
                    результате использования или невозможности использования
                    Сервиса.
                  </p>
                  <p>
                    <strong>6.2.</strong> Мы не гарантируем бесперебойную работу
                    Сервиса, и не несем ответственности за временные сбои,
                    ошибки или иные проблемы, связанные с использованием
                    Сервиса.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  7. Изменение условий
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    <strong>7.1.</strong> Мы оставляем за собой право изменять
                    настоящие Условия в любое время. Изменения вступают в силу с
                    момента их публикации на нашем сайте.
                  </p>
                  <p>
                    <strong>7.2.</strong> Продолжение использования Сервиса
                    после внесения изменений означает ваше согласие с
                    обновленными Условиями.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Clock className="w-6 h-6 text-primary mr-3" />
                  8. Прекращение предоставления услуг
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    <strong>8.1.</strong> Мы оставляем за собой право прекратить
                    или приостановить предоставление услуг Сервиса в любое время
                    по любой причине, без предварительного уведомления.
                  </p>
                  <p>
                    <strong>8.2.</strong> Вы имеете право прекратить
                    использование Сервиса в любое время, удалив свою учетную
                    запись.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  9. Применимое право
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    <strong>9.1.</strong> Настоящие Условия регулируются
                    законодательством страны, в которой зарегистрирована
                    компания, предоставляющая Сервис.
                  </p>
                  <p>
                    <strong>9.2.</strong> Все споры, возникающие в связи с
                    использованием Сервиса, подлежат разрешению в соответствии с
                    законодательством указанной страны.
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
