-- Create pending_registrations table for secure server-side storage
CREATE TABLE IF NOT EXISTS pending_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  registration_data JSONB NOT NULL,
  registration_type VARCHAR(50) NOT NULL CHECK (registration_type IN ('parent', 'tutor')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_pending_registrations_email ON pending_registrations(email);

-- Create index for automatic cleanup of expired records
CREATE INDEX IF NOT EXISTS idx_pending_registrations_expires_at ON pending_registrations(expires_at);

-- Create function to automatically clean up expired records
CREATE OR REPLACE FUNCTION cleanup_expired_registrations()
RETURNS void AS $$
BEGIN
  DELETE FROM pending_registrations 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pending_registrations_updated_at
  BEFORE UPDATE ON pending_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions (adjust based on your Supabase setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON pending_registrations TO authenticated;
-- GRANT USAGE ON SCHEMA public TO authenticated;
