import { PublicLayout } from "@/components/public/layout";
import { Link } from "wouter";
import {
  Gift,
  ChevronRight,
  DollarSign,
  Zap,
  Users,
  Check,
  HelpCircle,
  Mail,
  Copy,
  Share2,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function ReferralPage() {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Запрос данных пользователя для получения актуальной информации о реферальном коде
  const { data: currentUser, isLoading: isUserLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    enabled: !!user,
  });

  // Мутация для генерации реферального кода
  const generateReferralCodeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest<{ referralCode: string; role: string }>({
        url: `/api/users/${currentUser?.id}/referral-code`,
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Успешно",
        description:
          "Вы стали партнером! Теперь вы можете приглашать новых пользователей и получать вознаграждение.",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description:
          "Не удалось создать реферальный код. Пожалуйста, попробуйте позже.",
        variant: "destructive",
      });
      console.error("Error generating referral code:", error);
    },
  });

  // Обработчик кнопки "Стать партнером"
  const handleBecomePartner = () => {
    if (!currentUser) {
      toast({
        title: "Ошибка",
        description: "Необходимо войти в систему, чтобы стать партнером",
        variant: "destructive",
      });
      return;
    }

    generateReferralCodeMutation.mutate();
  };

  const referralLink = currentUser?.referralCode
    ? `${window.location.origin}/auth?ref=${currentUser.referralCode}`
    : "";

  const copyToClipboard = () => {
    if (!referralLink && !currentUser?.referralCode) {
      toast({
        title: "Реферальная ссылка недоступна",
        description:
          "Сначала нужно войти в систему и получить реферальный код в личном кабинете",
        variant: "destructive",
      });
      return;
    }

    navigator.clipboard.writeText(referralLink).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);

      toast({
        title: "Скопировано",
        description: "Реферальная ссылка скопирована в буфер обмена",
      });
    });
  };

  return (
    <PublicLayout>
      {/* Заголовок */}
      <section className="bg-gradient-to-b from-primary/5 to-white py-12 md:py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center bg-primary/10 px-3 py-1 rounded-full text-primary font-medium mb-6">
              <Gift className="h-4 w-4 mr-2" />
              <span>Реферальная программа</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Приглашайте друзей и зарабатывайте вместе с Асиссто
            </h1>
            <p className="text-xl text-gray-600">
              Получайте вознаграждение за каждого клиента, который начнет
              использовать нашу платформу по вашей рекомендации
            </p>
          </div>
        </div>
      </section>

      {/* Как это работает */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Как работает реферальная программа
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Всего три простых шага, чтобы начать зарабатывать с Асиссто
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold mb-6">
                  1
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Зарегистрируйтесь
                </h3>
                <p className="text-gray-600">
                  Создайте учетную запись в реферальной программе Асиссто и
                  получите свою уникальную реферальную ссылку.
                </p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold mb-6">
                  2
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Приглашайте клиентов
                </h3>
                <p className="text-gray-600">
                  Поделитесь своей реферальной ссылкой с потенциальными
                  клиентами через email, социальные сети или лично.
                </p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold mb-6">
                  3
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Получайте вознаграждение
                </h3>
                <p className="text-gray-600">
                  Когда приглашенный клиент оплачивает подписку на платформу, вы
                  получаете партнерское вознаграждение.
                </p>
              </div>
            </div>

            {/* Реферальная ссылка */}
            <div className="mt-16 bg-gray-50 p-8 rounded-xl border border-gray-200">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Ваша реферальная ссылка
                </h3>
                <p className="text-gray-600">
                  Скопируйте ссылку и поделитесь ей с потенциальными клиентами
                </p>
              </div>

              {isUserLoading || generateReferralCodeMutation.isPending ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !currentUser ? (
                // Случай 1: Пользователь не авторизован
                <div className="text-center py-4">
                  <p className="text-gray-600 mb-4">
                    Войдите в аккаунт и перейдите в раздел "Реферальная
                    программа", чтобы получить вашу уникальную ссылку
                  </p>
                  <Link href="/auth">
                    <div className="inline-flex items-center justify-center bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition cursor-pointer mx-auto">
                      Войти или зарегистрироваться
                    </div>
                  </Link>
                </div>
              ) : !currentUser.referralCode ? (
                // Случай 2: Пользователь авторизован, но не имеет реферального кода
                <div className="text-center py-4">
                  <p className="text-gray-600 mb-6">
                    Участвуя в партнерской программе, вы можете зарабатывать,
                    приглашая новых пользователей. Вы будете получать 10% от
                    суммы каждого платежа, сделанного вашими рефералами.
                  </p>
                  <button
                    onClick={handleBecomePartner}
                    disabled={generateReferralCodeMutation.isPending}
                    className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition mx-auto"
                  >
                    {generateReferralCodeMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Стать партнером
                  </button>
                </div>
              ) : (
                // Случай 3: Пользователь авторизован и имеет реферальный код
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-grow">
                      <input
                        type="text"
                        value={referralLink}
                        readOnly
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-primary focus:border-primary bg-white"
                      />
                    </div>
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-5 w-5" />
                          <span>Скопировано!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-5 w-5" />
                          <span>Копировать</span>
                        </>
                      )}
                    </button>
                    <button className="flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition">
                      <Share2 className="h-5 w-5" />
                      <span>Поделиться</span>
                    </button>
                  </div>

                  <div className="flex justify-end mt-4">
                    <Link href="/referrals">
                      <div className="inline-flex items-center gap-2 text-primary font-medium hover:text-primary/80 transition cursor-pointer">
                        В кабинет партнера
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Преимущества */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Преимущества реферальной программы
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Почему стоит стать нашим реферальным партнером
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition">
                <div className="flex items-center mb-6">
                  <div className="bg-primary/10 p-3 rounded-full mr-4">
                    <DollarSign className="text-primary h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Высокие вознаграждения
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Получайте до 30% от стоимости подписки каждого приведенного
                  клиента в течение первого года.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <Check className="text-primary h-5 w-5 flex-shrink-0" />
                    <span>20% от первой оплаты</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="text-primary h-5 w-5 flex-shrink-0" />
                    <span>10% от всех последующих платежей в течение года</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition">
                <div className="flex items-center mb-6">
                  <div className="bg-primary/10 p-3 rounded-full mr-4">
                    <Zap className="text-primary h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Быстрые выплаты
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Регулярные выплаты заработанных вознаграждений удобным для вас
                  способом.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <Check className="text-primary h-5 w-5 flex-shrink-0" />
                    <span>Ежемесячные выплаты</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="text-primary h-5 w-5 flex-shrink-0" />
                    <span>Различные способы вывода средств</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition">
                <div className="flex items-center mb-6">
                  <div className="bg-primary/10 p-3 rounded-full mr-4">
                    <Users className="text-primary h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Поддержка партнеров
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Мы предоставляем все необходимые материалы и поддержку для
                  успешных рекомендаций.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <Check className="text-primary h-5 w-5 flex-shrink-0" />
                    <span>Маркетинговые материалы</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="text-primary h-5 w-5 flex-shrink-0" />
                    <span>Персональный менеджер</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition">
                <div className="flex items-center mb-6">
                  <div className="bg-primary/10 p-3 rounded-full mr-4">
                    <Gift className="text-primary h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Бонусы и поощрения
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Дополнительные бонусы и вознаграждения для самых активных
                  партнеров.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <Check className="text-primary h-5 w-5 flex-shrink-0" />
                    <span>Прогрессивная шкала вознаграждений</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="text-primary h-5 w-5 flex-shrink-0" />
                    <span>Ежеквартальные призы для лучших партнеров</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Часто задаваемые вопросы */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Часто задаваемые вопросы
              </h2>
              <p className="text-xl text-gray-600">
                Ответы на популярные вопросы о реферальной программе
              </p>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <HelpCircle className="text-primary h-5 w-5 mr-2 flex-shrink-0" />
                  Кто может стать реферальным партнером?
                </h3>
                <p className="text-gray-600">
                  Партнером может стать любой зарегистрированный пользователь
                  нашей платформы. Особенно программа подходит для тренеров,
                  консультантов, маркетологов, владельцев бизнеса и всех, кто
                  работает с клиентами.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <HelpCircle className="text-primary h-5 w-5 mr-2 flex-shrink-0" />
                  Как начисляются вознаграждения?
                </h3>
                <p className="text-gray-600">
                  Вознаграждения начисляются автоматически после каждого
                  платежа, совершенного вашим рефералом. Вы получаете 20% от
                  первой оплаты и 10% от всех последующих платежей в течение
                  первого года.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <HelpCircle className="text-primary h-5 w-5 mr-2 flex-shrink-0" />
                  Когда и как я могу получить выплату?
                </h3>
                <p className="text-gray-600">
                  Выплаты производятся ежемесячно. Вы можете запросить вывод
                  средств на банковскую карту, электронный кошелек или другим
                  удобным для вас способом. Минимальная сумма для вывода — 1000
                  рублей.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <HelpCircle className="text-primary h-5 w-5 mr-2 flex-shrink-0" />
                  Есть ли лимит на количество приглашенных пользователей?
                </h3>
                <p className="text-gray-600">
                  Нет, вы можете приглашать неограниченное количество
                  пользователей и получать вознаграждения с каждого из них.
                </p>
              </div>
            </div>

            <div className="mt-12 text-center">
              <p className="text-gray-600 mb-4">
                Остались вопросы? Свяжитесь с нашей командой поддержки
              </p>
              <Link href="/contact">
                <div className="inline-flex items-center gap-2 bg-white text-primary border border-primary px-6 py-3 rounded-lg font-medium hover:bg-primary/5 transition cursor-pointer">
                  <Mail className="h-5 w-5" />
                  <span>Написать в поддержку</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 md:py-16 bg-primary">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Начните зарабатывать вместе с Асиссто уже сегодня
            </h2>
            <p className="text-xl text-white/80 mb-8">
              Присоединяйтесь к нашей реферальной программе и получайте
              вознаграждение за каждого приглашенного клиента
            </p>
            {currentUser ? (
              <Link href="/referrals">
                <div className="inline-flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-lg font-medium hover:bg-white/90 transition cursor-pointer">
                  <span>Перейти в кабинет партнера</span>
                  <ChevronRight className="h-5 w-5" />
                </div>
              </Link>
            ) : (
              <Link href="/auth?signup=true">
                <div className="inline-flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-lg font-medium hover:bg-white/90 transition cursor-pointer">
                  <span>Зарегистрироваться и стать партнером</span>
                  <ChevronRight className="h-5 w-5" />
                </div>
              </Link>
            )}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
