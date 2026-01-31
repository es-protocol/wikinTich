-- Session audit log for tutoring session state changes.
-- Records who did what to which session and when (compliance and support).
-- Run this migration in your Supabase SQL editor.

CREATE TABLE IF NOT EXISTS session_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES home_tutoring_sessions(id) ON DELETE CASCADE,
  actor_role TEXT NOT NULL CHECK (actor_role IN ('parent', 'tutor')),
  actor_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN (
    'accepted',
    'request_change',
    'cancelled',
    'created',
    'rescheduled',
    'completed',
    'no_show',
    'confirmed',
    'accept_change'
  )),
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_audit_log_session_id ON session_audit_log(session_id);
CREATE INDEX IF NOT EXISTS idx_session_audit_log_actor_id ON session_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_session_audit_log_created_at ON session_audit_log(created_at);

COMMENT ON TABLE session_audit_log IS 'Audit trail for session state changes (who, what, when)';
