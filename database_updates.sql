-- Add email verification fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE;

-- Add index for email verification queries
CREATE INDEX IF NOT EXISTS idx_profiles_email_verified ON public.profiles(email_verified);

-- Update existing profiles to have email_verified = false (for safety)
UPDATE public.profiles 
SET email_verified = false 
WHERE email_verified IS NULL;

-- Fix schools table - add missing columns
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add index for admin_id queries
CREATE INDEX IF NOT EXISTS idx_schools_admin_id ON public.schools(admin_id);

-- Fix institution_requests table - add missing columns
ALTER TABLE public.institution_requests 
ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id),
ADD COLUMN IF NOT EXISTS experience_level TEXT,
ADD COLUMN IF NOT EXISTS duration TEXT,
ADD COLUMN IF NOT EXISTS additional_requirements TEXT;

-- Add index for admin_id queries in institution_requests
CREATE INDEX IF NOT EXISTS idx_institution_requests_admin_id ON public.institution_requests(admin_id); 

-- =====================================================
-- REMOVE HOURLY RATE AND DESCRIPTION FIELDS
-- =====================================================

-- Remove hourly_rate column from tutors table
ALTER TABLE public.tutors DROP COLUMN IF EXISTS hourly_rate;

-- Remove description column from tutor_qualifications table  
ALTER TABLE public.tutor_qualifications DROP COLUMN IF EXISTS description;

-- =====================================================
-- END OF UPDATES
-- ===================================================== 