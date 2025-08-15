import React, { useState } from 'react';
import { Brain, Heart, Clock, Users, Settings, Zap, Target, Star, Shield, Sparkles, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';

interface HumanBehaviorSettingsProps {
  profile: any;
  onSave: (settings: any) => void;
  onBack: () => void;
}

export function HumanBehaviorSettings({ profile, onSave, onBack }: HumanBehaviorSettingsProps) {
  const [settings, setSettings] = useState({
    emotionalIntelligence: {
      empathyLevel: profile?.emotionalPatterns?.empathyLevel || 'средний',
      humorStyle: profile?.emotionalPatterns?.humorStyle || 'добродушный',
      stressResponse: profile?.emotionalPatterns?.stressResponses?.[0] || 'спокойствие'
    },
    personalityTraits: {
      openness: profile?.personalityTraits?.openness || 50,
      conscientiousness: profile?.personalityTraits?.conscientiousness || 50,
      extraversion: profile?.personalityTraits?.extraversion || 50,
      agreeableness: profile?.personalityTraits?.agreeableness || 50,
      neuroticism: profile?.personalityTraits?.neuroticism || 50
    },
    communicationStyle: {
      formality: profile?.formalityLevel || 'неформальный',
      responseSpeed: profile?.responseSpeed || 'нормальный',
      emojiUsage: profile?.emojiUsage?.length > 0 ? 'активное' : 'минимальное'
    },
    socialBehavior: {
      groupChatStyle: profile?.socialBehavior?.groupChatStyle || 'активный',
      conflictResolution: profile?.socialBehavior?.conflictResolution || 'компромисс',
      supportStyle: profile?.socialBehavior?.supportStyle || 'эмпатичный'
    },
    timePatterns: {
      activeHours: profile?.timePatterns?.activeHours || ['9:00', '18:00'],
      weekendBehavior: profile?.timePatterns?.weekendBehavior || 'обычное'
    }
  });

  const handlePersonalityChange = (trait: string, value: number) => {
    setSettings(prev => ({
      ...prev,
      personalityTraits: {
        ...prev.personalityTraits,
        [trait]: value
      }
    }));
  };

  const handleEmotionalChange = (aspect: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      emotionalIntelligence: {
        ...prev.emotionalIntelligence,
        [aspect]: value
      }
    }));
  };

  const getPersonalityDescription = (trait: string, value: number) => {
    const descriptions = {
      openness: value > 70 ? 'Очень открыт к новому' : value > 40 ? 'Умеренно открыт' : 'Консервативный',
      conscientiousness: value > 70 ? 'Очень организованный' : value > 40 ? 'Умеренно организованный' : 'Спонтанный',
      extraversion: value > 70 ? 'Очень общительный' : value > 40 ? 'Умеренно общительный' : 'Интроверт',
      agreeableness: value > 70 ? 'Очень доброжелательный' : value > 40 ? 'Умеренно доброжелательный' : 'Прямолинейный',
      neuroticism: value > 70 ? 'Эмоционально чувствительный' : value > 40 ? 'Умеренно чувствительный' : 'Спокойный'
    };
    return descriptions[trait as keyof typeof descriptions];
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto space-y-8 p-8">
        {/* Close button */}
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl shadow-xl">
            <Brain className="h-10 w-10 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Настройка человеческого поведения
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Настройте, как ваш цифровой двойник будет вести себя в общении, чтобы он был максимально похож на вас
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Эмоциональный интеллект */}
          <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Heart className="h-5 w-5 text-red-600" />
                </div>
                <CardTitle className="text-red-900">Эмоциональный интеллект</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <label className="text-sm font-semibold text-red-800">Уровень эмпатии</label>
                <div className="flex space-x-2">
                  {['низкий', 'средний', 'высокий'].map(level => (
                    <Button
                      key={level}
                      variant={settings.emotionalIntelligence.empathyLevel === level ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleEmotionalChange('empathyLevel', level)}
                      className="text-xs"
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-semibold text-red-800">Стиль юмора</label>
                <div className="flex flex-wrap gap-2">
                  {['добродушный', 'ироничный', 'сдержанный', 'веселый'].map(style => (
                    <Button
                      key={style}
                      variant={settings.emotionalIntelligence.humorStyle === style ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleEmotionalChange('humorStyle', style)}
                      className="text-xs"
                    >
                      {style}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-semibold text-red-800">Реакция на стресс</label>
                <div className="flex flex-wrap gap-2">
                  {['спокойствие', 'оптимизм', 'анализ проблем', 'поиск поддержки'].map(response => (
                    <Button
                      key={response}
                      variant={settings.emotionalIntelligence.stressResponse === response ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleEmotionalChange('stressResponse', response)}
                      className="text-xs"
                    >
                      {response}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Личностные черты */}
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-blue-900">Личностные черты</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(settings.personalityTraits).map(([trait, value]) => (
                <div key={trait} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-blue-800 capitalize">
                      {trait === 'openness' ? 'Открытость' :
                       trait === 'conscientiousness' ? 'Добросовестность' :
                       trait === 'extraversion' ? 'Экстраверсия' :
                       trait === 'agreeableness' ? 'Доброжелательность' :
                       'Нейротизм'}
                    </label>
                    <Badge variant="outline" className="text-xs">
                      {value}
                    </Badge>
                  </div>
                  <Slider
                    value={[value]}
                    onValueChange={([newValue]) => handlePersonalityChange(trait, newValue)}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-blue-600">
                    {getPersonalityDescription(trait, value)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Стиль общения */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Zap className="h-5 w-5 text-green-600" />
                </div>
                <CardTitle className="text-green-900">Стиль общения</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <label className="text-sm font-semibold text-green-800">Формальность</label>
                <div className="flex space-x-2">
                  {['неформальный', 'полуформальный', 'формальный'].map(level => (
                    <Button
                      key={level}
                      variant={settings.communicationStyle.formality === level ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSettings(prev => ({
                        ...prev,
                        communicationStyle: { ...prev.communicationStyle, formality: level }
                      }))}
                      className="text-xs"
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-semibold text-green-800">Скорость ответов</label>
                <div className="flex space-x-2">
                  {['медленный', 'нормальный', 'быстрый'].map(speed => (
                    <Button
                      key={speed}
                      variant={settings.communicationStyle.responseSpeed === speed ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSettings(prev => ({
                        ...prev,
                        communicationStyle: { ...prev.communicationStyle, responseSpeed: speed }
                      }))}
                      className="text-xs"
                    >
                      {speed}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-semibold text-green-800">Использование эмодзи</label>
                <div className="flex space-x-2">
                  {['минимальное', 'умеренное', 'активное'].map(usage => (
                    <Button
                      key={usage}
                      variant={settings.communicationStyle.emojiUsage === usage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSettings(prev => ({
                        ...prev,
                        communicationStyle: { ...prev.communicationStyle, emojiUsage: usage }
                      }))}
                      className="text-xs"
                    >
                      {usage}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Социальное поведение */}
          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <CardTitle className="text-purple-900">Социальное поведение</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <label className="text-sm font-semibold text-purple-800">Стиль в групповых чатах</label>
                <div className="flex flex-wrap gap-2">
                  {['активный', 'наблюдатель', 'вежливый'].map(style => (
                    <Button
                      key={style}
                      variant={settings.socialBehavior.groupChatStyle === style ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSettings(prev => ({
                        ...prev,
                        socialBehavior: { ...prev.socialBehavior, groupChatStyle: style }
                      }))}
                      className="text-xs"
                    >
                      {style}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-semibold text-purple-800">Разрешение конфликтов</label>
                <div className="flex flex-wrap gap-2">
                  {['компромисс', 'избегание', 'активное решение'].map(style => (
                    <Button
                      key={style}
                      variant={settings.socialBehavior.conflictResolution === style ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSettings(prev => ({
                        ...prev,
                        socialBehavior: { ...prev.socialBehavior, conflictResolution: style }
                      }))}
                      className="text-xs"
                    >
                      {style}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-semibold text-purple-800">Стиль поддержки</label>
                <div className="flex flex-wrap gap-2">
                  {['эмпатичный', 'практичный', 'мотивирующий'].map(style => (
                    <Button
                      key={style}
                      variant={settings.socialBehavior.supportStyle === style ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSettings(prev => ({
                        ...prev,
                        socialBehavior: { ...prev.socialBehavior, supportStyle: style }
                      }))}
                      className="text-xs"
                    >
                      {style}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-8">
          <Button
            onClick={onBack}
            variant="outline"
            className="hover:bg-gray-50"
          >
            Назад
          </Button>
          <Button
            onClick={() => onSave(settings)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Сохранить настройки
          </Button>
        </div>
      </div>
    </div>
  );
} 