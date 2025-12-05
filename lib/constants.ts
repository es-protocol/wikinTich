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
  CLEANUP_ERROR: 'Failed to clean up expired data'
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
  TUTORS: 'tutors',
  TUTOR_QUALIFICATIONS: 'tutor_qualifications',
  PENDING_REGISTRATIONS: 'pending_registrations',
  FAILED_LOGIN_ATTEMPTS: 'failed_login_attempts'
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
  DASHBOARD_PARENT: '/dashboard-with-children',
  DASHBOARD_TUTOR: '/tutor-dashboard',
  DASHBOARD_SCHOOL_ADMIN: '/school-admin-dashboard',
  DASHBOARD_SUPER_ADMIN: '/super-admin-dashboard'
} as const
