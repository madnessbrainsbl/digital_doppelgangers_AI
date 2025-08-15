import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      type: string;
    };
    date: number;
    text?: string;
    voice?: {
      duration: number;
      mime_type: string;
      file_id: string;
      file_unique_id: string;
      file_size?: number;
    };
  };
}

interface ConversationMessage {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

class TelegramWebhookHandler {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  async handleUpdate(botId: string, update: TelegramUpdate): Promise<void> {
    try {
      console.log(`Processing update for bot ${botId}:`, JSON.stringify(update, null, 2));

      if (!update.message) {
        console.log('No message in update, skipping');
        return;
      }

      const message = update.message;

      // Получаем информацию о боте
      const { data: bot, error: botError } = await this.supabase
        .from('telegram_bots')
        .select(`
          *,
          digital_twins!telegram_bots_connected_twin_id_fkey(*)
        `)
        .eq('id', botId)
        .single();

      if (botError || !bot) {
        console.error('Bot not found:', botError);
        return;
      }

      if (!bot.connected_twin_id || !bot.digital_twins) {
        console.log('No twin connected to bot, skipping');
        return;
      }

      // Определяем тип сообщения и извлекаем текст
      let messageText = '';
      let isVoice = false;

      if (message.text) {
        messageText = message.text;
      } else if (message.voice) {
        isVoice = true;
        // Для голосовых сообщений сначала нужно скачать и распознать
        messageText = await this.processVoiceMessage(bot.token, message.voice);
      } else {
        console.log('Unsupported message type, skipping');
        return;
      }

      if (!messageText.trim()) {
        console.log('Empty message text, skipping');
        return;
      }

      // Получаем историю разговора для этого чата (последние 4 сообщения)
      const conversationHistory = await this.getConversationHistory(botId, message.chat.id.toString());

      // Сохраняем входящее сообщение пользователя
      await this.saveMessage(
        botId,
        message.chat.id.toString(),
        this.getChatName(message.chat),
        messageText,
        isVoice,
        true // is_incoming = true
      );

      // Генерируем ответ через ИИ с учетом истории
      const response = await this.generateAIResponse(
        messageText,
        bot.digital_twins.system_prompt,
        conversationHistory
      );

      if (!response) {
        console.log('No AI response generated');
        return;
      }

      // Отправляем ответ
      const shouldSendVoice = bot.voice_enabled && isVoice;
      await this.sendResponse(
        bot.token,
        message.chat.id,
        response,
        shouldSendVoice
      );

      // Сохраняем исходящее сообщение (ответ бота)
      await this.saveMessage(
        botId,
        message.chat.id.toString(),
        this.getChatName(message.chat),
        response,
        shouldSendVoice,
        false // is_incoming = false
      );

      // Обновляем счетчик сообщений бота
      await this.supabase.rpc('increment_bot_messages', { bot_id: botId });

      console.log('Message processed successfully');

    } catch (error) {
      console.error('Error handling update:', error);
    }
  }

  private async getConversationHistory(botId: string, chatId: string): Promise<ConversationMessage[]> {
    try {
      console.log(`Getting conversation history for bot ${botId}, chat ${chatId}`);
      
      // Получаем последние 4 сообщения из этого чата, отсортированные по времени
      const { data: messages, error } = await this.supabase
        .from('telegram_integration_messages')
        .select('message_text, is_incoming, timestamp')
        .eq('bot_id', botId)
        .eq('chat_id', chatId)
        .order('timestamp', { ascending: true })
        .limit(4);

      if (error) {
        console.error('Error fetching conversation history:', error);
        return [];
      }

      if (!messages || messages.length === 0) {
        console.log('No conversation history found');
        return [];
      }

      console.log(`Found ${messages.length} messages in conversation history`);

      // Преобразуем сообщения в формат для Gemini
      const conversationHistory: ConversationMessage[] = [];

      for (const msg of messages) {
        if (msg.message_text && msg.message_text.trim()) {
          conversationHistory.push({
            role: msg.is_incoming ? 'user' : 'model',
            parts: [{ text: msg.message_text }]
          });
        }
      }

      console.log(`Prepared ${conversationHistory.length} messages for conversation context`);
      return conversationHistory;

    } catch (error) {
      console.error('Error getting conversation history:', error);
      return [];
    }
  }

  private async processVoiceMessage(botToken: string, voice: any): Promise<string> {
    try {
      // Получаем информацию о файле
      const fileResponse = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${voice.file_id}`);
      const fileData = await fileResponse.json();

      if (!fileData.ok) {
        throw new Error('Failed to get file info');
      }

      // Скачиваем файл
      const fileUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;
      const audioResponse = await fetch(fileUrl);
      const audioBuffer = await audioResponse.arrayBuffer();

      // Конвертируем в текст через OpenAI Whisper
      const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openaiApiKey) {
        console.log('OpenAI API key not configured, returning placeholder');
        return '[Голосовое сообщение]';
      }

      const formData = new FormData();
      formData.append('file', new Blob([audioBuffer], { type: 'audio/ogg' }), 'voice.ogg');
      formData.append('model', 'whisper-1');
      formData.append('language', 'ru');

      const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: formData
      });

      if (!transcriptionResponse.ok) {
        throw new Error('Transcription failed');
      }

      const transcriptionData = await transcriptionResponse.json();
      return transcriptionData.text || '[Не удалось распознать голос]';

    } catch (error) {
      console.error('Error processing voice message:', error);
      return '[Ошибка обработки голосового сообщения]';
    }
  }

  private async generateAIResponse(
    messageText: string, 
    systemPrompt: string,
    conversationHistory: ConversationMessage[]
  ): Promise<string> {
    try {
      const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
      
      if (!geminiApiKey) {
        console.log('Gemini API key not found, using fallback response');
        return this.generateFallbackResponse(messageText);
      }

      console.log(`Generating AI response for message: "${messageText}"`);
      console.log(`System prompt length: ${systemPrompt.length} characters`);
      console.log(`Conversation history: ${conversationHistory.length} messages`);

      // Создаем структуру с историей разговора
      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: systemPrompt,
            },
          ],
        },
        {
          role: 'model',
          parts: [
            {
              text: 'Понял! Я буду отвечать в соответствии с заданным стилем и характером.',
            },
          ],
        },
      ];

      // Добавляем только последние 3 сообщения из истории для экономии токенов
      const recentHistory = conversationHistory.slice(-3);
      contents.push(...recentHistory);

      // Добавляем текущее сообщение пользователя
      contents.push({
        role: 'user',
        parts: [
          {
            text: messageText,
          },
        ],
      });

      console.log(`Sending request to Gemini API with ${contents.length} messages`);

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiApiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: contents,
          generationConfig: {
            temperature: 0.9,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      console.log(`Gemini API response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error:', response.status, errorText);
        return this.generateFallbackResponse(messageText);
      }

      const result = await response.json();
      console.log('Gemini API response received');
      
      const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!generatedText) {
        console.warn('Empty response from Gemini API');
        console.warn('Response structure:', JSON.stringify(result, null, 2));
        return this.generateFallbackResponse(messageText);
      }

      console.log('AI response generated successfully:', generatedText.substring(0, 100) + '...');
      return generatedText.trim();
      
    } catch (error) {
      console.error("Error generating AI response:", error);
      console.error("Error details:", error.message);
      return this.generateFallbackResponse(messageText);
    }
  }

  private generateFallbackResponse(messageText: string): string {
    // Более разнообразные ответы в зависимости от типа сообщения
    const greetings = ["привет", "здравствуй", "добро", "хай", "hi"];
    const questions = ["?", "как", "что", "где", "когда", "почему"];
    const thanks = ["спасибо", "благодарю", "thanks"];
    
    const lowerMessage = messageText.toLowerCase();
    
    if (greetings.some(greeting => lowerMessage.includes(greeting))) {
      const greetingResponses = [
        "Привет! Как дела?",
        "Здравствуй! Рад тебя видеть",
        "Привет! Что нового?",
        "Хай! Как настроение?"
      ];
      return greetingResponses[Math.floor(Math.random() * greetingResponses.length)];
    }
    
    if (thanks.some(thank => lowerMessage.includes(thank))) {
      const thankResponses = [
        "Пожалуйста! 😊",
        "Не за что!",
        "Всегда рад помочь",
        "Обращайся!"
      ];
      return thankResponses[Math.floor(Math.random() * thankResponses.length)];
    }
    
    if (questions.some(q => lowerMessage.includes(q))) {
      const questionResponses = [
        "Хороший вопрос! Дай подумаю...",
        "Интересно, расскажи подробнее",
        "А что ты сам думаешь по этому поводу?",
        "Хм, это довольно сложная тема"
      ];
      return questionResponses[Math.floor(Math.random() * questionResponses.length)];
    }
    
    // Общие ответы
    const generalResponses = [
      "Понял тебя 👍",
      "Да, согласен",
      "Интересная мысль",
      "Да, я тоже так думаю",
      "Понимаю тебя",
      "Хорошо сказано"
    ];
    
    return generalResponses[Math.floor(Math.random() * generalResponses.length)];
  }

  private async sendResponse(botToken: string, chatId: number, text: string, asVoice: boolean = false): Promise<void> {
    try {
      if (asVoice) {
        // Генерируем голосовой ответ
        const voiceBuffer = await this.generateVoiceResponse(text);
        if (voiceBuffer) {
          await this.sendVoiceMessage(botToken, chatId, voiceBuffer);
          return;
        }
      }

      // Отправляем текстовое сообщение
      await this.sendTextMessage(botToken, chatId, text);

    } catch (error) {
      console.error('Error sending response:', error);
      // Fallback к текстовому сообщению
      try {
        await this.sendTextMessage(botToken, chatId, text);
      } catch (fallbackError) {
        console.error('Fallback message send also failed:', fallbackError);
      }
    }
  }

  private async sendTextMessage(botToken: string, chatId: number, text: string): Promise<void> {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to send message: ${errorData}`);
    }
  }

  private async sendVoiceMessage(botToken: string, chatId: number, voiceBuffer: ArrayBuffer): Promise<void> {
    const formData = new FormData();
    formData.append('chat_id', chatId.toString());
    formData.append('voice', new Blob([voiceBuffer], { type: 'audio/ogg' }), 'voice.ogg');

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendVoice`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to send voice: ${errorData}`);
    }
  }

  private async generateVoiceResponse(text: string): Promise<ArrayBuffer | null> {
    try {
      const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
      const voiceId = Deno.env.get('ELEVENLABS_VOICE_ID') || 'MWyJiWDobXN8FX3CJTdE';
      
      if (!elevenLabsApiKey) {
        console.log('ElevenLabs API key not configured');
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
      console.error('Error generating voice response:', error);
      return null;
    }
  }

  private async saveMessage(
    botId: string,
    chatId: string,
    chatName: string,
    messageText: string,
    isVoice: boolean,
    isIncoming: boolean
  ): Promise<void> {
    try {
      // Всегда сохраняем каждое сообщение как отдельную запись
      const messageData = {
        bot_id: botId,
        chat_id: chatId,
        chat_name: chatName,
        message_text: messageText,
        is_voice: isVoice,
        is_incoming: isIncoming,
        timestamp: new Date().toISOString()
      };

      const { error } = await this.supabase
        .from('telegram_integration_messages')
        .insert(messageData);

      if (error) {
        console.error('Error saving message:', error);
      } else {
        console.log(`Message saved: ${isIncoming ? 'incoming' : 'outgoing'} - "${messageText.substring(0, 50)}..."`);
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  }

  private getChatName(chat: any): string {
    if (chat.username) {
      return `@${chat.username}`;
    }
    
    const parts = [];
    if (chat.first_name) parts.push(chat.first_name);
    if (chat.last_name) parts.push(chat.last_name);
    
    return parts.length > 0 ? parts.join(' ') : `Chat ${chat.id}`;
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

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const botId = pathParts[pathParts.length - 1];

    if (!botId || botId === 'telegram-webhook') {
      return new Response(
        JSON.stringify({ error: "Bot ID is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      )
    }

    if (req.method === "POST") {
      const update: TelegramUpdate = await req.json();
      console.log(`Received webhook for bot ${botId}`);

      const handler = new TelegramWebhookHandler(supabase);
      await handler.handleUpdate(botId, update);

      return new Response(
        JSON.stringify({ ok: true }),
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
    console.error("Webhook Error:", error)
    return new Response(
      JSON.stringify({ 
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