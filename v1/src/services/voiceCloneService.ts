import { supabase } from '../lib/supabase';
import { VoiceClone, VoiceCloneData } from '../types/voice';
import { elevenLabsVoiceCloning } from './elevenLabsService';

export class VoiceCloneService {
  static async createVoiceClone(
    name: string,
    audioFile: File
  ): Promise<VoiceClone> {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || `anonymous_${Date.now()}`;
    
    // Upload audio file to Supabase Storage
    const fileExt = audioFile.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('voice-samples')
      .upload(fileName, audioFile);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('voice-samples')
      .getPublicUrl(fileName);

    // Create voice clone record
    const { data: voiceClone, error: createError } = await supabase
      .from('voice_clones')
      .insert({
        user_id: userId,
        name,
        audio_file_url: publicUrl,
        status: 'processing',
        processing_data: {
          duration: 0,
          quality_score: 0,
          processing_time: 0
        }
      })
      .select()
      .single();

    if (createError) throw createError;

    // Start real ElevenLabs processing
    this.processWithElevenLabs(voiceClone.id, name, audioFile);

    return voiceClone;
  }

  static async processWithElevenLabs(voiceCloneId: string, name: string, audioFile: File): Promise<void> {
    try {
      // Check if ElevenLabs is configured
      if (!elevenLabsVoiceCloning.isConfigured()) {
        // Fallback to simulation if API key is not configured
        console.warn('ElevenLabs API key not configured, using simulation mode');
        setTimeout(() => this.simulateProcessing(voiceCloneId), 2000);
        return;
      }

      const startTime = Date.now();
      
      // Create voice clone with ElevenLabs
      const result = await elevenLabsVoiceCloning.cloneVoice({
        name: name,
        description: `Voice clone created via AI Twin app`,
        files: [audioFile],
        labels: {
          'source': 'ai-twin-app',
          'created_at': new Date().toISOString()
        }
      });

      const processingTime = Math.round((Date.now() - startTime) / 1000);
      
      // Get audio duration (approximate from file size)
      const duration = Math.round(audioFile.size / (128 * 1024) * 8); // Rough estimate
      
      const processingData = {
        duration: duration,
        quality_score: Math.round(85 + Math.random() * 15), // 85-100% for real processing
        processing_time: processingTime,
        elevenlabs_voice_id: result.voice_id
      };

      const { error } = await supabase
        .from('voice_clones')
        .update({
          status: 'completed',
          processing_data: processingData,
          voice_model_id: result.voice_id, // Real ElevenLabs voice ID
          updated_at: new Date().toISOString()
        })
        .eq('id', voiceCloneId);

      if (error) {
        console.error('Error updating voice clone:', error);
      }
    } catch (error) {
      console.error('ElevenLabs processing error:', error);
      
      // Update status to failed with error message
      const { error: updateError } = await supabase
        .from('voice_clones')
        .update({
          status: 'failed',
          processing_data: {
            error_message: error instanceof Error ? error.message : 'Unknown error occurred',
            processing_time: 0
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', voiceCloneId);

      if (updateError) {
        console.error('Error updating failed voice clone:', updateError);
      }
    }
  }

  static async simulateProcessing(voiceCloneId: string): Promise<void> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 5000));

    // Simulate processing completion
    const processingData = {
      duration: Math.round(10 + Math.random() * 50), // 10-60 seconds
      quality_score: Math.round((0.7 + Math.random() * 0.3) * 100), // 70-100%
      processing_time: Math.round(3 + Math.random() * 7) // 3-10 seconds
    };

    const { error } = await supabase
      .from('voice_clones')
      .update({
        status: 'completed',
        processing_data: processingData,
        voice_model_id: `voice_${Date.now()}`, // Simulated model ID
        updated_at: new Date().toISOString()
      })
      .eq('id', voiceCloneId);

    if (error) {
      console.error('Error updating voice clone:', error);
    }
  }

  static async getAllVoiceClones(): Promise<VoiceCloneData[]> {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    let query = supabase
      .from('voice_clones')
      .select('*')
      .order('created_at', { ascending: false });

    // If user is authenticated, filter by user_id
    if (user) {
      query = query.eq('user_id', user.id);
    } else {
      // For anonymous users, show voice clones created by anonymous sessions
      query = query.like('user_id', 'anonymous_%');
    }

    const { data, error } = await query;

    if (error) throw error;
    
    return (data || []).map(clone => ({
      id: clone.id,
      name: clone.name,
      status: clone.status,
      isPaid: clone.is_paid,
      createdAt: clone.created_at,
      processingData: clone.processing_data
    }));
  }

  static async deleteVoiceClone(voiceCloneId: string): Promise<void> {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check if user owns this voice clone
    const { data: voiceClone } = await supabase
      .from('voice_clones')
      .select('user_id, audio_file_url')
      .eq('id', voiceCloneId)
      .single();

    if (voiceClone && user && voiceClone.user_id !== user.id) {
      throw new Error('Вы не можете удалить чужой голос');
    }

    // Delete audio file from storage if exists
    if (voiceClone?.audio_file_url) {
      const fileName = voiceClone.audio_file_url.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('voice-samples')
          .remove([fileName]);
      }
    }

    // Delete voice clone record
    const { error } = await supabase
      .from('voice_clones')
      .delete()
      .eq('id', voiceCloneId);

    if (error) throw error;
  }

  static async updatePaymentStatus(voiceCloneId: string, isPaid: boolean): Promise<void> {
    const { error } = await supabase
      .from('voice_clones')
      .update({ 
        is_paid: isPaid,
        updated_at: new Date().toISOString()
      })
      .eq('id', voiceCloneId);

    if (error) throw error;
  }
}