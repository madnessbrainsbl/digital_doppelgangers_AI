import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, Phone, PhoneCall } from "lucide-react";

export default function Voice() {
  const [activeTab, setActiveTab] = useState("callcenter");
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isCallInProgress, setIsCallInProgress] = useState(false);
  const [callProgress, setCallProgress] = useState(0);

  const handleStartCalling = () => {
    setIsConfirmDialogOpen(true);
  };

  const confirmStartCalling = () => {
    setIsConfirmDialogOpen(false);
    setIsCallInProgress(true);

    // Simulate call progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setCallProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        setIsCallInProgress(false);
        setCallProgress(0);
      }
    }, 500);
  };

  return (
    <div>
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Голосовой модуль
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
          Управление голосовыми звонками и обзвонами
        </p>
      </div>

      {/* Voice Module Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full max-w-md mx-auto grid grid-cols-2">
          <TabsTrigger value="callcenter">
            <PhoneCall className="w-4 h-4 mr-2" />
            Холодные обзвоны
          </TabsTrigger>
          <TabsTrigger value="inbound">
            <Phone className="w-4 h-4 mr-2" />
            Входящие звонки
          </TabsTrigger>
        </TabsList>

        {/* Cold Calling Content */}
        <TabsContent value="callcenter" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Настройка обзвона</CardTitle>
                  <CardDescription>
                    Настройте параметры для автоматического обзвона
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="campaign-name">Название кампании</Label>
                    <Input
                      id="campaign-name"
                      placeholder="Введите название кампании"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="assistant">Ассистент</Label>
                      <Select defaultValue="1">
                        <SelectTrigger id="assistant">
                          <SelectValue placeholder="Выберите ассистента" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Менеджер продаж</SelectItem>
                          <SelectItem value="2">
                            Консультант по продуктам
                          </SelectItem>
                          <SelectItem value="3">
                            Техническая поддержка
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="caller-id">Номер для исходящих</Label>
                      <Input id="caller-id" placeholder="+7XXXXXXXXXX" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Загрузить номера</Label>
                    <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-6 text-center cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                      <Upload className="w-10 h-10 text-neutral-400 dark:text-neutral-500 mx-auto mb-2" />
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                        Перетащите CSV файл с номерами или нажмите для выбора
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-500">
                        Поддерживаемый формат: CSV с колонкой "phone"
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="script">Скрипт разговора</Label>
                    <Textarea
                      id="script"
                      placeholder="Введите скрипт разговора для ассистента"
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="record-calls" />
                    <Label htmlFor="record-calls">Записывать звонки</Label>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  <Button variant="outline">Сохранить черновик</Button>
                  <Button
                    onClick={handleStartCalling}
                    disabled={isCallInProgress}
                  >
                    {isCallInProgress
                      ? "Обзвон в процессе..."
                      : "Начать обзвон"}
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Информация</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">
                      Преимущества холодных обзвонов:
                    </h3>
                    <ul className="list-disc list-inside text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
                      <li>Автоматизация рутинных звонков</li>
                      <li>Увеличение конверсии продаж</li>
                      <li>Экономия времени операторов</li>
                      <li>Детальная статистика и аналитика</li>
                      <li>Интеграция с CRM-системами</li>
                    </ul>
                  </div>

                  <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800 p-3 text-sm">
                    <p className="font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                      Совет:
                    </p>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      Для лучших результатов загружайте не более 1000 номеров за
                      один раз и указывайте четкий скрипт разговора для
                      ассистента.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {isCallInProgress && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Прогресс обзвона</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Обработано: {Math.round(callProgress)}%</span>
                    <span>
                      Осталось: {Math.floor((100 - callProgress) / 5)} мин
                    </span>
                  </div>
                  <Progress value={callProgress} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-neutral-100 dark:bg-neutral-800 p-3 rounded-lg">
                    <p className="text-2xl font-semibold">157</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Всего номеров
                    </p>
                  </div>
                  <div className="bg-neutral-100 dark:bg-neutral-800 p-3 rounded-lg">
                    <p className="text-2xl font-semibold">
                      {Math.round((157 * callProgress) / 100)}
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Обработано
                    </p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                    <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                      {Math.round(((157 * callProgress) / 100) * 0.42)}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Успешно
                    </p>
                  </div>
                  <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
                    <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
                      {Math.round(((157 * callProgress) / 100) * 0.27)}
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Недоступно
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Остановить обзвон
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>

        {/* Inbound Calls Content */}
        <TabsContent value="inbound" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Настройка приема звонков</CardTitle>
                  <CardDescription>
                    Настройте параметры для автоматического приема входящих
                    звонков
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone-number">Номер телефона</Label>
                      <Input id="phone-number" placeholder="+7XXXXXXXXXX" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="inbound-assistant">Ассистент</Label>
                      <Select defaultValue="1">
                        <SelectTrigger id="inbound-assistant">
                          <SelectValue placeholder="Выберите ассистента" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Менеджер продаж</SelectItem>
                          <SelectItem value="2">
                            Консультант по продуктам
                          </SelectItem>
                          <SelectItem value="3">
                            Техническая поддержка
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="greeting">Приветствие</Label>
                    <Textarea
                      id="greeting"
                      placeholder="Введите текст приветствия для входящих звонков"
                      defaultValue="Здравствуйте! Вас приветствует виртуальный ассистент компании. Чем я могу помочь?"
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="working-hours">Рабочие часы</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input id="working-hours-from" placeholder="09:00" />
                      <Input id="working-hours-to" placeholder="18:00" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch id="record-inbound" defaultChecked />
                      <Label htmlFor="record-inbound">Записывать звонки</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch id="transcribe-calls" />
                      <Label htmlFor="transcribe-calls">
                        Транскрибировать звонки
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Перенаправление на оператора</Label>
                    <div className="flex items-center">
                      <div className="flex items-center space-x-2 mr-4">
                        <Switch id="enable-redirect" />
                        <Label htmlFor="enable-redirect">Включить</Label>
                      </div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Если ассистент не может ответить
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  <Button variant="outline">Отмена</Button>
                  <Button>Сохранить настройки</Button>
                </CardFooter>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Статистика звонков</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-neutral-100 dark:bg-neutral-800 p-3 rounded-lg">
                      <p className="text-2xl font-semibold">128</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Всего сегодня
                      </p>
                    </div>
                    <div className="bg-neutral-100 dark:bg-neutral-800 p-3 rounded-lg">
                      <p className="text-2xl font-semibold">92%</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Успешность
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 text-sm border border-blue-100 dark:border-blue-800">
                    <p className="font-medium text-blue-800 dark:text-blue-300 mb-1">
                      Активный статус:
                    </p>
                    <p className="text-blue-700 dark:text-blue-400 flex items-center">
                      <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                      Автоответчик принимает звонки
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm font-medium">Последние звонки:</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between">
                        <span>+7 (955) 123-45-67</span>
                        <span className="text-neutral-500 dark:text-neutral-400">
                          12:42
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span>+7 (912) 987-65-43</span>
                        <span className="text-neutral-500 dark:text-neutral-400">
                          11:15
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span>+7 (903) 555-77-33</span>
                        <span className="text-neutral-500 dark:text-neutral-400">
                          10:28
                        </span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    Просмотреть журнал звонков
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Confirm Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Подтверждение обзвона</DialogTitle>
            <DialogDescription>
              Вы собираетесь начать автоматический обзвон. Система будет
              использовать ИИ-ассистента для разговора с клиентами. Продолжить?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsConfirmDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button onClick={confirmStartCalling}>Начать обзвон</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
