import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Calendar, Edit3, Save, Camera, Shield, Key, Bell, Trash2, 
  Download, Upload, Settings as SettingsIcon, Eye, EyeOff, Lock, 
  Crown, Star, Zap, Target, Brain, Heart, Users, Globe, Award,
  TrendingUp, MessageCircle, Clock, CheckCircle, AlertCircle, 
  Plus, Bot, Sparkles, Infinity, Cpu, Rocket
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { DigitalTwinService } from '../services/digitalTwinService';
import { DigitalTwinData } from '../types/telegram';

export function ProfilePage() {
  const { user, updateProfile, signOut, updatePassword } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [twins, setTwins] = useState<DigitalTwinData[]>([]);
  const [stats, setStats] = useState({
    totalTwins: 0,
    totalMessages: 0,
    activeDays: 1,
    lastActivity: new Date()
  });

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      const twinsList = await DigitalTwinService.getAllTwins();
      setTwins(twinsList);
      
      const totalMessages = twinsList.reduce((sum, twin) => sum + twin.messagesCount, 0);
      const daysSinceRegistration = Math.ceil((Date.now() - new Date(user?.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24));
      
      setStats({
        totalTwins: twinsList.length,
        totalMessages,
        activeDays: Math.max(1, daysSinceRegistration),
        lastActivity: new Date()
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await updateProfile({ full_name: fullName });
      setIsEditing(false);
      setSuccess('Профиль успешно обновлен');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Ошибка при обновлении профиля');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordLoading(true);
    setError(null);
    setSuccess(null);

    if (!passwordData.currentPassword) {
      setError('Введите текущий пароль');
      setPasswordLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Новый пароль должен содержать минимум 6 символов');
      setPasswordLoading(false);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Пароли не совпадают');
      setPasswordLoading(false);
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setError('Новый пароль должен отличаться от текущего');
      setPasswordLoading(false);
      return;
    }

    try {
      await updatePassword(passwordData.newPassword);
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswords({
        current: false,
        new: false,
        confirm: false
      });
      setSuccess('Пароль успешно изменен');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Ошибка при изменении пароля');
    } finally {
      setPasswordLoading(false);
    }
  };

  const cancelPasswordChange = () => {
    setIsChangingPassword(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswords({
      current: false,
      new: false,
      confirm: false
    });
    setError(null);
  };

  const handleSignOut = async () => {
    if (confirm('Вы уверены, что хотите выйти из аккаунта?')) {
      try {
        await signOut();
      } catch (err: any) {
        setError(err.message || 'Ошибка при выходе');
      }
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMembershipLevel = () => {
    if (stats.totalTwins >= 10) return { level: 'Premium', color: 'from-yellow-400 to-orange-500', icon: Crown };
    if (stats.totalTwins >= 5) return { level: 'Pro', color: 'from-purple-400 to-pink-500', icon: Star };
    return { level: 'Basic', color: 'from-blue-400 to-cyan-500', icon: Shield };
  };

  const membership = getMembershipLevel();
  const MembershipIcon = membership.icon;

  if (!user) {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-8 px-4 py-8">
        <Card className="text-center py-20 bg-gradient-to-br from-gray-50 to-gray-100">
          <CardContent>
            <div className="space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full mx-auto flex items-center justify-center">
                <User className="h-10 w-10 text-gray-500" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Войдите в аккаунт</h2>
              <p className="text-gray-600 text-lg">Для просмотра профиля необходимо войти в систему</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="w-full max-w-6xl mx-auto space-y-8 px-4 py-8">
        {/* Hero Header */}
        <div className="text-center space-y-8">
          {/* Premium Badge */}
          <div className="flex justify-center mb-8">
            <div className={`inline-flex items-center space-x-3 bg-gradient-to-r ${membership.color} text-white px-8 py-3 rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300`}>
              <MembershipIcon className="h-5 w-5" />
              <span className="text-sm font-bold tracking-wide">{membership.level.toUpperCase()} MEMBER</span>
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
          </div>

          {/* Main Icon */}
          <div className="relative inline-block">
            <div className="p-8 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-3xl shadow-2xl transform hover:scale-105 transition-all duration-300">
              <User className="h-16 w-16 text-white" />
            </div>
            <div className="absolute -top-3 -right-3 p-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full shadow-xl animate-bounce">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div className="absolute -bottom-2 -left-2 p-2 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full shadow-lg animate-pulse">
              <SettingsIcon className="h-4 w-4 text-white" />
            </div>
          </div>
          
          <div className="space-y-6">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-gray-900 via-violet-800 to-purple-800 bg-clip-text text-transparent leading-tight">
              Мой профиль
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
              Управляйте своими личными данными, настройками аккаунта и отслеживайте статистику использования
            </p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Card className="border-red-200 bg-red-50 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {success && (
          <Card className="border-green-200 bg-green-50 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <p className="text-green-700 font-medium">{success}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="text-center p-6 bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <div className="p-4 bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl w-fit mx-auto mb-4">
              <Bot className="h-8 w-8 text-violet-600" />
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-2">{stats.totalTwins}</div>
            <div className="text-sm text-violet-700 font-semibold">Двойников создано</div>
          </Card>
          <Card className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <div className="p-4 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl w-fit mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-blue-600" />
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
              {stats.totalMessages.toLocaleString()}
            </div>
            <div className="text-sm text-blue-700 font-semibold">Сообщений проанализировано</div>
          </Card>
          <Card className="text-center p-6 bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <div className="p-4 bg-gradient-to-br from-emerald-100 to-green-100 rounded-2xl w-fit mx-auto mb-4">
              <Clock className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-2">{stats.activeDays}</div>
            <div className="text-sm text-emerald-700 font-semibold">Дней активности</div>
          </Card>
          <Card className="text-center p-6 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <div className="p-4 bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl w-fit mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">99.9%</div>
            <div className="text-sm text-orange-700 font-semibold">Точность анализа</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50/50">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-2xl font-bold">
                          {getInitials(user.user_metadata?.full_name || user.email || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white shadow-lg border-2 border-gray-200 hover:bg-gray-50"
                          >
                            <Camera className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Изменить фото</TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="space-y-2">
                      <CardTitle className="text-2xl">
                        {user.user_metadata?.full_name || 'Пользователь'}
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          Активен
                        </Badge>
                        {user.email_confirmed_at ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            <Shield className="h-3 w-3 mr-1" />
                            Подтвержден
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Не подтвержден
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {!isEditing && (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Редактировать
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Name Section */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Полное имя</span>
                  </label>
                  
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                        placeholder="Введите ваше имя"
                      />
                      <div className="flex space-x-3">
                        <Button
                          onClick={handleSave}
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {loading ? 'Сохранение...' : 'Сохранить'}
                        </Button>
                        <Button
                          variant="outline"
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
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
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
                    <span>Email адрес</span>
                  </label>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">{user.email}</p>
                      {user.email_confirmed_at ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <Shield className="h-3 w-3 mr-1" />
                          Подтвержден
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Не подтвержден
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Password Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                      <Lock className="h-4 w-4" />
                      <span>Пароль</span>
                    </label>
                    {!isChangingPassword && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsChangingPassword(true)}
                        className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                      >
                        <Key className="h-3 w-3 mr-1" />
                        Изменить пароль
                      </Button>
                    )}
                  </div>
                  
                  {isChangingPassword ? (
                    <div className="space-y-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Текущий пароль
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords.current ? 'text' : 'password'}
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                              placeholder="Введите текущий пароль"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-gray-100"
                            >
                              {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Новый пароль
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords.new ? 'text' : 'password'}
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                              placeholder="Введите новый пароль"
                              minLength={6}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-gray-100"
                            >
                              {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Минимум 6 символов</p>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Подтвердите новый пароль
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords.confirm ? 'text' : 'password'}
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                              placeholder="Повторите новый пароль"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-gray-100"
                            >
                              {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-3 pt-2">
                        <Button
                          onClick={handlePasswordChange}
                          disabled={passwordLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {passwordLoading ? 'Изменение...' : 'Изменить пароль'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={cancelPasswordChange}
                          disabled={passwordLoading}
                        >
                          Отмена
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center space-x-3">
                        <Shield className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-900">••••••••</span>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Защищен
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Registration Date */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Дата регистрации</span>
                  </label>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="font-medium text-gray-900">
                      {formatDate(user.created_at)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Membership Card */}
            <Card className="shadow-xl border-0 bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="text-lg bg-gradient-to-r from-violet-700 to-purple-700 bg-clip-text text-transparent font-bold flex items-center space-x-2">
                  <MembershipIcon className="h-5 w-5" />
                  <span>Уровень членства</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-white/60 rounded-lg">
                  <div className={`inline-flex items-center space-x-2 bg-gradient-to-r ${membership.color} text-white px-4 py-2 rounded-full text-sm font-bold mb-3`}>
                    <MembershipIcon className="h-4 w-4" />
                    <span>{membership.level}</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {membership.level === 'Premium' ? 'Максимальные возможности' :
                     membership.level === 'Pro' ? 'Расширенные функции' :
                     'Базовые возможности'}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Создано двойников</span>
                    <span className="font-semibold text-purple-700">{stats.totalTwins}/∞</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Анализ сообщений</span>
                    <span className="font-semibold text-purple-700">Безлимитно</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Поддержка</span>
                    <span className="font-semibold text-purple-700">24/7</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-lg">Быстрые действия</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start hover:bg-blue-50"
                  onClick={() => setIsChangingPassword(true)}
                >
                  <Key className="h-4 w-4 mr-3" />
                  Изменить пароль
                </Button>
                <Button variant="outline" className="w-full justify-start hover:bg-purple-50">
                  <Bell className="h-4 w-4 mr-3" />
                  Настройки уведомлений
                </Button>
                <Button variant="outline" className="w-full justify-start hover:bg-green-50">
                  <Download className="h-4 w-4 mr-3" />
                  Экспорт данных
                </Button>
                <Button variant="outline" className="w-full justify-start hover:bg-orange-50">
                  <Upload className="h-4 w-4 mr-3" />
                  Импорт данных
                </Button>
                <Separator />
                <Button 
                  variant="outline" 
                  className="w-full justify-start hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                  onClick={handleSignOut}
                >
                  <Trash2 className="h-4 w-4 mr-3" />
                  Выйти из аккаунта
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-lg">Последняя активность</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Bot className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Создан новый двойник</p>
                    <p className="text-xs text-gray-500">2 часа назад</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <MessageCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Анализ сообщений</p>
                    <p className="text-xs text-gray-500">Вчера</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <SettingsIcon className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Обновлен профиль</p>
                    <p className="text-xs text-gray-500">3 дня назад</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}