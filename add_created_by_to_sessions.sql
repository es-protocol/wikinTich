-- Add created_by field to home_tutoring_sessions table
ALTER TABLE home_tutoring_sessions 
ADD COLUMN IF NOT EXISTS created_by VARCHAR(50) DEFAULT 'parent';

-- Update existing sessions to have created_by = 'parent' (since they were created before we implemented this logic)
UPDATE home_tutoring_sessions 
SET created_by = 'parent' 
WHERE created_by IS NULL;

-- Verify the changes
SELECT COUNT(*) as total_sessions, 
       COUNT(*) FILTER (WHERE created_by = 'parent') as parent_created,
       COUNT(*) FILTER (WHERE created_by = 'tutor') as tutor_created,
       COUNT(*) FILTER (WHERE created_by IS NULL) as null_created_by
FROM home_tutoring_sessions;
