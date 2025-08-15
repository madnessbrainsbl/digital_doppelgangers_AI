import React, { useState, useRef } from 'react';
import { X, Upload, Brain, MessageCircle, BarChart3, CheckCircle, AlertCircle, Loader2, Sparkles, TrendingUp, Zap, Target } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { DigitalTwinData } from '../types/telegram';
import { parseTelegramJSON, extractUserMessages, analyzeUserProfile } from '../utils/telegramParser';

interface RetrainTwinModalProps {
  twin: DigitalTwinData;
  onClose: () => void;
  onRetrainComplete: (updatedTwin: DigitalTwinData) => void;
}

interface AnalysisProgress {
  stage: 'upload' | 'parsing' | 'extracting' | 'analyzing' | 'updating' | 'complete';
  progress: number;
  message: string;
  details?: string;
}

export function RetrainTwinModal({ twin, onClose, onRetrainComplete }: RetrainTwinModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState<AnalysisProgress>({
    stage: 'upload',
    progress: 0,
    message: 'Готов к анализу'
  });
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setProgress({
      stage: 'upload',
      progress: 10,
      message: 'Загружаем файл...'
    });

    try {
      // Читаем файл
      const content = await file.text();
      
      setProgress({
        stage: 'parsing',
        progress: 20,
        message: 'Парсим JSON файл...',
        details: 'Анализируем структуру данных'
      });

      // Парсим JSON
      const exports = parseTelegramJSON(content);
      
      setProgress({
        stage: 'extracting',
        progress: 40,
        message: 'Извлекаем сообщения пользователя...',
        details: `Найдено ${exports.length} чатов`
      });

      // Извлекаем сообщения пользователя
      const userMessages = extractUserMessages(exports);
      
      setProgress({
        stage: 'analyzing',
        progress: 60,
        message: 'Анализируем стиль общения...',
        details: `Обрабатываем ${userMessages.length} сообщений`
      });

      // Анализируем профиль
      const newProfile = analyzeUserProfile(userMessages);
      
      setProgress({
        stage: 'analyzing',
        progress: 80,
        message: 'Сравниваем с текущим профилем...',
        details: 'Выявляем изменения в стиле общения'
      });

      // Сравниваем с текущим профилем
      const comparison = compareProfiles(twin.profile, newProfile);
      
      setProgress({
        stage: 'updating',
        progress: 90,
        message: 'Обновляем профиль двойника...',
        details: 'Интегрируем новые данные'
      });

      // Создаем обновленный профиль
      const updatedProfile = mergeProfiles(twin.profile, newProfile);
      
      setProgress({
        stage: 'complete',
        progress: 100,
        message: 'Дообучение завершено!',
        details: 'Двойник обновлен новыми данными'
      });

      setAnalysisResults({
        newMessages: userMessages.length,
        newInterests: newProfile.interests.filter(interest => !twin.profile.interests.includes(interest)),
        styleChanges: comparison.styleChanges,
        updatedProfile
      });

      // Обновляем двойника
      const updatedTwin: DigitalTwinData = {
        ...twin,
        profile: updatedProfile,
        messagesCount: twin.messagesCount + userMessages.length
      };

      onRetrainComplete(updatedTwin);

    } catch (error) {
      console.error('Error during retraining:', error);
      setProgress({
        stage: 'upload',
        progress: 0,
        message: 'Ошибка при анализе файла',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const compareProfiles = (oldProfile: any, newProfile: any) => {
    const styleChanges = [];
    
    if (oldProfile.communicationStyle !== newProfile.communicationStyle) {
      styleChanges.push(`Стиль общения: ${oldProfile.communicationStyle} → ${newProfile.communicationStyle}`);
    }
    
    if (oldProfile.vocabularyComplexity !== newProfile.vocabularyComplexity) {
      styleChanges.push(`Сложность словаря: ${oldProfile.vocabularyComplexity} → ${newProfile.vocabularyComplexity}`);
    }
    
    if (oldProfile.formalityLevel !== newProfile.formalityLevel) {
      styleChanges.push(`Формальность: ${oldProfile.formalityLevel} → ${newProfile.formalityLevel}`);
    }

    return { styleChanges };
  };

  const mergeProfiles = (oldProfile: any, newProfile: any) => {
    return {
      ...oldProfile,
      totalMessages: oldProfile.totalMessages + newProfile.totalMessages,
      interests: [...new Set([...oldProfile.interests, ...newProfile.interests])],
      sampleMessages: [...oldProfile.sampleMessages, ...newProfile.sampleMessages].slice(0, 20),
      emojiUsage: [...new Set([...oldProfile.emojiUsage, ...newProfile.emojiUsage])].slice(0, 5),
      punctuationPatterns: [...new Set([...oldProfile.punctuationPatterns, ...newProfile.punctuationPatterns])],
      responsePatterns: [...oldProfile.responsePatterns, ...newProfile.responsePatterns].slice(0, 10),
      // Обновляем стиль на основе новых данных
      communicationStyle: newProfile.communicationStyle,
      vocabularyComplexity: newProfile.vocabularyComplexity,
      responseSpeed: newProfile.responseSpeed,
      formalityLevel: newProfile.formalityLevel
    };
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'upload': return <Upload className="h-5 w-5" />;
      case 'parsing': return <Brain className="h-5 w-5" />;
      case 'extracting': return <MessageCircle className="h-5 w-5" />;
      case 'analyzing': return <BarChart3 className="h-5 w-5" />;
      case 'updating': return <TrendingUp className="h-5 w-5" />;
      case 'complete': return <CheckCircle className="h-5 w-5" />;
      default: return <Loader2 className="h-5 w-5" />;
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'upload': return 'text-blue-600';
      case 'parsing': return 'text-purple-600';
      case 'extracting': return 'text-green-600';
      case 'analyzing': return 'text-orange-600';
      case 'updating': return 'text-indigo-600';
      case 'complete': return 'text-emerald-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                <Brain className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Дообучение двойника</h2>
                <p className="text-gray-600">"{twin.name}"</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {!isAnalyzing && !analysisResults ? (
            /* Upload Section */
            <div className="space-y-8">
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-900 flex items-center space-x-3">
                    <Upload className="h-6 w-6" />
                    <span>Загрузите новые данные</span>
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    Выберите JSON файл с экспортом Telegram для дообучения двойника
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="border-2 border-dashed border-blue-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                    <Upload className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-blue-900 mb-2">
                      Перетащите файл сюда или нажмите для выбора
                    </p>
                    <p className="text-blue-600 mb-4">
                      Поддерживаются JSON файлы с экспортом Telegram
                    </p>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Выбрать файл
                    </Button>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </CardContent>
              </Card>

              {/* Current Twin Info */}
              <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200">
                <CardHeader>
                  <CardTitle className="text-violet-900">Текущий профиль двойника</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-white/50 rounded-xl">
                      <div className="text-2xl font-bold text-violet-600">{twin.messagesCount}</div>
                      <div className="text-sm text-violet-700">сообщений</div>
                    </div>
                    <div className="text-center p-4 bg-white/50 rounded-xl">
                      <div className="text-2xl font-bold text-violet-600">{twin.profile.interests.length}</div>
                      <div className="text-sm text-violet-700">интересов</div>
                    </div>
                    <div className="text-center p-4 bg-white/50 rounded-xl">
                      <div className="text-lg font-bold text-violet-600 capitalize">{twin.profile.communicationStyle}</div>
                      <div className="text-sm text-violet-700">стиль общения</div>
                    </div>
                    <div className="text-center p-4 bg-white/50 rounded-xl">
                      <div className="text-lg font-bold text-violet-600">{twin.profile.vocabularyComplexity}</div>
                      <div className="text-sm text-violet-700">сложность словаря</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : isAnalyzing ? (
            /* Analysis Progress */
            <div className="space-y-8">
              <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
                <CardHeader>
                  <CardTitle className="text-orange-900 flex items-center space-x-3">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Анализируем новые данные</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Progress value={progress.progress} className="h-3" />
                  
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${getStageColor(progress.stage)} bg-opacity-10`}>
                      {getStageIcon(progress.stage)}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{progress.message}</div>
                      {progress.details && (
                        <div className="text-sm text-gray-600">{progress.details}</div>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-orange-600">{progress.progress}%</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Analysis Results */
            <div className="space-y-8">
              <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
                <CardHeader>
                  <CardTitle className="text-emerald-900 flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6" />
                    <span>Дообучение завершено!</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-white/50 rounded-xl">
                      <div className="text-3xl font-bold text-emerald-600 mb-2">
                        +{analysisResults.newMessages}
                      </div>
                      <div className="text-emerald-700 font-semibold">новых сообщений</div>
                    </div>
                    
                    <div className="text-center p-6 bg-white/50 rounded-xl">
                      <div className="text-3xl font-bold text-emerald-600 mb-2">
                        +{analysisResults.newInterests.length}
                      </div>
                      <div className="text-emerald-700 font-semibold">новых интересов</div>
                    </div>
                    
                    <div className="text-center p-6 bg-white/50 rounded-xl">
                      <div className="text-3xl font-bold text-emerald-600 mb-2">
                        {analysisResults.styleChanges.length}
                      </div>
                      <div className="text-emerald-700 font-semibold">изменений стиля</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {analysisResults.newInterests.length > 0 && (
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-blue-900">Новые интересы</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {analysisResults.newInterests.map((interest: string, index: number) => (
                        <Badge key={index} className="bg-blue-100 text-blue-800 border-blue-200">
                          <Sparkles className="h-3 w-3 mr-1" />
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {analysisResults.styleChanges.length > 0 && (
                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                  <CardHeader>
                    <CardTitle className="text-purple-900">Изменения стиля общения</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysisResults.styleChanges.map((change: string, index: number) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-white/50 rounded-lg">
                          <Target className="h-4 w-4 text-purple-600" />
                          <span className="text-purple-800 font-medium">{change}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={onClose}>
                  Закрыть
                </Button>
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={onClose}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Готово
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 