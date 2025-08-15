import { elevenLabsService } from './elevenLabsService';

export class SpeechService {
  private synthesis: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private isEnabled: boolean = false;
  private useElevenLabs: boolean = true;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.isEnabled = this.isSupported();
  }

  isSupported(): boolean {
    return 'speechSynthesis' in window || elevenLabsService.isConfigured();
  }

  isPlaying(): boolean {
    if (this.useElevenLabs && this.currentAudio) {
      return !this.currentAudio.paused;
    }
    return this.synthesis.speaking;
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.synthesis.getVoices();
  }

  getRussianVoices(): SpeechSynthesisVoice[] {
    return this.getVoices().filter(voice => 
      voice.lang.startsWith('ru') || 
      voice.name.toLowerCase().includes('russian') ||
      voice.name.toLowerCase().includes('русский')
    );
  }

  getBestRussianVoice(): SpeechSynthesisVoice | null {
    const russianVoices = this.getRussianVoices();
    
    if (russianVoices.length === 0) {
      const allVoices = this.getVoices();
      return allVoices.length > 0 ? allVoices[0] : null;
    }

    const localVoice = russianVoices.find(voice => voice.localService);
    if (localVoice) return localVoice;

    return russianVoices[0];
  }

  async speak(text: string, options: {
    rate?: number;
    pitch?: number;
    volume?: number;
    voice?: SpeechSynthesisVoice | null;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: any) => void;
  } = {}): Promise<void> {
    return new Promise(async (resolve, reject) => {
      if (!this.isSupported()) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Stop any current speech
      this.stop();

      try {
        if (this.useElevenLabs && elevenLabsService.isConfigured()) {
          await this.speakWithElevenLabs(text, options, resolve, reject);
        } else {
          await this.speakWithBrowser(text, options, resolve, reject);
        }
      } catch (error) {
        console.error('Speech error:', error);
        options.onError?.(error);
        reject(error);
      }
    });
  }

  private async speakWithElevenLabs(
    text: string, 
    options: any, 
    resolve: () => void, 
    reject: (error: any) => void
  ): Promise<void> {
    try {
      options.onStart?.();
      
      const audioBuffer = await elevenLabsService.generateSpeech(text, {
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      });

      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);
      
      this.currentAudio = new Audio(audioUrl);
      this.currentAudio.volume = options.volume || 0.8;
      
      this.currentAudio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        options.onEnd?.();
        resolve();
      };

      this.currentAudio.onerror = (error) => {
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        options.onError?.(error);
        reject(error);
      };

      await this.currentAudio.play();
    } catch (error) {
      console.error('ElevenLabs speech error:', error);
      // Fallback to browser speech synthesis
      console.log('Falling back to browser speech synthesis');
      this.useElevenLabs = false;
      await this.speakWithBrowser(text, options, resolve, reject);
    }
  }

  private async speakWithBrowser(
    text: string, 
    options: any, 
    resolve: () => void, 
    reject: (error: any) => void
  ): Promise<void> {
    const utterance = new SpeechSynthesisUtterance(text);
    
    const voice = options.voice || this.getBestRussianVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.rate = options.rate || 0.9;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 0.8;

    utterance.onstart = () => {
      options.onStart?.();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      options.onEnd?.();
      resolve();
    };

    utterance.onerror = (error) => {
      this.currentUtterance = null;
      options.onError?.(error);
      reject(error);
    };

    this.currentUtterance = utterance;
    this.synthesis.speak(utterance);
  }

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    
    if (this.synthesis.speaking) {
      this.synthesis.cancel();
    }
    this.currentUtterance = null;
  }

  pause(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
    } else if (this.synthesis.speaking) {
      this.synthesis.pause();
    }
  }

  resume(): void {
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play();
    } else if (this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  getEnabled(): boolean {
    return this.isEnabled && this.isSupported();
  }

  setUseElevenLabs(use: boolean): void {
    this.useElevenLabs = use && elevenLabsService.isConfigured();
  }

  getUseElevenLabs(): boolean {
    return this.useElevenLabs && elevenLabsService.isConfigured();
  }
}

export const speechService = new SpeechService();