-- =====================================================
-- CHUNK 3: School Admin Dashboard Tables
-- =====================================================
-- This chunk adds performance tracking, attendance, ratings, and notifications
-- for the School Admin Dashboard

-- =====================================================
-- 1. CREATE NEW TABLES
-- =====================================================

-- Teacher Performance Table (weekly performance tracking)
CREATE TABLE public.teacher_performance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  tutor_id uuid NOT NULL,
  assignment_id uuid NOT NULL,
  week_start_date date NOT NULL, -- Start of the week (Monday)
  week_end_date date NOT NULL,   -- End of the week (Sunday)
  hours_worked numeric DEFAULT 0,
  sessions_attended integer DEFAULT 0,
  total_sessions integer DEFAULT 0,
  attendance_rate numeric DEFAULT 0, -- Calculated: sessions_attended/total_sessions
  average_rating numeric DEFAULT 0,  -- Monthly average from student ratings
  performance_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT teacher_performance_pkey PRIMARY KEY (id),
  CONSTRAINT teacher_performance_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id),
  CONSTRAINT teacher_performance_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.tutors(id),
  CONSTRAINT teacher_performance_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.school_teacher(id)
);

-- Teacher Attendance Table (per-session attendance)
CREATE TABLE public.teacher_attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  tutor_id uuid NOT NULL,
  assignment_id uuid NOT NULL,
  session_date date NOT NULL,
  session_time time without time zone,
  status text NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  hours_worked numeric DEFAULT 0,
  session_notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT teacher_attendance_pkey PRIMARY KEY (id),
  CONSTRAINT teacher_attendance_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id),
  CONSTRAINT teacher_attendance_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.tutors(id),
  CONSTRAINT teacher_attendance_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.school_teacher(id)
);

-- Student Teacher Ratings Table (monthly student ratings for institutions)
CREATE TABLE public.student_teacher_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  tutor_id uuid NOT NULL,
  assignment_id uuid NOT NULL,
  student_name text NOT NULL, -- Anonymous student rating
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  month_year date NOT NULL, -- First day of the month
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT student_teacher_ratings_pkey PRIMARY KEY (id),
  CONSTRAINT student_teacher_ratings_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id),
  CONSTRAINT student_teacher_ratings_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.tutors(id),
  CONSTRAINT student_teacher_ratings_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.school_teacher(id)
);

-- School Admin Notifications Table (admin-specific notifications)
CREATE TABLE public.school_admin_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL, -- Specific admin who receives the notification
  school_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN ('request', 'teacher', 'payment', 'system')),
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT school_admin_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT school_admin_notifications_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.profiles(id),
  CONSTRAINT school_admin_notifications_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id)
);

-- =====================================================
-- 2. UPDATE EXISTING TABLES
-- =====================================================

-- Add performance tracking fields to school_teacher
ALTER TABLE public.school_teacher 
ADD COLUMN total_hours numeric DEFAULT 0,
ADD COLUMN monthly_average_rating numeric DEFAULT 0,
ADD COLUMN overall_attendance_rate numeric DEFAULT 0;

-- Add assignment tracking fields to institution_requests
ALTER TABLE public.institution_requests 
ADD COLUMN assigned_teacher_count integer DEFAULT 0,
ADD COLUMN completion_date timestamp with time zone;

-- =====================================================
-- 3. DISABLE ROW LEVEL SECURITY (for MVP)
-- =====================================================

-- Disable RLS for new tables to avoid permission issues during development
ALTER TABLE public.teacher_performance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_teacher_ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_admin_notifications DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. VERIFICATION QUERIES
-- =====================================================

-- Verify tables were created successfully
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('teacher_performance', 'teacher_attendance', 'student_teacher_ratings', 'school_admin_notifications')
ORDER BY table_name;

-- Verify columns were added to existing tables
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'school_teacher' 
AND column_name IN ('total_hours', 'monthly_average_rating', 'overall_attendance_rate')
ORDER BY column_name;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'institution_requests' 
AND column_name IN ('assigned_teacher_count', 'completion_date')
ORDER BY column_name;

-- =====================================================
-- CHUNK 3 COMPLETE
-- =====================================================
-- School Admin Dashboard database foundation is now complete!
-- Next: Proceed to Chunk 4 (School Admin Notifications - already done above)
-- Then: Proceed to Chunk 5 (Tutor Dashboard Tables) 