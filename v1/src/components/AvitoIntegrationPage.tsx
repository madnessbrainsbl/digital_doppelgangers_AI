import React, { useState, useEffect } from 'react';
import { ShoppingBag, MessageSquare, Settings, Zap, Shield, Globe, Users, CheckCircle, AlertCircle, Clock, Play, Pause, Volume2, VolumeX, Mic, Phone, MessageCircleMore, Smartphone, Wifi, Lock, Key, Link, Copy, ExternalLink, RefreshCw, Trash2, Edit3, Save, X, Sparkles, Brain, Star, Heart, Award, TrendingUp, Plus, MessageCircle, Store, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AvitoService } from '../services/avitoService';
import { DigitalTwinService } from '../services/digitalTwinService';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

interface AvitoIntegration {
  id: string;
  name: string;
  phone: string;
  status: 'active' | 'inactive' | 'error';
  connectedTwinId?: string;
  connectedTwinName?: string;
  messagesCount: number;
  autoReply: boolean;
  createdAt: string;
  lastActivity?: string;
}

interface AvitoMessage {
  id: string;
  chatId: string;
  chatName: string;
  messageText: string;
  isIncoming: boolean;
  timestamp: string;
  responseText?: string;
  itemTitle?: string;
  itemPrice?: string;
}

interface DigitalTwin {
  id: string;
  name: string;
}

export function AvitoIntegrationPage() {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<AvitoIntegration[]>([]);
  const [twins, setTwins] = useState<DigitalTwin[]>([]);
  const [messages, setMessages] = useState<AvitoMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateIntegration, setShowCreateIntegration] = useState(false);
  const [newIntegrationPhone, setNewIntegrationPhone] = useState('');
  const [newIntegrationName, setNewIntegrationName] = useState('');
  const [newIntegrationApiKey, setNewIntegrationApiKey] = useState('');
  const [newIntegrationWebhookSecret, setNewIntegrationWebhookSecret] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showConnectTwin, setShowConnectTwin] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadIntegrations(),
        loadTwins(),
        loadMessages()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Ошибка при загрузке данных');
    } finally {
      setIsLoading(false);
    }
  };

  const loadIntegrations = async () => {
    try {
      const integrationsList = await AvitoService.getAllIntegrations();
      setIntegrations(integrationsList);
    } catch (error) {
      console.error('Error loading integrations:', error);
    }
  };

  const loadTwins = async () => {
    try {
      const twinsList = await DigitalTwinService.getAllTwins();
      setTwins(twinsList.map(twin => ({ id: twin.id, name: twin.name })));
    } catch (error) {
      console.error('Error loading twins:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const messagesList = await AvitoService.getRecentMessages(50);
      setMessages(messagesList);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleCreateIntegration = async () => {
    if (!newIntegrationPhone.trim() || !newIntegrationName.trim()) {
      setError('Заполните все поля');
      return;
    }

    if (!validatePhone(newIntegrationPhone.trim())) {
      setError('Неверный формат номера телефона');
      return;
    }

    if (!newIntegrationApiKey.trim()) {
      setError('Введите API ключ от Авито');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Сначала сохраняем API ключи пользователя
      await AvitoService.saveUserCredentials({
        avitoApiKey: newIntegrationApiKey.trim(),
        webhookSecret: newIntegrationWebhookSecret.trim() || undefined
      });

      // Затем создаем интеграцию
      const newIntegration = await AvitoService.createIntegration(
        newIntegrationName.trim(),
        newIntegrationPhone.trim()
      );
      
      setIntegrations(prev => [newIntegration, ...prev]);
      setNewIntegrationPhone('');
      setNewIntegrationName('');
      setNewIntegrationApiKey('');
      setNewIntegrationWebhookSecret('');
      setShowCreateIntegration(false);
      setSuccess('Интеграция с Авито успешно создана!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error creating integration:', error);
      setError(error instanceof Error ? error.message : 'Ошибка при создании интеграции');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDeleteIntegration = async (integrationId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту интеграцию? Это действие нельзя отменить.')) {
      return;
    }

    try {
      await AvitoService.deleteIntegration(integrationId);
      setIntegrations(prev => prev.filter(integration => integration.id !== integrationId));
      setSuccess('Интеграция успешно удалена');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error deleting integration:', error);
      setError('Ошибка при удалении интеграции');
    }
  };

  const handleConnectTwin = async (integrationId: string, twinId: string) => {
    try {
      await AvitoService.connectTwinToIntegration(integrationId, twinId);
      
      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { 
              ...integration, 
              connectedTwinId: twinId,
              connectedTwinName: twins.find(t => t.id === twinId)?.name || 'Неизвестный двойник'
            }
          : integration
      ));
      
      setShowConnectTwin(null);
      setSuccess('Двойник успешно подключен к интеграции!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error connecting twin:', error);
      setError('Ошибка при подключении двойника');
    }
  };

  const handleToggleAutoReply = async (integrationId: string, currentState: boolean) => {
    try {
      await AvitoService.updateIntegrationSettings(integrationId, { autoReply: !currentState });
      
      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId ? { ...integration, autoReply: !currentState } : integration
      ));
      
      setSuccess(`Автоответы ${!currentState ? 'включены' : 'отключены'}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating auto reply settings:', error);
      setError('Ошибка при изменении настроек автоответов');
    }
  };

  const handleToggleIntegrationStatus = async (integrationId: string, currentStatus: string) => {
    try {
      if (currentStatus === 'active') {
        await AvitoService.deactivateIntegration(integrationId);
        setIntegrations(prev => prev.map(integration => 
          integration.id === integrationId ? { ...integration, status: 'inactive' } : integration
        ));
        setSuccess('Интеграция деактивирована');
      } else {
        await AvitoService.activateIntegration(integrationId);
        setIntegrations(prev => prev.map(integration => 
          integration.id === integrationId ? { ...integration, status: 'active' } : integration
        ));
        setSuccess('Интеграция активирована');
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error toggling integration status:', error);
      setError('Ошибка при изменении статуса интеграции');
    }
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^\+7\d{10}$/;
    return phoneRegex.test(phone);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'inactive':
        return <Clock className="h-3 w-3 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-600" />;
      default:
        return <AlertCircle className="h-3 w-3 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Активна';
      case 'inactive':
        return 'Неактивна';
      case 'error':
        return 'Ошибка';
      default:
        return 'Неизвестно';
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center space-x-3">
          <Store className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Авито Интеграция</h1>
        </div>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Подключите своих цифровых двойников к Авито и позвольте им автоматически отвечать на сообщения покупателей
        </p>
        
        {/* Stats */}
        <div className="flex justify-center space-x-8 pt-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{integrations.length}</div>
            <div className="text-sm text-muted-foreground font-medium">Активных интеграций</div>
          </div>
          <Separator orientation="vertical" className="h-12" />
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              {integrations.reduce((sum, integration) => sum + integration.messagesCount, 0)}
            </div>
            <div className="text-sm text-muted-foreground font-medium">Сообщений обработано</div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-destructive font-medium">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="ml-auto text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-green-700 font-medium">{success}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSuccess(null)}
                className="ml-auto text-green-600 hover:text-green-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* How it Works */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Settings className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Как это работает</CardTitle>
              <CardDescription>Автоматические ответы на сообщения в Авито</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center space-y-3">
              <div className="p-4 bg-primary/10 rounded-2xl mx-auto w-fit">
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-semibold">1. Получение сообщения</h4>
              <p className="text-sm text-muted-foreground">Покупатель пишет сообщение в Авито</p>
            </div>
            <div className="text-center space-y-3">
              <div className="p-4 bg-blue-100 rounded-2xl mx-auto w-fit">
                <ShoppingBag className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="font-semibold">2. Анализ контекста</h4>
              <p className="text-sm text-muted-foreground">Система анализирует товар и сообщение</p>
            </div>
            <div className="text-center space-y-3">
              <div className="p-4 bg-green-100 rounded-2xl mx-auto w-fit">
                <Brain className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="font-semibold">3. Генерация ответа</h4>
              <p className="text-sm text-muted-foreground">ИИ-двойник создает персональный ответ</p>
            </div>
            <div className="text-center space-y-3">
              <div className="p-4 bg-orange-100 rounded-2xl mx-auto w-fit">
                <Send className="h-8 w-8 text-orange-600" />
              </div>
              <h4 className="font-semibold">4. Отправка ответа</h4>
              <p className="text-sm text-muted-foreground">Ответ автоматически отправляется покупателю</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Integration Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Plus className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Создать интеграцию с Авито</CardTitle>
                <CardDescription>Подключите аккаунт Авито для автоматических ответов</CardDescription>
              </div>
            </div>
            <Dialog open={showCreateIntegration} onOpenChange={setShowCreateIntegration}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Создать интеграцию
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Создать интеграцию с Авито</DialogTitle>
                  <DialogDescription>
                    Введите данные для подключения к аккаунту Авито
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-blue-900 mb-3">Инструкция по подключению:</h4>
                      <ol className="space-y-2 text-sm text-blue-800">
                        <li className="flex items-start space-x-2">
                          <span className="font-bold text-blue-600">1.</span>
                          <span>Получите доступ к API Авито для бизнеса</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="font-bold text-blue-600">2.</span>
                          <span>Обратитесь в <a href="https://business.avito.ru/" target="_blank" className="underline">Авито для бизнеса</a></span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="font-bold text-blue-600">3.</span>
                          <span>Подайте заявку на доступ к API</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="font-bold text-blue-600">4.</span>
                          <span>Получите API ключ и настройте webhook</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="font-bold text-blue-600">5.</span>
                          <span>Укажите webhook URL: <code className="bg-blue-100 px-1 rounded">https://npvowekjxsjubvaudaaj.supabase.co/functions/v1/avito-webhook</code></span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="font-bold text-blue-600">6.</span>
                          <span>Введите номер телефона из профиля Авито</span>
                        </li>
                      </ol>
                      
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <strong>Важно:</strong> Без доступа к официальному API Авито интеграция будет работать только в тестовом режиме.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Название интеграции</label>
                      <Input
                        value={newIntegrationName}
                        onChange={(e) => setNewIntegrationName(e.target.value)}
                        placeholder="Моя интеграция с Авито"
                        maxLength={50}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Номер телефона</label>
                      <Input
                        value={newIntegrationPhone}
                        onChange={(e) => setNewIntegrationPhone(e.target.value)}
                        placeholder="+79001234567"
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">API ключ Авито</label>
                      <Input
                        type="password"
                        value={newIntegrationApiKey}
                        onChange={(e) => setNewIntegrationApiKey(e.target.value)}
                        placeholder="Введите ваш API ключ от Авито"
                        className="font-mono text-sm w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Получите API ключ в <a href="https://business.avito.ru/" target="_blank" className="underline">Авито для бизнеса</a>
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Webhook Secret (опционально)</label>
                      <Input
                        type="password"
                        value={newIntegrationWebhookSecret}
                        onChange={(e) => setNewIntegrationWebhookSecret(e.target.value)}
                        placeholder="Секретный ключ для верификации webhook"
                        className="font-mono text-sm w-full"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Button
                      onClick={handleCreateIntegration}
                      disabled={!newIntegrationPhone.trim() || !newIntegrationName.trim() || !newIntegrationApiKey.trim() || isConnecting}
                      className="w-full"
                    >
                      {isConnecting ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Подключаем...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Store className="h-4 w-4" />
                          <span>Создать интеграцию</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Integrations List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground font-medium">Загружаем интеграции...</p>
          </div>
        </div>
      ) : integrations.length === 0 ? (
        <Card className="max-w-2xl mx-auto border-dashed border-2">
          <CardContent className="text-center py-16">
            <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Создайте первую интеграцию с Авито</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Подключите аккаунт Авито и позвольте вашему ИИ-двойнику автоматически отвечать покупателям
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Integrations Grid */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold">Активные интеграции</h3>
            <div className="space-y-4">
              {integrations.map((integration) => (
                <Card key={integration.id} className="hover:shadow-md transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Store className="h-5 w-5 text-primary" />
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-sm text-muted-foreground">{integration.phone}</span>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(integration.status)}
                              <Badge variant="outline" className={`text-xs ${getStatusColor(integration.status)}`}>
                                {getStatusText(integration.status)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteIntegration(integration.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Сообщений обработано:</span>
                        <span className="font-medium">{integration.messagesCount}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Подключенный двойник:</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {integration.connectedTwinName || 'Не подключен'}
                          </span>
                          {!integration.connectedTwinId && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowConnectTwin(integration.id)}
                              className="text-xs h-6 px-2"
                            >
                              Подключить
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Автоответы:</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleAutoReply(integration.id, integration.autoReply)}
                          className={`text-xs h-6 px-2 ${
                            integration.autoReply 
                              ? 'bg-green-50 text-green-700 border-green-300' 
                              : 'bg-gray-50 text-gray-700 border-gray-300'
                          }`}
                        >
                          {integration.autoReply ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <X className="h-3 w-3 mr-1" />
                          )}
                          {integration.autoReply ? 'Вкл' : 'Выкл'}
                        </Button>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Создана:</span>
                        <span className="font-medium">{formatDate(integration.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleToggleIntegrationStatus(integration.id, integration.status)}
                        className={integration.status === 'active' 
                          ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100' 
                          : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                        }
                      >
                        {integration.status === 'active' ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <Clock className="h-3 w-3 mr-1" />
                        )}
                        {integration.status === 'active' ? 'Активна' : 'Активировать'}
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-3 w-3 mr-1" />
                        Настроить
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open('https://www.avito.ru', '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Открыть Авито
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Messages */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold">Последние сообщения</h3>
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <MessageCircleMore className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Активность в Авито</CardTitle>
                    <CardDescription>Последние обработанные сообщения</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Пока нет сообщений</p>
                        <p className="text-sm text-muted-foreground">Сообщения появятся здесь после активности в Авито</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div key={message.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <MessageSquare className="h-4 w-4 text-primary" />
                              <div>
                                <h4 className="font-medium">{message.chatName}</h4>
                                <p className="text-xs text-muted-foreground">{formatDate(message.timestamp)}</p>
                                {message.itemTitle && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Товар: {message.itemTitle} {message.itemPrice && `(${message.itemPrice})`}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Badge variant="outline">
                              {message.isIncoming ? 'Входящее' : 'Исходящее'}
                            </Badge>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="p-3 bg-muted rounded-lg">
                              <p className="text-sm font-medium">Сообщение:</p>
                              <p className="text-sm mt-1">{message.messageText}</p>
                            </div>
                            
                            {message.responseText && (
                              <div className="p-3 bg-primary/5 rounded-lg">
                                <p className="text-sm font-medium">Ответ ИИ:</p>
                                <p className="text-sm mt-1">{message.responseText}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Connect Twin Modal */}
      {showConnectTwin && (
        <Dialog open={!!showConnectTwin} onOpenChange={() => setShowConnectTwin(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Подключить двойника</DialogTitle>
              <DialogDescription>
                Выберите цифрового двойника для подключения к интеграции
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {twins.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Нет доступных двойников</p>
                  <p className="text-sm text-muted-foreground">Создайте цифрового двойника для подключения</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {twins.map((twin) => (
                    <Button
                      key={twin.id}
                      variant="outline"
                      onClick={() => handleConnectTwin(showConnectTwin, twin.id)}
                      className="w-full justify-start"
                    >
                      <Brain className="h-4 w-4 mr-3" />
                      {twin.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Features Section */}
      <Card>
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center items-center space-x-3">
              <Award className="h-8 w-8 text-primary" />
              <h3 className="text-2xl font-bold">Возможности интеграции</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-3">
                <div className="p-4 bg-primary/10 rounded-2xl mx-auto w-fit">
                  <ShoppingBag className="h-8 w-8 text-primary" />
                </div>
                <h4 className="text-lg font-semibold">Автоматические ответы</h4>
                <p className="text-sm text-muted-foreground">ИИ-двойник автоматически отвечает на сообщения покупателей</p>
              </div>
              <div className="text-center space-y-3">
                <div className="p-4 bg-green-100 rounded-2xl mx-auto w-fit">
                  <Brain className="h-8 w-8 text-green-600" />
                </div>
                <h4 className="text-lg font-semibold">Умный анализ</h4>
                <p className="text-sm text-muted-foreground">Анализ товара и контекста для релевантных ответов</p>
              </div>
              <div className="text-center space-y-3">
                <div className="p-4 bg-purple-100 rounded-2xl mx-auto w-fit">
                  <Shield className="h-8 w-8 text-purple-600" />
                </div>
                <h4 className="text-lg font-semibold">Безопасность</h4>
                <p className="text-sm text-muted-foreground">Защищенное подключение и контроль доступа</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 