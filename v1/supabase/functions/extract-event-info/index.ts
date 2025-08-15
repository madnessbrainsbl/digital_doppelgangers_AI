import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExtractEventRequest {
  messages: string[];
  twinContext?: string;
}

interface ExtractedEventInfo {
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  eventTitle?: string;
  eventType?: 'meeting' | 'call' | 'consultation' | 'presentation' | 'other';
  startTime?: string;
  endTime?: string;
  location?: string;
  meetingLink?: string;
  confidence: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { messages, twinContext }: ExtractEventRequest = await req.json()

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'No messages provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      console.error('OpenAI API key not found')
      return new Response(JSON.stringify({ error: 'API configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Combine messages into a single context
    const chatContext = messages.join('\n\n')

    // Create prompt for event extraction
    const systemPrompt = `Ты - помощник для извлечения информации о встречах и звонках из чата.

Анализируй сообщения и извлекай следующую информацию в формате JSON:

{
  "contactName": "имя контакта, если упоминается",
  "contactPhone": "номер телефона в формате +7XXXXXXXXXX",
  "contactEmail": "email адрес",
  "eventTitle": "название события/встречи",
  "eventType": "тип события (meeting/call/consultation/presentation/other)",
  "startTime": "дата и время начала в формате YYYY-MM-DDTHH:MM",
  "endTime": "дата и время окончания в формате YYYY-MM-DDTHH:MM",
  "location": "место встречи или адрес",
  "meetingLink": "ссылка на онлайн встречу",
  "confidence": "уверенность в извлечении (0-1)"
}

Правила:
- Если информация не найдена, используй null
- Для времени используй московское время (UTC+3)
- Если указано только время без даты, используй сегодняшнюю дату
- Если указано "завтра", добавь 1 день к сегодняшней дате
- Для звонков eventType = "call"
- Для встреч eventType = "meeting"
- Для консультаций eventType = "consultation"
- Для презентаций eventType = "presentation"

Контекст двойника: ${twinContext || 'Не указан'}

Извлеки информацию из следующего чата:`

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: chatContext }
        ],
        max_tokens: 500,
        temperature: 0.1
      })
    })

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText)
      return new Response(JSON.stringify({ error: 'Failed to extract event info' }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const data = await response.json()
    const extractedText = data.choices?.[0]?.message?.content

    if (!extractedText) {
      return new Response(JSON.stringify({ error: 'No response from AI' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Parse JSON response
    let extractedInfo: ExtractedEventInfo
    try {
      extractedInfo = JSON.parse(extractedText)
    } catch (error) {
      console.error('Error parsing AI response:', error)
      return new Response(JSON.stringify({ error: 'Invalid AI response format' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Validate and clean extracted info
    const cleanedInfo: ExtractedEventInfo = {
      contactName: extractedInfo.contactName || undefined,
      contactPhone: extractedInfo.contactPhone || undefined,
      contactEmail: extractedInfo.contactEmail || undefined,
      eventTitle: extractedInfo.eventTitle || undefined,
      eventType: extractedInfo.eventType || undefined,
      startTime: extractedInfo.startTime || undefined,
      endTime: extractedInfo.endTime || undefined,
      location: extractedInfo.location || undefined,
      meetingLink: extractedInfo.meetingLink || undefined,
      confidence: extractedInfo.confidence || 0
    }

    return new Response(JSON.stringify({ 
      success: true, 
      extractedInfo: cleanedInfo
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error extracting event info:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}) 