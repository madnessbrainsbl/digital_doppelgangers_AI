import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { DataTableConnector } from './DataTableConnector';
import { DataTableService } from '../services/dataTableService';
import { Database, Link, Unlink, Settings, Eye, Plus } from 'lucide-react';
import { Database as DatabaseType } from '../types/database';

type DataTable = DatabaseType['public']['Tables']['data_tables']['Row'];

interface TwinDataTablesConnectorProps {
  twinId: string;
  twinName: string;
  onClose: () => void;
}

export const TwinDataTablesConnector: React.FC<TwinDataTablesConnectorProps> = ({ 
  twinId, 
  twinName, 
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState<'connections' | 'tables'>('connections');
  const [showCreateTable, setShowCreateTable] = useState(false);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">Подключение таблиц к двойнику</h2>
            <p className="text-gray-600">
              "{twinName}" - управление доступом к данным
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Database className="h-3 w-3 mr-1" />
              Система таблиц
            </Badge>
            <Button onClick={onClose} variant="outline">
              Закрыть
            </Button>
          </div>
        </div>

        {/* Навигация */}
        <div className="flex border-b">
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === 'connections' 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('connections')}
          >
            <Link className="h-4 w-4 inline mr-2" />
            Подключения
          </button>
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === 'tables' 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('tables')}
          >
            <Database className="h-4 w-4 inline mr-2" />
            Управление таблицами
          </button>
        </div>

        {/* Содержимое */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {activeTab === 'connections' && (
            <DataTableConnector twinId={twinId} twinName={twinName} />
          )}

          {activeTab === 'tables' && (
            <div className="space-y-6">
              {/* Заголовок и кнопки */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Таблицы данных</h3>
                  <p className="text-gray-600">
                    Создавайте и управляйте таблицами для подключения к двойнику
                  </p>
                </div>
                <Button onClick={() => setShowCreateTable(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Создать таблицу
                </Button>
              </div>

              {/* Информация о системе */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Как работают таблицы с двойниками
                  </CardTitle>
                  <CardDescription>
                    Интеграция таблиц данных для улучшения ответов двойника
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Преимущества</h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li>• Более точные ответы на основе реальных данных</li>
                        <li>• Автоматическое обновление контекста двойника</li>
                        <li>• Возможность работы с большими объемами информации</li>
                        <li>• Гибкая настройка уровней доступа</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Примеры использования</h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li>• Каталог товаров и услуг</li>
                        <li>• База знаний и FAQ</li>
                        <li>• Контакты и справочная информация</li>
                        <li>• Статистика и аналитика</li>
                      </ul>
                    </div>
                  </div>

                  <Separator />

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Как это работает</h4>
                    <div className="text-sm text-blue-800 space-y-2">
                      <p>
                        1. <strong>Создайте таблицу</strong> - определите структуру данных (колонки, типы)
                      </p>
                      <p>
                        2. <strong>Добавьте данные</strong> - заполните таблицу примерами или реальными данными
                      </p>
                      <p>
                        3. <strong>Подключите к двойнику</strong> - выберите уровень доступа (чтение/запись/полный)
                      </p>
                      <p>
                        4. <strong>Автоматическая интеграция</strong> - двойник получит доступ к данным и будет использовать их в ответах
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Быстрые шаблоны */}
              <Card>
                <CardHeader>
                  <CardTitle>Быстрые шаблоны таблиц</CardTitle>
                  <CardDescription>
                    Готовые структуры для популярных случаев использования
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4 hover:border-blue-300 cursor-pointer">
                      <h4 className="font-medium mb-2">Каталог товаров</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Для интернет-магазинов и торговых компаний
                      </p>
                      <div className="space-y-1 text-xs text-gray-500">
                        <div>• name (text) - Название товара</div>
                        <div>• price (numeric) - Цена</div>
                        <div>• category (text) - Категория</div>
                        <div>• in_stock (boolean) - В наличии</div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 hover:border-blue-300 cursor-pointer">
                      <h4 className="font-medium mb-2">База знаний</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Для поддержки клиентов и FAQ
                      </p>
                      <div className="space-y-1 text-xs text-gray-500">
                        <div>• question (text) - Вопрос</div>
                        <div>• answer (text) - Ответ</div>
                        <div>• category (text) - Категория</div>
                        <div>• priority (integer) - Приоритет</div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 hover:border-blue-300 cursor-pointer">
                      <h4 className="font-medium mb-2">Контакты</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Для справочной информации
                      </p>
                      <div className="space-y-1 text-xs text-gray-500">
                        <div>• name (text) - Имя</div>
                        <div>• phone (text) - Телефон</div>
                        <div>• email (text) - Email</div>
                        <div>• department (text) - Отдел</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 