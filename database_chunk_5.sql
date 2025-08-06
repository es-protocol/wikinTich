-- =====================================================
-- CHUNK 5: Tutor Matching System
-- =====================================================
-- This chunk adds support for Super Admin to propose tutors
-- and Parents to view/accept/reject tutor proposals

-- =====================================================
-- 1. CREATE NEW TABLES
-- =====================================================

-- Tutor Proposals Table (Super Admin proposes tutors for students)
CREATE TABLE public.tutor_proposals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  tutor_id uuid NOT NULL,
  proposed_by uuid NOT NULL, -- Super Admin who made the proposal
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  proposed_at timestamp with time zone DEFAULT now(),
  responded_at timestamp with time zone,
  response_notes text, -- Parent's notes when accepting/rejecting
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tutor_proposals_pkey PRIMARY KEY (id),
  CONSTRAINT tutor_proposals_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT tutor_proposals_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.tutors(id),
  CONSTRAINT tutor_proposals_proposed_by_fkey FOREIGN KEY (proposed_by) REFERENCES public.profiles(id),
  CONSTRAINT tutor_proposals_unique_student_tutor UNIQUE (student_id, tutor_id)
);

-- Tutor Information Display Table (for showing basic tutor info to parents)
CREATE TABLE public.tutor_display_info (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL,
  display_name text NOT NULL,
  subjects_taught text[] NOT NULL,
  experience_years integer,
  education_level text,
  bio_summary text, -- Short bio for parent display
  availability_summary text, -- e.g., "Weekdays 3-6 PM, Weekends 9 AM-2 PM"
  rating numeric DEFAULT 0,
  total_reviews integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tutor_display_info_pkey PRIMARY KEY (id),
  CONSTRAINT tutor_display_info_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.tutors(id),
  CONSTRAINT tutor_display_info_tutor_id_unique UNIQUE (tutor_id)
);

-- Tutor Reviews Table (for parent reviews and ratings)
CREATE TABLE public.tutor_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL,
  parent_id uuid NOT NULL,
  student_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  session_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tutor_reviews_pkey PRIMARY KEY (id),
  CONSTRAINT tutor_reviews_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.tutors(id),
  CONSTRAINT tutor_reviews_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.profiles(id),
  CONSTRAINT tutor_reviews_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);

-- =====================================================
-- 2. UPDATE EXISTING TABLES
-- =====================================================

-- Add proposal_id to home_tutoring_requests to track which proposal was accepted
ALTER TABLE public.home_tutoring_requests 
ADD COLUMN accepted_proposal_id uuid REFERENCES public.tutor_proposals(id);

-- =====================================================
-- 3. DISABLE ROW LEVEL SECURITY (for MVP)
-- =====================================================

-- Disable RLS for new tables to avoid permission issues during development
ALTER TABLE public.tutor_proposals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_display_info DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_reviews DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. VERIFICATION QUERIES
-- =====================================================

-- Verify tables were created successfully
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tutor_proposals', 'tutor_display_info', 'tutor_reviews')
ORDER BY table_name;

-- Verify columns were added successfully
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'home_tutoring_requests' 
AND column_name = 'accepted_proposal_id';

-- =====================================================
-- CHUNK 5 COMPLETE
-- =====================================================
-- Next: Add sample data for tutor matching system
-- Then: Implement UI for tutor matching in Parent Dashboard 