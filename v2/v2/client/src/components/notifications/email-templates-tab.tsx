import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, FileText, AlertCircle, Zap } from "lucide-react";

export default function EmailTemplatesTab() {
  return (
    <div className="space-y-6">
      {/* Заголовок секции */}
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Шаблоны Email рассылок</h3>
        <p className="text-muted-foreground">
          Готовые шаблоны для оформления ваших Email кампаний
        </p>
      </div>

      {/* Информационное сообщение */}
      <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/30">
        <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-700 dark:text-blue-400">
          <strong>Применение шаблонов:</strong> Выберите подходящий шаблон при
          создании Email рассылки. Ваш текст будет автоматически оформлен в
          соответствии с выбранным дизайном.
        </AlertDescription>
      </Alert>

      {/* Сетка шаблонов */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Стандартный шаблон */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <FileText className="h-8 w-8 text-blue-600 dark:text-blue-300" />
            </div>
            <CardTitle className="text-lg">Стандартный</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border shadow-sm">
              <div className="space-y-3">
                <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                  Добро пожаловать!
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-gray-600 dark:text-gray-400">
                    Здравствуйте! Рады сообщить вам о
                  </div>
                  <div className="text-[10px] text-gray-600 dark:text-gray-400">
                    новых возможностях нашего сервиса.
                  </div>
                  <div className="text-[10px] text-gray-600 dark:text-gray-400">
                    Ваша команда всегда готова помочь.
                  </div>
                </div>
                <div className="border-t pt-2">
                  <div className="text-[8px] text-gray-400 dark:text-gray-500">
                    С уважением, команда Asissto
                  </div>
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">Особенности:</p>
              <ul className="space-y-1 text-xs">
                <li>• Минималистичный дизайн</li>
                <li>• Хорошая читаемость</li>
                <li>• Подходит для любых целей</li>
                <li>• Быстрая загрузка</li>
              </ul>
            </div>
            <div className="flex flex-wrap gap-1">
              <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-2 py-1 rounded">
                Универсальный
              </span>
              <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 px-2 py-1 rounded">
                Email
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Информационный шаблон */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-green-600 dark:text-green-300" />
            </div>
            <CardTitle className="text-lg">Информационный</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border shadow-sm">
              <div className="space-y-3">
                <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                  Важное обновление
                </div>
                <div className="text-[10px] text-gray-600 dark:text-gray-400">
                  Уведомляем о важных изменениях:
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-400 p-2 rounded">
                  <div className="text-[9px] font-medium text-blue-800 dark:text-blue-200">
                    ⚡ Новая функция автоответов
                  </div>
                  <div className="text-[8px] text-blue-600 dark:text-blue-300 mt-1">
                    Доступна с сегодняшнего дня для всех
                  </div>
                </div>
                <div className="text-[10px] text-gray-600 dark:text-gray-400">
                  Подробности в личном кабинете.
                </div>
                <div className="border-t pt-2">
                  <div className="text-[8px] text-gray-400 dark:text-gray-500">
                    С уважением, команда Asissto
                  </div>
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">Особенности:</p>
              <ul className="space-y-1 text-xs">
                <li>• Выделенный информационный блок</li>
                <li>• Структурированная подача</li>
                <li>• Идеален для новостей</li>
                <li>• Акцент на важности</li>
              </ul>
            </div>
            <div className="flex flex-wrap gap-1">
              <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-2 py-1 rounded">
                Новости
              </span>
              <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 px-2 py-1 rounded">
                Обновления
              </span>
              <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 px-2 py-1 rounded">
                Email
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Маркетинговый шаблон */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
              <Zap className="h-8 w-8 text-orange-600 dark:text-orange-300" />
            </div>
            <CardTitle className="text-lg">Маркетинговый</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border shadow-sm">
              <div className="space-y-3">
                <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                  🎉 Специальное предложение!
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-gray-600 dark:text-gray-400">
                    Только сегодня скидка 30% на все
                  </div>
                  <div className="text-[10px] text-gray-600 dark:text-gray-400">
                    тарифные планы! Не упустите шанс
                  </div>
                  <div className="text-[10px] text-gray-600 dark:text-gray-400">
                    улучшить свой бизнес.
                  </div>
                </div>
                <div className="flex justify-center mt-3">
                  <div className="bg-orange-500 text-white px-3 py-1 rounded text-center">
                    <div className="text-[9px] font-bold">ПОЛУЧИТЬ СКИДКУ</div>
                  </div>
                </div>
                <div className="border-t pt-2">
                  <div className="text-[8px] text-gray-400 dark:text-gray-500">
                    С уважением, команда Asissto
                  </div>
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">Особенности:</p>
              <ul className="space-y-1 text-xs">
                <li>• Кнопка призыва к действию</li>
                <li>• Яркий акцентный дизайн</li>
                <li>• Высокая конверсия</li>
                <li>• Идеален для акций</li>
              </ul>
            </div>
            <div className="flex flex-wrap gap-1">
              <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 px-2 py-1 rounded">
                Акции
              </span>
              <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 px-2 py-1 rounded">
                Скидки
              </span>
              <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 px-2 py-1 rounded">
                Email
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Информация о том, как использовать */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
              <Mail className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Как использовать шаблоны
              </h4>
              <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                <li>При создании Email рассылки выберите нужный шаблон</li>
                <li>Напишите текст сообщения в обычном формате</li>
                <li>Система автоматически применит выбранный дизайн</li>
                <li>Ваше письмо будет выглядеть профессионально</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
