-- =====================================================
-- CHUNK 2: Parent Notifications & Ratings
-- =====================================================
-- This chunk adds notification system and rating system for the Parent/Student Dashboard
-- Completes the Parent/Student Dashboard database foundation

-- =====================================================
-- 1. CREATE NEW TABLES
-- =====================================================

-- Parent Notifications Table (for parent-specific notifications)
CREATE TABLE public.parent_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN ('request', 'session', 'report', 'system')),
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT parent_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT parent_notifications_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.profiles(id)
);

-- Home Tutoring Ratings Table (for student ratings of tutors)
CREATE TABLE public.home_tutoring_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL,
  tutor_id uuid NOT NULL,
  session_id uuid NOT NULL,
  student_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  month_year date NOT NULL, -- First day of the month
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT home_tutoring_ratings_pkey PRIMARY KEY (id),
  CONSTRAINT home_tutoring_ratings_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.profiles(id),
  CONSTRAINT home_tutoring_ratings_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.tutors(id),
  CONSTRAINT home_tutoring_ratings_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.home_tutoring_sessions(id)
);

-- =====================================================
-- 2. DISABLE ROW LEVEL SECURITY (for MVP)
-- =====================================================

-- Disable RLS for new tables to avoid permission issues during development
ALTER TABLE public.parent_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_tutoring_ratings DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. VERIFICATION QUERIES
-- =====================================================

-- Verify tables were created successfully
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('parent_notifications', 'home_tutoring_ratings')
ORDER BY table_name;

-- Verify table structures
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'parent_notifications'
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'home_tutoring_ratings'
ORDER BY ordinal_position;

-- =====================================================
-- CHUNK 2 COMPLETE
-- =====================================================
-- Parent/Student Dashboard database foundation is now complete!
-- Next: Proceed to Chunk 3 (School Admin Dashboard Tables) 