import { PublicLayout } from "@/components/public/layout";
import { Link } from "wouter";
import { Book, Search, ChevronDown, FileText, Settings, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function DocsPage() {
  const [openCategory, setOpenCategory] = useState<string | null>("getting-started");

  const toggleCategory = (category: string) => {
    if (openCategory === category) {
      setOpenCategory(null);
    } else {
      setOpenCategory(category);
    }
  };

  return (
    <PublicLayout>
      {/* Заголовок */}
      <section className="bg-gradient-to-b from-primary/5 to-white py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Документация Асиссто
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Подробное руководство по использованию платформы AI-ассистентов для бизнеса
            </p>
            <div className="relative max-w-2xl mx-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                placeholder="Поиск по документации..."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Боковая навигация */}
            <div className="lg:w-1/4">
              <div className="sticky top-24 bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center">
                    <Book className="h-5 w-5 mr-2 text-primary" />
                    Содержание
                  </h2>
                </div>
                <nav className="p-4">
                  <ul className="space-y-4">
                    <li>
                      <button
                        onClick={() => toggleCategory("getting-started")}
                        className="flex justify-between items-center w-full text-left font-medium text-gray-900 hover:text-primary"
                      >
                        Начало работы
                        <ChevronDown className={`h-4 w-4 transform transition-transform ${openCategory === "getting-started" ? "rotate-180" : ""}`} />
                      </button>
                      {openCategory === "getting-started" && (
                        <ul className="mt-2 ml-4 space-y-2">
                          <li>
                            <a href="#overview" className="text-gray-600 hover:text-primary cursor-pointer">Обзор платформы</a>
                          </li>
                          <li>
                            <a href="#registration" className="text-gray-600 hover:text-primary cursor-pointer">Регистрация и вход</a>
                          </li>
                          <li>
                            <a href="#dashboard" className="text-gray-600 hover:text-primary cursor-pointer">Панель управления</a>
                          </li>
                          <li>
                            <a href="#first-assistant" className="text-gray-600 hover:text-primary cursor-pointer">Первый ассистент</a>
                          </li>
                        </ul>
                      )}
                    </li>
                    <li>
                      <button
                        onClick={() => toggleCategory("assistants")}
                        className="flex justify-between items-center w-full text-left font-medium text-gray-900 hover:text-primary"
                      >
                        Ассистенты
                        <ChevronDown className={`h-4 w-4 transform transition-transform ${openCategory === "assistants" ? "rotate-180" : ""}`} />
                      </button>
                      {openCategory === "assistants" && (
                        <ul className="mt-2 ml-4 space-y-2">
                          <li>
                            <a href="#create-assistant" className="text-gray-600 hover:text-primary cursor-pointer">Создание ассистента</a>
                          </li>
                          <li>
                            <a href="#configure-assistant" className="text-gray-600 hover:text-primary cursor-pointer">Настройка поведения</a>
                          </li>
                          <li>
                            <a href="#test-assistant" className="text-gray-600 hover:text-primary cursor-pointer">Тестирование</a>
                          </li>
                          <li>
                            <a href="#assistant-types" className="text-gray-600 hover:text-primary cursor-pointer">Типы ассистентов</a>
                          </li>
                        </ul>
                      )}
                    </li>
                    <li>
                      <button
                        onClick={() => toggleCategory("knowledge-base")}
                        className="flex justify-between items-center w-full text-left font-medium text-gray-900 hover:text-primary"
                      >
                        База знаний
                        <ChevronDown className={`h-4 w-4 transform transition-transform ${openCategory === "knowledge-base" ? "rotate-180" : ""}`} />
                      </button>
                      {openCategory === "knowledge-base" && (
                        <ul className="mt-2 ml-4 space-y-2">
                          <li>
                            <a href="#adding-knowledge" className="text-gray-600 hover:text-primary cursor-pointer">Добавление знаний</a>
                          </li>
                          <li>
                            <a href="#organizing-knowledge" className="text-gray-600 hover:text-primary cursor-pointer">Организация знаний</a>
                          </li>
                          <li>
                            <a href="#knowledge-formats" className="text-gray-600 hover:text-primary cursor-pointer">Поддерживаемые форматы</a>
                          </li>
                          <li>
                            <a href="#knowledge-links" className="text-gray-600 hover:text-primary cursor-pointer">Привязка к ассистенту</a>
                          </li>
                        </ul>
                      )}
                    </li>
                    <li>
                      <button
                        onClick={() => toggleCategory("channels")}
                        className="flex justify-between items-center w-full text-left font-medium text-gray-900 hover:text-primary"
                      >
                        Каналы связи
                        <ChevronDown className={`h-4 w-4 transform transition-transform ${openCategory === "channels" ? "rotate-180" : ""}`} />
                      </button>
                      {openCategory === "channels" && (
                        <ul className="mt-2 ml-4 space-y-2">
                          <li>
                            <Link href="/docs#channel-setup">
                              <div className="text-gray-600 hover:text-primary cursor-pointer">Настройка каналов</div>
                            </Link>
                          </li>
                          <li>
                            <Link href="/docs#messengers">
                              <div className="text-gray-600 hover:text-primary cursor-pointer">Мессенджеры</div>
                            </Link>
                          </li>
                          <li>
                            <Link href="/docs#social-networks">
                              <div className="text-gray-600 hover:text-primary cursor-pointer">Социальные сети</div>
                            </Link>
                          </li>
                          <li>
                            <Link href="/docs#email">
                              <div className="text-gray-600 hover:text-primary cursor-pointer">Email интеграция</div>
                            </Link>
                          </li>
                          <li>
                            <Link href="/docs#website-widget">
                              <div className="text-gray-600 hover:text-primary cursor-pointer">Виджет для сайта</div>
                            </Link>
                          </li>
                        </ul>
                      )}
                    </li>
                    <li>
                      <button
                        onClick={() => toggleCategory("voice")}
                        className="flex justify-between items-center w-full text-left font-medium text-gray-900 hover:text-primary"
                      >
                        Голосовой модуль
                        <ChevronDown className={`h-4 w-4 transform transition-transform ${openCategory === "voice" ? "rotate-180" : ""}`} />
                      </button>
                      {openCategory === "voice" && (
                        <ul className="mt-2 ml-4 space-y-2">
                          <li>
                            <Link href="/docs#voice-setup">
                              <div className="text-gray-600 hover:text-primary cursor-pointer">Настройка телефонии</div>
                            </Link>
                          </li>
                          <li>
                            <Link href="/docs#cold-calls">
                              <div className="text-gray-600 hover:text-primary cursor-pointer">Холодные звонки</div>
                            </Link>
                          </li>
                          <li>
                            <Link href="/docs#incoming-calls">
                              <div className="text-gray-600 hover:text-primary cursor-pointer">Прием входящих</div>
                            </Link>
                          </li>
                          <li>
                            <Link href="/docs#voice-analytics">
                              <div className="text-gray-600 hover:text-primary cursor-pointer">Анализ разговоров</div>
                            </Link>
                          </li>
                        </ul>
                      )}
                    </li>
                    <li>
                      <button
                        onClick={() => toggleCategory("analytics")}
                        className="flex justify-between items-center w-full text-left font-medium text-gray-900 hover:text-primary"
                      >
                        Аналитика
                        <ChevronDown className={`h-4 w-4 transform transition-transform ${openCategory === "analytics" ? "rotate-180" : ""}`} />
                      </button>
                      {openCategory === "analytics" && (
                        <ul className="mt-2 ml-4 space-y-2">
                          <li>
                            <Link href="/docs#dashboard-analytics">
                              <div className="text-gray-600 hover:text-primary cursor-pointer">Дашборды</div>
                            </Link>
                          </li>
                          <li>
                            <Link href="/docs#performance-metrics">
                              <div className="text-gray-600 hover:text-primary cursor-pointer">Метрики эффективности</div>
                            </Link>
                          </li>
                          <li>
                            <Link href="/docs#reports">
                              <div className="text-gray-600 hover:text-primary cursor-pointer">Отчеты</div>
                            </Link>
                          </li>
                          <li>
                            <Link href="/docs#data-export">
                              <div className="text-gray-600 hover:text-primary cursor-pointer">Экспорт данных</div>
                            </Link>
                          </li>
                        </ul>
                      )}
                    </li>
                    <li>
                      <button
                        onClick={() => toggleCategory("team")}
                        className="flex justify-between items-center w-full text-left font-medium text-gray-900 hover:text-primary"
                      >
                        Команда
                        <ChevronDown className={`h-4 w-4 transform transition-transform ${openCategory === "team" ? "rotate-180" : ""}`} />
                      </button>
                      {openCategory === "team" && (
                        <ul className="mt-2 ml-4 space-y-2">
                          <li>
                            <Link href="/docs#team-management">
                              <div className="text-gray-600 hover:text-primary cursor-pointer">Управление командой</div>
                            </Link>
                          </li>
                          <li>
                            <Link href="/docs#roles-permissions">
                              <div className="text-gray-600 hover:text-primary cursor-pointer">Роли и права доступа</div>
                            </Link>
                          </li>
                          <li>
                            <Link href="/docs#activity-log">
                              <div className="text-gray-600 hover:text-primary cursor-pointer">Журнал активности</div>
                            </Link>
                          </li>
                        </ul>
                      )}
                    </li>
                    <li>
                      <button
                        onClick={() => toggleCategory("billing")}
                        className="flex justify-between items-center w-full text-left font-medium text-gray-900 hover:text-primary"
                      >
                        Биллинг
                        <ChevronDown className={`h-4 w-4 transform transition-transform ${openCategory === "billing" ? "rotate-180" : ""}`} />
                      </button>
                      {openCategory === "billing" && (
                        <ul className="mt-2 ml-4 space-y-2">
                          <li>
                            <Link href="/docs#tariff-plans">
                              <div className="text-gray-600 hover:text-primary cursor-pointer">Тарифные планы</div>
                            </Link>
                          </li>
                          <li>
                            <Link href="/docs#payment">
                              <div className="text-gray-600 hover:text-primary cursor-pointer">Оплата</div>
                            </Link>
                          </li>
                          <li>
                            <Link href="/docs#add-ons">
                              <div className="text-gray-600 hover:text-primary cursor-pointer">Дополнительные услуги</div>
                            </Link>
                          </li>
                          <li>
                            <Link href="/docs#invoices">
                              <div className="text-gray-600 hover:text-primary cursor-pointer">Счета и документы</div>
                            </Link>
                          </li>
                        </ul>
                      )}
                    </li>
                    <li>
                      <button
                        onClick={() => toggleCategory("api")}
                        className="flex justify-between items-center w-full text-left font-medium text-gray-900 hover:text-primary"
                      >
                        API и интеграции
                        <ChevronDown className={`h-4 w-4 transform transition-transform ${openCategory === "api" ? "rotate-180" : ""}`} />
                      </button>
                      {openCategory === "api" && (
                        <ul className="mt-2 ml-4 space-y-2">
                          <li>
                            <Link href="/docs#api-overview">
                              <div className="text-gray-600 hover:text-primary cursor-pointer">Обзор API</div>
                            </Link>
                          </li>
                          <li>
                            <Link href="/docs#authentication">
                              <div className="text-gray-600 hover:text-primary cursor-pointer">Аутентификация</div>
                            </Link>
                          </li>
                          <li>
                            <Link href="/docs#endpoints">
                              <div className="text-gray-600 hover:text-primary cursor-pointer">Эндпоинты</div>
                            </Link>
                          </li>
                          <li>
                            <Link href="/docs#webhook">
                              <div className="text-gray-600 hover:text-primary cursor-pointer">Webhook</div>
                            </Link>
                          </li>
                          <li>
                            <Link href="/docs#third-party">
                              <div className="text-gray-600 hover:text-primary cursor-pointer">Сторонние интеграции</div>
                            </Link>
                          </li>
                        </ul>
                      )}
                    </li>
                  </ul>
                </nav>
              </div>
            </div>

            {/* Основной контент */}
            <div className="lg:w-3/4">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-8">
                  <div id="overview" className="space-y-6 mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 flex items-center">
                      <FileText className="h-6 w-6 mr-3 text-primary" />
                      Обзор платформы
                    </h2>
                    <p className="text-gray-600">
                      <b>Асиссто</b> — это облачная платформа для создания и управления AI-ассистентами, которые автоматизируют 
                      коммуникации с клиентами и внутренние бизнес-процессы. Платформа построена на основе 
                      технологий искусственного интеллекта и обработки естественного языка.
                    </p>
                    <p className="text-gray-600">
                      Главная цель платформы — сделать технологии искусственного интеллекта доступными для 
                      бизнеса любого масштаба без необходимости глубоких технических знаний.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                          <Settings className="h-5 w-5 mr-2 text-primary" />
                          Ключевые возможности
                        </h3>
                        <ul className="space-y-2 text-gray-600">
                          <li className="flex items-start gap-2">
                            <span className="text-primary font-semibold">•</span>
                            <span>Создание и настройка ассистентов с разными ролями</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary font-semibold">•</span>
                            <span>Загрузка и организация базы знаний</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary font-semibold">•</span>
                            <span>Подключение различных каналов коммуникации</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary font-semibold">•</span>
                            <span>Голосовые коммуникации и телефония</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary font-semibold">•</span>
                            <span>Аналитика и отчеты о работе ассистентов</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                          <Book className="h-5 w-5 mr-2 text-primary" />
                          Для кого подходит
                        </h3>
                        <ul className="space-y-2 text-gray-600">
                          <li className="flex items-start gap-2">
                            <span className="text-primary font-semibold">•</span>
                            <span>Отделы клиентской поддержки</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary font-semibold">•</span>
                            <span>Отделы продаж и маркетинга</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary font-semibold">•</span>
                            <span>HR и рекрутинг</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary font-semibold">•</span>
                            <span>IT и техническая поддержка</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary font-semibold">•</span>
                            <span>Обучение и образование</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mt-8">Архитектура платформы</h3>
                    <p className="text-gray-600">
                      Платформа построена по модульному принципу, где каждый модуль отвечает за определенный 
                      функционал и может использоваться как самостоятельно, так и в составе комплексного решения.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col items-center text-center">
                        <div className="h-8 w-8 text-primary mb-2 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 8V4H8"></path>
                            <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                            <path d="M2 14h2"></path>
                            <path d="M20 14h2"></path>
                            <path d="M15 13v2"></path>
                            <path d="M9 13v2"></path>
                          </svg>
                        </div>
                        <h4 className="font-semibold text-gray-900">Ассистенты</h4>
                        <p className="text-sm text-gray-600">Создание и настройка виртуальных ассистентов</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col items-center text-center">
                        <div className="h-8 w-8 text-primary mb-2 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                            <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"></path>
                          </svg>
                        </div>
                        <h4 className="font-semibold text-gray-900">База знаний</h4>
                        <p className="text-sm text-gray-600">Хранение и организация информации</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col items-center text-center">
                        <div className="h-8 w-8 text-primary mb-2 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                            <polyline points="16 6 12 2 8 6"></polyline>
                            <line x1="12" x2="12" y1="2" y2="15"></line>
                          </svg>
                        </div>
                        <h4 className="font-semibold text-gray-900">Каналы</h4>
                        <p className="text-sm text-gray-600">Подключение каналов коммуникации</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col items-center text-center">
                        <div className="h-8 w-8 text-primary mb-2 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                          </svg>
                        </div>
                        <h4 className="font-semibold text-gray-900">Телефония</h4>
                        <p className="text-sm text-gray-600">Голосовые коммуникации</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col items-center text-center">
                        <div className="h-8 w-8 text-primary mb-2 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                          </svg>
                        </div>
                        <h4 className="font-semibold text-gray-900">Уведомления</h4>
                        <p className="text-sm text-gray-600">Рассылки и оповещения</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col items-center text-center">
                        <div className="h-8 w-8 text-primary mb-2 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                          </svg>
                        </div>
                        <h4 className="font-semibold text-gray-900">Команда</h4>
                        <p className="text-sm text-gray-600">Управление пользователями</p>
                      </div>
                    </div>
                  </div>
                  
                  <div id="registration" className="space-y-6 mb-12 pt-8 border-t border-gray-200">
                    <h2 className="text-3xl font-bold text-gray-900">Регистрация и вход</h2>
                    <p className="text-gray-600">
                      Для начала работы с платформой Асиссто необходимо зарегистрироваться и создать учетную 
                      запись. Процесс регистрации прост и занимает несколько минут.
                    </p>
                    
                    <h3 className="text-xl font-bold text-gray-900 mt-6">Шаги регистрации:</h3>
                    <ol className="list-decimal pl-6 space-y-4 text-gray-600">
                      <li>
                        <p className="font-medium">Перейдите на страницу регистрации</p>
                        <p>Нажмите кнопку "Начать бесплатно" на главной странице или перейдите напрямую по адресу 
                        <span className="font-mono bg-gray-100 px-1 mx-1 rounded">app.asissto.ru/register</span>.</p>
                      </li>
                      <li>
                        <p className="font-medium">Заполните регистрационную форму</p>
                        <p>Укажите ваш email, придумайте надежный пароль и заполните информацию о компании.</p>
                      </li>
                      <li>
                        <p className="font-medium">Подтвердите email</p>
                        <p>На указанный email будет отправлено письмо со ссылкой для подтверждения. 
                        Перейдите по ссылке для активации аккаунта.</p>
                      </li>
                      <li>
                        <p className="font-medium">Завершите настройку профиля</p>
                        <p>После подтверждения email вы будете перенаправлены на страницу настройки профиля, 
                        где нужно указать дополнительную информацию и предпочтения.</p>
                      </li>
                    </ol>
                    
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-6">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            <strong>Примечание:</strong> Для использования полного функционала платформы рекомендуется 
                            указывать реальные данные компании и контактную информацию.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mt-6">Вход в систему</h3>
                    <p className="text-gray-600">
                      После успешной регистрации вы можете входить в систему, используя ваш email и пароль.
                    </p>
                    
                    <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
                      <img 
                        src="/images/docs/login-screen.jpg" 
                        alt="Экран входа в систему" 
                        className="w-full h-auto"
                      />
                      <div className="p-4 bg-gray-50">
                        <p className="text-sm text-gray-600">Экран входа в систему Асиссто</p>
                      </div>
                    </div>
                  </div>

                  {/* Dashboard */}
                  <div id="dashboard" className="space-y-6 mb-12 pt-8 border-t border-gray-200">
                    <h2 className="text-3xl font-bold text-gray-900">Панель управления</h2>
                    <p className="text-gray-600">
                      После входа в систему вы попадаете на главную панель управления (дашборд), которая представляет 
                      собой информационный центр вашего аккаунта Асиссто. Здесь отображается общая статистика, 
                      недавняя активность и быстрый доступ к основным разделам платформы.
                    </p>
                    
                    <h3 className="text-xl font-bold text-gray-900 mt-6">Основные элементы панели управления:</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h4 className="font-bold text-gray-900 mb-2">Статистика и метрики</h4>
                        <p className="text-gray-600">
                          В верхней части дашборда представлены ключевые показатели работы ваших ассистентов:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600">
                          <li>Общее количество обработанных запросов</li>
                          <li>Средняя оценка удовлетворенности</li>
                          <li>Количество активных ассистентов</li>
                          <li>Использование ресурсов по тарифу</li>
                        </ul>
                      </div>
                      
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h4 className="font-bold text-gray-900 mb-2">Недавняя активность</h4>
                        <p className="text-gray-600">
                          Лента последних событий, включающая:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600">
                          <li>Новые диалоги с ассистентами</li>
                          <li>Обновления базы знаний</li>
                          <li>Действия членов команды</li>
                          <li>Системные уведомления</li>
                        </ul>
                      </div>
                      
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h4 className="font-bold text-gray-900 mb-2">Быстрые действия</h4>
                        <p className="text-gray-600">
                          Кнопки для быстрого доступа к основным операциям:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600">
                          <li>Создать нового ассистента</li>
                          <li>Добавить документ в базу знаний</li>
                          <li>Настроить канал коммуникации</li>
                          <li>Пригласить члена команды</li>
                        </ul>
                      </div>
                      
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h4 className="font-bold text-gray-900 mb-2">Навигация по разделам</h4>
                        <p className="text-gray-600">
                          Боковое меню для перехода между основными разделами:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600">
                          <li>Ассистенты</li>
                          <li>База знаний</li>
                          <li>Каналы связи</li>
                          <li>Аналитика</li>
                          <li>Команда</li>
                          <li>Настройки</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
                      <img 
                        src="/src/assets/image_1743106231956.png" 
                        alt="Панель управления" 
                        className="w-full h-auto"
                      />
                      <div className="p-4 bg-gray-50">
                        <p className="text-sm text-gray-600">Главная панель управления с основной статистикой и навигацией</p>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-6">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-blue-700">
                            <strong>Совет:</strong> Вы можете настроить дашборд под свои потребности, разместив наиболее важные 
                            для вас виджеты в разделе "Настройки" → "Персонализация".
                          </p>
                        </div>
                      </div>
                    </div>
                    
                  </div>
                  
                  {/* Первый ассистент */}
                  <div id="first-assistant" className="space-y-6 mb-12 pt-8 border-t border-gray-200">
                    <h2 className="text-3xl font-bold text-gray-900">Первый ассистент</h2>
                    <p className="text-gray-600">
                      После знакомства с интерфейсом платформы самое время создать вашего первого виртуального 
                      ассистента. Этот раздел поможет быстро пройти весь процесс от создания до тестирования.
                    </p>
                    
                    <h3 className="text-xl font-bold text-gray-900 mt-6">Быстрый старт с первым ассистентом</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 flex flex-col items-center text-center">
                        <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                          <span className="text-primary font-bold text-xl">1</span>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">Создание ассистента</h4>
                        <p className="text-gray-600 text-sm">
                          Нажмите "Создать ассистента" на панели управления и выберите подходящий шаблон или создайте 
                          своего с нуля.
                        </p>
                      </div>
                      
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 flex flex-col items-center text-center">
                        <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                          <span className="text-primary font-bold text-xl">2</span>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">Базовая настройка</h4>
                        <p className="text-gray-600 text-sm">
                          Укажите имя, описание и выберите роль ассистента. Это определит базовый набор навыков 
                          и поведение.
                        </p>
                      </div>
                      
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 flex flex-col items-center text-center">
                        <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                          <span className="text-primary font-bold text-xl">3</span>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">Тестирование</h4>
                        <p className="text-gray-600 text-sm">
                          Откройте чат с ассистентом и проверьте, как он отвечает на вопросы. Внесите корректировки 
                          при необходимости.
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
                      <img 
                        src="/src/assets/image_1743105828977.png" 
                        alt="Интерфейс создания ассистента" 
                        className="w-full h-auto"
                      />
                      <div className="p-4 bg-gray-50">
                        <p className="text-sm text-gray-600">Интерфейс работы с ассистентом - загрузка файлов в базу знаний</p>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mt-8">Примеры использования</h3>
                    <p className="text-gray-600">
                      Вот несколько примеров задач, которые можно решить с помощью вашего первого ассистента:
                    </p>
                    
                    <div className="space-y-4 mt-4">
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Ассистент для поддержки клиентов</h4>
                        <p className="text-gray-600">
                          Создайте ассистента, который будет отвечать на часто задаваемые вопросы клиентов, помогать с 
                          навигацией по сайту и решать простые проблемы. Загрузите в базу знаний FAQ, руководства пользователя
                          и информацию о продуктах.
                        </p>
                      </div>
                      
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Ассистент по продажам</h4>
                        <p className="text-gray-600">
                          Настройте ассистента, который будет помогать клиентам подбирать товары или услуги, отвечать на 
                          вопросы о ценах, акциях и условиях. Загрузите в базу знаний каталоги, прайс-листы и информацию о 
                          специальных предложениях.
                        </p>
                      </div>
                      
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Внутренний HR-ассистент</h4>
                        <p className="text-gray-600">
                          Создайте ассистента для сотрудников компании, который будет отвечать на вопросы о корпоративных 
                          политиках, процедурах, графике работы и других HR-вопросах. Загрузите внутренние документы, 
                          правила и инструкции.
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 border-l-4 border-green-400 p-4 mt-6">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-green-700">
                            <strong>Совет по быстрому старту:</strong> Начните с готового шаблона ассистента, который наиболее 
                            близок к вашим задачам, и адаптируйте его под свои нужды. Это значительно ускорит процесс настройки.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Создание ассистента */}
                  <div id="create-assistant" className="space-y-6 mb-12 pt-8 border-t border-gray-200">
                    <h2 className="text-3xl font-bold text-gray-900">Создание ассистента</h2>
                    <p className="text-gray-600">
                      В этом разделе подробно рассмотрим процесс создания нового ассистента с нуля. Вы узнаете о всех 
                      доступных настройках и возможностях персонализации.
                    </p>
                    
                    <h3 className="text-xl font-bold text-gray-900 mt-6">Шаги по созданию ассистента</h3>
                    
                    <ol className="list-decimal pl-6 space-y-4 text-gray-600 mt-4">
                      <li>
                        <p className="font-medium">Начало создания</p>
                        <p>На панели управления нажмите кнопку "Создать ассистента" или перейдите в раздел "Ассистенты" 
                        и нажмите "+ Новый ассистент".</p>
                      </li>
                      <li>
                        <p className="font-medium">Выбор типа ассистента</p>
                        <p>Выберите один из предложенных шаблонов (менеджер по продажам, техподдержка, HR-специалист и т.д.) 
                        или опцию "Пустой шаблон" для создания с нуля.</p>
                      </li>
                      <li>
                        <p className="font-medium">Основная информация</p>
                        <p>Заполните базовые поля:
                          <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Имя ассистента (будет видно клиентам)</li>
                            <li>Описание (для внутреннего использования)</li>
                            <li>Аватар (загрузите изображение или выберите из готовых)</li>
                            <li>Категория (для организации в панели управления)</li>
                          </ul>
                        </p>
                      </li>
                      <li>
                        <p className="font-medium">Настройка инструкций</p>
                        <p>Создайте подробные инструкции для ассистента, которые определят его поведение, стиль общения 
                        и границы знаний. Используйте редактор форматированного текста для структурирования инструкций.</p>
                      </li>
                      <li>
                        <p className="font-medium">Добавление базы знаний</p>
                        <p>Загрузите документы (PDF, DOCX, XLSX, TXT) или укажите URL-адреса, из которых ассистент будет 
                        получать информацию для ответов. Вы можете выбрать существующие элементы из базы знаний или добавить новые.</p>
                      </li>
                      <li>
                        <p className="font-medium">Настройка параметров AI</p>
                        <p>Выберите базовую модель AI и настройте параметры:
                          <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Температура (креативность ответов)</li>
                            <li>Максимальная длина ответа</li>
                            <li>Формат ответов (текст, HTML, JSON)</li>
                            <li>Дополнительные возможности (аналитика, генерация кода и т.д.)</li>
                          </ul>
                        </p>
                      </li>
                      <li>
                        <p className="font-medium">Сохранение и тестирование</p>
                        <p>Сохраните созданного ассистента и перейдите в режим тестирования, чтобы проверить его работу и 
                        внести необходимые корректировки.</p>
                      </li>
                    </ol>
                    
                    <div className="mt-8 border border-gray-200 rounded-lg overflow-hidden">
                      <img 
                        src="/src/assets/image_1743102161463.png" 
                        alt="Форма создания ассистента" 
                        className="w-full h-auto"
                      />
                      <div className="p-4 bg-gray-50">
                        <p className="text-sm text-gray-600">Форма создания нового ассистента с основными настройками</p>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mt-8">Продвинутые настройки</h3>
                    
                    <div className="space-y-4 mt-4">
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Инструменты и плагины</h4>
                        <p className="text-gray-600">
                          Расширьте возможности ассистента, подключив дополнительные инструменты:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600">
                          <li>Поиск в интернете</li>
                          <li>Работа с календарем</li>
                          <li>Интеграция с CRM</li>
                          <li>Анализ данных</li>
                          <li>Создание изображений</li>
                        </ul>
                      </div>
                      
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Настройка персонажа</h4>
                        <p className="text-gray-600">
                          Определите индивидуальность и характер ассистента:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600">
                          <li>Тон общения (формальный, дружелюбный, деловой)</li>
                          <li>Стиль речи и лексика</li>
                          <li>Использование юмора и эмоций</li>
                          <li>Биография и бэкграунд персонажа</li>
                        </ul>
                      </div>
                      
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Сценарии и диалоги</h4>
                        <p className="text-gray-600">
                          Создайте готовые сценарии взаимодействия:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600">
                          <li>Приветствие и начало диалога</li>
                          <li>Ответы на типичные вопросы</li>
                          <li>Обработка возражений</li>
                          <li>Завершение разговора</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-6">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            <strong>Важно:</strong> Чем более подробные инструкции вы дадите ассистенту, тем точнее 
                            он будет отвечать на вопросы пользователей. Рекомендуется регулярно обновлять инструкции 
                            на основе анализа реальных диалогов.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-8 pt-8 border-t border-gray-200">
                    <div>
                      <a href="#dashboard" className="text-primary hover:underline cursor-pointer">← Панель управления</a>
                    </div>
                    <div>
                      <a href="#configure-assistant" className="text-primary hover:underline cursor-pointer">Настройка поведения →</a>
                    </div>
                  </div>
                  
                  {/* Настройка поведения */}
                  <div id="configure-assistant" className="space-y-6 mb-12 pt-8 border-t border-gray-200">
                    <h2 className="text-3xl font-bold text-gray-900">Настройка поведения ассистента</h2>
                    <p className="text-gray-600">
                      После создания базового ассистента вы можете настроить его поведение более детально, чтобы 
                      он максимально соответствовал вашим требованиям и эффективно решал поставленные задачи.
                    </p>
                    
                    <h3 className="text-xl font-bold text-gray-900 mt-6">Основные аспекты настройки поведения</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Инструкции для ассистента</h4>
                        <p className="text-gray-600">
                          Инструкции — это ключевой элемент настройки поведения. Они должны включать:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600">
                          <li>Четкое описание роли ассистента</li>
                          <li>Ограничения и границы знаний</li>
                          <li>Указания по стилю и тону общения</li>
                          <li>Специфические сценарии и как на них реагировать</li>
                          <li>Правила взаимодействия с пользователями</li>
                        </ul>
                      </div>
                      
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Параметры модели AI</h4>
                        <p className="text-gray-600">
                          Настройка технических параметров модели искусственного интеллекта:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600">
                          <li><strong>Температура:</strong> Контролирует креативность ответов (0.1-1.0)</li>
                          <li><strong>Max токенов:</strong> Максимальная длина ответов</li>
                          <li><strong>Top_p:</strong> Управление разнообразием ответов</li>
                          <li><strong>Frequency penalty:</strong> Снижение повторений</li>
                          <li><strong>Presence penalty:</strong> Поощрение новых тем</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
                      <img 
                        src="/src/assets/image_1743104109672.png" 
                        alt="Настройка поведения ассистента" 
                        className="w-full h-auto"
                      />
                      <div className="p-4 bg-gray-50">
                        <p className="text-sm text-gray-600">Интерфейс настройки параметров модели AI и инструкций для ассистента</p>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mt-8">Примеры эффективных инструкций</h3>
                    
                    <div className="space-y-4 mt-4">
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Для ассистента по продажам</h4>
                        <div className="bg-white p-4 rounded border border-gray-200 text-gray-600 text-sm">
                          <p>Ты — виртуальный менеджер по продажам компании "ТехноМаркет". Твоя задача — помогать клиентам 
                          подобрать подходящие товары, отвечать на вопросы о технических характеристиках, ценах и акциях.</p>
                          <br/>
                          <p><strong>Ключевые принципы взаимодействия:</strong></p>
                          <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Будь вежливым и профессиональным, но дружелюбным</li>
                            <li>Предлагай товары, исходя из потребностей клиента, не навязывай дорогие варианты</li>
                            <li>Акцентируй внимание на технических преимуществах и соотношении цена/качество</li>
                            <li>При сравнении товаров будь объективным</li>
                            <li>Если не знаешь ответа, предложи связать с живым консультантом</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Для ассистента техподдержки</h4>
                        <div className="bg-white p-4 rounded border border-gray-200 text-gray-600 text-sm">
                          <p>Ты — специалист технической поддержки. Твоя задача — помогать пользователям решать технические 
                          проблемы, связанные с программным обеспечением и оборудованием компании.</p>
                          <br/>
                          <p><strong>Алгоритм работы:</strong></p>
                          <ol className="list-decimal pl-5 mt-2 space-y-1">
                            <li>Сначала выяви суть проблемы, задавая уточняющие вопросы</li>
                            <li>Предложи пошаговое решение, начиная с самых простых шагов</li>
                            <li>Если базовые решения не помогают, предложи более сложные варианты</li>
                            <li>При необходимости используй технические термины, но объясняй их значение</li>
                            <li>Если проблема требует прямого вмешательства, создай заявку для специалиста</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mt-8">Оптимальные настройки параметров</h3>
                    
                    <div className="overflow-x-auto mt-4">
                      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="py-3 px-4 border-b text-left text-gray-600 font-semibold">Параметр</th>
                            <th className="py-3 px-4 border-b text-left text-gray-600 font-semibold">Для продаж</th>
                            <th className="py-3 px-4 border-b text-left text-gray-600 font-semibold">Для поддержки</th>
                            <th className="py-3 px-4 border-b text-left text-gray-600 font-semibold">Для HR</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="py-3 px-4 border-b text-gray-700 font-medium">Температура</td>
                            <td className="py-3 px-4 border-b text-gray-600">0.7</td>
                            <td className="py-3 px-4 border-b text-gray-600">0.3</td>
                            <td className="py-3 px-4 border-b text-gray-600">0.5</td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 border-b text-gray-700 font-medium">Max токенов</td>
                            <td className="py-3 px-4 border-b text-gray-600">1000</td>
                            <td className="py-3 px-4 border-b text-gray-600">1500</td>
                            <td className="py-3 px-4 border-b text-gray-600">800</td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 border-b text-gray-700 font-medium">Top_p</td>
                            <td className="py-3 px-4 border-b text-gray-600">0.9</td>
                            <td className="py-3 px-4 border-b text-gray-600">0.8</td>
                            <td className="py-3 px-4 border-b text-gray-600">0.85</td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 border-b text-gray-700 font-medium">Frequency penalty</td>
                            <td className="py-3 px-4 border-b text-gray-600">0.2</td>
                            <td className="py-3 px-4 border-b text-gray-600">0.1</td>
                            <td className="py-3 px-4 border-b text-gray-600">0.3</td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 text-gray-700 font-medium">Presence penalty</td>
                            <td className="py-3 px-4 text-gray-600">0.3</td>
                            <td className="py-3 px-4 text-gray-600">0.2</td>
                            <td className="py-3 px-4 text-gray-600">0.4</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-6">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-blue-700">
                            <strong>Совет:</strong> Экспериментируйте с настройками на тестовой среде, прежде чем применять 
                            их в рабочем окружении. Небольшие изменения параметров могут существенно влиять на качество и стиль ответов.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Тестирование ассистента */}
                  <div id="test-assistant" className="space-y-6 mb-12 pt-8 border-t border-gray-200">
                    <h2 className="text-3xl font-bold text-gray-900">Тестирование ассистента</h2>
                    <p className="text-gray-600">
                      Тестирование — критически важный этап перед запуском ассистента в работу. Тщательное тестирование 
                      помогает выявить и исправить ошибки, оптимизировать инструкции и настройки.
                    </p>
                    
                    <h3 className="text-xl font-bold text-gray-900 mt-6">Методология тестирования</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Подготовка тестовых сценариев</h4>
                        <p className="text-gray-600">
                          Создайте набор тестовых сценариев, охватывающих различные ситуации:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600">
                          <li>Типичные вопросы и задачи</li>
                          <li>Сложные и нестандартные запросы</li>
                          <li>Пограничные ситуации и исключения</li>
                          <li>Сценарии с эмоциональной окраской</li>
                          <li>Тесты на знание базы данных</li>
                        </ul>
                      </div>
                      
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Процесс тестирования</h4>
                        <p className="text-gray-600">
                          Пошаговый процесс проведения тестирования:
                        </p>
                        <ol className="list-decimal pl-5 mt-2 space-y-1 text-gray-600">
                          <li>Начните с базовых сценариев и постепенно усложняйте</li>
                          <li>Документируйте результаты каждого теста</li>
                          <li>Фиксируйте проблемные ответы для анализа</li>
                          <li>Корректируйте инструкции на основе результатов</li>
                          <li>Проводите повторное тестирование после изменений</li>
                        </ol>
                      </div>
                    </div>
                    
                    <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
                      <img 
                        src="/src/assets/image_1743105083342.png" 
                        alt="Интерфейс тестирования ассистента" 
                        className="w-full h-auto"
                      />
                      <div className="p-4 bg-gray-50">
                        <p className="text-sm text-gray-600">Интерфейс тестирования ассистента с примером диалога</p>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mt-8">Ключевые аспекты оценки</h3>
                    
                    <div className="space-y-4 mt-4">
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Точность и релевантность ответов</h4>
                        <p className="text-gray-600">
                          Оценивайте насколько точно и релевантно ассистент отвечает на вопросы. Обратите внимание на:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600">
                          <li>Соответствие ответов фактической информации в базе знаний</li>
                          <li>Полноту предоставляемой информации</li>
                          <li>Умение ассистента распознавать суть запроса</li>
                          <li>Способность отвечать по теме, не отклоняясь в сторону</li>
                        </ul>
                      </div>
                      
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Стиль и тон коммуникации</h4>
                        <p className="text-gray-600">
                          Проверяйте соответствие стиля и тона коммуникации заданным требованиям:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600">
                          <li>Формальность/неформальность общения</li>
                          <li>Последовательность стиля в разных диалогах</li>
                          <li>Соответствие "характеру" ассистента</li>
                          <li>Адекватность реакции на эмоциональный тон пользователя</li>
                        </ul>
                      </div>
                      
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Обработка сложных ситуаций</h4>
                        <p className="text-gray-600">
                          Оцените способность ассистента справляться со сложными ситуациями:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600">
                          <li>Неоднозначные запросы</li>
                          <li>Вопросы вне компетенции</li>
                          <li>Конфликтные ситуации</li>
                          <li>Многоуровневые вопросы, требующие пошагового разбора</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 border-l-4 border-green-400 p-4 mt-6">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-green-700">
                            <strong>Практическая рекомендация:</strong> Привлекайте для тестирования людей, которые не 
                            участвовали в создании ассистента. Они с большей вероятностью заметят неочевидные проблемы и 
                            смогут оценить работу ассистента с точки зрения конечного пользователя.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-8 pt-8 border-t border-gray-200">
                    <div>
                      <a href="#create-assistant" className="text-primary hover:underline cursor-pointer">← Создание ассистента</a>
                    </div>
                    <div>
                      <a href="#assistant-types" className="text-primary hover:underline cursor-pointer">Типы ассистентов →</a>
                    </div>
                  </div>
                  
                  {/* Типы ассистентов */}
                  <div id="assistant-types" className="space-y-6 mb-12 pt-8 border-t border-gray-200">
                    <h2 className="text-3xl font-bold text-gray-900">Типы ассистентов</h2>
                    <p className="text-gray-600">
                      Платформа Асиссто предлагает различные типы ассистентов, каждый из которых оптимизирован для 
                      определенных задач и сценариев использования. Понимание особенностей каждого типа поможет вам 
                      выбрать наиболее подходящий вариант для ваших бизнес-целей.
                    </p>
                    
                    <h3 className="text-xl font-bold text-gray-900 mt-6">Основные типы ассистентов</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                      <div className="bg-white shadow-sm hover:shadow-md transition rounded-lg overflow-hidden border border-gray-200">
                        <div className="h-3 bg-blue-500"></div>
                        <div className="p-6">
                          <h4 className="text-xl font-bold text-gray-900 mb-3">Ассистент по продажам</h4>
                          <p className="text-gray-600 mb-4">
                            Специализируется на взаимодействии с потенциальными и существующими клиентами для увеличения продаж 
                            и улучшения клиентского опыта.
                          </p>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <div className="flex-shrink-0 mt-1">
                                <svg className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                </svg>
                              </div>
                              <p className="text-sm text-gray-600">Квалификация лидов и первичные консультации</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="flex-shrink-0 mt-1">
                                <svg className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                </svg>
                              </div>
                              <p className="text-sm text-gray-600">Презентация продуктов и сравнение вариантов</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="flex-shrink-0 mt-1">
                                <svg className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                </svg>
                              </div>
                              <p className="text-sm text-gray-600">Работа с возражениями и закрытие сделок</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="flex-shrink-0 mt-1">
                                <svg className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                </svg>
                              </div>
                              <p className="text-sm text-gray-600">Назначение встреч и демонстраций</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white shadow-sm hover:shadow-md transition rounded-lg overflow-hidden border border-gray-200">
                        <div className="h-3 bg-green-500"></div>
                        <div className="p-6">
                          <h4 className="text-xl font-bold text-gray-900 mb-3">Ассистент поддержки</h4>
                          <p className="text-gray-600 mb-4">
                            Ориентирован на решение проблем пользователей, ответы на вопросы и техническую поддержку 
                            продуктов и услуг компании.
                          </p>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <div className="flex-shrink-0 mt-1">
                                <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                </svg>
                              </div>
                              <p className="text-sm text-gray-600">Диагностика проблем и предложение решений</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="flex-shrink-0 mt-1">
                                <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                </svg>
                              </div>
                              <p className="text-sm text-gray-600">Ответы на часто задаваемые вопросы 24/7</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="flex-shrink-0 mt-1">
                                <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                </svg>
                              </div>
                              <p className="text-sm text-gray-600">Маршрутизация сложных запросов к специалистам</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="flex-shrink-0 mt-1">
                                <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                </svg>
                              </div>
                              <p className="text-sm text-gray-600">Сбор обратной связи для улучшения продуктов</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white shadow-sm hover:shadow-md transition rounded-lg overflow-hidden border border-gray-200">
                        <div className="h-3 bg-purple-500"></div>
                        <div className="p-6">
                          <h4 className="text-xl font-bold text-gray-900 mb-3">HR-ассистент</h4>
                          <p className="text-gray-600 mb-4">
                            Помогает в управлении персоналом, автоматизирует HR-процессы и обеспечивает информационную 
                            поддержку сотрудников.
                          </p>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <div className="flex-shrink-0 mt-1">
                                <svg className="h-4 w-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                </svg>
                              </div>
                              <p className="text-sm text-gray-600">Первичный скрининг кандидатов</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="flex-shrink-0 mt-1">
                                <svg className="h-4 w-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                </svg>
                              </div>
                              <p className="text-sm text-gray-600">Ответы на вопросы о политиках компании</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="flex-shrink-0 mt-1">
                                <svg className="h-4 w-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                </svg>
                              </div>
                              <p className="text-sm text-gray-600">Помощь в оформлении документов</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="flex-shrink-0 mt-1">
                                <svg className="h-4 w-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                </svg>
                              </div>
                              <p className="text-sm text-gray-600">Организация обучения и адаптации</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white shadow-sm hover:shadow-md transition rounded-lg overflow-hidden border border-gray-200">
                        <div className="h-3 bg-orange-500"></div>
                        <div className="p-6">
                          <h4 className="text-xl font-bold text-gray-900 mb-3">Маркетинговый ассистент</h4>
                          <p className="text-gray-600 mb-4">
                            Поддерживает маркетинговые активности, помогает в анализе данных и работе с контентом 
                            для максимизации маркетингового эффекта.
                          </p>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <div className="flex-shrink-0 mt-1">
                                <svg className="h-4 w-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                </svg>
                              </div>
                              <p className="text-sm text-gray-600">Анализ конкурентов и рыночных трендов</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="flex-shrink-0 mt-1">
                                <svg className="h-4 w-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                </svg>
                              </div>
                              <p className="text-sm text-gray-600">Генерация идей для контент-маркетинга</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="flex-shrink-0 mt-1">
                                <svg className="h-4 w-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                </svg>
                              </div>
                              <p className="text-sm text-gray-600">Взаимодействие с аудиторией в соцсетях</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="flex-shrink-0 mt-1">
                                <svg className="h-4 w-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                </svg>
                              </div>
                              <p className="text-sm text-gray-600">Подготовка аналитических отчётов</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mt-8">Специализированные ассистенты</h3>
                    <p className="text-gray-600 mb-6">
                      Кроме стандартных типов, платформа позволяет создавать узкоспециализированных ассистентов для 
                      конкретных отраслей и задач.
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-1">Финансовый консультант</h4>
                        <p className="text-sm text-gray-600">Для банков, страховых компаний и финансовых организаций</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-1">Туристический гид</h4>
                        <p className="text-sm text-gray-600">Для туроператоров, отелей и туристических компаний</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-1">Медицинский консультант</h4>
                        <p className="text-sm text-gray-600">Для клиник, медцентров и фармацевтических компаний</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-1">Образовательный ассистент</h4>
                        <p className="text-sm text-gray-600">Для школ, вузов и образовательных платформ</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-1">IT-консультант</h4>
                        <p className="text-sm text-gray-600">Для IT-компаний, разработчиков и технологических фирм</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-1">Юридический консультант</h4>
                        <p className="text-sm text-gray-600">Для юридических фирм, нотариусов и правовых служб</p>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-6">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-blue-700">
                            <strong>Совет:</strong> Вы можете создать несколько ассистентов разных типов и связать их в единую 
                            экосистему, где каждый будет отвечать за свою область. Это позволит эффективнее обрабатывать запросы и 
                            повысит точность ответов.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Добавление знаний */}
                  <div id="adding-knowledge" className="space-y-6 mb-12 pt-8 border-t border-gray-200">
                    <h2 className="text-3xl font-bold text-gray-900">Добавление знаний</h2>
                    <p className="text-gray-600">
                      База знаний — это фундамент, на котором строятся ответы вашего ассистента. Правильное наполнение 
                      базы знаний позволяет ассистенту давать точные и полезные ответы, основанные на документах и 
                      информации вашей компании.
                    </p>
                    
                    <h3 className="text-xl font-bold text-gray-900 mt-6">Процесс добавления знаний</h3>
                    
                    <ol className="list-decimal pl-6 space-y-4 text-gray-600 mt-4">
                      <li>
                        <p className="font-medium">Перейдите в раздел "База знаний"</p>
                        <p>В боковом меню платформы выберите раздел "База знаний" для доступа к интерфейсу управления знаниями.</p>
                      </li>
                      <li>
                        <p className="font-medium">Создайте новый элемент знаний</p>
                        <p>Нажмите кнопку "+ Добавить" и выберите тип элемента: файл, текст или URL-ссылку.</p>
                      </li>
                      <li>
                        <p className="font-medium">Загрузка файла</p>
                        <p>Если вы выбрали тип "Файл", вы можете загрузить документ с вашего устройства. Поддерживаются форматы: 
                        PDF, DOCX, XLSX, TXT, CSV и другие.</p>
                      </li>
                      <li>
                        <p className="font-medium">Добавление текста</p>
                        <p>Если вы выбрали тип "Текст", вы можете напрямую ввести или вставить текстовую информацию через 
                        встроенный редактор.</p>
                      </li>
                      <li>
                        <p className="font-medium">Добавление URL</p>
                        <p>Если вы выбрали тип "URL", введите адрес веб-страницы, информацию с которой нужно использовать в 
                        базе знаний.</p>
                      </li>
                      <li>
                        <p className="font-medium">Классификация и метаданные</p>
                        <p>Добавьте метаданные к элементу знаний — категорию, теги, описание и уровень доступа для более 
                        эффективной организации и поиска.</p>
                      </li>
                      <li>
                        <p className="font-medium">Сохранение и индексация</p>
                        <p>После сохранения система автоматически проанализирует и проиндексирует добавленную информацию, 
                        подготовив ее для использования ассистентами.</p>
                      </li>
                    </ol>
                    
                    <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
                      <img 
                        src="/src/assets/image_1743105538036.png" 
                        alt="Интерфейс добавления файлов в базу знаний" 
                        className="w-full h-auto"
                      />
                      <div className="p-4 bg-gray-50">
                        <p className="text-sm text-gray-600">Интерфейс подключения файлов из базы знаний к ассистенту</p>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mt-8">Рекомендации по наполнению базы знаний</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Типы документов для загрузки</h4>
                        <ul className="list-disc pl-5 space-y-1 text-gray-600">
                          <li>Руководства пользователя и инструкции</li>
                          <li>Часто задаваемые вопросы (FAQ)</li>
                          <li>Технические спецификации продуктов</li>
                          <li>Маркетинговые материалы и описания</li>
                          <li>Политики компании и регламенты</li>
                          <li>Прайс-листы и каталоги</li>
                          <li>Учебные материалы</li>
                        </ul>
                      </div>
                      
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Лучшие практики</h4>
                        <ul className="list-disc pl-5 space-y-1 text-gray-600">
                          <li>Загружайте актуальные и проверенные документы</li>
                          <li>Структурируйте информацию с помощью заголовков</li>
                          <li>Используйте четкие и однозначные формулировки</li>
                          <li>Регулярно обновляйте устаревшие данные</li>
                          <li>Группируйте связанные материалы по категориям</li>
                          <li>Избегайте дублирования информации</li>
                          <li>Устанавливайте правильные уровни доступа</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-6">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            <strong>Важно:</strong> Некоторые файлы могут не поддерживаться системой обработки или содержать информацию, 
                            которую сложно извлечь (например, с защитой от копирования или с большим количеством изображений). В таких 
                            случаях система предупредит вас, и может потребоваться конвертация или предварительная обработка файла.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-8 pt-8 border-t border-gray-200">
                    <div>
                      <a href="#assistant-types" className="text-primary hover:underline cursor-pointer">← Типы ассистентов</a>
                    </div>
                    <div>
                      <a href="#organizing-knowledge" className="text-primary hover:underline cursor-pointer">Организация знаний →</a>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Дополнительные секции */}
              <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Видеоуроки</h3>
                  <p className="text-gray-600 mb-4">
                    Изучите платформу с помощью нашей коллекции видеоуроков, которые показывают все аспекты 
                    создания и настройки ассистентов.
                  </p>
                  <Link href="/tutorials">
                    <div className="inline-flex items-center text-primary font-medium hover:underline cursor-pointer">
                      Смотреть видеоуроки <ChevronRight className="h-4 w-4 ml-1" />
                    </div>
                  </Link>
                </div>
                
                <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">API Документация</h3>
                  <p className="text-gray-600 mb-4">
                    Детальная документация по API для разработчиков, которые хотят интегрировать Асиссто 
                    с другими системами.
                  </p>
                  <Link href="/api-docs">
                    <div className="inline-flex items-center text-primary font-medium hover:underline cursor-pointer">
                      Изучить API <ChevronRight className="h-4 w-4 ml-1" />
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-white mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Остались вопросы?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-3xl mx-auto">
            Наша команда поддержки всегда готова помочь вам с любыми вопросами по использованию платформы
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <div className="bg-white text-primary px-6 py-3 rounded-lg font-medium text-lg hover:bg-gray-100 transition cursor-pointer inline-block">
                Связаться с поддержкой
              </div>
            </Link>
            <Link href="/faq">
              <div className="bg-primary text-white px-6 py-3 rounded-lg font-medium text-lg border border-white hover:bg-primary/90 transition cursor-pointer inline-block">
                Перейти к FAQ
              </div>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}