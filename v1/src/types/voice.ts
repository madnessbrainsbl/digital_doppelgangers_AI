export interface VoiceClone {
  id: string;
  user_id: string;
  name: string;
  status: 'processing' | 'completed' | 'failed';
  audio_file_url?: string;
  voice_model_id?: string;
  processing_data: {
    duration?: number;
    quality_score?: number;
    processing_time?: number;
    error_message?: string;
  };
  is_paid: boolean;
  created_at: string;
  updated_at: string;
}

export interface VoiceCloneData {
  id: string;
  name: string;
  status: 'processing' | 'completed' | 'failed';
  isPaid: boolean;
  createdAt: string;
  processingData: {
    duration?: number;
    quality_score?: number;
    processing_time?: number;
    error_message?: string;
  };
}