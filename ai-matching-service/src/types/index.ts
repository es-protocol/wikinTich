// Core types for AI matching service based on Tutor-Link database schema

export interface TutorRequest {
  id: string
  parent_id: string
  student_name: string
  student_age?: number
  grade_level: string
  subjects: string
  preferred_schedule?: string
  location: string
  additional_requirements?: string
  status: 'pending' | 'matched' | 'in_progress' | 'completed' | 'cancelled'
  matched_tutor_id?: string
  matched_at?: string
  created_at: string
  updated_at: string
  student_id?: string
  accepted_proposal_id?: string
}

export interface Tutor {
  id: string
  profile_id?: string
  bio?: string
  subjects: string[]
  availability?: any
  is_verified: boolean
  verification_date?: string
  phone?: string
  email?: string
  created_at: string
  updated_at: string
  total_hours?: number
  average_rating?: number
  overall_attendance_rate?: number
  active_institution_assignments?: number
  active_home_assignments?: number
}

export interface TutorProfile {
  id: string
  full_name?: string
  avatar_url?: string
  phone?: string
  email?: string
  role: string
  created_at: string
  updated_at: string
  email_verified?: boolean
  email_verified_at?: string
}

export interface TutorDisplayInfo {
  id: string
  tutor_id: string
  display_name: string
  subjects_taught: string[]
  experience_years?: number
  education_level?: string
  bio_summary?: string
  availability_summary?: string
  rating?: number
  total_reviews?: number
  is_featured?: boolean
  created_at: string
  updated_at: string
}

export interface TutorQualification {
  id: string
  tutor_id: string
  qualification_type: 'degree' | 'certificate' | 'diploma' | 'experience'
  title: string
  institution?: string
  year_obtained?: number
  document_url?: string
  is_verified: boolean
  verified_at?: string
  verified_by?: string
  created_at: string
  updated_at: string
}

export interface TutorReview {
  id: string
  tutor_id: string
  parent_id: string
  student_id: string
  rating: number
  review_text?: string
  session_date?: string
  created_at: string
  updated_at: string
}

export interface MatchingRequest {
  requestId: string
  subjects: string[]
  gradeLevel: string
  location: string
  schedule?: string
  additionalRequirements?: string
  studentAge?: number
}

export interface TutorRecommendation {
  tutorId: string
  tutorName: string
  compatibilityScore: number
  reasoning: string[]
  availability: string[]
  hourlyRate?: number
  rating?: number
  subjects: string[]
  experience?: number
  education?: string
  verified: boolean
  totalReviews?: number
}

export interface MatchingResult {
  requestId: string
  recommendations: TutorRecommendation[]
  totalTutorsConsidered: number
  matchingTimestamp: string
  algorithmVersion: string
}

export interface MatchingCriteria {
  subjectMatch: number
  locationProximity: number
  availabilityAlignment: number
  ratingCompatibility: number
  experienceLevel: number
  verificationStatus: number
}
