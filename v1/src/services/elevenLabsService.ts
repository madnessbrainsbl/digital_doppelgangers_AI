export interface ElevenLabsVoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

export interface ElevenLabsOptions {
  voice_id: string;
  model_id?: string;
  voice_settings?: ElevenLabsVoiceSettings;
}

class ElevenLabsService {
  private apiKey: string | undefined;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  private defaultVoiceId = 'MWyJiWDobXN8FX3CJTdE';
  
  constructor() {
    this.apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    
    if (!this.apiKey) {
      console.warn('ElevenLabs API key not found. Please set VITE_ELEVENLABS_API_KEY in your .env file.');
    }
  }

  async generateSpeech(
    text: string, 
    options: Partial<ElevenLabsOptions> = {}
  ): Promise<ArrayBuffer> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured. Please set VITE_ELEVENLABS_API_KEY in your .env file.');
    }

    const voiceId = options.voice_id || this.defaultVoiceId;
    
    const requestBody = {
      text,
      model_id: options.model_id || 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
        ...options.voice_settings
      }
    };

    const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      if (response.status === 401) {
        throw new Error('ElevenLabs API key is invalid or quota exceeded. Please check your VITE_ELEVENLABS_API_KEY and account balance.');
      } else if (response.status === 429) {
        throw new Error('ElevenLabs API rate limit exceeded. Please try again later.');
      }
      
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    return await response.arrayBuffer();
  }

  async getVoices(): Promise<any[]> {
    if (!this.apiKey) {
      console.warn('ElevenLabs API key not configured');
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Error fetching ElevenLabs voices:', error);
      return [];
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

export const elevenLabsService = new ElevenLabsService();

// Voice cloning functionality
export interface VoiceCloneRequest {
  name: string;
  description?: string;
  files: File[];
  labels?: { [key: string]: string };
}

export interface VoiceCloneResponse {
  voice_id: string;
  name: string;
  status: string;
  description?: string;
  preview_url?: string;
}

class ElevenLabsVoiceCloning {
  private apiKey: string | undefined;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  
  constructor() {
    this.apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
  }

  async cloneVoice(request: VoiceCloneRequest): Promise<VoiceCloneResponse> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured. Please set VITE_ELEVENLABS_API_KEY in your .env file.');
    }

    const formData = new FormData();
    formData.append('name', request.name);
    
    if (request.description) {
      formData.append('description', request.description);
    }

    // Add audio files
    request.files.forEach((file, index) => {
      formData.append('files', file, file.name);
    });

    // Add labels if provided
    if (request.labels) {
      formData.append('labels', JSON.stringify(request.labels));
    }

    const response = await fetch(`${this.baseUrl}/voices/add`, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      if (response.status === 401) {
        throw new Error('ElevenLabs API key is invalid. Please check your VITE_ELEVENLABS_API_KEY.');
      } else if (response.status === 429) {
        throw new Error('ElevenLabs API rate limit exceeded. Please try again later.');
      } else if (response.status === 400) {
        throw new Error('Invalid audio file or parameters. Please check your audio quality and try again.');
      }
      
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return {
      voice_id: result.voice_id,
      name: result.name,
      status: 'completed',
      description: result.description,
      preview_url: result.preview_url
    };
  }

  async getVoiceDetails(voiceId: string): Promise<any> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured.');
    }

    const response = await fetch(`${this.baseUrl}/voices/${voiceId}`, {
      headers: {
        'xi-api-key': this.apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get voice details: ${response.status}`);
    }

    return await response.json();
  }

  async deleteVoice(voiceId: string): Promise<void> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured.');
    }

    const response = await fetch(`${this.baseUrl}/voices/${voiceId}`, {
      method: 'DELETE',
      headers: {
        'xi-api-key': this.apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete voice: ${response.status}`);
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

export const elevenLabsVoiceCloning = new ElevenLabsVoiceCloning();