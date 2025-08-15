-- Create calendar_contacts table
CREATE TABLE IF NOT EXISTS calendar_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    company VARCHAR(255),
    position VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES calendar_contacts(id) ON DELETE CASCADE,
    twin_id UUID REFERENCES digital_twins(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) DEFAULT 'meeting' CHECK (event_type IN ('meeting', 'call', 'consultation', 'presentation', 'other')),
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled')),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Europe/Moscow',
    location VARCHAR(500),
    meeting_link VARCHAR(500),
    reminder_minutes INTEGER DEFAULT 15,
    is_reminder_sent BOOLEAN DEFAULT false,
    chat_context TEXT, -- Контекст из чата, где была создана встреча
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calendar_contacts_user_id ON calendar_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_contacts_phone ON calendar_contacts(phone);
CREATE INDEX IF NOT EXISTS idx_calendar_contacts_email ON calendar_contacts(email);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_contact_id ON calendar_events(contact_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_twin_id ON calendar_events(twin_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(event_type);

-- Enable RLS
ALTER TABLE calendar_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for calendar_contacts
CREATE POLICY "Users can view their own calendar contacts" ON calendar_contacts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar contacts" ON calendar_contacts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar contacts" ON calendar_contacts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar contacts" ON calendar_contacts
    FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for calendar_events
CREATE POLICY "Users can view their own calendar events" ON calendar_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar events" ON calendar_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar events" ON calendar_events
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar events" ON calendar_events
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically set user_id
CREATE OR REPLACE FUNCTION set_calendar_user_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic user_id setting
CREATE TRIGGER set_calendar_contacts_user_id_trigger
    BEFORE INSERT ON calendar_contacts
    FOR EACH ROW
    EXECUTE FUNCTION set_calendar_user_id();

CREATE TRIGGER set_calendar_events_user_id_trigger
    BEFORE INSERT ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION set_calendar_user_id();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_calendar_contacts_updated_at
    BEFORE UPDATE ON calendar_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 