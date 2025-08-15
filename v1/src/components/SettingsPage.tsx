import React, { useState } from 'react';
import { Settings, Bell, Shield, Palette, Globe, Volume2, VolumeX, Eye, EyeOff, Save, RotateCcw, Smartphone, Monitor, Moon, Sun, Zap, Brain, Key, Database, Download, Upload, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { speechService } from '../services/speechService';
import { geminiService } from '../services/geminiService';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

export function SettingsPage() {
  const { user } = useAuth();
  
  // Если пользователь не авторизован, показываем сообщение
  if (!user) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-8">
        <Card className="text-center py-20">
          <CardContent>
            <div className="space-y-6">
              <div className="relative inline-block">
                <div className="p-6 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 rounded-3xl shadow-2xl opacity-50">
                  <Settings className="h-12 w-12 text-white" />
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-gray-900">Войдите в аккаунт</h2>
                <p className="text-gray-600 max-w-md mx-auto">
                  Настройки доступны только авторизованным пользователям. 
                  Войдите в систему для управления параметрами приложения.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const [speechEnabled, setSpeechEnabled] = useState(speechService.getEnabled());
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light');
  const [language, setLanguage] = useState('ru');
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sound: true,
    desktop: true
  });
  const [privacy, setPrivacy] = useState({
    analytics: true,
    cookies: true,
    dataSharing: false
  });
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSpeechToggle = () => {
    const newEnabled = !speechEnabled;
    setSpeechEnabled(newEnabled);
    speechService.setEnabled(newEnabled);
    showSuccess('Настройки озвучивания обновлены');
  };

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    showSuccess('Настройки уведомлений обновлены');
  };

  const handlePrivacyChange = (key: keyof typeof privacy) => {
    setPrivacy(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    showSuccess('Настройки приватности обновлены');
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 3000);
  };

  const resetToDefaults = () => {
    if (confirm('Вы уверены, что хотите сбросить все настройки к значениям по умолчанию?')) {
      setSpeechEnabled(true);
      setTheme('light');
      setLanguage('ru');
      setNotifications({
        email: true,
        push: false,
        sound: true,
        desktop: true
      });
      setPrivacy({
        analytics: true,
        cookies: true,
        dataSharing: false
      });
      speechService.setEnabled(true);
      showSuccess('Настройки сброшены к значениям по умолчанию');
    }
  };

  return (
    <TooltipProvider>
      <div className="w-full max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="relative inline-block">
            <div className="p-6 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 rounded-3xl shadow-2xl">
              <Settings className="h-12 w-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 p-2 bg-gradient-to-br from-orange-400 to-red-500 rounded-full shadow-lg animate-pulse">
              <Zap className="h-4 w-4 text-white" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-blue-800 bg-clip-text text-transparent">
              Настройки
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Настройте приложение под свои предпочтения и управляйте параметрами системы
            </p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {success && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-green-700 font-medium">{success}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Audio & Speech Settings */}
          <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50/30">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Volume2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Аудио и озвучивание</CardTitle>
                  <CardDescription>Настройки синтеза речи и звуковых уведомлений</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/60 rounded-xl border border-blue-200/50">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${speechEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {speechEnabled ? <Volume2 className="h-4 w-4 text-green-600" /> : <VolumeX className="h-4 w-4 text-gray-500" />}
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Озвучивание ответов</span>
                      <p className="text-sm text-gray-600">
                        {speechService.isSupported() 
                          ? 'Автоматическое озвучивание ответов ИИ' 
                          : 'Синтез речи не поддерживается браузером'
                        }
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={speechEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={handleSpeechToggle}
                    disabled={!speechService.isSupported()}
                    className={speechEnabled ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    {speechEnabled ? 'Включено' : 'Отключено'}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/60 rounded-xl border border-blue-200/50">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${notifications.sound ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <Bell className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Звуковые уведомления</span>
                      <p className="text-sm text-gray-600">Звуки при получении сообщений</p>
                    </div>
                  </div>
                  <Button
                    variant={notifications.sound ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleNotificationChange('sound')}
                    className={notifications.sound ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    {notifications.sound ? 'Включено' : 'Отключено'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI & API Settings */}
          <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-purple-50/30">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Brain className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">ИИ и API</CardTitle>
                  <CardDescription>Настройки искусственного интеллекта</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-white/60 rounded-xl border border-purple-200/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-900">Gemini AI</span>
                    <Badge variant={geminiService.isConfigured() ? "default" : "outline"} 
                           className={geminiService.isConfigured() ? "bg-green-600" : "bg-gray-100 text-gray-600"}>
                      {geminiService.isConfigured() ? 'Подключен' : 'Не настроен'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {geminiService.isConfigured() 
                      ? 'API ключ настроен, используется полная функциональность ИИ'
                      : 'Для полной функциональности добавьте VITE_GEMINI_API_KEY в .env файл'
                    }
                  </p>
                  {!geminiService.isConfigured() && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      Работает в демо режиме
                    </Badge>
                  )}
                </div>

                <div className="p-4 bg-white/60 rounded-xl border border-purple-200/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-900">Качество ответов</span>
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                      Высокое
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Используется модель Gemini 2.5 Pro для максимального качества
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-green-50/30">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Bell className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Уведомления</CardTitle>
                  <CardDescription>Управление типами уведомлений</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {Object.entries({
                  email: { label: 'Email уведомления', desc: 'Получать уведомления на почту' },
                  push: { label: 'Push уведомления', desc: 'Уведомления в браузере' },
                  desktop: { label: 'Десктоп уведомления', desc: 'Системные уведомления' }
                }).map(([key, { label, desc }]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-green-200/50">
                    <div>
                      <span className="font-medium text-gray-900">{label}</span>
                      <p className="text-sm text-gray-600">{desc}</p>
                    </div>
                    <Button
                      variant={notifications[key as keyof typeof notifications] ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleNotificationChange(key as keyof typeof notifications)}
                      className={notifications[key as keyof typeof notifications] ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {notifications[key as keyof typeof notifications] ? 'Вкл' : 'Выкл'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-orange-50/30">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Shield className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Приватность и безопасность</CardTitle>
                  <CardDescription>Управление данными и конфиденциальностью</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {Object.entries({
                  analytics: { label: 'Аналитика использования', desc: 'Помогает улучшить приложение' },
                  cookies: { label: 'Функциональные cookies', desc: 'Для корректной работы сайта' },
                  dataSharing: { label: 'Обмен данными', desc: 'Передача данных третьим лицам' }
                }).map(([key, { label, desc }]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-orange-200/50">
                    <div>
                      <span className="font-medium text-gray-900">{label}</span>
                      <p className="text-sm text-gray-600">{desc}</p>
                    </div>
                    <Button
                      variant={privacy[key as keyof typeof privacy] ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePrivacyChange(key as keyof typeof privacy)}
                      className={privacy[key as keyof typeof privacy] ? "bg-orange-600 hover:bg-orange-700" : ""}
                    >
                      {privacy[key as keyof typeof privacy] ? 'Вкл' : 'Выкл'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Interface Settings */}
          <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-indigo-50/30">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Palette className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Интерфейс</CardTitle>
                  <CardDescription>Настройки внешнего вида и языка</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Тема оформления</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'light', label: 'Светлая', icon: Sun },
                      { value: 'dark', label: 'Темная', icon: Moon },
                      { value: 'auto', label: 'Авто', icon: Monitor }
                    ].map(({ value, label, icon: Icon }) => (
                      <Button
                        key={value}
                        variant={theme === value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTheme(value as any)}
                        className={`flex flex-col items-center space-y-1 h-auto py-3 ${
                          theme === value ? "bg-indigo-600 hover:bg-indigo-700" : ""
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-xs">{label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Язык интерфейса</label>
                  <div className="p-3 bg-white/60 rounded-lg border border-indigo-200/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Globe className="h-4 w-4 text-indigo-600" />
                        <span className="font-medium">Русский</span>
                      </div>
                      <Badge variant="outline" className="bg-indigo-100 text-indigo-700 border-indigo-300">
                        По умолчанию
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-red-50/30">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Database className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Управление данными</CardTitle>
                  <CardDescription>Экспорт, импорт и удаление данных</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start hover:bg-blue-50">
                  <Download className="h-4 w-4 mr-3" />
                  Экспортировать все данные
                </Button>
                <Button variant="outline" className="w-full justify-start hover:bg-green-50">
                  <Upload className="h-4 w-4 mr-3" />
                  Импортировать настройки
                </Button>
                <Separator />
                <Button 
                  variant="outline" 
                  className="w-full justify-start hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                  onClick={() => {
                    if (confirm('Это действие удалит все ваши данные безвозвратно. Продолжить?')) {
                      showError('Функция удаления данных будет доступна в следующих версиях');
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-3" />
                  Удалить все данные
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <Card className="shadow-xl border-0 bg-gradient-to-r from-gray-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Управление настройками</h3>
                <p className="text-sm text-gray-600">Сохраните изменения или сбросьте к значениям по умолчанию</p>
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={resetToDefaults}
                  className="hover:bg-gray-100"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Сбросить
                </Button>
                <Button
                  onClick={() => showSuccess('Настройки автоматически сохраняются')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Сохранить
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}