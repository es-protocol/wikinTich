// Enhanced Tutor Types - Builds on existing is_verified system
// Extends verification workflow without replacing it

export interface ProfileCompletionData {
  steps_completed: string[];
  total_steps: number;
  last_updated: string;
  current_step: string;
  next_step?: string;
  basic_info_complete: boolean;
  subjects_complete: boolean;
  availability_complete: boolean;
  education_complete: boolean;
  experience_complete: boolean;
  languages_complete: boolean;
  documents_complete: boolean;
  completion_requirements: {
    [key: string]: {
      required: boolean;
      completed: boolean;
      points: number;
    };
  };
}

export interface CertificateData {
  id: string;
  url: string;
  filename: string;
  size: number;
  mime_type: string;
  uploaded_at: string;
  verified: boolean;
  certificate_type: 'academic' | 'professional' | 'teaching' | 'other';
  issuing_institution: string;
  issue_date: string;
  expiry_date?: string;
  description?: string;
  validation_errors?: string[];
}

export interface FileMetadata {
  profile_picture?: {
    url: string;
    filename: string;
    size: number;
    mime_type: string;
    uploaded_at: string;
    verified: boolean;
    validation_errors?: string[];
  };
  cv?: {
    url: string;
    filename: string;
    size: number;
    mime_type: string;
    uploaded_at: string;
    verified: boolean;
    validation_errors?: string[];
  };
  id_document?: {
    url: string;
    filename: string;
    size: number;
    mime_type: string;
    uploaded_at: string;
    verified: boolean;
    validation_errors?: string[];
  };
}

// Enhanced Tutor interface - extends existing structure
export interface EnhancedTutor {
  // Existing fields (keep as is)
  id: string;
  profile_id: string;
  bio: string;
  subjects: string[];
  availability: any;
  is_verified: boolean;                    // Keep existing field
  verification_date: string | null;        // Keep existing field
  created_at: string;
  updated_at: string;

  // New profile completion fields
  profile_completion_percentage: number;
  profile_completion_data: ProfileCompletionData;
  profile_completion_step: 'basic_info' | 'subjects' | 'availability' | 'education' | 'experience' | 'languages' | 'documents' | 'complete';
  profile_completion_submitted_at?: string;
  profile_completion_reviewed_at?: string;

  // File storage fields
  profile_picture_url?: string;
  cv_url?: string;
  certificates_data: CertificateData[];

  // Enhanced profile fields
  years_of_experience?: number;
  education_level?: string;
  institution_name?: string;
  graduation_year?: number;
  professional_title?: string;
  languages_spoken?: string[];
  specializations?: string[];
}

// Profile completion step interface
export interface TutorVerificationStep {
  id: string;
  name: string;
  description: string;
  required: boolean;
  completed: boolean;
  points: number;
  validation_rules?: {
    min_length?: number;
    max_length?: number;
    allowed_types?: string[];
    max_size?: number;
    required_fields?: string[];
  };
}

// Verification workflow interface
export interface VerificationWorkflow {
  current_step: string;
  total_steps: number;
  steps: TutorVerificationStep[];
  progress_percentage: number;
  can_submit: boolean;
  next_step?: string;
  previous_step?: string;
}

// Admin verification review interface
export interface AdminVerificationReview {
  tutor_id: string;
  tutor_name: string;
  tutor_email: string;
  is_verified: boolean;                    // Use existing field
  verification_date?: string;              // Use existing field
  profile_completion_percentage: number;
  profile_completion_submitted_at?: string;
  documents_reviewed: boolean;
  profile_reviewed: boolean;
  overall_assessment: 'excellent' | 'good' | 'fair' | 'poor';
  review_notes?: string;
  action_required: 'approve' | 'reject' | 'request_changes' | 'none';
}

// File upload result interface
export interface FileUploadResult {
  success: boolean;
  url?: string;
  filename?: string;
  error?: string;
  validation_errors?: string[];
  file_size: number;
  mime_type: string;
}

// Profile completion submission interface
export interface ProfileCompletionSubmission {
  tutor_id: string;
  profile_completion_data: ProfileCompletionData;
  certificates_data: CertificateData[];
  submitted_at: string;
  self_assessment_score: number;
  ready_for_review: boolean;
}

// Constants for verification workflow
export const VERIFICATION_STEPS: TutorVerificationStep[] = [
  {
    id: 'basic_info',
    name: 'Basic Information',
    description: 'Complete your basic profile information',
    required: true,
    completed: false,
    points: 15,
    validation_rules: {
      min_length: 10,
      required_fields: ['bio']
    }
  },
  {
    id: 'subjects',
    name: 'Subjects & Specializations',
    description: 'Add subjects you can teach and your specializations',
    required: true,
    completed: false,
    points: 15,
    validation_rules: {
      required_fields: ['subjects']
    }
  },
  {
    id: 'availability',
    name: 'Availability Schedule',
    description: 'Set your teaching availability',
    required: true,
    completed: false,
    points: 10,
    validation_rules: {
      required_fields: ['availability']
    }
  },
  {
    id: 'education',
    name: 'Education & Experience',
    description: 'Add your educational background and teaching experience',
    required: true,
    completed: false,
    points: 15,
    validation_rules: {
      required_fields: ['education_level', 'institution_name', 'years_of_experience']
    }
  },
  {
    id: 'languages',
    name: 'Languages & Skills',
    description: 'Add languages you speak and professional skills',
    required: false,
    completed: false,
    points: 10,
    validation_rules: {
      required_fields: ['languages_spoken']
    }
  },
  {
    id: 'documents',
    name: 'Documents & Credentials',
    description: 'Upload profile picture, CV, and certificates',
    required: true,
    completed: false,
    points: 35,
    validation_rules: {
      allowed_types: ['image/jpeg', 'image/png', 'application/pdf', 'application/msword'],
      max_size: 20 * 1024 * 1024 // 20MB
    }
  }
];

// Profile completion step constants
export const PROFILE_COMPLETION_STEPS = {
  BASIC_INFO: 'basic_info',
  SUBJECTS: 'subjects',
  AVAILABILITY: 'availability',
  EDUCATION: 'education',
  EXPERIENCE: 'experience',
  LANGUAGES: 'languages',
  DOCUMENTS: 'documents',
  COMPLETE: 'complete'
} as const;

// Profile completion step labels
export const PROFILE_COMPLETION_STEP_LABELS = {
  [PROFILE_COMPLETION_STEPS.BASIC_INFO]: 'Basic Information',
  [PROFILE_COMPLETION_STEPS.SUBJECTS]: 'Subjects & Specializations',
  [PROFILE_COMPLETION_STEPS.AVAILABILITY]: 'Availability Schedule',
  [PROFILE_COMPLETION_STEPS.EDUCATION]: 'Education & Experience',
  [PROFILE_COMPLETION_STEPS.EXPERIENCE]: 'Professional Experience',
  [PROFILE_COMPLETION_STEPS.LANGUAGES]: 'Languages & Skills',
  [PROFILE_COMPLETION_STEPS.DOCUMENTS]: 'Documents & Credentials',
  [PROFILE_COMPLETION_STEPS.COMPLETE]: 'Profile Complete'
} as const;

// Profile completion step descriptions
export const PROFILE_COMPLETION_STEP_DESCRIPTIONS = {
  [PROFILE_COMPLETION_STEPS.BASIC_INFO]: 'Tell us about yourself and your teaching philosophy',
  [PROFILE_COMPLETION_STEPS.SUBJECTS]: 'What subjects can you teach? Add your specializations',
  [PROFILE_COMPLETION_STEPS.AVAILABILITY]: 'When are you available for tutoring sessions?',
  [PROFILE_COMPLETION_STEPS.EDUCATION]: 'Share your educational background and qualifications',
  [PROFILE_COMPLETION_STEPS.EXPERIENCE]: 'How many years of teaching experience do you have?',
  [PROFILE_COMPLETION_STEPS.LANGUAGES]: 'What languages do you speak? Any special skills?',
  [PROFILE_COMPLETION_STEPS.DOCUMENTS]: 'Upload your profile picture, CV, and certificates',
  [PROFILE_COMPLETION_STEPS.COMPLETE]: 'Your profile is complete and ready for review!'
} as const;

// File upload constants
export const FILE_UPLOAD_LIMITS = {
  PROFILE_PICTURE: {
    max_size: 5 * 1024 * 1024, // 5MB
    allowed_types: ['image/jpeg', 'image/png'],
    description: 'Professional profile picture (JPG, PNG)'
  },
  CV: {
    max_size: 10 * 1024 * 1024, // 10MB
    allowed_types: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    description: 'Curriculum Vitae or Resume (PDF, DOC, DOCX)'
  },
  CERTIFICATES: {
    max_size: 20 * 1024 * 1024, // 20MB
    allowed_types: ['application/pdf', 'image/jpeg', 'image/png'],
    description: 'Certificates and credentials (PDF, JPG, PNG)'
  }
} as const;

// Profile completion scoring
export const PROFILE_COMPLETION_SCORING = {
  BASIC_INFO: 15,
  SUBJECTS: 15,
  AVAILABILITY: 10,
  EDUCATION: 5,
  EXPERIENCE: 5,
  INSTITUTION: 5,
  TITLE: 5,
  LANGUAGES: 5,
  PROFILE_PICTURE: 15,
  CV: 15,
  CERTIFICATES: 15
} as const;
