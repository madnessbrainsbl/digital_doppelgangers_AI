import React, { useState, useEffect } from 'react';
import { DataTablesManager } from './DataTablesManager';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Database as DatabaseIcon, Plus, Settings, BarChart3 } from 'lucide-react';

export const DataTablesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tables' | 'analytics'>('tables');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Заголовок страницы */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Таблицы данных</h1>
          <p className="text-gray-600 mt-2">
            Создавайте и управляйте таблицами данных для ваших цифровых двойников
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <DatabaseIcon className="h-3 w-3 mr-1" />
            Система таблиц
          </Badge>
        </div>
      </div>

      {/* Навигация по вкладкам */}
      <div className="flex border-b">
        <button
          className={`px-6 py-3 font-medium ${
            activeTab === 'tables' 
              ? 'border-b-2 border-blue-600 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('tables')}
        >
          <DatabaseIcon className="h-4 w-4 inline mr-2" />
          Управление таблицами
        </button>
        <button
          className={`px-6 py-3 font-medium ${
            activeTab === 'analytics' 
              ? 'border-b-2 border-blue-600 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 className="h-4 w-4 inline mr-2" />
          Аналитика
        </button>
      </div>

      {/* Содержимое вкладок */}
      {activeTab === 'tables' && (
        <DataTablesManager />
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Статистика */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Всего таблиц</CardTitle>
                <DatabaseIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Создано таблиц данных
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Подключения</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Активных подключений к двойникам
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Запросы</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Выполнено запросов сегодня
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Информация о системе */}
          <Card>
            <CardHeader>
              <CardTitle>О системе таблиц данных</CardTitle>
              <CardDescription>
                Как работает интеграция таблиц с цифровыми двойниками
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Возможности</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Создание таблиц с произвольной структурой</li>
                    <li>• Подключение таблиц к цифровым двойникам</li>
                    <li>• Настройка уровней доступа (чтение/запись/полный)</li>
                    <li>• Автоматическое обновление контекста двойника</li>
                    <li>• История запросов и аналитика</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Типы данных</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• <Badge variant="outline">text</Badge> - Текстовые данные</li>
                    <li>• <Badge variant="outline">integer</Badge> - Целые числа</li>
                    <li>• <Badge variant="outline">numeric</Badge> - Числа с плавающей точкой</li>
                    <li>• <Badge variant="outline">boolean</Badge> - Логические значения</li>
                    <li>• <Badge variant="outline">date</Badge> - Даты</li>
                    <li>• <Badge variant="outline">timestamp</Badge> - Дата и время</li>
                  </ul>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Как это работает</h4>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>
                    1. <strong>Создайте таблицу</strong> - определите структуру и добавьте примеры данных
                  </p>
                  <p>
                    2. <strong>Подключите к двойнику</strong> - выберите двойника и настройте уровень доступа
                  </p>
                  <p>
                    3. <strong>Автоматическая интеграция</strong> - двойник получит доступ к данным и сможет использовать их в ответах
                  </p>
                  <p>
                    4. <strong>Умные ответы</strong> - двойник будет давать более точные ответы, основываясь на реальных данных
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Примеры использования */}
          <Card>
            <CardHeader>
              <CardTitle>Примеры использования</CardTitle>
              <CardDescription>
                Как таблицы данных могут улучшить работу ваших двойников
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium">Каталог товаров</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <p className="font-medium mb-1">Структура:</p>
                    <ul className="space-y-1 text-gray-600">
                      <li>• name (text) - Название товара</li>
                      <li>• price (numeric) - Цена</li>
                      <li>• category (text) - Категория</li>
                      <li>• in_stock (boolean) - В наличии</li>
                    </ul>
                  </div>
                  <p className="text-sm text-gray-600">
                    Двойник сможет отвечать на вопросы о товарах, ценах и наличии
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">База знаний</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <p className="font-medium mb-1">Структура:</p>
                    <ul className="space-y-1 text-gray-600">
                      <li>• question (text) - Вопрос</li>
                      <li>• answer (text) - Ответ</li>
                      <li>• category (text) - Категория</li>
                      <li>• priority (integer) - Приоритет</li>
                    </ul>
                  </div>
                  <p className="text-sm text-gray-600">
                    Двойник сможет давать точные ответы на основе базы знаний
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}; 