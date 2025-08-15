import React, { useState, useEffect } from 'react';
import { Upload, Mic, Volume2, Play, Pause, Trash2, Clock, CheckCircle, AlertCircle, Lock, CreditCard, Sparkles, Zap, Brain, Star, MessageSquare, Send, Shield } from 'lucide-react';
import { VoiceCloneService } from '../services/voiceCloneService';
import { VoiceCloneData } from '../types/voice';
import { elevenLabsService } from '../services/elevenLabsService';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

export function VoiceCloningPage() {
  const [voiceClones, setVoiceClones] = useState<VoiceCloneData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [voiceName, setVoiceName] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testText, setTestText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadVoiceClones();
    // Poll for status updates every 5 seconds
    const interval = setInterval(loadVoiceClones, 5000);
    return () => clearInterval(interval);
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
      }
    };
  }, [currentAudio]);

  // Supported audio MIME types for Supabase Storage
  const supportedMimeTypes = [
    'audio/mpeg',     // MP3
    'audio/wav',      // WAV
    'audio/ogg',      // OGG
    'audio/mp4',      // M4A (proper MIME type)
    'audio/aac'       // AAC
  ];

  const loadVoiceClones = async () => {
    try {
      const clones = await VoiceCloneService.getAllVoiceClones();
      setVoiceClones(clones);
    } catch (error) {
      console.error('Error loading voice clones:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    // Check if file type is supported
    if (!supportedMimeTypes.includes(file.type)) {
      setError(`Неподдерживаемый формат файла: ${file.type}. Поддерживаются: MP3, WAV, OGG, M4A (AAC)`);
      return;
    }

    // Additional check for generic audio types
    if (!file.type.startsWith('audio/') && !supportedMimeTypes.includes(file.type)) {
      setError('Пожалуйста, выберите поддерживаемый аудио файл');
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setError('Файл слишком большой. Максимальный размер: 50MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !voiceName.trim()) {
      setError('Пожалуйста, выберите файл и введите название голоса');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await VoiceCloneService.createVoiceClone(voiceName.trim(), selectedFile);
      setSuccess('Голос успешно загружен и отправлен на обработку');
      setSelectedFile(null);
      setVoiceName('');
      loadVoiceClones();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error uploading voice:', error);
      setError('Ошибка при загрузке голоса');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (voiceId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот голос?')) {
      return;
    }

    try {
      await VoiceCloneService.deleteVoiceClone(voiceId);
      setVoiceClones(prev => prev.filter(clone => clone.id !== voiceId));
      setSuccess('Голос успешно удален');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error deleting voice:', error);
      setError('Ошибка при удалении голоса');
    }
  };

  const handleTestVoice = async (voiceId: string, voiceModelId: string) => {
    if (!testText.trim()) {
      setError('Введите текст для тестирования голоса');
      return;
    }

    if (!elevenLabsService.isConfigured()) {
      setError('ElevenLabs API не настроен. Добавьте VITE_ELEVENLABS_API_KEY в .env файл');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setPlayingId(voiceId);

    try {
      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
      }

      // Generate speech with the cloned voice
      const audioBuffer = await elevenLabsService.generateSpeech(testText.trim(), {
        voice_id: voiceModelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      });

      // Create audio blob and play
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);
      
      const audio = new Audio(audioUrl);
      setCurrentAudio(audio);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setPlayingId(null);
        setCurrentAudio(null);
      };

      audio.onerror = (error) => {
        URL.revokeObjectURL(audioUrl);
        setPlayingId(null);
        setCurrentAudio(null);
        setError('Ошибка при воспроизведении аудио');
      };

      await audio.play();
      setSuccess('Голос успешно сгенерирован и воспроизводится');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error testing voice:', error);
      setError(error instanceof Error ? error.message : 'Ошибка при генерации голоса');
      setPlayingId(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
      setCurrentAudio(null);
    }
    setPlayingId(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'processing':
        return 'Обрабатывается';
      case 'completed':
        return 'Готов';
      case 'failed':
        return 'Ошибка';
      default:
        return 'Неизвестно';
    }
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

  return (
    <TooltipProvider>
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="relative inline-block">
            <div className="p-6 bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 rounded-3xl shadow-2xl">
              <Mic className="h-12 w-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg animate-pulse">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
              Клонирование голоса
            </h1>
            <div className="flex justify-center items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Shield className="h-4 w-4" />
                <span>ElevenLabs Integration</span>
              </div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="flex items-center space-x-1">
                <Zap className="h-4 w-4" />
                <span>Real-time Processing</span>
              </div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="flex items-center space-x-1">
                <Brain className="h-4 w-4" />
                <span>Neural Voice Synthesis</span>
              </div>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Корпоративное решение для создания высококачественных голосовых моделей с использованием передовых нейросетевых технологий
            </p>
          </div>

          {/* Stats */}
          <div className="flex justify-center space-x-8 pt-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{voiceClones.length}</div>
              <div className="text-sm text-gray-500 font-medium">Голосов создано</div>
            </div>
            <Separator orientation="vertical" className="h-12" />
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-600">
                {voiceClones.filter(clone => clone.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-500 font-medium">Готовых к использованию</div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {success && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="text-green-700 font-medium">{success}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Section */}
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-purple-50/30">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Upload className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Загрузить образец голоса</CardTitle>
                <CardDescription>Загрузите аудио файл для создания клона вашего голоса</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Voice Name Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Название голоса
              </label>
              <input
                type="text"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm"
                placeholder="Например: Мой голос"
                maxLength={50}
              />
            </div>

            {/* File Upload Area */}
            <div
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                dragActive
                  ? 'border-purple-400 bg-purple-50'
                  : selectedFile
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-300 bg-gray-50 hover:border-purple-300 hover:bg-purple-50/50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                type="file"
                accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/aac,.mp3,.wav,.ogg,.m4a,.aac"
                onChange={handleFileInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              <div className="space-y-4">
                <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center ${
                  selectedFile ? 'bg-green-100' : 'bg-purple-100'
                }`}>
                  {selectedFile ? (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  ) : (
                    <Upload className="h-8 w-8 text-purple-600" />
                  )}
                </div>
                
                {selectedFile ? (
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-green-700">
                      Файл выбран: {selectedFile.name}
                    </p>
                    <p className="text-sm text-green-600">
                      Размер: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-gray-700">
                      Перетащите аудио файл сюда или нажмите для выбора
                    </p>
                    <p className="text-sm text-gray-500">
                      Поддерживаются форматы: MP3, WAV, M4A, OGG (до 50MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Requirements */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-semibold text-blue-900 mb-3">Требования к аудио:</h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                    <span>Длительность: от 30 секунд до 5 минут</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                    <span>Качество: четкая речь без фонового шума</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                    <span>Содержание: естественная речь на русском языке</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                    <span>Формат: MP3, WAV, M4A или OGG</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !voiceName.trim() || isUploading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 py-3"
            >
              {isUploading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Загружаем...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <span>Создать клон голоса</span>
                </div>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Voice Testing Section */}
        {voiceClones.some(clone => clone.status === 'completed') && (
          <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50/30">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Тестирование голоса</CardTitle>
                  <CardDescription>Введите текст и прослушайте, как звучит ваш клонированный голос</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Text Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Текст для озвучивания
                </label>
                <div className="relative">
                  <textarea
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm resize-none"
                    placeholder="Введите текст, который хотите услышать своим голосом..."
                    rows={3}
                    maxLength={500}
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                    {testText.length}/500
                  </div>
                </div>
              </div>

              {/* Quick Text Examples */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Быстрые примеры:
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Привет! Это мой клонированный голос.',
                    'Как дела? Надеюсь, у тебя все хорошо.',
                    'Технологии искусственного интеллекта развиваются очень быстро.',
                    'Сегодня прекрасная погода для прогулки.'
                  ].map((example, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setTestText(example)}
                      className="text-xs hover:bg-blue-50 hover:border-blue-300"
                    >
                      {example.length > 30 ? `${example.substring(0, 30)}...` : example}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Voice Selection and Test */}
              <div className="space-y-4">
                <label className="text-sm font-medium text-gray-700">
                  Выберите голос для тестирования:
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {voiceClones
                    .filter(clone => clone.status === 'completed' && clone.processingData?.elevenlabs_voice_id)
                    .map((clone) => (
                      <Card key={clone.id} className="border border-gray-200 hover:border-blue-300 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Volume2 className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{clone.name}</h4>
                                <p className="text-xs text-gray-500">
                                  Качество: {clone.processingData?.quality_score || 0}%
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {playingId === clone.id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={stopAudio}
                                  className="border-red-300 text-red-600 hover:bg-red-50"
                                >
                                  <Pause className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                onClick={() => handleTestVoice(clone.id, clone.processingData?.elevenlabs_voice_id!)}
                                disabled={!testText.trim() || isGenerating || playingId === clone.id}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                {isGenerating && playingId === clone.id ? (
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : playingId === clone.id ? (
                                  <Volume2 className="h-3 w-3" />
                                ) : (
                                  <Play className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
                
                {voiceClones.filter(clone => clone.status === 'completed' && clone.processingData?.elevenlabs_voice_id).length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Mic className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600">
                      Нет готовых голосов для тестирования. Создайте и дождитесь обработки голоса.
                    </p>
                  </div>
                )}
              </div>

              {/* ElevenLabs Status */}
              <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${elevenLabsService.isConfigured() ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <Zap className={`h-4 w-4 ${elevenLabsService.isConfigured() ? 'text-green-600' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        AI TWIN API: {elevenLabsService.isConfigured() ? 'Подключен' : 'Не настроен'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {elevenLabsService.isConfigured() 
                          ? 'Можно тестировать голоса с реальной генерацией речи'
                          : 'Добавьте VITE_ELEVENLABS_API_KEY в .env файл для тестирования голосов'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        )}

        {/* Voice Clones List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
              <p className="text-gray-600 font-medium">Загружаем ваши голоса...</p>
            </div>
          </div>
        ) : voiceClones.length === 0 ? (
          <Card className="max-w-2xl mx-auto border-dashed border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-white">
            <CardContent className="text-center py-16">
              <div className="relative mx-auto w-32 h-32 mb-8">
                <div className="p-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl w-full h-full flex items-center justify-center shadow-inner">
                  <Mic className="h-16 w-16 text-gray-400" />
                </div>
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Создайте свой первый клон голоса
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                Загрузите образец своего голоса и получите персональную модель для озвучивания ответов ИИ
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {voiceClones.map((clone) => (
              <Card key={clone.id} className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Mic className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          {clone.name}
                        </CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          {getStatusIcon(clone.status)}
                          <Badge className={`text-xs ${getStatusColor(clone.status)}`}>
                            {getStatusText(clone.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(clone.id)}
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Удалить голос</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Voice Details */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Создан:</span>
                      <span className="text-gray-900 font-medium">
                        {formatDate(clone.createdAt)}
                      </span>
                    </div>
                    
                    {clone.status === 'completed' && clone.processingData?.quality_score && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Качество:</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-300"
                              style={{ width: `${clone.processingData.quality_score}%` }}
                            />
                          </div>
                          <span className="text-gray-900 font-medium text-xs">
                            {clone.processingData.quality_score}%
                          </span>
                        </div>
                      </div>
                    )}

                    {clone.status === 'processing' && (
                      <div className="flex items-center space-x-2 text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg">
                        <Clock className="h-4 w-4 animate-spin" />
                        <span>Обработка может занять до 5 минут</span>
                      </div>
                    )}

                    {clone.status === 'failed' && (
                      <div className="flex items-center space-x-2 text-sm text-red-700 bg-red-50 p-3 rounded-lg">
                        <AlertCircle className="h-4 w-4" />
                        <span>Ошибка обработки. Попробуйте загрузить другой файл</span>
                      </div>
                    )}

                    {clone.status === 'completed' && clone.processingData?.elevenlabs_voice_id && (
                      <div className="flex items-center space-x-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
                        <CheckCircle className="h-4 w-4" />
                        <span>Готов к использованию в чатах</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {clone.status === 'completed' && clone.processingData?.elevenlabs_voice_id && (
                    <div className="pt-2">
                      <Button
                        onClick={() => handleTestVoice(clone.id, clone.processingData?.elevenlabs_voice_id!)}
                        disabled={!testText.trim() || isGenerating}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                        size="sm"
                      >
                        {isGenerating && playingId === clone.id ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Генерируем...</span>
                          </div>
                        ) : playingId === clone.id ? (
                          <div className="flex items-center space-x-2">
                            <Volume2 className="h-3 w-3" />
                            <span>Воспроизводится</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Play className="h-3 w-3" />
                            <span>Тестировать голос</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}