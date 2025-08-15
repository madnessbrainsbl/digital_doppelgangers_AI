import MainLayout, { PublicLayout } from "@/components/public/layout";
import { Link } from "wouter";
import { useEffect } from "react";
import {
  Bot,
  Database,
  MessageSquare,
  Share2,
  Phone,
  Bell,
  BarChart,
  Users,
  CreditCard,
  Check,
  ChevronRight,
} from "lucide-react";

export default function FeaturesPage() {
  useEffect(() => {
    const hash = window.location.hash?.slice(1); // убираем '#'

    if (hash) {
      const el = document.getElementById(hash);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
  }, []);

  return (
    <MainLayout>
      {/* Заголовок */}
      <section className="bg-gradient-to-b from-primary/5 to-white py-12 md:py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Возможности платформы Асиссто
            </h1>
            <p className="text-xl text-gray-600">
              Полный набор инструментов для создания, настройки и управления
              AI-ассистентами для автоматизации коммуникаций и бизнес-процессов
            </p>
          </div>
        </div>
      </section>

      {/* Основные модули */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Основные функциональные модули
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Платформа Асиссто состоит из взаимосвязанных модулей, каждый из
              которых отвечает за определенный аспект работы системы
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="bg-primary/10 p-3 rounded-full w-fit mb-6">
                <Bot className="text-primary h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Конструктор ассистентов
              </h3>
              <p className="text-gray-600 mb-6">
                Визуальный инструмент для создания и настройки AI-ассистентов с
                различными ролями и поведением без необходимости
                программирования.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>Настройка ролей и сценариев</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>Подключение к базе знаний</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>Обучение на диалогах</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>Тестовый режим</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="bg-primary/10 p-3 rounded-full w-fit mb-6">
                <Database className="text-primary h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                База знаний
              </h3>
              <p className="text-gray-600 mb-6">
                Загрузка и организация информации, которую ассистент будет
                использовать для предоставления точных и обоснованных ответов.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>Поддержка различных форматов файлов</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>Автоматическая индексация</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>Группировка по темам</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>Контроль версий документов</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="bg-primary/10 p-3 rounded-full w-fit mb-6">
                <MessageSquare className="text-primary h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Центр сообщений
              </h3>
              <p className="text-gray-600 mb-6">
                Единый интерфейс для операторов, позволяющий контролировать и
                участвовать в диалогах ассистентов с клиентами.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>Управление всеми каналами связи</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>Передача диалогов между специалистами</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>Быстрые ответы и шаблоны</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>История переписки и контакты</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="bg-primary/10 p-3 rounded-full w-fit mb-6">
                <Share2 className="text-primary h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Интеграция каналов
              </h3>
              <p className="text-gray-600 mb-6">
                Модуль для подключения платформы к различным каналам
                коммуникации и взаимодействия с клиентами.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>Мессенджеры (Telegram, WhatsApp, VK)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>Социальные сети</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>Email и веб-чаты</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>API для сторонних систем</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="bg-primary/10 p-3 rounded-full w-fit mb-6">
                <Phone className="text-primary h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Голосовой модуль
              </h3>
              <p className="text-gray-600 mb-6">
                Инструменты для автоматизации телефонных коммуникаций с помощью
                технологий распознавания и синтеза речи.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>Автоматические холодные звонки</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>Прием входящих вызовов</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>Транскрибация разговоров</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>Интеграция с телефонией</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="bg-primary/10 p-3 rounded-full w-fit mb-6">
                <Bell className="text-primary h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Рассылки и уведомления
              </h3>
              <p className="text-gray-600 mb-6">
                Инструменты для создания и отправки массовых сообщений и
                персонализированных уведомлений через разные каналы.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>Автоматические триггерные сообщения</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>Массовые рассылки</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>Персонализация контента</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>Отслеживание эффективности</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="bg-primary/10 p-3 rounded-full w-fit mb-6">
                <BarChart className="text-primary h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Аналитика и отчеты
              </h3>
              <p className="text-gray-600 mb-6">
                Дашборды и отчеты для мониторинга эффективности ассистентов и
                работы операторов, анализа обращений.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>Ключевые метрики и индикаторы</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>Интерактивные графики</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>Анализ популярных запросов</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>Экспорт данных</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="bg-primary/10 p-3 rounded-full w-fit mb-6">
                <Users className="text-primary h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Управление командой
              </h3>
              <p className="text-gray-600 mb-6">
                Инструменты для управления доступом сотрудников к платформе и
                организации их работы.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>Ролевая модель доступа</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>Мониторинг активности</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>Распределение задач</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>Журнал действий</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="bg-primary/10 p-3 rounded-full w-fit mb-6">
                <CreditCard className="text-primary h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Биллинг и тарифы
              </h3>
              <p className="text-gray-600 mb-6">
                Управление подпиской, выбор и изменение тарифных планов, покупка
                дополнительных услуг.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>Гибкие тарифные планы</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>Дополнительные пакеты услуг</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>История платежей</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>Автоматическое продление</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Отраслевые решения */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Применение в различных сферах
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Отраслевые решения для внедрения AI-ассистентов в различных сферах
              бизнеса
            </p>
          </div>

          {/* Отдел продаж */}
          <div id="sales" className="mb-20 scroll-mt-24">
            <div className="mb-10 border-l-4 border-primary pl-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Отдел продаж
              </h3>
              <p className="text-lg text-gray-600">
                Повышение эффективности продаж с помощью автоматизации рутинных
                задач и улучшения коммуникации с клиентами
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h4 className="text-xl font-semibold text-gray-900 mb-4">
                  Возможности AI-ассистента для отдела продаж
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="text-primary h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">
                        Первичная квалификация лидов
                      </span>
                      <p className="text-gray-600 mt-1">
                        Автоматический сбор основной информации о потенциальных
                        клиентах, их потребностях и бюджете перед передачей
                        менеджеру.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="text-primary h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">
                        Ответы на часто задаваемые вопросы
                      </span>
                      <p className="text-gray-600 mt-1">
                        Предоставление подробной информации о продуктах,
                        услугах, ценах и условиях сотрудничества в любое время
                        суток.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="text-primary h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">
                        Планирование демонстраций и встреч
                      </span>
                      <p className="text-gray-600 mt-1">
                        Согласование удобного времени для презентаций и встреч с
                        менеджерами, интеграция с календарями.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="text-primary h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">
                        Подготовка коммерческих предложений
                      </span>
                      <p className="text-gray-600 mt-1">
                        Автоматическое формирование персонализированных
                        коммерческих предложений на основе потребностей клиента.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="rounded-xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1577563908411-5077b6dc7624?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
                  alt="Ассистент для отдела продаж"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>

          {/* Поддержка клиентов */}
          <div id="support" className="mb-20 scroll-mt-24">
            <div className="mb-10 border-l-4 border-primary pl-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Поддержка клиентов
              </h3>
              <p className="text-lg text-gray-600">
                Обеспечение круглосуточной поддержки клиентов и снижение
                нагрузки на операторов
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="rounded-xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
                  alt="Поддержка клиентов с помощью AI"
                  className="w-full h-auto object-cover"
                />
              </div>
              <div>
                <h4 className="text-xl font-semibold text-gray-900 mb-4">
                  Возможности AI-ассистента для клиентской поддержки
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="text-primary h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">
                        Круглосуточная техническая поддержка
                      </span>
                      <p className="text-gray-600 mt-1">
                        Решение типовых технических проблем, ответы на вопросы и
                        предоставление инструкций 24/7.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="text-primary h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">
                        Маршрутизация обращений
                      </span>
                      <p className="text-gray-600 mt-1">
                        Определение сложности запросов и их перенаправление
                        специалистам соответствующей квалификации.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="text-primary h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">
                        Обработка типовых запросов
                      </span>
                      <p className="text-gray-600 mt-1">
                        Автоматическая обработка стандартных обращений: статус
                        заказа, возврат, обмен, инструкции.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="text-primary h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Сбор обратной связи</span>
                      <p className="text-gray-600 mt-1">
                        Проведение опросов о качестве обслуживания и
                        удовлетворенности клиентов.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Маркетинг */}
          <div id="marketing" className="mb-20 scroll-mt-24">
            <div className="mb-10 border-l-4 border-primary pl-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Маркетинг
              </h3>
              <p className="text-lg text-gray-600">
                Персонализация взаимодействия с клиентами и оптимизация
                маркетинговых кампаний
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h4 className="text-xl font-semibold text-gray-900 mb-4">
                  Возможности AI-ассистента для маркетинга
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="text-primary h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">
                        Персонализированные предложения
                      </span>
                      <p className="text-gray-600 mt-1">
                        Формирование индивидуальных рекомендаций на основе
                        интересов, поведения и истории покупок клиента.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="text-primary h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Контент-маркетинг</span>
                      <p className="text-gray-600 mt-1">
                        Помощь в создании и оптимизации контента для разных
                        платформ и целевых аудиторий.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="text-primary h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">
                        Автоматизация рассылок
                      </span>
                      <p className="text-gray-600 mt-1">
                        Создание и отправка персонализированных email и
                        SMS-рассылок с учетом интересов получателей.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="text-primary h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Аналитика и отчеты</span>
                      <p className="text-gray-600 mt-1">
                        Анализ эффективности маркетинговых кампаний и
                        предоставление рекомендаций по их оптимизации.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="rounded-xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1542744173-05336fcc7ad4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
                  alt="Маркетинговый AI-ассистент"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>

          {/* HR и рекрутинг */}
          <div id="hr" className="mb-20 scroll-mt-24">
            <div className="mb-10 border-l-4 border-primary pl-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                HR и рекрутинг
              </h3>
              <p className="text-lg text-gray-600">
                Автоматизация процессов найма, адаптации и обучения сотрудников
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="rounded-xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
                  alt="HR-ассистент на базе AI"
                  className="w-full h-auto object-cover"
                />
              </div>
              <div>
                <h4 className="text-xl font-semibold text-gray-900 mb-4">
                  Возможности AI-ассистента для HR и рекрутинга
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="text-primary h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">
                        Автоматический скрининг резюме
                      </span>
                      <p className="text-gray-600 mt-1">
                        Анализ резюме кандидатов и сопоставление их квалификации
                        с требованиями вакансии.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="text-primary h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">
                        Проведение первичных интервью
                      </span>
                      <p className="text-gray-600 mt-1">
                        Автоматизированные собеседования с кандидатами для
                        предварительной оценки их навыков и опыта.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="text-primary h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">
                        Адаптация новых сотрудников
                      </span>
                      <p className="text-gray-600 mt-1">
                        Предоставление информации и ответы на вопросы новых
                        сотрудников в период адаптации.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="text-primary h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">
                        Организация корпоративного обучения
                      </span>
                      <p className="text-gray-600 mt-1">
                        Персонализированные программы обучения и тестирования
                        для развития навыков сотрудников.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* ИТ и техническая поддержка */}
          <div id="it" className="mb-20 scroll-mt-24">
            <div className="mb-10 border-l-4 border-primary pl-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                ИТ и техническая поддержка
              </h3>
              <p className="text-lg text-gray-600">
                Оптимизация работы ИТ-отдела и улучшение качества технической
                поддержки
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h4 className="text-xl font-semibold text-gray-900 mb-4">
                  Возможности AI-ассистента для ИТ
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="text-primary h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">
                        Автоматическое решение типовых проблем
                      </span>
                      <p className="text-gray-600 mt-1">
                        Диагностика и устранение распространенных технических
                        проблем без участия специалиста.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="text-primary h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">
                        Управление инцидентами
                      </span>
                      <p className="text-gray-600 mt-1">
                        Классификация, приоритизация и маршрутизация заявок в
                        службу поддержки.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="text-primary h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">
                        База знаний по оборудованию
                      </span>
                      <p className="text-gray-600 mt-1">
                        Предоставление технической документации, инструкций и
                        руководств по эксплуатации.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="text-primary h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">
                        Мониторинг состояния систем
                      </span>
                      <p className="text-gray-600 mt-1">
                        Отслеживание состояния ИТ-инфраструктуры и уведомление о
                        потенциальных проблемах.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="rounded-xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1563986768609-322da13575f3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
                  alt="ИТ-ассистент"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>

          {/* Образование и обучение */}
          <div id="education" className="mb-10 scroll-mt-24">
            <div className="mb-10 border-l-4 border-primary pl-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Образование и обучение
              </h3>
              <p className="text-lg text-gray-600">
                Создание персонализированных образовательных программ и
                поддержка учебного процесса
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="rounded-xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
                  alt="Образовательный AI-ассистент"
                  className="w-full h-auto object-cover"
                />
              </div>
              <div>
                <h4 className="text-xl font-semibold text-gray-900 mb-4">
                  Возможности AI-ассистента для образования
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="text-primary h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">
                        Персонализированное обучение
                      </span>
                      <p className="text-gray-600 mt-1">
                        Адаптация образовательных материалов под индивидуальные
                        потребности и прогресс ученика.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="text-primary h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">
                        Ответы на вопросы по материалам
                      </span>
                      <p className="text-gray-600 mt-1">
                        Предоставление дополнительных пояснений и ответов на
                        вопросы по учебным материалам.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="text-primary h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">
                        Проверка заданий и тестирование
                      </span>
                      <p className="text-gray-600 mt-1">
                        Автоматическая проверка выполненных заданий и тестов с
                        предоставлением обратной связи.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="text-primary h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">
                        Организация учебного процесса
                      </span>
                      <p className="text-gray-600 mt-1">
                        Напоминания о предстоящих занятиях, дедлайнах и
                        рекомендации по планированию обучения.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link href="/contact">
              <div className="inline-flex items-center bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition cursor-pointer">
                Получить консультацию для вашей отрасли
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Технологии */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Технологии и инфраструктура
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Платформа Асиссто построена на основе современных технологий и
                решений в области искусственного интеллекта
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div className="rounded-xl overflow-hidden shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
                  alt="Технологии Асиссто"
                  className="w-full h-auto"
                />
              </div>
              <div>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Check className="text-primary h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Модели OpenAI
                      </h3>
                      <p className="text-gray-600">
                        Ассистенты используют передовые модели GPT-4 для
                        понимания и генерации естественного языка.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Check className="text-primary h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Обработка естественного языка
                      </h3>
                      <p className="text-gray-600">
                        Технологии NLP для анализа текста, определения намерений
                        и извлечения ключевой информации.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Check className="text-primary h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Речевые технологии
                      </h3>
                      <p className="text-gray-600">
                        Системы распознавания речи (speech-to-text) и синтеза
                        голоса (text-to-speech) для голосовых коммуникаций.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Check className="text-primary h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Облачная инфраструктура
                      </h3>
                      <p className="text-gray-600">
                        Масштабируемая и отказоустойчивая инфраструктура,
                        обеспечивающая высокую доступность и безопасность.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Check className="text-primary h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        API и интеграции
                      </h3>
                      <p className="text-gray-600">
                        Открытые API для интеграции с CRM, телефонией,
                        платежными системами и другими сторонними сервисами.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Интеграции */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Интеграции с сервисами и системами
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Асиссто легко интегрируется с популярными сервисами и
                корпоративными системами
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-center">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Instagram_icon.png/600px-Instagram_icon.png"
                  alt="Instagram"
                  className="h-12 w-12 mb-4"
                />
                <h3 className="font-semibold text-gray-900">Instagram</h3>
              </div>

              <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-center">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Telegram_logo.svg/512px-Telegram_logo.svg.png"
                  alt="Telegram"
                  className="h-12 w-12 mb-4"
                />
                <h3 className="font-semibold text-gray-900">Telegram</h3>
              </div>

              <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-center">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/512px-WhatsApp.svg.png"
                  alt="WhatsApp"
                  className="h-12 w-12 mb-4"
                />
                <h3 className="font-semibold text-gray-900">WhatsApp</h3>
              </div>

              <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-center">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/VK_Compact_Logo.svg/512px-VK_Compact_Logo.svg.png"
                  alt="ВКонтакте"
                  className="h-12 w-12 mb-4"
                />
                <h3 className="font-semibold text-gray-900">ВКонтакте</h3>
              </div>

              <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-center">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Slack_icon_2019.svg/512px-Slack_icon_2019.svg.png"
                  alt="Slack"
                  className="h-12 w-12 mb-4"
                />
                <h3 className="font-semibold text-gray-900">Slack</h3>
              </div>

              <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-center">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/512px-Spotify_logo_without_text.svg.png"
                  alt="Salesforce"
                  className="h-12 w-12 mb-4"
                />
                <h3 className="font-semibold text-gray-900">Salesforce</h3>
              </div>

              <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-center">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Microsoft_365_%282022%29.svg/512px-Microsoft_365_%282022%29.svg.png"
                  alt="Microsoft 365"
                  className="h-12 w-12 mb-4"
                />
                <h3 className="font-semibold text-gray-900">Microsoft 365</h3>
              </div>

              <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-center">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Google_Sheets_logo_%282014-2020%29.svg/512px-Google_Sheets_logo_%282014-2020%29.svg.png"
                  alt="Google Workspace"
                  className="h-12 w-12 mb-4"
                />
                <h3 className="font-semibold text-gray-900">
                  Google Workspace
                </h3>
              </div>

              <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-center">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Notion_app_logo.png/512px-Notion_app_logo.png"
                  alt="Notion"
                  className="h-12 w-12 mb-4"
                />
                <h3 className="font-semibold text-gray-900">Notion</h3>
              </div>

              <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-center">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/512px-Gmail_icon_%282020%29.svg.png"
                  alt="Gmail"
                  className="h-12 w-12 mb-4"
                />
                <h3 className="font-semibold text-gray-900">Gmail</h3>
              </div>

              <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-center">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Jira_%28Software%29_logo.svg/512px-Jira_%28Software%29_logo.svg.png"
                  alt="Jira"
                  className="h-12 w-12 mb-4"
                />
                <h3 className="font-semibold text-gray-900">Jira</h3>
              </div>

              <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-center">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Figma-logo.svg/512px-Figma-logo.svg.png"
                  alt="Figma"
                  className="h-12 w-12 mb-4"
                />
                <h3 className="font-semibold text-gray-900">1C</h3>
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link href="/integrations">
                <div className="inline-flex items-center text-primary font-medium hover:underline cursor-pointer">
                  Все доступные интеграции{" "}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Готовы автоматизировать коммуникации?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-3xl mx-auto">
            Начните использовать платформу Асиссто уже сегодня и оцените все
            преимущества AI-ассистентов
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth">
              <div className="bg-white text-primary px-6 py-3 rounded-lg font-medium text-lg hover:bg-gray-100 transition cursor-pointer inline-block">
                Начать бесплатно
              </div>
            </Link>
            <Link href="/demo">
              <div className="bg-primary text-white px-6 py-3 rounded-lg font-medium text-lg border border-white hover:bg-primary/90 transition cursor-pointer inline-block">
                Запросить демо
              </div>
            </Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
