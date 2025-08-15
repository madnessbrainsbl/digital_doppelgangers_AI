import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { User, ReferralTransaction } from "@shared/schema";
import {
  Loader2,
  Copy,
  Users,
  ArrowRight,
  CreditCard,
  Info,
  Check,
  Book,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ReferralsInstructionsDialog from "@/components/referrals/referrals-instructions-dialog";

export default function ReferralsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCopied, setShowCopied] = useState(false);
  const [instructionsDialogOpen, setInstructionsDialogOpen] = useState(false);

  // Запрос данных пользователя для получения актуальной информации о реферальном коде
  const { data: currentUser, isLoading: isUserLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    enabled: !!user,
  });

  // Проверяем наличие реферального кода
  const hasReferralCode = !!currentUser?.referralCode;

  // Запрос на список рефералов текущего пользователя
  const { data: referrals, isLoading: isReferralsLoading } = useQuery<User[]>({
    queryKey: ["/api/users/referrer", user?.id],
    queryFn: () =>
      apiRequest({
        url: `/api/users/referrer/${user?.id}`,
        method: "GET",
      }),
    enabled: !!user?.id,
  });

  // Запрос на получение вознаграждения
  const { data: commission, isLoading: isCommissionLoading } = useQuery<{
    totalCommission: number;
  }>({
    queryKey: ["/api/commission", user?.id, "referrer"],
    queryFn: () =>
      apiRequest({
        url: `/api/commission/${user?.id}/referrer`,
        method: "GET",
      }),
    enabled: !!user?.id && user?.role === "referral",
  });

  // Запрос на получение транзакций для реферала
  const { data: referralTransactions, isLoading: isTransactionsLoading } =
    useQuery<ReferralTransaction[]>({
      queryKey: ["/api/transactions/referrer", user?.id],
      queryFn: () =>
        apiRequest({
          url: `/api/transactions/referrer/${user?.id}`,
          method: "GET",
        }),
      enabled: !!user?.id && hasReferralCode,
    });

  // Мутация для генерации реферального кода
  const generateReferralCodeMutation = useMutation({
    mutationFn: () => {
      return apiRequest({
        url: `/api/users/${user?.id}/referral-code`,
        method: "POST",
      });
    },
    onSuccess: (data) => {
      // Инвалидируем кеш, чтобы получить обновленные данные пользователя
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Реферальный код создан",
        description: "Вы успешно стали партнером программы!",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось создать реферальный код",
        variant: "destructive",
      });
    },
  });

  // Функция для копирования реферальной ссылки в буфер обмена
  const copyReferralLink = () => {
    if (!currentUser?.referralCode) return;

    const referralLink = `${window.location.origin}/auth?ref=${currentUser.referralCode}`;
    navigator.clipboard.writeText(referralLink);

    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);

    toast({
      title: "Скопировано",
      description: "Реферальная ссылка скопирована в буфер обмена",
    });
  };

  const handleBecomePartner = () => {
    generateReferralCodeMutation.mutate();
  };

  const isLoading = isUserLoading || generateReferralCodeMutation.isPending;
  const isReferralPartner =
    currentUser?.role === "referral" || currentUser?.role === "admin";

  // Сгруппируем транзакции по пользователям (рефералам)
  const referralPaymentData = useMemo(() => {
    if (!referralTransactions || !referrals) return {};

    const data: Record<
      number,
      {
        totalPayments: number;
        paymentCount: number;
        transactions: ReferralTransaction[];
      }
    > = {};

    referralTransactions.forEach((transaction) => {
      if (!data[transaction.userId]) {
        data[transaction.userId] = {
          totalPayments: 0,
          paymentCount: 0,
          transactions: [],
        };
      }

      // Учитываем только платежи, не учитываем регистрации
      if (
        transaction.description &&
        transaction.description.includes("пополнение баланса")
      ) {
        data[transaction.userId].totalPayments += transaction.amount;
        data[transaction.userId].paymentCount += 1;
      }

      data[transaction.userId].transactions.push(transaction);
    });

    return data;
  }, [referralTransactions, referrals]);

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <h1 className="text-3xl font-bold">Реферальная программа</h1>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setInstructionsDialogOpen(true)}
            title="Инструкция по реферальной программе"
            className="bg-purple-200 hover:bg-purple-300"
          >
            <Book className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <>
          {!hasReferralCode && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Станьте партнером</CardTitle>
                <CardDescription>
                  Приглашайте новых пользователей и получайте 20% вознаграждения
                  с их платежей
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Участвуя в партнерской программе, вы можете зарабатывать,
                  приглашая новых пользователей. Вы будете получать 20%
                  вознаграждения от суммы каждого платежа, сделанного вашими
                  рефералами.
                </p>
                <p className="mb-4">
                  После того, как вы станете партнером, вы получите уникальный
                  реферальный код и ссылку, которую можно использовать для
                  приглашения новых пользователей.
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleBecomePartner}
                  disabled={generateReferralCodeMutation.isPending}
                >
                  {generateReferralCodeMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Стать партнером
                </Button>
              </CardFooter>
            </Card>
          )}

          {hasReferralCode && (
            <>
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Ваш реферальный код</CardTitle>
                  <CardDescription>
                    Используйте этот код для приглашения новых пользователей
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 mb-4">
                    <Input
                      readOnly
                      value={`${window.location.origin}/auth?ref=${currentUser?.referralCode}`}
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyReferralLink}
                    >
                      {showCopied ? (
                        <span className="text-xs">
                          <Check className="h-4 w-4" />
                        </span>
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p>
                    Ваш код:{" "}
                    <span className="font-bold">
                      {currentUser?.referralCode}
                    </span>
                  </p>
                  {isReferralPartner && commission && (
                    <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-md">
                      <h3 className="font-semibold mb-2">
                        Ваше вознаграждение
                      </h3>
                      <p className="text-2xl font-bold">
                        {Math.floor(commission.totalCommission / 100)} ₽
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Это сумма всех вознаграждений, которые вы получили от
                        платежей ваших рефералов
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button asChild>
                    <Link href="/team" className="flex items-center">
                      <Users className="mr-2 h-4 w-4" />
                      Перейти к моей команде
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Мои рефералы</CardTitle>
                  <CardDescription>
                    {referrals && referrals.length > 0
                      ? `У вас ${referrals.length} ${
                          referrals.length === 1
                            ? "реферал"
                            : referrals.length >= 2 && referrals.length <= 4
                            ? "реферала"
                            : "рефералов"
                        }`
                      : "У вас пока нет рефералов"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isReferralsLoading ? (
                    <div className="flex justify-center items-center h-20">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {referrals && referrals.length > 0 ? (
                        referrals.map((referral) => {
                          const paymentData = referralPaymentData[referral.id];
                          return (
                            <div
                              key={referral.id}
                              className="p-4 border rounded-md"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <div>
                                  <p className="font-medium">
                                    {referral.name || referral.email}
                                  </p>
                                  <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Присоединился:{" "}
                                    {new Date(
                                      referral.createdAt
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium text-green-600 dark:text-green-400">
                                    {Math.floor(
                                      (paymentData?.transactions
                                        ?.filter((tx) =>
                                          tx.description?.includes(
                                            "Пополнение баланса"
                                          )
                                        )
                                        ?.reduce(
                                          (sum, tx) =>
                                            sum + (tx.referralCommission || 0),
                                          0
                                        ) || 0) / 100
                                    )}{" "}
                                    ₽
                                  </p>
                                  <p className="text-sm text-slate-500 dark:text-slate-400">
                                    вознаграждение
                                  </p>
                                </div>
                              </div>

                              {paymentData && paymentData.paymentCount > 0 && (
                                <div className="mt-2 pt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center">
                                      <CreditCard className="h-4 w-4 text-slate-400 mr-1" />
                                      <span className="text-sm text-slate-600 dark:text-slate-300">
                                        Пополнений баланса:{" "}
                                        {paymentData.paymentCount}
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="flex items-center cursor-help">
                                              <span className="text-sm font-medium mr-1">
                                                {Math.floor(
                                                  paymentData.totalPayments /
                                                    100
                                                )}{" "}
                                                ₽
                                              </span>
                                              <Info className="h-3.5 w-3.5 text-slate-500" />
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p className="text-xs">
                                              Сумма пополнений баланса
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-slate-500 dark:text-slate-400 mb-4">
                            У вас пока нет рефералов. Поделитесь своей
                            реферальной ссылкой, чтобы начать зарабатывать
                            вознаграждение.
                          </p>
                          <Button variant="outline" onClick={copyReferralLink}>
                            <Copy className="mr-2 h-4 w-4" />
                            Скопировать реферальную ссылку
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" asChild>
                    <Link href="/team">Просмотреть подробную статистику</Link>
                  </Button>
                </CardFooter>
              </Card>
            </>
          )}
        </>
      )}

      {/* Dialog for instructions */}
      <ReferralsInstructionsDialog
        open={instructionsDialogOpen}
        onOpenChange={setInstructionsDialogOpen}
      />
    </div>
  );
}
