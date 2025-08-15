import React, { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle, ArrowLeft, CheckCircle, Info, Sparkles, Brain, Zap, Clock, Cpu, Globe, TrendingUp, Shield, Infinity, Crown, Target, Rocket, Users, Award, Star, Heart, MessageCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

interface FileUploadProps {
  onFileUpload: (content: string) => void;
  isLoading?: boolean;
  onBack?: () => void;
}

export function FileUpload({ onFileUpload, isLoading, onBack }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    if (file.type !== 'application/json') {
      setError('Пожалуйста, загрузите JSON файл');
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setError('Файл слишком большой. Максимальный размер: 50MB');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onFileUpload(content);
    };
    reader.readAsText(file);
  }, [onFileUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-8">
        {/* Premium Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white px-8 py-3 rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300">
            <Crown className="h-5 w-5" />
            <span className="text-sm font-bold tracking-wide">CREATE NEW TWIN</span>
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
        </div>

        {/* Main Icon */}
        <div className="relative inline-block">
          <div className="p-8 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl shadow-2xl transform hover:scale-105 transition-all duration-300">
            <Brain className="h-16 w-16 text-white" />
          </div>
          <div className="absolute -top-3 -right-3 p-3 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full shadow-xl animate-bounce">
            <Rocket className="h-5 w-5 text-white" />
          </div>
          <div className="absolute -bottom-2 -left-2 p-2 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full shadow-lg animate-pulse">
            <Target className="h-4 w-4 text-white" />
          </div>
        </div>
        
        <div className="space-y-6">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-800 bg-clip-text text-transparent leading-tight">
            Создание цифрового двойника
          </h1>
          <div className="flex justify-center items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-full border border-blue-200">
              <Cpu className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-700">Gemini 2.5 Pro</span>
            </div>
            <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-2 rounded-full border border-purple-200">
              <Shield className="h-4 w-4 text-purple-600" />
              <span className="font-medium text-purple-700">Enterprise Security</span>
            </div>
            <div className="flex items-center space-x-2 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-full border border-green-200">
              <Infinity className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-700">Unlimited Scale</span>
            </div>
          </div>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Загрузите экспорт переписок из Telegram и получите персонального ИИ-ассистента, который общается точно как вы. 
            Наша система проанализирует ваш стиль общения и создаст уникального цифрового двойника.
          </p>
        </div>

        {/* Enhanced Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto pt-12">
          <Card className="text-center p-8 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <div className="p-4 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl w-fit mx-auto mb-4">
              <Brain className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">AI</div>
            <div className="text-sm text-emerald-700 font-semibold">Анализ стиля</div>
          </Card>
          <Card className="text-center p-8 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <div className="p-4 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl w-fit mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-blue-600" />
            </div>
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">∞</div>
            <div className="text-sm text-blue-700 font-semibold">Сообщений</div>
          </Card>
          <Card className="text-center p-8 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <div className="p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl w-fit mx-auto mb-4">
              <Target className="h-8 w-8 text-purple-600" />
            </div>
            <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">99.9%</div>
            <div className="text-sm text-purple-700 font-semibold">Точность</div>
          </Card>
          <Card className="text-center p-8 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <div className="p-4 bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl w-fit mx-auto mb-4">
              <Zap className="h-8 w-8 text-orange-600" />
            </div>
            <div className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">5min</div>
            <div className="text-sm text-orange-700 font-semibold">Создание</div>
          </Card>
        </div>
      </div>

      {/* Back Button */}
      {onBack && (
        <div className="flex justify-start">
          <Button
            variant="outline"
            onClick={onBack}
            className="hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-50 transition-all duration-300 border-slate-200 text-slate-700 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к списку двойников
          </Button>
        </div>
      )}

      {/* Upload Card */}
      <Card className={`border-2 border-dashed transition-all duration-300 ${
        dragActive
          ? 'border-emerald-400 bg-emerald-50 shadow-2xl transform scale-105'
          : 'border-slate-300 hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-xl'
      }`}>
        <CardContent className="p-0">
          <div
            className="relative p-16 text-center cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isLoading}
            />
            
            <div className="flex flex-col items-center space-y-8">
              <div className={`p-8 rounded-3xl transition-all duration-300 ${
                dragActive ? 'bg-emerald-100 scale-110 shadow-2xl' : 'bg-gradient-to-br from-emerald-100 to-teal-100 shadow-xl'
              }`}>
                <Upload className={`h-20 w-20 transition-colors duration-300 ${
                  dragActive ? 'text-emerald-600' : 'text-emerald-500'
                }`} />
              </div>
              
              <div className="space-y-4">
                <CardTitle className="text-4xl font-bold">
                  {dragActive ? 'Отпустите файл здесь' : 'Загрузите экспорт Telegram'}
                </CardTitle>
                <CardDescription className="text-xl max-w-2xl leading-relaxed text-slate-600">
                  Перетащите JSON файл с экспортом переписок или нажмите для выбора файла
                </CardDescription>
              </div>
              
              <div className="flex items-center space-x-6">
                <Badge variant="outline" className="flex items-center space-x-2 px-6 py-3 bg-emerald-50 text-emerald-700 border-emerald-200 text-sm font-semibold">
                  <FileText className="h-5 w-5" />
                  <span className="font-medium">JSON формат</span>
                </Badge>
                <Badge variant="outline" className="px-6 py-3 bg-teal-50 text-teal-700 border-teal-200 text-sm font-semibold">
                  <span className="font-medium">До 50MB</span>
                </Badge>
                <Badge variant="outline" className="px-6 py-3 bg-blue-50 text-blue-700 border-blue-200 text-sm font-semibold">
                  <span className="font-medium">Безопасно</span>
                </Badge>
              </div>
            </div>

            {isLoading && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                <div className="flex flex-col items-center space-y-6">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-teal-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-emerald-700 font-bold text-lg">Анализируем ваши сообщения...</p>
                    <p className="text-emerald-600 text-sm">Создаем уникальный профиль общения</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Card className="border-red-200/50 bg-gradient-to-r from-red-50/50 to-pink-50/50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-red-100 to-pink-100 rounded-xl">
                <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
              </div>
              <div>
                <CardTitle className="text-red-800 text-lg mb-1 font-bold">Ошибка загрузки</CardTitle>
                <CardDescription className="text-red-700 font-medium">{error}</CardDescription>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Features Card */}
      <Card className="bg-gradient-to-r from-emerald-50/50 to-teal-50/50 border-emerald-200/50 shadow-xl">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl">
              <Zap className="h-6 w-6 text-emerald-600" />
            </div>
            <CardTitle className="text-emerald-900 text-xl font-bold">Возможности ИИ-анализа</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="font-bold text-emerald-800 text-lg">Автоматический анализ:</h4>
              <ol className="space-y-4 text-emerald-700">
                <li className="flex items-start space-x-3">
                  <Badge variant="outline" className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border-emerald-300 min-w-[28px] h-7 flex items-center justify-center text-xs font-bold">1</Badge>
                  <span className="font-semibold">Стиль общения и манера речи</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Badge variant="outline" className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border-emerald-300 min-w-[28px] h-7 flex items-center justify-center text-xs font-bold">2</Badge>
                  <span className="font-semibold">Часто используемые фразы и выражения</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Badge variant="outline" className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border-emerald-300 min-w-[28px] h-7 flex items-center justify-center text-xs font-bold">3</Badge>
                  <span className="font-semibold">Интересы и предпочтения</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Badge variant="outline" className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border-emerald-300 min-w-[28px] h-7 flex items-center justify-center text-xs font-bold">4</Badge>
                  <span className="font-semibold">Паттерны ответов и реакций</span>
                </li>
              </ol>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-bold text-emerald-800 text-lg">Генерация промпта:</h4>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                  <Brain className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <span className="text-sm font-semibold text-emerald-800">Gemini 2.5 Pro создает уникальный системный промпт</span>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                  <Sparkles className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <span className="text-sm font-semibold text-emerald-800">Адаптация под ваш стиль общения</span>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <span className="text-sm font-semibold text-emerald-800">Готовый к использованию двойник</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions Card */}
      <Card className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-blue-200/50 shadow-xl">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
              <Info className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-blue-900 text-xl font-bold">Как получить экспорт Telegram</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="font-bold text-blue-800 text-lg">Telegram Desktop:</h4>
              <ol className="space-y-4 text-blue-700">
                <li className="flex items-start space-x-3">
                  <Badge variant="outline" className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-300 min-w-[28px] h-7 flex items-center justify-center text-xs font-bold">1</Badge>
                  <span className="font-semibold">Откройте Telegram Desktop</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Badge variant="outline" className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-300 min-w-[28px] h-7 flex items-center justify-center text-xs font-bold">2</Badge>
                  <span className="font-semibold">Настройки → Дополнительно → Экспорт данных</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Badge variant="outline" className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-300 min-w-[28px] h-7 flex items-center justify-center text-xs font-bold">3</Badge>
                  <span className="font-semibold">Выберите чаты для экспорта</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Badge variant="outline" className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-300 min-w-[28px] h-7 flex items-center justify-center text-xs font-bold">4</Badge>
                  <span className="font-semibold">Формат: JSON, Медиа: не включать</span>
                </li>
              </ol>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-bold text-blue-800 text-lg">Рекомендации:</h4>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <span className="text-sm font-semibold text-blue-800">Экспортируйте 3-5 активных чатов</span>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <span className="text-sm font-semibold text-blue-800">Минимум 100-200 ваших сообщений</span>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <span className="text-sm font-semibold text-blue-800">Разнообразные типы общения</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="text-center bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <CardContent className="p-8">
            <div className="p-4 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Brain className="h-10 w-10 text-emerald-600" />
            </div>
            <CardTitle className="text-xl mb-3 font-bold text-emerald-800">Умный анализ</CardTitle>
            <CardDescription className="text-emerald-700 font-medium">
              ИИ анализирует ваш стиль общения, манеру речи и поведенческие паттерны с высокой точностью
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="text-center bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <CardContent className="p-8">
            <div className="p-4 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-blue-600" />
            </div>
            <CardTitle className="text-xl mb-3 font-bold text-blue-800">Автоматическая настройка</CardTitle>
            <CardDescription className="text-blue-700 font-medium">
              Gemini создает персональный системный промпт на основе глубокого анализа ваших данных
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="text-center bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <CardContent className="p-8">
            <div className="p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Zap className="h-10 w-10 text-purple-600" />
            </div>
            <CardTitle className="text-xl mb-3 font-bold text-purple-800">Готов к работе</CardTitle>
            <CardDescription className="text-purple-700 font-medium">
              Двойник сразу готов к общению и может отвечать в вашем уникальном стиле
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}