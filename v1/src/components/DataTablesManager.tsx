import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { DataTableService, TableSchema } from '../services/dataTableService';
import { Database } from '../types/database';
import { Plus, Database as DatabaseIcon, Settings, Trash2, Eye, Edit } from 'lucide-react';

type DataTable = Database['public']['Tables']['data_tables']['Row'];

interface DataTablesManagerProps {
  twinId?: string;
  onTableSelect?: (table: DataTable) => void;
}

export const DataTablesManager: React.FC<DataTablesManagerProps> = ({ 
  twinId, 
  onTableSelect 
}) => {
  const [tables, setTables] = useState<DataTable[]>([]);
  const [connectedTables, setConnectedTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<DataTable | null>(null);

  useEffect(() => {
    loadTables();
  }, []);

  useEffect(() => {
    if (twinId) {
      loadConnectedTables();
    }
  }, [twinId]);

  const loadTables = async () => {
    try {
      setLoading(true);
      const userTables = await DataTableService.getUserTables();
      setTables(userTables);
    } catch (error) {
      console.error('Error loading tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConnectedTables = async () => {
    if (!twinId) return;
    
    try {
      const connected = await DataTableService.getTwinConnectedTables(twinId);
      setConnectedTables(connected);
    } catch (error) {
      console.error('Error loading connected tables:', error);
    }
  };

  const handleCreateTable = () => {
    setShowCreateModal(true);
  };

  const handleTableCreated = (newTable: DataTable) => {
    setTables(prev => [newTable, ...prev]);
    setShowCreateModal(false);
  };

  const handleDeleteTable = async (tableId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту таблицу?')) return;
    
    try {
      await DataTableService.deleteTable(tableId);
      setTables(prev => prev.filter(t => t.id !== tableId));
    } catch (error) {
      console.error('Error deleting table:', error);
    }
  };

  const handleConnectTable = async (tableId: string) => {
    if (!twinId) return;
    
    try {
      await DataTableService.connectTableToTwin({
        twin_id: twinId,
        table_id: tableId,
        access_level: 'read',
        description: 'Автоматическое подключение'
      });
      await loadConnectedTables();
    } catch (error) {
      console.error('Error connecting table:', error);
    }
  };

  const handleDisconnectTable = async (tableId: string) => {
    if (!twinId) return;
    
    try {
      await DataTableService.disconnectTableFromTwin(twinId, tableId);
      await loadConnectedTables();
    } catch (error) {
      console.error('Error disconnecting table:', error);
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'read': return 'bg-blue-100 text-blue-800';
      case 'write': return 'bg-yellow-100 text-yellow-800';
      case 'full': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и кнопки */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Таблицы данных</h2>
          <p className="text-gray-600">
            Управляйте таблицами данных для ваших цифровых двойников
          </p>
        </div>
        <Button onClick={handleCreateTable} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Создать таблицу
        </Button>
      </div>

      {/* Подключенные таблицы */}
      {twinId && connectedTables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DatabaseIcon className="h-5 w-5" />
              Подключенные таблицы
            </CardTitle>
            <CardDescription>
              Таблицы, подключенные к этому двойнику
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {connectedTables.map((connection) => (
                <div key={connection.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <DatabaseIcon className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium">{connection.data_tables.name}</h4>
                      <p className="text-sm text-gray-600">
                        {connection.data_tables.description || 'Без описания'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getAccessLevelColor(connection.access_level)}>
                      {connection.access_level}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnectTable(connection.table_id)}
                    >
                      Отключить
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Все таблицы */}
      <Card>
        <CardHeader>
          <CardTitle>Все таблицы</CardTitle>
          <CardDescription>
            Создавайте и управляйте таблицами данных
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tables.length === 0 ? (
            <div className="text-center py-8">
              <DatabaseIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Нет таблиц данных
              </h3>
              <p className="text-gray-600 mb-4">
                Создайте первую таблицу данных для ваших двойников
              </p>
              <Button onClick={handleCreateTable}>
                Создать таблицу
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {tables.map((table) => {
                const isConnected = connectedTables.some(ct => ct.table_id === table.id);
                const schema = table.table_schema as TableSchema[];
                
                return (
                  <div key={table.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <DatabaseIcon className="h-5 w-5 text-blue-600" />
                        <div>
                          <h4 className="font-medium">{table.name}</h4>
                          <p className="text-sm text-gray-600">
                            {table.description || 'Без описания'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isConnected && (
                          <Badge className="bg-green-100 text-green-800">
                            Подключена
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTable(table)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTable(table)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {twinId && !isConnected && (
                          <Button
                            size="sm"
                            onClick={() => handleConnectTable(table.id)}
                          >
                            Подключить
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTable(table.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Схема таблицы */}
                    <div className="bg-gray-50 rounded p-3">
                      <h5 className="text-sm font-medium mb-2">Схема таблицы:</h5>
                      <div className="flex flex-wrap gap-2">
                        {schema.map((column, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {column.name}: {column.type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Модальные окна */}
      {showCreateModal && (
        <CreateTableModal
          onClose={() => setShowCreateModal(false)}
          onTableCreated={handleTableCreated}
        />
      )}

      {selectedTable && (
        <TableDetailsModal
          table={selectedTable}
          onClose={() => setSelectedTable(null)}
          onTableUpdated={(updatedTable) => {
            setTables(prev => prev.map(t => t.id === updatedTable.id ? updatedTable : t));
            setSelectedTable(null);
          }}
        />
      )}
    </div>
  );
};

// Компонент для создания таблицы
interface CreateTableModalProps {
  onClose: () => void;
  onTableCreated: (table: DataTable) => void;
}

const CreateTableModal: React.FC<CreateTableModalProps> = ({ onClose, onTableCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [schema, setSchema] = useState<TableSchema[]>([
    { name: '', type: 'text', required: true }
  ]);
  const [loading, setLoading] = useState(false);

  const addColumn = () => {
    setSchema(prev => [...prev, { name: '', type: 'text', required: false }]);
  };

  const removeColumn = (index: number) => {
    setSchema(prev => prev.filter((_, i) => i !== index));
  };

  const updateColumn = (index: number, field: keyof TableSchema, value: any) => {
    setSchema(prev => prev.map((col, i) => 
      i === index ? { ...col, [field]: value } : col
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Введите название таблицы');
      return;
    }

    if (schema.some(col => !col.name.trim())) {
      alert('Все колонки должны иметь названия');
      return;
    }

    try {
      setLoading(true);
      
      const sampleData = DataTableService.generateSampleData(schema);
      
      const newTable = await DataTableService.createTable({
        name: name.trim(),
        description: description.trim() || null,
        table_schema: schema,
        sample_data: sampleData,
        user_id: 'anonymous_user' // В реальном приложении брать из контекста
      });

      onTableCreated(newTable);
    } catch (error) {
      console.error('Error creating table:', error);
      alert('Ошибка при создании таблицы');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Создать новую таблицу</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Название таблицы</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Например: Товары"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Описание назначения таблицы"
              rows={3}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Схема таблицы</label>
              <Button type="button" onClick={addColumn} size="sm">
                Добавить колонку
              </Button>
            </div>
            
            <div className="space-y-2">
              {schema.map((column, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={column.name}
                    onChange={(e) => updateColumn(index, 'name', e.target.value)}
                    className="flex-1 p-2 border rounded"
                    placeholder="Название колонки"
                  />
                  <select
                    value={column.type}
                    onChange={(e) => updateColumn(index, 'type', e.target.value)}
                    className="p-2 border rounded"
                  >
                    <option value="text">Текст</option>
                    <option value="integer">Целое число</option>
                    <option value="numeric">Число с плавающей точкой</option>
                    <option value="boolean">Логическое значение</option>
                    <option value="date">Дата</option>
                    <option value="timestamp">Дата и время</option>
                  </select>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={column.required}
                      onChange={(e) => updateColumn(index, 'required', e.target.checked)}
                    />
                    <span className="text-sm">Обязательное</span>
                  </label>
                  {schema.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeColumn(index)}
                      variant="outline"
                      size="sm"
                    >
                      Удалить
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" onClick={onClose} variant="outline">
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Создание...' : 'Создать таблицу'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Компонент для просмотра деталей таблицы
interface TableDetailsModalProps {
  table: DataTable;
  onClose: () => void;
  onTableUpdated: (table: DataTable) => void;
}

const TableDetailsModal: React.FC<TableDetailsModalProps> = ({ table, onClose, onTableUpdated }) => {
  const [activeTab, setActiveTab] = useState<'schema' | 'data' | 'queries'>('schema');
  const schema = table.table_schema as TableSchema[];
  const sampleData = table.sample_data as any[];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">{table.name}</h3>
          <Button onClick={onClose} variant="outline">
            Закрыть
          </Button>
        </div>

        {table.description && (
          <p className="text-gray-600 mb-4">{table.description}</p>
        )}

        {/* Вкладки */}
        <div className="flex border-b mb-4">
          <button
            className={`px-4 py-2 ${activeTab === 'schema' ? 'border-b-2 border-blue-600' : ''}`}
            onClick={() => setActiveTab('schema')}
          >
            Схема
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'data' ? 'border-b-2 border-blue-600' : ''}`}
            onClick={() => setActiveTab('data')}
          >
            Данные
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'queries' ? 'border-b-2 border-blue-600' : ''}`}
            onClick={() => setActiveTab('queries')}
          >
            Запросы
          </button>
        </div>

        {/* Содержимое вкладок */}
        {activeTab === 'schema' && (
          <div className="space-y-4">
            <h4 className="font-medium">Структура таблицы</h4>
            <div className="border rounded">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left">Колонка</th>
                    <th className="p-3 text-left">Тип</th>
                    <th className="p-3 text-left">Обязательная</th>
                    <th className="p-3 text-left">Описание</th>
                  </tr>
                </thead>
                <tbody>
                  {schema.map((column, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-3 font-medium">{column.name}</td>
                      <td className="p-3">
                        <Badge variant="secondary">{column.type}</Badge>
                      </td>
                      <td className="p-3">
                        {column.required ? 'Да' : 'Нет'}
                      </td>
                      <td className="p-3 text-gray-600">
                        {column.description || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="space-y-4">
            <h4 className="font-medium">Пример данных</h4>
            <div className="border rounded overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {schema.map((column, index) => (
                      <th key={index} className="p-3 text-left">
                        {column.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sampleData.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t">
                      {schema.map((column, colIndex) => (
                        <td key={colIndex} className="p-3">
                          {String(row[column.name] || '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'queries' && (
          <div className="space-y-4">
            <h4 className="font-medium">История запросов</h4>
            <p className="text-gray-600">
              Здесь будет отображаться история запросов к таблице
            </p>
          </div>
        )}
      </div>
    </div>
  );
}; 