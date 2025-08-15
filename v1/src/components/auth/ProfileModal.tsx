import React, { useState } from 'react';
import { X, User, Mail, Calendar, Edit3, Save, Camera } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, signOut, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      await updateProfile({ full_name: fullName });
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Ошибка при обновлении профиля');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка при выходе');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-md">
        <CardHeader className="relative pb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-2 top-2 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="text-center space-y-4">
            <div className="relative mx-auto">
              <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xl font-bold">
                  {getInitials(user.user_metadata?.full_name || user.email || 'U')}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="icon"
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white shadow-lg border-2 border-gray-200 hover:bg-gray-50"
              >
                <Camera className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="space-y-2">
              <CardTitle className="text-xl font-bold">
                Профиль пользователя
              </CardTitle>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Активен
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Name Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Полное имя</span>
              </label>
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  Изменить
                </Button>
              )}
            </div>
            
            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Введите ваше имя"
                />
                <div className="flex space-x-2">
                  <Button
                    onClick={handleSave}
                    disabled={loading}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Сохранить
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      setFullName(user.user_metadata?.full_name || '');
                      setError(null);
                    }}
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">
                  {user.user_metadata?.full_name || 'Не указано'}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Email Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>Email</span>
            </label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">{user.email}</p>
              {user.email_confirmed_at ? (
                <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">
                  Подтвержден
                </Badge>
              ) : (
                <Badge variant="outline" className="mt-2 bg-yellow-50 text-yellow-700 border-yellow-200">
                  Не подтвержден
                </Badge>
              )}
            </div>
          </div>

          {/* Registration Date */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Дата регистрации</span>
            </label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">
                {formatDate(user.created_at)}
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          <Separator />

          {/* Sign Out Button */}
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            Выйти из аккаунта
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}