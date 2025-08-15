-- Add is_read field to parent_notifications table
ALTER TABLE parent_notifications 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Set all existing notifications as read (since they were created before we implemented this logic)
UPDATE parent_notifications 
SET is_read = TRUE 
WHERE is_read IS NULL OR is_read = FALSE;

-- Verify the changes
SELECT COUNT(*) as total_notifications, 
       COUNT(*) FILTER (WHERE is_read = TRUE) as read_notifications,
       COUNT(*) FILTER (WHERE is_read = FALSE) as unread_notifications
FROM parent_notifications;
