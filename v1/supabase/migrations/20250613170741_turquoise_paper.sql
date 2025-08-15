/*
  # Create voice-samples storage bucket

  1. Storage Setup
    - Create `voice-samples` bucket for storing voice clone audio files
    - Set bucket to be private (not publicly accessible by default)
    
  2. Security Policies
    - Allow authenticated users to upload files to their own folder
    - Allow anonymous users to upload files to anonymous folders
    - Allow users to read their own uploaded files
    - Allow users to delete their own uploaded files

  3. Configuration
    - Set appropriate file size limits
    - Configure allowed file types for audio files
*/

-- Create the voice-samples bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'voice-samples',
  'voice-samples',
  false,
  52428800, -- 50MB limit
  ARRAY['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a', 'audio/ogg', 'audio/webm']
);

-- Policy: Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload voice samples to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'voice-samples' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow anonymous users to upload files to anonymous folders
CREATE POLICY "Anonymous users can upload voice samples to anonymous folders"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'voice-samples' AND
  (storage.foldername(name))[1] LIKE 'anonymous_%'
);

-- Policy: Allow users to read their own uploaded files
CREATE POLICY "Users can read own voice samples"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'voice-samples' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow anonymous users to read their own uploaded files
CREATE POLICY "Anonymous users can read own voice samples"
ON storage.objects
FOR SELECT
TO anon
USING (
  bucket_id = 'voice-samples' AND
  (storage.foldername(name))[1] LIKE 'anonymous_%'
);

-- Policy: Allow users to delete their own uploaded files
CREATE POLICY "Users can delete own voice samples"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'voice-samples' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow anonymous users to delete their own uploaded files
CREATE POLICY "Anonymous users can delete own voice samples"
ON storage.objects
FOR DELETE
TO anon
USING (
  bucket_id = 'voice-samples' AND
  (storage.foldername(name))[1] LIKE 'anonymous_%'
);