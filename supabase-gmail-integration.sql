-- Gmail Integration Database Schema
-- This migration adds support for Gmail OAuth and email syncing

-- 1. Create table to store Gmail OAuth tokens for each user
CREATE TABLE IF NOT EXISTS gmail_connections (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_address TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expiry TIMESTAMP WITH TIME ZONE,
    scope TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, email_address)
);

-- 2. Create table to track email sync history and status
CREATE TABLE IF NOT EXISTS gmail_sync_log (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gmail_connection_id INTEGER NOT NULL REFERENCES gmail_connections(id) ON DELETE CASCADE,
    sync_type TEXT NOT NULL, -- 'manual', 'automatic', 'initial'
    status TEXT NOT NULL, -- 'in_progress', 'completed', 'failed'
    emails_processed INTEGER DEFAULT 0,
    companies_created INTEGER DEFAULT 0,
    contacts_created INTEGER DEFAULT 0,
    interactions_created INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add Gmail-specific columns to interactions table
ALTER TABLE interactions
ADD COLUMN IF NOT EXISTS gmail_message_id TEXT,
ADD COLUMN IF NOT EXISTS gmail_thread_id TEXT,
ADD COLUMN IF NOT EXISTS is_gmail_synced BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_subject TEXT,
ADD COLUMN IF NOT EXISTS email_snippet TEXT,
ADD COLUMN IF NOT EXISTS email_direction TEXT CHECK (email_direction IN ('sent', 'received'));

-- 4. Create index on gmail_message_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_interactions_gmail_message_id ON interactions(gmail_message_id);
CREATE INDEX IF NOT EXISTS idx_interactions_gmail_thread_id ON interactions(gmail_thread_id);

-- 5. Add indexes for gmail_connections
CREATE INDEX IF NOT EXISTS idx_gmail_connections_user_id ON gmail_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_gmail_connections_email ON gmail_connections(email_address);

-- 6. Add indexes for gmail_sync_log
CREATE INDEX IF NOT EXISTS idx_gmail_sync_log_user_id ON gmail_sync_log(user_id);
CREATE INDEX IF NOT EXISTS idx_gmail_sync_log_status ON gmail_sync_log(status);

-- 7. Add Row Level Security (RLS) policies for gmail_connections
ALTER TABLE gmail_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own Gmail connections"
    ON gmail_connections FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Gmail connections"
    ON gmail_connections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Gmail connections"
    ON gmail_connections FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Gmail connections"
    ON gmail_connections FOR DELETE
    USING (auth.uid() = user_id);

-- 8. Add Row Level Security (RLS) policies for gmail_sync_log
ALTER TABLE gmail_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sync logs"
    ON gmail_sync_log FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync logs"
    ON gmail_sync_log FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 9. Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_gmail_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger for updated_at
CREATE TRIGGER trigger_update_gmail_connections_updated_at
    BEFORE UPDATE ON gmail_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_gmail_connections_updated_at();

-- 11. Add comment to document the schema
COMMENT ON TABLE gmail_connections IS 'Stores Gmail OAuth tokens and connection status for each user';
COMMENT ON TABLE gmail_sync_log IS 'Tracks history and status of Gmail email sync operations';
COMMENT ON COLUMN interactions.gmail_message_id IS 'Gmail message ID for synced emails';
COMMENT ON COLUMN interactions.gmail_thread_id IS 'Gmail thread ID for conversation grouping';
COMMENT ON COLUMN interactions.is_gmail_synced IS 'Flag indicating if this interaction was synced from Gmail';
COMMENT ON COLUMN interactions.email_subject IS 'Email subject line for email interactions';
COMMENT ON COLUMN interactions.email_snippet IS 'Short preview/snippet of email content';
COMMENT ON COLUMN interactions.email_direction IS 'Whether email was sent or received';
