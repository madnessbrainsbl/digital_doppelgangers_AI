import React, { useState, useEffect } from 'react';
import { Settings, Zap, Clock, Type, Brain, Save, RotateCcw, Play, Pause, Timer } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { CalendarService, CalendarContact, CreateEventData, ExtractedEventInfo } from '../services/calendarService';
import { DigitalTwinService } from '../services/digitalTwinService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { responseTimerService, type ResponseSpeedSettings as ResponseSpeedSettingsType } from '../services/responseTimerService';

interface ResponseSpeedSettingsModalProps {
  onClose: () => void;
}

export function ResponseSpeedSettings({ onClose }: ResponseSpeedSettingsModalProps) {
  const [settings, setSettings] = useState<ResponseSpeedSettingsType>(responseTimerService.getSettings());
  const [currentProfile, setCurrentProfile] = useState<string>('normal');
  const [isTestMode, setIsTestMode] = useState(false);
  const [testText, setTestText] = useState('Привет! Это тестовое сообщение для проверки скорости ответа. Как дела?');
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testProgress, setTestProgress] = useState('');

  useEffect(() => {
    // Загружаем сохраненные настройки
    responseTimerService.loadSettings();
    setSettings(responseTimerService.getSettings());
  }, []);

  const speedProfiles = [
    {
      id: 'instant',
      name: 'Мгновенно',
      description: 'Ответы без задержек',
      icon: Zap,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'fast',
      name: 'Быстро',
      description: 'Быстрые ответы',
      icon: Zap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'normal',
      name: 'Обычно',
      description: 'Стандартная скорость',
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      id: 'slow',
      name: 'Медленно',
      description: 'Медленные ответы',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      id: 'very-slow',
      name: 'Очень медленно',
      description: 'Очень медленные ответы',
      icon: Timer,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      id: 'realistic',
      name: 'Реалистично',
      description: 'Как у реального человека',
      icon: Brain,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    }
  ];

  const handleProfileChange = (profileId: string) => {
    setCurrentProfile(profileId);
    responseTimerService.setSpeedProfile(profileId as any);
    setSettings(responseTimerService.getSettings());
  };

  const handleSettingChange = (key: keyof ResponseSpeedSettingsType, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    responseTimerService.setSettings(newSettings);
  };

  const handleSave = () => {
    responseTimerService.saveSettings();
    onClose();
  };

  const handleReset = () => {
    responseTimerService.setSpeedProfile('normal');
    setSettings(responseTimerService.getSettings());
    setCurrentProfile('normal');
  };

  const runTest = async () => {
    if (isTestRunning) return;

    setIsTestRunning(true);
    setTestProgress('');

    await responseTimerService.simulateTyping(
      testText,
      (partialText, isComplete) => {
        setTestProgress(partialText);
        if (isComplete) {
          setIsTestRunning(false);
        }
      },
      () => {
        setIsTestRunning(false);
      }
    );
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}мс`;
    return `${(ms / 1000).toFixed(1)}с`;
  };

  const calculateTotalTime = () => {
    return responseTimerService.calculateTotalResponseTime(testText.length);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Настройки скорости ответа</CardTitle>
                <CardDescription>
                  Настройте, как быстро двойники будут отвечать на сообщения
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Профили скорости */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Профили скорости</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {speedProfiles.map((profile) => {
                const Icon = profile.icon;
                return (
                  <Card
                    key={profile.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      currentProfile === profile.id
                        ? `${profile.bgColor} ${profile.borderColor} border-2`
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleProfileChange(profile.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${profile.bgColor}`}>
                          <Icon className={`h-4 w-4 ${profile.color}`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{profile.name}</h4>
                          <p className="text-sm text-gray-600">{profile.description}</p>
                        </div>
                        {currentProfile === profile.id && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            Активен
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Детальные настройки */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Детальные настройки</h3>
            
            {/* Задержки */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Задержки</span>
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Минимальная задержка</label>
                  <div className="flex items-center space-x-3">
                    <Slider
                      value={[settings.minDelay]}
                      onValueChange={([value]) => handleSettingChange('minDelay', value)}
                      max={5000}
                      step={100}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 min-w-[60px]">
                      {formatTime(settings.minDelay)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Максимальная задержка</label>
                  <div className="flex items-center space-x-3">
                    <Slider
                      value={[settings.maxDelay]}
                      onValueChange={([value]) => handleSettingChange('maxDelay', value)}
                      max={10000}
                      step={100}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 min-w-[60px]">
                      {formatTime(settings.maxDelay)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Время размышления</label>
                <div className="flex items-center space-x-3">
                  <Slider
                    value={[settings.thinkingTime]}
                    onValueChange={([value]) => handleSettingChange('thinkingTime', value)}
                    max={10000}
                    step={100}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600 min-w-[60px]">
                    {formatTime(settings.thinkingTime)}
                  </span>
                </div>
              </div>
            </div>

            {/* Скорость печати */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center space-x-2">
                <Type className="h-4 w-4" />
                <span>Скорость печати</span>
              </h4>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Символов в секунду</label>
                <div className="flex items-center space-x-3">
                  <Slider
                    value={[settings.typingSpeed]}
                    onValueChange={([value]) => handleSettingChange('typingSpeed', value)}
                    max={200}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600 min-w-[60px]">
                    {settings.typingSpeed} с/с
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Примерное время печати: {formatTime(responseTimerService.calculateTypingTime(100))} для 100 символов
                </p>
              </div>
            </div>

            {/* Переключатели */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center space-x-2">
                <Brain className="h-4 w-4" />
                <span>Дополнительные опции</span>
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Задержка размышления</label>
                    <p className="text-xs text-gray-500">Добавляет время "размышления" перед ответом</p>
                  </div>
                  <Switch
                    checked={settings.enableThinkingDelay}
                    onCheckedChange={(checked) => handleSettingChange('enableThinkingDelay', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Индикатор печати</label>
                    <p className="text-xs text-gray-500">Показывает текст по мере "печати"</p>
                  </div>
                  <Switch
                    checked={settings.enableTypingIndicator}
                    onCheckedChange={(checked) => handleSettingChange('enableTypingIndicator', checked)}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Тестирование */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Тестирование</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Тестовое сообщение</label>
                <textarea
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  rows={2}
                  placeholder="Введите текст для тестирования..."
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Ожидаемое время ответа</p>
                  <p className="text-xs text-gray-600">
                    {formatTime(calculateTotalTime())} ({testText.length} символов)
                  </p>
                </div>
                <Button
                  onClick={runTest}
                  disabled={isTestRunning}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isTestRunning ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Тестирование...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Запустить тест
                    </>
                  )}
                </Button>
              </div>

              {isTestRunning && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 mb-2">Симуляция ответа:</p>
                  <p className="text-sm text-blue-700">{testProgress}</p>
                </div>
              )}
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Сбросить
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4 mr-2" />
              Сохранить
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 