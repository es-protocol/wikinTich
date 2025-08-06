-- =====================================================
-- CHUNK 1: Parent/Student Dashboard Tables
-- =====================================================
-- This chunk adds support for multiple students, progress tracking,
-- session reports, and attendance tracking for the Parent/Student Dashboard

-- =====================================================
-- 1. CREATE NEW TABLES
-- =====================================================

-- Students Table (for multiple children management)
CREATE TABLE public.students (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL,
  name text NOT NULL,
  age integer,
  grade_level text,
  school_name text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT students_pkey PRIMARY KEY (id),
  CONSTRAINT students_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.profiles(id)
);

-- Student Progress Table (for mastery tracking)
CREATE TABLE public.student_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  subject text NOT NULL,
  mastery_level text NOT NULL CHECK (mastery_level IN ('beginner', 'intermediate', 'advanced')),
  attendance_rate numeric DEFAULT 0,
  last_updated timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT student_progress_pkey PRIMARY KEY (id),
  CONSTRAINT student_progress_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);

-- Session Reports Table (for daily tutor notes)
CREATE TABLE public.session_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  tutor_id uuid NOT NULL,
  student_id uuid NOT NULL,
  session_date date NOT NULL,
  topics_covered text,
  student_engagement text,
  areas_for_improvement text,
  homework_assigned text,
  next_session_focus text,
  tutor_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT session_reports_pkey PRIMARY KEY (id),
  CONSTRAINT session_reports_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.home_tutoring_sessions(id),
  CONSTRAINT session_reports_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.tutors(id),
  CONSTRAINT session_reports_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);

-- Session Attendance Table (for attendance tracking)
CREATE TABLE public.session_attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  student_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT session_attendance_pkey PRIMARY KEY (id),
  CONSTRAINT session_attendance_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.home_tutoring_sessions(id),
  CONSTRAINT session_attendance_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);

-- =====================================================
-- 2. UPDATE EXISTING TABLES
-- =====================================================

-- Add student_id column to home_tutoring_requests (hybrid approach)
ALTER TABLE public.home_tutoring_requests 
ADD COLUMN student_id uuid REFERENCES public.students(id);

-- Add student_id column to home_tutoring_sessions (hybrid approach)
ALTER TABLE public.home_tutoring_sessions 
ADD COLUMN student_id uuid REFERENCES public.students(id);

-- =====================================================
-- 3. DISABLE ROW LEVEL SECURITY (for MVP)
-- =====================================================

-- Disable RLS for new tables to avoid permission issues during development
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_attendance DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. VERIFICATION QUERIES
-- =====================================================

-- Verify tables were created successfully
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('students', 'student_progress', 'session_reports', 'session_attendance')
ORDER BY table_name;

-- Verify columns were added successfully
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'home_tutoring_requests' 
AND column_name = 'student_id';

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'home_tutoring_sessions' 
AND column_name = 'student_id';

-- =====================================================
-- CHUNK 1 COMPLETE
-- =====================================================
-- Next: Test Parent/Student Dashboard functionality
-- Then: Proceed to Chunk 2 (Parent Notifications & Ratings) 