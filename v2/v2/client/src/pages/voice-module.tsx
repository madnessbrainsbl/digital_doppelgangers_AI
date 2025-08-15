import PageHeader from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Book } from "lucide-react";
import { useState } from "react";
import VoiceInstructionsDialog from "@/components/voice/voice-instructions-dialog";

export default function VoiceModule() {
  const { toast } = useToast();
  const [instructionsDialogOpen, setInstructionsDialogOpen] = useState(false);

  const handleConnect = () => {
    toast({
      title: "Подключение телефонии",
      description:
        "Функция подключения телефонии будет доступна в следующем обновлении",
    });
  };

  const handleUpload = () => {
    toast({
      title: "Загрузка номеров",
      description:
        "Функция загрузки номеров для обзвона будет доступна в следующем обновлении",
    });
  };

  const handleStartCalling = () => {
    toast({
      title: "Запуск обзвона",
      description:
        "Функция запуска холодного обзвона будет доступна в следующем обновлении",
    });
  };

  return (
    <div className="px-4 sm:px-6">
      <div className="flex items-center mb-6">
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold">Голосовой модуль</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Управление голосовыми звонками и телефонией
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setInstructionsDialogOpen(true)}
          title="Инструкция по работе с голосовым модулем"
          className="bg-purple-200 hover:bg-purple-300 ml-2"
        >
          <Book className="h-5 w-5" />
        </Button>
      </div>

      <Tabs defaultValue="calls">
        <TabsList className="mb-6 w-full overflow-x-auto">
          <TabsTrigger value="calls" className="flex-1">
            Входящие звонки
          </TabsTrigger>
          <TabsTrigger value="outgoing" className="flex-1">
            Исходящие звонки
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calls">
          <Card>
            <CardHeader>
              <CardTitle>Настройка телефонии</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Текущий статус
                  </h3>
                  <div className="flex items-center">
                    <span className="h-2.5 w-2.5 rounded-full bg-neutral-400 mr-2"></span>
                    <span className="text-neutral-600 dark:text-neutral-400">
                      Не подключено
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Действия
                  </h3>
                  <Button onClick={handleConnect} className="w-full sm:w-auto">
                    <span className="material-icons text-[18px] mr-1">
                      phone
                    </span>
                    <span>Подключить телефонию</span>
                  </Button>
                </div>

                <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg mt-4">
                  <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Примечание
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    После подключения телефонии вы сможете:
                  </p>
                  <ul className="list-disc list-inside text-sm text-neutral-600 dark:text-neutral-400 mt-2 space-y-1">
                    <li>
                      Принимать входящие звонки через виртуальных ассистентов
                    </li>
                    <li>
                      Настраивать голосовое меню и сценарии обработки звонков
                    </li>
                    <li>Получать транскрипцию и запись звонков</li>
                    <li>Анализировать эффективность обработки звонков</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outgoing">
          <Card>
            <CardHeader>
              <CardTitle>Холодный обзвон</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Номера для обзвона
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      variant="outline"
                      onClick={handleUpload}
                      className="w-full sm:w-auto"
                    >
                      <span className="material-icons text-[18px] mr-1">
                        upload_file
                      </span>
                      <span>Загрузить CSV файл</span>
                    </Button>
                    <span className="text-sm text-neutral-500 dark:text-neutral-400 self-center hidden sm:block">
                      или
                    </span>
                    <div className="flex flex-1 flex-col sm:flex-row gap-2">
                      <Input
                        placeholder="Введите номер телефона"
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        <span className="material-icons text-[18px]">add</span>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Сценарий звонка
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/30">
                      <Input
                        type="radio"
                        id="template"
                        name="script"
                        className="h-4 w-4"
                      />
                      <label
                        htmlFor="template"
                        className="text-sm text-neutral-700 dark:text-neutral-300"
                      >
                        Использовать шаблон
                      </label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/30">
                      <Input
                        type="radio"
                        id="custom"
                        name="script"
                        className="h-4 w-4"
                      />
                      <label
                        htmlFor="custom"
                        className="text-sm text-neutral-700 dark:text-neutral-300"
                      >
                        Пользовательский сценарий
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Выбор ассистента
                  </h3>
                  <div className="relative">
                    <select className="w-full border border-neutral-300 dark:border-neutral-600 rounded-md py-2 px-3 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="">Выберите ассистента</option>
                      <option value="1">Менеджер продаж</option>
                      <option value="2">Консультант по продуктам</option>
                      <option value="3">Техническая поддержка</option>
                    </select>
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 material-icons text-neutral-400 pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleStartCalling}
                  className="w-full sm:w-auto"
                >
                  <span className="material-icons text-[18px] mr-1">call</span>
                  <span>Запустить обзвон</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Voice Instructions Dialog */}
      <VoiceInstructionsDialog
        open={instructionsDialogOpen}
        onOpenChange={setInstructionsDialogOpen}
      />
    </div>
  );
}
