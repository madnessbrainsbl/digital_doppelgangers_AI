-- Create table for user's Avito API credentials
CREATE TABLE IF NOT EXISTS avito_user_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    avito_api_key VARCHAR(255),
    avito_api_url VARCHAR(255) DEFAULT 'https://api.avito.ru',
    webhook_secret VARCHAR(255),
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_avito_user_credentials_user_id ON avito_user_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_avito_user_credentials_active ON avito_user_credentials(is_active);

-- Enable RLS
ALTER TABLE avito_user_credentials ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own avito credentials" ON avito_user_credentials
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own avito credentials" ON avito_user_credentials
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own avito credentials" ON avito_user_credentials
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own avito credentials" ON avito_user_credentials
    FOR DELETE USING (auth.uid() = user_id);

-- Add trigger to automatically set user_id
CREATE OR REPLACE FUNCTION set_avito_credentials_user_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_avito_credentials_user_id_trigger
    BEFORE INSERT ON avito_user_credentials
    FOR EACH ROW
    EXECUTE FUNCTION set_avito_credentials_user_id(); 