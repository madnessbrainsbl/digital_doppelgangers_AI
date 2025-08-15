import { PublicLayout } from "@/components/public/layout";
import {
  Award,
  Globe,
  Calendar,
  Users,
  Target,
  ChevronRight,
} from "lucide-react";
import { Link } from "wouter";

export default function AboutPage() {
  return (
    <PublicLayout>
      {/* Заголовок */}
      <section className="bg-gradient-to-b from-primary/5 to-white py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              О компании Асиссто
            </h1>
            <p className="text-xl text-gray-600">
              Мы создаем передовые технологии искусственного интеллекта, чтобы
              помочь бизнесу автоматизировать коммуникации и повысить
              эффективность.
            </p>
          </div>
        </div>
      </section>

      {/* Наша история */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-12 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Наша история
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Путь развития компании Асиссто от идеи до лидера рынка
                AI-решений
              </p>
            </div>

            <div className="space-y-16">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="inline-flex items-center bg-primary/10 px-3 py-1 rounded-full text-primary font-medium mb-4">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>2020</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Основание компании
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Компания Асиссто была основана группой специалистов по
                    искусственному интеллекту и машинному обучению с целью
                    создания продукта, который сделает технологии ИИ доступными
                    для бизнеса любого масштаба.
                  </p>
                  <p className="text-gray-600">
                    Наша первоначальная команда из 10 человек начала разработку
                    прототипа платформы для создания виртуальных ассистентов.
                  </p>
                </div>
                <div className="rounded-xl overflow-hidden shadow-lg">
                  <img
                    src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
                    alt="Основание компании Асиссто"
                    className="w-full h-auto"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center md:flex-row-reverse">
                <div className="md:order-2">
                  <div className="inline-flex items-center bg-primary/10 px-3 py-1 rounded-full text-primary font-medium mb-4">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>2021</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Запуск первой версии
                  </h3>
                  <p className="text-gray-600 mb-4">
                    После года интенсивной разработки мы выпустили первую версию
                    платформы Асиссто, которая позволяла создавать чат-ботов и
                    интегрировать их с популярными мессенджерами.
                  </p>
                  <p className="text-gray-600">
                    В этом же году мы привлекли первое инвестиционное
                    финансирование и начали активно расширять команду
                    разработчиков и специалистов по машинному обучению.
                  </p>
                </div>
                <div className="rounded-xl overflow-hidden shadow-lg md:order-1">
                  <img
                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
                    alt="Запуск первой версии Асиссто"
                    className="w-full h-auto"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="inline-flex items-center bg-primary/10 px-3 py-1 rounded-full text-primary font-medium mb-4">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>2022</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Расширение функционала
                  </h3>
                  <p className="text-gray-600 mb-4">
                    В 2022 году мы значительно расширили возможности платформы,
                    добавив модули аналитики, интеграции с CRM-системами и
                    голосовой модуль для телефонии.
                  </p>
                  <p className="text-gray-600">
                    Количество клиентов выросло до 500, а команда компании — до
                    50 человек. Мы открыли офисы в Москве и Санкт-Петербурге.
                  </p>
                </div>
                <div className="rounded-xl overflow-hidden shadow-lg">
                  <img
                    src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
                    alt="Расширение функционала Асиссто"
                    className="w-full h-auto"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center md:flex-row-reverse">
                <div className="md:order-2">
                  <div className="inline-flex items-center bg-primary/10 px-3 py-1 rounded-full text-primary font-medium mb-4">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>2023</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Интеграция с GPT-4
                  </h3>
                  <p className="text-gray-600 mb-4">
                    В 2023 году мы интегрировали в нашу платформу технологии
                    GPT-4, что позволило создавать еще более интеллектуальных и
                    человекоподобных ассистентов.
                  </p>
                  <p className="text-gray-600">
                    Клиентская база выросла до 1500 компаний различных отраслей,
                    а международная экспансия началась с открытия
                    представительств в странах СНГ.
                  </p>
                </div>
                <div className="rounded-xl overflow-hidden shadow-lg md:order-1">
                  <img
                    src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
                    alt="Интеграция с GPT-4"
                    className="w-full h-auto"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="inline-flex items-center bg-primary/10 px-3 py-1 rounded-full text-primary font-medium mb-4">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>2024-Сегодня</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Лидерство на рынке
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Сегодня Асиссто — лидер рынка AI-ассистентов в России и
                    странах СНГ, с более чем 2000 клиентов и комплексным
                    решением для автоматизации коммуникаций.
                  </p>
                  <p className="text-gray-600">
                    Мы продолжаем развивать технологии, расширять функционал
                    платформы и создавать инновационные решения, которые
                    помогают бизнесу любого масштаба.
                  </p>
                </div>
                <div className="rounded-xl overflow-hidden shadow-lg">
                  <img
                    src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
                    alt="Лидерство на рынке"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Миссия и ценности */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-12 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Наша миссия и ценности
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Принципы, которые определяют нашу работу и отношение к клиентам
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm hover:shadow-md transition">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Target className="mr-3 text-primary h-7 w-7" />
                  Наша миссия
                </h3>
                <p className="text-gray-600 mb-4">
                  Делать технологии искусственного интеллекта доступными для
                  бизнеса любого масштаба, помогая компаниям автоматизировать
                  рутинные задачи и улучшать коммуникацию с клиентами.
                </p>
                <p className="text-gray-600">
                  Мы стремимся создать мир, где современные технологии помогают
                  людям сосредоточиться на творческих и сложных задачах, доверив
                  рутину искусственному интеллекту.
                </p>
              </div>

              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm hover:shadow-md transition">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Award className="mr-3 text-primary h-7 w-7" />
                  Наши ценности
                </h3>
                <ul className="space-y-4 text-gray-600">
                  <li className="grid grid-cols-3 gap-2">
                    <span className="font-semibold break-all">Инновации:</span>
                    <span className="col-span-2">
                      Постоянное совершенствование технологий и поиск новых
                      решений.
                    </span>
                  </li>
                  <li className="grid grid-cols-3 gap-1">
                    <span className="font-semibold break-all">
                      Доступность:
                    </span>
                    <span className="col-span-2">
                      Создание продуктов, понятных и доступных для любого
                      бизнеса.
                    </span>
                  </li>
                  <li className="grid grid-cols-3 gap-2">
                    <span className="font-semibold break-all">Качество:</span>
                    <span className="col-span-2">
                      Высокие стандарты разработки и поддержки наших решений.
                    </span>
                  </li>
                  <li className="grid grid-cols-3 gap-2">
                    <span className="font-semibold break-all">
                      Клиентоориентированность:
                    </span>
                    <span className="col-span-2">
                      Внимательное отношение к потребностям каждого клиента.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Команда */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-12 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Наша команда
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Профессионалы, которые создают и развивают Асиссто
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
                  alt="Алексей Иванов"
                  className="w-full h-64 object-cover"
                />
                <div className="p-4 sm:p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    Алексей Иванов
                  </h3>
                  <p className="text-primary font-medium mb-4">
                    Генеральный директор
                  </p>
                  <p className="text-gray-600">
                    Более 15 лет опыта в разработке IT-решений и управлении
                    технологическими компаниями.
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
                  alt="Елена Смирнова"
                  className="w-full h-64 object-cover"
                />
                <div className="p-4 sm:p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    Елена Смирнова
                  </h3>
                  <p className="text-primary font-medium mb-4">
                    Технический директор
                  </p>
                  <p className="text-gray-600">
                    Специалист по машинному обучению и нейронным сетям с опытом
                    работы в ведущих IT-компаниях.
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition">
                <img
                  src="https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
                  alt="Дмитрий Петров"
                  className="w-full h-64 object-cover"
                />
                <div className="p-4 sm:p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    Дмитрий Петров
                  </h3>
                  <p className="text-primary font-medium mb-4">
                    Руководитель разработки
                  </p>
                  <p className="text-gray-600">
                    Эксперт в области создания масштабируемых облачных решений и
                    распределенных систем.
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition">
                <img
                  src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
                  alt="Мария Козлова"
                  className="w-full h-64 object-cover"
                />
                <div className="p-4 sm:p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    Мария Козлова
                  </h3>
                  <p className="text-primary font-medium mb-4">
                    Директор по маркетингу
                  </p>
                  <p className="text-gray-600">
                    Профессионал с более чем 10-летним опытом в
                    digital-маркетинге и продвижении IT-продуктов.
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition">
                <img
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
                  alt="Андрей Соколов"
                  className="w-full h-64 object-cover"
                />
                <div className="p-4 sm:p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    Андрей Соколов
                  </h3>
                  <p className="text-primary font-medium mb-4">
                    Директор по продажам
                  </p>
                  <p className="text-gray-600">
                    Эксперт в области B2B-продаж с опытом работы на руководящих
                    позициях в крупных IT-компаниях.
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition">
                <img
                  src="https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
                  alt="Ольга Белова"
                  className="w-full h-64 object-cover"
                />
                <div className="p-4 sm:p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    Ольга Белова
                  </h3>
                  <p className="text-primary font-medium mb-4">
                    Руководитель клиентской поддержки
                  </p>
                  <p className="text-gray-600">
                    Специалист по сервисному обслуживанию, отвечающий за
                    качество клиентского сервиса.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link href="/careers">
                <div className="inline-flex items-center text-primary font-medium hover:underline cursor-pointer">
                  Присоединиться к команде{" "}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Достижения */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-12 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Наши достижения
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Ключевые показатели роста и развития компании Асиссто
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white p-4 sm:p-8 rounded-xl shadow-sm text-center hover:shadow-md transition">
                <div className="text-4xl font-bold text-primary mb-2">
                  2000+
                </div>
                <div className="text-gray-600">Клиентов</div>
              </div>

              <div className="bg-white p-4 sm:p-8 rounded-xl shadow-sm text-center hover:shadow-md transition">
                <div className="text-4xl font-bold text-primary mb-2">100+</div>
                <div className="text-gray-600">Сотрудников</div>
              </div>

              <div className="bg-white p-4 sm:p-8 rounded-xl shadow-sm text-center hover:shadow-md transition">
                <div className="text-4xl font-bold text-primary mb-2">5</div>
                <div className="text-gray-600">Офисов</div>
              </div>

              <div className="bg-white p-4 sm:p-8 rounded-xl shadow-sm text-center hover:shadow-md transition">
                <div className="text-4xl font-bold text-primary mb-2">10M+</div>
                <div className="text-gray-600">
                  Автоматизированных сообщений в месяц
                </div>
              </div>
            </div>

            <div className="mt-12 pt-12 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition">
                  <Award className="text-primary h-8 w-8 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    AI Innovation Award 2023
                  </h3>
                  <p className="text-gray-600">
                    За инновационное применение технологий ИИ в бизнес-процессах
                  </p>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition">
                  <Award className="text-primary h-8 w-8 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Лучший стартап 2022
                  </h3>
                  <p className="text-gray-600">
                    По версии престижной национальной премии в области
                    IT-технологий
                  </p>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition">
                  <Award className="text-primary h-8 w-8 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Top AI Solution 2024
                  </h3>
                  <p className="text-gray-600">
                    Рейтинг лучших AI-решений для бизнеса по версии
                    международного издания
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-16 bg-primary text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Стать частью истории Асиссто
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-3xl mx-auto">
            Присоединяйтесь к сотням компаний, которые уже используют нашу
            платформу для оптимизации бизнес-процессов
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth">
              <div className="bg-white text-primary px-6 py-3 rounded-lg font-medium text-lg hover:bg-gray-100 transition cursor-pointer inline-block">
                Начать бесплатно
              </div>
            </Link>
            <Link href="/contact">
              <div className="bg-primary text-white px-6 py-3 rounded-lg font-medium text-lg border border-white hover:bg-primary/90 transition cursor-pointer inline-block">
                Связаться с нами
              </div>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
