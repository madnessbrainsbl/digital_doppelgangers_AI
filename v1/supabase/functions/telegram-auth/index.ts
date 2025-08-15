import { createClient } from 'npm:@supabase/supabase-js@2';
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};
async function createTelegramClient(apiId, apiHash, sessionString = '') {
  const { TelegramClient } = await import('npm:telegram@2.22.2/client/TelegramClient.js');
  const { StringSession } = await import('npm:telegram@2.22.2/sessions/index.js');
  const session = new StringSession(sessionString);
  const client = new TelegramClient(session, parseInt(apiId), apiHash, {
    connectionRetries: 5,
    useWSS: false
  });
  await client.connect();
  return client;
}
Deno.serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    if (path.endsWith("/send-code") && req.method === "POST") {
      const { phone, api_id, api_hash } = await req.json();
      if (!phone || !api_id || !api_hash) {
        return new Response(JSON.stringify({
          success: false,
          error: "Отсутствуют обязательные параметры"
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        return new Response(JSON.stringify({
          success: false,
          error: "Неверный формат номера телефона"
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
      let client;
      try {
        client = await createTelegramClient(api_id, api_hash);
        const result = await client.sendCode({
          apiId: parseInt(api_id),
          apiHash: api_hash
        }, phone);
        await client.disconnect();
        return new Response(JSON.stringify({
          success: true,
          phone_code_hash: result.phoneCodeHash,
          message: "Код отправлен в Telegram"
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      } catch (error) {
        if (client) {
          try {
            await client.disconnect();
          } catch  {}
        }
        return new Response(JSON.stringify({
          success: false,
          error: `Ошибка Telegram API: ${error.message}`
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
    }
    if (path.endsWith("/verify-code") && req.method === "POST") {
      const { phone, code, phone_code_hash } = await req.json();
      if (!phone || !code || !phone_code_hash) {
        return new Response(JSON.stringify({
          success: false,
          error: "Отсутствуют обязательные параметры"
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
      const api_id = Deno.env.get('TELEGRAM_API_ID');
      const api_hash = Deno.env.get('TELEGRAM_API_HASH');
      if (!api_id || !api_hash) {
        return new Response(JSON.stringify({
          success: false,
          error: "Telegram API credentials не настроены"
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
      let client;
      try {
        const { Api } = await import('npm:telegram@2.22.2');
        client = await createTelegramClient(api_id, api_hash);
        const result = await client.invoke(new Api.auth_SignIn({
          phone_number: phone,
          phone_code_hash: phone_code_hash,
          phone_code: code
        }));
        const user = result.user;
        const sessionString = client.session.save();
        await client.disconnect();
        const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
        const { error: insertError } = await supabase.from('telegram_sessions').upsert({
          user_id: user.id.toString(),
          phone,
          session_data: {
            session_string: sessionString,
            user_info: user,
            auth_date: new Date().toISOString()
          },
          is_active: true
        }, {
          onConflict: [
            'user_id'
          ]
        });
        if (insertError) {
          return new Response(JSON.stringify({
            success: false,
            error: "Ошибка сохранения сессии"
          }), {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json"
            }
          });
        }
        return new Response(JSON.stringify({
          success: true,
          user: {
            id: user.id.toString(),
            first_name: user.firstName ?? '',
            last_name: user.lastName ?? '',
            username: user.username ?? '',
            phone: user.phone
          },
          session_id: user.id.toString(),
          message: "Успешная авторизация в Telegram!"
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      } catch (error) {
        if (client) {
          try {
            await client.disconnect();
          } catch  {}
        }
        if (error.message.includes('PHONE_CODE_INVALID')) {
          return new Response(JSON.stringify({
            success: false,
            error: "Неверный код подтверждения"
          }), {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json"
            }
          });
        } else if (error.message.includes('PHONE_CODE_EXPIRED')) {
          return new Response(JSON.stringify({
            success: false,
            error: "Код подтверждения истек"
          }), {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json"
            }
          });
        } else if (error.message.includes('SESSION_PASSWORD_NEEDED')) {
          return new Response(JSON.stringify({
            success: false,
            error: "Требуется двухфакторная аутентификация",
            requires_2fa: true
          }), {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json"
            }
          });
        }
        return new Response(JSON.stringify({
          success: false,
          error: `Ошибка авторизации: ${error.message}`
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
    }
    return new Response(JSON.stringify({
      error: "Endpoint not found"
    }), {
      status: 404,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
