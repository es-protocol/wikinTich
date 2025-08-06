-- =====================================================
-- CHUNK 4: Tutor Dashboard Tables
-- =====================================================
-- This chunk adds dual-category support (institution + home tutoring)
-- for the Tutor Dashboard with combined performance tracking

-- =====================================================
-- 1. CREATE NEW TABLES
-- =====================================================

-- Tutor Performance Table (combined monthly performance tracking)
CREATE TABLE public.tutor_performance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL,
  month_year date NOT NULL, -- First day of the month
  total_hours numeric DEFAULT 0,
  institution_hours numeric DEFAULT 0,
  home_tutoring_hours numeric DEFAULT 0,
  total_sessions integer DEFAULT 0,
  institution_sessions integer DEFAULT 0,
  home_tutoring_sessions integer DEFAULT 0,
  average_rating numeric DEFAULT 0,
  attendance_rate numeric DEFAULT 0,
  performance_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tutor_performance_pkey PRIMARY KEY (id),
  CONSTRAINT tutor_performance_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.tutors(id)
);

-- Tutor Session Attendance Table (combined session attendance)
CREATE TABLE public.tutor_session_attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL,
  session_type text NOT NULL CHECK (session_type IN ('institution', 'home_tutoring')),
  session_id uuid NOT NULL, -- References either school_teacher or home_tutoring_sessions
  session_date date NOT NULL,
  session_time time without time zone,
  status text NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  hours_worked numeric DEFAULT 0,
  session_notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tutor_session_attendance_pkey PRIMARY KEY (id),
  CONSTRAINT tutor_session_attendance_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.tutors(id)
);

-- Tutor Notifications Table (tutor-specific notifications)
CREATE TABLE public.tutor_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN ('institution', 'home_tutoring', 'payment', 'system')),
  category text NOT NULL CHECK (category IN ('institution', 'home_tutoring', 'general')),
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tutor_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT tutor_notifications_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.tutors(id)
);

-- Tutor Session Reports Table (combined session reports)
CREATE TABLE public.tutor_session_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL,
  session_type text NOT NULL CHECK (session_type IN ('institution', 'home_tutoring')),
  session_id uuid NOT NULL, -- References either school_teacher or home_tutoring_sessions
  session_date date NOT NULL,
  topics_covered text,
  student_engagement text,
  areas_for_improvement text,
  homework_assigned text,
  next_session_focus text,
  tutor_notes text,
  report_type text NOT NULL CHECK (report_type IN ('weekly', 'daily')), -- Weekly for institution, daily for home
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tutor_session_reports_pkey PRIMARY KEY (id),
  CONSTRAINT tutor_session_reports_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.tutors(id)
);

-- Tutor Payments Table (combined payment tracking)
CREATE TABLE public.tutor_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL,
  payment_type text NOT NULL CHECK (payment_type IN ('institution', 'home_tutoring')),
  source_id uuid NOT NULL, -- References either school_payments or home_tutoring_payments
  amount numeric NOT NULL,
  payment_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'paid', 'failed')),
  payment_method text DEFAULT 'mobile_money',
  transaction_reference text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tutor_payments_pkey PRIMARY KEY (id),
  CONSTRAINT tutor_payments_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.tutors(id)
);

-- =====================================================
-- 2. UPDATE EXISTING TABLES
-- =====================================================

-- Add performance tracking fields to tutors table
ALTER TABLE public.tutors 
ADD COLUMN total_hours numeric DEFAULT 0,
ADD COLUMN average_rating numeric DEFAULT 0,
ADD COLUMN overall_attendance_rate numeric DEFAULT 0,
ADD COLUMN active_institution_assignments integer DEFAULT 0,
ADD COLUMN active_home_assignments integer DEFAULT 0;

-- Add tutor tracking fields to home_tutoring_sessions
ALTER TABLE public.home_tutoring_sessions 
ADD COLUMN tutor_attendance_status text DEFAULT 'scheduled',
ADD COLUMN tutor_notes text;

-- =====================================================
-- 3. DISABLE ROW LEVEL SECURITY (for MVP)
-- =====================================================

-- Disable RLS for new tables to avoid permission issues during development
ALTER TABLE public.tutor_performance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_session_attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_session_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_payments DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. VERIFICATION QUERIES
-- =====================================================

-- Verify tables were created successfully
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tutor_performance', 'tutor_session_attendance', 'tutor_notifications', 'tutor_session_reports', 'tutor_payments')
ORDER BY table_name;

-- Verify columns were added to existing tables
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tutors' 
AND column_name IN ('total_hours', 'average_rating', 'overall_attendance_rate', 'active_institution_assignments', 'active_home_assignments')
ORDER BY column_name;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'home_tutoring_sessions' 
AND column_name IN ('tutor_attendance_status', 'tutor_notes')
ORDER BY column_name;

-- =====================================================
-- CHUNK 4 COMPLETE
-- =====================================================
-- Tutor Dashboard database foundation is now complete!
-- All three dashboard database foundations are now complete!
-- Next: Test all dashboards with real data 