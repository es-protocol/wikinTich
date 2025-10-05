-- Create failed_login_attempts table for account lockout
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  attempt_count INTEGER DEFAULT 1,
  first_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  locked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_email ON failed_login_attempts(email);

-- Create index for cleanup of old records
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_last_attempt ON failed_login_attempts(last_attempt_at);

-- Create function to clean up old failed attempts (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_failed_attempts()
RETURNS void AS $$
BEGIN
  DELETE FROM failed_login_attempts 
  WHERE last_attempt_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_failed_login_attempts_updated_at
  BEFORE UPDATE ON failed_login_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
-- GRANT SELECT, INSERT, UPDATE, DELETE ON failed_login_attempts TO authenticated;
-- GRANT USAGE ON SCHEMA public TO authenticated;
