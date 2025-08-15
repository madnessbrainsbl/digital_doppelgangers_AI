import React, { useState, useEffect } from 'react';
import { User, Briefcase, Heart, ArrowRight, ArrowLeft, Sparkles, Brain, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface PersonalInfo {
  name: string;
  role: string;
  interests: string[];
  additionalInfo: string;
}

interface PersonalInfoFormProps {
  onSubmit: (info: PersonalInfo) => void;
  onBack: () => void;
  defaultRole?: string;
  defaultInterests?: string[];
  defaultName?: string;
}

const PREDEFINED_INTERESTS = [
  'Технологии', 'Программирование', 'Бизнес', 'Маркетинг', 'Дизайн',
  'Спорт', 'Путешествия', 'Музыка', 'Фильмы', 'Книги',
  'Кулинария', 'Фотография', 'Игры', 'Наука', 'Искусство',
  'Автомобили', 'Мода', 'Здоровье', 'Образование', 'Финансы'
];

const PREDEFINED_ROLES = [
  'Предприниматель', 'Менеджер', 'Разработчик', 'Дизайнер', 'Маркетолог',
  'Консультант', 'Аналитик', 'Продавец', 'Учитель', 'Студент',
  'Фрилансер', 'Руководитель', 'Специалист', 'Эксперт', 'Другое'
];

export function PersonalInfoForm({ onSubmit, onBack, defaultRole, defaultInterests, defaultName }: PersonalInfoFormProps) {
  const [formData, setFormData] = useState<PersonalInfo>({
    name: defaultName || '',
    role: defaultRole || '',
    interests: defaultInterests || [],
    additionalInfo: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (defaultInterests && defaultInterests.length > 0) {
      setFormData(prev => ({
        ...prev,
        interests: [...new Set([...prev.interests, ...defaultInterests])]
      }));
    }
  }, [defaultInterests]);

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Введите ваше имя';
    }

    if (!formData.role.trim()) {
      newErrors.role = 'Выберите или укажите вашу роль';
    }

    if (formData.interests.length === 0) {
      newErrors.interests = 'Выберите хотя бы один интерес';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-6">
        <div className="relative inline-block">
          <div className="p-6 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 rounded-3xl shadow-2xl">
            <User className="h-12 w-12 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg animate-pulse">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Персональная информация
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Расскажите о себе, чтобы ИИ создал максимально точный системный промпт для вашего цифрового двойника
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Name Input */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/50">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Как вас зовут?</CardTitle>
                <CardDescription>
                  {defaultName ? 
                    `Имя автоматически определено из переписки: "${defaultName}". Вы можете его изменить.` : 
                    'Имя будет использовано в системном промпте'
                  }
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-lg ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Например: Дмитрий, Анна, Александр..."
              />
              {defaultName && formData.name === defaultName && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                    Авто
                  </Badge>
                </div>
              )}
            </div>
            {errors.name && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.name}</p>
            )}
          </CardContent>
        </Card>

        {/* Role Selection */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-purple-50/50">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Briefcase className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Ваша роль или профессия</CardTitle>
                <CardDescription>
                  {defaultRole ? 
                    `Роль автоматически определена: "${defaultRole}". Вы можете выбрать другую.` : 
                    'Это поможет настроить стиль общения двойника'
                  }
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {PREDEFINED_ROLES.map((role) => {
                const isSelected = formData.role === role;
                const isAutoSelected = defaultRole === role;
                
                return (
                  <Button
                    key={role}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => setFormData(prev => ({ ...prev, role }))}
                    className={`text-sm h-auto py-3 relative ${
                      isSelected 
                        ? "bg-purple-600 hover:bg-purple-700 text-white" 
                        : "hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300"
                    }`}
                  >
                    <span>{role}</span>
                    {isAutoSelected && (
                      <Badge 
                        variant="outline" 
                        className="absolute -top-1 -right-1 bg-green-50 text-green-700 border-green-200 text-xs px-1 py-0"
                      >
                        Авто
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
            
            {formData.role === 'Другое' && (
              <input
                type="text"
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm"
                placeholder="Укажите вашу роль или профессию"
              />
            )}
            
            {errors.role && (
              <p className="text-sm text-red-600 font-medium">{errors.role}</p>
            )}
          </CardContent>
        </Card>

        {/* Interests Selection */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-orange-50/50">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Heart className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Ваши интересы</CardTitle>
                <CardDescription>
                  {defaultInterests && defaultInterests.length > 0 ? 
                    `Интересы автоматически определены: ${defaultInterests.join(', ')}. Вы можете изменить выбор.` : 
                    'Выберите темы, которые вам интересны (минимум 1)'
                  }
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {PREDEFINED_INTERESTS.map((interest) => {
                const isSelected = formData.interests.includes(interest);
                const isAutoSelected = defaultInterests && defaultInterests.includes(interest);
                
                return (
                  <Button
                    key={interest}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => handleInterestToggle(interest)}
                    className={`text-sm h-auto py-3 relative ${
                      isSelected
                        ? "bg-orange-600 hover:bg-orange-700 text-white" 
                        : "hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300"
                    }`}
                  >
                    <span>{interest}</span>
                    {isAutoSelected && (
                      <Badge 
                        variant="outline" 
                        className="absolute -top-1 -right-1 bg-green-50 text-green-700 border-green-200 text-xs px-1 py-0"
                      >
                        Авто
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
            
            {formData.interests.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Выбрано интересов: {formData.interests.length}</p>
                <div className="flex flex-wrap gap-2">
                  {formData.interests.map((interest) => {
                    const isPredefined = PREDEFINED_INTERESTS.includes(interest);
                    const isAutoSelected = defaultInterests && defaultInterests.includes(interest);
                    
                    return (
                      <Badge 
                        key={interest} 
                        variant="outline" 
                        className={`cursor-pointer ${
                          isAutoSelected 
                            ? 'bg-green-100 text-green-700 border-green-300' 
                            : 'bg-orange-100 text-orange-700 border-orange-300'
                        }`}
                        onClick={() => handleInterestToggle(interest)}
                      >
                        {interest}
                        {isAutoSelected && !isPredefined && (
                          <span className="ml-1 text-xs">(авто)</span>
                        )}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
            
            {errors.interests && (
              <p className="text-sm text-red-600 font-medium">{errors.interests}</p>
            )}
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-green-50/50">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Brain className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Дополнительная информация</CardTitle>
                <CardDescription>Расскажите о своих особенностях общения (необязательно)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <textarea
              value={formData.additionalInfo}
              onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white shadow-sm resize-none"
              rows={4}
              placeholder="Например: Люблю использовать эмодзи, часто шучу, предпочитаю неформальное общение, использую сленг..."
            />
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle className="text-blue-900">Предварительный просмотр</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-blue-800">
              <p><strong>Имя:</strong> {formData.name || 'Не указано'}</p>
              <p><strong>Роль:</strong> {formData.role || 'Не указана'}</p>
              <p><strong>Интересы:</strong> {formData.interests.length > 0 ? formData.interests.join(', ') : 'Не выбраны'}</p>
              {formData.additionalInfo && (
                <p><strong>Дополнительно:</strong> {formData.additionalInfo}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            onClick={onBack}
            variant="outline"
            className="hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <Button
            type="submit"
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <ArrowRight className="h-5 w-5 mr-2" />
            Создать промпт
          </Button>
        </div>
      </form>
    </div>
  );
}