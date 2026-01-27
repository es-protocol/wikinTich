// Application constants
export const APP_NAME = 'Tutor Link'

// Time constants (in milliseconds)
export const TIME_CONSTANTS = {
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  MINUTE: 60 * 1000,
  SECOND: 1000
} as const

// Registration constants
export const REGISTRATION_CONSTANTS = {
  EXPIRATION_HOURS: 24,
  EXPIRATION_MS: 24 * TIME_CONSTANTS.HOUR,
  MAX_ATTEMPTS: 5, // Match server-side rate limiting (5 requests per 15 minutes)
  RATE_LIMIT_WINDOW_MS: 15 * TIME_CONSTANTS.MINUTE // 15 minutes
} as const

// Account lockout constants
export const LOCKOUT_CONSTANTS = {
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15,
  LOCKOUT_DURATION_MS: 15 * TIME_CONSTANTS.MINUTE,
  CLEANUP_HOURS: 24
} as const

// Password constants
export const PASSWORD_CONSTANTS = {
  MIN_LENGTH: 8,
  SALT_ROUNDS: 12
} as const

// Input validation constants
export const VALIDATION_CONSTANTS = {
  MAX_EMAIL_LENGTH: 254,
  MAX_INPUT_LENGTH: 1000,
  MAX_PHONE_LENGTH: 15
} as const

// Supported countries for phone numbers
export const COUNTRY_CODES = {
  SIERRA_LEONE: {
    name: 'Sierra Leone',
    code: '+232',
    flag: '🇸🇱',
    minDigits: 8,
    maxDigits: 10,
    format: '+232 XX XXX XXXX'
  },
  LIBERIA: {
    name: 'Liberia',
    code: '+231',
    flag: '🇱🇷',
    minDigits: 7,
    maxDigits: 9,
    format: '+231 XX XXX XXX'
  },
  THE_GAMBIA: {
    name: 'The Gambia',
    code: '+220',
    flag: '🇬🇲',
    minDigits: 7,
    maxDigits: 7,
    format: '+220 XXX XXXX'
  }
} as const

// Array of supported countries for dropdowns
export const SUPPORTED_COUNTRIES = [
  COUNTRY_CODES.SIERRA_LEONE,
  COUNTRY_CODES.LIBERIA,
  COUNTRY_CODES.THE_GAMBIA
] as const

// Rate limiting constants
export const RATE_LIMIT_CONSTANTS = {
  DEFAULT_MAX_REQUESTS: 5,
  DEFAULT_WINDOW_MS: 15 * TIME_CONSTANTS.MINUTE,
  OTP_MAX_REQUESTS: 3,
  RESEND_MAX_ATTEMPTS: 3
} as const

// UI constants
export const UI_CONSTANTS = {
  REDIRECT_DELAY_MS: 2000,
  SUCCESS_DISPLAY_MS: 3000,
  RESET_DELAY_MS: 5000
} as const

// Error messages
export const ERROR_MESSAGES = {
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  INVALID_JSON: 'Invalid JSON payload',
  INVALID_FORM_DATA: 'Invalid form data',
  BAD_CSRF: 'Invalid or missing CSRF token',
  SERVER_MISCONFIGURED: 'Server is misconfigured',
  INTERNAL_SERVER_ERROR: 'internal_server_error',
  FORBIDDEN: 'forbidden',
  OTP_ERROR: 'otp_error',
  STORAGE_ERROR_CODE: 'storage_error',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait 15 minutes before trying again.',
  RESEND_RATE_LIMIT: 'Too many resend attempts. Please wait 15 minutes.',
  MAX_RESEND_ATTEMPTS: 'Maximum resend attempts reached. Please contact support.',
  ACCOUNT_LOCKED: 'Account is temporarily locked due to too many failed attempts. Please try again in {minutes} minutes.',
  INVALID_CREDENTIALS: 'Invalid email or password. Please check your credentials.',
  PROFILE_NOT_FOUND: 'User profile not found. Please contact support.',
  REGISTRATION_DATA_NOT_FOUND: 'Registration data not found. Please start over.',
  VERIFICATION_FAILED: 'Verification failed. Please try again.',
  UNEXPECTED_ERROR: 'An unexpected error occurred. Please try again.',
  PASSWORD_MISMATCH: 'Passwords do not match',
  STORAGE_ERROR: 'Failed to store registration data',
  CLEANUP_ERROR: 'Failed to clean up expired data',
  // Account creation errors
  EMAIL_PASSWORD_REQUIRED: 'Email and password are required',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  ACCOUNT_ALREADY_EXISTS: 'An account with this email already exists. Please sign in instead.',
  ACCOUNT_STATUS_VERIFICATION_FAILED: 'Failed to verify account status. Please try again.',
  ACCOUNT_CREATION_FAILED: 'Failed to create account: No data returned from database',
  PROFILE_CREATION_FAILED: 'Profile creation failed',
  TUTOR_CREATION_FAILED: 'Tutor creation failed',
  QUALIFICATION_CREATION_FAILED: 'Qualification creation failed',
  STUDENT_CREATION_FAILED: 'Student creation failed',
  // Password reset errors
  INVALID_SESSION: 'Invalid or expired session. Please reset your password again.',
  EMAIL_FROM_TOKEN_FAILED: 'Could not determine user email from session token.',
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_UPDATE_FAILED: 'Failed to update password. Please try again.',
  USER_ACCOUNT_NOT_FOUND: 'User account not found. Please contact support.',
  // General errors
  INTERNAL_SERVER_ERROR_MESSAGE: 'Internal server error'
} as const

// Database error codes
export const DB_ERROR_CODES = {
  NO_ROWS_FOUND: 'PGRST116', // Supabase/PostgREST "no rows returned" error
  DUPLICATE_KEY: '23505', // PostgreSQL unique constraint violation
} as const

// Success messages
export const SUCCESS_MESSAGES = {
  OTP_SENT: 'Verification email sent successfully! Check your inbox and spam folder.',
  ACCOUNT_CREATED: 'Account setup complete! Redirecting to login...',
  EMAIL_VERIFIED: 'Email verified successfully! Redirecting to set up your password...',
  PASSWORD_SET: 'Password set successfully! Redirecting to login...',
  LOGIN_SUCCESS: 'Login successful! Redirecting to dashboard...'
} as const

// User roles
export const USER_ROLES = {
  PARENT: 'parent',
  TUTOR: 'tutor',
  SCHOOL_ADMIN: 'school_admin',
  SUPER_ADMIN: 'super_admin'
} as const

// Registration types
export const REGISTRATION_TYPES = {
  PARENT: 'parent',
  TUTOR: 'tutor'
} as const

// Form field names
export const FORM_FIELDS = {
  PARENT_NAME: 'parentName',
  PARENT_PHONE: 'parentPhone',
  PARENT_EMAIL: 'parentEmail',
  STUDENT_NAME: 'studentName',
  STUDENT_AGE: 'studentAge',
  GRADE_LEVEL: 'gradeLevel',
  SUBJECTS: 'subjects',
  PREFERRED_SCHEDULE: 'preferredSchedule',
  LOCATION: 'location',
  ADDITIONAL_REQUIREMENTS: 'additionalRequirements',
  PASSWORD: 'password',
  CONFIRM_PASSWORD: 'confirmPassword',
  EMAIL: 'email',
  ROLE: 'role'
} as const

// Local storage keys
export const STORAGE_KEYS = {
  USER: 'wikinTichUser',
  USER_ROLE: 'wikinTichUserRole',
  PENDING_PARENT_DATA: 'pendingParentData',
  PENDING_TUTOR_DATA: 'pendingTutorData'
} as const

// Database table names
export const DB_TABLES = {
  AUTH_USERS: 'auth_users',
  PROFILES: 'profiles',
  STUDENTS: 'students',
  HOME_TUTORING_REQUESTS: 'home_tutoring_requests',
  HOME_TUTORING_SESSIONS: 'home_tutoring_sessions',
  HOME_TUTORING_PAYMENTS: 'home_tutoring_payments',
  TUTORS: 'tutors',
  TUTOR_QUALIFICATIONS: 'tutor_qualifications',
  TUTOR_STUDENT_MATCHES: 'tutor_student_matches',
  PENDING_REGISTRATIONS: 'pending_registrations',
  FAILED_LOGIN_ATTEMPTS: 'failed_login_attempts',
  ADMIN_NOTIFICATIONS: 'admin_notifications',
  PARENT_NOTIFICATIONS: 'parent_notifications',
  TUTOR_NOTIFICATIONS: 'tutor_notifications',
} as const

// Route paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  HOME_TUTORING: '/home-tutoring',
  APPLY_TUTOR: '/apply-tutor',
  APPLY_TUTOR_SUCCESS: '/apply-tutor/success',
  VERIFY_EMAIL: '/verify-email',
  SET_PASSWORD: '/set-password',
  AUTH_CALLBACK: '/auth/callback',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD_PARENT: '/dashboard-with-children',
  DASHBOARD_TUTOR: '/tutor-dashboard',
  DASHBOARD_SCHOOL_ADMIN: '/school-admin-dashboard',
  DASHBOARD_SUPER_ADMIN: '/super-admin-dashboard'
} as const

// Admin notification types
export const ADMIN_NOTIFICATION_TYPES = {
  NEW_REQUEST: 'new_request',
  TUTOR_ASSIGNED: 'tutor_assigned',
  REQUEST_UPDATED: 'request_updated',
  REQUEST_CANCELLED: 'request_cancelled',
  SYSTEM: 'system',
  WHATSAPP_REQUEST: 'whatsapp_request',
} as const

// Related entity types for notifications
export const RELATED_ENTITY_TYPES = {
  HOME_TUTORING_REQUEST: 'home_tutoring_request',
  PENDING_REGISTRATION: 'pending_registration',
  TUTOR: 'tutor',
  PARENT: 'parent',
  SYSTEM: 'system',
} as const

// Admin dashboard sections
export const ADMIN_DASHBOARD_SECTIONS = {
  OVERVIEW: 'overview',
  TUTORS: 'tutors',
  REQUESTS: 'requests',
  PENDING_REGISTRATIONS: 'pending-registrations',
  STUDENTS: 'students',
  SESSIONS: 'sessions',
  PAYMENTS: 'payments',
} as const

// Notification polling interval (in milliseconds)
export const NOTIFICATION_POLLING_INTERVAL_MS = 30 * TIME_CONSTANTS.SECOND

// Admin API endpoints
export const ADMIN_API_ENDPOINTS = {
  STATS: '/api/admin/stats',
  NOTIFICATIONS: '/api/admin/notifications',
  PENDING_REGISTRATIONS: '/api/admin/pending-registrations',
  REQUESTS: '/api/admin/requests',
  TUTORS: '/api/admin/tutors',
  TUTORS_AVAILABLE: '/api/admin/tutors/available',
  STUDENTS: '/api/admin/students',
  MATCH: '/api/admin/match',
} as const

// Tutor API endpoints
export const TUTOR_API_ENDPOINTS = {
  NOTIFICATIONS: '/api/tutor/notifications',
  MATCHED_STUDENTS: '/api/tutor/matched-students',
} as const

// Parent API endpoints
export const PARENT_API_ENDPOINTS = {
  MATCHED_TUTOR: '/api/parent/matched-tutor',
} as const

// Available subjects for tutoring
export const AVAILABLE_SUBJECTS = [
  'Biology',
  'Business Management',
  'Business Studies',
  'Chemistry',
  'Christian Religious Knowledge',
  'Core Science',
  'Cost Accounting',
  'Creative Practical Arts',
  'Economics',
  'ESP&S/English Language/Language Arts',
  'Financial Accounting',
  'Further Mathematics',
  'General Science/Integrated Science',
  'Geography',
  'Government',
  'History',
  'Literature',
  'Mathematics',
  'Physical & Health Education',
  'Physics',
  'Quantitative Analysis',
  'Religious & Moral Education',
  'Social Studies',
  'Verbal Reasoning'
] as const