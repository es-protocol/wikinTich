-- Message audit log for in-app messaging (support/moderation).
-- Run in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS message_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('parent', 'tutor')),
  action TEXT NOT NULL DEFAULT 'message_sent' CHECK (action = 'message_sent'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_audit_log_conversation_id ON message_audit_log(conversation_id);
CREATE INDEX IF NOT EXISTS idx_message_audit_log_sender_id ON message_audit_log(sender_id);
CREATE INDEX IF NOT EXISTS idx_message_audit_log_created_at ON message_audit_log(created_at);

COMMENT ON TABLE message_audit_log IS 'Audit trail for message_sent (who, which conversation, when)';
