import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AvitoWebhookData {
  type: 'message' | 'chat_start' | 'chat_end';
  chat_id: string;
  user_id: string;
  user_name?: string;
  message?: string;
  item_id?: string;
  item_title?: string;
  item_price?: string;
  timestamp: string;
  phone?: string; // Номер телефона продавца
}

interface Integration {
  id: string;
  phone: string;
  connected_twin_id: string;
  auto_reply: boolean;
  status: string;
}

interface DigitalTwin {
  id: string;
  system_prompt: string;
  analysis_data: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify webhook signature (if provided by Avito)
    const signature = req.headers.get('x-avito-signature')
    if (signature) {
      // TODO: Implement signature verification
      // const isValid = verifySignature(req.body, signature, webhookSecret)
      // if (!isValid) {
      //   return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      //     status: 401,
      //     headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      //   })
      // }
    }

    // Parse webhook data
    const webhookData: AvitoWebhookData = await req.json()
    
    console.log('Received Avito webhook:', webhookData)

    // Only process message events
    if (webhookData.type !== 'message') {
      return new Response(JSON.stringify({ success: true, message: 'Event type not supported' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Find integration by phone number from webhook data
    const { data: integrations, error: integrationError } = await supabase
      .from('avito_integrations')
      .select('*')
      .eq('status', 'active')
      .eq('auto_reply', true)
      .eq('phone', webhookData.phone || '') // Ищем по номеру телефона

    if (integrationError) {
      console.error('Error fetching integrations:', integrationError)
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!integrations || integrations.length === 0) {
      console.log('No active integrations found for phone:', webhookData.phone)
      return new Response(JSON.stringify({ success: true, message: 'No active integrations found' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Use the first matching integration
    const integration = integrations[0]

    if (!integration.connected_twin_id) {
      console.log('No twin connected to integration:', integration.id)
      return new Response(JSON.stringify({ success: true, message: 'No twin connected' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get the connected digital twin
    const { data: twin, error: twinError } = await supabase
      .from('digital_twins')
      .select('*')
      .eq('id', integration.connected_twin_id)
      .single()

    if (twinError || !twin) {
      console.error('Error fetching twin:', twinError)
      return new Response(JSON.stringify({ error: 'Twin not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Save incoming message to database
    const { error: messageError } = await supabase
      .from('avito_messages')
      .insert({
        integration_id: integration.id,
        chat_id: webhookData.chat_id,
        chat_name: webhookData.user_name || 'Unknown',
        message_text: webhookData.message || '',
        is_incoming: true,
        item_title: webhookData.item_title,
        item_price: webhookData.item_price,
        timestamp: webhookData.timestamp
      })

    if (messageError) {
      console.error('Error saving message:', messageError)
    }

    // Generate AI response
    const aiResponse = await generateAIResponse(webhookData, twin)

    if (aiResponse) {
      // Send response back to Avito using our send-message function
      const responseSent = await sendResponseToAvito(webhookData.chat_id, aiResponse, integration.id)

      if (responseSent) {
        // Save outgoing message to database
        await supabase
          .from('avito_messages')
          .insert({
            integration_id: integration.id,
            chat_id: webhookData.chat_id,
            chat_name: webhookData.user_name || 'Unknown',
            message_text: aiResponse,
            is_incoming: false,
            response_text: aiResponse,
            item_title: webhookData.item_title,
            item_price: webhookData.item_price,
            timestamp: new Date().toISOString()
          })
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Webhook processed successfully',
      response_generated: !!aiResponse
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function generateAIResponse(webhookData: AvitoWebhookData, twin: DigitalTwin): Promise<string | null> {
  try {
    // Create context for AI
    const context = {
      userMessage: webhookData.message,
      itemTitle: webhookData.item_title,
      itemPrice: webhookData.item_price,
      userName: webhookData.user_name,
      twinProfile: twin.analysis_data?.profile
    }

    // Call OpenAI API to generate response
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      console.error('OpenAI API key not found')
      return null
    }

    const systemPrompt = twin.system_prompt + `
    
    Контекст сообщения:
    - Товар: ${context.itemTitle || 'Не указан'}
    - Цена: ${context.itemPrice || 'Не указана'}
    - Покупатель: ${context.userName || 'Неизвестный'}
    
    Отвечай как продавец на Авито. Будь вежливым, профессиональным и полезным.
    Отвечай кратко и по делу. Не используй эмодзи.
    `

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
          { role: 'user', content: context.userMessage || 'Привет' }
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText)
      return null
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || null

  } catch (error) {
    console.error('Error generating AI response:', error)
    return null
  }
}

async function sendResponseToAvito(chatId: string, message: string, integrationId: string): Promise<boolean> {
  try {
    // Call our send-message function
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/avito-send-message`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatId,
        message,
        integrationId
      })
    })

    if (!response.ok) {
      console.error('Error calling send-message function:', response.status, response.statusText)
      return false
    }

    const result = await response.json()
    return result.success || false

  } catch (error) {
    console.error('Error sending response to Avito:', error)
    return false
  }
} 