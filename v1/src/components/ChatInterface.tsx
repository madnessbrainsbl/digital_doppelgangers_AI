import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, RotateCcw, Settings, Edit3, Save, X, Volume2, VolumeX, Pause, Play, ArrowLeft, Sparkles, MessageCircle, Brain, Zap, Calendar } from 'lucide-react';
import { DigitalTwinData } from '../types/telegram';
import { ChatService } from '../services/chatService';
import { ChatMessage } from '../types/chat';
import { geminiService } from '../services/geminiService';
import { DigitalTwinService } from '../services/digitalTwinService';
import { speechService } from '../services/speechService';
import { ProcessedMessage } from '../types/telegram';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { CreateEventModal } from './CreateEventModal';
import { CalendarService, ExtractedEventInfo } from '../services/calendarService';
import { ResponseSpeedSettings } from './ResponseSpeedSettings';
import { responseTimerService } from '../services/responseTimerService';

interface ChatInterfaceProps {
  digitalTwin: DigitalTwinData;
  onBack: () => void;
}

export function ChatInterface({ digitalTwin, onBack }: ChatInterfaceProps) {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isGeminiConfigured, setIsGeminiConfigured] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [tempName, setTempName] = useState(digitalTwin.name);
  const [tempPrompt, setTempPrompt] = useState(digitalTwin.systemPrompt);
  const [currentTwin, setCurrentTwin] = useState(digitalTwin);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [allTelegramMessages, setAllTelegramMessages] = useState<ProcessedMessage[]>([]);
  const [showQualityIndicator, setShowQualityIndicator] = useState(false);
  const [lastResponseQuality, setLastResponseQuality] = useState<{
    followsStyle: boolean;
    usesPersonality: boolean;
    isNatural: boolean;
    suggestions: string[];
  } | null>(null);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [extractedEventInfo, setExtractedEventInfo] = useState<ExtractedEventInfo | null>(null);
  const [showResponseSpeedSettings, setShowResponseSpeedSettings] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState('');

  useEffect(() => {
    initializeSession();
    setIsGeminiConfigured(geminiService.isConfigured());
    setSpeechEnabled(speechService.getEnabled());
    loadTelegramMessages();
  }, [digitalTwin.id]);

  const initializeSession = async () => {
    try {
      const session = await ChatService.createSession(digitalTwin.id);
      setSessionId(session.id);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const loadTelegramMessages = async () => {
    try {
      const telegramMessages = await DigitalTwinService.getTelegramMessages(digitalTwin.id);
      setAllTelegramMessages(telegramMessages);
    } catch (error) {
      console.error('Error loading telegram messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading || !sessionId) return;

    const text = inputText.trim();
    setInputText('');
    inputRef.current?.focus();
    
    await sendMessage(text);
  };

  const sendMessage = async (text: string) => {
    if (!sessionId) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Save user message to database
    try {
      await ChatService.saveMessage(sessionId, text, true);
    } catch (error) {
      console.error('Error saving user message:', error);
    }

    // Add loading message
    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      text: '',
      isUser: false,
      timestamp: new Date(),
      isLoading: true
    };

    setMessages(prev => [...prev, loadingMessage]);

    try {
      // Получаем контекст из предыдущих сессий
      const previousContext = await ChatService.getContextFromPreviousSessions(currentTwin.id, sessionId);
      
      // Подготавливаем историю разговора для контекста
      const conversationHistory = messages
        .filter(msg => !msg.isLoading)
        .slice(-8) // Берем последние 8 сообщений для лучшего контекста
        .map(msg => ({
          role: msg.isUser ? 'user' as const : 'assistant' as const,
          content: msg.text
        }));

      // Генерируем ответ через Gemini или используем заглушку
      let response = isGeminiConfigured 
        ? await geminiService.generateResponse(text, currentTwin.systemPrompt, conversationHistory, allTelegramMessages)
        : await simulateOpenAIResponse(text, currentTwin.systemPrompt);

      // Анализируем качество ответа и улучшаем его при необходимости
      if (isGeminiConfigured && showQualityIndicator) {
        const qualityAnalysis = ChatService.analyzeResponseQuality(response, currentTwin.systemPrompt);
        setLastResponseQuality(qualityAnalysis);
        
        // Если ответ не соответствует стилю, генерируем улучшенную версию
        if (!qualityAnalysis.followsStyle || !qualityAnalysis.usesPersonality) {
          console.log('Improving response quality:', qualityAnalysis.suggestions);
          
          const improvementPrompt = `
${currentTwin.systemPrompt}

ПРЕДЫДУЩИЙ ОТВЕТ (требует улучшения):
"${response}"

ПРОБЛЕМЫ:
${qualityAnalysis.suggestions.join('\n')}

ПОЖАЛУЙСТА, ПЕРЕПИШИ ОТВЕТ, УЧИТЫВАЯ ВЫШЕУКАЗАННЫЕ ПРОБЛЕМЫ.
Отвечай на сообщение: "${text}"
`;

          try {
            const improvedResponse = await geminiService.generateResponse(
              text,
              improvementPrompt,
              conversationHistory.slice(-4), // Используем меньше контекста для перегенерации
              allTelegramMessages
            );
            
            if (improvedResponse && improvedResponse.trim()) {
              response = improvedResponse;
              // Анализируем улучшенный ответ
              const improvedQuality = ChatService.analyzeResponseQuality(improvedResponse, currentTwin.systemPrompt);
              setLastResponseQuality(improvedQuality);
            }
          } catch (error) {
            console.error('Error improving response:', error);
            // Используем оригинальный ответ если улучшение не удалось
          }
        }
      } else if (isGeminiConfigured) {
        // Просто анализируем качество без улучшения
        const qualityAnalysis = ChatService.analyzeResponseQuality(response, currentTwin.systemPrompt);
        setLastResponseQuality(qualityAnalysis);
      }
      
      // Используем систему контроля времени ответа
      const settings = responseTimerService.getTwinResponseSettings(currentTwin.id);
      
      if (settings.enableTypingIndicator || settings.enableThinkingDelay) {
        // Симулируем реалистичный ответ
        await responseTimerService.simulateTyping(
          response,
          (partialText, isComplete) => {
            setMessages(prev => prev.map(msg => 
              msg.id === loadingMessage.id 
                ? { ...msg, text: partialText, isLoading: !isComplete }
                : msg
            ));
          },
          async () => {
            // Сохраняем полный ответ в базу данных
            await ChatService.saveMessage(sessionId, response, false);
            
            // Speak the response if speech is enabled
            if (speechEnabled && speechService.getEnabled()) {
              speakMessage(response, loadingMessage.id);
            }
          }
        );
      } else {
        // Мгновенный ответ
        setMessages(prev => prev.map(msg => 
          msg.id === loadingMessage.id 
            ? { ...msg, text: response, isLoading: false }
            : msg
        ));

        // Save AI response to database
        await ChatService.saveMessage(sessionId, response, false);

        // Speak the response if speech is enabled
        if (speechEnabled && speechService.getEnabled()) {
          speakMessage(response, loadingMessage.id);
        }
      }
    } catch (error) {
      console.error('Error generating response:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Извините, произошла ошибка при генерации ответа.';
        
      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessage.id 
          ? { ...msg, text: errorMessage, isLoading: false }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const speakMessage = async (text: string, messageId: string) => {
    try {
      setSpeakingMessageId(messageId);
      setIsSpeaking(true);
      
      await speechService.speak(text, {
        onStart: () => {
          setIsSpeaking(true);
        },
        onEnd: () => {
          setIsSpeaking(false);
          setSpeakingMessageId(null);
        },
        onError: (error) => {
          console.error('Speech error:', error);
          setIsSpeaking(false);
          setSpeakingMessageId(null);
        }
      });
    } catch (error) {
      console.error('Failed to speak message:', error);
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    }
  };

  const toggleSpeech = () => {
    const newEnabled = !speechEnabled;
    setSpeechEnabled(newEnabled);
    speechService.setEnabled(newEnabled);
    
    if (!newEnabled && isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    }
  };

  const stopSpeaking = () => {
    speechService.stop();
    setIsSpeaking(false);
    setSpeakingMessageId(null);
  };

  const clearChat = async () => {
    setMessages([]);
    // Stop any ongoing speech
    if (isSpeaking) {
      stopSpeaking();
    }
    // Create new session
    await initializeSession();
  };

  const handleSaveName = async () => {
    if (tempName.trim() && tempName !== currentTwin.name) {
      try {
        // В реальном приложении здесь был бы вызов API для обновления имени
        // Пока просто обновляем локальное состояние
        setCurrentTwin(prev => ({ ...prev, name: tempName.trim() }));
        setEditingName(false);
      } catch (error) {
        console.error('Error updating name:', error);
        alert('Ошибка при сохранении названия');
      }
    } else {
      setEditingName(false);
      setTempName(currentTwin.name);
    }
  };

  const handleSavePrompt = async () => {
    if (tempPrompt.trim() && tempPrompt !== currentTwin.systemPrompt) {
      try {
        await DigitalTwinService.updateTwinPrompt(currentTwin.id, tempPrompt.trim());
        setCurrentTwin(prev => ({ ...prev, systemPrompt: tempPrompt.trim() }));
        setEditingPrompt(false);
      } catch (error) {
        console.error('Error updating prompt:', error);
        alert('Ошибка при сохранении промпта');
      }
    } else {
      setEditingPrompt(false);
      setTempPrompt(currentTwin.systemPrompt);
    }
  };

  const handleCancelEdit = (type: 'name' | 'prompt') => {
    if (type === 'name') {
      setEditingName(false);
      setTempName(currentTwin.name);
    } else {
      setEditingPrompt(false);
      setTempPrompt(currentTwin.systemPrompt);
    }
  };

  const handleCreateEvent = async () => {
    try {
      // Получаем последние сообщения для анализа
      const recentMessages = messages
        .filter(msg => !msg.isLoading)
        .slice(-10)
        .map(msg => msg.text);

      if (recentMessages.length === 0) {
        alert('Нет сообщений для анализа');
        return;
      }

      // Вызываем Edge Function для извлечения информации
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-event-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          messages: recentMessages,
          twinContext: currentTwin.systemPrompt
        })
      });

      if (!response.ok) {
        throw new Error('Ошибка при извлечении информации');
      }

      const data = await response.json();
      
      if (data.success && data.extractedInfo) {
        setExtractedEventInfo(data.extractedInfo);
        setShowCreateEventModal(true);
      } else {
        alert('Не удалось извлечь информацию о событии из чата');
      }
    } catch (error) {
      console.error('Error extracting event info:', error);
      alert('Ошибка при анализе чата');
    }
  };

  const handleEventCreated = (event: any) => {
    setShowCreateEventModal(false);
    setExtractedEventInfo(null);
    // Можно добавить уведомление об успешном создании события
    console.log('Event created:', event);
  };

  const handleResponseSpeedSettingsClose = () => {
    setShowResponseSpeedSettings(false);
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Header */}
        <Card className="rounded-none border-b shadow-sm bg-white/95 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {/* Left side - Back button and Twin info */}
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onBack}
                  className="hover:bg-muted flex-shrink-0"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="relative">
                    <div className="p-4 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 rounded-2xl shadow-lg">
                      <Bot className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    {editingName ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          className="text-lg font-bold bg-muted border border-border rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-ring min-w-0 flex-1"
                          placeholder="Название чата"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveName();
                            if (e.key === 'Escape') handleCancelEdit('name');
                          }}
                          autoFocus
                        />
                        <Button size="sm" onClick={handleSaveName} className="bg-green-600 hover:bg-green-700">
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleCancelEdit('name')}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 group min-w-0">
                        <h2 className="text-xl font-bold truncate bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">{currentTwin.name}</h2>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingName(true)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <p className="text-sm text-violet-600 font-semibold">Premium AI Active</p>
                      <Badge variant="outline" className="text-xs bg-gradient-to-r from-violet-50 to-purple-50 text-violet-700 border-violet-200">
                        Gemini 2.5 Pro
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side - Controls */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                {!isGeminiConfigured && (
                  <Badge variant="outline" className="hidden sm:flex bg-yellow-50 text-yellow-700 border-yellow-200">
                    Демо режим
                  </Badge>
                )}
                
                {/* Speech controls */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={speechEnabled ? "default" : "outline"}
                      size="icon"
                      onClick={toggleSpeech}
                      className={speechEnabled ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {speechEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {speechEnabled ? 'Отключить озвучивание' : 'Включить озвучивание'}
                  </TooltipContent>
                </Tooltip>
                
                {isSpeaking && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={stopSpeaking}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Остановить озвучивание</TooltipContent>
                  </Tooltip>
                )}
                
                {/* Settings and clear */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={showSettings ? "default" : "outline"}
                      size="icon"
                      onClick={() => setShowSettings(!showSettings)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Настройки</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={clearChat}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Очистить чат</TooltipContent>
                </Tooltip>

                {/* Create Event Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={handleCreateEvent}
                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Создать событие из чата</TooltipContent>
                </Tooltip>

                {/* Response Speed Settings Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setShowResponseSpeedSettings(true)}
                      className="border-purple-200 text-purple-600 hover:bg-purple-50"
                    >
                      <Zap className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Настройки скорости ответа</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Panel */}
        {showSettings && (
          <Card className="rounded-none border-b shadow-sm bg-white/95 backdrop-blur-md">
            <CardContent className="p-4">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Настройки двойника</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Speech Settings */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Озвучивание</h4>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${speechEnabled ? 'bg-green-100' : 'bg-muted'}`}>
                        {speechEnabled ? <Volume2 className="h-4 w-4 text-green-600" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div>
                        <span className="text-sm font-medium">
                          {speechEnabled ? 'Включено' : 'Отключено'}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {speechService.isSupported() 
                            ? 'Ответы будут озвучиваться автоматически' 
                            : 'Синтез речи не поддерживается браузером'
                          }
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={speechEnabled ? "default" : "outline"}
                      size="sm"
                      onClick={toggleSpeech}
                      disabled={!speechService.isSupported()}
                      className={speechEnabled ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {speechEnabled ? 'Выкл' : 'Вкл'}
                    </Button>
                  </div>
                </div>

                {/* Quality Analysis Settings */}
                {isGeminiConfigured && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Анализ качества ответов</h4>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${showQualityIndicator ? 'bg-gradient-to-br from-violet-100 to-purple-100' : 'bg-muted'}`}>
                          <Brain className={`h-4 w-4 ${showQualityIndicator ? 'text-violet-600' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <span className="text-sm font-medium">
                            {showQualityIndicator ? 'Включено' : 'Отключено'}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            Автоматический анализ и улучшение качества ответов
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowQualityIndicator(!showQualityIndicator)}
                      >
                        {showQualityIndicator ? 'Отключить' : 'Включить'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Last Response Quality Indicator */}
                {showQualityIndicator && lastResponseQuality && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Качество последнего ответа</h4>
                    <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Следует стилю:</span>
                        <Badge variant={lastResponseQuality.followsStyle ? "default" : "destructive"} className="text-xs">
                          {lastResponseQuality.followsStyle ? '✅ Да' : '❌ Нет'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Использует личность:</span>
                        <Badge variant={lastResponseQuality.usesPersonality ? "default" : "destructive"} className="text-xs">
                          {lastResponseQuality.usesPersonality ? '✅ Да' : '❌ Нет'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Естественность:</span>
                        <Badge variant={lastResponseQuality.isNatural ? "default" : "destructive"} className="text-xs">
                          {lastResponseQuality.isNatural ? '✅ Да' : '❌ Нет'}
                        </Badge>
                      </div>
                      {lastResponseQuality.suggestions.length > 0 && (
                        <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                          <p className="text-xs font-medium text-yellow-800 mb-1">Рекомендации:</p>
                          <ul className="text-xs text-yellow-700 space-y-1">
                            {lastResponseQuality.suggestions.map((suggestion, index) => (
                              <li key={index}>• {suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <Separator />
                
                {/* System Prompt Editor */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Системный промпт</h4>
                    {!editingPrompt && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingPrompt(true)}
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Редактировать
                      </Button>
                    )}
                  </div>
                  
                  {editingPrompt ? (
                    <div className="space-y-3">
                      <textarea
                        value={tempPrompt}
                        onChange={(e) => setTempPrompt(e.target.value)}
                        className="w-full h-32 p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none text-sm font-mono bg-background"
                        placeholder="Введите системный промпт..."
                      />
                      <div className="flex items-center space-x-2">
                        <Button onClick={handleSavePrompt} size="sm">
                          <Save className="h-4 w-4 mr-2" />
                          Сохранить
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleCancelEdit('prompt')}>
                          <X className="h-4 w-4 mr-2" />
                          Отмена
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg max-h-32 overflow-y-auto">
                      <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                        {currentTwin.systemPrompt}
                      </pre>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Twin Info */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-xl font-bold text-blue-600">{currentTwin.messagesCount}</div>
                    <div className="text-xs text-blue-600 font-medium">Сообщений</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-sm font-bold text-purple-600 capitalize">{currentTwin.profile.communicationStyle}</div>
                    <div className="text-xs text-purple-600 font-medium">Стиль</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold text-green-600">{currentTwin.profile.interests.length}</div>
                    <div className="text-xs text-green-600 font-medium">Интересов</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Messages Container */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <Card className="max-w-md mx-auto border-dashed border-2 border-muted-foreground/25">
                    <CardContent className="p-8 text-center">
                      <div className="relative mx-auto w-20 h-20 mb-6">
                        <div className="p-6 bg-gradient-to-br from-muted to-muted/50 rounded-3xl w-full h-full flex items-center justify-center shadow-inner">
                          <Bot className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="absolute -top-1 -right-1 p-1 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full shadow-lg animate-pulse">
                          <Sparkles className="h-3 w-3 text-white" />
                        </div>
                      </div>
                      
                      <CardTitle className="text-xl mb-4">
                        Начните разговор с вашим двойником
                      </CardTitle>
                      <CardDescription className="mb-4">
                        Задайте любой вопрос или просто поздоровайтесь
                      </CardDescription>
                      
                      {!isGeminiConfigured && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          ⚠️ Работает в демо режиме
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${
                    message.isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {!message.isUser && (
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl shadow-lg flex-shrink-0">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  
                  <Card
                    className={`max-w-[85%] sm:max-w-sm lg:max-w-lg shadow-lg ${
                      message.isUser
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0'
                        : `bg-background border ${
                            speakingMessageId === message.id ? 'ring-2 ring-green-400 ring-opacity-50' : ''
                          }`
                    }`}
                  >
                    <CardContent className="p-3">
                      {message.isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm text-muted-foreground ml-2 font-medium">печатает...</span>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <p className="text-sm leading-relaxed font-medium flex-1 break-words">{message.text}</p>
                          {!message.isUser && speechService.isSupported() && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => speakMessage(message.text, message.id)}
                              disabled={isSpeaking}
                              className={`ml-3 p-1 h-auto hover:scale-110 flex-shrink-0 ${
                                speakingMessageId === message.id 
                                  ? 'bg-green-100 text-green-600' 
                                  : 'hover:bg-muted'
                              } ${isSpeaking && speakingMessageId !== message.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {speakingMessageId === message.id ? (
                                <div className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Volume2 className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {message.isUser && (
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg flex-shrink-0">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Input Area */}
        <Card className="rounded-none border-t shadow-sm bg-white/95 backdrop-blur-md">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="flex items-end space-x-3">
              <div className="flex-1 min-w-0">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Напишите сообщение..."
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 bg-background shadow-sm text-base resize-none"
                />
              </div>
              <Button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex-shrink-0"
              >
                <Send className="h-5 w-5 sm:mr-2" />
                <span className="hidden sm:inline">Отправить</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Create Event Modal */}
        <CreateEventModal
          isOpen={showCreateEventModal}
          onClose={() => {
            setShowCreateEventModal(false);
            setExtractedEventInfo(null);
          }}
          onEventCreated={handleEventCreated}
          chatContext={messages.slice(-5).map(msg => msg.text).join('\n\n')}
          extractedInfo={extractedEventInfo || undefined}
          currentTwinId={currentTwin.id}
        />

        {/* Response Speed Settings Modal */}
        {showResponseSpeedSettings && (
          <ResponseSpeedSettings onClose={handleResponseSpeedSettingsClose} />
        )}
      </div>
    </TooltipProvider>
  );
}

// Simulate OpenAI response for demo with system prompt awareness
async function simulateOpenAIResponse(userMessage: string, systemPrompt: string): Promise<string> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // Анализируем системный промпт для определения стиля
  const isEnergetic = systemPrompt.toLowerCase().includes('энергичный') || systemPrompt.toLowerCase().includes('живой');
  const isFormal = systemPrompt.toLowerCase().includes('формальный') || systemPrompt.toLowerCase().includes('деловой');
  const isCasual = systemPrompt.toLowerCase().includes('неформальный') || systemPrompt.toLowerCase().includes('дружеский');
  const isThoughtful = systemPrompt.toLowerCase().includes('вдумчивый') || systemPrompt.toLowerCase().includes('аналитический');
  
  // Извлекаем имя из промпта
  const nameMatch = systemPrompt.match(/Ты — ([^,\n]+)/);
  const name = nameMatch ? nameMatch[1].trim() : 'друг';
  
  // Извлекаем интересы из промпта
  const interestsMatch = systemPrompt.match(/интересует: ([^.\n]+)/);
  const interests = interestsMatch ? interestsMatch[1] : '';
  
  // Базовые ответы в зависимости от стиля
  let responses: string[] = [];
  
  if (isEnergetic) {
    responses = [
      `Привет! 😊 Как дела? Я ${name}, рад пообщаться!`,
      `Ого, интересная тема! 🤔 Дай подумаю... Вообще, я бы сказал, что это довольно крутая штука!`,
      `Ха, это мне напоминает одну историю! 😄 В общем, я думаю, что тут все очень интересно!`,
      `Понимаю тебя! 👍 У меня тоже бывают такие мысли. Давай разберемся вместе!`,
      `Отличная идея! 🚀 Я бы тоже так сделал. Кстати, а ты уже пробовал это раньше?`,
      `Хм, а знаешь что? 🤔 Я думаю, что здесь есть несколько вариантов. Какой тебе больше нравится?`
    ];
  } else if (isFormal) {
    responses = [
      `Здравствуйте. Я ${name}. Готов обсудить интересующие вас вопросы.`,
      `Интересный вопрос. Позвольте подумать... Считаю, что это довольно сложная тема, требующая детального рассмотрения.`,
      `Это напоминает мне одну ситуацию. В целом, полагаю, что здесь есть несколько аспектов для анализа.`,
      `Понимаю вашу точку зрения. У меня также возникали подобные мысли. Предлагаю разобрать это детально.`,
      `Хорошая идея. Я бы также рекомендовал такой подход. Кстати, уже пробовали реализовать это ранее?`,
      `Интересно. Считаю, что здесь есть несколько вариантов решения. Какой из них вам кажется наиболее подходящим?`
    ];
  } else if (isThoughtful) {
    responses = [
      `Привет. Я ${name}. Давай подумаем об этом вместе.`,
      `Хм, интересный вопрос... Дай мне время подумать. Это действительно сложная тема, которая требует глубокого анализа.`,
      `Это напоминает мне одну мысль... В целом, я думаю, что здесь есть несколько слоев для понимания.`,
      `Понимаю тебя. У меня тоже возникали подобные размышления. Давай разберем это по порядку.`,
      `Хорошая идея. Я бы тоже подошел к этому так. Кстати, а ты уже анализировал это раньше?`,
      `Интересно... Я думаю, что здесь есть несколько аспектов. Какой из них тебя больше интересует?`
    ];
  } else {
    // Casual/neutral style
    responses = [
      `Привет! Я ${name}. Как дела?`,
      `Интересный вопрос! Дай подумаю... Вообще, я бы сказал, что это довольно интересная тема.`,
      `Ха, это мне напоминает одну историю! В общем, я думаю, что тут все не так просто.`,
      `Понимаю тебя. У меня тоже бывают такие мысли. Давай разберемся вместе.`,
      `Отличная идея! Я бы тоже так сделал. Кстати, а ты уже пробовал это раньше?`,
      `Хм, а знаешь что? Я думаю, что здесь есть несколько вариантов. Какой тебе больше нравится?`
    ];
  }
  
  // Добавляем персонализацию на основе интересов
  if (interests && Math.random() > 0.7) {
    const interestArray = interests.split(',').map(i => i.trim());
    const randomInterest = interestArray[Math.floor(Math.random() * interestArray.length)];
    responses.push(`Кстати, раз уж мы об этом говорим, а что ты думаешь про ${randomInterest}?`);
  }
  
  return responses[Math.floor(Math.random() * responses.length)];
}