import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

interface TelegramMessage {
  id: number;
  chat_id: number;
  from_id: number;
  text?: string;
  voice?: {
    file_id: string;
    duration: number;
  };
  date: number;
}

interface StartListenerRequest {
  user_id: string;
  twin_id: string;
  integration_id: string;
}

// MTProto client for listening to messages
class TelegramListener {
  private client: any;
  private sessionString: string;
  private apiId: number;
  private apiHash: string;
  private isListening: boolean = false;

  constructor(sessionString: string, apiId: string, apiHash: string) {
    this.sessionString = sessionString;
    this.apiId = parseInt(apiId);
    this.apiHash = apiHash;
  }

  async initialize() {
    try {
      const { TelegramClient } = await import('npm:telegram@2.22.2/client/TelegramClient.js');
      const { StringSession } = await import('npm:telegram@2.22.2/sessions/index.js');
      
      this.client = new TelegramClient(
        new StringSession(this.sessionString),
        this.apiId,
        this.apiHash,
        {
          connectionRetries: 5,
          useWSS: false,
        }
      );

      await this.client.connect();
      return true;
    } catch (error) {
      console.error('Failed to initialize listener client:', error);
      return false;
    }
  }

  async startListening(twin: any, integration: any, supabase: any) {
    if (this.isListening) {
      console.log('Already listening');
      return;
    }

    this.isListening = true;
    console.log(`Starting real Telegram listener for twin: ${twin.name}`);

    try {
      // Получаем информацию о текущем пользователе
      const me = await this.client.getMe();
      console.log(`Listening as: ${me.firstName} ${me.lastName} (@${me.username})`);

      // Настраиваем обработчик новых сообщений
      this.client.addEventHandler(async (event: any) => {
        try {
          if (event.message && event.message.peerId) {
            await this.handleIncomingMessage(event.message, twin, integration, supabase);
          }
        } catch (error) {
          console.error('Error handling message event:', error);
        }
      }, { func: (event: any) => event.className === 'UpdateNewMessage' });

      console.log('Telegram listener is now active and waiting for messages...');

      // Получаем последние диалоги для инициализации
      const dialogs = await this.client.getDialogs({ limit: 10 });
      console.log(`Found ${dialogs.length} recent dialogs`);

    } catch (error) {
      console.error('Error starting listener:', error);
      this.isListening = false;
      throw error;
    }
  }

  async handleIncomingMessage(message: any, twin: any, integration: any, supabase: any) {
    try {
      const settings = integration?.settings || {
        auto_reply: true,
        voice_replies: true,
        delay_min: 30,
        delay_max: 300
      };

      // Проверяем, включены ли автоответы
      if (!settings.auto_reply) {
        console.log("Auto-replies disabled, skipping message");
        return;
      }

      // Проверяем, не от нас ли сообщение
      const me = await this.client.getMe();
      if (message.fromId?.userId?.toString() === me.id.toString()) {
        console.log("Skipping own message");
        return;
      }

      // Проверяем рабочие часы
      if (settings.work_hours?.enabled) {
        const now = new Date();
        const currentHour = now.getHours();
        const startHour = parseInt(settings.work_hours.start.split(':')[0]);
        const endHour = parseInt(settings.work_hours.end.split(':')[0]);
        
        if (currentHour < startHour || currentHour >= endHour) {
          console.log("Outside work hours, skipping message");
          return;
        }
      }

      let messageText = message.text || "";
      
      // Обработка голосовых сообщений
      if (message.voice && !messageText) {
        messageText = await this.convertVoiceToText(message.voice);
      }

      if (!messageText) {
        console.log("No text content, skipping");
        return;
      }

      console.log(`Processing message: "${messageText}"`);

      // Получаем информацию о чате
      const chat = await this.client.getEntity(message.peerId);
      const chatId = message.peerId.chatId || message.peerId.userId;

      // Сохраняем входящее сообщение
      await supabase
        .from('telegram_user_messages')
        .insert({
          telegram_user_id: me.id.toString(),
          twin_id: twin.id,
          chat_id: chatId.toString(),
          message_id: message.id.toString(),
          content: messageText,
          is_voice: !!message.voice,
          is_incoming: true,
          timestamp: new Date(message.date * 1000).toISOString()
        });

      // Генерируем ответ через ИИ
      const response = await this.generateAIResponse(messageText, twin.system_prompt);
      
      // Добавляем случайную задержку для имитации человеческого поведения
      const delay = Math.random() * (settings.delay_max - settings.delay_min) + settings.delay_min;
      console.log(`Waiting ${delay} seconds before responding...`);
      await new Promise(resolve => setTimeout(resolve, delay * 1000));
      
      // Отправляем ответ
      const shouldSendVoice = settings.voice_replies && !!message.voice;
      await this.sendMessage(chat, response, shouldSendVoice);
      
      // Сохраняем исходящее сообщение
      await supabase
        .from('telegram_user_messages')
        .insert({
          telegram_user_id: me.id.toString(),
          twin_id: twin.id,
          chat_id: chatId.toString(),
          content: response,
          is_voice: shouldSendVoice,
          is_incoming: false,
          timestamp: new Date().toISOString()
        });

      console.log(`Sent response: "${response}"`);

    } catch (error) {
      console.error("Error handling incoming message:", error);
    }
  }

  async sendMessage(chat: any, text: string, asVoice: boolean = false) {
    try {
      if (asVoice) {
        // Конвертируем текст в голос и отправляем
        const voiceBuffer = await this.convertTextToVoice(text);
        if (voiceBuffer && voiceBuffer.byteLength > 0) {
          await this.client.sendFile(chat, {
            file: new Uint8Array(voiceBuffer),
            attributes: [{
              _: 'documentAttributeAudio',
              voice: true,
              duration: Math.ceil(text.length / 10), // Примерная длительность
            }]
          });
        } else {
          // Fallback to text if voice generation failed
          await this.client.sendMessage(chat, { message: text });
        }
      } else {
        await this.client.sendMessage(chat, { message: text });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Fallback to text message
      try {
        await this.client.sendMessage(chat, { message: text });
      } catch (fallbackError) {
        console.error("Fallback message send also failed:", fallbackError);
      }
    }
  }

  async convertVoiceToText(voice: any): Promise<string> {
    try {
      // Скачиваем голосовое сообщение
      const buffer = await this.client.downloadMedia(voice);
      
      // Здесь должна быть интеграция с Speech-to-Text API
      // Например, OpenAI Whisper, Google Cloud Speech-to-Text, или Azure Speech
      
      const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
      if (openaiApiKey) {
        // Используем OpenAI Whisper API
        const formData = new FormData();
        formData.append('file', new Blob([buffer], { type: 'audio/ogg' }), 'voice.ogg');
        formData.append('model', 'whisper-1');
        formData.append('language', 'ru');

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
          },
          body: formData
        });

        if (response.ok) {
          const result = await response.json();
          return result.text || '';
        }
      }
      
      // Fallback: возвращаем заглушку
      console.log("Voice-to-text conversion not available, using placeholder");
      return "[Голосовое сообщение]";
      
    } catch (error) {
      console.error("Error converting voice to text:", error);
      return "[Ошибка распознавания голоса]";
    }
  }

  async convertTextToVoice(text: string): Promise<ArrayBuffer | null> {
    try {
      const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
      const voiceId = Deno.env.get('ELEVENLABS_VOICE_ID') || 'MWyJiWDobXN8FX3CJTdE';
      
      if (!elevenLabsApiKey) {
        console.log("ElevenLabs API key not configured");
        return null;
      }

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": elevenLabsApiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error("Error converting text to voice:", error);
      return null;
    }
  }

  async generateAIResponse(messageText: string, systemPrompt: string): Promise<string> {
    try {
      const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
      
      if (!geminiApiKey) {
        console.warn("Gemini API key not found, using fallback response");
        return this.generateFallbackResponse(messageText);
      }

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
        console.error("Gemini API error:", response.status, await response.text());
        return this.generateFallbackResponse(messageText);
      }

      const result = await response.json();
      const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!generatedText) {
        console.warn("Empty response from Gemini API");
        return this.generateFallbackResponse(messageText);
      }
      
      return generatedText.trim();
      
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

  async stop() {
    this.isListening = false;
    if (this.client) {
      await this.client.disconnect();
    }
  }
}

// Global listeners storage
const activeListeners = new Map<string, TelegramListener>();

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

    if (req.method === "POST") {
      const { user_id, twin_id, integration_id }: StartListenerRequest = await req.json()

      // Получаем активную сессию пользователя
      const { data: session } = await supabase
        .from('telegram_sessions')
        .select('*')
        .eq('user_id', user_id)
        .eq('is_active', true)
        .single()

      if (!session) {
        return new Response(
          JSON.stringify({ error: "Активная сессия Telegram не найдена" }),
          {
            status: 404,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        )
      }

      // Получаем информацию о двойнике
      const { data: twin } = await supabase
        .from('digital_twins')
        .select('*')
        .eq('id', twin_id)
        .single()

      if (!twin) {
        return new Response(
          JSON.stringify({ error: "Цифровой двойник не найден" }),
          {
            status: 404,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        )
      }

      // Получаем настройки интеграции
      const { data: integration } = await supabase
        .from('telegram_integrations')
        .select('*')
        .eq('id', integration_id)
        .single()

      // Проверяем, не запущен ли уже listener для этого пользователя
      const listenerKey = `${user_id}_${twin_id}`;
      if (activeListeners.has(listenerKey)) {
        return new Response(
          JSON.stringify({
            success: true,
            message: "Прослушивание уже активно",
            session_id: session.id,
            twin_name: twin.name
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        )
      }

      // Создаем и запускаем listener
      const listener = new TelegramListener(
        session.session_data.session_string,
        Deno.env.get('TELEGRAM_API_ID') || '27479925',
        Deno.env.get('TELEGRAM_API_HASH') || '5b8b0cf0bbe783b22a901554e5b4b345'
      );

      const initialized = await listener.initialize();
      if (!initialized) {
        return new Response(
          JSON.stringify({ error: "Не удалось инициализировать Telegram клиент" }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        )
      }

      // Запускаем прослушивание
      await listener.startListening(twin, integration, supabase);
      
      // Сохраняем listener
      activeListeners.set(listenerKey, listener);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Реальное прослушивание Telegram запущено",
          session_id: session.id,
          twin_name: twin.name
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      )
    }

    if (req.method === "DELETE") {
      const { user_id, twin_id } = await req.json()
      const listenerKey = `${user_id}_${twin_id}`;
      
      const listener = activeListeners.get(listenerKey);
      if (listener) {
        await listener.stop();
        activeListeners.delete(listenerKey);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Прослушивание остановлено"
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      )
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
    console.error("Error:", error)
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