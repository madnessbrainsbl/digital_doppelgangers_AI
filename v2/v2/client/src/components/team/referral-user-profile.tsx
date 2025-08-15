import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  registeredAt: string;
  plan: string | null;
  referrerId: number | null;
  managerId: number | null;
  totalSpent: number | null;
}

interface ReferralTransaction {
  id: number;
  userId: number;
  amount: number;
  referrerId: number | null;
  managerId: number | null;
  referralCommission: number | null;
  managerCommission: number | null;
  status: string;
  description: string | null;
  createdAt: string;
}

interface ReferralUserProfileProps {
  userId: number;
}

export default function ReferralUserProfile({ userId }: ReferralUserProfileProps) {
  // Fetch user details
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: [`/api/users/${userId}`],
  });

  // Fetch user's referred users
  const { data: referredUsers, isLoading: isLoadingReferredUsers } = useQuery({
    queryKey: [`/api/users/referrer/${userId}`],
    enabled: user?.role === 'referral',
  });

  // Fetch user's managed users
  const { data: managedUsers, isLoading: isLoadingManagedUsers } = useQuery({
    queryKey: [`/api/users/manager/${userId}`],
    enabled: user?.role === 'manager' || user?.role === 'referral',
  });

  // Fetch referral transactions where this user is the referrer
  const { data: referralTransactions, isLoading: isLoadingReferralTransactions } = useQuery({
    queryKey: [`/api/transactions/referrer/${userId}`],
    enabled: user?.role === 'referral',
  });

  // Fetch referral transactions where this user is the manager
  const { data: managerTransactions, isLoading: isLoadingManagerTransactions } = useQuery({
    queryKey: [`/api/transactions/manager/${userId}`],
    enabled: user?.role === 'manager' || user?.role === 'referral',
  });

  // Fetch total commission as referrer
  const { data: referralCommission } = useQuery({
    queryKey: [`/api/commission/${userId}/referrer`],
    enabled: user?.role === 'referral',
  });

  // Fetch total commission as manager
  const { data: managerCommission } = useQuery({
    queryKey: [`/api/commission/${userId}/manager`],
    enabled: user?.role === 'manager' || user?.role === 'referral',
  });

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd.MM.yyyy");
    } catch (e) {
      return dateString;
    }
  };

  if (isLoadingUser) {
    return (
      <div className="text-center py-8">
        <p>Загрузка данных пользователя...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p>Пользователь не найден</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Info Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-between items-center">
            <span>Профиль пользователя</span>
            <Badge className={user.isActive ? "bg-green-500" : "bg-red-500"}>
              {user.isActive ? "Активен" : "Неактивен"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300 flex items-center justify-center text-3xl font-semibold">
                {user.fullName.split(' ').map(part => part.charAt(0).toUpperCase()).slice(0, 2).join('')}
              </div>
            </div>
            
            <div className="space-y-3 flex-grow">
              <h3 className="text-xl font-semibold">{user.fullName}</h3>
              
              <div className="space-y-1">
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  <span className="font-medium">Имя пользователя:</span> {user.username}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  <span className="font-medium">Email:</span> {user.email}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  <span className="font-medium">Роль:</span> {user.role}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  <span className="font-medium">Дата регистрации:</span> {formatDate(user.registeredAt)}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  <span className="font-medium">План:</span> {user.plan || "Бесплатный"}
                </div>
                {user.totalSpent !== null && (
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">
                    <span className="font-medium">Сумма покупок:</span> {user.totalSpent.toLocaleString()} ₽
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4">
                <Button variant="outline" size="sm">
                  <span className="material-icons text-[18px] mr-1">edit</span>
                  Редактировать
                </Button>
                {user.role === 'referral' && (
                  <Button variant="outline" size="sm">
                    <span className="material-icons text-[18px] mr-1">content_copy</span>
                    Реферальная ссылка
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commission Summary */}
      {(user.role === 'referral' || user.role === 'manager') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {user.role === 'referral' && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Комиссия с рефералов</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {referralCommission ? referralCommission.totalCommission.toLocaleString() : "0"} ₽
                </div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Всего пользователей: {isLoadingReferredUsers ? "..." : referredUsers?.length || 0}
                </p>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="link" className="px-0">
                      Посмотреть транзакции
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Реферальные транзакции</DialogTitle>
                      <DialogDescription>
                        Список всех транзакций, где {user.fullName} выступает в качестве реферала
                      </DialogDescription>
                    </DialogHeader>
                    
                    {isLoadingReferralTransactions ? (
                      <div className="py-4 text-center">Загрузка транзакций...</div>
                    ) : referralTransactions?.length === 0 ? (
                      <div className="py-4 text-center">Нет реферальных транзакций</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Дата</TableHead>
                              <TableHead>Сумма</TableHead>
                              <TableHead>Комиссия</TableHead>
                              <TableHead>Статус</TableHead>
                              <TableHead>Описание</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {referralTransactions?.map((tx: ReferralTransaction) => (
                              <TableRow key={tx.id}>
                                <TableCell>{tx.id}</TableCell>
                                <TableCell>{formatDate(tx.createdAt)}</TableCell>
                                <TableCell>{tx.amount.toLocaleString()} ₽</TableCell>
                                <TableCell className="text-green-600 dark:text-green-400">
                                  {tx.referralCommission?.toLocaleString()} ₽
                                </TableCell>
                                <TableCell>
                                  <Badge className={
                                    tx.status === 'processed' ? 'bg-green-500' : 
                                    tx.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                                  }>
                                    {tx.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>{tx.description || "—"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}
          
          {(user.role === 'manager' || user.role === 'referral') && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Комиссия менеджера</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {managerCommission ? managerCommission.totalCommission.toLocaleString() : "0"} ₽
                </div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Ведёт пользователей: {isLoadingManagedUsers ? "..." : managedUsers?.length || 0}
                </p>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="link" className="px-0">
                      Посмотреть транзакции
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Транзакции менеджера</DialogTitle>
                      <DialogDescription>
                        Список всех транзакций, где {user.fullName} выступает в качестве менеджера
                      </DialogDescription>
                    </DialogHeader>
                    
                    {isLoadingManagerTransactions ? (
                      <div className="py-4 text-center">Загрузка транзакций...</div>
                    ) : managerTransactions?.length === 0 ? (
                      <div className="py-4 text-center">Нет транзакций менеджера</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Дата</TableHead>
                              <TableHead>Сумма</TableHead>
                              <TableHead>Комиссия</TableHead>
                              <TableHead>Статус</TableHead>
                              <TableHead>Описание</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {managerTransactions?.map((tx: ReferralTransaction) => (
                              <TableRow key={tx.id}>
                                <TableCell>{tx.id}</TableCell>
                                <TableCell>{formatDate(tx.createdAt)}</TableCell>
                                <TableCell>{tx.amount.toLocaleString()} ₽</TableCell>
                                <TableCell className="text-blue-600 dark:text-blue-400">
                                  {tx.managerCommission?.toLocaleString()} ₽
                                </TableCell>
                                <TableCell>
                                  <Badge className={
                                    tx.status === 'processed' ? 'bg-green-500' : 
                                    tx.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                                  }>
                                    {tx.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>{tx.description || "—"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Users sections */}
      {user.role === 'referral' && (
        <>
          <Separator />
          <h2 className="text-xl font-semibold">Приглашённые пользователи</h2>
          
          {isLoadingReferredUsers ? (
            <div className="text-center py-4">
              <p>Загрузка пользователей...</p>
            </div>
          ) : referredUsers?.length === 0 ? (
            <div className="text-center py-4">
              <p>Нет приглашённых пользователей</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Имя</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Дата регистрации</TableHead>
                    <TableHead>План</TableHead>
                    <TableHead>Сумма покупок</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referredUsers?.map((refUser: User) => (
                    <TableRow key={refUser.id}>
                      <TableCell>{refUser.id}</TableCell>
                      <TableCell>{refUser.fullName}</TableCell>
                      <TableCell>{refUser.email}</TableCell>
                      <TableCell>{formatDate(refUser.registeredAt)}</TableCell>
                      <TableCell>{refUser.plan || "Бесплатный"}</TableCell>
                      <TableCell>{refUser.totalSpent?.toLocaleString() || 0} ₽</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
      
      {(user.role === 'manager' || user.role === 'referral') && (
        <>
          <Separator />
          <h2 className="text-xl font-semibold">Управляемые пользователи</h2>
          
          {isLoadingManagedUsers ? (
            <div className="text-center py-4">
              <p>Загрузка пользователей...</p>
            </div>
          ) : managedUsers?.length === 0 ? (
            <div className="text-center py-4">
              <p>Нет управляемых пользователей</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Имя</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Дата регистрации</TableHead>
                    <TableHead>План</TableHead>
                    <TableHead>Сумма покупок</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {managedUsers?.map((mUser: User) => (
                    <TableRow key={mUser.id}>
                      <TableCell>{mUser.id}</TableCell>
                      <TableCell>{mUser.fullName}</TableCell>
                      <TableCell>{mUser.email}</TableCell>
                      <TableCell>{formatDate(mUser.registeredAt)}</TableCell>
                      <TableCell>{mUser.plan || "Бесплатный"}</TableCell>
                      <TableCell>{mUser.totalSpent?.toLocaleString() || 0} ₽</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </div>
  );
}