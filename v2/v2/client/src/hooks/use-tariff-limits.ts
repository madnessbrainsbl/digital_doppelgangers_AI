import { useQuery } from "@tanstack/react-query";

// Интерфейс для данных тарифа
interface TariffLimits {
  assistantsLimit: number;
  channelsLimit: number;
  messagesLimit: number;
  knowledgeLimit: number;
  callMinutesLimit: number;
  apiCallsLimit: number;
  usersLimit: number;
}

// Интерфейс для текущего использования ресурсов
interface UsageData {
  assistants: {
    used: number;
    limit: number;
    percentage: number;
  };
  channels: {
    used: number;
    limit: number;
    percentage: number;
  };
  messages: {
    used: number;
    limit: number;
    percentage: number;
  };
  knowledge: {
    used: number;
    limit: number;
    percentage: number;
  };
  callMinutes: {
    used: number;
    limit: number;
    percentage: number;
  };
  apiCalls: {
    used: number;
    limit: number;
    percentage: number;
  };
  users: {
    used: number;
    limit: number;
    percentage: number;
  };
}

// Интерфейс для результата хука
interface UseTariffLimitsResult {
  isLoading: boolean;
  isError: boolean;
  canCreateAssistant: boolean;
  assistantsLimit: number;
  assistantsUsed: number;
  assistantsPercentage: number;
  errorMessage?: string;
  isPlanLimited: boolean;
  canCreateChannel: boolean;
  channelsLimit: number;
  channelsUsed: number;
  channelsPercentage: number;
  isBasicPlan: boolean;
  allowedChannelTypes: string[];
}

export function useTariffLimits(): UseTariffLimitsResult {
  // Получаем текущего пользователя и его тариф
  const { data: user, isLoading: isUserLoading, isError: isUserError } = useQuery<{id: number, name: string, email: string, plan: string}>({
    queryKey: ['/api/auth/me'],
  });

  // Получаем данные об использовании ресурсов
  const { data: usageData, isLoading: isUsageLoading, isError: isUsageError } = useQuery<UsageData>({
    queryKey: ['/api/usage', user?.id],
    queryFn: async () => {
      if (!user?.id) return null as any;
      const response = await fetch(`/api/usage/${user.id}`);
      if (!response.ok) {
        throw new Error('Не удалось получить данные использования');
      }
      return response.json();
    },
    enabled: !!user?.id,
    // Увеличиваем интервал обновления до 5 минут
    refetchInterval: 300000,
    // Увеличиваем время кэширования до 4 минут
    staleTime: 240000,
    // Отключаем обновление при фокусе окна
    refetchOnWindowFocus: false,
    // Отключаем обновление при переподключении
    refetchOnReconnect: false,
  });

  // Получаем список тарифных планов для проверки ограничений
  const { data: tariffData, isLoading: isTariffsLoading, isError: isTariffsError } = useQuery<{plans: Array<{id: string, assistants_limit: number}>}>({
    queryKey: ['/api/tariff-plans'],
    queryFn: async () => {
      const response = await fetch('/api/tariff-plans');
      if (!response.ok) {
        throw new Error('Не удалось получить список тарифных планов');
      }
      return response.json();
    },
  });

  // Проверяем, можно ли создать еще одного ассистента
  const isLoading = isUserLoading || isUsageLoading || isTariffsLoading;
  const isError = isUserError || isUsageError || isTariffsError;

  // Если данные еще загружаются или произошла ошибка, возвращаем значения по умолчанию
  if (isLoading || isError || !usageData || !user || !tariffData) {
    return {
      isLoading,
      isError,
      canCreateAssistant: false,
      assistantsLimit: 0,
      assistantsUsed: 0,
      assistantsPercentage: 0,
      isPlanLimited: true,
      canCreateChannel: false,
      channelsLimit: 0,
      channelsUsed: 0,
      channelsPercentage: 0,
      isBasicPlan: false,
      allowedChannelTypes: []
    };
  }

  // Проверяем, ограничен ли тариф пользователя
  const currentPlan = user.plan || 'free';
  const planDetails = tariffData.plans.find((plan: {id: string, assistants_limit: number}) => plan.id === currentPlan);
  
  // Если не удалось найти детали тарифа, используем значения по умолчанию
  if (!planDetails) {
    return {
      isLoading: false,
      isError: true,
      canCreateAssistant: false,
      assistantsLimit: 0,
      assistantsUsed: 0,
      assistantsPercentage: 0,
      errorMessage: 'Не удалось получить информацию о текущем тарифе',
      isPlanLimited: true,
      canCreateChannel: false,
      channelsLimit: 0,
      channelsUsed: 0,
      channelsPercentage: 0,
      isBasicPlan: false,
      allowedChannelTypes: []
    };
  }

  // Определяем, является ли текущий тариф ограниченным по ассистентам
  const isPlanLimited = planDetails.assistants_limit < 999;
  
  // Проверяем, является ли тариф базовым
  const isBasicPlan = currentPlan === 'basic';
  
  // Определяем типы каналов, доступные для текущего тарифа
  // Для базового тарифа разрешены только веб-сайт и телеграм
  const allowedChannelTypes = isBasicPlan 
    ? ['web', 'telegram'] 
    : ['web', 'telegram', 'vk', 'avito', 'whatsapp', 'facebook', 'email', 'sms', 'voice'];
  
  // Возвращаем результат проверки
  return {
    isLoading: false,
    isError: false,
    canCreateAssistant: usageData.assistants.used < usageData.assistants.limit,
    assistantsLimit: usageData.assistants.limit,
    assistantsUsed: usageData.assistants.used,
    assistantsPercentage: usageData.assistants.percentage,
    isPlanLimited,
    canCreateChannel: usageData.channels.used < usageData.channels.limit,
    channelsLimit: usageData.channels.limit,
    channelsUsed: usageData.channels.used,
    channelsPercentage: usageData.channels.percentage,
    isBasicPlan,
    allowedChannelTypes
  };
}