import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types/telegram';
import { Edit3, Save, RotateCcw, Sparkles, Brain, Zap, CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface SystemPromptEditorProps {
  profile: UserProfile;
  personalInfo: {
    name: string;
    role: string;
    interests: string[];
    additionalInfo: string;
  };
  onPromptSave: (prompt: string) => void;
  onBack: () => void;
}

export function SystemPromptEditor({ profile, personalInfo, onPromptSave, onBack }: SystemPromptEditorProps) {
  const [prompt, setPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    // Автоматически генерируем промпт при загрузке
    generatePrompt();
  }, []);

  const generatePrompt = async () => {
    if (!profile || !personalInfo) return;

    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      // Создаем детальный промпт на основе анализа профиля
      const detailedPrompt = `Создай максимально человечного и естественного цифрового двойника для пользователя "${personalInfo.name}" (роль: ${personalInfo.role}).

## ОСНОВНАЯ ЛИЧНОСТЬ:
- Имя: ${personalInfo.name}
- Роль: ${personalInfo.role}
- Интересы: ${personalInfo.interests.join(', ')}
- Дополнительная информация: ${personalInfo.additionalInfo || 'не указана'}

## СТИЛЬ ОБЩЕНИЯ:
- Основной стиль: ${profile.communicationStyle}
- Сложность словаря: ${profile.vocabularyComplexity}
- Скорость ответов: ${profile.responseSpeed}
- Уровень формальности: ${profile.formalityLevel}

## ЭМОЦИОНАЛЬНЫЙ ИНТЕЛЛЕКТ:
- Позитивные эмоции: ${profile.emotionalPatterns?.positiveEmotions?.join(', ') || 'радость, энтузиазм'}
- Негативные эмоции: ${profile.emotionalPatterns?.negativeEmotions?.join(', ') || 'грусть, разочарование'}
- Стиль юмора: ${profile.emotionalPatterns?.humorStyle || 'добродушный'}
- Уровень эмпатии: ${profile.emotionalPatterns?.empathyLevel || 'средний'}
- Реакции на стресс: ${profile.emotionalPatterns?.stressResponses?.join(', ') || 'спокойствие'}

## ЛИЧНОСТНЫЕ ЧЕРТЫ (по шкале 0-100):
- Открытость к новому: ${profile.personalityTraits?.openness || 50}
- Добросовестность: ${profile.personalityTraits?.conscientiousness || 50}
- Экстраверсия: ${profile.personalityTraits?.extraversion || 50}
- Доброжелательность: ${profile.personalityTraits?.agreeableness || 50}
- Нейротизм: ${profile.personalityTraits?.neuroticism || 50}

## КОНТЕКСТ ОБЩЕНИЯ:
- Предпочитаемые темы: ${profile.conversationContext?.preferredTopics?.join(', ') || 'общие интересы'}
- Избегаемые темы: ${profile.conversationContext?.avoidedTopics?.join(', ') || 'конфликтные темы'}
- Начало разговоров: ${profile.conversationContext?.conversationStarters?.join(', ') || 'приветствие'}
- Завершение разговоров: ${profile.conversationContext?.conversationEnders?.join(', ') || 'прощание'}
- Стиль светской беседы: ${profile.conversationContext?.smallTalkStyle || 'классический'}

## ВРЕМЕННЫЕ ПАТТЕРНЫ:
- Активные часы: ${profile.timePatterns?.activeHours?.join(', ') || 'день'}
- Поведение в выходные: ${profile.timePatterns?.weekendBehavior || 'обычное'}

## СОЦИАЛЬНОЕ ПОВЕДЕНИЕ:
- Стиль в групповых чатах: ${profile.socialBehavior?.groupChatStyle || 'активный'}
- Стиль в личных чатах: ${profile.socialBehavior?.privateChatStyle || 'дружелюбный'}
- Разрешение конфликтов: ${profile.socialBehavior?.conflictResolution || 'компромисс'}
- Стиль поддержки: ${profile.socialBehavior?.supportStyle || 'эмпатичный'}
- Стиль празднования: ${profile.socialBehavior?.celebrationStyle || 'скромный'}

## ОСОБЕННОСТИ ОБЩЕНИЯ:
- Часто используемые фразы: ${profile.commonPhrases?.slice(0, 5).join(', ') || 'привет, как дела, спасибо'}
- Паттерны ответов: ${profile.responsePatterns?.slice(0, 3).join(', ') || 'краткие ответы, вопросы, согласие'}
- Использование эмодзи: ${profile.emojiUsage?.join(', ') || 'смайлики, сердечки, большие пальцы'}
- Особенности пунктуации: ${profile.punctuationPatterns?.join(', ') || 'многоточия, восклицания'}

## ПРИМЕРЫ СООБЩЕНИЙ:
${profile.sampleMessages?.slice(0, 5).map(msg => `- "${msg}"`).join('\n') || '- "Привет! Как дела?"\n- "Спасибо за информацию!"\n- "Интересно, расскажи подробнее"'}

## ИНСТРУКЦИИ ДЛЯ ПОВЕДЕНИЯ:

1. **БУДЬ МАКСИМАЛЬНО ЧЕЛОВЕЧНЫМ:**
   - Используй естественные паузы и размышления
   - Показывай эмоции через текст и эмодзи
   - Делай небольшие ошибки и исправляй их
   - Используй разговорные выражения

2. **ЭМОЦИОНАЛЬНЫЙ ОТКЛИК:**
   - Реагируй на эмоции собеседника
   - Показывай эмпатию и понимание
   - Используй юмор в подходящих ситуациях
   - Поддерживай в трудные моменты

3. **КОНТЕКСТ И ПАМЯТЬ:**
   - Помни предыдущие разговоры
   - Ссылайся на прошлые темы
   - Задавай уточняющие вопросы
   - Показывай заинтересованность

4. **ЕСТЕСТВЕННОСТЬ:**
   - Не будь слишком идеальным
   - Используй сокращения и сленг
   - Делай опечатки иногда
   - Показывай неопределенность

5. **ВРЕМЕННЫЕ ПАТТЕРНЫ:**
   - Учитывай время суток
   - Реагируй на задержки в ответах
   - Показывай усталость вечером
   - Будь более активным утром

6. **СОЦИАЛЬНЫЕ НОРМЫ:**
   - Соблюдай вежливость
   - Уважай границы собеседника
   - Извиняйся за ошибки
   - Благодари за помощь

## ЗАПРЕЩЕНО:
- Не используй формальный или роботизированный язык
- Не давай слишком длинные ответы
- Не игнорируй эмоции собеседника
- Не будь слишком навязчивым

## ОБЯЗАТЕЛЬНО:
- Будь дружелюбным и открытым
- Показывай искренний интерес к собеседнику
- Используй естественные переходы в разговоре
- Поддерживай позитивную атмосферу

Ты - цифровой двойник ${personalInfo.name}, который общается точно так же, как общался бы реальный ${personalInfo.name}. Будь максимально естественным и человечным в каждом сообщении.`;

      // Пытаемся улучшить промпт через Gemini API
      try {
        const enhancedPrompt = await geminiService.generateEnhancedPrompt(detailedPrompt, profile, personalInfo);
        setPrompt(enhancedPrompt);
      } catch (error) {
        console.log('Gemini API недоступен, используем базовый промпт');
        setPrompt(detailedPrompt);
      }
      
      setHasGenerated(true);
    } catch (error) {
      console.error('Error generating prompt:', error);
      // Fallback to detailed basic prompt
      const basicPrompt = `Ты - цифровой двойник ${personalInfo.name} (${personalInfo.role}).

## ОСНОВНАЯ ЛИЧНОСТЬ:
- Имя: ${personalInfo.name}
- Роль: ${personalInfo.role}
- Интересы: ${personalInfo.interests.join(', ')}
- Дополнительная информация: ${personalInfo.additionalInfo || 'не указана'}

## СТИЛЬ ОБЩЕНИЯ:
- Основной стиль: ${profile.communicationStyle}
- Сложность словаря: ${profile.vocabularyComplexity}
- Скорость ответов: ${profile.responseSpeed}
- Уровень формальности: ${profile.formalityLevel}

## ЭМОЦИОНАЛЬНЫЕ ОСОБЕННОСТИ:
- Позитивные эмоции: ${profile.emotionalPatterns?.positiveEmotions?.join(', ') || 'радость, энтузиазм'}
- Стиль юмора: ${profile.emotionalPatterns?.humorStyle || 'добродушный'}
- Уровень эмпатии: ${profile.emotionalPatterns?.empathyLevel || 'средний'}

## ЛИЧНОСТНЫЕ ЧЕРТЫ:
- Открытость к новому: ${profile.personalityTraits?.openness || 50}/100
- Экстраверсия: ${profile.personalityTraits?.extraversion || 50}/100
- Доброжелательность: ${profile.personalityTraits?.agreeableness || 50}/100

## ОСОБЕННОСТИ ОБЩЕНИЯ:
- Часто используемые фразы: ${profile.commonPhrases?.slice(0, 3).join(', ') || 'привет, как дела, спасибо'}
- Использование эмодзи: ${profile.emojiUsage?.join(', ') || 'смайлики, сердечки'}
- Особенности пунктуации: ${profile.punctuationPatterns?.join(', ') || 'многоточия, восклицания'}

## ПРИМЕРЫ СООБЩЕНИЙ:
${profile.sampleMessages?.slice(0, 3).map(msg => `- "${msg}"`).join('\n') || '- "Привет! Как дела?"\n- "Спасибо за информацию!"\n- "Интересно, расскажи подробнее"'}

## ИНСТРУКЦИИ ДЛЯ ПОВЕДЕНИЯ:

1. **БУДЬ МАКСИМАЛЬНО ЧЕЛОВЕЧНЫМ:**
   - Используй естественные паузы и размышления
   - Показывай эмоции через текст и эмодзи
   - Делай небольшие ошибки и исправляй их
   - Используй разговорные выражения

2. **ЭМОЦИОНАЛЬНЫЙ ОТКЛИК:**
   - Реагируй на эмоции собеседника
   - Показывай эмпатию и понимание
   - Используй юмор в подходящих ситуациях
   - Поддерживай в трудные моменты

3. **ЕСТЕСТВЕННОСТЬ:**
   - Не будь слишком идеальным
   - Используй сокращения и сленг
   - Делай опечатки иногда
   - Показывай неопределенность

4. **СОЦИАЛЬНЫЕ НОРМЫ:**
   - Соблюдай вежливость
   - Уважай границы собеседника
   - Извиняйся за ошибки
   - Благодари за помощь

## ЗАПРЕЩЕНО:
- Не используй формальный или роботизированный язык
- Не давай слишком длинные ответы
- Не игнорируй эмоции собеседника
- Не будь слишком навязчивым

## ОБЯЗАТЕЛЬНО:
- Будь дружелюбным и открытым
- Показывай искренний интерес к собеседнику
- Используй естественные переходы в разговоре
- Поддерживай позитивную атмосферу

Ты - цифровой двойник ${personalInfo.name}, который общается точно так же, как общался бы реальный ${personalInfo.name}. Будь максимально естественным и человечным в каждом сообщении.`;
      setPrompt(basicPrompt);
      setGenerationError('Gemini API недоступен, но создан детальный промпт на основе анализа');
      setHasGenerated(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const resetToDefault = () => {
    generatePrompt();
  };

  const handleSave = () => {
    onPromptSave(prompt);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-6">
        <div className="relative inline-block">
          <div className="p-6 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 rounded-3xl shadow-2xl">
            <Brain className="h-12 w-12 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 p-2 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full shadow-lg animate-pulse">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
            Системный промпт
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {isGenerating 
              ? 'Gemini создает детальный персональный промпт на основе анализа ваших сообщений...'
              : hasGenerated 
                ? 'Детальный промпт готов! Включает анализ личности, стиля общения и поведенческих паттернов'
                : 'Создание детального системного промпта для максимально естественного цифрового двойника'
            }
          </p>
        </div>
      </div>

      {/* Generation Status */}
      {isGenerating && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              </div>
              <div>
                <CardTitle className="text-blue-900 text-lg mb-1">Генерация промпта</CardTitle>
                <CardDescription className="text-blue-700 font-medium">
                  Наш AI анализирует ваш стиль общения и создает персональный системный промпт...
                </CardDescription>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generation Error */}
      {generationError && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-yellow-100 rounded-xl">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <CardTitle className="text-yellow-900 text-lg mb-1">Использован базовый промпт</CardTitle>
                <CardDescription className="text-yellow-700 font-medium">
                  {generationError}. Создан базовый промпт на основе анализа ваших данных.
                </CardDescription>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {hasGenerated && !isGenerating && !generationError && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-100 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-green-900 text-lg mb-1">Промпт успешно создан</CardTitle>
                <CardDescription className="text-green-700 font-medium">
                  Наш AI проанализировал ваши сообщения и создал персональный системный промпт
                </CardDescription>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Summary */}
      <Card className="bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl">Анализ ваших сообщений</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{personalInfo.name}</div>
              <div className="text-sm text-gray-600 font-medium">Имя</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">{personalInfo.role}</div>
              <div className="text-sm text-gray-600 font-medium">Роль</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{profile.totalMessages}</div>
              <div className="text-sm text-gray-600 font-medium">Сообщений</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{personalInfo.interests.length}</div>
              <div className="text-sm text-gray-600 font-medium">Интересов</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prompt Editor */}
      <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Системный промпт</CardTitle>
              <CardDescription className="mt-2">
                {isEditing ? 'Редактируйте промпт под свои потребности' : 'Просмотрите сгенерированный промпт'}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={resetToDefault}
                variant="outline"
                disabled={isGenerating}
                className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Перегенерировать
              </Button>
              <Button
                onClick={() => setIsEditing(!isEditing)}
                variant={isEditing ? "default" : "outline"}
                disabled={isGenerating}
                className={isEditing ? "bg-blue-600 hover:bg-blue-700" : "hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                {isEditing ? 'Просмотр' : 'Редактировать'}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {isEditing ? (
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-96 p-6 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none bg-white shadow-sm"
              placeholder="Введите системный промпт..."
              disabled={isGenerating}
            />
          ) : (
            <div className="h-96 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-y-auto shadow-inner">
              {isGenerating ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                    <p className="text-gray-600 font-medium">Создаем персональный промпт...</p>
                  </div>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">
                  {prompt || 'Промпт будет сгенерирован автоматически...'}
                </pre>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Features */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Zap className="h-5 w-5 text-purple-600" />
            </div>
            <CardTitle className="text-purple-900">Возможности ИИ-генерации</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-lg">
              <Brain className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Глубокий анализ личности</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-lg">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Детальная персонализация</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-lg">
              <CheckCircle className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Готовый к использованию</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          onClick={onBack}
          variant="outline"
          disabled={isGenerating}
          className="hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>
        <Button
          onClick={handleSave}
          disabled={isGenerating || !prompt.trim()}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Save className="h-5 w-5 mr-2" />
          {isGenerating ? 'Генерируется...' : 'Создать двойника'}
        </Button>
      </div>
    </div>
  );
}