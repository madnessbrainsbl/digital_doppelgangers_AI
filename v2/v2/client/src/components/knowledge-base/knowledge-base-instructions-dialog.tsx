import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  Upload,
  FileText,
  Search,
  Eye,
  Trash2,
  AlertTriangle,
  CheckCircle,
  FileType,
  FolderOpen,
  Zap,
  Target,
  Settings,
} from "lucide-react";

interface KnowledgeBaseInstructionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function KnowledgeBaseInstructionsDialog({
  open,
  onOpenChange,
}: KnowledgeBaseInstructionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Database className="h-6 w-6 mr-2 text-primary" />
            Инструкция по работе с базой знаний
          </DialogTitle>
          <DialogDescription>
            Полное руководство по управлению файлами и информацией для ваших
            ассистентов
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-8rem)]">
          <div className="space-y-6 pr-4">
            {/* Важная информация */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-start">
                <Database className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-0 sm:mr-3 mb-2 sm:mb-0 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-300">
                    Что такое база знаний
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                    База знаний — это хранилище файлов с информацией, которую
                    могут использовать ваши ассистенты для ответов клиентам. Все
                    загруженные файлы автоматически становятся доступными всем
                    ассистентам в вашем аккаунте.
                  </p>
                </div>
              </div>
            </div>

            {/* 1. Загрузка файлов */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Upload className="h-5 w-5 mr-2 text-green-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">1. Загрузка файлов</h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Добавляйте файлы с важной информацией, которую должны знать
                  ваши ассистенты:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Поддерживаемые форматы:</h4>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        PDF
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        DOCX
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        TXT
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        CSV
                      </Badge>
                    </div>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                      <li>
                        PDF — документы, инструкции, прайс-листы, каталоги
                      </li>
                      <li>DOCX — текстовые документы, регламенты, описания</li>
                      <li>TXT — простые текстовые файлы, FAQ, заметки</li>
                      <li>CSV — таблицы с данными, списки товаров, контакты</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Ограничения:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Максимальный размер файла: 20 МБ</li>
                    <li>Общий лимит хранилища зависит от тарифного плана</li>
                    <li>Файлы должны содержать текстовую информацию</li>
                    <li>Поддерживается кодировка UTF-8</li>
                  </ul>
                </div>

                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    <strong>Совет:</strong> Называйте файлы понятными именами —
                    это поможет легче находить нужную информацию и лучше
                    организовать базу знаний.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 2. Организация файлов */}
            <div className="space-y-4">
              <div className="flex items-center">
                <FolderOpen className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">2. Организация файлов</h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Эффективно организуйте свои файлы для удобства использования:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Фильтрация по типам:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      <strong>Все</strong> — показывает все загруженные файлы
                    </li>
                    <li>
                      <strong>По типам</strong> — отфильтровать PDF, DOCX, TXT,
                      CSV
                    </li>
                    <li>
                      <strong>Поиск</strong> — быстрый поиск по названиям файлов
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Рекомендации по именованию:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      Используйте описательные названия: "Прайс-лист 2024",
                      "Инструкция по оплате"
                    </li>
                    <li>
                      Добавляйте дату в название: "Каталог товаров январь 2024"
                    </li>
                    <li>
                      Группируйте по темам: "FAQ техподдержка", "FAQ продажи"
                    </li>
                    <li>Избегайте специальных символов в названиях</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* 3. Поиск и навигация */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Search className="h-5 w-5 mr-2 text-purple-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">3. Поиск и навигация</h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Быстро находите нужные файлы среди всей базы знаний:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Возможности поиска:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Поиск по названию файла в режиме реального времени</li>
                    <li>Автоматические подсказки при вводе</li>
                    <li>Поиск работает для всех типов файлов</li>
                    <li>Результаты обновляются мгновенно</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Фильтрация:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Используйте вкладки для фильтрации по типу файла</li>
                    <li>
                      Комбинируйте поиск с фильтрацией для точных результатов
                    </li>
                    <li>Просматривайте размер и дату загрузки каждого файла</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* 4. Управление файлами */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Settings className="h-5 w-5 mr-2 text-orange-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">4. Управление файлами</h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Управляйте загруженными файлами и следите за их актуальностью:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Действия с файлами:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      <Eye className="h-4 w-4 inline mr-1" />
                      <strong>Просмотр</strong> — открытие файла для чтения (в
                      разработке)
                    </li>
                    <li>
                      <Trash2 className="h-4 w-4 inline mr-1" />
                      <strong>Удаление</strong> — удаление устаревших или
                      ненужных файлов
                    </li>
                    <li>
                      <FileText className="h-4 w-4 inline mr-1" />
                      <strong>Информация</strong> — просмотр размера и даты
                      загрузки
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Рекомендации по управлению:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Регулярно обновляйте устаревшую информацию</li>
                    <li>Удаляйте дублирующиеся файлы</li>
                    <li>Следите за лимитами хранилища</li>
                    <li>Проверяйте актуальность прайс-листов и каталогов</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* 5. Как ассистенты используют базу знаний */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-indigo-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">
                  5. Использование ассистентами
                </h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Понимайте, как ваши ассистенты работают с загруженной
                  информацией:
                </p>

                <div className="space-y-2">
                  <h4 className="font-medium">Подключение к ассистенту</h4>
                  <ul className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Откройте вкладку "Ассистенты"</li>
                    <li>Выберите ассистента и нажмите "Настройки"</li>
                    <li>Перейдите во вкладку "База знаний"</li>
                    <li>Нажмите кнопку "Добавить из Базы знаний"</li>
                    <li>Выберите нужные файлы</li>
                    <li>Прикрепите файлы к ассистенту</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Эффективность использования:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Структурированная информация работает лучше</li>
                    <li>Четкие заголовки и разделы улучшают поиск</li>
                    <li>Актуальные данные повышают качество ответов</li>
                    <li>Избегайте противоречивой информации в разных файлах</li>
                  </ul>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <div className="flex flex-col sm:flex-row sm:items-start">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-0 sm:mr-2 mb-2 sm:mb-0 flex-shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      <strong>Важно:</strong> Изменения в базе знаний могут
                      потребовать некоторого времени.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* 6. Лучшие практики */}
            <div className="space-y-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold">6. Лучшие практики</h3>
              </div>

              <div className="ml-0 sm:ml-7 space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium">Подготовка файлов:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      Используйте четкую структуру с заголовками и разделами
                    </li>
                    <li>Пишите простым и понятным языком</li>
                    <li>Включайте примеры и конкретные случаи</li>
                    <li>Избегайте излишне технической терминологии</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Содержание:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Включайте полную информацию о продуктах и услугах</li>
                    <li>Добавляйте актуальные цены и условия</li>
                    <li>Описывайте процедуры и регламенты работы</li>
                    <li>Включайте ответы на частые вопросы клиентов</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Поддержание актуальности:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Регулярно проверяйте и обновляйте информацию</li>
                    <li>Удаляйте устаревшие файлы</li>
                    <li>Заменяйте старые версии документов новыми</li>
                    <li>Уведомляйте команду об изменениях в базе знаний</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* Быстрое начало */}
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-start">
                <Zap className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 mr-0 sm:mr-3 mb-2 sm:mb-0 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">
                    Быстрое начало работы с базой знаний
                  </h4>
                  <ol className="text-sm text-green-700 dark:text-green-400 space-y-1 ml-4 list-decimal list-inside">
                    <li>Нажмите кнопку "Загрузить файл"</li>
                    <li>
                      Выберите файл с важной информацией (PDF, DOCX, TXT, CSV)
                    </li>
                    <li>Дайте файлу понятное название</li>
                    <li>Дождитесь завершения загрузки</li>
                    <li>Проверьте файл в списке базы знаний</li>
                    <li>Прикрепите файл к ассистенту</li>
                    <li>При необходимости загрузите дополнительные файлы</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Полезные советы */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-start">
                <FileType className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-0 sm:mr-3 mb-2 sm:mb-0 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                    Примеры полезных файлов для базы знаний
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 ml-4 list-disc list-inside">
                    <li>
                      <strong>FAQ.pdf</strong> — ответы на частые вопросы
                      клиентов
                    </li>
                    <li>
                      <strong>Прайс-лист.csv</strong> — актуальные цены на
                      товары и услуги
                    </li>
                    <li>
                      <strong>Регламент работы.docx</strong> — правила и
                      процедуры компании
                    </li>
                    <li>
                      <strong>Каталог продукции.pdf</strong> — описания товаров
                      и услуг
                    </li>
                    <li>
                      <strong>Контакты.txt</strong> — информация о филиалах и
                      контактах
                    </li>
                    <li>
                      <strong>Условия доставки.pdf</strong> — информация о
                      доставке и оплате
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
