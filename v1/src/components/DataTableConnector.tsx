import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { DataTableService } from '../services/dataTableService';
import { Database } from '../types/database';
import { Database as DatabaseIcon, Link, Unlink, Settings, Eye } from 'lucide-react';

type DataTable = Database['public']['Tables']['data_tables']['Row'];
type TwinDataTableConnection = Database['public']['Tables']['twin_data_table_connections']['Row'];

interface DataTableConnectorProps {
  twinId: string;
  twinName: string;
}

export const DataTableConnector: React.FC<DataTableConnectorProps> = ({ 
  twinId, 
  twinName 
}) => {
  const [connectedTables, setConnectedTables] = useState<TwinDataTableConnection[]>([]);
  const [availableTables, setAvailableTables] = useState<DataTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<TwinDataTableConnection | null>(null);

  useEffect(() => {
    loadData();
  }, [twinId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [connected, available] = await Promise.all([
        DataTableService.getTwinConnectedTables(twinId),
        DataTableService.getAvailableTablesForTwin(twinId)
      ]);
      setConnectedTables(connected);
      setAvailableTables(available);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectTable = async (tableId: string, accessLevel: string = 'read') => {
    try {
      await DataTableService.connectTableToTwin({
        twin_id: twinId,
        table_id: tableId,
        access_level: accessLevel,
        description: `Подключено к двойнику "${twinName}"`
      });
      await loadData();
      setShowConnectModal(false);
    } catch (error) {
      console.error('Error connecting table:', error);
    }
  };

  const handleDisconnectTable = async (tableId: string) => {
    if (!confirm('Вы уверены, что хотите отключить эту таблицу от двойника?')) return;
    
    try {
      await DataTableService.disconnectTableFromTwin(twinId, tableId);
      await loadData();
    } catch (error) {
      console.error('Error disconnecting table:', error);
    }
  };

  const handleUpdateAccess = async (tableId: string, accessLevel: string) => {
    try {
      await DataTableService.updateTableAccess(twinId, tableId, accessLevel);
      await loadData();
    } catch (error) {
      console.error('Error updating access level:', error);
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

  const getAccessLevelLabel = (level: string) => {
    switch (level) {
      case 'read': return 'Только чтение';
      case 'write': return 'Чтение и запись';
      case 'full': return 'Полный доступ';
      default: return level;
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
      {/* Заголовок */}
      <div>
        <h2 className="text-2xl font-bold">Подключение таблиц к двойнику</h2>
        <p className="text-gray-600">
          Управляйте доступом двойника "{twinName}" к таблицам данных
        </p>
      </div>

      {/* Подключенные таблицы */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Подключенные таблицы
              </CardTitle>
              <CardDescription>
                Таблицы, к которым у двойника есть доступ
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowConnectModal(true)}
              disabled={availableTables.length === 0}
            >
              Подключить таблицу
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {connectedTables.length === 0 ? (
            <div className="text-center py-8">
              <DatabaseIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Нет подключенных таблиц
              </h3>
              <p className="text-gray-600 mb-4">
                Подключите таблицы данных, чтобы двойник мог получать информацию
              </p>
              <Button 
                onClick={() => setShowConnectModal(true)}
                disabled={availableTables.length === 0}
              >
                Подключить таблицу
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {connectedTables.map((connection) => {
                const table = connection.data_tables as any;
                
                return (
                  <div key={connection.id} className="border rounded-lg p-4">
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
                        <Badge className={getAccessLevelColor(connection.access_level)}>
                          {getAccessLevelLabel(connection.access_level)}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedConnection(connection)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedConnection(connection)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisconnectTable(connection.table_id)}
                        >
                          <Unlink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Информация о доступе */}
                    <div className="bg-gray-50 rounded p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Уровень доступа: <strong>{getAccessLevelLabel(connection.access_level)}</strong></span>
                        <span>Подключено: {new Date(connection.created_at).toLocaleDateString()}</span>
                      </div>
                      {connection.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {connection.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Доступные таблицы */}
      {availableTables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Доступные таблицы</CardTitle>
            <CardDescription>
              Таблицы, которые можно подключить к двойнику
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {availableTables.map((table) => (
                <div key={table.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <DatabaseIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <h4 className="font-medium">{table.name}</h4>
                      <p className="text-sm text-gray-600">
                        {table.description || 'Без описания'}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleConnectTable(table.id)}
                  >
                    Подключить
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Модальные окна */}
      {showConnectModal && (
        <ConnectTableModal
          availableTables={availableTables}
          onConnect={handleConnectTable}
          onClose={() => setShowConnectModal(false)}
        />
      )}

      {selectedConnection && (
        <ConnectionDetailsModal
          connection={selectedConnection}
          onUpdateAccess={handleUpdateAccess}
          onClose={() => setSelectedConnection(null)}
        />
      )}
    </div>
  );
};

// Модальное окно для подключения таблицы
interface ConnectTableModalProps {
  availableTables: DataTable[];
  onConnect: (tableId: string, accessLevel: string) => void;
  onClose: () => void;
}

const ConnectTableModal: React.FC<ConnectTableModalProps> = ({ 
  availableTables, 
  onConnect, 
  onClose 
}) => {
  const [selectedTableId, setSelectedTableId] = useState('');
  const [accessLevel, setAccessLevel] = useState('read');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTableId) {
      onConnect(selectedTableId, accessLevel);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Подключить таблицу</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Выберите таблицу</label>
            <select
              value={selectedTableId}
              onChange={(e) => setSelectedTableId(e.target.value)}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Выберите таблицу...</option>
              {availableTables.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Уровень доступа</label>
            <select
              value={accessLevel}
              onChange={(e) => setAccessLevel(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="read">Только чтение</option>
              <option value="write">Чтение и запись</option>
              <option value="full">Полный доступ</option>
            </select>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" onClick={onClose} variant="outline">
              Отмена
            </Button>
            <Button type="submit" disabled={!selectedTableId}>
              Подключить
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Модальное окно для деталей подключения
interface ConnectionDetailsModalProps {
  connection: TwinDataTableConnection;
  onUpdateAccess: (tableId: string, accessLevel: string) => void;
  onClose: () => void;
}

const ConnectionDetailsModal: React.FC<ConnectionDetailsModalProps> = ({ 
  connection, 
  onUpdateAccess, 
  onClose 
}) => {
  const [accessLevel, setAccessLevel] = useState(connection.access_level);
  const table = connection.data_tables as any;

  const handleUpdateAccess = () => {
    onUpdateAccess(connection.table_id, accessLevel);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h3 className="text-xl font-bold mb-4">Настройки подключения</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Таблица: {table.name}</h4>
            <p className="text-gray-600">{table.description || 'Без описания'}</p>
          </div>

          <Separator />

          <div>
            <label className="block text-sm font-medium mb-1">Уровень доступа</label>
            <select
              value={accessLevel}
              onChange={(e) => setAccessLevel(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="read">Только чтение</option>
              <option value="write">Чтение и запись</option>
              <option value="full">Полный доступ</option>
            </select>
          </div>

          <div className="bg-blue-50 p-3 rounded">
            <h5 className="font-medium text-blue-900 mb-1">Описание уровней доступа:</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              <li><strong>Только чтение:</strong> Двойник может получать данные из таблицы</li>
              <li><strong>Чтение и запись:</strong> Двойник может читать и изменять данные</li>
              <li><strong>Полный доступ:</strong> Двойник может выполнять любые операции с таблицей</li>
            </ul>
          </div>

          <div className="flex gap-2 justify-end">
            <Button onClick={onClose} variant="outline">
              Отмена
            </Button>
            <Button onClick={handleUpdateAccess}>
              Сохранить изменения
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}; 