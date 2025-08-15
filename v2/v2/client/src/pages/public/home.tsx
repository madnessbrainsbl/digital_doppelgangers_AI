import { Link } from "wouter";
import { useState } from "react";
import MainLayout, { PublicLayout } from "@/components/public/layout";
import {
  Bot,
  Database,
  Share2,
  Phone,
  MessageSquare,
  Bell,
  ArrowRight,
  Check,
  BarChart,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AssistantChatDialog from "@/components/assistants/assistant-chat-dialog";
import { useAuth } from "@/contexts/AuthContext";

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messageInput, setMessageInput] = useState("");

  // Конфигурация демо-ассистента
  const salesManager = {
    id: 1,
    name: "Менеджер по продажам",
    role: "sales",
    openaiAssistantId: "asst_JujVPmJQbzcuTXuFmbsUi7Br", // Реальный ID ассистента из OpenAI
  };

  // Обработчик начала диалога с менеджером
  const handleStartDialog = () => {
    setIsChatOpen(true);
  };

  // Обработчик отправки сообщения в демо-чате (открывает настоящий диалог)
  const handleDemoSend = () => {
    if (messageInput.trim()) {
      setIsChatOpen(true);
    }
  };

  return (
    <MainLayout>
      {/* Главная секция */}
      <section className="bg-gradient-to-b from-primary/5 to-white py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="lg:w-1/2 lg:pr-12 mb-12 lg:mb-0">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                AI-ассистенты
                <br />
                для вашего бизнеса
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-lg">
                Создавайте, настраивайте и управляйте виртуальными ассистентами
                для автоматизации коммуникаций и повышения эффективности вашего
                бизнеса
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {isAuthenticated ? (
                  <Link href="/dashboard">
                    <div className="bg-primary text-white px-6 py-3 rounded-lg font-medium text-lg hover:bg-primary/90 transition cursor-pointer inline-block w-full sm:w-auto text-center">
                      Личный кабинет
                    </div>
                  </Link>
                ) : (
                  <Link href="/auth?signup=true">
                    <div className="bg-primary text-white px-6 py-3 rounded-lg font-medium text-lg hover:bg-primary/90 transition cursor-pointer inline-block w-full sm:w-auto text-center">
                      Начать бесплатно
                    </div>
                  </Link>
                )}
                <Link href="/demo">
                  <div className="bg-white text-gray-800 border border-gray-300 px-6 py-3 rounded-lg font-medium text-lg hover:bg-gray-50 transition cursor-pointer inline-block w-full sm:w-auto text-center">
                    Запросить демо
                  </div>
                </Link>
              </div>
              <div className="mt-8 flex items-center text-gray-600">
                <Check className="h-5 w-5 text-primary mr-2" />
                <span>14 дней бесплатного использования</span>
                <span className="mx-3 text-gray-400">•</span>
                <Check className="h-5 w-5 text-primary mr-2" />
                <span>Не требуется карта</span>
              </div>
            </div>
            <div className="lg:w-1/2">
              <div className="relative">
                <div className="bg-white p-8 rounded-xl shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                        <Bot className="text-primary h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Менеджер по продажам
                        </h3>
                        <p className="text-sm text-gray-500">Онлайн</p>
                      </div>
                    </div>
                    <Button
                      onClick={handleStartDialog}
                      variant="outline"
                      size="sm"
                      className="gap-1 text-xs"
                    >
                      <MessageCircle size={14} /> Открыть чат
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-gray-100 p-3 rounded-lg rounded-tl-none max-w-xs">
                      <p className="text-gray-700">
                        Здравствуйте! Я виртуальный менеджер по продажам
                        Асиссто. Чем могу вам помочь сегодня?
                      </p>
                    </div>
                    <div className="bg-primary/10 p-3 rounded-lg rounded-tr-none max-w-xs ml-auto">
                      <p className="text-gray-800">
                        Меня интересуют ваши тарифы для малого бизнеса
                      </p>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg rounded-tl-none max-w-xs">
                      <p className="text-gray-700">
                        Для малого бизнеса у нас есть специальный тариф
                        "Бизнес", который включает до 5 ассистентов и все
                        основные функции. Стоимость — от 5000₽ в месяц. Какие
                        задачи вы планируете решать с помощью наших ассистентов?
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 relative">
                    <input
                      type="text"
                      placeholder="Введите сообщение..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary pr-10"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleDemoSend()}
                    />
                    <button
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      onClick={handleDemoSend}
                    >
                      <ArrowRight className="h-5 w-5 text-primary" />
                    </button>
                  </div>
                </div>
                <div className="absolute -top-6 -left-6 w-20 h-20 bg-primary/10 rounded-lg -z-10"></div>
                <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-primary/10 rounded-lg -z-10"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Диалог с ассистентом */}
      <AssistantChatDialog
        open={isChatOpen}
        onOpenChange={setIsChatOpen}
        assistant={salesManager}
      />

      {/* Видео презентация */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Смотрите презентацию платформы
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Узнайте о возможностях Асиссто и том, как платформа поможет
              автоматизировать рабочие процессы вашего бизнеса
            </p>
          </div>

          <div className="max-w-4xl mx-auto px-2 sm:px-0">
            <div className="relative bg-white rounded-lg sm:rounded-xl shadow-lg overflow-hidden">
              <div className="aspect-video">
                <iframe
                  src="https://rutube.ru/play/embed/e2cce8090edb9b0943a3446724ecf7f9/"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allow="clipboard-write; autoplay"
                  allowFullScreen
                  className="w-full h-full"
                  title="Платформа Асиссто. Автоматизация рабочих процессов. Презентация платформы"
                />
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-600 mb-4">
                Продолжительность: 01:27 • Общий функционал платформы
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {isAuthenticated ? (
                  <Link href="/dashboard">
                    <div className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition cursor-pointer inline-block w-full sm:w-auto text-center">
                      Личный кабинет
                    </div>
                  </Link>
                ) : (
                  <Link href="/auth?signup=true">
                    <div className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition cursor-pointer inline-block w-full sm:w-auto text-center">
                      Попробовать бесплатно
                    </div>
                  </Link>
                )}
                <a
                  href="https://rutube.ru/video/e2cce8090edb9b0943a3446724ecf7f9/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white text-gray-800 border border-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition cursor-pointer inline-block w-full sm:w-auto text-center"
                >
                  Открыть на Rutube
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Преимущества */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Преимущества платформы Асиссто
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Комплексное решение для создания и управления AI-ассистентами для
              бизнеса любого масштаба
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="bg-primary/10 p-3 rounded-full w-fit mb-6">
                <Bot className="text-primary h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Интеллектуальные ассистенты
              </h3>
              <p className="text-gray-600">
                Создавайте ассистентов с различными ролями и настраивайте их
                поведение в соответствии с задачами вашего бизнеса.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="bg-primary/10 p-3 rounded-full w-fit mb-6">
                <Database className="text-primary h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                База знаний
              </h3>
              <p className="text-gray-600">
                Загружайте документы, инструкции и информацию, чтобы ассистенты
                давали точные и актуальные ответы на основе ваших данных.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="bg-primary/10 p-3 rounded-full w-fit mb-6">
                <Share2 className="text-primary h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Мультиканальность
              </h3>
              <p className="text-gray-600">
                Подключайте различные каналы коммуникации: мессенджеры,
                социальные сети, email, веб-сайт и телефонию.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="bg-primary/10 p-3 rounded-full w-fit mb-6">
                <Phone className="text-primary h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Голосовые ассистенты
              </h3>
              <p className="text-gray-600">
                Автоматизируйте телефонные коммуникации с помощью технологий
                распознавания и синтеза речи.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="bg-primary/10 p-3 rounded-full w-fit mb-6">
                <BarChart className="text-primary h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Аналитика и отчеты
              </h3>
              <p className="text-gray-600">
                Получайте подробную статистику и аналитику по работе ассистентов
                для оптимизации процессов.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="bg-primary/10 p-3 rounded-full w-fit mb-6">
                <MessageSquare className="text-primary h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Корпоративные чаты
              </h3>
              <p className="text-gray-600">
                Создавайте внутренние ассистенты для автоматизации рутинных
                задач и улучшения коммуникации в команде.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Как это работает */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Как работает Асиссто
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Простой процесс создания и настройки AI-ассистентов для вашего
              бизнеса
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold mb-6">
                  1
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Создайте ассистента
                </h3>
                <p className="text-gray-600">
                  Выберите роль, настройте характер и поведение ассистента через
                  интуитивно понятный интерфейс.
                </p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold mb-6">
                  2
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Обучите ассистента
                </h3>
                <p className="text-gray-600">
                  Загрузите документы и информацию для обучения ассистента или
                  используйте готовые шаблоны знаний.
                </p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold mb-6">
                  3
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Подключите каналы
                </h3>
                <p className="text-gray-600">
                  Интегрируйте ассистента с нужными каналами коммуникации и
                  начните использовать его в работе.
                </p>
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link href="/docs">
                <div className="inline-flex items-center text-primary font-medium hover:underline cursor-pointer">
                  Подробнее о процессе настройки{" "}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Применение */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Применение в различных сферах
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Асиссто помогает автоматизировать процессы и улучшать коммуникации
              в разных отраслях
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group">
              <div className="h-48 bg-gray-200 rounded-t-xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1577563908411-5077b6dc7624?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
                  alt="Отдел продаж"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="bg-white p-6 border border-gray-100 rounded-b-xl shadow-sm group-hover:shadow-md transition">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Отдел продаж
                </h3>
                <p className="text-gray-600 mb-4">
                  Автоматизация первичной квалификации лидов, ответы на вопросы
                  клиентов, планирование встреч и демонстраций.
                </p>
                <Link href="/features#sales">
                  <div className="inline-flex items-center text-primary font-medium hover:underline cursor-pointer">
                    Подробнее <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </Link>
              </div>
            </div>

            <div className="group">
              <div className="h-48 bg-gray-200 rounded-t-xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
                  alt="Поддержка клиентов"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="bg-white p-6 border border-gray-100 rounded-b-xl shadow-sm group-hover:shadow-md transition">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Поддержка клиентов
                </h3>
                <p className="text-gray-600 mb-4">
                  Круглосуточное обслуживание, ответы на часто задаваемые
                  вопросы, маршрутизация сложных запросов к специалистам.
                </p>
                <Link href="/features#support">
                  <div className="inline-flex items-center text-primary font-medium hover:underline cursor-pointer">
                    Подробнее <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </Link>
              </div>
            </div>

            <div className="group">
              <div className="h-48 bg-gray-200 rounded-t-xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
                  alt="Маркетинг"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="bg-white p-6 border border-gray-100 rounded-b-xl shadow-sm group-hover:shadow-md transition">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Маркетинг
                </h3>
                <p className="text-gray-600 mb-4">
                  Персонализированные рассылки, сбор и анализ обратной связи,
                  поддержка маркетинговых кампаний и социальных сетей.
                </p>
                <Link href="/features#marketing">
                  <div className="inline-flex items-center text-primary font-medium hover:underline cursor-pointer">
                    Подробнее <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </Link>
              </div>
            </div>

            {/* HR и рекрутинг */}
            <div className="group">
              <div className="h-48 bg-gray-200 rounded-t-xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1565688534245-05d6b5be184a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
                  alt="HR и рекрутинг"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="bg-white p-6 border border-gray-100 rounded-b-xl shadow-sm group-hover:shadow-md transition">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  HR и рекрутинг
                </h3>
                <p className="text-gray-600 mb-4">
                  Автоматизация процессов найма, адаптации и обучения
                  сотрудников, ответы на часто задаваемые вопросы.
                </p>
                <Link href="/features#hr">
                  <div className="inline-flex items-center text-primary font-medium hover:underline cursor-pointer">
                    Подробнее <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </Link>
              </div>
            </div>

            {/* ИТ и техническая поддержка */}
            <div className="group">
              <div className="h-48 bg-gray-200 rounded-t-xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1562408590-e32931084e23?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
                  alt="ИТ и техническая поддержка"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="bg-white p-6 border border-gray-100 rounded-b-xl shadow-sm group-hover:shadow-md transition">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  ИТ и техническая поддержка
                </h3>
                <p className="text-gray-600 mb-4">
                  Автоматизация решения технических вопросов, диагностика
                  проблем и поддержка внутренних процессов компании.
                </p>
                <div className="inline-flex items-center text-primary font-medium hover:underline cursor-pointer">
                  Подробнее <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            </div>

            {/* Образование и обучение */}
            <div className="group">
              <div className="h-48 bg-gray-200 rounded-t-xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
                  alt="Образование и обучение"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="bg-white p-6 border border-gray-100 rounded-b-xl shadow-sm group-hover:shadow-md transition">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Образование и обучение
                </h3>
                <p className="text-gray-600 mb-4">
                  Персонализированное обучение, ответы на вопросы студентов и
                  создание интерактивных образовательных материалов.
                </p>
                <Link href="/features#education">
                  <div className="inline-flex items-center text-primary font-medium hover:underline cursor-pointer">
                    Подробнее <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Отзывы клиентов */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Что говорят наши клиенты
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Более 1000 компаний уже используют Асиссто для автоматизации
              коммуникаций
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="flex items-center mb-4">
                <div className="text-yellow-400 flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star}>★</span>
                  ))}
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                "Внедрение ассистентов Асиссто позволило нам сократить время
                ответа на типовые запросы клиентов с 2 часов до 2 минут. Команда
                поддержки теперь решает только сложные вопросы."
              </p>
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-gray-200 mr-4"></div>
                <div>
                  <h4 className="font-medium text-gray-900">Анна Смирнова</h4>
                  <p className="text-sm text-gray-500">
                    Руководитель отдела поддержки, ООО "ТехноМаркет"
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="flex items-center mb-4">
                <div className="text-yellow-400 flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star}>★</span>
                  ))}
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                "Благодаря Асиссто мы смогли автоматизировать 70% первичных
                коммуникаций с потенциальными клиентами. Это значительно
                разгрузило отдел продаж и повысило конверсию."
              </p>
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-gray-200 mr-4"></div>
                <div>
                  <h4 className="font-medium text-gray-900">Иван Петров</h4>
                  <p className="text-sm text-gray-500">
                    Коммерческий директор, "Умный Дом"
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="flex items-center mb-4">
                <div className="text-yellow-400 flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star}>★</span>
                  ))}
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                "Голосовой ассистент Асиссто обрабатывает более 200 входящих
                звонков ежедневно. Клиенты отмечают, что часто не могут отличить
                его от реального сотрудника — настолько естественно он звучит!"
              </p>
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-gray-200 mr-4"></div>
                <div>
                  <h4 className="font-medium text-gray-900">Сергей Иванов</h4>
                  <p className="text-sm text-gray-500">
                    IT-директор, "ФинансПлюс"
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link href="/under-construction">
              <div className="inline-flex items-center text-primary font-medium hover:underline cursor-pointer">
                Смотреть все истории успеха{" "}
                <ChevronRight className="h-4 w-4 ml-1" />
              </div>
            </Link>
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
            Начните использовать Асиссто уже сегодня и оцените все преимущества
            AI-ассистентов для вашего бизнеса
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <div className="bg-white text-primary px-6 py-3 rounded-lg font-medium text-lg hover:bg-gray-100 transition cursor-pointer inline-block w-full sm:w-auto text-center">
                  Личный кабинет
                </div>
              </Link>
            ) : (
              <Link href="/auth?signup=true">
                <div className="bg-white text-primary px-6 py-3 rounded-lg font-medium text-lg hover:bg-gray-100 transition cursor-pointer inline-block w-full sm:w-auto text-center">
                  Начать бесплатно
                </div>
              </Link>
            )}
            <Link href="/demo">
              <div className="bg-primary text-white px-6 py-3 rounded-lg font-medium text-lg border border-white hover:bg-primary/90 transition cursor-pointer inline-block w-full sm:w-auto text-center">
                Запросить демо
              </div>
            </Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
