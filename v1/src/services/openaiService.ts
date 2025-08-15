// Deprecated: Replaced with Gemini service
// This file is kept for reference but no longer used

class DeprecatedOpenAIService {
  private client: any = null;

  constructor() {
    console.warn('OpenAI service is deprecated. Use Gemini service instead.');
  }

  async generateResponse(
    userMessage: string,
    systemPrompt: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<string> {
    throw new Error('OpenAI service is deprecated. Use Gemini service instead.');
  }

  isConfigured(): boolean {
    return false;
  }
}

export const openaiService = new DeprecatedOpenAIService();