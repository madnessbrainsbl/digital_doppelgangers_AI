import React, { useState, useEffect } from 'react';
import { Send, Bot, MessageSquare, Settings, Zap, Shield, Globe, Users, CheckCircle, AlertCircle, Clock, Play, Pause, Volume2, VolumeX, Mic, Phone, MessageCircleMore, Smartphone, Wifi, Lock, Key, Link, Copy, ExternalLink, RefreshCw, Trash2, Edit3, Save, X, Sparkles, Brain, Star, Heart, Award, TrendingUp, Plus, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { TelegramBotService } from '../services/telegramBotService';
import { DigitalTwinService } from '../services/digitalTwinService';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

interface TelegramBot {
  id: string;
  name: string;
  username: string;
  token: string;
  status: 'active' | 'inactive' | 'error';
  connectedTwinId?: string;
  connectedTwinName?: string;
  messagesCount: number;
  voiceEnabled: boolean;
  createdAt: string;
  webhookUrl?: string;
}

interface TelegramMessage {
  id: string;
  chatId: string;
  chatName: string;
  messageText: string;
  isVoice: boolean;
  isIncoming: boolean;
  timestamp: string;
  responseText?: string;
  responseVoice?: boolean;
}

interface DigitalTwin {
  id: string;
  name: string;
}

export function TelegramIntegrationPage() {
  const { user } = useAuth();
  const [bots, setBots] = useState<TelegramBot[]>([]);
  const [twins, setTwins] = useState<DigitalTwin[]>([]);
  const [messages, setMessages] = useState<TelegramMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateBot, setShowCreateBot] = useState(false);
  const [newBotToken, setNewBotToken] = useState('');
  const [newBotName, setNewBotName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
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
        loadBots(),
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

  const loadBots = async () => {
    try {
      const botsList = await TelegramBotService.getAllBots();
      setBots(botsList);
    } catch (error) {
      console.error('Error loading bots:', error);
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
      const messagesList = await TelegramBotService.getRecentMessages(50);
      setMessages(messagesList);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleCreateBot = async () => {
    if (!newBotToken.trim() || !newBotName.trim()) {
      setError('Заполните все поля');
      return;
    }

    if (!validateBotToken(newBotToken.trim())) {
      setError('Неверный формат токена бота. Токен должен быть в формате: 123456789:AAEhBOweik9ai2o...');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const newBot = await TelegramBotService.createBot(
        newBotName.trim(),
        newBotToken.trim()
      );
      
      setBots(prev => [newBot, ...prev]);
      setNewBotToken('');
      setNewBotName('');
      setShowCreateBot(false);
      setSuccess('Бот успешно создан и подключен!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error creating bot:', error);
      setError(error instanceof Error ? error.message : 'Ошибка при создании бота');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDeleteBot = async (botId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого бота? Это действие нельзя отменить.')) {
      return;
    }

    try {
      await TelegramBotService.deleteBot(botId);
      setBots(prev => prev.filter(bot => bot.id !== botId));
      setSuccess('Бот успешно удален');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error deleting bot:', error);
      setError('Ошибка при удалении бота');
    }
  };

  const handleConnectTwin = async (botId: string, twinId: string) => {
    try {
      await TelegramBotService.connectTwinToBot(botId, twinId);
      
      setBots(prev => prev.map(bot => 
        bot.id === botId 
          ? { 
              ...bot, 
              connectedTwinId: twinId,
              connectedTwinName: twins.find(t => t.id === twinId)?.name || 'Неизвестный двойник'
            }
          : bot
      ));
      
      setShowConnectTwin(null);
      setSuccess('Двойник успешно подключен к боту!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error connecting twin:', error);
      setError('Ошибка при подключении двойника');
    }
  };

  const handleToggleVoice = async (botId: string, currentState: boolean) => {
    try {
      await TelegramBotService.updateBotSettings(botId, { voiceEnabled: !currentState });
      
      setBots(prev => prev.map(bot => 
        bot.id === botId ? { ...bot, voiceEnabled: !currentState } : bot
      ));
      
      setSuccess(`Голосовые ответы ${!currentState ? 'включены' : 'отключены'}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating voice settings:', error);
      setError('Ошибка при изменении настроек голоса');
    }
  };

  const validateBotToken = (token: string): boolean => {
    const tokenRegex = /^\d+:[A-Za-z0-9_-]{35}$/;
    return tokenRegex.test(token);
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
        return 'Активен';
      case 'inactive':
        return 'Неактивен';
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
          <Bot className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Telegram Bot API</h1>
        </div>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Подключите своих цифровых двойников к Telegram и позвольте им отвечать за вас в мессенджере с поддержкой голосовых сообщений
        </p>
        
        {/* Stats */}
        <div className="flex justify-center space-x-8 pt-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{bots.length}</div>
            <div className="text-sm text-muted-foreground font-medium">Активных ботов</div>
          </div>
          <Separator orientation="vertical" className="h-12" />
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              {bots.reduce((sum, bot) => sum + bot.messagesCount, 0)}
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
              <CardDescription>Полный цикл обработки сообщений в Telegram</CardDescription>
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
              <p className="text-sm text-muted-foreground">Бот получает текстовое или голосовое сообщение в Telegram</p>
            </div>
            <div className="text-center space-y-3">
              <div className="p-4 bg-purple-100 rounded-2xl mx-auto w-fit">
                <Mic className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="font-semibold">2. Распознавание речи</h4>
              <p className="text-sm text-muted-foreground">Голосовые сообщения преобразуются в текст с помощью STT</p>
            </div>
            <div className="text-center space-y-3">
              <div className="p-4 bg-green-100 rounded-2xl mx-auto w-fit">
                <Brain className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="font-semibold">3. Генерация ответа</h4>
              <p className="text-sm text-muted-foreground">ИИ-двойник генерирует персональный ответ в вашем стиле</p>
            </div>
            <div className="text-center space-y-3">
              <div className="p-4 bg-orange-100 rounded-2xl mx-auto w-fit">
                <Volume2 className="h-8 w-8 text-orange-600" />
              </div>
              <h4 className="font-semibold">4. Отправка ответа</h4>
              <p className="text-sm text-muted-foreground">Ответ отправляется текстом или голосом с клонированным голосом</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Bot Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Plus className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Создать Telegram бота</CardTitle>
                <CardDescription>Подключите нового бота для интеграции с вашими двойниками</CardDescription>
              </div>
            </div>
            <Dialog open={showCreateBot} onOpenChange={setShowCreateBot}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Создать бота
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Создать нового бота</DialogTitle>
                  <DialogDescription>
                    Введите данные для создания Telegram бота
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-blue-900 mb-3">Инструкция по созданию бота:</h4>
                      <ol className="space-y-2 text-sm text-blue-800">
                        <li className="flex items-start space-x-2">
                          <span className="font-bold text-blue-600">1.</span>
                          <span>Откройте Telegram и найдите @BotFather</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="font-bold text-blue-600">2.</span>
                          <span>Отправьте команду /newbot</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="font-bold text-blue-600">3.</span>
                          <span>Следуйте инструкциям и получите токен бота</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="font-bold text-blue-600">4.</span>
                          <span>Скопируйте токен и вставьте его ниже</span>
                        </li>
                      </ol>
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Название бота</label>
                      <Input
                        value={newBotName}
                        onChange={(e) => setNewBotName(e.target.value)}
                        placeholder="Мой AI Twin Bot"
                        maxLength={50}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Токен бота</label>
                      <Input
                        type="password"
                        value={newBotToken}
                        onChange={(e) => setNewBotToken(e.target.value)}
                        placeholder="1234567890:AAEhBOweik9ai2o..."
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Button
                      onClick={handleCreateBot}
                      disabled={!newBotToken.trim() || !newBotName.trim() || isConnecting}
                      className="flex-1"
                    >
                      {isConnecting ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Подключаем...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Bot className="h-4 w-4" />
                          <span>Создать и подключить</span>
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

      {/* Bots List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground font-medium">Загружаем ваших ботов...</p>
          </div>
        </div>
      ) : bots.length === 0 ? (
        <Card className="max-w-2xl mx-auto border-dashed border-2">
          <CardContent className="text-center py-16">
            <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Создайте своего первого Telegram бота</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Подключите бота к Telegram и позвольте вашему ИИ-двойнику отвечать за вас в мессенджере
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bots Grid */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold">Активные боты</h3>
            <div className="space-y-4">
              {bots.map((bot) => (
                <Card key={bot.id} className="hover:shadow-md transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Bot className="h-5 w-5 text-primary" />
                        <div>
                          <CardTitle className="text-lg">{bot.name}</CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-sm text-muted-foreground">@{bot.username}</span>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(bot.status)}
                              <Badge variant="outline" className={`text-xs ${getStatusColor(bot.status)}`}>
                                {getStatusText(bot.status)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBot(bot.id)}
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
                        <span className="font-medium">{bot.messagesCount}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Подключенный двойник:</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {bot.connectedTwinName || 'Не подключен'}
                          </span>
                          {!bot.connectedTwinId && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowConnectTwin(bot.id)}
                              className="text-xs h-6 px-2"
                            >
                              Подключить
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Голосовые ответы:</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleVoice(bot.id, bot.voiceEnabled)}
                          className={`text-xs h-6 px-2 ${
                            bot.voiceEnabled 
                              ? 'bg-green-50 text-green-700 border-green-300' 
                              : 'bg-gray-50 text-gray-700 border-gray-300'
                          }`}
                        >
                          {bot.voiceEnabled ? (
                            <Volume2 className="h-3 w-3 mr-1" />
                          ) : (
                            <VolumeX className="h-3 w-3 mr-1" />
                          )}
                          {bot.voiceEnabled ? 'Вкл' : 'Выкл'}
                        </Button>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Создан:</span>
                        <span className="font-medium">{formatDate(bot.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                      <Button size="sm" variant="outline">
                        <Settings className="h-3 w-3 mr-1" />
                        Настроить
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`https://t.me/${bot.username}`, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Открыть в Telegram
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
                    <CardTitle>Активность ботов</CardTitle>
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
                        <p className="text-sm text-muted-foreground">Сообщения появятся здесь после активности ботов</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div key={message.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              {message.isVoice ? (
                                <Mic className="h-4 w-4 text-primary" />
                              ) : (
                                <MessageSquare className="h-4 w-4 text-primary" />
                              )}
                              <div>
                                <h4 className="font-medium">{message.chatName}</h4>
                                <p className="text-xs text-muted-foreground">{formatDate(message.timestamp)}</p>
                              </div>
                            </div>
                            <Badge variant="outline">
                              {message.isVoice ? 'Голос' : 'Текст'}
                            </Badge>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="p-3 bg-muted rounded-lg">
                              <p className="text-sm font-medium">Входящее:</p>
                              <p className="text-sm mt-1">{message.messageText}</p>
                            </div>
                            
                            {message.responseText && (
                              <div className="p-3 bg-primary/5 rounded-lg">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-sm font-medium">Ответ ИИ:</p>
                                  {message.responseVoice && (
                                    <Badge variant="outline" className="text-xs">
                                      <Volume2 className="h-2 w-2 mr-1" />
                                      Голос
                                    </Badge>
                                  )}
                                </div>
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
                Выберите цифрового двойника для подключения к боту
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
                  <Mic className="h-8 w-8 text-primary" />
                </div>
                <h4 className="text-lg font-semibold">Голосовые сообщения</h4>
                <p className="text-sm text-muted-foreground">Автоматическое распознавание речи и ответы клонированным голосом</p>
              </div>
              <div className="text-center space-y-3">
                <div className="p-4 bg-green-100 rounded-2xl mx-auto w-fit">
                  <Brain className="h-8 w-8 text-green-600" />
                </div>
                <h4 className="text-lg font-semibold">Персональные ответы</h4>
                <p className="text-sm text-muted-foreground">ИИ отвечает в вашем стиле на основе анализа переписок</p>
              </div>
              <div className="text-center space-y-3">
                <div className="p-4 bg-purple-100 rounded-2xl mx-auto w-fit">
                  <Shield className="h-8 w-8 text-purple-600" />
                </div>
                <h4 className="text-lg font-semibold">Безопасность</h4>
                <p className="text-sm text-muted-foreground">Шифрование данных и контроль доступа к вашим двойникам</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}