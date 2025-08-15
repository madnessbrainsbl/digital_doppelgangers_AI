import React from 'react';
import { UserProfile } from '../types/telegram';
import { MessageCircle, BarChart3, Brain, Heart, CheckCircle, User, Briefcase, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface ProfileAnalysisProps {
  profile: UserProfile;
  personalInfo: {
    name: string;
    role: string;
    interests: string[];
    additionalInfo: string;
  };
  onContinue: () => void;
  onBack: () => void;
}

export function ProfileAnalysis({ profile, personalInfo, onContinue, onBack }: ProfileAnalysisProps) {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-12">
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl shadow-xl">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <h2 className="text-5xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Анализ завершен!
        </h2>
        <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
          Мы проанализировали ваши переписки и создали профиль для цифрового двойника
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl">
              <MessageCircle className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg">Сообщения</h3>
          </div>
          <p className="text-4xl font-bold text-blue-600 mb-2">{profile.totalMessages}</p>
          <p className="text-sm text-gray-500 font-medium">проанализировано</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg">Длина</h3>
          </div>
          <p className="text-4xl font-bold text-purple-600 mb-2">
            {Math.round(profile.averageMessageLength)}
          </p>
          <p className="text-sm text-gray-500 font-medium">символов в среднем</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl">
              <Brain className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg">Стиль</h3>
          </div>
          <p className="text-lg font-bold text-green-600 capitalize leading-tight">
            {profile.communicationStyle}
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl">
              <Heart className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg">Интересы</h3>
          </div>
          <p className="text-4xl font-bold text-orange-600 mb-2">{profile.interests.length}</p>
          <p className="text-sm text-gray-500 font-medium">выявлено</p>
        </div>
      </div>

      {/* Enhanced Analysis Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200 shadow-xl">
          <CardHeader>
            <CardTitle className="text-violet-900 text-lg">Сложность словаря</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={`text-sm font-semibold ${
              profile.vocabularyComplexity === 'высокий' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
              profile.vocabularyComplexity === 'средний' ? 'bg-blue-100 text-blue-800 border-blue-200' :
              'bg-orange-100 text-orange-800 border-orange-200'
            }`}>
              {profile.vocabularyComplexity}
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 shadow-xl">
          <CardHeader>
            <CardTitle className="text-blue-900 text-lg">Скорость ответов</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={`text-sm font-semibold ${
              profile.responseSpeed === 'быстрый' ? 'bg-green-100 text-green-800 border-green-200' :
              profile.responseSpeed === 'нормальный' ? 'bg-blue-100 text-blue-800 border-blue-200' :
              'bg-orange-100 text-orange-800 border-orange-200'
            }`}>
              {profile.responseSpeed}
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200 shadow-xl">
          <CardHeader>
            <CardTitle className="text-emerald-900 text-lg">Формальность</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={`text-sm font-semibold ${
              profile.formalityLevel === 'формальный' ? 'bg-purple-100 text-purple-800 border-purple-200' :
              profile.formalityLevel === 'неформальный' ? 'bg-green-100 text-green-800 border-green-200' :
              'bg-blue-100 text-blue-800 border-blue-200'
            }`}>
              {profile.formalityLevel}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Emoji Usage */}
      {profile.emojiUsage.length > 0 && (
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 shadow-xl">
          <CardHeader>
            <CardTitle className="text-yellow-900 text-xl">Использование эмодзи</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {profile.emojiUsage.map((emoji, index) => (
                <span
                  key={index}
                  className="text-3xl p-3 bg-white/50 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  {emoji}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Punctuation Patterns */}
      {profile.punctuationPatterns.length > 0 && (
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 shadow-xl">
          <CardHeader>
            <CardTitle className="text-indigo-900 text-xl">Особенности пунктуации</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {profile.punctuationPatterns.map((pattern, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-white/50 rounded-xl">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  <span className="text-indigo-800 font-medium">{pattern}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sample Messages */}
      {profile.sampleMessages.length > 0 && (
        <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 shadow-xl">
          <CardHeader>
            <CardTitle className="text-gray-900 text-xl">Примеры сообщений</CardTitle>
            <CardDescription>Реальные сообщения из ваших переписок</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {profile.sampleMessages.slice(0, 5).map((message, index) => (
                <div key={index} className="p-4 bg-white/70 rounded-xl border border-gray-200">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-800 text-sm leading-relaxed">"{message}"</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personal Info Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-xl">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-blue-900 text-xl">Персональная информация</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-blue-600" />
                <div>
                  <span className="text-sm text-blue-700 font-medium">Имя:</span>
                  <p className="text-blue-900 font-semibold">{personalInfo.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Briefcase className="h-5 w-5 text-blue-600" />
                <div>
                  <span className="text-sm text-blue-700 font-medium">Роль:</span>
                  <p className="text-blue-900 font-semibold">{personalInfo.role}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-blue-700 font-medium">Интересы:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {personalInfo.interests.map((interest, index) => (
                    <Badge key={index} variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
              {personalInfo.additionalInfo && (
                <div>
                  <span className="text-sm text-blue-700 font-medium">Дополнительно:</span>
                  <p className="text-blue-900 text-sm mt-1">{personalInfo.additionalInfo}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {profile.commonPhrases.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Часто используемые фразы
          </h3>
          <div className="flex flex-wrap gap-3">
            {profile.commonPhrases.slice(0, 8).map((phrase, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-2xl text-sm border border-blue-200 font-medium shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                "{phrase}"
              </span>
            ))}
          </div>
        </div>
      )}

      {profile.interests.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Выявленные интересы
          </h3>
          <div className="flex flex-wrap gap-3">
            {profile.interests.map((interest, index) => (
              <span
                key={index}
                className="px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 rounded-2xl text-sm border border-purple-200 capitalize font-semibold shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button
          onClick={onBack}
          variant="outline"
          className="hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Изменить информацию
        </Button>
        <Button
          onClick={onContinue}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <ArrowRight className="h-5 w-5 mr-2" />
          Создать системный промпт
        </Button>
      </div>
    </div>
  );
}