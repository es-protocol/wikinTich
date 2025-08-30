-- =====================================================
-- ENHANCE EXISTING TUTOR VERIFICATION SYSTEM
-- Builds on current is_verified boolean field
-- =====================================================

-- =====================================================
-- PHASE 1: ADD PROFILE COMPLETION FIELDS
-- =====================================================

-- Add profile completion tracking
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS profile_completion_data JSONB DEFAULT '{}';

-- Add file storage fields
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS cv_url TEXT;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS certificates_data JSONB DEFAULT '[]';

-- Add enhanced profile fields
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS years_of_experience INTEGER;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS education_level VARCHAR(100);
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS institution_name VARCHAR(200);
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS graduation_year INTEGER;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS professional_title VARCHAR(200);
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS languages_spoken TEXT[];
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS specializations TEXT[];

-- Add profile completion workflow tracking
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS profile_completion_step VARCHAR(50) DEFAULT 'basic_info';
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS profile_completion_submitted_at TIMESTAMP;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS profile_completion_reviewed_at TIMESTAMP;

-- =====================================================
-- PHASE 2: CREATE PERFORMANCE INDEXES
-- =====================================================

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_tutors_profile_completion ON tutors(profile_completion_percentage);
CREATE INDEX IF NOT EXISTS idx_tutors_completion_step ON tutors(profile_completion_step);
CREATE INDEX IF NOT EXISTS idx_tutors_experience ON tutors(years_of_experience);
CREATE INDEX IF NOT EXISTS idx_tutors_languages ON tutors USING GIN(languages_spoken);
CREATE INDEX IF NOT EXISTS idx_tutors_specializations ON tutors USING GIN(specializations);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_tutors_verified_completion ON tutors(is_verified, profile_completion_percentage);
CREATE INDEX IF NOT EXISTS idx_tutors_completion_step_verified ON tutors(profile_completion_step, is_verified);

-- Create JSONB indexes for flexible queries
CREATE INDEX IF NOT EXISTS idx_tutors_completion_data ON tutors USING GIN(profile_completion_data);
CREATE INDEX IF NOT EXISTS idx_tutors_certificates_data ON tutors USING GIN(certificates_data);

-- =====================================================
-- PHASE 3: ADD CONSTRAINTS AND VALIDATIONS
-- =====================================================

-- Add constraints for data integrity
ALTER TABLE tutors ADD CONSTRAINT chk_profile_completion_percentage 
  CHECK (profile_completion_percentage >= 0 AND profile_completion_percentage <= 100);

ALTER TABLE tutors ADD CONSTRAINT chk_years_experience 
  CHECK (years_of_experience >= 0 AND years_of_experience <= 50);

ALTER TABLE tutors ADD CONSTRAINT chk_graduation_year 
  CHECK (graduation_year >= 1950 AND graduation_year <= EXTRACT(YEAR FROM CURRENT_DATE) + 5);

-- =====================================================
-- PHASE 4: UPDATE EXISTING RECORDS
-- =====================================================

-- Set default values for existing tutors based on current data
UPDATE tutors 
SET 
  profile_completion_percentage = CASE 
    WHEN bio IS NOT NULL AND subjects IS NOT NULL AND availability IS NOT NULL THEN 60
    WHEN bio IS NOT NULL AND subjects IS NOT NULL THEN 50
    WHEN bio IS NOT NULL OR subjects IS NOT NULL THEN 25
    ELSE 10
  END,
  profile_completion_data = jsonb_build_object(
    'steps_completed', jsonb_build_array(
      CASE WHEN bio IS NOT NULL THEN 'bio' END,
      CASE WHEN subjects IS NOT NULL THEN 'subjects' END,
      CASE WHEN availability IS NOT NULL THEN 'availability' END
    ),
    'total_steps', 8,
    'last_updated', NOW(),
    'basic_info_complete', CASE WHEN bio IS NOT NULL THEN true ELSE false END,
    'subjects_complete', CASE WHEN subjects IS NOT NULL THEN true ELSE false END,
    'availability_complete', CASE WHEN availability IS NOT NULL THEN true ELSE false END
  ),
  profile_completion_step = CASE 
    WHEN bio IS NOT NULL AND subjects IS NOT NULL AND availability IS NOT NULL THEN 'documents'
    WHEN bio IS NOT NULL AND subjects IS NOT NULL THEN 'availability'
    WHEN bio IS NOT NULL OR subjects IS NOT NULL THEN 'subjects'
    ELSE 'basic_info'
  END
WHERE profile_completion_percentage = 0;

-- =====================================================
-- PHASE 5: CREATE HELPER FUNCTIONS
-- =====================================================

-- Create function to update profile completion percentage
CREATE OR REPLACE FUNCTION update_profile_completion(tutor_id UUID)
RETURNS VOID AS $$
DECLARE
  tutor_record RECORD;
  completion_score INTEGER := 0;
  total_possible INTEGER := 100;
  completion_data JSONB;
BEGIN
  -- Get tutor data
  SELECT * INTO tutor_record FROM tutors WHERE id = tutor_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tutor not found';
  END IF;
  
  -- Calculate completion score based on filled fields
  IF tutor_record.bio IS NOT NULL AND LENGTH(tutor_record.bio) >= 10 THEN
    completion_score := completion_score + 15;
  END IF;
  
  IF tutor_record.subjects IS NOT NULL AND ARRAY_LENGTH(tutor_record.subjects, 1) > 0 THEN
    completion_score := completion_score + 15;
  END IF;
  
  IF tutor_record.availability IS NOT NULL AND LENGTH(tutor_record.availability) >= 5 THEN
    completion_score := completion_score + 10;
  END IF;
  
  IF tutor_record.years_of_experience IS NOT NULL THEN
    completion_score := completion_score + 5;
  END IF;
  
  IF tutor_record.education_level IS NOT NULL THEN
    completion_score := completion_score + 5;
  END IF;
  
  IF tutor_record.institution_name IS NOT NULL THEN
    completion_score := completion_score + 5;
  END IF;
  
  IF tutor_record.professional_title IS NOT NULL THEN
    completion_score := completion_score + 5;
  END IF;
  
  IF tutor_record.languages_spoken IS NOT NULL AND ARRAY_LENGTH(tutor_record.languages_spoken, 1) > 0 THEN
    completion_score := completion_score + 5;
  END IF;
  
  IF tutor_record.profile_picture_url IS NOT NULL THEN
    completion_score := completion_score + 15;
  END IF;
  
  IF tutor_record.cv_url IS NOT NULL THEN
    completion_score := completion_score + 15;
  END IF;
  
  -- Check certificates (at least one required for full completion)
  IF tutor_record.certificates_data IS NOT NULL AND JSONB_ARRAY_LENGTH(tutor_record.certificates_data) > 0 THEN
    completion_score := completion_score + 15;
  END IF;
  
  -- Ensure score doesn't exceed 100
  completion_score := LEAST(completion_score, total_possible);
  
  -- Determine current completion step
  DECLARE
    current_step TEXT := 'basic_info';
  BEGIN
    IF completion_score >= 100 THEN
      current_step := 'complete';
    ELSIF completion_score >= 85 THEN
      current_step := 'documents';
    ELSIF completion_score >= 70 THEN
      current_step := 'languages';
    ELSIF completion_score >= 55 THEN
      current_step := 'education';
    ELSIF completion_score >= 40 THEN
      current_step := 'experience';
    ELSIF completion_score >= 25 THEN
      current_step := 'availability';
    ELSIF completion_score >= 10 THEN
      current_step := 'subjects';
    ELSE
      current_step := 'basic_info';
    END IF;
    
    -- Update tutor record
    UPDATE tutors 
    SET 
      profile_completion_percentage = completion_score,
      profile_completion_step = current_step,
      profile_completion_data = jsonb_build_object(
        'steps_completed', jsonb_build_array(
          CASE WHEN tutor_record.bio IS NOT NULL AND LENGTH(tutor_record.bio) >= 10 THEN 'bio' END,
          CASE WHEN tutor_record.subjects IS NOT NULL AND ARRAY_LENGTH(tutor_record.subjects, 1) > 0 THEN 'subjects' END,
          CASE WHEN tutor_record.availability IS NOT NULL AND LENGTH(tutor_record.availability) >= 5 THEN 'availability' END,
          CASE WHEN tutor_record.years_of_experience IS NOT NULL THEN 'experience' END,
          CASE WHEN tutor_record.education_level IS NOT NULL THEN 'education' END,
          CASE WHEN tutor_record.institution_name IS NOT NULL THEN 'institution' END,
          CASE WHEN tutor_record.professional_title IS NOT NULL THEN 'title' END,
          CASE WHEN tutor_record.languages_spoken IS NOT NULL AND ARRAY_LENGTH(tutor_record.languages_spoken, 1) > 0 THEN 'languages' END,
          CASE WHEN tutor_record.profile_picture_url IS NOT NULL THEN 'profile_picture' END,
          CASE WHEN tutor_record.cv_url IS NOT NULL THEN 'cv' END,
          CASE WHEN tutor_record.certificates_data IS NOT NULL AND JSONB_ARRAY_LENGTH(tutor_record.certificates_data) > 0 THEN 'certificates' END
        ),
        'total_steps', 11,
        'last_updated', NOW(),
        'basic_info_complete', CASE WHEN tutor_record.bio IS NOT NULL AND LENGTH(tutor_record.bio) >= 10 THEN true ELSE false END,
        'subjects_complete', CASE WHEN tutor_record.subjects IS NOT NULL AND ARRAY_LENGTH(tutor_record.subjects, 1) > 0 THEN true ELSE false END,
        'availability_complete', CASE WHEN tutor_record.availability IS NOT NULL AND LENGTH(tutor_record.availability) >= 5 THEN true ELSE false END,
        'education_complete', CASE WHEN tutor_record.education_level IS NOT NULL AND tutor_record.institution_name IS NOT NULL THEN true ELSE false END,
        'experience_complete', CASE WHEN tutor_record.years_of_experience IS NOT NULL THEN true ELSE false END,
        'languages_complete', CASE WHEN tutor_record.languages_spoken IS NOT NULL AND ARRAY_LENGTH(tutor_record.languages_spoken, 1) > 0 THEN true ELSE false END,
        'documents_complete', CASE WHEN tutor_record.profile_picture_url IS NOT NULL AND tutor_record.cv_url IS NOT NULL AND tutor_record.certificates_data IS NOT NULL AND JSONB_ARRAY_LENGTH(tutor_record.certificates_data) > 0 THEN true ELSE false END
      ),
      updated_at = NOW()
    WHERE id = tutor_id;
  END;
  
  RAISE NOTICE 'Profile completion updated for tutor %: %%%', tutor_id, completion_score;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PHASE 6: CREATE CERTIFICATES TABLE
-- =====================================================

-- Create table for storing tutor certificates
CREATE TABLE IF NOT EXISTS tutor_certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  filename VARCHAR(255) NOT NULL,
  size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES profiles(id),
  certificate_type VARCHAR(50) DEFAULT 'other',
  issuing_institution VARCHAR(200),
  issue_date DATE,
  expiry_date DATE,
  description TEXT,
  validation_errors TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for certificates table
CREATE INDEX IF NOT EXISTS idx_tutor_certificates_tutor_id ON tutor_certificates(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutor_certificates_verified ON tutor_certificates(verified);
CREATE INDEX IF NOT EXISTS idx_tutor_certificates_type ON tutor_certificates(certificate_type);

-- =====================================================
-- PHASE 7: CREATE STORAGE BUCKET
-- =====================================================

-- Note: Storage bucket creation should be done through Supabase dashboard
-- or using the storage API. This is just a reference comment.
-- Bucket name: 'tutor-documents'
-- Public bucket for storing profile pictures, CVs, and certificates

-- =====================================================
-- PHASE 6: CREATE VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for profile completion dashboard
CREATE OR REPLACE VIEW tutor_profile_completion_dashboard AS
SELECT 
  t.id,
  t.profile_id,
  p.full_name,
  p.email,
  t.is_verified,
  t.verification_date,
  t.profile_completion_percentage,
  t.profile_completion_step,
  t.years_of_experience,
  t.education_level,
  t.institution_name,
  t.profile_completion_submitted_at,
  t.profile_completion_data,
  t.certificates_data
FROM tutors t
JOIN profiles p ON t.profile_id = p.id
WHERE t.profile_completion_percentage < 100
ORDER BY t.profile_completion_percentage DESC, t.created_at ASC;

-- View for AI matching optimization (enhanced)
CREATE OR REPLACE VIEW verified_tutors_for_matching AS
SELECT 
  t.id,
  t.profile_id,
  p.full_name,
  t.subjects,
  t.years_of_experience,
  t.education_level,
  t.languages_spoken,
  t.specializations,
  t.availability,
  t.profile_completion_percentage,
  t.is_verified,
  t.verification_date,
  t.profile_completion_data
FROM tutors t
JOIN profiles p ON t.profile_id = p.id
WHERE t.is_verified = true 
  AND t.profile_completion_percentage >= 70
ORDER BY t.profile_completion_percentage DESC, t.verification_date DESC;

-- =====================================================
-- PHASE 7: ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN tutors.profile_completion_percentage IS 'Profile completion percentage (0-100) for progress tracking';
COMMENT ON COLUMN tutors.profile_completion_data IS 'JSONB field for tracking profile completion steps and metadata';
COMMENT ON COLUMN tutors.profile_completion_step IS 'Current step in profile completion workflow';
COMMENT ON COLUMN tutors.certificates_data IS 'JSONB array of uploaded certificates and credentials';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify the enhancement
SELECT 
  'Enhancement completed successfully!' as status,
  COUNT(*) as total_tutors,
  COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_tutors,
  COUNT(CASE WHEN is_verified = false THEN 1 END) as pending_tutors,
  AVG(profile_completion_percentage) as avg_completion_percentage,
  COUNT(CASE WHEN profile_completion_percentage >= 70 THEN 1 END) as ready_for_verification
FROM tutors;
