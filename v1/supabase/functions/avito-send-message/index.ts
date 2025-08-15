import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendMessageRequest {
  chatId: string;
  message: string;
  integrationId?: string;
  userId?: string;
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

    // Parse request body
    const { chatId, message, integrationId, userId }: SendMessageRequest = await req.json()

    if (!chatId || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get user's Avito API credentials
    let userCredentials = null;
    if (userId) {
      const { data: credentials, error: credentialsError } = await supabase
        .from('avito_user_credentials')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (credentialsError && credentialsError.code !== 'PGRST116') {
        console.error('Error fetching user credentials:', credentialsError);
        return new Response(JSON.stringify({ error: 'Failed to get user credentials' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (credentials) {
        userCredentials = {
          apiKey: credentials.avito_api_key,
          apiUrl: credentials.avito_api_url || 'https://api.avito.ru'
        };
      }
    }

    // If no user credentials, try to get from integration
    if (!userCredentials && integrationId) {
      const { data: integration, error: integrationError } = await supabase
        .from('avito_integrations')
        .select(`
          *,
          avito_user_credentials!inner(*)
        `)
        .eq('id', integrationId)
        .single();

      if (!integrationError && integration?.avito_user_credentials) {
        userCredentials = {
          apiKey: integration.avito_user_credentials.avito_api_key,
          apiUrl: integration.avito_user_credentials.avito_api_url || 'https://api.avito.ru'
        };
      }
    }

    if (!userCredentials) {
      return new Response(JSON.stringify({ error: 'No API credentials found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Send message to Avito using user's credentials
    const response = await fetch(`${userCredentials.apiUrl}/messages/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userCredentials.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        message: message,
        timestamp: new Date().toISOString()
      })
    })

    if (!response.ok) {
      console.error('Avito API error:', response.status, response.statusText)
      const errorText = await response.text()
      return new Response(JSON.stringify({ 
        error: 'Failed to send message to Avito',
        details: errorText
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const responseData = await response.json()

    // Save message to database if integrationId is provided
    if (integrationId) {
      await supabase
        .from('avito_messages')
        .insert({
          integration_id: integrationId,
          chat_id: chatId,
          message_text: message,
          is_incoming: false,
          timestamp: new Date().toISOString()
        })
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Message sent successfully',
      avito_response: responseData
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error sending message to Avito:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}) 