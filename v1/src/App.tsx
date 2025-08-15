import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import { Layout } from './components/layout/Layout';
import { TwinsList } from './components/TwinsList';
import { FileUpload } from './components/FileUpload';
import { ProfileAnalysis } from './components/ProfileAnalysis';
import { SystemPromptEditor } from './components/SystemPromptEditor';
import { ChatInterface } from './components/ChatInterface';
import { ProfilePage } from './components/ProfilePage';
import { SettingsPage } from './components/SettingsPage';
import { VoiceCloningPage } from './components/VoiceCloningPage';
import { TelegramIntegrationPage } from './components/TelegramIntegrationPage';
import { TelegramUserIntegrationPage } from './components/TelegramUserIntegrationPage';
import { PersonalInfoForm } from './components/PersonalInfoForm';
import { RetrainTwinModal } from './components/RetrainTwinModal';
import { HumanBehaviorSettings } from './components/HumanBehaviorSettings';
import { DataTablesPage } from './components/DataTablesPage';
import { SupportPage } from './components/SupportPage';
import { FAQPage } from './components/FAQPage';
import { AvitoIntegrationPage } from './components/AvitoIntegrationPage';
import { CalendarPage } from './components/CalendarPage';
import { parseTelegramJSON, extractUserMessages, analyzeUserProfile, extractUserName } from './utils/telegramParser';
import { DigitalTwinService } from './services/digitalTwinService';
import { TelegramExport, UserProfile, ProcessedMessage, DigitalTwinData } from './types/telegram';

type AppState = 'twins-list' | 'upload' | 'personal-info' | 'analysis' | 'prompt-editor' | 'chat' | 'settings' | 'profile' | 'create-new' | 'voice-cloning' | 'telegram-integration' | 'telegram-user-integration' | 'data-tables' | 'support' | 'faq' | 'avito-integration' | 'calendar';

function AppContent() {
  const { user } = useAuth();
  const [currentState, setCurrentState] = useState<AppState>('twins-list');
  const [isLoading, setIsLoading] = useState(false);
  const [telegramData, setTelegramData] = useState<TelegramExport[]>([]);
  const [userMessages, setUserMessages] = useState<ProcessedMessage[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [digitalTwin, setDigitalTwin] = useState<DigitalTwinData | null>(null);
  const [twins, setTwins] = useState<DigitalTwinData[]>([]);
  const [personalInfo, setPersonalInfo] = useState<{
    name: string;
    role: string;
    interests: string[];
    additionalInfo: string;
  } | null>(null);
  const [extractedUserName, setExtractedUserName] = useState<string>('');
  const [retrainTwin, setRetrainTwin] = useState<DigitalTwinData | null>(null);
  const [behaviorSettingsTwin, setBehaviorSettingsTwin] = useState<DigitalTwinData | null>(null);

  const handleNavigate = (view: string) => {
    switch (view) {
      case 'twins-list':
        setCurrentState('twins-list');
        break;
      case 'create-new':
        handleCreateNewTwin();
        break;
      case 'voice-cloning':
        setCurrentState('voice-cloning');
        break;
      case 'telegram-integration':
        setCurrentState('telegram-integration');
        break;
      case 'telegram-user-integration':
        setCurrentState('telegram-user-integration');
        break;
      case 'data-tables':
        setCurrentState('data-tables');
        break;
      case 'support':
        setCurrentState('support');
        break;
      case 'faq':
        setCurrentState('faq');
        break;
      case 'avito-integration':
        setCurrentState('avito-integration');
        break;
      case 'calendar':
        setCurrentState('calendar');
        break;
      case 'settings':
        // Проверяем авторизацию для настроек
        if (user) {
          setCurrentState('settings');
        } else {
          // Можно показать модальное окно авторизации или просто игнорировать
          console.log('Настройки доступны только авторизованным пользователям');
        }
        break;
      case 'profile':
        // Проверяем авторизацию для профиля
        if (user) {
          setCurrentState('profile');
        } else {
          console.log('Профиль доступен только авторизованным пользователям');
        }
        break;
      default:
        setCurrentState('twins-list');
    }
  };

  const handleCreateNewTwin = () => {
    setCurrentState('upload');
  };

  const handleSelectTwin = (twin: DigitalTwinData) => {
    setDigitalTwin(twin);
    setCurrentState('chat');
  };

  const handleSelectTwinFromSidebar = (twinId: string) => {
    const twin = twins.find(t => t.id === twinId);
    if (twin) {
      handleSelectTwin(twin);
    }
  };

  const handleDeleteTwinFromSidebar = async (twinId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого цифрового двойника?')) {
      return;
    }

    try {
      await DigitalTwinService.deleteTwin(twinId);
      setTwins(prev => prev.filter(twin => twin.id !== twinId));
    } catch (error) {
      console.error('Error deleting twin:', error);
      alert('Ошибка при удалении цифрового двойника');
    }
  };

  const handleRetrainTwin = (twin: DigitalTwinData) => {
    setRetrainTwin(twin);
  };

  const handleRetrainComplete = (updatedTwin: DigitalTwinData) => {
    setTwins(prev => prev.map(twin => 
      twin.id === updatedTwin.id ? updatedTwin : twin
    ));
    setRetrainTwin(null);
  };

  const handleCloseRetrainModal = () => {
    setRetrainTwin(null);
  };

  const handleOpenBehaviorSettings = (twin: DigitalTwinData) => {
    setBehaviorSettingsTwin(twin);
  };

  const handleCloseBehaviorSettings = () => {
    setBehaviorSettingsTwin(null);
  };

  const handleBehaviorSettingsSave = (settings: any) => {
    if (behaviorSettingsTwin) {
      const updatedTwin = {
        ...behaviorSettingsTwin,
        profile: {
          ...behaviorSettingsTwin.profile,
          ...settings
        }
      };
      setTwins(prev => prev.map(twin => 
        twin.id === behaviorSettingsTwin.id ? updatedTwin : twin
      ));
      setBehaviorSettingsTwin(null);
    }
  };

  const handleFileUpload = async (content: string) => {
    setIsLoading(true);
    try {
      // Parse Telegram JSON
      const exports = parseTelegramJSON(content);
      setTelegramData(exports);

      // Extract user messages
      const messages = extractUserMessages(exports);
      setUserMessages(messages);

      // Analyze user profile
      const profile = analyzeUserProfile(messages);
      setUserProfile(profile);

      // Extract user name from telegram data
      const userName = extractUserName(exports);
      setExtractedUserName(userName);

      setCurrentState('personal-info');
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Ошибка при обработке файла. Проверьте формат JSON.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePersonalInfoSubmit = (info: { name: string; role: string; interests: string[]; additionalInfo: string }) => {
    setPersonalInfo(info);
    setCurrentState('analysis');
  };

  const handleContinueToPromptEditor = () => {
    setCurrentState('prompt-editor');
  };

  const handlePromptSave = async (systemPrompt: string) => {
    if (!userProfile || !userMessages || !personalInfo) return;
    
    setIsLoading(true);
    try {
      // Создаем уникальное имя с временной меткой
      const now = new Date();
      const timeStamp = now.toLocaleDateString('ru-RU', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      const twinName = personalInfo.name ? `${personalInfo.name} (${personalInfo.role})` : `Двойник ${userProfile.communicationStyle} от ${timeStamp}`;
      
      const twin = await DigitalTwinService.createTwin(
        twinName,
        systemPrompt,
        userProfile,
        userMessages
      );
      
      const newTwin: DigitalTwinData = {
        id: twin.id,
        name: twin.name,
        systemPrompt: twin.system_prompt,
        profile: twin.analysis_data.profile,
        messagesCount: twin.analysis_data.messages_count,
        createdAt: twin.created_at
      };
      
      setDigitalTwin(newTwin);
      setTwins(prev => [newTwin, ...prev]);
      setCurrentState('chat');
    } catch (error) {
      console.error('Error creating digital twin:', error);
      alert('Ошибка при создании цифрового двойника');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToAnalysis = () => {
    setCurrentState('analysis');
  };

  const handleBackToPromptEditor = () => {
    setCurrentState('prompt-editor');
  };

  const handleBackToTwinsList = () => {
    setCurrentState('twins-list');
    setDigitalTwin(null);
    setUserProfile(null);
    setUserMessages([]);
    setTelegramData([]);
    setPersonalInfo(null);
  };

  const handleBackToPersonalInfo = () => {
    setCurrentState('personal-info');
  };

  const renderContent = () => {
    switch (currentState) {
      case 'twins-list':
        return (
                  <TwinsList
          onCreateNew={handleCreateNewTwin}
          onSelectTwin={handleSelectTwin}
          onRetrainTwin={handleRetrainTwin}
          onOpenBehaviorSettings={handleOpenBehaviorSettings}
          twins={twins}
          setTwins={setTwins}
        />
        );

      case 'upload':
        return (
          <FileUpload
            onFileUpload={handleFileUpload}
            isLoading={isLoading}
            onBack={handleBackToTwinsList}
          />
        );

      case 'personal-info':
        return (
          <PersonalInfoForm
            onSubmit={handlePersonalInfoSubmit}
            onBack={handleBackToTwinsList}
            defaultRole={userProfile?.role}
            defaultInterests={userProfile?.interests}
            defaultName={extractedUserName}
          />
        );

      case 'analysis':
        return userProfile && personalInfo ? (
          <ProfileAnalysis 
            profile={userProfile} 
            personalInfo={personalInfo}
            onContinue={handleContinueToPromptEditor}
            onBack={handleBackToPersonalInfo}
          />
        ) : null;

      case 'prompt-editor':
        return userProfile && personalInfo ? (
          <SystemPromptEditor
            profile={userProfile}
            personalInfo={personalInfo}
            onPromptSave={handlePromptSave}
            onBack={handleBackToAnalysis}
          />
        ) : null;

      case 'chat':
        return digitalTwin ? (
          <ChatInterface 
            digitalTwin={digitalTwin}
            onBack={handleBackToTwinsList}
          />
        ) : null;

      case 'settings':
        return (
          <SettingsPage />
        );

      case 'voice-cloning':
        return (
          <VoiceCloningPage />
        );

      case 'telegram-integration':
        return (
          <TelegramIntegrationPage />
        );

      case 'telegram-user-integration':
        return (
          <TelegramUserIntegrationPage />
        );

      case 'profile':
        return (
          <ProfilePage />
        );

      case 'data-tables':
        return (
          <DataTablesPage />
        );

      case 'support':
        return (
          <SupportPage />
        );

      case 'faq':
        return (
          <FAQPage />
        );

      case 'avito-integration':
        return (
          <AvitoIntegrationPage />
        );

      case 'calendar':
        return (
          <CalendarPage onBack={handleBackToTwinsList} />
        );

      default:
        return null;
    }
  };

  return (
    <Layout
      currentView={currentState}
      onNavigate={handleNavigate}
      twins={twins}
      onSelectTwin={handleSelectTwinFromSidebar}
      onDeleteTwin={handleDeleteTwinFromSidebar}
    >
      {renderContent()}
      
      {retrainTwin && (
        <RetrainTwinModal
          twin={retrainTwin}
          onClose={handleCloseRetrainModal}
          onRetrainComplete={handleRetrainComplete}
        />
      )}
      
      {behaviorSettingsTwin && (
        <HumanBehaviorSettings
          profile={behaviorSettingsTwin.profile}
          onSave={handleBehaviorSettingsSave}
          onBack={handleCloseBehaviorSettings}
        />
      )}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;