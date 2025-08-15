import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  Bot,
  MessageSquare,
  BookOpen,
  Link as LinkIcon,
  Mail,
  Phone,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AuthPage() {
  const {
    user,
    isLoading,
    sendVerificationCode,
    sendSmsVerificationCode,
    verifyCode,
  } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const searchParams = useSearch(); // Получаем параметры из URL
  const query = new URLSearchParams(searchParams);
  const refCode = query.get("ref"); // Получаем реферальный код из URL, если он есть

  const [step, setStep] = useState<"request" | "verify">("request");
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email"); // Выбранный метод аутентификации
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [referralCode, setReferralCode] = useState(refCode || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referralInfo, setReferralInfo] = useState<{
    valid: boolean;
    referrer?: { id: number; name: string };
  } | null>(null);

  // Если пользователь успешно авторизовался, перенаправляем его на дашборд
  useEffect(() => {
    if (user && step === "verify") {
      navigate("/dashboard");
    }
  }, [user, navigate, step]);

  // Проверяем реферальный код, если он есть
  useEffect(() => {
    const checkReferralCode = async () => {
      if (!referralCode) {
        setReferralInfo(null);
        return;
      }

      try {
        const result = await apiRequest({
          url: `/api/referral-code/${referralCode}`,
          method: "GET",
        });
        setReferralInfo(result);
      } catch (error) {
        console.error("Error checking referral code:", error);
        setReferralInfo({ valid: false });
      }
    };

    if (referralCode) {
      checkReferralCode();
    }
  }, [referralCode]);

  // Отправка кода для получения доступа
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (authMethod === "email") {
      if (!email) {
        toast({
          title: "Ошибка",
          description: "Email не может быть пустым",
          variant: "destructive",
        });
        return;
      }

      try {
        setIsSubmitting(true);
        await sendVerificationCode(email);
        setStep("verify");
      } catch (error) {
        console.error("Error sending code:", error);
        toast({
          title: "Ошибка отправки кода",
          description:
            error instanceof Error
              ? error.message
              : "Не удалось отправить код подтверждения",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    } else if (authMethod === "phone") {
      if (!phone) {
        toast({
          title: "Ошибка",
          description: "Номер телефона не может быть пустым",
          variant: "destructive",
        });
        return;
      }

      // Базовая валидация российского номера телефона (+7XXXXXXXXXX)
      if (!/^\+7\d{10}$/.test(phone)) {
        toast({
          title: "Ошибка формата",
          description: "Укажите номер в формате +7XXXXXXXXXX",
          variant: "destructive",
        });
        return;
      }

      try {
        setIsSubmitting(true);
        await sendSmsVerificationCode(phone);
        setStep("verify");
      } catch (error) {
        console.error("Error sending SMS code:", error);
        toast({
          title: "Ошибка отправки SMS-кода",
          description:
            error instanceof Error
              ? error.message
              : "Не удалось отправить код подтверждения",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Отправка кода верификации
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      toast({
        title: "Ошибка",
        description: "Код не может быть пустым",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      // Передаем реферальный код только если он валидный
      const validReferralCode = referralInfo?.valid ? referralCode : undefined;
      const identifier = authMethod === "email" ? email : phone;
      const isPhone = authMethod === "phone";

      await verifyCode(identifier, code, validReferralCode, isPhone);

      // После успешной верификации useEffect перенаправит на /dashboard
    } catch (error) {
      console.error("Error verifying code:", error);
      toast({
        title: "Ошибка верификации кода",
        description:
          error instanceof Error ? error.message : "Неверный код подтверждения",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Если загрузка данных пользователя, показываем индикатор
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Левая колонка с формой */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Asisto</h1>
            <p className="text-neutral-500 dark:text-neutral-400">
              AI-платформа для коммуникаций и управления знаниями
            </p>
          </div>

          {step === "request" ? (
            <Card>
              <CardHeader>
                <CardTitle>Вход в систему</CardTitle>
                <CardDescription>
                  Выберите способ входа и получите код доступа
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs
                  defaultValue="email"
                  value={authMethod}
                  onValueChange={(value) =>
                    setAuthMethod(value as "email" | "phone")
                  }
                  className="mb-4"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger
                      value="email"
                      className="flex items-center justify-center"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </TabsTrigger>
                    <TabsTrigger
                      value="phone"
                      className="flex items-center justify-center"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Телефон
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="email" className="space-y-4 mt-4">
                    <form onSubmit={handleRequestSubmit} className="space-y-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="font-medium">Email</div>
                          <Input
                            type="email"
                            placeholder="email@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>

                        {referralCode && referralInfo?.valid && (
                          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                            <div className="flex items-center text-sm text-green-700 dark:text-green-400">
                              <LinkIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span>
                                Вы регистрируетесь по приглашению от{" "}
                                <strong>
                                  {referralInfo.referrer?.name || "партнера"}
                                </strong>
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Отправка...
                          </>
                        ) : (
                          "Получить код на email"
                        )}
                      </Button>
                      <div className="flex justify-center">
                        <Button variant="link" onClick={() => navigate("/")}>
                          На главную
                        </Button>
                      </div>
                    </form>
                  </TabsContent>

                  <TabsContent value="phone" className="space-y-4 mt-4">
                    <form onSubmit={handleRequestSubmit} className="space-y-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="font-medium">Номер телефона</div>
                          <Input
                            type="tel"
                            placeholder="+7XXXXXXXXXX"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                          />
                          <p className="text-sm text-neutral-500">
                            Введите номер в формате +7XXXXXXXXXX
                          </p>
                        </div>

                        {referralCode && referralInfo?.valid && (
                          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                            <div className="flex items-center text-sm text-green-700 dark:text-green-400">
                              <LinkIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span>
                                Вы регистрируетесь по приглашению от{" "}
                                <strong>
                                  {referralInfo.referrer?.name || "партнера"}
                                </strong>
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Отправка...
                          </>
                        ) : (
                          "Получить код на телефон"
                        )}
                      </Button>
                      <div className="flex justify-center">
                        <Button variant="link" onClick={() => navigate("/")}>
                          На главную
                        </Button>
                      </div>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Подтверждение</CardTitle>
                <CardDescription>
                  {authMethod === "email" ? (
                    <>
                      Введите код, отправленный на <strong>{email}</strong>.
                    </>
                  ) : (
                    <>
                      Введите код, отправленный на <strong>{phone}</strong>.
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVerifySubmit} className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="font-medium">Код подтверждения</div>
                      <Input
                        type="text"
                        placeholder="123456"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                      />
                    </div>

                    {/* Поле для реферального кода */}
                    <div className="space-y-2">
                      <div className="font-medium">
                        Реферальный код (необязательно)
                      </div>
                      <div className="flex space-x-2">
                        <Input
                          type="text"
                          placeholder="Введите реферальный код"
                          value={referralCode}
                          onChange={(e) => setReferralCode(e.target.value)}
                        />
                      </div>
                      {referralCode && (
                        <div
                          className={`text-sm mt-1 ${
                            referralInfo?.valid
                              ? "text-green-600 dark:text-green-400"
                              : referralInfo === null
                              ? "text-gray-500"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {referralInfo?.valid
                            ? `Код действителен: приглашение от ${
                                referralInfo.referrer?.name || "партнера"
                              }`
                            : referralInfo === null
                            ? "Проверка кода..."
                            : "Недействительный реферальный код"}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Проверка...
                      </>
                    ) : (
                      "Подтвердить"
                    )}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex flex-col gap-2 justify-center">
                <Button
                  variant="link"
                  onClick={() => {
                    setStep("request");
                  }}
                >
                  {authMethod === "email"
                    ? "Вернуться к вводу email"
                    : "Вернуться к вводу телефона"}
                </Button>
                <div className="flex justify-center">
                  <Button variant="link" onClick={() => navigate("/")}>
                    На главную
                  </Button>
                </div>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>

      {/* Правая колонка с описанием */}
      <div className="flex-1 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/40 p-10 hidden md:flex flex-col justify-center">
        <div className="max-w-xl mx-auto space-y-8">
          <div>
            <h2 className="text-3xl font-bold mb-4">
              Добро пожаловать в Asisto
            </h2>
            <p className="text-lg text-neutral-700 dark:text-neutral-300 mb-6">
              Платформа искусственного интеллекта для управления коммуникациями
              и знаниями
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white/80 dark:bg-neutral-800/80 p-4 rounded-lg flex">
              <div className="mr-4 text-primary">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">AI ассистенты</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Создавайте интеллектуальных помощников для различных задач
                </p>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-neutral-800/80 p-4 rounded-lg flex">
              <div className="mr-4 text-primary">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">
                  Мультиканальные коммуникации
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Поддержка различных каналов связи: веб-чат, телефония, email и
                  многое другое
                </p>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-neutral-800/80 p-4 rounded-lg flex">
              <div className="mr-4 text-primary">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">База знаний</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Управляйте информацией и обучайте AI на собственных данных
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
