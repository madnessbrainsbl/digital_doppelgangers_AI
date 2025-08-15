import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

interface IntegrationRequest {
  action: 'start' | 'stop' | 'update_settings' | 'get_status';
  telegram_user_id?: string;
  twin_id?: string;
  integration_id?: string;
  settings?: {
    auto_reply?: boolean;
    voice_replies?: boolean;
    delay_min?: number;
    delay_max?: number;
    work_hours?: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
}

// Глобальное хранилище активных интеграций
const activeIntegrations = new Map<string, {
  intervalId: number;
  settings: any;
  twin: any;
}>();

class TelegramIntegrationManager {
  private supabase: any;
  private telegramApiBase = 'http://85.202.193.46:8000';
  private authToken = 'Alfa2000@';

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  async startIntegration(telegramUserId: string, twinId: string, settings: any) {
    try {
      console.log(`Starting integration for user ${telegramUserId} with twin ${twinId}`);
      
      // Получаем информацию о двойнике
      const { data: twin, error: twinError } = await this.supabase
        .from('digital_twins')
        .select('*')
        .eq('id', twinId)
        .single();

      if (twinError || !twin) {
        console.error('Digital twin not found:', twinError);
        throw new Error('Digital twin not found');
      }

      // Получаем сессию пользователя
      const { data: session, error: sessionError } = await this.supabase
        .from('telegram_sessions')
        .select('*')
        .eq('user_id', telegramUserId)
        .eq('is_active', true)
        .single();

      if (sessionError || !session) {
        console.error('Active Telegram session not found:', sessionError);
        throw new Error('Active Telegram session not found');
      }

      // Создаем или обновляем интеграцию в базе
      const { data: { user } } = await this.supabase.auth.getUser();
      const userId = user?.id || `anonymous_${Date.now()}`;

      const { data: integration, error: integrationError } = await this.supabase
        .from('telegram_integrations')
        .upsert({
          app_user_id: userId,
          telegram_user_id: telegramUserId,
          twin_id: twinId,
          is_active: true,
          settings: {
            auto_reply: true,
            voice_replies: true,
            delay_min: 30,
            delay_max: 300,
            work_hours: {
              enabled: false,
              start: '09:00',
              end: '18:00'
            },
            ...settings
          }
        })
        .select()
        .single();

      if (integrationError) {
        console.error('Error creating integration:', integrationError);
        throw integrationError;
      }

      console.log('Integration created in database:', integration.id);

      // Запускаем мониторинг сообщений
      const integrationKey = `${telegramUserId}_${twinId}`;
      
      // Останавливаем предыдущую интеграцию если есть
      if (activeIntegrations.has(integrationKey)) {
        const existing = activeIntegrations.get(integrationKey);
        if (existing?.intervalId) {
          clearInterval(existing.intervalId);
          console.log('Stopped existing integration');
        }
      }

      // Запускаем новую интеграцию
      const intervalId = setInterval(async () => {
        await this.checkForNewMessages(telegramUserId, twin, integration.settings);
      }, 10000); // Проверяем каждые 10 секунд

      activeIntegrations.set(integrationKey, {
        intervalId,
        settings: integration.settings,
        twin
      });

      console.log(`Started monitoring for integration ${integrationKey}`);

      return {
        success: true,
        integration_id: integration.id,
        message: `Integration started for ${twin.name} via Edge Function`
      };

    } catch (error) {
      console.error('Error starting integration:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async stopIntegration(integrationId: string) {
    try {
      console.log(`Stopping integration ${integrationId}`);
      
      // Получаем интеграцию
      const { data: integration, error } = await this.supabase
        .from('telegram_integrations')
        .select('*')
        .eq('id', integrationId)
        .single();

      if (error || !integration) {
        console.error('Integration not found:', error);
        throw new Error('Integration not found');
      }

      // Останавливаем мониторинг
      const integrationKey = `${integration.telegram_user_id}_${integration.twin_id}`;
      const activeIntegration = activeIntegrations.get(integrationKey);
      
      if (activeIntegration?.intervalId) {
        clearInterval(activeIntegration.intervalId);
        activeIntegrations.delete(integrationKey);
        console.log(`Stopped monitoring for ${integrationKey}`);
      }

      // Деактивируем в базе
      await this.supabase
        .from('telegram_integrations')
        .update({ is_active: false })
        .eq('id', integrationId);

      console.log('Integration deactivated in database');

      return {
        success: true,
        message: 'Integration stopped via Edge Function'
      };

    } catch (error) {
      console.error('Error stopping integration:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async checkForNewMessages(telegramUserId: string, twin: any, settings: any) {
    try {
      // Проверяем рабочие часы
      if (settings.work_hours?.enabled) {
        const now = new Date();
        const currentHour = now.getHours();
        const startHour = parseInt(settings.work_hours.start.split(':')[0]);
        const endHour = parseInt(settings.work_hours.end.split(':')[0]);
        
        if (currentHour < startHour || currentHour >= endHour) {
          return; // Вне рабочих часов
        }
      }

      // Получаем диалоги через Python API
      console.log(`Checking messages for twin ${twin.name}`);
      
      const dialogsResponse = await fetch(`${this.telegramApiBase}/get_dialogs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ limit: 5 })
      });

      if (!dialogsResponse.ok) {
        console.error('Failed to get dialogs:', dialogsResponse.status);
        return;
      }

      const dialogs = await dialogsResponse.json();
      console.log(`Found ${dialogs.length || 0} dialogs for monitoring`);
      
      // В реальной реализации здесь будет:
      // 1. Проверка новых сообщений в каждом диалоге
      // 2. Генерация ответов через ИИ
      // 3. Отправка ответов через Python API
      // 4. Сохранение истории в базу данных

      // Для демонстрации сохраняем информацию о проверке
      if (dialogs && dialogs.length > 0) {
        await this.supabase
          .from('telegram_user_messages')
          .insert({
            telegram_user_id: telegramUserId,
            twin_id: twin.id,
            chat_id: '0',
            content: `Мониторинг активен: проверено ${dialogs.length} диалогов`,
            is_voice: false,
            is_incoming: false,
            timestamp: new Date().toISOString()
          });
      }

    } catch (error) {
      console.error('Error checking messages:', error);
    }
  }

  async generateAIResponse(messageText: string, systemPrompt: string): Promise<string> {
    try {
      const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
      
      if (!geminiApiKey) {
        console.log('Gemini API key not found, using fallback response');
        return this.generateFallbackResponse(messageText);
      }

      console.log('Generating AI response via Gemini');
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\nВходящее сообщение: "${messageText}"\n\nОтветь естественно, как этот человек ответил бы в Telegram:`
            }]
          }]
        })
      });

      if (!response.ok) {
        console.error('Gemini API error:', response.status);
        return this.generateFallbackResponse(messageText);
      }

      const result = await response.json();
      const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      
      return generatedText?.trim() || this.generateFallbackResponse(messageText);
      
    } catch (error) {
      console.error("Error generating AI response:", error);
      return this.generateFallbackResponse(messageText);
    }
  }

  private generateFallbackResponse(messageText: string): string {
    const responses = [
      "Понял тебя 👍",
      "Да, согласен",
      "Интересно, расскажи подробнее",
      "Хм, а что думаешь по этому поводу?",
      "Спасибо за сообщение!",
      "Да, я тоже так думаю"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  getActiveIntegrations() {
    return Array.from(activeIntegrations.entries()).map(([key, value]) => ({
      key,
      twin_name: value.twin.name,
      settings: value.settings
    }));
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const manager = new TelegramIntegrationManager(supabase);

    if (req.method === "POST") {
      const requestData: IntegrationRequest = await req.json();
      console.log(`Integration Manager received action: ${requestData.action}`);

      switch (requestData.action) {
        case 'start':
          console.log('Processing start integration action');
          if (!requestData.telegram_user_id || !requestData.twin_id) {
            return new Response(
              JSON.stringify({ success: false, error: "telegram_user_id and twin_id are required" }),
              {
                status: 400,
                headers: {
                  ...corsHeaders,
                  "Content-Type": "application/json",
                },
              }
            );
          }

          const startResult = await manager.startIntegration(
            requestData.telegram_user_id,
            requestData.twin_id,
            requestData.settings || {}
          );

          return new Response(
            JSON.stringify(startResult),
            {
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );

        case 'stop':
          console.log('Processing stop integration action');
          if (!requestData.integration_id) {
            return new Response(
              JSON.stringify({ success: false, error: "integration_id is required" }),
              {
                status: 400,
                headers: {
                  ...corsHeaders,
                  "Content-Type": "application/json",
                },
              }
            );
          }

          const stopResult = await manager.stopIntegration(requestData.integration_id);

          return new Response(
            JSON.stringify(stopResult),
            {
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );

        case 'get_status':
          console.log('Processing get status action');
          const activeIntegrations = manager.getActiveIntegrations();
          
          return new Response(
            JSON.stringify({
              success: true,
              active_integrations: activeIntegrations
            }),
            {
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );

        default:
          console.log(`Unknown integration action: ${requestData.action}`);
          return new Response(
            JSON.stringify({ success: false, error: "Unknown action" }),
            {
              status: 400,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );
      }
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )

  } catch (error) {
    console.error("Integration Manager Error:", error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: "Internal server error",
        details: error.message 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  }
})