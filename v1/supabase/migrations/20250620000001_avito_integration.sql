-- Create avito_integrations table
CREATE TABLE IF NOT EXISTS avito_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error')),
    connected_twin_id UUID REFERENCES digital_twins(id) ON DELETE SET NULL,
    auto_reply BOOLEAN DEFAULT false,
    messages_count INTEGER DEFAULT 0,
    last_activity TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create avito_messages table
CREATE TABLE IF NOT EXISTS avito_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    integration_id UUID NOT NULL REFERENCES avito_integrations(id) ON DELETE CASCADE,
    chat_id VARCHAR(255) NOT NULL,
    chat_name VARCHAR(255),
    message_text TEXT NOT NULL,
    is_incoming BOOLEAN DEFAULT true,
    response_text TEXT,
    item_title VARCHAR(500),
    item_price VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_avito_integrations_phone ON avito_integrations(phone);
CREATE INDEX IF NOT EXISTS idx_avito_integrations_status ON avito_integrations(status);
CREATE INDEX IF NOT EXISTS idx_avito_integrations_twin_id ON avito_integrations(connected_twin_id);
CREATE INDEX IF NOT EXISTS idx_avito_messages_integration_id ON avito_messages(integration_id);
CREATE INDEX IF NOT EXISTS idx_avito_messages_chat_id ON avito_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_avito_messages_timestamp ON avito_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_avito_messages_is_incoming ON avito_messages(is_incoming);

-- Create RLS policies
ALTER TABLE avito_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE avito_messages ENABLE ROW LEVEL SECURITY;

-- Policies for avito_integrations
CREATE POLICY "Users can view their own avito integrations" ON avito_integrations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own avito integrations" ON avito_integrations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own avito integrations" ON avito_integrations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own avito integrations" ON avito_integrations
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for avito_messages
CREATE POLICY "Users can view messages from their integrations" ON avito_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM avito_integrations 
            WHERE avito_integrations.id = avito_messages.integration_id 
            AND avito_integrations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages for their integrations" ON avito_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM avito_integrations 
            WHERE avito_integrations.id = avito_messages.integration_id 
            AND avito_integrations.user_id = auth.uid()
        )
    );

-- Create index for user_id
CREATE INDEX IF NOT EXISTS idx_avito_integrations_user_id ON avito_integrations(user_id);

-- Create function to automatically set user_id
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for avito_integrations
DROP TRIGGER IF EXISTS set_avito_integrations_user_id ON avito_integrations;
CREATE TRIGGER set_avito_integrations_user_id
    BEFORE INSERT ON avito_integrations
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

-- Create function to update messages count
CREATE OR REPLACE FUNCTION update_avito_messages_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE avito_integrations 
        SET messages_count = messages_count + 1,
            last_activity = NOW()
        WHERE id = NEW.integration_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE avito_integrations 
        SET messages_count = messages_count - 1
        WHERE id = OLD.integration_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for avito_messages
DROP TRIGGER IF EXISTS update_avito_messages_count_trigger ON avito_messages;
CREATE TRIGGER update_avito_messages_count_trigger
    AFTER INSERT OR DELETE ON avito_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_avito_messages_count(); 