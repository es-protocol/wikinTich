-- Allow 'session' notification_type in parent_notifications (for session scheduling notifications).
-- Run this in Supabase SQL Editor only if parent_notifications has a check constraint on notification_type
-- that currently rejects 'session' (e.g. only allows 'system', 'match').

-- 1. Drop existing check constraint (replace constraint_name with your actual constraint name if different)
-- Check current constraint: SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'parent_notifications'::regclass;
-- ALTER TABLE parent_notifications DROP CONSTRAINT IF EXISTS parent_notifications_notification_type_check;

-- 2. Add new constraint that includes 'session'
-- ALTER TABLE parent_notifications ADD CONSTRAINT parent_notifications_notification_type_check CHECK (notification_type IN ('system', 'match', 'session'));

-- If your table has no constraint on notification_type, no migration is needed; 'session' will work.
